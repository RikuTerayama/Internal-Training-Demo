// クイズアプリのメインロジック

let allQuestions = [];
let filteredQuestions = [];
let currentQuestionIndex = 0;
let currentLanguage = 'ja';
let progress = {
    answered: [],
    correct: 0,
    total: 0
};

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    await loadQuestions();
    loadProgress();
    setupEventListeners();
    updateFilters();
    showQuestion();
    updateProgress();
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

// localStorageから進捗を読み込む
function loadProgress() {
    const saved = localStorage.getItem('quizProgress');
    if (saved) {
        progress = JSON.parse(saved);
    }
}

// 進捗をlocalStorageに保存
function saveProgress() {
    localStorage.setItem('quizProgress', JSON.stringify(progress));
}

// イベントリスナー設定
function setupEventListeners() {
    document.getElementById('langToggle').addEventListener('click', toggleLanguage);
    document.getElementById('yearFilter').addEventListener('change', updateFilters);
    document.getElementById('categoryFilter').addEventListener('change', updateFilters);
    document.getElementById('themeFilter').addEventListener('change', updateFilters);
    document.getElementById('modeSelect').addEventListener('change', updateFilters);
    document.getElementById('resetButton').addEventListener('click', resetProgress);
    document.getElementById('nextButton').addEventListener('click', nextQuestion);
}

// 言語切替
function toggleLanguage() {
    currentLanguage = currentLanguage === 'ja' ? 'en' : 'ja';
    document.getElementById('langToggle').textContent = currentLanguage === 'ja' ? '日本語' : 'English';
    showQuestion();
}

// フィルタ更新
function updateFilters() {
    const year = document.getElementById('yearFilter').value;
    const category = document.getElementById('categoryFilter').value;
    const theme = document.getElementById('themeFilter').value;
    const mode = document.getElementById('modeSelect').value;

    // Themeフィルタの候補を更新
    updateThemeFilter(year, category);

    // フィルタリング
    filteredQuestions = allQuestions.filter(q => {
        if (year !== 'all' && q.year !== year) return false;
        if (category !== 'all' && q.category !== category) return false;
        if (theme !== 'all' && q.theme !== theme) return false;
        return true;
    });

    // モードに応じて並び替え
    if (mode === 'random') {
        filteredQuestions = shuffleArray([...filteredQuestions]);
    }

    // フィルタ条件を保存
    const filterKey = `${year}_${category}_${theme}_${mode}`;
    const savedIndex = localStorage.getItem(`quizIndex_${filterKey}`);
    currentQuestionIndex = savedIndex ? parseInt(savedIndex) : 0;

    if (filteredQuestions.length === 0) {
        document.getElementById('loadingMessage').classList.add('hidden');
        document.getElementById('noQuestionsMessage').classList.remove('hidden');
        document.getElementById('questionCard').classList.add('hidden');
    } else {
        document.getElementById('loadingMessage').classList.add('hidden');
        document.getElementById('noQuestionsMessage').classList.add('hidden');
        document.getElementById('questionCard').classList.remove('hidden');
        showQuestion();
    }
}

// Themeフィルタの候補を更新
function updateThemeFilter(year, category) {
    const themeFilter = document.getElementById('themeFilter');
    const currentTheme = themeFilter.value;

    // フィルタ条件に合う問題からThemeを抽出
    const themes = new Set();
    allQuestions.forEach(q => {
        if (year === 'all' || q.year === year) {
            if (category === 'all' || q.category === category) {
                themes.add(q.theme);
            }
        }
    });

    // Theme選択肢を更新
    themeFilter.innerHTML = '<option value="all">All</option>';
    themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme;
        if (theme === currentTheme) option.selected = true;
        themeFilter.appendChild(option);
    });
}

// 配列をシャッフル
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 問題を表示
function showQuestion() {
    if (filteredQuestions.length === 0) return;

    const question = filteredQuestions[currentQuestionIndex];
    const lang = currentLanguage;

    // 問題情報を表示
    document.getElementById('questionTheme').textContent = question.theme;
    document.getElementById('questionDifficulty').textContent = question.difficulty;
    document.getElementById('questionDifficulty').className = `badge difficulty-${question.difficulty}`;
    document.getElementById('questionTags').textContent = question.tags.join(', ');
    document.getElementById('questionNumber').textContent = `${currentQuestionIndex + 1} / ${filteredQuestions.length}`;
    document.getElementById('questionText').textContent = question[`question_${lang}`];

    // 選択肢を表示
    const choicesContainer = document.getElementById('choicesContainer');
    choicesContainer.innerHTML = '';
    const choices = question[`choices_${lang}`];
    choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'choice-button';
        button.textContent = choice;
        button.dataset.index = index;
        button.addEventListener('click', () => selectChoice(index, question));
        choicesContainer.appendChild(button);
    });

    // 結果表示をリセット
    document.getElementById('resultContainer').classList.add('hidden');
    document.getElementById('choicesContainer').style.pointerEvents = 'auto';
    
    // 選択肢のハイライトをリセット
    document.querySelectorAll('.choice-button').forEach(btn => {
        btn.classList.remove('selected', 'correct', 'incorrect');
    });

    // 既に回答済みかチェック
    const questionId = question.id;
    const answered = progress.answered.find(a => a.id === questionId);
    if (answered) {
        // 既に回答済みの場合は選択肢を無効化し、結果を表示
        document.getElementById('choicesContainer').style.pointerEvents = 'none';
        const buttons = document.querySelectorAll('.choice-button');
        buttons.forEach((btn, index) => {
            if (index === answered.selectedIndex) {
                btn.classList.add('selected');
                btn.classList.add(answered.correct ? 'correct' : 'incorrect');
            } else if (index === question.correct_choice_index) {
                btn.classList.add('correct');
            }
        });
        showResult(answered.selectedIndex, question, true);
    }
}

