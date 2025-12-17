# 🚀 Quick Setup Checklist

## ✅ 5-Minute Setup

### 1. Create `.env.local` file in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### 2. Run SQL script in Supabase:

1. Open Supabase dashboard → SQL Editor
2. Copy all content from `database/schema.sql`
3. Paste and click "Run"

### 3. Start the app:

```bash
npm run dev
```

### 4. Test it:

- Signup: http://localhost:3001/signup
- Login: http://localhost:3001

---

## 📍 Where to Find Your Credentials

**Supabase Dashboard:**

1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🔑 Key Features

✅ **Email/Password Signup & Login**
✅ **Google OAuth Login** (optional - needs configuration)
✅ **Automatic Profile Creation**
✅ **Route Protection** (middleware redirects unauthenticated users)
✅ **Secure Logout**
✅ **Session Management**

---

## 🛠️ Files Modified

- ✅ `lib/auth-action.ts` - Server actions for auth
- ✅ `app/page.tsx` - Login form
- ✅ `app/(auth)/signup/page.tsx` - Signup form
- ✅ `app/settings/layout.tsx` - Logout functionality
- ✅ `middleware.ts` - Route protection
- ✅ `utils/supabase/*` - Supabase clients

---

## 📊 Database Table Created

**`profiles` table:**

- `id` (uuid) - Links to auth.users
- `email` (text)
- `full_name` (text)
- `store_name` (text)
- `phone` (text)
- `avatar_url` (text)
- `is_active` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

---

## 🐛 Common Issues

**Problem:** "Invalid login credentials"
**Solution:** User doesn't exist. Try signing up first.

**Problem:** Environment variables not loading
**Solution:** Restart dev server after creating `.env.local`

**Problem:** Redirects not working
**Solution:** Clear cookies and check middleware.ts

---

## 📖 Full Documentation

See **AUTHENTICATION_SETUP.md** for complete guide.
