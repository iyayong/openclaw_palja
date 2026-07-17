// 🎴 render_cards_today.cjs — v2: Dynamic card generator
// Fetches Naver KOSPI + Supabase data to generate unique card content daily
// Usage: NODE_PATH=/home/paljastock/.openclaw/tools/node-v22.22.2/lib/node_modules node render_cards_today.cjs

const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const { URL } = require('url');

const OUT = path.join(os.homedir(), 'Repo/openclaw_palja/viral/output/cards_html');
fs.mkdirSync(OUT, { recursive: true });

// ===== DATE / SEED =====
const now = new Date();
const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
const today = `${kst.getMonth() + 1}월 ${kst.getDate()}일`;
const dateCode = String(kst.getFullYear()).slice(-2) + String(kst.getMonth() + 1).padStart(2, '0') + String(kst.getDate()).padStart(2, '0');
const dateNum = parseInt(dateCode);

// ===== SUPABASE KEY =====
function getSupabaseKey() {
  try {
    const env = fs.readFileSync(path.join(os.homedir(), 'Repo/Palja/.env.local'), 'utf-8');
    const line = env.split('\n').find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY='));
    return line ? line.split('=').slice(1).join('=') : '';
  } catch { return ''; }
}
const SUPABASE_KEY = getSupabaseKey();
const SUPABASE_URL = 'https://mvnbplbtgfhtckqstdxa.supabase.co';

