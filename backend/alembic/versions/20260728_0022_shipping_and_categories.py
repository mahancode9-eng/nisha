"""Add shipping costs and per-store product categories."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260728_0022"
down_revision = "20260725_0021"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "stores",
        sa.Column(
            "default_shipping_cost",
            sa.Numeric(12, 2),
            server_default="0",
            nullable=False,
        ),
    )
    op.add_column(
        "stores",
        sa.Column("free_shipping_min_subtotal", sa.Numeric(12, 2), nullable=True),
    )

    op.create_table(
        "product_categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("store_id", sa.Integer(), sa.ForeignKey("stores.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("store_id", "slug", name="uq_product_categories_store_slug"),
    )
    op.create_index("ix_product_categories_store_id", "product_categories", ["store_id"])

    op.add_column(
        "products",
        sa.Column(
            "category_id",
            sa.Integer(),
            sa.ForeignKey("product_categories.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column("products", sa.Column("shipping_cost", sa.Numeric(12, 2), nullable=True))
    op.create_index("ix_products_category_id", "products", ["category_id"])

    op.add_column(
        "orders",
        sa.Column(
            "shipping_amount",
            sa.Numeric(12, 2),
            server_default="0",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("orders", "shipping_amount")
    op.drop_index("ix_products_category_id", table_name="products")
    op.drop_column("products", "shipping_cost")
    op.drop_column("products", "category_id")
    op.drop_index("ix_product_categories_store_id", table_name="product_categories")
    op.drop_table("product_categories")
    op.drop_column("stores", "free_shipping_min_subtotal")
    op.drop_column("stores", "default_shipping_cost")
