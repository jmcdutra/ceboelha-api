# 🧅 Ceboelha API - Plano de Desenvolvimento do Backend

> **Última Atualização:** 11/12/2024
> **Status:** 📋 Planejamento Concluído - Aguardando Aprovação
> **Stack:** Bun + Elysia + Mongoose + MongoDB

---

## 📊 Resumo Executivo

Este documento contém o plano completo de desenvolvimento do backend da aplicação Ceboelha, dividido em **8 etapas** progressivas. Cada etapa foi pensada para construir sobre a anterior, garantindo um backend **seguro**, **rápido**, **otimizado** e seguindo **boas práticas**.

### Endpoints Totais a Implementar
| Módulo | Endpoints | Prioridade |
|--------|-----------|------------|
| Auth | 3 | 🔴 Alta |
| Profile | 6 | 🔴 Alta |
| Foods | 3 | 🔴 Alta |
| Diary | 10 | 🔴 Alta |
| Problematic Foods | 5 | 🟡 Média |
| Insights | 6 | 🟡 Média |
| Admin | 15+ | 🟢 Baixa |

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
**Status:** ⬜ Não Iniciada
**Estimativa:** 2-3 horas
**Dependências:** Etapa 02

## Objetivo
Implementar endpoints de perfil do usuário autenticado.

## Tarefas

### 3.1 Users Service
- [ ] Criar `src/modules/users/users.service.ts`:
  - `getProfile(userId)` → retorna dados completos
  - `updateProfile(userId, data)` → atualiza dados
  - `updateEmail(userId, newEmail, password)` → verifica senha + atualiza
  - `updatePassword(userId, currentPassword, newPassword)`
  - `uploadAvatar(userId, file)` → salva e retorna URL
  - `deleteAccount(userId, password)` → soft delete ou hard delete

### 3.2 Profile Controller
- [ ] Criar `src/modules/users/users.controller.ts`:
  ```
  GET /profile
  PATCH /profile
  POST /profile/email
  POST /profile/password
  POST /profile/avatar
  POST /profile/delete
  ```

### 3.3 Validação de Schemas
- [ ] Criar `src/modules/users/users.schemas.ts`:
  - `updateProfileSchema`
  - `changeEmailSchema`
  - `changePasswordSchema`
  - `deleteAccountSchema`

### 3.4 Upload de Avatar (Básico)
- [ ] Implementar upload básico com salvamento local (ou placeholder para S3/Cloudinary)
- [ ] Validar tipo de arquivo (jpg, png, webp)
- [ ] Limitar tamanho (max 5MB)

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
- [ ] Usuário consegue ver seu perfil
- [ ] Usuário consegue atualizar nome e preferências
- [ ] Alteração de email requer senha
- [ ] Alteração de senha requer senha atual
- [ ] Upload de avatar funciona
- [ ] Exclusão de conta requer senha

---

# ETAPA 04: Base de Dados de Alimentos (Foods)
**Status:** ⬜ Não Iniciada
**Estimativa:** 3-4 horas
**Dependências:** Etapa 01

## Objetivo
Implementar a base de alimentos com busca otimizada e filtros FODMAP.

## Tarefas

### 4.1 Model de Food
- [ ] Criar `src/modules/foods/food.model.ts`:
  - Schema completo conforme `foods.schema.md`
  - Índice de texto para busca
  - Índices para filtros (fodmap.level, category)
  - Virtual para `displayName`

### 4.2 Foods Service
- [ ] Criar `src/modules/foods/foods.service.ts`:
  - `search(query, filters, pagination)` → busca com text search
  - `getById(id)` → busca por ID
  - `getCategories()` → lista categorias únicas
  - `incrementSearchCount(id)` → analytics

### 4.3 Foods Controller
- [ ] Criar `src/modules/foods/foods.controller.ts`:
  ```
  GET /foods
  GET /foods/:id
  GET /foods/categories
  ```

### 4.4 Script de Seed
- [ ] Criar `scripts/seed-foods.ts`:
  - Ler `unified_food_database.json` de ceboelha-data
  - Inserir todos os alimentos no MongoDB
  - Criar índices automaticamente

### 4.5 Otimização de Busca
- [ ] Implementar busca com:
  - Text search do MongoDB
  - Relevance score
  - Filtro por nível FODMAP
  - Filtro por categoria
  - Paginação eficiente

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
- [ ] Busca textual funciona com relevância
- [ ] Filtros por FODMAP funcionam
- [ ] Filtros por categoria funcionam
- [ ] Paginação funciona corretamente
- [ ] Script de seed popula banco
- [ ] Performance: < 100ms para buscas

---

# ETAPA 05: Diário Alimentar (Diary)
**Status:** ⬜ Não Iniciada
**Estimativa:** 4-5 horas
**Dependências:** Etapas 02, 04

## Objetivo
Implementar o diário alimentar completo com refeições e sintomas.

## Tarefas

### 5.1 Model de Diary Entry
- [ ] Criar `src/modules/diary/diary.model.ts`:
  - Schema conforme `diary-entries.schema.md`
  - Índices compostos (userId + date)
  - Métodos para validação de tipo

