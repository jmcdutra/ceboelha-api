/**
 * Seed Foods Script
 *
 * Populates the MongoDB database with foods from unified_food_database.json
 *
 * Usage: bun run scripts/seed-foods.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import mongoose from 'mongoose'
import { Food } from '../src/modules/foods/food.model'
import { connectDatabase } from '../src/config/database'

// =============================================================================
// Types
// =============================================================================

interface FoodData {
  id: number
  name: string
  source: string
  category_level_1: string
  category_level_2?: string
  category_level_3?: string
  image?: string
  fodmap?: {
    level: string
    portion_note?: string
    additional_notes?: string
    search_information?: unknown
  }
  nutrition?: {
    energy_kcal: number
    energy_kj: number
    reference_portion?: string
    macronutrients?: Record<string, string>
    vitamins?: Record<string, string | null>
    minerals?: Record<string, string | null>
  }
  data_sources?: {
    nutritional_data?: string
    fodmap_data?: string
    ai_generated?: {
      is_ai_generated: boolean
      ai_source?: string
      fields_affected?: string[]
    }
  }
}

interface DatabaseFile {
  metadata: {
    database_name: string
    version: string
    creation_date: string
    total_foods: number
    foods_with_fodmap_data: number
    foods_with_nutritional_data: number
  }
  foods: FoodData[]
}

// =============================================================================
// Script
// =============================================================================

async function seedFoods() {
  console.log('🌱 Starting foods seed...\n')

  // Connect to database
  await connectDatabase()
  console.log('✅ Connected to MongoDB\n')

  // Read JSON file - use process.cwd() for better Bun compatibility
  const projectRoot = process.cwd().replace(/[\\/]ceboelha-api$/, '')
  const dataPath = join(projectRoot, 'ceboelha-data/output/unified_food_database_with_images.json')
  console.log(`📁 Reading data from: ${dataPath}`)

  let database: DatabaseFile
  try {
    const fileContent = readFileSync(dataPath, 'utf-8')
    database = JSON.parse(fileContent)
  } catch (error) {
    console.error('❌ Error reading database file:', error)
    process.exit(1)
  }

  console.log(`📊 Database: ${database.metadata.database_name}`)
  console.log(`   Version: ${database.metadata.version}`)
  console.log(`   Total foods: ${database.metadata.total_foods}`)
  console.log(`   With FODMAP data: ${database.metadata.foods_with_fodmap_data}`)
  console.log(`   With nutritional data: ${database.metadata.foods_with_nutritional_data}\n`)

  // Check if foods already exist
  const existingCount = await Food.countDocuments()
  if (existingCount > 0) {
    console.log(`⚠️  Found ${existingCount} existing foods in database.`)
    console.log('   Do you want to replace them? (This will delete all existing foods)')
    console.log('   Add --force flag to confirm.\n')

    if (!process.argv.includes('--force')) {
      console.log('❌ Seed cancelled. Use --force to replace existing data.')
      await mongoose.disconnect()
      process.exit(0)
    }

    console.log('🗑️  Deleting existing foods...')
    await Food.deleteMany({})
    console.log('✅ Existing foods deleted\n')
  }

  // Transform and insert foods
  console.log('📝 Transforming and inserting foods...')

  const foods = database.foods.map((food) => ({
    id: food.id,
    name: food.name,
    source: food.source || 'nutritional_table',
    category_level_1: food.category_level_1,
    category_level_2: food.category_level_2,
    category_level_3: food.category_level_3,
    image: food.image,
    fodmap: food.fodmap ? {
      level: food.fodmap.level,
      portion_note: food.fodmap.portion_note || null,
      additional_notes: food.fodmap.additional_notes || null,
      search_information: food.fodmap.search_information,
    } : undefined,
    nutrition: food.nutrition ? {
      energy_kcal: food.nutrition.energy_kcal,
      energy_kj: food.nutrition.energy_kj,
      reference_portion: food.nutrition.reference_portion || '100g',
      macronutrients: food.nutrition.macronutrients,
      vitamins: food.nutrition.vitamins,
      minerals: food.nutrition.minerals,
    } : undefined,
    data_sources: food.data_sources || {
      nutritional_data: 'INSA - Tabela da Composição de Alimentos (Portugal)',
    },
    searchCount: 0,
  }))

  // Insert in batches for better performance
  const BATCH_SIZE = 500
  let inserted = 0

  for (let i = 0; i < foods.length; i += BATCH_SIZE) {
    const batch = foods.slice(i, i + BATCH_SIZE)
    await Food.insertMany(batch, { ordered: false })
    inserted += batch.length
    const progress = ((inserted / foods.length) * 100).toFixed(1)
    process.stdout.write(`\r   Progress: ${inserted}/${foods.length} (${progress}%)`)
  }

  console.log('\n')

  // Create text index if not exists
  console.log('📚 Creating text indexes...')
  try {
    await Food.collection.createIndex(
      { name: 'text', category_level_1: 'text', category_level_3: 'text' },
      {
        weights: { name: 10, category_level_1: 5, category_level_3: 3 },
        default_language: 'portuguese',
        name: 'foods_text_search',
      }
    )
    console.log('✅ Text index created\n')
  } catch (error) {
    // Index might already exist
    console.log('ℹ️  Text index already exists\n')
  }

  // Verify
  const finalCount = await Food.countDocuments()
  const withFodmap = await Food.countDocuments({ fodmap: { $exists: true } })
  const withNutrition = await Food.countDocuments({ nutrition: { $exists: true } })

  console.log('📊 Final statistics:')
  console.log(`   Total foods: ${finalCount}`)
  console.log(`   With FODMAP data: ${withFodmap}`)
  console.log(`   With nutritional data: ${withNutrition}`)

  // Sample search test
  console.log('\n🔍 Testing search...')
  const searchResult = await Food.find(
    { $text: { $search: 'arroz' } },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(3)
    .select('name category_level_1 fodmap.level')
    .lean()

  console.log('   Search for "arroz":')
  searchResult.forEach((f, i) => {
    const level = (f as { fodmap?: { level: string } }).fodmap?.level || 'N/A'
    console.log(`   ${i + 1}. ${(f as { name: string }).name} (FODMAP: ${level})`)
  })

  // Disconnect
  await mongoose.disconnect()
  console.log('\n✅ Seed completed successfully!')
}

// Run
seedFoods().catch((error) => {
  console.error('❌ Seed failed:', error)
  process.exit(1)
})
