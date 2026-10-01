# ttalkkak SEO 운영

대표 URL: https://owjxyz.github.io/ttalkkak/

## 적용 내용

- HTML 제목과 화면 로고는 `ttalkkak`으로 유지한다.
- 검색 및 공유용 설명은 `index.html`의 description, Open Graph, Twitter 메타 태그에만 넣는다. 숨겨진 설명 본문을 만들지 않는다.
- canonical과 공유 URL은 대표 URL로 통일한다. canonical은 검색 엔진에 대표 URL을 알리는 신호이며 HTTP 리디렉션을 대신하지 않는다.
- `max-image-preview:large`는 검색결과에서 큰 이미지 미리보기를 허용한다. 표시를 보장하지 않는다.
- `public/sitemap.xml`은 검색 대상인 홈페이지 한 개만 포함한다. 실제 수정 시점이 관리되지 않는 `lastmod`는 넣지 않는다.
- robots.txt에서 JavaScript, CSS, 문장 데이터를 차단하지 않는다.

## GitHub Pages의 robots.txt

검색 로봇이 적용하는 파일은 **https://owjxyz.github.io/robots.txt**이다.
이 저장소의 `public/robots.txt`는 배포 후 `/ttalkkak/robots.txt`에 생성되므로 현재 호스트에서는 검색 로봇 규칙으로 사용되지 않는다. 호스트 루트에 배포할 규칙의 준비본이다.

2026-10-01에 확인한 루트 robots.txt는 다음 한 줄이며 수집 차단 규칙이 없다.

```text
Sitemap: https://owjxyz.github.io/sitemap.xml
```

루트 사이트 저장소 `/Users/lukeoh/Documents/Github/owjxyz.github.io`의 `robots.txt`에서 기존 사이트맵과 프로젝트 사이트맵을 함께 안내한다. 루트 사이트맵 자체를 수동으로 수정하지 않고 Jekyll의 기존 생성 방식을 유지한다.

```text
Sitemap: https://owjxyz.github.io/sitemap.xml
Sitemap: https://owjxyz.github.io/ttalkkak/sitemap.xml
```

루트 연결을 추가하기 전에도 프로젝트 사이트맵을 Search Console에 직접 제출할 수 있다. `/ttalkkak/robots.txt`를 만들었다는 이유로 루트 연결까지 완료되었다고 판단하면 안 된다.

## 배포 및 검증

```sh
pnpm test
pnpm lint
pnpm build
pnpm preview --host 127.0.0.1
```

빌드 결과의 `dist/index.html`에서 제목, 세 설명, canonical과 공유 URL을 확인한다. `dist/sitemap.xml`과 `dist/robots.txt`가 생성되어야 한다. 화면에 새 설명 문단이 없는지 확인한다.

배포 후 아래 주소가 정상 응답하는지 확인한다. 없는 XML/TXT 파일 대신 홈페이지 HTML이 반환되는 경우는 실패이다.

- https://owjxyz.github.io/ttalkkak/
- https://owjxyz.github.io/ttalkkak/sitemap.xml
- https://owjxyz.github.io/robots.txt

## Google Search Console

1. URL 접두어 속성 `https://owjxyz.github.io/ttalkkak/`을 등록한다.
2. 계정이 발급한 HTML 확인 파일을 `public/`에 추가하거나 HTML 확인 메타 태그를 `index.html`에 추가한 뒤 배포한다. 임의의 확인 값을 사용하지 않는다.
3. 소유 확인 후 `https://owjxyz.github.io/ttalkkak/sitemap.xml`을 제출한다.
4. 대표 URL을 실시간 검사해 수집 가능 여부와 렌더링 화면을 확인하고 색인 생성을 요청한다.
5. Google이 선택한 canonical과 색인 상태를 확인한다. 색인 이후 검색어별 노출, 클릭, 클릭률을 기록하고 수 주 뒤 비교한다.

## 네이버 서치어드바이저

네이버는 경로 단위가 아닌 호스트 단위 등록만 지원한다. `https://owjxyz.github.io`에서 소유를 확인해야 하므로 루트 사이트 관리가 필요하다. 이 프로젝트의 메타 태그만으로 루트 소유 확인이 완료되지는 않는다.

호스트 소유 확인 후 프로젝트 사이트맵 제출과 대표 URL 수집 요청을 진행하고, 웹페이지 최적화 검사 및 색인 현황을 확인한다.

## 남은 판단

검색 엔진은 description을 반드시 그대로 사용하지 않으며 검색어에 따라 연습 문장 등 다른 텍스트를 선택할 수 있다. URL 검사에서 앱의 콘텐츠가 렌더링되지 않을 때 현재 UI를 그대로 사전 렌더링하는 방법을 검토한다.

검색 도구 소유 확인, 사이트맵 제출, 색인 요청은 계정 인증 후 별도로 진행해야 한다. 파일 배포만으로 이 작업들이 완료되지는 않는다.

## 근거

- [Google 검색결과 설명](https://developers.google.com/search/docs/appearance/snippet)
- [Google 대표 URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google robots.txt 위치](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt)
- [Google 사이트맵](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [네이버 등록·소유 확인·사이트맵](https://searchadvisor.naver.com/guide/seo-basic-intro)
