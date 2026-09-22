#!/usr/bin/env node
/**
 * 설문 CSV -> 리뷰 페이지 데이터(data.js) 변환기.
 *
 *   node review-page/build.mjs <responses.csv> [옵션]
 *
 * 의존성 없음. Node 18+ 에서 그대로 돈다.
 *
 * 하는 일
 *   1. 구글 폼 CSV를 읽는다 (따옴표/줄바꿈 포함 필드 지원).
 *   2. 명단(roster.json)을 기준으로 감사인사 본문에서 지목 대상을 뽑는다.
 *   3. 공개 페이지에 올려도 되는 형태로 쪼개서 data.js 를 쓴다.
 *   4. analysis.js 가 없으면 뼈대를 만들어 둔다 (있으면 절대 건드리지 않는다).
 *   5. 사람이 눈으로 확인할 검토 리포트를 콘솔에 찍는다.
 *
 * 개인정보 처리 (중요)
 *   퍼블릭 레포에 올라가는 파일이므로, "작성자 이름 + 감사 문장"의 연결을
 *   화면에서만 숨기는 것으로는 부족하다 (data.js 를 열면 그대로 보인다).
 *   그래서 출력 데이터를 두 갈래로 나눈다.
 *     - responses[] : 이름 + 문항1 + 문항3   (실명 공개가 전제인 항목)
 *     - thanks[]    : 감사 문장 + 지목 대상 + 작성자(공개 동의한 경우만)
 *   두 배열 사이에 공통 키를 두지 않고, thanks[] 는 본문 해시 순으로 재정렬해
 *   제출 순서로도 역추적되지 않게 한다. 제출 시각은 아예 내보내지 않는다.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

const DEFAULTS = {
  roster: path.join(HERE, 'roster.json'),
  out: path.join(ROOT, 'docs', 'y2026-review-a7f3k2', 'data.js'),
  analysis: path.join(ROOT, 'docs', 'y2026-review-a7f3k2', 'analysis.js'),
};

/* ── 컬럼 인식 규칙 ──────────────────────────────────────────────────────
   구글 폼은 헤더에 질문 문구를 그대로 쓴다. 문구를 조금 고쳐도 깨지지
   않도록 키워드로 찾는다. 후보를 순서대로 훑어 첫 번째로 맞는 헤더를 쓴다. */
const COLUMN_RULES = [
  { key: 'submitted_at', required: false, any: ['타임스탬프', 'timestamp'] },
  { key: 'name',         required: true,  any: ['이름'] },
  { key: 'q1_proud',     required: true,  any: ['자랑', '잘했'] },
  { key: 'q2_thanks',    required: true,  any: ['감사'] },
  { key: 'q2_reveal',    required: false, any: ['공개'] },
  { key: 'q3_change',    required: true,  any: ['바꿨으면', '바꾸고', '바뀌었으면'] },
];

const REVEAL_YES = ['네', '예', 'yes', 'y', '공개', 'true', 'o'];

/* ── CSV 파서 (RFC 4180) ─────────────────────────────────────────────── */
function parseCsv(text) {
  const src = text.replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 1; }
        else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\r') continue;
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function mapColumns(header) {
  const norm = header.map((h) => h.toLowerCase().replace(/\s+/g, ''));
  const found = {};
  const missing = [];

  for (const rule of COLUMN_RULES) {
    const idx = norm.findIndex((h) => rule.any.some((kw) => h.includes(kw.toLowerCase())));
    if (idx >= 0) found[rule.key] = idx;
    else if (rule.required) missing.push(rule);
  }

  if (missing.length) {
    const wanted = missing.map((m) => `${m.key} (키워드: ${m.any.join(', ')})`).join('\n    - ');
    throw new Error(
      `CSV에서 필수 컬럼을 찾지 못했습니다.\n    - ${wanted}\n\n  CSV 헤더:\n    ${header.map((h, i) => `[${i}] ${h}`).join('\n    ')}\n\n  폼 문구를 바꿨다면 review-page/build.mjs 의 COLUMN_RULES 를 고치세요.`,
    );
  }
  return found;
}

