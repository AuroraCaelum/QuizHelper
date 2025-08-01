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

4. **브라우저를 열고** [http://localhost:9090](http://localhost:9090) 에 접속하세요.

5. _**(옵션) QUIZ_OPER Wi-Fi에 연결하세요. [물리 버튼 사용 시]**_

6. _**(옵션) 컴퓨터 고정IP 변경** [물리 버튼 사용 시]:_

	a. `Windows`를 사용하는 경우

		제어판 > 네트워크 및 인터넷 > 네트워크 연결 > Wi-Fi > (우클릭 후) 속성 > 인터넷 프로토콜 버전 4(TCP/IPv4) 속성 > 다음으로 IP 주소 사용 클릭 후 아래와 같이 세팅:
		IP 주소: 192.168.100.101
		서브넷 마스크: 255.255.255.0
		기본 게이트웨이: 192.168.100.0

	b. `macOS`를 사용하는 경우

   		설정 > Wi-Fi > 연결된 와이파이 옆의 <세부사항...> 클릭 > TCP/IP > IPv4 구성 - 수동으로 설정 후 아래와 같이 세팅:
   		IP 주소: 192.168.100.101
		서브넷 마스크: 255.255.255.0
		라우터: 192.168.100.0

 	**중요: 게임 종료 이후, 이 설정을 다시 `자동으로 IP 주소 받기 (Windows)`, `DHCP 사용 (macOS)`으로 변경하셔야 정상적인 인터넷 사용이 가능합니다.**
   

## 점수 관리자
- `결승전 모드`, `예선전 모드` : 게임 화면에서 **`~`** 키를 눌러 점수 관리자 창을 열 수 있습니다. 게임 점수판 화면을 띄우고, 별도의 탭(혹은 창)에서 점수 관리자를 사용하세요.

- `예선전 모드` : 게임 설정 시 입력한 `고유 신호`에 해당하는 자판을 눌러 점수를 추가할 수 있습니다.
	- <신호 키> 입력 시 **+5**점, Shift + <신호 키> 입력 시 **-5**점이 반영됩니다.
	-  (점수 단위 변경은 [routes/game/preliminary/+page.svelte](https://github.com/AuroraCaelum/QuizHelper/blob/master/src/routes/game/preliminary/%2Bpage.svelte)의 `handleKeyDown()`을 확인하세요.)

- `점수 관리자` : 점수 관리자의 감/가산 단위를 수정하고자 하는 경우, [routes/score-management/+page.svelte](https://github.com/AuroraCaelum/QuizHelper/blob/master/src/routes/score-management/%2Bpage.svelte)의 `negativeScoreOption`, `scoreOptions`, `handleGameModeChange()`를 확인하세요.

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
