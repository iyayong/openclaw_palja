import json, urllib.request, os, time, re

# Load token from env file
with open(os.path.expanduser('~/Repo/openclaw_palja/.env.local')) as f:
    text = f.read()

m = re.search(r'^FACEBOOK_ACCESS_TOKEN=(.+)$', text, re.MULTILINE)
TOKEN = m.grou…rip() if m else None

if not TOKEN:
    ***'❌ No token')
    exit(1)

IG_ID = '17841414832924095'

def ig_post(caption, img_url):
    # ensure_ascii=False keeps Korean characters as-is!
    body = json.dumps({'image_url': img_url, 'caption': caption}, ensure_ascii=False).encode('utf-8')
    
    # Create container
    req = urllib.request.Request(
        f'https://graph.facebook.com/v22.0/{IG_ID}/media',
        data=body,
        headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'}
    )
    resp = json.loads(urllib.request.urlopen(req).read())
    cid = resp.get('id', '')
    if not cid:
        print(f'❌ Container fail: {resp}')
        return
    print(f'  Container: {cid}')
    
    time.sleep(2)
    
    # Publish
    body2 = json.dumps({'creation_id': cid}, ensure_ascii=False).encode('utf-8')
    req2 = urllib.request.Request(
        f'https://graph.facebook.com/v22.0/{IG_ID}/media_publish',
        data=body2,
        headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'}
    )
    resp2 = json.loads(urllib.request.urlopen(req2).read())
    print(f'  ✅ IG: {resp2.get("id", "FAIL")}')

print('🎴 IG 3개 포스팅 시작...')
print()

ig_post(
    '7월 14일 시장 흐름 요약 📊 CPI 둔화 속 랠리 지속, 기술주 강세. 자세한 해석은 palja.net에서!\n👉 https://palja.net\n#시장브리핑 #CPI #코스피 #투자전략 #팔자',
    'https://palja.net/images/palja-share-card.png'
)

ig_post(
    '🔥 오늘의 오행 시장 온도: 불(火)의 기운이 활발한 날! 기술주 중심 시장 열기 지속. 내 투자 오행은? 👉 https://palja.net\n#오행 #시장온도계 #주식 #팔자 #AI분석',
    'https://palja.net/images/palja-share-card.png'
)

ig_post(
    '🐷 오늘의 띠별 재물운!\n\n돼지띠: 예상치 못한 수입!\n용띠: 큰돈 들어올 기운!\n소띠: 저축하는 날\n\n내 운세 확인 👉 https://palja.net\n\n#띠별운세 #재물운 #주식운세 #팔자 #오늘의운세',
    'https://palja.net/images/palja-share-card.png'
)

print('\n✅ 3개 포스팅 완료!')
