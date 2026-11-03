const studyNotes = (() => {
  const storageKey = 'sqld-personal-notes-v1';
  const units = new Map(window.STUDY_CONTENT.flatMap(c =>
    c.sections.map(s => [c.id + '-' + s.id, c.id + '과목 · ' + s.id + '. ' + s.title])));
  let notes = Object.create(null);
  let storageAvailable = true;

  let backupFile = null;
  const supportsLocation = typeof window.showSaveFilePicker === 'function';
  const locationDB = supportsLocation ? new Promise(resolve => {
    try {
      const request = indexedDB.open('sqld-backup-location', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('location');
      request.onsuccess = () => resolve(request.result);
      request.onerror = request.onblocked = () => resolve(null);
    } catch { resolve(null); }
  }) : Promise.resolve(null);
  const locationReady = locationDB.then(db => new Promise(resolve => {
    if (!db) return resolve();
    const read = db.transaction('location').objectStore('location').get('file');
    read.onsuccess = () => { backupFile = read.result || null; resolve(); };
    read.onerror = () => resolve();
  })).catch(() => {});
  async function rememberLocation(handle) {
    const db = await locationDB;
    if (!db) return false;
    return new Promise(resolve => {
      try {
        const tx = db.transaction('location', 'readwrite');
        tx.objectStore('location').put(handle, 'file');
        tx.oncomplete = () => resolve(true);
        tx.onerror = tx.onabort = () => resolve(false);
      } catch { resolve(false); }
    });
  }

  function validate(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('format');
    for (const [key, value] of Object.entries(data)) {
      if (!units.has(key) || typeof value !== 'string') throw Error('format');
    }
    return data;
  }
  try {
    notes = validate(JSON.parse(localStorage.getItem(storageKey) || '{}'));
  } catch { storageAvailable = false; }

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notes));
      storageAvailable = true;
    } catch { storageAvailable = false; }
    return storageAvailable;
  }
  const panel = document.getElementById('lesson-note-dialog');
  const dock = panel.querySelector('[data-dock]');
  const grip = panel.querySelector('h2');
  let position = {mode:'right', x:16, y:16};
  try {
    const old = JSON.parse(localStorage.getItem('sqld-panel-position'));
    if (old && ['left','center','right','free'].includes(old.mode) && Number.isFinite(old.x) && Number.isFinite(old.y)) position = old;
  } catch {}
  function place() {
    dock.value = panel.dataset.dock = position.mode;
    panel.querySelector('[data-dock-step="-1"]').disabled = position.mode === 'left';
    panel.querySelector('[data-dock-step="1"]').disabled = position.mode === 'right';
    if (position.mode === 'free' && !panel.hidden) {
      panel.style.left = Math.max(0, Math.min(position.x, innerWidth - panel.offsetWidth)) + 'px';
      panel.style.top = Math.max(0, Math.min(position.y, innerHeight - panel.offsetHeight)) + 'px';
    } else {
      panel.style.left = panel.style.top = '';
    }
  }
  function rememberPosition() {
    try { localStorage.setItem('sqld-panel-position', JSON.stringify(position)); } catch {}
  }
  dock.onchange = () => {
    const rect = panel.getBoundingClientRect();
    position = {mode:dock.value, x:rect.left, y:rect.top};
    place();
    rememberPosition();
  };
  for (const arrow of panel.querySelectorAll('[data-dock-step]')) {
    arrow.onclick = () => {
      const stops = ['left', 'center', 'right'];
      const current = position.mode === 'free' ? 1 : stops.indexOf(position.mode);
      dock.value = stops[Math.max(0, Math.min(2, current + Number(arrow.dataset.dockStep)))];
      dock.onchange();
    };
  }
  let drag;
  grip.onpointerdown = event => {
    if (event.button !== 0 || !event.isPrimary) return;
    const rect = panel.getBoundingClientRect();
    drag = [event.clientX - rect.left, event.clientY - rect.top];
    grip.setPointerCapture(event.pointerId);
  };
  grip.onpointermove = event => {
    if (!drag || !event.isPrimary) return;
    position = {mode:'free', x:event.clientX - drag[0], y:event.clientY - drag[1]};
    place();
  };
  grip.onlostpointercapture = () => { drag = null; rememberPosition(); };
  window.addEventListener('resize', place);
  let firstLesson = true;
  const openPreference = 'sqld-panel-open';
  function rememberOpen(open) {
    try { localStorage.setItem(openPreference, String(open)); } catch {}
  }
  function mountLesson(key) {
    const root = document.getElementById('personal-notes');
    if (!root || !units.has(key)) return;
    root.innerHTML = `<label>이 단원의 메모<textarea rows="6" placeholder="헷갈린 개념이나 오답 이유를 적어 보세요."></textarea></label>
      <p class="note-status" role="status"></p><a href="#/settings">백업 설정 ↗</a>`;
    const editor = root.querySelector('textarea');
    const status = root.querySelector('[role=status]');
    editor.value = notes[key] || '';
    const popup = document.getElementById('lesson-note-dialog');
    const opener = document.getElementById('open-lesson-note');
    popup.querySelector('[data-note-unit]').textContent = '필기 단원 · ' + units.get(key);
    opener.hidden = !popup.hidden;
    opener.setAttribute('aria-expanded', String(!popup.hidden));
    const lecture = document.querySelector('.lesson-lecture a[href*="youtube.com/watch"]');
    const player = popup.querySelector('iframe');
    const external = popup.querySelector('[data-youtube]');
    function openAlongside(link, interactive = true) {
      if (link) {
        const url = new URL(link.href);
        const video = url.searchParams.get('v');
        const seconds = parseInt(url.searchParams.get('t'), 10) || 0;
        const source = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(video) + '?start=' + seconds;
        if (player.getAttribute('src') !== source) player.src = source;
        external.href = url.href;
      }
      popup.hidden = false;
      place();
      opener.hidden = true;
      opener.setAttribute('aria-expanded', 'true');
      if (interactive) {
        rememberOpen(true);
        editor.focus({preventScroll:true});
      }
    }
    function closePanel() {
      rememberOpen(false);
      player.removeAttribute('src');
      popup.hidden = true;
      opener.hidden = false;
      opener.setAttribute('aria-expanded', 'false');
      if (opener.isConnected) opener.focus({preventScroll:true});
    }
    if (firstLesson) {
      firstLesson = false;
      let startOpen = window.matchMedia('(min-width: 701px)').matches;
      try {
        const saved = localStorage.getItem(openPreference);
        if (saved !== null) startOpen = saved === 'true';
      } catch {}
      if (startOpen) openAlongside(lecture, false);
    }
    opener.onclick = () => openAlongside(lecture);
    document.querySelectorAll('.reading-paper.prose a[href^="https://www.youtube.com/watch"]').forEach(link => {
      link.onclick = event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        openAlongside(link);
      };
    });
    popup.querySelector('[data-close-note]').onclick = closePanel;
    popup.onkeydown = event => { if (event.key === 'Escape') closePanel(); };
    status.textContent = storageAvailable ? '입력하면 이 브라우저에 자동 저장돼요.' : '브라우저 저장이 제한돼요. 설정에서 파일로 백업해 주세요.';
    editor.oninput = () => {
      if (editor.value) notes[key] = editor.value;
      else delete notes[key];
      status.textContent = persist() ? '이 브라우저에 저장했어요.' : '설정에서 파일로 백업해 주세요.';
    };
  }
  function mountSettings() {
    const root = document.getElementById('backup-settings');
    root.innerHTML = `<h2>노트 백업 위치</h2><p data-destination></p>
      <div class="note-actions"><button type="button" data-save disabled>백업 위치 확인 중</button><button type="button" data-location hidden>다른 위치에 저장</button></div>
      <p>백업 버튼을 누르면 모든 단원의 메모가 한 파일에 저장돼요.</p>
      <h2>노트 복원</h2><p>JSON 백업은 원래 단원으로 복원돼요. TXT·MD 파일은 아래에서 고른 단원으로 가져와요.</p>
      <label>TXT·MD를 가져올 단원 <select></select></label>
      <div class="note-actions"><button type="button" data-open>내 파일 열기</button><input type="file" accept=".json,.txt,.md" hidden></div>
      <p class="note-status" role="status"></p>`;
    const select = root.querySelector('select');
    for (const [id, title] of units) select.add(new Option(title, id));
    const status = root.querySelector('[role=status]');
    const picker = root.querySelector('input');
    const saveButton = root.querySelector('[data-save]');
    const changeButton = root.querySelector('[data-location]');
    function showLocation() {
      saveButton.textContent = supportsLocation
        ? (backupFile ? '지정한 파일에 백업' : '백업 위치 지정하고 저장')
        : '백업 파일 다운로드';
      changeButton.hidden = !supportsLocation || !backupFile;
      root.querySelector('[data-destination]').textContent = supportsLocation
        ? (backupFile ? '백업 파일 · ' + backupFile.name : '첫 백업 때 폴더와 파일 이름을 선택하세요.')
        : '다운로드 위치는 브라우저의 다운로드 설정을 따라요.';
      saveButton.disabled = false;
    }
    saveButton.disabled = true;
    locationReady.then(showLocation);
    async function saveFile(chooseLocation) {
      const blob = new Blob([JSON.stringify({format:'sqld-notes', version:1, notes}, null, 2)], {type:'application/json'});
      saveButton.disabled = changeButton.disabled = true;
      try {
        if (supportsLocation) {
          const handle = chooseLocation || !backupFile
            ? await window.showSaveFilePicker({id:'sqld-notes', suggestedName:'sqld-notes.json', types:[{description:'SQLD 노트', accept:{'application/json':['.json']}}]})
            : backupFile;
          if (handle === backupFile && await handle.requestPermission({mode:'readwrite'}) !== 'granted') {
            status.textContent = '쓰기 권한이 필요해요. 다시 허용하거나 다른 위치를 선택하세요.';
            return;
          }
          const writer = await handle.createWritable();
          await writer.write(blob);
          await writer.close();
          backupFile = handle;
          const remembered = await rememberLocation(handle);
          status.textContent = remembered ? '지정한 파일에 백업했어요.' : '백업했어요. 다음 방문에는 위치를 다시 선택해 주세요.';
        } else {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'sqld-notes.json';
          link.click();
          setTimeout(() => URL.revokeObjectURL(link.href), 30000);
          status.textContent = '노트 파일 다운로드를 요청했어요.';
        }
      } catch (err) {
        status.textContent = err.name === 'AbortError' ? '백업을 취소했어요.' : '파일을 저장하지 못했어요. 다른 위치를 선택하거나 쓰기 권한을 확인해 주세요.';
      } finally {
        changeButton.disabled = false;
        showLocation();
      }
    }
    saveButton.onclick = () => saveFile(false);
    changeButton.onclick = () => saveFile(true);
    root.querySelector('[data-open]').onclick = () => picker.click();
    picker.onchange = async () => {
      const file = picker.files[0];
      const destination = select.value;
      if (!file) return;
      picker.value = '';
      try {
        const contents = await file.text();
        let incoming;
        if (/\.json$/i.test(file.name)) {
          const parsed = JSON.parse(contents.replace(/^\uFEFF/, ''));
          if (parsed.format !== 'sqld-notes' || parsed.version !== 1) throw Error('format');
          incoming = validate(parsed.notes);
        } else if (/\.(txt|md)$/i.test(file.name)) incoming = {[destination]: contents};
        else throw Error('format');
        const conflicts = Object.keys(incoming).filter(id => notes[id] && notes[id] !== incoming[id]);
        if (conflicts.length && !confirm('이미 작성한 ' + conflicts.length + '개 단원의 메모가 달라요. 파일 내용으로 바꿀까요?')) return;
        Object.assign(notes, incoming);
        const saved = persist();
        status.textContent = saved ? '파일을 읽고 이 브라우저에 저장했어요.' : '파일을 읽었어요. 브라우저 저장 공간이 부족해요.';
      } catch {status.textContent = '파일을 읽을 수 없어요. SQLD 백업 JSON 또는 UTF-8 TXT·MD 파일을 선택해 주세요.';}
    };
  }
  return {mountLesson, mountSettings};
})();
