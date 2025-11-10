import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

interface AltTextDialogProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  altTexts: { [key: number]: string };
  onSave: (altTexts: { [key: number]: string }) => void;
}

export function AltTextDialog({ isOpen, onClose, images, altTexts, onSave }: AltTextDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localAltTexts, setLocalAltTexts] = useState<{ [key: number]: string }>(altTexts);

  useEffect(() => {
    setLocalAltTexts(altTexts);
  }, [altTexts]);

  const handleSave = () => {
    onSave(localAltTexts);
    onClose();
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Write Alt Text</DialogTitle>
          <DialogDescription>
            Alt text helps people with visual impairments understand your image. Image {currentIndex + 1} of {images.length}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            <img
              src={images[currentIndex]}
              alt={`Image ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Alt Text Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Alt text for image {currentIndex + 1}
            </label>
            <Textarea
              value={localAltTexts[currentIndex] || ""}
              onChange={(e) => {
                setLocalAltTexts({
                  ...localAltTexts,
                  [currentIndex]: e.target.value,
                });
              }}
              placeholder="Describe what's in this image..."
              className="min-h-[100px] resize-none"
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">
              {(localAltTexts[currentIndex] || "").length}/300 characters
            </p>
          </div>

          {/* Navigation */}
          {images.length > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {images.length}
              </span>
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentIndex === images.length - 1}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Alt Text
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
