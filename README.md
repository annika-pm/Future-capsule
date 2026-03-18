# FutureCapsule

A time capsule application that allows users to create messages for their future selves, with secure unlock dates and mood tracking.

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd futurecapsule
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the database migrations from `SUPABASE_DATABASE_SCHEMA.md`
   - Configure Row Level Security policies
   - Set up Google OAuth authentication

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 📋 Features

- **Time Capsules**: Create messages with future unlock dates
- **Secure Storage**: Messages are hidden until unlock date
- **Authentication**: Email/password and Google OAuth
- **Mood Tracking**: Track emotional state over time
- **Insights Dashboard**: Visualize mood patterns and trends
- **Responsive Design**: Works on desktop and mobile

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel
- **Monorepo**: Nx workspace

### Database Schema
- **Users**: Extended auth.users with profile information
- **Capsules**: Time-locked messages with mood tracking
- **Mood Stats**: Analytics data for insights

### Security
- Row Level Security (RLS) policies
- JWT authentication
- Server-side unlock validation
- No client-side data exposure

## 🔧 Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Environment Setup
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run type-check   # Run TypeScript checks
npm test            # Run tests
npm run e2e         # Run E2E tests
```

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set the build command: `npx nx build future-capsule`
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on git push

### Environment Variables (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_ENVIRONMENT=production
```

## 📚 Documentation

- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference
- **[Database Schema](SUPABASE_DATABASE_SCHEMA.md)** - PostgreSQL schema and migrations
- **[Authentication Flow](SUPABASE_AUTHENTICATION_FLOW.md)** - Auth implementation details
- **[Frontend Migration](SUPABASE_FRONTEND_MIGRATION.md)** - Migration from Firebase guide

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run e2e
```

### Test Coverage
- Unit tests for business logic
- Component tests for React components
- E2E tests for user workflows
- Security tests for authentication and authorization

## 🔒 Security

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Row Level Security policies
- **Data Protection**: Server-side validation, no client exposure
- **HTTPS**: Enforced in production
- **Input Validation**: Comprehensive validation on all inputs

## 📊 Performance

- **API Response Time**: < 500ms
- **Page Load Time**: < 3 seconds
- **Bundle Size**: ~300KB initial load
- **Database Queries**: Optimized with proper indexing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or issues:
- Check the [API Documentation](API_DOCUMENTATION.md)
- Review the [Troubleshooting Guide](SUPABASE_FRONTEND_MIGRATION.md)
- Open an issue on GitHub

---

**Built with ❤️ using Next.js, Supabase, and Vercel**</content>
<parameter name="filePath">README.md