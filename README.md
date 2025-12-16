# EXAMPLE ENV

```
# frontend

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=example

# Site URL (로그인 후 리다이렉트 URL)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cloudflare R2
R2_ACCOUNT_ID=example
R2_ACCESS_KEY_ID=example
R2_SECRET_ACCESS_KEY=example
R2_BUCKET_NAME=example
R2_PUBLIC_URL="https://pub-example.r2.dev"
```

```
# backend

# Server Configuration
PORT=4000

# Supabase Configuration
SUPABASE_URL=https://example.supabase.co
SUPABASE_ANON_KEY=example
SUPABASE_SERVICE_ROLE_KEY=example

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=example
R2_ACCESS_KEY_ID=example
R2_SECRET_ACCESS_KEY=example
R2_BUCKET_NAME=example
R2_PUBLIC_URL=https://pub-example.r2.dev

# CORS
FRONTEND_URL=http://localhost:3000

# upstash
REDIS_URL="rediss://default:example.upstash.io:6379"
```