import os
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("ai_client")

class AIClient:
    def __init__(self):
        self.api_key = os.environ.get("GROQ_API_KEY")
        self.client = None
        if self.api_key:
            try:
                from groq import AsyncGroq
                self.client = AsyncGroq(api_key=self.api_key)
                logger.info("Groq client initialized successfully.")
            except Exception as e:
                logger.warning(f"Failed to initialize Groq client: {e}")

    async def generate_explanation(self, prompt: str, fallback_text: str) -> str:
        if not self.client:
            return fallback_text
        try:
            response = await self.client.chat.completions.create(
                model="groq/compound",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150
            )
            if response and response.choices and response.choices[0].message.content:
                return response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"Groq API call failed, returning fallback: {e}")
        return fallback_text

ai_client = AIClient()
