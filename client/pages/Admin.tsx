import { Card } from "@/components/ui/card";

export default function Admin() {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {["Users", "Posts", "Reports"].map((x) => (
          <Card key={x} className="p-3 text-center">
            <div className="text-sm text-muted-foreground">{x}</div>
            <div className="text-2xl font-bold">—</div>
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Recent Reports</h3>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Spam post by @user12</li>
          <li>Abusive message in chat 42</li>
        </ul>
      </Card>
    </div>
  );
}
