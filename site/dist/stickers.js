const lessonStickers = (() => {
  const key = 'sqld-lesson-stickers-v1';
  function validate(items) {
    if (!Array.isArray(items) || items.some(s => !s || typeof s.id !== 'string' ||
      !window.STUDY_CONTENT.some(c => c.sections.some(u => c.id+'-'+u.id === s.unit)) ||
      typeof s.text !== 'string' || !Number.isInteger(s.anchor) || s.anchor < 0 ||
      !Number.isFinite(s.x) || s.x < 0 || s.x > 1)) throw Error('format');
    return items;
  }
  let items = [];
  try { items = validate(JSON.parse(localStorage.getItem(key) || '[]')); } catch {}
  function save(next) {
    localStorage.setItem(key, JSON.stringify(next));
    items = next;
  }
  function mount(unit, editor, button, status) {
    const page = document.querySelector('.reading-layout');
    const anchors = [...page.querySelectorAll('.reading-head, .reading-paper h2, .reading-paper h3, .reading-paper p, .reading-paper ul, .reading-paper ol, .reading-paper table, .reading-paper dl, .reading-paper pre, .diagram-canvas, .reading-bottom')];
    const legacyTimes = [[6, 61, 82, 110, 137, 162, 359, 371, 503, 662, 799, 914, 1163, 1215, 1312, 1447, 1634, 1720, 1746, 1918, 2117, 2226, 2444, 2515, 2585, 2610, 2717, 2732, 2881], [6, 82, 166, 286, 380, 398, 700, 863, 1231, 1381, 1491, 1549, 1566, 1743, 1928, 1948, 1950, 2135, 2312, 2325, 2470, 2730, 3051, 3062, 3158, 3310, 3560, 3723, 3940, 4154, 4280, 4355, 4397, 4423, 4557, 4750, 4998]];
    const moments = [...page.querySelectorAll('.moment')];
    const originalCount = anchors.length;
    const legacy = legacyTimes[Number(unit.split('-')[0])-1];
    for (const time of legacy) anchors.push(document.getElementById('moment-'+time));
    anchors.push(...moments.filter(el=>!legacy.includes(Number(el.id.slice(7)))));
    function draw(s) {
      const note = document.createElement('aside');
      note.className = 'study-sticker';
      note.style.marginLeft = 'min('+100*s.x+'%, max(0px, 100% - 17rem))';
      note.innerHTML = '<strong>내 스티커</strong><p></p><button type="button">편집</button> <button type="button">삭제</button>';
      note.querySelector('p').textContent = s.text;
      const [edit, remove] = note.querySelectorAll('button');
      edit.onclick = () => {
        const value = prompt('스티커 내용 편집', s.text);
        if (!value?.trim()) return;
        const updated = {...s, text:value.trim()};
        try { save(items.map(i => i.id === s.id ? updated : i)); }
        catch { alert('저장 공간을 확인해 주세요.'); return; }
        s = updated;
        note.querySelector('p').textContent = s.text;
      };
      remove.onclick = () => {
        if (!confirm('이 스티커를 삭제할까요?')) return;
        try { save(items.filter(i => i.id !== s.id)); note.remove(); }
        catch { alert('삭제 내용을 저장하지 못했어요.'); }
      };
      const target = s.moment ? document.getElementById(s.moment) : anchors[s.anchor];
      (target || anchors[originalCount-1]).after(note);
    }
    items.filter(s => s.unit === unit).forEach(draw);
    let pending = false;
    button.onclick = () => {
      pending = !pending && !!editor.value.trim();
      button.textContent = pending ? '붙이기 취소' : '스티커 발행';
      page.classList.toggle('placing-sticker',pending);
      status.textContent = pending ? '스크롤해서 붙이고 싶은 곳을 눌러 주세요.' : editor.value.trim() ? '붙이기를 취소했어요.' : '먼저 메모를 입력해 주세요.';
    };
    page.addEventListener('click', e => {
      if (!pending || e.target.closest('#open-lesson-note')) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const distance = el => {
        if (!el) return Infinity;
        const r = el.getBoundingClientRect();
        if (!r.height) return Infinity;
        return Math.max(r.top-e.clientY, e.clientY-r.bottom, 0);
      };
      const anchor = anchors.reduce((best,el,i) => distance(el)<distance(anchors[best]) ? i : best,0);
      const r = anchors[anchor].getBoundingClientRect();
      const s = {id:crypto.randomUUID(),unit,text:editor.value.trim(),anchor,x:Math.max(0,Math.min(1,(e.clientX-r.left)/Math.max(1,r.width)))};
      if (anchors[anchor].classList.contains('moment')) s.moment = anchors[anchor].id;
      if (!s.text) return;
      try { save([...items,s]); } catch { status.textContent='저장 공간을 확인해 주세요.'; return; }
      draw(s);
      pending = false;
      button.textContent = '스티커 발행';
      page.classList.remove('placing-sticker');
      status.textContent='이 단원에 스티커를 붙였어요.';
    }, true);
  }
  return {mount,validate,all:()=>items,restore(incoming) {
    const merged = new Map(items.map(s=>[s.id,s]));
    for (const s of incoming) merged.set(s.id,s);
    save([...merged.values()]);
  }};
})();
