# 🧅 Ceboelha API - Plano de Desenvolvimento do Backend

> **Última Atualização:** 12/12/2025
> **Status:** 🚧 Em Desenvolvimento - Etapas 01-06 Concluídas
> **Stack:** Bun + Elysia + Mongoose + MongoDB

---

## 📊 Resumo Executivo

Este documento contém o plano completo de desenvolvimento do backend da aplicação Ceboelha, dividido em **10 etapas** progressivas. Cada etapa foi pensada para construir sobre a anterior, garantindo um backend **seguro**, **rápido**, **otimizado** e seguindo **boas práticas**.

### Endpoints Totais a Implementar
| Módulo | Endpoints | Prioridade | Status |
|--------|-----------|------------|--------|
| Auth | 4 | 🔴 Alta | ✅ |
| Profile | 6 | 🔴 Alta | ✅ |
| Foods | 4 | 🔴 Alta | ✅ |
| Diary | 9 | 🔴 Alta | ✅ |
| Problematic Foods | 5 | 🟡 Média | ✅ |
| Insights | 3 | 🟡 Média | ⏳ |
| News | 2 | 🟡 Média | ⏳ |
| Achievements | 1 | 🟡 Média | ⏳ |
| Admin | 18+ | 🟢 Baixa | ⏳ |

---

## 📁 Estrutura Final do Projeto

```
ceboelha-api/
├── src/
│   ├── index.ts                    # Entry point
│   ├── app.ts                      # Instância Elysia configurada
│   │
│   ├── config/
│   │   ├── env.ts                  # Variáveis de ambiente (Zod validation)
│   │   ├── database.ts             # Conexão MongoDB
│   │   └── cors.ts                 # Configuração CORS
│   │
│   ├── shared/
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts  # Validação JWT
│   │   │   ├── admin.middleware.ts # Verificação role admin
│   │   │   ├── rate-limit.middleware.ts
│   │   │   └── logger.middleware.ts
│   │   │
│   │   ├── plugins/
│   │   │   ├── jwt.plugin.ts       # Configuração JWT
│   │   │   └── swagger.plugin.ts   # Documentação API
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── user.types.ts
│   │   │   ├── food.types.ts
│   │   │   ├── diary.types.ts
│   │   │   └── ...
│   │   │
│   │   ├── errors/
│   │   │   ├── index.ts
│   │   │   ├── app-error.ts
│   │   │   └── error-handler.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── password.ts         # bcrypt helpers
│   │   │   ├── response.ts         # Padronização de responses
│   │   │   ├── pagination.ts       # Helpers de paginação
│   │   │   └── easter-egg.ts       # 💕 Julia's special
│   │   │
│   │   └── validators/
│   │       ├── common.validators.ts
│   │       └── custom.validators.ts
│   │
│   └── modules/
│       ├── auth/
│       │   ├── auth.model.ts       # RefreshTokens (opcional)
│       │   ├── auth.service.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.schemas.ts     # Validação Elysia/TypeBox
│       │   └── auth.tests.ts
│       │
│       ├── users/
│       │   ├── user.model.ts
│       │   ├── users.service.ts
│       │   ├── users.controller.ts
│       │   ├── users.schemas.ts
│       │   └── users.tests.ts
│       │
│       ├── foods/
│       │   ├── food.model.ts
│       │   ├── foods.service.ts
│       │   ├── foods.controller.ts
│       │   ├── foods.schemas.ts
│       │   └── foods.tests.ts
│       │
│       ├── diary/
│       │   ├── diary.model.ts
│       │   ├── diary.service.ts
│       │   ├── diary.controller.ts
│       │   ├── diary.schemas.ts
│       │   └── diary.tests.ts
│       │
│       ├── problematic-foods/
│       │   ├── problematic-food.model.ts
│       │   ├── problematic-foods.service.ts
│       │   ├── problematic-foods.controller.ts
│       │   └── problematic-foods.schemas.ts
│       │
│       ├── insights/
│       │   ├── insights.service.ts
│       │   ├── insights.controller.ts
│       │   └── insights.schemas.ts
│       │
│       ├── achievements/
│       │   ├── achievement.model.ts
│       │   ├── user-achievement.model.ts
│       │   ├── achievements.service.ts
│       │   └── achievements.controller.ts
│       │
│       ├── news/
│       │   ├── news.model.ts
│       │   ├── news.service.ts
│       │   └── news.controller.ts
│       │
│       └── admin/
│           ├── activity-log.model.ts
│           ├── system-settings.model.ts
│           ├── admin.service.ts
│           └── admin.controller.ts
│
├── tests/
│   ├── setup.ts
│   ├── helpers/
│   └── integration/
│
├── scripts/
│   ├── seed-foods.ts              # Popular banco com alimentos
│   ├── seed-achievements.ts       # Popular conquistas
│   └── migrate.ts                 # Migrações
│
├── docs/
│   ├── plans/
│   │   └── BACKEND-DEVELOPMENT-PLAN.md  # Este arquivo
│   └── api/
│       └── README.md
│
├── .env.example
├── .env
├── biome.json
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🎯 Etapas de Desenvolvimento

---

# ETAPA 01: Fundação e Configuração Base
**Status:** ✅ Concluída
**Estimativa:** 2-3 horas
**Dependências:** Nenhuma

## Objetivo
Criar a base sólida do projeto com todas as configurações necessárias para desenvolvimento seguro e escalável.

## Tarefas

### 1.1 Configuração de Ambiente
- [ ] Criar `.env.example` com todas as variáveis necessárias
- [ ] Implementar validação de env com Zod em `src/config/env.ts`
- [ ] Configurar variáveis:
  ```env
  # Server
  PORT=3333
  NODE_ENV=development
  
  # Database
  MONGODB_URI=mongodb://localhost:27017/ceboelha
  
  # JWT
  JWT_SECRET=your-super-secret-key-min-32-chars
  JWT_EXPIRES_IN=7d
  JWT_REFRESH_SECRET=your-refresh-secret-key
  JWT_REFRESH_EXPIRES_IN=30d
  
  # CORS
  CORS_ORIGIN=http://localhost:3000
  
  # Rate Limiting
  RATE_LIMIT_WINDOW_MS=60000
  RATE_LIMIT_MAX_REQUESTS=100
  ```

### 1.2 Conexão com MongoDB
- [ ] Implementar `src/config/database.ts` com:
  - Conexão com retry automático
  - Event listeners (connected, error, disconnected)
  - Graceful shutdown
  - Logs estruturados

### 1.3 Configuração do Elysia
- [ ] Criar `src/app.ts` com instância base do Elysia
- [ ] Configurar plugins:
  - `@elysiajs/cors` - CORS configurável por ambiente
  - `@elysiajs/swagger` - Documentação automática
  - `@elysiajs/bearer` - Extração de token
- [ ] Criar `src/index.ts` com:
  - Inicialização da conexão DB
  - Start do servidor
  - Graceful shutdown handlers

### 1.4 Estrutura de Erros
- [ ] Criar classe base `AppError` em `src/shared/errors/app-error.ts`
- [ ] Criar error handler global em `src/shared/errors/error-handler.ts`
- [ ] Implementar erros específicos:
  - `UnauthorizedError`
  - `ForbiddenError`
  - `NotFoundError`
  - `ValidationError`
  - `ConflictError`

### 1.5 Utilitários Base
- [ ] Criar helpers de response em `src/shared/utils/response.ts`:
  ```typescript
  success<T>(data: T, message?: string)
  error(message: string, statusCode: number)
  paginated<T>(data: T[], total: number, page: number, limit: number)
  ```
- [ ] Criar helpers de paginação em `src/shared/utils/pagination.ts`

### 1.6 Logger
- [ ] Configurar logger middleware com:
  - Request ID
  - Timestamp
  - Method, URL, Status Code
  - Response Time
  - Colorização por ambiente

## Arquivos a Criar
```
src/
├── index.ts
├── app.ts
├── config/
│   ├── env.ts
│   ├── database.ts
│   └── cors.ts
└── shared/
    ├── errors/
    │   ├── index.ts
    │   ├── app-error.ts
    │   └── error-handler.ts
    ├── utils/
    │   ├── response.ts
    │   └── pagination.ts
    └── middlewares/
        └── logger.middleware.ts
