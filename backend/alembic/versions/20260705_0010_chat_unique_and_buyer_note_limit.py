"""chat_unique_and_buyer_note_limit

Revision ID: 20260705_0010
Revises: 20260623_0009
Create Date: 2026-07-05
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260705_0010"
down_revision: Union[str, None] = "20260623_0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Merge duplicate general (no-order) conversations before adding the
    # partial unique index: keep the oldest conversation per
    # (store_id, customer_id) pair and move messages over.
    op.execute(
        """
        UPDATE messages
        SET conversation_id = dup.keep_id
        FROM (
            SELECT id,
                   FIRST_VALUE(id) OVER (
                       PARTITION BY store_id, customer_id ORDER BY id
                   ) AS keep_id
            FROM conversations
            WHERE order_id IS NULL
        ) dup
        WHERE messages.conversation_id = dup.id
          AND dup.id <> dup.keep_id
        """
    )
    op.execute(
        """
        DELETE FROM conversations
        USING (
            SELECT id,
                   FIRST_VALUE(id) OVER (
                       PARTITION BY store_id, customer_id ORDER BY id
                   ) AS keep_id
            FROM conversations
            WHERE order_id IS NULL
        ) dup
        WHERE conversations.id = dup.id
          AND dup.id <> dup.keep_id
        """
    )
    op.create_index(
        "uq_conversations_store_customer_no_order",
        "conversations",
        ["store_id", "customer_id"],
        unique=True,
        postgresql_where=sa.text("order_id IS NULL"),
    )

    # Enforce a maximum length on orders.buyer_note.
    op.execute(
        "UPDATE orders SET buyer_note = LEFT(buyer_note, 1000) "
        "WHERE buyer_note IS NOT NULL AND LENGTH(buyer_note) > 1000"
    )
    op.alter_column(
        "orders",
        "buyer_note",
        type_=sa.String(length=1000),
        existing_type=sa.Text(),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "orders",
        "buyer_note",
        type_=sa.Text(),
        existing_type=sa.String(length=1000),
        existing_nullable=True,
    )
    op.drop_index("uq_conversations_store_customer_no_order", table_name="conversations")
