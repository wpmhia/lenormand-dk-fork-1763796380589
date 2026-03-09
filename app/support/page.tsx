import { SupporterSettings } from "@/components/SupporterSettings";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";

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
        
        <SupporterSettings />
      </div>
    </div>
  );
}
