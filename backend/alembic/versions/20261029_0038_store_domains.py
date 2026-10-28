"""Phase 6b: custom domains."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261029_0038"
down_revision = "20261029_0037"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "store_domains",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("store_id", sa.Integer(), sa.ForeignKey("stores.id", ondelete="CASCADE"), nullable=False),
        sa.Column("hostname", sa.String(length=253), nullable=False),
        sa.Column("verification_token", sa.String(length=64), nullable=False),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("dns_pointing", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("store_id", name="uq_store_domains_store_id"),
        sa.UniqueConstraint("hostname", name="uq_store_domains_hostname"),
    )
    op.create_index("ix_store_domains_store_id", "store_domains", ["store_id"])
    op.create_index("ix_store_domains_hostname", "store_domains", ["hostname"])


def downgrade() -> None:
    op.drop_index("ix_store_domains_hostname", table_name="store_domains")
    op.drop_index("ix_store_domains_store_id", table_name="store_domains")
    op.drop_table("store_domains")
