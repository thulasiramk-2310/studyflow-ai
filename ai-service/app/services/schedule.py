import json
import logging
from app.prompts.schedule_prompt import SCHEDULE_PROMPT_TEMPLATE
from app.services.llm_service import generate_answer

logger = logging.getLogger(__name__)

def generate_schedule(context_str: str) -> dict:
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
        # Fallback if parsing fails
        return {
            "title": "Revision Session",
            "description": "General revision based on past topics.",
            "agenda": "- Review past concepts\n- Q&A",
            "duration_minutes": 60
        }
