"""add started_at lease to generation jobs

Revision ID: c3e9a1f4d2b7
Revises: 11ccc184c1b7
Create Date: 2026-10-02 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3e9a1f4d2b7'
down_revision: Union[str, Sequence[str], None] = '11ccc184c1b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLES = ("session_summaries", "quizzes", "flashcard_decks")


def upgrade() -> None:
    """Upgrade schema."""
    for table in _TABLES:
        op.add_column(table, sa.Column("started_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    for table in _TABLES:
        op.drop_column(table, "started_at")
