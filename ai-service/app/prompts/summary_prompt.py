def build_summary_prompt(chunks_text: list[str]) -> str:
    context = "\n\n---\n\n".join(chunks_text)
    
    return f"""You are StudyFlow AI.

Generate a structured study summary.

Rules:
- Use ONLY the supplied context.
- Never use outside knowledge.
- If information is missing, omit it.
- Return ONLY valid JSON.
- Do not include markdown code blocks. Just raw JSON.
- Do not include explanations.

The JSON MUST match this exact schema:
{{
  "executive_summary": "...",
  "key_concepts": [
    "...",
    "..."
  ],
  "important_points": [
    "...",
    "..."
  ],
  "action_items": [
    "...",
    "..."
  ]
}}

Context:
{context}
"""
