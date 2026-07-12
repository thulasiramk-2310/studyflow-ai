from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.config import settings

def chunk_text(text: str) -> list[str]:
    """
    Split text into chunks using recursive character splitting.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", " ", ""]
    )
    return splitter.split_text(text)
