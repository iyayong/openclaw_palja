const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const os = require('os');

const OUT = path.join(os.homedir(), 'Repo/Palja/viral/output/cards_html');
fs.mkdirSync(OUT, { recursive: true });

const cards = [
  {
    name: 'card01_cover',
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1080px;height:1080px;background:#12121e;font-family:sans-serif;color:white">
      <div style="font-size:100px">🔥</div>
      <div style="font-size:100px;font-weight:bold;margin-top:30px">7월 13일</div>
      <div style="font-size:72px;color:#ffc832;font-weight:bold">오늘의 주식운세</div>
      <div style="width:300px;height:4px;background:#ff5032;border-radius:2px;margin-top:30px"></div>
      <div style="font-size:40px;color:#ddd;margin-top:40px">🔥 불의 날 — 화(火) 86%</div>
    </div>`
  },
  {
    name: 'card02_top3',
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1080px;height:1080px;background:#12121e;font-family:sans-serif;color:white">
      <div style="font-size:48px;color:#ffc832;font-weight:bold">🏆 오늘의 최고 운세 TOP3</div>
      <div style="width:200px;height:3px;background:#ffc832;margin:20px 0 40px"></div>
      ${[['🥇','돼지띠','90점','#ffc832'],['🥈','용띠','88점','#ff5032'],['🥉','소띠','82점','#ff9632']].map(([emoji,name,score,clr]) => `
        <div style="display:flex;align-items:center;width:800px;height:120px;background:#1e1e32;border-radius:24px;padding:0 40px;margin-bottom:20px">
          <div style="font-size:48px;width:80px">${emoji}</div>
          <div style="font-size:48px;font-weight:bold;flex:1">${name}</div>
          <div style="font-size:48px;font-weight:bold;color:${clr};background:rgba(255,255,255,0.08);padding:10px 30px;border-radius:30px">${score}</div>
        </div>
      `).join('')}
      <div style="font-size:28px;color:#b4b4be;margin-top:10px">기운 좋은 날! 작은 시도가 의미 있는 결과로</div>
    </div>`
  },
  {
    name: 'card03_caution',
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1080px;height:1080px;background:#12121e;font-family:sans-serif;color:white">
      <div style="font-size:48px;color:#ffb450;font-weight:bold">⚠️ 오늘은 이것만 조심하세요</div>
      <div style="width:200px;height:3px;background:#ffb450;margin:20px 0 40px"></div>
      ${[['🐯 호랑이띠','45점','급한 결정은 잠시 미루세요'],['🐶 개띠','50점','흐름이 정체되어도 인내하세요'],['🐴 말띠','55점','서두르면 실수! 여유를 가지세요']].map(([name,score,tip]) => `
        <div style="width:800px;background:#281919;border-radius:24px;padding:24px 40px;margin-bottom:20px">
          <div style="display:flex;align-items:center;margin-bottom:8px">
            <div style="font-size:40px;font-weight:bold;flex:1">${name}</div>
            <div style="font-size:48px;font-weight:bold;color:#ff5032;background:rgba(255,80,50,0.2);padding:8px 24px;border-radius:30px">${score}</div>
          </div>
          <div style="font-size:28px;color:#b4b4be">${tip}</div>
        </div>
      `).join('')}
    </div>`
  },
  {
    name: 'card04_temp',
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1080px;height:1080px;background:#12121e;font-family:sans-serif;color:white">
      <div style="font-size:48px;font-weight:bold">🌡️ 오행 시장 온도계</div>
      <div style="width:200px;height:3px;background:#b4b4be;margin:20px 0 40px"></div>
      <div style="width:800px;margin-bottom:30px">
        <div style="height:100px;background:#ff5032;border-radius:16px;display:flex;align-items:center;padding:0 30px;width:86%;min-width:250px;justify-content:space-between">
          <div style="font-size:36px;font-weight:bold">🔥 화(火) 불</div>
          <div style="font-size:72px;font-weight:bold">86%</div>
        </div>
        <div style="font-size:22px;color:#b4b4be;margin-top:8px;padding-left:10px">SK하이닉스 -15.37% | 삼성전자 -10.70%</div>
      </div>
      <div style="width:800px;margin-bottom:20px">
        <div style="height:70px;background:#c8aa32;border-radius:16px;display:flex;align-items:center;padding:0 30px;width:40%;min-width:200px;justify-content:space-between">
          <div style="font-size:36px;font-weight:bold">💰 금(金) 쇠</div>
          <div style="font-size:48px;font-weight:bold">9%</div>
        </div>
      </div>
      <div style="width:800px;margin-bottom:20px">
        <div style="height:70px;background:#966e46;border-radius:16px;display:flex;align-items:center;padding:0 30px;width:30%;min-width:200px;justify-content:space-between">
          <div style="font-size:36px;font-weight:bold">🌍 토(土) 흙</div>
          <div style="font-size:48px;font-weight:bold">2%</div>
        </div>
      </div>
      <div style="font-size:32px;color:#ffc832;margin-top:30px">오늘은 불(火)의 기운이 압도적인 날!</div>
      <div style="font-size:24px;color:#b4b4be;margin-top:10px">코스피 -8.95% | 서킷브레이커 발동</div>
    </div>`
  },
  {
    name: 'card05_cta',
    html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:1080px;height:1080px;background:#12121e;font-family:sans-serif;color:white">
      <div style="font-size:72px;font-weight:bold;text-align:center">내 오늘의 운세는?</div>
      <div style="background:#ff5032;padding:20px 80px;border-radius:50px;font-size:48px;font-weight:bold;margin-top:30px;color:white">palja.net</div>
      <div style="font-size:32px;color:#b4b4be;margin-top:30px">AI가 분석한 내 사주와 주식의 궁합</div>
    </div>`
  }
];

(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/paljastock/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome'
  });
  for (const card of cards) {
    const html = `<html><head><meta charset="utf-8"></head><body style="margin:0">${card.html}</body></html>`;
    const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
    await page.setContent(html);
    const outPath = path.join(OUT, `${card.name}.png`);
    await page.screenshot({ path: outPath });
    const size = fs.statSync(outPath).size;
    console.log(`✅ ${card.name}.png — ${(size/1024).toFixed(0)}KB`);
    await page.close();
  }
  await browser.close();
  console.log('\n🎉 All 5 cards rendered!');
})();
