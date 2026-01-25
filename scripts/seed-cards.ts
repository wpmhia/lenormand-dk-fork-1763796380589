import { prisma } from '@/lib/prisma'
import cardsData from '@/lib/data/cards.json'
import cardCombinationsData from '@/lib/data/card-combinations.json'

async function seedCards() {
  console.log('🌱 Starting card data seeding...\n')

  try {
    // Seed cards
    console.log('📇 Seeding cards...')
    for (const card of cardsData) {
      await prisma.card.upsert({
        where: { id: card.id },
        update: {},
        create: {
          id: card.id,
          name: card.name,
          number: card.number,
          keywords: card.keywords || [],
          uprightMeaning: card.uprightMeaning,
        },
      })
    }
    console.log(`✅ Seeded ${cardsData.length} cards\n`)

    // Seed card combinations
    console.log('🔗 Seeding card combinations...')
    let combinationCount = 0
    
    for (const [key, combo] of Object.entries(cardCombinationsData)) {
      const [cardIdStr, withCardIdStr] = key.split('-')
      const cardId = parseInt(cardIdStr)
      const withCardId = parseInt(withCardIdStr)

      try {
        await prisma.cardCombination.upsert({
          where: {
            cardId_withCardId: {
              cardId,
              withCardId,
            },
          },
          update: {},
          create: {
            cardId,
            withCardId,
            meaning: (combo as any).meaning,
            context: (combo as any).context,
            examples: (combo as any).examples || [],
            category: (combo as any).category,
            strength: (combo as any).strength,
          },
        })
        combinationCount++
      } catch (error) {
        console.warn(`⚠️  Error seeding combination ${key}:`, error instanceof Error ? error.message : String(error))
      }
    }
    console.log(`✅ Seeded ${combinationCount} card combinations\n`)

    console.log('🎉 Seeding completed successfully!')
  } catch (error) {
    console.error('❌ Seeding error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedCards().catch(console.error)
