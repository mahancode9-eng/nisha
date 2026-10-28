"""Phase 6a: Nisha branding toggle, customer tags."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261029_0036"
down_revision = "20261029_0035"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "stores",
        sa.Column(
            "hide_nisha_branding",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.create_table(
        "store_customer_tags",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "store_id",
            sa.Integer(),
            sa.ForeignKey("stores.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("customer_key", sa.String(length=80), nullable=False),
        sa.Column("tag", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("store_id", "customer_key", "tag", name="uq_store_customer_tags"),
    )
    op.create_index("ix_store_customer_tags_store_id", "store_customer_tags", ["store_id"])
    op.create_index("ix_store_customer_tags_customer_key", "store_customer_tags", ["customer_key"])


def downgrade() -> None:
    op.drop_index("ix_store_customer_tags_customer_key", table_name="store_customer_tags")
    op.drop_index("ix_store_customer_tags_store_id", table_name="store_customer_tags")
    op.drop_table("store_customer_tags")
    op.drop_column("stores", "hide_nisha_branding")
