def build_flashcard_prompt(chunks: list[str], count: int = 15) -> str:
    context = "\n\n".join(chunks)
    
    return f"""You are StudyFlow AI.

Generate concise flashcards ONLY from the supplied study material below.

Each flashcard must contain:
- front (The concept, question, or term)
- back (The definition, answer, or explanation)
- difficulty (One of: Easy, Medium, Hard)
- order_index (Integer starting from 0)

Do not invent facts.
Return ONLY valid JSON.
Target exactly {count} flashcards. If there isn't enough material for {count}, generate as many high-quality ones as possible without repeating.
Avoid duplicates.
Prioritize important concepts.

The JSON format MUST be exactly like this:
{{
  "flashcards": [
    {{
      "front": "What is Round Robin?",
      "back": "A CPU scheduling algorithm using fixed time slices.",
      "difficulty": "Medium",
      "order_index": 0
    }}
  ]
}}

STUDY MATERIAL:
{context}
"""
