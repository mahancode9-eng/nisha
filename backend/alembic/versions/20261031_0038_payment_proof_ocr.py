"""Payment proof OCR match fields."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261031_0038"
down_revision = "20261029_0037"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "payment_proofs",
        sa.Column(
            "ocr_status",
            sa.String(length=20),
            nullable=False,
            server_default="pending",
        ),
    )
    op.add_column(
        "payment_proofs",
        sa.Column("ocr_amount", sa.Numeric(12, 2), nullable=True),
    )
    op.add_column(
        "payment_proofs",
        sa.Column("ocr_dest_card_last4", sa.String(length=4), nullable=True),
    )
    op.add_column(
        "payment_proofs",
        sa.Column("ocr_amount_matched", sa.Boolean(), nullable=True),
    )
    op.add_column(
        "payment_proofs",
        sa.Column("ocr_dest_card_matched", sa.Boolean(), nullable=True),
    )
    op.add_column(
        "payment_proofs",
        sa.Column("ocr_confidence", sa.Numeric(4, 3), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("payment_proofs", "ocr_confidence")
    op.drop_column("payment_proofs", "ocr_dest_card_matched")
    op.drop_column("payment_proofs", "ocr_amount_matched")
    op.drop_column("payment_proofs", "ocr_dest_card_last4")
    op.drop_column("payment_proofs", "ocr_amount")
    op.drop_column("payment_proofs", "ocr_status")
