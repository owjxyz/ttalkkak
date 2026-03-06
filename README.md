# ttalkkak

간단한 타자 연습 웹앱 — React + Vite 기반의 클라이언트 사이드 프로젝트입니다.

## 주요 기능

- 문장(문구) 기반 타자 연습: `public/phrase.json`에 있는 문구를 무작위로 제시합니다.
- 실시간 성능 지표: 현재 CPM, Best CPM(로컬 저장), 정확도(Accuracy)를 표시합니다.
- 글자 단위 오타 검사: 한글 자모 분해(Hangul 분해)를 이용해 입력 중 오타를 실시간 판별합니다.
- 폰트 선택: 다수의 한글 폰트 옵션을 지원하고 로컬 스토리지에 선택을 저장합니다.
- 테마 선택: 다크/라이트/터미널 등 테마 선택과 메타 태그(`theme-color`) 동적 변경.
- 이전/다음 문장 탐색: PageUp/PageDown 및 UI 제어로 문장 전환 가능.
- Best CPM 우클릭 컨텍스트 메뉴로 초기화 가능.

## 기술 스택

- 프레임워크: React
- 번들러/개발서버: Vite
- 한글 처리: `hangul-js`
- 정적 배포: `gh-pages` (배포 스크립트 포함)

## 설치 및 실행

로컬에서 개발 서버를 실행하려면 Node.js가 설치되어 있어야 합니다.

1. 의존성 설치

```
pnpm install
```

2. 개발 서버 시작

```
pnpm dev
```

3. 빌드

```
pnpm build
```

4. 로컬에서 빌드 결과 미리보기

```
pnpm preview
```

5. 배포 (gh-pages 사용)

```
pnpm run deploy
```

(*참고: `package.json`의 `scripts` 항목을 기반으로 작성되어 있습니다.)

## 프로젝트 구조 (주요 파일)

- `index.html` — 앱 진입 HTML
- `src/main.jsx` — React 진입점
- `src/App.jsx` — 핵심 UI와 로직(문구 로드, CPM/정확도 계산, 설정 등)
- `src/App.css`, `src/index.css` — 스타일
- `public/phrase.json` — 타자 연습에 사용되는 문구 목록
- `public/manifest.json` — 웹 앱 매니페스트

## 동작 요약

앱은 `public/phrase.json`에서 문구 목록을 불러와 무작위로 현재 문장과 다음 문장을 설정합니다. 사용자가 입력을 시작하면 자모 단위로 입력을 분해해 현재 문장과 비교하여 정확도를 계산하고, 입력 속도는 CPM(Characters Per Minute)으로 표시됩니다. 완벽한 정확도로 문장을 완료하면 Best CPM이 갱신되어 로컬 스토리지에 저장됩니다.

## ETC

- 입력 검사는 `hangul-js`로 한글을 분해하여 자모 단위 일치 여부를 판별합니다.
- 폰트/테마 선택은 `localStorage`에 저장되어 새로고침 후에도 유지됩니다.
