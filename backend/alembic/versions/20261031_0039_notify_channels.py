"""Optional buyer email + seller SMS notify prefs."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261031_0039"
down_revision = "20261031_0038"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("buyer_email", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column(
            "notify_sms",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.add_column(
        "stores",
        sa.Column("notify_sms_phone", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "stores",
        sa.Column(
            "notify_by_email",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.add_column(
        "stores",
        sa.Column(
            "notify_by_sms",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    op.drop_column("stores", "notify_by_sms")
    op.drop_column("stores", "notify_by_email")
    op.drop_column("stores", "notify_sms_phone")
    op.drop_column("orders", "notify_sms")
    op.drop_column("orders", "buyer_email")
