# King Pizzaria - Cardápio Digital e Sistema de Pedidos

Aplicação web full-stack desenvolvida com **React**, **TypeScript**, **Tailwind CSS**, **Node.js (Express)** e **SQLite** para gerenciamento de cardápio digital, personalização de pizzas e envio de pedidos formatados para o WhatsApp da **King Pizzaria Master - Chefe W.N**.

---

## Funcionalidades

- **API REST + Banco de Dados SQLite**: Produtos, categorias, sabores, tamanhos, bordas, adicionais, configurações da loja, carrinho de compras e pedidos ficam persistidos no banco SQLite (`king_pizzaria.db`).
- **Cardápio Digital por Categorias**: Pizzas Tradicionais, Especiais, Premium, Doces, Calzones, Bordas Recheadas, Bebidas e Promoções.
- **Montador de Pizzas Personalizadas**: Escolha de tamanho (Broto, Média, Grande ou Família), opção de 1 sabor ou meio a meio, bordas recheadas, adicionais extras e observações.
- **Cálculo Automático de Preços**: Regra configurável para pizzas meio a meio (maior valor ou média dos sabores) e multiplicador por tamanho, com validação de valores no servidor.
- **Carrinho Persistente via Banco de Dados**: Os itens adicionados ao carrinho são salvos na tabela `cart_items` do SQLite via API.
- **Finalização via WhatsApp**: Validação de dados do cliente, consulta automática de CEP via ViaCEP, seleção entre entrega ou retirada no balcão, formas de pagamento (PIX, Dinheiro com troco, Crédito e Débito), registro do pedido no banco e geração da comanda completa para o WhatsApp.
- **Indicador de Funcionamento**: Status dinâmico de Aberto/Fechado calculado a partir do horário configurado ou controle manual no painel administrativo.
- **Painel Administrativo Protegido**: Autenticação com hash seguro (`scrypt`) + token Bearer, configuração inicial de senha no primeiro acesso (ou via variável `ADMIN_PASSCODE`), cadastro, edição e exclusão de categorias e produtos, gerenciamento de sabores, taxas de entrega, horários e fila de pedidos.

---

## Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Vite
- **Backend**: Node.js, Express
- **Banco de Dados**: SQLite (`better-sqlite3`)

---

## Principais Rotas da API

- `GET /api/store` — Retorna catálogo completo (produtos, categorias, tamanhos, sabores, bordas, adicionais) e configurações da loja.
- `GET /api/admin/categories` e `POST /api/admin/categories` — Lista e cadastro de categorias. Use `PUT` e `DELETE` em `/api/admin/categories/:id` para editar e excluir. No painel, acesse **Gerenciar Produtos** e selecione uma categoria para listar seus pratos.
- `GET /api/cart` | `POST /api/cart/items` | `PATCH /api/cart/items/:id` | `DELETE /api/cart/items/:id` | `DELETE /api/cart` — Gerencia o carrinho no banco de dados.
- `POST /api/orders` — Valida itens/valores e registra um novo pedido no banco de dados.
- `GET /api/admin/auth-status` | `POST /api/admin/setup` | `POST /api/admin/login` | `POST /api/admin/logout` — Autenticação do painel administrativo.
- `GET /api/admin/orders` | `PATCH /api/admin/orders/:id/status` — Gestão de pedidos (autenticado).
- `POST/PUT/PATCH/DELETE /api/admin/products/*`, `/api/admin/flavors/*`, `/api/admin/settings` — Gestão administrativa (autenticado).

---

## Por que o projeto não abre direto pelo Live Server do VS Code?

A extensão **Live Server** do VS Code serve apenas arquivos estáticos simples (HTML, CSS e JS puro). Este projeto possui **servidor Express (`server.ts`)**, **banco de dados SQLite** e **frontend React/TypeScript (`.tsx`) com Tailwind CSS v4**, que precisam ser executados pelo Node.js e compilados pelo Vite.

---

## Como Executar Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão testada: Node 24) instalado na máquina.

### Passo a passo

1. Abra a pasta do projeto no VS Code e abra o terminal integrado (`Ctrl + '`).
2. Instale as dependências:
   ```bash
   npm install
   ```
3. *(Opcional)* Crie um arquivo `.env` a partir de `.env.example` caso queira fixar uma senha administrativa em `ADMIN_PASSCODE=suasenha` (se deixar vazio, o painel administrativo pedirá para você criar a senha no primeiro acesso).
4. Inicie o servidor full-stack (API + Frontend):
   ```bash
   npm run dev
   ```
5. Acesse no navegador `http://localhost:3000`. O banco `king_pizzaria.db` será criado e populado automaticamente na primeira execução.

### Build e execução em produção

```bash
npm run build
NODE_ENV=production npm start
```

---

## Testes Unitários

```bash
npx tsx --test src/utils/pricing.test.ts src/utils/whatsapp.test.ts
```
