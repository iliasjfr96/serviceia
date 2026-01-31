import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCallFromWebhook, updateCallStatus } from "@/lib/dal/calls";
import { createProspect, addNote } from "@/lib/dal/prospects";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import crypto from "crypto";

// Verify ElevenLabs webhook signature (HMAC-SHA256)
// ElevenLabs signature format: "t=timestamp,v0=signature"
// Signature is HMAC-SHA256 of "timestamp.payload"
function verifyWebhookSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string | undefined
): boolean {
  // Skip verification if no secret configured
  if (!secret) {
    console.log("[ElevenLabs Webhook] No secret configured, skipping verification");
    return true;
  }

  if (!signatureHeader) {
    console.log("[ElevenLabs Webhook] No signature header");
    return false;
  }

  // Parse signature header: "t=timestamp,v0=signature"
  const parts = signatureHeader.split(",");
  let timestamp: string | undefined;
  let signature: string | undefined;

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    if (key === "v0") signature = value;
  }

  if (!timestamp || !signature) {
    console.log("[ElevenLabs Webhook] Invalid signature format");
    return false;
  }

  // ElevenLabs computes signature as HMAC-SHA256 of "timestamp.payload"
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
    if (!isValid) {
      console.log("[ElevenLabs Webhook] Signature mismatch");
    }
    return isValid;
  } catch (e) {
    console.log("[ElevenLabs Webhook] Signature comparison error:", e);
    return false;
  }
}

