"use client";

import { useState } from "react";
import { useSupporterStatus } from "@/hooks/use-supporter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, X, Gift, Crown } from "lucide-react";

interface SupporterSettingsProps {
  onClose?: () => void;
}

export function SupporterSettings({ onClose }: SupporterSettingsProps) {
  const { status, redeemCode, clearStatus } = useSupporterStatus();
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRedeem = () => {
    setError("");
    setSuccess(false);
    
    if (!inputCode.trim()) {
      setError("Please enter a code");
      return;
    }

    if (redeemCode(inputCode)) {
      setSuccess(true);
      setInputCode("");
    } else {
      setError("Invalid code. Please check and try again.");
    }
  };

  const benefits = [
    "Access to 9-card and 36-card spreads",
    "Priority AI processing",
    "Support the development",
  ];

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-600">
          <Crown className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-xl">Lenormand Supporter</CardTitle>
        <CardDescription>
          {status.isSupporter 
            ? `Thanks for supporting! Code: ${status.code}`
            : "Unlock premium features with a supporter code"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status.isSupporter ? (
          <>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter supporter code"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                />
                <Button onClick={handleRedeem}>Redeem</Button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-green-600">Code redeemed successfully!</p>}
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Gift className="h-4 w-4" />
                Supporter Benefits
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 text-center dark:border-green-800 dark:bg-green-950/20">
              <Check className="mx-auto mb-2 h-8 w-8 text-green-600" />
              <p className="font-medium text-green-700 dark:text-green-400">
                You&apos;re a supporter!
              </p>
              <p className="text-sm text-green-600 dark:text-green-500">
                Thank you for your support ❤️
              </p>
            </div>
            
            <Button variant="outline" className="w-full" onClick={clearStatus}>
              <X className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        )}

        <div className="text-center">
          <a
            href="https://ko-fi.com/Y8Y81NVDEK"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <img
              src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
              alt="Support on Ko-fi"
              className="h-8 w-auto"
            />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
