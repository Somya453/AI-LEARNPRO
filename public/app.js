// Enhanced state with gamification
const STATE_KEY = 'aiLearnProState';
const defaultState = {
    user: null,
    enrolledCourses: [],
    badges: [],
    recommendation: 'AI Fundamentals',
    leaderboard: [
        { name: 'Alice', score: 2500 },
        { name: 'Bob', score: 2200 },
        { name: 'Charlie', score: 2000 }
    ]
};
let state = { ...defaultState };
let quizQuestions = [];
let currentQuestion = 0;
let score = 0;
let difficulty = 'easy';
const QUIZ_SESSION_LENGTH = 10;

// Supabase client initialization
let supabaseClient = null;
let supabaseReady = false;

// Game state
let gameState = {
    currentXP: 1250,
    level: 5,
    completedGames: [],
    achievements: []
};

// Home challenges with XP rewards
const homeChallenges = [
    { id: 'challenge-quiz', label: 'Complete an AI quiz', done: false, xp: 50 },
    { id: 'challenge-tutor', label: 'Ask the AI Tutor a question', done: false, xp: 30 },
    { id: 'challenge-path', label: 'Explore a learning path', done: false, xp: 40 }
];

// Demo quiz data
const demoQuiz = {
    question: "What does AI stand for?",
    options: ["Artificial Intelligence", "Automated Integration", "Advanced Internet"],
    correct: 0
};

function loadState() {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
        state = JSON.parse(saved);
    }
    const savedGame = localStorage.getItem('aiLearnProGameState');
    if (savedGame) {
        gameState = JSON.parse(savedGame);
    }
}

function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    localStorage.setItem('aiLearnProGameState', JSON.stringify(gameState));
}

// Enhanced challenge system with XP
function toggleHomeChallenge(id) {
    const challenge = homeChallenges.find(item => item.id === id);
    if (!challenge) return;

    if (!challenge.done) {
        // If not done, perform the action
        if (id === 'challenge-quiz') {
            // Navigate to quiz page
            window.location.href = 'ai.html';
            return;
        } else if (id === 'challenge-tutor') {
            // Navigate to tutor page
            window.location.href = 'tutor.html';
            return;
        } else if (id === 'challenge-path') {
            // Navigate to paths page
            window.location.href = 'paths.html';
            return;
        }
    }

    // Mark as done and award XP
    challenge.done = !challenge.done;
    const button = document.getElementById(id);
    if (button) {
        button.textContent = challenge.done ? '✓ Completed' : challenge.label;
        button.classList.toggle('completed', challenge.done);
    }

    if (challenge.done) {
        // Award XP
        gameState.currentXP += challenge.xp;
        updateXP();
        showXPNotification(challenge.xp);

        // Check for level up
        checkLevelUp();
    }

    initHomeChallenges();
    saveState();
}

function updateXP() {
    const xpDisplay = document.querySelector('.xp-display strong');
    if (xpDisplay) {
        xpDisplay.textContent = gameState.currentXP.toLocaleString();
    }
}

function checkLevelUp() {
    const newLevel = Math.floor(gameState.currentXP / 250) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        showLevelUpNotification(newLevel);
        updateLevelDisplay();
    }
}

function updateLevelDisplay() {
    const levelDisplay = document.querySelector('.level-display');
    if (levelDisplay) {
        levelDisplay.textContent = `Level ${gameState.level}`;
    }
}

function showXPNotification(xp) {
    const notification = document.createElement('div');
    notification.className = 'xp-notification';
    notification.innerHTML = `+${xp} XP`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 2000);
}

