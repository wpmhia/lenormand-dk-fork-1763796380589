"use client";

import Link from "next/link";
import { useMembership } from "@/components/MembershipProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Crown, ExternalLink } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export function SupporterSettings() {
  const { isMember } = useMembership();
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-600">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">Unlimited Membership</CardTitle>
          <CardDescription>Sign in to access unlimited AI interpretations</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Link href="/auth/sign-in">
            <Button>Sign in</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-600">
          <Crown className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-xl">Unlimited Membership</CardTitle>
        <CardDescription>
          {isMember ? "Your unlimited access is active" : "Upgrade for unlimited AI interpretations"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isMember ? (
          <div className="rounded-lg border border-amber-700/50 bg-amber-950/40 p-4 text-center">
            <Check className="mx-auto mb-2 h-8 w-8 text-amber-400" />
            <p className="font-medium text-amber-200">Unlimited Access Active</p>
            <p className="text-sm text-amber-400">Thank you for supporting Lenormand Intelligence</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Get unlimited AI interpretations and support the development of Lenormand Intelligence.
            </p>
            <Link href="/membership" className="block">
              <Button className="w-full gap-2 bg-amber-500 hover:bg-amber-600">
                <ExternalLink className="h-4 w-4" />
                View Membership Options
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
