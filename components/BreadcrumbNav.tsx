"use client";

import Link from "next/link";
import Script from "next/script";
import { ChevronRight } from "lucide-react";
import { createSafeJsonLd } from "@/lib/sanitize";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

const SITE_URL = "https://lenormand.dk";

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <>
      <Script
        id={`breadcrumb-schema-${items.length}`}
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: createSafeJsonLd(breadcrumbSchema) }}
        strategy="afterInteractive"
      />
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex items-center flex-wrap">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            
            return (
              <li key={item.url} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-muted-foreground/50">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
                {isLast ? (
                  <span className="font-medium text-foreground leading-5">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.url}
                    className="text-muted-foreground hover:text-primary transition-colors leading-5"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