### 5.2 Diary Service
- [ ] Criar `src/modules/diary/diary.service.ts`:
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
- [ ] Criar `src/modules/diary/diary.controller.ts`:
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
- [ ] Ao criar entrada, atualizar `user.stats`:
  - `totalMealsLogged`
  - `totalSymptomsLogged`
  - `lastActive`
  - Calcular streak

### 5.5 Validação de Schemas
- [ ] Criar `src/modules/diary/diary.schemas.ts`:
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
- [ ] CRUD completo de entradas funciona
- [ ] Filtros por data funcionam
- [ ] Resumo do dia retorna dados corretos
- [ ] Calendário mensal funciona
- [ ] Stats do usuário são atualizadas
- [ ] Validação de dados é rigorosa
- [ ] Usuário só vê suas próprias entradas

---

# ETAPA 06: Alimentos Problemáticos
**Status:** ⬜ Não Iniciada
**Estimativa:** 2-3 horas
**Dependências:** Etapas 02, 04, 05

## Objetivo
Implementar tracking de alimentos problemáticos com incidentes.

## Tarefas

### 6.1 Model de Problematic Food
- [ ] Criar `src/modules/problematic-foods/problematic-food.model.ts`:
  - Schema conforme `problematic-foods.schema.md`
  - Índice único (userId + foodId)
  - Métodos para calcular severidade

### 6.2 Problematic Foods Service
- [ ] Criar `src/modules/problematic-foods/problematic-foods.service.ts`:
  - `getAll(userId)` → listar todos
  - `getByFoodId(userId, foodId)` → buscar específico
  - `markAsBad(userId, data)` → marcar alimento
  - `remove(userId, id)` → remover
  - `removeIncident(userId, id, incidentId)` → remover incidente

### 6.3 Problematic Foods Controller
- [ ] Criar `src/modules/problematic-foods/problematic-foods.controller.ts`:
  ```
  GET /diary/problematic-foods
  GET /diary/problematic-foods/food/:foodId
  POST /diary/problematic-foods
  DELETE /diary/problematic-foods/:id
  DELETE /diary/problematic-foods/:id/incidents/:incidentId
  ```

### 6.4 Integração com Diary
- [ ] Ao marcar alimento como "bad" em uma refeição:
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
- [ ] Marcação de alimento funciona
- [ ] Incidentes são registrados corretamente
- [ ] Remoção de incidente atualiza contadores
- [ ] Não permite duplicatas (userId + foodId)
- [ ] Status atualiza baseado em incidentes

---

# ETAPA 07: Insights e Conquistas
**Status:** ⬜ Não Iniciada
**Estimativa:** 4-5 horas
**Dependências:** Etapas 02, 05, 06

## Objetivo
Implementar insights baseados em dados e sistema de conquistas.

## Tarefas

### 7.1 Insights Service
- [ ] Criar `src/modules/insights/insights.service.ts`:
  - `getHighlights(userId)` → destaques do dia
  - `getWeeklySummary(userId)` → resumo semanal
  - `getDiscoveries(userId)` → padrões identificados
  - Algoritmos para identificar:
    - Correlação alimento → sintoma
    - Tendências de intensidade
    - Horários mais problemáticos

### 7.2 Insights Controller
- [ ] Criar `src/modules/insights/insights.controller.ts`:
  ```
  GET /insights/highlights
  GET /insights/weekly-summary
  GET /insights/discoveries
  ```

### 7.3 Achievement Model
- [ ] Criar `src/modules/achievements/achievement.model.ts`:
  - Master data de conquistas
- [ ] Criar `src/modules/achievements/user-achievement.model.ts`:
  - Progresso por usuário

### 7.4 Achievements Service
- [ ] Criar `src/modules/achievements/achievements.service.ts`:
  - `getAll(userId)` → todas conquistas + progresso
  - `checkAndUnlock(userId, metric)` → verificar e desbloquear
  - Integração com eventos do diário

### 7.5 Achievements Controller
- [ ] Criar `src/modules/achievements/achievements.controller.ts`:
  ```
  GET /insights/achievements
  ```

### 7.6 Script de Seed de Conquistas
- [ ] Criar `scripts/seed-achievements.ts`:
  - Popular conquistas master

## Endpoints

| Method | Path | Auth | Descrição |
|--------|------|------|-----------|
| GET | /insights/highlights | ✅ | Destaques do dia |
| GET | /insights/weekly-summary | ✅ | Resumo semanal |
| GET | /insights/discoveries | ✅ | Descobertas |
| GET | /insights/achievements | ✅ | Conquistas |

## Arquivos a Criar
```
src/modules/
├── insights/
│   ├── insights.service.ts
│   ├── insights.controller.ts
│   └── insights.schemas.ts
└── achievements/
    ├── achievement.model.ts
    ├── user-achievement.model.ts
    ├── achievements.service.ts
    └── achievements.controller.ts

scripts/
└── seed-achievements.ts
```