function showLevelUpNotification(level) {
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.innerHTML = `🎉 Level ${level} Unlocked!`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Demo quiz functionality
function startDemo() {
    const demoSection = document.querySelector('.demo-section');
    if (demoSection) {
        demoSection.classList.add('active');
        // Scroll to demo
        demoSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function selectOption(element) {
    const options = document.querySelectorAll('.option');
    options.forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    
    const selectedText = element.textContent.trim();
    const isCorrect = selectedText === demoQuiz.options[demoQuiz.correct];
    
    setTimeout(() => {
        if (isCorrect) {
            element.classList.add('correct');
            showXPNotification(10);
            gameState.currentXP += 10;
            updateXP();
            checkLevelUp();
        } else {
            element.classList.add('incorrect');
            // Show correct answer
            options.forEach((opt, index) => {
                if (index === demoQuiz.correct) {
                    opt.classList.add('correct');
                }
            });
        }
        
        setTimeout(() => {
            // Reset demo
            options.forEach(opt => {
                opt.classList.remove('selected', 'correct', 'incorrect');
            });
            const demoSection = document.querySelector('.demo-section');
            if (demoSection) {
                demoSection.classList.remove('active');
            }
        }, 2000);
    }, 500);
}

// Game functions
function startGame(gameType) {
    switch (gameType) {
        case 'ai-basics':
            window.location.href = 'ai.html';
            break;
        case 'ml-challenge':
            window.location.href = 'ai.html';
            break;
        case 'code-puzzle':
            window.location.href = 'tutor.html';
            break;
        default:
            console.log('Unknown game type:', gameType);
    }
}

function initHomeChallenges() {
    const status = document.getElementById('challengeStatus');
    const fill = document.getElementById('challengeFill');
    if (!status || !fill) return;

    const completedCount = homeChallenges.filter(challenge => challenge.done).length;
    status.textContent = `${completedCount} / ${homeChallenges.length} missions complete`;
    fill.style.width = `${(completedCount / homeChallenges.length) * 100}%`;

    updateXP();
    updateLevelDisplay();
}

// Quest system variables
let currentQuest = null;
let questQuestions = [];
let questTimer = null;
let timeLeft = 30;
let currentQuestionIndex = 0;
let questScore = 0;
let questStreak = 0;
let bestStreak = 0;
let questionStartTime = 0;
let totalTime = 0;

// Quest data
const questData = {
    basics: {
        name: 'AI Basics Quest',
        questions: [
            {
                category: 'AI Fundamentals',
                question: 'What does AI stand for?',
                options: ['Artificial Intelligence', 'Automated Integration', 'Advanced Internet', 'Algorithmic Implementation'],
                correct: 0,
                hint: 'It\'s the most common term used in technology and science fiction.'
            },
            {
                category: 'Machine Learning',
                question: 'Which type of machine learning learns from labeled data?',
                options: ['Unsupervised Learning', 'Supervised Learning', 'Reinforcement Learning', 'Deep Learning'],
                correct: 1,
                hint: 'This type uses examples with known answers to train the model.'
            },
            {
                category: 'Neural Networks',
                question: 'What is the basic building block of a neural network?',
                options: ['Algorithm', 'Neuron', 'Database', 'Server'],
                correct: 1,
                hint: 'It\'s inspired by biological neurons in the human brain.'
            },
            {
                category: 'AI Ethics',
                question: 'What is a major concern in AI development?',
                options: ['Speed', 'Bias and Fairness', 'Color Scheme', 'Font Size'],
                correct: 1,
                hint: 'AI systems can reflect and amplify human biases in their training data.'
            },
            {
                category: 'AI Applications',
                question: 'Which of these is NOT a common AI application?',
                options: ['Image Recognition', 'Voice Assistants', 'Weather Prediction', 'Manual Bookkeeping'],
                correct: 3,
                hint: 'AI is typically used for tasks that are repetitive or require pattern recognition.'
            }
        ],
        xpPerQuestion: 25
    },
    ml: {
        name: 'ML Mastery Challenge',
        questions: [
            {
                category: 'Supervised Learning',
                question: 'Which algorithm is commonly used for classification tasks?',
                options: ['K-Means Clustering', 'Linear Regression', 'Decision Trees', 'PCA'],
                correct: 2,
                hint: 'This algorithm creates a tree-like model of decisions.'
            },
            {
                category: 'Unsupervised Learning',
                question: 'What does K-Means clustering aim to do?',
                options: ['Predict continuous values', 'Group similar data points', 'Rank items', 'Generate text'],
                correct: 1,
                hint: 'It finds natural groupings in data without predefined categories.'
            },
            {
                category: 'Deep Learning',
                question: 'What type of neural network is particularly good at image recognition?',
                options: ['RNN', 'CNN', 'GAN', 'Autoencoder'],
                correct: 1,
                hint: 'CNN stands for Convolutional Neural Network.'
            },
            {
                category: 'Model Evaluation',
                question: 'Which metric is used to evaluate classification model performance?',
                options: ['Mean Squared Error', 'Accuracy', 'R-squared', 'Silhouette Score'],
                correct: 1,
                hint: 'It measures the percentage of correct predictions.'
            },
            {
                category: 'Overfitting',
                question: 'What technique helps prevent overfitting in neural networks?',
                options: ['Increasing learning rate', 'Adding more layers', 'Dropout', 'Using more data'],
                correct: 2,
                hint: 'This randomly ignores some neurons during training.'
            }
        ],
        xpPerQuestion: 50
    },
    advanced: {
        name: 'Advanced AI Odyssey',
        questions: [
            {
                category: 'Transformers',
                question: 'What is the key innovation of Transformer architecture?',
                options: ['Convolution', 'Attention Mechanism', 'Recurrent Connections', 'Batch Normalization'],
                correct: 1,
                hint: 'This allows the model to focus on relevant parts of the input.'
            },
            {
                category: 'NLP',
                question: 'What does BERT stand for?',
                options: ['Basic Encoding Representation Transformer', 'Bidirectional Encoder Representations from Transformers', 'Binary Encoding Recurrent Transformer', 'Bayesian Encoder Representation Transformer'],
                correct: 1,
                hint: 'It\'s a popular language model developed by Google.'
            },
            {
                category: 'Computer Vision',
                question: 'What is the purpose of non-maximum suppression in object detection?',
                options: ['Increase image resolution', 'Remove duplicate detections', 'Enhance colors', 'Reduce file size'],
                correct: 1,
                hint: 'It prevents multiple bounding boxes for the same object.'
            },
            {
                category: 'Reinforcement Learning',
                question: 'What is the role of the reward function in RL?',
                options: ['Train the model', 'Define desired behavior', 'Optimize parameters', 'Generate data'],
                correct: 1,
                hint: 'It tells the agent what actions are good or bad.'
            },
            {
                category: 'AI Safety',
                question: 'What is "reward hacking" in AI systems?',
                options: ['Optimizing for unintended objectives', 'Speeding up training', 'Reducing computational cost', 'Improving accuracy'],
                correct: 0,
                hint: 'AI finds loopholes in the reward system to maximize score.'
            }
        ],
        xpPerQuestion: 100
    }
};

function startQuest(difficulty) {
    currentQuest = difficulty;
    questQuestions = [...questData[difficulty].questions];
    shuffleArray(questQuestions);

    currentQuestionIndex = 0;
    questScore = 0;
    questStreak = 0;
    bestStreak = 0;
    totalTime = 0;

    document.getElementById('quiz').style.display = 'block';
    document.getElementById('result').style.display = 'none';

    loadQuestion();
    updateQuestStats();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function loadQuestion() {
    if (currentQuestionIndex >= questQuestions.length) {
        showResults();
        return;
    }

    const question = questQuestions[currentQuestionIndex];
    const questionCard = document.getElementById('questionCard');
    const optionsContainer = document.getElementById('options');

    document.getElementById('questionCategory').textContent = question.category;
    document.getElementById('question').textContent = question.question;
    document.getElementById('questionHint').textContent = '';
    document.getElementById('questionHint').style.display = 'none';

    document.getElementById('currentQuestionNum').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = questQuestions.length;

    optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'quiz-option';
        optionElement.textContent = option;
        optionElement.onclick = () => selectAnswer(index);
        optionsContainer.appendChild(optionElement);
    });

    timeLeft = 30;
    updateTimer();
    startTimer();
    questionStartTime = Date.now();

    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('hintBtn').style.display = 'inline-block';
}

function startTimer() {
    if (questTimer) clearInterval(questTimer);
    questTimer = setInterval(() => {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) {
            clearInterval(questTimer);
            selectAnswer(-1); // Time out
        }
    }, 1000);
}

function updateTimer() {
    document.getElementById('timer').textContent = timeLeft;
    document.getElementById('timer').style.color = timeLeft <= 10 ? '#f44336' : '#1f2b6f';
}

function selectAnswer(selectedIndex) {
    clearInterval(questTimer);
    const question = questQuestions[currentQuestionIndex];
    const options = document.querySelectorAll('.quiz-option');
    const timeSpent = (Date.now() - questionStartTime) / 1000;
    totalTime += timeSpent;

    // Show correct/incorrect answers
    options.forEach((option, index) => {
        if (index === question.correct) {
            option.classList.add('correct');
        } else if (index === selectedIndex && selectedIndex !== question.correct) {
            option.classList.add('incorrect');
        }
    });

    // Update score and streak
    if (selectedIndex === question.correct) {
        questScore++;
        questStreak++;
        if (questStreak > bestStreak) bestStreak = questStreak;

        // Award XP
        const xpEarned = questData[currentQuest].xpPerQuestion;
        gameState.currentXP += xpEarned;
        showXPNotification(xpEarned);
        checkLevelUp();
        saveState();
    } else {
        questStreak = 0;
    }

    updateQuestStats();
    document.getElementById('nextBtn').style.display = 'inline-block';
    document.getElementById('hintBtn').style.display = 'none';
}

function showHint() {
    const question = questQuestions[currentQuestionIndex];
    document.getElementById('questionHint').textContent = question.hint;
    document.getElementById('questionHint').style.display = 'block';

    // Deduct XP for hint
    gameState.currentXP = Math.max(0, gameState.currentXP - 10);
    updateXP();
    saveState();

    document.getElementById('hintBtn').style.display = 'none';
}

function nextQuestion() {
    currentQuestionIndex++;
    loadQuestion();
}

function showResults() {
    document.getElementById('quiz').style.display = 'none';
    document.getElementById('result').style.display = 'block';

    const percentage = Math.round((questScore / questQuestions.length) * 100);
    const avgTime = Math.round(totalTime / questQuestions.length);

    document.getElementById('finalScore').textContent = questScore;
    document.getElementById('scorePercentage').textContent = `${percentage}%`;
    document.getElementById('resultStreak').textContent = bestStreak;
    document.getElementById('avgTime').textContent = `${avgTime}s`;
    document.getElementById('xpEarned').textContent = questScore * questData[currentQuest].xpPerQuestion;

    // Update feedback based on performance
    let feedback = '';
    if (percentage >= 90) {
        feedback = 'Outstanding! You\'re an AI expert! 🏆';
    } else if (percentage >= 70) {
        feedback = 'Great job! You have a solid understanding of AI concepts. 🎉';
    } else if (percentage >= 50) {
        feedback = 'Good effort! Keep practicing to improve your knowledge. 💪';
    } else {
        feedback = 'Keep learning! Every expert was once a beginner. 📚';
    }
    document.getElementById('resultFeedback').querySelector('p').textContent = feedback;

    updateQuestStats();
}

function restartQuest() {
    startQuest(currentQuest);
}

function changeDifficulty() {
    document.getElementById('result').style.display = 'none';
    // This would typically show a difficulty selection screen
    // For now, just go back to basics
    startQuest('basics');
}

function updateQuestStats() {
    document.getElementById('currentScore').textContent = questScore;
    document.getElementById('currentStreak').textContent = questStreak;
    const accuracy = questQuestions.length > 0 ? Math.round((questScore / (currentQuestionIndex + 1)) * 100) : 0;
    document.getElementById('accuracyRate').textContent = `${accuracy}%`;
}

// Animated counter for stats
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 20);
}

