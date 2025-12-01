import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BreadcrumbNav } from "@/components/BreadcrumbNav"
import { BackToTop } from "@/components/BackToTop"
import { LENORMAND_CARDS, getCardByNumber } from "@/lib/lenormand-cards-data"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface CardGuidePageProps {
  params: {
    number: string
  }
}

export async function generateStaticParams() {
  return LENORMAND_CARDS.map((card) => ({
    number: card.number.toString(),
  }))
}

export async function generateMetadata({ params }: CardGuidePageProps) {
  const card = getCardByNumber(parseInt(params.number))

  if (!card) {
    return {
      title: "Card Not Found",
      description: "The card you're looking for doesn't exist.",
    }
  }

  return {
    title: `${card.name} (Card #${card.number}) - Lenormand Meanings & Combinations`,
    description: `Learn the meaning of the ${card.name} card in Lenormand. Keywords: ${card.keywords.join(", ")}. Playing Card: ${card.playingCard}. Timing, location, and card combinations.`,
    keywords: [
      `${card.name} card`,
      "lenormand",
      "card meaning",
      "card combinations",
      ...card.keywords,
    ],
    openGraph: {
      title: `${card.name} Lenormand Card`,
      description: `Master the meaning of the ${card.name} Lenormand card with keywords, combinations, and interpretations.`,
    },
  }
}

export default function CardGuidePage({ params }: CardGuidePageProps) {
  const cardNumber = parseInt(params.number)
  const card = getCardByNumber(cardNumber)

  if (!card) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold">Card Not Found</h1>
          <p className="mt-4 text-muted-foreground">
            The card you're looking for doesn't exist.
          </p>
          <Link href="/cards">
            <Button className="mt-4">Back to Cards</Button>
          </Link>
        </div>
      </div>
    )
  }

  const previousCard =
    cardNumber > 1 ? getCardByNumber(cardNumber - 1) : null
  const nextCard =
    cardNumber < 36 ? getCardByNumber(cardNumber + 1) : null

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <BreadcrumbNav
            items={[
              { name: "Home", url: "/" },
              { name: "Cards", url: "/cards" },
              { name: card.name, url: `/cards/guide/${card.number}` },
            ]}
          />
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Card Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Badge className="text-lg py-1 px-3">Card #{card.number}</Badge>
            <Badge variant="secondary">{card.playingCard}</Badge>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            {card.name}
          </h1>
          <p className="text-lg text-muted-foreground">
            {card.description}
          </p>
        </div>

        {/* Quick Reference Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Timing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-foreground">{card.timing}</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-foreground">{card.location}</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Playing Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-foreground">{card.playingCard}</p>
            </CardContent>
          </Card>
        </div>

        {/* Keywords */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle id="keywords">Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {card.keywords.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-sm py-1 px-3"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Associations */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle id="associations">Symbolic Associations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {card.associations.map((assoc, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">{assoc}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Card Combinations */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle id="combinations">Common Combinations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(card.combinations).map(([key, value]) => (
              <div key={key} className="flex flex-col gap-1">
                <dt className="font-semibold text-foreground">
                  {key
                    .replace(/([A-Z])/g, " $1")
                    .trim()
                    .split(" ")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    )
                    .join(" ")}
                </dt>
                <dd className="text-sm text-muted-foreground">{value}</dd>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-border pt-8 gap-4">
          {previousCard ? (
            <Link href={`/cards/guide/${previousCard.number}`}>
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                {previousCard.name}
              </Button>
            </Link>
          ) : (
            <div />
          )}

          <Link href="/cards">
            <Button variant="ghost">Back to All Cards</Button>
          </Link>

          {nextCard ? (
            <Link href={`/cards/guide/${nextCard.number}`}>
              <Button className="flex items-center gap-2">
                {nextCard.name}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>

      <BackToTop />
    </div>
  )
}
