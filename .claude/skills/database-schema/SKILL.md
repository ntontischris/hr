---
name: database-schema
description: Database schema design for Supabase/PostgreSQL. Tables, relationships, indexes, migrations, RLS policies, triggers, and functions. Use when user mentions database, schema, tables, migrations, indexes, foreign keys, or data modeling.
---

# Database Schema Design (Supabase/PostgreSQL)

## Schema Template
```sql
-- Always include these columns
CREATE TABLE table_name (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- ... your columns ...
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ALWAYS enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

## Common Schemas

### Multi-tenant SaaS
```sql
-- Organizations
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Memberships (many-to-many: users <-> orgs)
CREATE TABLE memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  UNIQUE(user_id, org_id)
);

-- RLS: org members see org data
CREATE POLICY "Members see org" ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())
  );
```

### Content/Blog
```sql
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_published ON posts(published, published_at DESC);
```

## Index Rules
```sql
-- Index columns you filter/sort by
CREATE INDEX idx_name ON table(column);

-- Composite index: order matters (most selective first)
CREATE INDEX idx_user_status ON orders(user_id, status);

-- Partial index: only index what you query
CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;

-- DON'T index: small tables (<1000 rows), rarely queried columns, 
-- columns with low cardinality (boolean), frequently updated columns
```

## Migration Safety
```sql
-- SAFE: Add column with default
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- SAFE: Add index concurrently (no lock)
CREATE INDEX CONCURRENTLY idx_name ON table(column);

-- DANGEROUS: Add NOT NULL column without default (locks table)
-- Instead: add nullable → backfill → add constraint

-- DANGEROUS: Drop column (might break running code)
-- Instead: stop reading → deploy → drop column later
```

## Common Mistakes
- ALWAYS use UUID for primary keys, not serial
- ALWAYS add created_at and updated_at
- ALWAYS enable RLS on every table
- NEVER use TEXT without a reasonable length in mind
- ALWAYS add ON DELETE CASCADE or ON DELETE SET NULL to foreign keys
- NEVER store money as FLOAT — use INTEGER (cents) or NUMERIC
- ALWAYS add indexes for foreign key columns
