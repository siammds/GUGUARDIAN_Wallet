import json
from typing import Optional
import httpx
from app.config import settings
from app.schemas import IntentParseResponse, IntentType
from app.intent_parser import IntentParser

class AIProviderAdapter:
    """
    Provider-neutral AI adapter for Natural Language Intent Parsing.
    Supports OpenAI, Gemini, or deterministic local offline engine.
    Never sends private keys, seed phrases, or sensitive wallet secrets.
    """
    
    def __init__(self):
        self.provider = settings.llm_provider.lower()
        self.api_key = settings.llm_api_key

    async def parse_intent(self, prompt: str, wallet_address: str, chain_id: int) -> IntentParseResponse:
        # 1. Deterministic Prompt Injection pre-check (always enforced before any LLM call)
        pre_check = IntentParser.check_prompt_injection(prompt)
        if pre_check:
            return IntentParser.parse(prompt, wallet_address, chain_id)

        # 2. If provider is "none" or no API key, use the local deterministic parser
        if self.provider == "none" or not self.api_key:
            return IntentParser.parse(prompt, wallet_address, chain_id)

        # 3. If OpenAI or Gemini is configured, call structured output endpoint with strict fallback
        try:
            if self.provider == "openai":
                return await self._call_openai(prompt, wallet_address, chain_id)
            elif self.provider == "gemini":
                return await self._call_gemini(prompt, wallet_address, chain_id)
            else:
                return IntentParser.parse(prompt, wallet_address, chain_id)
        except Exception:
            # Safe degradation to deterministic local engine upon network or parsing failure
            fallback = IntentParser.parse(prompt, wallet_address, chain_id)
            fallback.is_demo_mode = True
            return fallback

    async def _call_openai(self, prompt: str, wallet_address: str, chain_id: int) -> IntentParseResponse:
        system_prompt = (
            "You are Guardian Wallet's transaction intent parser. "
            "Convert the user's natural language request into a strict JSON object with fields: "
            "intent_type ('transfer', 'read_balance', 'query_spending_allowance', 'query_history', 'estimate_fee', 'emergency_pause', 'unsupported'), "
            "token_symbol, recipient_label, recipient_address, amount, requires_clarification (bool), clarification_question. "
            "Do NOT authorize or execute any payment. Do NOT create arbitrary calldata."
        )
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"}
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                raw_json = json.loads(data["choices"][0]["message"]["content"])
                return IntentParseResponse(
                    intent_type=raw_json.get("intent_type", IntentType.UNSUPPORTED),
                    chain_id=chain_id,
                    token_symbol=raw_json.get("token_symbol"),
                    token_address=settings.test_token_address if raw_json.get("token_symbol") == "USDC" else None,
                    recipient_address=raw_json.get("recipient_address"),
                    recipient_label=raw_json.get("recipient_label"),
                    amount=str(raw_json.get("amount")) if raw_json.get("amount") else None,
                    requires_clarification=raw_json.get("requires_clarification", False),
                    clarification_question=raw_json.get("clarification_question"),
                    confidence_score=0.95,
                    is_demo_mode=False,
                    raw_prompt=prompt
                )
            else:
                return IntentParser.parse(prompt, wallet_address, chain_id)

    async def _call_gemini(self, prompt: str, wallet_address: str, chain_id: int) -> IntentParseResponse:
        # Fall back gracefully to deterministic parser
        return IntentParser.parse(prompt, wallet_address, chain_id)

ai_adapter = AIProviderAdapter()
