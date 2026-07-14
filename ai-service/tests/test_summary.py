import pytest
from unittest.mock import patch, MagicMock
import json
from app.services.summary import generate_summary

@patch("app.services.summary.search_index")
@patch("app.services.summary.generate_answer")
def test_summary_with_resources(mock_generate, mock_search):
    # Mock search returning chunks (represents 1 or multiple PDFs)
    mock_search.return_value = [{"content": "React is a UI library."}]
    
    # Mock LLM returning valid JSON
    mock_generate.return_value = json.dumps({
        "executive_summary": "Test Summary",
        "key_concepts": ["React"],
        "important_points": ["UI"],
        "action_items": ["Learn"]
    })
    
    result = generate_summary(group_id=1, resource_ids=[1, 2])
    assert result["executive_summary"] == "Test Summary"
    assert "model" in result

@patch("app.services.summary.search_index")
def test_summary_no_resources(mock_search):
    # Mock search returning no chunks
    mock_search.return_value = []
    
    with pytest.raises(ValueError, match="No indexed study materials"):
        generate_summary(group_id=1, resource_ids=[99])

@patch("app.services.summary.search_index")
@patch("app.services.summary.generate_answer")
def test_summary_malformed_json_retry(mock_generate, mock_search):
    mock_search.return_value = [{"content": "Some content."}]
    
    # First call returns bad JSON, second call returns good JSON
    mock_generate.side_effect = [
        "This is not JSON at all, I hallucinated this answer.",
        json.dumps({
            "executive_summary": "Recovered Summary",
            "key_concepts": [],
            "important_points": [],
            "action_items": []
        })
    ]
    
    result = generate_summary(group_id=1, resource_ids=[1])
    assert result["executive_summary"] == "Recovered Summary"
    assert mock_generate.call_count == 2

@patch("app.services.summary.search_index")
@patch("app.services.summary.generate_answer")
def test_summary_malformed_json_fails(mock_generate, mock_search):
    mock_search.return_value = [{"content": "Some content."}]
    
    # Both calls return bad JSON
    mock_generate.side_effect = ["Bad JSON 1", "Bad JSON 2"]
    
    with pytest.raises(ValueError, match="LLM returned malformed JSON"):
        generate_summary(group_id=1, resource_ids=[1])
