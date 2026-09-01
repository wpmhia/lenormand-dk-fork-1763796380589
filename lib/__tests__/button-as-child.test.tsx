import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

describe("Button asChild composition", () => {
  it("renders one native link without Slot child errors or disabled leakage", () => {
    const markup = renderToStaticMarkup(
      <Button asChild loading loadingText="Loading">
        <Link href="/read/new">Get your reading</Link>
      </Button>,
    );

    expect(markup).toContain("href=\"/read/new\"");
    expect(markup).toContain("Get your reading");
    expect(markup).not.toMatch(/\sdisabled(?:=|\s|>)/);
    expect(markup).not.toContain("Loading");
  });
});
