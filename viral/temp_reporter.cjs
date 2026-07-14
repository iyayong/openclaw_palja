const { chromium } = require('playwright-core');
const path = require('path');
const os = require('os');
const fs = require('fs');
const https = require('https');

// === CONFIG ===
const SUPABASE_URL = 'https://mvnbplbtgfhtckqstdxa.supabase.co'
const KEY = ***
const OUT = path.join(os.homedir(), 'Repo/openclaw_palja/viral/output/ig_images');
fs.mkdirSync(OUT, { recursive: true });

// === Fetch KRX data ===
async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

// === Build HTML ===
function buildHTML(stocks) {
  const elements = { '목': { label: '🌿 목(木) 나무', value: 0, stocks: [], color: '#4a9' },
    '화': { label: '🔥 화(火) 불', value: 0, stocks: [], color: '#ff5032' },
    '토': { label: '🌍 토(土) 흙', value: 0, stocks: [], color: '#966e46' },
    '금': { label: '💰 금(金) 쇠', value: 0, stocks: [], color: '#c8aa32' },
    '수': { label: '💧 수(水) 물', value: 0, stocks: [], color: '#3288c8' } };
  
  let total = 0;
  for (const s of stocks) {
    if (s.element_tags && s.element_tags[0] && elements[s.element_tags[0]]) {
      elements[s.element_tags[0]].value += Number(s.trade_value);
      elements[s.element_tags[0]].stocks.push(s.stock_name);
      total += Number(s.trade_value);
    }
  }
  
  const sorted = Object.values(elements).sort((a, b) => b.value - a.value);
  const topEl = sorted[0];
  const elementLabels = { '목': 'Wood', '화': 'Fire', '토': 'Earth', '금': 'Metal', '수': 'Water' };
  const elKor = { '목': '나무', '화': '불', '토': '흙', '금': '쇠', '수': '물' };
  
  let bars = sorted.filter(e => e.value > 0).map(e => {
    const pct = total > 0 ? Math.round(e.value / total * 100) : 0;
    const barW = Math.max(pct * 7, 60);
    const top3 = e.stocks.slice(0, 3);
    return `<div style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;color:#ccc;font-size:20px;margin-bottom:6px">
        <span>${e.label}</span><span style="font-weight:bold;font-size:26px;color:${e.color}">${pct}%</span>
      </div>
      <div style="height:36px;background:rgba(255,255,255,0.06);border-radius:18px;overflow:hidden">
        <div style="height:100%;width:${barW}px;background:${e.color};border-radius:18px;display:flex;align-items:center;padding-left:16px;font-weight:bold;color:#fff;font-size:18px;min-width:60px">${pct}%</div>
      </div>
      ${top3.length ? `<div style="font-size:16px;color:#666;margin-top:4px;padding-left:4px">${top3.join(' · ')}</div>` : ''}
    </div>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Malgun Gothic',sans-serif;background:#0a0a1a;display:flex;justify-content:center;align-items:center;min-height:1080px}
.card{width:1080px;height:1080px;background:linear-gradient(145deg,#12121e,#1a1a2e);padding:50px 60px;display:flex;flex-direction:column}
.header{display:flex;align-items:center;gap:12px;margin-bottom:6px}
.header .icon{font-size:36px}
.header .name{font-size:30px;color:#ffc832;font-weight:bold}
.header .date{font-size:20px;color:#666}
.title{font-size:40px;color:#fff;font-weight:bold;margin:10px 0 30px}
.bars{flex:1}${bars}
.footer{margin-top:auto;text-align:center;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06)}
.footer .url{font-size:22px;color:#ffc832;font-weight:bold}
.footer .desc{font-size:18px;color:#888;margin-top:6px}
</style></head>
<body>
<div class="card">
  <div class="header"><span class="icon">🎴</span><span class="name">PALJA</span><span class="date">$(new Date().toISOString().slice(0,10))</span></div>
  <div class="title">🔥 ${topEl.label.replace(/[^화금토목수]/g,'')}의 날 — ${Math.round(topEl.value/total*100)}%</div>
  <div class="bars">${bars}</div>
  <div class="footer">
    <div class="url">👉 https://palja.net</div>
    <div class="desc">AI가 분석한 사주와 주식의 궁합 · 내 투자 성향 확인</div>
  </div>
</div>
</body></html>`;
}

// === Main ===
(async () => {
  const today = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const url = SUPABASE_URL + '/rest/v1/krx_daily_market_snapshots?bas_dd=eq.' + today + '&select=stock_name,trade_value,element_tags&order=trade_value.desc&limit=100';
  
  console.log('📡 Fetching KRX data...');
  let stocks = await fetchJSON(url);
  if (!stocks.length) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10).replace(/-/g,'');
    const url2 = SUPABASE_URL + '/rest/v1/krx_daily_market_snapshots?bas_dd=eq.' + yesterday + '&select=stock_name,trade_value,element_tags&order=trade_value.desc&limit=100';
    stocks = await fetchJSON(url2);
    console.log('  Using yesterday\'s data');
  }
  console.log('  Got ' + stocks.length + ' stocks');
  
  const html = buildHTML(stocks);
  
  const browser = await chromium.launch({ executablePath: '/home/paljastock/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome' });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.setContent(html);
  const outFile = path.join(OUT, 'temp_report.png');
  await page.screenshot({ path: outFile });
  await page.close();
  await browser.close();
  
  const size = fs.statSync(outFile).size;
  console.log('✅ ' + outFile + ' (' + Math.round(size/1024) + 'KB)');
  console.log('📤 Ready for IG!');
})().catch(e => { console.error(e); process.exit(1); });
