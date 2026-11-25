# King Pizzaria — Cardápio digital

Adaptação do cenário 3 da proposta N695 para uma pizzaria. O visitante seleciona uma categoria para consultar pratos, preços e disponibilidade. A área **Administrar** permite criar, editar e excluir categorias e pratos.

## Executar

Use Node.js 24 e npm. Na pasta que contém `server.ts`, execute:

```sh
npm install
npm run dev
```

Acesse http://localhost:3000. Em produção, execute `npm run build` e inicie o servidor com `NODE_ENV=production npm start`. O servidor respeita as variáveis `IP` e `PORT`.

## Dados e administração

- Configure `ADMIN_PASSCODE` no ambiente antes de publicar. Localmente, também é possível definir a senha no primeiro acesso à administração.
- O SQLite usa o arquivo `king_pizzaria.db` no diretório do projeto. Para usar um banco existente, mantenha seu caminho em `DATABASE_PATH`. Preserve o arquivo do banco e o ambiente da instalação quando atualizar o código.
- Um banco novo começa com três categorias e seis pratos de exemplo. O servidor inicializa o catálogo apenas na criação. O administrador pode modificar ou apagar esses exemplos.
- O nome de uma categoria é obrigatório e único, desconsiderando espaços nas extremidades e diferenças entre maiúsculas e minúsculas. Para excluir uma categoria, remova ou transfira os pratos vinculados.
- Cada prato precisa de nome, categoria existente e preço positivo. A descrição é opcional. Um prato indisponível continua visível com essa indicação.

## Código

A interface React está em `src/App.tsx` e os formulários de cadastro e edição em `src/components/Editor.tsx`. A interface chama o serviço HTTP por `src/services/api.ts`. O Express expõe as operações em `server.ts` e `server/categories.ts`. A persistência e as restrições de integridade ficam em `server/db.ts`.

| Operação | Método e rota |
| --- | --- |
| Consultar o cardápio | GET /api/store |
| Consultar as categorias na administração | GET /api/admin/categories |
| Criar categoria ou prato | POST /api/admin/categories ou /api/admin/products |
| Editar categoria ou prato | PUT /api/admin/categories/:id ou /api/admin/products/:id |
| Excluir categoria ou prato | DELETE /api/admin/categories/:id ou /api/admin/products/:id |

As operações administrativas exigem o token retornado por `POST /api/admin/login` no cabeçalho `Authorization: Bearer <token>`. Para verificar os tipos, execute `npm run lint`.
