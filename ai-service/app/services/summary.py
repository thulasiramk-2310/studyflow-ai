import json
import logging
from app.embeddings.embedding_service import generate_embeddings
from app.vectorstore.faiss_store import search_index, get_group_dir
from app.prompts.summary_prompt import build_summary_prompt
from app.services.llm_service import generate_answer
from app.core.config import settings

logger = logging.getLogger(__name__)

def generate_summary(group_id: int, resource_ids: list[int]) -> dict:
    """
    Retrieves chunks for the given resources, generates a summary using Qwen3,
    and returns a parsed JSON dict.
    """
    # 1. Retrieve
    # We create a generic query to find important concepts
    query = "key concepts, main topics, important points, summary"
    query_embeddings = generate_embeddings([query])
    
    # We fetch top 15 chunks, which should be enough for a session summary
    # without blowing up the context window.
    top_results = search_index(
        group_id=group_id, 
        query_embedding=query_embeddings[0], 
        top_k=15, 
        resource_ids=resource_ids
    )
    
    if not top_results:
        raise ValueError("No indexed study materials available for this session.")
        
    chunks_text = [r["content"] for r in top_results]
    
    # 2. Build Prompt
    prompt = build_summary_prompt(chunks_text)
    
    # 3. Generate & Parse (with 1 retry)
    max_retries = 1
    for attempt in range(max_retries + 1):
        try:
            logger.info(f"Generating summary attempt {attempt + 1}")
            answer = generate_answer(prompt)
            
            # 4. Parse response
            # Sometimes LLMs wrap JSON in markdown blocks like ```json ... ```
            clean_answer = answer.strip()
            if clean_answer.startswith("```json"):
                clean_answer = clean_answer[7:]
            if clean_answer.startswith("```"):
                clean_answer = clean_answer[3:]
            if clean_answer.endswith("```"):
                clean_answer = clean_answer[:-3]
                
            clean_answer = clean_answer.strip()
            
            parsed = json.loads(clean_answer)
            
            # Basic validation
            if "executive_summary" not in parsed:
                raise ValueError("Missing executive_summary in JSON")
                
            parsed["model"] = settings.OLLAMA_MODEL
            return parsed
            
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON from LLM: {e}. Answer was: {answer}")
            if attempt == max_retries:
                raise ValueError("LLM returned malformed JSON that could not be parsed.")
        except Exception as e:
            logger.warning(f"Error during summary generation: {e}")
            if attempt == max_retries:
                raise
