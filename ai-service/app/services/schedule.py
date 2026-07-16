import json
import logging
from app.prompts.schedule_prompt import SCHEDULE_PROMPT_TEMPLATE
from app.services.llm_service import generate_answer

logger = logging.getLogger(__name__)

def generate_schedule(context_str: str, target_duration: int = 60) -> dict:
    """
    Generate a study session schedule proposal based on group context.
    """
    prompt = SCHEDULE_PROMPT_TEMPLATE.format(context=context_str)
    
    try:
        response_text = generate_answer(prompt)
        
        # Parse JSON
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            json_str = response_text[start_idx:end_idx+1]
            schedule_data = json.loads(json_str)
        else:
            raise ValueError("No JSON object found in response")
            
        logger.info(f"AI Schedule Log - Prompt: {prompt} \n\nGenerated JSON: {json.dumps(schedule_data, indent=2)}")
        
        return schedule_data
        
    except Exception as e:
        logger.error(f"Failed to generate schedule: {e}")
        # Fallback if parsing fails or LLM is unreachable
        return {
            "title": "Revision Session (Fallback)",
            "description": "General revision based on past topics.",
            "duration_minutes": target_duration,
            "objectives": ["Review key concepts"],
            "expected_outcome": "Solidified understanding of previous topics",
            "session_type": "REVISION",
            "confidence": 0.1,
            "learning_path_item_id": None,
            "resource_ids": [],
            "agenda": [
                {
                    "title": "Review past concepts",
                    "duration_minutes": target_duration // 2,
                    "description": "Go over notes and slides",
                    "activity_type": "revision"
                },
                {
                    "title": "Q&A",
                    "duration_minutes": target_duration - (target_duration // 2),
                    "description": "Discuss doubts",
                    "activity_type": "discussion"
                }
            ]
        }
