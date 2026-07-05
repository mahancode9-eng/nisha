"""customer_portal

Revision ID: 20260610_0003
Revises: 20260531_0002
Create Date: 2026-06-10
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260610_0003"
down_revision: Union[str, None] = "20260531_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("customer_accounts", sa.Column("postal_code", sa.String(length=50), nullable=True))

    op.add_column(
        "orders",
        sa.Column("customer_id", sa.Integer(), nullable=True),
    )
    op.create_index(op.f("ix_orders_customer_id"), "orders", ["customer_id"], unique=False)
    op.create_foreign_key(
        "fk_orders_customer_id_customer_accounts",
        "orders",
        "customer_accounts",
        ["customer_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "customer_addresses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=True),
        sa.Column("recipient_name", sa.String(length=255), nullable=False),
        sa.Column("recipient_phone", sa.String(length=50), nullable=False),
        sa.Column("postal_code", sa.String(length=50), nullable=True),
        sa.Column("address_line1", sa.Text(), nullable=False),
        sa.Column("address_line2", sa.Text(), nullable=True),
        sa.Column("city", sa.String(length=255), nullable=True),
        sa.Column("province", sa.String(length=255), nullable=True),
        sa.Column("country", sa.String(length=100), nullable=True),
        sa.Column("is_default", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customer_accounts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_customer_addresses_customer_id"), "customer_addresses", ["customer_id"], unique=False)

    op.create_table(
        "customer_password_recoveries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("login_identifier", sa.String(length=255), nullable=False),
        sa.Column(
            "channel",
            sa.Enum("EMAIL", "SMS", name="recoverychannel", native_enum=False),
            nullable=False,
        ),
        sa.Column("code_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customer_accounts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_customer_password_recoveries_customer_id"),
        "customer_password_recoveries",
        ["customer_id"],
        unique=False,
    )

    op.create_table(
        "order_claims",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("invoice_code", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customer_accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id", name="uq_order_claims_order_id"),
    )
    op.create_index(op.f("ix_order_claims_customer_id"), "order_claims", ["customer_id"], unique=False)
    op.create_index(op.f("ix_order_claims_order_id"), "order_claims", ["order_id"], unique=False)

    op.create_table(
        "customer_order_receipts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("RECEIVED", "NOT_RECEIVED", name="customerreceiptstatus", native_enum=False),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customer_accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id", name="uq_customer_order_receipts_order_id"),
    )
    op.create_index(
        op.f("ix_customer_order_receipts_customer_id"),
        "customer_order_receipts",
        ["customer_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_customer_order_receipts_order_id"),
        "customer_order_receipts",
        ["order_id"],
        unique=False,
    )

    op.create_table(
        "order_complaints",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=100), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("OPEN", "IN_REVIEW", "RESOLVED", name="complaintstatus", native_enum=False),
            server_default="OPEN",
            nullable=False,
        ),
        sa.Column("seller_notified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("admin_notified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customer_accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id", name="uq_order_complaints_order_id"),
    )
    op.create_index(op.f("ix_order_complaints_customer_id"), "order_complaints", ["customer_id"], unique=False)
    op.create_index(op.f("ix_order_complaints_order_id"), "order_complaints", ["order_id"], unique=False)

    op.create_table(
        "customer_reviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("store_id", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customer_accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id", name="uq_customer_reviews_order_id"),
    )
    op.create_index(op.f("ix_customer_reviews_customer_id"), "customer_reviews", ["customer_id"], unique=False)
    op.create_index(op.f("ix_customer_reviews_order_id"), "customer_reviews", ["order_id"], unique=False)
    op.create_index(op.f("ix_customer_reviews_store_id"), "customer_reviews", ["store_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_customer_reviews_store_id"), table_name="customer_reviews")
    op.drop_index(op.f("ix_customer_reviews_order_id"), table_name="customer_reviews")
    op.drop_index(op.f("ix_customer_reviews_customer_id"), table_name="customer_reviews")
    op.drop_table("customer_reviews")

    op.drop_index(op.f("ix_order_complaints_order_id"), table_name="order_complaints")
    op.drop_index(op.f("ix_order_complaints_customer_id"), table_name="order_complaints")
    op.drop_table("order_complaints")

    op.drop_index(op.f("ix_customer_order_receipts_order_id"), table_name="customer_order_receipts")
    op.drop_index(op.f("ix_customer_order_receipts_customer_id"), table_name="customer_order_receipts")
    op.drop_table("customer_order_receipts")

    op.drop_index(op.f("ix_order_claims_order_id"), table_name="order_claims")
    op.drop_index(op.f("ix_order_claims_customer_id"), table_name="order_claims")
    op.drop_table("order_claims")

    op.drop_index(op.f("ix_customer_password_recoveries_customer_id"), table_name="customer_password_recoveries")
    op.drop_table("customer_password_recoveries")

    op.drop_index(op.f("ix_customer_addresses_customer_id"), table_name="customer_addresses")
    op.drop_table("customer_addresses")

    op.drop_index(op.f("ix_orders_customer_id"), table_name="orders")
    op.drop_constraint("fk_orders_customer_id_customer_accounts", "orders", type_="foreignkey")
    op.drop_column("orders", "customer_id")

    op.drop_column("customer_accounts", "postal_code")
