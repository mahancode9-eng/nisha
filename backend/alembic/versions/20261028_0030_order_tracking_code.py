"""Add postal tracking_code on orders."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261028_0030"
down_revision = "20261025_0029"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("tracking_code", sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("orders", "tracking_code")
