/**
 * Seed News Script
 *
 * Populates the MongoDB database with sample news articles and recipes
 *
 * Usage: bun run scripts/seed-news.ts
 */

/// <reference types="bun-types" />

import mongoose from 'mongoose'
import { NewsArticle, type ArticleCategory } from '../src/modules/news/news.model'
import { connectDatabase } from '../src/config/database'

// =============================================================================
// Seed Data
// =============================================================================

const sampleArticles = [
  // ============================================================================
  // Receitas Low FODMAP
  // ============================================================================
  {
    title: 'Frango Grelhado com Ervas e Legumes Assados',
    summary: 'Uma refeição completa Low FODMAP, perfeita para o almoço ou jantar. Simples, nutritiva e deliciosa.',
    content: `# Frango Grelhado com Ervas e Legumes Assados

Uma receita simples e saborosa que é completamente segura para a fase de eliminação FODMAP.

## Por que esta receita é Low FODMAP?

- Usa ervas frescas em vez de alho e cebola
- Os legumes escolhidos são todos Low FODMAP em porções normais
- Sem ingredientes problemáticos

## Dicas

1. Você pode trocar o frango por peixe branco
2. Adicione um fio de azeite de alho infusionado para mais sabor (o óleo não contém FODMAPs)
3. Sirva com arroz branco ou batatas assadas
`,
    category: 'recipe' as ArticleCategory,
    tags: ['low-fodmap', 'almoço', 'jantar', 'frango', 'fácil'],
    imageUrl: '/images/recipes/chicken-herbs.jpg',
    author: {
      name: 'Equipe Ceboelha',
      bio: 'Especialistas em nutrição e dieta FODMAP',
    },
    status: 'published',
    readTime: 5,
    isFeatured: true,
    recipe: {
      prep_time: 15,
      cook_time: 40,
      servings: 4,
      difficulty: 'easy' as const,
      ingredients: [
        '4 peitos de frango',
        '2 colheres de sopa de azeite',
        '1 colher de chá de alecrim fresco',
        '1 colher de chá de tomilho fresco',
        'Sal e pimenta a gosto',
        '2 cenouras médias',
        '1 abobrinha média',
        '1 berinjela pequena',
        '200g de batata-doce',
      ],
      instructions: [
        'Pré-aqueça o forno a 200°C',
        'Tempere o frango com azeite, ervas, sal e pimenta',
        'Corte os legumes em cubos médios',
        'Disponha os legumes em uma assadeira com azeite',
        'Coloque o frango por cima dos legumes',
        'Asse por 35-40 minutos até o frango estar cozido',
        'Deixe descansar 5 minutos antes de servir',
      ],
      nutrition: {
        calories: 320,
        protein_g: 35,
        carbs_g: 22,
        fat_g: 10,
        fiber_g: 4,
      },
      fodmap_friendly: true,
      fodmap_phase: 'elimination' as const,
    },
    publishedAt: new Date('2024-12-01'),
  },
  {
    title: 'Smoothie Tropical de Morango e Banana (Porção Controlada)',
    summary: 'Smoothie refrescante para começar o dia. A banana é Low FODMAP em porções de até 1/3 da fruta.',
    content: `# Smoothie Tropical

Um café da manhã rápido e nutritivo! 

## Atenção às porções

A banana é Low FODMAP apenas em porções pequenas (até 1/3 de banana média). Esta receita usa exatamente essa quantidade por porção.

## Variações

- Substitua os morangos por mirtilos (blueberries) - também Low FODMAP
- Use leite de amêndoas sem adoçantes
`,
    category: 'recipe' as ArticleCategory,
    tags: ['low-fodmap', 'café-da-manhã', 'smoothie', 'rápido'],
    imageUrl: '/images/recipes/tropical-smoothie.jpg',
    author: {
      name: 'Equipe Ceboelha',
    },
    status: 'published',
    readTime: 5,
    isFeatured: false,
    recipe: {
      prep_time: 5,
      cook_time: 0,
      servings: 2,
      difficulty: 'easy' as const,
      ingredients: [
        '200ml de leite sem lactose',
        '100g de morangos frescos',
        '1/2 banana pequena (ou 1/3 média)',
        '1 colher de sopa de aveia (opcional)',
        'Gelo a gosto',
      ],
      instructions: [
        'Adicione todos os ingredientes no liquidificador',
        'Bata até ficar homogêneo',
        'Sirva imediatamente',
      ],
      nutrition: {
        calories: 150,
        protein_g: 5,
        carbs_g: 28,
        fat_g: 2,
        fiber_g: 3,
      },
      fodmap_friendly: true,
      fodmap_phase: 'elimination' as const,
    },
    publishedAt: new Date('2024-12-05'),
  },
  {
    title: 'Risotto de Abóbora sem Cebola',
    summary: 'Risotto cremoso e reconfortante, feito sem cebola ou alho. Perfeito para dias frios.',
    content: `# Risotto de Abóbora Low FODMAP

Um clássico italiano adaptado para a dieta FODMAP.

## Segredo do sabor

Para compensar a falta de cebola e alho, usamos:
- Óleo de alho infusionado
- Cebolinho (parte verde apenas)
- Queijo parmesão

## Importante

A abóbora Hokkaido (ou moranga) é a mais segura para FODMAP. Evite abóboras butternut em grandes quantidades.
`,
    category: 'recipe' as ArticleCategory,
    tags: ['low-fodmap', 'jantar', 'italiano', 'vegetariano'],
    imageUrl: '/images/recipes/pumpkin-risotto.jpg',
    author: {
      name: 'Equipe Ceboelha',
    },
    status: 'published',
    readTime: 5,
    isFeatured: true,
    recipe: {
      prep_time: 10,
      cook_time: 30,
      servings: 4,
      difficulty: 'medium' as const,
      ingredients: [
        '300g de arroz arbóreo',
        '400g de abóbora em cubos',
        '1L de caldo de legumes caseiro (sem cebola/alho)',
        '50g de manteiga',
        '2 colheres de sopa de azeite de alho infusionado',
        '50g de parmesão ralado',
        'Cebolinho picado (parte verde)',
        'Sal e pimenta a gosto',
      ],
      instructions: [
        'Cozinhe a abóbora até ficar macia, amasse metade e reserve',
        'Aqueça o caldo em fogo baixo',
        'Em uma panela, aqueça o azeite infusionado',
        'Adicione o arroz e toste por 2 minutos',
        'Adicione o caldo aos poucos, mexendo sempre',
        'Quando quase pronto, adicione a abóbora (amassada e em cubos)',
        'Finalize com manteiga, parmesão e cebolinho',
      ],
      nutrition: {
        calories: 380,
        protein_g: 10,
        carbs_g: 55,
        fat_g: 14,
        fiber_g: 3,
      },
      fodmap_friendly: true,
      fodmap_phase: 'elimination' as const,
    },
    publishedAt: new Date('2024-12-08'),
  },

  // ============================================================================
  // Artigos Educacionais
  // ============================================================================
  {
    title: 'O que são FODMAPs? Guia Completo para Iniciantes',
    summary: 'Entenda o que são FODMAPs, como eles afetam o intestino e por que a dieta Low FODMAP pode ajudar nos sintomas de IBS.',
    content: `# O que são FODMAPs?

FODMAP é um acrônimo que significa:

- **F**ermentáveis
- **O**ligossacarídeos
- **D**issacarídeos
- **M**onossacarídeos
- **A**nd (e)
- **P**olióis

## Como os FODMAPs causam sintomas?

Esses carboidratos são mal absorvidos no intestino delgado e, quando chegam ao intestino grosso, são fermentados pelas bactérias intestinais. Isso pode causar:

- Gases e inchaço
- Dor abdominal
- Diarreia ou constipação
- Desconforto geral

## A Dieta Low FODMAP

A dieta consiste em três fases:

### 1. Eliminação (2-6 semanas)
Remova todos os alimentos High FODMAP da sua dieta.

### 2. Reintrodução (6-8 semanas)
Reintroduza um grupo FODMAP por vez para identificar seus gatilhos.

### 3. Manutenção (longo prazo)
Personalize sua dieta baseada nas suas tolerâncias individuais.

## Importante

A dieta Low FODMAP deve ser feita com acompanhamento de um nutricionista especializado.
`,
    category: 'article' as ArticleCategory,
    tags: ['fodmap', 'ibs', 'guia', 'iniciante', 'educação'],
    imageUrl: '/images/articles/fodmap-guide.jpg',
    author: {
      name: 'Equipe Ceboelha',
      bio: 'Especialistas em nutrição e dieta FODMAP',
    },
    status: 'published',
    readTime: 5,
    isFeatured: true,
    publishedAt: new Date('2024-11-15'),
  },
  {
    title: 'Alimentos Permitidos na Fase de Eliminação',
    summary: 'Lista completa de alimentos seguros para consumir durante a fase de eliminação da dieta FODMAP.',
    content: `# Alimentos Permitidos na Fase de Eliminação

Durante a fase de eliminação, foque nesses alimentos seguros:

## Proteínas
- Carnes: frango, peru, carne bovina, porco
- Peixes: salmão, atum, bacalhau
- Ovos
- Tofu firme

## Vegetais Low FODMAP
- Cenoura
- Pepino
- Berinjela
- Abobrinha
- Tomate
- Espinafre
- Alface

## Frutas (em porções adequadas)
- Morango
- Laranja
- Uvas
- Kiwi
- Banana (firme, 1/3)

## Carboidratos
- Arroz
- Quinoa
- Aveia (até 1/2 xícara)
- Batata
- Pão sem glúten

## Laticínios
- Leite sem lactose
- Queijos duros (parmesão, cheddar)
- Manteiga

## Lembre-se
O tamanho da porção importa! Muitos alimentos são Low FODMAP em pequenas quantidades mas High FODMAP em porções maiores.
`,
    category: 'article' as ArticleCategory,
    tags: ['fodmap', 'eliminação', 'alimentos', 'lista'],
    imageUrl: '/images/articles/allowed-foods.jpg',
    author: {
      name: 'Equipe Ceboelha',
    },
    status: 'published',
    readTime: 5,
    isFeatured: false,
    publishedAt: new Date('2024-11-20'),
  },

  // ============================================================================
  // Dicas
  // ============================================================================
  {
    title: 'Como comer fora de casa seguindo Low FODMAP',
    summary: 'Dicas práticas para manter a dieta quando você precisa comer em restaurantes.',
    content: `# Comendo Fora de Casa

Seguir a dieta Low FODMAP não precisa te impedir de socializar!

## Antes de ir
- Pesquise o cardápio online
- Ligue antes e explique suas restrições
- Escolha restaurantes com opções grelhadas/simples

## No restaurante
- Peça pratos grelhados sem molhos
- Substitua acompanhamentos por arroz ou batata
- Pergunte sobre ingredientes (muitos pratos têm alho/cebola escondidos)

## Frases úteis
- "Tenho intolerância alimentar a alho e cebola"
- "Pode fazer sem molho/tempero pronto?"
- "Quais vegetais acompanham o prato?"

## Opções geralmente seguras
- Steak/frango/peixe grelhado
- Saladas simples (peça azeite e limão à parte)
- Arroz branco
- Batatas sem recheio
`,
    category: 'tip' as ArticleCategory,
    tags: ['dica', 'restaurante', 'social', 'prático'],
    imageUrl: '/images/tips/eating-out.jpg',
    author: {
      name: 'Equipe Ceboelha',
    },
    status: 'published',
    readTime: 5,
    isFeatured: false,
    publishedAt: new Date('2024-12-02'),
  },
  {
    title: 'Temperos e Ervas Seguros para FODMAP',
    summary: 'Descubra como dar sabor às suas refeições sem usar alho e cebola.',
    content: `# Temperos Seguros

Quem disse que comida Low FODMAP é sem graça?

## Ervas Frescas (todas seguras!)
- Manjericão
- Coentro
- Salsa
- Alecrim
- Tomilho
- Orégano
- Hortelã

## Especiarias
- Cominho
- Páprica
- Açafrão/Cúrcuma
- Gengibre
- Pimenta-do-reino

## Truques de Sabor
- **Óleo infusionado**: O óleo de alho/cebola NÃO contém FODMAPs!
- **Parte verde do alho-poró**: Use apenas a parte verde
- **Cebolinho**: A parte verde é segura
- **Asafoetida**: Substituto indiano para alho (use com moderação)

## Molhos Caseiros
Faça seus próprios molhos com:
- Azeite + limão + ervas
- Vinagre balsâmico (pequenas quantidades)
- Mostarda (verificar ingredientes)
`,
    category: 'tip' as ArticleCategory,
    tags: ['dica', 'temperos', 'sabor', 'cozinha'],
    imageUrl: '/images/tips/herbs-spices.jpg',
    author: {
      name: 'Equipe Ceboelha',
    },
    status: 'published',
    readTime: 5,
    isFeatured: false,
    publishedAt: new Date('2024-12-04'),
  },

  // ============================================================================
  // Bem-estar
  // ============================================================================
  {
    title: 'A Conexão Intestino-Cérebro e o Estresse',
    summary: 'Entenda como suas emoções afetam seu intestino e vice-versa. O estresse pode ser um gatilho importante para sintomas de IBS.',
    content: `# A Conexão Intestino-Cérebro

Você já sentiu "borboletas no estômago" antes de uma apresentação? Isso mostra como nosso cérebro e intestino estão conectados.

## O Eixo Intestino-Cérebro

O intestino é chamado de "segundo cérebro" porque:
- Tem mais de 100 milhões de neurônios
- Produz 95% da serotonina do corpo
- Se comunica diretamente com o cérebro

## Como o Estresse Afeta o IBS

Quando estamos estressados:
1. O corpo libera cortisol
2. A motilidade intestinal muda
3. A sensibilidade visceral aumenta
4. Os sintomas de IBS pioram

## Técnicas de Gerenciamento

### Respiração Diafragmática
- Inspire por 4 segundos
- Segure por 4 segundos
- Expire por 6 segundos
- Repita 5-10 vezes

### Outras Práticas
- Meditação (mesmo 5 minutos ajudam)
- Yoga suave
- Caminhadas na natureza
- Diário de gratidão
`,
    category: 'wellness' as ArticleCategory,
    tags: ['estresse', 'ansiedade', 'bem-estar', 'mindfulness'],
    imageUrl: '/images/wellness/gut-brain.jpg',
    author: {
      name: 'Equipe Ceboelha',
    },
    status: 'published',
    readTime: 5,
    isFeatured: false,
    publishedAt: new Date('2024-11-28'),
  },

  // ============================================================================
  // Novidades
  // ============================================================================
  {
    title: 'Novo recurso: Análise Inteligente de Padrões',
    summary: 'O Ceboelha agora identifica automaticamente quais alimentos podem estar causando seus sintomas!',
    content: `# Análise Inteligente de Padrões 🎉

Temos uma novidade incrível para você!

## O que é?

O novo módulo de Insights do Ceboelha analisa seu diário alimentar e identifica:

- **Gatilhos potenciais**: Alimentos que aparecem frequentemente antes de sintomas
- **Alimentos seguros**: O que você come sem problemas
- **Padrões de horário**: Horários que você costuma ter mais sintomas

## Como funciona?

1. Continue registrando suas refeições normalmente
2. Marque seus sintomas quando acontecerem
3. O app analisa as correlações
4. Você recebe insights personalizados

## Por que é útil?

- Economiza tempo na identificação de gatilhos
- Fornece evidências para discutir com seu nutricionista
- Ajuda a personalizar sua dieta mais rápido

## Disponibilidade

O recurso já está disponível para todos os usuários na aba "Insights"!
`,
    category: 'news' as ArticleCategory,
    tags: ['novidade', 'feature', 'insights', 'app'],
    imageUrl: '/images/news/insights-feature.jpg',
    author: {
      name: 'Equipe Ceboelha',
    },
    status: 'published',
    readTime: 5,
    isFeatured: true,
    publishedAt: new Date('2024-12-10'),
  },
]

