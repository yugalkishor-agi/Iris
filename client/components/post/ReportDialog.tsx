import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "post" | "comment";
  targetId: string;
  postId?: string;
  reporterId: string;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam or misleading" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech or symbols" },
  { value: "violence", label: "Violence or dangerous content" },
  { value: "nudity", label: "Nudity or sexual content" },
  { value: "fake", label: "False information" },
  { value: "scam", label: "Scam or fraud" },
  { value: "other", label: "Other" },
];

export function ReportDialog({
  isOpen,
  onClose,
  targetType,
  targetId,
  postId,
  reporterId,
}: ReportDialogProps) {
  const { toast } = useToast();
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast({
        title: "Select a reason",
        description: "Please select a reason for reporting",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { postService } = await import("../../../src/services/post.service");

      if (targetType === "comment" && postId) {
        await postService.reportComment(postId, targetId, reporterId, selectedReason);
      } else {
        // Report post
        await postService.reportPost(targetId, reporterId, selectedReason);
      }

      toast({
        title: "Report Submitted",
        description: "Thank you for keeping our community safe. We'll review this report shortly.",
      });

      // Reset and close
      setSelectedReason("");
      setAdditionalInfo("");
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report {targetType === "post" ? "Post" : "Comment"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Why are you reporting this {targetType}?
          </p>

          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            <div className="space-y-3">
              {REPORT_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="cursor-pointer font-normal">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          {selectedReason === "other" && (
            <Textarea
              placeholder="Please provide additional details..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="min-h-[80px]"
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || submitting}
            variant="destructive"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
