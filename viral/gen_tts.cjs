const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT = '/tmp/shorts_audio';
fs.mkdirSync(OUT, { recursive: true });

// Fixed: palja.net → 팔자쩜넷 for correct Korean TTS pronunciation
const segments = [
  { file: '01_intro.mp3', text: '오늘 주식운세 1등은 누굴까? 팔자가 알려드립니다.' },
  { file: '02_best.mp3', text: '오늘 최고 운세는 바로 용띠, 90점! 기운이 상승하는 날, 과감하게 나아가도 좋습니다. 직감이 날카로워지는 시기! 반도체 반등 흐름을 포착했다면 추가 상승 가능성이 있어요.' },
  { file: '03_worst.mp3', text: '근데 닭띠는 조심하세요. 40점입니다. 작은 실수로 손실 발생 가능! 꼼꼼하게 체크하고 충동 매매는 절대 금물. 오늘은 그냥 쉬는 게 답일수도?' },
  { file: '04_ohang.mp3', text: '오늘 시장은 화 기운 43%, 불이 너무 세면 오히려 타는 법. 수 기운 10% 유일한 플러스 업종입니다.' },
  { file: '05_cta.mp3', text: '여러분의 띠는 무슨 점수인가요? 댓글 남겨주세요. 팔자쩜넷에서 내 운세 확인하러 가기.' },
];

// Google TTS parameters: tl=ko (Korean), already female voice
const TTS_BASE = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&ttsspeed=1.3&q=';

let completed = 0;
function next(i) {
  if (i >= segments.length) {
    console.log('✅ All TTS segments downloaded');
    return;
  }
  const seg = segments[i];
  https.get(TTS_BASE + encodeURIComponent(seg.text), res => {
    const chunks = [];
    res.on('data', c => chunks.push(c));
    res.on('end', () => {
      const buf = Buffer.concat(chunks);
      if (res.statusCode === 200 && buf.length > 1000) {
        fs.writeFileSync(path.join(OUT, seg.file), buf);
        console.log(`✅ ${seg.file} (${buf.length} bytes)`);
      } else {
        console.log(`❌ ${seg.file}: HTTP ${res.statusCode}, ${buf.length} bytes`);
      }
      next(i + 1);
    });
  }).on('error', e => {
    console.log(`❌ ${seg.file}: ${e.message}`);
    next(i + 1);
  });
}
next(0);
