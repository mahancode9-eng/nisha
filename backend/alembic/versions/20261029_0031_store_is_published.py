"""Add stores.is_published for draft vs live storefronts."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261029_0031"
down_revision = "20261028_0030"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "stores",
        sa.Column(
            "is_published",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    # Existing live stores stay public; only brand-new stores start as draft.
    op.execute(sa.text("UPDATE stores SET is_published = true WHERE is_active = true"))


def downgrade() -> None:
    op.drop_column("stores", "is_published")
