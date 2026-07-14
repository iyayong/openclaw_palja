// 🎴 바이럴 API 테스트
import { readFileSync } from 'fs'

const env = readFileSync('/home/paljastock/Repo/openclaw_palja/.env.local', 'utf-8')
const vars = {}
for (const line of env.split('\n')) {
  const m = line.match(/^(\w+)=['"]?(.+?)['"]?$/)
  if (m) vars[m[1]] = m[2]
}

const FB_TOKEN = vars['FACEBOOK_ACCESS_TOKEN']
const IG_TOKEN = vars['INSTAGRAM_ACCESS_TOKEN']
const TH_TOKEN = vars['THREAD_ACCESS_TOKEN']

console.log('📋 env 로드 완료')
console.log('FB_token:', FB_TOKEN?.slice(0, 20) + '...')
console.log('IG_token:', IG_TOKEN?.slice(0, 20) + '...')
console.log('TH_token:', TH_TOKEN?.slice(0, 20) + '...')

// 1. Threads 테스트
console.log('\n=== 1. Threads API ===')
const thRes = await fetch('https://graph.threads.net/v1.0/27744949145143969?fields=id,username', {
  headers: { Authorization: `Bearer ${TH_TOKEN}` }
})
const thData = await thRes.json()
console.log(JSON.stringify(thData, null, 2))

// 2. Facebook 페이지 정보
console.log('\n=== 2. Facebook Page 정보 ===')
const fbRes = await fetch('https://graph.facebook.com/v22.0/1227181440478531?fields=id,name,category,category_list', {
  headers: { Authorization: `Bearer ${FB_TOKEN}` }
})
const fbData = await fbRes.json()
console.log(JSON.stringify(fbData, null, 2))

// 3. Instagram Graph API - Facebook Page로 IG Business 연결 확인
console.log('\n=== 3. Instagram Business 연결 확인 ===')
const igCheckRes = await fetch('https://graph.facebook.com/v22.0/1227181440478531?fields=instagram_business_account{id,username}', {
  headers: { Authorization: `Bearer ${FB_TOKEN}` }
})
const igCheckData = await igCheckRes.json()
console.log(JSON.stringify(igCheckData, null, 2))

if (igCheckData?.instagram_business_account?.id) {
  // 4. IG 연결되어 있으면 포스팅 테스트
  const IG_ID = igCheckData.instagram_business_account.id
  console.log(`\n✅ IG Business ID: ${IG_ID}`)
  
  // 이미지 URL (palja.net 공개 이미지)
  const imgUrl = 'https://palja.net/images/palja-share-card.png'
  
  // Media container 생성
  const createRes = await fetch(`https://graph.facebook.com/v22.0/${IG_ID}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${FB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imgUrl,
      caption: '🎴 팔자 AI - 테스트 포스트!\nAI가 풀이하는 내 사주와 주식의 궁합!\n#팔자 #AI사주 #주식운세'
    })
  })
  const createData = await createRes.json()
  console.log('\n📸 Media container:', JSON.stringify(createData, null, 2))
  
  if (createData?.id) {
    // Publish
    const pubRes = await fetch(`https://graph.facebook.com/v22.0/${IG_ID}/media_publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${FB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: createData.id })
    })
    const pubData = await pubRes.json()
    console.log('✅ Published:', JSON.stringify(pubData, null, 2))
  }
} else {
  console.log('\n❌ Instagram Business 계정이 Facebook Page에 연결되지 않음')
  console.log('   → 인스타 앱: 설정 > 계정 > 연결된 계정 > Facebook')
  console.log('   → "팔자 AI 사주 주식운세" 페이지가 안 보이면 카테고리 문제일 가능성')
  console.log('   → 페북 페이지 설정에서 카테고리 "인터넷/IT 서비스"로 변경해보세요')
}

// 5. Threads 포스팅 테스트
console.log('\n=== 4. Threads 포스팅 테스트 ===')
const thCreate = await fetch(`https://graph.threads.net/v1.0/27744949145143969/threads`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${TH_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    media_type: 'TEXT',
    text: '🎴 팔자 AI 띠별 주식운세!\n\n7월 14일 오늘의 운세:\n🐷 돼지띠 90점 - 대박!\n🐯 호랑이띠 45점 - 조심!\n\n👉 palja.net 에서 내 운세 확인!',
  })
})
const thCreateData = await thCreate.json()
console.log('Container created:', JSON.stringify(thCreateData, null, 2))

if (thCreateData?.id) {
  const thPub = await fetch(`https://graph.threads.net/v1.0/27744949145143969/threads_publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: thCreateData.id })
  })
  const thPubData = await thPub.json()
  console.log('Published:', JSON.stringify(thPubData, null, 2))
}
