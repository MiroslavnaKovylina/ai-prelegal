import re
from typing import Optional

from litellm import completion
from pydantic import BaseModel, ConfigDict, Field, create_model

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

# ── Field name lists ────────────────────────────────────────────────────────
# Keys must match the span text content in the matching template file exactly.

_NDA = [
    "Purpose", "Effective Date", "MNDA Term", "Term of Confidentiality",
    "Governing Law", "Jurisdiction",
    "Party 1 Name", "Party 1 Title", "Party 1 Company", "Party 1 Address",
    "Party 2 Name", "Party 2 Title", "Party 2 Company", "Party 2 Address",
]

_CSA = [
    "Customer", "Provider", "Effective Date", "Subscription Period",
    "Payment Process", "Order Date", "Non-Renewal Notice Date",
    "General Cap Amount", "Governing Law", "Chosen Courts",
]

_DESIGN_PARTNER = [
    "Partner", "Provider", "Effective Date", "Term", "Fees", "Program",
    "Governing Law", "Chosen Courts", "Notice Address",
]

_SLA = [
    "Provider", "Customer", "Target Uptime", "Target Response Time",
    "Support Channel", "Subscription Period",
    "Uptime Credit", "Response Time Credit", "Scheduled Downtime",
]

_PSA = [
    "Customer", "Provider", "Effective Date", "Governing Law",
    "Chosen Courts", "General Cap Amount", "Security Policy",
]

_DPA = [
    "Customer", "Provider", "Effective Date",
    "Categories of Personal Data", "Categories of Data Subjects",
    "Nature and Purpose of Processing", "Duration of Processing",
    "Governing Member State", "Security Policy",
]

_SOFTWARE_LICENSE = [
    "Provider", "Customer", "Effective Date", "Subscription Period",
    "Permitted Uses", "Governing Law", "Chosen Courts", "General Cap Amount",
]

_PARTNERSHIP = [
    "Company", "Partner", "Effective Date", "Territory",
    "Payment Process", "Payment Schedule", "Governing Law", "Chosen Courts",
]

_PILOT = [
    "Customer", "Provider", "Effective Date", "Pilot Period",
    "Governing Law", "Chosen Courts", "General Cap Amount", "Notice Address",
]

_BAA = [
    "Provider", "Company", "BAA Effective Date", "Agreement",
    "Limitations", "Breach Notification Period",
]

_AI_ADDENDUM = [
    "Customer", "Provider", "Effective Date",
    "Training Data", "Training Purposes",
    "Training Restrictions", "Improvement Restrictions",
]

DOCUMENT_FIELD_NAMES: dict[str, list[str]] = {
    "mutual-nda":                  _NDA,
    "mutual-nda-coverpage":        _NDA,
    "csa":                         _CSA,
    "design-partner-agreement":    _DESIGN_PARTNER,
    "sla":                         _SLA,
    "psa":                         _PSA,
    "dpa":                         _DPA,
    "software-license-agreement":  _SOFTWARE_LICENSE,
    "partnership-agreement":       _PARTNERSHIP,
    "pilot-agreement":             _PILOT,
    "baa":                         _BAA,
    "ai-addendum":                 _AI_ADDENDUM,
}

# ── Dynamic model builder ───────────────────────────────────────────────────

class _AliasedBase(BaseModel):
    """Base that allows both alias and python-name population."""
    model_config = ConfigDict(populate_by_name=True)


