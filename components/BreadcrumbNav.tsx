"use client";

import Link from "next/link";
import Script from "next/script";
import { ChevronRight } from "lucide-react";

interface Breadcrumb {
  name: string;
  url: string;
}

interface BreadcrumbNavProps {
  items: Breadcrumb[];
}

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  // JSON-LD BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://lenormand-intelligence.com${item.url}`,
    })),
  };

  return (
    <>
      <Script
        id={`breadcrumb-schema-${items.length}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        strategy="afterInteractive"
      />
      <nav
        className="flex items-center gap-2 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        {items.map((item, index) => (
          <div key={item.url} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {index === items.length - 1 ? (
              <span className="font-medium text-foreground">{item.name}</span>
            ) : (
              <Link
                href={item.url}
                className="transition-colors hover:text-primary"
              >
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </>
  );
}