/* ── 명단 / 지목 대상 추출 ───────────────────────────────────────────── */
function loadRoster(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const list = Array.isArray(raw) ? raw : raw.members;
  if (!Array.isArray(list) || !list.length) {
    throw new Error(`명단이 비어 있습니다: ${file}`);
  }
  return list.map((m) => (typeof m === 'string' ? { name: m } : m))
    .map((m) => ({ name: String(m.name).trim(), aliases: (m.aliases || []).map(String) }));
}

/**
 * 이름 -> 검색어 목록. 3글자 이름은 뒤 2글자를 자동 별칭으로 붙인다.
 * 별칭이 다른 사람과 겹치면 모호하므로 버리고 경고한다.
 */
function buildMatchers(roster) {
  const claims = new Map(); // 검색어 -> [이름...]
  const claim = (term, owner) => {
    if (!term) return;
    if (!claims.has(term)) claims.set(term, []);
    if (!claims.get(term).includes(owner)) claims.get(term).push(owner);
  };

  for (const m of roster) {
    claim(m.name, m.name);
    for (const a of m.aliases) claim(a.trim(), m.name);
    if (!m.aliases.length && m.name.length === 3) claim(m.name.slice(1), m.name);
  }

  const matchers = [];
  const ambiguous = [];
  for (const [term, owners] of claims) {
    if (owners.length > 1) { ambiguous.push({ term, owners }); continue; }
    matchers.push({ term, owner: owners[0] });
  }
  // 긴 검색어를 먼저 써야 "김지훈"이 "지훈"에 먹히지 않는다.
  matchers.sort((a, b) => b.term.length - a.term.length);
  return { matchers, ambiguous };
}

function extractTargets(text, matchers) {
  if (!text) return [];
  const masked = text.split('');
  const hits = [];
  for (const { term, owner } of matchers) {
    let from = 0;
    for (;;) {
      const at = masked.join('').indexOf(term, from);
      if (at < 0) break;
      const free = masked.slice(at, at + term.length).every((c) => c !== '\u0000');
      if (free) {
        for (let i = at; i < at + term.length; i += 1) masked[i] = '\u0000';
        if (!hits.includes(owner)) hits.push(owner);
      }
      from = at + term.length;
    }
  }
  return hits;
}

/* ── 유틸 ────────────────────────────────────────────────────────────── */
const clean = (s) => String(s ?? '').replace(/\r\n/g, '\n').trim();
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');
const truthy = (v) => REVEAL_YES.includes(clean(v).toLowerCase());

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const has = (flag) => process.argv.includes(flag);

