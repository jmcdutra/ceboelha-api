/**
 * Seed Achievements - Populate database with achievement definitions
 *
 * Run: bun run scripts/seed-achievements.ts
 */

import mongoose from 'mongoose'
import { env } from '../src/config/env'
import { Achievement } from '../src/modules/achievements/achievement.model'

const achievements = [
  // ===========================================================================
  // 👋 BEM-VINDA (Special Category - Primeiro acesso)
  // ===========================================================================
  {
    id: 'welcome',
    title: 'Bem-vinda!',
    description: 'Faça seu primeiro login no Ceboelha',
    icon: '👋',
    color: '#E91E63',
    category: 'special',
    requirement: {
      type: 'count',
      target: 1,
      metric: 'first_login',
    },
    reward: {
      points: 25,
      badge: '🎉',
    },
    rarity: 'common',
    hidden: false,
    active: true,
    order: 0,
  },

  // ===========================================================================
  // 🍽️ REFEIÇÕES (Diary Category)
  // ===========================================================================
  {
    id: 'first_meal',
    title: 'Primeira Refeição',
    description: 'Registre sua primeira refeição no diário',
    icon: '🍽️',
    color: '#4CAF50',
    category: 'diary',
    requirement: {
      type: 'count',
      target: 1,
      metric: 'meals_logged',
    },
    reward: {
      points: 50,
      badge: '🌱',
    },
    rarity: 'common',
    hidden: false,
    active: true,
    order: 1,
  },
  {
    id: 'meals_10',
    title: 'Desbravadora',
    description: 'Registre 10 refeições no seu diário',
    icon: '🥗',
    color: '#8BC34A',
    category: 'diary',
    requirement: {
      type: 'count',
      target: 10,
      metric: 'meals_logged',
    },
    reward: {
      points: 100,
      badge: '🌿',
    },
    rarity: 'common',
    hidden: false,
    active: true,
    order: 2,
  },
  {
    id: 'meals_50',
    title: 'Dedicada',
    description: 'Registre 50 refeições no seu diário',
    icon: '🍛',
    color: '#CDDC39',
    category: 'diary',
    requirement: {
      type: 'count',
      target: 50,
      metric: 'meals_logged',
    },
    reward: {
      points: 250,
      badge: '🌳',
    },
    rarity: 'rare',
    hidden: false,
    active: true,
    order: 3,
  },
  {
    id: 'meals_100',
    title: 'Mestra do Diário',
    description: 'Registre 100 refeições no seu diário',
    icon: '👩‍🍳',
    color: '#FFC107',
    category: 'diary',
    requirement: {
      type: 'count',
      target: 100,
      metric: 'meals_logged',
    },
    reward: {
      points: 500,
      badge: '🏆',
    },
    rarity: 'epic',
    hidden: false,
    active: true,
    order: 4,
  },
  {
    id: 'meals_500',
    title: 'Lenda do Diário',
    description: 'Registre 500 refeições no seu diário',
    icon: '🌟',
    color: '#FF9800',
    category: 'diary',
    requirement: {
      type: 'count',
      target: 500,
      metric: 'meals_logged',
    },
    reward: {
      points: 1000,
      badge: '⭐',
    },
    rarity: 'legendary',
    hidden: false,
    active: true,
    order: 5,
  },

  // ===========================================================================
  // 🔬 EXPLORAÇÃO (Exploration Category)
  // ===========================================================================
  {
    id: 'explorer_5',
    title: 'Curiosa',
    description: 'Experimente 5 alimentos diferentes',
    icon: '🔍',
    color: '#2196F3',
    category: 'exploration',
    requirement: {
      type: 'unique',
      target: 5,
      metric: 'foods_tested',
    },
    reward: {
      points: 75,
      badge: '🔎',
    },
    rarity: 'common',
    hidden: false,
    active: true,
    order: 10,
  },
  {
    id: 'explorer_25',
    title: 'Aventureira',
    description: 'Experimente 25 alimentos diferentes',
    icon: '🗺️',
    color: '#03A9F4',
    category: 'exploration',
    requirement: {
      type: 'unique',
      target: 25,
      metric: 'foods_tested',
    },
    reward: {
      points: 200,
      badge: '🧭',
    },
    rarity: 'rare',
    hidden: false,
    active: true,
    order: 11,
  },
  {
    id: 'explorer_50',
    title: 'Exploradora',
    description: 'Experimente 50 alimentos diferentes',
    icon: '🌍',
    color: '#00BCD4',
    category: 'exploration',
    requirement: {
      type: 'unique',
      target: 50,
      metric: 'foods_tested',
    },
    reward: {
      points: 400,
      badge: '🌎',
    },
    rarity: 'epic',
    hidden: false,
    active: true,
    order: 12,
  },
  {
    id: 'explorer_100',
    title: 'Mestra Exploradora',
    description: 'Experimente 100 alimentos diferentes',
    icon: '🌌',
    color: '#009688',
    category: 'exploration',
    requirement: {
      type: 'unique',
      target: 100,
      metric: 'foods_tested',
    },
    reward: {
      points: 750,
      badge: '🚀',
    },
    rarity: 'legendary',
    hidden: false,
    active: true,
    order: 13,
  },

  // ===========================================================================
  // 🔥 CONSISTÊNCIA (Streak Category)
  // ===========================================================================
  {
    id: 'streak_3',
    title: 'Começando Bem',
    description: 'Mantenha 3 dias consecutivos de registros',
    icon: '🔥',
    color: '#FF5722',
    category: 'streak',
    requirement: {
      type: 'streak',
      target: 3,
      metric: 'days_streak',
    },
    reward: {
      points: 100,
      badge: '🔥',
    },
    rarity: 'common',
    hidden: false,
    active: true,
    order: 20,
  },
  {
    id: 'streak_7',
    title: 'Semana Perfeita',
    description: 'Mantenha 7 dias consecutivos de registros',
    icon: '📅',
    color: '#F44336',
    category: 'streak',
    requirement: {
      type: 'streak',
      target: 7,
      metric: 'days_streak',
    },
    reward: {
      points: 250,
      badge: '📆',
    },
    rarity: 'rare',
    hidden: false,
    active: true,
    order: 21,
  },
  {
    id: 'streak_14',
    title: 'Duas Semanas Fortes',
    description: 'Mantenha 14 dias consecutivos de registros',
    icon: '💪',
    color: '#E91E63',
    category: 'streak',
    requirement: {
      type: 'streak',
      target: 14,
      metric: 'days_streak',
    },
    reward: {
      points: 500,
      badge: '💪',
    },
    rarity: 'epic',
    hidden: false,
    active: true,
    order: 22,
  },
  {
    id: 'streak_30',
    title: 'Mês de Ouro',
    description: 'Mantenha 30 dias consecutivos de registros',
    icon: '🏅',
    color: '#9C27B0',
    category: 'streak',
    requirement: {
      type: 'streak',
      target: 30,
      metric: 'days_streak',
    },
    reward: {
      points: 1000,
      badge: '🥇',
    },
    rarity: 'legendary',
    hidden: false,
    active: true,
    order: 23,
  },
  {
    id: 'streak_100',
    title: 'Centenária',
    description: 'Mantenha 100 dias consecutivos de registros',
    icon: '💯',
    color: '#673AB7',
    category: 'streak',
    requirement: {
      type: 'streak',
      target: 100,
      metric: 'days_streak',
    },
    reward: {
      points: 2500,
      badge: '👑',
    },
    rarity: 'legendary',
    hidden: false,
    active: true,
    order: 24,
  },

  // ===========================================================================
  // 📈 PROGRESSO (Diary Category - sintomas e alimentos problemáticos)
  // ===========================================================================
  {
    id: 'symptom_1',
    title: 'Auto-observadora',
    description: 'Registre seu primeiro sintoma',
    icon: '📝',
    color: '#607D8B',
    category: 'diary',
    requirement: {
      type: 'count',
      target: 1,
      metric: 'symptoms_logged',
    },
    reward: {
      points: 50,
      badge: '📋',
    },
    rarity: 'common',
    hidden: false,
    active: true,
    order: 30,
  },
  {
    id: 'symptom_20',
    title: 'Diário de Saúde',
    description: 'Registre 20 sintomas no diário',
    icon: '📊',
    color: '#795548',
    category: 'diary',
    requirement: {
      type: 'count',
      target: 20,
      metric: 'symptoms_logged',
    },
    reward: {
      points: 200,
      badge: '📈',
    },
    rarity: 'rare',
    hidden: false,
    active: true,
    order: 31,
  },
  {
    id: 'problematic_1',
    title: 'Detetive Alimentar',
    description: 'Identifique seu primeiro alimento problemático',
    icon: '🕵️',
    color: '#FF7043',
    category: 'exploration',
    requirement: {
      type: 'count',
      target: 1,
      metric: 'problematic_foods_marked',
    },
    reward: {
      points: 100,
      badge: '🔬',
    },
    rarity: 'common',
    hidden: false,
    active: true,
    order: 32,
  },
  {
    id: 'problematic_5',
    title: 'Investigadora',
    description: 'Identifique 5 alimentos problemáticos',
    icon: '🔎',
    color: '#FF5252',
    category: 'exploration',
    requirement: {
      type: 'count',
      target: 5,
      metric: 'problematic_foods_marked',
    },
    reward: {
      points: 300,
      badge: '🧪',
    },
    rarity: 'rare',
    hidden: false,
    active: true,
    order: 33,
  },
  {
    id: 'days_logged_7',
    title: 'Comprometida',
    description: 'Faça registros em 7 dias diferentes',
    icon: '📆',
    color: '#4DB6AC',
    category: 'diary',
    requirement: {
      type: 'count',
      target: 7,
      metric: 'days_logged',
    },
    reward: {
      points: 150,
      badge: '🗓️',
    },
    rarity: 'common',
    hidden: false,
    active: true,
    order: 34,
  },
  {
    id: 'days_logged_30',
    title: 'Veterana',
    description: 'Faça registros em 30 dias diferentes',
    icon: '🎖️',
    color: '#26A69A',
    category: 'diary',
    requirement: {
      type: 'count',
      target: 30,
      metric: 'days_logged',
    },
    reward: {
      points: 400,
      badge: '🎗️',
    },
    rarity: 'epic',
    hidden: false,
    active: true,
    order: 35,
  },

  // ===========================================================================
  // 🎯 ESPECIAIS (Special Category - Easter Eggs)
  // ===========================================================================
  {
    id: 'night_owl',
    title: 'Coruja Noturna',
    description: 'Registre uma refeição após meia-noite',
    icon: '🦉',
    color: '#3F51B5',
    category: 'special',
    requirement: {
      type: 'custom',
      target: 1,
      metric: 'custom',
    },
    reward: {
      points: 100,
      badge: '🌙',
    },
    rarity: 'rare',
    hidden: true,
    active: true,
    order: 50,
  },
  {
    id: 'early_bird',
    title: 'Madrugadora',
    description: 'Registre uma refeição antes das 6h da manhã',
    icon: '🐦',
    color: '#FFCA28',
    category: 'special',
    requirement: {
      type: 'custom',
      target: 1,
      metric: 'custom',
    },
    reward: {
      points: 100,
      badge: '🌅',
    },
    rarity: 'rare',
    hidden: true,
    active: true,
    order: 51,
  },
  {
    id: 'weekend_warrior',
    title: 'Guerreira de Fim de Semana',
    description: 'Registre refeições em todos os fins de semana de um mês',
    icon: '⚔️',
    color: '#7C4DFF',
    category: 'special',
    requirement: {
      type: 'custom',
      target: 1,
      metric: 'custom',
    },
    reward: {
      points: 300,
      badge: '🗡️',
    },
    rarity: 'epic',
    hidden: true,
    active: true,
    order: 52,
  },
  {
    id: 'ceboelha_fan',
    title: 'Fã da Ceboelha',
    description: 'Use o app por 6 meses consecutivos',
    icon: '🧅',
    color: '#E040FB',
    category: 'special',
    requirement: {
      type: 'custom',
      target: 1,
      metric: 'custom',
    },
    reward: {
      points: 1000,
      badge: '🧅',
    },
    rarity: 'legendary',
    hidden: true,
    active: true,
    order: 53,
  },
]

