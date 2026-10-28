"""R5: receipt fields, SMS quota, shipping methods, reminder config."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261029_0035"
down_revision = "20261029_0034"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "payment_methods",
        sa.Column("bank_name", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "payment_proofs",
        sa.Column("content_hash", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "payment_proofs",
        sa.Column("payer_card_last4", sa.String(length=4), nullable=True),
    )
    op.add_column(
        "payment_proofs",
        sa.Column("transfer_tracking", sa.String(length=100), nullable=True),
    )
    op.create_index(
        "ix_payment_proofs_content_hash",
        "payment_proofs",
        ["content_hash"],
    )

    op.add_column(
        "stores",
        sa.Column("payment_reminder_minutes", sa.Integer(), nullable=True),
    )
    op.add_column(
        "stores",
        sa.Column("sms_quota_month", sa.String(length=7), nullable=True),
    )
    op.add_column(
        "stores",
        sa.Column(
            "sms_sent_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )

    op.create_table(
        "shipping_methods",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "store_id",
            sa.Integer(),
            sa.ForeignKey("stores.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("cost", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("eta_label", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
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

    op.add_column(
        "orders",
        sa.Column(
            "shipping_method_id",
            sa.Integer(),
            sa.ForeignKey("shipping_methods.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "orders",
        sa.Column("shipping_method_name", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("orders", "shipping_method_name")
    op.drop_column("orders", "shipping_method_id")
    op.drop_table("shipping_methods")
    op.drop_column("stores", "sms_sent_count")
    op.drop_column("stores", "sms_quota_month")
    op.drop_column("stores", "payment_reminder_minutes")
    op.drop_index("ix_payment_proofs_content_hash", table_name="payment_proofs")
    op.drop_column("payment_proofs", "transfer_tracking")
    op.drop_column("payment_proofs", "payer_card_last4")
    op.drop_column("payment_proofs", "content_hash")
    op.drop_column("payment_methods", "bank_name")
