const examPractice = (() => {
  const questions = practiceItems.flatMap((items,c) => items.map(([unit,prompt,options,correct,reason]) => ({course:c+1,unit,prompt,options:options.split('|'),correct,reason})));
  const key = 'sqld-exam-practice-v1';
  const scope = [
    ['데이터 모델링의 이해',1,[[1,'모델 이해'],[2,'엔터티'],[3,'속성'],[5,'관계'],[4,'식별자']]],
    ['데이터 모델과 SQL',1,[[7,'정규화'],[5,'관계와 조인'],[9,'트랜잭션'],[10,'NULL 속성'],[10,'본질·인조식별자']]],
    ['SQL 기본',2,[[1,'관계형 DB'],[2,'SELECT'],[4,'함수'],[5,'WHERE'],[6,'GROUP BY·HAVING'],[7,'ORDER BY'],[8,'조인'],[8,'표준 조인']]],
    ['SQL 활용',2,[[9,'서브쿼리'],[10,'집합 연산'],[11,'그룹 함수'],[12,'윈도우 함수'],[7,'Top N'],[13,'계층형·셀프 조인'],[14,'PIVOT·UNPIVOT'],[14,'정규표현식']]],
    ['관리 구문',2,[[15,'DML'],[16,'TCL'],[17,'DDL'],[18,'DCL']]]
  ];
  let attempt, timer;
  try {const saved=JSON.parse(localStorage.getItem(key)); if(saved && Array.isArray(saved.answers) && saved.answers.length===50 && Number.isFinite(saved.end) && Number.isInteger(saved.i) && saved.i>=0 && saved.i<50) attempt=saved;} catch {}
  function persist(){try{localStorage.setItem(key,JSON.stringify(attempt));}catch{}}
  function stop(){clearInterval(timer);}
  function mount(root) {
    const unitLink=q=>`<a href="#/course/${q.course}/${q.unit}">${q.course}과목 ${q.unit}단원 복습 →</a>`;
    const missed=(q,i)=>attempt.answers[i]!==q.correct;
    function start(){attempt={i:0,end:Date.now()+90*60000,answers:Array(50).fill(0),done:false};persist();draw();}
    function finish(){attempt.done=true;persist();draw();}
    function step(i){attempt.i=i;persist();draw();}
    function draw(){
      stop();
      if(!attempt){
        root.innerHTML=`<h2>범위부터 확인하기</h2><p>항목을 눌러 개념과 예제를 읽고, 단원 끝 확인문제를 풀어 보세요.</p>${scope.map(([title,c,items])=>`<section><h3>${title}</h3><div class="scope-links">${items.map(([u,name])=>`<a href="#/course/${c}/${u}">${name}</a>`).join('')}</div></section>`).join('')}<p>시험 구성과 범위 출처 · <a href="https://www.dataq.or.kr/www/sub/a_04.do" target="_blank" rel="noopener">한국데이터산업진흥원 SQL 개발자 안내</a></p><h2>실전 연습 1회</h2><p>자체 출제 50문제 · 90분. 답은 제출 뒤에 공개돼요. 페이지를 떠나도 시간은 계속 흘러요. 단원 확인문제와 같은 문제 은행을 사용해요.</p><button class="button" data-start>90분 연습 시작</button>`;
        root.querySelector('[data-start]').onclick=start;return;
      }
      if(attempt.done){
        const wrong=questions.map((q,i)=>i).filter(i=>missed(questions[i],i));
        const c1=10-wrong.filter(i=>i<10).length,c2=40-wrong.filter(i=>i>=10).length;
        root.innerHTML=`<h2>연습 결과 · ${(c1+c2)*2} / 100점</h2><p>1과목 ${c1}/10 · 2과목 ${c2}/40 · 미응답 ${attempt.answers.filter(a=>!a).length}문항</p><h3>틀리거나 비워 둔 문제 · ${wrong.length}개</h3>${wrong.map(i=>{const q=questions[i];return `<section class="exam-review"><strong>${i+1}. ${q.prompt}</strong><div>내 답 · ${q.options[attempt.answers[i]-1]||'미응답'}</div><div>정답 · ${q.options[q.correct-1]}</div><p>${q.reason}</p>${unitLink(q)}</section>`}).join('')||'<p>모두 맞혔어요.</p>'}<button data-reset>결과 지우고 처음으로</button>`;
        root.querySelector('[data-reset]').onclick=()=>{if(confirm('이번 연습 결과를 지울까요?')){attempt=null;persist();draw();}};return;
      }
      if(Date.now()>=attempt.end){finish();return;}
      const i=attempt.i,q=questions[i];
      root.innerHTML=`<div class="exam-meta">${q.course}과목 · 문제 ${i+1}/50 <strong data-clock></strong></div><h2>${q.prompt}</h2><fieldset><legend>답 하나 선택</legend>${q.options.map((answer,j)=>`<label><input type="radio" name="exam" value="${j+1}" ${attempt.answers[i]===j+1?'checked':''}> ${answer}</label>`).join('')}</fieldset><div class="exam-actions"><button data-prev ${i===0?'disabled':''}>← 이전</button><button data-next ${i===49?'disabled':''}>다음 →</button><button data-submit>답안 제출</button></div><details><summary>문제 이동 · 응답 ${attempt.answers.filter(Boolean).length}/50</summary><div class="scope-links">${questions.map((_,j)=>`<button data-jump="${j}">${j+1}${attempt.answers[j]?' ✓':''}</button>`).join('')}</div></details>`;
      root.querySelectorAll('input').forEach(input=>input.onchange=()=>{if(Date.now()>=attempt.end){finish();return;}attempt.answers[i]=Number(input.value);persist();draw();});
      root.querySelector('[data-prev]').onclick=()=>step(i-1);root.querySelector('[data-next]').onclick=()=>step(i+1);
      root.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>step(Number(b.dataset.jump)));
      root.querySelector('[data-submit]').onclick=()=>{if(confirm('미응답 '+attempt.answers.filter(a=>!a).length+'문항을 포함해 채점할까요?'))finish();};
      const tick=()=>{const left=Math.ceil((attempt.end-Date.now())/1000);if(left<=0){finish();return;}root.querySelector('[data-clock]').textContent='남은 시간 '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0');};
      timer=setInterval(tick,1000);tick();
    }
    draw();
  }
  function unitCheck(c,u){
    const extras={'1-6':{prompt:'존재하지 않는 학생번호로 수강을 등록하지 못하게 하려면?',options:['수강번호에 기본키만 둔다','수강의 학생번호에 학생을 참조하는 FK를 둔다'],correct:2,reason:'수강번호의 유일성만으로는 부모 학생이 존재하는지 확인하지 못한다. FK가 참조 대상 학생의 존재를 검사한다.'},'1-8':{prompt:'전체 논리 구조를 유지하고 인덱스만 추가했다. 어떤 독립성에 해당하는가?',options:['논리적 독립성','물리적 독립성'],correct:2,reason:'저장·접근 방식은 내부 단계다. 내부 구조의 변경이 개념 구조에 영향을 주지 않는 것이 물리적 독립성이다.'}};
    const q=questions.find(x=>x.course===c && x.unit===u)||extras[c+'-'+u];
    return `<details class="unit-check"><summary>혼자 풀어보기 · 단원 확인문제</summary><strong>${q.prompt}</strong>${q.options.map((a,i)=>`<div>${i+1}. ${a}</div>`).join('')}<details><summary>정답과 이유</summary><b>${q.correct}번 · ${q.options[q.correct-1]}</b><div>${q.reason}</div></details></details>`;
  }
  return {mount,stop,unitCheck};
})();
