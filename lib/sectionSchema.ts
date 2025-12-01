/**
 * Generate SectionSchema structured data for better SEO
 * Makes each section of a learning module independently discoverable
 */

export interface SectionSchemaData {
  id: string
  headline: string
  description: string
  position: number
  url: string
}

export function generateSectionSchema(sections: SectionSchemaData[]) {
  const schemaArray = sections.map((section) => ({
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    '@id': `${section.url}#${section.id}`,
    headline: section.headline,
    description: section.description,
    position: section.position,
    isPartOf: {
      '@type': 'WebPage',
      url: section.url,
    },
  }))

  return schemaArray
}

export function generateSectionSchemaJSON(sections: SectionSchemaData[]) {
  const schemaArray = sections.map((section) => ({
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    '@id': `${section.url}#${section.id}`,
    headline: section.headline,
    description: section.description,
    position: section.position,
    isPartOf: {
      '@type': 'WebPage',
      url: section.url,
    },
  }))

  return JSON.stringify(schemaArray)
}
