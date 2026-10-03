# Decisions

History, not a spec — see [ARCHITECTURE.md](ARCHITECTURE.md) for what exists
today.

## Real payments were abandoned; the demo credits economy is back

The site briefly took real money: first a per-tournament publishing fee, then a
$5/month hosting subscription, both through Paddle as merchant of record, with
entry fees and prizes declared in dollars and settled off-platform. Paddle
rejected the site three times as gambling (an entry fee plus a prize is the
shape of a wager to a compliance reviewer, however it is framed) and then the
account failed business verification. The owner chose to stop pursuing real
payments altogether rather than keep reshaping the product around a payment
provider's review.

In their place the **demo credits economy** was restored, as it was before any
of that: credits are a play currency with no cash value and no cash-out path,
the checkout is a labelled demo whose card fields are visual only, becoming a
host costs 20 credits, and entry fees escrow into a per-tournament bank that
must cover the prizes before the tournament starts. Every multi-document credit
movement runs in a Mongoose transaction and writes a `Transaction` row;
`server/tests/conservation.test.js` proves credits are conserved.

What was removed: the Paddle SDK and webhook, the subscription module and the
`/billing` page, the plan limit on publishing, the contact address that existed
only to satisfy the payment provider, the Refunds page, and the regression gate
against wagering language. What was kept: everything else built in the
meantime — Cloudflare hosting, password reset and email verification, match
subdocuments, scheduling, score reporting, disputes, notifications, moderation,
dashboards, and the client test suite.

Two things changed in the restoration rather than being restored verbatim:

- **Publishing is free and instant.** The earlier publish flow priced tiers in
  US dollars and waited on a card payment or an admin confirming a bank
  transfer. With no real money that flow has nothing to wait for, so a draft
  simply goes live when its host publishes it, and the publish-request queue
  was not restored.
- **The payout finds the champion from the final match.** Matches are now
  subdocuments, not a flat array of winner ids, so the champion is the winner
  of the final match, and only once that match is `final`.

Joining a full tournament waitlists the entrant without charging them; the fee
is taken only when a withdrawal promotes them (and an entrant who can no longer
afford it loses their place rather than blocking the queue). Leaving before the
start, or being removed by the host, refunds the fee from the bank.

## Why matches are an embedded subdocument, not a collection

A match only ever exists in the context of its tournament — it's read and
written alongside the bracket or the scoreboard, never queried across
tournaments. Embedding it as a `matches` array on the `Tournament` document
means a match's state change (report, confirm, dispute, resolve) is one
document save, not a write to a second collection that then has to be kept
consistent with the tournament's own `status`. The cost is a document that
grows with the bracket size, which is bounded (256 slots, so at most 255
matches) and small enough that it was never a concern in practice.

## Why a disputed match blocks advancement instead of picking a default

When both competitors report a match and disagree, the match moves to
`disputed` rather than auto-resolving in favor of whoever reported first, the
higher score claimed, or any other tiebreak. Any automatic rule is a rule one
side can win by reporting a self-favoring score before the other side gets a
chance to — and the host, who called the event and can see how it actually
went, is a better arbiter than a coin flip dressed up as a formula. Blocking
advancement (rather than continuing the bracket around the gap) means a
dispute is visible and gets resolved instead of quietly holding up a result
nobody agreed to.

## Why the app moved off Vercel to Cloudflare Containers

Vercel's Hobby tier forbids commercial use, and at the time the site took real
subscription payments (it no longer does; see above, and Cloudflare stayed).
Containers beat rewriting onto Workers: Workers alone
can't run this app, since Mongoose's TCP sockets need Node's `net` module in a
form Workers doesn't provide. A Container runs the existing Express/Mongoose
server unchanged, with a Worker serving the SPA and forwarding `/api/*` to it.
