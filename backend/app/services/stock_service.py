from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.product import Product


def restore_order_stock(db: Session, order: Order) -> bool:
    db.refresh(order)
    if order.stock_restored:
        return False

    for item in order.items:
        if item.product_id is None:
            continue
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
    return True
