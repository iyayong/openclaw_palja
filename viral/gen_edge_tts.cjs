const { EdgeTTS } = require('node-edge-tts');
const fs = require('fs');
const path = require('path');

const OUT = '/tmp/shorts_audio_v2';
fs.mkdirSync(OUT, { recursive: true });

const segments = [
  { file: '01_intro.mp3', text: '오늘 주식운세 1등은 누굴까? 팔자가 알려드립니다.' },
  { file: '02_best.mp3', text: '오늘 최고 운세는 바로 용띠, 90점! 기운이 상승하는 날, 과감하게 나아가도 좋습니다. 직감이 날카로워지는 시기! 반도체 반등 흐름을 포착했다면 추가 상승 가능성이 있어요.' },
  { file: '03_worst.mp3', text: '근데 닭띠는 조심하세요. 40점입니다. 작은 실수로 손실 발생 가능! 꼼꼼하게 체크하고 충동 매매는 절대 금물. 오늘은 그냥 쉬는 게 답일수도?' },
  { file: '04_ohang.mp3', text: '오늘 시장은 화 기운 43%, 불이 너무 세면 오히려 타는 법. 수 기운 10% 유일한 플러스 업종입니다.' },
  { file: '05_cta.mp3', text: '여러분의 띠는 무슨 점수인가요? 댓글 남겨주세요. 팔자쩜넷에서 내 운세 확인하러 가기.' },
];

let idx = 0;
async function next() {
  if (idx >= segments.length) {
    console.log('✅ All Edge TTS segments done!');
    // Print durations
    for (const seg of segments) {
      const exec = require('child_process').execSync;
      const dur = exec('/tmp/ffmpeg-bin -i ' + path.join(OUT, seg.file) + ' 2>&1 | grep Duration').toString();
      const m = dur.match(/Duration: ([0-9:.]*)/);
      console.log('  ' + seg.file + ' = ' + (m ? m[1] : '?'));
    }
    return;
  }
  const seg = segments[idx];
  console.log('Generating ' + seg.file + '...');
  
  const tts = new EdgeTTS({
    voice: 'ko-KR-SunHiNeural',
    lang: 'ko-KR',
    rate: '+50%',
    pitch: '+0Hz',
    timeout: 30000
  });
  
  try {
    await tts.ttsPromise(seg.text, path.join(OUT, seg.file));
    const stat = fs.statSync(path.join(OUT, seg.file));
    console.log('  ✅ ' + stat.size + ' bytes');
  } catch(e) {
    console.log('  ❌ ' + e.message);
  }
  
  idx++;
  next();
}

// Install edge-tts if needed
try {
  require.resolve('node-edge-tts');
  next();
} catch(e) {
  console.error('Please: cd /tmp && npm install node-edge-tts');
}
