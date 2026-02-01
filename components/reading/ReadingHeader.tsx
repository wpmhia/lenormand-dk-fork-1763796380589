"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share2, User, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Reading } from "@/lib/types";
import { SignificatorType } from "@/lib/spreads";

interface ReadingHeaderProps {
  reading: Reading;
  spreadId?: string;
  significatorType: SignificatorType;
  onSignificatorChange: (value: SignificatorType) => void;
  onShare?: () => Promise<void> | void;
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleShare = useCallback(async () => {
    if (!onShare) return;
    
    setIsSharing(true);
    try {
      await onShare();
      setShareClicked(true);
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setIsSharing(false);
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Set new timeout to reset button state
      timeoutRef.current = setTimeout(() => {
        setShareClicked(false);
      }, 2000);
    }
  }, [onShare, setShareClicked]);

  if (!showReadingHeader) return null;

  return (
    <div className="relative">
      <div className="mb-lg flex flex-wrap items-center justify-center gap-lg text-sm text-muted-foreground">
        <Badge variant="secondary">{reading.layoutType} Cards</Badge>

        {/* Significator selector for Grand Tableau */}
        {reading.layoutType === 36 && (
          <div className="flex items-center gap-2">
            <span className="text-xs">Significator:</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    The <strong>Significator</strong> represents the querent (person asking the question). 
                    Card 28 (Woman/Anima) or 29 (Man/Animus) marks their position in the spread, 
                    allowing directional readings (past/future from their perspective).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
            onClick={handleShare}
            variant="outline"
            size="sm"
            loading={isSharing}
            loadingText="Sharing..."
            className="border-border hover:bg-muted"
            aria-label={shareClicked ? "Link copied to clipboard" : isSharing ? "Sharing reading" : "Share reading"}
            aria-live="polite"
          >
            {!isSharing && <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />}
            {shareClicked ? "Copied!" : "Share"}
          </Button>
        )}
      </div>
    </div>
  );
}
