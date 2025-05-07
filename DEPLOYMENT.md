# In/Out - Drop #5 Deployment Guide

## ✅ Prerequisites
- Node.js 18+
- npm
- GitHub repo (optional)
- Vercel account (https://vercel.com/)
- Supabase project with `picks` table created from picks.sql
- BallDon'tLie API key with upgraded access

## 📦 Setup

1. Unzip the project folder:
   ```bash
   unzip in-or-out-drop5-final.zip
   cd in-or-out-drop5-final
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` in the root with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_BDL_API_KEY=your_balldontlie_api_key
   ```

4. Run locally:
   ```bash
   npm run dev
   ```

5. Deploy to Vercel:
   - Push to GitHub (optional)
   - Import to Vercel via dashboard
   - Add your `.env.local` values in Vercel’s environment settings

## 🔐 Supabase Setup

Run the following SQL in Supabase:
```sql
drop table if exists picks cascade;

create table picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  player_id integer not null,
  player_name text,
  selection text check (selection in ('IN', 'OUT')),
  per_at_selection float,
  current_per float,
  per_change float generated always as (current_per - per_at_selection) stored,
  created_at timestamptz default now(),
  unique (user_id, player_id)
);

alter table picks enable row level security;

create policy "Users manage their own picks"
on picks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## 🧠 Features Included
- Neon-style UI
- Player search (BallDon'tLie)
- IN/OUT pick system
- PER comparison vs. baseline
- Leaderboard by portfolio PER
- Team info display
- Auth, nickname, public portfolios