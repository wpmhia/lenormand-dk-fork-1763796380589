import { Shield, Lock, Eye, Database, Cookie } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
                  analysis, your reading is sent securely to our processing
                  service. This data is not stored permanently and is deleted
                  after the interpretation is generated.
                </li>
                <li>
                  <strong>Analytics:</strong> We collect anonymous usage
                  statistics (with your consent) to understand how users
                  interact with our platform and improve the experience.
                </li>
                <li>
                  <strong>Preferences:</strong> Your cookie consent choices and
                  theme preferences are saved locally on your device.
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
                <Cookie className="h-5 w-5 text-primary/80" />
                Cookies & Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <p>
                We use cookies and analytics to improve your experience while
                respecting your privacy:
              </p>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-foreground">
                    Essential Cookies
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    These are required for core website functionality:
                  </p>
                  <ul className="ml-4 mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    <li>
                      Session management (keeping you logged in if needed)
                    </li>
                    <li>Security and fraud prevention</li>
                    <li>
                      Site functionality (dark mode, language preferences)
                    </li>
                  </ul>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Essential cookies are always enabled and cannot be disabled,
                    as the site cannot function without them.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    Analytics Cookies
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    We use Google Analytics 4 (GA4) to understand visitor
                    behavior and improve our services. This is completely
                    optional.
                  </p>
                  <ul className="ml-4 mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Which pages are most visited</li>
                    <li>How long users spend on each section</li>
                    <li>Device type and operating system (anonymized)</li>
                    <li>
                      Geographic location (country/region, not specific
                      addresses)
                    </li>
                    <li>Traffic sources (how you found us)</li>
                  </ul>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Google Analytics data is collected through cookies and is
                    subject to Google&rsquo;s privacy policy. We have configured
                    GA4 with privacy controls including data retention deletion
                    and IP anonymization.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                <strong>Your Control:</strong> You can manage your cookie
                preferences at any time using the cookie settings banner at the
                bottom of the page. Declining analytics cookies does not affect
                site functionality—you can use all features freely.
              </p>
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
                  and disable analytics tracking without losing any core
                  functionality.
                </li>
                <li>
                  <strong>Cookie Management:</strong> Manage cookie preferences
                  at any time using the cookie consent banner or privacy
                  settings. You can withdraw analytics consent without affecting
                  site functionality.
                </li>
                <li>
                  <strong>Do Not Track:</strong> If your browser has &quot;Do
                  Not Track&quot; enabled, we respect this preference.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* eslint-disable-next-line tailwindcss/classnames-order */}
          <Card
            id="cookie-management"
            className="mt-4 scroll-mt-4 border-border bg-muted"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Cookie className="h-5 w-5 text-primary/80" />
                Cookie Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <p>
                We use cookies to enhance your browsing experience and analyze
                site traffic. You have full control over cookie preferences.
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  <strong>Essential Cookies:</strong> Required for basic site
                  functionality. These cannot be disabled as they are necessary
                  for the site to work properly.
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Help us understand how
                  visitors interact with our website. You can enable or disable
                  these at any time.
                </li>
                <li>
                  <strong>Managing Preferences:</strong> Click &quot;Cookie
                  Preferences&quot; in the footer to reset your consent choices.
                  This will show the consent banner again on your next visit.
                </li>
                <li>
                  <strong>Testing Mode:</strong> Add{" "}
                  <code>?test-cookies=true</code> or
                  <code>?show-cookies=true</code> to the URL to force the cookie
                  banner to display for testing purposes.
                </li>
                <li>
                  <strong>Browser Settings:</strong> You can also manage cookies
                  through your browser settings at any time.
                </li>
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                <strong>Note:</strong> Clearing your browser cache may also
                remove stored cookie preferences.
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
                November 2024. We may update it to reflect changes in our
                practices, technology, or legal requirements. We will notify you
                of any material changes by posting the updated policy here and
                updating the effective date. Your continued use of the site
                after changes constitutes acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
