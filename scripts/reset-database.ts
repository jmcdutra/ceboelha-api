/**
 * Reset Database Script
 *
 * Limpa todas as collections do MongoDB e opcionalmente re-executa os seeds.
 *
 * Usage:
 *   bun run scripts/reset-database.ts           # Limpa tudo
 *   bun run scripts/reset-database.ts --seed    # Limpa e re-seed (foods, achievements, news)
 *   bun run scripts/reset-database.ts --keep-foods  # Mantém foods (demora pra seed)
 */

/// <reference types="bun-types" />

import mongoose from 'mongoose'
import { env } from '../src/config/env'

// Import models to ensure they're registered
import '../src/modules/users/user.model'
import '../src/modules/diary/diary.model'
import '../src/modules/problematic-foods/problematic-food.model'
import '../src/modules/news/news.model'
import '../src/modules/achievements/achievement.model'
import '../src/modules/achievements/user-achievement.model'
import '../src/modules/foods/food.model'
import '../src/modules/auth/refresh-token.model'
import '../src/modules/auth/login-attempt.model'

// =============================================================================
// Collections to clean
// =============================================================================

const COLLECTIONS = {
  // User data
  users: 'users',
  refreshtokens: 'refreshtokens',
  
  // Diary
  diaryentries: 'diaryentries',
  problematicfoods: 'problematicfoods',
  
  // Achievements
  achievements: 'achievements',
  userachievements: 'userachievements',
  
  // News
  newsarticles: 'newsarticles',
  
  // Foods (base de dados - demora pra seed)
  foods: 'foods',
}

// =============================================================================
// Main
// =============================================================================

async function resetDatabase() {
  const args = process.argv.slice(2)
  const shouldSeed = args.includes('--seed')
  const keepFoods = args.includes('--keep-foods')

  console.log('\n🗑️  RESET DATABASE - Ceboelha API\n')
  console.log('=' .repeat(50))

  // Connect to MongoDB
  console.log('\n📡 Conectando ao MongoDB...')
  await mongoose.connect(env.MONGODB_URI)
  console.log('✅ Conectado!\n')

  const db = mongoose.connection.db
  if (!db) {
    throw new Error('Database connection not established')
  }

  // Get list of existing collections
  const existingCollections = await db.listCollections().toArray()
  const existingNames = existingCollections.map(c => c.name)

  console.log('📋 Collections encontradas:', existingNames.join(', '))
  console.log('')

  // Clean each collection
  let cleaned = 0
  let skipped = 0

  for (const [name, collectionName] of Object.entries(COLLECTIONS)) {
    // Skip foods if --keep-foods flag
    if (keepFoods && name === 'foods') {
      console.log(`⏭️  ${collectionName} - MANTIDO (--keep-foods)`)
      skipped++
      continue
    }

    if (existingNames.includes(collectionName)) {
      const result = await db.collection(collectionName).deleteMany({})
      console.log(`🧹 ${collectionName} - ${result.deletedCount} documentos removidos`)
      cleaned++
    } else {
      console.log(`⚪ ${collectionName} - não existe`)
    }
  }

  console.log('')
  console.log('=' .repeat(50))
  console.log(`\n✨ Limpeza concluída! ${cleaned} collections limpas, ${skipped} mantidas.\n`)

  // Re-seed if requested
  if (shouldSeed) {
    console.log('🌱 Re-executando seeds...\n')
    
    // Seed foods (se não foi mantido)
    if (!keepFoods) {
      console.log('📦 Seeding foods...')
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      
      try {
        await execAsync('bun run scripts/seed-foods.ts', { cwd: process.cwd() })
        console.log('✅ Foods seeded!')
      } catch (err) {
        console.log('⚠️  Erro ao seed foods (pode não ter o script)')
      }
    }

    // Seed achievements
    console.log('🏆 Seeding achievements...')
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      await execAsync('bun run scripts/seed-achievements.ts --force', { cwd: process.cwd() })
      console.log('✅ Achievements seeded!')
    } catch (err) {
      console.log('⚠️  Erro ao seed achievements')
    }

    // Seed news
    console.log('📰 Seeding news...')
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      await execAsync('bun run scripts/seed-news.ts --force', { cwd: process.cwd() })
      console.log('✅ News seeded!')
    } catch (err) {
      console.log('⚠️  Erro ao seed news')
    }

    console.log('\n🎉 Todos os seeds executados!')
  }

  // Disconnect
  await mongoose.disconnect()
  console.log('\n👋 Desconectado do MongoDB. Banco resetado com sucesso!\n')
}

// Run
resetDatabase().catch((error) => {
  console.error('\n❌ Erro ao resetar banco:', error.message)
  process.exit(1)
})
