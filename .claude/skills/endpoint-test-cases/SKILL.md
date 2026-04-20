---
name: endpoint-test-cases
description: >
  Generates and maintains a TEST_CASES.md file with a scenario table per endpoint.
  Use this skill whenever an endpoint is created OR modified — new field, new validation,
  new return value, or any behavioral change. Trigger for any route, controller, handler,
  or REST API endpoint, regardless of language or framework. Do not write test code —
  only the scenario plan.
---

# Endpoint Test Cases

Every time an endpoint is created or modified, generate (or update) the `TEST_CASES.md`
file at the project root with the corresponding entry.

The goal is a living map of what must be tested per endpoint — readable by humans and
consumable by the test-writer skill without needing to read the actual endpoint code.

---

## Analysis Rules

Before writing anything, identify the endpoint's characteristics by answering internally:

| Question                                              | Scenario category to include     |
|-------------------------------------------------------|----------------------------------|
| Does it receive required fields in the body?          | Missing required fields          |
| Does it receive typed fields (number, date, enum)?    | Wrong types + boundary values    |
| Does it require authentication?                       | Auth scenarios                   |
| Does it act on a resource owned by a specific user?   | Permission scenarios             |
| Does it create a resource that must be unique?        | Duplicate scenarios              |
| Does it reference another resource by ID?             | Invalid dependency scenarios     |
| Does it return different shapes based on state?       | State variation scenarios        |
| Does it accept optional fields?                       | Behavior with and without them   |

Always include the happy path first. Then cover what can go wrong.
Do not invent business rules — stick to universal input/output behavior.

---

## Entry Format in TEST_CASES.md

````markdown
## [METHOD] /path/to/endpoint

> Brief description of what the endpoint does.

| # | Cenário | Input | Esperado |
|---|---|---|---|
| 1 | Dados válidos completos | todos os campos corretos | 200/201 + descrição do retorno |
| 2 | [próximo cenário] | [input] | [esperado] |

> **Nota:** [contexto importante que não cabe na tabela — timing, ordem de validação, comportamento específico]
> Omit this line if there are no relevant notes.
````

---

## Scenario Reference by Category

### Happy Path
- All required fields present and valid
- Expected: success status (200 or 201) + expected response shape description

### Missing Required Fields
- Each required field removed one at a time
- All required fields missing at once (empty body)
- Expected: 400 with indication that validation failed (not which field, unless it's safe to expose)

### Wrong Types and Boundary Values
- String where number expected (and vice versa)
- Negative values where only positive allowed
- Zero where minimum is 1
- Extremely long strings
- Empty string for required text field
- Expected: 400

### Auth Scenarios (only if endpoint requires authentication)
- Request without token
- Request with expired token
- Request with malformed token
- Expected: 401 for all cases

### Permission Scenarios (only if endpoint acts on owned resources)
- Authenticated user acting on a resource owned by another user
- Authenticated user without the required role/permission
- Expected: 403

### Duplicate Scenarios (only if endpoint creates unique resources)
- Attempt to create a resource that already exists (same unique field)
- Expected: 409 or 422

### Invalid Dependency Scenarios (only if endpoint references another resource by ID)
- Reference an ID that does not exist
- Reference an ID that exists but belongs to another user/tenant
- Expected: 404 or 403

### State Variation Scenarios (only if resource has states)
- Perform action on resource in invalid state (e.g. cancel an already cancelled order)
- Expected: 409 or 422

### Optional Fields
- Request without optional fields — verify default behavior
- Request with optional fields — verify they are applied correctly

---

## Behavior When Creating or Modifying an Endpoint

1. Identify the endpoint's characteristics using the analysis rules table.
2. Select only the scenario categories that apply.
3. Write the scenario table — one row per scenario, ordered from happy path to edge cases.
4. Add a note block only when a scenario needs context that doesn't fit in the table.
5. Add (or update) the entry in `TEST_CASES.md`.
6. If the file does not exist yet, create it with the header below:

```markdown
# Test Cases

Mapa de cenários de teste por endpoint.
Gerado automaticamente — não edite manualmente as linhas da tabela.

---
```

---

## What NOT to Do

- Do not write test code — only the scenario plan.
- Do not invent business rules specific to the project.
- Do not include scenarios that do not apply to the endpoint.
- Do not duplicate entries; if the endpoint already exists in the file, update it.
- Do not add auth or permission scenarios to public endpoints.
