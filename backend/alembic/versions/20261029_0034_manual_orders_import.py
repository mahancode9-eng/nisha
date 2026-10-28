"""Add orders.is_manual and stores.instagram_import_count."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261029_0034"
down_revision = "20261029_0033"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("is_manual", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "stores",
        sa.Column(
            "instagram_import_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )


def downgrade() -> None:
    op.drop_column("stores", "instagram_import_count")
    op.drop_column("orders", "is_manual")
