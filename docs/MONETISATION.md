## Specification

## Goal

Three tournament hosts in Beirut who are not the author's friends pay real money
to publish a tournament, by 3 October 2026. Everything here serves that; nothing
that does not serve it gets built.

## What changes and what does not

**Unchanged:** the credits economy. Credits stay demo, the demo checkout stays a
demo, the conservation invariant stays exactly as it is, and the card-field gate
in `check:regressions` stays. Real money never touches the credits system.

**New:** a _publishing fee_, paid outside the app, that gates whether a
tournament becomes visible. This is a separate concern from credits and lives
in its own module. It reverses "why the demo checkout is a demo" for one narrow
path only, and does it without a payment processor yet: the host arranges
payment by email and an admin confirms by hand. A card gateway replaces that
step — see "Taking the payment" below.

## Taking the payment

Stripe does not serve Lebanese merchants, and the merchant-of-record services
that might have stood in for it either cannot pay out to Lebanon or — in Lemon
Squeezy's case — block Lebanese buyers outright. Two options remain, both local:

- **Areeba**, the Lebanese acquirer. Takes cards, including the Lebanese-issued
  ones most hosts hold, and has a hosted checkout with a server-side callback.
  Needs a registered sole proprietorship and a merchant account.
- **Whish Pay**, the wallet's merchant gateway. Onboards an individual on ID
  alone, settles in dollars, and reaches hosts who have no working card.

**Paddle is the one that is built.** Lebanon is absent from its unsupported
list, it onboards by human review rather than a country gate, and it pays out
to Payoneer, which works here — that last link was the unverified one, and it
is verified now.

How it hangs together:

- `server/src/payments/paddle.js` is the only file that knows the gateway
  exists. Three functions: open a checkout, verify a delivery, read what it
  says.
- Publishing a paid tournament creates the `PublishRequest` row **and** a
  gateway transaction, server-side. Paddle will open a checkout from a price id
  alone, but then the amount and the tournament are chosen by the page, and a
  host who edits them pays for the tier they picked rather than the one they
  are buying.
- `POST /api/webhooks/paddle` verifies the signature over the **raw** body —
  which is why that router is mounted ahead of the JSON parser — and on
  `transaction.completed` marks the row paid and publishes the tournament.
- The charged amount is checked against the tier's price on the way through.
  The price object lives in Paddle's dashboard and the amount lives in
  `config/publishing.js`; that check is the only place the two are held to each
  other.
- Confirmation is idempotent twice over: a replayed event finds the row already
  confirmed, and `providerRef` carries a unique index, so a genuine race loses
  at the database rather than publishing twice.

With no Paddle credentials set the app takes no cards at all and falls back to
a human confirming — the same `PublishRequest` row, a different signature on
it. That is what runs until the merchant account is live, and it is also the
fallback if a webhook is ever missed.

## Pricing

| tier  | max players | fee (USD) |
| ----- | ----------- | --------- |
| free  | 8           | 0         |
| small | 16          | 3         |
| large | 64          | 6         |

Amounts are held in cents, which is what a card is charged in. Lebanon prices
digital services in dollars, so the lira never appears in the code.

The prices cover what the app costs to run rather than earning a margin, but
they do not go lower than this: a card fee is a few percent **plus** about 30
cents fixed, so a one-dollar fee would give a third of itself away. Three
dollars is where the fixed part stops hurting.

Tier is derived from the tournament's configured player cap at publish time.
Prices live in one config file, not scattered through services.

## State machine

Tournament gains a `publishState`:

```
draft ──(host clicks Publish, tier=free)──────────────▶ published
draft ──(host clicks Publish, tier≠free)──▶ pending_payment ──(admin confirms)──▶ published
pending_payment ──(admin rejects)──▶ draft
```

Rules, enforced in the service and covered by tests:

- Only `published` tournaments appear on browse, are joinable, or can be started.
- A `draft` or `pending_payment` tournament is visible only to its host.
- Moving to `pending_payment` records `{ tier, amountLbp, requestedAt }` on the
  tournament and writes a `PublishRequest` row (own model, own module) — that
  row is the audit trail and the admin queue.
- Confirming writes `confirmedAt`, `confirmedBy`, and an optional `paymentRef`.
- Confirming or rejecting a request that is not `pending_payment` is a 409.
- Non-admins calling admin routes get 403. Existing tournaments migrate to
  `published` so nothing currently live disappears.

## Endpoints

```
POST  /api/tournaments/:id/publish          host    → draft → free:published | paid:pending_payment
GET   /api/admin/publish-requests           admin   list pending, newest first
POST  /api/admin/publish-requests/:id/confirm   admin  body { paymentRef? }
POST  /api/admin/publish-requests/:id/reject    admin  body { reason? }
```

`isAdmin` is a boolean on `User`, defaulting false, settable only via a seed
script or direct database edit. No admin UI for making admins.

## Client

1. **Publish step** in the host's tournament editor: shows the tier and fee,
   and for paid tiers a screen with the exact amount, where to write, and the
   tournament id as the payment reference, plus an "I have paid" button that
   calls `/publish`. After that the host sees a "waiting for
   confirmation" banner on their tournament.
2. **Admin page** at `/admin/publish-requests`, reachable only when `isAdmin`:
   a list, each row with tournament name, host, amount, requested time, and
   Confirm / Reject. That is the whole page.
3. **Landing page for hosts** at `/hosts`, Arabic and English with RTL: three
   screenshots, the pricing table, one contact button. Reuse the RTL approach
   from Pensum rather than inventing a new one.

Nothing else. Bracket export, QR sign-up, and any other host feature waits
until a paying host asks for it.

## Testing

New suite `tournaments.publish`:

- free tier publishes immediately; paid tier goes to `pending_payment`
- a `pending_payment` tournament is invisible on browse and cannot be joined
- confirm → published; reject → draft; both refuse on wrong state (409)
- non-admin on admin routes → 403
- `PublishRequest` row exists for every paid publish (ledger-style check)
- migration: existing tournaments are `published`

`check:regressions` gains two gates: the payment contact appears nowhere but the
config file, and no phone number is committed anywhere in the repository.

## Phases

1. Model + migration + service + routes + tests. No UI. CI green.
2. Host publish step and waiting banner.
3. Admin page.
4. `/hosts` landing page, AR + EN.
5. Stop. Go sell. Return here only with a paying host's request in hand.
