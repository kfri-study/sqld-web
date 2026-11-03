const studyNotes = (() => {
  const storageKey = 'sqld-personal-notes-v1';
  const units = new Map(window.STUDY_CONTENT.flatMap(c =>
    c.sections.map(s => [c.id + '-' + s.id, c.id + '과목 · ' + s.id + '. ' + s.title])));
  let notes = Object.create(null);
  let selected = units.keys().next().value;
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
  function mount(key) {
    const root = document.getElementById('personal-notes');
    if (!root) return;
    if (units.has(key)) selected = key;
    root.innerHTML = '<label class="note-unit">메모할 단원 <select></select></label><label class="note-label">내 메모<textarea rows="6" placeholder="강사가 강조한 점이나 헷갈린 내용을 적어 보세요."></textarea></label><p class="note-status" role="status"></p><div class="note-actions"><button type="button" data-save>전체 노트 파일로 저장</button><button type="button" data-location hidden>다른 위치에 저장</button><button type="button" data-open>내 파일 열기</button><input type="file" accept=".json,.txt,.md" hidden></div><p data-destination></p><small>JSON은 모든 단원의 백업 파일이에요. TXT·MD는 선택한 단원의 메모로 열어요.</small>';
    const select = root.querySelector('select');
    const editor = root.querySelector('textarea');
    const status = root.querySelector('[role=status]');
    const picker = root.querySelector('input');
    for (const [id, title] of units) select.add(new Option(title, id));
    select.value = selected;
    select.closest('label').hidden = units.has(key);
    editor.value = notes[selected] || '';
    const unit = () => select.value;
    status.textContent = storageAvailable ? '입력하면 이 브라우저에 자동 저장돼요.' : '브라우저 저장이 제한돼요. 파일로 저장해 주세요.';
    select.onchange = () => {
      selected = unit();
      editor.value = notes[selected] || '';
      status.textContent = storageAvailable ? '선택한 단원의 메모예요.' : '파일로 저장해 주세요.';
    };
    editor.oninput = () => {
      if (editor.value) notes[unit()] = editor.value;
      else delete notes[unit()];
      status.textContent = persist() ? '이 브라우저에 저장했어요.' : '브라우저에 저장하지 못했어요. 파일로 저장해 주세요.';
    };
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
      const destination = unit();
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
        editor.value = notes[unit()] || '';
        status.textContent = saved ? '파일을 읽고 이 브라우저에 저장했어요.' : '파일을 읽었어요. 브라우저 저장 공간이 부족해요.';
      } catch {status.textContent = '파일을 읽을 수 없어요. SQLD 백업 JSON 또는 UTF-8 TXT·MD 파일을 선택해 주세요.';}
    };
  }
  return {mount};
})();
