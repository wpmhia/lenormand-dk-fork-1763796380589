import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Coffee, Heart } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <BreadcrumbNav
            items={[
              { name: "Home", url: "/" },
              { name: "Support", url: "/support" },
            ]}
          />
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-600">
              <Coffee className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-xl">Support Lenormand Intelligence</CardTitle>
            <CardDescription>Help keep this project free for everyone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Lenormand Intelligence is completely free — no subscriptions, no limits, no catches.
              If you find value in it, consider buying me a coffee to help cover costs.
            </p>

            <div className="rounded-lg border border-amber-700/50 bg-amber-950/40 p-4 text-center">
              <Heart className="mx-auto mb-2 h-8 w-8 text-amber-400" />
              <p className="font-medium text-amber-200">Voluntary Support</p>
              <p className="text-sm text-amber-400">Every coffee helps keep the lights on</p>
            </div>

            <a
              href="https://ko-fi.com/lenormand"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full gap-2 bg-amber-500 hover:bg-amber-600">
                <Coffee className="h-4 w-4" />
                Buy Me a Coffee
              </Button>
            </a>

            <p className="text-xs text-muted-foreground text-center">
              You can also support by sharing Lenormand Intelligence with friends!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
