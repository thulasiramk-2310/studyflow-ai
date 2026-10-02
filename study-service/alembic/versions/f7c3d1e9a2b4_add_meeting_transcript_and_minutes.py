"""add meeting transcript and minutes

Revision ID: f7c3d1e9a2b4
Revises: e5a2c7d9b1f3
Create Date: 2026-10-03 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f7c3d1e9a2b4'
down_revision: Union[str, Sequence[str], None] = 'e5a2c7d9b1f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("study_sessions", sa.Column("meeting_transcript", sa.Text(), nullable=True))
    op.add_column("study_sessions", sa.Column("meeting_transcript_source", sa.String(20), nullable=True))
    op.add_column("study_sessions", sa.Column("meeting_transcript_by", sa.Integer(), nullable=True))
    op.add_column("study_sessions", sa.Column("meeting_transcript_at", sa.DateTime(), nullable=True))
    op.add_column("session_summaries", sa.Column("decisions", sa.JSON(), nullable=True))
    op.add_column("session_summaries", sa.Column("open_questions", sa.JSON(), nullable=True))
    op.add_column("session_summaries", sa.Column("source", sa.String(20), nullable=True))
    op.add_column("session_summaries", sa.Column("source_by", sa.Integer(), nullable=True))
    op.add_column("session_summaries", sa.Column("review_status", sa.String(20), nullable=True))
    op.add_column("session_summaries", sa.Column("approved_by", sa.Integer(), nullable=True))
    op.add_column("session_summaries", sa.Column("approved_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    for col in ("approved_at", "approved_by", "review_status", "source_by", "source", "open_questions", "decisions"):
        op.drop_column("session_summaries", col)
    for col in ("meeting_transcript_at", "meeting_transcript_by", "meeting_transcript_source", "meeting_transcript"):
        op.drop_column("study_sessions", col)
