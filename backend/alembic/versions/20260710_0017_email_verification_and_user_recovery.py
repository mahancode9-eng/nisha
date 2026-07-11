"""email verification and user password recovery

Revision ID: 20260710_0017
Revises: 20260706_0016
Create Date: 2026-07-10
"""

import sqlalchemy as sa
from alembic import op

revision = "20260710_0017"
down_revision = "20260706_0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "customer_accounts",
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.execute(
        sa.text(
            "UPDATE customer_accounts SET email_verified_at = created_at "
            "WHERE email IS NOT NULL AND email_verified_at IS NULL"
        )
    )
    op.execute(
        sa.text(
            "UPDATE users SET email_verified_at = created_at "
            "WHERE email_verified_at IS NULL"
        )
    )

    op.create_table(
        "email_verification_tokens",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "account_kind",
            sa.Enum("CUSTOMER", "USER", name="verificationaccountkind", native_enum=False),
            nullable=False,
        ),
        sa.Column("account_id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_email_verification_tokens_account",
        "email_verification_tokens",
        ["account_kind", "account_id"],
    )

    op.create_table(
        "user_password_recoveries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("code_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "failed_attempts",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_user_password_recoveries_user_id",
        "user_password_recoveries",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_user_password_recoveries_user_id", table_name="user_password_recoveries")
    op.drop_table("user_password_recoveries")
    op.drop_index("ix_email_verification_tokens_account", table_name="email_verification_tokens")
    op.drop_table("email_verification_tokens")
    op.drop_column("users", "email_verified_at")
    op.drop_column("customer_accounts", "email_verified_at")
