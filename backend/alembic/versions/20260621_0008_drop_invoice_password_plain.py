"""drop_invoice_password_plain

Revision ID: 20260621_0008
Revises: 20260620_0007
Create Date: 2026-06-21
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260621_0008"
down_revision: Union[str, None] = "20260620_0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("orders", "invoice_password_plain")


def downgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("invoice_password_plain", sa.String(length=255), nullable=True),
    )
