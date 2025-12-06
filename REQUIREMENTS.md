# AI Code Studio - Requirements Document

## Overview
Dokumen ini berisi daftar perbaikan dan fitur baru yang perlu diimplementasikan.

---

## 1. FIX: AI Create File → Sync ke FileStore

### Problem
- AI memiliki tool `create_file` yang bisa dipanggil
- Namun hasil dari tool ini tidak di-sync ke `fileStore`
- Akibatnya file tidak muncul di Editor dan Preview tidak bisa tampil

### Solution
- Modifikasi `chatStore.ts` untuk handle `create_file` tool result
- Ketika AI memanggil `create_file`, otomatis panggil `useFileStore.addFile()`
- File langsung muncul di File Explorer dan bisa di-preview

### Files to Modify
- `stores/chatStore.ts` - Handle tool result untuk create_file
- `components/chat/Chat.tsx` - Import dan gunakan fileStore

### Expected Behavior
1. User minta AI: "Buatkan halaman HTML dengan CSS"
2. AI panggil tool `create_file` untuk index.html
3. AI panggil tool `create_file` untuk style.css
4. File otomatis muncul di File Explorer (sidebar kiri)
5. Preview otomatis menampilkan hasil HTML+CSS

---

## 2. Halaman Admin yang Kosong

### Problem
Halaman-halaman admin berikut belum dibuat:
- `/admin/analytics` - Analytics dashboard
- `/admin/security` - Security management
- `/admin/settings` - Admin settings
- `/admin/subscriptions` - Subscription management

### Requirements

#### 2.1 Admin Analytics Page (`/admin/analytics`)
**Fitur:**
- Chart user growth (line chart)
- Chart revenue (bar chart)
- Chart token usage (area chart)
- Top users by usage
- Conversion rate metrics
- Filter by date range (7d, 30d, 90d, 1y)
- Export data button

**Metrics to Display:**
- Daily/Weekly/Monthly Active Users
- New signups over time
- Revenue breakdown by plan
- Token consumption trends
- Feature usage statistics

#### 2.2 Admin Security Page (`/admin/security`)
**Fitur:**
- Login attempts log (success/failed)
- Suspicious activity alerts
- Active sessions management
- IP whitelist/blacklist
- 2FA enforcement settings
- API key management
- Audit log viewer
- Security score/health check

**Sections:**
1. Security Overview (score, alerts count)
2. Recent Security Events (table)
3. Active Sessions (with revoke option)
4. Security Settings (2FA, password policy)
5. Audit Logs (searchable, filterable)

#### 2.3 Admin Settings Page (`/admin/settings`)
**Fitur:**
- General settings (app name, logo, etc)
- Email configuration (SMTP settings)
- AI model configuration
- Rate limiting settings
- Feature flags/toggles
- Maintenance mode toggle
- Backup & restore
- System information

**Sections:**
1. General Settings
2. Email Settings
3. AI Configuration
4. Security Settings
5. Advanced Settings
6. System Info

#### 2.4 Admin Subscriptions Page (`/admin/subscriptions`)
**Fitur:**
- List semua subscriptions
- Filter by status (active, cancelled, expired, trial)
- Filter by plan
- Subscription details (user, plan, dates, amount)
- Revenue summary
- Cancel/refund actions
- Create manual subscription
- Subscription analytics

**Columns:**
- User (name, email)
- Plan
- Status
- Start Date
- End Date / Next Billing
- Amount
- Actions

---

## 3. User Page - Subscription Info

### Problem
- User page tidak menampilkan sisa hari subscription
- Tidak ada info trial days remaining
- Status subscription kurang jelas

### Solution
Tambahkan kolom dan info:
- **Days Remaining**: Sisa hari subscription (e.g., "23 days left")
- **Trial Status**: Jika trial, tampilkan "Trial - 7 days left"
- **Expired Warning**: Jika expired, tampilkan warning badge
- **Never Subscribed**: Tampilkan "No subscription"

### UI Enhancements
- Progress bar untuk subscription days
- Color coding:
  - Green: > 14 days
  - Yellow: 7-14 days
  - Red: < 7 days
  - Gray: Expired/No subscription

### Files to Modify
- `app/admin/users/page.tsx`

---

## 4. Industry-Specific Sidebar untuk Workspace

### Problem
- Workspace tidak memiliki sidebar navigasi per industri
- User kesulitan menemukan fitur-fitur spesifik industri
- Semua tools tercampur di satu tempat

### Solution
Buat sidebar component yang berbeda untuk setiap industri/workspace.

### 4.1 Cybersecurity Sidebar
**Menu Items:**
- 🏠 Dashboard
- 🔍 Reconnaissance
  - Subdomain Finder
  - Port Scanner
  - WHOIS Lookup
- 🛡️ Vulnerability Scanner
  - Web Scanner
  - Network Scanner
  - API Scanner
- 📝 Reports
  - Scan History
  - Generate Report
  - Templates
