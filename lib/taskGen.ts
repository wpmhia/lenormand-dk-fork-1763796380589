import { LenormandCard } from '@/types/agent.types'

const CARD_TO_TASK: Record<string, string> = {
  'Ring': 'Sign the document or confirm the commitment before the deadline',
  'Letter': 'Send the message, text, or email before Friday',
  'Rider': 'Deliver the news or send word immediately',
  'Key': 'Act on the solution or unlock the next step',
  'Scythe': 'Make the sharp decision or cut what needs cutting',
  'Paths': 'Choose one path and commit before the deadline',
  'Phone': 'Make the call or send the message',
  'Book': 'Research, read, or gather the information',
  'Fish': 'Follow the money or initiate the transaction',
  'Heart': 'Express your feelings or declare your position',
  'Dog': 'Reach out to your friend or ally',
  'House': 'Make arrangements or solidify the home situation',
  'Tower': 'Contact the authority or make the official move',
  'Sun': 'Take the win or step into the light',
  'Moon': 'Trust your instinct or acknowledge the feeling',
  'Clover': 'Seize the opportunity before it passes',
  'Anchor': 'Secure your position or commit to staying',
  'Bouquet': 'Celebrate, send gratitude, or enjoy the moment'
}

export function makeTask(beat: string, cards: LenormandCard[]): string {
  if (cards.length === 0) {
    return 'Take the next concrete step before Friday'
  }

  const lastCard = cards[cards.length - 1]
  const cardTask = CARD_TO_TASK[lastCard.name]

  if (cardTask) {
    return cardTask
  }

  if (beat === 'action' || beat === 'verdict') {
    return 'Take the next concrete step by Friday'
  }

  return 'Follow through before the weekend'
}

export function makeTaskWithDeadline(beat: string, cards: LenormandCard[], deadline: string): string {
  const baseTask = makeTask(beat, cards)
  if (baseTask.includes('Friday') || baseTask.includes('deadline')) {
    return baseTask
  }
  return `${baseTask} ${deadline.toLowerCase()}`
}
