# Project Recon

# Events Application

# 🔒 Database Design — Part 2 (Tournament Models)

**Status:** 🔒 LOCKED

**Application:** `events`

> This document defines the Tournament-related database models, relationships, constraints, and business rules. It builds upon the core Event model defined in Database Design – Part 1.

---

# 1. Entity Overview

```text
Event
   │
   ▼
Tournament
   │
   ├──────────────────────────────┐
   ▼                              ▼
TournamentTeam                  Match
                                  │
                                  ▼
                              MatchSide
                                  │
                                  ▼
                           MatchParticipant
```

Tournament is responsible for managing:

- Teams
- Matches
- Tournament Progress
- Rankings

---

# 2. Tournament

## Purpose

Represents a competitive event.

Every Tournament extends exactly one Event with event_type TOURNAMENT.

Examples:

- VEX IQ National Championship
- Enjoy AI Competition
- VEX V5 Regional Tournament

---

# 3. Database Fields

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| id | UUID | ✅ | Primary Key |
| event | OneToOne → Event | ✅ | Parent Event |
| category | ENUM | ✅ | Tournament category |
| max_teams | INTEGER | ❌ | NULL means unlimited teams |
| prize_pool | DECIMAL(10,2) | ❌ | Prize amount |
| created_at | DATETIME | ✅ | Creation timestamp |
| updated_at | DATETIME | ✅ | Last update timestamp |

---

# 4. Tournament Categories

Initial supported categories:

- VEX IQ
- VEX V5
- Enjoy AI

Future categories may be added without changing the architecture.

---

# 5. Tournament Constraints

Every Tournament:

- Must belong to one Event.
- Cannot exist without an Event.
- Cannot exceed the configured maximum number of teams (when max_teams is set).
- Uses the Event's registration configuration.

---

# 6. Tournament Team

## Purpose

Represents one participating team within a Tournament.

Tournament Teams are the entities that actually compete.

Matches, scores, standings, and rankings always reference Tournament Teams.

---

# 7. Database Fields

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| id | UUID | ✅ | Primary Key |
| tournament | FK → Tournament | ✅ | Parent Tournament |
| registration | FK → EventRegistration | ❌ | NULL if created manually |
| team_name | VARCHAR(255) | ✅ | Display name |
| organization | VARCHAR(255) | ❌ | School, Company, Club, etc. |
| coach_name | VARCHAR(255) | ❌ | Team coach or mentor |
| contact_email | Email | ❌ | Team contact |
| contact_phone | VARCHAR(50) | ❌ | Team contact |
| wins | INTEGER | ✅ | Default 0 |
| losses | INTEGER | ✅ | Default 0 |
| draws | INTEGER | ✅ | Default 0 |
| points | INTEGER | ✅ | Default 0 |
| created_at | DATETIME | ✅ | Creation timestamp |
| updated_at | DATETIME | ✅ | Last update timestamp |

---

# 8. Business Rules

Tournament Teams may be created:

### Manually

By:

- Super Admin
- Branch Manager
- Authorized Staff

No registration is required.

---

### From Registration

If registration is enabled:

Approved Event Registrations may be converted into Tournament Teams.

---

# 9. Constraints

Unique:

```text
(tournament, team_name)
```

This prevents duplicate team names within the same tournament.

The same team name may appear in different tournaments.

---

# 10. Match

## Purpose

Represents one game played inside a Tournament.

A Match contains one or more Match Sides.

This architecture supports:

- 1 vs 1
- 2 vs 2
- Future alliance-based tournament formats

without requiring future database changes.

---

# 11. Database Fields

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| id | UUID | ✅ | Primary Key |
| tournament | FK → Tournament | ✅ | Parent Tournament |
| round | VARCHAR(100) | ✅ | Qualification, Quarter Final, Semi Final, etc. |
| scheduled_at | DATETIME | ✅ | Match schedule |
| started_at | DATETIME | ❌ | Actual start time |
| completed_at | DATETIME | ❌ | Completion time |
| winning_side | FK → MatchSide | ❌ | Winning side after completion |
| status | ENUM | ✅ | Match status |
| created_at | DATETIME | ✅ | Creation timestamp |
| updated_at | DATETIME | ✅ | Last update timestamp |

---

