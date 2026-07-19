import json
import logging
from app.embeddings.embedding_service import generate_embeddings
from app.vectorstore.faiss_store import search_index, get_group_dir
from app.prompts.quiz_prompt import build_quiz_prompt
from app.services.llm_service import generate_answer
from app.core.config import settings

logger = logging.getLogger(__name__)

def generate_quiz(group_id: int, resource_ids: list[int]) -> dict:
    """
    Retrieves chunks for the given resources, generates a quiz using Qwen3,
    and returns a parsed JSON dict.
    """
    query = "key concepts, definitions, important points, facts"
    query_embeddings = generate_embeddings([query])
    
    # threshold=0.0: for generation we want the resource's content broadly
    # (scoped by resource_ids), not relevance-filtered against a generic query
    # like chat does. The default 0.2 threshold would drop all chunks here.
    top_results = search_index(
        group_id=group_id,
        query_embedding=query_embeddings[0],
        top_k=20,
        threshold=0.0,
        resource_ids=resource_ids
    )
    
    if not top_results:
        raise ValueError("No indexed study materials available for this session.")
        
    chunks_text = [r["content"] for r in top_results]
    
    prompt = build_quiz_prompt(chunks_text)
    
    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            logger.info(f"Generating quiz attempt {attempt + 1}")
            answer = generate_answer(prompt)
            
            clean_answer = answer.strip()
            if clean_answer.startswith("```json"):
                clean_answer = clean_answer[7:]
            if clean_answer.startswith("```"):
                clean_answer = clean_answer[3:]
            if clean_answer.endswith("```"):
                clean_answer = clean_answer[:-3]
                
            clean_answer = clean_answer.strip()
            
            parsed = json.loads(clean_answer)
            
            if "questions" not in parsed:
                raise ValueError("Missing 'questions' array in JSON")
                
            parsed["model"] = settings.GROQ_MODEL
            return parsed
            
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON from LLM: {e}. Answer was: {answer}")
            if attempt == max_retries:
                raise ValueError("LLM returned malformed JSON that could not be parsed.")
        except Exception as e:
            logger.warning(f"Error during quiz generation: {e}")
            if attempt == max_retries:
                raise
