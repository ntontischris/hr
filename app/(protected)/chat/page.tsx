import { ChatInterface } from "@/components/chat/chat-interface";

const SUGGESTIONS = [
  "Ποια είναι η διαδικασία για αίτημα αδείας;",
  "Τι παροχές έχω στην εταιρεία;",
  "Πώς λειτουργεί η αξιολόγηση απόδοσης;",
  "Ποιες άδειες δικαιούμαι;",
  "Ποια είναι τα ωράρια εργασίας;",
  "Πώς μπορώ να ζητήσω τηλεργασία;",
];

export default function ChatPage() {
  return <ChatInterface suggestions={SUGGESTIONS} />;
}
