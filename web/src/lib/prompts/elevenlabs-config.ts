/**
 * Configuration ElevenLabs Conversational AI
 * ServiceIA - Generation de la configuration complete pour l'agent vocal
 */

import {
  generateSystemPrompt,
  EMERGENCY_KEYWORDS,
  CONSENT_MESSAGES,
  PRACTICE_AREA_SCRIPTS,
  type AgentContext,
} from "./agent-system-prompt";

/**
 * Configuration complete pour ElevenLabs Conversational AI
 */
export interface ElevenLabsAgentConfig {
  agent: {
    name: string;
    first_message: string;
    system_prompt: string;
    language: string;
    supported_languages: string[];
  };
  voice: {
    voice_id: string;
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
  conversation: {
    max_duration_seconds: number;
    silence_timeout_seconds: number;
    end_call_after_silence: boolean;
    transcribe: boolean;
  };
  moderation: {
    emergency_keywords: string[];
    blocked_topics: string[];
    require_consent: boolean;
  };
  tools: ElevenLabsTool[];
}

export interface ElevenLabsTool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

/**
 * Voix recommandees pour un cabinet d'avocats (francais)
 */
export const RECOMMENDED_VOICES = {
  sophie: {
    id: "EXAVITQu4vr4xnSDxMaL", // Sarah - Voix feminine douce
    name: "Sophie",
    description: "Voix feminine, chaleureuse et professionnelle",
    style: 0.3,
    stability: 0.7,
  },
  claire: {
    id: "21m00Tcm4TlvDq8ikWAM", // Rachel
    name: "Claire",
    description: "Voix feminine, posee et rassurante",
    style: 0.2,
    stability: 0.75,
  },
  antoine: {
    id: "VR6AewLTigWG4xSOukaG", // Arnold
    name: "Antoine",
    description: "Voix masculine, calme et autoritaire",
    style: 0.25,
    stability: 0.7,
  },
  marc: {
    id: "pNInz6obpgDQGcFmaJgB", // Adam
    name: "Marc",
    description: "Voix masculine, chaleureuse et accessible",
    style: 0.3,
    stability: 0.65,
  },
};

/**
 * Outils disponibles pour l'agent
 */
export const AGENT_TOOLS: ElevenLabsTool[] = [
  {
    name: "book_appointment",
    description: "Reserve un rendez-vous pour l'appelant avec un avocat du cabinet",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date du RDV au format YYYY-MM-DD",
        },
        time: {
          type: "string",
          description: "Heure du RDV au format HH:MM",
        },
        duration_minutes: {
          type: "number",
          description: "Duree du RDV en minutes (30, 45, 60)",
        },
        consultation_type: {
          type: "string",
          description: "Type de consultation",
          enum: ["premiere_consultation", "suivi", "urgence"],
        },
        client_name: {
          type: "string",
          description: "Nom complet du client",
        },
        client_phone: {
          type: "string",
          description: "Numero de telephone du client",
        },
        client_email: {
          type: "string",
          description: "Email du client (optionnel)",
        },
        notes: {
          type: "string",
          description: "Notes sur la situation du client",
        },
      },
      required: ["date", "time", "duration_minutes", "client_name", "client_phone"],
    },
  },
  {
    name: "check_availability",
    description: "Verifie les creneaux disponibles pour un rendez-vous",
    parameters: {
      type: "object",
      properties: {
        preferred_date: {
          type: "string",
          description: "Date preferee au format YYYY-MM-DD",
        },
        preferred_time: {
          type: "string",
          description: "Preference horaire: matin, apres-midi, ou heure precise",
          enum: ["matin", "apres-midi", "fin_journee", "flexible"],
        },
        duration_minutes: {
          type: "number",
          description: "Duree souhaitee en minutes",
        },
      },
      required: ["preferred_date"],
    },
  },
  {
    name: "search_knowledge_base",
    description: "Recherche dans la base de connaissances du cabinet pour repondre a une question generale",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Question ou termes de recherche",
        },
        category: {
          type: "string",
          description: "Categorie de la question",
          enum: ["tarifs", "horaires", "acces", "documents_requis", "procedures", "general"],
        },
      },
      required: ["query"],
    },
  },
  {
    name: "transfer_call",
    description: "Transfere l'appel vers un avocat en cas d'urgence",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Raison du transfert",
        },
        urgency_level: {
          type: "string",
          description: "Niveau d'urgence",
          enum: ["high", "medium", "low"],
        },
        caller_info: {
          type: "string",
          description: "Informations sur l'appelant a transmettre",
        },
      },
      required: ["reason", "urgency_level"],
    },
  },
  {
    name: "create_lead",
    description: "Enregistre un nouveau prospect avec ses informations",
    parameters: {
      type: "object",
      properties: {
        first_name: {
          type: "string",
          description: "Prenom",
        },
        last_name: {
          type: "string",
          description: "Nom",
        },
        phone: {
          type: "string",
          description: "Telephone",
        },
        email: {
          type: "string",
          description: "Email",
        },
        practice_area: {
          type: "string",
          description: "Domaine juridique concerne",
        },
        case_summary: {
          type: "string",
          description: "Resume de la situation",
        },
        urgency: {
          type: "string",
          description: "Niveau d'urgence percu",
          enum: ["low", "medium", "high", "critical"],
        },
        consent_given: {
          type: "boolean",
          description: "Consentement RGPD obtenu",
        },
      },
      required: ["first_name", "last_name", "phone", "case_summary", "consent_given"],
    },
  },
  {
    name: "end_call",
    description: "Termine l'appel proprement avec un resume",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Resume de l'appel",
        },
        outcome: {
          type: "string",
          description: "Resultat de l'appel",
          enum: ["appointment_booked", "callback_requested", "information_provided", "transferred", "out_of_scope", "no_action"],
        },
        follow_up_required: {
          type: "boolean",
          description: "Suivi necessaire",
        },
        follow_up_notes: {
          type: "string",
          description: "Notes pour le suivi",
        },
      },
      required: ["summary", "outcome"],
    },
  },
];

