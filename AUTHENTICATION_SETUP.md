# ShopSmart POS - Supabase Authentication Setup

## 🚀 Quick Start Guide

This guide will help you set up Supabase authentication for your ShopSmart POS system.

---

## 📋 Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js installed
- Your project dependencies installed (`npm install`)

---

## 1️⃣ Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in your project details:
   - **Name**: ShopSmart POS
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your location
4. Click **"Create new project"** (this takes ~2 minutes)

---

## 2️⃣ Set Up Database Schema

### Run the SQL Script

1. In your Supabase dashboard, navigate to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the file `database/schema.sql` in this project
4. **Copy the entire contents** of the SQL file
5. **Paste** it into the Supabase SQL Editor
6. Click **"Run"** or press `Ctrl+Enter`

This creates:

- ✅ `profiles` table with user information
- ✅ Row Level Security (RLS) policies
- ✅ Automatic profile creation trigger on signup
- ✅ Database indexes for performance

### Verify the Setup

1. Go to **Table Editor** (left sidebar)
2. You should see a new table called **"profiles"**
3. Click on it to verify the columns:
   - `id` (uuid, primary key)
   - `email` (text)
   - `full_name` (text)
   - `store_name` (text)
   - `phone` (text)
   - `avatar_url` (text)
   - `is_active` (boolean)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

---

## 3️⃣ Configure Environment Variables

### Get Your Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. You'll find two important values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Create .env.local File

1. In your project root, create a file named `.env.local`
2. Add the following (replace with your actual values):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

⚠️ **Important**: Never commit `.env.local` to git! It's already in `.gitignore`.

---

## 4️⃣ Configure Authentication Settings (Optional)

### Email Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. **Email** is enabled by default
3. Under **Email Auth**, you can configure:
   - **Confirm email**: Toggle on/off (recommended: OFF for development)
   - **Secure email change**: Toggle on/off

### Google OAuth (Optional)

If you want to enable "Log In Using Gmail":

1. Go to **Authentication** → **Providers**
2. Click on **Google**
3. Enable the provider
4. Add your Google OAuth credentials:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)
5. Add authorized redirect URL in Google Cloud Console:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```

---

## 5️⃣ Test the Authentication

### Start Your Development Server

```bash
npm run dev
```

### Test Signup

1. Open [http://localhost:3001/signup](http://localhost:3001/signup)
2. Fill in the form:
   - First Name
   - Last Name
   - Email
   - Password (at least 8 characters)
   - Confirm Password
3. Click **"Create Account"**
4. You should be redirected to `/mainpos`

### Verify in Supabase

1. Go to **Authentication** → **Users** in Supabase dashboard
2. You should see your new user listed
3. Go to **Table Editor** → **profiles**
4. You should see a profile row with your information

### Test Login

1. Open [http://localhost:3001](http://localhost:3001)
2. Enter your email and password
3. Click **"Log in"**
4. You should be redirected to `/mainpos`

### Test Logout

1. Navigate to **Settings** (from mainpos)
2. Click **"Log Out"** at the bottom of the sidebar
3. Confirm the logout
4. You should be redirected back to login page

---

## 🔒 Security Features Implemented

### Row Level Security (RLS)

- ✅ Users can only read their own profile
- ✅ Users can only update their own profile
- ✅ Profiles are automatically created on signup

### Route Protection

- ✅ Unauthenticated users are redirected to login
- ✅ Authenticated users can't access login page (redirected to /mainpos)
- ✅ Session is automatically refreshed by middleware

### Protected Routes

The following routes require authentication:

- `/mainpos`
- `/settings`
- `/analytics`
- `/inventory`
- `/transactionhistory`
- `/payment`

---

## 📁 File Structure

```
batch-2025-smart-shop-web/
├── app/
│   ├── (auth)/
│   │   └── signup/
│   │       └── page.tsx              # Signup form (updated)
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts              # OAuth callback handler
│   ├── settings/
│   │   └── layout.tsx                # Settings with logout (updated)
│   └── page.tsx                      # Login page (updated)
├── database/
│   └── schema.sql                    # Database setup SQL
├── lib/
│   └── auth-action.ts                # Server actions for auth
├── utils/
│   └── supabase/
│       ├── client.ts                 # Client-side Supabase client
│       ├── server.ts                 # Server-side Supabase client
│       └── middleware.ts             # Session management
├── middleware.ts                     # Route protection
├── .env.local                        # Your environment variables (create this)
└── .env.example                      # Template for environment variables
```

---

## 🐛 Troubleshooting

### "Invalid login credentials"

- ✅ Check email and password are correct
- ✅ Make sure user exists in Supabase dashboard
- ✅ Check if email confirmation is required (turn off for development)

### "User profile not found"

- ✅ Verify the database trigger is set up correctly
- ✅ Check profiles table in Supabase dashboard
- ✅ Try creating a new user to test the trigger

### Redirects not working

- ✅ Clear browser cache and cookies
- ✅ Check middleware.ts is properly configured
- ✅ Verify NEXT_PUBLIC_SITE_URL in .env.local

### Environment variables not loading

- ✅ Make sure file is named `.env.local` (not `.env`)
- ✅ Restart your development server after creating/editing .env.local
- ✅ Check for syntax errors in .env.local (no quotes needed)

---

## 📚 Server Actions Available

### `signup(formData: FormData)`

Creates a new user account and profile.

**FormData fields:**

- `firstName` - User's first name
- `lastName` - User's last name
- `email` - User's email
- `password` - User's password
- `storeName` (optional) - Store name
- `phone` (optional) - Phone number

**Returns:** `{ error?: string }` or redirects to `/mainpos`

---

### `login(formData: FormData)`

Authenticates user with email and password.

**FormData fields:**

- `email` - User's email
- `password` - User's password

**Returns:** `{ error?: string }` or redirects to `/mainpos`

---

### `signout()`

Signs out the current user.

**Returns:** Redirects to `/`

---

### `signInWithGoogle()`

Initiates Google OAuth flow.

**Returns:** Redirects to Google sign-in

---

### `getUserProfile()`

Gets the current user's profile data.

**Returns:** `{ error: string | null, user: User | null, profile: Profile | null }`

---

## 🎨 Customization

### Add More Profile Fields

1. Add column to profiles table in Supabase:

   ```sql
   ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'cashier';
   ```

2. Update the trigger in `database/schema.sql` to include the new field

3. Update TypeScript types as needed

### Customize Redirect Paths

Edit `utils/supabase/middleware.ts` to change redirect behavior:

```typescript
// Redirect authenticated users to different page
if (user && request.nextUrl.pathname === "/") {
  redirectUrl.pathname = "/dashboard"; // Change this
  return NextResponse.redirect(redirectUrl);
}
```

---

## 🚀 Production Deployment

### Update Environment Variables

When deploying to production (Vercel, Netlify, etc.):

1. Add these environment variables in your hosting platform:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

2. Update allowed redirect URLs in Supabase:
   - Go to **Authentication** → **URL Configuration**
   - Add your production domain to **Site URL**
   - Add redirect URLs to **Redirect URLs**

---

## ✅ Next Steps

1. ✨ Customize the profiles table with your specific needs
2. 🎨 Add password reset functionality
3. 👤 Add user profile editing page
4. 📧 Set up email templates in Supabase
5. 🔐 Enable two-factor authentication (optional)

---

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review Supabase logs in the dashboard
3. Check browser console for errors
4. Verify all environment variables are set correctly

---

**Happy coding! 🎉**
