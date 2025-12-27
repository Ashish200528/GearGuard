# GearGuard - Maintenance Management System

A full-stack maintenance management system with **Flask backend** and **Next.js frontend**.

## ✅ Project Status

**✔️ Backend:** Flask REST API with PostgreSQL ([app.py](app.py))  
**✔️ Frontend:** Next.js/React with TypeScript  
**✔️ Database:** Complete schema with seed data ([queries.sql](queries.sql))  
**✔️ Integration:** Frontend connected to backend via API client

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL

### Step 1: Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE GearGuard;"

# Run schema (creates tables + seed data)
psql -U postgres -d GearGuard -f queries.sql
```

**Important:** Update password in [app.py](app.py) line 18 if needed.

### Step 2: Start Backend (Terminal 1)

```bash
pip install -r requirements.txt
python app.py
```
✅ Backend: **http://localhost:5000**

### Step 3: Start Frontend (Terminal 2)

```bash
npm install
npm run dev
```
✅ Frontend: **http://localhost:3000**

## 🔐 Test Accounts

**Option 1 (Recommended):**
| Email | Password | Role |
|-------|----------|------|
| admin@test.com | 123456 | Admin |
| tech@test.com | 123456 | Technician |
| user@test.com | 123456 | Employee |

**Option 2 (From seed data):**
| Email | Password | Role |
|-------|----------|------|
| admin@odoo.com | hash123 | Admin |
| marc@odoo.com | hash123 | Employee |
| joel@odoo.com | hash123 | Technician |

## Features

✨ **Complete Authentication System**
- Login & Signup pages
- Role-based access control (Admin, Technician, Employee)
- Admin secret code verification (Demo implementation)
- Email-based role detection

🎯 **Core Functionality**
- **Dashboard**: Real-time analytics and KPIs
- **Equipment Management**: Track and monitor equipment health
- **Kanban Workflow**: Drag-and-drop maintenance request management
- **Calendar View**: Schedule preventive maintenance tasks
- **Team Management**: Organize maintenance teams
- **Reporting**: Performance metrics and analytics

🎨 **Premium Design**
- Corporate color scheme with professional styling
- Responsive layout for all devices
- Smooth animations and transitions
- Premium shadows and gradients
- Consistent typography using Inter font

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: React Icons
- **State Management**: React Context API
- **Storage**: LocalStorage (Demo)

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Credentials

**Admin Account:**
- Email: `admin@gearguard.com`
- Password: `123456`
- Admin Code: `ADMIN-2025`

**Technician Account:**
- Email: `tech@gearguard.com`
- Password: `123456`
- Admin Code: `TECH-2025`

**Employee Account:**
- Email: `user@gearguard.com`
- Password: `123456`

## Authentication System

The application implements **Option 2: Admin Secret Code** as specified:

### How It Works

1. **Sign Up Flow:**
   - User enters email (role auto-detected from email pattern)
   - For Admin/Technician roles, admin secret code is required
   - Code is validated before account creation

2. **Role Detection:**
   - Emails containing "admin" → Admin role
   - Emails containing "tech" or "maintenance" → Technician role
   - All others → Employee role

3. **Secret Codes (Demo Only):**
   - Admin: `ADMIN-2025`
   - Technician: `TECH-2025`
   - Employee: No code required

⚠️ **Security Note**: This is a demo implementation. In production:
- Use backend API for authentication
- Hash passwords securely (bcrypt)
- Store secrets server-side
- Implement JWT tokens
- Add rate limiting

## Database Schema

The application follows the PostgreSQL schema provided in `queries.sql`:

### Key Tables
- `users` - User accounts with role-based access
- `equipment` - Equipment inventory with health tracking
- `maintenance_requests` - Maintenance workflow management
- `maintenance_stages` - Kanban board stages
- `equipment_categories` - Equipment categorization
- `maintenance_teams` - Team management
- `work_centers` - Work location tracking

### Data Relationships
- Equipment → Category (many-to-one)
- Equipment → Maintenance Team (many-to-one)
- Maintenance Request → Equipment (many-to-one)
- Maintenance Request → Stage (many-to-one)
- Maintenance Request → User (created by)

## Features Breakdown

### 1. Dashboard
- Critical equipment alerts
- Open request metrics
- Technician workload (for technician role)
- Recent activity feed
- Quick action buttons

### 2. Equipment Management
- Add/Edit/Delete equipment
- Health percentage tracking
- Category and team assignment
- Filter by health status
- Critical equipment highlighting

### 3. Maintenance Requests (Kanban)
- Drag-and-drop workflow
- Multi-stage pipeline (New Request → In Progress → Repaired → Scrap)
- Priority-based color coding
- Equipment and team assignment
- Scheduled date tracking

### 4. Calendar
- Monthly view with navigation
- Visual indicators for scheduled tasks
- Click to view day details
- Priority-based color dots
- Task count badges

### 5. Teams & Reporting
- Team overview
- Performance analytics
- Completion rate tracking
- Request distribution charts

## Project Structure

```
GearGuard/
├── src/
│   ├── components/
│   │   └── Layout.tsx          # Main layout with sidebar
│   ├── context/
│   │   ├── AuthContext.tsx     # Authentication state
│   │   └── AppContext.tsx      # Application state
│   ├── lib/
│   │   └── auth.ts             # Auth utilities & secret codes
│   ├── pages/
│   │   ├── index.tsx           # Landing page
│   │   ├── login.tsx           # Login page
│   │   ├── signup.tsx          # Signup with role selection
│   │   ├── dashboard.tsx       # Main dashboard
│   │   ├── equipment.tsx       # Equipment management
│   │   ├── maintenance.tsx     # Kanban board
│   │   ├── calendar.tsx        # Calendar view
│   │   ├── teams.tsx           # Team management
│   │   └── reporting.tsx       # Analytics
│   ├── styles/
│   │   └── globals.css         # Global styles & Tailwind
│   └── types/
│       └── index.ts            # TypeScript interfaces
├── public/                     # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Customization

### Colors
Edit `tailwind.config.js` to change the color scheme:
```js
theme: {
  extend: {
    colors: {
      primary: { ... },
      corporate: { ... }
    }
  }
}
```

### Admin Codes
Update codes in `src/lib/auth.ts`:
```typescript
export const ADMIN_SECRET_CODES = {
  admin: 'YOUR-ADMIN-CODE',
  technician: 'YOUR-TECH-CODE',
}
```

### Seed Data
Modify initial data in `src/context/AppContext.tsx` in the `initializeData()` function.

## Production Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables (Recommended)
Create `.env.local`:
```
NEXT_PUBLIC_ADMIN_CODE=your-secret-code
NEXT_PUBLIC_API_URL=your-backend-url
```

### Recommended Next Steps
1. Integrate with a real backend API
2. Implement proper authentication (NextAuth.js, Auth0, etc.)
3. Connect to PostgreSQL database
4. Add file upload for equipment images
5. Implement email notifications
6. Add real-time updates (WebSockets/Server-Sent Events)
7. Deploy to Vercel, Netlify, or your preferred platform

## License

This is a demonstration project for educational purposes.

## Support

For questions or issues, please create an issue in the repository.

---

**Built with ❤️ using Next.js and TypeScript**
