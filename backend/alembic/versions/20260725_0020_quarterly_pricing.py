"""Add quarterly_price_toman and backfill 3-month plan prices."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260725_0020"
down_revision = "20260725_0019"
branch_labels = None
depends_on = None

QUARTERLY_BY_CODE = {
    "free": 0,
    "basic": 807_000,
    "pro": 1_617_000,
    "enterprise": 3_483_000,
}


def upgrade() -> None:
    op.add_column(
        "subscription_plans",
        sa.Column("quarterly_price_toman", sa.Integer(), nullable=False, server_default="0"),
    )
    bind = op.get_bind()
    for code, price in QUARTERLY_BY_CODE.items():
        bind.execute(
            sa.text(
                "UPDATE subscription_plans SET quarterly_price_toman = :price WHERE code = :code"
            ),
            {"price": price, "code": code},
        )
    op.alter_column("subscription_plans", "quarterly_price_toman", server_default=None)


def downgrade() -> None:
    op.drop_column("subscription_plans", "quarterly_price_toman")
