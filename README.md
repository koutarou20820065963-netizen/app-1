# Instant Memo App

English learning app with Spaced Repetition (SRS) and AI-powered feedback.

## Setup & Installation

### 1. Environment Variables
Create `.env.local` in the root directory:

```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database (Supabase / Postgres)
# Connect to Transaction Pooler (port 6543)
DATABASE_URL="postgres://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection for Migrations (port 5432)
DIRECT_URL="postgres://postgres.xxxx:password@aws-0-region.supabase.co:5432/postgres"

# OpenAI
OPENAI_API_KEY=sk-...
```

### 2. Install Dependencies
```bash
npm install
```
This will automatically run `prisma generate` via the `postinstall` script.

### 3. Initialize Database
Push the schema to your database:
```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

---

## Troubleshooting

### Prisma Client Not Found / 500 Error
If you see `Cannot find module .prisma/client/default`:

1.  **Stop the server**.
2.  **Clean Cache** (PowerShell):
    ```powershell
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
    ```
    *Mac/Linux*: `rm -rf node_modules .next`
3.  **Reinstall & Generate**:
    ```bash
    npm install
    npx prisma generate
    ```

### Middleware 404 / Infinity Loop
If you encounter `NEXT_HTTP_ERROR_FALLBACK` or redirects:
- Ensure `.env.local` has valid Clerk keys.
- Ensure `middleware.js` uses `redirectToSignIn` instead of throwing errors.

### "Prisma Client not initialized" on Vercel
- Ensure `DATABASE_URL` and `DIRECT_URL` are set in Vercel Project Settings.
- `postinstall` script in `package.json` ensures the client is generated during build.
