// 学習テーマ選択UIのロジック

let learningTopics = {};
let selectedYear = null;
let selectedCategory = null;
let selectedTheme = null;

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    await loadLearningTopics();
    renderThemeSelector();
    setupEventListeners();
    setupUserNameInput();
});

// ユーザー名入力欄の設定
function setupUserNameInput() {
    const userNameInput = document.getElementById('userNameInputTop');
    const userNameDisplay = document.getElementById('currentUserNameTop');
    
    if (userNameInput) {
        // 既存のユーザー名を復元
        const savedName = localStorage.getItem('currentUserName');
        if (savedName) {
            userNameInput.value = savedName;
            if (userNameDisplay) {
                userNameDisplay.textContent = `（${savedName}）`;
            }
        }
        
        // ユーザー名変更時の処理
        userNameInput.addEventListener('blur', () => {
            const name = userNameInput.value.trim();
            if (name) {
                localStorage.setItem('currentUserName', name);
                if (userNameDisplay) {
                    userNameDisplay.textContent = `（${name}）`;
                }
            }
        });
        
        // Enterキーでも保存
        userNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                userNameInput.blur();
            }
        });
    }
}

// 学習テーママスタを読み込む
async function loadLearningTopics() {
    try {
        const response = await fetch('/static/learningTopics.json');
        if (!response.ok) throw new Error('Failed to load learning topics');
        learningTopics = await response.json();
    } catch (error) {
        console.error('Error loading learning topics:', error);
    }
}

// テーマ選択UIを描画
function renderThemeSelector() {
    const container = document.getElementById('themeSelectorContainer');
    if (!container) return;

    container.innerHTML = '';

    // Yearごとにブロックを作成
    Object.keys(learningTopics).forEach(year => {
        const yearBlock = document.createElement('div');
        yearBlock.className = 'year-block';
        yearBlock.innerHTML = `<h3 class="year-title">${year}</h3>`;
        
        const categoriesContainer = document.createElement('div');
        categoriesContainer.className = 'categories-container';

        // Categoryごとにセクションを作成
        Object.keys(learningTopics[year]).forEach(category => {
            const categorySection = document.createElement('div');
            categorySection.className = 'category-section';
            
            const categoryLabel = getCategoryLabel(category);
            categorySection.innerHTML = `<h4 class="category-title">${categoryLabel}</h4>`;
            
            const themesContainer = document.createElement('div');
            themesContainer.className = 'themes-container';
            
            // Themeごとにカードを作成
            learningTopics[year][category].forEach(theme => {
                const themeCard = document.createElement('div');
                themeCard.className = 'theme-select-card';
                themeCard.dataset.year = year;
                themeCard.dataset.category = category;
                themeCard.dataset.theme = theme.id;
                
                themeCard.innerHTML = `
                    <div class="theme-card-content">
                        <span class="theme-label">${theme.label}</span>
                        <input type="radio" name="theme" value="${year}|${category}|${theme.id}" id="theme-${year}-${category}-${theme.id}">
                    </div>
                `;
                
                themeCard.addEventListener('click', () => {
                    selectTheme(year, category, theme.id);
                });
                
                themesContainer.appendChild(themeCard);
            });
            
            categorySection.appendChild(themesContainer);
            categoriesContainer.appendChild(categorySection);
        });
        
        yearBlock.appendChild(categoriesContainer);
        container.appendChild(yearBlock);
    });
}

// カテゴリラベルを取得
function getCategoryLabel(category) {
    const labels = {
        'governance': 'ガバナンス',
        'business': 'ビジネススキル',
        'management': 'マネジメントスキル'
    };
    return labels[category] || category;
}

// テーマを選択
function selectTheme(year, category, theme) {
    selectedYear = year;
    selectedCategory = category;
    selectedTheme = theme;
    
    // すべてのカードから選択状態を解除
    document.querySelectorAll('.theme-select-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // 選択したカードに選択状態を追加
    const selectedCard = document.querySelector(
        `.theme-select-card[data-year="${year}"][data-category="${category}"][data-theme="${theme}"]`
    );
    if (selectedCard) {
        selectedCard.classList.add('selected');
        const radio = selectedCard.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
    }
    
    // 開始ボタンを有効化
    const startButton = document.getElementById('startQuizButton');
    if (startButton) {
        startButton.disabled = false;
        startButton.classList.remove('disabled');
    }
}

// イベントリスナー設定
function setupEventListeners() {
    const startButton = document.getElementById('startQuizButton');
    if (startButton) {
        startButton.addEventListener('click', () => {
            if (selectedYear && selectedCategory && selectedTheme) {
                startQuiz();
            }
        });
    }
}

// クイズを開始
function startQuiz() {
    if (!selectedYear || !selectedCategory || !selectedTheme) {
        alert('テーマを選択してください');
        return;
    }
    
    // ユーザー名を保存
    const userNameInput = document.getElementById('userNameInputTop');
    if (userNameInput && userNameInput.value.trim()) {
        localStorage.setItem('currentUserName', userNameInput.value.trim());
    }
    
    // URLパラメータでクイズページに遷移
    const params = new URLSearchParams({
        year: selectedYear,
        track: selectedCategory,
        theme: selectedTheme
    });
    
    window.location.href = `/quiz?${params.toString()}`;
}

