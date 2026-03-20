import { createClient } from "@/lib/supabase/server";
import { PaginationSchema } from "@/lib/validators/common";
import { error, success } from "@/lib/api/response";

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return error("Μη εξουσιοδοτημένη πρόσβαση", 401);
  }

  const url = new URL(request.url);
  const parsed = PaginationSchema.safeParse({
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
  });

  if (!parsed.success) {
    return error("Μη έγκυρες παράμετροι", 400);
  }

  const { page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const category = url.searchParams.get("category");

  let query = supabase
    .from("documents")
    .select(
      "id, title, category, access_level, file_name, version, is_active, created_at, updated_at",
      { count: "exact" },
    )
    .is("parent_document_id", null) // Only parent documents
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (category) {
    query = query.eq("category", category);
  }

  const { data: documents, error: dbError, count } = await query;

  if (dbError) {
    return error("Αποτυχία ανάκτησης εγγράφων", 500);
  }

  return success({
    documents,
    pagination: { page, limit, total: count ?? 0 },
  });
}
