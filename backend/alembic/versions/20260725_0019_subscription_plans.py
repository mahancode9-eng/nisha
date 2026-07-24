"""platform subscription plans

Revision ID: 20260725_0019
Revises: 20260712_0018
Create Date: 2026-07-25
"""

import json

import sqlalchemy as sa
from alembic import op

revision = "20260725_0019"
down_revision = "20260712_0018"
branch_labels = None
depends_on = None


FREE_ENTITLEMENTS = {
    "max_products": 30,
    "max_product_images": 3,
    "product_video": False,
    "custom_fields": False,
    "discounts": False,
    "analytics_max_days": 7,
    "guest_checkout": False,
    "badge_trust": False,
    "badge_premium": False,
    "store_theme": False,
    "excel_export": False,
    "store_pages": False,
    "priority_support": False,
}

BASIC_ENTITLEMENTS = {
    "max_products": 200,
    "max_product_images": 8,
    "product_video": False,
    "custom_fields": True,
    "discounts": True,
    "analytics_max_days": 30,
    "guest_checkout": True,
    "badge_trust": False,
    "badge_premium": False,
    "store_theme": False,
    "excel_export": False,
    "store_pages": False,
    "priority_support": False,
}

PRO_ENTITLEMENTS = {
    "max_products": None,
    "max_product_images": 8,
    "product_video": True,
    "custom_fields": True,
    "discounts": True,
    "analytics_max_days": 90,
    "guest_checkout": True,
    "badge_trust": True,
    "badge_premium": False,
    "store_theme": True,
    "excel_export": True,
    "store_pages": True,
    "priority_support": False,
}

ENTERPRISE_ENTITLEMENTS = {
    "max_products": None,
    "max_product_images": 8,
    "product_video": True,
    "custom_fields": True,
    "discounts": True,
    "analytics_max_days": 90,
    "guest_checkout": True,
    "badge_trust": True,
    "badge_premium": True,
    "store_theme": True,
    "excel_export": True,
    "store_pages": True,
    "priority_support": True,
}


def upgrade() -> None:
    op.create_table(
        "subscription_plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name_fa", sa.String(length=100), nullable=False),
        sa.Column("monthly_price_toman", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("yearly_price_toman", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_recommended", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("entitlements_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("code", name="uq_subscription_plans_code"),
    )
    op.create_index("ix_subscription_plans_code", "subscription_plans", ["code"])

    op.create_table(
        "seller_subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("billing_period", sa.String(length=50), nullable=False),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("seller_user_id", name="uq_seller_subscriptions_user"),
    )
    op.create_index("ix_seller_subscriptions_seller_user_id", "seller_subscriptions", ["seller_user_id"])
    op.create_index("ix_seller_subscriptions_plan_id", "seller_subscriptions", ["plan_id"])
    op.create_index("ix_seller_subscriptions_status", "seller_subscriptions", ["status"])

    op.create_table(
        "subscription_invoices",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("seller_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("subscription_plans.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("period", sa.String(length=50), nullable=False),
        sa.Column("amount_toman", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_subscription_invoices_seller_user_id", "subscription_invoices", ["seller_user_id"])
    op.create_index("ix_subscription_invoices_plan_id", "subscription_invoices", ["plan_id"])
    op.create_index("ix_subscription_invoices_status", "subscription_invoices", ["status"])

    op.create_table(
        "subscription_payment_proofs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "invoice_id",
            sa.Integer(),
            sa.ForeignKey("subscription_invoices.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("image_url", sa.String(length=500), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_subscription_payment_proofs_invoice_id", "subscription_payment_proofs", ["invoice_id"])

    op.add_column("stores", sa.Column("theme_preset", sa.String(length=50), nullable=True))
    op.add_column("stores", sa.Column("primary_color", sa.String(length=20), nullable=True))
    op.add_column("stores", sa.Column("about_text", sa.Text(), nullable=True))
    op.add_column("stores", sa.Column("shipping_policy_text", sa.Text(), nullable=True))

    plans = sa.table(
        "subscription_plans",
        sa.column("code", sa.String),
        sa.column("name_fa", sa.String),
        sa.column("monthly_price_toman", sa.Integer),
        sa.column("yearly_price_toman", sa.Integer),
        sa.column("is_recommended", sa.Boolean),
        sa.column("sort_order", sa.Integer),
        sa.column("is_active", sa.Boolean),
        sa.column("entitlements_json", sa.Text),
    )
    op.bulk_insert(
        plans,
        [
            {
                "code": "free",
                "name_fa": "رایگان",
                "monthly_price_toman": 0,
                "yearly_price_toman": 0,
                "is_recommended": False,
                "sort_order": 1,
                "is_active": True,
                "entitlements_json": json.dumps(FREE_ENTITLEMENTS, ensure_ascii=False),
            },
            {
                "code": "basic",
                "name_fa": "پایه",
                "monthly_price_toman": 299_000,
                "yearly_price_toman": 2_990_000,
                "is_recommended": False,
                "sort_order": 2,
                "is_active": True,
                "entitlements_json": json.dumps(BASIC_ENTITLEMENTS, ensure_ascii=False),
            },
            {
                "code": "pro",
                "name_fa": "حرفه‌ای",
                "monthly_price_toman": 599_000,
                "yearly_price_toman": 5_990_000,
                "is_recommended": True,
                "sort_order": 3,
                "is_active": True,
                "entitlements_json": json.dumps(PRO_ENTITLEMENTS, ensure_ascii=False),
            },
            {
                "code": "enterprise",
                "name_fa": "سازمانی",
                "monthly_price_toman": 1_290_000,
                "yearly_price_toman": 12_900_000,
                "is_recommended": False,
                "sort_order": 4,
                "is_active": True,
                "entitlements_json": json.dumps(ENTERPRISE_ENTITLEMENTS, ensure_ascii=False),
            },
        ],
    )

    op.execute(
        sa.text(
            "INSERT INTO platform_settings (key, value_json) VALUES "
            "('subscription_card_number', '\"\"'), "
            "('subscription_card_owner', '\"\"'), "
            "('subscription_card_bank', '\"\"')"
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            "DELETE FROM platform_settings WHERE key IN "
            "('subscription_card_number', 'subscription_card_owner', 'subscription_card_bank')"
        )
    )
    op.drop_column("stores", "shipping_policy_text")
    op.drop_column("stores", "about_text")
    op.drop_column("stores", "primary_color")
    op.drop_column("stores", "theme_preset")
    op.drop_table("subscription_payment_proofs")
    op.drop_table("subscription_invoices")
    op.drop_table("seller_subscriptions")
    op.drop_table("subscription_plans")