// Initialize counters on scroll
function initCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        animateCounter(stat, target);
    });
}

// Enhanced scroll animations
function handleScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Special handling for counters
                if (entry.target.classList.contains('hero-stats')) {
                    initCounters();
                }
            }
        });
    }, { threshold: 0.1 });

    // Observe all animatable elements
    document.querySelectorAll('.feature-grid, .grid, .challenge-arena, .game-grid, .testimonials-grid, .hero-stats').forEach(section => {
        observer.observe(section);
    });
}

// Particle effect for interactive elements
function createParticles(element, count = 5) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle-effect';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 2 + 's';
        element.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 2000);
    }
}

// Add particle effects to buttons on hover
function initParticleEffects() {
    document.querySelectorAll('.cta-button, .challenge-btn, .game-card').forEach(button => {
        button.addEventListener('mouseenter', () => {
            createParticles(button.parentNode, 3);
        });
    });
}

async function isLoggedIn() {
    if (!supabaseReady || !supabaseClient) {
        console.warn('⚠️ Supabase not ready for isLoggedIn check');
        return false;
    }
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        return !!user;
    } catch (err) {
        console.error('Error checking login status:', err);
        return false;
    }
}

async function logout() {
    if (!supabaseReady || !supabaseClient) {
        console.warn('⚠️ Supabase not ready for logout');
        return;
    }
    try {
        await supabaseClient.auth.signOut();
        console.log('✓ User logged out');
        // Redirect to home or login page
        window.location.href = 'index.html';
    } catch (err) {
        console.error('Error logging out:', err);
    }
}

