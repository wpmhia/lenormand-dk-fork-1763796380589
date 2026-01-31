import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModulePageClient } from "@/components/ModulePageClient";
import {
  Clock,
  Spade,
  Heart,
  Diamond,
  Club,
  MapPin,
  Globe,
  Lightbulb,
  Calendar,
} from "lucide-react";

export const metadata = {
  title: "Advanced Concepts | Lenormand Course",
  description:
    "Time associations, playing card connections, cultural interpretations, and esoteric Lenormand techniques.",
};

const timeAssociations = [
  {
    card: "The Rider",
    time: "Days to 1 week",
    description: "Quick movement, immediate action",
  },
  {
    card: "The Clover",
    time: "Days to 1 week",
    description: "Short-term luck and opportunities",
  },
  {
    card: "The Ship",
    time: "2-4 weeks",
    description: "Journeys and travel, moderate time",
  },
  {
    card: "The House",
    time: "1-3 months",
    description: "Long-term stability and building",
  },
  {
    card: "The Tree",
    time: "6 months to years",
    description: "Growth, health, long-term development",
  },
  {
    card: "The Clouds",
    time: "Uncertain timing",
    description: "Confusion delays progress",
  },
  {
    card: "The Mountain",
    time: "3-6 months",
    description: "Obstacles cause delays",
  },
  {
    card: "The Stork",
    time: "2-4 weeks",
    description: "Change and transition period",
  },
  {
    card: "The Sun",
    time: "Soon, positive timing",
    description: "Success comes quickly",
  },
  {
    card: "The Moon",
    time: "1-2 months",
    description: "Emotional cycles, creative timing",
  },
];

const playingCardAssociations = [
  {
    suit: "Hearts",
    icon: Heart,
    color: "text-primary",
    bgColor: "bg-muted",
    meaning: "Emotions, relationships, intuition, water energy",
    cards: [
      "Rider (9♥)",
      "Ship (7♥)",
      "House (6♥)",
      "Tree (4♥)",
      "Clouds (Queen♥)",
      "Snake (8♥)",
      "Coffin (9♥)",
      "Bouquet (10♥)",
      "Scythe (6♥)",
      "Birds (7♥)",
      "Child (Jack♥)",
      "Fox (8♥)",
    ],
  },
  {
    suit: "Clubs",
    icon: Club,
    color: "text-primary",
    bgColor: "bg-muted",
    meaning: "Material world, home, family, earth energy",
    cards: [
      "Rider (9♣)",
      "Clover (7♣)",
      "Ship (8♣)",
      "House (King♣)",
      "Tree (10♣)",
      "Clouds (King♣)",
      "Snake (Queen♣)",
      "Coffin (8♣)",
      "Bouquet (Queen♣)",
      "Scythe (Jack♣)",
      "Whip (10♣)",
      "Birds (9♣)",
    ],
  },
  {
    suit: "Diamonds",
    icon: Diamond,
    color: "text-primary",
    bgColor: "bg-muted",
    meaning: "Communication, creativity, action, air energy",
    cards: [
      "Rider (Jack♦)",
      "Clover (8♦)",
      "Ship (6♦)",
      "House (9♦)",
      "Tree (Ace♦)",
      "Clouds (7♦)",
      "Snake (Ace♦)",
      "Coffin (7♦)",
      "Bouquet (9♦)",
      "Scythe (8♦)",
      "Whip (King♦)",
      "Birds (10♦)",
    ],
  },
  {
    suit: "Spades",
    icon: Spade,
    color: "text-primary",
    bgColor: "bg-muted",
    meaning: "Thoughts, planning, challenges, fire energy",
    cards: [
      "Rider (8♠)",
      "Clover (6♠)",
      "Ship (9♠)",
      "House (7♠)",
      "Tree (Queen♠)",
      "Clouds (Jack♠)",
      "Snake (10♠)",
      "Coffin (6♠)",
      "Bouquet (8♠)",
      "Scythe (9♠)",
      "Whip (7♠)",
      "Birds (Queen♠)",
    ],
  },
];

