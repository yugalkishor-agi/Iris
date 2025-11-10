import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Flag, ChevronRight, ChevronLeft } from 'lucide-react';
import { REPORT_CATEGORIES } from '../../../src/services/report.service';

interface UniversalReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (category: string, subcategory?: string, customReason?: string) => Promise<void>;
  title?: string;
  description?: string;
}

export function UniversalReportDialog({
  open,
  onOpenChange,
  onSubmit,
  title = 'Report Content',
  description = 'Help us understand what\'s wrong with this content',
}: UniversalReportDialogProps) {
  const [step, setStep] = useState<'category' | 'subcategory' | 'custom'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setStep('category');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setCustomReason('');
    onOpenChange(false);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setStep('subcategory');
  };

  const handleSubcategorySelect = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    
    // If "Something else" is selected, show custom input
    if (subcategory === 'Something else') {
      setStep('custom');
    }
  };

  const handleSubmit = async () => {
    if (!selectedCategory) return;

    setLoading(true);
    try {
      await onSubmit(
        selectedCategory,
        selectedSubcategory || undefined,
        customReason || undefined
      );
      handleClose();
    } catch (error) {
      console.error('Failed to submit report:', error);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = selectedCategory && (step === 'custom' ? customReason.trim() : selectedSubcategory);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Flag className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Step 1: Select Category */}
        {step === 'category' && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Why are you reporting this?</p>
            <div className="space-y-2">
              {Object.entries(REPORT_CATEGORIES).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => handleCategorySelect(key)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                >
                  <span className="text-sm font-medium">{label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Subcategory */}
        {step === 'subcategory' && selectedCategory && (
          <div className="space-y-3">
            <button
              onClick={() => setStep('category')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <p className="text-sm font-medium">
              {REPORT_CATEGORIES[selectedCategory as keyof typeof REPORT_CATEGORIES]?.label}
            </p>
            <RadioGroup value={selectedSubcategory} onValueChange={handleSubcategorySelect}>
              {REPORT_CATEGORIES[selectedCategory as keyof typeof REPORT_CATEGORIES]?.subcategories.map(
                (subcategory) => (
                  <div key={subcategory} className="flex items-center space-x-2 p-2 rounded hover:bg-accent">
                    <RadioGroupItem value={subcategory} id={subcategory} />
                    <Label htmlFor={subcategory} className="flex-1 cursor-pointer text-sm">
                      {subcategory}
                    </Label>
                  </div>
                )
              )}
            </RadioGroup>
          </div>
        )}

        {/* Step 3: Custom Reason */}
        {step === 'custom' && (
          <div className="space-y-3">
            <button
              onClick={() => setStep('subcategory')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <p className="text-sm font-medium">Please provide more details</p>
            <Textarea
              placeholder="Tell us more about why you're reporting this..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Your report is anonymous. Provide as much detail as possible to help us review this content.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
