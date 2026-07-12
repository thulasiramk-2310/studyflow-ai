from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.config import settings

def chunk_text(pages: list[dict]) -> list[dict]:
    """
    Split text into chunks using recursive character splitting.
    Maintains the page number for each chunk.
    Returns a list of dicts: [{"page_num": int, "text": str}]
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", " ", ""]
    )
    
    chunks = []
    for page in pages:
        page_chunks = splitter.split_text(page["text"])
        for chunk_text in page_chunks:
            # Avoid empty chunks
            if chunk_text.strip():
                chunks.append({
                    "page_num": page["page_num"],
                    "text": chunk_text
                })
            
    return chunks
