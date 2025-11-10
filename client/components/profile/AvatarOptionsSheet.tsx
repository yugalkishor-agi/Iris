import { Camera, Image, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface AvatarOptionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCameraSelect: () => void;
  onGallerySelect: () => void;
  onRemove: () => void;
  hasAvatar: boolean;
}

export function AvatarOptionsSheet({
  open,
  onOpenChange,
  onCameraSelect,
  onGallerySelect,
  onRemove,
  hasAvatar,
}: AvatarOptionsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[20px]">
        <SheetHeader>
          <SheetTitle>Change Profile Picture</SheetTitle>
        </SheetHeader>
        <div className="grid gap-3 py-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14"
            onClick={() => {
              onCameraSelect();
              onOpenChange(false);
            }}
          >
            <Camera className="h-5 w-5" />
            <span className="text-base">Take Photo</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14"
            onClick={() => {
              onGallerySelect();
              onOpenChange(false);
            }}
          >
            <Image className="h-5 w-5" />
            <span className="text-base">Choose from Gallery</span>
          </Button>
          
          {hasAvatar && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14 text-destructive hover:text-destructive"
              onClick={() => {
                onRemove();
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-5 w-5" />
              <span className="text-base">Remove Picture</span>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
