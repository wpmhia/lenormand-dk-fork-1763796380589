"use client";

import Link from "next/link";
import { useSupporter } from "@/components/SupporterProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Crown, ExternalLink } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export function SupporterSettings() {
  const { isSupporter } = useSupporter();
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-600">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">VIP Supporter Access</CardTitle>
          <CardDescription>Sign in to redeem a VIP code and unlock premium features</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Link href="/auth/sign-in">
            <Button>Sign in</Button>
          </Link>
          <div>
            <a href="https://ko-fi.com/Y8Y81NVDEK" target="_blank" rel="noopener noreferrer" className="inline-block">
              <img src="https://storage.ko-fi.com/cdn/kofi6.png?v=6" alt="Support on Ko-fi" className="h-8 w-auto" />
            </a>
          </div>
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
        <CardTitle className="text-xl">VIP Supporter Access</CardTitle>
        <CardDescription>
          {isSupporter ? "Your VIP access is active" : "Redeem your VIP code in account settings"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSupporter ? (
          <div className="rounded-lg border border-amber-700/50 bg-amber-950/40 p-4 text-center">
            <Check className="mx-auto mb-2 h-8 w-8 text-amber-400" />
            <p className="font-medium text-amber-200">VIP Access Active</p>
            <p className="text-sm text-amber-400">Thank you for supporting Lenormand Intelligence</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Enter your VIP code in your account settings to unlock unlimited AI readings and premium spreads.
            </p>
            <Link href="/account/settings" className="block">
              <Button className="w-full gap-2">
                <ExternalLink className="h-4 w-4" />
                Go to Account Settings
              </Button>
            </Link>
          </div>
        )}

        <div className="text-center pt-2">
          <a href="https://ko-fi.com/Y8Y81NVDEK" target="_blank" rel="noopener noreferrer" className="inline-block">
            <img src="https://storage.ko-fi.com/cdn/kofi6.png?v=6" alt="Support on Ko-fi" className="h-8 w-auto" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
