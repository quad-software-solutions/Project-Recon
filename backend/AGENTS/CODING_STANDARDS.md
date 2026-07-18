# CODING_STANDARDS.md

## General

- There is env so first activate it before running any command. by running this command 

```bash
source venv/bin/activate
```

 - DO NOT UPDATE THE VIRTUAL ENVIRONMENT AND ANY OF THE EXTERNAL PACKAGES.

## Philosophy

Write simple, readable, maintainable code.

## Models

-   Define data and relationships.
-   Avoid business logic.
-   Avoid overriding `save()` unless necessary.
-   Explicitly declare `id`, `created_at`, `updated_at`.

## Services

-   Contain all business logic.
-   May call services from other modules.
-   Never import DRF.

## Views

-   Authenticate.
-   Validate input.
-   Call service.
-   Return response.

## Permissions

-   Module-specific permissions live in the module.
-   Shared permission helpers live in `shared`.

## Validation

-   Serializer: request validation.
-   Service: business validation.
-   Model: database constraints.

## Transactions

Use `transaction.atomic()` for multi-step writes.

## Exceptions

Services raise exceptions. Views translate them into HTTP responses.

## Signals

Default: do not use. Allowed for infrastructure events such as audit
logging, analytics, cache invalidation, and cases where `shared` must
not depend on domain modules.

## Celery

Business logic stays in services. Tasks call services.

## Imports

Allowed: - module -\> another_module.services - module -\> shared

Forbidden: - module -\> another_module.models

## Settings

Never access environment variables outside configuration. Always use
Django settings.

## Logging

-   Log important business events.
-   Never log passwords, tokens, API secrets, or payment secrets.

## API

-   Thin endpoints.
-   Consistent error responses.
-   One responsibility per endpoint.

## Testing

Test services first, then APIs, then models where necessary.

## Performance

- Optimize only after measuring. Prefer `select_related` and
`prefetch_related` where appropriate. And avoid N+1 problems.
- Use django available tools to do things like the ORM for all applicable tasks

## Error Handling

- Make sure every endpoint, view, and service handles errors gracefully no 500 server errors.
- All error should contain status code and descriptive message for front end.

## Coding style

- Always use django restframework methods rather creating from scratch.
- Utilize provided tools to do thing efficiently and reduce code volume.

## Documenting 

- All codes must be documented using Docstrings.
- You must include the purpose of the code, parameters, and return values.
- All end points must be documented using Swagger and Redoc.
- You must include the purpose of the endpoint, parameters, and return values.

