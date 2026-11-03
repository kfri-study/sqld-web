"""Build the public study site from independently authored Markdown."""
from pathlib import Path
import sys, re, json, html

ROOT = Path(__file__).resolve().parent
try:
    import markdown2
except ModuleNotFoundError:
    # Use the optional local cache during development; fresh checkouts install
    # requirements.txt and never depend on this ignored directory.
    sys.path.insert(0, str(ROOT.parent / 'tmp' / 'python-packages'))
    import markdown2

DIST = ROOT / 'dist'
DIST.mkdir(exist_ok=True)
(DIST / 'downloads').mkdir(exist_ok=True)

def render(text):
    text = re.sub(r'\[([^\]]+)\]\(<C:/[^>]+>\)', r'\1（첨부 자료）', text)
    result = str(markdown2.markdown(text, extras=['tables', 'fenced-code-blocks', 'break-on-newline']))
    result = re.sub(r'<a href="(https?[^\"]+)"', r'<a target="_blank" rel="noopener noreferrer" href="\1"', result)
    return result

courses = []
for n, name in [
    (1, '데이터 모델링의 이해'),
    (2, 'SQL 기본 및 활용')
]:
    path = next((ROOT.parent / 'public-materials').glob(f'SQLD_{n}과목_*.md'))
    source = path.read_text(encoding='utf-8')
    parts = re.split(r'^## (.+)$', source, flags=re.M)
    sections, extras = [], []
    questions, answers = [], []
    for i in range(1, len(parts), 2):
        title, body = parts[i].strip(), parts[i + 1].strip()
        match = re.match(r'^(\d+) (.*)', title)
        if match:
            summary = re.search(r'\*\*핵심 한 줄:\*\* (.*)', body)
            plain = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', body)
            plain = re.sub(r'[#*`|>]', ' ', plain)
            sections.append({'id': int(match[1]), 'title': match[2],
                'summary': summary[1] if summary else '', 'html': render(body),
                'search': re.sub(r'\s+', ' ', plain), 'sourceChars': len(body)})
        elif title == '확인문제':
            questions = re.findall(r'^\d+\. (.+)$', body, flags=re.M)
        elif title == '확인문제 해설':
            answers = re.findall(r'^\d+\. (.+)$', body, flags=re.M)
        else:
            extras.append({'title': title, 'html': render(body)})
    assert len(questions) == len(answers) == (12 if n == 1 else 22)
    assert len(sections) == (10 if n == 1 else 18)
    downloadable = re.sub(r'\[([^\]]+)\]\(<C:/[^>]+>\)', r'\1（첨부 자료）', source)
    filename = f'sqld-course-{n}.md'
    (DIST / 'downloads' / filename).write_text(downloadable, encoding='utf-8')
    courses.append({'id': n, 'title': name,
        'intro': render(parts[0].split('\n', 1)[1]),
        'sections': sections, 'extras': extras, 'download': f'downloads/{filename}',
        'questions': [{'id': i+1, 'question': render(q), 'answer': render(a)}
                      for i, (q, a) in enumerate(zip(questions, answers))]})

(DIST / 'content.js').write_text('window.STUDY_CONTENT = ' + json.dumps(courses, ensure_ascii=False) + ';\n', encoding='utf-8')

PAPER, INK, MUTED, ACCENT = '#f4f7fc', '#172b4a', '#536580', '#315f9e'
FONTS = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&family=Noto+Sans+KR:wght@400;500;600;700&family=Noto+Serif+KR:wght@400&display=swap'

def node(x, y, w, h, title, tag, lines, focal=False):
    stroke = ACCENT if focal else MUTED
    fill = '#e5eefc' if focal else '#ffffff'
    return f'''<g><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{fill}" stroke="{stroke}"/>
    <text x="{x+20}" y="{y+24}" class="tag">{html.escape(tag)}</text>
    <text x="{x+20}" y="{y+52}" class="name">{html.escape(title)}</text>''' + ''.join(
        f'<text x="{x+20}" y="{y+80+i*24}" class="field">{html.escape(t)}</text>' for i,t in enumerate(lines)) + '</g>'

diagrams = []
# Entity-level model with explicit min/max participation labels.
slug='student-model'
body = '<path d="M280 280 H368 M592 280 H680" class="edge"/>'
body += '<text x="296" y="264" class="label">1</text><text x="336" y="264" class="label">0..N</text><text x="608" y="264" class="label">0..N</text><text x="652" y="264" class="label">1</text>'
body += node(56,184,224,208,'학생','ENTITY',['# 학번','학생명'])
body += node(368,184,224,208,'수강','ENTITY',['# 학번 + 과목코드','학번 → 학생','과목코드 → 과목'],True)
body += node(680,184,224,208,'과목','ENTITY',['# 과목코드','과목명'])
body += '<text x="56" y="104" class="name">학생과 과목의 M:N 관계를 수강으로 연결합니다.</text>'
diagrams.append((slug,'학생과 과목을 연결하는 수강','학생과 과목의 다대다 관계를 수강 엔터티로 풀며 각 수강은 학생 한 명과 과목 하나에 연결된다.',body,'# 식별자 · → 참조 대상 · 0..N은 참여하지 않을 수도 있음을 뜻합니다.'))

