import { AccountSettingsCards } from "@daveyplate/better-auth-ui";
import { MembershipStatus } from "@/components/MembershipStatus";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-4 py-12">
      <AccountSettingsCards className="w-full max-w-xl" />
      <MembershipStatus />
    </div>
  );
}
