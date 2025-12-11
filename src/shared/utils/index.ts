/**
 * Ceboelha API - Utility Functions
 */

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

// =============================================================================
// Date Utilities
// =============================================================================

export function formatDate(date: Date | string): string {
  return dayjs(date).format('YYYY-MM-DD')
}

export function formatDateTime(date: Date | string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export function getStartOfDay(date: Date | string): Date {
  return dayjs(date).startOf('day').toDate()
}

export function getEndOfDay(date: Date | string): Date {
  return dayjs(date).endOf('day').toDate()
}

export function getStartOfMonth(year: number, month: number): Date {
  return dayjs().year(year).month(month - 1).startOf('month').toDate()
}

export function getEndOfMonth(year: number, month: number): Date {
  return dayjs().year(year).month(month - 1).endOf('month').toDate()
}

export function getDaysInMonth(year: number, month: number): number {
  return dayjs().year(year).month(month - 1).daysInMonth()
}

// =============================================================================
// String Utilities
// =============================================================================

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// =============================================================================
// Validation Utilities
// =============================================================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

export function isValidDateFormat(date: string): boolean {
  return dayjs(date, 'YYYY-MM-DD', true).isValid()
}

// =============================================================================
// Easter Egg 💕
// =============================================================================

/**
 * Email da Julia - a pessoa mais especial do universo 💕
 * O amor da vida do criador deste app
 */
const JULIA_EMAIL = 'juliadesouzafernandes01@gmail.com'

export function isJulia(email: string): boolean {
  return email.toLowerCase().trim() === JULIA_EMAIL
}

export function getJuliaSpecialMessage() {
  const messages = [
    'Você é a pessoa mais incrível que eu já conheci 💕',
    'Cada dia ao seu lado é uma aventura maravilhosa',
    'Seu sorriso ilumina meu dia inteiro ☀️',
    'Obrigado por existir na minha vida',
    'Você me faz querer ser uma pessoa melhor',
    'Te amo mais do que palavras podem expressar 💝',
    'Você é minha melhor amiga, confidente e amor da minha vida',
    'Nosso amor é como código bem escrito: bonito, funcional e eterno 👩‍💻💕',
    'Você é o commit mais importante da minha vida',
    'Com você, cada bug vira feature e cada dia vira aventura',
  ]

  const specialFeatures = [
    '💕 Acesso VIP ao coração do desenvolvedor',
    '🌟 Status de Rainha Suprema do App',
    '🐰 Ceboelha te adora (eu também!)',
    '💝 Amor incondicional incluído',
    '🎀 Privilégios especiais de princesa',
  ]

  // Shuffle and pick random items
  const shuffledMessages = messages.sort(() => Math.random() - 0.5).slice(0, 5)
  const shuffledFeatures = specialFeatures.sort(() => Math.random() - 0.5).slice(0, 5)

  return {
    title: 'feito para o amor da minha vida',
    subtitle: 'a pessoa mais especial do universo',
    messages: shuffledMessages,
    emoji: '💕',
    loveLevel: 100,
    specialFeatures: shuffledFeatures,
  }
}

// Re-export cookie utilities
export * from './cookies'