```

## Critérios de Aceitação
- [ ] Servidor inicia sem erros
- [ ] Conexão com MongoDB estabelecida
- [ ] Swagger UI acessível em `/swagger`
- [ ] Health check endpoint funcionando (`GET /health`)
- [ ] Erros são tratados e retornados de forma padronizada
- [ ] Logs aparecem formatados no console

## Testes Manuais
```bash
# Iniciar servidor
bun run dev

# Testar health check
curl http://localhost:3333/health

# Verificar Swagger
open http://localhost:3333/swagger
```

---

# ETAPA 02: Autenticação e Usuários
**Status:** ✅ Concluída (11/12/2024)
**Estimativa:** 3-4 horas
**Dependências:** Etapa 01

## Objetivo
Implementar sistema completo de autenticação JWT com registro, login e refresh token.

## Tarefas

### 2.1 Model de Usuário
- [x] Criar `src/modules/users/user.model.ts`:
  - Schema completo conforme `users.schema.md`
  - Middleware pre-save para hash de senha (bcrypt com salt rounds configurável)
  - Método `comparePassword()` timing-safe
  - Índices (email unique, status, lastActive)
  - Virtuals e transforms (ocultar password)

### 2.2 Refresh Token Model (ADICIONADO)
- [x] Criar `src/modules/auth/refresh-token.model.ts`:
  - Armazenamento de tokens com hash SHA-256
  - Rastreamento de dispositivos
  - Revogação de tokens
  - TTL automático (30 dias)
  - Token rotation para segurança

### 2.3 Login Attempt Model (ADICIONADO)
- [x] Criar `src/modules/auth/login-attempt.model.ts`:
  - Registro de tentativas de login (sucesso/falha)
  - Account lockout após tentativas falhas
  - Proteção contra brute force
  - Logs para auditoria de segurança

### 2.4 Auth Service
- [x] Criar `src/modules/auth/auth.service.ts`:
  - `register(name, email, password)` → cria usuário + tokens com validação de senha forte
  - `login(email, password)` → valida credenciais + tokens com proteção brute force
  - `refreshToken(refreshToken)` → gera novo access token COM rotação de refresh token
  - `logout(userId, refreshToken?, allDevices?)` → revoga tokens
  - `getActiveSessions(userId)` → lista sessões ativas
  - `revokeSession(userId, sessionId)` → revoga sessão específica

### 2.5 Auth Controller
- [x] Criar `src/modules/auth/auth.controller.ts`:
  ```
  POST /auth/register     - Criar conta (com validação de senha forte)
  POST /auth/login        - Autenticar (com proteção brute force)
  POST /auth/refresh      - Renovar token (com rotação)
  POST /auth/logout       - Logout (revoga token ou todos)
  GET  /auth/sessions     - Listar sessões ativas
  DELETE /auth/sessions/:id - Encerrar sessão específica
  ```

### 2.6 Validação de Schemas (Elysia)
- [x] Criar `src/modules/auth/auth.schemas.ts`:
  - `registerBodySchema` (body validation com regex anti-XSS)
  - `loginBodySchema` (body validation)
  - `refreshTokenBodySchema` (validação de formato hex)
  - `logoutBodySchema` (body validation)
  - `validatePasswordStrength()` - função de validação de força de senha

### 2.7 Auth Middleware
- [x] Criar `src/shared/middlewares/auth.middleware.ts`:
  - Extração de Bearer token
  - Verificação JWT com issuer/audience
  - Verificação de status do usuário
  - `requireAuth` - exige autenticação
  - `requireAdmin` - exige role admin

### 2.8 Rate Limiter Middleware (ADICIONADO)
- [x] Criar `src/shared/middlewares/rate-limiter.middleware.ts`:
  - `generalRateLimiter` - 100 req/min
  - `authRateLimiter` - 5 req/15min (proteção login)
  - `sensitiveRateLimiter` - 3 req/5min (operações sensíveis)
  - `globalRateLimiter` - 200 req/min por IP

### 2.9 Error Handler
- [x] Criar `src/shared/errors/error-handler.ts`:
  - Tratamento padronizado de erros
  - Erros específicos para auth
  - Stack trace em dev, oculto em prod

### 2.10 Easter Egg 💕
- [x] Implementar verificação de usuário especial em `src/shared/utils/index.ts`:
  - Detectar nome "Julia" (case insensitive)
  - Adicionar campos especiais na criação do usuário
  - Mensagens personalizadas de login

## Endpoints

| Method | Path | Auth | Descrição |
|--------|------|------|-----------|
| POST | /auth/register | ❌ | Criar nova conta |
| POST | /auth/login | ❌ | Login |
| POST | /auth/refresh | ❌ | Renovar access token |
| POST | /auth/logout | ✅ | Invalidar refresh token |

## Arquivos a Criar
```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   └── auth.schemas.ts
│   └── users/
│       └── user.model.ts
└── shared/
    ├── middlewares/
    │   └── auth.middleware.ts
    ├── plugins/
    │   └── jwt.plugin.ts
    └── utils/
        ├── password.ts
        └── easter-egg.ts
