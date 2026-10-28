from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import settings
from app.db.base import Base

import app.models.conversation  # noqa: F401
import app.models.admin_audit  # noqa: F401
import app.models.customer_account  # noqa: F401
import app.models.customer_portal  # noqa: F401
import app.models.customer_tag  # noqa: F401
import app.models.message  # noqa: F401
import app.models.order  # noqa: F401
import app.models.payment_method  # noqa: F401
import app.models.product  # noqa: F401
import app.models.shipping_method  # noqa: F401
import app.models.store  # noqa: F401
import app.models.short_link  # noqa: F401
import app.models.subscription  # noqa: F401
import app.models.user  # noqa: F401
import app.models.ws_ticket  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# The app runs migrations on startup after configuring its own logging; reloading
# alembic.ini there would disable every existing logger (request + error logs).
if config.config_file_name is not None and config.attributes.get("configure_logger", True):
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
