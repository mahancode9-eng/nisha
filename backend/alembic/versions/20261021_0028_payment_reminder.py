"""Track payment reminder SMS for unpaid orders."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261021_0028"
down_revision = "20261020_0027"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("payment_reminder_sent_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("orders", "payment_reminder_sent_at")