// ElevenLabs Conversational AI webhook
export async function POST(request: NextRequest) {
  // Rate limiting for webhooks
  const rateLimitError = await enforceRateLimit(request, RATE_LIMITS.webhook);
  if (rateLimitError) return rateLimitError;

  try {
    const rawBody = await request.text();
    // ElevenLabs sends signature in "Elevenlabs-Signature" header (case-insensitive)
    const signature = request.headers.get("elevenlabs-signature");
    const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;

    // Verify signature in production
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error("[ElevenLabs Webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody);
    const type = body.type as string;

    // ElevenLabs wraps data in a "data" object for some event types
    const data = body.data || body;

    console.log("[ElevenLabs Webhook] Received event type:", type);

    switch (type) {
      case "conversation_initiation_client_data":
        return handleInitiation(data);
      case "post_call":
      case "post_call_audio":
      case "post_call_transcript":
      case "post_call_transcription":
        return handlePostCall(data, body);
      case "ping":
        return NextResponse.json({ pong: true });
      default:
        console.log("[ElevenLabs Webhook] Unknown event type:", type);
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error("[ElevenLabs Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleInitiation(body: Record<string, unknown>) {
  const conversationId = body.conversation_id as string;
  const agentId = body.agent_id as string;

  if (!conversationId) {
    return NextResponse.json({ received: true });
  }

  // Find tenant by ElevenLabs agent ID stored in agent config
  const agentConfig = await prisma.agentConfig.findFirst({
    where: { elevenLabsAgentId: agentId },
    select: { tenantId: true },
  });

  if (!agentConfig) {
    // Fallback: find first tenant
    const tenant = await prisma.tenant.findFirst({
      select: { id: true },
    });
    if (!tenant) return NextResponse.json({ received: true });

    await createCallFromWebhook(tenant.id, {
      vapiCallId: conversationId,
      direction: "INBOUND",
      status: "IN_PROGRESS",
    });
  } else {
    await createCallFromWebhook(agentConfig.tenantId, {
      vapiCallId: conversationId,
      direction: "INBOUND",
      status: "IN_PROGRESS",
    });
  }

  return NextResponse.json({ received: true });
}

async function handlePostCall(data: Record<string, unknown>, _fullBody: Record<string, unknown>) {
  const conversationId = data.conversation_id as string;
  if (!conversationId) {
    console.log("[ElevenLabs Webhook] No conversation_id in payload");
    return NextResponse.json({ received: true });
  }

  console.log("[ElevenLabs Webhook] Processing post_call for conversation:", conversationId);

  // Find existing call by conversation ID (stored in vapiCallId field)
  let existingCall = await prisma.call.findUnique({
    where: { vapiCallId: conversationId },
    select: { id: true, tenantId: true, prospectId: true },
  });

  // If call doesn't exist yet, create it
  if (!existingCall) {
    const agentId = data.agent_id as string;
    const agentConfig = await prisma.agentConfig.findFirst({
      where: agentId ? { elevenLabsAgentId: agentId } : {},
      select: { tenantId: true },
    });

    const tenantId =
      agentConfig?.tenantId ??
      (await prisma.tenant.findFirst({ select: { id: true } }))?.id;

    if (!tenantId) return NextResponse.json({ received: true });

    const created = await createCallFromWebhook(tenantId, {
      vapiCallId: conversationId,
      direction: "INBOUND",
      status: "COMPLETED",
    });
    existingCall = {
      id: created.id,
      tenantId: created.tenantId,
      prospectId: created.prospectId,
    };
  }

  // Extract transcript (can be in different locations depending on event type)
  const transcript = (data.transcript || data.conversation_transcript) as Array<{
    role: string;
    message: string;
    timestamp?: number;
  }> | undefined;

  const transcriptText = transcript
    ?.map((t) => `${t.role === "agent" ? "Agent" : "Client"}: ${t.message}`)
    .join("\n") || "";

  // Extract analysis (can be in data or in separate analysis object)
  const analysis = (data.analysis || data.call_analysis) as Record<string, unknown> | undefined;
  // ElevenLabs uses transcript_summary or call_summary_title
  const summary = (analysis?.transcript_summary as string) || (analysis?.call_summary_title as string) || (analysis?.summary as string) || (data.summary as string) || undefined;
  // ElevenLabs uses data_collection_results
  const dataCollection = (analysis?.data_collection_results || analysis?.data_collection || data.collected_data) as Record<string, unknown> | undefined;

  // Duration (can be in different locations)
  const duration = (data.conversation_duration_seconds || data.call_duration_secs || data.duration_seconds) as number | undefined;

  console.log("[ElevenLabs Webhook] Extracted - transcript length:", transcriptText.length, "summary:", !!summary, "duration:", duration);

  // Detect emergency from transcript
  let isEmergency = false;
  let emergencyType: string | undefined;
  const emergencyKeywords = [
    "violence", "frappe", "battu", "menace", "danger",
    "urgence", "garde a vue", "agression", "suicide",
    "harcelement", "viol",
  ];

  if (transcriptText) {
    const lowerTranscript = transcriptText.toLowerCase();
    for (const kw of emergencyKeywords) {
      if (lowerTranscript.includes(kw)) {
        isEmergency = true;
        emergencyType = `keyword:${kw}`;
        break;
      }
    }
  }

  // Determine final status
  const callSuccessful = (data.call_successful ?? data.success) as boolean | undefined;
  const finalStatus = callSuccessful === false ? "FAILED" : "COMPLETED";

  // Update call record
  await updateCallStatus(conversationId, {
    status: finalStatus,
    transcriptRaw: transcriptText || undefined,
    transcriptJson: transcript as unknown,
    summary,
    summaryJson: analysis as unknown,
    duration: duration ? Math.round(duration) : undefined,
    endedAt: new Date(),
    isEmergency,
    emergencyType,
    extractedData: dataCollection as unknown,
  });

  // Extract caller info from data_collection OR parse from transcript
  if (!existingCall.prospectId) {
    let phone =
      (dataCollection?.phone as string) ||
      (dataCollection?.telephone as string) ||
      (dataCollection?.numero as string);
    let firstName =
      (dataCollection?.first_name as string) ||
      (dataCollection?.prenom as string);
    let lastName =
      (dataCollection?.last_name as string) ||
      (dataCollection?.nom as string);
    let email = dataCollection?.email as string;

    // If no data from data_collection, try to parse from transcript (CLIENT lines only)
    if (!phone && !firstName && !lastName && !email && transcriptText) {
      // Extract only client lines for parsing (avoid extracting agent's words)
      const clientLines = transcriptText
        .split('\n')
        .filter(line => line.startsWith('Client:'))
        .map(line => line.replace('Client:', '').trim())
        .join(' ');

      console.log("[ElevenLabs Webhook] Client speech:", clientLines.substring(0, 200));

      // Extract phone number (French/Belgian formats: 0X XX XX XX XX)
      const phoneMatch = clientLines.match(/(?:0[1-9]|\+33|\+32)[\s.-]?(?:\d[\s.-]?){8,9}/);
      if (phoneMatch) {
        phone = phoneMatch[0].replace(/[\s.-]/g, '');
      }

      // Extract email (standard format)
      const emailMatch = clientLines.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        email = emailMatch[0];
      }

      // Try to extract name from common patterns in French
      // Pattern: "c'est [Name] [LastName]" or "je m'appelle [Name]" etc.
      const namePatterns = [
        /(?:c'est|je suis|je m'appelle|mon nom est|mon nom c'est)\s+([A-ZÀ-Üa-zà-ü]+(?:\s+[A-ZÀ-Üa-zà-ü]+)?)/i,
        /(?:au nom de|pour)\s+([A-ZÀ-Üa-zà-ü]+(?:\s+[A-ZÀ-Üa-zà-ü]+)?)/i,
      ];
      for (const pattern of namePatterns) {
        const nameMatch = clientLines.match(pattern);
        if (nameMatch) {
          const nameParts = nameMatch[1].trim().split(/\s+/);
          if (nameParts.length >= 2) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
          } else {
            firstName = nameParts[0];
          }
          break;
        }
      }

      console.log("[ElevenLabs Webhook] Parsed from transcript - phone:", phone, "email:", email, "name:", firstName, lastName);
    }

    if (phone || firstName || lastName || email) {
      // Check if prospect exists by phone
      let prospectId: string | undefined;

      if (phone) {
        const existing = await prisma.prospect.findFirst({
          where: {
            tenantId: existingCall.tenantId,
            isActive: true,
            OR: [{ phone }, { alternatePhone: phone }],
          },
          select: { id: true },
        });
        if (existing) prospectId = existing.id;
      }

      if (!prospectId) {
        const newProspect = await createProspect(existingCall.tenantId, {
          phone: phone || undefined,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          email: email || undefined,
          source: "CALL_AI",
        });
        prospectId = newProspect.id;
      }

      // Link call to prospect
      await prisma.call.update({
        where: { id: existingCall.id },
        data: { prospectId },
      });

      // Add AI summary as note
      if (summary) {
        await addNote(
          existingCall.tenantId,
          prospectId,
          null,
          `Resume IA de l'appel:\n${summary}`,
          "AI_SUMMARY"
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
