# 수첩

연락처 수첩. **클라우드 운영은 Cloudflare Pages + Functions + D1**, 로컬/내부망은 `egov-suchup`(Spring Boot)을 사용합니다.

| 구분 | 경로 | 용도 |
|------|------|------|
| Cloudflare | 이 폴더 루트 | 인터넷 서비스, Git 자동 배포 |
| eGov Boot | `egov-suchup/` | 로컬/내부망 JAR 실행 |

기본 계정: `admin` / `changeme` (운영 환경에서 반드시 변경)

---

## Cloudflare Pages (권장 클라우드)

### 로컬 실행

```bash
npm install
npm run dev
```

- 주소: http://127.0.0.1:8788/login.html  
- 첫 실행 시 Functions의 `ensureSchema`가 테이블·시드 데이터를 만듭니다.

스키마/시드를 강제로 다시 넣을 때:

```bash
npm run db:schema:local
npm run db:seed:local
```

### 직접 배포

1. Cloudflare 계정에서 API Token 발급 (Workers/Pages/D1 Edit)
2. 로컬에서 로그인·DB 생성

```bash
npx wrangler login
npx wrangler d1 create suchup
```

3. 출력된 `database_id`를 [`wrangler.toml`](wrangler.toml)의 `database_id`에 넣기  
4. 원격 스키마 적용 후 Pages 배포

```bash
npx wrangler d1 execute suchup --remote --file=schema.sql
npx wrangler pages deploy . --project-name=suchup
```

5. Cloudflare 대시보드 → Pages 프로젝트 → Settings  
   - D1 binding 이름: `DB` (이미 wrangler에 있으면 확인)  
   - `SESSION_SECRET` 등 환경 변수 운영값으로 변경

### 자동 배포 (GitHub → Cloudflare)

코드만 고쳐서 `main`에 push하면 자동으로 배포됩니다.  
워크플로 파일은 이미 있습니다: [`.github/workflows/deploy-cloudflare.yml`](.github/workflows/deploy-cloudflare.yml)

#### 한 번만 설정

1. **GitHub 저장소 만들기**  
   - github.com → New repository (예: `suchup`)  
   - Private 권장

2. **Cloudflare API Token 만들기**  
   - https://dash.cloudflare.com/profile/api-tokens  
   - Create Token → **Edit Cloudflare Workers** 템플릿 사용  
   - Account / D1 / Pages 권한이 포함되는지 확인

3. **Account ID 확인**  
   - Cloudflare 대시보드 오른쪽 → Account ID 복사  
   - (이 프로젝트에서 확인된 예: Workers 로그 기준 Account 사용)

4. **GitHub Secrets 등록**  
   - 저장소 → Settings → Secrets and variables → Actions → New repository secret  
   - `CLOUDFLARE_API_TOKEN` = 발급한 토큰  
   - `CLOUDFLARE_ACCOUNT_ID` = Account ID

5. **코드를 GitHub에 올리기** (프로젝트 폴더에서)

```bat
git init
git add .
git commit -m "Initial suchup Cloudflare app"
git branch -M main
git remote add origin https://github.com/본인계정/suchup.git
git push -u origin main
```

이후부터는 파일 수정 후:

```bat
git add .
git commit -m "업데이트 내용"
git push
```

Actions 탭에서 **Deploy Cloudflare Pages**가 성공하면 `https://suchup.pages.dev`에 반영됩니다.

수동 실행: GitHub → Actions → Deploy Cloudflare Pages → Run workflow

#### Cloudflare 대시보드 Git 연동 (대안)

GitHub Actions 대신 대시보드에서 연결할 수도 있습니다.

1. Workers & Pages → `suchup` → Settings → Builds & deployments  
2. Connect to Git → 저장소 선택  
3. 이 경우 Actions 워크플로와 **둘 중 하나만** 쓰는 편이 안전합니다 (중복 배포 방지).

### 기능

- 로그인 세션(쿠키) + 수첩 검색/필터  
- 카드 클릭 시 세부(선임일·군별·계급 등) 슬라이드  
- 관리자 CRUD  
- 엑셀 양식 다운로드 / 업로드 (전화 번호면 수정, 없으면 추가, **순번 제외**)

엑셀 열: `소속 | 성명 | 직책 | 연락처 | 선임일 | 생년월일 | 군별 | 계급 | 임관/기수 | 임관구분 | 기수 | 주소 | 비고`

---

## 로컬 Boot (egov-suchup)

```bat
cd egov-suchup
시작.bat
```

- http://localhost:8080/login  
- 상세: [egov-suchup/README.md](egov-suchup/README.md)
