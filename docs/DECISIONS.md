# Decisions

History, not a spec — see [ARCHITECTURE.md](ARCHITECTURE.md) for what exists
today. The one file allowed to mention the old credits model.

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

## Why the app moved off Vercel to Cloudflare Containers

Vercel's Hobby tier forbids commercial use, and the site now takes real
subscription payments. Containers beat rewriting onto Workers: Workers alone
can't run this app, since Mongoose's TCP sockets need Node's `net` module in a
form Workers doesn't provide. A Container runs the existing Express/Mongoose
server unchanged, with a Worker serving the SPA and forwarding `/api/*` to it.
