const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const os = require('os');

const OUT = path.join(os.homedir(), 'Repo/openclaw_palja/viral/output/shorts');
fs.mkdirSync(OUT, { recursive: true });

const BG = '#0a0a1a';
const FW = '#ffc832';
const ACCENT = '#ff5032';
const W = 1080;
const H = 1920;

const scenes = [
  {
    name: 'scene01_intro',
    html: `<div style="position:absolute;top:0;left:0;width:${W}px;height:${H}px;background:${BG};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Malgun Gothic,sans-serif;color:white">
      <div style="font-size:160px;margin-bottom:60px">🎴</div>
      <div style="font-size:110px;color:${FW};font-weight:bold;letter-spacing:8px">PALJA</div>
      <div style="width:400px;height:4px;background:${ACCENT};border-radius:2px;margin:40px 0"></div>
      <div style="font-size:52px;color:#ddd">7월 16일 오늘의 주식운세</div>
      <div style="font-size:68px;font-weight:bold;margin-top:80px;color:#fff">"오늘 1등은 누굴까?"</div>
      <div style="font-size:80px;margin-top:30px">🔮</div>
    </div>`
  },
  {
    name: 'scene02_best',
    html: `<div style="position:absolute;top:0;left:0;width:${W}px;height:${H}px;background:${BG};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Malgun Gothic,sans-serif;color:white">
      <div style="font-size:200px;margin-bottom:30px">🐉</div>
      <div style="font-size:110px;font-weight:bold;color:${FW}">용띠 90점!</div>
      <div style="width:400px;height:4px;background:${FW};margin:40px 0;border-radius:2px"></div>
      <div style="font-size:40px;color:#ddd;text-align:center;line-height:2;padding:0 60px;max-width:900px">
        기운이 상승하는 날!<br/>
        과감하게 나아가도 좋습니다.<br/>
        직감이 날카로워지는 시기!
      </div>
      <div style="font-size:32px;color:#888;margin-top:40px">SK하이닉스 · 삼성전자</div>
    </div>`
  },
  {
    name: 'scene03_worst',
    html: `<div style="position:absolute;top:0;left:0;width:${W}px;height:${H}px;background:${BG};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Malgun Gothic,sans-serif;color:white">
      <div style="font-size:180px;margin-bottom:30px">🐓</div>
      <div style="font-size:110px;font-weight:bold;color:${ACCENT}">닭띠 조심!</div>
      <div style="width:400px;height:4px;background:${ACCENT};margin:40px 0;border-radius:2px"></div>
      <div style="font-size:38px;color:#ddd;text-align:center;line-height:2;padding:0 60px;max-width:900px">
        작은 실수로 손실 발생 가능!<br/>
        충동 매매는 절대 금물!<br/>
        오늘은 그냥 쉬는 게 답일수도?
      </div>
      <div style="font-size:32px;color:#888;margin-top:40px">⚠️ 신중한 하루 보내세요</div>
    </div>`
  },
  {
    name: 'scene04_ohang',
    html: `<div style="position:absolute;top:0;left:0;width:${W}px;height:${H}px;background:${BG};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Malgun Gothic,sans-serif;color:white">
      <div style="font-size:52px;color:${FW};font-weight:bold;margin-bottom:50px">🔥 오행 시장 온도계</div>
      <div style="width:400px;height:4px;background:${FW};margin-bottom:50px;border-radius:2px"></div>
      ${[['화(火)','43%','#ff5032'],['금(金)','18%','#c8aa32'],['목(木)','16%','#4a9'],['토(土)','13%','#966e46'],['수(水)','10%','#3288c8']].map(([name,pct,clr]) => `
        <div style="display:flex;align-items:center;width:900px;margin-bottom:20px">
          <div style="font-size:40px;width:160px;color:#ccc;text-align:center">${name}</div>
          <div style="flex:1;height:50px;background:rgba(255,255,255,0.06);border-radius:25px;overflow:hidden">
            <div style="height:100%;width:${Math.max(parseInt(pct)*8,80)}px;background:${clr};border-radius:25px;display:flex;align-items:center;padding-left:24px;font-weight:bold;color:#fff;font-size:30px">${pct}</div>
          </div>
        </div>`).join('')}
      <div style="font-size:30px;color:#888;margin-top:40px">화(火) 기운 43% — 불이 너무 세면 오히려 타는 법</div>
    </div>`
  },
  {
    name: 'scene05_cta',
    html: `<div style="position:absolute;top:0;left:0;width:${W}px;height:${H}px;background:${BG};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Malgun Gothic,sans-serif;color:white">
      <div style="font-size:140px;margin-bottom:40px">🎴</div>
      <div style="font-size:80px;font-weight:bold;color:${FW};margin-bottom:30px">당신의 운세는?</div>
      <div style="width:300px;height:4px;background:${ACCENT};margin-bottom:40px;border-radius:2px"></div>
      <div style="font-size:44px;color:#ddd;margin-bottom:20px">댓글로 띠를 남겨주세요!</div>
      <div style="font-size:40px;color:#888;margin-bottom:60px">👉 palja.net에서 확인</div>
      <div style="font-size:36px;color:${FW};font-weight:bold;background:rgba(255,200,50,0.1);padding:20px 60px;border-radius:60px;border:2px solid ${FW}">palja.net</div>
    </div>`
  },
];

(async () => {
  const browser = await chromium.launch({ executablePath: '/home/paljastock/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome' });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  for (const scene of scenes) {
    await page.setContent(`<html><body style="margin:0;padding:0;background:${BG};width:${W}px;height:${H}px;overflow:hidden">${scene.html}</body></html>`);
    await page.screenshot({ path: path.join(OUT, scene.name + '.png'), clip: { x: 0, y: 0, width: W, height: H } });
    console.log(`✅ ${scene.name}.png`);
  }
  await page.close();
  await browser.close();
  console.log('🎬 All scenes rendered!');
})();