```

## Segurança Implementada
- ✅ Senhas com bcrypt (salt rounds = 10)
- ✅ JWT com expiration
- ✅ Refresh token rotation
- ✅ Senha nunca retornada em responses
- ✅ Validação de input rigorosa
- ✅ Rate limiting no login (prevenção brute force)

## Critérios de Aceitação
- [ ] Usuário consegue se registrar
- [ ] Usuário consegue fazer login
- [ ] Token JWT é gerado e válido
- [ ] Refresh token funciona
- [ ] Senhas são hasheadas
- [ ] Erros de validação retornam mensagens claras
- [ ] Easter egg funciona para "Julia" 💕

---

# ETAPA 03: Profile e Gerenciamento de Conta
**Status:** ✅ Concluída (12/12/2024)
**Estimativa:** 2-3 horas
**Dependências:** Etapa 02

## Objetivo
Implementar endpoints de perfil do usuário autenticado.

## Tarefas

### 3.1 Users Service
- [x] Criar `src/modules/users/users.service.ts`:
  - `getProfile(userId)` → retorna dados completos
  - `updateProfile(userId, data)` → atualiza dados
  - `updateEmail(userId, newEmail, password)` → verifica senha + atualiza
  - `updatePassword(userId, currentPassword, newPassword)`
  - `uploadAvatar(userId, file)` → salva e retorna URL
  - `deleteAccount(userId, password)` → soft delete ou hard delete

### 3.2 Profile Controller
- [x] Criar `src/modules/users/users.controller.ts`:
  ```
  GET /profile
  PATCH /profile
  POST /profile/email
  POST /profile/password
  POST /profile/avatar
  POST /profile/delete
  ```

### 3.3 Validação de Schemas
- [x] Criar `src/modules/users/users.schemas.ts`:
  - `updateProfileSchema`
  - `changeEmailSchema`
  - `changePasswordSchema`
  - `deleteAccountSchema`

### 3.4 Upload de Avatar (Básico)
- [x] Implementar upload básico com salvamento local (ou placeholder para S3/Cloudinary)
- [x] Validar tipo de arquivo (jpg, png, webp)
- [x] Limitar tamanho (max 5MB)

## Endpoints

| Method | Path | Auth | Descrição |
|--------|------|------|-----------|
| GET | /profile | ✅ | Buscar perfil |
| PATCH | /profile | ✅ | Atualizar perfil |
| POST | /profile/email | ✅ | Alterar email |
| POST | /profile/password | ✅ | Alterar senha |
| POST | /profile/avatar | ✅ | Upload de foto |
| POST | /profile/delete | ✅ | Deletar conta |

## Arquivos a Criar
```
src/modules/users/
├── users.service.ts
├── users.controller.ts
└── users.schemas.ts
```

## Critérios de Aceitação
- [x] Usuário consegue ver seu perfil
- [x] Usuário consegue atualizar nome e preferências
- [x] Alteração de email requer senha
- [x] Alteração de senha requer senha atual
- [x] Upload de avatar funciona
- [x] Exclusão de conta requer senha

---

# ETAPA 04: Base de Dados de Alimentos (Foods)
**Status:** ✅ Concluída (12/12/2025)
**Estimativa:** 3-4 horas
**Dependências:** Etapa 01

## Objetivo
Implementar a base de alimentos com busca otimizada e filtros FODMAP.

## Tarefas

### 4.1 Model de Food
- [x] Criar `src/modules/foods/food.model.ts`:
  - Schema completo conforme `foods.schema.md`
  - Índice de texto para busca
  - Índices para filtros (fodmap.level, category)
  - Dados nutricionais completos (macros, vitaminas, minerais)

### 4.2 Foods Service
- [x] Criar `src/modules/foods/foods.service.ts`:
  - `searchFoods(query, filters, pagination)` → busca com regex para autocomplete
  - `getFoodById(id)` → busca por ID numérico
  - `getCategories()` → lista categorias únicas
  - `incrementSearchCount(id)` → analytics

### 4.3 Foods Controller
- [x] Criar `src/modules/foods/foods.controller.ts`:
  ```
  GET /foods
  GET /foods/:id
  GET /foods/categories
  ```

### 4.4 Script de Seed
- [x] Criar `scripts/seed-foods.ts`:
  - Ler `unified_food_database.json` de ceboelha-data
  - Inserir 1372 alimentos no MongoDB
  - 748 alimentos com dados FODMAP
  - 21 categorias únicas
  - Criar índices de texto automaticamente

### 4.5 Otimização de Busca
- [x] Implementar busca com:
  - Regex para busca parcial/prefixo (melhor UX para autocomplete)
  - Filtro por nível FODMAP
  - Filtro por categoria
  - Paginação eficiente (limite 1-100)

## Endpoints

| Method | Path | Auth | Descrição |
|--------|------|------|-----------|
| GET | /foods | ❌* | Listar/buscar alimentos |
| GET | /foods/:id | ❌* | Buscar por ID |
| GET | /foods/categories | ❌* | Listar categorias |

> *Pode ser público ou autenticado, decidir baseado em uso

## Query Parameters para GET /foods
```
?search=maçã          # Busca textual
&level=low            # free | low | medium | high
&category=Frutas      # Categoria L1
&page=1               # Página
&limit=20             # Itens por página
```

## Arquivos a Criar
```
src/modules/foods/
├── food.model.ts
├── foods.service.ts
├── foods.controller.ts
└── foods.schemas.ts

