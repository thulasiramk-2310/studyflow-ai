import logging
from app.embeddings.embedding_service import generate_embeddings
from app.vectorstore.faiss_store import search_index, get_group_dir
from app.prompts.chat_prompt import build_chat_prompt
from app.services.llm_service import generate_answer
from app.schemas.chat import ChatResponse, ChatCitation

logger = logging.getLogger(__name__)

def generate_rag_response(group_id: int, query: str, top_k: int = 3, history_messages: list = None) -> ChatResponse:
    """
    Orchestrates the Retrieval-Augmented Generation (RAG) pipeline.
    """
    # 1. Check if index exists (sync from S3 first if available)
    group_dir = get_group_dir(group_id)
    
    # Try to sync from S3 before checking local path
    from app.services.s3_sync import sync_group_index_from_s3
    sync_group_index_from_s3(group_id, group_dir)
    
    index_path = group_dir / "index.faiss"
    
    if not index_path.exists():
        return ChatResponse(
            success=True,
            answer="No study materials have been indexed for this group yet.",
            confidence=0.0,
            citations=[]
        )
        
    # 2. Embed the query
    query_embeddings = generate_embeddings([query])
    
    # 3. Retrieve Top K chunks
    # We use a higher top_k here just in case, but we will slice it to the top 3 best.
    results_raw = search_index(group_id, query_embeddings[0], top_k=top_k)
    
    if not results_raw:
        return ChatResponse(
            success=True,
            answer="I couldn't find this information in the uploaded study materials.",
            confidence=0.0,
            citations=[]
        )
        
    # 4. Limit to highest quality chunks (already sorted by FAISS)
    top_results = results_raw[:3]
    chunks_text = [r["content"] for r in top_results]
    
    # 5. Calculate Confidence (using the top score)
    confidence = top_results[0]["score"]
    
    # 6. Build Prompt
    prompt = build_chat_prompt(query, chunks_text, history_messages)
    
    # 7. Call LLM
    answer = generate_answer(prompt)
    
    # 8. Attach Backend-Generated Citations
    citations = []
    for r in top_results:
        citations.append(ChatCitation(
            filename=r["source"]["filename"],
            page=r["source"]["page"],
            score=r["score"]
        ))
        
    return ChatResponse(
        success=True,
        answer=answer,
        confidence=confidence,
        citations=citations
    )
