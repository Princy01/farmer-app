# Banking Module Notes

## Routes

- `POST /payments/initiate`
- `GET /payments/status/:order_id`
- `GET /payments/orders`
- `POST /payments/cancel/:order_id`
- `POST /payments/callback`
- `GET /payments/return`

## Gateway Compatibility

The service now:

- sends `Authorization: Bearer <merchant_id>` to the gateway
- keeps the existing `X-Merchant-ID` and `X-Merchant-Key` headers
- normalizes relative `payment_url` values from the gateway into absolute URLs

This matches the current `gateway-simulation` contract.

## Current Limitation

`PaymentRepository` is still an in-memory repository. That means:

- business order creation and transport flows can be real
- payment initiation/status records are not persisted across backend restarts yet

If payment tracking needs to be production-grade, the next step is replacing the in-memory repository with a real database-backed implementation.
