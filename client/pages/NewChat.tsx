import { Input } from "@/components/ui/input";

export default function NewChat() {
  return (
    <div className="p-4 space-y-4">
      <Input placeholder="Search users" />
      <div className="text-sm text-muted-foreground">Start a conversation by searching for a user.</div>
    </div>
  );
}
