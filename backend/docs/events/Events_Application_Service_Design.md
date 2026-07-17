# Project Recon

# Events Application

# 🔒 Services Design

**Status:** 🔒 LOCKED

**Application:** `events`

> This document defines the complete business service layer for the Events application. It specifies the responsibilities of each service, service boundaries, service interactions, and the business rules enforced by the service layer. Database schema, APIs, and implementation details are intentionally excluded.

---

# 1. Service Layer Principles

The Events application follows the Project Recon service architecture.

```text
API Layer
      │
      ▼
Business Service
      │
      ▼
Validators
      │
      ▼
ORM / Repository
      │
      ▼
Database
```

Business rules are implemented inside Services.

Views remain thin.

Models remain data containers.

Validators perform business validation only.

---

# 2. Service Structure

```text
services/

    event_service.py

    tournament_service.py

    tournament_team_service.py

    match_service.py

    ranking_service.py

    workshop_service.py

    registration_service.py

    event_payment_service.py

    validators/

        event_validator.py

        tournament_validator.py

        registration_validator.py

        workshop_validator.py

        match_validator.py

    queries/

        public_events.py

        live_events.py

        upcoming_events.py

        past_events.py

        rankings.py
```

---

# 3. Event Service

## Purpose

Manages the lifecycle of Events.

---

## Responsibilities

- Create General Event
- Create Tournament Event
- Create Workshop Event
- Update Event
- Publish Event
- Unpublish Event
- Cancel Event
- Activate Event
- Deactivate Event
- Validate Event Dates
- Validate Registration Configuration

---

## Does NOT

- Register Participants
- Create Tournament Teams
- Record Matches
- Process Payments
- Calculate Rankings

---

# 4. Tournament Service

## Purpose

Manages Tournament configuration.

---

## Responsibilities

- Create Tournament
- Update Tournament
- Delete Tournament
- Validate Tournament
- Manage Tournament Settings
- Close Tournament
- Reopen Tournament

---

## Does NOT

- Create Matches Automatically
- Generate Brackets
- Schedule Matches
- Assign Teams Automatically
- Calculate Rankings

---

# 5. Tournament Team Service

## Purpose

Manages Tournament participants.

---

## Responsibilities

- Create Tournament Team
- Update Tournament Team
- Delete Tournament Team
- Convert Approved Registration into Tournament Team
- Validate Team Information

---

## Supports

### Manual Team Creation

Authorized staff may create Tournament Teams directly.

---

### Registration-Based Team Creation

Approved registrations may be converted into Tournament Teams.

---

## Does NOT

- Schedule Matches
- Calculate Rankings
- Assign Teams to Matches

---

# 6. Match Service

## Purpose

Manages Tournament Matches.

---

## Responsibilities

- Create Match
- Update Match
- Delete Match
- Create Match Sides
- Assign Teams to Match Sides
- Record Alliance Scores
- Validate Match
- Calculate Match Winner
- Complete Match
- Trigger Tournament Statistics Update

---

## Match Completion Workflow

```text
Record Scores
      │
      ▼
Validate Scores
      │
      ▼
Calculate Winning Side
      │
      ▼
Complete Match
      │
      ▼
Ranking Service
```

---

## Does NOT

- Generate Brackets
- Create Future Matches
- Advance Teams
- Schedule Future Rounds

---

# 7. Ranking Service

## Purpose

Calculates Tournament statistics.

Ranking data is **never stored manually**.

It is always calculated from Match results.

---

## Responsibilities

- Update Team Statistics
- Calculate Wins
- Calculate Losses
- Calculate Draws
- Calculate Team Points
- Calculate Standings
- Calculate Rankings
- Calculate Tournament Leader
- Calculate Tournament Winner
- Generate Leaderboards

---

## Triggered By

- Match Completion
- Match Score Update
- Match Cancellation (if applicable)

---

## Does NOT

- Modify Match Data
- Schedule Matches
- Manage Tournament Structure

---

# 8. Workshop Service

## Purpose

Manages Workshops.

---

## Responsibilities

- Create Workshop
- Update Workshop
- Delete Workshop
- Assign Instructor
- Validate Workshop Information

---

## Does NOT

- Register Participants
- Process Payments

---

# 9. Registration Service

