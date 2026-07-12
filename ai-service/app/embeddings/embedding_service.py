import numpy as np
from sentence_transformers import SentenceTransformer
from app.core.config import settings

# Initialize model lazily or at module level
# To avoid downloading on every startup if it's already there, sentence-transformers caches it in ~/.cache
_model = None

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _model

def generate_embeddings(texts: list[str]) -> np.ndarray:
    """
    Generate embeddings for a list of text chunks.
    """
    model = get_model()
    # encode returns a numpy array. normalize_embeddings=True produces unit length vectors (cosine similarity)
    embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    return embeddings
