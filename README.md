# TokenDashboard

A full-stack ERC-20 token dashboard built with Next.js. Connect a wallet, track multiple tokens, send transfers, and view on-chain history — all indexed live from Sepolia.

## Features

- Connect any wallet via RainbowKit (MetaMask, WalletConnect, etc.)
- Add any ERC-20 token by contract address — name, symbol, and decimals are resolved on-chain
- View token balances read directly from the chain
- Send tokens with live wallet confirmation status
- Transfer history indexed from on-chain `Transfer` events via a background indexer
- Dark / light theme toggle

## Tech stack

| Layer          | Library                                        |
| -------------- | ---------------------------------------------- |
| Framework      | Next.js 16 (App Router)                        |
| Wallet / chain | wagmi v2 + viem, RainbowKit v2                 |
| Database       | SQLite via Prisma 7 + `@prisma/adapter-libsql` |
| Chain RPC      | Alchemy WebSocket (Sepolia)                    |
| Icons          | react-icons                                    |

## Project structure

```
app/
  layout.tsx              # Root layout — wraps children with Providers
  page.tsx                # App shell — view routing, modal state, theme toggle
  globals.css             # Design system (CSS variables, dark/light themes)
  api/
    tokens/
      route.ts            # GET, POST /api/tokens
      [id]/route.ts       # DELETE /api/tokens/:id
    transfers/
      route.ts            # GET /api/transfers

components/
  Sidebar.tsx             # Icon rail — navigation, theme toggle, disconnect
  TopBar.tsx              # Header — view title, wallet pill, action buttons
  HoldingsPanel.tsx       # Token balances table (reads balanceOf from chain)
  ActivityPanel.tsx       # Recent transfers feed (polls DB every 5s)
  ActivityView.tsx        # Full transfer history with All/Received/Sent filter
  TokensView.tsx          # Token management — add, remove, send per token
  modals/
    AddTokenModal.tsx     # Resolves ERC-20 contract on-chain, saves to DB
    SendModal.tsx         # Token picker + transfer form (useWriteContract)
    ReceiveModal.tsx      # Wallet address + faux QR code
  ui/
    Icon.tsx              # Icon component backed by react-icons
    TokenBadge.tsx        # Colored avatar with deterministic color from address
    Toast.tsx             # Auto-dismissing notification

lib/
  prisma.ts               # Prisma singleton with libsql driver adapter
  tokens.ts               # Token type definition
  wagmi.ts                # wagmi config (Sepolia chain, RainbowKit)

prisma/
  schema.prisma           # Token and Transfer models

scripts/
  indexer.ts              # Standalone indexer — watches Transfer events via WebSocket
```

## API reference

### `GET /api/tokens?chainId=<number>`

Returns all tracked tokens for the given chain.

**Response** `200`

```json
[
  {
    "id": 1,
    "address": "0xabc...",
    "name": "USD Coin",
    "symbol": "USDC",
    "decimals": 6,
    "chainId": 11155111,
    "createdAt": "2026-06-11T14:00:00.000Z"
  }
]
```

---

### `POST /api/tokens`

Adds a token to the watchlist. Idempotent — re-adding the same address on the same chain is a no-op.

**Body**

```json
{
  "address": "0xabc...",
  "name": "USD Coin",
  "symbol": "USDC",
  "decimals": 6,
  "chainId": 11155111
}
```

**Response** `201` — the created (or existing) token object.

---

### `DELETE /api/tokens/:id`

Removes a token from the watchlist by its database ID.

**Response** `204 No Content`

---

### `GET /api/transfers?address=<0x...>`

Returns all transfers where the given address is either sender or recipient, ordered newest first.

**Response** `200`

```json
[
  {
    "id": 1,
    "tokenAddress": "0xabc...",
    "from": "0x111...",
    "to": "0x222...",
    "amount": "150.0",
    "txHash": "0xdef...",
    "createdAt": "2026-06-11T14:02:00.000Z"
  }
]
```

---

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

The indexer (`scripts/indexer.ts`) is a separate Node.js process that subscribes to on-chain `Transfer` events for every token in the DB. It runs alongside the Next.js server — the API never writes transfers directly.

- Connects to Sepolia via Alchemy WebSocket (`ALCHEMY_WS_URL`)
- Uses `watchContractEvent` from viem to receive live events
- Writes to SQLite with `upsert` on `txHash` — safe to restart, no duplicates

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
ALCHEMY_WS_URL=wss://eth-sepolia.g.alchemy.com/v2/your_key
DATABASE_URL=file:./dev.db
```

- WalletConnect project ID: [cloud.walletconnect.com](https://cloud.walletconnect.com)
- Alchemy key: [alchemy.com](https://alchemy.com) → create an app → Ethereum Sepolia → WebSocket URL

### 3. Set up the database

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Run

Start both the Next.js server and the indexer together:

```bash
npm run dev:all
```

Or separately:

```bash
npm run dev       # Next.js only
npm run indexer   # indexer only
```