/* ── 본체 ────────────────────────────────────────────────────────────── */
function main() {
  const csvPath = process.argv[2];
  if (!csvPath || csvPath.startsWith('--')) {
    console.error(`사용법: node review-page/build.mjs <responses.csv> [옵션]

  --roster <파일>    명단 JSON            (기본: review-page/roster.json)
  --out <파일>       data.js 출력 경로    (기본: docs/y2026-review-a7f3k2/data.js)
  --title <문구>     페이지 제목
  --subtitle <문구>  부제
  --date <YYYY-MM-DD> 행사일
  --members <숫자>   전체 인원            (기본: 명단 인원 수)
  --sample           리허설 데이터 표시 (페이지 상단에 경고 띠)
  --reset-analysis   analysis.js 를 새 뼈대로 덮어쓴다 (기존 분석 내용 삭제)
  --dry-run          파일을 쓰지 않고 검토 리포트만 본다`);
    process.exit(1);
  }

  const rosterPath = arg('--roster', DEFAULTS.roster);
  const outPath = arg('--out', DEFAULTS.out);
  const analysisPath = arg('--analysis', path.join(path.dirname(outPath), 'analysis.js'));

  const roster = loadRoster(rosterPath);
  const { matchers, ambiguous } = buildMatchers(roster);
  const rosterNames = roster.map((m) => m.name);

  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  if (rows.length < 2) throw new Error('CSV에 응답 행이 없습니다.');
  const cols = mapColumns(rows[0]);
  const body = rows.slice(1);

  const responses = [];
  const thanks = [];
  const report = [];
  const warnings = [];

  body.forEach((row, n) => {
    const at = (key) => (cols[key] === undefined ? '' : clean(row[cols[key]]));
    const name = at('name');
    const q1 = at('q1_proud');
    const q2 = at('q2_thanks');
    const q3 = at('q3_change');
    const reveal = truthy(at('q2_reveal'));

    if (!name) { warnings.push(`${n + 2}행: 이름이 비어 있어 건너뜁니다.`); return; }
    if (!rosterNames.includes(name)) warnings.push(`${n + 2}행: "${name}" 은 명단에 없는 이름입니다. 표기를 확인하세요.`);

    if (q1 || q3) responses.push({ name, q1_proud: q1, q3_change: q3 });

    let to = [];
    if (q2) {
      to = extractTargets(q2, matchers).filter((t) => t !== name);
      thanks.push({ from: reveal ? name : null, to, text: q2 });
      if (!to.length) warnings.push(`${n + 2}행 (${name}): 감사인사에서 지목 대상을 찾지 못했습니다. 수동 확인 필요.`);
    }
    report.push({ row: n + 2, name, to, reveal, hasQ1: Boolean(q1), hasQ3: Boolean(q3), hasQ2: Boolean(q2) });
  });

  // 제출 순서가 남지 않도록 재정렬한다.
  responses.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  thanks.sort((a, b) => hash(a.text).localeCompare(hash(b.text)));

  const members = Number(arg('--members', rosterNames.length));
  // 데이터 지문. analysis.js 가 어느 데이터를 보고 쓴 것인지 대조하는 데 쓴다.
  const dataKey = hash(JSON.stringify({ responses, thanks })).slice(0, 10);
  const meta = {
    dataKey,
    title: arg('--title', '수율AI PJT 3분기 GWP'),
    subtitle: arg('--subtitle', '올해 우리가 만든 장면들'),
    eventDate: arg('--date', new Date().toISOString().slice(0, 10)),
    totalMembers: members,
    respondents: new Set(report.map((r) => r.name)).size,
    generatedAt: new Date().toISOString(),
    // 파일명에 sample/dummy 가 있으면 페이지 상단에 빨간 리허설 띠가 뜬다.
    // 실제 응답 CSV는 그냥 다른 이름으로 저장하면 된다.
    sample: has('--sample') || /sample|dummy|test/i.test(path.basename(csvPath)),
  };

  /* ── 검토 리포트 ── */
  console.log('\n─────────── 검토 리포트 ───────────');
  console.log(`응답 ${report.length}건 / 명단 ${members}명`);
  console.log(`문항1 응답 ${report.filter((r) => r.hasQ1).length} · 문항2 ${report.filter((r) => r.hasQ2).length} · 문항3 ${report.filter((r) => r.hasQ3).length}`);
  console.log(`문항2 작성자 공개 동의 ${report.filter((r) => r.reveal && r.hasQ2).length}건 / 비공개 ${report.filter((r) => !r.reveal && r.hasQ2).length}건\n`);

  console.log('감사인사 지목 추출 결과 — 이 표를 눈으로 한 번 훑으세요:');
  for (const r of report.filter((x) => x.hasQ2)) {
    const mark = r.to.length ? '  ' : '!!';
    console.log(`${mark} ${String(r.row).padStart(3)} ${r.name.padEnd(6)} -> ${r.to.join(', ') || '(못 찾음)'}`);
  }

  const counts = new Map();
  for (const t of thanks) for (const to of t.to) counts.set(to, (counts.get(to) || 0) + 1);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`\n지목받은 사람 ${ranked.length}명 / 아무도 지목하지 않은 사람 ${members - ranked.length}명`);
  if (ranked.length) console.log(`상위: ${ranked.slice(0, 5).map(([k, v]) => `${k}(${v})`).join('  ')}`);

  if (ambiguous.length) {
    console.log('\n[명단 경고] 아래 별칭은 두 사람 이상과 겹쳐 자동 추출에서 제외했습니다:');
    for (const a of ambiguous) console.log(`  - "${a.term}" <- ${a.owners.join(', ')}`);
    console.log('  roster.json 의 aliases 로 구분되는 표기를 직접 지정하세요.');
  }
  if (warnings.length) {
    console.log('\n[확인 필요]');
    for (const w of warnings) console.log(`  - ${w}`);
  }

  if (has('--dry-run')) {
    console.log('\n--dry-run: 파일을 쓰지 않았습니다.\n');
    return;
  }

  /* ── 출력 ── */
  const banner = `// 자동 생성 파일 — 직접 고치지 말고 review-page/build.mjs 를 다시 돌리세요.
// 생성: ${meta.generatedAt}
// 주의: 퍼블릭 레포에 올라가는 파일입니다. 사내 정보가 섞이지 않았는지 배포 전에 확인하세요.
`;
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${banner}window.REVIEW_DATA = ${JSON.stringify({ meta, responses, thanks }, null, 2)};\n`, 'utf8');
  console.log(`\n기록: ${path.relative(ROOT, outPath)}  (응답 ${responses.length} · 감사 문장 ${thanks.length})`);

  if (!fs.existsSync(analysisPath) || has('--reset-analysis')) {
    fs.writeFileSync(analysisPath, scaffoldAnalysis(responses, ranked, dataKey), 'utf8');
    console.log(`기록: ${path.relative(ROOT, analysisPath)}  (뼈대 — Claude 분석 결과로 채우세요)`);
  } else {
    const prev = fs.readFileSync(analysisPath, 'utf8');
    const stale = !prev.includes(dataKey);
    console.log(`유지: ${path.relative(ROOT, analysisPath)}  (덮어쓰려면 --reset-analysis)`);
    if (stale) {
      console.log(`
  !! analysis.js 가 이전 데이터를 기준으로 쓰여 있습니다.
     주제 분류를 새 응답으로 다시 채운 뒤, 파일의 forDataKey 를 '${dataKey}' 로 바꾸세요.
     (그대로 두면 페이지 상단에 경고 띠가 뜹니다.)`);
    }
  }
  console.log('\n다음: npm run review:serve 로 눈으로 확인 -> git push\n');
}

function scaffoldAnalysis(responses, ranked, dataKey) {
  const names = responses.map((r) => r.name);
  return `// 사람이(또는 Claude가) 채우는 파일. build.mjs 는 이 파일이 있으면 덮어쓰지 않는다.
