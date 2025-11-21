import { Shield, Lock, Eye, Database, Cookie } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
            Your privacy is sacred. We protect your data as carefully as we protect the cards.
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
                We collect minimal information necessary to provide our divination services:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2">
                 <li>Reading questions and card selections (stored locally in your browser)</li>
                 <li>Optional AI analysis requests (processed securely, not stored permanently)</li>
                 <li>Basic usage analytics to improve our service (with your consent)</li>
                 <li>Cookie preferences and consent choices</li>
               </ul>
              <p className="text-sm text-muted-foreground">
                <strong>Important:</strong> Your readings are private and stored only on your device unless you choose to share them.
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
                <li>To generate personalized Lenormand readings</li>
                <li>To provide AI-powered interpretations when requested</li>
                <li>To improve our services and user experience</li>
                <li>To ensure platform security and prevent abuse</li>
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
                Your privacy is protected through multiple layers:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li><strong>Local Storage:</strong> Readings are stored in your browser only</li>
                <li><strong>No Accounts Required:</strong> We don&apos;t collect personal identifiers</li>
                <li><strong>Secure AI Processing:</strong> AI requests are encrypted and not logged</li>
                <li><strong>No Data Selling:</strong> We never sell or share your data with third parties</li>
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
                 We use cookies and Google Analytics to understand how visitors use our website and improve our services:
               </p>
               <div className="space-y-3">
                 <div>
                   <h4 className="font-semibold text-foreground">Essential Cookies</h4>
                   <p className="text-sm text-muted-foreground">
                     Required for basic website functionality. Always enabled and cannot be disabled.
                   </p>
                 </div>
                 <div>
                   <h4 className="font-semibold text-foreground">Analytics Cookies (Google Analytics)</h4>
                   <p className="text-sm text-muted-foreground">
                     Collect anonymous information about how you use our site, such as pages visited and time spent.
                     Only enabled with your explicit consent.
                   </p>
                   <ul className="ml-4 mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                     <li>Pages visited and navigation patterns</li>
                     <li>Time spent on different sections</li>
                     <li>Device and browser information (anonymized)</li>
                     <li>Geographic location (country/region level only)</li>
                   </ul>
                 </div>
               </div>
               <p className="text-sm text-muted-foreground">
                 <strong>Cookie Consent:</strong> You can manage your cookie preferences at any time using the cookie settings banner or modal.
                 Analytics cookies are completely optional and the site functions fully without them.
               </p>
             </CardContent>
           </Card>

           <Card className="border-border bg-muted">
             <CardHeader>
                <CardTitle className="text-foreground">Your Rights</CardTitle>
             </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <ul className="ml-4 list-inside list-disc space-y-2">
                 <li>Access: View all data stored in your browser</li>
                 <li>Deletion: Clear your browser data to remove all readings</li>
                 <li>Portability: Export your readings at any time</li>
                 <li>Opt-out: Disable AI features or analytics tracking if preferred</li>
                 <li>Cookie Control: Manage cookie preferences and withdraw consent anytime</li>
               </ul>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted">
            <CardHeader>
               <CardTitle className="text-foreground">Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <p>
                If you have questions about this privacy policy or how we handle your data, please reach out. We&apos;re committed to protecting your privacy and ensuring transparency in our practices.
              </p>
              <p className="text-sm text-muted-foreground">
                This policy is effective as of November 2024 and may be updated to reflect changes in our practices or legal requirements.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}