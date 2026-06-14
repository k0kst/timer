# BountyTimer — Product Requirements Document
**Version:** 1.0 | **Date:** June 2026 | **Status:** Draft

> **Tagline:** Focus. Earn. Rest. Repeat.

---

## Table of Contents
1. [Overview](#1-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Target User](#3-target-user)
4. [Feature Specifications](#4-feature-specifications)
5. [Cross-Device Sync & Hosting](#5-cross-device-sync--hosting)
6. [UX & Design Direction](#6-ux--design-direction)
7. [Core User Flows](#7-core-user-flows)
8. [Data Model](#8-data-model)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Suggested Build Milestones](#10-suggested-build-milestones)
11. [Open Questions](#11-open-questions)
12. [Glossary](#12-glossary)

---

## 1. Overview

BountyTimer is a personal productivity web app that ties focused work directly to guilt-free rest. Every task you add carries a **time bounty** — a reward you set upfront. Completing a task deposits that time into your **Break Bank**, which you spend on breaks using a countdown timer. A per-task stopwatch records how long you actually spent, giving you a growing log of real focus data to reflect on over time.

The app is built as a cross-platform PWA (Progressive Web App) accessible in any mobile or desktop browser, with one-time account creation to keep your to-do list, break bank, and history in sync across all devices.

### 1.1 Problem Statement

Current productivity tools treat focus and rest as separate concerns. Users either track tasks or track time, rarely both together, and rest is almost always unearned and untracked. This creates two failure modes:

- **Guilt during breaks** — "I shouldn't be resting yet"
- **Poor data** — no record of where time actually went vs. where you thought it would

### 1.2 Solution Summary

BountyTimer makes the exchange explicit: **work earns rest**. The bounty mechanic removes break-guilt because you can see exactly how much rest time you have banked. The stopwatch layer captures the truth — how long work actually took versus how long you estimated. Over time this becomes a personal dataset for improving self-estimates and understanding your own focus patterns.

> **Design Principle:** The break bank should feel like a reward, not a ledger. Visual design and copy should reinforce that rest is something you have *earned*, not borrowed.

---

## 2. Goals & Non-Goals

### 2.1 Goals

- Make task completion feel rewarding through immediate, tangible break-time earnings
- Provide honest focus tracking: estimated vs. actual time per task, both recorded
- Give a seamless single-profile experience across iPhone, iPad, and desktop browser
- Keep the UI frictionless — adding a task and starting the stopwatch should take under 10 seconds
- Surface lightweight analytics so users can improve their self-estimates over time
- Support a manual bank reset so users can start fresh without deleting their history

### 2.2 Non-Goals (v1)

- Native iOS or Android apps (PWA covers this in v1)
- Team or shared workspaces — this is a solo personal tool
- Calendar integration or scheduling
- AI-generated task suggestions or automatic time estimates
- Monetisation, subscriptions, or ads

---

## 3. Target User

**Primary user:** a self-directed individual (student, knowledge worker, or creative) who sets their own schedule, wants to track focused work sessions, and finds value in data about their own habits. Specifically, someone who:

- Plans their day with a task list rather than a rigid schedule
- Struggles to take guilt-free breaks without a sense of having "earned" them
- Is curious about where their time actually goes versus where they think it goes
- Regularly works across both a phone and a laptop or desktop machine

> **User Context:** Isaac, 21, Singapore. Internship ending June 2026, starting BSc Economics at UCL in September. Uses iOS (iPhone + iPad) and desktop browser. Studies in focused sessions with intentional rest. Needs something that works during transit on his phone and at his desk.

---

## 4. Feature Specifications

### 4.1 Task List with Bounty

The task list is the entry point to every session. Each item carries a bounty — the break time earned on completion — and a stopwatch that tracks actual focus time.

#### 4.1.1 Adding a Task

- **Title** (required, free text, up to 120 characters)
- **Estimated time** (required): user types a number and selects unit — minutes or hours. Becomes the bounty amount by default.
- **Bounty override** (optional): user can decouple the bounty from the estimate. E.g. a task estimated at 90 min might only bounty 20 min if it is low-effort.
- **Priority tag** (optional): High / Medium / Low for visual sorting
- **Notes** (optional, collapsible): freeform context, links, or sub-steps

#### 4.1.2 Task States

| State | Description |
|-------|-------------|
| `not_started` | Task added, stopwatch at 00:00, no focus session begun |
| `in_progress` | Stopwatch running. Task highlighted in the list. Only one task can be in this state at a time. |
| `paused` | Stopwatch stopped but task not complete. Accumulated time saved. |
| `complete` | User marks done. Bounty credited to Break Bank. Stopwatch stops and saves actual time. |
| `archived` | Completed tasks older than the current day move to history. Accessible in Analytics. |

#### 4.1.3 Stopwatch Behaviour

- Each task has its own stopwatch, independent of all others
- **Only one stopwatch may run at a time.** Starting one auto-pauses any currently running stopwatch.
- Stopwatch state persists across page refreshes and device switches via the backend (not localStorage)
- Elapsed time displayed live in `HH:MM:SS` format on the task card
- When a task is marked complete, final elapsed time is saved as **actual time** alongside the original estimate
- A task may be re-opened after completion (e.g. for additional work), which resumes its stopwatch. The bounty is only credited once at the first completion.

#### 4.1.4 Completing a Task

1. Tap/click **Complete** on the task card
2. Confirmation prompt shows: task title, bounty amount, and new projected bank total
3. On confirm: bounty is credited to the Break Bank, a subtle animation plays (bank counter ticks up), task moves to completed state
4. Actual time from stopwatch is logged

#### 4.1.5 Task List Management

- Reorder by drag-and-drop (desktop) / long-press drag (mobile)
- Swipe left to delete (mobile); delete button on hover (desktop)
- Edit any field on an uncompleted task at any time
- Filter: All / Active / Completed
- Sort: Manual (default), Priority, Bounty size, Date added

---

### 4.2 Break Bank

The Break Bank is the accumulated break time earned from completing tasks. It grows when you complete tasks and shrinks when you take breaks.

#### 4.2.1 Bank Display

- Prominent balance: total break time available, formatted as `H:MM` or `MM:SS` depending on scale
- Last credited amount shown as a recent transaction (e.g. `+25 min — Finished reading summary`)
- Running total of break time **earned today** vs. **spent today**

#### 4.2.2 Starting a Break

- **"Take a Break"** button visible whenever bank balance > 0
- User selects duration: quick options (5 / 10 / 25 min) or custom input
- Countdown timer starts; Bank balance decreases in real time as break runs
- At zero: gentle notification fires (browser notification if permitted, else on-screen alert)
- User may **end break early** — unused time is returned to the bank
- User may **extend a break** mid-session, drawing further from the bank

#### 4.2.3 Bank Persistence & Reset

- Balance rolls over indefinitely — it does not expire
- Manual reset available via Settings: **"Reset Break Bank to 0"**
- Reset requires a two-tap confirm to prevent accidents
- Reset event is logged in history with timestamp and balance at time of reset
- Full transaction history (credits and debits) is retained even after a reset

---

### 4.3 Focus Stopwatch (Per-Task)

Each task has an embedded stopwatch. Controls appear directly on the task card to minimise friction.

- Start / Pause / Resume controls on the card
- Live elapsed time always visible — does not require expanding the card
- **Global indicator** in the app header shows which task is currently active and its running time
- If the app is closed or the device sleeps, elapsed time is calculated from a server-stored start timestamp on re-open — no time is lost
- Maximum session length per task: 8 hours (after which the stopwatch auto-pauses and the user is prompted)

---

### 4.4 Analytics & History

A lightweight history view surfaces patterns without overwhelming the interface. Accessible via a bottom nav tab (mobile) or sidebar item (desktop).

#### 4.4.1 Daily Summary

- Tasks completed today
- Total focus time today (sum of all stopwatch sessions)
- Total break time earned today vs. spent today
- Estimate accuracy today: average % deviation of actual vs. estimated time

#### 4.4.2 Task History Log

- Completed tasks with: date, title, estimated time, actual time, bounty earned
- Filterable by date range
- Sortable by any column
- Exportable as CSV

#### 4.4.3 Trend Charts (Simple)

- Weekly bar chart: focus hours per day
- Weekly bar chart: break time earned vs. spent per day
- Estimation accuracy scatter plot: estimated vs. actual minutes, one dot per task

---

## 5. Cross-Device Sync & Hosting

### 5.1 Account Model

On first visit, the user creates a single profile with a **username and password**. No email required unless password recovery is desired (can be added later in Settings). All data is tied to this account and accessible from any signed-in browser.

- **Username:** unique, 3–30 characters, alphanumeric + underscores
- **Password:** hashed server-side, min 8 characters
- **Optional email:** for password recovery, addable later in Settings
- **Session:** JWT with 30-day rolling expiry — users stay signed in on trusted devices
- Sign-in on a new device takes under 30 seconds

### 5.2 What Syncs

| Data | Sync Behaviour |
|------|----------------|
| Task list | Real-time sync via websocket or short-poll. Changes appear on another device within 3 seconds. |
| Stopwatch state | Active start timestamp stored server-side. Re-opening on any device resumes from correct elapsed time. |
| Break Bank balance | Updated server-side on every credit/debit. Single source of truth. |
| Transaction history | Append-only server log. Full history available on any device. |
| Settings & preferences | Synced on save. |

### 5.3 Recommended Hosting Stack

| Layer | Recommended Option | Rationale |
|-------|--------------------|-----------|
| Frontend | React PWA via **Vercel** | Free tier, automatic Git deploys, global CDN, HTTPS |
| Backend API | Node.js + Express on **Railway** or **Render** | Free tier sufficient for solo use, easy env var management |
| Database | **Supabase** (PostgreSQL) | Free tier, built-in auth, real-time subscriptions, excellent DX |
| Auth | Supabase Auth or custom JWT | Handles hashing, sessions, optional email recovery |
| Push Notifications | Browser Notification API (PWA) | No extra service needed; works on iOS 16.4+ Safari and all desktop browsers |
| File Export | Client-side CSV generation | No server cost; generates on demand from local data |

> **On PWA vs Native App:** A PWA installed from Safari on iOS behaves near-identically to a native app: home screen icon, full-screen mode, offline caching, and push notifications (iOS 16.4+). This covers iPhone, iPad, and desktop browser from a single codebase.

### 5.4 Offline Behaviour

- UI shell and last-fetched data are cached via a Service Worker. The app opens and is readable without internet.
- Task edits and stopwatch controls made offline are **queued locally** and synced when the connection restores
- Bank balance is not modified offline — transactions are deferred to prevent desync
- An offline indicator banner is shown when the app is operating on cached data

---

## 6. UX & Design Direction

### 6.1 Navigation Structure

Three primary views:

- **Tasks** (default) — task list, inline stopwatches, quick-add button
- **Bank** — Break Bank balance, take-a-break countdown, today's credit/debit summary
- **History** — daily summaries, task log, trend charts

Accessed via **bottom navigation bar** on mobile and a **left sidebar** on desktop.

A **persistent mini-bar** at the top of every view shows:
- Currently active task (if any) with its running stopwatch
- Current Break Bank balance

This keeps the two most important numbers visible at all times.

### 6.2 Mobile-First Constraints

- All tap targets minimum 44px height
- Swipe gestures: left to delete, right to start stopwatch
- Bottom navigation — no hamburger menus
- Task cards compact by default; expand on tap to show notes and full controls
- Break countdown displayed as a large clock-face — easy to glance at

### 6.3 Visual Tone

Calm and focused, not gamified. The bounty mechanic should feel like a considered exchange, not a points-and-badges game.

- Muted navy and teal palette, generous whitespace
- One expressive animated moment: the bank balance ticking up on task completion
- Everything else clean and quiet — no confetti, no streaks, no league tables

---

## 7. Core User Flows

### Flow A — Focus Session (Most Common)

1. Open app (any device, already signed in)
2. Tap **+** to add a task: enter title and estimated time. Bounty auto-sets to match estimate (adjustable).
3. Tap the **play button** on the task card to start the stopwatch
4. Work on the task. Pause/resume as needed.
5. Tap **Complete**. Confirm. Bounty deposited into Break Bank. Stopwatch time saved.
6. Repeat until ready for a break.

### Flow B — Taking a Break

1. Switch to the **Bank** tab
2. Tap **"Take a Break"**. Choose duration from quick options or enter a custom amount.
3. Countdown begins. Bank balance decreases in real time.
4. At zero: notification fires. User returns to Tasks.
5. If break ends early, unused time is returned to the bank.

### Flow C — New Device Setup

1. Open the app URL on the new device
2. Tap **Sign In**. Enter username and password.
3. Full task list, bank balance, and history loads.
4. (Optional) Add to home screen for PWA install.

---

## 8. Data Model

### `users`
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | Primary key |
| `username` | text | Unique, 3–30 chars |
| `password_hash` | text | bcrypt |
| `email` | text? | Optional, for recovery |
| `created_at` | timestamptz | |

### `tasks`
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → users |
| `title` | text | Max 120 chars |
| `estimated_mins` | integer | Set by user |
| `bounty_mins` | integer | Defaults to estimated_mins, overridable |
| `priority` | enum | high / medium / low / none |
| `notes` | text? | Optional |
| `status` | enum | not_started / in_progress / paused / complete / archived |
| `created_at` | timestamptz | |
| `completed_at` | timestamptz? | |

### `stopwatch_sessions`
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | Primary key |
| `task_id` | uuid | FK → tasks |
| `started_at` | timestamptz | Server-stored start time |
| `ended_at` | timestamptz? | Null if currently running |
| `elapsed_seconds` | integer | Computed on close |

### `bank_transactions`
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → users |
| `type` | enum | credit / debit / reset |
| `amount_mins` | integer | Positive for credit, negative for debit |
| `task_id` | uuid? | FK → tasks (for credits only) |
| `note` | text? | Human-readable label |
| `created_at` | timestamptz | |

### `bank_balance` (cached)
| Field | Type | Notes |
|-------|------|-------|
| `user_id` | uuid | PK, FK → users |
| `balance_mins` | integer | Derived from transactions, cached for performance |
| `updated_at` | timestamptz | |

### `break_sessions`
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → users |
| `requested_mins` | integer | Duration user selected |
| `actual_mins` | integer | Actual time spent (may differ if ended early) |
| `started_at` | timestamptz | |
| `ended_at` | timestamptz? | |

---

## 9. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Load time (first paint, cached) | < 1 second on 4G |
| Sync latency (change visible on second device) | < 3 seconds |
| Data durability | PostgreSQL with daily backups; zero tolerance for lost bank balance data |
| Browser support | Safari iOS 16+, Chrome Android, Chrome/Safari/Firefox desktop (latest 2 versions) |
| Offline capability | Core UI readable; edits queued for sync on reconnect |
| PWA installability | Passes install criteria on iOS Safari and Chrome Android |
| Uptime | 99% (Vercel + Railway/Render free tiers sufficient for personal use) |
| Security | HTTPS everywhere, bcrypt password hashing, JWT with expiry, no PII beyond optional email |

---

## 10. Suggested Build Milestones

| Milestone | Scope | Goal |
|-----------|-------|------|
| **M1 — Local MVP** | Task list + stopwatch + bounty logic, all in-browser with localStorage | Validate the core mechanic feels right before building a backend |
| **M2 — Break Bank UI** | Bank display, take-a-break countdown, manual reset | Full feature set working locally end-to-end |
| **M3 — Backend + Auth** | Supabase schema, API routes, user auth, data migration from localStorage | Single source of truth; cross-device ready |
| **M4 — PWA + Notifications** | Service worker, manifest, offline queue, push notification on break end | Install on iPhone and iPad; runs as near-native app |
| **M5 — Analytics** | History log, daily summary, three trend charts, CSV export | Reflection and self-improvement layer |
| **M6 — Polish** | Animations, empty states, error handling, onboarding flow | Production-quality experience |

---

## 11. Open Questions

- **Notification permission flow:** iOS Safari requires PWA install before granting push notifications. Should there be an in-app prompt guiding this on first use?
- **Task categories / projects:** Should tasks be groupable by subject area? Deferred to v2, but the data model should accommodate a `project_id` FK on tasks.
- **Bank cap:** No cap currently. If hoarding break time becomes psychologically unhelpful in practice, a soft warning above a configurable threshold (e.g. > 3 hours banked) could be added as a setting.
- **Recurring tasks:** High-frequency repeated tasks (e.g. "Read for 30 minutes daily") could benefit from a recurrence feature. Out of scope for v1.
- **Social / accountability:** No sharing features in scope. The data model supports it, but requires careful privacy consideration for a personal tool.

---

## 12. Glossary

| Term | Definition |
|------|------------|
| **Bounty** | The break time amount assigned to a task as a reward for completion |
| **Break Bank** | The running total of earned but unspent break time |
| **Stopwatch** | A per-task timer that tracks actual focus time elapsed |
| **Credit** | A positive transaction to the Break Bank (task completion) |
| **Debit** | A negative transaction to the Break Bank (break taken) |
| **PWA** | Progressive Web App — a web app installable on a device home screen with near-native capabilities |
| **Estimated time** | The duration the user expects a task to take, set when adding the task |
| **Actual time** | The elapsed time recorded by the stopwatch when the task is marked complete |
| **Estimate accuracy** | The ratio of actual to estimated time, used in analytics to surface calibration trends |

---

*BountyTimer PRD v1.0 — Personal use. June 2026.*
