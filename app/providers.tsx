"use client";

import type { ReactNode } from "react";
import { InstallPromptProvider } from "@/hooks/useInstallPrompt";

export function Providers({ children }: { children: ReactNode }) {
  return <InstallPromptProvider>{children}</InstallPromptProvider>;
}
