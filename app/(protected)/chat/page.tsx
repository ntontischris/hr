import { ChatInterface } from "@/components/chat/chat-interface";

const SUGGESTIONS = [
  "Ποια είναι η διαδικασία για αίτημα αδείας;",
  "Τι παροχές έχω στην εταιρεία;",
  "Ποιες άδειες δικαιούμαι;",
  "Πώς μπορώ να ζητήσω τηλεργασία;",
];

export default function ChatPage() {
  return <ChatInterface suggestions={SUGGESTIONS} />;
}
