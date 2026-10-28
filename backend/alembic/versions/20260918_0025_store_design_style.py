"""Add stores.design_style for public storefront skin (independent of panel)."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260918_0025"
down_revision = "20260918_0024"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "stores",
        sa.Column("design_style", sa.String(length=20), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("stores", "design_style")
