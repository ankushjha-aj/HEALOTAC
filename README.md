# 🏥 CURACADET

A modern, responsive web application for managing medical records of Indian Army cadets. Built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Authentication System**: Secure login with role-based access control
- **Dashboard Overview**: Real-time statistics and recent medical records
- **Cadet Management**: Complete CRUD operations for cadet records
- **Medical History Timeline**: Visual timeline of medical events for each cadet
- **Medical Record Entry**: Comprehensive forms for adding new medical records
- **Reports & Analytics**: Generate detailed reports with charts and statistics
- **Dark Mode Support**: Toggle between light and dark themes
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Runtime**: Node.js 24
- **Package Manager**: npm/yarn/pnpm

## 📋 Prerequisites

- Node.js 20+ (Recommended: Node.js 24)
- npm, yarn, or pnpm package manager
- Git

## 🔧 Installation

1. **Clone the repository**
   ```bash
   cd /Users/ankushjha/Desktop/mirroom_backup
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Demo Credentials

- **Username**: `admin`
- **Password**: `admin123`

## 📁 Project Structure

```
mirroom_backup/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── dashboard/          # Dashboard page
│   │   ├── cadets/            # Cadet management
│   │   ├── medical-history/   # Medical history views
│   │   ├── medical-records/   # Medical record forms
│   │   ├── reports/           # Reports and analytics
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Login page
│   ├── components/            # Reusable components
│   │   └── layout/           # Layout components
│   │       ├── DashboardLayout.tsx
│   │       ├── Header.tsx
│   │       └── Sidebar.tsx
│   └── types/                # TypeScript type definitions
│       └── index.ts
├── public/                   # Static assets
├── .eslintrc.json           # ESLint configuration
├── next.config.mjs          # Next.js configuration
├── package.json             # Dependencies
├── postcss.config.js        # PostCSS configuration
├── tailwind.config.ts       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## 🎨 Features Overview

### 1. **Login Page**
- Secure authentication
- Remember me functionality
- Clean, modern design

### 2. **Dashboard**
- Key statistics cards
- Recent medical records table
- Quick actions for adding records
- Search and filter capabilities

### 3. **Cadet Records**
- Comprehensive list of all cadets
- Advanced search and filtering
- Quick actions (view, edit, delete)
- Health status indicators

### 4. **Medical History**
- Individual cadet medical timeline
- Detailed health information
- Visual status indicators
- Complete medical event history

### 5. **Add Medical Record**
- Multi-section form
- Required field validation
- Treatment and medication tracking
- Administrative information

### 6. **Reports**
- Statistical overview
- Customizable date ranges
- Export functionality
- Visual charts and graphs

## 🚢 Deployment

### Build for Production
```bash
npm run build
# or
yarn build
```

### Start Production Server
```bash
npm start
# or
yarn start
```

### Deploy to Vercel (Recommended)
```bash
npx vercel
# or
yarn vercel
```

## 🔄 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🎯 Future Enhancements

- [ ] Backend API integration
- [ ] Database connectivity (PostgreSQL/MongoDB)
- [ ] Real-time notifications
- [ ] File upload for medical documents
- [ ] Advanced reporting with PDF export
- [ ] Multi-language support
- [ ] Audit logging
- [ ] Role-based permissions
- [ ] Email notifications
- [ ] Mobile app version

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is for CURACADET. All rights reserved.

## 📧 Contact

For any queries or support, please contact the development team.

---

**Note**: This is currently a frontend-only application with mock data. Backend integration is planned for future releases.
