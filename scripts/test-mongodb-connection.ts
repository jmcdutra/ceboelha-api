#!/usr/bin/env bun
/**
 * Test MongoDB Connection with Authentication
 * 
 * Este script testa se a connection string do MongoDB está funcionando corretamente
 * com autenticação, especialmente para uso no Docker/Coolify
 */

import mongoose from 'mongoose'

// Connection strings de teste
const connectionStrings = {
  development: 'mongodb://localhost:27017/ceboelha',
  docker: 'mongodb://admin:password@mongo:27017/ceboelha?authSource=admin',
  atlas: 'mongodb+srv://user:password@cluster.mongodb.net/ceboelha?retryWrites=true&w=majority',
}

async function testConnection(name: string, uri: string) {
  console.log(`\n🧪 Testing ${name} connection...`)
  console.log(`📝 URI: ${uri.replace(/:[^:@]*@/, ':***@')}`) // Hide password
  
  try {
    // Set timeout for faster failure
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    })
    
    console.log(`✅ ${name} connected successfully!`)
    console.log(`   Host: ${conn.connection.host}`)
    console.log(`   Database: ${conn.connection.name}`)
    console.log(`   Ready state: ${conn.connection.readyState}`)
    
    // Test a simple operation
    const collections = await conn.connection.db?.listCollections().toArray()
    console.log(`   Collections: ${collections?.length || 0}`)
    
    await mongoose.disconnect()
    return true
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ ${name} failed:`, error.message)
      
      // Provide helpful hints
      if (error.message.includes('authentication')) {
        console.log('   💡 Hint: Check username, password, and authSource')
      }
      if (error.message.includes('ECONNREFUSED')) {
        console.log('   💡 Hint: MongoDB server is not running')
      }
      if (error.message.includes('authSource')) {
        console.log('   💡 Hint: Try adding ?authSource=admin to the connection string')
      }
    }
    return false
  }
}

async function main() {
  console.log('🧅 Ceboelha MongoDB Connection Test')
  console.log('=' .repeat(50))
  
  // Get connection string from environment or use default
  const testUri = process.env.MONGODB_URI || connectionStrings.development
  
  console.log('\n📌 Testing current environment:')
  const success = await testConnection('Current', testUri)
  
  if (success) {
    console.log('\n✅ Connection test passed!')
    process.exit(0)
  } else {
    console.log('\n❌ Connection test failed!')
    console.log('\n📚 Example connection strings:')
    console.log('  Development:')
    console.log('    mongodb://localhost:27017/ceboelha')
    console.log('')
    console.log('  Docker (with auth):')
    console.log('    mongodb://admin:password@mongo:27017/ceboelha?authSource=admin')
    console.log('')
    console.log('  MongoDB Atlas:')
    console.log('    mongodb+srv://user:password@cluster.mongodb.net/ceboelha?retryWrites=true&w=majority')
    process.exit(1)
  }
}

main()
