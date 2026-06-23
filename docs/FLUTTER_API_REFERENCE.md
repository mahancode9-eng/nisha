# Nisha Flutter API Reference

This document describes the API surface currently used by `nisha_flutter/`.

## Base URL

The app reads the backend URL from:

- `API_BASE_URL` via `--dart-define`

Default in the workspace:

- `http://10.0.2.2:8000`

The final request prefix is:

- `AppConfig.apiUrl = $API_BASE_URL/api/v1`

## Request Rules

`lib/core/api/api_client.dart` sends JSON requests with `package:http/http.dart`.

- Request bodies are encoded with `jsonEncode`
- Responses are decoded with `jsonDecode`
- Empty bodies are treated as `null`
- HTTP status codes `>= 400` become `ApiException`

## Error Mapping

The client extracts the message in this order:

1. `detail` from a JSON object
2. `message` from a JSON object
3. A plain string response body
4. `Request failed.`

The UI should always show `ApiException.message` directly.

## Authentication Endpoints

### POST `/auth/login`

Seller and admin login.

Request:

```json
{
  "email": "seller@example.com",
  "password": "secret"
}
```

Response:

```json
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "seller@example.com",
    "full_name": "Seller Name",
    "role": "SELLER",
    "is_active": true,
    "store_slug": "demo-store"
  }
}
```

### POST `/auth/register`

Seller registration.

Request:

```json
{
  "email": "seller@example.com",
  "password": "secret",
  "full_name": "Seller Name"
}
```

### POST `/customer/login`

Customer login with an email or phone login identifier.

Request:

```json
{
  "login": "customer@example.com",
  "password": "secret"
}
```

### POST `/customer/register`

Customer registration.

Request:

```json
{
  "email": "customer@example.com",
  "phone": null,
  "postal_code": null,
  "password": "secret",
  "full_name": "Customer Name"
}
```

### POST `/customer/password-recovery/request`

Starts a recovery flow.

Request:

```json
{
  "login": "customer@example.com",
  "channel": "EMAIL"
}
```

### POST `/customer/password-recovery/verify`

Finishes a recovery flow and returns a fresh customer token.

Request:

```json
{
  "recovery_id": 1,
  "code": "123456",
  "new_password": "new-secret"
}
```

## Current Flutter Models

The app uses these typed wrappers:

- `SellerUser`
- `CustomerUser`
- `SellerTokenResponse`
- `CustomerTokenResponse`
- `CustomerRecoveryStartResponse`
- `CustomerRecoveryVerifyResponse`
- `RecoveryChannel`

## Token Routing

The current app routes auth in the following way:

- `/auth/*` and `/customer/password-recovery/*` do not send a bearer token
- `/customer/*` routes use the customer token
- seller and admin routes use the seller token

This logic lives in the repository and session layer, not in the widget tree.

## Storage Keys

Secure storage keys used by the app:

- `nisha_access_token`
- `nisha_user`
- `nisha_customer_token`
- `nisha_customer`

Preferences keys used by the app:

- `nisha.theme_mode`
- `nisha.locale`

## Current API Scope

Only the auth and password recovery flows are currently wired to the backend from Flutter.

The public store, checkout, invoice, and role dashboard screens are scaffolded in the router, but they still render placeholder content. Add new repository methods there before wiring those pages to live backend data.

## Backend Expectations

The Flutter app expects backend errors to be human-readable. In practice:

- `ApiError.detail` should be localized on the backend
- JSON error responses should include `detail` or `message`
- User-generated content such as names, URLs, and invoice codes should not be translated by the client

