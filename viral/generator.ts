// 🎴 팔자 바이럴 - AI 컨텐츠 생성 엔진
// Supabase 데이터 + DeepSeek API로 채널별 맞춤 컨텐츠 생성

import { getTodayFortunes, getLatestMarketBrief, getMarketTemperature, getTopStocks, ZodiacFortune, MarketTemperature } from './queries.js'

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_MODEL = 'deepseek-v4-flash'
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'

interface ChannelContent {
  channel: string
  title: string
  body: string
  tags: string[]
  mediaHint?: string  // 이미지/영상 제작 힌트
}

// ===== 메인 생성 함수 =====
export async function generateAllChannels(date?: string): Promise<ChannelContent[]> {
  const d = date || kstDate()
  
  // 1. DB 데이터 로드
  const [fortunes, brief, temperatures, topStocks] = await Promise.all([
    getTodayFortunes(d),
    getLatestMarketBrief(),
    getMarketTemperature(),
    getTopStocks(),
  ])

  // 2. 각 채널별 생성
  const channels: Array<{ channel: string; prompt: string; titleHint: string }> = [
    { channel: 'naver-blog', prompt: naverBlogPrompt(fortunes, brief, temperatures, topStocks, d), titleHint: '네이버 블로그' },
    { channel: 'tistory', prompt: tistoryPrompt(fortunes, brief, temperatures, topStocks, d), titleHint: '티스토리' },
    { channel: 'instagram', prompt: instagramPrompt(fortunes, temperatures, d), titleHint: '인스타그램' },
    { channel: 'threads', prompt: threadsPrompt(fortunes, temperatures, d), titleHint: '스레드' },
    { channel: 'shorts', prompt: shortsPrompt(fortunes, temperatures, d), titleHint: '유튜브 숏츠' },
  ]

  const results: ChannelContent[] = []
  
  // 순차 실행 (API 호출)
  for (const ch of channels) {
    console.log(`[viral] Generating ${ch.channel}...`)
    try {
      const content = await callDeepSeek(ch.prompt)
      const parts = parseResult(content)
      results.push({
        channel: ch.channel,
        title: parts.title || `${d} ${ch.titleHint}`,
        body: parts.body || content,
        tags: parts.tags || [],
        mediaHint: parts.mediaHint || '',
      })
    } catch (e: any) {
      console.error(`[viral] Error generating ${ch.channel}:`, e.message)
      results.push({
        channel: ch.channel,
        title: `${d} ${ch.titleHint}`,
        body: `(생성 실패: ${e.message})`,
        tags: [],
      })
    }
  }

  return results
}

// ===== 채널별 프롬프트 =====

function fortuneSummary(fortunes: ZodiacFortune[]): string {
  return fortunes.map(f =>
    `- ${f.zodiac}띠: ${f.score}점, "${f.advice}", 행운의 숫자 ${f.lucky_number}, 행운의 컬러 ${f.lucky_color}`
  ).join('\n')
}

function temperatureSummary(temps: MarketTemperature[]): string {
  return temps.map(t =>
    `${t.label}: ${t.ratio}% (대표종목: ${t.stocks.slice(0, 3).join(', ') || '없음'})`
  ).join('\n')
}

// --- 네이버 블로그 ---
function naverBlogPrompt(fortunes: ZodiacFortune[], brief: any, temps: MarketTemperature[], topStocks: any[], date: string): string {
  return `당신은 네이버 블로거입니다. 아래 데이터를 바탕으로 네이버 블로그에 올릴 SEO 최적화 장문 글을 작성해주세요.

[데이터]
날짜: ${date}
띠별 주식운세:
${fortuneSummary(fortunes)}

시장 오행 온도:
${temperatureSummary(temps)}

${brief ? `어제 시장 브리핑:\n${brief.content?.slice(0, 300)}` : ''}

[조건]
- 제목은 "7월 13일 띠별 주식운세 총정리! 🔮 오늘 내 투자운은?" 같은 형식
- 본문 800~1200자, 자연스러운 구어체
- H2/H3로 띠 구분 (예: "🐭 쥐띠 (75점)", "🐮 소띠 (82점)")
- 하단에 "palja.net" 서비스 소개 + 링크 자연스럽게 포함
- 키워드: 띠별운세, 주식운세, 오늘의운세, 재물운, 운세추천주
- 유사투자자문 면책 문구 필수 포함
- **투자 수익을 보장하거나 특정 종목을 강력 추천하는 표현 금지**
- 사이트 링크: https://palja.net

출력 형식:
---TITLE
(제목)
---BODY
(본문)
---TAGS
(키워드, 쉼표로 구분)`
}

// --- 티스토리 ---
function tistoryPrompt(fortunes: ZodiacFortune[], brief: any, temps: MarketTemperature[], topStocks: any[], date: string): string {
  return naverBlogPrompt(fortunes, brief, temps, topStocks, date).replace(
    '네이버 블로거',
    '티스토리 블로거'
  )
}

