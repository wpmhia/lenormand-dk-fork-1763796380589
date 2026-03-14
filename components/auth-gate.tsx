"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, Sparkles, Crown } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

interface AuthGateProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AuthGate({ 
  children, 
  title = "AI Reading",
  description = "Sign in to get personalized AI insights for your cards"
}: AuthGateProps) {
  const { data: session } = useSession();

  if (session?.user) {
    return <>{children}</>;
  }

  return (
    <Card className="border-dashed border-2 bg-muted/30">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/auth/sign-in">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth/sign-up">
              Create Account
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Free accounts get 1 AI reading per day
        </p>
      </CardContent>
    </Card>
  );
}

interface DailyLimitGateProps {
  remaining: number;
  isVip: boolean;
  children: React.ReactNode;
}

export function DailyLimitGate({ remaining, isVip, children }: DailyLimitGateProps) {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <Crown className="mb-2 h-6 w-6 text-amber-500" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Sign in to access AI readings
          </p>
          <Button size="sm" variant="outline" className="mt-3" asChild>
            <Link href="/auth/sign-in">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isVip || remaining > 0) {
    return <>{children}</>;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
        <Crown className="mb-2 h-6 w-6 text-amber-500" />
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          Daily Limit Reached
        </p>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
          Come back tomorrow or unlock unlimited readings
        </p>
        <Button size="sm" className="mt-3 bg-amber-500 hover:bg-amber-600" asChild>
          <Link href="/account/settings">
            <Crown className="mr-2 h-3 w-3" />
            Unlock VIP
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
