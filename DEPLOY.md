# 웹에 올리기 (다른 사람도 접속)

이 프로젝트는 **Vercel**에 올리고, DB는 **Neon**(무료 PostgreSQL)을 쓰는 방식을 권장합니다. SQLite 파일은 서버리스에서 유지되지 않아 PostgreSQL로 배포합니다.

## 1. Neon에서 DB 만들기

1. [https://neon.tech](https://neon.tech) 가입 후 새 프로젝트 생성
2. **Connection string** 복사 (예: `postgresql://...@...neon.tech/neondb?sslmode=require`)

## 2. GitHub에 코드 올리기

```bash
git init
git add .
git commit -m "Initial commit"
```

GitHub에서 새 저장소 만든 뒤:

```bash
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## 3. Vercel 연결

1. [https://vercel.com](https://vercel.com) 로그인 → **Add New… → Project**
2. GitHub 저장소 import
3. **Environment Variables**에 다음 추가:
   - `DATABASE_URL` → Neon에서 복사한 URL (그대로)
   - `ANTHROPIC_API_KEY` → (선택) AI 자동 채우기 쓰려면 키 입력
4. **Deploy** 클릭

첫 배포가 끝나면 빌드 단계에서 `prisma db push`로 테이블이 생성됩니다.

## 4. 시드(기본 카테고리) 넣기

배포 후 한 번만 로컬에서 실행하면 됩니다 (Neon URL을 `.env.local`에 넣은 상태):

```bash
npm run db:seed
```

또는 Neon SQL Editor에서 직접 넣을 수도 있지만, `npm run db:seed`가 가장 간단합니다.

## 5. 접속 URL

Vercel 프로젝트 대시보드에 `https://프로젝트명.vercel.app` 형태로 표시됩니다. **Domains**에서 커스텀 도메인도 연결할 수 있습니다.

---

## 로컬 개발 (PostgreSQL)

```bash
docker compose up -d
```

`.env.local`의 `DATABASE_URL`을 예시 파일의 Docker용 URL로 맞춘 뒤:

```bash
npm run db:push
npm run db:seed
npm run dev
```

## 문제 해결

- **Build failed / DATABASE_URL**: Vercel 프로젝트 Settings → Environment Variables에 `DATABASE_URL`이 Production·Preview 모두에 있는지 확인
- **한국 리전**: `vercel.json`에 `"regions": ["icn1"]` 로 서울 근처 엣지를 쓰도록 설정해 두었습니다 (변경 가능)
