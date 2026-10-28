"""
Seed demo data for local development.

Run from the backend directory:
    python -m scripts.seed
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from urllib.request import Request, urlopen

from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.customer_account import CustomerAccount
from app.models.enums import PaymentMethodType, StoreBadgeType, UserRole
from app.models.payment_method import PaymentMethod
from app.models.product import Product, ProductImage
from app.models.product_category import ProductCategory
from app.models.store import Store, StoreSocialLink, StoreTrustBadge
from app.models.user import User

# Register related mappers so SQLAlchemy can resolve relationships.
import app.models.admin_audit  # noqa: F401
import app.models.analytics  # noqa: F401
import app.models.conversation  # noqa: F401
import app.models.customer_account  # noqa: F401
import app.models.customer_portal  # noqa: F401
import app.models.message  # noqa: F401
import app.models.email_verification  # noqa: F401
import app.models.notification  # noqa: F401
import app.models.user_password_recovery  # noqa: F401
import app.models.order  # noqa: F401
import app.models.payment_method  # noqa: F401
import app.models.platform_setting  # noqa: F401
import app.models.product  # noqa: F401
import app.models.product_category  # noqa: F401
import app.models.store  # noqa: F401
import app.models.subscription  # noqa: F401
import app.models.user  # noqa: F401

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123456"
SELLER_EMAIL = "seller@example.com"
SELLER_PASSWORD = "seller123456"
SELLER2_EMAIL = "seller2@example.com"
SELLER2_PASSWORD = "seller123456"
SHOWCASE_EMAIL = "gallery@example.com"
SHOWCASE_PASSWORD = "gallery123456"
STORE_SLUG = "demo-store"
STORE2_SLUG = "nisha-shop"
SHOWCASE_SLUG = "atelier-noor"
CUSTOMER_EMAIL = "customer@example.com"
CUSTOMER_PASSWORD = "customer123456"
CUSTOMER_PHONE = "+989001112233"

TEST_USERS = [
    {"role": "admin", "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    {"role": "seller", "email": SELLER_EMAIL, "password": SELLER_PASSWORD, "store": STORE_SLUG},
    {"role": "seller", "email": SELLER2_EMAIL, "password": SELLER2_PASSWORD, "store": STORE2_SLUG},
    {
        "role": "seller",
        "email": SHOWCASE_EMAIL,
        "password": SHOWCASE_PASSWORD,
        "store": SHOWCASE_SLUG,
    },
    {
        "role": "customer",
        "email": CUSTOMER_EMAIL,
        "password": CUSTOMER_PASSWORD,
        "phone": CUSTOMER_PHONE,
    },
]

# Stable Unsplash sources used only when local seed assets are missing.
# picsum seeds stay stable; used only when local seed assets are missing.
SHOWCASE_IMAGES = {
    "cover": "https://picsum.photos/seed/atelier-cover/1600/900",
    "logo": "https://picsum.photos/seed/atelier-logo/600/600",
    "candle": "https://picsum.photos/seed/atelier-candle/900/900",
    "vase": "https://picsum.photos/seed/atelier-vase/900/900",
    "lamp": "https://picsum.photos/seed/atelier-lamp/900/900",
    "throw": "https://picsum.photos/seed/atelier-throw/900/900",
    "tray": "https://picsum.photos/seed/atelier-tray/900/900",
    "plant": "https://picsum.photos/seed/atelier-plant/900/900",
    "frame": "https://picsum.photos/seed/atelier-frame/900/900",
    "diffuser": "https://picsum.photos/seed/atelier-diffuser/900/900",
}

DEMO_IMAGES = {
    "demo-cover": "https://picsum.photos/seed/nisha-demo-cover/1600/900",
    "demo-logo": "https://picsum.photos/seed/nisha-demo-logo/600/600",
    "tshirt": "https://picsum.photos/seed/nisha-demo-tshirt/900/900",
    "hoodie": "https://picsum.photos/seed/nisha-demo-hoodie/900/900",
    "cap": "https://picsum.photos/seed/nisha-demo-cap/900/900",
}


def _seed_media_dir() -> Path:
    upload_root = Path(settings.UPLOAD_DIR)
    media_dir = upload_root / "media" / "seed"
    media_dir.mkdir(parents=True, exist_ok=True)
    return media_dir


def ensure_seed_image(key: str, source_url: str) -> str:
    """Download once into uploads/media/seed and return a public /uploads path."""
    media_dir = _seed_media_dir()
    target = media_dir / f"{key}.jpg"
    if not target.exists() or target.stat().st_size < 1024:
        try:
            request = Request(
                source_url,
                headers={"User-Agent": "NishaSeed/1.0"},
            )
            with urlopen(request, timeout=30) as response:  # noqa: S310 - trusted seed URLs
                data = response.read()
            if len(data) < 1024:
                raise RuntimeError(f"Seed image too small for key={key}")
            target.write_bytes(data)
            print(f"Downloaded seed image: {key}")
        except Exception as exc:  # noqa: BLE001 - offline or blocked image host
            _write_placeholder_image(target, key)
            print(f"Seed image download failed ({exc}); wrote placeholder: {key}")
    return f"/uploads/media/seed/{key}.jpg"


def _write_placeholder_image(target: Path, key: str) -> None:
    """Solid brand-tinted JPEG so seeding works without internet access."""
    from hashlib import sha256

    from PIL import Image

    digest = sha256(key.encode()).digest()
    color = (80 + digest[0] % 120, 50 + digest[1] % 100, 120 + digest[2] % 120)
    Image.new("RGB", (900, 900), color).save(target, "JPEG", quality=85)


def get_or_create_admin(db) -> User:
    user = db.scalar(select(User).where(User.email == ADMIN_EMAIL))
    now = datetime.now(timezone.utc)
    if user is None:
        user = User(
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            full_name="Platform Admin",
            role=UserRole.ADMIN,
            is_active=True,
            email_verified_at=now,
        )
        db.add(user)
        db.flush()
        print(f"Created admin: {ADMIN_EMAIL}")
    else:
        # Never reset an existing admin password — seed must not enable takeover.
        user.role = UserRole.ADMIN
        user.is_active = True
        if user.email_verified_at is None:
            user.email_verified_at = now
        print(f"Admin already exists (password unchanged): {ADMIN_EMAIL}")
    return user


def get_or_create_seller_and_store(
    db,
    *,
    email: str,
    password: str,
    full_name: str,
    store_name: str,
    store_slug: str,
    description: str,
    phone: str,
    reset_password: bool = False,
) -> tuple[User, Store]:
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role=UserRole.SELLER,
            is_active=True,
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(user)
        db.flush()
        print(f"Created seller: {email}")
    else:
        user.is_active = True
        if reset_password:
            user.password_hash = hash_password(password)
            print(f"Seller password reset for demo account: {email}")
        if user.email_verified_at is None:
            user.email_verified_at = datetime.now(timezone.utc)
        print(f"Seller already exists, verified: {email}")

    store = db.scalar(select(Store).where(Store.slug == store_slug))
    if store is None:
        store = Store(
            owner_id=user.id,
            name=store_name,
            slug=store_slug,
            description=description,
            phone=phone,
            support_contact=f"support@{store_slug}.example.com",
            is_active=True,
        )
        db.add(store)
        db.flush()
        print(f"Created store: {store_slug}")
    else:
        store.name = store_name
        store.description = description
        store.phone = phone
        store.support_contact = f"support@{store_slug}.example.com"
        store.guest_checkout_enabled = True
        store.is_active = True
        print(f"Store already exists, refreshed demo contacts: {store_slug}")

    return user, store


def get_or_create_customer(db) -> CustomerAccount:
    customer = db.scalar(select(CustomerAccount).where(CustomerAccount.email == CUSTOMER_EMAIL))
    now = datetime.now(timezone.utc)
    if customer is None:
        customer = CustomerAccount(
            email=CUSTOMER_EMAIL,
            phone=CUSTOMER_PHONE,
            password_hash=hash_password(CUSTOMER_PASSWORD),
            full_name="Demo Customer",
            email_verified_at=now,
        )
        db.add(customer)
        db.flush()
        print(f"Created customer: {CUSTOMER_EMAIL}")
    else:
        customer.phone = customer.phone or CUSTOMER_PHONE
        if customer.email_verified_at is None:
            customer.email_verified_at = now
        print(f"Customer already exists, verified (password unchanged): {CUSTOMER_EMAIL}")
    return customer


def seed_products(db, store: Store) -> None:
    products_data = [
        {
            "title": "Classic T-Shirt",
            "description": "Comfortable cotton t-shirt.",
            "price": Decimal("29.99"),
            "stock_quantity": 50,
            "image_key": "tshirt",
            "alt": "Classic T-Shirt",
        },
        {
            "title": "Hoodie",
            "description": "Warm hoodie for cold days.",
            "price": Decimal("49.99"),
            "stock_quantity": 30,
            "image_key": "hoodie",
            "alt": "Hoodie",
        },
        {
            "title": "Cap",
            "description": "Adjustable cap.",
            "price": Decimal("19.99"),
            "stock_quantity": 100,
            "image_key": "cap",
            "alt": "Cap",
        },
    ]

    for data in products_data:
        image_key = data.pop("image_key")
        alt = data.pop("alt")
        product = db.scalar(
            select(Product).where(
                Product.store_id == store.id,
                Product.title == data["title"],
            )
        )
        if product is None:
            product = Product(store_id=store.id, is_active=True, **data)
            db.add(product)
            db.flush()
            print(f"Created product: {data['title']}")

        image_url = ensure_seed_image(image_key, DEMO_IMAGES[image_key])
        has_image = db.scalar(
            select(ProductImage.id).where(ProductImage.product_id == product.id)
        )
        if has_image is None:
            db.add(
                ProductImage(
                    product_id=product.id,
                    image_url=image_url,
                    thumbnail_url=image_url,
                    alt_text=alt,
                    sort_order=0,
                    mime_type="image/jpeg",
                )
            )
            print(f"Attached image for: {data['title']}")


def enrich_demo_store(db, store: Store) -> None:
    """Attach logo/cover imagery so the primary demo storefront looks complete."""
    logo_url = ensure_seed_image("demo-logo", DEMO_IMAGES["demo-logo"])
    cover_url = ensure_seed_image("demo-cover", DEMO_IMAGES["demo-cover"])
    store.logo_url = logo_url
    store.cover_image_url = cover_url
    store.guest_checkout_enabled = True
    store.is_active = True
    if not store.description:
        store.description = "A demo store for testing the Nisha platform."
    print(f"Enriched demo store imagery: {store.slug}")


def seed_payment_methods(db, store: Store) -> None:
    methods_data = [
        {
            "type": PaymentMethodType.CARD_TO_CARD,
            "display_name": "کارت‌به‌کارت ملت",
            "card_number": "6037-9911-4455-7788",
            "owner_name": "آتلیه نور",
            "instructions": "مبلغ سفارش را کارت‌به‌کارت کنید و رسید را در صفحه سفارش بارگذاری کنید.",
        },
        {
            "type": PaymentMethodType.CRYPTO,
            "display_name": "USDT (TRC20)",
            "wallet_address": "TXdemo1234567890abcdef",
            "instructions": "مبلغ دقیق را واریز کنید و رسید را بارگذاری کنید.",
        },
    ]

    for data in methods_data:
        exists = db.scalar(
            select(PaymentMethod.id).where(
                PaymentMethod.store_id == store.id,
                PaymentMethod.display_name == data["display_name"],
            )
        )
        if exists is not None:
            continue
        db.add(PaymentMethod(store_id=store.id, is_active=True, **data))
        print(f"Created payment method: {data['display_name']}")


def _get_or_create_category(db, store: Store, name: str, slug: str, sort_order: int) -> ProductCategory:
    category = db.scalar(
        select(ProductCategory).where(
            ProductCategory.store_id == store.id,
            ProductCategory.slug == slug,
        )
    )
    if category is None:
        category = ProductCategory(
            store_id=store.id,
            name=name,
            slug=slug,
            sort_order=sort_order,
            is_active=True,
        )
        db.add(category)
        db.flush()
        print(f"Created category: {name}")
    return category


def enrich_showcase_store(db, store: Store) -> None:
    logo_url = ensure_seed_image("logo", SHOWCASE_IMAGES["logo"])
    cover_url = ensure_seed_image("cover", SHOWCASE_IMAGES["cover"])

    store.name = "آتلیه نور"
    store.description = "خانه و دکور مینیمال — شمع، سرامیک و نورپردازی آرام برای فضای روزمره."
    store.logo_url = logo_url
    store.cover_image_url = cover_url
    store.category_slug = "home"
    store.category_name = "خانه و دکور"
    store.location = "تهران، خیابان ولیعصر، پلاک ۲۱۴"
    store.phone = "+989121112233"
    store.telegram = "https://t.me/atelier_noor"
    store.whatsapp = "https://wa.me/989121112233"
    store.instagram = "https://instagram.com/atelier.noor"
    store.website = "https://example.com/atelier-noor"
    store.support_contact = "support@atelier-noor.example.com"
    store.about_text = (
        "آتلیه نور از سال ۱۳۹۸ روی اشیای کوچکِ خانه تمرکز دارد: شمع‌های گیاهی، "
        "سرامیک دست‌ساز، لامپ‌های نرم و منسوجات ساده. هر محصول با توضیح مواد، "
        "ابعاد و روش مراقبت همراه است تا خرید کارت‌به‌کارت بدون سردرگمی پیش برود."
    )
    store.shipping_policy_text = (
        "ارسال با پست پیشتاز معمولاً ۲ تا ۴ روز کاری در تهران و ۳ تا ۶ روز در سایر شهرها. "
        "برای سفارش‌های بالای ۲٬۵۰۰٬۰۰۰ تومان هزینه ارسال رایگان است."
    )
    store.default_shipping_cost = Decimal("85000")
    store.free_shipping_min_subtotal = Decimal("2500000")
    store.guest_checkout_enabled = True
    store.theme_preset = "default"
    store.primary_color = "#2F5D50"
    store.is_active = True

    badge = db.scalar(
        select(StoreTrustBadge).where(
            StoreTrustBadge.store_id == store.id,
            StoreTrustBadge.badge_type == StoreBadgeType.VERIFIED,
        )
    )
    if badge is None:
        db.add(
            StoreTrustBadge(
                store_id=store.id,
                badge_type=StoreBadgeType.VERIFIED,
                is_active=True,
                assigned_at=datetime.now(timezone.utc),
            )
        )
        print("Assigned VERIFIED badge to showcase store")
    else:
        badge.is_active = True

    socials = [
        ("اینستاگرام", store.instagram, "instagram", 0),
        ("تلگرام", store.telegram, "telegram", 1),
        ("واتساپ", store.whatsapp, "whatsapp", 2),
    ]
    for label, url, icon_key, sort_order in socials:
        if not url:
            continue
        exists = db.scalar(
            select(StoreSocialLink.id).where(
                StoreSocialLink.store_id == store.id,
                StoreSocialLink.label == label,
            )
        )
        if exists is not None:
            continue
        db.add(
            StoreSocialLink(
                store_id=store.id,
                label=label,
                url=url,
                icon_key=icon_key,
                sort_order=sort_order,
                is_active=True,
            )
        )


def seed_showcase_catalog(db, store: Store) -> None:
    lighting = _get_or_create_category(db, store, "نور و لامپ", "lighting", 0)
    decor = _get_or_create_category(db, store, "دکور و سرامیک", "decor", 1)
    scent = _get_or_create_category(db, store, "رایحه و شمع", "scent", 2)
    textile = _get_or_create_category(db, store, "منسوجات", "textile", 3)

    products = [
        {
            "title": "شمع سویا عطر چوب صندل",
            "description": (
                "شمع گیاهی با موم سویا و فتیله پنبه‌ای.\n"
                "زمان سوختن تقریبی: ۴۵ ساعت\n"
                "رایحه: چوب صندل و وانیل ملایم\n"
                "ظرف: سرامیک مات کرم‌رنگ — قابل شست‌وشو پس از اتمام.\n"
                "نکته ایمنی: دور از دسترس کودک و سطح ناپایدار روشن نکنید."
            ),
            "price": Decimal("485000"),
            "stock_quantity": 42,
            "category": scent,
            "image_key": "candle",
            "alt": "شمع سویا در ظرف سرامیکی",
        },
        {
            "title": "گلدان سرامیکی موج‌دار",
            "description": (
                "گلدان دست‌ساز با لعاب مات سبز زیتونی.\n"
                "ارتفاع ۱۸ سانتی‌متر، دهانه ۷ سانتی‌متر\n"
                "مناسب شاخه خشک یا گیاه کوچک.\n"
                "هر قطعه کمی با دیگری فرق دارد چون دستی ساخته می‌شود."
            ),
            "price": Decimal("790000"),
            "stock_quantity": 18,
            "category": decor,
            "image_key": "vase",
            "alt": "گلدان سرامیکی موج‌دار",
        },
        {
            "title": "لامپ رومیزی حبابی",
            "description": (
                "پایه چوبی بلوط با حباب شیشه‌ای مات.\n"
                "ولتاژ: ۲۲۰ ولت — لامپ LED E27 (۶ وات) همراه است.\n"
                "نور گرم ۲۷۰۰ کلوین برای میز کنار تخت یا میز کار.\n"
                "کابل پارچه‌ای ۲ متر با کلید روی سیم."
            ),
            "price": Decimal("1890000"),
            "stock_quantity": 11,
            "category": lighting,
            "image_key": "lamp",
            "alt": "لامپ رومیزی حبابی",
        },
        {
            "title": "پتو بافت درشت پنبه‌ای",
            "description": (
                "پتو ۱۰۰٪ پنبه، بافت درشت مناسب مبل و تخت.\n"
                "ابعاد: ۱۳۰×۱۷۰ سانتی‌متر\n"
                "رنگ: خاکستری گرم\n"
                "قابل شست‌وشو در ماشین با دور ملایم."
            ),
            "price": Decimal("1450000"),
            "stock_quantity": 24,
            "category": textile,
            "image_key": "throw",
            "alt": "پتو پنبه‌ای بافت درشت",
        },
        {
            "title": "سینی چوبی گردو",
            "description": (
                "سینی پذیرایی از چوب گردو با لبه‌های پرداخت‌شده.\n"
                "قطر ۳۲ سانتی‌متر\n"
                "روغن گیاهی خوراکی خورده؛ با دست خشک کنید.\n"
                "مناسب سرو چای و شیرینی روی میز نشیمن."
            ),
            "price": Decimal("920000"),
            "stock_quantity": 15,
            "category": decor,
            "image_key": "tray",
            "alt": "سینی چوبی گردو",
        },
        {
            "title": "گیاه آپارتمانی پوتوس در گلدان بتنی",
            "description": (
                "پوتوس سالم همراه گلدان بتنی سبک.\n"
                "نیاز نوری: غیرمستقیم\n"
                "آبیاری: وقتی سطح خاک خشک شد\n"
                "ارتفاع تقریبی مجموعه: ۲۸ سانتی‌متر."
            ),
            "price": Decimal("650000"),
            "stock_quantity": 20,
            "category": decor,
            "image_key": "plant",
            "alt": "پوتوس در گلدان بتنی",
        },
        {
            "title": "قاب عکس بلوطی ۳۰×۴۰",
            "description": (
                "قاب چوبی بلوط با شیشه شفاف.\n"
                "ابعاد داخلی ۳۰×۴۰ سانتی‌متر\n"
                "قابلیت نصب دیواری افقی و عمودی\n"
                "پشت‌بند محکم و گوشی آویز همراه است."
            ),
            "price": Decimal("540000"),
            "stock_quantity": 30,
            "category": decor,
            "image_key": "frame",
            "alt": "قاب عکس چوبی",
        },
        {
            "title": "دیفیوزر چوب بامبو رایحه برگ بو",
            "description": (
                "ست دیفیوزر ۱۰۰ میلی‌لیتری با ۸ عدد چوب بامبو.\n"
                "رایحه: برگ بو و مرکبات سبز\n"
                "ماندگاری رایحه در فضای بسته حدود ۸ تا ۱۰ هفته.\n"
                "دور از نور مستقیم خورشید نگه دارید."
            ),
            "price": Decimal("710000"),
            "stock_quantity": 27,
            "category": scent,
            "image_key": "diffuser",
            "alt": "دیفیوزر چوب بامبو",
        },
    ]

    for data in products:
        product = db.scalar(
            select(Product).where(
                Product.store_id == store.id,
                Product.title == data["title"],
            )
        )
        image_url = ensure_seed_image(data["image_key"], SHOWCASE_IMAGES[data["image_key"]])
        if product is None:
            product = Product(
                store_id=store.id,
                title=data["title"],
                description=data["description"],
                price=data["price"],
                stock_quantity=data["stock_quantity"],
                category_id=data["category"].id,
                is_active=True,
                shipping_cost=None,
            )
            db.add(product)
            db.flush()
            print(f"Created showcase product: {data['title']}")
        else:
            product.description = data["description"]
            product.price = data["price"]
            product.stock_quantity = data["stock_quantity"]
            product.category_id = data["category"].id
            product.is_active = True

        has_image = db.scalar(
            select(ProductImage.id).where(ProductImage.product_id == product.id)
        )
        if has_image is None:
            db.add(
                ProductImage(
                    product_id=product.id,
                    image_url=image_url,
                    thumbnail_url=image_url,
                    alt_text=data["alt"],
                    sort_order=0,
                    mime_type="image/jpeg",
                )
            )
            # Second detail angle for richer product pages (reuse same asset with unique url key)
            detail_key = f"{data['image_key']}-detail"
            detail_url = ensure_seed_image(detail_key, SHOWCASE_IMAGES[data["image_key"]])
            db.add(
                ProductImage(
                    product_id=product.id,
                    image_url=detail_url,
                    thumbnail_url=detail_url,
                    alt_text=f"{data['alt']} — نمای نزدیک",
                    sort_order=1,
                    mime_type="image/jpeg",
                )
            )
            print(f"Attached images for: {data['title']}")


def main() -> None:
    if settings.ENVIRONMENT == "production" and not settings.ALLOW_DEMO_SEED:
        raise SystemExit(
            "Refusing to seed in production. Set ALLOW_DEMO_SEED=true to override."
        )

    db = SessionLocal()
    try:
        get_or_create_admin(db)
        _, store = get_or_create_seller_and_store(
            db,
            email=SELLER_EMAIL,
            password=SELLER_PASSWORD,
            full_name="Demo Seller",
            store_name="Demo Store",
            store_slug=STORE_SLUG,
            description="A demo store for testing the Nisha platform.",
            phone="+989121234567",
        )
        _, store2 = get_or_create_seller_and_store(
            db,
            email=SELLER2_EMAIL,
            password=SELLER2_PASSWORD,
            full_name="Nisha Seller",
            store_name="Nisha Shop",
            store_slug=STORE2_SLUG,
            description="Second demo store for multi-seller testing.",
            phone="+989129876543",
        )
        _, showcase = get_or_create_seller_and_store(
            db,
            email=SHOWCASE_EMAIL,
            password=SHOWCASE_PASSWORD,
            full_name="فروشنده آتلیه نور",
            store_name="آتلیه نور",
            store_slug=SHOWCASE_SLUG,
            description="خانه و دکور مینیمال",
            phone="+989121112233",
            reset_password=True,
        )
        get_or_create_customer(db)
        seed_products(db, store)
        enrich_demo_store(db, store)
        seed_payment_methods(db, store)
        seed_payment_methods(db, store2)

        enrich_showcase_store(db, showcase)
        seed_showcase_catalog(db, showcase)
        seed_payment_methods(db, showcase)

        db.commit()
        print("\nSeed completed successfully.")
        print("Test logins (all emails are pre-verified):")
        for account in TEST_USERS:
            store_note = f"  store=/{account['store']}" if account.get("store") else ""
            print(f"  {account['role']:<8} {account['email']} / {account['password']}{store_note}")
        print(f"\nShowcase storefront: http://localhost:3000/store/{SHOWCASE_SLUG}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
