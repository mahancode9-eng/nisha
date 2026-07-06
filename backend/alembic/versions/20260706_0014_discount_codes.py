"""Discount codes and order discount fields (roadmap task 17).

Revision ID: 20260706_0014
Revises: 20260706_0013
Create Date: 2026-07-06
"""

import sqlalchemy as sa
from alembic import op

revision = "20260706_0014"
down_revision = "20260706_0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "discount_codes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "store_id",
            sa.Integer(),
            sa.ForeignKey("stores.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("discount_type", sa.String(length=20), nullable=False),
        sa.Column("percent_off", sa.Numeric(5, 2), nullable=True),
        sa.Column("amount_off", sa.Numeric(12, 2), nullable=True),
        sa.Column("min_order_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("max_uses", sa.Integer(), nullable=True),
        sa.Column("used_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
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
        sa.UniqueConstraint("store_id", "code", name="uq_discount_codes_store_code"),
    )
    op.create_index("ix_discount_codes_store_id", "discount_codes", ["store_id"])
    op.create_index("ix_discount_codes_code", "discount_codes", ["code"])

    op.add_column("orders", sa.Column("discount_code", sa.String(length=50), nullable=True))
    op.add_column(
        "orders",
        sa.Column("discount_amount", sa.Numeric(12, 2), server_default="0", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("orders", "discount_amount")
    op.drop_column("orders", "discount_code")
    op.drop_index("ix_discount_codes_code", table_name="discount_codes")
    op.drop_index("ix_discount_codes_store_id", table_name="discount_codes")
    op.drop_table("discount_codes")