async function seedAchievements() {
  console.log('🏆 Iniciando seed de conquistas...')

  try {
    // Connect to MongoDB
    await mongoose.connect(env.MONGODB_URI)
    console.log('✅ Conectado ao MongoDB')

    // Check existing count
    const existingCount = await Achievement.countDocuments()
    console.log(`📊 Conquistas existentes: ${existingCount}`)

    // Clear existing achievements (optional - comment out to preserve)
    await Achievement.deleteMany({})
    console.log('🗑️ Conquistas anteriores removidas')

    // Insert all achievements
    const result = await Achievement.insertMany(achievements)
    console.log(`✅ ${result.length} conquistas criadas com sucesso!`)

    // Summary
    const summary = achievements.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('\n📋 Resumo por categoria:')
    for (const [category, count] of Object.entries(summary)) {
      console.log(`   ${category}: ${count}`)
    }

    const hiddenCount = achievements.filter((a) => a.hidden).length
    console.log(`\n🔒 Conquistas ocultas (easter eggs): ${hiddenCount}`)

    console.log('\n🎉 Seed de conquistas concluído!')
  } catch (error) {
    console.error('❌ Erro ao fazer seed de conquistas:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('👋 Desconectado do MongoDB')
  }
}

// Run seed
seedAchievements()
