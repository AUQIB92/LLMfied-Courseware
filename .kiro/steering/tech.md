# Technical Stack & Development Guidelines

## Tech Stack

- **Framework**: Next.js 15.2.4
- **Language**: JavaScript/TypeScript
- **UI**: React 19 with Tailwind CSS
- **Styling**: Tailwind CSS with custom utilities via `cn()` function
- **Authentication**: Custom auth system with JWT (see AuthContext.js)
- **Database**: MongoDB
- **AI Integration**: Google Generative AI (Gemini)
- **Component Library**: Radix UI primitives with custom styling
- **Form Handling**: React Hook Form with Zod validation
- **Notifications**: Sonner for toast notifications
- **Math Rendering**: Multiple strategies including:
  - KaTeX for simple math
  - MathJax for complex math
  - React Markdown with math plugins
  - Custom adaptive rendering system

## Build System

- **Package Manager**: npm/pnpm
- **Build Tool**: Next.js built-in tooling

## Common Commands

```bash
# Development
npm run dev       # Start development server

# Production
npm run build     # Build for production
npm run start     # Start production server

# Linting
npm run lint      # Run ESLint
```

## Environment Setup

Environment variables are stored in `.env.local`. See `setup-env.md` for details on required variables.

## Code Organization Patterns

1. **Component Hierarchy**: Components follow a hierarchical structure with specialized renderers for different content types
2. **Context API**: Used for global state management (e.g., AuthContext)
3. **Utility Functions**: Common utilities in `lib/utils.ts`
4. **Hooks**: Custom hooks in `/hooks` directory for reusable logic

## Testing

Scripts in the `/scripts` directory are used for testing and data migration:
- `check-exam-genius-latex.mjs`: Validates LaTeX syntax in exam content
- `fix-latex-syntax.js`: Repairs common LaTeX formatting issues
- `sanitize-all-latex.js`: Batch processing for LaTeX sanitization

## Deployment

The application is designed to be deployed on standard Next.js hosting platforms.