"""add audience to groups and generated artifacts

Revision ID: d4f1b2c3a5e6
Revises: c3e9a1f4d2b7
Create Date: 2026-10-02 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4f1b2c3a5e6'
down_revision: Union[str, Sequence[str], None] = 'c3e9a1f4d2b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_ARTIFACTS = ("session_summaries", "quizzes", "flashcard_decks")


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("study_groups", sa.Column("audience", sa.String(20), nullable=False, server_default="student"))
    op.create_check_constraint("study_groups_audience_check", "study_groups", "audience IN ('student', 'professional')")
    for table in _ARTIFACTS:
        op.add_column(table, sa.Column("audience", sa.String(20), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    for table in _ARTIFACTS:
        op.drop_column(table, "audience")
    op.drop_constraint("study_groups_audience_check", "study_groups")
    op.drop_column("study_groups", "audience")
