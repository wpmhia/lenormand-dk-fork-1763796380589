"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { LearningProgressTracker } from "@/components/LearningProgressTracker";
import { BackToTop } from "@/components/BackToTop";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Search,
  Filter,
  Grid3X3,
  List,
} from "lucide-react";
import { useState } from "react";

const cardMeanings = [
  {
    number: 1,
    name: "The Rider",
    keywords: ["News", "Messages", "Communication", "Speed"],
    timing: "Within days",
    location: "On the move, via message",
    associations: ["Letters", "Visitors", "Quick changes", "News from afar"],
  },
  {
    number: 2,
    name: "The Clover",
    keywords: ["Luck", "Opportunity", "Happiness", "Risk"],
    timing: "Within a week",
    location: "Brief moment, small luck",
    associations: [
      "Good fortune",
      "Short-term luck",
      "Gambling",
      "Taking chances",
    ],
  },
  {
    number: 3,
    name: "The Ship",
    keywords: ["Travel", "Journey", "Distance", "Progress"],
    timing: "Within 1-2 weeks",
    location: "Distance, travel, abroad",
    associations: [
      "Long journeys",
      "Moving away",
      "Business trips",
      "Progress over time",
    ],
  },
  {
    number: 4,
    name: "The House",
    keywords: ["Home", "Family", "Security", "Foundation"],
    timing: "Lasting, stable",
    location: "At home, family gathering",
    associations: [
      "Family matters",
      "Property",
      "Stability",
      "Long-term planning",
    ],
  },
  {
    number: 5,
    name: "The Tree",
    keywords: ["Health", "Growth", "Nature", "Longevity"],
    timing: "Slow, long-term growth",
    location: "Over months, roots deepen",
    associations: [
      "Physical health",
      "Healing",
      "Personal growth",
      "Family tree",
    ],
  },
  {
    number: 6,
    name: "The Clouds",
    keywords: ["Confusion", "Uncertainty", "Secrets", "Thoughts"],
    timing: "Unclear timing",
    location: "Uncertain, pending clarity",
    associations: ["Mental fog", "Hidden information", "Doubts", "Indecision"],
  },
  {
    number: 7,
    name: "The Snake",
    keywords: ["Deception", "Wisdom", "Healing", "Transformation"],
    timing: "Deceptive delay",
    location: "Through complication, indirect path",
    associations: [
      "Betrayal",
      "Hidden enemies",
      "Medical issues",
      "Personal growth",
    ],
  },
  {
    number: 8,
    name: "The Coffin",
    keywords: ["Endings", "Transformation", "Grief", "Release"],
    timing: "Ending, finalizing",
    location: "Closure, conclusion imminent",
    associations: [
      "Death of situation",
      "Major change",
      "Letting go",
      "New beginnings",
    ],
  },
  {
    number: 9,
    name: "The Bouquet",
    keywords: ["Gifts", "Celebration", "Beauty", "Gratitude"],
    timing: "Soon, joyful",
    location: "Social gathering, celebration",
    associations: ["Presents", "Romance", "Social events", "Appreciation"],
  },
  {
    number: 10,
    name: "The Scythe",
    keywords: ["Cutting", "Decisions", "Sudden change", "Surgery"],
    timing: "Sudden, immediate",
    location: "Sharp, unexpected moment",
    associations: [
      "Breaking free",
      "Harvesting",
      "Sudden events",
      "Making choices",
    ],
  },
  {
    number: 11,
    name: "The Whip",
    keywords: ["Conflict", "Arguments", "Discipline", "Repetition"],
    timing: "Repetitive cycle",
    location: "Argument, tension, conflict zone",
    associations: [
      "Quarrels",
      "Physical punishment",
      "Mental abuse",
      "Endless cycles",
    ],
  },
  {
    number: 12,
    name: "The Birds",
    keywords: ["Communication", "Conversation", "Worry", "Thoughts"],
    timing: "Quick conversation",
    location: "Dialogue, phone call, group chat",
    associations: ["Phone calls", "Gossip", "Anxiety", "Mental chatter"],
  },
  {
    number: 13,
    name: "The Child",
    keywords: ["New beginnings", "Innocence", "Youth", "Potential"],
    timing: "Small beginnings",
    location: "Fresh start, new situation",
    associations: ["Children", "New projects", "Fresh starts", "Naivety"],
  },
  {
    number: 14,
    name: "The Fox",
    keywords: ["Cunning", "Deception", "Intelligence", "Caution"],
    timing: "Strategic delay",
    location: "Workplace, through self-interest",
    associations: [
      "Trickery",
      "Business dealings",
      "Street smarts",
      "Being careful",
    ],
  },
  {
    number: 15,
    name: "The Bear",
    keywords: ["Strength", "Protection", "Authority", "Wealth"],
    timing: "Powerful, controlling",
    location: "Authority figure, leadership role",
    associations: [
      "Power",
      "Leadership",
      "Financial security",
      "Mother figure",
    ],
  },
  {
    number: 16,
    name: "The Stars",
    keywords: ["Hope", "Inspiration", "Spirituality", "Guidance"],
    timing: "Night-time, evening",
    location: "Internet, digital realm, guidance",
    associations: [
      "Dreams",
      "Intuition",
      "Divine guidance",
      "Wishes coming true",
    ],
  },
  {
    number: 17,
    name: "The Stork",
    keywords: ["Change", "Movement", "New life", "Progress"],
    timing: "Change coming",
    location: "Relocation, transition period",
    associations: [
      "Pregnancy",
      "Moving house",
      "Life transitions",
      "Positive change",
    ],
  },
  {
    number: 18,
    name: "The Dog",
    keywords: ["Loyalty", "Friendship", "Trust", "Protection"],
    timing: "Loyal, steadfast",
    location: "Close relationship, reliable friend",
    associations: [
      "True friends",
      "Faithful companion",
      "Dependability",
      "Guardianship",
    ],
  },
  {
    number: 19,
    name: "The Tower",
    keywords: ["Authority", "Government", "Isolation", "Structure"],
    timing: "Institutional pace",
    location: "Government, company, authority",
    associations: [
      "Official matters",
      "Institutions",
      "Solitude",
      "Rigid systems",
    ],
  },
  {
    number: 20,
    name: "The Garden",
    keywords: ["Public life", "Community", "Gatherings", "Growth"],
    timing: "Public, social",
    location: "Social media, public event, gathering",
    associations: [
      "Social events",
      "Public recognition",
      "Networking",
      "Community involvement",
    ],
  },
  {
    number: 21,
    name: "The Mountain",
    keywords: ["Obstacles", "Challenges", "Patience", "Perspective"],
    timing: "Slow, delayed",
    location: "Obstacle blocking path",
    associations: [
      "Difficulties",
      "Delays",
      "High goals",
      "Overcoming barriers",
    ],
  },
  {
    number: 22,
    name: "The Crossroads",
    keywords: ["Choices", "Decisions", "Direction", "Opportunity"],
    timing: "Decision point",
    location: "Choice moment, fork in path",
    associations: [
      "Multiple paths",
      "Life choices",
      "Crossroads in life",
      "New directions",
    ],
  },
  {
    number: 23,
    name: "The Mice",
    keywords: ["Loss", "Theft", "Stress", "Small problems"],
    timing: "Gradual erosion",
    location: "Stress accumulating, small losses",
    associations: [
      "Financial loss",
      "Worries",
      "Pests",
      "Gradual deterioration",
    ],
  },
  {
    number: 24,
    name: "The Heart",
    keywords: ["Love", "Emotions", "Relationships", "Passion"],
    timing: "Emotional reality",
    location: "Intimate space, close to heart",
    associations: [
      "Romantic love",
      "Emotional matters",
      "Deep feelings",
      "Heart chakra",
    ],
  },
  {
    number: 25,
    name: "The Ring",
    keywords: ["Commitment", "Contracts", "Cycles", "Partnership"],
    timing: "Cyclical, contracted",
    location: "Commitment ceremony, bound agreement",
    associations: [
      "Marriage",
      "Agreements",
      "Endless cycles",
      "Binding agreements",
    ],
  },
  {
    number: 26,
    name: "The Book",
    keywords: ["Knowledge", "Secrets", "Learning", "Mystery"],
    timing: "Hidden, secret",
    location: "Confidential, documents, education",
    associations: [
      "Education",
      "Hidden information",
      "Research",
      "Confidential matters",
    ],
  },
  {
    number: 27,
    name: "The Letter",
    keywords: ["Communication", "Documents", "News", "Information"],
    timing: "Written, formal",
    location: "Inbox, email, official correspondence",
    associations: [
      "Important mail",
      "Legal documents",
      "Messages",
      "Correspondence",
    ],
  },
  {
    number: 28,
    name: "The Man",
    keywords: ["First person", "Primary position", "Querent", "Central focus"],
    timing: "Present moment",
    location: "The first person in the reading (primary perspective)",
    associations: [
      "The questioner",
      "Primary subject",
      "First person's perspective",
      "Primary key person",
    ],
  },
  {
    number: 29,
    name: "The Woman",
    keywords: [
      "Second person",
      "Secondary position",
      "Other figure",
      "Related person",
    ],
    timing: "Present moment",
    location: "The second person in the reading (secondary perspective)",
    associations: [
      "Secondary subject",
      "Other person",
      "Second person's perspective",
      "Related key person",
    ],
  },
  {
    number: 30,
    name: "The Lilies",
    keywords: ["Peace", "Harmony", "Purity", "Spirituality"],
    timing: "Peaceful, elder",
    location: "Home comfort, winter season",
    associations: [
      "Calm",
      "Sexual matters",
      "Peace of mind",
      "Spiritual growth",
    ],
  },
  {
    number: 31,
    name: "The Sun",
    keywords: ["Success", "Happiness", "Clarity", "Vitality"],
    timing: "Daytime, success",
    location: "Bright, visible, public domain",
    associations: ["Achievement", "Joy", "Good health", "Positive outcomes"],
  },
  {
    number: 32,
    name: "The Moon",
    keywords: ["Emotions", "Intuition", "Imagination", "Cycles"],
    timing: "Evening, cycles",
    location: "Night, emotions, recognition",
    associations: ["Feelings", "Psychic abilities", "Creativity", "Night time"],
  },
  {
    number: 33,
    name: "The Key",
    keywords: ["Solutions", "Answers", "Unlocking", "Success"],
    timing: "Immediate solution",
    location: "Unlock, answer appears",
    associations: [
      "Finding answers",
      "Opening doors",
      "Resolutions",
      "Master key",
    ],
  },
  {
    number: 34,
    name: "The Fish",
    keywords: ["Abundance", "Wealth", "Emotions", "Fertility"],
    timing: "Flowing, business",
    location: "Money flow, business transaction",
    associations: [
      "Money",
      "Business success",
      "Emotional depth",
      "Multiplication",
    ],
  },
  {
    number: 35,
    name: "The Anchor",
    keywords: ["Stability", "Security", "Patience", "Grounding"],
    timing: "Long-term stability",
    location: "Secure port, lasting foundation",
    associations: [
      "Reliability",
      "Safe harbor",
      "Long-term commitment",
      "Being stuck",
    ],
  },
  {
    number: 36,
    name: "The Cross",
    keywords: ["Burden", "Sacrifice", "Faith", "Destiny"],
    timing: "Burden, destiny",
    location: "Weight upon you, fate's moment",
    associations: [
      "Heavy responsibilities",
      "Religious matters",
      "Life lessons",
      "Karma",
    ],
  },
];

