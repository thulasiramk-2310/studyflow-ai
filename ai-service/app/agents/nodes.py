"""The four agent nodes.

Every node takes an `AgentState` and returns a partial state update, the shape
LangGraph expects. Each one increments `steps` so the graph-level cap counts
real work, not edges.

Dependencies (LLM provider, retriever, index lister, scheduler) are passed in
by `build_graph`, so tests run the nodes with stubs and no network, no FAISS
index and no Groq key.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from app.agents.intent import CLARIFY_QUESTION, classify
from app.agents.state import MAX_STEPS, AgentState
from app.guardrails.grounding import UNSUPPORTED_MESSAGE, enforce_grounding
from app.guardrails.pii import mask_all
from app.prompts.agent_prompt import NOT_IN_NOTES, build_agent_prompt
from app.prompts.audience import with_audience

logger = logging.getLogger(__name__)

NO_INDEX_MESSAGE = "No study materials have been indexed for this group yet."

# Minimum top-1 cosine score required before the RAGAgent will answer from a
# retrieved chunk. Measured on all-MiniLM-L6-v2: on-topic questions score
# 0.41-0.72 against matching notes, while off-topic technical questions land in
# the 0.20-0.40 band, which is why `search_index`'s 0.2 threshold is too low to
# decide whether a question is answerable.
#
# Known gap: "page fault" (score 0.407) falls just under the 0.45 gate because
# CHUNK_SIZE=1000 dilutes it with adjacent memory-management content. See
# follow-up: smaller chunk size to widen the score gap.
MIN_RELEVANCE = 0.45


def _bump(state: AgentState, label: str) -> dict[str, Any]:
    """Common per-node bookkeeping: step counter plus a readable trace."""
    steps = state.get("steps", 0) + 1
    trace = list(state.get("trace", []))
    trace.append(label)
    return {"steps": steps, "trace": trace}


def coordinator_node(state: AgentState, provider=None) -> dict[str, Any]:
    """Entry node. Picks which agent handles the message.

    Runs once per hop: on re-entry it pops the next queued intent instead of
    reclassifying, so a multi-intent message walks its agents in order.
    """
    update = _bump(state, "coordinator")

    pending = list(state.get("pending_intents", []))
    if pending:
        next_intent = pending.pop(0)
        update.update({"intent": next_intent, "pending_intents": pending})
        return update

    intents = classify(state.get("message", ""), provider=provider)

    if not intents:
        update.update(
            {
                "intent": "clarify",
                "pending_intents": [],
                "needs_clarification": True,
                "answer": CLARIFY_QUESTION,
                "citations": [],
                "confidence": 0.0,
            }
        )
        return update

    update.update({"intent": intents[0], "pending_intents": intents[1:]})
    return update


def resource_node(state: AgentState, index_lister=None) -> dict[str, Any]:
    """ResourceAgent: reports what is indexed for the group.

    Indexing itself is the existing background pipeline in
    `services/indexing.py`; this node answers questions about its output.
    """
    update = _bump(state, "resource")
    group_id = state.get("group_id")

    try:
        documents = index_lister(group_id) if index_lister else []
    except Exception as exc:
        logger.error(f"ResourceAgent failed to list index for group {group_id}: {exc}")
        documents = []

    if not documents:
        update.update(
            {"answer": NO_INDEX_MESSAGE, "citations": [], "confidence": 0.0, "documents": []}
        )
        return update

    total_chunks = sum(doc.get("chunks", 0) for doc in documents)
    lines = [f"- {doc['filename']} ({doc.get('chunks', 0)} indexed sections)" for doc in documents]
    answer = (
        f"Your notes contain {len(documents)} indexed document"
        f"{'s' if len(documents) != 1 else ''} ({total_chunks} sections):\n" + "\n".join(lines)
    )

    update.update({"answer": answer, "citations": [], "confidence": 1.0, "documents": documents})
    return update


def rag_node(
    state: AgentState,
    provider=None,
    retriever=None,
    top_k: int = 3,
    min_relevance: float = MIN_RELEVANCE,
) -> dict[str, Any]:
    """RAGAgent: answers from the group's notes, with citations.

    Returns the "not in your notes" answer whenever retrieval comes back empty
    or the best match is too weak, rather than letting the model answer from
    its own knowledge.
    """
    update = _bump(state, "rag")
    group_id = state.get("group_id")
    query = state.get("message", "")

    try:
        results = retriever(group_id, query, top_k) if retriever else []
    except Exception as exc:
        logger.error(f"RAGAgent retrieval failed for group {group_id}: {exc}")
        results = []

    if not results:
        update.update({"answer": NOT_IN_NOTES, "citations": [], "confidence": 0.0})
        return update

    # Relevance gate. `search_index` keeps its own 0.2 threshold so the
    # generation endpoints (/summary, /quiz, /flashcards) still retrieve
    # broadly, but answering a question needs a genuinely close match:
    # all-MiniLM-L6-v2 scores unrelated technical text in the 0.2-0.4 band, so
    # 0.2 alone lets an off-topic question pull in unrelated notes.
    top_score = float(results[0]["score"])
    if top_score < min_relevance:
        logger.info(
            f"RAGAgent rejected weak match | group={group_id} "
            f"top_score={top_score:.3f} min={min_relevance}"
        )
        update.update({"answer": NOT_IN_NOTES, "citations": [], "confidence": 0.0})
        return update

    top_results = results[:top_k]
    # Chunks come from user-uploaded PDFs: mask PII before they reach the LLM.
    chunks, _ = mask_all([r["content"] for r in top_results])
    prompt = with_audience(build_agent_prompt(query, chunks, state.get("history")), state.get("audience"))

    raw_answer = (provider.complete(prompt) if provider else "") or ""

    # Grounding: the answer must be supported by what was actually retrieved.
    answer, grounding = enforce_grounding(
        raw_answer.strip(),
        chunks,
        exempt=(NOT_IN_NOTES, ""),
    )

    citations = [
        {
            "filename": r["source"]["filename"],
            "page": r["source"]["page"],
            "score": r["score"],
        }
        for r in top_results
    ]

    final_answer = answer.strip() or NOT_IN_NOTES
    # An unsupported or empty answer carries no citations - they would imply a
    # source for text that no source backs.
    if final_answer in (NOT_IN_NOTES, UNSUPPORTED_MESSAGE):
        citations = []
    # Too short to check (e.g. "Yes."): show it, but don't present sources as proof.
    elif grounding.checked_sentences == 0:
        citations = []

    update.update(
        {
            "answer": final_answer,
            "citations": citations,
            "confidence": float(top_results[0]["score"]) if citations else 0.0,
            "retrieved_chunks": chunks,
            "grounded": grounding.grounded,
        }
    )
    return update


def scheduler_node(state: AgentState, scheduler=None) -> dict[str, Any]:
    """SchedulerAgent: builds a study plan. Stateless by design - the caller
    (study-service) persists the returned plan, exactly as today."""
    update = _bump(state, "scheduler")

    context = state.get("context") or state.get("message", "")
    if state.get("audience") == "professional":  # student plans keep the original context
        context = with_audience(context, "professional")
    target_duration = state.get("target_duration", 60)

    try:
        plan = scheduler(context, target_duration) if scheduler else None
    except Exception as exc:
        logger.error(f"SchedulerAgent failed: {exc}")
        plan = None

    if not plan:
        update.update(
            {
                "answer": "I could not build a study plan right now.",
                "plan": None,
                "citations": [],
                "confidence": 0.0,
            }
        )
        return update

    title = plan.get("title", "Study plan")
    duration = plan.get("duration_minutes", target_duration)
    update.update(
        {
            "answer": f"Proposed session: {title} ({duration} minutes).",
            "plan": plan,
            "citations": [],
            "confidence": float(plan.get("confidence", 0.0) or 0.0),
        }
    )
    return update


def route_from_coordinator(state: AgentState) -> str:
    """Conditional edge out of the coordinator."""
    if state.get("steps", 0) >= MAX_STEPS:
        return "halt"
    intent = state.get("intent", "")
    if intent in ("resource", "rag", "scheduler"):
        return intent
    return "halt"


def route_after_agent(state: AgentState) -> str:
    """Conditional edge out of every agent node.

    Returns to the coordinator only while queued intents remain and the step
    budget allows another hop.
    """
    if state.get("steps", 0) >= MAX_STEPS:
        return "halt"
    if state.get("pending_intents"):
        return "coordinator"
    return "halt"
