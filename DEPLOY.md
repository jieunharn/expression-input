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
3. **Environment Variables** (배포 전에 꼭 넣기)

   Import 화면을 조금 내리면 **Environment Variables** 블록이 있습니다. 여기서 **Key / Value** 를 한 줄씩 추가합니다. (이미 Deploy만 눌렀다면: 프로젝트 선택 → 상단 **Settings** → 왼쪽 **Environment Variables**)

   ### `DATABASE_URL` (필수)

   - **Key:** 정확히 `DATABASE_URL` (대문자, 밑줄 그대로). 다른 이름이면 Prisma가 DB를 못 찾습니다.
   - **Value:** Neon 대시보드에서 복사한 **전체 연결 문자열** 한 줄을 그대로 붙여 넣습니다.  
     예: `postgresql://neondb_owner:비밀번호@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require`
   - **주의:** 앞뒤에 따옴표(`"`)를 넣지 않습니다. Vercel이 문자열로 저장합니다.
   - **Environment:** 가능하면 **Production**, **Preview**, **Development** 모두 체크합니다. 그래야 메인 배포·미리보기 URL·로컬 `vercel dev` 모두 같은 DB 설정을 씁니다.
   - 이 값이 있어야 빌드 시 `prisma db push`가 Neon에 접속해 테이블을 만듭니다.

   ### `ANTHROPIC_API_KEY` (선택)

   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** [Anthropic Console](https://console.anthropic.com/) 에서 발급한 API 키 (`sk-ant-api03-...` 형태).
   - **넣는 경우:** 웹에서도 **표현 추가** 페이지의 **AI 자동 채우기**, **일괄 가져오기**가 동작합니다.
   - **안 넣는 경우:** 영문·한국어·예문을 전부 직접 입력하는 방식으로만 쓸 수 있습니다. (앱은 정상 동작합니다.)
   - 키는 비밀이므로 GitHub에는 절대 올리지 말고, **Vercel Environment Variables에만** 넣습니다.

4. 변수를 추가한 뒤 **Deploy** 를 누릅니다.

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