// --- 인스타그램 ---
function instagramPrompt(fortunes: ZodiacFortune[], temps: MarketTemperature[], date: string): string {
  const top3 = fortunes.sort((a, b) => b.score - a.score).slice(0, 3)
  const bottom3 = fortunes.sort((a, b) => a.score - b.score).slice(0, 3)
  
  return `당신은 인스타그램 크리에이터입니다. 아래 데이터로 인스타그램 카드뉴스용 이미지 설명 + 캡션을 작성해주세요.

[데이터]
날짜: ${date}
오늘 운세 TOP3: ${top3.map(f => `${f.zodiac}띠(${f.score}점)`).join(', ')}
오늘 운세 BOTTOM3: ${bottom3.map(f => `${f.zodiac}띠(${f.score}점)`).join(', ')}

오행 온도:
${temperatureSummary(temps)}

[포맷]
- **캡션**: 200자 내외, 가볍고 밈 감성, 이모지 많이 사용
- **이미지 가이드**: 5장 카드뉴스 구성안 (1:1 비율)
  - 1장: "오늘의 주식운세" 타이틀
  - 2장: 오늘 운세 TOP3 띠 + 점수
  - 3장: 오늘 운세 주의 띠 + 점수
  - 4장: 오행 온도계 리포트
  - 5장: "palja.net에서 내 운세 확인하기" CTA
- **해시태그**: #주식운세 #띠별운세 #재물운 #팔자 #주식 #코스피 (최대 10개)

출력 형식:
---TITLE
(없음)
---BODY
(캡션)
---TAGS
(해시태그, 쉼표로 구분)
---MEDIA_HINT
(5장 카드뉴스 장별 설명)`
}

// --- 스레드 ---
function threadsPrompt(fortunes: ZodiacFortune[], temps: MarketTemperature[], date: string): string {
  return `당신은 가벼운 감성의 트위터/스레드 유저입니다. 아래 데이터로 스레드 게시글을 작성해주세요.

[데이터]
날짜: ${date}
띠별 운세 중 재미있는 것만 추려서:
${fortuneSummary(fortunes).split('\n').slice(0, 3)}

오행 온도 (간략):
${temperatureSummary(temps).split('\n').slice(0, 2).join(', ')}

[조건]
- 3~5줄 이내, 매우 가벼운 말투
- 적절히 웃긴 요소나 공감 요소 포함
- 이모지 최소 3개
- 해시태그 3~5개
- "palja.net" 링크 한 번 언급

출력 형식:
---TITLE
(없음)
---BODY
(스레드 본문)
---TAGS
(해시태그, 쉼표로 구분)`
}

// --- 유튜브 숏츠 ---
function shortsPrompt(fortunes: ZodiacFortune[], temps: MarketTemperature[], date: string): string {
  const top1 = [...fortunes].sort((a, b) => b.score - a.score)[0]
  const bottom1 = [...fortunes].sort((a, b) => a.score - b.score)[0]
  
  return `당신은 유튜브 숏츠 크리에이터입니다. 아래 데이터로 30초 숏츠 대본을 작성해주세요.

[데이터]
날짜: ${date}
최고 운세: ${top1.zodiac}띠 (${top1.score}점) - "${top1.advice}"
최저 운세: ${bottom1.zodiac}띠 (${bottom1.score}점) - "${bottom1.advice}"

오행 온도 (간략):
${temperatureSummary(temps)}

[조건]
- 숏츠 길이: 25~35초
- TTS 음성 대본 + 화면 전환 가이드 포함
- 인트로(3초): 오늘의 주식운세 궁금하지?
- 메인(20초): 오늘 최고운세 띠 + 최저운세 띠 + 오행 기운
- 아웃트로(5초): "palja.net에서 내 띠 운세 확인!"
- 텍스트 오버레이 가이드 포함

출력 형식:
---TITLE
(숏츠 제목, 예: 오늘 주식운세 1등 띠는?)
---BODY
(대본, 타임라인 포함)
---TAGS
(해시태그, 쉼표로 구분)
---MEDIA_HINT
(화면 구성 설명)`
}

// ===== DeepSeek API 호출 =====
async function callDeepSeek(prompt: string): Promise<string> {
  const res = await fetch(DEEPSEEK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: '당신은 팔자(Palja)의 바이럴 마케팅 에이전트입니다. 한국어로 자연스럽고 매력적인 컨텐츠를 작성합니다.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.8,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek API error ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ===== 결과 파싱 =====
function parseResult(content: string): { title: string; body: string; tags: string[]; mediaHint?: string } {
  const result: any = { title: '', body: content, tags: [] }

  const titleMatch = content.match(/---TITLE\s*\n([\s\S]*?)(?:\n---)/)
  if (titleMatch) result.title = titleMatch[1].trim()

  const bodyMatch = content.match(/---BODY\s*\n([\s\S]*?)(?:\n---|$)/)
  if (bodyMatch) result.body = bodyMatch[1].trim()

  const tagsMatch = content.match(/---TAGS\s*\n([\s\S]*?)(?:\n---|$)/)
  if (tagsMatch) result.tags = tagsMatch[1].split(',').map((t: string) => t.trim()).filter(Boolean)

  const mediaMatch = content.match(/---MEDIA_HINT\s*\n([\s\S]*?)(?:\n---|$)/)
  if (mediaMatch) result.mediaHint = mediaMatch[1].trim()

  return result
}

function kstDate(): string {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().split('T')[0]
}
