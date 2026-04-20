---
name: security-endpoint-plan
description: >
  Generates and maintains a separate file (SECURITY_TESTS.md) with a security test plan
  per endpoint. Use this skill whenever a new endpoint is created or modified — it analyzes
  the endpoint context (HTTP method, parameters, authentication, uploads, queries) and
  documents which threats are relevant and what should be tested, without polluting the
  code with comments. Trigger this skill for any route, controller, handler, or REST API
  endpoint creation, regardless of language or framework.
---

# Security Endpoint Plan

Every time an endpoint is created or modified, generate (or update) the `SECURITY_TESTS.md`
file at the project root with the corresponding entry.

The goal is to maintain a living security map of the project: without reading the code,
anyone can open this file and know exactly what needs to be tested on each route.

---

## Analysis Rules

Before writing anything, analyze the endpoint by answering these questions internally:

| Question                                                        | Related Threat                  |
|-----------------------------------------------------------------|---------------------------------|
| Does it receive a resource `id` that could belong to another user? | IDOR                         |
| Does it use raw or dynamic SQL with user input?                 | SQL Injection                   |
| Does it return or persist HTML/text without sanitization?       | XSS                             |
| Does it perform a non-idempotent operation (debit, reservation, stock)? | Race Condition           |
| Does it accept a body without a whitelist of allowed fields?    | Mass Assignment                 |
| Does it make a request to a URL provided by the user?           | SSRF                            |
| Does it accept file uploads?                                    | Malicious Upload                |
| Does it load external images with user data in the query string? | Image Tracking                 |
| Is it a login, OTP, or password reset endpoint without attempt limits? | Brute Force              |
| Should it require authentication but doesn't?                   | Missing Authentication          |
| Does it verify that the authenticated user can act on that specific resource? | Broken Authorization |
| Does the response include sensitive data (password, token, SSN, full card)? | Sensitive Data Exposure |
| Does it return stack traces or internal messages on error?      | Verbose Errors                  |
| Does it query a NoSQL database (e.g. MongoDB) with user input?  | NoSQL Injection                 |
| Does it execute OS commands with user input?                    | Command Injection               |
| Does it use custom headers like `X-User-ID` to identify the user? | IDOR via Header              |
| Does it issue or validate JWTs?                                 | JWT Misconfiguration            |
| Does it redirect to a URL provided by the user?                 | Open Redirect                   |

Include **only the threats that make sense for that endpoint**.
Do not force irrelevant threats just to appear thorough.

---

## Entry Format in SECURITY_TESTS.md

```markdown
## [METHOD] /path/to/endpoint

> Brief description of what the endpoint does.

**Relevant threats:** [comma-separated list]

---

### [Threat Name]

- **What to test:** [clear description of the test scenario]
- **Expected result:** [what the system must do to be considered protected]

---
```

---

## Threat Reference

### IDOR
- **What to test:** Authenticate as user A and request a resource belonging to user B via route param or query string (`/users/2/data`).
- **Expected result:** Returns 403 or 404; never returns another user's data.

### SQL Injection
- **What to test:** Send classic payloads in input fields (`' OR '1'='1`, `; DROP TABLE`, `1; SELECT *`).
- **Expected result:** Query is not altered; returns validation error or 400, never unauthorized data.

### XSS
- **What to test:** Send `<script>alert(1)</script>` in text fields that are persisted and later rendered.
- **Expected result:** Content is escaped or rejected; never executed on the client.

### Race Condition
- **What to test:** Fire multiple simultaneous requests for the same non-idempotent operation (e.g. two purchases of the same item with stock of 1).
- **Expected result:** Only one operation completes; the second receives an error or is blocked by a lock or idempotency key.

### Mass Assignment
- **What to test:** Send extra fields in the body that should not be assignable (e.g. `role: "admin"`, `isActive: true`, `balance: 99999`).
- **Expected result:** Disallowed fields are silently ignored; never persisted.

### SSRF
- **What to test:** Pass internal URLs as input (`http://localhost`, `http://169.254.169.254`, `http://internal-service`).
- **Expected result:** Request is blocked or rejected; never executed by the server.

### Malicious Upload
- **What to test:** Send a file with an allowed extension but malicious content (e.g. `.jpg` with PHP code), double extension (`shell.php.jpg`), and an oversized file.
- **Expected result:** MIME type validated against file content (not just extension); size limited; file not executable on the server.

### Image Tracking
- **What to test:** Check if external image URLs are loaded directly by the server with user data in the query string.
- **Expected result:** External images are proxied or blocked; no sensitive user data leaks through external requests.

### Brute Force
- **What to test:** Send hundreds of requests with different passwords or OTP codes in a short time window.
- **Expected result:** Account or IP is locked or throttled after a defined number of failed attempts.

### Missing Authentication
- **What to test:** Send the request without any token or session cookie.
- **Expected result:** Returns 401; never processes the request or returns data.

### Broken Authorization
- **What to test:** Authenticate as a user with a valid token but without permission for that specific action or resource (e.g. a regular user calling an admin-only route).
- **Expected result:** Returns 403; never performs the action.

### Sensitive Data Exposure
- **What to test:** Inspect the response body and headers for sensitive fields (password hash, raw token, SSN, full credit card number).
- **Expected result:** Sensitive fields are absent or masked in all responses; never returned even partially.

### Verbose Errors
- **What to test:** Trigger errors intentionally (invalid input, missing fields, wrong types) and inspect the response body.
- **Expected result:** Returns a generic error message; no stack trace, file path, query, or internal detail exposed.

### NoSQL Injection
- **What to test:** Send MongoDB operator payloads in input fields (e.g. `{ "$gt": "" }`, `{ "$where": "1==1" }`).
- **Expected result:** Input is sanitized or rejected; query is not altered.

### Command Injection
- **What to test:** Send OS command payloads in input fields (e.g. `; ls -la`, `&& cat /etc/passwd`, `| whoami`).
- **Expected result:** Input is rejected or sanitized; no command is executed on the server.

### IDOR via Header
- **What to test:** Manipulate custom headers like `X-User-ID`, `X-Account-ID`, or `X-Tenant-ID` to impersonate another user.
- **Expected result:** Server never trusts user-supplied identity headers; identity is always derived from the validated token.

### JWT Misconfiguration
- **What to test:** Send a token with `alg: none`, an expired token, a token signed with a weak or empty secret, and a token with a manipulated payload.
- **Expected result:** All invalid tokens are rejected with 401; algorithm is enforced server-side.

### Open Redirect
- **What to test:** Pass external URLs as the redirect target (e.g. `?redirect=https://evil.com`).
- **Expected result:** Redirect is blocked or restricted to an allowlist of internal paths; never follows arbitrary external URLs.

---

## Behavior When Creating an Endpoint

1. Create the endpoint normally.
2. Analyze it using the rules table above.
3. Add (or update) the corresponding entry in `SECURITY_TESTS.md`.
4. If the file does not exist yet, create it with the header below before the first entry:

```markdown
# Security Tests

Security test plan per endpoint.
Auto-generated — do not manually edit threat sections.

---
```

---

## What NOT to Do

- Do not add security comments directly in the endpoint code.
- Do not create automated tests — only the descriptive plan.
- Do not include threats that do not apply to the endpoint context.
- Do not duplicate entries; if the endpoint already exists in the file, update it.
