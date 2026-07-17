# Project Recon

# Events Application Architecture

**Status:** 🔒 LOCKED

**Application:** `events`

> This document defines the overall architecture of the Events application. It describes the business domain, responsibilities, permissions, workflows, and high-level rules. It intentionally excludes database design, API design, and implementation details.

---

# 1. Purpose

The Events application manages all institute events.

Unlike the CMS application, which only manages content, the Events application manages complete event lifecycles including:

- Event publishing
- Tournament management
- Workshop management
- Registration
- Live events
- Match management
- Rankings
- Event payments

This application is a standalone business domain.

---

# 2. Scope

The Events application manages:

- Events
- Tournaments
- Tournament Teams
- Matches
- Workshops
- Event Registrations
- Event Payments

---

# 3. Business Principles

## Events are business entities

Events are not CMS content.

They have their own lifecycle, business rules, permissions, registrations, and reports.

---

## Shared Event Information

Every event shares common information such as:

- Title
- Description
- Banner
- Branch
- Schedule
- Location
- Registration
- Visibility
- Live Streaming

Specific event types extend this information.

---

## Specialized Event Types

Instead of one large model containing nullable fields, every event type extends a common Event.

Supported event types:

- Tournament
- Workshop

Future event types can be added without changing existing ones.


---

# 4. Core Architecture

```text
Event
│
├── Tournament
│       │
│       ├── Tournament Team
│       └── Match
│
├── Workshop
├── General
│
└── Event Registration
        │
        ▼
Shared Payment Service
        │
        ▼
Configured Payment Provider
        │
        ▼
Chapa / Stripe / Future Providers
```

---

# 5. Event

The Event entity owns all shared information.

Examples:

- Robotics Tournament
- AI Workshop
- Programming Bootcamp

An Event may exist independently as a General Event, or it may be extended by exactly one specialized event type such as a Tournament or Workshop.

---

## Shared Information

An Event contains:

- Title
- Description
- Banner Image
- Branch (optional)
- Location
- Start Date & Time
- End Date & Time
- Status
- Visibility
- Registration Configuration
- Capacity
- Live YouTube URL
- Active State

---

## Global Events

Branch is optional.

If Branch is NULL:

The event is considered a Global Event.

Examples:

- National Robotics Championship
- National AI Conference

Otherwise, the event belongs to a specific branch.

---

# 6. Tournament

Tournament extends Event.

Additional information includes:

- Competition Category
- Registration Deadline(if registration is allowed)
- Maximum Teams(optional)

A Tournament owns:

- Teams
- Matches

---

## Supported Categories

Initially:

- VEX IQ
- VEX V5
- Enjoy AI

Additional categories may be added later.

---

# 7. Tournament Teams

Every Tournament contains participating teams.

Each team contains information such as:

- Team Name
- School
- Wins
- Losses
- Draws
- Total Points

Rank is **not stored**.

Rank is calculated dynamically from match results.

This guarantees consistency.

---

## Tournament Participation

Tournament participation supports two independent workflows.

### Manual Participation

Tournament Teams may always be created manually by authorized staff.

This workflow is available regardless of whether registration is enabled.

Staff may manually:

- Create Tournament Teams
- Edit Tournament Teams
- Schedule Matches
- Record Match Scores
- Manage Tournament Progress

This supports:

- Internal tournaments
- Invitation-only tournaments
- Walk-in participants
- Teams registered outside the system

---

### Registration-Based Participation

If registration is enabled for a Tournament, participants may register according to the configured registration rules.

After approval (and payment if required), a registration may be converted into a Tournament Team.

Registration is **only an additional method** of creating Tournament Teams.

It is **not required** for tournament management.


# 8. Matches

A Match represents one game inside a Tournament.

A Match contains:

- Team A
- Team B
- Scores
- Winner
- Round
- Scheduled Time
- Completion Time
- Status

Matches automatically contribute to Tournament standings.

---

# 9. Rankings

Tournament rankings are generated dynamically.

Rank is calculated from:

- Wins
- Losses
- Draws
- Points

Rank is never stored in the database.

---

# 10. Workshop

Workshop extends Event.

Additional information includes:

- Instructor
- Duration
- Level
- Price

A Workshop may optionally include:

- Live YouTube Stream

---

# 11. Registration

Registration is optional.

Every Event decides whether registration is enabled.

---

## Registration Modes

Supported modes:

### NONE

Registration disabled.

---