// 選択肢を選択
function selectChoice(selectedIndex, question) {
    // 選択肢を無効化
    document.getElementById('choicesContainer').style.pointerEvents = 'none';
    
    // 選択されたボタンをハイライト
    const buttons = document.querySelectorAll('.choice-button');
    buttons.forEach((btn, index) => {
        btn.classList.add('selected');
        if (index === selectedIndex) {
            btn.classList.add(selectedIndex === question.correct_choice_index ? 'correct' : 'incorrect');
        } else if (index === question.correct_choice_index) {
            btn.classList.add('correct');
        }
    });

    // 結果を表示
    showResult(selectedIndex, question, false);

    // 進捗を更新
    const questionId = question.id;
    const existingAnswer = progress.answered.findIndex(a => a.id === questionId);
    const isCorrect = selectedIndex === question.correct_choice_index;

    if (existingAnswer >= 0) {
        // 既存の回答を更新
        const oldAnswer = progress.answered[existingAnswer];
        if (oldAnswer.correct && !isCorrect) {
            progress.correct--;
        } else if (!oldAnswer.correct && isCorrect) {
            progress.correct++;
        }
        progress.answered[existingAnswer] = { id: questionId, selectedIndex, correct: isCorrect };
    } else {
        // 新しい回答を追加
        progress.answered.push({ id: questionId, selectedIndex, correct: isCorrect });
        progress.total++;
        if (isCorrect) progress.correct++;
    }

    saveProgress();
    updateProgress();
}

// 結果を表示
function showResult(selectedIndex, question, isReplay) {
    const lang = currentLanguage;
    const isCorrect = selectedIndex === question.correct_choice_index;
    
    const resultContainer = document.getElementById('resultContainer');
    const resultMessage = document.getElementById('resultMessage');
    const explanationText = document.getElementById('explanationText');
    const sourceLink = document.getElementById('sourceLink');

    resultMessage.textContent = isCorrect 
        ? (lang === 'ja' ? '✓ 正解' : '✓ Correct')
        : (lang === 'ja' ? '✗ 不正解' : '✗ Incorrect');
    resultMessage.className = `result-message ${isCorrect ? 'correct' : 'incorrect'}`;

    explanationText.textContent = question[`explanation_${lang}`];
    
    if (question.source_url) {
        sourceLink.href = question.source_url;
        sourceLink.textContent = lang === 'ja' ? '根拠リンク →' : 'Source Link →';
        sourceLink.classList.remove('hidden');
    } else {
        sourceLink.classList.add('hidden');
    }

    resultContainer.classList.remove('hidden');
}

// 次の問題へ
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex >= filteredQuestions.length) {
        currentQuestionIndex = 0; // 最初に戻る
    }
    
    // 現在のインデックスを保存
    const year = document.getElementById('yearFilter').value;
    const category = document.getElementById('categoryFilter').value;
    const theme = document.getElementById('themeFilter').value;
    const mode = document.getElementById('modeSelect').value;
    const filterKey = `${year}_${category}_${theme}_${mode}`;
    localStorage.setItem(`quizIndex_${filterKey}`, currentQuestionIndex.toString());

    showQuestion();
}

// 進捗を更新
function updateProgress() {
    const total = filteredQuestions.length;
    const answered = progress.answered.filter(a => 
        filteredQuestions.some(q => q.id === a.id)
    ).length;
    const correct = progress.answered.filter(a => 
        filteredQuestions.some(q => q.id === a.id) && a.correct
    ).length;
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    document.getElementById('progressText').textContent = `進捗: ${answered}/${total}`;
    document.getElementById('scoreText').textContent = `正解数: ${correct}`;
    document.getElementById('accuracyText').textContent = `正答率: ${accuracy}%`;
}

// 進捗をリセット
function resetProgress() {
    if (confirm('進捗をリセットしますか？')) {
        progress = { answered: [], correct: 0, total: 0 };
        localStorage.removeItem('quizProgress');
        // フィルタごとのインデックスもリセット
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('quizIndex_')) {
                localStorage.removeItem(key);
            }
        });
        currentQuestionIndex = 0;
        saveProgress();
        updateProgress();
        showQuestion();
    }
}

