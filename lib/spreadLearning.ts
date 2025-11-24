export interface SpreadLearningLinks {
  methodologyPage: string
  learnMoreUrl?: string
  description: string
}

export const SPREAD_LEARNING_MAP: Record<string, SpreadLearningLinks> = {
  'single-card': {
    methodologyPage: '/learn/spreads',
    description: 'Single Card Reading Method'
  },
  'sentence-3': {
    methodologyPage: '/learn/marie-annes-system',
    learnMoreUrl: '/learn/spreads',
    description: 'Marie-Anne\'s 3-Card Sentence Method'
  },
  'comprehensive': {
    methodologyPage: '/learn/spreads',
    description: '9-Card Petit Grand Tableau Method'
  },
  'grand-tableau': {
    methodologyPage: '/learn/marie-annes-system',
    learnMoreUrl: '/learn/spreads',
    description: 'Grand Tableau (36-Card) Reading Method'
  },
  'past-present-future': {
    methodologyPage: '/learn/spreads',
    description: 'Past-Present-Future Reading Method'
  },
  'yes-no-maybe': {
    methodologyPage: '/learn/spreads',
    description: 'Yes or No Reading Method'
  },
  'situation-challenge-advice': {
    methodologyPage: '/learn/spreads',
    description: 'Situation-Challenge-Advice Method'
  },
  'mind-body-spirit': {
    methodologyPage: '/learn/spreads',
    description: 'Mind-Body-Spirit Reading Method'
  },
  'sentence-5': {
    methodologyPage: '/learn/spreads',
    description: '5-Card Sentence Reading Method'
  },
  'structured-reading': {
    methodologyPage: '/learn/spreads',
    description: 'Structured 5-Card Reading Method'
  },
  'week-ahead': {
    methodologyPage: '/learn/spreads',
    description: '7-Card Week Ahead Method'
  },
  'relationship-double-significator': {
    methodologyPage: '/learn/spreads',
    learnMoreUrl: '/learn/marie-annes-system',
    description: 'Relationship Reading with Significators'
  }
}

export function getSpreadLearningLinks(spreadId?: string): SpreadLearningLinks | null {
  if (!spreadId) return null
  return SPREAD_LEARNING_MAP[spreadId] || null
}
