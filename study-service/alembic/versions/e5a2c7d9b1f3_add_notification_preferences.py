"""add notification preferences

Revision ID: e5a2c7d9b1f3
Revises: d4f1b2c3a5e6
Create Date: 2026-10-02 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5a2c7d9b1f3'
down_revision: Union[str, Sequence[str], None] = 'd4f1b2c3a5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "notification_preferences",
        sa.Column("user_id", sa.Integer(), primary_key=True),
        sa.Column("sessions", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("resources", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("ai_results", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("members", sa.Boolean(), nullable=False, server_default=sa.true()),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("notification_preferences")
