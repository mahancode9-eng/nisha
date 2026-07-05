from app.models.user import User
from app.schemas.auth import UserResponse


def user_to_response(user: User) -> UserResponse:
    store_slug = user.store.slug if user.store is not None else None
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        store_slug=store_slug,
    )