function toggleSidebar() {
    console.log('🔄 Sidebar toggle clicked - current state:', document.body.classList.contains('sidebar-open'));
    document.body.classList.toggle('sidebar-open');
    const newState = document.body.classList.contains('sidebar-open');
    console.log('Sidebar state after toggle:', newState ? 'OPEN' : 'CLOSED');

    // Force a reflow to ensure CSS transitions work
    document.body.offsetHeight;
}

function closeSidebar() {
    console.log('🔄 Sidebar close triggered - current state:', document.body.classList.contains('sidebar-open'));
    document.body.classList.remove('sidebar-open');
    console.log('Sidebar state after close: CLOSED');
}

async function updateNav() {
    if (!supabaseReady || !supabaseClient) {
        console.warn('⚠️ Supabase not ready for updateNav');
        return;
    }
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        console.log('👤 User state:', user ? 'logged in' : 'not logged in');

        const loginBtn = document.querySelector('a[href="login.html"]');
        const registerBtn = document.querySelector('a[href="register.html"]');
        const logoutBtn = document.getElementById('logoutBtn');

        if (user) {
            // User is logged in
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
        } else {
            // User is not logged in
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (registerBtn) registerBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    } catch (err) {
        console.error('Error updating nav:', err);
    }
}

async function initSupabase() {
    try {
        // Fetch Supabase configuration from server
        const response = await fetch('/api/config');
        const config = await response.json();

        if (!config.supabaseUrl || !config.supabaseKey) {
            throw new Error('Missing Supabase configuration');
        }

        supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
        supabaseReady = true;
        console.log('✅ Supabase initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOMContentLoaded fired');

    // Initialize Supabase
    if (!(await initSupabase())) {
        console.error('❌ Failed to initialize Supabase');
    }

    loadState();
    await updateNav();

    // Listen for auth state changes
    if (supabaseReady && supabaseClient) {
        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Auth state changed:', event);
            if (event === 'SIGNED_IN') {
                state.user = session.user;
                saveState();
            } else if (event === 'SIGNED_OUT') {
                state.user = null;
                saveState();
            }
            updateNav();
        });
    }

    // Setup sidebar
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const backdrop = document.getElementById('sidebarBackdrop');

    console.log('📱 Sidebar elements found:', {
        toggle: !!sidebarToggle,
        close: !!sidebarClose,
        backdrop: !!backdrop
    });

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
        console.log('✓ Sidebar toggle listener attached');
    } else {
        console.error('❌ Sidebar toggle button NOT found');
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
        console.log('✓ Sidebar close listener attached');
    }

    if (backdrop) {
        backdrop.addEventListener('click', closeSidebar);
        console.log('✓ Backdrop listener attached');
    }

    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
        console.log('✓ Logout listener attached');
    }

    // Re-run updateNav after a short delay to ensure it works
    setTimeout(() => {
        updateNav();
    }, 1000);

    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendMessage();
            }
        });
        console.log('✓ Chat input Enter listener attached');
    }

    if (window.location.pathname.endsWith('ai.html')) {
        // Initialize quest system
        document.getElementById('nextBtn').addEventListener('click', nextQuestion);
        document.getElementById('hintBtn').addEventListener('click', showHint);
        updateQuestStats();
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('✓ Login form found, attaching handler');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const messageEl = document.getElementById('message');

            if (email && password) {
                messageEl.textContent = '⏳ Logging in...';
                messageEl.style.color = '#2196F3';
                console.log('📧 Attempting login with:', email);

                if (!supabaseReady || !supabaseClient) {
                    messageEl.textContent = '❌ Error: Supabase not initialized';
                    messageEl.style.color = '#f44336';
                    console.error('Supabase not ready');
                    return;
                }

                const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (error) {
                    messageEl.textContent = '❌ Error: ' + error.message;
                    messageEl.style.color = '#f44336';
                    console.error('Login error:', error);
                } else {
                    messageEl.textContent = '✓ Login successful! Redirecting...';
                    messageEl.style.color = '#4CAF50';
                    messageEl.style.fontWeight = 'bold';
                    console.log('✓ Login successful');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                }
            } else {
                messageEl.textContent = '❌ Enter email and password to continue.';
                messageEl.style.color = '#f44336';
            }
        });
    } else {
        console.log('ℹ️ Not on login page');
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        console.log('✓ Register form found, attaching handler');
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const messageEl = document.getElementById('message');

            if (name && email && password) {
                messageEl.textContent = '⏳ Creating account...';
                messageEl.style.color = '#4CAF50';
                console.log('📝 Attempting registration for:', email);

                if (!supabaseReady || !supabaseClient) {
                    messageEl.textContent = '❌ Error: Supabase not initialized';
                    messageEl.style.color = '#f44336';
                    console.error('Supabase not ready');
                    return;
                }

                const { data, error } = await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: { data: { name } }
                });
                if (error) {
                    messageEl.textContent = '❌ Error: ' + error.message;
                    messageEl.style.color = '#f44336';
                    console.error('Registration error:', error);
                } else {
                    messageEl.textContent = '✓ Account created successfully! Redirecting to dashboard...';
                    messageEl.style.color = '#4CAF50';
                    messageEl.style.fontWeight = 'bold';
                    console.log('✓ Registration successful');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 2000);
                }
            } else {
                messageEl.textContent = '❌ Fill all fields to register.';
                messageEl.style.color = '#f44336';
            }
        });
    } else {
        console.log('ℹ️ Not on register page');
    }

    if (window.location.pathname.endsWith('courses.html')) {
        loadCourses();
    }

    if (window.location.pathname.endsWith('paths.html')) {
        loadPaths();
    }

    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        initHomeChallenges();
        // Add animation to challenge arena
        setTimeout(() => {
            const challengeArena = document.querySelector('.challenge-arena');
            if (challengeArena) {
                challengeArena.classList.add('visible');
            }
        }, 1000);
    }

    if (window.location.pathname.endsWith('ai.html')) {
        loadAIPage();
    }

    if (window.location.pathname.endsWith('tutor.html')) {
        addMessage('AI Tutor', 'Hello! Ask me anything about AI, code, or practice problems.');
    }

    if (window.location.pathname.endsWith('community.html')) {
        loadCommunity();
    }

    if (window.location.pathname.endsWith('analytics.html')) {
        loadAnalytics();
    }

    if (window.location.pathname.endsWith('dashboard.html')) {
        const loggedIn = await isLoggedIn();
        if (!loggedIn) {
            window.location.href = 'login.html';
        } else {
            loadDashboard();
        }
    }
});