### PUBLIC

Anyone may register.

---

### STUDENT

Only authenticated students may register.

---

### SUBPROGRAM_STUDENT

Only students enrolled in selected Academic Sub Programs may register.

This allows institute-exclusive events.

---

# 12. Registration Configuration

Every Event controls:

- Registration Enabled
- Registration Mode
- Registration Deadline
- Capacity
- Payment Required
- Registration Fee

Capacity is optional.

If Capacity is NULL:

Unlimited registrations are allowed.

---

# 13. Event Registration

A single Event Registration model is used for every event type.

Separate registration models are not created for Tournaments or Workshops.

Public registrations are supported.

Student registrations are also supported.

---

# 14. Event Payments

Payments are optional.

If Payment Required is enabled:

Registration is not confirmed until payment succeeds.

If Payment Required is disabled:

Registration is confirmed immediately.

---

## Payment Integration

The Events application never communicates directly with payment providers.

Instead:

```text
Events

↓

Shared Payment Service

↓

Configured Provider

↓

Chapa / Stripe / Future Providers
```

The active provider is selected dynamically through environment configuration.

---

# 15. Live Events

Events automatically appear in one of three categories.

Future

```text
Current Time < Start Time
```

---

Live

```text
Start Time <= Current Time <= End Time
```

---

Past

```text
Current Time > End Time
```

These states are calculated automatically.

They are never manually managed.

---

# 16. Visibility

Only published events are visible to students and the public.

Draft events remain visible only to authorized staff.

---

# 17. Permissions

## Super Admin

Full access.

Can perform every action.

---

## Branch Manager

Full management within their own branch.

Cannot manage events belonging to other branches.


---

## Secretary

Registration management only.

Responsibilities include:

- View registrations
- Approve registrations (if required)
- Cancel registrations
- Manage participant lists

Only when registrations are enabled.

---

## Instructor

May manage only workshops where they are the assigned instructor.

Cannot manage tournaments.

---

## Student

May:

- View published events
- Register when permitted
- View personal registrations

---

## Public User

May:

- View published events

May register only when:

Registration Mode = PUBLIC.

---

# 18. Registration Workflow

Registration follows this workflow.

Registration Request

↓

Business Validation

↓

Capacity Validation

↓

Registration Rules Validation

↓

Payment (if required)

↓

Registration Confirmation

---

# 19. Business Rules

## Event Ownership

Every specialized event owns exactly one Event.

---

## Branch

Branch is optional.

NULL indicates a Global Event.

---

## Registration

Registration is configurable.

Every event independently decides whether registration is allowed.

---

## Capacity

Capacity is optional.

NULL indicates unlimited registrations.

---

## Payments

Payments are independent of registration.

Registration may require payment or may be free.

---

## Ranking

Tournament rankings are generated dynamically.

They are never stored.

---

## Match Results

Every Match contributes to Tournament standings.

---

## Live Streams

Tournaments and Workshops may optionally include a YouTube Live URL.

This is used for live broadcasting.

---

## External Integrations

Events communicate only with shared services.

Direct communication with external providers is prohibited.

---

## Tournament Rules 

- Tournament management is independent of registration.
- Tournament Teams may always be created manually by authorized staff.
- Tournament Teams may optionally be created from approved registrations.
- Matches always reference Tournament Teams.
- Match creation, score recording, standings, and rankings are available regardless of whether registration is enabled.
- Registration payments affect only registration approval and never tournament management.

# 20. Future Expansion

The architecture allows additional event types without modifying existing ones.


---

# 21. Locked Design Decisions

The following decisions are finalized.

- Events are implemented as a standalone application.
- CMS remains responsible only for content management.
- Event contains all common event information.
- Tournament and Workshop extend Event.
- Branch is nullable, allowing Global Events.
- Event registrations are optional and configurable.
- Registration modes support Public, Student, and Sub Program restricted registration.
- Capacity is nullable, allowing unlimited registrations.
- Registration and payment are independent workflows.
- Payment requirements are configurable per event.
- All online payments use the shared payment service and the configured provider (e.g., Chapa, Stripe).
- Tournaments own Teams and Matches.
- Tournament rankings are calculated dynamically and are never stored.
- Live, Future, and Past event states are derived automatically from event dates.
- Tournaments and Workshops may optionally include a YouTube Live stream URL.
- The architecture is extensible for future event types without requiring changes to existing event types.

---

# Status

**🔒 LOCKED**

