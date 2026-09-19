## Specification

## Goal

Three tournament hosts in Beirut who are not the author's friends pay real money
to publish a tournament, by 3 October 2026. Everything here serves that; nothing
that does not serve it gets built.

## What changes and what does not

**Unchanged:** the credits economy. Credits stay demo, the demo checkout stays a
demo, the conservation invariant stays exactly as it is, and the card-field gate
in `check:regressions` stays. Real money never touches the credits system.

**New:** a *publishing fee*, paid outside the app, that gates whether a
tournament becomes visible. This is a separate concern from credits and lives
in its own module. It reverses "why the demo checkout is a demo" for one narrow
path only, and does it without a payment processor: the host pays by Whish
Money to a number shown on screen, and an admin confirms by hand.

Manual confirmation is the deliberate choice. A webhook integration is a week of
work that is worth nothing until there are paying hosts. Automate after five.

## Pricing

| tier   | max players | fee (LBP) |
| ------ | ----------- | --------- |
| free   | 8           | 0         |
| small  | 16          | 150,000   |
| large  | 64          | 300,000   |

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
- Confirming writes `confirmedAt`, `confirmedBy`, and an optional `whishRef`.
- Confirming or rejecting a request that is not `pending_payment` is a 409.
- Non-admins calling admin routes get 403. Existing tournaments migrate to
  `published` so nothing currently live disappears.

## Endpoints

```
POST  /api/tournaments/:id/publish          host    → draft → free:published | paid:pending_payment
GET   /api/admin/publish-requests           admin   list pending, newest first
POST  /api/admin/publish-requests/:id/confirm   admin  body { whishRef? }
POST  /api/admin/publish-requests/:id/reject    admin  body { reason? }
```

`isAdmin` is a boolean on `User`, defaulting false, settable only via a seed
script or direct database edit. No admin UI for making admins.

## Client

1. **Publish step** in the host's tournament editor: shows the tier and fee,
   and for paid tiers a screen with the Whish number, the exact amount, the
   tournament id as the payment reference, and an "I have sent the payment"
   button that calls `/publish`. After that the host sees a "waiting for
   confirmation" banner on their tournament.
2. **Admin page** at `/admin/publish-requests`, reachable only when `isAdmin`:
   a list, each row with tournament name, host, amount, requested time, and
   Confirm / Reject. That is the whole page.
3. **Landing page for hosts** at `/hosts`, Arabic and English with RTL: three
   screenshots, the pricing table, one WhatsApp button. Reuse the RTL approach
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

`check:regressions` gains one gate: no Whish number hardcoded outside the
config file.

## Phases

1. Model + migration + service + routes + tests. No UI. CI green.
2. Host publish step and waiting banner.
3. Admin page.
4. `/hosts` landing page, AR + EN.
5. Stop. Go sell. Return here only with a paying host's request in hand.
