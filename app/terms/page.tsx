import { Eye, Scale, AlertTriangle, Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TermsPage() {
  return (
    <div className="page-layout mystical-bg">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground flex items-center justify-center gap-3">
            <Scale className="w-8 h-8 text-primary" />
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-lg">
            Guidelines for using our mystical divination services responsibly and ethically.
          </p>
        </div>

        <div className="space-y-8">
          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary/80" />
                Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="card-content text-foreground space-component">
              <p>
                By using Lenormand Intelligence, you agree to these terms of service. These terms govern your use of our divination platform and the services we provide.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary/80" />
                Service Description
              </CardTitle>
            </CardHeader>
            <CardContent className="text-foreground space-y-4">
              <p>
                Lenormand Intelligence provides:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Digital Lenormand card readings</li>
                <li>Traditional card interpretations</li>
                <li>Optional AI-powered analysis</li>
                <li>Educational resources about Lenormand divination</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary/80" />
                Important Disclaimers
              </CardTitle>
            </CardHeader>
            <CardContent className="text-foreground space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Entertainment Purpose</h4>
                  <p>Our services are for entertainment, spiritual guidance, and personal reflection only. They should not be used as a substitute for professional advice.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">No Professional Advice</h4>
                  <p>Readings are not medical, legal, financial, or psychological advice. Always consult qualified professionals for important decisions.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Age Requirement</h4>
                  <p>You must be 18 years or older to use our services, or have parental/guardian permission.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="text-foreground">User Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="text-foreground space-y-4">
              <ul className="list-disc list-inside space-y-2 ml-4">
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
              <CardTitle className="text-foreground">Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="text-foreground space-y-4">
              <p>
                All content on Lenormand Intelligence, including card designs, interpretations, and educational materials, is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without permission.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="text-foreground">Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="text-foreground space-y-4">
              <p>
                Lenormand Intelligence is not liable for any decisions made based on readings, interpretations, or advice provided through our services. Users assume full responsibility for their choices and actions.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="text-foreground">Service Modifications</CardTitle>
            </CardHeader>
            <CardContent className="text-foreground space-y-4">
              <p>
                We reserve the right to modify, suspend, or discontinue services at any time. We will provide notice of significant changes when possible.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
              <CardTitle className="text-foreground">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="text-foreground space-y-4">
              <p>
                For questions about these terms of service or to report violations, please contact us. We&apos;re committed to maintaining a safe and respectful environment for all users.
              </p>
              <p className="text-muted-foreground text-sm">
                These terms are effective as of November 2024 and constitute the entire agreement between you and Lenormand Intelligence.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}