"""Phase 6b: store staff (members, invites) and the store audit log."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261029_0037"
down_revision = "20261029_0036"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "store_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("store_id", sa.Integer(), sa.ForeignKey("stores.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=15), nullable=False),
        sa.Column("status", sa.String(length=7), nullable=False, server_default="PENDING"),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column("invite_token_hash", sa.String(length=64), nullable=True),
        sa.Column("invite_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("invited_by_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("store_id", "email", name="uq_store_members_store_email"),
        sa.UniqueConstraint("invite_token_hash", name="uq_store_members_invite_token_hash"),
    )
    op.create_index("ix_store_members_store_id", "store_members", ["store_id"])
    op.create_index("ix_store_members_email", "store_members", ["email"])
    op.create_index("ix_store_members_status", "store_members", ["status"])
    op.create_index("ix_store_members_user_id", "store_members", ["user_id"])

    op.create_table(
        "store_audit_log",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("store_id", sa.Integer(), sa.ForeignKey("stores.id", ondelete="CASCADE"), nullable=False),
        sa.Column("actor_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("actor_name", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("actor_role", sa.String(length=30), nullable=False, server_default=""),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id", ondelete="SET NULL"), nullable=True),
        sa.Column("order_invoice", sa.String(length=50), nullable=True),
        sa.Column("details_text", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    for column in ("store_id", "actor_user_id", "action", "order_id", "created_at"):
        op.create_index(f"ix_store_audit_log_{column}", "store_audit_log", [column])


def downgrade() -> None:
    for column in ("store_id", "actor_user_id", "action", "order_id", "created_at"):
        op.drop_index(f"ix_store_audit_log_{column}", table_name="store_audit_log")
    op.drop_table("store_audit_log")
    for name in ("user_id", "status", "email", "store_id"):
        op.drop_index(f"ix_store_members_{name}", table_name="store_members")
    op.drop_table("store_members")