scripts/
└── seed-foods.ts
```

## Critérios de Aceitação
- [x] Busca textual funciona com busca parcial ("alh" encontra "alho")
- [x] Filtros por FODMAP funcionam (free, low, medium, high)
- [x] Filtros por categoria funcionam (21 categorias)
- [x] Paginação funciona corretamente
- [x] Script de seed popula banco (1372 alimentos)
- [x] Integrado com frontend

---

# ETAPA 05: Diário Alimentar (Diary)
**Status:** ✅ Concluída
**Estimativa:** 4-5 horas
**Dependências:** Etapas 02, 04

## Objetivo
Implementar o diário alimentar completo com refeições e sintomas.

## Tarefas

### 5.1 Model de Diary Entry
- [x] Criar `src/modules/diary/diary.model.ts`:
  - Schema conforme `diary-entries.schema.md`
  - Índices compostos (userId + date)
  - Métodos para validação de tipo

### 5.2 Diary Service
- [x] Criar `src/modules/diary/diary.service.ts`:
  - `getEntries(userId, filters)` → listar com filtros
  - `getEntryById(userId, entryId)` → buscar específica
  - `getDaySummary(userId, date)` → resumo do dia
  - `getMonthSummary(userId, year, month)` → calendário
  - `getSymptomsOverview(userId, days)` → visão sintomas
  - `createMealEntry(userId, data)` → nova refeição
  - `createSymptomEntry(userId, data)` → novo sintoma
  - `updateEntry(userId, entryId, data)` → atualizar
  - `deleteEntry(userId, entryId)` → deletar

### 5.3 Diary Controller
- [x] Criar `src/modules/diary/diary.controller.ts`:
  ```
  GET /diary
  GET /diary/:id
  GET /diary/summary/day/:date
  GET /diary/summary/month/:year/:month
  GET /diary/symptoms/overview
  POST /diary/meal
  POST /diary/symptom
  PATCH /diary/:id
  DELETE /diary/:id
  ```

### 5.4 Atualização de Stats do Usuário
- [x] Ao criar entrada, atualizar `user.stats`:
  - `totalMealsLogged`
  - `totalSymptomsLogged`
  - `lastActive`
  - Calcular streak

### 5.5 Validação de Schemas
- [x] Criar `src/modules/diary/diary.schemas.ts`:
  - `createMealSchema`
  - `createSymptomSchema`
  - `updateEntrySchema`
  - `dateParamSchema`
  - `filtersSchema`

## Endpoints

| Method | Path | Auth | Descrição |
|--------|------|------|-----------|
| GET | /diary | ✅ | Listar entradas |
| GET | /diary/:id | ✅ | Buscar entrada |
| GET | /diary/summary/day/:date | ✅ | Resumo do dia |
| GET | /diary/summary/month/:year/:month | ✅ | Calendário mensal |
| GET | /diary/symptoms/overview | ✅ | Visão de sintomas |
| POST | /diary/meal | ✅ | Criar refeição |
| POST | /diary/symptom | ✅ | Criar sintoma |
| PATCH | /diary/:id | ✅ | Atualizar entrada |
| DELETE | /diary/:id | ✅ | Deletar entrada |

## Query Parameters para GET /diary
```
?date=2024-12-11      # Data específica
&startDate=2024-12-01 # Início do range
&endDate=2024-12-31   # Fim do range
&type=meal            # meal | symptom | all
```

## Arquivos a Criar
```
src/modules/diary/
├── diary.model.ts
├── diary.service.ts
├── diary.controller.ts
└── diary.schemas.ts
```

## Critérios de Aceitação
- [x] CRUD completo de entradas funciona
- [x] Filtros por data funcionam
- [x] Resumo do dia retorna dados corretos
- [x] Calendário mensal funciona
- [x] Stats do usuário são atualizadas
- [x] Validação de dados é rigorosa
- [x] Usuário só vê suas próprias entradas

---

# ETAPA 06: Alimentos Problemáticos
**Status:** ✅ Concluída
**Estimativa:** 2-3 horas
**Dependências:** Etapas 02, 04, 05

## Objetivo
Implementar tracking de alimentos problemáticos com incidentes.

## Tarefas

### 6.1 Model de Problematic Food
- [x] Criar `src/modules/problematic-foods/problematic-food.model.ts`:
  - Schema conforme `problematic-foods.schema.md`
  - Índice único (userId + foodId)
  - Métodos para calcular severidade

### 6.2 Problematic Foods Service
- [x] Criar `src/modules/problematic-foods/problematic-foods.service.ts`:
  - `getAll(userId)` → listar todos
  - `getByFoodId(userId, foodId)` → buscar específico
  - `markAsBad(userId, data)` → marcar alimento
  - `remove(userId, id)` → remover
  - `removeIncident(userId, id, incidentId)` → remover incidente

### 6.3 Problematic Foods Controller
- [x] Criar `src/modules/problematic-foods/problematic-foods.controller.ts`:
  ```
  GET /diary/problematic-foods
  GET /diary/problematic-foods/food/:foodId
  POST /diary/problematic-foods
  DELETE /diary/problematic-foods/:id
  DELETE /diary/problematic-foods/:id/incidents/:incidentId
  ```

### 6.4 Integração com Diary
- [x] Ao marcar alimento como "bad" em uma refeição:
  - Verificar se já existe registro
  - Criar novo ou adicionar incidente

## Endpoints

| Method | Path | Auth | Descrição |
|--------|------|------|-----------|
| GET | /diary/problematic-foods | ✅ | Listar problemáticos |
| GET | /diary/problematic-foods/food/:foodId | ✅ | Buscar por foodId |
| POST | /diary/problematic-foods | ✅ | Marcar como problemático |
| DELETE | /diary/problematic-foods/:id | ✅ | Remover |
| DELETE | /diary/problematic-foods/:id/incidents/:incidentId | ✅ | Remover incidente |

## Arquivos a Criar
```
src/modules/problematic-foods/
├── problematic-food.model.ts
├── problematic-foods.service.ts
├── problematic-foods.controller.ts
└── problematic-foods.schemas.ts
```

## Critérios de Aceitação
- [x] Marcação de alimento funciona
- [x] Incidentes são registrados corretamente
- [x] Remoção de incidente atualiza contadores
- [x] Não permite duplicatas (userId + foodId)
- [x] Status atualiza baseado em incidentes

---

# ETAPA 07: Insights (Análises e Estatísticas)
**Status:** ✅ Concluída
**Estimativa:** 3-4 horas
**Dependências:** Etapas 02, 05, 06

## Objetivo
Implementar análises e estatísticas baseadas nos dados do diário do usuário.

## Contexto
O módulo de Insights é responsável por analisar os dados do diário alimentar e identificar padrões, correlações e tendências. Não tem model próprio - utiliza dados do Diary e Problematic Foods.

## Tarefas

### 7.1 Insights Service
- [x] Criar `src/modules/insights/insights.service.ts`:

**getHighlights(userId)**
- Retorna destaques do dia para o usuário
- Tipos: `achievement`, `pattern`, `warning`, `tip`
- Verifica conquistas recentes
- Detecta padrões identificados
- Alertas sobre alimentos problemáticos
- Dica do dia aleatória

**getWeeklySummary(userId)**
- Estatísticas dos últimos 7 dias:
  - `daysLogged` - dias com registro
  - `totalSymptoms` - total de sintomas
  - `avgIntensity` - média de intensidade
  - `totalMeals` - refeições registradas
  - `uniqueFoods` - alimentos únicos
  - `comparisonLastWeek` - comparativo (%)
  - `streak` - dias consecutivos

**getDiscoveries(userId)**
- Análises baseadas nos dados:
  - `trigger` - alimento que causa sintomas (confiança alta/média)
  - `safe_food` - alimento seguro (sem marcações negativas)
  - `time_pattern` - padrões de horário
  - `combination` - combinações problemáticas

### 7.2 Algoritmos de Análise
- [x] Implementar detecção de correlações:
  - Correlação alimento → sintoma (janela de 2-6 horas)
  - Frequência de ocorrências
  - Nível de confiança (high/medium/low)
  - Detecção de horários problemáticos

### 7.3 Insights Controller
- [x] Criar `src/modules/insights/insights.controller.ts`:
  ```
  GET /insights/highlights      - Destaques do dia
  GET /insights/weekly-summary  - Resumo semanal
  GET /insights/discoveries     - Padrões identificados
  ```

### 7.4 Insights Schemas
- [x] Criar `src/modules/insights/insights.schemas.ts`:
  - Validação de query params (período, etc)

## Endpoints

| Method | Path | Auth | Descrição |
|--------|------|------|-----------|
| GET | /insights/highlights | ✅ | Destaques personalizados |
| GET | /insights/weekly-summary | ✅ | Resumo da semana |
| GET | /insights/discoveries | ✅ | Padrões identificados |

## Tipos de Retorno (conforme frontend)

```typescript
// Highlight
interface DailyHighlight {
  id: string;
  type: 'achievement' | 'pattern' | 'warning' | 'tip';
  emoji: string;
  title: string;
  message: string;
  action?: { label: string; href: string };
  priority: number;
  createdAt: string;
}