# 12. Match Status

Supported values:

- SCHEDULED
- LIVE
- COMPLETED
- CANCELLED

---

# 13. Match Constraints

A Match must:

- Belong to one Tournament.
- Contain exactly two Match Sides.
- Reference only Tournament Teams belonging to the same Tournament.
- Have exactly one winning side unless the competition format allows a draw.
---

## Invalid

```text
Team A

vs

Team A
```

Not allowed.

---

## Invalid

```text
Tournament A Team

vs

Tournament B Team
```

Not allowed.

---

# 14. Match Side

## Purpose

Represents one competing side (alliance) in a Match.

Each Match normally contains:

- Side A
- Side B

Each side owns the score for that alliance.

This supports both traditional matches and alliance-based competitions.

---

## Database Fields

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| id | UUID | ✅ | Primary Key |
| match | FK → Match | ✅ | Parent Match |
| side | ENUM | ✅ | Side A / Side B |
| score | INTEGER | ✅ | Alliance score |
| created_at | DATETIME | ✅ | Creation timestamp |
| updated_at | DATETIME | ✅ | Last update timestamp |

---

## Constraints

Unique:

```text
(match, side)
```
Every Match must contain exactly two Match Sides.

# 15. Match Participant

## Purpose

Represents one Tournament Team participating in a Match Side.

This allows:

- 1 vs 1
- 2 vs 2
- Future alliance formats

without changing the database schema.

---

## Database Fields

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| id | UUID | ✅ | Primary Key |
| match_side | FK → MatchSide | ✅ | Parent Match Side |
| tournament_team | FK → TournamentTeam | ✅ | Participating Team |
| created_at | DATETIME | ✅ | Creation timestamp |

---

## Constraints

Unique:

```text
(match_side, tournament_team)
```

Business Rules:

- A Tournament Team may participate only once in the same Match.
- Every participating team must belong to the Match's Tournament.

# 16. Match Relationships

Tournament

1

↓

∞

Match

---

Match

1

↓

2

MatchSide

---

MatchSide

1

↓

∞

MatchParticipant

---

TournamentTeam

1

↓

∞

MatchParticipant

# 17. Ranking

Tournament rankings are **never stored**.

They are calculated dynamically.

Ranking uses:

- Wins
- Losses
- Draws
- Points

The service layer generates standings whenever requested.

---

# 18. Business Workflow

```text
Tournament
      │
      ▼
Create Teams
      │
      ▼
Create Match
      │
      ▼
Assign Match Sides
      │
      ▼
Assign Teams to Match Sides
      │
      ▼
Record Alliance Scores
      │
      ▼
Update Team Statistics
      │
      ▼
Generate Rankings
```

---

# 19. Delete Rules

Deleting a Tournament deletes:

- Tournament Teams
- Matches

Deleting a Tournament Team:

- Not allowed if referenced by completed Matches.

Deleting a Match:

- Does not delete Tournament Teams.

Deleting a Match: 

- also deletes its Match Sides and Match Participants.

Deleting a Match Side:

- also deletes its Match Participants.

---

# 20. Index Recommendations

Tournament

Indexes:

- category

---

Tournament Team

Indexes:

- tournament
- registration

Composite:

- (tournament, team_name)

---

Match

Indexes:

- tournament
- scheduled_at
- status

Composite:

- (tournament, round)
- (tournament, status)

---

MatchSide

Indexes:

- match

Composite:

- (match, side)

---

MatchParticipant

Indexes:

- tournament_team
- match_side

Composite:

- (match_side, tournament_team)

---

# 21. Locked Decisions

The following decisions are finalized:

- Tournament extends Event.
- Tournament Teams are the only entities that participate in Matches.
- Tournament Teams may be created manually or from approved registrations.
- Rankings are generated dynamically and never stored.
- Matches always belong to a Tournament.
- Every Match contains exactly two Match Sides.
- Match Sides own alliance scores.
- Tournament Teams participate through Match Participants.
- The Match architecture supports both 1 vs 1 and alliance-based competitions (such as 2 vs 2) without schema changes.
- Tournament statistics are maintained by the service layer.
- Team names are unique within a Tournament.
- Match history is preserved for reporting and auditing.

---

# Status

**🔒 LOCKED**
