/* 문제에 제공하는 자체 제작 입력 자료. 풀이·결과는 포함하지 않는다. */
const questionContext = (() => {
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const table=(name,cols,rows)=>`<div class="question-table-scroll" tabindex="0" role="region" aria-label="${esc(name)} 입력 표"><table><caption>${esc(name)}</caption><thead><tr>${cols.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${v===null?'<span class="null-value">NULL</span>':esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const wrap=(body,note='')=>`<aside class="question-context" aria-label="문제 풀이용 기초자료"><strong>문제에 주어진 자료</strong>${body}${note?`<p>${esc(note)}</p>`:''}</aside>`;
  const loan=()=>table('LOAN · 대여 기록',['LOAN_ID','READER','BRANCH_ID','FEE','LATE_FEE'],[[11,'다온',10,120,null],[12,'라온',10,180,0],[13,'마루',20,180,20],[14,'보람',20,300,null],[15,'이든',null,null,null]]);
  const branch=()=>table('BRANCH · 지점',['BRANCH_ID','BRANCH_NAME'],[[10,'북쪽'],[20,'남쪽'],[30,'동쪽']]);
  function review(c,id){
    if(c===1){
      if([1,5,8,9].includes(id))return wrap(table('수강 예시',['학번','과목코드','학기','교수'],[['S1','DB','1학기','김교수'],['S2','DB','1학기','김교수']]),'각 행은 수강 한 건이다. 과목코드 하나에는 교수 한 명이 정해진다고 가정한다. PK와 추가 제약은 각 문제의 조건을 따른다.');
      return '';
    }
    if([1,2,3,4,5,6,7,8,9,10,11,12,14,17,18,20].includes(id)){
      let note='LOAN_ID: 대여번호(PK), READER: 이용자, BRANCH_ID: 지점번호, FEE: 대여료, LATE_FEE: 연체료. 금액은 원 단위이며 NULL은 값이 없음을 뜻한다. 각 문제는 위 원본에서 독립적으로 시작한다.';
      if([9,10,11].includes(id))note+=' BRANCH.BRANCH_ID는 PK다. 9·11번의 연결 조건은 BRANCH.BRANCH_ID = LOAN.BRANCH_ID이며, 10번은 연결 조건 없는 CROSS JOIN이다.';
      if(id===14)note+=' GROUP BY ROLLUP(BRANCH_ID)로 집계한다.';
      if(id===17)note+=' LOAN_ID 오름차순으로 계산한다. FEE IS NOT NULL인 행만 사용하고 누적 범위는 ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW다.';
      if(id===18)note+=' ROW_NUMBER() OVER (ORDER BY FEE DESC)를 기준으로, 동점의 순서까지 확정할 추가 정렬 열을 생각한다.';
      return wrap(loan()+([9,10,11].includes(id)?branch():''),note);
    }
    if([15,16].includes(id))return wrap(table('순위 계산 입력',['대상','점수'],[['A',300],['B',180],['C',180],['D',120]]),'점수 내림차순(ORDER BY 점수 DESC)으로 전체 행의 순위를 구한다. PARTITION BY는 없다.');
    if(id===19)return wrap(table('CATEGORY · 분류',['CATEGORY_ID','PARENT_ID'],[[10,null],[20,10],[30,20]]),'CATEGORY_ID는 현재 분류 번호, PARENT_ID는 상위 분류 번호다. START WITH CATEGORY_ID = 10에서 시작한다.');
    return '';
  }
  const input={
    '1-9':['평가','점수',[[0],[80],[null]]],
    '2-2':['조회 대상','지점|번호',[['A',1],['A',2],['A',2]]],
    '2-9':['결제','금액',[[9],[10],[20],[21]]],
    '2-10':['대여','요금',[[null],[0],[20]]],
    '2-11':['대여','지점|요금',[['A',100],['A',120],['B',180]]],
    '2-13':['성적','점수|번호',[[80,1],[90,4],[90,2]]],
    '2-18':['직원','급여',[[100],[200],[300]]],
    '2-25':['성적','점수',[[90],[90],[80]]],
    '2-26':['거래','금액',[[100],[100],[200]]],
    '2-27':['일별 매출','날짜|매출',[['11-01',10],['11-02',30],['11-03',20]]],
    '2-28':['성적','점수',[[95],[90],[90],[80]]],
    '2-29':['조직','번호|부모번호|이름',[[10,null,'ROOT'],[20,10,'부서'],[30,20,'팀']]],
    '2-31':['지점 매출','지점|월|금액',[['A',1,10],['A',1,20],['A',2,30]]]
  };
  function practice(c,id){
    const k=c+'-'+id,t=input[k];
    if(t)return wrap(table(t[0],t[1].split('|'),t[2]),'위 표가 전체 입력 데이터다. 같은 값의 행도 각각 한 행으로 취급한다. 정렬·필터·집계 조건은 문제에 명시된 조건을 따른다.');
    if(k==='2-14')return wrap(table('왼쪽 표',['행번호','키'],[[1,'A'],[2,'A']])+table('오른쪽 표',['행번호','키'],[[1,'A'],[2,'A'],[3,'A']]),'조인 조건: 왼쪽.키 = 오른쪽.키. DISTINCT는 적용하지 않는다.');
    if(['2-15','2-17'].includes(k))return wrap(table('지점',['지점ID'],[['A'],['B']])+table('대여',['대여ID','지점ID','상태'],[[1,'A','승인'],[2,'A','승인']]),'지점 LEFT JOIN 대여 ON 지점.지점ID = 대여.지점ID. 추가 WHERE 조건은 문제를 따른다.');
    if(['2-21','2-22'].includes(k))return wrap(table('A 결과',['값'],k==='2-21'?[[1],[1],[2]]:[[1],[2]])+table('B 결과',['값'],[[2],[3]]),'두 결과는 숫자 열 하나로 구성된다. 집합 연산만 적용하며 별도 필터는 없다.');
    if(k==='2-34')return wrap(table('MERGE 대상',['키'],[[1],[2]])+table('MERGE 원본',['키'],[[2],[3]]),'ON 조건은 대상.키 = 원본.키다. 일치 시 UPDATE, 불일치 시 INSERT만 수행한다.');
    return '';
  }
  return {review,practice};
})();
