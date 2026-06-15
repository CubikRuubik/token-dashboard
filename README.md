# Token Dashboard

A full-stack ERC-20 token dashboard. Connect a wallet, track multiple tokens, send transfers, and view on-chain history — all indexed live from Sepolia.

## Architecture

```
Browser
  └── Next.js frontend (port 3000)
        └── Next.js API routes  (/api/*)
              └── NestJS backend (port 3001)
                    └── SQLite database (dev.db)
```

Frontend components never talk to NestJS directly. All data flows through Next.js API routes, which act as a thin proxy (BFF — Backend for Frontend). Business logic, validation, and database access live entirely in the NestJS backend.

## Apps

| App | Directory | Port | Role |
|-----|-----------|------|------|
| Next.js | `token-dashboard-next-js/` | 3000 | Frontend UI + API proxy layer |
| NestJS | `token-dashboard-api/` | 3001 | Business logic, validation, database, indexer |

## Features

- Connect any wallet via RainbowKit (MetaMask, WalletConnect, etc.)
- Add any ERC-20 token by contract address — name, symbol, and decimals resolved on-chain
- View token balances read directly from the chain
- Send ETH or any ERC-20 token with live wallet confirmation status
- ERC-20 transfer history indexed live from on-chain `Transfer` events
- ETH transfer history fetched from Alchemy — scoped to the current server session
- Activity feed with All / Received / Sent filter
- Dark / light theme toggle

## Tech stack

| Layer | Library |
|-------|---------|
| Frontend framework | Next.js 16 (App Router) |
| Backend framework | NestJS 10 (Fastify adapter) |
| Wallet / chain | wagmi v2 + viem, RainbowKit v2 |
| ORM | Prisma 7 |
| Database | SQLite via `@prisma/adapter-libsql` |
| Validation | class-validator + class-transformer |
| Chain RPC | Alchemy WebSocket (Sepolia) |

## Project structure

### Next.js (`token-dashboard-next-js/`)

```
app/
  layout.tsx              # Root layout — wraps children with Providers
  page.tsx                # App shell — view routing, modal state, theme toggle
  globals.css             # Design system (CSS variables, dark/light themes)
  api/
    tokens/
      route.ts            # GET, POST /api/tokens  → proxies to NestJS /tokens
      [id]/route.ts       # DELETE /api/tokens/:id → proxies to NestJS /tokens/:id
    transfers/
      route.ts            # GET /api/transfers     → proxies to NestJS /transfers
    eth-transfers/
      route.ts            # GET /api/eth-transfers → proxies to NestJS /eth-transfers

components/
  Sidebar.tsx             # Icon rail — navigation, theme toggle, disconnect
  TopBar.tsx              # Header — view title, wallet pill, action buttons
  HoldingsPanel.tsx       # Token balances table (reads balanceOf from chain)
  ActivityPanel.tsx       # Recent transfers feed (polls every 5s)
  ActivityView.tsx        # Full transfer history with filter
  TokensView.tsx          # Token management — add, remove, send per token
  modals/
    AddTokenModal.tsx     # Resolves ERC-20 contract on-chain, saves via API
    SendModal.tsx         # Token picker + transfer form
  ui/
    Icon.tsx
    TokenBadge.tsx
    Toast.tsx

lib/
  api.ts                  # BFF fetch client — ApiError class, typed get/post/delete
  tokens.ts               # Token type definition
  wagmi.ts                # wagmi config (Sepolia chain, RainbowKit)
```

### NestJS (`token-dashboard-api/`)

