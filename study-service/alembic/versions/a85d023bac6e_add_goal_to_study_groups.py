"""add_goal_to_study_groups

Revision ID: a85d023bac6e
Revises: 661ad5a26d29
Create Date: 2026-07-19 14:30:55.856807

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a85d023bac6e'
down_revision: Union[str, Sequence[str], None] = '661ad5a26d29'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('study_groups', sa.Column('goal', sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('study_groups', 'goal')
