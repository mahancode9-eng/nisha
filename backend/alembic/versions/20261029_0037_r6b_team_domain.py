"""R6b: store team members, seller audit, custom domain."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261029_0037"
down_revision = "20261029_0036"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "stores",
        sa.Column("custom_domain", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "stores",
        sa.Column("custom_domain_verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_stores_custom_domain", "stores", ["custom_domain"], unique=True)

    op.create_table(
        "store_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "store_id",
            sa.Integer(),
            sa.ForeignKey("stores.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="STAFF"),
        sa.Column(
            "invited_by_user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "accepted_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
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
        sa.UniqueConstraint("store_id", "email", name="uq_store_members_store_email"),
    )

    op.create_table(
        "store_action_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "store_id",
            sa.Integer(),
            sa.ForeignKey("stores.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "actor_user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column("action", sa.String(length=100), nullable=False, index=True),
        sa.Column("entity_type", sa.String(length=50), nullable=True),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("store_action_logs")
    op.drop_table("store_members")
    op.drop_index("ix_stores_custom_domain", table_name="stores")
    op.drop_column("stores", "custom_domain_verified_at")
    op.drop_column("stores", "custom_domain")
