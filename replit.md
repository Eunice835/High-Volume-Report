# Ira Analytics - High Volume Reporting System

## Overview

Ira Analytics is an enterprise-grade reporting engine designed for processing and analyzing high-volume transactional data. The application handles millions of rows efficiently, providing fast preview capabilities and asynchronous export generation for PDF and Excel formats. Built with a React frontend and Express backend, it uses PostgreSQL for data storage with Drizzle ORM for database operations.

The system targets domains requiring large-scale data analysis such as e-commerce ledgers, banking transactions, telecom CDRs, and other high-volume reporting scenarios. It supports multiple report types (detail, summary, exception, and booklet formats) with flexible filtering, pagination, and scheduled exports.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management
- Tailwind CSS v4 with shadcn/ui component library (New York style variant)
- React Hook Form with Zod validation for form handling

**Design Decisions:**
- **Component Library**: Uses shadcn/ui components providing consistent, accessible UI patterns with glass-morphism styling ("glass-panel" classes) for a modern enterprise aesthetic
- **State Management**: TanStack Query handles all server state with auto-refetching for real-time job monitoring (3-5 second intervals)
- **Virtualization**: Implements @tanstack/react-virtual for efficiently rendering large datasets in the data grid without performance degradation
- **Routing**: Wouter chosen over React Router for minimal bundle size
- **Form Validation**: Zod schemas ensure type-safe validation matching backend expectations

**Key Pages:**
- Dashboard: System overview with throughput metrics and active job monitoring
- Reports: Interactive report builder with filters and live preview
- Exports: Job center for monitoring background export tasks
- Admin: System health monitoring and worker queue management

### Backend Architecture

**Technology Stack:**
- Node.js with Express framework
- TypeScript in ESNext module format
- Drizzle ORM with Neon serverless PostgreSQL driver
- Session-based architecture (connect-pg-simple for session storage)

**Design Decisions:**
- **API Structure**: RESTful endpoints under `/api` prefix with POST for complex queries requiring request bodies
- **Request Validation**: Zod schemas validate incoming requests before processing
- **Database Access**: Single storage interface abstraction (`IStorage`) allows swapping implementations
- **Streaming Architecture**: Designed for chunked data processing (though full implementation requires queue workers)
- **Build Process**: Custom esbuild configuration bundles server with allowlist approach for dependencies to optimize cold starts
- **Development Mode**: Vite middleware integration for HMR during development

**Core API Endpoints:**
- `POST /api/reports/preview` - Fast paginated data retrieval for UI preview
- `POST /api/reports/export` - Initiate background export job
- `GET /api/reports/exports` - List export jobs with status
- `GET /api/admin/stats` - System health metrics

### Data Storage

**Database Schema (PostgreSQL with Drizzle):**

**Transactions Table** (main fact table):
- Indexed on timestamp, region+timestamp, customer, and status
- Supports high-volume inserts via bulk operations
- Stores transaction_id, timestamp, region, type, amount, status, customer
- Uses PostgreSQL enums for type safety (transaction type, status)

**Jobs Table**:
- Tracks export job lifecycle (queued → processing → completed/failed)
- Stores progress metrics (total_rows, processed_rows, progress percentage)
- Contains serialized filter JSON for job replay
- Records file metadata (size, download URL) upon completion

**Schedules Table**:
- Defines recurring export configurations
- Stores frequency (daily/weekly/monthly), recipients, and report parameters
- Supports active/paused status

**Design Decisions:**
- **Denormalization Ready**: Schema accommodates separate reporting tables for pre-aggregated summaries
- **Indexing Strategy**: Composite indexes on common filter combinations (region+timestamp) for query performance
- **Enum Types**: PostgreSQL enums enforce data integrity at database level
- **Bulk Operations**: Storage interface supports batch inserts for seed data and imports
- **Serverless PostgreSQL**: Neon's HTTP-based driver enables edge deployment and connection pooling

### External Dependencies

**Database:**
- **Neon Serverless PostgreSQL**: HTTP-based PostgreSQL driver for serverless environments
- **Drizzle ORM**: Type-safe ORM with migration support via drizzle-kit
- **connect-pg-simple**: PostgreSQL session store for Express sessions

**Frontend Libraries:**
- **Radix UI Primitives**: Unstyled, accessible component primitives for all interactive UI elements
- **Lucide Icons**: Icon library for consistent iconography
- **date-fns**: Date manipulation and formatting
- **Recharts**: Charting library for throughput visualization

**Build & Development Tools:**
- **Vite**: Frontend build tool with HMR and asset optimization
- **esbuild**: Fast server bundling for production builds
- **@replit/vite-plugin-cartographer**: Replit-specific development tooling
- **@replit/vite-plugin-dev-banner**: Development environment indicators
- **vite-plugin-meta-images**: Custom plugin for OpenGraph image injection

**Validation & Type Safety:**
- **Zod**: Runtime validation and schema definition shared between client/server
- **drizzle-zod**: Generates Zod schemas from Drizzle table definitions
- **TypeScript**: End-to-end type safety with strict mode enabled

**Future Integrations (Planned but not implemented):**
- Queue system (likely BullMQ or Postgres-based) for async job processing
- PDF generation library (likely Puppeteer or PDFKit) for report exports
- Excel generation (xlsx library already in dependencies)
- Email service (nodemailer in dependencies) for scheduled report delivery

### Authentication & Security

**Session Management:**
- Express-session with PostgreSQL session store (connect-pg-simple)
- Secure cookie configuration: HttpOnly, Secure (production), SameSite=Strict
- Session-based authentication with automatic session refresh

**CSRF Protection:**
- csurf middleware enforces CSRF tokens on all POST/PUT/DELETE requests
- Token propagated to frontend via session endpoint and login response
- Client includes X-CSRF-Token header on all mutating API requests

**Role-Based Access Control (RBAC):**
- Three roles: admin, analyst, viewer
- requireAuth middleware protects all API routes
- requireRole middleware enforces role-specific access (e.g., admin-only routes)
- Frontend route protection with role-based visibility

**Rate Limiting:**
- express-rate-limit applied to API endpoints (100 requests/15 min)
- Stricter limits on authentication endpoints (5 requests/15 min)
- Trust proxy enabled for correct client IP identification

**Default Users:**
- Admin user created on startup: admin / Admin_123 / admin@ira.local

### Real-Time Notifications

**WebSocket Server (Socket.IO):**
- Session-based WebSocket authentication sharing express-session store
- Real-time job status updates (queued → processing → completed/failed)
- Notifications emitted on job state transitions

**Email Notifications:**
- Nodemailer configured with Mailhog SMTP (localhost:1025) for development
- Email sent on export completion or failure with job details
- Recipients configured in schedule settings

**Development Environment:**
- Configured for Replit deployment with environment variable-based configuration
- Supports both local development and production builds
- Custom meta image plugin updates OpenGraph tags for proper social sharing
- Mailhog for local email testing (SMTP port 1025, Web UI port 8025)