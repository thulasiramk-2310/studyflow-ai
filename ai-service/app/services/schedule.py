import json
import logging
from app.prompts.schedule_prompt import SCHEDULE_PROMPT_TEMPLATE
from app.services.llm_service import generate_answer
from app.prompts.audience import with_audience

logger = logging.getLogger(__name__)

# Models invent activity types ("lecture", "exercise"); map them onto the six the UI knows
# instead of rejecting the whole plan.
ACTIVITY_TYPES = ("revision", "learning", "practice", "discussion", "quiz", "break")
_ACTIVITY_SYNONYMS = {
    "lecture": "learning", "lesson": "learning", "introduction": "learning", "intro": "learning",
    "presentation": "learning", "reading": "learning", "concept": "learning", "theory": "learning",
    "review": "revision", "recap": "revision", "summary": "revision", "wrap-up": "revision", "wrap up": "revision",
    "exercise": "practice", "exercises": "practice", "problem solving": "practice", "hands-on": "practice",
    "lab": "practice", "case study": "practice", "activity": "practice", "drill": "practice",
    "q&a": "discussion", "qa": "discussion", "group discussion": "discussion", "debate": "discussion",
    "brainstorm": "discussion",
    "assessment": "quiz", "test": "quiz", "knowledge check": "quiz", "quiz review": "quiz",
    "rest": "break", "pause": "break",
}


def normalize_activity_type(value) -> str:
    text = str(value or "").strip().lower()
    if text in ACTIVITY_TYPES:
        return text
    return _ACTIVITY_SYNONYMS.get(text, "learning")


def generate_schedule(context_str: str, target_duration: int = 60, audience: str | None = None) -> dict:
    """
    Generate a study session schedule proposal based on group context.
    """
    prompt = SCHEDULE_PROMPT_TEMPLATE.format(context=context_str)
    # Callers that already put the hint in the context (agent graph, MCP) pass no audience.
    if audience:
        prompt = with_audience(prompt, audience)
    
    try:
        # One retry: the model occasionally drops a comma in long JSON.
        for attempt in range(2):
            response_text = generate_answer(prompt)
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}')
            try:
                if start_idx == -1 or end_idx == -1:
                    raise ValueError("No JSON object found in response")
                schedule_data = json.loads(response_text[start_idx:end_idx+1])
                break
            except ValueError as parse_error:  # json.JSONDecodeError is a ValueError
                logger.warning(f"Schedule JSON unreadable (attempt {attempt + 1}): {parse_error}")
                if attempt == 1:
                    raise

        for item in schedule_data.get("agenda") or []:
            if isinstance(item, dict):
                item["activity_type"] = normalize_activity_type(item.get("activity_type"))

        logger.info(f"Schedule generated | prompt_chars={len(prompt)} agenda_items={len(schedule_data.get('agenda', []))}")
        
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
