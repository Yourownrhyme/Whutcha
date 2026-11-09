# NODE 8: PAYMENTS & STATE MANAGEMENT

## 1. The Payment Webhook Bridge
Payments are handled strictly off-platform (e.g., Stripe Checkout, LemonSqueezy) to ensure PCI compliance and minimize frontend weight.
*   **The Flow:**
    1. `viewer.html` redirects the fan to a Stripe Checkout URL.
    2. Fan pays.
    3. Stripe sends a Webhook to a Supabase Edge Function (e.g., `/verify-purchase`).
    4. The Edge Function verifies the Stripe signature and updates the `donations` row `status` to `paid`.
    5. Supabase Realtime detects the `status: paid` change and fires an event to `dashboard.html`.
*   *Agent Rule:* Do not implement client-side payment logic. The frontend only reacts to database state changes.

## 2. Vanilla JS State Management
Since we refuse to use React, Vue, or Svelte, state is managed deterministically via the DOM and LocalStorage.
*   **Data Attributes:** We heavily utilize `data-*` attributes on HTML elements to store ID references (e.g., `data-donation-id="123"`).
*   **Event Delegation:** We use global event listeners rather than attaching inline `onclick` handlers to dynamic elements, preventing memory leaks when the DOM re-renders.
*   **Agent Rule:** If you need to update a component, surgically target its `#id`. Do not re-render entire sections of the page blindly.
