// 🎴 팔자 바이럴 - 실행 스크립트
// node --experimental-vm-modules --loader ts-node/esm run.ts

import { generateAllChannels } from './generator.js'

const date = process.argv[2] // optional: YYYY-MM-DD

console.log(`🎴 팔자 바이럴 컨텐츠 생성기
   대상일: ${date || '오늘'}
   ================================
`)

const results = await generateAllChannels(date)

for (const r of results) {
  console.log(`\n===== ${r.channel.toUpperCase()} =====`)
  if (r.title) console.log(`📌 ${r.title}`)
  console.log(`📝 ${r.body.slice(0, 200)}...`)
  console.log(`🏷️  ${r.tags.join(', ')}`)
  if (r.mediaHint) console.log(`🎨 ${r.mediaHint.slice(0, 200)}...`)
  console.log('')
}