// Weekly Summary
interface WeeklySummary {
  daysLogged: number;
  totalSymptoms: number;
  avgIntensity: number;
  totalMeals: number;
  uniqueFoods: number;
  comparisonLastWeek: { symptoms: number; intensity: number };
  streak: number;
  periodStart: string;
  periodEnd: string;
}

// Discovery
interface Discovery {
  id: string;
  type: 'trigger' | 'time_pattern' | 'combination' | 'safe_food';
  confidence: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  data: { foods?: string[]; symptoms?: string[]; timeRange?: string; occurrences: number };
  discoveredAt: string;
  isNew: boolean;
}
```

## Arquivos a Criar
```
src/modules/insights/
├── index.ts
├── insights.service.ts
├── insights.controller.ts
└── insights.schemas.ts
```

## Critérios de Aceitação
- [ ] Highlights retorna dados relevantes do usuário
- [ ] Weekly summary calcula estatísticas corretamente
- [ ] Discoveries identifica padrões reais baseado nos dados
- [ ] Correlações têm nível de confiança correto
- [ ] Performance aceitável (< 500ms)

---

# ETAPA 08: News (Artigos e Conteúdo)
**Status:** ✅ Concluída
**Estimativa:** 2-3 horas
**Dependências:** Etapa 01

## Objetivo
Implementar o sistema de artigos, receitas, dicas e conteúdo educacional.

## Contexto
O módulo News é independente - tem endpoints públicos para leitura (qualquer usuário autenticado) e endpoints admin para gerenciamento (CRUD). Aqui implementamos apenas a parte pública.

## Tarefas

### 8.1 News Model
- [x] Criar `src/modules/news/news.model.ts`:

```typescript
interface INewsArticle {
  _id: ObjectId;
  
