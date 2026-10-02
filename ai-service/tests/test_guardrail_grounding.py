"""Guardrail 3: grounding check on RAG answers."""

from __future__ import annotations

from app.agents.nodes import rag_node
from app.agents.state import new_state
from app.guardrails.grounding import (
    UNSUPPORTED_MESSAGE,
    check_grounding,
    enforce_grounding,
)
from app.llm.provider import MockProvider

CHUNK = "Round Robin is a CPU scheduling algorithm that assigns a fixed time slice to each process in turn."


def test_verbatim_sentence_is_grounded():
    result = check_grounding("Round Robin is a CPU scheduling algorithm.", [CHUNK])

    assert result.grounded is True


def test_paraphrase_with_enough_overlap_is_grounded():
    result = check_grounding("Round Robin assigns a fixed time slice to each process.", [CHUNK])

    assert result.grounded is True
    assert result.supported_sentences == 1


def test_unrelated_answer_is_not_grounded():
    result = check_grounding("The mitochondria is the powerhouse of the cell.", [CHUNK])

    assert result.grounded is False


def test_a_fabricated_sentence_fails_the_whole_answer():
    """A sourced claim must not launder an invented one."""
    answer = "Round Robin assigns a fixed time slice to each process. It was invented in Paris in 1802."

    result = check_grounding(answer, [CHUNK])
    assert result.grounded is False
    assert (result.supported_sentences, result.checked_sentences) == (1, 2)


def test_every_supported_sentence_passes():
    answer = "Round Robin assigns a fixed time slice to each process. Each process runs in turn."

    assert check_grounding(answer, [CHUNK]).grounded is True


def test_enforce_replaces_an_answer_with_one_invented_claim():
    answer = "Round Robin assigns a fixed time slice to each process. It was invented in Paris in 1802."

    replaced, _ = enforce_grounding(answer, [CHUNK])
    assert replaced == UNSUPPORTED_MESSAGE


def test_empty_chunks_are_never_grounded():
    assert check_grounding("Anything at all here.", []).grounded is False


def test_empty_answer_is_not_grounded():
    assert check_grounding("", [CHUNK]).grounded is False


def test_enforce_replaces_an_unsupported_answer():
    answer, result = enforce_grounding("Paris is the capital of France.", [CHUNK])

    assert answer == UNSUPPORTED_MESSAGE
    assert result.grounded is False


def test_enforce_keeps_a_supported_answer():
    original = "Round Robin assigns a fixed time slice to each process."

    answer, result = enforce_grounding(original, [CHUNK])

    assert answer == original
    assert result.grounded is True


def test_enforce_passes_through_exempt_answers():
    """The 'not in your notes' reply is not a claim about the notes."""
    exempt = "I couldn't find this information in the uploaded study materials."

    answer, _ = enforce_grounding(exempt, [CHUNK], exempt=(exempt,))

    assert answer == exempt


def test_enforce_leaves_answers_too_short_to_check():
    answer, result = enforce_grounding("Yes.", [CHUNK])

    assert answer == "Yes."
    assert result.checked_sentences == 0


def test_rag_node_replaces_a_hallucinated_answer(stub_retriever, chunk):
    """End to end: the model invents an answer, the guardrail catches it."""
    provider = MockProvider(responses=["The Treaty of Versailles was signed in 1919."])
    retriever = stub_retriever([chunk(CHUNK)])

    update = rag_node(
        new_state(group_id=1, message="What is Round Robin?"),
        provider=provider,
        retriever=retriever,
    )

    assert update["answer"] == UNSUPPORTED_MESSAGE
    assert update["grounded"] is False
    # No citations for an answer nothing supports.
    assert update["citations"] == []
    assert update["confidence"] == 0.0


def test_rag_node_keeps_a_grounded_answer(stub_retriever, chunk):
    provider = MockProvider(responses=["Round Robin assigns a fixed time slice to each process."])
    retriever = stub_retriever([chunk(CHUNK, "os.pdf", page=2, score=0.77)])

    update = rag_node(
        new_state(group_id=1, message="What is Round Robin?"),
        provider=provider,
        retriever=retriever,
    )

    assert update["answer"] == "Round Robin assigns a fixed time slice to each process."
    assert update["grounded"] is True
    assert update["citations"] == [{"filename": "os.pdf", "page": 2, "score": 0.77}]


def test_rag_node_drops_citations_for_an_answer_too_short_to_check(stub_retriever, chunk):
    """Citations imply the answer was checked against them; an unchecked answer gets none."""
    provider = MockProvider(responses=["Yes."])
    retriever = stub_retriever([chunk(CHUNK, "os.pdf", page=2, score=0.77)])

    update = rag_node(
        new_state(group_id=1, message="Is Round Robin preemptive?"),
        provider=provider,
        retriever=retriever,
    )

    assert update["answer"] == "Yes."
    assert update["grounded"] is False
    assert update["citations"] == []
