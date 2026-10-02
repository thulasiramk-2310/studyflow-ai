import logging

from app.llm.provider import get_provider
from app.guardrails.pii import mask_pii

logger = logging.getLogger(__name__)


def generate_answer(prompt: str) -> str:
    """
    Sends a stateless prompt to the configured LLM provider and returns the answer.

    The HTTP call itself lives in `app.llm.provider.GroqProvider`. Routing every
    caller through the provider factory means tests and offline evals swap in
    `MockProvider` without patching this module.
    """
    # Single choke point for every LLM call (chat, summaries, quizzes, flashcards,
    # schedules, titles): uploaded notes can carry contact details and ID numbers.
    return get_provider().complete(mask_pii(prompt).text)
