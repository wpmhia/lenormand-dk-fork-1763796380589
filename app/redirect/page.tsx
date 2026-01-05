import { Metadata } from "next";
import RedirectClient from "./redirect-client";

interface RedirectPageProps {
  searchParams: Promise<{
    to?: string;
    code?: string;
    permanent?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Redirecting...",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RedirectPage(props: RedirectPageProps) {
  return <RedirectClient {...props} />;
}
