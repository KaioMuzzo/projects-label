---
name: utils-mapper
description: >
  Generates and maintains a UTILS.md file mapping all utility functions in src/utils/.
  Use this skill whenever a file in src/utils/ is created, modified, or deleted.
  Trigger automatically on any change to the utils folder — never let UTILS.md go stale.
---

# Utils Mapper

Keeps `UTILS.md` in sync with the actual contents of `src/utils/`.
Every utility function must be documented so the agent never rewrites existing logic.

---

## Trigger Conditions

| Event | Action |
|---|---|
| File created in `src/utils/` | Add entry to `UTILS.md` |
| File modified in `src/utils/` | Update existing entry in `UTILS.md` |
| File deleted in `src/utils/` | Ask developer to confirm before removing entry |

---

## Step 1 — Read the utility file

Read the target file in `src/utils/`. For each exported function extract:

- **Function name** — exact name as exported
- **Parameters** — name, type, whether optional
- **Return type** — exact return type
- **Purpose** — one sentence describing what it does
- **When to use** — one sentence describing when the agent should reach for this utility

Do not document non-exported functions.

---

## Step 2 — Handle deletions

If the utility file was deleted, before removing the entry ask:

```
O arquivo `[filename].ts` foi removido. Posso remover a entrada correspondente do UTILS.md?
```

Only remove after explicit confirmation. Silence is not confirmation for deletions.

---

## Step 3 — Write UTILS.md

Add (or update) the entry in `UTILS.md` at the project root.
Keep entries sorted alphabetically by filename.

### File format

```markdown
# Utils

Mapa de utilitários disponíveis em src/utils/.
Leia este arquivo antes de escrever qualquer lógica utilitária.
Se já existe uma função para a tarefa, use-a — nunca reescreva o que já existe.

---

## [functionName]

**Arquivo:** `src/utils/[filename].ts`
**Parâmetros:** `param1: Type, param2?: Type`
**Retorno:** `ReturnType`
**O que faz:** [one sentence]
**Quando usar:** [one sentence describing the use case]

---
```

### Writing rules

- One `##` section per exported function
- If a file exports multiple functions, create one section per function
- Parameters: list all, mark optional with `?`
- Return type: use the exact TypeScript type, not a description
- Keep "O que faz" and "Quando usar" in Portuguese — the developer reads this
- Sort all entries alphabetically by function name

---

## What NOT to Do

- Do not document non-exported functions
- Do not remove entries without developer confirmation
- Do not merge multiple functions into one entry
- Do not let UTILS.md go out of sync — update it on every change to src/utils/
