'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface TableOfContentsItem {
  id: string
  title: string
  level: 2 | 3
}

interface TableOfContentsProps {
  items: TableOfContentsItem[]
  className?: string
}

export function TableOfContents({ items, className = '' }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Set active section based on scroll position
    const handleScroll = () => {
      const sections = items.map(item => {
        const element = document.getElementById(item.id)
        return { id: item.id, element }
      }).filter(({ element }) => element)

      let currentSection = sections[0]?.id || ''

      for (const { id, element } of sections) {
        if (element && element.getBoundingClientRect().top < 100) {
          currentSection = id
        } else {
          break
        }
      }

      setActiveId(currentSection)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [items])

  const h2Items = items.filter(item => item.level === 2)
  const hasSubItems = items.some(item => item.level === 3)

  return (
    <div className={`rounded-lg border border-border bg-card p-4 md:sticky md:top-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Table of Contents</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
          aria-label="Toggle table of contents"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <nav className={`mt-4 space-y-2 ${!isOpen && 'hidden md:block'}`}>
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={() => setIsOpen(false)}
            className={`block transition-colors ${
              item.level === 3 ? 'ml-4 text-sm' : 'font-medium'
            } ${
              activeId === item.id
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.title}
          </a>
        ))}
      </nav>
    </div>
  )
}

/**
 * Auto-extract heading IDs from DOM and generate TableOfContentsItems
 * Call this after DOM is loaded and heading IDs are set
 */
export function extractHeadingsAsItems(
  h2Selector = 'h2',
  h3Selector = 'h3'
): TableOfContentsItem[] {
  const items: TableOfContentsItem[] = []

  // Get all h2 and h3 headings with IDs
  const headings = document.querySelectorAll(`${h2Selector}[id], ${h3Selector}[id]`)

  headings.forEach((heading) => {
    const id = heading.id
    const title = heading.textContent || ''
    const level = parseInt(heading.tagName[1]) as 2 | 3

    if (id && title) {
      items.push({ id, title, level })
    }
  })

  return items
}
