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
    guides = json.loads((ROOT.parent / 'public-materials/lesson-guides.json').read_text('utf-8'))[str(n)]
    assert len(sections) == len(guides)
    for section, guide in zip(sections, guides):
        section.update(guide)
        section['search'] += ' ' + ' '.join(' '.join(term) for term in guide['terms'])
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

from concept_diagrams import diagrams

diagram_dir = DIST / 'diagrams'
diagram_dir.mkdir(exist_ok=True)
inline_diagrams = {}
for slug,title,description,body,legend in diagrams:
    for variant in ['', '-dark', '-full']:
        ident=slug+variant
        paper,ink,muted,accent=(PAPER,INK,MUTED,ACCENT) if variant!='-dark' else ('#172b4a','#f4f7fc','#bfd0e7','#93baf2')
        b=body.replace('class="edge arrow"', f'class="edge arrow" marker-end="url(#{ident}-arrow)"')
        if variant=='-dark':
            b=b.replace('#ffffff','#203b60').replace('#e5eefc','#294b77').replace(ACCENT,accent).replace(MUTED,muted).replace(INK,ink)
        doc=f'''<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><link href="{FONTS}" rel="stylesheet"><style>
        *{{box-sizing:border-box}}body{{margin:0;background:{paper};color:{ink};font-family:'Geist','Noto Sans KR',sans-serif;padding:28px}}main{{max-width:1100px;margin:auto;min-width:0}}h1{{font:400 28px 'Instrument Serif','Noto Serif KR',serif;margin:8px 0 16px}}.eyebrow{{font:500 10px 'Geist Mono',monospace;color:{muted};letter-spacing:.14em}}.diagram-container{{width:100%;overflow-x:auto}}svg{{width:100%;min-width:960px;display:block}}.edge{{fill:none;stroke:{muted};stroke-width:1.2}}.arrow{{marker-end:url(#{ident}-arrow)}}.name{{font:600 14px 'Geist','Noto Sans KR',sans-serif;fill:{ink}}}.field,.label{{font:500 12px 'Geist','Noto Sans KR',sans-serif;fill:{muted}}}.tag{{font:500 9px 'Geist Mono',monospace;fill:{muted};letter-spacing:.08em}}.editorial{{font-size:15px;line-height:1.8;color:{muted};max-width:680px}}@media print{{.diagram-container{{overflow-x:visible}}svg{{min-width:0}}}}
        </style></head><body><main><p class="eyebrow">SQLD · DIAGRAM DESIGN</p><h1>{title}</h1>'''
        if variant=='-full': doc+=f'<p class="editorial">{description}</p>'
        doc+=f'''<div class="diagram-container"><svg viewBox="0 0 960 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="{ident}-title {ident}-desc"><title id="{ident}-title">{title}</title><desc id="{ident}-desc">{description}</desc><defs><marker id="{ident}-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="{muted}"/></marker></defs><rect width="960" height="600" fill="{paper}"/>{b}<line x1="56" y1="536" x2="904" y2="536" stroke="{muted}" stroke-opacity=".3"/><text x="56" y="568" class="label">{html.escape(legend)}</text></svg></div></main></body></html>'''
        (diagram_dir/(ident+'.html')).write_text(doc,encoding='utf-8')
        if not variant:
            inline_diagrams[slug] = re.search(r'<svg\b.*?</svg>',doc,re.S)[0]

with (DIST/'content.js').open('a',encoding='utf-8') as f:
    source = next((ROOT.parent / 'public-materials').glob('추가개념*.md')).read_text('utf-8')
    parts = re.split(r'^## (.+)$', source, flags=re.M)
    basics = [{'title': parts[i].strip(), 'html': render(parts[i+1])} for i in range(1,len(parts),2)]
    f.write('window.STUDY_BASICS = '+json.dumps(basics,ensure_ascii=False)+';\n')
    f.write('window.STUDY_DIAGRAMS = '+json.dumps(inline_diagrams,ensure_ascii=False)+';\n')

print(f'Built {sum(len(c["sections"]) for c in courses)} complete lessons, {sum(len(c["questions"]) for c in courses)} questions, {len(diagrams)} diagrams in 3 variants.')
