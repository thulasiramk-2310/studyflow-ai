"""The planner only returns activity types study-service understands."""

from __future__ import annotations

from app.llm.provider import MockProvider, set_provider
from app.services.schedule import generate_schedule


def test_planner_maps_model_activity_types_to_the_allowed_set():
    set_provider(MockProvider(default='{"title": "Deadlocks", "duration_minutes": 60, "agenda": ['
                                      '{"title": "Intro", "activity_type": "lecture"},'
                                      '{"title": "Drill", "activity_type": "exercise"},'
                                      '{"title": "Check", "activity_type": "quiz"}]}'))
    plan = generate_schedule("ctx", 60)
    assert [a["activity_type"] for a in plan["agenda"]] == ["learning", "practice", "quiz"]


def test_planner_retries_once_when_the_model_returns_broken_json():
    provider = set_provider(MockProvider(responses=[
        '{"title": "Postgres rollout" "duration_minutes": 45}',
        '{"title": "Postgres rollout", "duration_minutes": 45, "agenda": []}',
    ]))
    plan = generate_schedule("ctx", 45)
    assert plan["title"] == "Postgres rollout"
    assert provider.call_count == 2