## Purpose

Manages Event registrations.

---

## Responsibilities

- Register Participant
- Approve Registration
- Reject Registration
- Cancel Registration
- Validate Registration Mode
- Validate Registration Deadline
- Validate Capacity
- Validate Duplicate Registrations
- Validate Student Eligibility
- Convert Approved Tournament Registrations into Tournament Teams (through Tournament Team Service)

---

## Registration Workflow

```text
Registration Request
        │
        ▼
Business Validation
        │
        ▼
Capacity Validation
        │
        ▼
Registration Rule Validation
        │
        ▼
Payment (if required)
        │
        ▼
Registration Confirmation
```

---

## Does NOT

- Call Payment Providers Directly
- Create Payment Transactions

---

# 10. Event Payment Service

## Purpose

Coordinates Event registrations with the Shared Payment application.

---

## Responsibilities

- Initialize Registration Payment
- Verify Payment
- Update Registration Payment Status
- Handle Payment Success
- Handle Payment Failure
- Handle Payment Cancellation
- Trigger Registration Confirmation after successful payment

---

## Delegates To

Shared Payment Service

Configured Provider

- Chapa
- Stripe
- Future Providers

---

## Does NOT

- Communicate directly with payment gateways.
- Store payment transactions.
- Implement provider-specific logic.

---

# 11. Validators

Validators contain reusable business validation.

They never save data.

---

## Event Validator

Responsibilities

- Date validation
- Registration configuration validation
- Capacity validation
- event_type = GENERAL => no specialized event
---

## Tournament Validator

Responsibilities

- Tournament configuration validation
- Maximum teams validation
- Tournament status validation

---

## Registration Validator

Responsibilities

- Registration eligibility
- Duplicate registration detection
- Deadline validation
- Capacity validation
- Registration mode validation

---

## Workshop Validator

Responsibilities

- Instructor validation
- Duration validation
- Workshop configuration validation

---

## Match Validator

Responsibilities

- Match side validation
- Team assignment validation
- Tournament consistency validation
- Score validation
- Winning side validation

---

# 12. Query Services

Query services provide optimized read operations.

They contain no business logic.

---

## Public Events Query

Returns published public events.

---

## Live Events Query

Returns currently active events.

---

## Upcoming Events Query

Returns future events.

---

## Past Events Query

Returns completed events.

---

## Rankings Query

Returns calculated Tournament standings.

---

# 13. Service Communication

```text
Event Service
        │
        ▼
Tournament Service
        │
        ▼
Tournament Team Service
        │
        ▼
Match Service
        │
        ▼
Ranking Service
```

---

Registration Flow

```text
Registration Service
        │
        ▼
Event Payment Service
        │
        ▼
Shared Payment Service
        │
        ▼
Payment Provider
```

---

# 14. Calculation Rules

The system automatically calculates:

- Match Winner
- Winning Side
- Team Wins
- Team Losses
- Team Draws
- Team Points
- Tournament Standings
- Tournament Rankings
- Tournament Leader
- Tournament Winner

These values are derived from recorded Match results.

---

# 15. Non-Responsibilities

The Events application never:

- Generates Tournament Brackets.
- Generates Match Schedules.
- Automatically creates Matches.
- Automatically assigns Teams.
- Automatically advances Teams.
- Automatically creates Tournament Rounds.
- Makes organizational decisions for Tournament staff.

These decisions remain the responsibility of authorized staff.

---

# 16. Service Boundaries

Services may call other Services only when required by a legitimate business workflow.

Examples:

- Registration Service → Event Payment Service
- Match Service → Ranking Service
- Registration Service → Tournament Team Service

Services must never bypass business rules by directly modifying another domain's models.

---

# 17. Locked Business Rules

- Business logic resides exclusively in Services.
- Views remain thin.
- Models remain persistence objects.
- Validators perform validation only.
- Query services perform read operations only.
- Rankings are calculated dynamically.
- Match winners are calculated from recorded scores.
- Tournament winners are calculated from completed Match results.
- Tournament Teams may be created manually or from approved registrations.
- Payment processing is delegated to the Shared Payment application.
- The Events application records and validates Tournament data but does not organize Tournament structures.

---

# Status

**🔒 LOCKED**

