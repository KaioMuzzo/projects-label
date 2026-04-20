  # Como o frontend usa o shared

  ## Instalação

  O `shared` é um pacote do workspace pnpm. No `package.json` do frontend:

  ```json
  {
    "dependencies": {
      "shared": "workspace:*"
    }
  }

  Depois rode pnpm install na raiz.

  Importando

  import type { UserType } from 'shared/src/types/user'
  import { createUserSchema } from 'shared/src/schemas/user'
  import { defineAbilityFor } from 'shared/src/abilities/user'

  Validando formulários com Zod

  Os schemas do shared/src/schemas/ são os mesmos usados pelo backend.
  Use-os diretamente na validação do formulário — sem duplicar regras.

  import { createUserSchema } from 'shared/src/schemas/user'

  const result = createUserSchema.safeParse(formData)
  if (!result.success) {
    // result.error.flatten() para exibir erros por campo
  }

  Permissões com CASL

  import { defineAbilityFor } from 'shared/src/abilities/user'

  const ability = defineAbilityFor(currentUser)

  if (ability.can('edit', 'Post')) {
    // exibe botão de editar
  }

  Importante

  Não importe nada de backend/ diretamente no frontend.
  O shared/ é a única ponte entre os dois.

  ---