const culturalInterpretations = [
  {
    culture: "French Tradition",
    description:
      "Elegant and sophisticated, focuses on courtly imagery and aristocratic symbolism",
    characteristics: ["Poetic interpretations", "Emphasis on social status", "Refined symbolism"],
  },
  {
    culture: "German Tradition",
    description:
      "Practical and straightforward, emphasizes everyday symbolism and concrete meanings",
    characteristics: ["Direct meanings", "Focus on daily life", "Systematic approaches"],
  },
  {
    culture: "Contemporary",
    description:
      "Blends traditional wisdom with modern interpretations and diverse cultural perspectives",
    characteristics: ["Inclusive symbolism", "Personal intuition", "Cultural adaptation"],
  },
  {
    culture: "Hoodoo/ATR",
    description:
      "Strong playing card associations, focuses on practical magic and spiritual work",
    characteristics: ["Playing card focus", "Practical application", "Spiritual work"],
  },
];

export default function AdvancedPage() {
  return (
    <ModulePageClient
      moduleId="advanced"
      moduleNumber={6}
      totalModules={8}
      title="Advanced Concepts"
      description="Time associations, playing card connections, cultural interpretations, and esoteric Lenormand techniques."
      duration="40 minutes"
      difficulty="Advanced"
      icon={<Lightbulb className="h-8 w-8 text-white" />}
      prevModule={{ id: "grand-tableau-techniques", title: "Grand Tableau Techniques" }}
      nextModule={{ id: "marie-annes-system", title: "Marie-Anne's System" }}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Learn", url: "/learn" },
        { name: "Advanced Concepts", url: "/learn/advanced" },
      ]}
    >
      {/* Time Associations */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle
            id="time-associations"
            className="flex items-center text-2xl text-foreground"
          >
            <Clock className="mr-3 h-6 w-6 text-primary" />
            Time Associations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 leading-relaxed text-muted-foreground">
            Many Lenormand cards have traditional associations with timing.
            While not every reading requires precise time predictions, these
            associations can provide valuable context about when events may
            occur.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {timeAssociations.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-muted p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">
                    {item.card}
                  </h4>
                  <Badge className="bg-muted text-muted-foreground">
                    {item.time}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-border bg-muted p-4">
            <h2 className="mb-4 font-semibold text-foreground">
              Important Notes:
            </h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                • Time associations are traditional guidelines, not absolute
                predictions
              </li>
              <li>• Context from surrounding cards can modify timing</li>
              <li>
                • Some cards (like Clouds) indicate uncertain or delayed
                timing
              </li>
              <li>• Use intuition alongside traditional associations</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Playing Card Associations */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle
            id="playing-card-associations"
            className="flex items-center text-2xl text-foreground"
          >
            <Spade className="mr-3 h-6 w-6 text-primary" />
            Playing Card Associations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 leading-relaxed text-muted-foreground">
            Lenormand cards have traditional associations with playing cards
            (suits and numbers). These connections can add deeper layers of
            meaning and are particularly important in Hoodoo and other African
            Traditional Religions.
          </p>

          <div className="grid gap-6">
            {playingCardAssociations.map((suit, index) => (
              <div
                key={index}
                className={`rounded-lg border p-6 ${suit.bgColor}`}
              >
                <div className="mb-4 flex items-center space-x-3">
                  <suit.icon className={`h-8 w-8 ${suit.color}`} />
                  <div>
                    <h3
                      className={`text-xl font-semibold ${suit.color.replace("-600", "-900")} dark:text-foreground`}
                    >
                      {suit.suit}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {suit.meaning}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-primary dark:text-primary/80">
                  <p className="mb-2">
                    <strong>Associated Lenormand cards:</strong>
                  </p>
                  <p className="leading-relaxed">
                    {suit.cards.slice(0, 12).join(", ")}...
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-border bg-muted p-4">
            <h2 className="mb-4 font-semibold text-foreground">
              How to Use Playing Cards:
            </h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Add playing card associations for additional context</li>
              <li>• Particularly useful in Hoodoo and ATR practices</li>
              <li>• Can provide numerological insights</li>
              <li>• Helps with more precise timing and energy readings</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Cultural Interpretations */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle
            id="cultural-interpretations"
            className="flex items-center text-2xl text-foreground"
          >
            <Globe className="mr-3 h-6 w-6 text-primary" />
            Cultural Interpretations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 leading-relaxed text-card-foreground">
            Lenormand has evolved differently across cultures. Understanding
            these various schools of thought can enrich your readings and help
            you choose the approach that resonates most with your practice.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {culturalInterpretations.map((culture, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-muted p-6"
              >
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  {culture.culture}
                </h3>
                <p className="mb-4 text-sm text-card-foreground">
                  {culture.description}
                </p>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-foreground">
                    Characteristics:
                  </h4>
                  <ul className="space-y-1">
                    {culture.characteristics.map((char, charIndex) => (
                      <li
                        key={charIndex}
                        className="flex items-center text-sm text-muted-foreground"
                      >
                        <span className="mr-2 text-primary">•</span>
                        {char}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Five Essential Strips */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle
            id="five-essential-strips"
            className="flex items-center text-2xl text-foreground"
          >
            <MapPin className="mr-3 h-6 w-6 text-primary" />
            Mastering the Five Essential Strips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="leading-relaxed text-card-foreground">
            Marie-Anne Lenormand read the Grand Tableau in a precise five-step
            sequence. Each strip answers a different layer of the question.
            Later strips refine earlier ones—they never contradict.
          </p>

          <div className="space-y-4">
            <div className="rounded-lg border-l-4 border-primary bg-muted p-4">
              <h4 className="mb-2 font-semibold text-foreground">
                Strip A: The Row (Story of the Moment)
              </h4>
              <p className="mb-3 text-sm text-card-foreground">
                Read all nine cards in the significator&apos;s row from left →
                right. This is the narrative sentence that answers your
                question directly.
              </p>
            </div>

            <div className="rounded-lg border-l-4 border-primary bg-muted p-4">
              <h4 className="mb-2 font-semibold text-foreground">
                Strip B: The Column (What Weighs on the Mind)
              </h4>
              <p className="mb-3 text-sm text-card-foreground">
                Read the four cards vertically above → below the significator.
                This reveals conscious and unconscious motivations.
              </p>
            </div>

            <div className="rounded-lg border-l-4 border-primary bg-muted p-4">
              <h4 className="mb-2 font-semibold text-foreground">
                Strip C: The Cross (Immediate Pivot)
              </h4>
              <p className="mb-3 text-sm text-card-foreground">
                The four cards directly adjacent to the significator. Distill
                these into a four-word telegram.
              </p>
            </div>

            <div className="rounded-lg border-l-4 border-primary bg-muted p-4">
              <h4 className="mb-2 font-semibold text-foreground">
                Strip D: Corners of the Frame (Fate&apos;s Headline)
              </h4>
              <p className="mb-3 text-sm text-card-foreground">
                Cards at positions 1, 9, 28, and 36. Read clockwise from
                top-left for the overall complexion.
              </p>
            </div>

            <div className="rounded-lg border-l-4 border-primary bg-muted p-4">
              <h4 className="mb-2 font-semibold text-foreground">
                Strip E: Knights (Optional—Unseen Influences)
              </h4>
              <p className="mb-3 text-sm text-card-foreground">
                Leap over one card in each of eight chess knight directions from
                the significator. These reveal hidden helpers or obstacles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practice Tips */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <Lightbulb className="mr-3 h-6 w-6 text-primary" />
            Advanced Practice Techniques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                num: 1,
                title: "Study Card Combinations",
                description:
                  "Learn how cards modify each other when they appear together. Some combinations create entirely new meanings.",
              },
              {
                num: 2,
                title: "Practice Grand Tableau",
                description:
                  "Master the 36-card Grand Tableau for comprehensive readings. Start with simple questions and work up to complex ones.",
              },
              {
                num: 3,
                title: "Explore Cultural Contexts",
                description:
                  "Study different cultural approaches to Lenormand. Incorporate elements that resonate with your background and practice.",
              },
              {
                num: 4,
                title: "Develop Your Style",
                description:
                  "As you gain experience, develop your own associations and techniques. Lenormand is a living tradition that evolves with its practitioners.",
              },
            ].map((tip) => (
              <div key={tip.num} className="flex items-start space-x-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <span className="text-sm font-bold text-white">
                    {tip.num}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{tip.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tip.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ModulePageClient>
  );
}
