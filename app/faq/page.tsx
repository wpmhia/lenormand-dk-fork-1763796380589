import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";

export const metadata: Metadata = {
  title: "Lenormand FAQ | Common Questions Answered",
  description:
    "Expert answers to the most common Lenormand card questions. Learn about readings, card meanings, spreads, and how to interpret the 36-card Lenormand deck.",
  keywords: [
    "Lenormand FAQ",
    "Lenormand questions",
    "Lenormand card reading questions",
    "how to read Lenormand cards",
    "Lenormand card meanings FAQ",
    "Lenormand spreads guide",
    "Lenormand for beginners FAQ",
  ],
  openGraph: {
    title: "Lenormand FAQ | Common Questions Answered",
    description:
      "Expert answers to the most common Lenormand card questions. Learn about readings, card meanings, spreads, and how to interpret the 36-card Lenormand deck.",
    type: "article",
  },
};

const faqData = [
  {
    question: "What is Lenormand?",
    answer:
      "Lenormand is a 36-card cartomancy system named after the famous French fortune teller Marie-Anne Lenormand, who lived in the 18th-19th century. Unlike tarot, Lenormand cards use straightforward symbolism and are read in combinations to tell stories. The deck features everyday objects like ships, houses, trees, and clover, making it accessible for beginners while offering depth for advanced practitioners.",
    category: "Basics",
  },
  {
    question: "How do Lenormand cards differ from tarot?",
    answer:
      "Lenormand and tarot differ in several key ways: (1) Symbolism: Lenormand uses concrete, everyday imagery while tarot uses archetypal symbolism from the Major and Minor Arcana. (2) Reading style: Lenormand focuses on card combinations and 'sentences' rather than individual card meanings. (3) Structure: Lenormand has exactly 36 cards, while tarot has 78. (4) History: Lenormand dates back to early 1800s France, while tarot origins trace to 15th-century Italy. (5) Approach: Lenormand is often described as more literal and story-focused, while tarot tends toward psychological and symbolic interpretation.",
    category: "Basics",
  },
  {
    question: "How many cards are in a Lenormand deck?",
    answer:
      "A traditional Lenormand deck has exactly 36 cards. Each card represents a specific symbol, from the Rider (card 1) to the Key (card 36). The small number of cards makes Lenormand more approachable than tarot, and the Grand Tableau spread uses all 36 cards for comprehensive readings.",
    category: "Basics",
  },
  {
    question: "What is the most popular Lenormand spread?",
    answer:
      "The 3-Card Sentence spread is the most popular for daily readings. It consists of three cards read as a sentence: the first card represents the situation or opening element, the second represents the action or turning point, and the third represents the outcome. For more complex questions, the 9-Card Petit Grand Tableau offers deeper insight, while the full 36-Card Grand Tableau provides the most comprehensive reading of a life situation.",
    category: "Spreads",
  },
  {
    question: "How do I shuffle Lenormand cards?",
    answer:
      "There are several shuffling methods for Lenormand: (1) Overhand shuffle: Hold the deck and pull small groups of cards from the bottom to the top repeatedly. (2) Rifle shuffle: Split the deck and slide halves together. (3) Grid shuffle: Spread all cards face-down in a grid and mix them with your hands. (4) Stacked shuffle: Use a combination of shuffling and stacking cards into ordered piles. Many practitioners prefer the grid shuffle as it allows you to 'feel' the cards and is said to help connect with the cards' energy.",
    category: "How To",
  },
  {
    question: "Can I read Lenormand cards for myself?",
    answer:
      "Yes, you can absolutely read Lenormand cards for yourself. Self-readings are a common practice and can provide valuable insights. However, some practitioners believe that emotional distance helps with interpretation, so for very personal or charged questions, you might consider: (1) Taking time to clear your mind before reading, (2) Writing down your interpretation and revisiting it later, (3) Using a significator card to represent yourself in the reading, or (4) Consulting another reader for important decisions.",
    category: "How To",
  },
  {
    question: "What do the Lenormand timing cards mean?",
    answer:
      "Lenormand cards can indicate timing through several methods: (1) Specific timing cards: Clover (1-2 days), Ship (weeks/months), Tree (long-term), Mountain (delayed), Clouds (uncertain), Sun (soon/clear). (2) Card position: Cards in the left columns suggest past influences, right columns indicate future outcomes. (3) Row interpretation: First row = near future, second row = present, third row = near future, fourth row = distant future. Remember, Lenormand timing is symbolic rather than literal.",
    category: "Card Meanings",
  },
  {
    question: "What is a significator in Lenormand?",
    answer:
      "A significator is a card that represents the querent (the person asking the question) in a reading. In Lenormand, the two significators are: (1) The Rider (28) - traditionally represents a young woman or female energy, (2) The Fox (29) - traditionally represents a young man or male energy. You can place the significator before shuffling to 'set your intention' or include it in the Grand Tableau.",
    category: "Basics",
  },
  {
    question: "How accurate is Lenormand?",
    answer:
      "Lenormand readings are as accurate as the skill, intuition, and question framing of the reader. The cards themselves are simply 36 symbols - their power comes from interpretation. Factors affecting accuracy include: (1) Clear, focused question formulation, (2) Reader's familiarity with card combinations, (3) Openness to multiple interpretations, (4) Practice and experience level.",
    category: "Basics",
  },
  {
    question: "What is the Grand Tableau?",
    answer:
      "The Grand Tableau is the most comprehensive Lenormand spread, using all 36 cards laid out in a 4x9 grid. It provides a complete snapshot of a life situation or question. Each position has specific meaning based on: (1) Row: Past/present/future influences, (2) Column: The person (left), situation (center), and outcome (right), (3) Distance from significator: Emotional and temporal distance, (4) Diagonals: Hidden influences and possibilities.",
    category: "Spreads",
  },
  {
    question: "How do I interpret Lenormand card combinations?",
    answer:
      "Lenormand combinations create meaning through proximity and interaction: (1) Adjacent cards modify each other - read left-to-right for time sequence. (2) Near/far placement affects strength - nearby cards have stronger influence. (3) Mirrors: Cards that 'see' each other across the spread create echoes of meaning. (4) Cliques: Groups of related cards reinforce a theme. (5) Sentence reading: Read connected cards as a grammatical structure.",
    category: "How To",
  },
  {
    question: "What does the Clover card mean?",
    answer:
      "The Clover (card 3) represents luck, opportunity, and small pleasures. In positive positions, it suggests good fortune is coming, an unexpected opportunity, or a favorable outcome. In challenging positions, it can indicate fleeting luck, taking chances, or things being 'too good to be true.' The Clover is one of the most positive cards but often carries the meaning of 'temporary'.",
    category: "Card Meanings",
  },
  {
    question: "How should I care for and store Lenormand cards?",
    answer:
      "Proper card care helps maintain their energy and longevity: (1) Storage: Keep cards in a clean pouch or box, preferably in a quiet, elevated place. (2) Handling: Handle cards with clean hands. (3) Cleansing: Regularly clear the deck's energy by holding it, using sound, or placing it on a selenite crystal overnight. (4) Respect: Treat cards as tools of divination, not regular playing cards.",
    category: "Basics",
  },
  {
    question: "Can Lenormand predict the future?",
    answer:
      "Lenormand, like all cartomancy systems, shows probable outcomes based on current energies and paths - not fixed futures. The cards reveal current influences, potential outcomes if circumstances remain unchanged, advice on achieving desired results, and hidden factors to consider. Free will always applies - you can change your path based on the reading's guidance.",
    category: "Basics",
  },
  {
    question: "What is Marie-Anne Lenormand's legacy?",
    answer:
      "Marie-Anne Lenormand (1772-1843) was a famous French fortune teller who read for Napoleon, Josephine, and many European aristocrats. Despite her fame, she likely didn't create the 36-card deck named after her - the deck was published shortly after her death by her publisher. Her legacy lives on through the Lenormand system itself.",
    category: "History",
  },
];

export default function FAQPage() {
  const categories = [...new Set(faqData.map((faq) => faq.category))];

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbNav
        items={[
          { name: "Home", url: "/" },
          { name: "Learn", url: "/learn" },
          { name: "FAQ", url: "/faq" },
        ]}
      />

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Lenormand FAQ</h1>
          <p className="text-xl text-muted-foreground">
            Expert answers to common questions about Lenormand card readings,
            meanings, and practice.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <Badge key={category} variant="secondary" className="text-sm">
              {category}
            </Badge>
          ))}
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {faqData.map((faq, index) => (
                <details key={index} className="group py-4">
                  <summary className="flex cursor-pointer items-center justify-between font-medium hover:text-primary">
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {faq.category}
                      </Badge>
                      {faq.question}
                    </span>
                    <span className="transition-transform group-open:rotate-180">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-3 text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Have more questions?{" "}
            <a href="/read/new" className="text-primary hover:underline">
              Try a reading
            </a>{" "}
            or{" "}
            <a href="/learn" className="text-primary hover:underline">
              explore our learning modules
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
