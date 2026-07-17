// 🎴 팔자 바이럴 자동화 — 마스터 실행기 (auto_runner.cjs)
// NODE_PATH=/home/paljastock/.openclaw/tools/node-v22.22.2/lib/node_modules node auto_runner.cjs [task_key]
// task_key: kospi_ig, kospi_th, kospi_fb, temp_ig, temp_th, temp_fb, email_blog, copy_1~10, cardnews, wealth_ig, wealth_th, wealth_fb, email_shorts, yt_shorts, close_th, close_fb

const https = require('https');
const { chromium } = require('playwright-core');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ===== CONFIG =====
const SUPABASE_URL = 'https://mvnbplbtgfhtckqstdxa.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || requireFromEnv('SUPABASE_SERVICE_ROLE_KEY') || '';
const FB_TOKEN = process.env.FB_TOKEN || requireFromEnv('FACEBOOK_ACCESS_TOKEN');
const TH_TOKEN = process.env.TH_TOKEN || requireFromEnv('THREAD_ACCESS_TOKEN');
const TH_ID = '27661057503547825';
const IG_ID = '17841414832924095';
const FB_PAGE_ID = '1236162272911030';
const GMAIL_USER = 'paljastock@gmail.com';
const GMAIL_PASS = 'axfd ckjc dwmn pblt';
const RAW_BASE = 'https://raw.githubusercontent.com/iyayong/openclaw_palja/main/viral/output';
const IMG_BASE = 'https://palja.net/images/palja-share-card.png';

