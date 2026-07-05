"""admin_audit_and_invoice_password_plain

Revision ID: 20260615_0006
Revises: 20260615_0005
Create Date: 2026-06-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260615_0006"
down_revision: Union[str, None] = "20260615_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("invoice_password_plain", sa.String(length=255), nullable=True),
    )

    op.create_table(
        "admin_action_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("actor_user_id", sa.Integer(), nullable=True),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("entity_label", sa.String(length=255), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("details_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_admin_action_logs_actor_user_id"), "admin_action_logs", ["actor_user_id"], unique=False)
    op.create_index(op.f("ix_admin_action_logs_entity_type"), "admin_action_logs", ["entity_type"], unique=False)
    op.create_index(op.f("ix_admin_action_logs_entity_id"), "admin_action_logs", ["entity_id"], unique=False)
    op.create_index(op.f("ix_admin_action_logs_action"), "admin_action_logs", ["action"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_admin_action_logs_action"), table_name="admin_action_logs")
    op.drop_index(op.f("ix_admin_action_logs_entity_id"), table_name="admin_action_logs")
    op.drop_index(op.f("ix_admin_action_logs_entity_type"), table_name="admin_action_logs")
    op.drop_index(op.f("ix_admin_action_logs_actor_user_id"), table_name="admin_action_logs")
    op.drop_table("admin_action_logs")

    op.drop_column("orders", "invoice_password_plain")
