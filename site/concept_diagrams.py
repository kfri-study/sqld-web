"""Original teaching diagrams. Calm-blue project palette, 960×600 canvas."""
import html

PAPER, INK, MUTED, ACCENT = '#f4f7fc', '#172b4a', '#536580', '#315f9e'

def txt(x, y, value, cls='d-text', **attrs):
    props=' '.join(f'{k.replace("_", "-")}="{v}"' for k,v in attrs.items())
    return f'<text x="{x}" y="{y}" class="{cls}" {props}>{html.escape(value)}</text>'

STYLE=f'''<style>
.d-title{{font:600 20px 'Geist','Noto Sans KR',sans-serif;fill:{INK}}}
.d-head{{font:600 16px 'Geist','Noto Sans KR',sans-serif;fill:{INK}}}
.d-text{{font:500 14px 'Geist','Noto Sans KR',sans-serif;fill:{INK}}}
.d-small{{font:500 12px 'Geist','Noto Sans KR',sans-serif;fill:{MUTED}}}
.d-code{{font:500 12px 'Geist Mono','Noto Sans KR',monospace;fill:{MUTED}}}
.d-rule{{stroke:{MUTED};stroke-width:1;stroke-opacity:.35}}
</style>'''

def box(x,y,w,h,title,tag,lines=(),focus=False):
    fill='#e5eefc' if focus else '#ffffff'
    out=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{fill}" stroke="{MUTED}"/>'
    out+=txt(x+16,y+24,tag,'d-code')+txt(x+16,y+52,title,'d-head')
    out+=f'<line x1="{x}" y1="{y+68}" x2="{x+w}" y2="{y+68}" class="d-rule"/>'
    for i,line in enumerate(lines):out+=txt(x+16,y+96+i*28,line)
    return out

diagrams=[]

# Entity-level model: cardinality belongs to boxes, not individual rows.
b=STYLE+txt(48,48,'한 학생의 수강이 여러 행으로 늘어나는 이유','d-title')
b+='<path d="M304 248 H352 M608 248 H656" class="edge"/>'
b+=txt(312,224,'1','d-code')+txt(324,272,'0..N','d-code')
b+=txt(612,272,'0..N','d-code')+txt(636,224,'1','d-code')
b+=box(48,116,256,268,'학생','STUDENT',['PK  student_id','학생 한 명 = 한 행','101  다온','102  라온'])
b+=box(352,116,256,268,'수강','ENROLLMENT',['PK  enrollment_id','FK  student_id','FK  course_id','등록일 · 점수'],True)
b+=box(656,116,256,268,'과목','COURSE',['PK  course_id','과목 하나 = 한 행','SQL01  SQL 입문','DB01   DB 기초'])
b+=txt(48,432,'학생 101은 수강 501·502에 참여 → 학생 1명 : 수강 2건')
b+=txt(48,464,'수강 501은 학생 101과 과목 SQL01을 연결 → 양쪽 부모를 정확히 한 건씩 참조')
b+=txt(48,496,'수강번호를 PK로 쓴 예시입니다. 중복 수강 금지는 학생번호+과목코드의 UNIQUE로 별도 정의합니다.','d-small')
diagrams.append(('student-model','학생·수강·과목의 관계 읽기','학생과 과목의 다대다 관계를 수강으로 연결하고 각 방향의 최소·최대 건수를 읽는다.',b,'PK = 행 식별 · FK = 부모 참조 · 0..N = 0건부터 여러 건 · 이 예시는 수강번호를 PK로 사용'))

