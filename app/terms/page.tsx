import { Eye, Scale, AlertTriangle, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="page-layout mystical-bg">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 flex items-center justify-center gap-3 text-4xl font-bold text-foreground">
            <Scale className="h-8 w-8 text-primary" />
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground">
            Guidelines for using our mystical divination services responsibly
            and ethically.
          </p>
        </div>

        <div className="space-y-8">
          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Eye className="h-5 w-5 text-primary/80" />
                Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="card-content space-component text-foreground">
              <p>
                By using Lenormand Intelligence, you agree to these terms of
                service. These terms govern your use of our divination platform
                and the services we provide.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="h-5 w-5 text-primary/80" />
                Non-Commercial Use Only
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <p>
                Lenormand Intelligence is provided exclusively for
                non-commercial use. This means:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  You may not use this service for any commercial, business, or
                  profit-generating purposes
                </li>
                <li>
                  You may not resell, license, or monetize readings or content
                  from this service
                </li>
                <li>
                  You may not integrate this service into a commercial product
                  or service
                </li>
                <li>
                  Personal, educational, and spiritual use for yourself and
                  friends is permitted
                </li>
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                If you are interested in using Lenormand Intelligence for
                commercial purposes, please contact us to discuss licensing
                options.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Heart className="h-5 w-5 text-primary/80" />
                Service Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <p>Lenormand Intelligence provides:</p>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>Digital Lenormand card readings</li>
                <li>Traditional card interpretations</li>
                <li>Optional AI-powered analysis</li>
                <li>Educational resources about Lenormand divination</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="h-5 w-5 text-primary/80" />
                Important Disclaimers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <div className="space-y-4">
                <div>
                  <h2 className="mb-4 font-semibold text-foreground">
                    Entertainment Purpose
                  </h2>
                  <p>
                    Our services are for entertainment, spiritual guidance, and
                    personal reflection only. They should not be used as a
                    substitute for professional advice.
                  </p>
                </div>

                <div>
                  <h2 className="mb-4 font-semibold text-foreground">
                    No Professional Advice
                  </h2>
                  <p>
                    Readings are not medical, legal, financial, or psychological
                    advice. Always consult qualified professionals for important
                    decisions.
                  </p>
                </div>

                <div>
                  <h2 className="mb-4 font-semibold text-foreground">
                    Age Requirement
                  </h2>
                  <p>
                    You must be 18 years or older to use our services, or have
                    parental/guardian permission.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="text-foreground">
                User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>Use services responsibly and ethically</li>
                <li>Respect the spiritual nature of divination practices</li>
                <li>Do not use services for harmful or illegal purposes</li>
                <li>Provide accurate information when required</li>
                <li>Report any issues or concerns promptly</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="text-foreground">
                Intellectual Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <p>
                All content on Lenormand Intelligence, including card designs,
                interpretations, and educational materials, is protected by
                intellectual property laws. You may not reproduce, distribute,
                or create derivative works without permission.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="text-foreground">
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <p>
                Lenormand Intelligence is not liable for any decisions made
                based on readings, interpretations, or advice provided through
                our services. Users assume full responsibility for their choices
                and actions.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="text-foreground">
                Service Modifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <p>
                We reserve the right to modify, suspend, or discontinue services
                at any time. We will provide notice of significant changes when
                possible.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="text-foreground">
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <p>
                For questions about these terms of service or to report
                violations, please contact us. We&apos;re committed to
                maintaining a safe and respectful environment for all users.
              </p>
              <p className="text-sm text-muted-foreground">
                These terms are effective as of November 2024 and constitute the
                entire agreement between you and Lenormand Intelligence.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
