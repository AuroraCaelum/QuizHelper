# QuizHelper

성경침례교회 청년부 암송대회 지원 프로그램입니다.

## 시스템 요구사항

- Node.js version 18 or higher (설치 링크: [Node.js 공식 홈페이지](https://nodejs.org/ko/download))
- API Endpoint에 신호를 보낼 수 있는 물리 버튼
  > 중요사항: 노트북 혹은 데스크탑의 IP 주소가 `192.168.100.101`로 고정되어 있어야 물리 버튼의 신호를 받아올 수 있습니다.

## 세팅 방법

1. **레포지토리 클론하기**:

   ```bash
   git clone https://github.com/AuroraCaelum/QuizHelper.git
   cd QuizHelper
   ```

2. **의존성 설치하기**:

   ```bash
   npm install
   ```

3. **개발 서버 실행**:

   ```bash
   npm run dev
   ```

4. **브라우저를 열고** `http://localhost:9090` 에 접속하세요.

## 버튼 신호 엔드포인트

물리 버튼의 신호는 `localhost:9090`의 엔드포인트로 전달됩니다, (혹은, 현재 버튼의 기본 설정 상태인 `192.168.100.101:9090`로 전달됩니다). API는 다음과 같은 GET 요청을 받아서 처리할 수 있습니다.

```json
{
	"sig": "string"
}
```

`sig` 필드는 단일 캐릭터 신호 입력을 포함합니다. (A-J)

## 의존성

이 프로젝트는 [SvelteKit](https://kit.svelte.dev/) 로 개발되었으며, Node.js +18을 요구합니다.

포함된 애드온:

- [Svelte](https://svelte.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prettier](https://prettier.io/)
- [ESLint](https://eslint.org/)
