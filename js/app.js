// --- DOM 요소 ---
const entryForm = document.getElementById("entryForm");
const cityInput = document.getElementById("cityInput");
const dateInput = document.getElementById("dateInput");
const memoInput = document.getElementById("memoInput");
const journalList = document.getElementById("journalList");
const imageInput = document.getElementById("imageInput");
const errorBox = document.getElementById("error");
const imageUploadLabel = document.querySelector('label[for="imageInput"]');

// --- LocalStorage 키 ---
const STORAGE_KEY = "travelEntries";

/**
 * 1. 페이지 로드 시: LocalStorage에서 데이터 불러와서 화면에 렌더링
 */
document.addEventListener("DOMContentLoaded", () => {
    loadEntries();
});

/**
 * 파일 입력 변경 시: 라벨 업데이트
 */
imageInput.addEventListener('change', () => {
    if (imageInput.files && imageInput.files.length > 0) {
        const fileName = imageInput.files[0].name;
        // 파일 이름이 너무 길면 잘라내기
        const displayName = fileName.length > 30 ? fileName.substring(0, 27) + '...' : fileName;
        imageUploadLabel.textContent = `✓ ${displayName}`; // 체크 표시와 파일 이름
        imageUploadLabel.classList.add('selected');
    } else {
        resetImageInputLabel();
    }
});

/**
 * 2. 폼 제출 시: 새 항목 추가
 */
entryForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // 폼 새로고침 방지

    // 입력값 가져오기 [cite: 67]
    const city = cityInput.value.trim();
    const date = dateInput.value;
    const memo = memoInput.value.trim();
    const imageFile = imageInput.files[0];

    // 입력값 검증 (예외 처리) [cite: 67]
    if (!city || !date) {
        showError("도시와 날짜를 입력해주세요.");
        return;
    }
    clearError();

    let imageData = null;
    if (imageFile) {
        // 파일 크기 제한 (예: 5MB)
        if (imageFile.size > 5 * 1024 * 1024) {
            showError("이미지 파일은 5MB를 초과할 수 없습니다.");
            return;
        }
        imageData = await readFileAsDataURL(imageFile);
    }

    // 고유 ID 생성 (현재 시간을 밀리초로)
    const newEntry = {
        id: new Date().getTime(),
        city: city,
        date: date,
        memo: memo,
        image: imageData,
    };

    // 항목 추가
    addEntry(newEntry);

    // 폼 초기화
    resetForm();
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

    // 이미지 템플릿
    const imageHTML = entry.image
        ? `<img src="${entry.image}" alt="${entry.city} 사진" class="entry-image">`
        : "";

    entryDiv.innerHTML = `
        <div class="entry-header">
            <span class="entry-city">${entry.city}</span>
            <span class="entry-date">${formattedDate}</span>
        </div>
        <p class="entry-memo">${entry.memo.replace(/\n/g, "<br>")}</p>
        ${imageHTML}
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

/**
 * 9. 파일을 Base64 데이터 URL로 읽기 (Promise 반환)
 */
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 10. 폼과 이미지 라벨 초기화
 */
function resetForm() {
    entryForm.reset(); // 폼의 모든 필드를 초기값으로 리셋
    resetImageInputLabel();
}

/**
 * 이미지 입력 라벨을 기본 상태로 되돌림
 */
function resetImageInputLabel() {
    imageUploadLabel.textContent = '사진 추가 (1장)';
    imageUploadLabel.classList.remove('selected');
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
