import anthropic

from app.config import settings


class ClaudeService:
    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def generate_call_summary(
        self, transcript: str, practice_area: str | None = None
    ) -> dict:
        """Genere un resume structure d'un appel."""
        system_prompt = """Tu es un assistant specialise dans l'analyse de transcriptions
d'appels telephoniques pour des cabinets d'avocats francais.

Analyse la transcription et extrais:
1. Un resume concis (2-3 phrases)
2. Les faits cles mentionnes
3. Le domaine juridique concerne
4. Le niveau d'urgence (LOW, NORMAL, HIGH, CRITICAL)
5. Un score de lead (0-100)
6. Si c'est une urgence (violence, danger immediat)
7. Les donnees structurees (nom, telephone, email, description du probleme)

Reponds en JSON structure."""

        message = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": f"Domaine juridique suppose: {practice_area or 'non specifie'}\n\nTranscription:\n{transcript}",
                }
            ],
        )

        return {"raw_response": message.content[0].text}

    async def detect_emergency(self, text: str) -> dict:
        """Detecte une situation d'urgence dans un texte."""
        emergency_keywords = [
            "violence",
            "frappe",
            "battu",
            "menace",
            "danger",
            "urgence",
            "garde a vue",
            "agression",
            "viol",
            "harcelement",
            "suicide",
            "mort",
        ]

        text_lower = text.lower()
        detected = [kw for kw in emergency_keywords if kw in text_lower]

        if detected:
            return {
                "is_emergency": True,
                "emergency_type": "keywords_detected",
                "confidence": min(len(detected) * 0.3, 1.0),
                "keywords": detected,
            }

        return {
            "is_emergency": False,
            "emergency_type": None,
            "confidence": 0.0,
            "keywords": [],
        }


claude_service = ClaudeService()
