"""order_chat_reviews_trust

Revision ID: 20260615_0005
Revises: 20260615_0004
Create Date: 2026-06-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260615_0005"
down_revision: Union[str, None] = "20260615_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint("uq_conversations_store_customer", "conversations", type_="unique")
    op.create_unique_constraint("uq_conversations_order_id", "conversations", ["order_id"])
    op.alter_column("conversations", "customer_id", existing_type=sa.Integer(), nullable=True)

    op.add_column(
        "messages",
        sa.Column("attachment_mime_type", sa.String(length=100), nullable=True),
    )

    op.add_column(
        "customer_reviews",
        sa.Column(
            "status",
            sa.Enum(
                "PRIVATE",
                "PENDING",
                "APPROVED",
                "REJECTED",
                name="reviewstatus",
                native_enum=False,
            ),
            server_default="PRIVATE",
            nullable=False,
        ),
    )
    op.add_column(
        "customer_reviews",
        sa.Column("moderated_by_user_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "customer_reviews",
        sa.Column("moderated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "customer_reviews",
        sa.Column("moderation_note", sa.Text(), nullable=True),
    )
    op.alter_column("customer_reviews", "customer_id", existing_type=sa.Integer(), nullable=True)
    op.create_index(op.f("ix_customer_reviews_status"), "customer_reviews", ["status"], unique=False)
    op.create_index(
        op.f("ix_customer_reviews_moderated_by_user_id"),
        "customer_reviews",
        ["moderated_by_user_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_customer_reviews_moderated_by_user_id_users",
        "customer_reviews",
        "users",
        ["moderated_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.execute(
        sa.text(
            "UPDATE customer_reviews SET status = 'APPROVED' WHERE status IS NULL OR status = 'PRIVATE'"
        )
    )

    op.create_table(
        "customer_review_images",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("review_id", sa.Integer(), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=False),
        sa.Column("thumbnail_url", sa.String(length=500), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["review_id"], ["customer_reviews.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_customer_review_images_review_id"),
        "customer_review_images",
        ["review_id"],
        unique=False,
    )

    op.create_table(
        "store_trust_badges",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("store_id", sa.Integer(), nullable=False),
        sa.Column(
            "badge_type",
            sa.Enum("VERIFIED", "TRUSTED", "PREMIUM", name="storebadgetype", native_enum=False),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("assigned_by_user_id", sa.Integer(), nullable=True),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("removed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["assigned_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("store_id", "badge_type", name="uq_store_trust_badges_store_type"),
    )
    op.create_index(op.f("ix_store_trust_badges_store_id"), "store_trust_badges", ["store_id"], unique=False)
    op.create_index(op.f("ix_store_trust_badges_badge_type"), "store_trust_badges", ["badge_type"], unique=False)

    op.create_table(
        "store_trust_badge_history",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("store_id", sa.Integer(), nullable=False),
        sa.Column(
            "badge_type",
            sa.Enum("VERIFIED", "TRUSTED", "PREMIUM", name="storebadgetype", native_enum=False),
            nullable=False,
        ),
        sa.Column("action", sa.String(length=20), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("admin_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["admin_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_store_trust_badge_history_store_id"),
        "store_trust_badge_history",
        ["store_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_store_trust_badge_history_store_id"), table_name="store_trust_badge_history")
    op.drop_table("store_trust_badge_history")

    op.drop_index(op.f("ix_store_trust_badges_badge_type"), table_name="store_trust_badges")
    op.drop_index(op.f("ix_store_trust_badges_store_id"), table_name="store_trust_badges")
    op.drop_table("store_trust_badges")

    op.drop_index(op.f("ix_customer_review_images_review_id"), table_name="customer_review_images")
    op.drop_table("customer_review_images")

    op.drop_index(op.f("ix_customer_reviews_moderated_by_user_id"), table_name="customer_reviews")
    op.drop_index(op.f("ix_customer_reviews_status"), table_name="customer_reviews")
    op.drop_constraint(
        "fk_customer_reviews_moderated_by_user_id_users",
        "customer_reviews",
        type_="foreignkey",
    )
    op.drop_column("customer_reviews", "moderation_note")
    op.drop_column("customer_reviews", "moderated_at")
    op.drop_column("customer_reviews", "moderated_by_user_id")
    op.drop_column("customer_reviews", "status")
    op.alter_column("customer_reviews", "customer_id", existing_type=sa.Integer(), nullable=False)

    op.drop_column("messages", "attachment_mime_type")

    op.drop_constraint("uq_conversations_order_id", "conversations", type_="unique")
    op.create_unique_constraint("uq_conversations_store_customer", "conversations", ["store_id", "customer_id"])
    op.alter_column("conversations", "customer_id", existing_type=sa.Integer(), nullable=False)
