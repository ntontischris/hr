import { createClient } from "@/lib/supabase/server";
import { DocumentSearchSchema } from "@/lib/validators/documents";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { error, success } from "@/lib/api/response";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return error("Μη εξουσιοδοτημένη πρόσβαση", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = DocumentSearchSchema.safeParse(body);
  if (!parsed.success) {
    return error("Μη έγκυρα δεδομένα", 400, { issues: parsed.error.issues });
  }

  const { query, threshold, count } = parsed.data;
  const userRole = (user.app_metadata?.user_role as string) ?? "employee";
  const accessLevel = ["hr_manager", "admin"].includes(userRole)
    ? "hr_only"
    : "all";

  const queryEmbedding = await generateEmbedding(query);

  const { data: results, error: searchError } = await supabase.rpc(
    "hybrid_search",
    {
      query_text: query,
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: threshold,
      match_count: count,
      p_access_level: accessLevel,
    },
  );

  if (searchError) {
    return error("Αποτυχία αναζήτησης", 500);
  }

  return success({ results: results ?? [] });
}