```
src/
  main.ts                 # Bootstrap — Fastify, ValidationPipe, CORS
  app.module.ts           # Root module

  tokens/                 # Token watchlist
    tokens.controller.ts  # GET /tokens, POST /tokens, DELETE /tokens/:id
    tokens.service.ts     # DB queries
    create-token.dto.ts   # Validation: address, name, symbol, decimals, chainId

  transfers/              # ERC-20 transfer history (written by indexer)
    transfers.controller.ts  # GET /transfers?address=
    transfers.service.ts     # DB query — sender or receiver, newest first

  eth-transfers/          # Native ETH transfers (live from Alchemy)
    eth-transfers.controller.ts  # GET /eth-transfers?address=
    eth-transfers.service.ts     # Alchemy alchemy_getAssetTransfers, session-scoped

  indexer/                # Background ERC-20 event watcher (no HTTP routes)
    indexer.service.ts    # OnModuleInit — watchContractEvent via viem WebSocket
                          # Polls DB every 30s for new tokens, upserts transfers

  prisma/
    prisma.service.ts     # PrismaClient wrapper with NestJS lifecycle hooks

prisma/
  schema.prisma           # Token and Transfer models
```

## Environment variables

### Next.js (`token-dashboard-next-js/.env.local`)

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEST_API_URL=http://localhost:3001
```

- `NEXT_PUBLIC_*` variables are exposed to the browser.
- `NEST_API_URL` is server-only — used only by Next.js API routes, never sent to the browser.

### NestJS (`token-dashboard-api/.env.local`)

```env
ALCHEMY_WS_URL=wss://eth-sepolia.g.alchemy.com/v2/your_key
DATABASE_URL=file:./dev.db
API_PORT=3001
FRONTEND_URL=http://localhost:3000
```

## How to run

### 1. Install dependencies

```bash
# Next.js
cd token-dashboard-next-js && npm install

# NestJS
cd token-dashboard-api && npm install
```

### 2. Configure environment

Copy the env vars above into `.env.local` in each app directory.

- WalletConnect project ID: [cloud.walletconnect.com](https://cloud.walletconnect.com)
- Alchemy key: [alchemy.com](https://alchemy.com) → create an app → Ethereum Sepolia → WebSocket URL

### 3. Set up the database (NestJS app)

```bash
cd token-dashboard-api
npx prisma migrate dev
npx prisma generate
```

### 4. Start both apps

In two separate terminals:

```bash
# Terminal 1 — NestJS backend
cd token-dashboard-api && npm run dev

# Terminal 2 — Next.js frontend
cd token-dashboard-next-js && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API endpoints

### Next.js API routes (called by the browser)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tokens?chainId=` | List tracked tokens |
| `POST` | `/api/tokens` | Add a token to the watchlist |
| `DELETE` | `/api/tokens/:id` | Remove a token |
| `GET` | `/api/transfers?address=` | ERC-20 transfer history |
| `GET` | `/api/eth-transfers?address=` | Native ETH transfer history |

### NestJS endpoints (called only by Next.js API routes)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tokens?chainId=` | List tokens from DB |
| `POST` | `/tokens` | Upsert token (validated) |
| `DELETE` | `/tokens/:id` | Delete token |
| `GET` | `/transfers?address=` | ERC-20 transfers — sender or receiver |
| `GET` | `/eth-transfers?address=` | ETH transfers via Alchemy |

## Database schema

```prisma
model Token {
  id        Int      @id @default(autoincrement())
  address   String
  name      String
  symbol    String
  decimals  Int
  chainId   Int
  createdAt DateTime @default(now())

  @@unique([address, chainId])
}

model Transfer {
  id           Int      @id @default(autoincrement())
  tokenAddress String
  from         String
  to           String
  amount       String
  txHash       String   @unique
  createdAt    DateTime @default(now())
}
```

## Indexer

The `IndexerService` runs inside the NestJS process — no separate script needed. On startup it:

1. Loads all tokens from the DB and opens a WebSocket subscription per token via Alchemy
2. Polls the DB every 30 s for newly added tokens and starts watching them automatically
3. Unsubscribes automatically when a token is deleted from the watchlist
4. Writes transfers to SQLite with `upsert` on `txHash` — safe to restart, no duplicates

ETH transfers are not indexed — they are fetched on demand from Alchemy via `/eth-transfers`.

## Smart contract

The dashboard targets ERC-20 tokens on the **Sepolia** testnet. Any ERC-20 contract address can be added — the dashboard resolves `name`, `symbol`, and `decimals` on-chain automatically.
