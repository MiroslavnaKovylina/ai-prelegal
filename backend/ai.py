from typing import Literal, Optional

from litellm import completion
from pydantic import BaseModel

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SYSTEM_PROMPT = """You are a friendly legal assistant helping a user fill out a Mutual Non-Disclosure Agreement (Mutual NDA).

Your role:
- On the first turn (no prior messages), greet the user warmly and ask your first question to start collecting information.
- Ask about one or two topics at a time in natural conversation. Do not list many questions at once.
- Collect the following details for the NDA:
    Purpose: why the parties are sharing confidential information
    Effective date: when the agreement starts (you must output as YYYY-MM-DD)
    MNDA term: how long the agreement lasts — a number of years, or "until terminated"
    Term of confidentiality: how long information is protected — a number of years, or "in perpetuity"
    Governing law: which US state's law governs the agreement
    Jurisdiction: city/county where legal disputes are resolved
    Party 1: full name, job title, company name, notice address (email or postal)
    Party 2: full name, job title, company name, notice address (email or postal)
- Acknowledge corrections naturally when the user changes a previously given answer.
- When all key fields are collected, confirm the summary and let the user know they can download the PDF.

Structured output rules:
- `message`: your natural language reply shown in the chat UI.
- `fields`: only set fields you determined or updated in THIS turn. Leave all others as null.
- effectiveDate must be ISO format YYYY-MM-DD.
- mndaTermType must be exactly "years" or "until-terminated".
- confidentialityTermType must be exactly "years" or "perpetuity"."""


class PartyFields(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None


class NDAFields(BaseModel):
    purpose: Optional[str] = None
    effectiveDate: Optional[str] = None
    mndaTermType: Optional[Literal["years", "until-terminated"]] = None
    mndaTermYears: Optional[int] = None
    confidentialityTermType: Optional[Literal["years", "perpetuity"]] = None
    confidentialityTermYears: Optional[int] = None
    governingLaw: Optional[str] = None
    jurisdiction: Optional[str] = None
    party1: Optional[PartyFields] = None
    party2: Optional[PartyFields] = None


class ChatTurn(BaseModel):
    message: str
    fields: NDAFields


def get_chat_response(messages: list[dict]) -> ChatTurn:
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
    response = completion(
        model=MODEL,
        messages=full_messages,
        response_format=ChatTurn,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    return ChatTurn.model_validate_json(response.choices[0].message.content)
