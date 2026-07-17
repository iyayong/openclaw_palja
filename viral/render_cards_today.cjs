const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const os = require('os');

const OUT = path.join(os.homedir(), 'Repo/openclaw_palja/viral/output/cards_html');
fs.mkdirSync(OUT, { recursive: true });

const now = new Date();
const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
const today = `${kst.getMonth() + 1}월 ${kst.getDate()}일`;
const dateCode = String(kst.getFullYear()).slice(-2) + String(kst.getMonth() + 1).padStart(2, '0') + String(kst.getDate()).padStart(2, '0');

const cards = [
  {
    name: `card01_cover_${dateCode}`,
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1080px;height:1080px;background:#12121e;font-family:Malgun Gothic,sans-serif;color:white">
      <div style="font-size:100px">🔥</div>
      <div style="font-size:100px;font-weight:bold;margin-top:30px">${today}</div>
      <div style="font-size:72px;color:#ffc832;font-weight:bold">오늘의 주식운세</div>
      <div style="width:300px;height:4px;background:#ff5032;border-radius:2px;margin-top:30px"></div>
      <div style="font-size:40px;color:#ddd;margin-top:40px">🔥 화(火)의 날</div>
    </div>`
  },
  {
    name: `card02_top3_${dateCode}`,
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1080px;height:1080px;background:#12121e;font-family:Malgun Gothic,sans-serif;color:white">
      <div style="font-size:48px;color:#ffc832;font-weight:bold">🏆 오늘의 최고 운세 TOP3</div>
      <div style="width:200px;height:3px;background:#ffc832;margin:20px 0 40px"></div>
      ${[['🥇','용띠','90점','#ffc832'],['🥈','호랑이띠','85점','#ff5032'],['🥉','말띠','80점','#ff9632']].map(([emoji,name,score,clr]) => `
        <div style="display:flex;align-items:center;width:800px;height:120px;background:#1e1e32;border-radius:24px;padding:0 40px;margin-bottom:20px">
          <div style="font-size:48px;width:80px">${emoji}</div>
          <div style="font-size:48px;font-weight:bold;flex:1">${name}</div>
          <div style="font-size:48px;font-weight:bold;color:${clr};background:rgba(255,255,255,0.08);padding:10px 30px;border-radius:30px">${score}</div>
        </div>`).join('')}
      <div style="font-size:28px;color:#b4b4be;margin-top:10px">기운 좋은 날! 작은 시도가 의미 있는 결과로</div>
    </div>`
  },
  {
    name: `card03_caution_${dateCode}`,
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1080px;height:1080px;background:#12121e;font-family:Malgun Gothic,sans-serif;color:white">
      <div style="font-size:48px;color:#ffb450;font-weight:bold">⚠️ 오늘은 이것만 조심하세요</div>
      <div style="width:200px;height:3px;background:#ffb450;margin:20px 0 40px"></div>
      ${[['🐔 닭띠','45점','급한 결정은 잠시 미루세요'],['🐍 뱀띠','50px','흐름이 정체되어도 인내하세요'],['🐰 토끼띠','55점','서두르면 실수! 여유를 가지세요']].map(([name,score,tip]) => `
        <div style="display:flex;align-items:center;width:800px;height:100px;background:#1e1e32;border-radius:24px;padding:0 30px;margin-bottom:16px">
          <div style="font-size:36px;font-weight:bold;width:160px">${name}</div>
          <div style="font-size:32px;color:#ffb450;font-weight:bold;width:80px">${score}</div>
          <div style="font-size:26px;color:#b4b4be;flex:1;text-align:right">${tip}</div>
        </div>`).join('')}
    </div>`
  },
  {
    name: `card04_temp_${dateCode}`,
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1080px;height:1080px;background:#12121e;font-family:Malgun Gothic,sans-serif;color:white">
      <div style="font-size:46px;color:#ffc832;font-weight:bold">🌡️ ${today} 오행 온도계</div>
      <div style="width:200px;height:3px;background:#ffc832;margin:20px 0 40px"></div>
      ${[['🔥 화(火)','43%','#ff5032'],['💰 금(金)','18%','#c8aa32'],['🌿 목(木)','16%','#4a9'],['🌍 토(土)','13%','#966e46'],['💧 수(水)','10%','#3288c8']].map(([name,pct,clr]) => `
        <div style="display:flex;align-items:center;width:800px;margin-bottom:18px">
          <div style="font-size:32px;width:140px;color:#ccc">${name}</div>
          <div style="flex:1;height:40px;background:rgba(255,255,255,0.06);border-radius:20px;overflow:hidden;margin:0 20px">
            <div style="height:100%;width:${Math.max(parseInt(pct)*7,60)}px;background:${clr};border-radius:20px;display:flex;align-items:center;padding-left:16px;font-weight:bold;color:#fff;font-size:22px">${pct}</div>
          </div>
        </div>`).join('')}
      <div style="font-size:28px;color:#b4b4be;margin-top:20px">화(火) 기운 압도적 — 반도체·에너지 주목</div>
    </div>`
  },
  {
    name: `card05_cta_${dateCode}`,
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1080px;height:1080px;background:#12121e;font-family:Malgun Gothic,sans-serif;color:white">
      <div style="font-size:80px">🎴</div>
      <div style="font-size:72px;font-weight:bold;color:#ffc832;margin-top:30px">PALJA</div>
      <div style="font-size:40px;color:#ddd;margin-top:20px">AI 사주 × 주식 큐레이션</div>
      <div style="width:300px;height:3px;background:#ff5032;margin:30px 0"></div>
      <div style="font-size:48px;font-weight:bold;color:white">내 사주에 맞는 주식 찾기</div>
      <div style="font-size:36px;color:#ffc832;margin-top:20px">👉 palja.net</div>
    </div>`
  }
];

(async () => {
  const browser = await chromium.launch({ executablePath: '/home/paljastock/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome' });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  for (const card of cards) {
    await page.setContent(card.html);
    await page.screenshot({ path: path.join(OUT, card.name + '.png') });
    console.log(`✅ ${card.name}.png`);
  }
  await page.close();
  await browser.close();
  console.log('🎴 All cards rendered!');
})();
