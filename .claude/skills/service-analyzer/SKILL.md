---
name: service-analyzer
description: >
  Reads a service.ts file and produces a numbered list of test scenarios and clarifying
  questions for the developer to validate before any file is written. Use this skill
  whenever a service function is created or modified. Do NOT write SERVICE_CASES.md
  until the developer has approved the scenario list. Trigger for any service file
  change, regardless of framework or project structure.
---

# Service Analyzer

Reads the `service.ts` of the target feature, understands every exported function,
and presents a numbered list of inferred test scenarios plus any clarifying questions.

No file is written until the developer approves. Silence on a scenario means approval.
Only corrections and answered doubts need a response.

---

## Step 1 — Trace the endpoint to its service function

Do not read the entire `service.ts`. Follow the chain from the endpoint down:

1. Read `routes.ts` — identify which controller function handles the target endpoint
2. Read `controller.ts` — identify which service function(s) that controller function calls
3. Read `service.ts` — read **only** the service function(s) identified in step 2

If the controller calls two service functions, read both. Never read the full service file.

For each identified service function, extract:

- **Parameters** — name, type, required vs optional
- **Return value** — shape and type
- **Thrown errors** — every `throw`, every error code, every rejection
- **Branches** — every `if/else`, every condition that changes behavior
- **Optional parameters** — what happens when they are absent
- **Edge values** — zero, negative, empty, null, undefined where relevant

Do not skip anything. The more validations the function has, the more scenarios to list.

---

## Step 2 — Build the scenario list

For each exported function, produce a numbered list of scenarios.
Number sequentially across all functions — do not reset per function.

### Scenario format

```
Função: functionName(param1, param2?)

Cenários identificados:
1. [condição] → [resultado esperado]
2. [condição] → [resultado esperado]
3. [condição] → lança [ERROR_CODE]
...
```

### Rules for listing scenarios

- **Happy path first** — the successful call with valid inputs always comes first
- **One scenario per branch** — each `if` condition that changes behavior = one scenario
- **One scenario per error** — each distinct error code thrown = one scenario  
- **Optional parameters** — always include: "param ausente → [behavior]"
- **Boundary values** — include zero, negative, empty string, null when the code handles them
- **No limit** — list every scenario you can infer, never truncate

---

## Step 3 — Build the doubt list

After the scenario list, add a numbered doubt list for anything that cannot be
confidently inferred from the code alone.

### Doubt format

```
Dúvidas:
D1. [specific question about ambiguous behavior]
D2. [specific question about ambiguous behavior]
```

### When to raise a doubt

- A condition exists but the expected behavior is not clear from the code
- An error is caught but it's unclear if it should be re-thrown or swallowed
- An optional parameter has no default value defined in the code
- A return value shape is ambiguous (union type, partial object)
- Business meaning of a branch is unclear (e.g. `if (status === 2)` — what is status 2?)

If there are no doubts, omit the section entirely.

---

## Step 4 — Present to the developer

Present the full list and wait. Do not write any file yet.

End the presentation with:

```
Responda só o que precisar corrigir (ex: "3 está errado, é X") e resolva as dúvidas
pelo número (ex: "D1: usa data atual"). O que não for mencionado será considerado aprovado.
```

---

## Step 5 — Process the response

When the developer responds:

1. **Corrections** — update the scenario referenced by number with the correction provided
2. **Answered doubts** — resolve the doubt and add or update the affected scenario
3. **Silence on a scenario** — treat as approved, no changes needed
4. **Silence on a doubt** — treat as "inferred behavior is correct", no changes needed

After processing, confirm what was understood before writing:

```
Entendido. Atualizei:
- Cenário 3: [correction applied]
- D1: [resolution applied]

Criando SERVICE_CASES.md com X cenários.
```

Then proceed to Step 6.

---

## Step 6 — Write SERVICE_CASES.md

Write (or update) `SERVICE_CASES.md` at the project root with the approved scenarios.

### File format

```markdown
# Service Cases

Mapa de cenários de teste por função de service.
Validado pelo desenvolvedor — consumido pela skill service-test-writer.

---

## [featureName] — [nomeDoArquivo].ts

### functionName(param1, param2?)

| # | Cenário | Input | Esperado |
|---|---|---|---|
| 1 | [cenário] | [input] | [retorno ou erro] |
| 2 | [cenário] | [input] | [retorno ou erro] |

---
```

### Writing rules

- One row per approved scenario
- Input column: describe the relevant input state, not the full function signature
- Esperado column: use the return value description or `lança [ERROR_CODE]`
- If the developer corrected a scenario, use the corrected version
- If a doubt was resolved, reflect the resolution in the relevant row

---

## What NOT to Do

- Do not write SERVICE_CASES.md before developer approval.
- Do not skip scenarios to keep the list short.
- Do not invent error codes — only list what is explicitly in the code.
- Do not merge two distinct scenarios into one row.
- Do not update the file partially — write the full approved list at once.
