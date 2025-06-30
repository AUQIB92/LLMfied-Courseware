#!/usr/bin/env node

/**
 * Password Migration Script for LLMfied
 * 
 * This script migrates existing users' plain text passwords to bcrypt hashes.
 * Run this script once to ensure all existing users have secure password hashes.
 * 
 * Usage:
 *   node scripts/migrate-passwords.js
 * 
 * Environment Variables Required:
 *   - MIGRATION_ADMIN_KEY: A secure key for authentication
 *   - All your normal database connection variables
 */

const readline = require('readline')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

async function runMigration() {
  console.log(colorize('\n🔐 LLMfied Password Migration Tool', 'cyan'))
  console.log(colorize('=====================================', 'cyan'))
  
  // Check environment variables
  if (!process.env.MIGRATION_ADMIN_KEY) {
    console.log(colorize('\n❌ Error: MIGRATION_ADMIN_KEY environment variable not set', 'red'))
    console.log(colorize('Please set a secure admin key in your .env.local file:', 'yellow'))
    console.log(colorize('MIGRATION_ADMIN_KEY=your-secure-key-here', 'yellow'))
    process.exit(1)
  }

  try {
    // First, check migration status
    console.log(colorize('\n📊 Checking current migration status...', 'blue'))
    
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const statusResponse = await fetch(`${baseUrl}/api/migrate-passwords?adminKey=${process.env.MIGRATION_ADMIN_KEY}`)
    
    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status} ${statusResponse.statusText}`)
    }
    
    const status = await statusResponse.json()
    
    console.log(colorize('\n📈 Current Status:', 'green'))
    console.log(`   Total Users: ${colorize(status.totalUsers, 'bright')}`)
    console.log(`   Hashed Passwords: ${colorize(status.hashedUsers, 'green')}`)
    console.log(`   Plain Text Passwords: ${colorize(status.unhashedUsers, 'red')}`)
    console.log(`   Migration Progress: ${colorize(status.migrationPercentage + '%', 'cyan')}`)
    
    if (status.unhashedUsers === 0) {
      console.log(colorize('\n✅ All users already have hashed passwords! No migration needed.', 'green'))
      return
    }
    
    console.log(colorize('\n🔍 Sample users that need migration:', 'yellow'))
    status.sampleUnhashedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (created: ${user.createdAt})`)
    })
    
    // Ask for confirmation
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    const answer = await new Promise((resolve) => {
      rl.question(colorize('\n❓ Do you want to proceed with the migration? (y/N): ', 'yellow'), resolve)
    })
    
    rl.close()
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log(colorize('\n❌ Migration cancelled.', 'yellow'))
      return
    }
    
    // Run migration
    console.log(colorize('\n🚀 Starting password migration...', 'blue'))
    
    const migrationResponse = await fetch(`${baseUrl}/api/migrate-passwords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminKey: process.env.MIGRATION_ADMIN_KEY
      })
    })
    
    if (!migrationResponse.ok) {
      throw new Error(`Migration failed: ${migrationResponse.status} ${migrationResponse.statusText}`)
    }
    
    const result = await migrationResponse.json()
    
    if (result.success) {
      console.log(colorize('\n✅ Migration completed successfully!', 'green'))
      console.log(colorize('\n📊 Migration Results:', 'cyan'))
      console.log(`   Users Checked: ${colorize(result.totalUsersChecked, 'bright')}`)
      console.log(`   Passwords Migrated: ${colorize(result.migratedCount, 'green')}`)
      console.log(`   Already Hashed (Skipped): ${colorize(result.skippedCount, 'yellow')}`)
      console.log(`   Errors: ${colorize(result.errorCount, 'red')}`)
      
      if (result.errorCount > 0 && result.errors) {
        console.log(colorize('\n⚠️  Errors encountered:', 'red'))
        result.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.email}: ${error.error}`)
        })
      }
      
      console.log(colorize('\n🎉 All done! Your users\' passwords are now securely hashed.', 'green'))
    } else {
      console.log(colorize('\n❌ Migration failed:', 'red'))
      console.log(colorize(result.error, 'red'))
      if (result.details) {
        console.log(colorize(`Details: ${result.details}`, 'yellow'))
      }
    }
    
  } catch (error) {
    console.log(colorize('\n❌ Migration script error:', 'red'))
    console.log(colorize(error.message, 'red'))
    
    if (error.message.includes('fetch is not defined')) {
      console.log(colorize('\n💡 Tip: Make sure you\'re running Node.js 18+ or install node-fetch', 'yellow'))
    }
    
    process.exit(1)
  }
}

// Add fetch polyfill for older Node.js versions
if (typeof fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch')
  } catch (e) {
    console.log(colorize('❌ fetch is not available. Please install node-fetch or use Node.js 18+', 'red'))
    process.exit(1)
  }
}

// Run the migration
runMigration().catch(error => {
  console.log(colorize('\n❌ Unexpected error:', 'red'))
  console.log(colorize(error.message, 'red'))
  process.exit(1) 