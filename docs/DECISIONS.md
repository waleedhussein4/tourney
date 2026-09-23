# Decisions

History, not a spec — see [ARCHITECTURE.md](ARCHITECTURE.md) for what exists
today. The one file allowed to mention the old credits model, and entry fees
and prizes.

## 2026-09-22 — Why entry fees and prizes were removed from tournaments

Paddle reviewed the site and rejected it, classifying it as "Gambling,
betting, wagering." The previous fix (below) had already stopped the app from
holding or moving that money, but every tournament still _advertised_ an
entry fee players paid in and a prize pool a winner took out — declared, not
collected, but still the shape of a wager from the outside. Paddle's review
looks at what the product describes, not just what it processes.

The fix: `entryFee`, `prize`, and `prizes` are gone — from the tournament
model, the API, and every screen. A tournament now only tracks who is
competing, brackets, and standings. The only paid product left is the
$5/month hosting subscription in `server/src/config/plans.js`, which Paddle
approved once the wagering shape was gone. A migration
(`server/scripts/drop-money-fields.js`) clears the stray fields off documents
written before this change.

## Why the credits economy was replaced by a subscription

The original design escrowed entry fees into a per-tournament bank and paid
prizes out of it — the app moving other people's money. That's money
transmission, and a paid bracket with a payout is a wagering contract in most
places, i.e. gambling — both licensed activities. Worse, credits had no
cash-out path: money went in (a demo checkout, never real) and never came out,
so the "economy" could never legally become real.

The fix: the site stops touching money entirely. Entry fees and prizes are
declared USD amounts the host and players settle directly, outside the app.
The app charges its own $5/month hosting subscription instead — a fee for
using the software, not a cut of anyone's winnings.

## Why Paddle

Paddle is a merchant of record: it is the seller on the card statement,
handles sales tax/VAT itself, and pays out to Payoneer, which this project's
owner can receive. A plain processor (Stripe, etc.) would leave tax
compliance to us, out of scope for a $5/month hobby-priced product.

## Why exactly one free live tournament

Zero means nobody tries the product; unlimited means nobody subscribes. One
live tournament is a genuine full trial — a real event, start to finish — and
the limit only bites the moment a second would run concurrently, exactly when
the subscription starts being worth something.

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

Vercel's Hobby tier forbids commercial use, and the site now takes real
subscription payments. Containers beat rewriting onto Workers: Workers alone
can't run this app, since Mongoose's TCP sockets need Node's `net` module in a
form Workers doesn't provide. A Container runs the existing Express/Mongoose
server unchanged, with a Worker serving the SPA and forwarding `/api/*` to it.
