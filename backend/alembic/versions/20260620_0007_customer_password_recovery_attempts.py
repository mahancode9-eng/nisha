"""customer_password_recovery_attempts

Revision ID: 20260620_0007
Revises: 20260615_0006
Create Date: 2026-06-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260620_0007"
down_revision: Union[str, None] = "20260615_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "customer_password_recoveries",
        sa.Column(
            "failed_attempts",
            sa.Integer(),
            server_default=sa.text("0"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("customer_password_recoveries", "failed_attempts")
