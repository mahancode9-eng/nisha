"""flexible_store_builder

Revision ID: 20260615_0004
Revises: 20260610_0003
Create Date: 2026-06-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260615_0004"
down_revision: Union[str, None] = "20260610_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("stores", sa.Column("cover_image_url", sa.String(length=500), nullable=True))
    op.add_column("stores", sa.Column("location", sa.Text(), nullable=True))
    op.add_column("stores", sa.Column("telegram", sa.String(length=255), nullable=True))
    op.add_column("stores", sa.Column("whatsapp", sa.String(length=255), nullable=True))
    op.add_column("stores", sa.Column("instagram", sa.String(length=255), nullable=True))
    op.add_column("stores", sa.Column("bale", sa.String(length=255), nullable=True))
    op.add_column("stores", sa.Column("website", sa.String(length=500), nullable=True))

    op.create_table(
        "store_social_links",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("store_id", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("icon_key", sa.String(length=100), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_store_social_links_store_id"),
        "store_social_links",
        ["store_id"],
        unique=False,
    )

    op.add_column("product_images", sa.Column("thumbnail_url", sa.String(length=500), nullable=True))
    op.add_column("product_images", sa.Column("alt_text", sa.String(length=255), nullable=True))
    op.add_column("product_images", sa.Column("mime_type", sa.String(length=100), nullable=True))
    op.add_column("product_images", sa.Column("width", sa.Integer(), nullable=True))
    op.add_column("product_images", sa.Column("height", sa.Integer(), nullable=True))

    op.create_table(
        "product_form_fields",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("field_key", sa.String(length=100), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column(
            "field_type",
            sa.Enum(
                "TEXT",
                "TEXTAREA",
                "NUMBER",
                "DROPDOWN",
                "RADIO",
                "CHECKBOX",
                "FILE_UPLOAD",
                name="productfieldtype",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("is_required", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("placeholder", sa.String(length=255), nullable=True),
        sa.Column("help_text", sa.Text(), nullable=True),
        sa.Column("validation_json", sa.Text(), nullable=True),
        sa.Column("options_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_id", "field_key", name="uq_product_form_fields_product_id_field_key"),
    )
    op.create_index(
        op.f("ix_product_form_fields_product_id"),
        "product_form_fields",
        ["product_id"],
        unique=False,
    )

    op.create_table(
        "order_item_field_values",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_item_id", sa.Integer(), nullable=False),
        sa.Column("field_key", sa.String(length=100), nullable=False),
        sa.Column("field_label", sa.String(length=255), nullable=False),
        sa.Column("field_type", sa.String(length=20), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("value_text", sa.Text(), nullable=True),
        sa.Column("value_json", sa.Text(), nullable=True),
        sa.Column("file_url", sa.String(length=500), nullable=True),
        sa.Column("field_snapshot_json", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["order_item_id"], ["order_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_item_id", "field_key", name="uq_order_item_field_values_order_item_id_field_key"),
    )
    op.create_index(
        op.f("ix_order_item_field_values_order_item_id"),
        "order_item_field_values",
        ["order_item_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_order_item_field_values_order_item_id"), table_name="order_item_field_values")
    op.drop_table("order_item_field_values")

    op.drop_index(op.f("ix_product_form_fields_product_id"), table_name="product_form_fields")
    op.drop_table("product_form_fields")

    op.drop_column("product_images", "height")
    op.drop_column("product_images", "width")
    op.drop_column("product_images", "mime_type")
    op.drop_column("product_images", "alt_text")
    op.drop_column("product_images", "thumbnail_url")

    op.drop_index(op.f("ix_store_social_links_store_id"), table_name="store_social_links")
    op.drop_table("store_social_links")

    op.drop_column("stores", "website")
    op.drop_column("stores", "bale")
    op.drop_column("stores", "instagram")
    op.drop_column("stores", "whatsapp")
    op.drop_column("stores", "telegram")
    op.drop_column("stores", "location")
    op.drop_column("stores", "cover_image_url")
