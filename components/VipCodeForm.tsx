"use client";

import { useState } from "react";
import { Crown, Check, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMembership } from "@/components/MembershipProvider";

export function VipCodeForm() {
  const { isMember, refreshMembership } = useMembership();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    setError("");
    setSuccess(false);
    if (!code.trim()) {
      setError("Please enter a code");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/vip/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setCode("");
        await refreshMembership();
      } else {
        setError(data.error || "Invalid code");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    "Unlimited AI readings every day",
    "Access to 9-card and 36-card spreads",
    "Priority AI processing",
  ];

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-600">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">VIP Code Redemption</CardTitle>
            <CardDescription>
              {isMember ? "Your unlimited access is active" : "Enter a VIP code for unlimited access"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isMember ? (
          <div className="rounded-lg border border-amber-700/50 bg-amber-950/40 p-4 text-center">
            <Check className="mx-auto mb-2 h-8 w-8 text-amber-400" />
            <p className="font-medium text-amber-200">Unlimited Access Active</p>
            <p className="text-sm text-amber-400">Thank you for supporting Lenormand Intelligence</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Input
                placeholder="Enter VIP code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                disabled={loading}
              />
              <Button onClick={handleRedeem} disabled={loading}>
                {loading ? "..." : "Redeem"}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-green-600">VIP access activated!</p>}

            <div className="rounded-lg bg-muted p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Gift className="h-4 w-4" />
                VIP Benefits
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

            <div className="text-center">
              <a href="https://ko-fi.com/Y8Y81NVDEK" target="_blank" rel="noopener noreferrer" className="inline-block">
                <img src="https://storage.ko-fi.com/cdn/kofi6.png?v=6" alt="Support on Ko-fi" className="h-8 w-auto" />
              </a>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
