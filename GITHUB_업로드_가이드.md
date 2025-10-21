# GitHub 업로드 가이드

## 방법 1: GitHub Desktop 사용 (가장 쉬움, 추천) ⭐

### 1단계: GitHub Desktop 설치

1. https://desktop.github.com/ 방문
2. "Download for Windows" 클릭
3. 다운로드된 파일 실행 및 설치
4. GitHub 계정으로 로그인 (계정이 없다면 https://github.com 에서 가입)

### 2단계: 프로젝트를 GitHub에 올리기

1. GitHub Desktop 실행
2. **`File`** → **`Add Local Repository`** 클릭
3. **`Choose...`** 버튼 클릭 후 이 폴더 선택:
    ```
    C:\Users\alwaysdesign\Desktop\code\port1
    ```
4. "repository not found" 메시지가 나오면 **`create a repository`** 클릭
5. 다음 정보 입력:
    - Name: `port1` (또는 원하는 이름)
    - Description: "Multi-step form system with portfolio"
    - Git Ignore: None (이미 .gitignore가 있음)
    - License: None
6. **`Create Repository`** 클릭
7. 왼쪽 하단에 변경된 파일들이 표시됨
8. Summary에 "Initial commit" 입력
9. **`Commit to main`** 버튼 클릭
10. 상단의 **`Publish repository`** 클릭
11. Private/Public 선택:
    - ✅ **Private** - 나만 볼 수 있음 (추천)
    - ⬜ Public - 모두가 볼 수 있음
12. **`Publish Repository`** 클릭

### 3단계: GitHub에서 확인

1. https://github.com/YOUR_USERNAME/port1 방문
2. 코드가 업로드되었는지 확인

---

## 방법 2: Git 명령어 사용

### 1단계: Git 설치

1. https://git-scm.com/download/win 방문
2. 다운로드 및 설치 (기본 옵션으로 진행)
3. PowerShell 또는 터미널 재시작

### 2단계: Git 설정

```bash
# Git 사용자 이름 설정
git config --global user.name "Your Name"

# Git 이메일 설정 (GitHub 계정 이메일)
git config --global user.email "your.email@example.com"
```

### 3단계: GitHub에 리포지토리 생성

1. https://github.com 로그인
2. 오른쪽 상단 **`+`** → **`New repository`** 클릭
3. 정보 입력:
    - Repository name: `port1`
    - Private/Public 선택
    - **❌ Initialize 옵션 모두 체크 해제** (중요!)
4. **`Create repository`** 클릭
5. 생성된 리포지토리 URL 복사 (예: `https://github.com/username/port1.git`)

### 4단계: 코드 업로드

```bash
# 프로젝트 폴더로 이동
cd C:\Users\alwaysdesign\Desktop\code\port1

# Git 저장소 초기화
git init

# 현재 브랜치를 main으로 변경
git branch -M main

# 모든 파일 추가 (.gitignore에 따라 필터링됨)
git add .

# 커밋
git commit -m "Initial commit"

# GitHub 리포지토리 연결 (YOUR_USERNAME을 실제 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/port1.git

# GitHub에 푸시
git push -u origin main
```

---

## ⚠️ 주의사항

### GitHub에 올라가지 않는 파일들 (정상):

-   ✅ `node_modules/` - 너무 크고 불필요 (npm install로 설치 가능)
-   ✅ `.next/` - 빌드 파일 (자동 생성됨)
-   ✅ `prisma/dev.db` - 로컬 데이터베이스 (민감한 데이터)
-   ✅ `.env` 파일 - 환경 변수 (비밀 정보 포함)
-   ✅ `public/uploads/*` - 업로드된 이미지들

### 민감한 정보 확인

업로드 전에 다음 파일에 비밀번호나 API 키가 없는지 확인:

-   `.env` 파일 (이미 .gitignore에 포함됨)
-   소스 코드에 하드코딩된 비밀번호

---

## 다음 단계

GitHub 업로드가 완료되면:

1. ✅ **Vercel에서 GitHub 리포지토리 선택**
2. ✅ **환경 변수 설정**
3. ✅ **배포!**

자세한 내용은 `VERCEL_배포_가이드.md` 참고

---

## 트러블슈팅

### "Permission denied (publickey)" 오류

→ HTTPS URL을 사용하거나 SSH 키 설정 필요

### "Updates were rejected" 오류

→ `git pull origin main --allow-unrelated-histories` 실행 후 다시 push

### Git 명령어가 작동하지 않음

→ PowerShell 재시작 또는 GitHub Desktop 사용

---

## 유용한 Git 명령어

```bash
# 상태 확인
git status

# 변경사항 확인
git diff

# 커밋 히스토리
git log --oneline

# 파일 추가
git add 파일명

# 변경사항 푸시
git push
```

