# Lenormand Intelligence

A complete Lenormand tarot reading web application built with Next.js 14, TypeScript, and Prisma.

## Features

- 🎴 **36 Lenormand Cards** with detailed meanings and combinations
- 🔮 **Multiple Reading Layouts**: 3-card, 5-card, 9-card, and Grand Tableau (36 cards)
- 👤 **User Accounts** with saved readings and statistics
- 🔗 **Shareable Readings** with public links
- 📊 **Analytics Dashboard** for users and admins
- 🌐 **International Support**: English
- 📱 **Mobile-Friendly** responsive design
- 🎨 **Beautiful UI** with Tailwind CSS and shadcn/ui
- 🔒 **Authentication** with NextAuth.js
- 🗄️ **PostgreSQL Database** with Prisma ORM

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS + shadcn/ui components
- **Icons**: Lucide React
- **Testing**: Vitest
- **Deployment**: Vercel/Replit ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm, yarn, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lenormand-dk
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your database URL and NextAuth secret:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/lenormand_dk"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # Seed the database with Lenormand cards
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with cards
- `npm run db:studio` - Open Prisma Studio

## Project Structure

```
lenormand-dk/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── cards/             # Cards catalog
│   ├── read/              # Reading pages
│   ├── me/                # User dashboard
│   └── admin/             # Admin panel
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── Card.tsx          # Card component
│   ├── Deck.tsx          # Deck component
│   └── ReadingViewer.tsx  # Reading display
├── lib/                   # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   └── types.ts          # TypeScript types
├── tests/                # Test files
└── public/               # Static assets
```

## API Endpoints

### Cards
- `GET /api/cards` - List all cards
- `GET /api/cards/:id` - Get specific card

### Readings
- `POST /api/readings` - Create new reading
- `GET /api/readings/:slug` - Get public reading
- `GET /api/me/readings` - Get user's readings

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth.js handlers

## Features in Detail

### Reading Layouts

1. **3 Cards**: Past, Present, Future
2. **5 Cards**: Extended reading with challenges and advice
3. **9 Cards**: Comprehensive life reading
4. **Grand Tableau**: Full 36-card reading in 9x4 grid

### Card Meanings

Each card includes:
- Basic upright and reversed meanings
- Keywords for quick reference
- Combination meanings with other cards
- Historical context

### User Features

- Save readings to personal account
- Track card draw statistics
- Share readings publicly
- View reading history

### Admin Features

- View platform analytics
- Monitor user activity
- Track popular cards
- Export data

## Testing

Run the test suite:

```bash
npm run test
```

Tests cover:
- Shuffle algorithm randomness
- Card drawing logic
- Combination detection
- Edge cases

## Deployment

### Vercel

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Replit

1. Import the repository to Replit
2. Configure environment variables in Secrets tab
3. Run the deployment command

### Manual Deployment

```bash
npm run build
npm run start
```

## Environment Variables

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NEXTAUTH_URL` - Application URL

Optional variables:
- Email provider settings for magic links

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review existing issues

## Acknowledgments

- Lenormand card meanings based on traditional cartomancy
- Built with modern web technologies
- Inspired by the divination community