export default function CardMeaningsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredCards = cardMeanings.filter(
    (card) =>
      card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.keywords.some((keyword) =>
        keyword.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <BreadcrumbNav
            items={[
              { name: "Home", url: "/" },
              { name: "Learn", url: "/learn" },
              {
                name: "Card Meanings & Associations",
                url: "/learn/card-meanings",
              },
            ]}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-border bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/learn">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Badge className="border-border bg-muted text-muted-foreground dark:border-border dark:bg-muted/50 dark:text-muted-foreground">
                Module 4 of 7
              </Badge>
              <Badge className="border-border bg-muted text-muted-foreground dark:border-border dark:bg-muted/50 dark:text-muted-foreground">
                Intermediate
              </Badge>
            </div>
            <Link href="/learn/card-combinations">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
              >
                Next Module
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Module Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Card Meanings & Associations
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Master the traditional meanings and symbolic associations of all 36
            Lenormand cards.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-primary">
            <div className="flex items-center">
              <BookOpen className="mr-1 h-4 w-4" />
              45 minutes
            </div>
            <div className="flex items-center">
              <Filter className="mr-1 h-4 w-4" />
              Intermediate Level
            </div>
          </div>
        </div>

        {/* Search and View Controls */}
        <Card className="mb-8 border-border bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search cards by name or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="flex items-center space-x-2"
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span>Grid</span>
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="flex items-center space-x-2"
                >
                  <List className="h-4 w-4" />
                  <span>List</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards Display */}
        {viewMode === "grid" ? (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCards.map((card) => (
              <Card
                key={card.number}
                className="cursor-pointer border border-border bg-card"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-muted text-xs text-muted-foreground">
                      #{card.number}
                    </Badge>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                      <span className="text-xs font-bold text-white">
                        {card.number}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-lg text-foreground">
                    {card.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Image
                    src={`/images/cards/${card.number.toString().padStart(2, "0")}-${card.number === 22 ? "paths" : card.name.toLowerCase().replace("the ", "").replace(/ /g, "-")}.png`}
                    alt={card.name}
                    width={128}
                    height={128}
                    className="mb-3 h-32 w-full rounded-lg object-cover"
                  />
                  <div className="space-y-3">
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-foreground">
                        Keywords:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {card.keywords.map((keyword, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-muted text-xs text-muted-foreground"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-foreground">
                        Timing:
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {card.timing}
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-foreground">
                        Where to Watch:
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {card.location}
                      </p>
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-foreground">
                        Associations:
                      </h4>
                      <p className="text-xs leading-relaxed text-primary">
                        {card.associations.join(", ")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mb-8 space-y-3">
            {filteredCards.map((card) => (
              <Card key={card.number} className="border border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Image
                        src={`/images/cards/${card.number.toString().padStart(2, "0")}-${card.number === 22 ? "paths" : card.name.toLowerCase().replace("the ", "").replace(/ /g, "-")}.png`}
                        alt={card.name}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                        <span className="text-sm font-bold text-white">
                          {card.number}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {card.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {card.keywords.map((keyword, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-muted text-xs text-muted-foreground"
                            >
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          <strong>Timing:</strong> {card.timing}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Location:</strong> {card.location}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-primary">
                        {card.associations.join(", ")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Learning Tips */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle
              id="learning-the-cards"
              className="flex items-center text-2xl text-foreground"
            >
              <BookOpen className="mr-3 h-6 w-6 text-primary" />
              Learning the Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                    <span className="text-xs font-bold text-white">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Start with Keywords
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Focus on the core keywords first. These represent the
                      card&apos;s primary energy.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                    <span className="text-xs font-bold text-white">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Study Associations
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Learn the symbolic associations. These help you understand
                      how cards interact.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                    <span className="text-xs font-bold text-white">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Learn Timing & Location
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Each card has inherent timing (within days, weeks, months)
                      and locations (home, workplace, digital). These ground
                      readings in reality.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                    <span className="text-xs font-bold text-white">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Practice Daily
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Review 3-5 cards daily. Repetition builds familiarity and
                      intuition.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Tracker */}
        <div className="mb-8">
          <LearningProgressTracker moduleId="card-meanings" />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-border pt-8">
          <Link href="/learn/reading-basics">
            <Button
              variant="outline"
              className="border-border text-card-foreground hover:bg-muted"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reading Basics
            </Button>
          </Link>
          <Link href="/learn/card-combinations">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Continue to Combinations
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
