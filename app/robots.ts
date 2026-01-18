import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://lenormand.dk";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/.next/", "/env-check"],
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/env-check"],
      },
      {
        userAgent: "CCBot",
        allow: "/",
        disallow: ["/api/", "/env-check"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: ["/api/", "/env-check"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/.next/", "/env-check"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/.next/", "/env-check"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
