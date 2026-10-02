"""One-line audience hints appended to every generation prompt."""

AUDIENCE_HINTS = {
    "student": "Audience: students in a study group. Use study-session language.",
    "professional": (
        "Audience: a workplace team. Call sessions 'meetings', write summaries as meeting minutes, "
        "and frame questions as knowledge checks."
    ),
}


def with_audience(prompt: str, audience: str | None) -> str:
    hint = AUDIENCE_HINTS.get(audience or "student", AUDIENCE_HINTS["student"])
    return f"{prompt}\n\n{hint}"
