"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface StartOverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function StartOverDialog({
  open,
  onOpenChange,
  onConfirm,
}: StartOverDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Start Over?</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This will reset your current reading and all progress. This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border text-card-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="destructive">
            Start Over
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
