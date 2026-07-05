from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.store_categories import list_store_categories
from app.models.enums import StoreOnboardingStatus, StoreOnboardingStep
from app.models.store import Store
from app.schemas.onboarding import (
    SellerOnboardingResponse,
    StoreOnboardingContactChannelDraft,
    StoreOnboardingDrafts,
    StoreOnboardingEvent,
    StoreOnboardingFirstProductDraft,
    StoreOnboardingIdentityDraft,
    StoreOnboardingInformationDraft,
    StoreOnboardingStateResponse,
    StoreOnboardingUpdate,
)
from app.schemas.public import PublicHomepageCategory
from app.schemas.store import StoreResponse


def _default_state() -> StoreOnboardingStateResponse:
    return StoreOnboardingStateResponse()


def _load_state(store: Store) -> StoreOnboardingStateResponse:
    raw = store.onboarding_state_json
    if not raw:
        return _default_state()

    try:
        return StoreOnboardingStateResponse.model_validate(json.loads(raw))
    except Exception:
        return _default_state()


def _save_state(store: Store, state: StoreOnboardingStateResponse) -> None:
    store.set_onboarding_state(state.model_dump(mode="json"))


def _category_payloads() -> list[PublicHomepageCategory]:
    return [
        PublicHomepageCategory(
            label=category.label,
            slug=category.slug,
            query=category.query,
            product_count=0,
            icon_key=category.icon_key,
        )
        for category in list_store_categories()
    ]


def _merge_steps(
    existing: list[StoreOnboardingStep],
    incoming: list[StoreOnboardingStep] | None,
) -> list[StoreOnboardingStep]:
    if incoming is None:
        return existing

    ordered: list[StoreOnboardingStep] = []
    for step in [*existing, *incoming]:
        if step not in ordered:
            ordered.append(step)
    return ordered


def _append_event(
    state: StoreOnboardingStateResponse,
    *,
    event_type: str,
    step: StoreOnboardingStep | None,
    now: datetime,
) -> None:
    state.events.append(
        StoreOnboardingEvent(
            type=event_type,
            step=step,
            timestamp=now,
        )
    )
    if len(state.events) > 50:
        state.events = state.events[-50:]


def get_onboarding_context(db: Session, store: Store) -> SellerOnboardingResponse:
    del db
    return SellerOnboardingResponse(
        store=StoreResponse.model_validate(store),
        state=_load_state(store),
        categories=_category_payloads(),
    )


def update_onboarding_state(db: Session, store: Store, payload: StoreOnboardingUpdate) -> SellerOnboardingResponse:
    state = _load_state(store)
    now = datetime.now(timezone.utc)

    has_draft_changes = False

    if payload.current_step is not None:
        state.current_step = payload.current_step
        has_draft_changes = True

    if payload.completed_steps is not None:
        state.completed_steps = _merge_steps(state.completed_steps, payload.completed_steps)
        has_draft_changes = True

    if payload.store_identity is not None:
        state.drafts.store_identity = StoreOnboardingIdentityDraft.model_validate(payload.store_identity)
        has_draft_changes = True

    if payload.store_information is not None:
        state.drafts.store_information = StoreOnboardingInformationDraft.model_validate(payload.store_information)
        has_draft_changes = True

    if payload.contact_channels is not None:
        state.drafts.contact_channels = [
            StoreOnboardingContactChannelDraft.model_validate(channel)
            for channel in payload.contact_channels
        ]
        has_draft_changes = True

    if payload.first_product is not None:
        state.drafts.first_product = StoreOnboardingFirstProductDraft.model_validate(payload.first_product)
        has_draft_changes = True

    if payload.first_product_id is not None:
        state.first_product_id = payload.first_product_id
        state.drafts.first_product.product_id = payload.first_product_id
        has_draft_changes = True

    if payload.status is not None:
        state.status = payload.status
        has_draft_changes = True

    if has_draft_changes and state.status == StoreOnboardingStatus.NOT_STARTED:
        state.status = StoreOnboardingStatus.IN_PROGRESS

    if has_draft_changes and state.started_at is None:
        state.started_at = now

    if payload.status == StoreOnboardingStatus.SKIPPED:
        state.skipped_at = now
        _append_event(state, event_type="skipped", step=state.current_step, now=now)
    elif payload.status == StoreOnboardingStatus.COMPLETED:
        state.completed_at = now
        state.current_step = StoreOnboardingStep.ACTIVATION
        state.completed_steps = _merge_steps(
            state.completed_steps,
            [
                StoreOnboardingStep.WELCOME,
                StoreOnboardingStep.STORE_IDENTITY,
                StoreOnboardingStep.STORE_INFORMATION,
                StoreOnboardingStep.CONTACT_CHANNELS,
                StoreOnboardingStep.FIRST_PRODUCT,
                StoreOnboardingStep.EDUCATION,
                StoreOnboardingStep.ACTIVATION,
            ],
        )
        _append_event(state, event_type="completed", step=StoreOnboardingStep.ACTIVATION, now=now)
    elif payload.first_product_id is not None:
        _append_event(state, event_type="first_product_created", step=payload.current_step or state.current_step, now=now)
    elif has_draft_changes:
        event_type = "started" if len(state.events) == 0 else "step_saved"
        _append_event(state, event_type=event_type, step=payload.current_step or state.current_step, now=now)

    if has_draft_changes:
        state.updated_at = now
        _save_state(store, state)
        db.commit()
        db.refresh(store)

    return get_onboarding_context(db, store)

