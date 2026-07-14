const { chromium } = require('playwright-core');
const path = require('path');
const os = require('os');
const fs = require('fs');

const OUT_DIR = path.join(os.homedir(), 'Repo/openclaw_palja/viral/output/ig_images');
fs.mkdirSync(OUT_DIR, { recursive: true });

// 오행 온도계 HTML (palja.net 스타일)
const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; background: #0a0a1a; display: flex; justify-content: center; align-items: center; min-height: 1080px; }
.card {
  width: 1080px; height: 1080px;
  background: linear-gradient(145deg, #12121e 0%, #1a1a2e 100%);
  border-radius: 0; padding: 60px;
  display: flex; flex-direction: column;
}
.logo { font-size: 28px; color: #ffc832; font-weight: bold; margin-bottom: 10px; }
.logo span { color: #888; }
.title { font-size: 42px; color: #fff; font-weight: bold; margin-bottom: 8px; }
.subtitle { font-size: 24px; color: #888; margin-bottom: 40px; }
.bar-wrap { margin-bottom: 24px; }
.bar-label { display: flex; justify-content: space-between; color: #ccc; font-size: 22px; margin-bottom: 8px; }
.bar-label .pct { font-weight: bold; font-size: 28px; }
.bar-track { height: 40px; background: rgba(255,255,255,0.06); border-radius: 20px; overflow: hidden; position: relative; }
.bar-fill { height: 100%; border-radius: 20px; display: flex; align-items: center; padding-left: 20px; color: #fff; font-weight: bold; font-size: 20px; transition: width 1s; }
.bar-fill.fire { background: linear-gradient(90deg, #ff5032, #ff8832); width: 86%; }
.bar-fill.gold { background: linear-gradient(90deg, #c8aa32, #e8cc52); width: 9%; }
.bar-fill.earth { background: linear-gradient(90deg, #966e46, #b68856); width: 2%; }
.stock-info { font-size: 20px; color: #666; margin-top: 6px; padding-left: 4px; }
.tip { margin-top: auto; padding: 30px; background: rgba(255,80,50,0.08); border-radius: 16px; border: 1px solid rgba(255,80,50,0.15); }
.tip-text { font-size: 26px; color: #ffc832; font-weight: bold; margin-bottom: 8px; }
.tip-sub { font-size: 20px; color: #888; }
.footer { margin-top: 20px; font-size: 22px; color: #555; text-align: center; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">🎴 PALJA <span>| 오행 시장 온도계</span></div>
  <div class="title">🔥 화(火)의 날 — 86%</div>
  <div class="subtitle">7월 14일 기준 오행별 거래대금 비중</div>
  
  <div class="bar-wrap">
    <div class="bar-label"><span>🔥 화(火) 불</span><span class="pct">86%</span></div>
    <div class="bar-track"><div class="bar-fill fire">86%</div></div>
    <div class="stock-info">SK하이닉스 -15.37% · 삼성전자 -10.70% · 삼성전기 -18.62%</div>
  </div>
  
  <div class="bar-wrap">
    <div class="bar-label"><span>💰 금(金) 쇠</span><span class="pct">9%</span></div>
    <div class="bar-track"><div class="bar-fill gold"></div></div>
    <div class="stock-info">KB금융 +0.98% · 하나금융 +3.19% · 현대차 -2.95%</div>
  </div>
  
  <div class="bar-wrap">
    <div class="bar-label"><span>🌍 토(土) 흙</span><span class="pct">2%</span></div>
    <div class="bar-track"><div class="bar-fill earth"></div></div>
    <div class="stock-info">삼성물산 -7.79% · 금호건설 -16.94%</div>
  </div>
  
  <div class="tip">
    <div class="tip-text">🔥 오늘은 불(火)의 기운이 압도적인 날!</div>
    <div class="tip-sub">시장의 흐름을 오행으로 읽는 재미! 내 투자 성향은? palja.net</div>
  </div>
  
  <div class="footer">👉 https://palja.net · AI가 분석한 사주와 주식의 궁합</div>
</div>
</body>
</html>`;

(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/paljastock/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome'
  });
  
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.setContent(html);
  await page.screenshot({ path: path.join(OUT_DIR, 'temp_report.png') });
  console.log('✅ temp_report.png');
  
  await page.close();
  await browser.close();
  console.log('\n🎉 Done!');
})();