def _python_name(alias: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", alias.lower()).strip("_")


_model_cache: dict[str, type[BaseModel]] = {}


def _fields_model(field_names: list[str]) -> type[BaseModel]:
    """Return a cached Pydantic model with one Optional[str] field per name."""
    cache_key = "|".join(field_names)
    if cache_key not in _model_cache:
        defns = {
            _python_name(n): (Optional[str], Field(None, alias=n))
            for n in field_names
        }
        _model_cache[cache_key] = create_model(
            "DocumentFields", __base__=_AliasedBase, **defns
        )
    return _model_cache[cache_key]


# ── System prompts ──────────────────────────────────────────────────────────

SUPPORTED_DOCS = [
    "Mutual Non-Disclosure Agreement", "Mutual NDA Cover Page",
    "Cloud Service Agreement", "Design Partner Agreement",
    "Service Level Agreement", "Professional Services Agreement",
    "Data Processing Agreement", "Software License Agreement",
    "Partnership Agreement", "Pilot Agreement",
    "Business Associate Agreement", "AI Addendum",
]

_SUPPORTED_LIST = "\n".join(f"- {d}" for d in SUPPORTED_DOCS)

_BASE = f"""You are a friendly legal assistant helping a user fill out a legal agreement.

Rules:
- On the first turn (no prior messages), greet the user warmly and ask your first question.
- Ask about one or two topics at a time. Never list many questions at once.
- ALWAYS end your reply with a follow-up question if any fields are still missing.
- If the user asks for a document type not supported here, explain that this platform supports:
{_SUPPORTED_LIST}
  Then offer to continue with the current document.
- Acknowledge corrections naturally when the user updates a previous answer.
- When all key fields are collected, confirm with a summary and tell the user they can download the PDF.

Structured output rules:
- `message`: your natural language reply shown in chat.
- `fields`: set ONLY the fields you determined or updated in THIS turn. Leave all others null.
- All date fields must be ISO format YYYY-MM-DD.
"""

_NDA_PROMPT = _BASE + """
Document: Mutual Non-Disclosure Agreement (MNDA)
Collect: Purpose, Effective Date, MNDA Term (e.g. "1 year from Effective Date" or "until terminated"),
Term of Confidentiality (e.g. "3 years from Effective Date" or "in perpetuity"),
Governing Law (US state), Jurisdiction (city/county),
Party 1 Name / Title / Company / Address, Party 2 Name / Title / Company / Address.
"""

_CSA_PROMPT = _BASE + """
Document: Cloud Service Agreement (CSA)
Collect: Customer, Provider, Effective Date, Subscription Period, Payment Process,
Order Date, Non-Renewal Notice Date, General Cap Amount, Governing Law, Chosen Courts.
"""

_DESIGN_PARTNER_PROMPT = _BASE + """
Document: Design Partner Agreement
Collect: Partner, Provider, Effective Date, Term, Fees (or "None"),
Program (description of design-partner program), Governing Law, Chosen Courts, Notice Address.
"""

_SLA_PROMPT = _BASE + """
Document: Service Level Agreement (SLA)
Collect: Provider, Customer, Target Uptime (e.g. "99.9%"), Target Response Time,
Support Channel, Subscription Period, Uptime Credit, Response Time Credit, Scheduled Downtime.
"""

_PSA_PROMPT = _BASE + """
Document: Professional Services Agreement (PSA)
Collect: Customer, Provider, Effective Date, Governing Law, Chosen Courts,
General Cap Amount, Security Policy.
"""

_DPA_PROMPT = _BASE + """
Document: Data Processing Agreement (DPA)
Collect: Customer, Provider, Effective Date, Categories of Personal Data,
Categories of Data Subjects, Nature and Purpose of Processing,
Duration of Processing, Governing Member State, Security Policy.
"""

_SOFTWARE_LICENSE_PROMPT = _BASE + """
Document: Software License Agreement
Collect: Provider, Customer, Effective Date, Subscription Period,
Permitted Uses, Governing Law, Chosen Courts, General Cap Amount.
"""

_PARTNERSHIP_PROMPT = _BASE + """
Document: Partnership Agreement
Collect: Company, Partner, Effective Date, Territory, Payment Process,
Payment Schedule, Governing Law, Chosen Courts.
"""

_PILOT_PROMPT = _BASE + """
Document: Pilot Agreement
Collect: Customer, Provider, Effective Date, Pilot Period,
Governing Law, Chosen Courts, General Cap Amount, Notice Address.
"""

_BAA_PROMPT = _BASE + """
Document: Business Associate Agreement (BAA)
Collect: Provider, Company, BAA Effective Date, Agreement (the main services agreement this BAA supplements),
Limitations (or "None"), Breach Notification Period (e.g. "30 days").
"""

_AI_ADDENDUM_PROMPT = _BASE + """
Document: AI Addendum
Collect: Customer, Provider, Effective Date, Training Data,
Training Purposes, Training Restrictions, Improvement Restrictions.
"""

DOCUMENT_REGISTRY: dict[str, str] = {
    "mutual-nda":                  _NDA_PROMPT,
    "mutual-nda-coverpage":        _NDA_PROMPT,
    "csa":                         _CSA_PROMPT,
    "design-partner-agreement":    _DESIGN_PARTNER_PROMPT,
    "sla":                         _SLA_PROMPT,
    "psa":                         _PSA_PROMPT,
    "dpa":                         _DPA_PROMPT,
    "software-license-agreement":  _SOFTWARE_LICENSE_PROMPT,
    "partnership-agreement":       _PARTNERSHIP_PROMPT,
    "pilot-agreement":             _PILOT_PROMPT,
    "baa":                         _BAA_PROMPT,
    "ai-addendum":                 _AI_ADDENDUM_PROMPT,
}

# ── Public API ──────────────────────────────────────────────────────────────

class ChatTurn(BaseModel):
    message: str
    fields: dict[str, Optional[str]]


def _extract_content(response) -> str:
    """Return the JSON string from an LLM response regardless of delivery path.

    LiteLLM routes Pydantic response_format through native JSON-schema mode when
    the provider supports it (content is a string) or falls back to tool-calls
    (content is None, payload is in tool_calls[0].function.arguments).
    """
    msg = response.choices[0].message
    content = msg.content
    if content is None:
        tool_calls = getattr(msg, "tool_calls", None)
        if tool_calls:
            content = tool_calls[0].function.arguments
    if not content:
        raise ValueError(f"Empty response from model: {response}")
    return content


def get_chat_response(messages: list[dict], document_type: str) -> ChatTurn:
    system_prompt = DOCUMENT_REGISTRY.get(document_type, _NDA_PROMPT)
    field_names = DOCUMENT_FIELD_NAMES.get(document_type, _NDA)
    FieldsModel = _fields_model(field_names)

    class _ChatTurn(BaseModel):
        message: str
        fields: FieldsModel  # type: ignore[valid-type]

    full_messages = [{"role": "system", "content": system_prompt}] + messages
    response = completion(
        model=MODEL,
        messages=full_messages,
        response_format=_ChatTurn,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )

    content = _extract_content(response)
    print(f"[AI] raw={content[:300]}", flush=True)

    result = _ChatTurn.model_validate_json(content)
    non_null = {
        k: v
        for k, v in result.fields.model_dump(by_alias=True).items()
        if v is not None
    }
    print(f"[AI] fields={non_null}", flush=True)
    return ChatTurn(message=result.message, fields=non_null)
