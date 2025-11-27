# Setup Guide for Remixed Project

This project uses Lovable Cloud (Supabase) for backend functionality. After remixing, you'll need to connect your own backend.

## Quick Setup

### Option 1: Use Lovable Cloud (Recommended)
1. Open your remixed project in Lovable
2. Go to Settings → Integrations
3. Enable Lovable Cloud
4. The `.env` and `supabase/config.toml` files will be automatically configured

### Option 2: Connect Your Own Supabase Project
1. Create a new Supabase project at https://supabase.com
2. Copy `.env.example` to `.env`
3. Fill in your Supabase project details:
   - `VITE_SUPABASE_PROJECT_ID`: Your project ID
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your anon/public key
   - `VITE_SUPABASE_URL`: Your project URL
4. Copy `supabase/config.example.toml` to `supabase/config.toml` and update the project_id
5. Run the migrations in your Supabase project (found in `supabase/migrations/`)

## Database Setup

All database migrations are located in `supabase/migrations/`. Apply them in order to your Supabase project.

## Features Requiring Backend

This application uses backend services for:
- User authentication
- Invoice management
- Client data storage
- Expense tracking
- Bank statement uploads
- SAFT/SPV integrations
- Payment processing (Stripe)

## Troubleshooting

If you see authentication errors or "Invalid API key" errors, verify your `.env` configuration matches your Supabase project credentials.
