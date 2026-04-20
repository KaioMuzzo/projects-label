  # shared/

  Este pacote contém código compartilhado entre `backend/` e `frontend/`.
  Tudo aqui é agnóstico de plataforma — sem Node.js, sem Express, sem componentes de UI.

  ## O que pertence aqui

  - **abilities/** — definições de permissões com CASL (fonte única da verdade)
  - **schemas/** — schemas Zod que validam tanto o formulário (frontend) quanto o body da request (backend)
  - **types/** — tipos TypeScript que cruzam a fronteira da API

  ## O que NÃO pertence aqui

  - Lógica de banco de dados — Prisma fica no `backend/`
  - Componentes e hooks — ficam no `frontend/`
  - Middleware Express — fica no `backend/`

  ## Regra

  Se apenas um lado precisa, fica naquele lado.
  Se os dois precisam, vem para cá.