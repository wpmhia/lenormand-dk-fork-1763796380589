// Cards layout with static rendering for better performance
// Card pages are statically generated and cached at CDN level
// Revalidated hourly to balance freshness and performance

export const revalidate = 3600; // Cache for 1 hour at CDN level

export default function CardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
