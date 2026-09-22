# 리뷰 페이지 운영 가이드

조직력 강화 행사용 리뷰 페이지. **설문 CSV만 있으면 배포까지 5분**이 되도록 미리 만들어 둔 것이다.
지금 상태로도 리허설 더미 25건이 들어간 채 그대로 돈다.

- 배포 주소 — `https://hyunsea.github.io/DinningEvent/y2026-review-a7f3k2/`
- 설문 폼 — https://forms.gle/a1G2pVYz3TBufzo37
- 계획서 — [조직력 강화 행사 설문·리뷰 페이지 개발계획서](https://claude.ai/code/artifact/66f623e0-74d2-42eb-9eee-a55229908885)

---

## 당일 절차 (식사 중 40~60분 구간)

새로 만드는 것은 없다. 데이터를 갈아끼우고 주제만 채운다.

### 1. 응답 CSV 내려받기

구글 폼 → 응답 탭 → 스프레드시트 → `파일 > 다운로드 > CSV`.
받은 파일을 예를 들어 `~/Downloads/responses.csv` 로 둔다.
**파일명에 `sample`, `dummy`, `test` 를 넣지 말 것** — 페이지 상단에 리허설 경고 띠가 뜬다.

### 2. 변환

```bash
node review-page/build.mjs ~/Downloads/responses.csv --date 2026-12-11
```

`docs/y2026-review-a7f3k2/data.js` 가 새로 써진다. 콘솔에 검토 리포트가 나온다.

### 3. 검토 리포트 확인 (이 단계를 건너뛰지 말 것)

리포트에서 볼 것은 세 가지다.

| 볼 것 | 왜 |
| --- | --- |
| `!!` 로 표시된 줄 | 감사인사에서 지목 대상을 못 찾은 응답. 이름 표기가 명단과 다르거나, 이름 없이 쓴 경우다 |
| "명단에 없는 이름" 경고 | 응답자가 자기 이름을 다르게 적었다. `roster.json` 의 `aliases` 에 추가하고 다시 돌린다 |
| 지목 목록 전체 | 25줄이라 눈으로 훑는 게 규칙을 정교하게 만드는 것보다 빠르고 정확하다 |

지목을 못 찾은 문장도 사라지지는 않는다. 섹션 3 아래쪽 「그리고 이런 인사도 있었습니다」에 실린다.

**사내 정보 확인도 여기서 한다.** 프로젝트명, 고객사명, 수율 수치가 응답에 섞였으면
`data.js` 를 직접 열어 해당 문장을 지우거나 고친다 (이 파일은 퍼블릭 레포로 나간다).

### 4. 주제 분류 채우기

`docs/y2026-review-a7f3k2/data.js` 와 `analysis.js` 를 Claude에게 주고 이렇게 요청한다.

> data.js 의 responses[].q1_proud 를 주제별 3~5개 묶음으로, q3_change 를 주제별로 묶고
> 빈도순으로 정렬해서 analysis.js 형식 그대로 채워줘. 묶음마다 대표 인용 1~2개를 고르고,
> 인용하지 않은 사람 이름은 전부 others 에 넣어서 아무도 빠지지 않게 해줘.
> 마지막에 전체를 관통하는 한 문장을 oneLiner 에 써줘.
> forDataKey 는 data.js 의 meta.dataKey 값으로 맞춰줘.

`forDataKey` 가 안 맞으면 페이지 상단에 경고 띠가 뜬다. 이전 분류를 그대로 배포하는 사고를 막는 장치다.

이 단계를 아예 건너뛰어도 페이지는 뜬다 — 주제 분류 없이 원문이 그대로 나온다.

### 5. 눈으로 확인

```bash
npm run review:serve
# http://localhost:4173/y2026-review-a7f3k2/
```

체크: 상단에 빨간 경고 띠가 없는지 · 비공개로 낸 사람 이름이 안 보이는지 · 섹션 5 한 문장이 채워졌는지.

### 6. 배포

```bash
git add docs/ && git commit -m "리뷰 페이지 데이터 반영" && git push
```

`docs/` 가 바뀌면 GitHub Actions가 Pages로 올린다. 1~2분 걸린다.
Actions 탭에서 초록불을 확인하고 폰으로 한 번 열어본다.

---

## 사전 준비 (한 번만)

### GitHub Pages 켜기 — 최초 1회, 필수

레포 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 바꾼다.
이걸 안 하면 워크플로가 돌아도 배포되지 않는다. **D-4에 미리 해두고 더미로 한 번 배포해 볼 것.**

### 명단 교체 — D-10

`review-page/roster.json` 을 실제 팀원 25명으로 바꾼다.
감사인사 본문에서 지목 대상을 찾는 기준이다.

- 3글자 이름은 뒤 2글자가 자동 별칭이 된다 (`김지훈` → `지훈`).
- 별칭이 다른 사람과 겹치면 자동 추출에서 빠지고 빌드가 경고한다. 그때 `aliases` 를 직접 준다.
- 버스 안내 멘트에 "이름은 명단 표기 그대로 적어주세요"를 넣으면 추출 정확도가 올라간다.

```json
{ "name": "김지훈", "aliases": ["지훈", "지훈님", "JH"] }
```

### 리허설 — D-3

```bash
npm run review:rehearsal   # 더미 CSV로 data.js 재생성
npm run review:serve       # 확인
```

**변환 → 검토 → 배포를 실제로 한 번 끝까지 해본다.** 당일에 처음 해보면 늦는다.
진행자 외 1명이 같은 절차를 재현할 수 있는지도 여기서 확인한다.

---

## 진행 중 조작

리뷰 세션은 큰 화면 1대 + 각자 폰이다. 큰 화면에서는 키보드로 넘긴다.

| 키 | 동작 |
| --- | --- |
| `↓` `→` `Space` `PageDown` | 다음 섹션 |
| `↑` `←` `PageUp` | 이전 섹션 |
| `Home` / `End` | 처음 / 마지막 |
| `F` | 전체화면 |

폰에서는 그냥 스크롤한다. 섹션 3은 길어서 스냅이 걸리지 않게 해뒀다.

---

## 파일 구조

```
review-page/
  README.md              이 문서
  build.mjs              CSV -> data.js 변환기 (의존성 없음)
  serve.mjs              로컬 확인용 정적 서버
  roster.json            참가자 명단. 지목 추출 기준
  sample-responses.csv   리허설용 더미 25건

docs/                          <- 이 폴더가 통째로 GitHub Pages로 나간다
  robots.txt
  y2026-review-a7f3k2/
    index.html           페이지 템플릿. 손댈 일 없음
    data.js              자동 생성. 직접 고치지 않는다 (사내 정보 삭제는 예외)
    analysis.js          주제 분류·한 문장. 사람/Claude가 채운다

.github/workflows/deploy-review-page.yml   docs/ push -> Pages 배포
```

`index.html` 은 외부 요청이 전혀 없다. 폰트도 CDN을 쓰지 않아서 행사장 네트워크가 막혀도 그대로 뜬다.

---

## 개인정보 처리

문항 2(감사인사)는 **작성자 기본 비공개**이고, 「네」를 고른 사람만 이름이 붙는다.
화면에서만 가리는 것으로는 부족하다 — `data.js` 를 열면 그대로 보이기 때문이다.
그래서 `build.mjs` 가 데이터를 아예 두 갈래로 쪼개서 내보낸다.

| 배열 | 담기는 것 |
| --- | --- |
| `responses[]` | 이름 + 문항1 + 문항3 (실명 공개가 전제인 항목) |
| `thanks[]` | 감사 문장 + 지목 대상 + 작성자(공개 동의한 경우만 `from`, 아니면 `null`) |

두 배열 사이에 공통 키가 없고, `thanks[]` 는 본문 해시 순으로 재정렬되며, 제출 시각은 내보내지 않는다.
공개에 동의하지 않은 사람의 이름은 배포 파일 어디에도 남지 않는다.

그래도 남는 것들:

- **원본 CSV와 폼 응답 시트**에는 이름이 그대로 남는다. 접근 권한을 진행자 1~2명으로 제한하고
  응답 시트 공유 링크를 만들지 말 것. 원본 CSV는 레포에 커밋하지 않는다 (`.gitignore` 처리됨).
- **퍼블릭 레포**라서 실명과 문항1·3 응답은 링크를 아는 사람에게 열린다.
  `<meta name="robots" content="noindex, nofollow">` 로 검색 노출은 막았고, 경로도 추측이 어렵게 잡았다.
  (`docs/robots.txt` 는 프로젝트 페이지에서는 사이트 루트가 아니라 크롤러가 읽지 않는다. 실제로 막는 건 meta 태그다.)
- 더 조여야 하면 이름을 이니셜로 치환하는 선택지가 있지만, 실명 공개를 택한 취지와는 어긋난다.

---

## 문제 해결

**`CSV에서 필수 컬럼을 찾지 못했습니다`**
폼 문구를 바꿔서 키워드가 안 맞는 경우다. 에러 메시지에 CSV 헤더가 전부 찍히니
`build.mjs` 상단 `COLUMN_RULES` 의 키워드를 고친다.

**지목을 하나도 못 찾는다**
`roster.json` 이 더미 명단 그대로일 가능성이 높다. 실제 명단으로 교체했는지 확인한다.

**페이지에 빨간 띠가 떠 있다**
(1) CSV 파일명에 `sample`/`dummy`/`test` 가 들어갔거나, (2) `analysis.js` 의 `forDataKey` 가
현재 `data.js` 의 `meta.dataKey` 와 다르다. 둘 다 띠에 어느 쪽인지 적혀 있다.

**푸시했는데 페이지가 안 바뀐다**
Settings → Pages → Source 가 `GitHub Actions` 인지 확인한다. 그 다음 Actions 탭에서 실행 로그를 본다.

**주제 분류를 처음부터 다시 하고 싶다**
```bash
node review-page/build.mjs <csv> --reset-analysis
```
`analysis.js` 가 빈 뼈대로 덮어써진다.
