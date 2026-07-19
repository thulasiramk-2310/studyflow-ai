import json
import logging
from app.embeddings.embedding_service import generate_embeddings
from app.vectorstore.faiss_store import search_index, get_group_dir
from app.prompts.flashcard_prompt import build_flashcard_prompt
from app.services.llm_service import generate_answer
from app.core.config import settings

logger = logging.getLogger(__name__)

def generate_flashcards(group_id: int, resource_ids: list[int], count: int = 15) -> dict:
    """
    Retrieves chunks for the given resources, generates flashcards using LLM,
    and returns a parsed JSON dict.
    """
    query = "key concepts, definitions, important points, facts, terminology"
    query_embeddings = generate_embeddings([query])
    
    # We ask for a bit more chunks than quiz to ensure enough content for ~15-30 flashcards.
    # threshold=0.0: retrieve the resource's content broadly (scoped by resource_ids)
    # rather than relevance-filtering against a generic query; the default 0.2
    # threshold would drop all chunks here.
    top_results = search_index(
        group_id=group_id,
        query_embedding=query_embeddings[0],
        top_k=30,
        threshold=0.0,
        resource_ids=resource_ids
    )
    
    if not top_results:
        raise ValueError("No indexed study materials available for this session.")
        
    chunks_text = [r["content"] for r in top_results]
    
    prompt = build_flashcard_prompt(chunks_text, count)
    
    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            logger.info(f"Generating flashcards attempt {attempt + 1}")
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
            
            if "flashcards" not in parsed:
                raise ValueError("Missing 'flashcards' array in JSON")
                
            parsed["model"] = settings.GROQ_MODEL
            return parsed
            
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON from LLM: {e}. Answer was: {answer}")
            if attempt == max_retries:
                raise ValueError("LLM returned malformed JSON that could not be parsed.")
        except Exception as e:
            logger.warning(f"Error during flashcard generation: {e}")
            if attempt == max_retries:
                raise