function getCourses() {
    return [
        { id: '1', title: 'Introduction to AI', description: 'AI fundamentals, logic, and practical examples.', difficulty: 'easy', category: 'AI Basics' },
        { id: '2', title: 'Machine Learning Fundamentals', description: 'Supervised and unsupervised learning techniques.', difficulty: 'medium', category: 'Machine Learning' },
        { id: '3', title: 'Deep Learning with Python', description: 'Build neural networks and real projects.', difficulty: 'hard', category: 'Deep Learning' },
        { id: '4', title: 'AI for Business', description: 'Use AI to solve real-world organizational problems.', difficulty: 'medium', category: 'Applications' }
    ];
}

function loadCourses() {
    const courses = getCourses();
    const recommendation = state.recommendation;
    const recommendedHTML = `<div class="feature-card"><h3>Recommended for you</h3><p>Based on your profile and performance, start with <strong>${recommendation}</strong>.</p></div>`;
    const recommendedEl = document.getElementById('recommended');
    if (recommendedEl) recommendedEl.innerHTML = recommendedHTML;

    const coursesDiv = document.getElementById('courses');
    if (coursesDiv) {
        coursesDiv.innerHTML = courses.map(course => `
            <div class="course-card">
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <p><strong>Level:</strong> ${course.difficulty}</p>
                <p><strong>Category:</strong> ${course.category}</p>
                <button onclick="enroll('${course.id}')">Enroll</button>
            </div>
        `).join('');
    }

    const problems = generatePracticeProblems();
    const problemsEl = document.getElementById('practiceProblems');
    if (problemsEl) problemsEl.innerHTML = problems.map(problem => `<div class="course-card"><strong>${problem.title}</strong><p>${problem.description}</p></div>`).join('');
}

