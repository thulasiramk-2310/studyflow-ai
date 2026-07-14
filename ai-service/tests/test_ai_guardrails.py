import pytest
from app.prompts.chat_prompt import build_chat_prompt
from app.services.llm_service import generate_answer

def test_ai_positive_case():
    context = ["Operating Systems use Round Robin scheduling to time-slice CPU execution among multiple processes."]
    query = "Explain Round Robin"
    prompt = build_chat_prompt(query, context)
    
    answer = generate_answer(prompt)
    
    assert "time-slice" in answer.lower() or "scheduling" in answer.lower()
    assert "I couldn't find this information" not in answer

def test_ai_negative_case():
    context = ["Operating Systems use Round Robin scheduling to time-slice CPU execution among multiple processes."]
    query = "Explain Quantum Mechanics"
    prompt = build_chat_prompt(query, context)
    
    answer = generate_answer(prompt)
    
    assert "I couldn't find this information in the uploaded study materials." in answer

def test_ai_empty_context():
    context = []
    query = "Ask anything"
    prompt = build_chat_prompt(query, context)
    
    answer = generate_answer(prompt)
    
    assert "I couldn't find this information in the uploaded study materials." in answer
