"""Product variants (roadmap task 16)

Revision ID: 20260706_0015
Revises: 20260706_0014
Create Date: 2026-07-06
"""

import sqlalchemy as sa
from alembic import op

revision = "20260706_0015"
down_revision = "20260706_0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "product_variants",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "product_id",
            sa.Integer(),
            sa.ForeignKey("products.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("price_override", sa.Numeric(12, 2), nullable=True),
        sa.Column("stock_quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
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
    )
    op.create_index(
        "ix_product_variants_product_id", "product_variants", ["product_id"]
    )

    op.add_column(
        "order_items",
        sa.Column(
            "variant_id",
            sa.Integer(),
            sa.ForeignKey("product_variants.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_order_items_variant_id", "order_items", ["variant_id"])
    op.add_column(
        "order_items",
        sa.Column("variant_name_snapshot", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_index("ix_order_items_variant_id", table_name="order_items")
    op.drop_column("order_items", "variant_name_snapshot")
    op.drop_column("order_items", "variant_id")
    op.drop_index("ix_product_variants_product_id", table_name="product_variants")
    op.drop_table("product_variants")
