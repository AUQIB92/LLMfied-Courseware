# Password Migration Guide for LLMfied

## Overview

Your authentication system has been enhanced to use bcrypt password hashing for maximum security. This guide will help you migrate any existing users with plain text passwords to secure bcrypt hashes.

## ✅ What's Already Implemented

1. **Enhanced Authentication System**: 
   - All new registrations automatically use bcrypt hashing
   - Login system handles both hashed and plain text passwords during migration
   - Automatic password migration on login for existing users

2. **Migration API Endpoints**:
   - `GET /api/migrate-passwords` - Check migration status
   - `POST /api/migrate-passwords` - Run bulk migration

3. **Backward Compatibility**:
   - Existing users can still log in with their current passwords
   - Passwords are automatically migrated to hashes when users next log in
   - No user disruption during the migration process

## 🔧 Setup Instructions

### 1. Add Environment Variable

Add this to your `.env.local` file:

```env
MIGRATION_ADMIN_KEY=your-super-secure-migration-key-here-change-this
```

**Important**: Choose a strong, unique key for security.

### 2. Check Migration Status

Visit this URL in your browser (or use curl):

```
https://your-domain.com/api/migrate-passwords?adminKey=your-super-secure-migration-key-here-change-this
```

This will show you:
- Total number of users
- How many have hashed passwords
- How many still need migration
- Sample users that need migration

### 3. Run Bulk Migration (Optional)

If you want to migrate all users immediately instead of waiting for them to log in:

**Using curl:**
```bash
curl -X POST https://your-domain.com/api/migrate-passwords \
  -H "Content-Type: application/json" \
  -d '{"adminKey":"your-super-secure-migration-key-here-change-this"}'
```

**Using a browser tool or Postman:**
- Method: POST
- URL: `https://your-domain.com/api/migrate-passwords`
- Headers: `Content-Type: application/json`
- Body: `{"adminKey":"your-super-secure-migration-key-here-change-this"}`

## 🔍 How It Works

### Automatic Migration on Login
- When a user with a plain text password logs in, the system:
  1. Verifies the password using direct comparison
  2. Immediately hashes the password with bcrypt
  3. Updates the database with the hashed password
  4. Adds a `passwordHashed: true` flag
  5. Continues with normal login flow

### Password Detection
The system automatically detects if a password is hashed by checking:
- Does it start with `$2a$`, `$2b$`, or `$2y$` (bcrypt prefixes)
- Is it exactly 60 characters long
- Does the user have a `passwordHashed: true` flag

### Database Changes
The migration adds these fields to user documents:
```javascript
{
  passwordHashed: true,           // Flag indicating password is hashed
  passwordMigratedAt: new Date(), // When the password was migrated
  updatedAt: new Date()          // Last update timestamp
}
```

## 🛡️ Security Features

1. **Admin Key Protection**: All migration endpoints require a secure admin key
2. **Safe Migration**: Original passwords are immediately replaced with hashes
3. **Error Handling**: Failed migrations don't break user accounts
4. **Audit Trail**: Migration timestamps are recorded
5. **No Downtime**: Users can continue logging in during migration

## 📊 Monitoring Migration Progress

### Check Status Anytime
```bash
curl "https://your-domain.com/api/migrate-passwords?adminKey=YOUR_KEY"
```

### Sample Response
```json
{
  "totalUsers": 150,
  "hashedUsers": 145,
  "unhashedUsers": 5,
  "migrationPercentage": 97,
  "needsMigration": true,
  "sampleUnhashedUsers": [
    {
      "email": "user@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "passwordHashed": false
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## ⚡ Quick Migration Options

### Option 1: Let Users Migrate Naturally (Recommended)
- Do nothing - passwords migrate automatically when users log in
- Zero disruption to users
- Gradual, secure migration

### Option 2: Bulk Migration (Immediate)
- Run the migration API endpoint
- All passwords migrated immediately
- Check status first to see what needs migration

### Option 3: Hybrid Approach
- Run bulk migration for most users
- Let remaining users migrate on next login
- Best of both worlds

## 🔧 Troubleshooting

### Error: "Unauthorized"
- Check your `MIGRATION_ADMIN_KEY` in `.env.local`
- Ensure the key matches in your API call

### Error: "Migration failed"
- Check your MongoDB connection
- Verify database permissions
- Check server logs for detailed error messages

### Some Users Not Migrating
- Users with already-hashed passwords are skipped (this is correct)
- Check the `passwordHashed` field in your database
- Review the migration status response for details

## 📝 Best Practices

1. **Test First**: Try the status check endpoint before running migration
2. **Backup Database**: Always backup before bulk operations
3. **Monitor Logs**: Watch server logs during migration
4. **Secure Admin Key**: Use a strong, unique admin key
5. **Remove Admin Key**: Consider removing the admin key after migration is complete

## 🎯 Post-Migration

After all users are migrated:
1. All new passwords are automatically hashed
2. All existing passwords are securely hashed
3. User login experience remains unchanged
4. Your application is more secure

## 🚨 Important Notes

- **No User Impact**: Users don't need to change passwords
- **Seamless Experience**: Login process unchanged for users
- **One-Time Process**: Each password is migrated only once
- **Safe to Re-run**: Migration script can be run multiple times safely
- **Production Ready**: System handles errors gracefully

Your password security is now enterprise-grade! 🔐