import os
import logging
import urllib.request
import json
from typing import Optional

logger = logging.getLogger("voice_service")

class ElevenLabsVoiceService:
    def __init__(self):
        self.api_key = os.environ.get("ELEVENLABS_API_KEY")
        # Default voice ID: Adam / Rachel / Antoni (standard ElevenLabs voices)
        self.voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
        self.enabled = True

    def toggle_voice(self, enabled: Optional[bool] = None) -> bool:
        if enabled is not None:
            self.enabled = enabled
        else:
            self.enabled = not self.enabled
        return self.enabled

    async def generate_speech(self, text: str) -> Optional[bytes]:
        if not self.enabled:
            return None

        if not self.api_key:
            logger.info("ELEVENLABS_API_KEY not configured. Web Speech API browser fallback will be used.")
            return None

        try:
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}"
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.api_key
            }
            body = json.dumps({
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                }
            }).encode('utf-8')

            req = urllib.request.Request(url, data=body, headers=headers, method="POST")
            with urllib.request.urlopen(req) as response:
                return response.read()
        except Exception as e:
            logger.warning(f"ElevenLabs TTS generation failed, using fallback: {e}")
            return None

voice_service = ElevenLabsVoiceService()
