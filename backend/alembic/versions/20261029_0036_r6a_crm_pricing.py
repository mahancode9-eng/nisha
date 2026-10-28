"""R6a: customer tags, sales report fields, compare_at_price."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261029_0036"
down_revision = "20261029_0035"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("compare_at_price", sa.Numeric(12, 2), nullable=True),
    )

    op.create_table(
        "customer_tags",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "store_id",
            sa.Integer(),
            sa.ForeignKey("stores.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("color", sa.String(length=20), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("store_id", "name", name="uq_customer_tags_store_name"),
    )

    op.create_table(
        "customer_tag_links",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "store_id",
            sa.Integer(),
            sa.ForeignKey("stores.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("customer_key", sa.String(length=120), nullable=False, index=True),
        sa.Column(
            "tag_id",
            sa.Integer(),
            sa.ForeignKey("customer_tags.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "store_id",
            "customer_key",
            "tag_id",
            name="uq_customer_tag_links_store_key_tag",
        ),
    )


def downgrade() -> None:
    op.drop_table("customer_tag_links")
    op.drop_table("customer_tags")
    op.drop_column("products", "compare_at_price")
