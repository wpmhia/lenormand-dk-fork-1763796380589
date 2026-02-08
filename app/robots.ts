import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://lenormand.dk";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/.next/", "/env-check", "/redirect"],
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/env-check", "/redirect"],
      },
      {
        userAgent: "CCBot",
        allow: "/",
        disallow: ["/api/", "/env-check", "/redirect"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: ["/api/", "/env-check", "/redirect"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/.next/", "/env-check", "/redirect"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/.next/", "/env-check", "/redirect"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
