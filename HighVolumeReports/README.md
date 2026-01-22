# Ira Analytics

Enterprise-grade reporting engine for high-volume data processing. Handles millions of rows efficiently with fast preview capabilities and asynchronous export generation for PDF and Excel formats.

## Features

- **High-Volume Data Processing** - Efficiently handles 10M+ rows
- **Multiple Export Formats** - PDF and Excel exports
- **Async Job Processing** - Background job queue with progress tracking
- **Real-Time Notifications** - WebSocket-based live updates
- **Scheduled Reports** - Daily, weekly, and monthly scheduling
- **Role-Based Access Control** - Admin, Analyst, and Viewer roles
- **Secure Authentication** - Session-based auth with CSRF protection

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-Time**: Socket.IO for WebSocket connections

---

## Local Deployment Guide

### Prerequisites

1. **Node.js** (version 18 or higher) - [Download](https://nodejs.org)
2. **PostgreSQL** (version 14 or higher) - [Download](https://www.postgresql.org/download/)
3. **Git** - [Download](https://git-scm.com)

---

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd ira-analytics
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up PostgreSQL Database

Open PostgreSQL (using psql or pgAdmin) and run:

```sql
CREATE DATABASE ira_analytics;
```

Optionally, create a dedicated user:

```sql
CREATE USER ira_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ira_analytics TO ira_user;
```

### Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://ira_user:your_secure_password@localhost:5432/ira_analytics

# Session
SESSION_SECRET=generate-a-long-random-string-here

# Server
NODE_ENV=development
PORT=5000

# Optional: Email (for Mailhog local testing)
MAILHOG_HOST=localhost
MAILHOG_PORT=1025
```

### Step 5: Run Database Migrations

Push the schema to your database:

```bash
npm run db:push
```

### Step 6: Start the Development Server

```bash
npm run dev
```

### Step 7: Access the Application

Open your browser and navigate to:

```
http://localhost:5000
```

**Default Login Credentials:**
- Username: `admin`
- Password: `Admin_123`

---

## Production Deployment

### Step 1: Build the Application

```bash
npm run build
```

### Step 2: Configure Production Environment

Update your `.env` file:

```env
NODE_ENV=production
DATABASE_URL=your-production-database-url
SESSION_SECRET=your-production-secret
PORT=5000
```

### Step 3: Start the Production Server

```bash
npm start
```

---

## Optional: Email Testing with Mailhog

For testing email notifications locally:

1. **Install Mailhog**: [Download from GitHub](https://github.com/mailhog/MailHog/releases)

2. **Run Mailhog**:
   ```bash
   mailhog
   ```

3. **Access the Web UI**: Open `http://localhost:8025` to view captured emails

4. **Configure the app** (already set by default):
   ```env
   MAILHOG_HOST=localhost
   MAILHOG_PORT=1025
   ```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Drizzle Studio (database UI) |

---

## User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access - manage users, schedules, system settings |
| **Analyst** | Create and manage reports and exports |
| **Viewer** | View reports and download completed exports |

---

## Project Structure

```
ira-analytics/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components (Dashboard, Reports, etc.)
│   │   ├── lib/            # Utilities and hooks
│   │   └── hooks/          # Custom React hooks
│   └── index.html
├── server/                 # Backend Express server
│   ├── auth.ts             # Authentication & security
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   └── notifications.ts    # WebSocket & email
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Drizzle database schema
└── package.json
```

---

## Support

For issues or questions, please open an issue in the repository.

---

## License

MIT License