/**
 * Genere la configuration complete pour ElevenLabs
 */
export function generateElevenLabsConfig(
  context: AgentContext,
  voiceId?: string,
  maxDuration: number = 600,
  silenceTimeout: number = 30
): ElevenLabsAgentConfig {
  const voice = voiceId
    ? { id: voiceId, stability: 0.7, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true }
    : { ...RECOMMENDED_VOICES.sophie, similarity_boost: 0.75, use_speaker_boost: true };

  const systemPrompt = generateSystemPrompt(context);

  const firstMessage = context.greetingMessage ||
    `${context.cabinetName}, bonjour ! Je suis ${context.agentName}, l'assistante virtuelle du cabinet. Je suis une intelligence artificielle et je suis la pour vous orienter. Comment puis-je vous aider aujourd'hui ?`;

  return {
    agent: {
      name: context.agentName,
      first_message: firstMessage,
      system_prompt: systemPrompt,
      language: context.primaryLanguage,
      supported_languages: context.supportedLanguages,
    },
    voice: {
      voice_id: voice.id,
      stability: voice.stability,
      similarity_boost: voice.similarity_boost || 0.75,
      style: voice.style,
      use_speaker_boost: voice.use_speaker_boost || true,
    },
    conversation: {
      max_duration_seconds: maxDuration,
      silence_timeout_seconds: silenceTimeout,
      end_call_after_silence: true,
      transcribe: true,
    },
    moderation: {
      emergency_keywords: [...EMERGENCY_KEYWORDS.high, ...EMERGENCY_KEYWORDS.medium],
      blocked_topics: [
        "conseil juridique direct",
        "prediction issue affaire",
        "critique avocat adverse",
        "tarif autre cabinet",
      ],
      require_consent: true,
    },
    tools: AGENT_TOOLS,
  };
}

/**
 * Export les messages de consentement et scripts
 */
export { CONSENT_MESSAGES, PRACTICE_AREA_SCRIPTS, EMERGENCY_KEYWORDS };
