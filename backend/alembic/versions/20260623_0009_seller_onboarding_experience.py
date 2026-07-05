"""seller_onboarding_experience

Revision ID: 20260623_0009
Revises: 20260621_0008
Create Date: 2026-06-23
"""

import json
from datetime import datetime, timezone
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260623_0009"
down_revision: Union[str, None] = "20260621_0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("stores", sa.Column("category_slug", sa.String(length=100), nullable=True))
    op.add_column("stores", sa.Column("category_name", sa.String(length=255), nullable=True))
    op.add_column("stores", sa.Column("onboarding_state_json", sa.Text(), nullable=True))

    now = datetime.now(timezone.utc).isoformat()
    completed_state = {
        "status": "COMPLETED",
        "current_step": "activation",
        "completed_steps": [
            "welcome",
            "store_identity",
            "store_information",
            "contact_channels",
            "first_product",
            "education",
            "activation",
        ],
        "drafts": {
            "store_identity": {},
            "store_information": {},
            "contact_channels": [],
            "first_product": {},
        },
        "started_at": now,
        "updated_at": now,
        "completed_at": now,
        "skipped_at": None,
        "first_product_id": None,
        "events": [
            {
                "type": "completed",
                "step": "activation",
                "timestamp": now,
            }
        ],
    }
    op.get_bind().execute(
        sa.text("UPDATE stores SET onboarding_state_json = :state WHERE onboarding_state_json IS NULL"),
        {"state": json.dumps(completed_state, ensure_ascii=False)},
    )


def downgrade() -> None:
    op.drop_column("stores", "onboarding_state_json")
    op.drop_column("stores", "category_name")
    op.drop_column("stores", "category_slug")
