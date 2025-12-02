import { getFewShotExamplesForSpread } from './feedbackOptimization'

/**
 * Build few-shot examples section for the prompt
 * This injects high-quality past examples to guide the AI
 */
export async function buildFewShotExamplesSection(spreadId: string): Promise<string> {
  try {
    const examples = await getFewShotExamplesForSpread(spreadId, 2)

    if (examples.length === 0) {
      return ''
    }

    let fewShotSection = '\n=== REFERENCE EXAMPLES (High-Quality Past Readings) ===\n'
    fewShotSection += 'Study these excellent readings from your history—they show the standard you must maintain:\n\n'

    examples.forEach((example, index) => {
      fewShotSection += `EXAMPLE ${index + 1}:\n`
      fewShotSection += `Question: "${example.question}"\n`
      fewShotSection += `Response:\n"${example.excellentResponse}"\n\n`
    })

    fewShotSection +=
      'These examples show the DEPTH, DIRECTNESS, and CLARITY required. Match this standard in your response.\n'

    return fewShotSection
  } catch (error) {
    console.error('Error building few-shot examples section:', error)
    return ''
  }
}

/**
 * Enhance prompt with few-shot examples and optimization data
 */
export async function enhancePromptWithOptimization(
  basePrompt: string,
  spreadId: string
): Promise<string> {
  const fewShotSection = await buildFewShotExamplesSection(spreadId)

  if (!fewShotSection) {
    return basePrompt
  }

  // Insert few-shot examples after the system instruction but before the actual task
  const insertPoint = basePrompt.indexOf('STRUCTURE:')
  if (insertPoint === -1) {
    // If STRUCTURE not found, append at the end
    return basePrompt + fewShotSection
  }

  return basePrompt.slice(0, insertPoint) + fewShotSection + '\n' + basePrompt.slice(insertPoint)
}

/**
 * Generate analysis of what worked in previous readings
 */
export async function getSuccessPatterns(spreadId: string): Promise<string> {
  try {
    const examples = await getFewShotExamplesForSpread(spreadId, 5)

    if (examples.length < 2) {
      return ''
    }

    const patterns: string[] = []

    // Analyze common elements in excellent responses
    examples.forEach((example, index) => {
      const response = example.excellentResponse.toLowerCase()

      if (response.includes('specific') || response.includes('action')) {
        patterns.push('Provide specific, actionable guidance')
      }
      if (response.includes('obstacle') || response.includes('challenge')) {
        patterns.push('Clearly identify obstacles')
      }
      if (response.includes('timeline') || response.includes('week')) {
        patterns.push('Include timeline when relevant')
      }
      if (response.length > 200) {
        patterns.push('Provide substantial depth (200+ chars)')
      }
    })

    const uniquePatterns = Array.from(new Set(patterns))
    if (uniquePatterns.length === 0) {
      return ''
    }

    return `\nKEY SUCCESS PATTERNS (from your excellent readings):\n${uniquePatterns.map(p => `- ${p}`).join('\n')}\n`
  } catch (error) {
    console.error('Error analyzing success patterns:', error)
    return ''
  }
}
