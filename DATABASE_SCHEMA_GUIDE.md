# 📊 Database Schema Visual Guide

## Table Structure

```
┌─────────────────────────────────────────────────────────┐
│                    PROFILES TABLE                        │
├─────────────────┬──────────────┬────────────────────────┤
│ Column Name     │ Type         │ Description            │
├─────────────────┼──────────────┼────────────────────────┤
│ id              │ UUID         │ Primary Key (FK)       │
│                 │              │ → auth.users(id)       │
├─────────────────┼──────────────┼────────────────────────┤
│ email           │ TEXT         │ User email (unique)    │
├─────────────────┼──────────────┼────────────────────────┤
│ full_name       │ TEXT         │ User's full name       │
├─────────────────┼──────────────┼────────────────────────┤
│ store_name      │ TEXT         │ Store/business name    │
├─────────────────┼──────────────┼────────────────────────┤
│ phone           │ TEXT         │ Contact number         │
├─────────────────┼──────────────┼────────────────────────┤
│ avatar_url      │ TEXT         │ Profile picture URL    │
├─────────────────┼──────────────┼────────────────────────┤
│ is_active       │ BOOLEAN      │ Account status         │
│                 │              │ (default: true)        │
├─────────────────┼──────────────┼────────────────────────┤
│ created_at      │ TIMESTAMP    │ Registration date      │
├─────────────────┼──────────────┼────────────────────────┤
│ updated_at      │ TIMESTAMP    │ Last update time       │
└─────────────────┴──────────────┴────────────────────────┘
```

---

## Relationship Diagram

```
┌──────────────────┐              ┌──────────────────┐
│   auth.users     │              │    profiles      │
│  (Supabase)      │              │   (Custom)       │
├──────────────────┤              ├──────────────────┤
│ id (PK)          │◄─────────────┤ id (PK, FK)      │
│ email            │              │ email            │
│ encrypted_pass   │              │ full_name        │
│ created_at       │              │ store_name       │
│ ...              │              │ phone            │
└──────────────────┘              │ avatar_url       │
                                  │ is_active        │
                                  │ created_at       │
                                  │ updated_at       │
                                  └──────────────────┘
```

---

## Automatic Trigger Flow

```
┌─────────────────────────────────────────────────────────┐
│                    SIGNUP PROCESS                        │
└─────────────────────────────────────────────────────────┘

1. User fills signup form
        ↓
2. App calls signup() server action
        ↓
3. Supabase creates user in auth.users
        ↓
4. Database trigger "on_auth_user_created" fires
        ↓
5. Trigger inserts row into profiles table
        ↓
6. User is logged in and redirected to /mainpos
```

---

## Row Level Security (RLS) Policies

```
┌─────────────────────────────────────────────────────────┐
│                    RLS POLICIES                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  SELECT (Read):                                          │
│  ✅ Users can view their own profile                    │
│  ❌ Users cannot view other users' profiles             │
│                                                          │
│  UPDATE (Edit):                                          │
│  ✅ Users can update their own profile                  │
│  ❌ Users cannot update other users' profiles           │
│                                                          │
│  INSERT (Create):                                        │
│  ✅ Allowed only if auth.uid() = id                     │
│  ✅ Automatically done by trigger on signup             │
│                                                          │
│  DELETE:                                                 │
│  ❌ No delete policy (use is_active flag instead)       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Indexes for Performance

```
┌─────────────────────────────────────────────────────────┐
│                      INDEXES                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📌 profiles_email_idx                                  │
│     → Speeds up queries by email                        │
│     → Used in login lookups                             │
│                                                          │
│  📌 profiles_created_at_idx                             │
│     → Speeds up sorting by registration date            │
│     → Used in admin dashboards                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Usage Examples

### Query User Profile (TypeScript)

```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .single();
```

### Update Profile

```typescript
const { error } = await supabase
  .from("profiles")
  .update({
    full_name: "New Name",
    phone: "+63 912 345 6789",
  })
  .eq("id", userId);
```

### Check if User is Active

```typescript
const { data } = await supabase
  .from("profiles")
  .select("is_active")
  .eq("id", userId)
  .single();

if (!data?.is_active) {
  // Account is deactivated
}
```

---

## Migration Path (If You Already Have a profiles Table)

If you already have a profiles table with different columns:

### Option 1: Add Missing Columns

```sql
ALTER TABLE profiles ADD COLUMN store_name TEXT;
ALTER TABLE profiles ADD COLUMN phone TEXT;
ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
```

### Option 2: Rename Your Table and Create New One

```sql
-- Backup existing table
ALTER TABLE profiles RENAME TO profiles_backup;

-- Run the schema.sql to create new profiles table
-- Then migrate data:
INSERT INTO profiles (id, email, full_name, avatar_url)
SELECT id, email, full_name, avatar_url FROM profiles_backup;
```

---

## Troubleshooting Common Issues

### Issue: Trigger not creating profiles

**Solution:** Check if trigger exists:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Issue: RLS blocking queries

**Solution:** Verify you're authenticated:

```typescript
const {
  data: { user },
} = await supabase.auth.getUser();
console.log("Current user:", user?.id);
```

### Issue: Updated_at not auto-updating

**Solution:** Check if trigger exists:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'set_updated_at';
```

---

## SQL Script Location

📁 **File:** `database/schema.sql`

This file contains:

- ✅ Table creation
- ✅ RLS policies
- ✅ Triggers
- ✅ Indexes
- ✅ Helper functions

**To run:** Copy & paste into Supabase SQL Editor

---

## Additional Resources

- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL Triggers**: https://www.postgresql.org/docs/current/trigger-definition.html
- **Supabase Auth**: https://supabase.com/docs/guides/auth

---

**Visual guide complete! 📊**
