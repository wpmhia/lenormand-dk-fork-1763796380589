/**
 * Cached access to SPREAD_RULES for improved performance
 * Wraps spreadRulesCache to provide convenient access
 */

import { SPREAD_RULES } from './spreadRules'
import { spreadRulesCache } from './cache'
import { SpreadId } from '@/types/agent.types'

/**
 * Get spread rule with caching
 * @param spreadId Spread identifier
 * @returns SpreadRule or undefined if not found
 */
export function getCachedSpreadRule(spreadId: SpreadId) {
  const cacheKey = `spread_${spreadId}`
  
  return spreadRulesCache.getOrCompute(
    cacheKey,
    () => SPREAD_RULES[spreadId],
    3600 // Cache for 1 hour
  )
}

/**
 * Get all spread rules with caching
 * @returns Object containing all spread rules
 */
export function getCachedAllSpreadRules() {
  const cacheKey = 'all_spreads'
  
  return spreadRulesCache.getOrCompute(
    cacheKey,
    () => SPREAD_RULES,
    3600 // Cache for 1 hour
  )
}

/**
 * Clear all cached spread rules
 * Useful when spread definitions change
 */
export function clearSpreadRulesCache(): void {
  spreadRulesCache.clear()
}

/**
 * Get cache statistics
 * @returns Cache statistics including size and keys
 */
export function getSpreadRulesCacheStats() {
  return spreadRulesCache.stats()
}
