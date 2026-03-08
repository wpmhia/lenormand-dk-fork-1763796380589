import { getReadingCount, formatReadingCount } from "@/lib/counter";
import { HomeClient } from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const count = await getReadingCount();
  const initialFormatted = formatReadingCount(count);

  return <HomeClient initialCount={count} initialFormatted={initialFormatted} />;
}
