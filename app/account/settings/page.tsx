import { AccountSettingsCards } from "@daveyplate/better-auth-ui";
import { VipCodeForm } from "@/components/VipCodeForm";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center py-12 px-4 gap-6">
      <AccountSettingsCards className="w-full max-w-xl" />
      <VipCodeForm />
    </div>
  );
}
