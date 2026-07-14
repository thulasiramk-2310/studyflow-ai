def build_quiz_prompt(chunks: list[str]) -> str:
    context = "\n\n---\n\n".join(chunks)
    return f"""You are an expert AI tutor. Based on the provided study materials, generate a comprehensive quiz.

STUDY MATERIALS:
{context}

INSTRUCTIONS:
Generate exactly 5 quiz questions based ONLY on the study materials provided above.
Include a mix of question types (MCQ, TRUE_FALSE, SHORT).
The output MUST be a valid JSON object with the exact structure below. 
Do not include any other text, markdown formatting (no ```json), or explanations outside of the JSON object.

REQUIRED JSON STRUCTURE:
{{
  "questions": [
    {{
      "question": "What is the capital of France?",
      "question_type": "MCQ",
      "options": ["London", "Paris", "Berlin", "Madrid"],
      "correct_answer": "Paris",
      "explanation": "Paris has been the capital of France since 508 AD."
    }},
    {{
      "question": "The Earth is flat.",
      "question_type": "TRUE_FALSE",
      "options": ["True", "False"],
      "correct_answer": "False",
      "explanation": "Scientific evidence shows the Earth is a sphere."
    }},
    {{
      "question": "Explain the concept of gravity in one sentence.",
      "question_type": "SHORT",
      "options": null,
      "correct_answer": "Gravity is the force by which a planet or other body draws objects toward its center.",
      "explanation": "Newton first mathematically described gravity."
    }}
  ]
}}
"""
