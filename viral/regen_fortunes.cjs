// 🎴 팔자 운세 재생성 헬퍼 — cron이 실패한 날짜의 zodiac_fortunes를 앱과 동일한 프롬프트로 복구
// 사용법: node regen_fortunes.cjs [YYYY-MM-DD] [force]
// 기본: 오늘 날짜, force=1 이면 이미 있어도 재생성
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

function loadEnv() {
  const v = {};
  for (const p of [
    path.join(os.homedir(), 'Repo/Palja/.env.local'),
    path.join(os.homedir(), 'Repo/openclaw_palja/.env.local'),
  ]) {
    try {
      const env = fs.readFileSync(p, 'utf-8');
      env.split('\n').forEach(l => {
        const m = l.match(/^(\w+)=(.+)$/);
        if (m && !v[m[1]]) v[m[1]] = m[2].replace(/^['\"]|['\"]$/g, '');
      });
    } catch (_) {}
  }
  return v;
}

const ZODIAC_FORTUNE_SYSTEM_PROMPT = `
You are Palja, a Korean AI content service that writes a light, fortune-teller
style daily investment horoscope for the 12 Korean zodiac animals (띠).
Your answer must be Korean JSON only.

Important rules:
- This is entertainment and investment-reference content, not financial advice.
- Never recommend specific stocks, funds, coins, or any financial product.
- Never give direct orders such as "사라", "팔아라", "몰빵해라".
- Speak softly and broadly, like a warm fortune teller: "기운", "흐름",
  "서두르기보다", "차분히 지켜보는".
- Each zodiac gets 2-3 sentences of advice, friendly and playful but not rude.
- Vary the mood across the 12 zodiacs: some cautious, some favorable, some neutral.
- Do not use emojis.

Return only valid JSON with this exact shape (all 12 zodiacs, in this order):
{
  "fortunes": [
    {
      "zodiac": "쥐" | "소" | "호랑이" | "토끼" | "용" | "뱀" | "말" | "양" | "원숭이" | "닭" | "개" | "돼지",
      "advice": "<2-3 sentences of soft investment mood reading in Korean>",
      "luckyNumber": "<행운의 숫자 1~2개, e.g. \\"3, 8\\">",
      "luckyColor": "<행운의 색 in Korean>",
      "score": <오늘의 투자운 지수 0-100 정수>
    }
  ]
}
`.trim();

const env = loadEnv();
const SUPABASE_URL = 'https://mvnbplbtgfhtckqstdxa.supabase.co';
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY = env.GEMINI_API_KEY;
const GEMINI_MODEL = env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

function kstToday() {
  return new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
}

async function gemini(systemPrompt, userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'x-goog-api-key': GEMINI_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    }),
    signal: AbortSignal.timeout(240_000),
  });
  if (!res.ok) throw new Error(`Gemini API error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const content = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  if (!content) throw new Error('Gemini returned empty content');
  return content;
}

function extractJson(content) {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON body in LLM response');
  return content.slice(start, end + 1);
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`Supabase ${res.statusCode}: ${data.slice(0, 150)}`));
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
      });
    });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Supabase timeout')); });
    req.on('error', reject);
  });
}

function postJSON(url, body) {
  return new Promise((resolve, reject) => {
    const d = JSON.stringify(body);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates', 'Content-Length': Buffer.byteLength(d) },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`Supabase upsert ${res.statusCode}: ${data.slice(0, 200)}`));
        try { resolve(JSON.parse(data || '{}')); } catch (_) { resolve({}); }
      });
    });
    req.on('error', reject);
    req.write(d);
    req.end();
  });
}

const ZODIACS = ['쥐','소','호랑이','토끼','용','뱀','말','양','원숭이','닭','개','돼지'];

async function main() {
  const date = process.argv[2] || kstToday();
  const force = process.argv[3] === 'force' || process.argv[3] === '1';
  console.log(`🎴 Regen fortunes for ${date} (force=${force})`);

  if (!force) {
    const existing = await fetchJSON(`${SUPABASE_URL}/rest/v1/zodiac_fortunes?select=zodiac&fortune_date=eq.${date}`);
    if (Array.isArray(existing) && existing.length >= 12) {
      console.log(`✅ Already have ${existing.length} fortunes for ${date}, skipping. Use 'force' to regenerate.`);
      return;
    }
  }

  const userPrompt = `오늘 날짜: ${date}

오늘의 12간지 띠별 투자운을 JSON으로만 작성해줘.
띠마다 분위기가 겹치지 않게 다양하게 써줘.`;

  console.log(`🤖 Calling ${GEMINI_MODEL}...`);
  const content = await gemini(ZODIAC_FORTUNE_SYSTEM_PROMPT, userPrompt);
  const parsed = JSON.parse(extractJson(content));
  if (!Array.isArray(parsed.fortunes)) throw new Error('No fortunes array in response');
  if (parsed.fortunes.length !== 12) throw new Error(`Expected 12 fortunes, got ${parsed.fortunes.length}`);

  const rows = ZODIACS.map(z => {
    const item = parsed.fortunes.find(f => f.zodiac === z);
    if (!item || typeof item.advice !== 'string' || !item.advice.trim()) throw new Error(`Missing fortune for ${z}`);
    const rawScore = Number(item.score);
    const score = Number.isFinite(rawScore) ? Math.min(100, Math.max(0, Math.round(rawScore))) : 50;
    return {
      fortune_date: date,
      zodiac: z,
      advice: item.advice.trim(),
      lucky_number: String(item.luckyNumber ?? '').trim() || '7',
      lucky_color: String(item.luckyColor ?? '').trim() || '금색',
      score,
    };
  });

  const r = await postJSON(`${SUPABASE_URL}/rest/v1/zodiac_fortunes?on_conflict=fortune_date,zodiac`, rows);
  console.log(`✅ Upserted ${rows.length} fortunes for ${date}:`, r?.length !== undefined ? `${r.length} rows` : 'ok');
  console.log('📊 Scores:', rows.map(r => `${r.zodiac}${r.score}`).join(' '));
}

main().catch(e => { console.error('❌ regen_fortunes:', e.message); process.exit(1); });