// ===== HTTP HELPERS =====
function fetchJSON(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0', ...headers }
    };
    https.get(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

function fetchSupabase(table, params = {}) {
  const paramStr = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  const url = `${SUPABASE_URL}/rest/v1/${table}${paramStr ? '?' + paramStr : ''}`;
  return fetchJSON(url, { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` });
}

// ===== FETCH NAVER KOSPI =====
async function fetchNaverKospi() {
  try {
    const data = await fetchJSON('https://m.stock.naver.com/api/index/KOSPI/price?pageSize=1');
    if (!data || !data[0]) return null;
    const d = data[0];
    return {
      price: d.closePrice || '',
      change: d.compareToPreviousClosePrice || '0',
      changePct: d.fluctuationsRatio || '0',
      high: d.highPrice || '',
      low: d.lowPrice || '',
      localDate: d.localTradedAt || '',
      openPrice: d.openPrice || ''
    };
  } catch (e) {
    console.log('⚠️ Naver fetch failed:', e.message);
    return null;
  }
}

// ===== FETCH SUPABASE DATA =====
async function fetchMarketBrief(dateStr) {
  try {
    const briefs = await fetchSupabase('market_briefs', {
      'select': '*',
      'brief_date': `eq.${dateStr}`,
      'limit': '1'
    });
    return briefs && briefs[0] ? briefs[0].content : null;
  } catch (e) {
    console.log('⚠️ Supabase brief fetch failed:', e.message);
    return null;
  }
}

async function fetchElementData() {
  try {
    // Get the latest bas_dd available
    const latest = await fetchSupabase('krx_daily_market_snapshots', {
      'select': 'bas_dd',
      'order': 'bas_dd.desc',
      'limit': '1'
    });
    if (!latest || !latest[0]) return null;
    const latestBasDd = latest[0].bas_dd;

    // Fetch top stocks by trade_value for the latest trading day
    const stocks = await fetchSupabase('krx_daily_market_snapshots', {
      'select': 'stock_name,trade_value,element_tags',
      'bas_dd': `eq.${latestBasDd}`,
      'order': 'trade_value.desc',
      'limit': '200'
    });
    return { stocks, date: latestBasDd };
  } catch (e) {
    console.log('⚠️ Element data fetch failed:', e.message);
    return null;
  }
}

// ===== ZODIAC DEFINITIONS =====
const zodiacs = [
  { emoji: '🐭', name: '쥐띠',  stem: '자', idx: 0 },
  { emoji: '🐮', name: '소띠',  stem: '축', idx: 1 },
  { emoji: '🐯', name: '호랑이띠', stem: '인', idx: 2 },
  { emoji: '🐰', name: '토끼띠', stem: '묘', idx: 3 },
  { emoji: '🐲', name: '용띠',  stem: '진', idx: 4 },
  { emoji: '🐍', name: '뱀띠',  stem: '사', idx: 5 },
  { emoji: '🐴', name: '말띠',  stem: '오', idx: 6 },
  { emoji: '🐏', name: '양띠',  stem: '미', idx: 7 },
  { emoji: '🐵', name: '원숭이띠', stem: '신', idx: 8 },
  { emoji: '🐔', name: '닭띠',  stem: '유', idx: 9 },
  { emoji: '🐶', name: '개띠',  stem: '술', idx: 10 },
  { emoji: '🐷', name: '돼지띠', stem: '해', idx: 11 }
];

function seededScore(seed, idx) {
  const x = Math.sin(seed * (idx + 1) * 7.31 + idx * 13.37) * 10000;
  return Math.round(((x - Math.floor(x)) * 80) + 10); // 10~90 range
}

const top3Emojis = ['🥇', '🥈', '🥉'];
const top3Colors = ['#ffc832', '#ff5032', '#ff9632'];

const tipMessages = [
  '급한 결정은 잠시 미루세요',
  '흐름이 정체되어도 인내하세요',
  '서두르면 실수! 여유를 가지세요',
  '큰 베팅은 피하는 게 좋아요',
  '오늘은 관망이 최선입니다',
  '감정적인 매매는 자제하세요',
  '단기보다 중장기로 보세요',
  '소액으로만 움직여보세요'
];

const coverMessages = {
  surge: { emoji: '🚀', sub: '폭등하는 날! 기운 최고', color: '#ff5032' },
  rise: { emoji: '📈', sub: '상승 기운 활활', color: '#ff5032' },
  flat: { emoji: '⚖️', sub: '평온한 흐름의 날', color: '#ffc832' },
  drop: { emoji: '📉', sub: '하락장, 차분히 대응할 때', color: '#3288c8' },
  crash: { emoji: '🌊', sub: '출렁이는 장세, 중심을 잡으세요', color: '#3288c8' }
};

// ===== MAIN =====
(async () => {
  console.log(`🎴 [${today}] render_cards_today v2 — fetching dynamic data...`);

  // 1. FETCH NAVER KOSPI
  const kospi = await fetchNaverKospi();
  const changePct = kospi ? parseFloat(kospi.changePct) : 0;
  let theme = 'flat';
  if (changePct <= -3.0) theme = 'crash';
  else if (changePct <= -1.0) theme = 'drop';
  else if (changePct <= 1.0) theme = 'flat';
  else if (changePct <= 3.0) theme = 'rise';
  else theme = 'surge';

  console.log(`📊 KOSPI: ${kospi ? kospi.price : 'N/A'} (${kospi ? kospi.changePct + '%' : 'N/A'}) → Theme: ${theme}`);

  // 2. FETCH MARKET BRIEF
  const briefDate = kst.toISOString().split('T')[0];
  const brief = await fetchMarketBrief(briefDate);
  const briefSnippet = brief ? brief.replace(/###[\s\S]*?\n\n/, '').slice(0, 120).replace(/\n/g, ' ').trim() + '...' : '';

  // 3. FETCH ELEMENT DATA
  const elementData = await fetchElementData();
  const elements = { '목': { label: '🌿 목(木) 나무', value: 0, stocks: [], color: '#4ae98a' },
    '화': { label: '🔥 화(火) 불', value: 0, stocks: [], color: '#ff5032' },
    '토': { label: '🌍 토(土) 흙', value: 0, stocks: [], color: '#966e46' },
    '금': { label: '💰 금(金) 쇠', value: 0, stocks: [], color: '#c8aa32' },
    '수': { label: '💧 수(水) 물', value: 0, stocks: [], color: '#3288c8' } };
  let totalTradeValue = 0;
  if (elementData && elementData.stocks) {
    for (const s of elementData.stocks) {
      const tag = s.element_tags?.[0];
      if (tag && elements[tag]) {
        elements[tag].value += Number(s.trade_value) || 0;
        if (elements[tag].stocks.length < 4) elements[tag].stocks.push(s.stock_name);
        totalTradeValue += Number(s.trade_value) || 0;
      }
    }
  }
  const sortedElements = Object.values(elements).sort((a, b) => b.value - a.value);
  const topElement = sortedElements[0];
  const topElementPct = totalTradeValue > 0 ? Math.round(topElement.value / totalTradeValue * 100) : 0;

  // 4. ZODIAC SCORES
  const scored = zodiacs.map(z => ({
    ...z,
    score: seededScore(dateNum, z.idx)
  }));
  scored.sort((a, b) => b.score - a.score);
  const top3 = scored.slice(0, 3);
  const bottom3 = scored.slice(-3).reverse();

  // Element tips for top zodiac signs
  const elementTips = {
    '화': '에너지 넘치는 날! 과감한 도전이 필요한 때입니다.',
    '금': '재물운 상승! 투자 결정에 자신감을 가지세요.',
    '수': '지혜가 필요한 날입니다. 신중함이 답입니다.',
    '목': '성장 기운이 가득합니다. 새로운 시작이 좋습니다.',
    '토': '안정적인 흐름, 무리하지 않는 것이 최선입니다.'
  };
  const topElementTip = elementTips[topElement.label.match(/[목화토금수]/)?.[0]] || '오늘의 기운을 잘 활용하세요!';

  // 5. BUILD CARDS
  const cm = coverMessages[theme];

  // Card 1: Cover
  const card01 = {
    name: `card01_cover_${dateCode}`,
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1080px;height:1080px;background:#12121e;font-family:Malgun Gothic,sans-serif;color:white">
      <div style="font-size:100px">${cm.emoji}</div>
      <div style="font-size:100px;font-weight:bold;margin-top:20px">${today}</div>
      <div style="font-size:72px;color:#ffc832;font-weight:bold">오늘의 주식운세</div>
      ${kospi ? `<div style="font-size:40px;color:#ddd;margin-top:10px">KOSPI ${kospi.price}</div>
      <div style="font-size:32px;color:${parseFloat(kospi.changePct) >= 0 ? '#ff5032' : '#3288c8'};margin-top:6px">${kospi.changePct >= 0 ? '▲' : '▼'} ${kospi.change} (${kospi.changePct}%)</div>` : ''}
      <div style="width:300px;height:4px;background:${cm.color};border-radius:2px;margin-top:25px"></div>
      <div style="font-size:38px;color:#ddd;margin-top:25px">${cm.sub}</div>
      ${briefSnippet ? `<div style="font-size:24px;color:#b4b4be;margin-top:15px;max-width:800px;text-align:center;line-height:1.4">${briefSnippet}</div>` : ''}
    </div>`
  };

  // Card 2: Top 3 Zodiac
  const card02 = {
    name: `card02_top3_${dateCode}`,
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1080px;height:1080px;background:#12121e;font-family:Malgun Gothic,sans-serif;color:white">
      <div style="font-size:48px;color:#ffc832;font-weight:bold">🏆 오늘의 최고 운세 TOP3</div>
      <div style="width:200px;height:3px;background:#ffc832;margin:20px 0 40px"></div>
      ${top3.map((z, i) => `
        <div style="display:flex;align-items:center;width:800px;height:120px;background:#1e1e32;border-radius:24px;padding:0 40px;margin-bottom:20px">
          <div style="font-size:48px;width:80px">${top3Emojis[i]}</div>
          <div style="font-size:48px;font-weight:bold;flex:1">${z.emoji} ${z.name}</div>
          <div style="font-size:48px;font-weight:bold;color:${top3Colors[i]};background:rgba(255,255,255,0.08);padding:10px 30px;border-radius:30px">${z.score}점</div>
        </div>`).join('')}
      <div style="font-size:28px;color:#b4b4be;margin-top:10px">${topElementTip}</div>
    </div>`
  };

  // Card 3: Caution Zodiac
  const card03 = {
    name: `card03_caution_${dateCode}`,
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1080px;height:1080px;background:#12121e;font-family:Malgun Gothic,sans-serif;color:white">
      <div style="font-size:48px;color:#ffb450;font-weight:bold">⚠️ 조심해야 할 띠</div>
      <div style="width:200px;height:3px;background:#ffb450;margin:20px 0 40px"></div>
      ${bottom3.map((z, i) => {
        const tip = tipMessages[(dateNum + z.idx * 7) % tipMessages.length];
        return `
        <div style="display:flex;align-items:center;width:800px;height:100px;background:#1e1e32;border-radius:24px;padding:0 30px;margin-bottom:16px">
          <div style="font-size:36px;font-weight:bold;width:160px">${z.emoji} ${z.name}</div>
          <div style="font-size:32px;color:#ffb450;font-weight:bold;width:80px">${z.score}점</div>
          <div style="font-size:26px;color:#b4b4be;flex:1;text-align:right">${tip}</div>
        </div>`;}
      ).join('')}
      <div style="font-size:28px;color:#b4b4be;margin-top:20px">${theme === 'crash' ? '오늘은 신중하게! 큰 움직임 자제' : '무리하지 않고 천천히 가는 날'}</div>
    </div>`
  };

  // Card 4: Element Thermometer
  const bars = sortedElements.filter(e => e.value > 0).map(e => {
    const pct = totalTradeValue > 0 ? Math.round(e.value / totalTradeValue * 100) : 0;
    return `
      <div style="display:flex;align-items:center;width:800px;margin-bottom:18px">
        <div style="font-size:32px;width:160px;color:#ccc">${e.label}</div>
        <div style="flex:1;height:40px;background:rgba(255,255,255,0.06);border-radius:20px;overflow:hidden;margin:0 20px;position:relative">
          <div style="height:100%;width:${Math.max(pct * 7.5, 50)}px;background:${e.color};border-radius:20px;display:flex;align-items:center;padding-left:16px;font-weight:bold;color:#fff;font-size:22px">${pct}%</div>
        </div>
      </div>
      ${e.stocks.length ? `<div style="font-size:20px;color:#555;margin:-10px 0 14px 170px">${e.stocks.slice(0, 3).join(' · ')}</div>` : ''}`;
  }).join('');

  const card04 = {
    name: `card04_temp_${dateCode}`,
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1080px;height:1080px;background:#12121e;font-family:Malgun Gothic,sans-serif;color:white">
      <div style="font-size:46px;color:#ffc832;font-weight:bold">🌡️ ${today} 오행 온도계</div>
      <div style="width:200px;height:3px;background:#ffc832;margin:16px 0 30px"></div>
      ${bars}
      <div style="font-size:28px;color:#b4b4be;margin-top:25px;text-align:center">${topElement.label.split(' ')[0]} 기운 압도적 — ${topElement.stocks.slice(0, 2).join('·')} 주목</div>
    </div>`
  };

  // Card 5: CTA
  const ctaTagline = theme === 'crash' ? '하락장에서도 빛나는 내 사주 주식은?' :
    theme === 'drop' ? '조정장, 내 사주에 맞는 종목 찾기' :
    theme === 'rise' ? '상승장, 내 사주와 찰떡인 주식은?' :
    theme === 'surge' ? '폭등장! 내 사주 대박 종목 확인' :
    '내 사주에 맞는 주식 찾기';

  const card05 = {
    name: `card05_cta_${dateCode}`,
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1080px;height:1080px;background:#12121e;font-family:Malgun Gothic,sans-serif;color:white">
      <div style="font-size:80px">🎴</div>
      <div style="font-size:72px;font-weight:bold;color:#ffc832;margin-top:30px">PALJA</div>
      <div style="font-size:40px;color:#ddd;margin-top:20px">AI 사주 × 주식 큐레이션</div>
      <div style="width:300px;height:3px;background:#ff5032;margin:30px 0"></div>
      <div style="font-size:44px;font-weight:bold;color:white;text-align:center">${ctaTagline}</div>
      <div style="font-size:36px;color:#ffc832;margin-top:20px;font-weight:bold">👉 palja.net</div>
      ${kospi ? `<div style="font-size:22px;color:#666;margin-top:20px">KOSPI ${kospi.price} | ${kospi.changePct >= 0 ? '▲' : '▼'} ${kospi.changePct}%</div>` : ''}
    </div>`
  };

  const cards = [card01, card02, card03, card04, card05];

  // 6. RENDER
  const browser = await chromium.launch({ executablePath: '/home/paljastock/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome' });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  for (const card of cards) {
    await page.setContent(card.html);
    await page.screenshot({ path: path.join(OUT, card.name + '.png') });
    console.log(`✅ ${card.name}.png`);
  }
  await page.close();
  await browser.close();

  // 7. SUMMARY
  console.log(`\n🎴 === CARD GENERATION SUMMARY ===`);
  console.log(`Date: ${today} (${dateCode})`);
  console.log(`KOSPI: ${kospi ? kospi.price + ' (' + kospi.changePct + '%)' : 'N/A'}`);
  console.log(`Theme: ${theme}`);
  console.log(`Top3: ${top3.map(z => z.name + '(' + z.score + ')').join(', ')}`);
  console.log(`Caution: ${bottom3.map(z => z.name + '(' + z.score + ')').join(', ')}`);
  console.log(`Top Element: ${topElement.label} (${topElementPct}%)`);
  console.log(`All ${cards.length} cards rendered!`);
  console.log(`Output: ${OUT}`);
})().catch(e => {
  console.error('❌ Fatal error:', e.message);
  process.exit(1);
});
