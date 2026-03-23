import { createAdminClient } from "@/lib/supabase/admin";
import { DocumentList } from "@/components/admin/document-list";

export default async function DocumentsPage() {
  // Use admin client to bypass RLS for document listing
  const supabase = createAdminClient();

  const { data: documents } = await supabase
    .from("documents")
    .select(
      "id, title, category, access_level, file_name, version, is_active, created_at, updated_at",
    )
    .is("parent_document_id", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Διαχείριση Εγγράφων</h1>
      </div>
      <DocumentList initialDocuments={documents ?? []} />
    </div>
  );
}
