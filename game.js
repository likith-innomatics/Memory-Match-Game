// Game state
let gameState = {
    cards: [],
    flippedCards: [],
    matchedPairs: [],
    score: 0,
    timeLeft: 30,
    timerInterval: null,
    category: null,
    isGameActive: false
};

// Game categories
const categories = {
    fruits: ['🍎', '🍌', '🍇', '🍊', '🍓', '🍑', '🍍', '🥝'],
    animals: ['🐶', '🐱', '🐼', '🦊', '🦁', '🐘', '🦒', '🐪'],
    emojis: ['😀', '😍', '🤔', '😎', '🤩', '😴', '🤗', '🥳'],
    planets: ['🌍', '🌎', '🌏', '⭐', '🌙', '☀️', '🌠', '🌌'],
    landmarks: ['🗽', '🗼', '🗿', '🏰', '🎡', '⛩️', '🏛️', '🕌']
};

// Sound effects (using base64 to avoid external dependencies)
const createAudio = (frequency, duration) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);
};

// Sound effects functions
const playFlipSound = () => createAudio(300, 0.1);
const playMatchSound = () => createAudio(500, 0.15);
const playGameOverSound = () => createAudio(200, 0.3);
const playWinSound = () => {
    createAudio(400, 0.1);
    setTimeout(() => createAudio(600, 0.15), 150);
    setTimeout(() => createAudio(800, 0.2), 300);
};

// DOM Elements
const landingPage = document.getElementById('landing-page');
const gamePage = document.getElementById('game-page');
const gameGrid = document.getElementById('game-grid');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const gameOverModal = document.getElementById('game-over-modal');
const finalScoreElement = document.getElementById('final-score');
const gameOverTitle = document.getElementById('game-over-title');

// Initialize game
function initializeGame(category, resume = false) {
    if (!resume) {
        gameState.category = category;
        gameState.cards = [...categories[category], ...categories[category]]
            .sort(() => Math.random() - 0.5);
        gameState.matchedPairs = [];
        gameState.score = 0;
        gameState.timeLeft = 30;
        gameState.flippedCards = [];
        gameState.isGameActive = true;
    }

    // Update UI
    scoreElement.textContent = gameState.score;
    timerElement.textContent = gameState.timeLeft;
    
    // Create game grid
    createGameGrid(resume);
    
    // Start timer
    startTimer();
    
    // Show game page
    landingPage.classList.add('hidden');
    gamePage.classList.remove('hidden');
    gameOverModal.classList.add('hidden');
}

// Create game grid
function createGameGrid(resume = false) {
    gameGrid.innerHTML = '';
    gameState.cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.index = index;
        
        cardElement.innerHTML = `
            <div class="card-front">${card}</div>
            <div class="card-back">?</div>
        `;
        
        if (resume && gameState.flippedCards.includes(index)) {
            cardElement.classList.add('flipped');
        }
        
        if (resume && gameState.matchedPairs.includes(index)) {
            cardElement.classList.add('flipped', 'matched');
        }
        
        cardElement.addEventListener('click', () => handleCardClick(cardElement, index));
        gameGrid.appendChild(cardElement);
    });
}

// Handle card click
function handleCardClick(cardElement, index) {
    if (!gameState.isGameActive || 
        gameState.flippedCards.length >= 2 || 
        gameState.flippedCards.includes(index) ||
        cardElement.classList.contains('matched')) {
        return;
    }

    playFlipSound();
    cardElement.classList.add('flipped');
    gameState.flippedCards.push(index);

    if (gameState.flippedCards.length === 2) {
        checkMatch();
    }
}

// Check for match
function checkMatch() {
    const [index1, index2] = gameState.flippedCards;
    const cards = document.querySelectorAll('.card');
    
    if (gameState.cards[index1] === gameState.cards[index2]) {
        // Match found
        setTimeout(() => {
            playMatchSound();
            cards[index1].classList.add('matched');
            cards[index2].classList.add('matched');
            gameState.matchedPairs.push(index1, index2);
            gameState.score += 10;
            scoreElement.textContent = gameState.score;
            
            if (gameState.matchedPairs.length === gameState.cards.length) {
                endGame(true);
            }
        }, 500);
    } else {
        // No match
        setTimeout(() => {
            cards[index1].classList.remove('flipped');
            cards[index2].classList.remove('flipped');
        }, 1000);
    }
    
    setTimeout(() => {
        gameState.flippedCards = [];
    }, 1000);
}

// Timer function
function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        timerElement.textContent = gameState.timeLeft;
        
        if (gameState.timeLeft <= 0) {
            endGame(false);
        }
    }, 1000);
}

// End game
function endGame(isWin) {
    gameState.isGameActive = false;
    clearInterval(gameState.timerInterval);
    
    if (isWin) {
        playWinSound();
        gameOverTitle.textContent = 'Congratulations!';
        gameState.score += gameState.timeLeft * 2; // Bonus points for remaining time
    } else {
        playGameOverSound();
        gameOverTitle.textContent = 'Game Over!';
    }
    
    finalScoreElement.textContent = gameState.score;
    gameOverModal.classList.remove('hidden');
    
    // Save high score to local storage
    const highScores = JSON.parse(localStorage.getItem('memoryGameHighScores') || '{}');
    if (!highScores[gameState.category] || gameState.score > highScores[gameState.category]) {
        highScores[gameState.category] = gameState.score;
        localStorage.setItem('memoryGameHighScores', JSON.stringify(highScores));
    }
}

// Event Listeners
document.querySelectorAll('.category-buttons button').forEach(button => {
    button.addEventListener('click', () => {
        initializeGame(button.dataset.category);
    });
});

document.getElementById('back-button').addEventListener('click', () => {
    clearInterval(gameState.timerInterval);
    landingPage.classList.remove('hidden');
    gamePage.classList.add('hidden');
});

document.getElementById('play-again').addEventListener('click', () => {
    initializeGame(gameState.category);
});

document.getElementById('change-category').addEventListener('click', () => {
    gameOverModal.classList.add('hidden');
    landingPage.classList.remove('hidden');
    gamePage.classList.add('hidden');
});

// Save game state before page unload
window.addEventListener('beforeunload', () => {
    if (gameState.isGameActive) {
        localStorage.setItem('savedGameState', JSON.stringify(gameState));
    } else {
        localStorage.removeItem('savedGameState');
    }
});

// Check for saved game state on load
window.addEventListener('load', () => {
    const savedState = localStorage.getItem('savedGameState');
    if (savedState) {
        const loadGame = confirm('Would you like to continue your previous game?');
        if (loadGame) {
            gameState = JSON.parse(savedState);
            initializeGame(gameState.category, true);
        } else {
            localStorage.removeItem('savedGameState');
        }
    }
});