function requireFromEnv(key) {
  const envPaths = [
    path.join(os.homedir(), 'Repo/openclaw_palja/.env.local'),
    path.join(os.homedir(), 'Repo/Palja/.env.local'),
  ];
  const v = {};
  for (const p of envPaths) {
    try {
      const env = fs.readFileSync(p, 'utf-8');
      env.split('\n').forEach(l => { const m = l.match(/^(\w+)=(.+)$/); if(m && !v[m[1]]) v[m[1]] = m[2].replace(/^['\"]|['\"]$/g,''); });
    } catch (_) {}
  }
  return v[key];
}

// ===== HELPERS =====
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function api(method, url, token, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const d = body ? JSON.stringify(body) : null;
    const opts = { hostname: u.hostname, path: u.pathname + u.search, method, headers: { 'Authorization': `Bearer ${token}` } };
    if (d) { opts.headers['Content-Type'] = 'application/json'; opts.headers['Content-Length'] = Buffer.byteLength(d); }
    const req = https.request(opts, res => {
      let data = ''; res.on('data', c => data += c); res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    if (d) req.write(d);
    req.end();
  });
}

function getPageToken() {
  return api('GET', `https://graph.facebook.com/v22.0/${FB_PAGE_ID}?fields=access_token`, FB_TOKEN, null)
    .then(r => r.access_token);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function kstDate() {
  const now = new Date();
  return new Date(now.getTime() + 9*60*60*1000).toISOString().split('T')[0];
}

async function fetchNaverKospi() {
  // Fetch KOSPI index data from Naver API (latest trading day)
  const res = await new Promise((resolve, reject) => {
    https.get('https://m.stock.naver.com/api/index/KOSPI/price?pageSize=1', { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
  if (!res || !res[0]) throw new Error('Naver API returned no data');
  const d = res[0];

  // Fetch investor data from main page via curl + iconv (EUC-KR -> UTF-8)
  // HTML pattern: <dd class="dd">개인<br><span class="up">+36,647<span>억</span></span></dd>
  const inv = { individual: '확인중', foreign: '확인중', institution: '확인중' };
  try {
    const { execSync } = require('child_process');
    const html = execSync(
      'curl -s "https://finance.naver.com/sise/sise_index.naver?code=KOSPI" | iconv -f euc-kr -t utf-8',
      { stdio: 'pipe', timeout: 10000, encoding: 'utf-8' }
    ).toString();
    const indM = html.match(/개인<br><span class="(up|dn)">([+-][\d,]+)<span>억/);
    const frgM = html.match(/외국인<br><span class="(up|dn)">([+-][\d,]+)<span>억/);
    const insM = html.match(/기관<br><span class="(up|dn)">([+-][\d,]+)<span>억/);
    if (indM) inv.individual = indM[2] + '억';
    if (frgM) inv.foreign = frgM[2] + '억';
    if (insM) inv.institution = insM[2] + '억';
  } catch (_) { /* investor data optional */ }

  // Build brief text like supabase market_briefs content
  const price = d.closePrice || '';
  const change = d.compareToPreviousClosePrice || '0';
  const changePct = d.fluctuationsRatio || '0';
  const high = d.highPrice || '';
  const low = d.lowPrice || '';
  const sign = change.startsWith('-') ? '▼' : '▲';

  const briefContent = [
    `코스피 ${price} (${sign}${change.replace(/^-/, '')}, ${changePct}%)`,
    `장중: ${high} ~ ${low}`,
    `개인 ${inv.individual} / 외국인 ${inv.foreign} / 기관 ${inv.institution}`
  ].filter(l => !l.includes('undefined')).join('\n');

  return {
    price,
    change,
    changePct,
    high,
    low,
    individual: inv.individual,
    foreign: inv.foreign,
    institution: inv.institution,
    content: briefContent,
    date: d.localTradedAt || kstDate()
  };
}

function kstDateStr() {
  const d = new Date(new Date().getTime() + 9*60*60*1000);
  return `${d.getMonth()+1}/${d.getDate()}`;
}

// ===== CONTENT GENERATORS =====
function genBriefText(data) {
  const b = data.brief?.[0]?.content?.slice(0,200) || '';
  const kospi = b.match(/코스피[^ ]* (\d[^ ]*)/)?.[0] || '확인중';
  const skHynix = b.includes('SK하이닉스') ? '반등' : '';
  return `📊 ${kstDateStr()} KOSPI 브리핑\n${kospi}\n👉 palja.net`;
}

async function genTempImage() {
  const today = kstDate().replace(/-/g,'');
  const stocks = await fetchJSON(
    `${SUPABASE_URL}/rest/v1/krx_daily_market_snapshots?select=stock_name,trade_value,element_tags&order=trade_value.desc&limit=100`
  );
  
  const elements = { '목':{label:'🌿 목(木) 나무',value:0,stocks:[],color:'#4a9'},
    '화':{label:'🔥 화(火) 불',value:0,stocks:[],color:'#ff5032'},
    '토':{label:'🌍 토(土) 흙',value:0,stocks:[],color:'#966e46'},
    '금':{label:'💰 금(金) 쇠',value:0,stocks:[],color:'#c8aa32'},
    '수':{label:'💧 수(水) 물',value:0,stocks:[],color:'#3288c8'} };
  
  let total = 0;
  for (const s of stocks) {
    if (s.element_tags?.[0] && elements[s.element_tags[0]]) {
      elements[s.element_tags[0]].value += Number(s.trade_value);
      if (elements[s.element_tags[0]].stocks.length < 5) elements[s.element_tags[0]].stocks.push(s.stock_name);
      total += Number(s.trade_value);
    }
  }
  const sorted = Object.values(elements).sort((a,b)=>b.value-a.value);
  const topEl = sorted[0];
  const topPct = total > 0 ? Math.round(topEl.value/total*100) : 0;
  
  let bars = sorted.filter(e=>e.value>0).map(e => {
    const pct = total > 0 ? Math.round(e.value/total*100) : 0;
    return `<div style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;color:#ccc;font-size:20px;margin-bottom:6px">
        <span>${e.label}</span><span style="font-weight:bold;font-size:26px;color:${e.color}">${pct}%</span>
      </div>
      <div style="height:36px;background:rgba(255,255,255,0.06);border-radius:18px;overflow:hidden">
        <div style="height:100%;width:${Math.max(pct*7,60)}px;background:${e.color};border-radius:18px;display:flex;align-items:center;padding-left:16px;font-weight:bold;color:#fff;font-size:18px;min-width:60px">${pct}%</div>
      </div>
      ${e.stocks.length ? `<div style="font-size:16px;color:#666;margin-top:4px;padding-left:4px">${e.stocks.slice(0,3).join(' · ')}</div>` : ''}
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Malgun Gothic',sans-serif;background:#0a0a1a;display:flex;justify-content:center;align-items:center;min-height:1080px}
.card{width:1080px;height:1080px;background:linear-gradient(145deg,#12121e,#1a1a2e);padding:50px 60px;display:flex;flex-direction:column}
.header{display:flex;align-items:center;gap:12px;margin-bottom:6px}
.header .icon{font-size:36px}.header .name{font-size:30px;color:#ffc832;font-weight:bold}
.header .date{font-size:20px;color:#666}
.title{font-size:40px;color:#fff;font-weight:bold;margin:10px 0 30px}
.bars{flex:1}${bars}
.footer{margin-top:auto;text-align:center;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06)}
.footer .url{font-size:22px;color:#ffc832;font-weight:bold}
.footer .desc{font-size:18px;color:#888;margin-top:6px}
</style></head>
<body><div class="card">
  <div class="header"><span class="icon">🎴</span><span class="name">PALJA</span><span class="date">${kstDate()}</span></div>
  <div class="title">🔥 오행 온도계 — ${topPct}%</div>
  <div class="bars">${bars}</div>
  <div class="footer">
    <div class="url">👉 https://palja.net</div>
    <div class="desc">AI가 분석한 사주와 주식의 궁합</div>
  </div>
</div></body></html>`;

  const browser = await chromium.launch({ executablePath: '/home/paljastock/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome' });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.setContent(html);
  const outFile = path.join(os.homedir(), 'Repo/openclaw_palja/viral/output/ig_images/temp_report.png');
  await page.screenshot({ path: outFile });
  await page.close();
  await browser.close();
  
  // Git push
  const { execSync } = require('child_process');
  try {
    execSync('cd ~/Repo/openclaw_palja && git add -f viral/output/ig_images/temp_report.png && git commit -m "auto: temp report ' + kstDate() + '" && git push origin main 2>&1', { stdio: 'pipe' });
  } catch(e) { /* commit fail = expected on retry */ }
  
  return `${RAW_BASE}/ig_images/temp_report.png`;
}

function gitCleanup(files) {
  const { execSync } = require('child_process');
  try {
    const fileList = Array.isArray(files) ? files.join(' ') : files;
    execSync(`cd ${os.homedir()}/Repo/openclaw_palja && git rm --cached --ignore-unmatch ${fileList} 2>&1 && git commit -m "cleanup: remove posted images" && git push origin main 2>&1`, { stdio: 'pipe' });
    console.log('🧹 Cleanup pushed:', fileList);
  } catch(e) { /* nothing to clean */ }
}

// ===== POSTERS =====
async function postIG(caption, imgUrl) {
  const ig = await api('POST', `https://graph.facebook.com/v22.0/${IG_ID}/media`, FB_TOKEN, {
    image_url: imgUrl || IMG_BASE, caption
  });
  if (ig?.id) { await sleep(2000);
    return api('POST', `https://graph.facebook.com/v22.0/${IG_ID}/media_publish`, FB_TOKEN, { creation_id: ig.id }); }
  return ig;
}

async function postThreads(text) {
  const c = await api('POST', `https://graph.threads.net/v1.0/${TH_ID}/threads`, TH_TOKEN, { media_type: 'TEXT', text });
  if (c?.id) { await sleep(2000);
    return api('POST', `https://graph.threads.net/v1.0/${TH_ID}/threads_publish`, TH_TOKEN, { creation_id: c.id }); }
  return c;
}

async function postFB(message, imgUrl) {
  const pt = await getPageToken();
  if (imgUrl) {
    return api('POST', `https://graph.facebook.com/v22.0/${FB_PAGE_ID}/photos`, pt, { url: imgUrl, message, published: true });
  }
  return api('POST', `https://graph.facebook.com/v22.0/${FB_PAGE_ID}/feed`, pt, { message, link: 'https://palja.net' });
}

async function sendMail(subject, content) {
  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_PASS } });
  return transporter.sendMail({
    from: GMAIL_USER, to: GMAIL_USER,
    subject,
    text: '금일 생성된 컨텐츠 초안입니다.\n---\n\n' + content + '\n\n---\n팔자 AI 바이럴 자동화\nhttps://palja.net'
  });
}

// ===== TASK DISPATCHER =====
const tasks = {
  // 1. KOSPI 브리핑
  kospi_ig: async () => {
    let briefs = await fetchJSON(`${SUPABASE_URL}/rest/v1/market_briefs?brief_date=eq.${kstDate()}&limit=1`);
    let raw;
    if (!briefs || !briefs.length) {
      console.log('⚠️ KOSPI IG: No supabase data for today, falling back to Naver...');
      const naver = await fetchNaverKospi();
      raw = naver.content;
    } else {
      raw = briefs[0]?.content || '';
    }
    const text = `📊 ${kstDate()} KOSPI 브리핑\n\n${raw}\n\n👉 palja.net\n\n#코스피 #시장브리핑 #주식 #팔자 #AI분석`;
    return postIG(text, null);
  },
  kospi_th: async () => {
    let briefs = await fetchJSON(`${SUPABASE_URL}/rest/v1/market_briefs?brief_date=eq.${kstDate()}&limit=1`);
    let raw;
    if (!briefs || !briefs.length) {
      console.log('⚠️ KOSPI TH: No supabase data for today, falling back to Naver...');
      const naver = await fetchNaverKospi();
      raw = naver.content;
    } else {
      raw = briefs[0]?.content || '';
    }
    const header = `📊 ${kstDate()} KOSPI 브리핑\n`;
    const footer = `\n👉 https://palja.net`;
    // Threads 500자 제한 (platform limit)
    const maxLen = 500 - header.length - footer.length;
    const truncated = raw.length > maxLen ? raw.slice(0, raw.lastIndexOf('.', maxLen) + 1) || raw.slice(0, raw.lastIndexOf('\n', maxLen)) || raw.slice(0, Math.max(maxLen - 1, 0)) + '…' : raw;
    const text = header + truncated + footer;
    return postThreads(text);
  },
  kospi_fb: async () => {
    let briefs = await fetchJSON(`${SUPABASE_URL}/rest/v1/market_briefs?select=*&brief_date=eq.${kstDate()}&limit=1`);
    if (!briefs || !briefs.length) {
      console.log('⚠️ No supabase data for today, falling back to Naver...');
      const naver = await fetchNaverKospi();
      const text = `📊 ${kstDate()} KOSPI 브리핑\n\n${naver.content}\n\n👉 AI 사주 × 주식 분석: palja.net`;
      return postFB(text, null);
    }
    const text = `📊 ${kstDate()} KOSPI 브리핑\n\n${briefs[0]?.content || ''}\n\n👉 AI 사주 × 주식 분석: palja.net`;
    return postFB(text, null);
  },

  // 2. 오행 온도계
  temp_ig: async () => {
    const imgUrl = await genTempImage();
    const r = await postIG(`🌡️ ${kstDate()} 오행 시장 온도계 리포트\n\n오늘의 시장 에너지를 오행(목화토금수)으로 분석했습니다.\n현재 가장 강한 기운을 가진 종목군을 이미지로 확인하세요.\nAI 사주 × 주식 분석 👉 palja.net\n\n#오행 #시장온도계 #오늘의주식 #팔자 #AI분석 #코스피`, imgUrl);
    return r;
  },
  temp_th: async () => {
    const stocks = await fetchJSON(`${SUPABASE_URL}/rest/v1/krx_daily_market_snapshots?select=element_tags,trade_value&order=trade_value.desc&limit=100`);
    const elem = { '목':0,'화':0,'토':0,'금':0,'수':0 };
    let total = 0;
    for (const s of stocks) { if (s.element_tags?.[0] && elem[s.element_tags[0]] !== undefined) { elem[s.element_tags[0]] += Number(s.trade_value); total += Number(s.trade_value); } }
    const sorted = Object.entries(elem).sort((a,b)=>b[1]-a[1]).filter(([_,v])=>v>0).map(([k,v]) => `${k} ${Math.round(v/total*100)}%`).join(' | ');
    return postThreads(`🌡️ ${kstDate()} 오행 온도계\n${sorted}\n👉 https://palja.net`);
  },
  temp_fb: async () => {
    const imgUrl = await genTempImage();
    const r = await postFB(`🌡️ ${kstDate()} 오행 시장 온도계 리포트\n\n오늘의 시장 에너지를 오행으로 분석했습니다.\nAI 사주 × 주식 분석: palja.net`, imgUrl);
    // temp_fb is last task using the image — clean up git
    gitCleanup('viral/output/ig_images/temp_report.png');
    return r;
  },

  // 3. 블로그 초안 메일
  email_blog: async () => {
    const f1 = fs.readFileSync(path.join(os.homedir(), 'Repo/openclaw_palja/viral/output/03_0800_naver_blog.txt'), 'utf-8');
    const f2 = fs.readFileSync(path.join(os.homedir(), 'Repo/openclaw_palja/viral/output/03_0800_tistory_blog.txt'), 'utf-8');
    await sendMail(`📝 [팔자] ${kstDate()} 네이버 블로그 초안`, f1);
    await sendMail(`📝 [팔자] ${kstDate()} 티스토리 초안`, f2);
    return { status: 'email_sent', count: 2 };
  },

  // 4. 카피 #1~10 (Threads)
  copy_1: () => postThreads(`🐉 용띠 오늘 운세 확인! 👉 https://palja.net`),
  copy_2: () => postThreads(`🔥 오늘 오행: 화(火) 기운 압도적! 반도체 주목 👉 https://palja.net`),
  copy_3: () => postThreads(`😎 오늘의 주식 한줄: \"용띠는 사자, 닭띠는 쉬어가자\" 👉 https://palja.net`),
  copy_4: () => postThreads(`🎴 팔자가 AI로 분석한 오늘의 띠별 주식운세! 👉 https://palja.net`),
  copy_5: () => postThreads(`🌡️ 시장 온도: 화(火)가 뜨겁다! 내 투자 성향은? 👉 https://palja.net`),
  copy_6: () => postThreads(`💧 수(水) 기운 10%지만 물류주 선방 중! HMM·한진칼 👉 https://palja.net`),
  copy_7: () => postThreads(`💰 금(金) 18% 금융주 방어세! 이 기회에? 👉 https://palja.net`),
  copy_8: () => postThreads(`⚠️ 닭띠·뱀띠 오늘은 특히 조심! 운세 확인 👉 https://palja.net`),
  copy_9: () => postThreads(`🔮 띠별 재물운 TOP3: 용·호랑이·말! 내 운세는? 👉 https://palja.net`),
  copy_10: () => postThreads(`📊 폭락 후 반등! 시장 흐름 AI 분석 👉 https://palja.net`),

  // 5. IG 카드뉴스
  cardnews: async () => {
    const raw = require('child_process').execSync;
    try {
      raw('cd ~/Repo/openclaw_palja && git pull origin main 2>/dev/null; NODE_PATH=/home/paljastock/.openclaw/tools/node-v22.22.2/lib/node_modules node viral/render_cards_today.cjs 2>&1', { stdio: 'pipe' });
    } catch(e) {}
    try {
      raw('cd ~/Repo/openclaw_palja && git add -f viral/output/cards_html/*0716.png viral/output/cards_html/card*.png 2>/dev/null && git commit -m "auto: cardnews ' + kstDate() + '" && git push origin main 2>&1', { stdio: 'pipe' });
    } catch(e) {}
    
    const images = ['card01_cover_0716','card02_top3_0716','card03_caution_0716','card04_temp_0716','card05_cta_0716'].map(n => `${RAW_BASE}/cards_html/${n}.png`);
    const children = [];
    for (const img of images.slice(0,5)) {
      const c = await api('POST', `https://graph.facebook.com/v22.0/${IG_ID}/media`, FB_TOKEN, { image_url: img, is_carousel_item: true });
      if (c?.id) children.push(c.id);
      await sleep(1500);
    }
    if (children.length >= 2) {
      const car = await api('POST', `https://graph.facebook.com/v22.0/${IG_ID}/media`, FB_TOKEN, {
        media_type: 'CAROUSEL', children, caption: `🔥 ${kstDate()} 오늘의 주식운세 카드뉴스\n\n👉 palja.net\n\n#주식운세 #띠별운세 #카드뉴스 #팔자 #AI분석 #오행`
      });
      if (car?.id) { await sleep(2000);
        const pub = await api('POST', `https://graph.facebook.com/v22.0/${IG_ID}/media_publish`, FB_TOKEN, { creation_id: car.id });
        gitCleanup('viral/output/cards_html/*0716.png viral/output/cards_html/card*.png');
        return pub;
      }
    }
    return { error: 'not enough cards' };
  },

  // 6. 재물운
  wealth_ig: async () => postIG(`🐷 ${kstDate()} 띠별 재물운\n\n🥇 용띠 🥈 호랑이띠 🥉 말띠\n⚠️ 닭띠·뱀띠·토끼띠 조심\n\n👉 palja.net\n\n#띠별운세 #재물운 #주식운세 #팔자`, null),
  wealth_th: async () => postThreads(`🐷 ${kstDate()} 띠별 재물운\n🥇 용띠 🥈 호랑이띠 🥉 말띠\n⚠️ 닭·뱀·토끼 조심\n👉 https://palja.net`),
  wealth_fb: async () => postFB(`🐷 ${kstDate()} 띠별 재물운\n\n🥇 용띠 — 큰 재물 들어올 기운!\n🥈 호랑이띠 — 새로운 투자 기회!\n🥉 말띠 — 들어온 이익 잘 갈무리\n\n⚠️ 조심할 띠: 닭띠 · 뱀띠 · 토끼띠\n\n👉 AI 사주 × 주식 분석: palja.net`, null),

  // 7. 숏츠 대본 → 영상 생성 → 메일 발송
  email_shorts: async () => {
    try {
      const { execSync } = require('child_process');
      const scriptPath = path.join(os.homedir(), 'Repo/openclaw_palja/viral/gen_shorts_video.cjs');
      
      // Run the short video generator
      const result = execSync(
        `NODE_PATH=/tmp/node_modules:$NODE_PATH node ${scriptPath}`,
        { stdio: 'pipe', timeout: 180000, cwd: path.join(os.homedir(), 'Repo/openclaw_palja') }
      ).toString();
      
      const urlMatch = result.match(/DONE: (https?[^\s]+)/);
      const videoUrl = urlMatch ? urlMatch[1] : '생성 실패';
      
      await sendMail(
        `🎬 [팔자] ${kstDate()} 유튜브 숏츠 영상`, 
        `안녕하세요, 금일 생성된 유튜브 숏츠 영상 링크입니다.\n\n` +
        `🎬 다운로드: ${videoUrl}\n\n` +
        `---\n` +
        `팔자 AI 바이럴 자동화\n` +
        `https://palja.net`
      );
      return { status: 'video_created', url: videoUrl };
    } catch (e) {
      // Fallback: send script file if video gen fails
      try {
        const f = fs.readFileSync(path.join(os.homedir(), 'Repo/openclaw_palja/viral/output/07_1200_shorts_script.txt'), 'utf-8');
        await sendMail(`🎬 [팔자] ${kstDate()} 유튜브 숏츠 대본`, f);
      } catch (e2) {
        await sendMail(`🎬 [팔자] ${kstDate()} 유튜브 숏츠`, '숏츠 생성 중 오류가 발생했습니다.');
      }
      return { status: 'fallback_email_sent', error: e.message };
    }
  },

  // 8. 숏츠 영상 생성 → 미디어 디렉토리 복사 (YouTube 업로드용)
  yt_shorts: async () => {
    try {
      const { execSync } = require('child_process');
      const scriptPath = path.join(os.homedir(), 'Repo/openclaw_palja/viral/gen_shorts_video.cjs');

      // Run the short video generator
      const result = execSync(
        `NODE_PATH=/tmp/node_modules:$NODE_PATH node ${scriptPath}`,
        { stdio: 'pipe', timeout: 180000, cwd: path.join(os.homedir(), 'Repo/openclaw_palja') }
      ).toString();

      const urlMatch = result.match(/(?:DONE|🎬 Short URL): (https?[^\s]+)/);
      const videoUrl = urlMatch ? urlMatch[1] : '생성 실패';

      console.log('✅ yt_shorts video URL:', videoUrl);
      return { status: 'video_created', url: videoUrl };
    } catch (e) {
      console.error('❌ yt_shorts failed:', e.message);
      return { status: 'error', error: e.message };
    }
  },

  // 9. 장마감
  close_th: async () => {
    let briefs = await fetchJSON(`${SUPABASE_URL}/rest/v1/market_briefs?brief_date=eq.${kstDate()}&limit=1`);
    let raw;
    if (!briefs || !briefs.length) {
      console.log('⚠️ CLOSE TH: No supabase data for today, falling back to Naver...');
      const naver = await fetchNaverKospi();
      raw = naver.content;
    } else {
      raw = briefs[0]?.content || '';
    }
    const header = `🌙 ${kstDate()} 시장 브리핑\n`;
    const footer = `\n👉 https://palja.net`;
    const maxLen = 500 - header.length - footer.length;
    const truncated = raw.length > maxLen ? raw.slice(0, raw.lastIndexOf('.', maxLen) + 1) || raw.slice(0, raw.lastIndexOf('\n', maxLen)) || raw.slice(0, Math.max(maxLen - 1, 0)) + '…' : raw;
    const text = header + truncated + footer;
    return postThreads(text);
  },
  close_fb: async () => {
    let briefs = await fetchJSON(`${SUPABASE_URL}/rest/v1/market_briefs?brief_date=eq.${kstDate()}&limit=1`);
    let raw;
    if (!briefs || !briefs.length) {
      console.log('⚠️ CLOSE FB: No supabase data for today, falling back to Naver...');
      const naver = await fetchNaverKospi();
      raw = naver.content;
    } else {
      raw = briefs[0]?.content || '';
    }
    return postFB(`🌙 ${kstDate()} 시장 브리핑\n\n${raw}\n\n👉 AI 사주 × 주식 분석: palja.net`, null);
  },
};

// ===== MAIN =====
const taskKey = process.argv[2];
if (!taskKey || !tasks[taskKey]) {
  console.error(`Usage: auto_runner.cjs [task_key]`);
  console.error(`Available: ${Object.keys(tasks).join(', ')}`);
  process.exit(1);
}

console.log(`🎴 [${kstDate()}] Running task: ${taskKey}`);
tasks[taskKey]()
  .then(r => console.log(`✅ ${taskKey}: ${JSON.stringify(r).slice(0,100)}`))
  .catch(e => console.error(`❌ ${taskKey}: ${e.message}`));
