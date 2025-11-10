import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ReportProblem() {
  return (
    <form className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Report a Problem</h1>
      <Textarea placeholder="Describe the issue..." rows={6} />
      <div className="flex justify-end"><Button type="submit">Submit</Button></div>
    </form>
  );
}