async function enroll(courseId) {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
        alert('Please login to enroll.');
        return;
    }
    if (state.enrolledCourses.includes(courseId)) {
        alert('You are already enrolled in this course.');
        return;
    }
    state.enrolledCourses.push(courseId);
    state.badges = Array.from(new Set([...state.badges, 'Course Enroller']));
    saveState();
    alert('Enrolled successfully!');
    loadDashboard();
}

function loadPaths() {
    const pathEl = document.getElementById('recommendedPath');
    if (pathEl) pathEl.textContent = `Recommended Path: ${state.recommendation}`;
}

function loadAIPage() {
    quizQuestions = [
        { id: 'q1', question: 'What is backpropagation?', options: ['A learning algorithm', 'A dataset format', 'A model evaluation metric', 'A visualization tool'], answer: 0, difficulty: 'easy' },
        { id: 'q2', question: 'What does overfitting mean?', options: ['Model performs poorly on training data', 'Model memorizes training data', 'Data has no labels', 'Model is under-trained'], answer: 1, difficulty: 'easy' },
        { id: 'q3', question: 'What is supervised learning?', options: ['Learning without labels', 'Learning with labeled data', 'Learning by trial and error', 'Learning patterns in data'], answer: 1, difficulty: 'easy' },
        { id: 'q4', question: 'Which of these is a programming language commonly used in AI?', options: ['HTML', 'Python', 'CSS', 'SQL'], answer: 1, difficulty: 'easy' },
        { id: 'q5', question: 'What is a neural network?', options: ['A type of database', 'A network of interconnected nodes', 'A sorting algorithm', 'A data visualization tool'], answer: 1, difficulty: 'easy' },
        { id: 'q6', question: 'What is machine learning?', options: ['Writing code manually', 'Learning from data automatically', 'Storing data in databases', 'Creating websites'], answer: 1, difficulty: 'easy' },
        { id: 'q7', question: 'What is deep learning?', options: ['Shallow networks', 'Networks with many layers', 'Simple algorithms', 'Data storage'], answer: 1, difficulty: 'easy' },
        { id: 'q8', question: 'What is AI?', options: ['Artificial Intelligence', 'Automated Input', 'Advanced Imaging', 'All Internet'], answer: 0, difficulty: 'easy' },
        { id: 'q9', question: 'Which activation function outputs 0 or positive values?', options: ['Sigmoid', 'Tanh', 'ReLU', 'Softmax'], answer: 2, difficulty: 'easy' },
        { id: 'q10', question: 'What is a dataset?', options: ['A type of computer', 'Collection of data', 'Programming language', 'Web browser'], answer: 1, difficulty: 'easy' },
        { id: 'q11', question: 'Which activation function is best for binary classification?', options: ['ReLU', 'Sigmoid', 'Softmax', 'Tanh'], answer: 1, difficulty: 'medium' },
        { id: 'q12', question: 'What is the purpose of a loss function?', options: ['To measure model accuracy', 'To measure model error', 'To visualize data', 'To preprocess data'], answer: 1, difficulty: 'medium' },
        { id: 'q13', question: 'What does CNN stand for?', options: ['Central Neural Network', 'Convolutional Neural Network', 'Computational Neural Network', 'Connected Neural Network'], answer: 1, difficulty: 'medium' },
        { id: 'q14', question: 'Which optimizer adapts learning rates for each parameter?', options: ['SGD', 'Adam', 'Gradient Descent', 'Momentum'], answer: 1, difficulty: 'medium' },
        { id: 'q15', question: 'What is regularization used for?', options: ['To speed up training', 'To prevent overfitting', 'To increase model complexity', 'To reduce data size'], answer: 1, difficulty: 'medium' },
        { id: 'q16', question: 'What is cross-validation?', options: ['Crossing data between models', 'Validating models on multiple data splits', 'Converting data formats', 'Checking code syntax'], answer: 1, difficulty: 'medium' },
        { id: 'q17', question: 'What is feature engineering?', options: ['Building features manually', 'Automatic feature creation', 'Removing features', 'Counting features'], answer: 0, difficulty: 'medium' },
        { id: 'q18', question: 'What is bias in ML?', options: ['Model preference for certain outcomes', 'Data imbalance', 'Code errors', 'Slow training'], answer: 0, difficulty: 'medium' },
        { id: 'q19', question: 'What is variance in ML?', options: ['Data variety', 'Model sensitivity to training data', 'Parameter count', 'Training time'], answer: 1, difficulty: 'medium' },
        { id: 'q20', question: 'What is ensemble learning?', options: ['Single model training', 'Combining multiple models', 'Data preprocessing', 'Model evaluation'], answer: 1, difficulty: 'medium' },
        { id: 'q21', question: 'Choose the best optimizer for fast convergence.', options: ['SGD', 'Adam', 'RMSProp', 'Adagrad'], answer: 1, difficulty: 'hard' },
        { id: 'q22', question: 'What is the vanishing gradient problem?', options: ['Gradients become too large', 'Gradients become too small', 'No gradients are calculated', 'Gradients are constant'], answer: 1, difficulty: 'hard' },
        { id: 'q23', question: 'Which technique is used to handle sequential data?', options: ['CNN', 'RNN', 'SVM', 'K-Means'], answer: 1, difficulty: 'hard' },
        { id: 'q24', question: 'What is transfer learning?', options: ['Moving data between devices', 'Using pre-trained models', 'Converting data formats', 'Sharing model weights'], answer: 1, difficulty: 'hard' },
        { id: 'q25', question: 'What is the purpose of batch normalization?', options: ['To normalize input data', 'To normalize layer outputs', 'To normalize weights', 'To normalize gradients'], answer: 1, difficulty: 'hard' },
        { id: 'q26', question: 'What is attention mechanism?', options: ['Focusing on important parts', 'Ignoring data', 'Random selection', 'Data sorting'], answer: 0, difficulty: 'hard' },
        { id: 'q27', question: 'What is generative AI?', options: ['Data analysis', 'Content creation', 'Data storage', 'Code compilation'], answer: 1, difficulty: 'hard' },
        { id: 'q28', question: 'What is reinforcement learning?', options: ['Supervised learning', 'Unsupervised learning', 'Learning by rewards', 'Manual programming'], answer: 2, difficulty: 'hard' },
        { id: 'q29', question: 'What is a transformer model?', options: ['Data transformer', 'Attention-based architecture', 'Simple neural network', 'Data storage'], answer: 1, difficulty: 'hard' },
        { id: 'q30', question: 'What is federated learning?', options: ['Centralized training', 'Distributed training', 'Single device training', 'Cloud training'], answer: 1, difficulty: 'hard' }
    ];
    currentQuestion = 0;
    score = 0;
    difficulty = 'easy';
    renderAdaptiveOptions();
    showAIQuestion();
}