# Column-level schema: one FK edge, aligned to the exact column rows.
b=STYLE+txt(48,48,'FK의 101은 학생 PK의 101을 참조합니다','d-title')
b+='<path d="M604 212 H476 Q468 212 468 204 V164 Q468 156 460 156 H348" class="edge arrow"/>'
b+=box(48,88,300,184,'STUDENT','PARENT TABLE',['student_id     INT  PK','student_name   TEXT'])
b+=box(604,88,308,212,'ENROLLMENT','CHILD TABLE',['enrollment_id  INT  PK','student_id     INT  FK, NN','course_id      TEXT, NN'])
# FK endpoints must land on column centres: PK 184, FK 212.
b=b.replace('V164 Q468 156 460 156 H348','V192 Q468 184 460 184 H348')
b+=txt(384,140,'참조 대상: PK','d-code')
b+=txt(372,244,'이 예시: 참조 중 삭제 제한','d-small')
b+=txt(48,320,'실제 데이터에서 같은 번호를 따라가 보세요','d-head')
for x,w,title,headers,rows in [
    (48,300,'학생',['student_id','이름'],[['101','다온'],['102','라온']]),
    (528,384,'수강',['수강번호','student_id','과목'],[['501','101','SQL01'],['502','101','DB01'],['503','102','SQL01']])]:
    b+=f'<rect x="{x}" y="340" width="{w}" height="152" rx="4" fill="#ffffff" stroke="{MUTED}"/>'
    for i,v in enumerate(headers):b+=txt(x+16+i*(w//len(headers)),364,v,'d-small')
    for ri,row in enumerate(rows):
        if (x==48 and ri==0) or (x==528 and ri<2):b+=f'<rect x="{x+1}" y="{376+ri*32}" width="{w-2}" height="32" fill="#e5eefc"/>'
        for ci,v in enumerate(row):b+=txt(x+16+ci*(w//len(headers)),398+ri*32,v)
b+='<path d="M348 394 H408 Q416 394 416 402 V418 Q416 426 424 426 H516" class="edge"/>'
b+=txt(48,520,'없는 학생번호 999를 자식 FK에 넣으면 참조 무결성 위반입니다.','d-small')
diagrams.append(('pk-fk','PK·FK와 실제 행 연결','학생 테이블의 기본키를 수강 테이블 외래키가 참조하고 학생 하나에 수강 여러 건이 대응한다.',b,'화살표: FK → 참조 키 · PK = Primary Key · FK = Foreign Key · NN = NOT NULL · 개념 학습용 스키마'))

b=STYLE+txt(48,48,'같은 교수 정보를 여러 수강 행에 반복 저장하면?','d-title')
b+=box(48,88,864,176,'분해 전: 수강마다 담당 교수 이름이 반복됨','BEFORE',['학번 101 · SQL01 · 한교수 · 점수 80 · 학점 B','학번 102 · SQL01 · 한교수 · 점수 90 · 학점 A','교수 변경 시 두 행을 모두 수정해야 함 → 일부만 수정하면 서로 달라짐'],True)
b+='<path d="M192 264 V320 M480 264 V320 M768 264 V320" class="edge"/>'
b+=box(48,320,256,160,'과목','PARTIAL DEPENDENCY',['PK 과목코드 → 교수','SQL01 → 한교수'])
b+=box(352,320,256,160,'수강','RESULT',['PK 학번 + 과목코드','101 · SQL01 → 80'])
b+=box(656,320,256,160,'학점기준','TRANSITIVE DEPENDENCY',['PK 점수 → 학점','80 → B, 90 → A'])
b+=txt(48,516,'과목 정보와 학점 기준은 각 한 곳에서 관리하고, 수강에는 연결할 값과 점수를 남깁니다.','d-small')
diagrams.append(('normalization','반복되는 사실을 분리하는 정규화','과목이 교수를 결정하고 점수가 학점을 결정한다는 가정 아래 중복 사실을 과목과 학점기준으로 분리한다.',b,'가정: 과목코드 → 교수, 점수 → 학점 · 2NF: 부분 종속 제거 · 3NF: 비키 결정자를 거친 종속 점검'))

# Six semantic stages, each carrying the actual output rather than a bare keyword.
b=STYLE+txt(48,40,'WHERE와 HAVING을 지나며 결과가 줄어듭니다','d-title')
b+='<path d="M312 172 H348 M612 172 H648 M780 264 V316 M648 404 H612 M348 404 H312" class="edge arrow"/>'
stages=[
 (48,80,'01  FROM','대여 기록 5행',['지점10: 120, 180','지점20: 180, 300','지점NULL: 금액NULL']),
 (348,80,'02  WHERE','fee IS NOT NULL',['미확정 금액 행 제외','지점10: 120, 180','지점20: 180, 300']),
 (648,80,'03  GROUP BY','branch_id별 집계',['지점10 → 합계 300','지점20 → 합계 480','두 그룹 생성']),
 (648,316,'04  HAVING','SUM(fee) >= 400',['지점10 합계 300 제외','지점20 합계 480 유지']),
 (348,316,'05  SELECT','출력할 열 선택',['branch_id | fee_sum','20        | 480']),
 (48,316,'06  ORDER BY','branch_id 오름차순',['최종 결과 한 행','20        | 480'])]
for x,y,title,sub,lines in stages:
    b+=box(x,y,264,184,title,sub,lines, title.startswith('04'))
diagrams.append(('sql-order','SQL의 단계별 입력과 결과','대여 기록에서 미확정 금액을 제외하고 지점별로 집계한 뒤 합계 400 이상인 지점 20만 출력한다.',b,'논리적 해석 예시 · 5행 → 4행 → 2그룹 → 1그룹 → 결과 1행 · 실제 물리 실행 계획과 구분'))

b=STYLE+txt(48,48,'SQL은 요청 언어, DBMS는 요청을 처리하는 프로그램','d-title')
b+='<path d="M292 220 H356 M604 220 H668" class="edge arrow"/>'
b+=box(48,112,244,224,'앱 또는 접속 도구','CLIENT',['사람의 요청을 SQL로 작성','SELECT ... FROM loan','결과 표를 화면에 표시'])
b+=box(356,112,248,224,'DBMS','SOFTWARE',['문장 해석·실행','권한·제약조건 검사','동시 작업·복구 관리'],True)
b+=box(668,112,244,224,'DB','DATA',['대여 기록과 지점 정보','테이블 · 행 · 열','키와 관계로 구조화'])
b+=txt(48,400,'실제 예: pgAdmin(도구) → SQL(언어) → PostgreSQL(DBMS) → 대여 데이터(DB)')
b+=txt(48,440,'관리형 서비스는 DBMS 운영의 일부를 제공자가 맡는 방식입니다.','d-small')
b+=txt(48,472,'SQLite는 별도 서버 없이 앱 안에서 엔진이 동작할 수 있어 모든 DBMS가 서버형인 것은 아닙니다.','d-small')
diagrams.append(('dbms-flow','DB·DBMS·SQL의 역할','앱이나 접속 도구가 SQL 요청을 보내면 DBMS가 권한과 제약을 확인하며 데이터베이스의 데이터를 처리한다.',b,'CLIENT = 요청하는 쪽 · SQL = 언어 · DBMS = 관리 프로그램 · DB = 데이터 집합 · 전형적 서버형 예시'))
