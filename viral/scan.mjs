// 💫 새 토큰 스캔 v2
import { readFileSync } from 'fs'

const raw = readFileSync('/home/paljastock/Repo/openclaw_palja/.env.local', 'utf-8')
const V = {}
for (const l of raw.split('\n')) {
  const m = l.match(/^(\w+)=(.+)$/)
  if (m) V[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
}

const api = async (url, token) => {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  return r.json()
}
const post = async (url, token, body) => {
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return r.json()
}

// 1. Threads
console.log('=== Threads /me ===')
const th = await api('https://graph.threads.net/v1.0/me?fields=id,username', V.THREAD_ACCESS_TOKEN)
console.log(JSON.stringify(th, null, 2))

if (th?.id) {
  const c = await post(`https://graph.threads.net/v1.0/${th.id}/threads`, V.THREAD_ACCESS_TOKEN, {
    media_type: 'TEXT',
    text: '🎴 팔자 AI - Threads 자동화 테스트!'
  })
  console.log('Create:', JSON.stringify(c))
  if (c?.id) {
    const p = await post(`https://graph.threads.net/v1.0/${th.id}/threads_publish`, V.THREAD_ACCESS_TOKEN, { creation_id: c.id })
    console.log('Publish:', JSON.stringify(p))
  }
}

// 2. Facebook Pages
console.log('\n=== FB /me/accounts ===')
const fb = await api('https://graph.facebook.com/v22.0/me/accounts?fields=id,name', V.FACEBOOK_ACCESS_TOKEN)
console.log(JSON.stringify(fb, null, 2))

if (fb?.data) {
  for (const p of fb.data) {
    console.log(`\n--- ${p.name} (${p.id}) ---`)
    const ig = await api(`https://graph.facebook.com/v22.0/${p.id}?fields=instagram_business_account{id,username}`, V.FACEBOOK_ACCESS_TOKEN)
    console.log('IG:', JSON.stringify(ig))
    
    if (ig?.instagram_business_account?.id) {
      const igId = ig.instagram_business_account.id
      console.log('🎉 IG 연결됨!')
      
      const c = await post(`https://graph.facebook.com/v22.0/${igId}/media`, V.FACEBOOK_ACCESS_TOKEN, {
        image_url: 'https://palja.net/images/palja-share-card.png',
        caption: '🎴 팔자 AI IG 자동화 테스트!\n#팔자 #AI사주 #주식운세'
      })
      console.log('Container:', JSON.stringify(c))
      
      if (c?.id) {
        const p = await post(`https://graph.facebook.com/v22.0/${igId}/media_publish`, V.FACEBOOK_ACCESS_TOKEN, { creation_id: c.id })
        console.log('Published:', JSON.stringify(p))
      }
    }
  }
}

// 3. Instagram Basic Display
console.log('\n=== IG /me ===')
const ig = await api('https://graph.instagram.com/v22.0/me?fields=user_id,username,account_type', V.INSTAGRAM_ACCESS_TOKEN)
console.log(JSON.stringify(ig, null, 2))