## Critérios de Aceitação
- [ ] Highlights retorna dados relevantes
- [ ] Weekly summary calcula corretamente
- [ ] Discoveries identifica padrões
- [ ] Conquistas são desbloqueadas automaticamente
- [ ] Progresso é salvo corretamente

---

# ETAPA 08: Módulo Admin
**Status:** ⬜ Não Iniciada
**Estimativa:** 5-6 horas
**Dependências:** Todas as etapas anteriores

## Objetivo
Implementar painel administrativo completo.

## Tarefas

### 8.1 Admin Middleware
- [ ] Criar `src/shared/middlewares/admin.middleware.ts`:
  - Verificar se `user.role === 'admin'`
  - Retornar 403 se não for admin

### 8.2 Activity Log Model
- [ ] Criar `src/modules/admin/activity-log.model.ts`:
  - Schema conforme `activity-logs.schema.md`
- [ ] Criar service para logging automático

### 8.3 System Settings Model
- [ ] Criar `src/modules/admin/system-settings.model.ts`:
  - Singleton conforme `system-settings.schema.md`

### 8.4 News Model
- [ ] Criar `src/modules/news/news.model.ts`:
  - Schema conforme `news-articles.schema.md`
  - Índice de texto para busca

### 8.5 Admin Service
- [ ] Criar `src/modules/admin/admin.service.ts`:
  - `getDashboardStats()` → estatísticas
  - `getActivityLogs(filters)` → logs
  - `getAnalytics(period)` → analytics

### 8.6 Admin Users
- [ ] CRUD de usuários para admin:
  - `getUsers(filters)` → listar
  - `getUser(id)` → detalhe
  - `createUser(data)` → criar
  - `updateUser(id, data)` → atualizar
  - `deleteUser(id)` → deletar

### 8.7 Admin Foods
- [ ] CRUD de alimentos para admin:
  - Gerenciar base de alimentos
  - Aprovar contribuições

### 8.8 Admin News
- [ ] CRUD de notícias/artigos:
  - Criar, editar, publicar, arquivar

### 8.9 System Settings
- [ ] Gerenciar configurações:
  - Feature flags
  - Limites do sistema
  - Modo manutenção

### 8.10 News Controller (Público)
- [ ] Criar endpoints públicos para news:
  ```
  GET /insights/news
  GET /insights/news/:id
  ```

## Endpoints Admin

| Method | Path | Auth | Descrição |
|--------|------|------|-----------|
| GET | /admin/dashboard/stats | 🔒 Admin | Dashboard |
| GET | /admin/activity-log | 🔒 Admin | Logs |
| GET | /admin/analytics | 🔒 Admin | Analytics |
| GET | /admin/users | 🔒 Admin | Listar usuários |
| GET | /admin/users/:id | 🔒 Admin | Detalhe usuário |
| POST | /admin/users | 🔒 Admin | Criar usuário |
| PATCH | /admin/users/:id | 🔒 Admin | Atualizar usuário |
| DELETE | /admin/users/:id | 🔒 Admin | Deletar usuário |
| GET | /admin/foods | 🔒 Admin | Listar alimentos |
| POST | /admin/foods | 🔒 Admin | Criar alimento |
| PATCH | /admin/foods/:id | 🔒 Admin | Atualizar alimento |
| DELETE | /admin/foods/:id | 🔒 Admin | Deletar alimento |
| GET | /admin/news | 🔒 Admin | Listar artigos |
| POST | /admin/news | 🔒 Admin | Criar artigo |
| PATCH | /admin/news/:id | 🔒 Admin | Atualizar artigo |
| DELETE | /admin/news/:id | 🔒 Admin | Deletar artigo |
| GET | /admin/settings | 🔒 Admin | Ver configurações |
| PATCH | /admin/settings | 🔒 Admin | Atualizar config |

## Arquivos a Criar
```
src/modules/
├── admin/
│   ├── activity-log.model.ts
│   ├── system-settings.model.ts
│   ├── admin.service.ts
│   └── admin.controller.ts
└── news/
    ├── news.model.ts
    ├── news.service.ts
    └── news.controller.ts

src/shared/middlewares/
└── admin.middleware.ts
```

## Critérios de Aceitação
- [ ] Dashboard mostra estatísticas corretas
- [ ] Logs são registrados automaticamente
- [ ] CRUD de usuários funciona
- [ ] CRUD de alimentos funciona
- [ ] CRUD de news funciona
- [ ] System settings funciona
- [ ] Apenas admins acessam rotas admin

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

| Etapa | Descrição | Tempo | Acumulado |
|-------|-----------|-------|-----------|
| 01 | Fundação | 2-3h | 2-3h |
| 02 | Auth + Users | 3-4h | 5-7h |
| 03 | Profile | 2-3h | 7-10h |
| 04 | Foods | 3-4h | 10-14h |
| 05 | Diary | 4-5h | 14-19h |
| 06 | Problematic Foods | 2-3h | 16-22h |
| 07 | Insights + Achievements | 4-5h | 20-27h |
| 08 | Admin | 5-6h | 25-33h |
| Final | Testes + Deploy | 3-4h | 28-37h |

**Total Estimado:** 28-37 horas de desenvolvimento

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
