"""Add status to resources

Revision ID: fda1b941c28b
Revises: 071d42b70262
Create Date: 2026-07-12 14:12:12.088522

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fda1b941c28b'
down_revision: Union[str, Sequence[str], None] = '071d42b70262'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('resources', sa.Column('status', sa.String(), server_default='UPLOADED', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('resources', 'status')
