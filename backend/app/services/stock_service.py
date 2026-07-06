from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.product import Product, ProductVariant


def restore_order_stock(db: Session, order: Order) -> bool:
    """Restore product stock for all items of an order.

    Emits the UPDATE statements and flushes them to the database, but does
    NOT commit. The caller is responsible for calling ``db.commit()`` to
    make the changes permanent.
    """
    db.refresh(order)
    if order.stock_restored:
        return False

    for item in order.items:
        if item.product_id is None:
            continue
        if item.variant_id is not None:
            db.execute(
                select(ProductVariant)
                .where(ProductVariant.id == item.variant_id)
                .with_for_update()
            )
            db.execute(
                update(ProductVariant)
                .where(ProductVariant.id == item.variant_id)
                .values(stock_quantity=ProductVariant.stock_quantity + item.quantity)
            )
        db.execute(
            select(Product)
            .where(Product.id == item.product_id)
            .with_for_update()
        )
        db.execute(
            update(Product)
            .where(Product.id == item.product_id)
            .values(stock_quantity=Product.stock_quantity + item.quantity)
        )

    order.stock_restored = True
    db.flush()
    return True
