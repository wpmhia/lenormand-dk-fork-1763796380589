# Lenormand Intelligence

A Lenormand card reading web application built with Next.js 14 and TypeScript.

## Features

- 36 Lenormand cards with detailed meanings
- Multiple reading spreads (3-card, 9-card, Grand Tableau)
- AI-powered interpretations with DeepSeek
- Learning modules and card combinations
- Responsive design with dark/light theme

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Lucide React

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
npm install
```

### Environment Variables

Create `.env` with:

```bash
DEEPSEEK_API_KEY=sk-your-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### Development

```bash
npm run dev
```

Open http://localhost:4000

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format with Prettier

## Deployment

Push to GitHub and connect to Vercel. Set environment variables in Vercel dashboard.

## License

MIT
