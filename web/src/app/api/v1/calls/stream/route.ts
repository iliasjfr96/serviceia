import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { resolveTenantId } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";
import { CallStatus, Prisma } from "@prisma/client";

// SSE endpoint for real-time call updates
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const tenantId = await resolveTenantId(
    session.user.tenantId,
    session.user.role
  );
  if (!tenantId) {
    return new Response("Tenant not found", { status: 404 });
  }

  const callId = request.nextUrl.searchParams.get("callId");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Initial connection
      sendEvent({ type: "connected", timestamp: Date.now() });

      // Poll for updates (in production, use Redis pub/sub or similar)
      let lastUpdate = Date.now();
      const interval = setInterval(async () => {
        try {
          // Get active calls or specific call
          const where: Prisma.CallWhereInput = callId
            ? { id: callId, tenantId }
            : { tenantId, status: CallStatus.IN_PROGRESS };

          const calls = await prisma.call.findMany({
            where,
            select: {
              id: true,
              status: true,
              transcriptRaw: true,
              transcriptJson: true,
              duration: true,
              isEmergency: true,
              emergencyType: true,
              updatedAt: true,
              startedAt: true,
              callerNumber: true,
              prospect: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: callId ? 1 : 10,
          });

          // Check for updates
          const hasUpdates = calls.some(
            (call) => new Date(call.updatedAt).getTime() > lastUpdate
          );

          if (hasUpdates || calls.length > 0) {
            sendEvent({
              type: "calls",
              calls: calls.map((call) => ({
                ...call,
                transcriptJson: undefined, // Don't send full JSON to reduce bandwidth
              })),
              timestamp: Date.now(),
            });
            lastUpdate = Date.now();
          }

          // Check if call ended
          if (callId && calls.length > 0 && calls[0].status !== CallStatus.IN_PROGRESS) {
            sendEvent({ type: "call_ended", callId, status: calls[0].status });
            clearInterval(interval);
            controller.close();
          }
        } catch (error) {
          console.error("[SSE] Error fetching calls:", error);
          sendEvent({ type: "error", message: "Failed to fetch updates" });
        }
      }, 2000); // Poll every 2 seconds

      // Clean up on disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
