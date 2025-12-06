# 🚀 AI Code Studio

Multi-purpose AI workspace for development, cybersecurity, writing, research, and more.

## Features

### 🛡️ Cybersecurity
- Full Red Team / Blue Team simulation
- Web vulnerability scanning (OWASP Top 10)
- Social engineering simulations (phishing, vishing, smishing)
- CVSS 3.1 calculator
- Automated report generation (.md, PDF)
- MITRE ATT&CK mapping

### 💻 Software Development
- Full-stack code generation
- AI-assisted debugging
- Code refactoring
- Documentation generation
- WebContainer browser-based IDE

### 📚 Other Workspaces
- Book Writing
- Data Analysis
- Research
- Content Marketing
- Healthcare Documentation
- Legal Documents

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL (Vercel Postgres)
- **ORM:** Prisma
- **Auth:** NextAuth.js (Email/Password + OAuth)
- **AI:** GLM-4.6 API
- **UI:** Tailwind CSS, Framer Motion, Lucide Icons
- **Editor:** Monaco Editor
- **Terminal:** Xterm.js
- **Storage:** Google Drive API

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Run development server
npm run dev
```

## Environment Variables

```env
# Database
DATABASE_URL="postgres://..."
DIRECT_URL="postgres://..."

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth + Drive
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# GLM API
GLM_API_KEY="..."
```

## Project Structure

```
ai-code-studio/
├── app/
│   ├── api/
│   │   ├── ai/chat/          # AI chat endpoint
│   │   ├── auth/             # NextAuth endpoints
│   │   └── security/         # Security scan APIs
│   ├── dashboard/            # Main dashboard
│   ├── login/                # Auth pages
│   └── workspace/[category]/ # Dynamic workspaces
├── components/
│   ├── chat/                 # Chat UI components
│   └── security/             # Security tools UI
├── config/
│   └── workspaces.ts         # Workspace configurations
├── lib/
│   ├── auth.ts               # Auth configuration
│   ├── prisma.ts             # Database client
│   └── security/             # Security modules
├── stores/                   # Zustand stores
├── templates/                # Report templates
└── prisma/
    └── schema.prisma         # Database schema
```

## Security Features

### Pre-Engagement Checklist
Authorization verification before any security testing.

### Vulnerability Scanning
- SQL Injection detection
- XSS testing
- Security headers analysis
- SSL/TLS configuration check
- Cookie security audit

### Social Engineering Simulation
- Email phishing campaigns
- Vishing (voice) scripts
- Smishing (SMS) templates
- USB drop scenarios
- Pretexting scenarios

### Reporting
All findings generate detailed `.md` reports with:
- Executive summary
- Technical details
- CVSS scores
- Remediation steps
- Code examples

## License

MIT
