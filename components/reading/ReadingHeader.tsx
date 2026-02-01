"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share2, User } from "lucide-react";
import { Reading } from "@/lib/types";
import { SignificatorType } from "@/lib/spreads";

interface ReadingHeaderProps {
  reading: Reading;
  spreadId?: string;
  significatorType: SignificatorType;
  onSignificatorChange: (value: SignificatorType) => void;
  onShare?: () => void;
  showShareButton?: boolean;
  showReadingHeader?: boolean;
  shareClicked: boolean;
  setShareClicked: (clicked: boolean) => void;
}

export function ReadingHeader({
  reading,
  significatorType,
  onSignificatorChange,
  onShare,
  showShareButton = true,
  showReadingHeader = true,
  shareClicked,
  setShareClicked,
}: ReadingHeaderProps) {
  if (!showReadingHeader) return null;

  return (
    <div className="relative">
      <div className="mb-lg flex flex-wrap items-center justify-center gap-lg text-sm text-muted-foreground">
        <Badge variant="secondary">{reading.layoutType} Cards</Badge>

        {/* Significator selector for Grand Tableau */}
        {reading.layoutType === 36 && (
          <div className="flex items-center gap-2">
            <span className="text-xs">Significator:</span>
            <Select
              value={significatorType}
              onValueChange={(value) =>
                onSignificatorChange(value as SignificatorType)
              }
            >
              <SelectTrigger className="h-8 w-[120px] border-border text-xs">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="anima">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Anima (28)
                  </div>
                </SelectItem>
                <SelectItem value="animus">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Animus (29)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {showShareButton && onShare && (
          <Button
            onClick={async () => {
              setShareClicked(true);
              await onShare();
              setTimeout(() => setShareClicked(false), 2000);
            }}
            variant="outline"
            size="sm"
            className="border-border hover:bg-muted"
          >
            <Share2 className="mr-2 h-4 w-4" />
            {shareClicked ? "Copied!" : "Share"}
          </Button>
        )}
      </div>
    </div>
  );
}
