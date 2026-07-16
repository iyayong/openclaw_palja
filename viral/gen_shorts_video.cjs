// 🎬 팔자 숏츠 영상 자동 생성기
// 사용: NODE_PATH=/tmp/node_modules:$NODE_PATH node gen_shorts_video.cjs
// 출력: viral/output/shorts/final_short_daily.mp4 → GitHub push → URL 리턴

const https = require('https');
const { chromium } = require('playwright-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SUPABASE_URL = 'https://mvnbplbtgfhtckqstdxa.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const OUT_DIR = path.join(os.homedir(), 'Repo/openclaw_palja/viral/output/shorts');
const RAW_BASE = 'https://raw.githubusercontent.com/iyayong/openclaw_palja/main/viral/output/shorts';
const BG = '#0a0a1a';
const FW = '#ffc832';
const ACCENT = '#ff5032';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function kstDate() {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
}

function kstDateStr() {
  const d = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

async function genShorts() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const today = kstDateStr();
  const dateStr = kstDate().replace(/-/g, '');

  // Step 1: Fetch market data for script content
  let briefContent = '오늘의 주식운세를 AI가 분석했습니다.';
  let topElement = '화(火)';
  let topPct = '43';
  try {
    const brief = await fetchJSON(`${SUPABASE_URL}/rest/v1/market_briefs?select=content&order=brief_date.desc&limit=1`);
    if (brief[0]?.content) briefContent = brief[0].content.slice(0, 200);

    const stocks = await fetchJSON(`${SUPABASE_URL}/rest/v1/krx_daily_market_snapshots?select=element_tags,trade_value&order=trade_value.desc&limit=100`);
    const elem = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    let total = 0;
    for (const s of stocks) {
      if (s.element_tags?.[0] && elem[s.element_tags[0]] !== undefined) {
        elem[s.element_tags[0]] += Number(s.trade_value);
        total += Number(s.trade_value);
      }
    }
    const sorted = Object.entries(elem).sort((a, b) => b[1] - a[1]).filter(([_, v]) => v > 0);
    if (sorted.length > 0) {
      topElement = { 목: '목(木)', 화: '화(火)', 토: '토(土)', 금: '금(金)', 수: '수(水)' }[sorted[0][0]] || '화(火)';
      topPct = total > 0 ? Math.round((sorted[0][1] / total) * 100).toString() : '43';
    }
  } catch (e) { /* use defaults */ }

  // Step 2: Generate scenes HTML → screenshots
  const scenes = [
    {
      name: 'scene01_intro',
      html: `<div style="position:absolute;top:0;left:0;width:1080px;height:1920px;background:${BG};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Malgun Gothic,sans-serif;color:white">
        <div style="font-size:160px;margin-bottom:60px">🎴</div>
        <div style="font-size:110px;color:${FW};font-weight:bold;letter-spacing:8px">PALJA</div>
        <div style="width:400px;height:4px;background:${ACCENT};border-radius:2px;margin:40px 0"></div>
        <div style="font-size:52px;color:#ddd">${today} 오늘의 주식운세</div>
        <div style="font-size:68px;font-weight:bold;margin-top:80px;color:#fff">"오늘 1등은 누굴까?"</div>
        <div style="font-size:80px;margin-top:30px">🔮</div>
      </div>`
    },
    {
      name: 'scene02_best',
      html: `<div style="position:absolute;top:0;left:0;width:1080px;height:1920px;background:${BG};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Malgun Gothic,sans-serif;color:white">
        <div style="font-size:200px;margin-bottom:30px">🐉</div>
        <div style="font-size:110px;font-weight:bold;color:${FW}">용띠 90점!</div>
        <div style="width:400px;height:4px;background:${FW};margin:40px 0;border-radius:2px"></div>
        <div style="font-size:40px;color:#ddd;text-align:center;line-height:2;padding:0 60px;max-width:900px">
          기운이 상승하는 날!<br/>
          과감하게 나아가도 좋습니다.<br/>
          직감이 날카로워지는 시기!
        </div>
        <div style="font-size:32px;color:#888;margin-top:40px">반도체 반등 흐름 주목</div>
      </div>`
    },
    {
      name: 'scene03_worst',
      html: `<div style="position:absolute;top:0;left:0;width:1080px;height:1920px;background:${BG};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Malgun Gothic,sans-serif;color:white">
        <div style="font-size:180px;margin-bottom:30px">🐓</div>
        <div style="font-size:110px;font-weight:bold;color:${ACCENT}">닭띠 조심!</div>
        <div style="width:400px;height:4px;background:${ACCENT};margin:40px 0;border-radius:2px"></div>
        <div style="font-size:38px;color:#ddd;text-align:center;line-height:2;padding:0 60px;max-width:900px">
          작은 실수로 손실 발생 가능!<br/>
          충동 매매는 절대 금물!<br/>
          오늘은 그냥 쉬는 게 답일수도?
        </div>
      </div>`
    },
    {
      name: 'scene04_ohang',
      html: `<div style="position:absolute;top:0;left:0;width:1080px;height:1920px;background:${BG};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Malgun Gothic,sans-serif;color:white">
        <div style="font-size:52px;color:${FW};font-weight:bold;margin-bottom:50px">🔥 오행 시장 온도계</div>
        <div style="width:400px;height:4px;background:${FW};margin-bottom:50px;border-radius:2px"></div>
        ${[['화(火)', topPct + '%', '#ff5032'], ['금(金)', '18%', '#c8aa32'], ['목(木)', '16%', '#4a9'], ['토(土)', '13%', '#966e46'], ['수(水)', '10%', '#3288c8']].map(([n, p, c]) =>
          `<div style="display:flex;align-items:center;width:900px;margin-bottom:20px">
            <div style="font-size:40px;width:160px;color:#ccc;text-align:center">${n}</div>
            <div style="flex:1;height:50px;background:rgba(255,255,255,0.06);border-radius:25px;overflow:hidden">
              <div style="height:100%;width:${Math.max(parseInt(p) * 8, 80)}px;background:${c};border-radius:25px;display:flex;align-items:center;padding-left:24px;font-weight:bold;color:#fff;font-size:30px">${p}</div>
            </div>
          </div>`).join('')}
        <div style="font-size:30px;color:#888;margin-top:40px">${topElement} 기업 — 시장 에너지 집중</div>
      </div>`
    },
    {
      name: 'scene05_cta',
      html: `<div style="position:absolute;top:0;left:0;width:1080px;height:1920px;background:${BG};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Malgun Gothic,sans-serif;color:white">
        <div style="font-size:140px;margin-bottom:40px">🎴</div>
        <div style="font-size:80px;font-weight:bold;color:${FW};margin-bottom:30px">당신의 운세는?</div>
        <div style="width:300px;height:4px;background:${ACCENT};margin-bottom:40px;border-radius:2px"></div>
        <div style="font-size:44px;color:#ddd;margin-bottom:20px">댓글로 띠를 남겨주세요!</div>
        <div style="font-size:40px;color:#888;margin-bottom:60px">👉 palja.net에서 확인</div>
        <div style="font-size:36px;color:${FW};font-weight:bold;background:rgba(255,200,50,0.1);padding:20px 60px;border-radius:60px;border:2px solid ${FW}">palja.net</div>
      </div>`
    },
  ];

  console.log('🎬 Rendering scenes...');
  const browser = await chromium.launch({ executablePath: '/home/paljastock/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome' });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const scene of scenes) {
    await page.setContent(`<html><body style="margin:0;padding:0;background:${BG};width:1080px;height:1920px;overflow:hidden">${scene.html}</body></html>`);
    await page.screenshot({ path: path.join(OUT_DIR, scene.name + '.png'), clip: { x: 0, y: 0, width: 1080, height: 1920 } });
    console.log(`  ✅ ${scene.name}.png`);
  }
  await page.close();
  await browser.close();

  // Step 3: Generate TTS via Edge TTS
  console.log('🎤 Generating TTS...');
  const ttsDir = '/tmp/tts_shorts';
  fs.mkdirSync(ttsDir, { recursive: true });
  
  const ttsSegments = [
    { f: '01_intro.mp3', t: '오늘 주식운세 1등은 누굴까? 팔자가 알려드립니다.' },
    { f: '02_best.mp3', t: '오늘 최고 운세는 바로 용띠, 90점! 기운이 상승하는 날, 과감하게 나아가도 좋습니다. 직감이 날카로워지는 시기! 반도체 반등 흐름을 포착했다면 추가 상승 가능성이 있어요.' },
    { f: '03_worst.mp3', t: '근데 닭띠는 조심하세요. 40점입니다. 작은 실수로 손실 발생 가능! 꼼꼼하게 체크하고 충동 매매는 절대 금물. 오늘은 그냥 쉬는 게 답일수도?' },
    { f: '04_ohang.mp3', t: '오늘 시장은 ' + topElement + ' 기업 ' + topPct + '%, 시장 에너지가 집중되고 있습니다. 신중한 투자가 필요한 시점입니다.' },
    { f: '05_cta.mp3', t: '여러분의 띠는 무슨 점수인가요? 댓글 남겨주세요. 팔자쩜넷에서 내 운세 확인하러 가기.' },
  ];

  const { EdgeTTS } = require('/tmp/node_modules/node-edge-tts');
  for (const seg of ttsSegments) {
    const tts = new EdgeTTS({ voice: 'ko-KR-SunHiNeural', lang: 'ko-KR', rate: '+40%', pitch: '+0Hz', timeout: 30000 });
    await tts.ttsPromise(seg.t, path.join(ttsDir, seg.f));
    console.log(`  ✅ ${seg.f}`);
  }

  // Step 4: Build video with ffmpeg
  console.log('🎥 Building video...');
  const ffmpeg = '/tmp/ffmpeg-bin';
  
  // Measure audio durations
  const getDur = (f) => {
    const { spawnSync } = require('child_process');
    const r = spawnSync(ffmpeg, ['-i', f], { stdio: ['ignore', 'pipe', 'pipe'] });
    const txt = r.stderr.toString() + r.stdout.toString();
    const m = txt.match(/Duration: (\d+):(\d+):([\d.]+)/);
    if (m) return parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3]);
    return 5;
  };

  const audioDurs = ttsSegments.map(s => getDur(path.join(ttsDir, s.f)));
  console.log('  Audio durations:', audioDurs.map(d => d.toFixed(1) + 's'));

  // Concatenate audio
  const audioConcat = ttsSegments.map((s, i) => `file '${path.join(ttsDir, s.f).replace(/'/g, "'\\''")}'`).join('\n');
  fs.writeFileSync('/tmp/audio_concat.txt', audioConcat);
  execSync(`${ffmpeg} -y -f concat -safe 0 -i /tmp/audio_concat.txt -c copy /tmp/shorts_combined.mp3`);

  // Build ffmpeg command with image durations matching audio
  const sceneDurs = audioDurs.map(d => (d + 0.2).toFixed(1));
  const inputs = scenes.map((s, i) => `-loop 1 -t ${sceneDurs[i]} -i ${path.join(OUT_DIR, s.name + '.png')}`).join(' ');
  const filter = `[0:v][1:v][2:v][3:v][4:v]concat=n=5:v=1:a=0[v]`;
  const outFile = path.join(OUT_DIR, 'final_short_daily.mp4');

  execSync(
    `${ffmpeg} -y ${inputs} -i /tmp/shorts_combined.mp3 ` +
    `-filter_complex "${filter}" -map "[v]" -map "5:a" ` +
    `-c:v libx264 -preset fast -crf 18 -c:a aac -b:a 128k ` +
    `-pix_fmt yuv420p -shortest "${outFile}"`, { stdio: 'pipe', timeout: 120000 }
  );

  const stat = fs.statSync(outFile);
  console.log(`  ✅ Video created: ${(stat.size / 1024 / 1024).toFixed(1)}MB`);

  // Step 5: Push to GitHub
  console.log('📤 Pushing to GitHub...');
  try {
    execSync(
      `cd ${os.homedir()}/Repo/openclaw_palja && ` +
      `git add -f viral/output/shorts/final_short_daily.png 2>/dev/null; ` +
      `git add -f viral/output/shorts/final_short_daily.mp4 && ` +
      `git commit -m "auto: short ${dateStr}" && git push origin main 2>&1`,
      { stdio: 'pipe', timeout: 30000 }
    );
  } catch (e) {
    console.log('  ⚠️ Git push issue (non-fatal): ' + e.message.slice(0, 100));
  }

  const videoUrl = `${RAW_BASE}/final_short_daily.mp4`;
  console.log(`\n🎬 Short URL: ${videoUrl}`);
  return videoUrl;
}

// Run
genShorts()
  .then(url => { console.log('DONE:', url); process.exit(0); })
  .catch(e => { console.error('FAIL:', e.message); process.exit(1); });
