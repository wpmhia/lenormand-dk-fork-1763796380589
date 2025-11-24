export interface SpreadLearningLinks {
  methodologyPage: string
  learnMoreUrl?: string
  description: string
  readMoreText?: string
}

export const SPREAD_LEARNING_MAP: Record<string, SpreadLearningLinks> = {
  'single-card': {
    methodologyPage: '/learn/spreads#single-card',
    description: 'Single Card Reading Method - Quick daily guidance and immediate answers'
  },
  'sentence-3': {
    methodologyPage: '/learn/marie-annes-system',
    learnMoreUrl: '/learn/spreads#3-card-spreads',
    description: 'Marie-Anne\'s 3-Card Sentence - Her primary daily reading method with flowing narrative'
  },
  'comprehensive': {
    methodologyPage: '/learn/spreads#9-card-spreads',
    learnMoreUrl: '/learn/marie-annes-system',
    description: '9-Card Petit Grand Tableau - Deeper exploration without overwhelming complexity'
  },
  'grand-tableau': {
    methodologyPage: '/learn/marie-annes-system',
    learnMoreUrl: '/learn/spreads#36-card-master-reading',
    description: 'Grand Tableau (36-Card) - Marie-Anne\'s most comprehensive reading method'
  },
  'past-present-future': {
    methodologyPage: '/learn/spreads#3-card-spreads',
    description: 'Past-Present-Future - Classic timeline spread for understanding progression'
  },
  'yes-no-maybe': {
    methodologyPage: '/learn/spreads#3-card-spreads',
    description: 'Yes or No - Direct answers using card meanings and position interpretation'
  },
  'situation-challenge-advice': {
    methodologyPage: '/learn/spreads#3-card-spreads',
    description: 'Situation-Challenge-Advice - Problem-solving through diagnostic method'
  },
  'mind-body-spirit': {
    methodologyPage: '/learn/spreads#3-card-spreads',
    description: 'Mind-Body-Spirit - Holistic view across mental, physical, and spiritual dimensions'
  },
  'sentence-5': {
    methodologyPage: '/learn/spreads#5-card-spreads',
    description: '5-Card Sentence - Extended narrative using flowing story structure'
  },
  'structured-reading': {
    methodologyPage: '/learn/spreads#5-card-spreads',
    description: 'Structured 5-Card - Analytical method with resources and outcomes'
  },
  'week-ahead': {
    methodologyPage: '/learn/spreads#7-card-spreads',
    description: '7-Card Week Ahead - Daily structure with action-oriented interpretation'
  },
  'relationship-double-significator': {
    methodologyPage: '/learn/spreads#7-card-spreads',
    learnMoreUrl: '/learn/marie-annes-system',
    description: 'Relationship Reading - Dual significator method showing both partners\' perspectives'
  }
}

export function getSpreadLearningLinks(spreadId?: string): SpreadLearningLinks | null {
  if (!spreadId) return null
  return SPREAD_LEARNING_MAP[spreadId] || null
}
