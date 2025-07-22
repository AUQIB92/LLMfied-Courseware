# Project Structure & Organization

## Directory Structure

- `/app`: Next.js App Router pages and layouts
  - `/api`: API routes for backend functionality
  - `/layout.js`: Root layout with providers
  - `/page.js`: Landing page component

- `/components`: React components organized by feature and function
  - `/auth`: Authentication-related components
  - `/educator`: Components specific to educator users
  - `/learner`: Components specific to learner users
  - `/ui`: Reusable UI components
  - `/exam-genius`: Components for the exam creation and taking system
  - Math rendering components:
    - `AdaptiveMathRenderer.js`: Smart renderer that chooses the best strategy
    - `MathJaxRenderer.js`: Complex math rendering with MathJax
    - `MathMarkdownRenderer.js`: Markdown with math support
    - `ModernMathRenderer.js`: Alternative rendering approach
    - `SmartMathRenderer.js`: Optimized rendering for specific cases

- `/contexts`: React context providers
  - `AuthContext.js`: Authentication state management

- `/hooks`: Custom React hooks
  - `use-mobile.tsx`: Responsive design utilities
  - `use-toast.ts`: Toast notification utilities
  - `useProfile.tsx`: User profile data management

- `/lib`: Utility functions and services
  - `ai.js`: AI integration utilities
  - `curriculumParser.js`: Parsing curriculum content
  - `emailService.js`: Email functionality
  - `models.js`: Data models
  - `mongodb.js`: Database connection and utilities
  - `utils.ts`: General utility functions including LaTeX sanitization

- `/public`: Static assets and sample content
  - `/uploads`: User-uploaded content

- `/scripts`: Utility scripts for maintenance and testing

- `/styles`: Global CSS and component-specific styles

- `/tmp`: Temporary files for development and testing

## Naming Conventions

1. **Components**: PascalCase for component files and function names
2. **Hooks**: camelCase with 'use' prefix
3. **Utilities**: camelCase for function names
4. **Context**: PascalCase with 'Context' suffix

## File Organization

1. **Component Structure**: Each component should be in its own file
2. **Feature Organization**: Related components are grouped in feature-specific folders
3. **Shared Components**: Common UI elements in the `/components/ui` directory
4. **Role-Specific Components**: Organized by user role (educator, learner)

## Code Patterns

1. **Math Rendering Strategy**: The project uses a sophisticated adaptive rendering system that chooses the appropriate renderer based on content complexity
2. **LaTeX Sanitization**: Extensive sanitization for LaTeX to prevent rendering errors
3. **Client Components**: Use "use client" directive for client-side components
4. **Server Components**: Default to server components when possible
5. **Authentication Flow**: JWT-based authentication with context provider