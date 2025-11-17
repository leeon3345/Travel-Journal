// --- DOM 요소 ---
const entryForm = document.getElementById("entryForm");
const cityInput = document.getElementById("cityInput");
const dateInput = document.getElementById("dateInput");
const memoInput = document.getElementById("memoInput");
const journalList = document.getElementById("journalList");
const errorBox = document.getElementById("error");

// --- LocalStorage 키 ---
const STORAGE_KEY = "travelEntries";

/**
 * 1. 페이지 로드 시: LocalStorage에서 데이터 불러와서 화면에 렌더링
 */
document.addEventListener("DOMContentLoaded", () => {
    loadEntries();
});

/**
 * 2. 폼 제출 시: 새 항목 추가
 */
entryForm.addEventListener("submit", (e) => {
    e.preventDefault(); // 폼 새로고침 방지

    // 입력값 가져오기 [cite: 67]
    const city = cityInput.value.trim();
    const date = dateInput.value;
    const memo = memoInput.value.trim();

    // 입력값 검증 (예외 처리) [cite: 67]
    if (!city || !date) {
        showError("도시와 날짜를 입력해주세요.");
        return;
    }
    clearError();

    // 고유 ID 생성 (현재 시간을 밀리초로)
    const newEntry = {
        id: new Date().getTime(),
        city: city,
        date: date,
        memo: memo,
    };

    // 항목 추가
    addEntry(newEntry);

    // 폼 초기화
    cityInput.value = "";
    dateInput.value = "";
    memoInput.value = "";
});

/**
 * 3. LocalStorage에서 모든 항목 불러오기
 */
function getEntries() {
    const entries = localStorage.getItem(STORAGE_KEY);
    // JSON.parse: 문자열을 실제 배열/객체로 변환 [cite: 66]
    return entries ? JSON.parse(entries) : [];
}

/**
 * 4. LocalStorage에 모든 항목 저장하기
 */
function saveEntries(entries) {
    // JSON.stringify: 배열/객체를 문자열로 변환 [cite: 66]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * 5. 새 항목을 데이터와 DOM에 추가
 */
function addEntry(entry) {
    const entries = getEntries();
    entries.push(entry); // 새 항목을 배열에 추가
    saveEntries(entries); // LocalStorage에 저장
    renderEntry(entry); // 화면(DOM)에 즉시 렌더링
}

/**
 * 6. 항목을 LocalStorage와 DOM에서 삭제
 */
function deleteEntry(id) {
    const entries = getEntries();
    // id가 일치하지 *않는* 항목만 남김 (필터링)
    const updatedEntries = entries.filter((entry) => entry.id !== id);
    saveEntries(updatedEntries); // LocalStorage 업데이트

    // DOM에서 해당 요소 제거
    const entryElement = document.getElementById(`entry-${id}`);
    if (entryElement) {
        entryElement.remove();
    }
}

/**
 * 7. DOM에 항목 렌더링 (단일)
 */
function renderEntry(entry) {
    const entryDiv = document.createElement("div");
    entryDiv.classList.add("journal-entry");
    entryDiv.id = `entry-${entry.id}`; // 삭제를 위한 ID

    // 날짜 포맷팅 (YYYY-MM-DD -> Month Day, Year)
    const date = new Date(entry.date + 'T00:00:00');
    const formattedDate = date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    entryDiv.innerHTML = `
        <div class="entry-header">
            <span class="entry-city">${entry.city}</span>
            <span class="entry-date">${formattedDate}</span>
        </div>
        <p class="entry-memo">${entry.memo.replace(/\n/g, "<br>")}</p>
        <button class="delete-btn" data-id="${entry.id}">×</button>
    `;

    // 맨 위에 추가 (prepend)
    journalList.prepend(entryDiv);

    // 방금 생성된 삭제 버튼에 이벤트 리스너 추가
    const deleteBtn = entryDiv.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", () => {
        deleteEntry(entry.id);
    });
}

/**
 * 8. DOM에 모든 항목 렌더링 (초기 로드용)
 */
function loadEntries() {
    const entries = getEntries();
    journalList.innerHTML = ""; // 목록 초기화
    // 오래된 항목이 아래로 가도록 순서대로 렌더링
    entries.forEach((entry) => renderEntry(entry));
}

// --- 유틸리티 함수 ---
function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
}

function clearError() {
    errorBox.textContent = "";
    errorBox.classList.add("hidden");
}