  // Conteúdo
  title: string;           // Título do artigo
  excerpt: string;         // Resumo/preview
  content: string;         // Conteúdo completo (Markdown)
  imageUrl?: string;       // URL da imagem de capa
  
  // Categorização
  category: 'recipe' | 'article' | 'tip' | 'wellness' | 'news';
  tags: string[];
  
  // Metadata
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  source?: string;         // Fonte externa (ex: "Monash University")
  
  // Datas
  publishedAt: Date;
  
  // Controle
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  
  // Analytics
  views: number;
  likes: number;
  
  // Receitas (quando category === 'recipe')
  recipe?: {
    prepTime: number;      // Minutos
    cookTime: number;
    servings: number;
    difficulty: 'easy' | 'medium' | 'hard';
    ingredients: string[];
    instructions: string[];
    nutrition?: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      fiber_g: number;
    };
    fodmapFriendly: boolean;
    fodmapPhase: 'elimination' | 'reintroduction' | 'maintenance';
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 8.2 News Service
- [x] Criar `src/modules/news/news.service.ts`:

**getArticles(filters)**
- Lista artigos publicados
- Filtro por categoria
- Paginação
- Ordenação por data

**getArticleById(id)**
- Busca artigo por ID
- Incrementa contador de views
- Retorna conteúdo completo

### 8.3 News Controller (Público)
- [x] Criar `src/modules/news/news.controller.ts`:
  ```
  GET /news           - Listar artigos (paginado)
  GET /news/featured  - Artigos em destaque
  GET /news/tags      - Listar todas as tags
  GET /news/recipes   - Apenas receitas
  GET /news/:id       - Artigo específico
  POST /news/:id/like - Curtir artigo
  DELETE /news/:id/like - Descurtir artigo
  ```

### 8.4 News Schemas
- [x] Criar `src/modules/news/news.schemas.ts`:
  - Query params para listagem
  - Validação de ID

### 8.5 Script de Seed
- [x] Criar `scripts/seed-news.ts`:
  - Popular com artigos iniciais
  - Receitas Low FODMAP
  - Dicas práticas
  - Conteúdo de bem-estar

## Endpoints

| Method | Path | Auth | Descrição |
|--------|------|------|-----------|
| GET | /insights/news | ✅ | Listar artigos publicados |
| GET | /insights/news/:id | ✅ | Buscar artigo por ID |

## Query Parameters
```
GET /insights/news
  ?category=recipe    # recipe | article | tip | wellness | news | all
  &page=1             # Página atual
  &limit=10           # Itens por página
```

## Arquivos a Criar
```
src/modules/news/
├── index.ts
├── news.model.ts
├── news.service.ts
├── news.controller.ts
└── news.schemas.ts

scripts/
└── seed-news.ts
```

## Critérios de Aceitação
- [ ] Listagem de artigos funciona
- [ ] Filtro por categoria funciona
- [ ] Paginação funciona corretamente
- [ ] Busca por ID retorna conteúdo completo
- [ ] Contador de views incrementa
- [ ] Seed popula artigos iniciais

---

# ETAPA 09: Achievements (Conquistas)
**Status:** ⬜ Não Iniciada
**Estimativa:** 3-4 horas
**Dependências:** Etapas 02, 05

## Objetivo
Implementar o sistema de conquistas com progresso e desbloqueio automático.

## Contexto
O módulo de Achievements usa duas collections:
1. **achievements** - Master data (definições das conquistas)
2. **userAchievements** - Progresso por usuário

## Tarefas

### 9.1 Achievement Model (Master Data)
- [ ] Criar `src/modules/achievements/achievement.model.ts`:

```typescript
interface IAchievement {
  _id: ObjectId;
  id: string;              // ID único (ex: 'first_meal', 'week_streak')
  
  // Informações
  title: string;
  description: string;
  icon: string;            // Emoji
  color: string;           // Hex color
  
  // Categoria
  category: 'diary' | 'streak' | 'exploration' | 'social' | 'special';
  
  // Condições
  requirement: {
    type: 'count' | 'streak' | 'unique' | 'custom';
    target: number;
    metric: string;        // 'meals_logged' | 'days_streak' | 'foods_tested' | etc
  };
  
  // Recompensa
  reward: {
    points: number;        // XP
    badge?: string;
  };
  
  // Raridade
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  
  // Controle
  hidden: boolean;         // Conquista secreta
  active: boolean;
  order: number;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 9.2 User Achievement Model (Progresso)
- [ ] Criar `src/modules/achievements/user-achievement.model.ts`:

```typescript
interface IUserAchievement {
  _id: ObjectId;
  userId: ObjectId;
  achievementId: string;   // Referência ao Achievement.id
  
  // Status
  unlocked: boolean;
  progress: number;        // 0 - target
  progressPercent: number; // 0-100
  
  // Datas
  startedAt: Date;
  unlockedAt?: Date;
  
