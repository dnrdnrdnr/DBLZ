// 데이터 구조
let appData = {
  brainDump: [],
  brainDumpHistory: {}, // { "YYYY-MM-DD": [ { id, text, dateAdded } ], ... }
  todos: [], // { id, text, quadrant, period, status, createdAt, dueDate }
  lastUpdated: null
};


// 초기화
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  updateUI();
  // 초기 뷰 설정 (쏟아내기 화면)
  switchView('brainDump');
  // 휴지통 버튼 표시
  setTimeout(() => {
    updateTrashButton();
    // 휴지통 버튼이 항상 표시되도록 강제
    const trashBtn = document.getElementById('trashButton');
    if (trashBtn) {
      trashBtn.style.display = 'flex';
    }
  }, 100);
});

// 이벤트 리스너 설정
function setupEventListeners() {
  // 뷰 탭 전환
  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const viewName = tab.dataset.view;
      switchView(viewName);
    });
  });
  
  // Brain dump
  document.getElementById('addBrainDumpBtn').addEventListener('click', addBrainDumpItem);
  document.getElementById('brainDumpInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBrainDumpItem();
    }
  });
  document.getElementById('startCategorizeBtn').addEventListener('click', startCategorize);
  document.getElementById('clearBrainDumpBtn').addEventListener('click', clearBrainDump);
  document.getElementById('brainDumpDateBtn').addEventListener('click', openDatePickerModal);

  // 분류 모달 버튼
  document.getElementById('nextStepBtn').addEventListener('click', nextCategorizeStep);
  document.getElementById('cancelCategorizeBtn').addEventListener('click', () => {
    const catModal = document.getElementById('categorizeModal');
    catModal.classList.remove('active', 'categorize-modal-fullscreen');
    catModal.querySelector('.modal-content')?.classList.remove('categorize-modal-one-screen');
    catModal.querySelector('.drag-drop-container')?.classList.remove('mobile-stack-layout');
    updateTrashButton();
  });
  
  
  // 매트릭스 할 일 추가
  document.querySelectorAll('.add-todo-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const quadrant = e.target.dataset.quadrant;
      openAddTodoModal(quadrant);
    });
  });

  // 매트릭스 사분면 드래그 앤 드롭
  setupMatrixDragDrop();
  
  // 모달 닫기 버튼
  document.querySelectorAll('.close').forEach(close => {
    close.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
        if (modal.id === 'categorizeModal') {
          modal.classList.remove('categorize-modal-fullscreen');
          modal.querySelector('.modal-content')?.classList.remove('categorize-modal-one-screen');
          modal.querySelector('.drag-drop-container')?.classList.remove('mobile-stack-layout');
          updateTrashButton();
        }
      }
      if (modal && modal.id !== 'trashModal') {
        closeModals();
      }
    });
  });
  
  document.getElementById('saveTodoBtn').addEventListener('click', saveTodo);
  document.getElementById('cancelTodoBtn').addEventListener('click', closeModals);
  
  // 액션 버튼
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      handleTodoAction(e.target.dataset.action);
    });
  });
  
  // 모달 외부 클릭 시 닫기
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      const modal = e.target;
      if (modal.id === 'categorizeModal') {
        modal.classList.remove('active', 'categorize-modal-fullscreen');
        modal.querySelector('.modal-content')?.classList.remove('categorize-modal-one-screen');
        modal.querySelector('.drag-drop-container')?.classList.remove('mobile-stack-layout');
        updateTrashButton();
      } else if (modal.id === 'datePickerModal') {
        modal.classList.remove('active');
      } else {
        closeModals();
      }
    }
  });
  
  // 휴지통 버튼
  const trashButton = document.getElementById('trashButton');
  if (trashButton) {
    trashButton.addEventListener('click', openTrashModal);
  }
  
  // 휴지통 모달 버튼들
  const closeTrashBtn = document.getElementById('closeTrashBtn');
  const emptyTrashBtn = document.getElementById('emptyTrashBtn');
  
  if (closeTrashBtn) {
    closeTrashBtn.addEventListener('click', () => {
      document.getElementById('trashModal').classList.remove('active');
    });
  }
  
  if (emptyTrashBtn) {
    emptyTrashBtn.addEventListener('click', () => {
      const trashCount = appData.todos.filter(t => t.status === 'trash').length;
      if (trashCount === 0) {
        alert('휴지통이 이미 비어있습니다.');
        return;
      }
      
      if (confirm(`휴지통의 모든 항목(${trashCount}개)을 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
        // 휴지통의 모든 항목 완전히 삭제
        appData.todos = appData.todos.filter(t => t.status !== 'trash');
        saveData();
        updateTrashModal();
        updateTrashButton();
        updateMatrixView();
        alert('휴지통이 비워졌습니다.');
      }
    });
  }
}

// 뷰 전환
function switchView(viewName) {
  // 모든 뷰 숨기기
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  
  // 모든 탭 비활성화
  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // 선택한 뷰 표시
  let targetView = null;
  switch(viewName) {
    case 'brainDump':
      targetView = document.getElementById('brainDumpView');
      document.querySelector('.view-tab[data-view="brainDump"]').classList.add('active');
      updateBrainDumpView();
      updateBrainDumpBanner();
      break;
    case 'matrix':
      targetView = document.getElementById('matrixView');
      document.querySelector('.view-tab[data-view="matrix"]').classList.add('active');
      updateMatrixView();
      break;
    case 'execution':
      targetView = document.getElementById('executionView');
      document.querySelector('.view-tab[data-view="execution"]').classList.add('active');
      break;
  }
  
  if (targetView) {
    targetView.classList.add('active');
  }
}


// 오늘 날짜 문자열 (YYYY-MM-DD)
function getTodayDateString() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// 날짜 포맷 (표시용)
function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return dateStr + ' (' + weekdays[d.getDay()] + ')';
}

// 시간 포맷 (추가 시각 표시)
function formatTimeDisplay(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

// 날짜 짧게 표시 (오른쪽 라벨용, ISO 문자열 → M/D)
function formatDateShort(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return m + '/' + day;
}

// Brain dump 아이템 추가 (선택한 날짜에 추가)
function addBrainDumpItem() {
  const input = document.getElementById('brainDumpInput');
  const text = input.value.trim();
  if (!text) return;
  if (!selectedDumpDate) selectedDumpDate = getTodayDateString();
  const dateStr = selectedDumpDate;
  if (!appData.brainDumpHistory[dateStr]) appData.brainDumpHistory[dateStr] = [];

  const lines = text.split('\n').filter(line => line.trim());
  const today = getTodayDateString();
  lines.forEach(line => {
    if (line.trim()) {
      const dateAdded = new Date().toISOString();
      const item = { id: Date.now() + Math.random(), text: line.trim(), dateAdded };
      appData.brainDumpHistory[dateStr].push(item);
      if (dateStr === today) appData.brainDump.push(item);
    }
  });

  input.value = '';
  updateBrainDumpView();
  updateBrainDumpBanner();
  saveData();
}

// 선택한 날짜에 해당하는 쏟아내기 목록 반환 (오늘은 live brainDump, 그 외는 히스토리)
function getDumpListForDate(dateStr) {
  const today = getTodayDateString();
  const d = dateStr || today;
  return d === today ? appData.brainDump : (appData.brainDumpHistory[d] || []);
}

// 선택한 날짜에 따른 버튼 라벨 (오늘 / 어제 / N일 전 / N일 후)
function getDateButtonLabel(dateStr) {
  if (!dateStr) return '오늘';
  const today = getTodayDateString();
  if (dateStr === today) return '오늘';
  const a = new Date(dateStr + 'T12:00:00');
  const b = new Date(getTodayDateString() + 'T12:00:00');
  const diffDays = Math.round((b - a) / (24 * 60 * 60 * 1000));
  if (diffDays === 1) return '어제';
  if (diffDays > 1 && diffDays <= 1095) return diffDays + '일 전';
  if (diffDays > 1095) return formatDateDisplay(dateStr);
  if (diffDays === -1) return '내일';
  if (diffDays < -1 && diffDays >= -1095) return Math.abs(diffDays) + '일 후';
  if (diffDays < -1095) return formatDateDisplay(dateStr);
  return formatDateDisplay(dateStr);
}

// 메인 상단 날짜 표시(왼쪽) + 버튼 라벨 + 오늘 여부에 따라 입력란 표시
function updateSelectedDateDisplay() {
  if (!selectedDumpDate) selectedDumpDate = getTodayDateString();
  const dateTextEl = document.getElementById('brainDumpDateText');
  const labelEl = document.getElementById('brainDumpDateBtnLabel');
  const mainEl = document.getElementById('brainDumpMain');
  const inputWrap = document.getElementById('brainDumpInputWrap');
  const subtitleEl = document.getElementById('brainDumpSubtitle');
  if (dateTextEl) dateTextEl.textContent = formatDateDisplay(selectedDumpDate);
  if (labelEl) labelEl.textContent = getDateButtonLabel(selectedDumpDate);
  const today = getTodayDateString();
  const isToday = selectedDumpDate === today;
  if (mainEl) mainEl.classList.toggle('is-today', isToday);
  if (inputWrap) inputWrap.style.display = isToday ? '' : 'none';
  if (subtitleEl) subtitleEl.textContent = isToday
    ? '할 일을 적고 추가한 뒤, 날짜 버튼을 눌러 다른 날을 확인할 수 있어요'
    : '선택한 날짜에 쏟아낸 할 일이에요. 오늘을 누르면 새로 적을 수 있어요';
}

// 배너의 '쏟아낸 할일' 리스트 업데이트 (선택한 날짜 기준)
function updateBrainDumpList() {
  if (!selectedDumpDate) selectedDumpDate = getTodayDateString();
  const list = document.getElementById('brainDumpList');
  const startBtn = document.getElementById('startCategorizeBtn');
  if (!list) return;
  
  const items = getDumpListForDate(selectedDumpDate);
  list.innerHTML = '';
  
  const today = getTodayDateString();
  const canCategorize = selectedDumpDate === today && items.length > 0;
  const isReadOnly = selectedDumpDate !== today;
  if (startBtn) startBtn.disabled = !canCategorize;
  list.classList.toggle('is-readonly', isReadOnly);

  items.forEach(item => {
    const li = document.createElement('li');
    const dateStr = item.dateAdded ? formatDateShort(item.dateAdded) : '';
    li.innerHTML = `
      <span class="brain-dump-item-text">${escapeHtml(item.text)}</span>
      <span class="brain-dump-item-date">${dateStr}</span>
      ${isReadOnly ? '' : `<button class="remove-btn" data-id="${item.id}">삭제</button>`}
    `;
    if (!isReadOnly) {
      const removeBtn = li.querySelector('.remove-btn');
      if (removeBtn) removeBtn.addEventListener('click', () => removeBrainDumpItem(item.id));
    }
    list.appendChild(li);
  });

  updateUnclassifiedDumpList();
  updateClassifiedDumpList();
}

// Brain dump 뷰 업데이트 (날짜 표시 + 배너 리스트)
function updateBrainDumpView() {
  if (!selectedDumpDate) selectedDumpDate = getTodayDateString();
  updateSelectedDateDisplay();
  updateBrainDumpList();
}

// 사이드바 '분류 안한 할일' 목록 업데이트
function updateUnclassifiedDumpList() {
  const listEl = document.getElementById('unclassifiedDumpList');
  if (!listEl) return;
  listEl.innerHTML = '';
  if (!appData.brainDump || appData.brainDump.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'unclassified-dump-empty';
    empty.textContent = '없습니다';
    listEl.appendChild(empty);
    return;
  }
  appData.brainDump.forEach(item => {
    const li = document.createElement('li');
    const dateStr = item.dateAdded ? formatDateShort(item.dateAdded) : '';
    li.className = 'unclassified-dump-item';
    li.innerHTML = `<span class="unclassified-dump-text">${escapeHtml(item.text)}</span><span class="unclassified-dump-date">${dateStr}</span>`;
    listEl.appendChild(li);
  });
}

// 사분면 라벨 (표시용)
const QUADRANT_LABELS = { 1: '중요·긴급', 2: '중요·비긴급', 3: '긴급·비중요', 4: '비중요·비긴급' };

// 사이드바 '분류된 할일' 목록 업데이트 (오늘 쏟아낸 것 중 분류 완료된 항목)
function updateClassifiedDumpList() {
  const listEl = document.getElementById('classifiedDumpList');
  if (!listEl) return;
  listEl.innerHTML = '';
  const today = getTodayDateString();
  const historyToday = (appData.brainDumpHistory || {})[today] || [];
  const unclassifiedIds = new Set((appData.brainDump || []).map(b => String(b.id)));
  const classifiedToday = historyToday.filter(item => !unclassifiedIds.has(String(item.id)));
  const todoMap = new Map((appData.todos || []).filter(t => t.status !== 'trash').map(t => [String(t.id), t]));

  if (classifiedToday.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'classified-dump-empty';
    empty.textContent = '없습니다';
    listEl.appendChild(empty);
    return;
  }
  classifiedToday.forEach(item => {
    const todo = todoMap.get(String(item.id));
    const quadrant = todo ? (todo.quadrant || 4) : 4;
    const label = QUADRANT_LABELS[quadrant] || '비중요·비긴급';
    const dateStr = item.dateAdded ? formatDateShort(item.dateAdded) : '';
    const li = document.createElement('li');
    li.className = 'classified-dump-item';
    li.innerHTML = `<span class="classified-dump-text">${escapeHtml(item.text)}</span><span class="classified-dump-meta">${dateStr} ${escapeHtml(label)}</span>`;
    listEl.appendChild(li);
  });
}

// Brain dump 아이템 삭제 (선택한 날짜 목록에서 제거 후 휴지통으로)
function removeBrainDumpItem(id) {
  if (!selectedDumpDate) selectedDumpDate = getTodayDateString();
  const today = getTodayDateString();
  const list = getDumpListForDate(selectedDumpDate);
  const item = list.find(i => i.id == id);
  if (!item) return;

  const todo = {
    id: item.id,
    text: item.text,
    quadrant: 4,
    status: 'trash',
    createdAt: new Date().toISOString(),
    trashedAt: new Date().toISOString(),
    dueDate: getDueDateForPeriod()
  };
  const existingTodo = appData.todos.find(t => t.id == item.id);
  if (existingTodo) {
    existingTodo.status = 'trash';
    existingTodo.trashedAt = new Date().toISOString();
  } else {
    appData.todos.push(todo);
  }

  appData.brainDump = appData.brainDump.filter(i => i.id != id);
  if (appData.brainDumpHistory[selectedDumpDate]) {
    appData.brainDumpHistory[selectedDumpDate] = appData.brainDumpHistory[selectedDumpDate].filter(i => i.id != id);
  }
  saveData();
  updateBrainDumpView();
  updateBrainDumpBanner();
  updateTrashButton();
}

// Brain dump 전체 삭제 (선택한 날짜 기준)
function clearBrainDump() {
  if (!selectedDumpDate) selectedDumpDate = getTodayDateString();
  if (!confirm(`해당 날짜(${formatDateDisplay(selectedDumpDate)})의 모든 할 일을 삭제하시겠습니까?`)) return;
  const today = getTodayDateString();
  if (selectedDumpDate === today) appData.brainDump = [];
  if (appData.brainDumpHistory[selectedDumpDate]) {
    appData.brainDumpHistory[selectedDumpDate] = [];
  }
  updateBrainDumpView();
  updateBrainDumpBanner();
  saveData();
}

// 쏟아내기 화면에서 선택한 날짜 (캘린더에서 선택 시 메인·리스트에 반영)
let selectedDumpDate = null;

// 캘린더가 보여주는 연·월 (이전/다음 버튼으로 변경)
let calendarViewYear = new Date().getFullYear();
let calendarViewMonth = new Date().getMonth() + 1; // 1~12

// 날짜 선택 모달 열기 시 캘린더 렌더 (팝업용). 그 외에는 리스트만 갱신.
function updateBrainDumpBanner() {
  const modal = document.getElementById('datePickerModal');
  const wrap = document.getElementById('brainDumpCalendarWrap');
  updateBrainDumpList();
  if (modal && modal.classList.contains('active') && wrap) {
    renderBrainDumpCalendar(wrap, () => {
      modal.classList.remove('active');
    });
  }
}

function openDatePickerModal() {
  if (!selectedDumpDate) selectedDumpDate = getTodayDateString();
  const [y, m] = selectedDumpDate.split('-').map(Number);
  calendarViewYear = y;
  calendarViewMonth = m;
  document.getElementById('datePickerModal').classList.add('active');
  updateBrainDumpBanner();
}

// 캘린더: 한 달 단위 표시. onDaySelect(선택 시 콜백, 팝업 닫기용).
function renderBrainDumpCalendar(container, onDaySelect) {
  if (!container) return;
  container.innerHTML = '';
  
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const today = new Date();
  const todayStr = getTodayDateString();
  
  const year = calendarViewYear;
  const month = calendarViewMonth;
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const totalDays = lastDay.getDate();
  const startWeekday = firstDay.getDay();
  
  const days = [];
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    const d = new Date(year, month - 1, day);
    days.push({
      dateStr: dateStr,
      day: day,
      weekday: weekdays[d.getDay()],
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
      count: (appData.brainDumpHistory || {})[dateStr] ? appData.brainDumpHistory[dateStr].length : 0
    });
  }
  
  // 헤더: [이전] YYYY년 M월 [다음]
  const nav = document.createElement('div');
  nav.className = 'calendar-nav';
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'calendar-nav-btn calendar-prev';
  prevBtn.innerHTML = '←';
  prevBtn.title = '이전 달';
  const label = document.createElement('span');
  label.className = 'calendar-month-label';
  label.textContent = year + '년 ' + month + '월';
  const todayBtn = document.createElement('button');
  todayBtn.type = 'button';
  todayBtn.className = 'calendar-nav-btn calendar-today-btn';
  todayBtn.textContent = '오늘';
  todayBtn.title = '오늘 날짜로 이동';
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'calendar-nav-btn calendar-next';
  nextBtn.innerHTML = '→';
  nextBtn.title = '다음 달';
  
  todayBtn.addEventListener('click', () => {
    selectedDumpDate = getTodayDateString();
    updateSelectedDateDisplay();
    updateBrainDumpList();
    if (onDaySelect) onDaySelect();
  });
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const isNextDisabled = year > currentYear || (year === currentYear && month >= currentMonth);
  
  prevBtn.addEventListener('click', () => {
    if (month === 1) {
      calendarViewYear -= 1;
      calendarViewMonth = 12;
    } else {
      calendarViewMonth -= 1;
    }
    updateBrainDumpBanner();
  });
  nextBtn.addEventListener('click', () => {
    if (isNextDisabled) return;
    if (month === 12) {
      calendarViewYear += 1;
      calendarViewMonth = 1;
    } else {
      calendarViewMonth += 1;
    }
    updateBrainDumpBanner();
  });
  
  nextBtn.disabled = isNextDisabled;
  nextBtn.classList.toggle('disabled', isNextDisabled);
  
  nav.appendChild(prevBtn);
  nav.appendChild(label);
  nav.appendChild(todayBtn);
  nav.appendChild(nextBtn);
  container.appendChild(nav);
  
  const calendar = document.createElement('div');
  calendar.className = 'brain-dump-calendar';
  
  const headerRow = document.createElement('div');
  headerRow.className = 'calendar-row calendar-header';
  weekdays.forEach(w => {
    const th = document.createElement('div');
    th.className = 'calendar-cell calendar-cell-header';
    th.textContent = w;
    headerRow.appendChild(th);
  });
  calendar.appendChild(headerRow);
  
  const numRows = Math.ceil((startWeekday + totalDays) / 7);
  let dayIndex = 0;
  for (let row = 0; row < numRows; row++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'calendar-row';
    for (let col = 0; col < 7; col++) {
      const cellIndex = row * 7 + col;
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'calendar-cell calendar-day';
      if (cellIndex < startWeekday || dayIndex >= totalDays) {
        cell.classList.add('empty');
        cell.disabled = true;
      } else {
        const d = days[dayIndex];
        if (d.isToday) cell.classList.add('today');
        if (d.count > 0) cell.classList.add('has-dump');
        if (d.isFuture) cell.classList.add('outside-range');
        cell.dataset.date = d.dateStr;
        cell.innerHTML = `<span class="day-num">${d.day}</span>${d.count > 0 ? `<span class="day-count">${d.count}</span>` : ''}`;
        cell.addEventListener('click', () => {
          selectedDumpDate = d.dateStr;
          updateSelectedDateDisplay();
          updateBrainDumpList();
          if (onDaySelect) onDaySelect();
        });
        dayIndex++;
      }
      rowEl.appendChild(cell);
    }
    calendar.appendChild(rowEl);
  }
  
  container.appendChild(calendar);
}

// 선택한 날짜의 쏟아내기 내용 렌더
function renderBrainDumpHistoryContent(container, dateStr) {
  const items = (appData.brainDumpHistory || {})[dateStr] || [];
  
  container.innerHTML = '';
  
  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'calendar-back-btn';
  backBtn.textContent = '← 날짜 선택';
  backBtn.addEventListener('click', () => {
    selectedHistoryDate = null;
    updateBrainDumpBanner();
  });
  container.appendChild(backBtn);
  
  const title = document.createElement('h4');
  title.className = 'history-date-title';
  title.textContent = formatDateDisplay(dateStr);
  title.style.cursor = 'pointer';
  title.title = '클릭하면 날짜 선택 화면으로';
  title.addEventListener('click', () => {
    selectedHistoryDate = null;
    updateBrainDumpBanner();
  });
  container.appendChild(title);
  
  const content = document.createElement('div');
  content.className = 'brain-dump-history-content';
  
  if (items.length === 0) {
    content.innerHTML = '<p class="placeholder-text">해당 날짜에 기록이 없습니다.</p>';
  } else {
    const list = document.createElement('ul');
    list.className = 'brain-dump-history-list';
    items.forEach(item => {
      const li = document.createElement('li');
      const timeStr = item.dateAdded ? formatTimeDisplay(item.dateAdded) : '';
      li.innerHTML = `<span class="history-item-text">${escapeHtml(item.text)}</span><span class="history-item-date">${timeStr}</span>`;
      list.appendChild(li);
    });
    content.appendChild(list);
  }
  
  container.appendChild(content);
}

// 분류 관련 변수
let categorizeData = {
  step: 1, // 1: 중요도 분류, 2: 긴급도 분류
  unclassified: [],
  important: [],
  notImportant: [],
  urgent: [],
  notUrgent: []
};

let draggedElement = null;

// 터치 기기 또는 작은 화면이면 분류 시 버튼 방식 사용 (드래그 미지원)
function isMobileCategorize() {
  return window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 768px)').matches ||
    ('ontouchstart' in window);
}

// 분류 시작
function startCategorize() {
  if (appData.brainDump.length === 0) return;
  
  // 초기화
  categorizeData = {
    step: 1,
    unclassified: [...appData.brainDump],
    important: [],
    notImportant: [],
    urgent: [],
    notUrgent: []
  };
  
  const modal = document.getElementById('categorizeModal');
  const modalContent = document.querySelector('#categorizeModal .modal-content');
  const container = document.querySelector('.drag-drop-container');
  modal.classList.add('active');
  const isMobile = isMobileCategorize();
  modal.classList.toggle('categorize-modal-fullscreen', isMobile);
  if (container) container.classList.toggle('mobile-stack-layout', isMobile);
  if (modalContent) modalContent.classList.toggle('categorize-modal-one-screen', isMobile);

  // 휴지통 버튼 숨기기
  const trashBtn = document.getElementById('trashButton');
  if (trashBtn) {
    trashBtn.style.display = 'none';
  }

  // 첫 번째 단계 설정
  setupCategorizeStep();
}

// 분류 단계 설정
function setupCategorizeStep() {
  const step = categorizeData.step;
  const isMobile = isMobileCategorize();

  const nextStepBtn = document.getElementById('nextStepBtn');
  if (step === 1) {
    // 첫 번째 단계: 중요도 분류
    document.getElementById('categorizeTitle').textContent = isMobile
      ? '각 할 일 아래 버튼을 눌러 중요도를 분류하세요'
      : '할 일을 드래그하여 중요도를 분류하세요';
    document.getElementById('categorizeStepText').textContent = '1단계: 중요도 분류';
    document.getElementById('leftZoneTitle').textContent = '중요함';
    document.getElementById('rightZoneTitle').textContent = '중요하지 않음';
    if (nextStepBtn) nextStepBtn.textContent = '다음 단계';

    // 중앙에 미분류 할 일 표시
    renderUnclassifiedTodos();

    // 좌우 존 초기화
    document.getElementById('leftZoneContent').innerHTML = '';
    document.getElementById('rightZoneContent').innerHTML = '';

    // 좌우 존에 분류된 할 일 표시
    renderCategorizedTodos('important', 'notImportant');

  } else if (step === 2) {
    // 두 번째 단계: 긴급도 분류
    document.getElementById('categorizeTitle').textContent = isMobile
      ? '각 할 일 아래 버튼을 눌러 긴급도를 분류하세요'
      : '할 일을 드래그하여 긴급도를 분류하세요';
    document.getElementById('categorizeStepText').textContent = '2단계: 긴급도 분류';
    document.getElementById('leftZoneTitle').textContent = '긴급함';
    document.getElementById('rightZoneTitle').textContent = '긴급하지 않음';
    if (nextStepBtn) nextStepBtn.textContent = '분류 마무리';
    
    // 중요한 것들에 isImportant 속성 추가
    categorizeData.important.forEach(item => {
      item.isImportant = true;
    });
    
    // 중요하지 않은 것들에 isImportant 속성 추가
    categorizeData.notImportant.forEach(item => {
      item.isImportant = false;
    });
    
    // 모든 항목을 중앙에 표시 (important와 notImportant 모두)
    categorizeData.unclassified = [...categorizeData.important, ...categorizeData.notImportant];
    
    renderUnclassifiedTodos();
    
    // 좌우 존 초기화
    document.getElementById('leftZoneContent').innerHTML = '';
    document.getElementById('rightZoneContent').innerHTML = '';
    
    // 좌우 존에 분류된 할 일 표시
    renderCategorizedTodos('urgent', 'notUrgent');
  }
  
  updateZoneCounts();
  setupDragAndDrop();
}

// 미분류 할 일 렌더링
function renderUnclassifiedTodos() {
  const centerContent = document.getElementById('centerZoneContent');
  centerContent.innerHTML = '';
  centerContent.classList.toggle('mobile-categorize', isMobileCategorize());

  if (categorizeData.unclassified.length === 0) {
    centerContent.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">모든 할 일이 분류되었습니다</p>';
    document.getElementById('nextStepBtn').disabled = false;
    return;
  }

  const useMobileUI = isMobileCategorize();
  categorizeData.unclassified.forEach(item => {
    const todoEl = useMobileUI ? createMobileCategorizeTodo(item) : createDraggableTodo(item);
    centerContent.appendChild(todoEl);
  });

  document.getElementById('nextStepBtn').disabled = categorizeData.unclassified.length > 0;
}

// 분류된 할 일 렌더링
function renderCategorizedTodos(leftKey, rightKey) {
  const leftContent = document.getElementById('leftZoneContent');
  const rightContent = document.getElementById('rightZoneContent');
  
  leftContent.innerHTML = '';
  rightContent.innerHTML = '';
  
  categorizeData[leftKey].forEach(item => {
    const todoEl = createCategorizedTodo(item);
    leftContent.appendChild(todoEl);
  });
  
  categorizeData[rightKey].forEach(item => {
    const todoEl = createCategorizedTodo(item);
    rightContent.appendChild(todoEl);
  });
}

// 드래그 가능한 할 일 생성
function createDraggableTodo(item) {
  const div = document.createElement('div');
  div.className = 'draggable-todo';
  div.draggable = true;
  div.dataset.id = item.id;
  div.textContent = item.text;
  
  div.addEventListener('dragstart', handleDragStart);
  div.addEventListener('dragend', handleDragEnd);
  
  return div;
}

// 분류된 할 일 생성
function createCategorizedTodo(item) {
  const div = document.createElement('div');
  div.className = 'categorized-todo';
  div.textContent = item.text;
  return div;
}

// 모바일/터치용: 할일 카드 — 왼쪽/오른쪽 큰 터치 영역(배너가 위·아래에 보이므로 위=중요/긴급, 아래=안중요/안긴급)
function createMobileCategorizeTodo(item) {
  const step = categorizeData.step;
  const leftLabel = step === 1 ? '↑ 중요함' : '↑ 긴급함';
  const rightLabel = step === 1 ? '↓ 중요하지 않음' : '↓ 긴급하지 않음';

  const card = document.createElement('div');
  card.className = 'mobile-categorize-todo';
  card.dataset.id = String(item.id);
  card.innerHTML = `
    <div class="mobile-categorize-text">${escapeHtml(item.text)}</div>
    <div class="mobile-categorize-tap-row">
      <div class="mobile-tap-area mobile-tap-left" role="button" tabindex="0" data-id="${item.id}" data-side="left">${escapeHtml(leftLabel)}</div>
      <div class="mobile-tap-area mobile-tap-right" role="button" tabindex="0" data-id="${item.id}" data-side="right">${escapeHtml(rightLabel)}</div>
    </div>
  `;

  card.querySelectorAll('.mobile-tap-area').forEach(el => {
    const id = el.dataset.id;
    const side = el.dataset.side;

    function doMove(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      lastMobileCatTouchTime = Date.now();
      moveTodoToZone(id, side);
    }

    el.addEventListener('touchend', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      doMove(ev);
    }, { passive: false });

    el.addEventListener('click', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (Date.now() - lastMobileCatTouchTime < 350) return;
      doMove(ev);
    });
  });

  return card;
}

// 터치 후 클릭 이벤트 중복 방지용
let lastMobileCatTouchTime = 0;

// 모바일: 할 일을 좌(중요/긴급) 또는 우(안중요/안긴급) 존으로 이동
function moveTodoToZone(itemId, side) {
  const item = categorizeData.unclassified.find(t => t.id == itemId);
  if (!item) return;

  if (categorizeData.step === 1) {
    if (side === 'left') categorizeData.important.push(item);
    else categorizeData.notImportant.push(item);
  } else {
    if (side === 'left') categorizeData.urgent.push(item);
    else categorizeData.notUrgent.push(item);
  }
  categorizeData.unclassified = categorizeData.unclassified.filter(t => t.id != itemId);

  renderUnclassifiedTodos();
  renderCategorizedTodos(
    categorizeData.step === 1 ? 'important' : 'urgent',
    categorizeData.step === 1 ? 'notImportant' : 'notUrgent'
  );
  updateZoneCounts();
}

// 드래그 시작
function handleDragStart(e) {
  draggedElement = e.target;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

// 드래그 종료
function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  draggedElement = null;
  
  // 모든 드롭 존에서 drag-over 클래스 제거
  document.querySelectorAll('.drop-zone').forEach(zone => {
    zone.classList.remove('drag-over', 'left-active', 'right-active');
  });
}

// 드래그 앤 드롭 설정
function setupDragAndDrop() {
  const leftZone = document.getElementById('leftZone');
  const rightZone = document.getElementById('rightZone');
  const centerZone = document.getElementById('centerZone');
  
  // 드롭 존 이벤트
  [leftZone, rightZone, centerZone].forEach(zone => {
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('drop', handleDrop);
    zone.addEventListener('dragleave', handleDragLeave);
  });
}

// 드래그 오버
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const zone = e.currentTarget;
  if (zone.id === 'leftZone') {
    zone.classList.add('drag-over', 'left-active');
    document.getElementById('rightZone').classList.remove('drag-over', 'right-active');
  } else if (zone.id === 'rightZone') {
    zone.classList.add('drag-over', 'right-active');
    document.getElementById('leftZone').classList.remove('drag-over', 'left-active');
  } else {
    document.getElementById('leftZone').classList.remove('drag-over', 'left-active');
    document.getElementById('rightZone').classList.remove('drag-over', 'right-active');
  }
}

// 드래그 리브
function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over', 'left-active', 'right-active');
}

// 드롭 처리
function handleDrop(e) {
  e.preventDefault();
  
  if (!draggedElement) return;
  
  const zone = e.currentTarget;
  const itemId = draggedElement.dataset.id;
  const item = categorizeData.unclassified.find(t => t.id == itemId);
  
  if (!item) return;
  
  if (categorizeData.step === 1) {
    // 첫 번째 단계: 중요도 분류
    if (zone.id === 'leftZone') {
      // 중요함
      categorizeData.important.push(item);
    } else if (zone.id === 'rightZone') {
      // 중요하지 않음
      categorizeData.notImportant.push(item);
    } else {
      // 중앙으로 돌아감
      return;
    }
  } else if (categorizeData.step === 2) {
    // 두 번째 단계: 긴급도 분류
    if (zone.id === 'leftZone') {
      // 긴급함
      categorizeData.urgent.push(item);
    } else if (zone.id === 'rightZone') {
      // 긴급하지 않음
      categorizeData.notUrgent.push(item);
    } else {
      // 중앙으로 돌아감
      return;
    }
  }
  
  // 미분류 목록에서 제거
  categorizeData.unclassified = categorizeData.unclassified.filter(t => t.id != itemId);
  
  // UI 업데이트
  renderUnclassifiedTodos();
  renderCategorizedTodos(
    categorizeData.step === 1 ? 'important' : 'urgent',
    categorizeData.step === 1 ? 'notImportant' : 'notUrgent'
  );
  updateZoneCounts();
  
  // 드래그 오버 효과 제거
  zone.classList.remove('drag-over', 'left-active', 'right-active');
}

// 존 카운트 업데이트
function updateZoneCounts() {
  if (categorizeData.step === 1) {
    document.getElementById('leftCount').textContent = categorizeData.important.length;
    document.getElementById('rightCount').textContent = categorizeData.notImportant.length;
  } else {
    document.getElementById('leftCount').textContent = categorizeData.urgent.length;
    document.getElementById('rightCount').textContent = categorizeData.notUrgent.length;
  }
}

// 다음 단계로 이동
function nextCategorizeStep() {
  if (categorizeData.step === 1) {
    // 첫 번째 단계 완료
    if (categorizeData.unclassified.length > 0) {
      alert('모든 할 일을 분류해주세요.');
      return;
    }
    
    // 두 번째 단계로 이동
    categorizeData.step = 2;
    setupCategorizeStep();
    
  } else if (categorizeData.step === 2) {
    // 두 번째 단계 완료
    if (categorizeData.unclassified.length > 0) {
      alert('모든 할 일을 분류해주세요.');
      return;
    }
    
    // 분류 완료 및 매트릭스에 반영
    finishCategorize();
  }
}

// 분류 완료
function finishCategorize() {
  // 오늘 쏟아내기 기록은 이미 brainDumpHistory에 있음 (추가 시 저장됨). brainDump만 비우기
  appData.brainDump = [];
  updateUnclassifiedDumpList();
  updateClassifiedDumpList();

  // 모든 분류된 항목들을 하나의 배열로 합치기
  const allItems = [...categorizeData.urgent, ...categorizeData.notUrgent];
  
  // 각 항목에 대해 매트릭스 분류 결정 및 할 일 추가
  allItems.forEach(item => {
    const isImportant = item.isImportant === true;
    const isUrgent = categorizeData.urgent.some(u => u.id === item.id);
    
    let quadrant;
    if (isImportant && isUrgent) {
      quadrant = 1; // 중요하고 긴급
    } else if (isImportant && !isUrgent) {
      quadrant = 2; // 중요하지만 긴급하지 않음
    } else if (!isImportant && isUrgent) {
      quadrant = 3; // 긴급하지만 중요하지 않음
    } else {
      quadrant = 4; // 중요하지도 긴급하지도 않음
    }
    
    // 이미 존재하는 할 일인지 확인
    const existingTodo = appData.todos.find(t => t.id === item.id);
    if (existingTodo) {
      // 기존 할 일 업데이트
      existingTodo.quadrant = quadrant;
      existingTodo.text = item.text;
    } else {
      // 새 할 일 추가
      appData.todos.push({
        id: item.id,
        text: item.text,
      quadrant: quadrant,
      status: 'pending',
      createdAt: new Date().toISOString(),
      dueDate: getDueDateForPeriod()
      });
    }
  });
  
  // Brain dump 비우기
  appData.brainDump = [];
  
  // 모달 닫기
  const catModal = document.getElementById('categorizeModal');
  catModal.classList.remove('active', 'categorize-modal-fullscreen');
  catModal.querySelector('.modal-content')?.classList.remove('categorize-modal-one-screen');
  catModal.querySelector('.drag-drop-container')?.classList.remove('mobile-stack-layout');
  updateTrashButton();
  
  // 데이터 저장
  saveData();
  
  // 매트릭스 뷰로 전환
  switchView('matrix');
}

// 매트릭스 뷰 업데이트 (기간 필터 없이 모든 할 일 표시)
function updateMatrixView() {
  // 기간 필터 없이 모든 할 일 표시 (휴지통 제외)
  [1, 2, 3, 4].forEach(quadrant => {
    const list = document.querySelector(`.todo-list[data-quadrant="${quadrant}"]`);
    list.innerHTML = '';
    
    const quadrantTodos = appData.todos.filter(todo => 
      todo.quadrant == quadrant && todo.status !== 'trash'
    );
    
    if (quadrantTodos.length === 0) {
      list.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">할 일이 없습니다</p>';
    } else {
      quadrantTodos.forEach(todo => {
        const item = createTodoItem(todo);
        list.appendChild(item);
      });
    }
  });
  
  // 휴지통 버튼 업데이트
  updateTrashButton();
}

// 매트릭스 사분면 드래그 앤 드롭 (한 번만 바인딩)
function setupMatrixDragDrop() {
  const grid = document.querySelector('.matrix-grid');
  if (!grid || grid._matrixDropBound) return;
  grid._matrixDropBound = true;

  grid.addEventListener('dragover', (e) => {
    const quadrant = e.target.closest('.matrix-quadrant');
    if (!quadrant) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.matrix-quadrant').forEach(q => q.classList.remove('drag-over-matrix'));
    quadrant.classList.add('drag-over-matrix');
  });

  grid.addEventListener('dragleave', (e) => {
    if (!e.target.closest('.matrix-quadrant')) return;
    const quadrant = e.target.closest('.matrix-quadrant');
    const related = e.relatedTarget;
    if (related && quadrant.contains(related)) return;
    quadrant.classList.remove('drag-over-matrix');
  });

  grid.addEventListener('drop', (e) => {
    const quadrant = e.target.closest('.matrix-quadrant');
    if (!quadrant) return;
    e.preventDefault();
    quadrant.classList.remove('drag-over-matrix');
    const todoId = e.dataTransfer.getData('text/plain');
    if (!todoId) return;
    const targetQuadrant = parseInt(quadrant.dataset.quadrant, 10);
    const todo = appData.todos.find(t => String(t.id) === String(todoId));
    if (!todo || todo.status === 'trash') return;
    if (todo.quadrant === targetQuadrant) return;
    todo.quadrant = targetQuadrant;
    saveData();
    updateMatrixView();
  });
}

// 휴지통으로 이동 (ID로 찾기 - 쏟아내기 화면용)
function moveToTrash(todoId) {
  console.log('moveToTrash 호출:', todoId);
  console.log('현재 todos:', appData.todos);
  
  // todoId를 다양한 형식으로 비교 시도
  let todo = null;
  
  // 방법 1: 직접 비교
  todo = appData.todos.find(t => t.id == todoId);
  
  // 방법 2: 문자열로 변환하여 비교
  if (!todo) {
    todo = appData.todos.find(t => String(t.id) === String(todoId));
  }
  
  // 방법 3: 숫자로 변환하여 비교
  if (!todo) {
    const idNum = typeof todoId === 'string' ? parseFloat(todoId) : todoId;
    todo = appData.todos.find(t => {
      const tIdNum = typeof t.id === 'string' ? parseFloat(t.id) : t.id;
      return tIdNum == idNum;
    });
  }
  
  console.log('찾은 todo:', todo);
  
  if (todo) {
    todo.status = 'trash';
    todo.trashedAt = new Date().toISOString();
    saveData();
    updateMatrixView();
    updateTrashButton();
    console.log('휴지통으로 이동 완료');
  } else {
    console.error('할 일을 찾을 수 없습니다:', todoId);
    console.error('현재 todos:', appData.todos);
    console.error('todos의 id들:', appData.todos.map(t => ({ id: t.id, type: typeof t.id })));
  }
}

// 휴지통 버튼 업데이트
function updateTrashButton() {
  const trashBtn = document.getElementById('trashButton');
  if (trashBtn) {
    const trashCount = appData.todos.filter(t => t.status === 'trash').length;
    // 항상 표시하되, 개수가 0이면 0으로 표시
    trashBtn.style.display = 'flex';
    const countEl = trashBtn.querySelector('.trash-count');
    if (countEl) {
      countEl.textContent = trashCount;
    }
  }
}

// 직접 todo 객체를 받아서 휴지통으로 이동 (ID 문제 해결)
function moveToTrashDirect(todo) {
  console.log('moveToTrashDirect 호출:', todo);
  
  if (todo) {
    todo.status = 'trash';
    todo.trashedAt = new Date().toISOString();
    saveData();
    updateMatrixView();
    updateTrashButton();
    console.log('휴지통으로 이동 완료');
  } else {
    console.error('todo 객체가 없습니다');
  }
}

// 할 일 아이템 생성
function createTodoItem(todo) {
  const div = document.createElement('div');
  div.className = `todo-item ${todo.status === 'done' ? 'done' : ''} ${todo.status === 'trash' ? 'trash' : ''}`;
  div.dataset.id = todo.id;
  div.draggable = true;
  
  const checkTitle = todo.status === 'done' ? '완료 해제' : '완료';
  div.innerHTML = `
    <button type="button" class="todo-check-btn" title="${checkTitle}" aria-label="${checkTitle}">${todo.status === 'done' ? '✓' : ''}</button>
    <span class="todo-text">${escapeHtml(todo.text)}</span>
    <button type="button" class="delete-todo-btn" data-id="${todo.id}" title="휴지통으로 이동">×</button>
  `;
  
  div.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', String(todo.id));
    e.dataTransfer.effectAllowed = 'move';
    div.classList.add('dragging');
  });
  div.addEventListener('dragend', () => {
    div.classList.remove('dragging');
    document.querySelectorAll('.matrix-quadrant').forEach(q => q.classList.remove('drag-over-matrix'));
  });
  
  // 체크 버튼: 완료/해제 토글
  const checkBtn = div.querySelector('.todo-check-btn');
  checkBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    todo.status = todo.status === 'done' ? 'pending' : 'done';
    saveData();
    updateMatrixView();
  });
  
  // 삭제 버튼 이벤트 (휴지통으로 이동)
  const deleteBtn = div.querySelector('.delete-todo-btn');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    moveToTrashDirect(todo);
    return false;
  });
  
  return div;
}

// 할 일 추가 모달 열기
let currentQuadrant = null;
function openAddTodoModal(quadrant) {
  currentQuadrant = quadrant;
  document.getElementById('addTodoModal').classList.add('active');
  document.getElementById('todoTextInput').focus();
}

// 할 일 저장
function saveTodo() {
  const text = document.getElementById('todoTextInput').value.trim();
  if (!text || !currentQuadrant) return;
  
  const todo = {
    id: Date.now() + Math.random(),
    text: text,
      quadrant: parseInt(currentQuadrant),
      status: 'pending',
      createdAt: new Date().toISOString(),
      dueDate: getDueDateForPeriod()
  };
  
  appData.todos.push(todo);
  saveData();
  updateMatrixView();
  closeModals();
}

// 액션 모달 열기
let currentTodoId = null;
function openActionModal(todo) {
  currentTodoId = todo.id;
  document.getElementById('actionTodoText').textContent = todo.text;
  document.getElementById('actionModal').classList.add('active');
}

// 할 일 액션 처리
function handleTodoAction(action) {
  if (!currentTodoId) return;
  
  const todo = appData.todos.find(t => t.id === currentTodoId);
  if (!todo) return;
  
  switch(action) {
    case 'do':
      todo.status = 'done';
      break;
    case 'defer':
      // 다음 주로 미루기
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      todo.dueDate = nextWeek.toISOString().split('T')[0];
      break;
    case 'delegate':
      todo.status = 'delegated';
      break;
    case 'delete':
      if (confirm('이 할 일을 삭제하시겠습니까?')) {
        appData.todos = appData.todos.filter(t => t.id !== currentTodoId);
      } else {
        closeModals();
        return;
      }
      break;
  }
  
  saveData();
  updateMatrixView();
  closeModals();
}

// 모달 닫기
function closeModals() {
  document.getElementById('addTodoModal').classList.remove('active');
  document.getElementById('actionModal').classList.remove('active');
  document.getElementById('todoTextInput').value = '';
  currentQuadrant = null;
  currentTodoId = null;
}

// 휴지통 모달 열기
function openTrashModal() {
  updateTrashModal();
  document.getElementById('trashModal').classList.add('active');
}

// 휴지통 모달 업데이트
function updateTrashModal() {
  const trashList = document.getElementById('trashList');
  const trashItems = appData.todos.filter(t => t.status === 'trash');
  
  trashList.innerHTML = '';
  
  if (trashItems.length === 0) {
    trashList.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">휴지통이 비어있습니다</p>';
    return;
  }
  
  trashItems.forEach(todo => {
    const item = document.createElement('div');
    item.className = 'trash-item';
    item.innerHTML = `
      <span class="trash-item-text">${escapeHtml(todo.text)}</span>
      <div class="trash-item-actions">
        <button class="trash-restore-btn" data-id="${todo.id}">복원</button>
        <button class="trash-delete-btn" data-id="${todo.id}">완전 삭제</button>
      </div>
    `;
    
    // 복원 버튼
    const restoreBtn = item.querySelector('.trash-restore-btn');
    restoreBtn.addEventListener('click', () => {
      restoreFromTrash(todo.id);
    });
    
    // 완전 삭제 버튼
    const deleteBtn = item.querySelector('.trash-delete-btn');
    deleteBtn.addEventListener('click', () => {
      if (confirm('이 할 일을 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        appData.todos = appData.todos.filter(t => t.id !== todo.id);
        saveData();
        updateTrashModal();
        updateTrashButton();
        updateMatrixView();
      }
    });
    
    trashList.appendChild(item);
  });
}

// 휴지통에서 복원
function restoreFromTrash(todoId) {
  const todo = appData.todos.find(t => t.id == todoId);
  if (todo) {
    todo.status = 'pending';
    delete todo.trashedAt;
    saveData();
    updateTrashModal();
    updateTrashButton();
    updateMatrixView();
  }
}

// 기간 필터링
function filterTodosByPeriod(todos, period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return todos.filter(todo => {
    const todoDate = new Date(todo.dueDate);
    
    switch(period) {
      case 'today':
        return todoDate.getTime() === today.getTime();
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // 일요일
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return todoDate >= weekStart && todoDate <= weekEnd;
      case 'month':
        return todoDate.getMonth() === today.getMonth() && 
               todoDate.getFullYear() === today.getFullYear();
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        return Math.floor(todoDate.getMonth() / 3) === quarter &&
               todoDate.getFullYear() === today.getFullYear();
      case 'year':
        return todoDate.getFullYear() === today.getFullYear();
      default:
        return true;
    }
  });
}

// 기본 마감일 계산 (오늘)
function getDueDateForPeriod() {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return date.toISOString().split('T')[0];
}

// UI 업데이트
function updateUI() {
  updateBrainDumpView();
  updateMatrixView();
  updateBrainDumpBanner();
  setTimeout(() => {
    updateTrashButton();
  }, 100);
}

// 데이터 저장
function saveData() {
  appData.lastUpdated = new Date().toISOString();
  localStorage.setItem('eisenhowerAppData', JSON.stringify(appData));
}

// 데이터 로드
function loadData() {
  const saved = localStorage.getItem('eisenhowerAppData');
  if (saved) {
    try {
      appData = JSON.parse(saved);
    } catch (e) {
      console.error('데이터 로드 실패:', e);
    }
  }
  if (!appData.brainDumpHistory) {
    appData.brainDumpHistory = {};
  }
  // 기존 brainDump 항목에 dateAdded 없으면 오늘로 설정하고 히스토리에 반영
  const today = getTodayDateString();
  if (appData.brainDump && appData.brainDump.length > 0) {
    appData.brainDump.forEach(item => {
      if (!item.dateAdded) {
        item.dateAdded = new Date().toISOString();
        if (!appData.brainDumpHistory[today]) appData.brainDumpHistory[today] = [];
        appData.brainDumpHistory[today].push(item);
      }
    });
  }
}

// HTML 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
