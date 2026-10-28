"""Store Telegram/Bale chat ids for platform bot seller alerts."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261025_0029"
down_revision = "20261021_0028"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "stores",
        sa.Column("telegram_chat_id", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "stores",
        sa.Column("bale_chat_id", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "stores",
        sa.Column("telegram_linked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "stores",
        sa.Column("bale_linked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.alter_column(
        "notification_outbox",
        "channel",
        existing_type=sa.String(length=10),
        type_=sa.String(length=20),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "notification_outbox",
        "channel",
        existing_type=sa.String(length=20),
        type_=sa.String(length=10),
        existing_nullable=False,
    )
    op.drop_column("stores", "bale_linked_at")
    op.drop_column("stores", "telegram_linked_at")
    op.drop_column("stores", "bale_chat_id")
    op.drop_column("stores", "telegram_chat_id")
