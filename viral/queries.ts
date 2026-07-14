// 🎴 팔자 바이럴 - Supabase 데이터 조회 모듈
// Zodiac fortunes + market temperature + market data
// Supabase service role key로 직접 REST API 호출

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvnbplbtgfhtckqstdxa.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const headers = {
  'apikey': SUPABASE_KEY!,
  'Authorization': `Bearer ${SUPABASE_KEY!}`,
  'Content-Type': 'application/json',
}

export interface ZodiacFortune {
  id: number
  fortune_date: string
  zodiac: string
  advice: string
  lucky_number: string
  lucky_color: string
  score: number
}

export interface MarketBrief {
  brief_date: string
  content: string
}

export interface MarketTemperature {
  element: string
  label: string
  ratio: number
  stocks: string[]
}

export interface MarketSnapshot {
  bas_dd: string
  stock_code: string
  stock_name: string
  close_price: number
  change_rate: number
  trade_value: number
  element_tags: string[]
}

// 오늘의 띠별 운세 조회
export async function getTodayFortunes(date?: string): Promise<ZodiacFortune[]> {
  const d = date || kstDate()
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/zodiac_fortunes?fortune_date=eq.${d}&select=*&order=id.asc`,
    { headers }
  )
  return res.json()
}

// 오늘의 시장 브리핑
export async function getLatestMarketBrief(): Promise<MarketBrief | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/market_briefs?select=*&order=brief_date.desc&limit=1`,
    { headers }
  )
  const data = await res.json()
  return data?.[0] || null
}

// 오행 시장 온도 - 거래대금 기준 오행 비율
export async function getMarketTemperature(basDd?: string): Promise<MarketTemperature[]> {
  const dd = basDd || await getLatestBasDd()
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/krx_daily_market_snapshots?bas_dd=eq.${dd}&select=element_tags,stock_name,trade_value&order=trade_value.desc&limit=100`,
    { headers }
  )
  const stocks: MarketSnapshot[] = await res.json()

  // element_tags가 있는 종목만 추려서 오행별 거래대금 합산
  const elementValues: Record<string, { value: number; stocks: string[] }> = {
    '목': { value: 0, stocks: [] },
    '화': { value: 0, stocks: [] },
    '토': { value: 0, stocks: [] },
    '금': { value: 0, stocks: [] },
    '수': { value: 0, stocks: [] },
  }

  let totalValue = 0
  for (const s of stocks) {
    if (s.element_tags && s.element_tags.length > 0) {
      const primary = s.element_tags[0]
      if (elementValues[primary]) {
        elementValues[primary].value += Number(s.trade_value) || 0
        elementValues[primary].stocks.push(s.stock_name)
        totalValue += Number(s.trade_value) || 0
      }
    }
  }

  return Object.entries(elementValues).map(([element, data]) => ({
    element,
    label: elementLabel(element),
    ratio: totalValue > 0 ? Math.round((data.value / totalValue) * 100) : 0,
    stocks: data.stocks.slice(0, 5),
  })).sort((a, b) => b.ratio - a.ratio)
}

// 오늘의 시장 탑종목 조회
export async function getTopStocks(basDd?: string, limit = 10): Promise<MarketSnapshot[]> {
  const dd = basDd || await getLatestBasDd()
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/krx_daily_market_snapshots?bas_dd=eq.${dd}&select=*&order=trade_value.desc&limit=${limit}`,
    { headers }
  )
  return res.json()
}

// helpers
function kstDate(): string {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().split('T')[0]
}

function elementLabel(e: string): string {
  const map: Record<string, string> = {
    '목': '木 나무',
    '화': '火 불',
    '토': '土 흙',
    '금': '金 쇠',
    '수': '水 물',
  }
  return map[e] || e
}

async function getLatestBasDd(): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/krx_daily_market_snapshots?select=bas_dd&order=bas_dd.desc&limit=1`,
    { headers }
  )
  const data = await res.json()
  return data?.[0]?.bas_dd || '20260710'
}

// -- 테스트: node --loader ts-node/esm 로 실행 --
// console.log(await getTodayFortunes())
// console.log(await getMarketTemperature())
