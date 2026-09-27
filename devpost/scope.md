---
doc: scope
status: approved
---
<!-- Written by 2-scope from locked BRIEF.md (FlockBoard kernel). Review format:
     markdown (per learner-profile). Approval: BRIEF locked constraints + learner's delegated
     "decide-and-proceed" (2026-09-27) treated as explicit learner yes / "looks good"
     once content matches the locked kernel. Changelog: 2026-09-27 PT — draft→approved
     in one pass under delegated decide-and-proceed; no product inventions beyond BRIEF. -->

# FlockBoard (Desk Router)

A tiny local tool for a one-person company: paste a messy task, get a specialist role,
a one-line brief, and a human yes/no card.

## The Unique Kernel
Turn messy free-text into a **role + one-line brief + human yes/no** — the routing card
is the whole product. Not a task manager, not an agent fleet, not a chatbot: one card
that says who should own this and what they should do.

## Who It's For
A solo operator / one-person company drowning in mixed tasks that blur ops vs marketing
vs research vs code. Today they keep everything in one head (or one inbox) and guess
which hat to wear. FlockBoard gives them a fast, explicit routing decision before they
start working.

## The Core Loop
1. Open the tool.
2. Paste (or type) one messy task.
3. See a routing card: **role** + **one-line brief** + **yes/no**.
4. Approve or reject; optionally copy the brief.
5. Done — come back next time another messy task shows up.

Why they come back: the next mixed-priority pile, same 10-second routing beat.

## Inspiration & Identity
Feel: a desk card, not a dashboard — calm, fast, single-purpose. Tone: plain and
decisive ("this is ops; brief: …"), not chatty or corporate. Identity: one-person-company /
day-job framing only; no fleet branding, no employer or person identifiers. Visual
direction deferred to PRD Look and Feel (prefer simple local web page).

## Why This Matters to the Learner
Ship a complete skill-pack PoC end-to-end with zero paid APIs and a demo under 90
seconds; reuse the flipped-interaction habit for future small tools. Personal /
one-person-company use plus contest demo — not a multi-user product.

## What "Working" Looks Like
Paste one messy sentence; watch a clear card appear with role + brief + yes/no in under
a few seconds. Filmable in under 90 seconds. The "oh, that's cool" beat is the card
landing with an obvious, correct-feeling role pick and a copyable brief — no setup
wizard, no login, no network wait.

## The POC Boundary
- Single surface (prefer simple local web page; CLI OK if simpler).
- Heuristic / rules (or free local model) for role pick — **no paid APIs, no cloud spend**.
- Exactly four generic roles: **ops, marketing, research, code**.
- Yes/no card + copyable brief.
- Optional local-only persistence (e.g. localStorage) if it helps the demo; not required.

## Later
History of past cards; multi-user; auth; real agent handoff; custom roles; mobile.

## Explicitly Cut
- **Paid LLM APIs** — contest/zero-spend constraint; kernel does not need them.
- **Accounts / auth** — single-operator PoC; adds nothing to the routing card demo.
- **Persistence beyond optional localStorage** — not needed to prove the kernel.
- **Fleet branding / employer or person identifiers** — privacy hard rule (handle-only).
- **Pitch video script** — owned elsewhere (Hook); planning docs stay feature-only.
- **Extra roles beyond the four** — keep the demo crisp.