// =============================================================================
// Script
// =============================================================================

async function seedNews() {
  console.log('📰 Starting news seed...\n')

  // Connect to database
  await connectDatabase()
  console.log('✅ Connected to MongoDB\n')

  // Check if articles already exist
  const existingCount = await NewsArticle.countDocuments()
  if (existingCount > 0) {
    console.log(`⚠️  Found ${existingCount} existing articles in database.`)
    
    if (!process.argv.includes('--force')) {
      console.log('   Add --force flag to replace them.\n')
      process.exit(0)
    }

    console.log('   --force flag detected, deleting existing articles...')
    await NewsArticle.deleteMany({})
    console.log('   ✅ Existing articles deleted.\n')
  }

  // Insert articles
  console.log(`📝 Inserting ${sampleArticles.length} articles...`)
  
  let successCount = 0
  let errorCount = 0

  for (const articleData of sampleArticles) {
    try {
      const article = new NewsArticle(articleData)
      await article.save()
      successCount++
      console.log(`   ✓ ${articleData.title}`)
    } catch (error) {
      errorCount++
      console.error(`   ✗ ${articleData.title}: ${error}`)
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   ✅ Successfully inserted: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)

  // Show stats by category
  const stats = await NewsArticle.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ])

  console.log('\n📈 Articles by category:')
  for (const stat of stats) {
    const categoryLabels: Record<string, string> = {
      recipe: '👨‍🍳 Receitas',
      article: '📰 Artigos',
      tip: '💡 Dicas',
      wellness: '🧘 Bem-estar',
      news: '✨ Novidades',
    }
    console.log(`   ${categoryLabels[stat._id] || stat._id}: ${stat.count}`)
  }

  // Close connection
  await mongoose.connection.close()
  console.log('\n✅ Done! Database connection closed.')
}

// Run script
seedNews().catch((error) => {
  console.error('❌ Seed failed:', error)
  process.exit(1)
})
