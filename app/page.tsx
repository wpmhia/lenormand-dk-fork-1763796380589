import { getReadingCount, formatReadingCount } from "@/lib/counter";
import { getCards } from "@/lib/data";
import { getAvailableAIProviderAssets } from "@/lib/brand-assets";
import { HomeClient } from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const count = await getReadingCount();
  const initialFormatted = formatReadingCount(count);
  const cards = getCards();
  const providerAssets = getAvailableAIProviderAssets();

  return (
    <HomeClient
      initialCount={count}
      initialFormatted={initialFormatted}
      cards={cards}
      providerAssets={providerAssets}
    />
  );
}
