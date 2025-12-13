# MongoDB Configuration Guide

Este guia explica como o MongoDB está configurado no Ceboelha API e como usar autenticação corretamente.

## 📋 Visão Geral

O backend Ceboelha API suporta **três tipos de configuração de MongoDB**:

1. **Local sem autenticação** (desenvolvimento simples)
2. **Local com autenticação** (Docker/Docker Compose)
3. **MongoDB Atlas** (cloud com autenticação)

## 🔧 Configuração por Ambiente

### 1. Desenvolvimento Local (sem Docker)

Para desenvolvimento local rápido, sem autenticação:

```env
MONGODB_URI=mongodb://localhost:27017/ceboelha
```

Inicie o MongoDB localmente:
```bash
# MongoDB instalado diretamente
mongod

# Ou com Docker sem autenticação
docker run -d -p 27017:27017 mongo:7
```

### 2. Docker Compose (com autenticação)

O arquivo `docker-compose.yml` já está configurado com autenticação:

```yaml
# Variáveis de ambiente no docker-compose.yml
MONGODB_URI=mongodb://${MONGO_ROOT_USER:-admin}:${MONGO_ROOT_PASSWORD}@mongo:27017/ceboelha?authSource=admin
```

**Importante**: Configure as variáveis de ambiente:

```env
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=sua_senha_forte_aqui
```

### 3. MongoDB Atlas (Cloud)

Para produção com MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ceboelha?retryWrites=true&w=majority
```

## 🔐 Entendendo authSource

O parâmetro `authSource=admin` é **obrigatório** quando:
- O usuário foi criado no banco `admin`
- Você está usando `MONGO_INITDB_ROOT_USERNAME` e `MONGO_INITDB_ROOT_PASSWORD` (caso do Docker)

### Por que usar authSource=admin?

Quando você cria um container MongoDB com:
```yaml
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password
```

O MongoDB cria esse usuário no banco `admin`, não no banco `ceboelha`. Por isso a connection string precisa especificar `authSource=admin`.

## ✅ Validação da Connection String

### Formato Correto

```
mongodb://[username]:[password]@[host]:[port]/[database]?[options]
```

### Exemplos Válidos

✅ **Local sem auth:**
```
mongodb://localhost:27017/ceboelha
```

✅ **Docker com auth:**
```
mongodb://admin:password@mongo:27017/ceboelha?authSource=admin
```

✅ **Atlas:**
```
mongodb+srv://user:pass@cluster.mongodb.net/ceboelha?retryWrites=true&w=majority
```

### Exemplos Inválidos

❌ **Faltando authSource (quando necessário):**
```
mongodb://admin:password@mongo:27017/ceboelha
```

❌ **authSource errado:**
```
mongodb://admin:password@mongo:27017/ceboelha?authSource=ceboelha
```

## 🧪 Testando a Conexão

Execute o script de teste:

```bash
# Com sua .env
bun run test:db

# Ou especificando a URI
MONGODB_URI="mongodb://admin:password@localhost:27017/ceboelha?authSource=admin" bun run test:db
```

O script vai testar a conexão e fornecer mensagens de erro úteis se algo estiver errado.

## 🐳 Docker Compose - Como Funciona

### 1. MongoDB Container

```yaml
mongo:
  image: mongo:7
  environment:
    - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USER:-admin}
    - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD:?}
  volumes:
    - mongo_data:/data/db
```

Isso cria:
- **Usuário**: O valor de `MONGO_ROOT_USER` (padrão: `admin`)
- **Senha**: O valor de `MONGO_ROOT_PASSWORD` (obrigatório)
- **Role**: `root` no banco `admin`

### 2. API Container

```yaml
api:
  environment:
    - MONGODB_URI=mongodb://${MONGO_ROOT_USER:-admin}:${MONGO_ROOT_PASSWORD:?}@mongo:27017/ceboelha?authSource=admin
```

Observe:
- **Host**: `mongo` (nome do serviço, não `localhost`)
- **Porta**: `27017` (porta interna do container)
- **authSource**: `admin` (onde o usuário foi criado)

## 🚀 Deploy no Coolify

No Coolify, configure estas variáveis de ambiente:

```env
# MongoDB
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=SuaSenhaForteAqui123!

# Backend (será construído automaticamente pelo docker-compose)
MONGODB_URI=mongodb://admin:SuaSenhaForteAqui123!@mongo:27017/ceboelha?authSource=admin
```

⚠️ **Nota**: No Coolify, a variável `MONGODB_URI` será construída automaticamente usando as variáveis `MONGO_ROOT_USER` e `MONGO_ROOT_PASSWORD` definidas no docker-compose.yml.

## 🔍 Troubleshooting

### Error: Authentication failed

```
MongoServerError: Authentication failed
```

**Solução**:
- Verifique se username e password estão corretos
- Adicione `?authSource=admin` à connection string
- Certifique-se de que o MongoDB foi inicializado com as variáveis `MONGO_INITDB_ROOT_*`

### Error: ECONNREFUSED

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solução**:
- MongoDB não está rodando
- No Docker: use `mongo` como host, não `localhost`
- Verifique se a porta está correta

### Error: bad auth

```
MongoServerError: bad auth : Authentication failed
```

**Solução**:
- O `authSource` está errado
- Tente `authSource=admin` se o usuário foi criado com `MONGO_INITDB_ROOT_*`

## 📚 Referências

- [Mongoose Connection String Options](https://mongoosejs.com/docs/connections.html)
- [MongoDB Connection String URI Format](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [MongoDB Docker Authentication](https://hub.docker.com/_/mongo/)
- [MongoDB Users and Roles](https://www.mongodb.com/docs/manual/core/security-users/)

## ✨ Resumo Rápido

| Ambiente | Host | Auth | authSource | Connection String |
|----------|------|------|------------|-------------------|
| Local Dev | localhost | ❌ | - | `mongodb://localhost:27017/ceboelha` |
| Docker | mongo | ✅ | admin | `mongodb://user:pass@mongo:27017/ceboelha?authSource=admin` |
| Coolify | mongo | ✅ | admin | `mongodb://user:pass@mongo:27017/ceboelha?authSource=admin` |
| Atlas | cluster.mongodb.net | ✅ | - | `mongodb+srv://user:pass@cluster.mongodb.net/ceboelha` |
