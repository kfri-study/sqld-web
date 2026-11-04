(() => {
  'use strict';
  const courses = window.STUDY_CONTENT;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const plain = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent || ''; };
  const KEY = 'sqld-public-notes-v2';
  let state = { done: {}, saved: {}, quiz: {}, drafts: {}, videos: {} }, storageOK = true;
  try {
    const old = JSON.parse(localStorage.getItem(KEY) || '{}');
    for (const key of Object.keys(state)) if (old[key] && typeof old[key] === 'object' && !Array.isArray(old[key])) state[key] = old[key];
  } catch { storageOK = false; }
  let route = {}, quizFilter = 'all', toastTimer;
  const lessonKey = (c, s) => `${c}-${s}`;
  const courseDone = c => c.sections.filter(s => state.done[lessonKey(c.id, s.id)]).length;
  const totalDone = () => courses.reduce((n,c) => n+courseDone(c),0);
  const courseKnown = c => c.questions.filter(q => state.quiz[lessonKey(c.id,q.id)] === 'known').length;
  const lessonURL = (c,s) => `#/course/${c}/${s}`;
  const button = (url,label,secondary=false) => `<a class="button${secondary?' secondary':''}" href="${url}">${label}<span class="arrow" aria-hidden="true">↗</span></a>`;
  function toast(message) { $('#toast').textContent=message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2400); }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { storageOK=false; $('#storage-state').textContent='저장이 제한되어 이번 방문에서만 유지돼요.'; }
  }
  function progress(c) {
    const done=courseDone(c),pct=Math.round(done/c.sections.length*100);
    return `<div class="progress-row"><span>학습 진도 <strong>${done}</strong> / ${c.sections.length}</span><strong>${pct}%</strong></div><div class="progress-track" role="progressbar" aria-label="${c.id}과목 학습 진도" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${pct}%"></div></div>`;
  }
  function sidebar() {
    const saved=courses.reduce((n,c)=>n+c.sections.filter(s=>state.saved[lessonKey(c.id,s.id)]).length,0);
    $('#saved-count').textContent=saved;
    $('#course-nav').innerHTML=courses.map(c=>`<div class="course-group"><a class="course-nav-title" href="#/course/${c.id}"><span class="course-pill">${c.id}과목</span>${c.id===1?'데이터 모델링':'SQL 기본 및 활용'}</a><div class="course-shortcuts"><a href="${scheduleURL(c.id)}">강의 시간표</a><a href="#/course/${c.id}" class="${route.view==='course'&&route.course===c.id?'active':''}">단원별 학습<span class="nav-count">${courseDone(c)}/${c.sections.length}</span></a><a href="#/quiz/${c.id}" class="${route.view==='quiz'&&route.course===c.id?'active':''}">복습문제<span class="nav-count">${c.questions.length}</span></a></div>${route.view==='lesson'&&route.course===c.id?`<div class="course-lesson-list">${c.sections.map(s=>`<a href="${lessonURL(c.id,s.id)}" class="${route.section===s.id?'active':''}" ${route.section===s.id?'aria-current="page"':''}><span class="lesson-num">${String(s.id).padStart(2,'0')}</span><span>${esc(s.title)}</span>${state.done[lessonKey(c.id,s.id)]?'<span class="mini-done" aria-label="학습 완료">✓</span>':''}</a>`).join('')}</div>`:''}</div>`).join('');
    document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===route.view;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    if(!storageOK) $('#storage-state').textContent='저장이 제한되어 이번 방문에서만 유지돼요.';
  }
  const videos = [
    { id: 'e_AIZkWJNqA', title: '1과목 요약 강의', index: 2 },
    { id: 'Rv4Q4ZrPS94', title: '2과목 요약 강의', index: 3 }
  ];
  function videoCount() {
    return videos.filter(video => state.videos[video.id]).length;
  }
  function videoProgress() {
    return `<section aria-labelledby="video-heading"><div class="section-heading"><h2 id="video-heading">유튜브 강의 진도</h2><span id="video-count" aria-live="polite">${videoCount()} / 2강 완료</span></div>
      <p>강의를 다 들으면 ‘시청 완료’를 체크해 줘. 이 브라우저에 저장돼.</p>
      <div class="video-list">${videos.map(video => `<div class="video-row">
        <a href="https://www.youtube.com/watch?v=${video.id}&amp;list=PLWtr7MRpQi5BbdqJhNKXZSvPqYHT_rZkS&amp;index=${video.index}" target="_blank" rel="noopener noreferrer">${video.title} ↗</a>
        <label><input type="checkbox" data-video="${video.id}" aria-label="${video.title} 시청 완료" ${state.videos[video.id] ? 'checked' : ''}> 시청 완료</label>
      </div>`).join('')}</div></section>`;
  }
  function home() {
    const c1=courses[0],c2=courses[1];
    const next=courses.flatMap(c=>c.sections.map(s=>({c,s}))).find(({c,s})=>!state.done[lessonKey(c.id,s.id)]) || {c:c1,s:c1.sections[0]};
    const suggested=courses.flatMap(c=>c.sections.filter(s=>!state.done[lessonKey(c.id,s.id)]).slice(0,2).map(s=>({c,s}))).slice(0,4);
    return `<section class="hero"><div><p class="eyebrow">SQL DEVELOPER / STUDY NOTES</p><h1>개념을 이해하고,<br><em>문제로 확인하세요.</em></h1><p class="hero-copy">작은 데이터와 직접 만든 예제로,<br>개념을 이해하고 결과를 계산하는 학습 공간.</p>${button(lessonURL(next.c.id,next.s.id),totalDone()?'이어서 공부하기':'첫 단원 시작하기')}</div><div class="hero-visual" aria-label="학생과 과목을 수강으로 연결하는 개념도"><div class="visual-label">MAKE THE CONNECTION.</div><div class="visual-relation"><div class="tiny-entity"><b>학생</b><span>PK student_id</span><span>student_name</span></div><span class="tiny-link"></span><div class="tiny-entity focus"><b>수강</b><span>FK student_id</span><span>FK course_id</span></div><span class="tiny-link"></span><div class="tiny-entity"><b>과목</b><span>PK course_id</span><span>course_name</span></div></div><p class="visual-caption">따로 외웠던 개념들이 하나로 연결되는 순간.</p><div class="hero-dots"><span></span><span></span><span></span></div></div></section>
    ${videoProgress()}
    <div class="section-heading"><h2>나의 학습 과목</h2><span>전체 ${totalDone()} / 28단원 완료</span></div>
    <section class="course-grid" aria-label="과목 선택">${courses.map(c=>`<article class="course-card"><div class="course-top"><span class="subject-label">SUBJECT 0${c.id}</span><span class="time-chip">직접 풀어보는 개념 노트</span></div><h3>${c.title}</h3><p class="desc">${c.id===1?'엔터티와 관계부터 정규화까지,<br>데이터의 구조를 이해하는 첫걸음.':'조회와 집계부터 조인·윈도우 함수까지,<br>SQL을 읽고 결과를 계산하는 연습.'}</p><div class="course-meta"><span>▤ ${c.sections.length}개 단원</span><span>□ 복습 ${c.questions.length}문제</span><span>＋ 공식 문서 참고</span></div>${progress(c)}<div class="course-card-bottom"><a href="#/course/${c.id}" class="link-arrow">단원 살펴보기 <span class="arrow">→</span></a><a href="#/quiz/${c.id}">복습문제 풀기 ↗</a></div></article>`).join('')}</section>
    <section class="home-lower"><div><div class="section-heading"><h2>다음에 공부할 단원</h2><a href="#/maps">개념 지도 보기 ↗</a></div><div class="lesson-list">${(suggested.length?suggested:[next]).map(({c,s})=>`<a class="lesson-row" href="${lessonURL(c.id,s.id)}"><span class="number">${String(s.id).padStart(2,'0')}</span><span class="label">${esc(s.title)}<span class="detail">${c.id}과목 · 핵심 개념과 보충 설명</span></span><span class="status">학습하기 →</span></a>`).join('')}</div></div><aside><div class="section-heading"><h2>이렇게 공부해 보세요</h2></div><div class="study-note"><h3>읽고 끝내지 않는 3단계 학습</h3>${[['핵심 한 줄로 시작','업무 규칙과 데이터의 의미부터 살펴봐요.'],['예제 결과를 직접 계산','해설을 보기 전에 내 답을 먼저 적어봐요.'],['헷갈린 문제는 다시 보기','복습 표시를 남기고 다음 날 다시 풀어요.']].map(([a,b],i)=>`<div class="study-step"><span>0${i+1}</span><p><b>${a}</b>${b}</p></div>`).join('')}</div></aside></section><p class="source-note">공개용으로 새로 작성한 설명·예제·연습문제입니다. 공식 문서와 참고 강의는 과목별 참고자료에 표시했습니다.<br>영상·자막·첨부 PDF는 제공하지 않습니다. 공식 시험자료나 제작자의 감수 자료가 아닙니다.</p>`;
  }
  function extras(c) {return c.extras.map(x=>`<details><summary>${esc(x.title)}</summary><div class="prose">${x.html}</div></details>`).join('');}
  function coursePage(c) {
    const next=c.sections.find(s=>!state.done[lessonKey(c.id,s.id)])||c.sections[0];
    return `<a class="back-link" href="#/home">← 학습 홈</a><section class="course-banner"><div class="page-head" style="margin:0"><p class="eyebrow">SUBJECT 0${c.id}</p><h1>${c.title}</h1><p class="sub">${c.id===1?'관리할 대상을 찾고, 관계를 연결하고, 중복을 줄이는 과정.':'SQL을 한 단계씩 읽으며 남는 행과 출력되는 값을 확인하는 과정.'}<br>${c.sections.length}개 단원 · 직접 풀어보는 개념 노트 · 복습 ${c.questions.length}문제</p><div class="head-actions">${button(lessonURL(c.id,next.id),courseDone(c)?'이어서 학습':'학습 시작')}${button(`#/quiz/${c.id}`,'복습문제',true)}</div></div><div><div class="progress-label">차근차근 쌓이는 나의 학습</div><div class="progress-value">${Math.round(courseDone(c)/c.sections.length*100)}<small style="font-size:15px">%</small></div>${progress(c)}</div></section><div class="section-heading"><h2>학습 목차</h2><a href="${scheduleURL(c.id)}">강의 시간표 →</a><a href="${c.download}" download>원문 내려받기 ↓</a></div><div class="unit-list">${c.sections.map(s=>`<a class="unit" href="${lessonURL(c.id,s.id)}"><span class="unit-number">${String(s.id).padStart(2,'0')}</span><div class="unit-content"><h3>${esc(s.title)}</h3><p>${esc(s.summary)}</p></div><span class="unit-state ${state.done[lessonKey(c.id,s.id)]?'done':''}">${state.done[lessonKey(c.id,s.id)]?'✓ 완료':'→'}</span></a>`).join('')}</div><section class="extras"><div class="section-heading"><h2>참고자료와 작성 범위</h2></div>${extras(c)}<details><summary>자료 안내와 사용 방법</summary><div class="prose">${c.intro}</div></details></section>`;
  }
  const alignments = ['left','center','right'];
  const alignmentNames = ['왼쪽','가운데','오른쪽'];
  let readingPosition = 0;
  try {
    readingPosition = Math.max(0, alignments.indexOf(localStorage.getItem('sqld-reading-alignment')));
  } catch {}
  function updateReadingPosition() {
    const layout = document.querySelector('.reading-layout');
    if (!layout) return;
    layout.dataset.align = alignments[readingPosition];
    layout.querySelector('[data-align-name]').textContent = alignmentNames[readingPosition];
    layout.querySelector('[data-step="-1"]').disabled = readingPosition === 0;
    layout.querySelector('[data-step="1"]').disabled = readingPosition === 2;
  }
  const seconds = time => time.split(':').reduce((sum, value) => sum * 60 + Number(value), 0);
  const scheduleURL = (course, at) => '#/schedule/' + course + (at ? '/' + at : '');
  function schedulePage(c) {
    return `<header class="page-head"><a href="#/course/${c.id}">← ${c.id}과목 목차</a><h1>${c.id}과목 강의 시간표</h1><p>듣고 있는 시각을 누르면 해당 단원의 설명으로 이동해요.</p></header>
    <article class="reading-paper schedule-list">${lectureTracks[c.id-1].map(([unit,title,rows])=>`<section><h2>${esc(title)}</h2>${rows.map(([time,label,,exam])=>`<a id="schedule-${seconds(time)}" href="${lessonURL(c.id,unit)}/${seconds(time)}" data-schedule-time="${seconds(time)}"><time>${time}</time><span>${esc(label)}${exam?' <small>시험 언급</small>':''}</span><span aria-hidden="true">→</span></a>`).join('')}</section>`).join('')}</article>`;
  }
  function flowPlayer(key) {
    const steps = lectureFlows[key];
    if (!steps) return '';
    return `<div class="flow-player" data-flow="${key}" role="group" aria-label="단계별 흐름 재생">
      <small>움직이는 예제 · 자체 제작</small>
      <div class="flow-stops">${steps.map(([label], i) => `<span ${i===0?'aria-current="step"':''}>${esc(label)}</span>`).join('')}</div>
      <div class="flow-caption" aria-live="polite">${esc(steps[0][1])}</div>
      <div class="flow-controls"><button type="button" data-play>▶ 흐름 재생</button><button type="button" data-prev disabled aria-label="이전 단계">←</button><output>1 / ${steps.length}</output><button type="button" data-next aria-label="다음 단계">→</button></div></div>`;
  }
  let stopActiveFlow;
  function bindFlow(root) {
    const steps = lectureFlows[root.dataset.flow];
    const stops = [...root.querySelectorAll('.flow-stops span')];
    const play = root.querySelector('[data-play]');
    const prev = root.querySelector('[data-prev]');
    const next = root.querySelector('[data-next]');
    let i = 0, timer;
    function paint() {
      stops.forEach((stop, index) => index===i ? stop.setAttribute('aria-current','step') : stop.removeAttribute('aria-current'));
      root.querySelector('.flow-caption').textContent = steps[i][1];
      root.querySelector('output').textContent = (i+1)+' / '+steps.length;
      prev.disabled = i===0;
      next.disabled = i===steps.length-1;
      play.textContent = timer ? 'Ⅱ 일시정지' : next.disabled ? '↺ 다시 재생' : i ? '▶ 이어서 재생' : '▶ 흐름 재생';
    }
    function stop() {
      clearInterval(timer); timer = null;
      if (stopActiveFlow===stop) stopActiveFlow=null;
      paint();
    }
    function advance() {
      i++;
      if (i===steps.length-1) stop(); else paint();
    }
    play.onclick = () => {
      if (timer) { stop(); return; }
      stopActiveFlow?.();
      if (next.disabled) i=0;
      stopActiveFlow=stop;
      timer=setInterval(advance, 3600);
      paint();
    };
    prev.onclick = () => { stop(); i--; paint(); };
    next.onclick = () => { stop(); advance(); };
  }
  function lectureReader(c, unit) {
    const video = c.id === 1 ? 'e_AIZkWJNqA' : 'Rv4Q4ZrPS94';
    const chapters = lectureTracks[c.id - 1];
    const url = time => 'https://www.youtube.com/watch?v=' + video + '&t=' + seconds(time) + 's';
    function moment([time, title, explanation, exam, board, sketch]) {
      return `<div class="moment" id="moment-${seconds(time)}"><div><a href="${url(time)}" aria-label="${esc(title)} 강의 ${time}부터 보기">▶ ${time}</a> <strong>${esc(title)}</strong>
        <div class="moment-copy">${esc(explanation)}</div>${c.id === 2 && time === '32:08' ? '<div class="track-ref">문법 보충 · 일반 비교의 결과가 UNKNOWN이라는 설명은 <a target="_blank" rel="noopener" href="https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Nulls.html">Oracle 19c NULL 공식 문서</a> 기준입니다.</div>' : ''}${exam ? `<div class="teacher-emphasis"><b>강사의 시험 언급 · ${time}</b><br>${esc(exam)}</div>` : ''}</div>
        ${flowPlayer(c.id+'-'+time)}${board ? `<aside class="moment-board">${sketch ? `<figure><figcaption>화면 개념을 다시 그린 도식 · ${board}</figcaption>${sketch.split('|').map(line=>`<div>${line.split(' → ').map(esc).join(' <b aria-hidden="true">→</b> ')}</div>`).join('')}</figure>` : ''}
        <details data-board-video="${video}" data-board-start="${seconds(board)}"><summary>원본 판서 보기 · ${board}</summary><a target="_blank" rel="noopener" href="${url(board)}">YouTube에서 이 장면 열기 ↗</a></details></aside>` : ''}</div>`;
    }
    return `<section class="lecture-reader"><div class="track-title">1. 강의를 따라 읽기</div><small class="origin-tag">아답터 · SQLD ${c.id}과목</small>
      <div class="track-intro">이 단원에 해당하는 장면을 영상 순서대로 모았어요. ▶ 시각을 누르면 필기창에서 그 설명을 재생할 수 있어요.</div>
      ${chapters.filter(([id]) => id === unit).map(([,title,rows])=>`<section class="track-chapter"><strong>${esc(title)}</strong>${rows.map(moment).join('')}</section>`).join('')}
      </section>`;
  }
  function readingGuide(c, s, map) {
    const [question, ...parts] = lessonFigures[c.id - 1][s.id - 1];
    const caption = parts.pop();
    const source = document.createElement('template');
    source.innerHTML = s.lecture + s.html;
    const lecture = source.content.querySelector('a[href*="youtube.com/watch"]');
    const docs = [...new Map([...source.content.querySelectorAll('a[href^="https://docs.oracle.com/"], a[href^="https://learn.microsoft.com/"]')].map(a => [a.href, a])).values()];
    const steps = parts.map(part => {
      const [label, value] = part.split(' / ');
      return `<div><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`;
    }).join('');
    const first = c.id === 1 && s.id === 1;
    return `<aside class="read-guide" aria-label="단원 읽기 안내">
      <small>2. 예제로 확인하기 · 자체 제작</small>
      <figure><figcaption>${esc(question)}</figcaption>${first ? '<img src="diagrams/crud-enrollment.svg" alt="학생이 과목을 선택하고 수강을 신청할 때 과목 정보는 조회하고 수강 기록은 생성한다.">' : `<div class="concept-steps">${steps}</div>`}
      ${map ? `<button type="button" data-read-target=".diagram-canvas">관련 개념도 보기 ↓</button>` : ''}
      <div class="figure-key">${esc(caption)}</div></figure>
      <div class="source-line">참고한 강의 · 아답터 ${c.id}과목 ${lecture ? lecture.outerHTML : ''}</div>
      ${docs.length ? `<div class="source-line">SQL 동작 확인 · ${docs.map(a => a.outerHTML).join(' · ')}</div>` : ''}
      </aside>`;
  }
  function lessonPage(c,s) {
    const saved=!!state.saved[lessonKey(c.id,s.id)],done=!!state.done[lessonKey(c.id,s.id)];
    const map=c.id===1&&s.id===4?'pk-fk':c.id===1&&[5,7].includes(s.id)?(s.id===7?'normalization':'student-model'):c.id===2&&[2,6,7].includes(s.id)?'sql-order':null;
    return `<div class="reading-layout"><div class="reading-toolbar"><a class="back-link" href="${scheduleURL(c.id,route.at || seconds(lectureTracks[c.id-1].find(([id])=>id===s.id)[2][0][0]))}">← 강의 시간표</a><a class="back-link" href="#/course/${c.id}">← ${c.id}과목 전체 목차</a><div class="reading-tools"><div class="reading-align" role="group" aria-label="본문 정렬"><button type="button" data-step="-1" aria-label="본문 왼쪽으로 이동">←</button><span data-align-name aria-live="polite"></span><button type="button" data-step="1" aria-label="본문 오른쪽으로 이동">→</button></div><button class="icon-button ${saved?'selected':''}" id="save-lesson" aria-label="${saved?'저장한 단원에서 해제':'단원 저장'}" aria-pressed="${saved}">${saved?'★':'☆'}</button><button class="icon-button" id="print-button" aria-label="단원 인쇄">⎙</button></div></div><header class="reading-head"><p class="eyebrow">SUBJECT 0${c.id} / LESSON ${String(s.id).padStart(2,'0')}</p><h1>${esc(s.title)}</h1><p class="reading-summary"><b>이 단원의 질문</b> · ${esc(lessonFigures[c.id-1][s.id-1][0])}<br>${esc(s.summary)}</p></header><article class="reading-paper prose" aria-label="학습 본문">${lectureReader(c,s.id)}${readingGuide(c,s,map)}<section class="lesson-supplement"><div class="track-title">3. 더 살펴보기</div><details><summary>시험 포인트와 핵심 요약</summary>${s.examNote?`<section class="exam-note"><h2>강사가 짚은 시험 포인트</h2>${s.examNote}</section>`: ''}<div data-recap-points><h2>구별해서 기억하기</h2><ul>${s.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul></div></details><details><summary>참고한 강의</summary>${s.lecture?`<section class="lesson-lecture"><h2>강의와 함께 보기</h2><small class="origin-tag">참고 강의 · 아답터 ${c.id}과목 / 설명은 자체 재구성</small>${s.lecture}</section>`:''}<div data-recap-terms><h2>용어와 암기어</h2><dl>${s.terms.map(([ko,en,def])=>`<dt><b>${esc(ko)}</b> · <span lang="en">${esc(en)}</span></dt><dd>${esc(def)}</dd>`).join('')}</dl></div></details>${map?`<div class="diagram-canvas" tabindex="0" aria-label="개념도">${window.STUDY_DIAGRAMS[map]}</div><a href="diagrams/${map}.html" target="_blank" rel="noopener">그림 크게 보기 ↗</a>`:''}<details class="lesson-detail"><summary>자세한 설명과 연습 예제</summary><h2>본문과 예제</h2><small class="origin-tag">학습용으로 다시 쓴 설명과 사례 · 공식 문서는 해당 단원의 참고 링크에 표시</small>${s.html}</details></section><section class="lesson-recap" aria-label="단원 끝 개념 정리"><strong class="track-title">단원 끝 개념 정리</strong></section></article><button id="open-lesson-note" class="button floating-note" type="button" aria-expanded="false" aria-controls="lesson-note-dialog">✎ 강의 보며 필기</button>
<div class="reading-bottom"><label class="complete-label"><input type="checkbox" id="complete-lesson" ${done?'checked':''}>이 단원 공부했어요</label>${s.id<c.sections.length?button(lessonURL(c.id,s.id+1),'다음 단원'):button(`#/quiz/${c.id}`,'복습문제로 확인하기')}</div><nav class="lesson-navigation" aria-label="앞뒤 단원">${s.id>1?`<a href="${lessonURL(c.id,s.id-1)}">← ${esc(c.sections[s.id-2].title)}</a>`:'<span></span>'}${s.id<c.sections.length?`<a href="${lessonURL(c.id,s.id+1)}">${esc(c.sections[s.id].title)} →</a>`:''}</nav></div>`;
  }
  const maps=[{slug:'pk-fk',title:'학생 한 명과 여러 수강 기록',subtitle:'1과목 · 기본키와 외래키',course:1,lesson:4},{slug:'student-model',title:'학생과 과목을 연결하는 수강',subtitle:'1과목 · 관계와 교차 엔터티',course:1,lesson:5},{slug:'normalization',title:'정규화로 정보를 나누기',subtitle:'1과목 · 부분 종속과 이행 종속',course:1,lesson:7},{slug:'sql-order',title:'SQL의 논리적 해석 순서',subtitle:'2과목 · 작성 순서와 해석 순서',course:2,lesson:2}];
  function mapsPage() {return `<header class="page-head"><p class="eyebrow">CONCEPT MAPS</p><h1>흐름이 보이면, 이해가 쉬워져요.</h1><p class="sub">외우기 전에 관계와 순서를 한눈에 살펴보세요.<br>좁은 화면에서는 그림 안을 가로로 움직여 전체를 볼 수 있어요.</p></header><div class="diagram-grid">${maps.map(m=>`<section class="diagram-card" id="map-${m.slug}"><div class="diagram-card-head"><div><h2>${m.title}</h2><p>${m.subtitle}</p></div><a href="diagrams/${m.slug}.html" target="_blank" rel="noopener noreferrer">크게 보기 ↗</a></div><div class="diagram-canvas" tabindex="0" role="region" aria-label="${m.title} 가로 스크롤">${window.STUDY_DIAGRAMS[m.slug]}</div><div class="diagram-card-footer"><a href="${lessonURL(m.course,m.lesson)}">이 개념의 학습자료 읽기 →</a></div></section>`).join('')}</div>`;}
  function termsPage() {
    const sections = courses.map(course => {
      const entries = course.sections.map(section => {
        const terms = section.terms.map(([ko, en, meaning]) =>
          `<dt><b>${esc(ko)}</b> · <span lang="en">${esc(en)}</span></dt><dd>${esc(meaning)}</dd>`
        ).join('');
        return `<h3><a href="${lessonURL(course.id, section.id)}">${section.id}. ${esc(section.title)} ↗</a></h3><dl>${terms}</dl>`;
      }).join('');
      return `<section class="reading-paper prose"><h2>${course.id}과목 · ${esc(course.title)}</h2>${entries}</section>`;
    }).join('');
    return `<header class="page-head"><h1>용어 정리</h1><p>단원 이름을 누르면 해당 예제로 이동해요.</p></header>${sections}`;
  }
  function basicsPage(){
    const all=window.STUDY_BASICS,i=Number.isInteger(route.course)&&route.course>=1&&route.course<=all.length?route.course:1;
    return `<header class="page-head"><p class="eyebrow">BACKGROUND READING</p><h1>추가 개념</h1><p class="sub">SQL을 처음 접할 때 읽는 배경지식이에요. 과목별 진도에는 포함되지 않아요.</p></header><nav class="basics-topics" aria-label="추가 개념 목차">${all.map((t,n)=>`<a href="#/basics/${n+1}" ${n+1===i?'aria-current="page"':''}>${n+1}. ${esc(t.title)}</a>`).join('')}</nav><article class="reading-paper prose"><h2>${esc(all[i-1].title)}</h2>${all[i-1].html}${i===2?`<div class="diagram-canvas" tabindex="0">${window.STUDY_DIAGRAMS['dbms-flow']}</div>`:''}</article>`;
  }
  function savedPage() {
    const units=courses.flatMap(c=>c.sections.filter(s=>state.saved[lessonKey(c.id,s.id)]).map(s=>({c,s})));
    return `<header class="page-head"><p class="eyebrow">BOOKMARKS</p><h1>저장한 단원</h1><p class="sub">헷갈리는 개념을 모아두고, 필요할 때 다시 꺼내보세요.</p></header>${units.length?`<div class="unit-list">${units.map(({c,s})=>`<a class="unit" href="${lessonURL(c.id,s.id)}"><span class="unit-number">★</span><div class="unit-content"><h3>${esc(s.title)}</h3><p>${c.id}과목 · ${esc(s.summary)}</p></div><span class="unit-state">→</span></a>`).join('')}</div>`:`<div class="empty-state"><div class="empty-icon">☆</div><p>아직 저장한 단원이 없어요.<br>학습자료 오른쪽 위의 별을 눌러 저장해 보세요.</p>${button('#/course/1','학습자료 둘러보기',true)}</div>`}`;
  }
  function quizPage(c) {
    const list=c.questions.filter(q=>quizFilter!=='review'||state.quiz[lessonKey(c.id,q.id)]==='review');
    return `<a class="back-link" href="#/course/${c.id}">← ${c.id}과목 학습 목차</a><header class="page-head"><p class="eyebrow">RECALL & REVIEW / SUBJECT 0${c.id}</p><h1>${c.id}과목 복습문제</h1><p class="sub">${c.title}<br>답을 적어본 뒤 해설과 비교하고, 나의 이해도를 표시해 보세요.</p></header><div class="quiz-intro">직접 답하고 스스로 확인하는 복습입니다. ‘알겠어요’와 ‘다시 보기’는 자동 채점 결과가 아닌 나의 학습 표시예요.${c.id===2?' 공통 LOAN·BRANCH 표는 <a href="#/course/2/2">2단원</a>에서 확인할 수 있어요.':''}</div><div class="quiz-filters"><div class="segmented" role="group" aria-label="복습문제 필터"><button data-filter="all" class="${quizFilter==='all'?'active':''}" aria-pressed="${quizFilter==='all'}">전체 ${c.questions.length}</button><button data-filter="review" class="${quizFilter==='review'?'active':''}" aria-pressed="${quizFilter==='review'}">다시 보기 ${c.questions.filter(q=>state.quiz[lessonKey(c.id,q.id)]==='review').length}</button></div><span class="quiz-counter">이해한 문제 ${courseKnown(c)} / ${c.questions.length}</span></div><section aria-label="복습문제 목록">${list.length?list.map(q=>{const key=lessonKey(c.id,q.id),status=state.quiz[key];return `<article class="quiz-card" id="question-${q.id}"><div class="quiz-card-top"><span class="quiz-number">QUESTION ${String(q.id).padStart(2,'0')}</span><span class="quiz-badge ${status||''}">${status==='known'?'✓ 알겠어요':status==='review'?'다시 보기':'아직 확인 전'}</span></div><div class="quiz-question">${q.question}</div><textarea data-draft="${key}" aria-label="${q.id}번 문제 나의 답" placeholder="나의 답이나 풀이를 적어보세요. (선택)">${esc(state.drafts[key]||'')}</textarea><details><summary>해설 확인하기</summary><div class="quiz-answer">${q.answer}</div><div class="quiz-actions"><button data-quiz="${key}" data-status="known" class="${status==='known'?'active':''}" aria-pressed="${status==='known'}">✓ 알겠어요</button><button data-quiz="${key}" data-status="review" class="${status==='review'?'active':''}" aria-pressed="${status==='review'}">다시 보기</button><button data-quiz="${key}" data-status="" aria-label="${q.id}번 학습 표시 지우기">표시 지우기</button></div></details></article>`}).join(''):`<div class="empty-state"><div class="empty-icon">✓</div><p>다시 보기로 표시한 문제가 없어요.</p><button class="button secondary" data-filter="all">전체 문제 보기</button></div>`}</section>`;
  }
  function decorate() {
    document.querySelectorAll('.prose table').forEach(table=>{const wrap=document.createElement('div');wrap.className='table-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','가로로 볼 수 있는 학습 표');table.before(wrap);wrap.append(table);});
    document.querySelectorAll('.prose h3').forEach(h=>{if(h.textContent.includes('주의'))h.classList.add('caution');});
    document.querySelectorAll('.prose p').forEach(p=>{if(p.textContent.startsWith('핵심 한 줄:'))p.classList.add('key-callout');});
  }
  function parseRoute() {
    const parts=location.hash.replace(/^#\/?/,'').split('/');
    const view=parts[0]||'home';
    if(view==='course')return {view:parts[2]?'lesson':'course',course:Number(parts[1]),section:Number(parts[2]),at:Number(parts[3])};
    return {view,course:Number(parts[1]),at:Number(parts[2]),map:view==='maps'?parts[1]:null};
  }
  function render({scroll=true}={}) {
    route=parseRoute();const c=courses.find(c=>c.id===route.course);let title='학습 홈',out;
    if(route.view==='home')out=home();
    else if(route.view==='course'&&c){out=coursePage(c);title=`${c.id}과목 · ${c.title}`;}
    else if(route.view==='lesson'&&c&&c.sections[route.section-1]){out=lessonPage(c,c.sections[route.section-1]);title=`${c.id}과목 · ${c.sections[route.section-1].title}`;}
    else if(route.view==='schedule'&&c){out=schedulePage(c);title=c.id+'과목 강의 시간표';}
    else if(route.view==='quiz'&&c){out=quizPage(c);title=`${c.id}과목 복습문제`;}
    else if(route.view==='settings' || route.view==='notes'){
      route.view='settings';
      title='설정';
      out='<header class="page-head"><h1>설정</h1></header><section class="reading-paper" id="backup-settings"></section>';
    }
    else if(route.view==='terms'){out=termsPage();title='용어 정리';}
    else if(route.view==='maps'){out=mapsPage();title='개념 지도';}
    else if(route.view==='basics'){out=basicsPage();title='추가 개념';}
    else if(route.view==='saved'){out=savedPage();title='저장한 단원';}
    else {out=`<div class="empty-state"><p>찾는 학습 페이지가 없어요.</p>${button('#/home','학습 홈으로')}</div>`;title='페이지를 찾을 수 없어요';}
    stopActiveFlow?.();
    $('#main').innerHTML=out;$('#top-breadcrumb').textContent=title;document.title=`${title} | SQLD 학습 노트`;sidebar();decorate();
    updateReadingPosition();
    document.querySelectorAll('[data-flow]').forEach(bindFlow);
    for (const board of document.querySelectorAll('[data-board-video]')) {
      board.ontoggle = () => {
        if (!board.open) { board.querySelector('iframe')?.remove(); return; }
        if (board.querySelector('iframe')) return;
        const frame = document.createElement('iframe');
        frame.title = '아답터 강의 원본 판서';
        frame.src = 'https://www.youtube-nocookie.com/embed/' + board.dataset.boardVideo + '?start=' + board.dataset.boardStart;
        frame.allowFullscreen = true;
        board.append(frame);
      };
    }
    for (const link of document.querySelectorAll('[data-schedule-time]')) {
      link.onclick = event => {
        if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey)
          history.replaceState(null, '', scheduleURL(c.id,link.dataset.scheduleTime));
      };
    }
    for (const button of document.querySelectorAll('[data-read-target]')) {
      button.onclick = () => document.querySelector(button.dataset.readTarget)?.scrollIntoView({block:'start'});
    }
    if(route.view==='lesson'){
      studyNotes.mountLesson(lessonKey(route.course, route.section));
      // Capture the original sticker anchors before moving their nodes into the recap.
      const recap = $('.lesson-recap');
      for (const selector of ['[data-recap-terms]', '[data-recap-points]']) recap.append($(selector));
      const exam = $('.lesson-supplement details');
      exam.querySelector('summary').textContent = '강사가 짚은 시험 포인트';
      if (!exam.querySelector('.exam-note')) exam.hidden = true;
    }
    if(route.view==='settings') studyNotes.mountSettings();
    if(scroll){window.scrollTo(0,0);$('#main').focus({preventScroll:true});}
    closeMenu();
    if(route.at && (route.view==='schedule' || route.view==='lesson')){
      const row = document.getElementById((route.view==='schedule'?'schedule-':'moment-')+route.at);
      if(row){row.classList.add('current-segment');requestAnimationFrame(()=>row.scrollIntoView({block:'center'}));}
    }
    if(route.map&&maps.some(m=>m.slug===route.map)){requestAnimationFrame(()=>document.getElementById(`map-${route.map}`)?.scrollIntoView({block:'start'}));}
  }
  const mobileQuery=window.matchMedia('(max-width:700px)');
  let tocCollapsed = true;
  try { tocCollapsed = localStorage.getItem('sqld-toc-collapsed') !== 'false'; } catch {}
  function updateMenu(mobileOpen = false) {
    const mobile = mobileQuery.matches;
    const visible = mobile ? mobileOpen : !tocCollapsed;
    const label = visible ? '목차 접기' : '목차 펼치기';
    document.body.classList.toggle('toc-collapsed', !mobile && tocCollapsed);
    $('#sidebar').classList.toggle('open', mobile && visible);
    $('#shade').classList.toggle('open', mobile && visible);
    const toggle = $('#menu-button');
    const host = visible ? $('#sidebar') : document.body;
    if (toggle.parentElement !== host) host.prepend(toggle);
    $('#sidebar').inert = !visible;
    toggle.setAttribute('aria-expanded', String(visible));
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    toggle.textContent = visible ? '‹' : '›';
  }
  function closeMenu() { updateMenu(false); }
  mobileQuery.addEventListener('change', closeMenu);
  $('#menu-button').addEventListener('click', () => {
    if (mobileQuery.matches) {
      updateMenu(!$('#sidebar').classList.contains('open'));
      $('#menu-button').focus({preventScroll:true});
      return;
    }
    tocCollapsed = !tocCollapsed;
    try { localStorage.setItem('sqld-toc-collapsed', String(tocCollapsed)); } catch {}
    updateMenu();
    $('#menu-button').focus({preventScroll:true});
  });
  $('#shade').addEventListener('click',closeMenu);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  document.addEventListener('click',e=>{
    const step = e.target.closest('.reading-align [data-step]');
    if (step) {
      readingPosition = Math.max(0, Math.min(2, readingPosition + Number(step.dataset.step)));
      updateReadingPosition();
      try { localStorage.setItem('sqld-reading-alignment', alignments[readingPosition]); } catch {}
      return;
    }
    if(e.target.closest('.skip-link')){e.preventDefault();$('#main').focus();$('#main').scrollIntoView({block:'start'});return;}
    if(e.target.closest('#save-lesson')){const key=lessonKey(route.course,route.section);state.saved[key]=!state.saved[key];persist();render({scroll:false});toast(state.saved[key]?'단원을 저장했어요.':'단원 저장을 해제했어요.');}
    if(e.target.closest('#print-button'))window.print();
    const f=e.target.closest('[data-filter]');if(f){quizFilter=f.dataset.filter;render({scroll:false});}
    const q=e.target.closest('[data-quiz]');if(q){const key=q.dataset.quiz;state.quiz[key]=q.dataset.status;persist();const id=q.closest('.quiz-card').id;const y=window.scrollY;render({scroll:false});const card=document.getElementById(id);if(card){card.querySelector('details').open=true;card.querySelector(`[data-status="${q.dataset.status}"]`)?.focus({preventScroll:true});}window.scrollTo(0,y);toast(q.dataset.status==='known'?'이해한 문제로 표시했어요.':q.dataset.status==='review'?'다시 볼 문제에 추가했어요.':'학습 표시를 지웠어요.');}
  });
  document.addEventListener('change',e=>{if(e.target.id==='complete-lesson'){state.done[lessonKey(route.course,route.section)]=e.target.checked;persist();sidebar();toast(e.target.checked?'한 단원 완료! 차근차근 쌓이고 있어요.':'완료 표시를 해제했어요.');}});
  document.addEventListener('change', e => {
    if (!e.target.matches('[data-video]')) return;
    state.videos[e.target.dataset.video] = e.target.checked;
    persist();
    $('#video-count').textContent = `${videoCount()} / 2강 완료`;
  });
  document.addEventListener('input',e=>{if(e.target.matches('[data-draft]')){state.drafts[e.target.dataset.draft]=e.target.value;persist();}});
  const searchDialog=$('#search-dialog'),input=$('#search-input');
  function search(){const term=input.value.trim().toLocaleLowerCase();if(!term){$('#search-results').innerHTML='';$('#search-help').textContent='시험 단원과 추가 개념에서 찾아요.';return;}
    const hits=courses.flatMap(c=>c.sections.map(s=>({c,s}))).filter(({s})=>`${s.title} ${s.search}`.toLocaleLowerCase().includes(term));
    const extra=window.STUDY_BASICS.map((x,i)=>({...x,i})).filter(x=>(x.title+' '+plain(x.html)).toLocaleLowerCase().includes(term));
    $('#search-help').textContent=`시험 단원 ${hits.length}개 · 추가 개념 ${extra.length}개`;
    $('#search-results').innerHTML=hits.length?hits.map(({c,s})=>{const i=s.search.toLocaleLowerCase().indexOf(term),start=Math.max(0,i-32),snippet=s.search.slice(start,start+125);return `<a class="search-result" href="${lessonURL(c.id,s.id)}"><small>${c.id}과목 · ${String(s.id).padStart(2,'0')}단원</small><strong>${esc(s.title)}</strong><p>${start?'…':''}${esc(snippet)}…</p></a>`;}).join(''):extra.length?'':'<p class="search-empty">검색 결과가 없어요. 다른 용어나 짧은 검색어로 찾아보세요.</p>';
    $('#search-results').insertAdjacentHTML('beforeend',extra.map(x=>`<a class="search-result" href="#/basics/${x.i+1}"><small>추가 개념</small><strong>${esc(x.title)}</strong></a>`).join(''));
  }
  function openSearch(){searchDialog.showModal();input.value='';search();input.focus();}
  $('#search-trigger').addEventListener('click',openSearch);$('#search-close').addEventListener('click',()=>searchDialog.close());input.addEventListener('input',search);
  $('#search-results').addEventListener('click',e=>{if(e.target.closest('a'))searchDialog.close();});
  input.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();$('#search-results a')?.focus();}if(e.key==='Enter'){const first=$('#search-results a');if(first){location.hash=first.hash;searchDialog.close();}}});
  searchDialog.addEventListener('click',e=>{if(e.target===searchDialog){const r=searchDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)searchDialog.close();}});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!searchDialog.open)openSearch();}});
  window.addEventListener('hashchange',()=>{quizFilter='all';render();});
  window.addEventListener('storage',e=>{if(e.key===KEY){try{const next=JSON.parse(e.newValue||'{}');for(const key of Object.keys(state))state[key]=next[key]&&typeof next[key]==='object'?next[key]:{};render({scroll:false});}catch{}}});
  if (!location.hash) {
    const nextCourse = courses.find(course => course.sections.some(section => !state.done[lessonKey(course.id, section.id)])) || courses[0];
    const nextSection = nextCourse.sections.find(section => !state.done[lessonKey(nextCourse.id, section.id)]) || nextCourse.sections[0];
    history.replaceState(null, '', lessonURL(nextCourse.id, nextSection.id));
  }
  render();
})();
