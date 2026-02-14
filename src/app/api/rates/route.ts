import { NextResponse } from 'next/server'

/* ──────────────────────────────────────────────────────────────────────────
   Монголбанкны бодит ханш – monxansh.appspot.com API
   Тохиргоог Django DB-ээс уншина (exchange_rate_config).
   ────────────────────────────────────────────────────────────────────────── */

const DJANGO_API = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
const DEFAULT_CURRENCIES = 'USD|EUR|CNY|JPY|RUB|KRW|GBP'
const DEFAULT_API_URL    = 'https://monxansh.appspot.com/xansh.json'
const DEFAULT_CACHE_TTL  = 300_000 // 5 minutes

// In-memory cache (per-instance)
let cachedData: { rates: CurrencyRate[]; timestamp: string } | null = null
let lastFetchTime = 0
let cacheTtl = DEFAULT_CACHE_TTL

interface MonxanshItem {
  code: string
  rate_float: number
  rate_date: string
  name: string
}

interface CurrencyRate {
  symbol: string
  rate: number
  change: number
  type: 'currency'
  name: string
  date: string
}

interface ExchangeConfig {
  currencies: string
  api_url: string
  cache_ttl_seconds: number
  rates: { symbol: string; rate: number; name: string }[]
}

// Previous day rates for change calculation (best-effort)
let prevRates: Record<string, number> = {}

async function getConfig(): Promise<ExchangeConfig> {
  try {
    const res = await fetch(`${DJANGO_API}/api/v1/exchange-rate-config/`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      const items = Array.isArray(data) ? data : data.results || [data]
      if (items.length > 0) {
        const raw = items[0].config_json
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        return {
          currencies: parsed.currencies || DEFAULT_CURRENCIES,
          api_url: parsed.api_url || DEFAULT_API_URL,
          cache_ttl_seconds: parsed.cache_ttl_seconds || 300,
          rates: parsed.rates || [],
        }
      }
    }
  } catch (err) {
    console.warn('Failed to fetch exchange config from DB, using defaults:', err)
  }
  return { currencies: DEFAULT_CURRENCIES, api_url: DEFAULT_API_URL, cache_ttl_seconds: 300, rates: [] }
}

async function fetchFromUpstream(config: ExchangeConfig): Promise<CurrencyRate[]> {
  const url = `${config.api_url}?currency=${config.currencies}`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`Monxansh API returned ${res.status}`)

  const items: MonxanshItem[] = await res.json()

  const rates: CurrencyRate[] = items.map((item) => {
    const prev = prevRates[item.code] || item.rate_float
    const change = prev ? ((item.rate_float - prev) / prev) * 100 : 0

    return {
      symbol: `${item.code}/MNT`,
      rate: item.rate_float,
      change: Math.round(change * 100) / 100,
      type: 'currency' as const,
      name: item.name,
      date: item.rate_date,
    }
  })

  // Append any manual rates from config
  if (config.rates && config.rates.length > 0) {
    config.rates.forEach((r) => {
      rates.push({
        symbol: r.symbol,
        rate: r.rate,
        change: 0,
        type: 'currency',
        name: r.name || r.symbol,
        date: new Date().toISOString().slice(0, 10),
      })
    })
  }

  // Store current rates as "previous" for next comparison
  const newPrev: Record<string, number> = {}
  items.forEach((i) => { newPrev[i.code] = i.rate_float })
  prevRates = newPrev

  return rates
}

export async function GET() {
  try {
    const now = Date.now()

    // Return cached data if still fresh
    if (cachedData && now - lastFetchTime < cacheTtl) {
      return NextResponse.json({ success: true, data: cachedData.rates, timestamp: cachedData.timestamp })
    }

    const config = await getConfig()
    cacheTtl = (config.cache_ttl_seconds || 300) * 1000

    const rates = await fetchFromUpstream(config)
    cachedData = { rates, timestamp: new Date().toISOString() }
    lastFetchTime = now

    return NextResponse.json({ success: true, data: rates, timestamp: cachedData.timestamp })
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error)

    // If cache exists, return stale data rather than failing
    if (cachedData) {
      return NextResponse.json({ success: true, data: cachedData.rates, timestamp: cachedData.timestamp, stale: true })
    }

    return NextResponse.json({ success: false, error: 'Ханшийн мэдээлэл авахад алдаа гарлаа' }, { status: 502 })
  }
}
