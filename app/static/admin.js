// 管理者画面のロジック

let allQuestions = [];
let filteredQuestions = [];

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    await loadQuestions();
    setupEventListeners();
    updateStats();
    updateTable();
});

// questions.jsonを読み込む
async function loadQuestions() {
    try {
        const response = await fetch('/static/questions.json');
        if (!response.ok) throw new Error('Failed to load questions');
        allQuestions = await response.json();
        filteredQuestions = [...allQuestions];
    } catch (error) {
        console.error('Error loading questions:', error);
        document.getElementById('loadingMessage').textContent = '問題の読み込みに失敗しました。';
    }
}

// イベントリスナー設定
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', updateTable);
    document.getElementById('adminYearFilter').addEventListener('change', updateTable);
    document.getElementById('adminCategoryFilter').addEventListener('change', updateTable);
    document.getElementById('adminDifficultyFilter').addEventListener('change', updateTable);
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('questionModal').addEventListener('click', (e) => {
        if (e.target.id === 'questionModal') closeModal();
    });
}

// 統計を更新
function updateStats() {
    // Year別集計
    const yearStats = {};
    allQuestions.forEach(q => {
        yearStats[q.year] = (yearStats[q.year] || 0) + 1;
    });
    
    const yearStatsContainer = document.getElementById('yearStats');
    yearStatsContainer.innerHTML = '';
    Object.entries(yearStats).forEach(([year, count]) => {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        statItem.innerHTML = `
            <div class="stat-label">${year}</div>
            <div class="stat-value">${count}</div>
        `;
        yearStatsContainer.appendChild(statItem);
    });

    // Category別集計
    const categoryStats = {};
    allQuestions.forEach(q => {
        categoryStats[q.category] = (categoryStats[q.category] || 0) + 1;
    });
    
    const categoryStatsContainer = document.getElementById('categoryStats');
    categoryStatsContainer.innerHTML = '';
    Object.entries(categoryStats).forEach(([category, count]) => {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        statItem.innerHTML = `
            <div class="stat-label">${category}</div>
            <div class="stat-value">${count}</div>
        `;
        categoryStatsContainer.appendChild(statItem);
    });
}

// テーブルを更新
function updateTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const year = document.getElementById('adminYearFilter').value;
    const category = document.getElementById('adminCategoryFilter').value;
    const difficulty = document.getElementById('adminDifficultyFilter').value;

    // フィルタリング
    filteredQuestions = allQuestions.filter(q => {
        if (year !== 'all' && q.year !== year) return false;
        if (category !== 'all' && q.category !== category) return false;
        if (difficulty !== 'all' && q.difficulty !== difficulty) return false;
        
        if (searchTerm) {
            const searchableText = [
                q.id,
                q.theme,
                q.learning_goal_ja,
                q.learning_goal_en,
                ...q.tags
            ].join(' ').toLowerCase();
            if (!searchableText.includes(searchTerm)) return false;
        }
        
        return true;
    });

    // テーブルを描画
    const tbody = document.getElementById('questionsTableBody');
    tbody.innerHTML = '';

    if (filteredQuestions.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" style="text-align: center; padding: 40px;">該当する問題がありません</td>';
        tbody.appendChild(row);
    } else {
        filteredQuestions.forEach(question => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${question.id}</td>
                <td>${question.year}</td>
                <td>${question.category}</td>
                <td>${question.theme}</td>
                <td><span class="badge difficulty-${question.difficulty}">${question.difficulty}</span></td>
                <td>${question.tags.join(', ')}</td>
                <td><button class="btn-view" onclick="showQuestionDetail('${question.id}')">詳細</button></td>
            `;
            tbody.appendChild(row);
        });
    }

    document.getElementById('loadingMessage').classList.add('hidden');
    document.getElementById('questionsTable').classList.remove('hidden');
}

// 問題詳細を表示
function showQuestionDetail(questionId) {
    const question = allQuestions.find(q => q.id === questionId);
    if (!question) return;

    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <h2>問題詳細: ${question.id}</h2>
        
        <div class="modal-section">
            <h4>基本情報</h4>
            <p><strong>Year:</strong> ${question.year}</p>
            <p><strong>Category:</strong> ${question.category}</p>
            <p><strong>Theme:</strong> ${question.theme}</p>
            <p><strong>Difficulty:</strong> <span class="badge difficulty-${question.difficulty}">${question.difficulty}</span></p>
            <p><strong>Tags:</strong> ${question.tags.join(', ')}</p>
        </div>

        <div class="modal-section">
            <h4>学習ゴール</h4>
            <p><strong>日本語:</strong> ${question.learning_goal_ja}</p>
            <p><strong>English:</strong> ${question.learning_goal_en}</p>
        </div>

        <div class="modal-section">
            <h4>よくある誤解</h4>
            <p><strong>日本語:</strong> ${question.common_misconception_ja}</p>
            <p><strong>English:</strong> ${question.common_misconception_en}</p>
        </div>

        <div class="modal-question">
            <h3>設問（日本語）</h3>
            <p>${question.question_ja}</p>
            <h4>選択肢:</h4>
            <ul>
                ${question.choices_ja.map((choice, idx) => 
                    `<li>${choice} ${idx === question.correct_choice_index ? '✓' : ''}</li>`
                ).join('')}
            </ul>
            <p><strong>解説:</strong> ${question.explanation_ja}</p>
        </div>

        <div class="modal-question">
            <h3>Question (English)</h3>
            <p>${question.question_en}</p>
            <h4>Choices:</h4>
            <ul>
                ${question.choices_en.map((choice, idx) => 
                    `<li>${choice} ${idx === question.correct_choice_index ? '✓' : ''}</li>`
                ).join('')}
            </ul>
            <p><strong>Explanation:</strong> ${question.explanation_en}</p>
        </div>

        <div class="modal-section">
            <p><strong>Source URL:</strong> <a href="${question.source_url}" target="_blank">${question.source_url}</a></p>
        </div>
    `;

    document.getElementById('questionModal').classList.remove('hidden');
}

// モーダルを閉じる
function closeModal() {
    document.getElementById('questionModal').classList.add('hidden');
}

// グローバルスコープに公開
window.showQuestionDetail = showQuestionDetail;

