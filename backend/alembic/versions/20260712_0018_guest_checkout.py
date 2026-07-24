"""guest checkout settings

Revision ID: 20260712_0018
Revises: 20260710_0017
Create Date: 2026-07-12
"""

import sqlalchemy as sa
from alembic import op

revision = "20260712_0018"
down_revision = "20260710_0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "stores",
        sa.Column("guest_checkout_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
    )

    op.create_table(
        "platform_settings",
        sa.Column("key", sa.String(length=100), primary_key=True),
        sa.Column("value_json", sa.Text(), nullable=False),
    )

    op.execute(
        sa.text(
            "INSERT INTO platform_settings (key, value_json) VALUES ('guest_checkout_enabled', 'true')"
        )
    )


def downgrade() -> None:
    op.drop_table("platform_settings")
    op.drop_column("stores", "guest_checkout_enabled")
