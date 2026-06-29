import json
from typing import Optional

from litellm import completion
from pydantic import BaseModel

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SUPPORTED_DOCS = [
    "Mutual Non-Disclosure Agreement",
    "Mutual NDA Cover Page",
    "Cloud Service Agreement",
    "Design Partner Agreement",
    "Service Level Agreement",
    "Professional Services Agreement",
    "Data Processing Agreement",
    "Software License Agreement",
    "Partnership Agreement",
    "Pilot Agreement",
    "Business Associate Agreement",
    "AI Addendum",
]

_SUPPORTED_LIST = "\n".join(f"- {d}" for d in SUPPORTED_DOCS)

_BASE = f"""You are a friendly legal assistant helping a user fill out a legal agreement.

Rules:
- On the first turn (no prior messages), greet the user warmly and ask your first question.
- Ask about one or two topics at a time. Never list many questions at once.
- ALWAYS end your reply with a follow-up question if any fields are still missing.
- If the user asks for a document type not listed here, explain that this platform supports only:
{_SUPPORTED_LIST}
  Then offer to continue with the current document.
- Acknowledge corrections naturally when the user updates a previous answer.
- When all key fields are collected, confirm with a summary and tell the user they can download the PDF.

Output format (JSON):
{{
  "message": "<your natural language reply>",
  "fields": {{
    "<Exact Field Name>": "<value or null>"
  }}
}}
Only include fields you determined or updated in THIS turn; omit or set others to null.
All date fields must be ISO format YYYY-MM-DD.
"""

_NDA_FIELDS = """
Fields to collect (use these EXACT key names):
- "Purpose": why the parties are sharing confidential information
- "Effective Date": when the agreement starts (YYYY-MM-DD)
- "MNDA Term": e.g. "1 year from Effective Date" or "until terminated"
- "Term of Confidentiality": e.g. "3 years from Effective Date" or "in perpetuity"
- "Governing Law": US state governing the agreement
- "Jurisdiction": city/county where legal disputes are resolved
- "Party 1 Name", "Party 1 Title", "Party 1 Company", "Party 1 Address"
- "Party 2 Name", "Party 2 Title", "Party 2 Company", "Party 2 Address"
"""

_CSA_FIELDS = """
Fields to collect (use these EXACT key names):
- "Customer": customer company name
- "Provider": provider/vendor company name
- "Effective Date": agreement start date (YYYY-MM-DD)
- "Subscription Period": e.g. "1 year"
- "Payment Process": e.g. "annual upfront", "monthly invoiced"
- "Order Date": order placement date (YYYY-MM-DD)
- "Non-Renewal Notice Date": cancellation deadline, e.g. "30 days before period end"
- "General Cap Amount": liability cap amount
- "Governing Law": US state governing the agreement
- "Chosen Courts": courts with jurisdiction
"""

_DESIGN_PARTNER_FIELDS = """
Fields to collect (use these EXACT key names):
- "Partner": design partner company name
- "Provider": product provider company name
- "Effective Date": agreement start date (YYYY-MM-DD)
- "Term": duration, e.g. "6 months", "1 year"
- "Fees": fees partner pays (or "None" if free)
- "Program": name/description of the design partner program
- "Governing Law": US state governing the agreement
- "Chosen Courts": courts with jurisdiction
- "Notice Address": contact address for formal notices
"""

_SLA_FIELDS = """
Fields to collect (use these EXACT key names):
- "Provider": service provider name
- "Customer": customer name
- "Target Uptime": e.g. "99.9%"
- "Target Response Time": e.g. "4 hours for critical issues"
- "Support Channel": e.g. "email", "support portal"
- "Subscription Period": period covered, e.g. "1 year"
- "Uptime Credit": credit for missing uptime SLA, e.g. "10% of monthly fees"
- "Response Time Credit": credit for missing response time SLA
- "Scheduled Downtime": allowed maintenance windows
"""

_PSA_FIELDS = """
Fields to collect (use these EXACT key names):
- "Customer": customer company name
- "Provider": service provider company name
- "Effective Date": agreement start date (YYYY-MM-DD)
- "Governing Law": US state governing the agreement
- "Chosen Courts": courts with jurisdiction
- "General Cap Amount": liability cap amount
- "Security Policy": provider security policy name or URL
"""

_DPA_FIELDS = """
Fields to collect (use these EXACT key names):
- "Customer": data controller (customer) name
- "Provider": data processor (provider) name
- "Effective Date": agreement start date (YYYY-MM-DD)
- "Categories of Personal Data": types of data processed, e.g. "names, email addresses"
- "Categories of Data Subjects": whose data is processed, e.g. "employees, end users"
- "Nature and Purpose of Processing": why data is processed
- "Duration of Processing": how long data is processed
- "Governing Member State": EU member state governing the agreement
- "Security Policy": provider security policy name or URL
"""

