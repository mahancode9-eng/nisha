"""Create short_links for product/store share URLs."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261029_0032"
down_revision = "20261029_0031"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "short_links",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(length=16), nullable=False),
        sa.Column("target_path", sa.String(length=500), nullable=False),
        sa.Column("store_id", sa.Integer(), sa.ForeignKey("stores.id", ondelete="CASCADE"), nullable=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=True),
        sa.Column("hit_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("code", name="uq_short_links_code"),
    )
    op.create_index("ix_short_links_code", "short_links", ["code"])
    op.create_index("ix_short_links_store_id", "short_links", ["store_id"])
    op.create_index("ix_short_links_product_id", "short_links", ["product_id"])


def downgrade() -> None:
    op.drop_index("ix_short_links_product_id", table_name="short_links")
    op.drop_index("ix_short_links_store_id", table_name="short_links")
    op.drop_index("ix_short_links_code", table_name="short_links")
    op.drop_table("short_links")
