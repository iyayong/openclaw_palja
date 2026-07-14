# 🎴 팔자 바이럴 자동화 시스템

## 시스템 구조

```
[Supabase DB] ←── OpenClaw Agent ──→ [5개 채널]
     │                  │
     ├─ zodiac_fortunes │  Phase 1: AI 컨텐츠 생성
     ├─ market_briefs   │  Phase 2: 자동 배포 (API 연동 필요)
     ├─ krx_snapshots   │
     └─ market_temp     │
```

## Phase 1 - 컨텐츠 생성 (지금 가능)

매일 OpenClaw Cron이 아래 3종 컨텐츠를 생성:

| 시간 | 컨텐츠 | 데이터 원천 | 설명 |
|------|--------|------------|------|
| **07:00** | 🏮 띠별 주식운세 | zodiac_fortunes | 12띠 + 오늘의 운 5채널 맞춤 |
| **08:30** | 🌡️ 오행 온도계 리포트 | krx_snapshots + element_tags | 오늘의 시장 오행 기운 + 추천 업종 |
| **14:00** | 🚨 장중 브리핑 (급변시) | 실시간 감지 | 폭락/급등 시 특별판 |

## Phase 2 - 자동 배포 (채널별 API 설정 필요)

| 채널 | API 방식 | CEO님 설정 필요 |
|------|---------|----------------|
| 네이버 블로그 | Naver Blog API | 네이버 개발자 앱 등록 |
| 티스토리 | Tistory API | 티스토리 앱 등록 + 토큰 |
| 인스타그램 | Instagram Graph API | Meta Business 계정 |
| 스레드 | Threads API | Meta Threads 앱 |
| 유튜브 숏츠 | YouTube Data API | Google Cloud Project |

## src/ 구조

```
viral/
├── README.md              ← 이 파일
├── .env                   ← Supabase 크레덴셜 (gitignored)
├── queries.ts             ← DB 조회 함수
├── templates/
│   ├── naver-blog.ts      ← 네이버 블로그 템플릿
│   ├── tistory.ts         ← 티스토리 템플릿
│   ├── instagram.ts       ← 인스타 템플릿
│   ├── threads.ts         ← 스레드 템플릿
│   └── shorts.ts          ← 유튜브 숏츠 템플릿
├── generator.ts           ← AI 컨텐츠 생성 엔진
└── publisher.ts           ← 채널별 배포 (Phase 2)
```
