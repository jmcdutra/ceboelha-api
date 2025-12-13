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
  // 1. Welcome Message
  // ============================================================================
  {
    title: 'para a júlia, com todo amor do mundo ❤️',
    summary: 'um presentinho que tô fazendo há meses, pensando em cada detalhe pra te ver bem.',
    content: `# oi, meu amor

eu sei que os últimos tempos não têm sido fáceis com a barriguinha. ver você com dor, desconfortável, sem saber o que comer... isso me quebra. e foi por isso que eu passei os últimos meses construindo isso aqui.

cada pedacinho desse aplicativo foi pensado em você.

eu queria criar um lugar que não fosse sobre "não pode comer isso" ou "não pode comer aquilo". queria um lugar que te desse **paz**. que te ajudasse a entender o seu corpo, que é tão único e especial.

## o que você pode fazer aqui?

tudinho o que você precisar. eu programei isso pra ser seu:

- **registre tudo**: coloca aqui o que você comeu, sem medo.
- **me conta como tá se sentindo**: tá doendo? tá inchada? ou tá se sentindo leve e linda?
- **descubra os vilões**: deixa que eu (e o ceboelha) fazemos a matemática pra descobrir o que tá te fazendo mal.

## eu estou aqui

eu sou seu programador particular, lembra? rs.

qualquer coisa, QUALQUER coisa que você sentir falta aqui, me fala. quer um botão pra registrar água? eu coloco. quer uma lista de compras? eu faço. esse é o nosso projeto, mas o foco é o **seu bem-estar**.

eu te amo demais, júlia. espero que o ceboelha ajude a deixar seus dias mais leves, porque ver você sorrindo é a minha coisa favorita no mundo.

com amor,
do seu, só seu.
`,
    category: 'news' as ArticleCategory,
    tags: ['amor', 'pra-voce', 'jornada', 'presente'],
    imageUrl: '/images/news/welcome_julia.png',
    author: {
      name: 'Seu Namorado',
      bio: 'Programando seu sorriso',
    },
    status: 'published',
    readTime: 4,
    isFeatured: true,
    publishedAt: new Date(),
  },

  // ============================================================================
  // 2. Educational / Wellness
  // ============================================================================
  {
    title: 'Entendendo a SII: Um Guia Completo e Gentil',
    summary: 'A SII é complexa, mas não é um bicho de sete cabeças. Vamos mergulhar fundo no que acontece no seu corpo e como podemos lidar com isso juntos.',
    content: `# O que meu corpo está realmente dizendo?

A Síndrome do Intestino Irritável (SII) é, basicamente, uma falha na comunicação entre o cérebro e o intestino. Imagine que eles estão conversando por um telefone com chiado. Às vezes, o intestino diz "estou cheio", mas o cérebro entende "ESTOU COM DOR!".

As terminações nervosas do seu intestino são hipersensíveis (visceral hypersensitivity). Isso significa que uma digestão normal, que outras pessoas nem sentiriam, pode ser traduzida pelo seu corpo como desconforto ou dor.

## Por que isso acontece? Os Gatilhos Mais Comuns

Não é culpa sua, e não é "coisa da sua cabeça". Existem fatores reais fisiológicos:

### 1. O Eixo Intestino-Cérebro 🧠↔️🥦
O estresse é o maior inimigo. Quando você fica ansiosa, o corpo libera cortisol, que afeta diretamente a motilidade (movimento) do intestino. Ele pode acelerar demais (diarreia) ou parar de vez (constipação).

### 2. Fermentação (Os tais FODMAPs)
Certos carboidratos puxam água para o intestino e fermentam muito rápido. Isso gera gás. Como seu intestino é sensível, esse gás causa distensão e dor.

## O Segredo é a Paciência (e o Autoconhecimento)

A boa notícia? Não é para sempre igual. Seu corpo muda. Alimentos que fazem mal hoje podem ser aceitos amanhã quando você estiver menos estressada.

O tratamento padrão-ouro não é remédio, é a dieta Low FODMAP e o controle do estresse. Mas não precisa fazer isso sozinha. Vamos identificar seus padrões. Será que é o alho? É o trigo? Ou é só aquela semana difícil no trabalho?

Respire fundo. Seu corpo é sábio e está fazendo o melhor que pode para te proteger. Vamos ouvi-lo com carinho e paciência. Estamos no caminho certo. 🌸
`,
    category: 'article' as ArticleCategory,
    tags: ['sii', 'ibs', 'educação', 'saúde', 'acolhimento', 'ciencia'],
    imageUrl: '/images/news/ibs_understanding.png',
    author: {
      name: 'Nutri Ceboelha',
    },
    status: 'published',
    readTime: 8,
    isFeatured: true,
    publishedAt: new Date(Date.now() - 86400000),
  },

  // ============================================================================
  // 3. App Guide / Tip
  // ============================================================================
  {
    title: 'Seu Novo Superpoder: Guia Avançado do Ceboelha',
    summary: 'Descubra como transformar dados em bem-estar. O Ceboelha não é apenas um diário, é um laboratório de investigação pessoal.',
    content: `# Seja a Detetive da Sua Própria Saúde 🕵️‍♀️

O Ceboelha foi desenhado para encontrar agulhas no palheiro. Sabe aquele mal-estar que aparece do nada? Geralmente ele não é do nada. Ele deixou pistas. Vamos aprender a encontrá-las.

## Passo 1: O Registro Detalhado (O Pulo do Gato)

Não anote apenas "Almoço: Arroz e Frango". O diabo mora nos detalhes!
- Tinha alho no tempero?
- Qual molho você usou?
- Bebeu algo junto?
- Comeu uma sobremesa depois?

**Dica de Ouro:** Às vezes o gatilho não é a comida, é o contexto. Comeu rápido demais? Estava brigando com alguém? Anote isso nas observações!

## Passo 2: A Escala de Sintomas

A dor é subjetiva, mas tentamos quantificar.
- **Leve:** Incomoda, mas sigo a vida.
- **Moderada:** Preciso dar uma pausa, talvez deitar um pouco.
- **Intensa:** Preciso de remédio ou bolsa de água quente agora.

Ser honesta aqui ajuda o algoritmo a priorizar os alimentos mais perigosos.

## Passo 3: A Mágica dos Padrões (Insights)

Você não precisa decorar o que te faz mal. O Ceboelha guarda isso.
Depois de uma semana usando direitinho, vá na aba "Insights". Ele vai te dizer coisa do tipo:
> *"Atenção: 80% das vezes que você comeu cebola, você relatou inchaço em até 4 horas."*

Isso é poder! Com essa informação, você pode decidir: "Hoje tenho uma festa, melhor evitar a cebola". Ou "Hoje vou ficar em casa, vou arriscar um pouquinho".

Use o app como sua memória externa. Libere sua mente dessa preocupação!
`,
    category: 'tip' as ArticleCategory,
    tags: ['guia', 'dica', 'app', 'superpoder', 'tutorial'],
    imageUrl: '/images/news/app_guide.png',
    author: {
      name: 'Ceboelha App',
    },
    status: 'published',
    readTime: 6,
    isFeatured: false,
    publishedAt: new Date(Date.now() - 172800000),
  },

  // ============================================================================
  // 4. Recipe
  // ============================================================================
  {
    title: 'Bolo de Cenoura Fofinho (Versão Barriga Feliz)',
    summary: 'Quem disse que você não pode comer bolo? Essa versão é sem glúten, sem lactose, extremamente fofinha e cheia de carinho.',
    content: `# O Melhor Bolo de Cenoura da Vida 🥕

Sabe aquela vontade de comer um docinho com café da tarde, mas o medo de passar mal depois? Acabou! Essa receita foi testada e aprovada para barriguinhas sensíveis. Ela não leva farinha de trigo (glúten) e nem leite de vaca (lactose/caseína).

O segredo aqui é o polvilho doce, que deixa a massa elástica e impede que o bolo esfarele, algo comum em bolos sem glúten.

## Ingredientes Seguros

### Massa Líquida
- 3 cenouras médias (descascadas e picadas em rodelas)
- 3 ovos grandes inteiros
- 1/2 xícara de óleo vegetal (girassol ou milho são mais neutros)

### Secos
- 1 xícara de farinha de arroz (traz estrutura)
- 1 xícara de polvilho doce (traz fofura)
- 1 xícara de açúcar demerara ou cristal
- 1 colher (sopa) bem cheia de fermento em pó

### Cobertura (A Melhor Parte!)
- 100g de Chocolate 70% cacau (sem leite nos ingredientes)
- 1 colher de óleo de coco (pra dar brilho)

## Passo a Passo com Carinho

1. **Prepare o terreno:** Unte uma forma com óleo e enfarinhe com farinha de arroz. Pré-aqueça o forno a 180°C.
2. **Liquidificador:** Bata as cenouras, os ovos e o óleo. Bata MUITO bem, por uns 3-4 minutos, até ficar um creme liso e bem alaranjado. Isso garante que o bolo não fique pesado.
3. **Mistura:** Em uma tigela grande, peneire os secos (farinha, polvilho e açúcar).
4. **União:** Junte o creme líquido aos secos delicadamente. Não use batedeira elétrica aqui! Mexa com um fouet ou colher de pau só até misturar.
5. **Finalização:** Adicione o fermento por último e mexa só pra incorporar.
6. **Forno:** Asse por cerca de 40-45 minutos. Faça o teste do palito: se sair limpo, tá pronto!

O cheirinho pela casa já começa a curar qualquer mal-estar! Espere amornar para desenformar (bolos sem glúten são frágeis quentes). Jogue a caldinha por cima e seja feliz! 🍰
`,
    category: 'recipe' as ArticleCategory,
    tags: ['receita', 'bolo', 'lanche', 'conforto', 'sem-gluten', 'sobremesa'],
    imageUrl: '/images/news/carrot_cake.png',
    author: {
      name: 'Chef Ceboelha',
    },
    status: 'published',
    readTime: 15,
    isFeatured: false,
    recipe: {
      prep_time: 20,
      cook_time: 45,
      servings: 10,
      difficulty: 'easy' as const,
      ingredients: [
        '3 cenouras médias',
        '3 ovos',
        '1/2 xícara de óleo',
        '1 xícara de farinha de arroz',
        '1 xícara de polvilho doce',
        '1 xícara de açúcar',
        '1 colher de fermento'
      ],
      instructions: [
        'Bata os líquidos e a cenoura no liquidificador por 4 min',
        'Em uma tigela, misture as farinhas e o açúcar',
        'Junte o líquido aos secos delicadamente',
        'Asse em forno pré-aquecido a 180 graus por 45min'
      ],
      nutrition: {
        calories: 220,
        protein_g: 3,
        carbs_g: 38,
        fat_g: 9,
        fiber_g: 2
      },
      fodmap_friendly: true,
      fodmap_phase: 'elimination' as const,
    },
    publishedAt: new Date(Date.now() - 259200000),
  },

  // ============================================================================
  // 5. Wellness
  // ============================================================================
  {
    title: 'Kit de Emergência Emocional: Para os Dias Difíceis',
    summary: 'Um guia prático e acolhedor para quando a dor bate e o mundo parece pesado demais. Você vai ficar bem.',
    content: `# Respire. Vai passar.

Tem dias que a barriga dói, o cansaço bate e parece que nada funciona. A roupa aperta, o humor muda e a gente só quer sumir. E está tudo bem se sentir assim. É válido.

Você não está "reclamando demais". Você está lidando com uma condição crônica e invisível. Isso exige uma força gigantesca.

## O Que Fazer Agora? (SOS)

Seu corpo está em estado de alerta. Precisamos acalmar o sistema nervoso simpático (luta ou fuga) e ativar o parassimpático (descanso e digestão).

### 1. Conforto Imediato
- **Roupa:** Tire qualquer coisa que aperte sua cintura. Agora.
- **Calor:** Uma bolsa de água quente na barriga não só alivia a dor, mas avisa pro seu corpo que está seguro.
- **Posição:** Deite-se de lado, com um travesseiro entre as pernas (posição fetal). Isso relaxa a parede abdominal.

### 2. O Chá "Mágico"
Prepare um chá de hortelã-pimenta (peppermint) ou camomila. A hortelã é antiespasmódica natural, ajuda a soltar os gases presos.

### 3. Técnica 4-7-8 (Para Ansiedade e Dor)
Essa respiração é comprovada para baixar a frequência cardíaca:

1. Esvazie todo o ar dos pulmões.
2. Inspire pelo nariz contando até **4**.
3. Segure o ar contando até **7**.
4. Solte o ar pela boca (fazendo um som de sopro) contando até **8**.

Repita isso 4 vezes. Parece bobo, mas muda a química do seu sangue.

## Um Lembrete Pra Você
Esse momento ruim é apenas um momento. Não é sua vida toda. Amanhã é um novo dia, seu intestino vai desinchar e você vai sorrir de novo.

Seja gentil com você mesma hoje. Você não precisa ser produtiva com dor. Seu único trabalho agora é descansar e deixar seu corpo se curar. Confie. 🌿
`,
    category: 'wellness' as ArticleCategory,
    tags: ['bem-estar', 'calma', 'respiração', 'apoio', 'mindfulness', 'sos'],
    imageUrl: '/images/news/breathe.png',
    author: {
      name: 'Ceboelha Zen',
    },
    status: 'published',
    readTime: 6,
    isFeatured: false,
    publishedAt: new Date(Date.now() - 345600000),
  }
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
