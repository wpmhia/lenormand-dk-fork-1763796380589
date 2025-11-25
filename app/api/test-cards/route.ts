import { NextResponse } from 'next/server'
import { getCards } from '@/lib/data'

export async function GET() {
  try {
    const cards = getCards()
    const clover = cards.find(c => c.id === 2)
    
    return NextResponse.json({
      totalCards: cards.length,
      cloverHasMeaning: !!clover?.meaning,
      cloverKeys: clover ? Object.keys(clover) : [],
      cloverMeaningKeys: clover?.meaning ? Object.keys(clover.meaning) : [],
      clover: {
        id: clover?.id,
        name: clover?.name,
        hasMeaning: !!clover?.meaning,
        uprightMeaning: clover?.uprightMeaning
      }
    })
   } catch (error) {
     const message = error instanceof Error ? error.message : 'Unknown error'
     return NextResponse.json({ error: message }, { status: 500 })
   }
}