_SOFTWARE_LICENSE_FIELDS = """
Fields to collect (use these EXACT key names):
- "Provider": software licensor name
- "Customer": licensee name
- "Effective Date": agreement start date (YYYY-MM-DD)
- "Subscription Period": license duration, e.g. "1 year", "perpetual"
- "Permitted Uses": how customer may use the software
- "Governing Law": US state governing the agreement
- "Chosen Courts": courts with jurisdiction
- "General Cap Amount": liability cap amount
"""

_PARTNERSHIP_FIELDS = """
Fields to collect (use these EXACT key names):
- "Company": primary company name
- "Partner": partner company name
- "Effective Date": agreement start date (YYYY-MM-DD)
- "Territory": geographic scope, e.g. "North America", "worldwide"
- "Payment Process": how payments are made
- "Payment Schedule": payment frequency, e.g. "monthly", "quarterly"
- "Governing Law": US state governing the agreement
- "Chosen Courts": courts with jurisdiction
"""

_PILOT_FIELDS = """
Fields to collect (use these EXACT key names):
- "Customer": pilot participant name
- "Provider": provider company name
- "Effective Date": pilot start date (YYYY-MM-DD)
- "Pilot Period": duration, e.g. "30 days", "3 months"
- "Governing Law": US state governing the agreement
- "Chosen Courts": courts with jurisdiction
- "General Cap Amount": liability cap amount
- "Notice Address": contact address for formal notices
"""

_BAA_FIELDS = """
Fields to collect (use these EXACT key names):
- "Provider": business associate name (handles PHI)
- "Company": covered entity name
- "BAA Effective Date": when this BAA takes effect (YYYY-MM-DD)
- "Agreement": name/reference to the main services agreement this BAA supplements
- "Limitations": restrictions on PHI use beyond defaults (or "None")
- "Breach Notification Period": time to report breaches, e.g. "30 days", "72 hours"
"""

_AI_ADDENDUM_FIELDS = """
Fields to collect (use these EXACT key names):
- "Customer": customer name
- "Provider": AI service provider name
- "Effective Date": addendum start date (YYYY-MM-DD)
- "Training Data": description of customer data that may be used for model training
- "Training Purposes": permitted purposes for model training
- "Training Restrictions": any restrictions on using data for training
- "Improvement Restrictions": restrictions on using data to improve AI models
"""

DOCUMENT_REGISTRY: dict[str, str] = {
    "mutual-nda": _BASE + "\nDocument: Mutual Non-Disclosure Agreement (MNDA)\n" + _NDA_FIELDS,
    "mutual-nda-coverpage": _BASE + "\nDocument: Mutual NDA Cover Page\n" + _NDA_FIELDS,
    "csa": _BASE + "\nDocument: Cloud Service Agreement (CSA)\n" + _CSA_FIELDS,
    "design-partner-agreement": _BASE + "\nDocument: Design Partner Agreement\n" + _DESIGN_PARTNER_FIELDS,
    "sla": _BASE + "\nDocument: Service Level Agreement (SLA)\n" + _SLA_FIELDS,
    "psa": _BASE + "\nDocument: Professional Services Agreement (PSA)\n" + _PSA_FIELDS,
    "dpa": _BASE + "\nDocument: Data Processing Agreement (DPA)\n" + _DPA_FIELDS,
    "software-license-agreement": _BASE + "\nDocument: Software License Agreement\n" + _SOFTWARE_LICENSE_FIELDS,
    "partnership-agreement": _BASE + "\nDocument: Partnership Agreement\n" + _PARTNERSHIP_FIELDS,
    "pilot-agreement": _BASE + "\nDocument: Pilot Agreement\n" + _PILOT_FIELDS,
    "baa": _BASE + "\nDocument: Business Associate Agreement (BAA)\n" + _BAA_FIELDS,
    "ai-addendum": _BASE + "\nDocument: AI Addendum\n" + _AI_ADDENDUM_FIELDS,
}


class ChatTurn(BaseModel):
    message: str
    fields: dict[str, Optional[str]]


def get_chat_response(messages: list[dict], document_type: str) -> ChatTurn:
    system_prompt = DOCUMENT_REGISTRY.get(document_type, DOCUMENT_REGISTRY["mutual-nda"])
    full_messages = [{"role": "system", "content": system_prompt}] + messages
    response = completion(
        model=MODEL,
        messages=full_messages,
        response_format={"type": "json_object"},
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
    )
    data = json.loads(response.choices[0].message.content)
    return ChatTurn(message=data["message"], fields=data.get("fields", {}))
