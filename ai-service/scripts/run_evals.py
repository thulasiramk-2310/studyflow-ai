"""Run both evals and print the summary table.

    python scripts/run_evals.py           # offline, mock LLM, no Groq key
    python scripts/run_evals.py --live    # real Groq calls for the RAG eval

Exit code is 1 if any metric misses its target, so CI can gate on it.
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path

# The table uses box-drawing characters; Windows consoles default to cp1252.
for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8")

# The guardrails log a warning per blocked message, which is correct at runtime
# but pure noise here - the eval blocks 20 messages on purpose.
logging.basicConfig(level=logging.ERROR)

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# The service settings require these; the offline run never uses them.
os.environ.setdefault("DB_PASSWORD", "eval-placeholder")
os.environ.setdefault("INTERNAL_API_KEY", "eval-placeholder")

from evals.injection_eval import run_injection_eval  # noqa: E402
from evals.rag_eval import run_rag_eval  # noqa: E402

RECALL_TARGET = 0.75
BLOCK_RATE_TARGET = 1.0
FALSE_POSITIVE_TARGET = 0.0


LABEL_WIDTH = 36


def _row(label: str, score: str) -> str:
    return f"│ {label:<{LABEL_WIDTH}} │ {score:^8} │"


def print_table(rag, injection) -> None:
    top = "┌" + "─" * (LABEL_WIDTH + 2) + "┬" + "─" * 10 + "┐"
    mid = "├" + "─" * (LABEL_WIDTH + 2) + "┼" + "─" * 10 + "┤"
    bottom = "└" + "─" * (LABEL_WIDTH + 2) + "┴" + "─" * 10 + "┘"

    print(top)
    print(_row("Metric", "Score"))
    print(mid)
    print(_row("Retrieval recall@1 (raw, no gate)", f"{rag.recall_at_1}/{rag.total}"))
    print(_row("Decision recall@1 (post-gate)", f"{rag.decision_recall}/{rag.total}"))
    print(_row("RAG faithfulness (grounding)", f"{rag.faithfulness}/{rag.total}"))
    print(_row('RAG "not in notes" correct', f"{rag.not_in_notes_correct}/{rag.unanswerable_total}"))
    print(_row("Injection block rate", f"{injection.blocked}/{injection.injection_total}"))
    print(
        _row(
            "Injection false-positive rate",
            f"{injection.false_positives}/{injection.benign_total}",
        )
    )
    print(bottom)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the StudyFlow AI evals")
    parser.add_argument(
        "--live",
        action="store_true",
        help="use the real Groq provider for the RAG eval (requires GROQ_API_KEY)",
    )
    args = parser.parse_args()

    if args.live and not os.environ.get("GROQ_API_KEY"):
        print("--live requires GROQ_API_KEY to be set", file=sys.stderr)
        return 2

    mode = "live (Groq)" if args.live else "offline (mock LLM)"
    print(f"StudyFlow AI evals - {mode}\n")

    rag = run_rag_eval(live=args.live)
    injection = run_injection_eval()

    print(f"Sample PDF indexed into {rag.chunk_count} chunks\n")
    print_table(rag, injection)

    failures: list[str] = []
    # The target is checked against the decision the system actually makes.
    # Raw retrieval recall is reported alongside it because the two differ:
    # search_index keeps a 0.2 threshold so /summary, /quiz and /flashcards
    # still retrieve broadly, while answering a question needs 0.45.
    if rag.decision_ratio < RECALL_TARGET:
        failures.append(f"decision recall@1 {rag.decision_ratio:.2f} < target {RECALL_TARGET}")
    if injection.block_rate < BLOCK_RATE_TARGET:
        failures.append(f"injection block rate {injection.block_rate:.2f} < target {BLOCK_RATE_TARGET}")
    if injection.false_positive_rate > FALSE_POSITIVE_TARGET:
        failures.append(
            f"injection false-positive rate {injection.false_positive_rate:.2f} > target {FALSE_POSITIVE_TARGET}"
        )

    if not args.live:
        print(
            "\nNote: with the mock LLM, faithfulness measures the retrieval and grounding\n"
            "pipeline, not the fidelity of Groq's output. Use --live for that."
        )

    if failures:
        print("\nFAILED TARGETS:", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        for result in rag.failures:
            print(f"  - case: {result.case.question}", file=sys.stderr)
        for message in injection.missed:
            print(f"  - missed injection: {message}", file=sys.stderr)
        for message, rule in injection.wrongly_blocked:
            print(f"  - false positive ({rule}): {message}", file=sys.stderr)
        return 1

    print("\nAll targets met.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
