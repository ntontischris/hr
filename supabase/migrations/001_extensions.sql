-- Enable pgvector for embedding similarity search
create extension if not exists vector;

-- Enable pg_trgm for text search fallback
create extension if not exists pg_trgm;