# Decomposition: one original relation, three output relations, no invented dependency.
body = '<path d="M424 240 V288 H168 V344 M480 240 V344 M536 240 V288 H792 V344" class="edge"/>'
body += node(360,56,240,184,'분해 전 수강','BEFORE',['학번 · 과목코드 · 교수','점수 · 학점'],True)
body += node(56,344,224,152,'과목','2NF',['# 과목코드','교수'])
body += node(368,344,224,152,'수강','RESULT',['# 학번 + 과목코드','점수'])
body += node(680,344,224,152,'학점기준','3NF',['# 점수','학점'])
diagrams.append(('normalization','정규화로 정보를 나누기','과목코드가 교수를 결정하고 점수가 학점을 결정한다는 가정에서 수강을 세 관계로 분해한다.',body,'가정: 과목코드 → 교수, 점수 → 학점. 연결할 결정자는 수강에도 남깁니다.'))

body='<path d="M288 168 H368 M592 168 H672 M784 216 V344 M672 392 H592 M368 392 H288" class="edge arrow"/>'
for x,y,title,tag,sub in [
 (64,120,'FROM','01',['어디에서 가져올까?']),
 (368,120,'WHERE','02',['어떤 행을 남길까?']),
 (672,120,'GROUP BY','03',['어떤 기준으로 묶을까?']),
 (672,344,'HAVING','04',['어떤 그룹을 남길까?']),
 (368,344,'SELECT','05',['어떤 열을 보여줄까?']),
 (64,344,'ORDER BY','06',['어떤 순서로 보여줄까?'])]:
    body+=node(x,y,224,96,title,tag,[],title=='WHERE')
    body+=f'<text x="{x}" y="{y+124}" class="label">{sub[0]}</text>'
diagrams.append(('sql-order','SQL의 논리적 해석 순서','FROM에서 시작해 행을 고르고 그룹을 만든 뒤 선택한 열을 정렬하는 SQL의 논리적 해석 순서다.',body,'논리적 해석 순서입니다. DBMS의 물리 실행 계획과는 구분합니다.'))

diagram_dir = DIST / 'diagrams'
diagram_dir.mkdir(exist_ok=True)
inline_diagrams = {}
for slug,title,description,body,legend in diagrams:
    for variant in ['', '-dark', '-full']:
        ident=slug+variant
        paper,ink,muted,accent=(PAPER,INK,MUTED,ACCENT) if variant!='-dark' else ('#172b4a','#f4f7fc','#bfd0e7','#93baf2')
        b=body
        if variant=='-dark':
            b=b.replace('#ffffff','#203b60').replace('#e5eefc','#294b77').replace(ACCENT,accent).replace(MUTED,muted)
        doc=f'''<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><link href="{FONTS}" rel="stylesheet"><style>
        *{{box-sizing:border-box}}body{{margin:0;background:{paper};color:{ink};font-family:'Geist','Noto Sans KR',sans-serif;padding:28px}}main{{max-width:1100px;margin:auto;min-width:0}}h1{{font:400 28px 'Instrument Serif','Noto Serif KR',serif;margin:8px 0 16px}}.eyebrow{{font:500 10px 'Geist Mono',monospace;color:{muted};letter-spacing:.14em}}.diagram-container{{width:100%;overflow-x:auto}}svg{{width:100%;min-width:960px;display:block}}.edge{{fill:none;stroke:{muted};stroke-width:1.2}}.arrow{{marker-end:url(#{ident}-arrow)}}.name{{font:600 14px 'Geist','Noto Sans KR',sans-serif;fill:{ink}}}.field,.label{{font:500 12px 'Geist','Noto Sans KR',sans-serif;fill:{muted}}}.tag{{font:500 9px 'Geist Mono',monospace;fill:{muted};letter-spacing:.08em}}.editorial{{font-size:15px;line-height:1.8;color:{muted};max-width:680px}}@media print{{.diagram-container{{overflow-x:visible}}svg{{min-width:0}}}}
        </style></head><body><main><p class="eyebrow">SQLD · DIAGRAM DESIGN</p><h1>{title}</h1>'''
        if variant=='-full': doc+=f'<p class="editorial">{description}</p>'
        doc+=f'''<div class="diagram-container"><svg viewBox="0 0 960 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="{ident}-title {ident}-desc"><title id="{ident}-title">{title}</title><desc id="{ident}-desc">{description}</desc><defs><marker id="{ident}-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="{muted}"/></marker></defs><rect width="960" height="600" fill="{paper}"/>{b}<line x1="56" y1="536" x2="904" y2="536" stroke="{muted}" stroke-opacity=".3"/><text x="56" y="568" class="label">{html.escape(legend)}</text></svg></div></main></body></html>'''
        (diagram_dir/(ident+'.html')).write_text(doc,encoding='utf-8')
        if not variant:
            inline_diagrams[slug] = re.search(r'<svg\b.*?</svg>',doc,re.S)[0]

with (DIST/'content.js').open('a',encoding='utf-8') as f:
    f.write('window.STUDY_DIAGRAMS = '+json.dumps(inline_diagrams,ensure_ascii=False)+';\n')

print(f'Built {sum(len(c["sections"]) for c in courses)} complete lessons, {sum(len(c["questions"]) for c in courses)} questions, 3 diagrams in 3 variants.')
