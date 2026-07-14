// 🎴 Quick test - check DB connection
const URL = 'https://mvnbplbtgfhtckqstdxa.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bmJwbGJ0Z2ZodGNrcXN0ZHhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzA3NTU2OSwiZXhwIjoyMDk4NjUxNTY5fQ.qt7ht9p5eOm0WpPhuP4hEDKtXPk8IM19JjramzJ_mQ0'

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

// Test 1: zodiac fortunes
const f = await (await fetch(`${URL}/rest/v1/zodiac_fortunes?fortune_date=eq.2026-07-13&select=zodiac,score,advice,lucky_number&order=id.asc`, { headers: H })).json()
console.log('🌟 오늘의 띠별 운세 (' + f.length + '개):')
for (const d of f) console.log(`  ${d.zodiac}: ${d.score}점`)

// Test 2: market temperature (top 50 by trade_value)
const stocks = await (await fetch(`${URL}/rest/v1/krx_daily_market_snapshots?select=bas_dd,element_tags,stock_name,trade_value&order=trade_value.desc&limit=50`, { headers: H })).json()
const latestDd = stocks[0]?.bas_dd
console.log('\n📊 최신 시장 데이터 기준일:', latestDd)

const elemSum = {}
for (const s of stocks) {
  if (s.element_tags?.length) {
    const e = s.element_tags[0]
    elemSum[e] = (elemSum[e] || 0) + Number(s.trade_value)
  }
}
const total = Object.values(elemSum).reduce((a, b) => a + b, 0)
console.log('\n🌡️ 오행 온도계 (거래대금 기준):')
for (const [e, v] of Object.entries(elemSum).sort((a, b) => b[1] - a[1])) {
  const pct = total > 0 ? Math.round(v / total * 100) : 0
  console.log(`  ${e}: ${pct}%`)
}
