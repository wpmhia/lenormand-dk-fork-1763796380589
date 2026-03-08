import { Metadata } from "next";
import { Shield, Lock, Eye, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy | Lenormand Intelligence",
  description:
    "Learn how Lenormand Intelligence protects your privacy. We store readings only on your device, use encrypted connections, and never share your data with third parties.",
  openGraph: {
    title: "Privacy Policy | Lenormand Intelligence",
    description:
      "Your privacy is paramount. Read how we protect your data and keep your readings confidential.",
    type: "website",
  },
  alternates: {
    canonical: "/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <div className="page-layout mystical-bg">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 flex items-center justify-center gap-3 text-4xl font-bold text-foreground">
            <Shield className="h-8 w-8 text-primary" />
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            Your privacy and trust are paramount. We are transparent about how
            we collect, use, and protect your information.
          </p>
        </div>

        <div className="space-y-8">
          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Lock className="h-5 w-5 text-primary/80" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <p>
                We collect only the minimum information necessary to provide our
                services:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  <strong>Reading Data:</strong> Your questions and card
                  selections are stored exclusively on your device using your
                  browser&rsquo;s local storage. We never access or see this
                  data.
                </li>
                <li>
                  <strong>AI Interpretations:</strong> When you request AI
                  analysis, your reading is sent securely to our AI processing
                  service (Mistral). This data is not stored permanently and is
                  deleted after the interpretation is generated.
                </li>
                <li>
                  <strong>Analytics:</strong> We use Umami Analytics, a
                  privacy-friendly alternative that doesn't use cookies. Data
                  is anonymized and we don't track personal information.
                </li>
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                <strong>Key Principle:</strong> Your readings remain entirely
                private and are stored only on your device unless you choose to
                share them via URL. We cannot and do not access your reading
                history.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Eye className="h-5 w-5 text-primary/80" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  <strong>Generate Readings:</strong> To deliver accurate and
                  meaningful Lenormand interpretations tailored to your
                  questions.
                </li>
                <li>
                  <strong>AI Interpretations:</strong> To provide advanced,
                  contextual analysis of card combinations when you request it.
                </li>
                <li>
                  <strong>Service Improvement:</strong> To analyze usage
                  patterns and enhance our platform&rsquo;s features,
                  performance, and user experience.
                </li>
                <li>
                  <strong>Security:</strong> To maintain platform integrity,
                  prevent abuse, and protect our service and users.
                </li>
                <li>
                  <strong>Communication:</strong> To respond to inquiries and
                  provide support if needed.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Database className="h-5 w-5 text-primary/80" />
                Data Storage & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <p>
                Your data security is protected through multiple technical and
                organizational measures:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  <strong>Local-First Architecture:</strong> Your readings exist
                  on your device only. No reading data is transmitted to our
                  servers unless you explicitly request AI analysis.
                </li>
                <li>
                  <strong>No User Accounts:</strong> We don&rsquo;t require
                  accounts or collect personal identifiers like names, emails,
                  or ages. You can use our platform completely anonymously.
                </li>
                <li>
                  <strong>Encrypted Transmission:</strong> All communication
                  between your device and our servers uses HTTPS encryption (TLS
                  1.3).
                </li>
                <li>
                  <strong>Minimal Data Retention:</strong> AI analysis requests
                  are processed immediately and not stored in our database.
                  Temporary processing logs are automatically deleted.
                </li>
                <li>
                  <strong>No Third-Party Sharing:</strong> We never sell, trade,
                  or share your personal or reading data with advertisers,
                  marketers, or any third parties.
                </li>
                <li>
                  <strong>Transparent Infrastructure:</strong> We use
                  industry-standard cloud providers with SOC 2 compliance and
                  regular security audits.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Eye className="h-5 w-5 text-primary/80" />
                Privacy-Friendly Analytics
              </CardTitle>
            </CardHeader>
              <CardContent className="space-y-4 text-foreground">
              <p>
                We use privacy-friendly analytics:
              </p>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-foreground">
                    Umami Analytics
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    We use Umami, a GDPR-compliant analytics solution that:
                  </p>
                  <ul className="ml-4 mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Does NOT use cookies</li>
                    <li>Does NOT require consent</li>
                    <li>Does NOT track personal data</li>
                    <li>Does NOT collect IP addresses</li>
                    <li>Stores data anonymously</li>
                  </ul>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Umami provides only aggregate usage statistics and cannot be
                    used to identify individual visitors.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="text-foreground">Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  <strong>Access:</strong> You can view and inspect all data
                  stored on your device by using your browser&rsquo;s developer
                  tools to access Local Storage.
                </li>
                <li>
                  <strong>Deletion:</strong> Clear your browser&apos;s local
                  storage or use your browser&apos;s &quot;Clear browsing
                  data&quot; feature to remove all stored readings.
                </li>
                <li>
                  <strong>Portability:</strong> You can export readings by using
                  the sharing feature to create shareable URLs or by copying
                  data from your browser&apos;s storage.
                </li>
                <li>
                  <strong>Opt-out:</strong> You can decline AI analysis requests
                  without losing any core functionality.
                </li>
                <li>
                  <strong>Do Not Track:</strong> If your browser has &quot;Do
                  Not Track&quot; enabled, we respect this preference.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="text-foreground">GDPR Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <p>
                This website is GDPR compliant. Here&apos;s how we meet the
                requirements:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  <strong>Lawful Basis:</strong> Our legitimate interest in
                  providing the service and improving user experience through
                  anonymous analytics.
                </li>
                <li>
                  <strong>Data Minimization:</strong> We collect only what is
                  necessary - no personal data beyond what you explicitly share.
                </li>
                <li>
                  <strong>No Profiling:</strong> We do not create user profiles
                  or track individuals across websites.
                </li>
                <li>
                  <strong>No Cookies:</strong> We do not use cookies. Our
                  analytics (Umami) is cookie-free and does not require consent
                  under GDPR.
                </li>
                <li>
                  <strong>Data Processing:</strong> AI processing is done via
                  Mistral. Read data is not stored on our servers.
                </li>
                <li>
                  <strong>Right to be Forgotten:</strong> Since we store no
                  personal data, there is nothing to delete beyond what you
                  choose to remove from your device.
                </li>
                <li>
                  <strong>International Transfers:</strong> Our service providers
                  (Mistral, Umami) may process data outside the EU. We ensure
                  appropriate safeguards are in place.
                </li>
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                For any GDPR-related inquiries, contact us at support [at]
                lenormand-intelligence.com
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="text-foreground">Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <p>
                If you have questions about this privacy policy, how we handle
                your data, or if you have concerns about your privacy, please
                don&rsquo;t hesitate to contact us. We&rsquo;re committed to
                transparency and will respond to inquiries promptly.
              </p>
              <p className="text-sm text-muted-foreground">
                Email: support [at] lenormand-intelligence.com
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                <strong>Policy Updates:</strong> This policy is effective as of
                March 2026. We may update it to reflect changes in our
                practices, technology, or legal requirements.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