- 🧮 Tools
  - CVSS Calculator
  - Hash Generator
  - Encoder/Decoder
- 🎭 Social Engineering
  - Phishing Simulator
  - Awareness Training
- ⚙️ Settings

### 4.2 Software Development Sidebar
**Menu Items:**
- 🏠 Dashboard
- 📁 Projects
  - My Projects
  - Templates
  - Import
- 💻 Code
  - Editor
  - Terminal
  - Preview
- 🔧 Tools
  - Debugger
  - Formatter
  - Linter
- 📦 Dependencies
  - Package Manager
  - Updates
- 🚀 Deploy
  - Build
  - Deploy History
- ⚙️ Settings

### 4.3 Book Writing Sidebar
**Menu Items:**
- 🏠 Dashboard
- 📚 My Books
  - All Books
  - Drafts
  - Published
- ✍️ Write
  - New Chapter
  - Outline
  - Notes
- 👥 Characters
  - Character List
  - Character Builder
- 🗺️ World Building
  - Locations
  - Timeline
- 📊 Analytics
  - Word Count
  - Progress
- ⚙️ Settings

### 4.4 Data Analysis Sidebar
**Menu Items:**
- 🏠 Dashboard
- 📊 Datasets
  - My Data
  - Import
  - Sample Data
- 📈 Analysis
  - Explore
  - Visualize
  - Statistics
- 🤖 ML Models
  - Train
  - Evaluate
  - Deploy
- 📝 Reports
  - Create
  - Templates
- ⚙️ Settings

### 4.5 Generic Sidebar (untuk industri lain)
**Menu Items:**
- 🏠 Dashboard
- 📁 Projects
- 💬 AI Chat
- 📝 Notes
- 📊 Analytics
- ⚙️ Settings

### Implementation
- Buat component `WorkspaceSidebar.tsx`
- Sidebar config per workspace di `config/workspaceSidebars.ts`
- Integrate ke `app/workspace/[category]/page.tsx`

---

## 5. UI/UX Improvements

### 5.1 Workspace Layout
- Sidebar collapsible (toggle)
- Responsive design (mobile friendly)
- Breadcrumb navigation
- Quick action shortcuts

### 5.2 Admin User Table
- Better pagination
- Sortable columns
- Bulk actions
- Quick search
- Inline editing

### 5.3 General
- Loading skeletons
- Error boundaries
- Toast notifications
- Confirmation modals

---

## Implementation Priority

### Phase 1 (Critical)
1. ✅ Fix AI create_file → fileStore sync
2. ✅ Industry-specific sidebar

### Phase 2 (High)
3. ✅ Admin Analytics page
4. ✅ Admin Subscriptions page
5. ✅ User subscription days info

### Phase 3 (Medium)
6. ✅ Admin Security page
7. ✅ Admin Settings page

### Phase 4 (Low)
8. ✅ UI/UX improvements

---

## File Structure (New Files)

```
app/
├── admin/
│   ├── analytics/
│   │   └── page.tsx          # NEW
│   ├── security/
│   │   └── page.tsx          # NEW
│   ├── settings/
│   │   └── page.tsx          # NEW
│   └── subscriptions/
│       └── page.tsx          # NEW

components/
├── workspace/
│   └── WorkspaceSidebar.tsx  # NEW

config/
└── workspaceSidebars.ts      # NEW
```

---

## Technical Notes

### Dependencies (sudah ada)
- React 18
- Next.js 14
- Tailwind CSS
- Framer Motion
- Lucide Icons
- Zustand (state management)
- Monaco Editor

### Tidak perlu install tambahan
Semua UI component dibuat manual dengan Tailwind CSS.

---

## Estimated Timeline

| Task | Estimated Time |
|------|---------------|
| Fix create_file sync | 30 min |
| Workspace Sidebar | 1 hour |
| Admin Analytics | 1 hour |
| Admin Subscriptions | 45 min |
| Admin Security | 1 hour |
| Admin Settings | 45 min |
| User subscription info | 30 min |
| **Total** | **~6 hours** |

---

## Acceptance Criteria

### 1. AI Create File
- [ ] AI dapat membuat file yang langsung muncul di File Explorer
- [ ] File HTML dapat di-preview langsung
- [ ] Multiple files dapat dibuat sekaligus

### 2. Admin Pages
- [ ] Semua halaman admin dapat diakses
- [ ] Data ditampilkan dengan benar (demo data jika API belum ready)
- [ ] Filter dan search berfungsi
- [ ] Responsive di mobile

### 3. User Subscription Info
- [ ] Kolom "Days Remaining" muncul di tabel user
- [ ] Status trial/expired/active ditampilkan dengan warna berbeda
- [ ] Progress bar untuk subscription

### 4. Workspace Sidebar
- [ ] Setiap workspace memiliki sidebar yang relevan
- [ ] Sidebar dapat di-collapse
- [ ] Menu items sesuai dengan industri
- [ ] Active state terlihat jelas

---

*Document Version: 1.0*
*Created: 2024*
