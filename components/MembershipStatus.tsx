"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Check, Calendar, ExternalLink } from "lucide-react";
import { useMembership } from "@/components/MembershipProvider";

export function MembershipStatus() {
  const { isMember, tier, expiresAt, isLoading } = useMembership();

  if (isLoading) {
    return (
      <Card className="w-full max-w-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMember && tier === "unlimited") {
    const expiryDate = expiresAt ? new Date(expiresAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }) : null;

    return (
      <Card className="w-full max-w-xl border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-600">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Unlimited Member</CardTitle>
              <CardDescription>
                You have unlimited access to AI interpretations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-white p-4 dark:border-amber-800 dark:bg-amber-950/40">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Check className="h-5 w-5" />
              <span className="font-medium">Active Membership</span>
            </div>
            {expiryDate && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Renews on {expiryDate}</span>
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Your benefits:</p>
            <ul className="mt-2 space-y-1">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-500" />
                Unlimited AI interpretations
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-500" />
                All spread types including Grand Tableau
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-500" />
                Priority processing
              </li>
            </ul>
          </div>

          <a
            href="https://ko-fi.com/lenormand"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Manage subscription on Ko-Fi
            <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>
    );
  }

  // Free user view
  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Crown className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">Free Plan</CardTitle>
            <CardDescription>
              1 AI interpretation per day
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            Upgrade to unlimited AI interpretations and unlock all features.
          </p>
        </div>

        <a
          href="https://ko-fi.com/lenormand/tiers"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="w-full gap-2 bg-amber-500 hover:bg-amber-600">
            <Crown className="h-4 w-4" />
            Upgrade to Unlimited — €2,99/month
          </Button>
        </a>

        <div className="text-xs text-muted-foreground">
          <p>Membership includes:</p>
          <ul className="mt-1 space-y-0.5">
            <li className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              Unlimited AI interpretations
            </li>
            <li className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              All spread types
            </li>
            <li className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              Cancel anytime
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
