# 구글 스프레드시트 연동 설정 가이드

## 1. 구글 클라우드 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" → "라이브러리"로 이동
4. "Google Sheets API" 검색 후 활성화

## 2. 서비스 계정 생성

1. "API 및 서비스" → "사용자 인증 정보"로 이동
2. "사용자 인증 정보 만들기" → "서비스 계정" 선택
3. 서비스 계정 이름 입력 (예: portfolio-sheets-service)
4. 역할: "편집자" 또는 "소유자" 선택
5. "완료" 클릭

## 3. 서비스 계정 키 생성

1. 생성된 서비스 계정 클릭
2. "키" 탭으로 이동
3. "키 추가" → "새 키 만들기" → "JSON" 선택
4. JSON 파일 다운로드 (안전한 곳에 보관)

## 4. 구글 스프레드시트 생성 및 공유

1. [Google Sheets](https://sheets.google.com/)에서 새 스프레드시트 생성
2. 스프레드시트 URL에서 ID 복사
    ```
    https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
    ```
3. "공유" 버튼 클릭
4. 서비스 계정 이메일 주소 추가 (JSON 파일의 client_email)
5. 권한: "편집자"로 설정

## 5. 환경변수 설정

`.env.local` 파일에 다음 내용 추가:

```env
# 구글 스프레드시트 설정
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your_spreadsheet_id_here
```

### 환경변수 값 찾기:

1. **GOOGLE_SERVICE_ACCOUNT_EMAIL**: JSON 파일의 `client_email` 값
2. **GOOGLE_PRIVATE_KEY**: JSON 파일의 `private_key` 값 (따옴표 포함)
3. **GOOGLE_SHEET_ID**: 스프레드시트 URL의 ID 부분

## 6. Vercel 배포 시 환경변수 설정

1. Vercel 대시보드에서 프로젝트 선택
2. "Settings" → "Environment Variables"
3. 위의 3개 환경변수 추가
4. 재배포

## 7. 테스트

1. 개발 서버 재시작: `npm run dev`
2. 포트폴리오 제출 테스트
3. 구글 스프레드시트에서 데이터 확인
4. 관리자 페이지에서 제출목록 확인

## 주의사항

-   JSON 키 파일은 절대 공개 저장소에 업로드하지 마세요
-   환경변수의 PRIVATE_KEY는 따옴표로 감싸주세요
-   서비스 계정에 스프레드시트 편집 권한이 있는지 확인하세요

## 스프레드시트 구조

자동으로 다음과 같은 헤더가 생성됩니다:

| 제출시간         | 포트폴리오 | 상호명 | 응답내용                     | IP주소      |
| ---------------- | ---------- | ------ | ---------------------------- | ----------- |
| 2024-01-01 10:30 | 독채형 A   | 온다   | 질문1: 답변1 \| 질문2: 답변2 | 192.168.1.1 |

## 문제 해결

### 403 오류 발생 시:

-   서비스 계정이 스프레드시트에 공유되었는지 확인
-   Google Sheets API가 활성화되었는지 확인

### 환경변수 오류 시:

-   `.env.local` 파일이 프로젝트 루트에 있는지 확인
-   환경변수 이름과 값이 정확한지 확인
-   개발 서버 재시작

이제 데이터베이스 문제 없이 구글 스프레드시트로 안전하게 제출 데이터를 관리할 수 있습니다! 🎉
