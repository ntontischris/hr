-- Similarity search function
create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5,
  p_access_level text default 'all'
)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  similarity float
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    d.id,
    d.title,
    d.content,
    d.category,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where
    d.is_active = true
    and d.embedding is not null
    and 1 - (d.embedding <=> query_embedding) > match_threshold
    and (
      d.access_level = 'all'
      or p_access_level = 'hr_only'
    )
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Hybrid search (vector + text fallback)
create or replace function hybrid_search(
  query_text text,
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 5,
  p_access_level text default 'all'
)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  score float
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    d.id,
    d.title,
    d.content,
    d.category,
    greatest(
      1 - (d.embedding <=> query_embedding),
      similarity(d.content, query_text) * 0.8
    ) as score
  from public.documents d
  where
    d.is_active = true
    and (
      (d.embedding is not null and 1 - (d.embedding <=> query_embedding) > match_threshold)
      or similarity(d.content, query_text) > 0.3
    )
    and (
      d.access_level = 'all'
      or p_access_level = 'hr_only'
    )
  order by score desc
  limit match_count;
end;
$$;
