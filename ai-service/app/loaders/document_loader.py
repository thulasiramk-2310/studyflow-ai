import fitz  # PyMuPDF
import logging

logger = logging.getLogger(__name__)

def extract_text_from_document(file_path: str) -> list[dict]:
    """
    Extract text from a document. Currently supports PDF.
    Returns a list of dictionaries: [{"page_num": int, "text": str}]
    """
    logger.info(f"Extracting text from {file_path}")
    pages = []
    try:
        # We can add more extensions here later (.docx, .pptx, etc)
        if file_path.lower().endswith(".pdf"):
            doc = fitz.open(file_path)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                pages.append({
                    "page_num": page_num + 1,
                    "text": page.get_text()
                })
            doc.close()
        else:
            raise ValueError(f"Unsupported file type for {file_path}")
    except Exception as e:
        logger.error(f"Error extracting text from {file_path}: {e}")
        raise e
        
    return pages
