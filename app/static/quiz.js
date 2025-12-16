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
    
    // URLパラメータからyear/track/themeを取得
    const urlParams = new URLSearchParams(window.location.search);
    const year = urlParams.get('year');
    const track = urlParams.get('track');
    const theme = urlParams.get('theme');
    
    if (year && track && theme) {
        // URLパラメータがある場合は自動フィルタリング
        applyUrlFilters(year, track, theme);
    } else {
        // パラメータがない場合は全問題を表示（フィルタ更新）
        updateFilters();
        // フィルタ更新後に問題を表示
        if (filteredQuestions.length > 0) {
            showQuestion();
        }
    }
    
    updateProgress();
});

// URLパラメータに基づいてフィルタを適用
function applyUrlFilters(year, track, theme) {
    // パラメータの検証
    const validYears = ['Year1', 'Year2'];
    const validTracks = ['governance', 'business', 'management'];
    
    if (!validYears.includes(year) || !validTracks.includes(track) || !theme) {
        console.warn('Invalid URL parameters, redirecting to home');
        showErrorMessage('無効なパラメータです。トップページに戻ります。');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        return;
    }
    
    // allQuestionsが読み込まれるまで待つ
    if (allQuestions.length === 0) {
        console.log('Waiting for questions to load...');
        setTimeout(() => {
            applyUrlFilters(year, track, theme);
        }, 200);
        return;
    }
    
    // フィルタ選択を設定
    const yearFilter = document.getElementById('yearFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const themeFilter = document.getElementById('themeFilter');
    
    if (yearFilter) yearFilter.value = year;
    if (categoryFilter) categoryFilter.value = track;
    
    // Themeフィルタの候補を更新
    updateThemeFilter(year, track);
    
    // Themeを設定（updateThemeFilter完了後に確実に設定）
    const setThemeFilter = () => {
        if (!themeFilter) return;
        
        // themeは日本語文字列なので、完全一致で検索
        const options = Array.from(themeFilter.options);
        const matchingOption = options.find(opt => opt.value === theme || opt.textContent === theme);
        
        if (matchingOption) {
            themeFilter.value = matchingOption.value;
            // フィルタを適用
            updateFilters();
            
            // フィルタ適用後に問題が0件の場合
            setTimeout(() => {
                if (filteredQuestions.length === 0) {
                    showErrorMessage('該当する問題が見つかりませんでした。トップページに戻ります。');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                }
            }, 100);
        } else {
            // 完全一致しない場合は、部分一致で検索
            const partialMatch = options.find(opt => 
                opt.textContent.includes(theme) || theme.includes(opt.textContent)
            );
            
            if (partialMatch) {
                themeFilter.value = partialMatch.value;
                updateFilters();
            } else {
                // テーマが見つからない場合（optionsがまだ生成されていない可能性がある）
                if (options.length <= 1) {
                    // optionsがまだ生成されていない場合は再試行
                    setTimeout(setThemeFilter, 100);
                } else {
                    // optionsは生成されているが一致しない場合はエラー
                    console.warn(`Theme not found: ${theme}`, 'Available themes:', Array.from(options).map(o => o.value));
                    showErrorMessage(`テーマ「${theme}」が見つかりません。トップページに戻ります。`);
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                }
            }
        }
    };
    
    // updateThemeFilter完了後に実行（少し遅延）
    setTimeout(setThemeFilter, 150);
}

// エラーメッセージを表示
function showErrorMessage(message) {
    const loadingMsg = document.getElementById('loadingMessage');
    if (loadingMsg) {
        loadingMsg.textContent = message;
        loadingMsg.style.color = '#e01e5a';
        loadingMsg.style.backgroundColor = '#fee';
        loadingMsg.classList.remove('hidden');
    }
}

// questions.jsonを読み込む
async function loadQuestions() {
    try {
        const response = await fetch('/static/questions.json');
        if (!response.ok) {
            throw new Error(`Failed to load questions: ${response.status} ${response.statusText}`);
        }
        
        // テキストとして先に読み込んで、JSONとしてパース
        const text = await response.text();
        try {
            allQuestions = JSON.parse(text);
        } catch (parseError) {
            // JSONパースエラーの詳細をログに出力（開発者向け）
            console.error('JSON Parse Error:', parseError);
            console.error('Error position:', parseError.message);
            
            // エラー位置付近のテキストを抽出（デバッグ用）
            const match = parseError.message.match(/position (\d+)/);
            if (match) {
                const pos = parseInt(match[1]);
                const start = Math.max(0, pos - 50);
                const end = Math.min(text.length, pos + 50);
                console.error('Context around error:', text.substring(start, end));
            }
            
            throw new Error(`JSON形式エラー: ${parseError.message}。データファイルを確認してください。`);
        }
        
        filteredQuestions = [...allQuestions];
        
        // 読み込み成功を表示（デバッグ用）
        console.log(`Loaded ${allQuestions.length} questions`);
        const loadingMsg = document.getElementById('loadingMessage');
        const loadCountMsg = document.getElementById('loadCountMessage');
        if (loadingMsg) {
            loadingMsg.classList.add('hidden');
        }
        if (loadCountMsg) {
            loadCountMsg.textContent = `✓ ${allQuestions.length}問を読み込みました`;
            loadCountMsg.style.display = 'block';
            setTimeout(() => {
                if (loadCountMsg) loadCountMsg.style.display = 'none';
            }, 3000);
        }
    } catch (error) {
        console.error('Error loading questions:', error);
        const loadingMsg = document.getElementById('loadingMessage');
        if (loadingMsg) {
            loadingMsg.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <p style="color: #e01e5a; font-weight: 600; margin-bottom: 12px;">問題の読み込みに失敗しました</p>
                    <p style="color: #616061; font-size: 14px; margin-bottom: 16px;">${error.message}</p>
                    <button onclick="location.reload()" class="btn-primary" style="margin-right: 8px;">再読み込み</button>
                    <a href="/" class="btn-secondary" style="display: inline-block; padding: 8px 16px; text-decoration: none;">トップページへ</a>
                </div>
            `;
            loadingMsg.style.color = '#e01e5a';
            loadingMsg.style.backgroundColor = '#fee';
            loadingMsg.classList.remove('hidden');
        }
    }
}

// 現在のユーザー名を取得
function getCurrentUserName() {
    return localStorage.getItem('currentUserName') || '';
}

// 現在のユーザー名を設定
function setCurrentUserName(name) {
    if (name) {
        localStorage.setItem('currentUserName', name);
    } else {
        localStorage.removeItem('currentUserName');
    }
}

// localStorageから進捗を読み込む（名前単位）
function loadProgress() {
    const userName = getCurrentUserName();
    if (userName) {
        const saved = localStorage.getItem(`quizProgress_${userName}`);
        if (saved) {
            try {
                progress = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse progress:', e);
                progress = { answered: [], correct: 0, total: 0 };
            }
        }
    }
}

// 進捗をlocalStorageに保存（名前単位）
function saveProgress() {
    const userName = getCurrentUserName();
    if (userName) {
        localStorage.setItem(`quizProgress_${userName}`, JSON.stringify(progress));
    } else {
        // 名前がない場合はデフォルトキーで保存
        localStorage.setItem('quizProgress', JSON.stringify(progress));
    }
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
    
    // ユーザー名入力欄のイベント
    const userNameInput = document.getElementById('userNameInput');
    if (userNameInput) {
        // 既存のユーザー名を復元
        const currentName = getCurrentUserName();
        if (currentName) {
            userNameInput.value = currentName;
            updateUserNameDisplay(currentName);
        }
        
        // ユーザー名変更時の処理
        userNameInput.addEventListener('blur', () => {
            const name = userNameInput.value.trim();
            if (name) {
                setCurrentUserName(name);
                // 進捗を新しい名前で読み込み
                loadProgress();
                updateProgress();
                updateUserNameDisplay(name);
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

// ユーザー名表示を更新
function updateUserNameDisplay(name) {
    const display = document.getElementById('currentUserName');
    if (display && name) {
        display.textContent = `（${name}）`;
        display.style.display = 'inline';
    } else if (display) {
        display.style.display = 'none';
    }
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
    const userName = getCurrentUserName();
    const confirmMsg = userName 
        ? `「${userName}」の進捗をリセットしますか？`
        : '進捗をリセットしますか？';
    
    if (confirm(confirmMsg)) {
        progress = { answered: [], correct: 0, total: 0 };
        
        // 名前単位で削除
        if (userName) {
            localStorage.removeItem(`quizProgress_${userName}`);
        } else {
            localStorage.removeItem('quizProgress');
        }
        
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


