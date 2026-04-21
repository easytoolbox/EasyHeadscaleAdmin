# EasyHeadscaleAdmin

[中文说明](./README.zh-CN.md)

EasyHeadscaleAdmin is a modern self-hosted Headscale admin panel built with Next.js 15, TypeScript, Tailwind CSS, Prisma, and SQLite. It focuses on a deployable MVP first, while keeping a clean structure for future extensions such as multi-instance support, RBAC, OIDC, and audit controls.

## Highlights

- Real Headscale management, not a static demo
- Server-side Headscale API proxy, with no Headscale API key exposed to the browser
- Local encrypted config storage with Prisma + SQLite
- Dashboard, users, nodes, preauth keys, API keys, routes, settings, ACL, DNS, DERP, and audit pages
- Admin login with password hash verification
- Docker and 1Panel deployment support
- Internationalized UI with English and Simplified Chinese

## Tailscale Official Client Registration Takeover

This project can take over the **web registration approval flow** used by the official Tailscale client when it is pointed at Headscale.

That means:

- the Tailscale client can still open the normal Headscale registration URL
- your public Headscale domain still continues serving normal Headscale control-plane traffic
- EasyHeadscaleAdmin can handle the `/register/<token>` page, login, and approval flow
- after login, you can choose a Headscale user and approve the pending node registration from the UI

The current project implementation uses the Headscale registration endpoint that has been verified against the instance Swagger definition:

- `POST /api/v1/node/register?user=<username>&key=<token>`

### Reverse Proxy Setup

If Headscale is already running behind a reverse proxy, you only need to forward the `/register/` path to EasyHeadscaleAdmin:

```nginx
location ^~ /register/ {
    return 301 https://your-domain-name$request_uri;
}
```

Typical deployment pattern:

1. `Headscale` continues serving the control plane on its own internal address
2. the public Headscale domain keeps serving normal client protocol traffic
3. only `/register/*` is redirected or proxied to EasyHeadscaleAdmin
4. EasyHeadscaleAdmin handles login and node approval UI for the official Tailscale client registration flow

Important notes:

- this takes over the **registration approval page**
- it only replaces the `/register/*` web approval page
- it does **not** replace the full Headscale control plane protocol
- client heartbeat, map updates, and normal control traffic should still be served by Headscale itself

## MVP Features

- Headscale setup: server URL + API key validation and secure local storage
- Dashboard with health and summary stats
- Users management
- Nodes management
- PreAuth Keys management
- API Keys management
- Routes management
- Settings and system status
- ACL, DNS, DERP, and audit log pages for extended operations

## Tech Stack

- Next.js 15 App Router
- TypeScript
- React 19
- Tailwind CSS
- shadcn-style UI component structure
- TanStack Query
- TanStack Table
- React Hook Form + Zod
- Prisma + SQLite
- Docker + docker-compose

## Project Structure

```text
app/
  (protected)/
  api/
  setup/
components/
  layout/
  shared/
  ui/
features/
  dashboard/
  users/
  nodes/
  preauthkeys/
  apikeys/
  routes/
  settings/
lib/
  api.ts
  env.ts
  errors.ts
  forms/
  headscale/
server/
  config-service.ts
  crypto.ts
  db.ts
prisma/
  schema.prisma
  migrations/
```

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Prepare environment variables

```bash
cp .env.example .env
```

Main variables:

- `DATABASE_URL`: local SQLite database path
- `APP_ENCRYPTION_KEY`: encrypts the stored Headscale API key
- `AUTH_SESSION_SECRET`: signs the admin session cookie
- `ADMIN_USERNAME`: admin username
- `ADMIN_PASSWORD_HASH`: admin password hash
- `PORT`: listen port
- `NEXT_PUBLIC_BASE_PATH`: optional base path for subdirectory deployments such as `/admin` or `/register`

### 3. Initialize the database

```bash
pnpm db:deploy
```

### 4. Generate an admin password hash

```bash
pnpm auth:hash 'your-password'
```

To verify a password against the current `.env` hash:

```bash
pnpm auth:verify 'your-password'
```

### 5. Start development

```bash
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Production Build

```bash
pnpm build
pnpm start
```

## Base Path / Subdirectory Deployment

This project supports deployment at the root path or under a subdirectory, but **basePath is a build-time setting**.

Root deployment:

```bash
./build.sh
```

Subdirectory deployment:

```bash
NEXT_PUBLIC_BASE_PATH="/register" ./build.sh
```

Notes:

- leave `NEXT_PUBLIC_BASE_PATH` empty for root deployment
- changing `NEXT_PUBLIC_BASE_PATH` requires a rebuild
- routes, static assets, and internal API requests will follow the configured base path

## Docker Deployment

### docker-compose

```bash
APP_ENCRYPTION_KEY="replace-with-a-long-random-secret" docker compose up -d --build
```

### Docker

```bash
docker build -t easy-headscale-admin .
docker run -d \
  --name easy-headscale-admin \
  -p 3000:3000 \
  -e DATABASE_URL="file:./dev.db" \
  -e APP_ENCRYPTION_KEY="replace-with-a-long-random-secret" \
  -e AUTH_SESSION_SECRET="replace-with-another-long-random-secret" \
  -e ADMIN_USERNAME="admin" \
  -e ADMIN_PASSWORD_HASH="replace-with-output-from-pnpm-auth-hash" \
  easy-headscale-admin
```

## 1Panel Deployment

This project supports deployment in a Node runtime such as `1panel/node:25.8.0`.

Build a runtime bundle:

```bash
./build.sh
```

The output directory is:

```text
dist/1panel-node
```

Recommended 1Panel settings:

- source directory: the generated runtime directory, such as `/app`
- start command: `node server.js`
- runtime port: match the `PORT` value in `.env`

On first startup, the runtime wrapper will:

1. load `.env`
2. install dependencies if needed
3. run Prisma migrations
4. create `.db-deploy.done`
5. start Next.js

## Security Notes

- browsers never call Headscale directly
- Headscale API keys stay on the server
- write operations are validated with Zod
- admin passwords are stored as password hashes
- local product state is separated from Headscale live data

## Headscale API Notes

- the project talks to Headscale through a centralized server-side client
- request and error handling are unified
- route handling includes compatibility logic where needed
- the current web registration approval flow is implemented against the verified `POST /api/v1/node/register` endpoint

## Example Data Flow

1. an admin saves Headscale URL and API key from `/setup`
2. the server validates the connection
3. the API key is encrypted and stored in SQLite
4. protected pages read local config from SQLite
5. the server creates a Headscale client with that config
6. UI pages fetch data only from this project's own `/api/*` endpoints

## GitHub Publish Workflow

If you want to keep a full local development copy and only publish a cleaned snapshot to GitHub, use the provided publish workflow:

```bash
pnpm github:sync
```

By default, it syncs to a sibling directory:

```text
../36.EasyHeadscaleAdmin-github
```

You can also choose a custom target:

```bash
sh scripts/sync-to-github.sh /absolute/path/to/publish-repo
```

The sync script excludes local-only content such as:

- `.env`
- `.next`
- `node_modules`
- local SQLite dev database files
- `.DS_Store`
- other temporary build artifacts