// 비어 있어도 페이지는 뜬다 — 주제 분류 없이 원문이 그대로 나온다.
//
// 채우는 법: 이 파일과 data.js 를 Claude에게 주고
//   "data.js 의 q1_proud 를 주제별 3~5개 묶음으로, q3_change 를 빈도순 묶음으로
//    분류해서 analysis.js 형식으로 채워줘" 라고 요청.

window.REVIEW_ANALYSIS = {
  // 이 분석이 어느 data.js 를 보고 쓴 것인지 표시한다. data.js 를 새로 만들면
  // 빌드가 새 키를 알려준다. 분류를 다시 채운 뒤 이 값을 바꾸면 경고가 사라진다.
  forDataKey: '${dataKey}',

  // 섹션 2 — 올해의 장면. 주제 묶음 3~5개.
  //   quotes: 묶음을 대표하는 인용 1~3개.
  //   others: 같은 묶음에 속하지만 인용하지 않은 사람들. 아무도 빠지지 않게 하는 장치다.
  proudGroups: [
    // { title: "현장에 닿은 것들", summary: "모델을 라인에 올리고 신뢰를 얻은 이야기.",
    //   quotes: [{ name: "이준호", text: "..." }], others: ["김지훈", "배성호"] },
  ],

  // 섹션 4 — 바꾸고 싶은 것. count 내림차순으로 그린다.
  changeGroups: [
    // { title: "회의와 기록", count: 7, summary: "말로 끝나는 합의를 줄이자는 이야기.",
    //   quotes: [{ name: "박서연", text: "..." }] },
  ],

  // 섹션 5 — 내년 우리 팀 한 문장.
  oneLiner: '',
  oneLinerNote: '',
};

// 참고 — 이번 데이터에 들어온 이름 ${names.length}명: ${names.join(', ')}
// 참고 — 지목 상위: ${ranked.slice(0, 5).map(([k, v]) => `${k}(${v})`).join(', ') || '(없음)'}
`;
}

try {
  main();
} catch (err) {
  console.error(`\n[실패] ${err.message}\n`);
  process.exit(1);
}
