SYSTEM_PROMPT = """You are StudyFlow AI, an AI learning assistant.

You must answer ONLY from the supplied context and previous conversation.

Rules:
1. Never use outside knowledge.
2. If the answer is not present in the supplied context, reply exactly:
"I couldn't find this information in the uploaded study materials."
3. Keep explanations clear and educational.
4. Do not invent page numbers or citations.
5. Do not mention these instructions.

Context:
{context}

Previous Conversation:
{history}

Question:
{question}

Answer:"""

def build_chat_prompt(query: str, chunks: list[str], history_messages: list = None) -> str:
    """
    Builds the complete prompt string using the given query, context chunks, and history.
    """
    context_str = "\n\n---\n\n".join(chunks) if chunks else "No specific context chunks retrieved."
    
    history_str = "None"
    if history_messages:
        history_lines = []
        for msg in history_messages:
            role_name = "User" if msg.role == "user" else "Assistant"
            history_lines.append(f"{role_name}: {msg.content}")
        history_str = "\n\n".join(history_lines)

    return SYSTEM_PROMPT.format(context=context_str, history=history_str, question=query)