function showAIQuestion() {
    const filtered = quizQuestions.filter(q => q.difficulty === difficulty);
    const question = filtered[currentQuestion % filtered.length];
    if (!question) {
        const questionEl = document.getElementById('question');
        if (questionEl) questionEl.innerHTML = '<h3>No questions available</h3>';
        return;
    }
    const questionEl = document.getElementById('question');
    if (questionEl) {
        questionEl.innerHTML = `
            <div class="quiz-meta">
                <span>Question ${currentQuestion + 1} of ${QUIZ_SESSION_LENGTH}</span>
                <span>Difficulty: ${difficulty}</span>
            </div>
            <h3>${question.question}</h3>`;
    }
    const optionsEl = document.getElementById('options');
    if (optionsEl) optionsEl.innerHTML = question.options.map((option, index) => `<button class="quiz-option" onclick="selectAIAnswer(${index}, '${question.id}')">${option}</button>`).join('');
}

function selectAIAnswer(index, questionId) {
    const question = quizQuestions.find(q => q.id === questionId);
    if (!question) return;
    if (index === question.answer) {
        score += 10;
        if (difficulty === 'easy') difficulty = 'medium';
        else if (difficulty === 'medium') difficulty = 'hard';
    } else {
        if (difficulty === 'hard') difficulty = 'medium';
        else if (difficulty === 'medium') difficulty = 'easy';
    }
    currentQuestion++;
    if (currentQuestion >= QUIZ_SESSION_LENGTH) {
        showAIResult();
        return;
    }
    showAIQuestion();
}

function showAIResult() {
    document.getElementById('quiz').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    document.getElementById('score').textContent = `${score} / ${QUIZ_SESSION_LENGTH * 10}`;
    document.getElementById('adaptiveSuggestion').textContent = `Recommended next step: ${score > 70 ? 'Advanced Practice Set' : 'Review Core Concepts'}`;
}

