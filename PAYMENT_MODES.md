# Payment Modes

The buyer payment screen now supports two modes controlled by `environment.paymentMode`.

## Modes

- `simulated`
  - Default for local and current production builds.
  - Shows a clear in-app notice that simulated payment is being used.
  - Simulates a successful online payment, then continues with the real order creation and transport-request flow.
  - This is the safest mode for testing until the gateway flow is fully operational end to end.

- `gateway`
  - Uses the backend `/payments/initiate` and `/payments/status/:order_id` routes.
  - Opens the gateway page in a new window and polls backend payment status.
  - Requires backend banking configuration to be set correctly.

## Runtime Overrides

For developer testing without a rebuild:

```js
localStorage.setItem('apiUrl', 'http://127.0.0.1:3000');
localStorage.setItem('transportRealtimeUrl', 'http://127.0.0.1:3001');
localStorage.setItem('paymentMode', 'simulated'); // or 'gateway'
location.reload();
```

## Product Notes

- Cash on delivery is intentionally not used in the current buyer flow.
- The UI now treats all supported options as online payment methods.
- In simulated mode, the confirmation page explicitly shows that simulated payment was used.

## Important Limitation

Simulated mode still creates the real business order and transport records, but payment-order persistence on the backend is not database-backed yet. The backend banking repository is currently in-memory.
