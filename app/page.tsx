import { getReadingCount, formatReadingCount } from "@/lib/counter";
import { getCards } from "@/lib/data";
import { HomeClient } from "./HomeClient";

export const revalidate = 60;

export default async function Home() {
  const count = await getReadingCount();
  const initialFormatted = formatReadingCount(count);
  const cards = getCards();

  return <HomeClient initialCount={count} initialFormatted={initialFormatted} cards={cards} />;
}
