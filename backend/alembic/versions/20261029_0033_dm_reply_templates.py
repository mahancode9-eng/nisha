"""Add stores.dm_reply_templates_json for seller canned replies."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261029_0033"
down_revision = "20261029_0032"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "stores",
        sa.Column("dm_reply_templates_json", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("stores", "dm_reply_templates_json")
