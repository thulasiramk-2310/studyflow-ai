import logging

from app.llm.provider import get_provider

logger = logging.getLogger(__name__)


def generate_answer(prompt: str) -> str:
    """
    Sends a stateless prompt to the configured LLM provider and returns the answer.

    The HTTP call itself lives in `app.llm.provider.GroqProvider`. Routing every
    caller through the provider factory means tests and offline evals swap in
    `MockProvider` without patching this module.
    """
    return get_provider().complete(prompt)