function renderAdaptiveOptions() {
    const suggestions = [
        'AI-powered adaptive quiz',
        'AI-generated practice problems',
        'Mock certification exam builder'
    ];
    const featuresEl = document.getElementById('adaptiveFeatures');
    if (featuresEl) featuresEl.innerHTML = suggestions.map(item => `<div class="feature-card"><p>${item}</p></div>`).join('');
}

function generatePracticeProblems() {
    return [
        { title: 'Backpropagation Exercise', description: 'Explain backpropagation step by step in a neural network setting.' },
        { title: 'Hyperparameter Challenge', description: 'Design an optimizer strategy for a shallow neural network.' }
    ];
}

function loadDashboard() {
    const user = state.user;
    const userName = user ? (user.user_metadata?.name || user.email || 'Learner') : 'Learner';
    const userEmail = user ? (user.email || 'demo@example.com') : 'demo@example.com';
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl) userInfoEl.innerHTML = `<p>Welcome, ${userName}!</p><p>Email: ${userEmail}</p>`;

    const progress = Math.min(80, 50 + state.enrolledCourses.length * 10);
    const progressFillEl = document.getElementById('progress-fill');
    if (progressFillEl) progressFillEl.style.width = `${progress}%`;

    const progressTextEl = document.getElementById('progress-text');
    if (progressTextEl) progressTextEl.textContent = `${progress}%`;

    const badgesEl = document.getElementById('badges');
    if (badgesEl) badgesEl.innerHTML = state.badges.map(badge => `<span class="badge">${badge}</span>`).join('');

    const coursesDiv = document.getElementById('enrolledCourses');
    if (coursesDiv) {
        const enrolled = getCourses().filter(course => state.enrolledCourses.includes(course.id));
        coursesDiv.innerHTML = enrolled.length ? enrolled.map(course => `<div class="course-card"><h4>${course.title}</h4><p>${course.description}</p></div>`).join('') : '<p>No enrolled courses yet. Explore courses to begin.</p>';
    }

    const heatmap = document.getElementById('heatmap');
    if (heatmap) {
        heatmap.innerHTML = state.heatmap.map(skill => `
            <div class="heatmap-row">
                <strong>${skill.skill}</strong>
                <div class="progress-bar"><div class="progress-fill" style="width:${skill.level}%"></div></div>
                <span>${skill.level}%</span>
            </div>
        `).join('');
    }
}

function loadCommunity() {
    const postsDiv = document.getElementById('forumPosts');
    if (postsDiv) postsDiv.innerHTML = state.communityPosts.map(post => `<div class="forum-card"><strong>${post.author}</strong><p>${post.text}</p><small>${post.time}</small></div>`).join('');

    const groupsDiv = document.getElementById('studyGroups');
    if (groupsDiv) groupsDiv.innerHTML = `
        <div class="course-card"><h4>AI Project Group</h4><p>Build an image classification model together.</p></div>
        <div class="course-card"><h4>ML Practice Buddies</h4><p>Daily problem-solving and code reviews.</p></div>
    `;
}

function postCommunityMessage() {
    const input = document.getElementById('communityInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    const author = state.user ? (state.user.user_metadata?.name || state.user.email || 'Guest') : 'Guest';
    state.communityPosts.unshift({ author, text, time: 'Just now' });
    saveState();
    loadCommunity();
    input.value = '';
}

function loadAnalytics() {
    const heatmapEl = document.getElementById('heatmapOverview');
    if (heatmapEl) heatmapEl.innerHTML = state.heatmap.map(skill => `<div class="skill-row"><span>${skill.skill}</span><div class="progress-bar"><div class="progress-fill" style="width:${skill.level}%"></div></div><span>${skill.level}%</span></div>`).join('');

    const leaderboardEl = document.getElementById('leaderboard');
    if (leaderboardEl) leaderboardEl.innerHTML = state.leaderboard.map(user => `<li>${user.name} - ${user.score} pts</li>`).join('');
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const message = input.value.trim();
    if (!message) return;
    addMessage('You', message);
    input.value = '';

    getAIResponse(message)
        .then(response => {
            addMessage('AI Tutor', response);
        })
        .catch(err => {
            console.error('AI API error:', err);
            addMessage('AI Tutor', err.message || 'Sorry, AI Tutor is temporarily unavailable. Please try again in a moment.');
        });
}

// AI API Integration Function
async function getAIResponse(message) {
    try {
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Handle specific error types
            if (response.status === 402 && errorData.error === 'AI service quota exceeded') {
                throw new Error('AI Tutor is currently unavailable due to API quota limits. Please add credits to your OpenAI account.');
            }
            
            throw new Error(errorData.error || 'Server error');
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('AI API Error:', error);
        throw error;
    }
}

function addMessage(sender, text) {
    const messagesDiv = document.getElementById('chat-messages');
    if (!messagesDiv) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = sender === 'You' ? 'chat-you' : 'chat-ai';
    messageDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}