  // Notificação
  notified: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### 9.3 Achievements Service
- [ ] Criar `src/modules/achievements/achievements.service.ts`:

**getAll(userId)**
- Retorna todas as conquistas organizadas:
  - `unlocked` - Já desbloqueadas
  - `inProgress` - Com progresso parcial
  - `locked` - Ainda não iniciadas

**checkAndUnlock(userId, metric, value)**
- Verifica se uma métrica desbloqueou conquistas
- Atualiza progresso
- Marca como desbloqueada se atingiu target

**initializeUserAchievements(userId)**
- Cria registros iniciais para novo usuário

### 9.4 Integração com Diary
- [ ] Ao criar entrada no diário:
  - Atualizar métricas relevantes:
    - `meals_logged` - Ao criar refeição
    - `symptoms_logged` - Ao criar sintoma
    - `days_streak` - Dias consecutivos
    - `foods_tested` - Alimentos únicos
  - Verificar conquistas pendentes

### 9.5 Achievements Controller
- [ ] Criar `src/modules/achievements/achievements.controller.ts`:
  ```
  GET /achievements  - Todas conquistas + progresso do usuário
  ```

### 9.6 Script de Seed
- [ ] Criar `scripts/seed-achievements.ts`:
  - Popular conquistas master

## Conquistas Iniciais (Seed)

| ID | Título | Tipo | Meta | Raridade |
|----|--------|------|------|----------|
| `first_meal` | Primeira Refeição | count | 1 meal | common |
| `explorer_10` | Curioso | unique | 10 foods | common |
| `explorer_50` | Explorador | unique | 50 foods | rare |
| `explorer_100` | Colecionador | unique | 100 foods | epic |
| `week_streak` | Uma Semana | streak | 7 days | rare |
| `month_streak` | Um Mês | streak | 30 days | epic |
| `symptom_tracker` | Rastreador | count | 20 symptoms | common |
| `trigger_hunter` | Caçador | count | 5 triggers | rare |
| `safe_foods` | Conhecedor | count | 10 safe foods | rare |
| `easter_egg_julia` | 💕 Amor Verdadeiro | custom | secret | legendary |

## Endpoints

| Method | Path | Auth | Descrição |
|--------|------|------|-----------|
| GET | /achievements | ✅ | Conquistas + progresso |

## Tipo de Retorno (conforme frontend)

```typescript
interface AchievementsData {
  unlocked: Achievement[];   // Com unlockedAt
  inProgress: Achievement[]; // Com progress.current/target
  locked: Achievement[];     // Sem progresso
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  xpReward: number;
  unlockedAt?: string;
  progress?: { current: number; target: number };
}
```

## Arquivos a Criar
```
src/modules/achievements/
├── index.ts
├── achievement.model.ts
├── user-achievement.model.ts
├── achievements.service.ts
├── achievements.controller.ts
└── achievements.schemas.ts

scripts/
└── seed-achievements.ts
```

## Critérios de Aceitação
- [ ] Conquistas master são populadas pelo seed
- [ ] Progresso é atualizado ao criar entradas no diário
- [ ] Desbloqueio automático quando atinge target
- [ ] Retorno organizado (unlocked/inProgress/locked)
- [ ] Easter egg funciona para Julia 💕

---

# ETAPA 10: Módulo Admin
**Status:** ⬜ Não Iniciada
**Estimativa:** 5-6 horas
**Dependências:** Todas as etapas anteriores

## Objetivo
Implementar painel administrativo completo para gerenciar usuários, alimentos, notícias e configurações do sistema.

## Contexto
O módulo Admin já tem os models criados (activity-log.model.ts, system-settings.model.ts). Agora falta implementar o service, controller e os endpoints CRUD.

## Tarefas

### 10.1 Admin Middleware
- [ ] Criar `src/shared/middlewares/admin.middleware.ts`:
  - Verificar se `user.role === 'admin'`
  - Retornar 403 se não for admin

### 10.2 Activity Log Service
- [ ] Completar service em `src/modules/admin/admin.service.ts`:
  - `logActivity(data)` - Registrar ação
  - `getActivityLogs(filters)` - Listar logs com filtros

### 10.3 Admin Dashboard
- [ ] Implementar `getDashboardStats()`:
  - Total de usuários (ativos, novos hoje/semana)
  - Total de alimentos
  - Total de entradas no diário
  - Usuários ativos hoje
  - Sintomas registrados (total, média)

### 10.4 Admin Analytics
- [ ] Implementar `getAnalytics(period)`:
  - Gráfico de usuários por dia/semana/mês
  - Gráfico de entradas no diário
  - Alimentos mais buscados
  - Sintomas mais registrados

### 10.5 Admin Users CRUD
- [ ] Implementar endpoints:
  ```
  GET /admin/users          - Listar com filtros e paginação
  GET /admin/users/:id      - Detalhe do usuário
  POST /admin/users         - Criar usuário
  PATCH /admin/users/:id    - Atualizar usuário
  DELETE /admin/users/:id   - Deletar usuário (soft delete)
  ```

### 10.6 Admin Foods CRUD
- [ ] Implementar endpoints:
  ```
  GET /admin/foods          - Listar com filtros e paginação
  GET /admin/foods/:id      - Detalhe do alimento
  POST /admin/foods         - Criar alimento
  PATCH /admin/foods/:id    - Atualizar alimento
  DELETE /admin/foods/:id   - Deletar alimento
  ```

### 10.7 Admin News CRUD
- [ ] Implementar endpoints:
  ```
  GET /admin/news           - Listar todos (incluindo drafts)
  GET /admin/news/:id       - Detalhe do artigo
  POST /admin/news          - Criar artigo
  PATCH /admin/news/:id     - Atualizar artigo
  DELETE /admin/news/:id    - Deletar artigo
  ```

### 10.8 System Settings
- [ ] Implementar endpoints:
  ```
  GET /admin/settings       - Obter configurações
  PATCH /admin/settings     - Atualizar configurações
  ```

### 10.9 Admin Controller
- [ ] Criar `src/modules/admin/admin.controller.ts`:
  - Agrupar todos os endpoints admin
  - Aplicar middleware de admin em todas as rotas

## Endpoints Admin

| Method | Path | Auth | Descrição |
|--------|------|------|-----------|
| GET | /admin/dashboard/stats | 🔒 Admin | Estatísticas do dashboard |
| GET | /admin/activity-log | 🔒 Admin | Logs de atividade |
| GET | /admin/analytics | 🔒 Admin | Analytics (gráficos) |
| GET | /admin/users | 🔒 Admin | Listar usuários |
| GET | /admin/users/:id | 🔒 Admin | Detalhe usuário |
| POST | /admin/users | 🔒 Admin | Criar usuário |
| PATCH | /admin/users/:id | 🔒 Admin | Atualizar usuário |
| DELETE | /admin/users/:id | 🔒 Admin | Deletar usuário |
| GET | /admin/foods | 🔒 Admin | Listar alimentos |
| GET | /admin/foods/:id | 🔒 Admin | Detalhe alimento |
| POST | /admin/foods | 🔒 Admin | Criar alimento |
| PATCH | /admin/foods/:id | 🔒 Admin | Atualizar alimento |
| DELETE | /admin/foods/:id | 🔒 Admin | Deletar alimento |
| GET | /admin/news | 🔒 Admin | Listar artigos |
| GET | /admin/news/:id | 🔒 Admin | Detalhe artigo |
| POST | /admin/news | 🔒 Admin | Criar artigo |
| PATCH | /admin/news/:id | 🔒 Admin | Atualizar artigo |
| DELETE | /admin/news/:id | 🔒 Admin | Deletar artigo |
| GET | /admin/settings | 🔒 Admin | Ver configurações |
| PATCH | /admin/settings | 🔒 Admin | Atualizar config |

## Arquivos a Criar/Completar
```
src/modules/admin/
├── index.ts
├── activity-log.model.ts    # ✅ Já existe
├── system-settings.model.ts # ✅ Já existe
├── admin.service.ts
├── admin.controller.ts
└── admin.schemas.ts

src/shared/middlewares/
└── admin.middleware.ts
```

## Critérios de Aceitação
- [ ] Apenas admins acessam rotas /admin/*
- [ ] Dashboard mostra estatísticas corretas
- [ ] Logs são registrados automaticamente em ações importantes
- [ ] CRUD de usuários funciona (com soft delete)
- [ ] CRUD de alimentos funciona
- [ ] CRUD de news funciona (draft/published/archived)
- [ ] System settings funciona (modo manutenção, feature flags)

---

# ETAPA FINAL: Testes, Documentação e Deploy
**Status:** ⬜ Não Iniciada
**Estimativa:** 3-4 horas
**Dependências:** Todas as etapas

## Objetivo
Finalizar o projeto com testes, documentação e preparação para deploy.

## Tarefas

### Testes
- [ ] Configurar ambiente de testes com Bun
- [ ] Testes unitários para services críticos
- [ ] Testes de integração para endpoints principais
- [ ] Setup de banco de teste

### Documentação
- [ ] Finalizar documentação Swagger
- [ ] Criar README.md completo
- [ ] Documentar variáveis de ambiente

### Segurança Final
- [ ] Audit de dependências
- [ ] Verificar rate limiting
- [ ] Verificar CORS
- [ ] Headers de segurança (Helmet equivalente)

### Performance
- [ ] Verificar índices MongoDB
- [ ] Verificar queries N+1
- [ ] Implementar cache onde necessário

### Deploy
- [ ] Dockerfile
- [ ] docker-compose para desenvolvimento
- [ ] Scripts de CI/CD
- [ ] Configurações de produção

---

## 📅 Cronograma Estimado

| Etapa | Descrição | Tempo | Status |
|-------|-----------|-------|--------|
| 01 | Fundação | 2-3h | ✅ |
| 02 | Auth + Users | 3-4h | ✅ |
| 03 | Profile | 2-3h | ✅ |
| 04 | Foods | 3-4h | ✅ |
| 05 | Diary | 4-5h | ✅ |
| 06 | Problematic Foods | 2-3h | ✅ |
| 07 | Insights | 3-4h | ⏳ Próxima |
| 08 | News | 2-3h | ⬜ |
| 09 | Achievements | 3-4h | ⬜ |
| 10 | Admin | 5-6h | ⬜ |
| Final | Testes + Deploy | 3-4h | ⬜ |

**Total Estimado:** 33-43 horas de desenvolvimento
**Concluído:** ~17-22 horas (Etapas 01-06)

---

## 🔐 Boas Práticas de Segurança

1. **Autenticação**
   - JWT com expiração curta (15min - 7d)
   - Refresh token com expiração longa (30d)
   - Invalidação de tokens no logout

2. **Senhas**
   - Bcrypt com salt rounds = 10-12
   - Nunca retornar em responses
   - Validação de força mínima

3. **Autorização**
   - Verificar ownership em todas operações
   - Middleware de admin para rotas restritas
   - Rate limiting por IP e por usuário

4. **Input Validation**
   - Validação com TypeBox em todos endpoints
   - Sanitização de inputs
   - Limites de tamanho

5. **MongoDB**
   - Índices otimizados
   - Queries com projection (não retornar campos desnecessários)
   - Timeout em queries

---

## 📝 Notas

- Todas as etapas devem ser concluídas em ordem
- Após cada etapa, aguardar aprovação antes de prosseguir
- Marcar checkboxes conforme tarefas são completadas
- Commits frequentes com mensagens descritivas

---

## 💕 Easter Egg Reminder

Não esquecer de implementar o tratamento especial para usuários com nome "Julia":
- Flag `isSpecial: true`
- Mensagens personalizadas
- Love level counter
- Features especiais

---

*Documento criado em 11/12/2024*
*Projeto Ceboelha - Gerenciamento de Dieta FODMAP*
