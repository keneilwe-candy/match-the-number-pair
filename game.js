// --- 1. DOM Elements ---
let gameBoard = document.getElementById("gameBoard");
let logArea = document.getElementById("logArea");

// Stats Displays
let displayPlayer = document.getElementById("displayPlayer");
let displayScore = document.getElementById("displayScore");
let displayLives = document.getElementById("displayLives");
let displayMatches = document.getElementById("displayMatches");
let displayPairsLeft = document.getElementById("displayPairsLeft");
let displayTime = document.getElementById("displayTime");

// --- 2. Game State Variables ---
let currentScore = 0;
let matchesFound = 0;
let livesLeft = 3;
let time = 0;
let totalPairs = 0;
let flippedCards = [];
let isBoardLocked = false;
let gameStarted = false;
let timerInterval;

// Load Settings
let gameSettings = JSON.parse(sessionStorage.getItem('numberMatchSettings'));
if (!gameSettings) {
    alert("No game settings found. Returning to launcher.");
    window.location.href = 'index.html';
}

// Load Player Name from Cookie
let playerName = "Unknown";
let cookies = document.cookie.split(';');
for (let i = 0; i < cookies.length; i++) {
    let cookiePair = cookies[i].split('=');
    if (cookiePair[0].trim() === "playerName") {
        playerName = decodeURIComponent(cookiePair[1]);
    }
}

// --- 3. Initialization Function ---
function initializeGameUI() {
    displayPlayer.innerText = playerName;
    displayLives.innerText = livesLeft;

    gameBoard.className = "game-board board-" + gameSettings.boardSize;

    if (gameSettings.boardSize === "4x4") totalPairs = 8;
    else if (gameSettings.boardSize === "4x5") totalPairs = 10;
    else if (gameSettings.boardSize === "6x6") totalPairs = 18;

    displayPairsLeft.innerText = totalPairs;
}

// --- 4. The Master Deck ---
function GameCard(displayValue, secretId, category) {
    this.displayValue = displayValue;
    this.secretId = secretId;
    this.category = category;
}

const masterDeck = [
    new GameCard("4", 4, "digit"), new GameCard("Four", 4, "word"), new GameCard("8 / 2", 4, "equation"),
    new GameCard("7", 7, "digit"), new GameCard("Seven", 7, "word"), new GameCard("10 - 3", 7, "equation"),
    new GameCard("9", 9, "digit"), new GameCard("Nine", 9, "word"), new GameCard("3 x 3", 9, "equation"),
    new GameCard("12", 12, "digit"), new GameCard("Twelve", 12, "word"), new GameCard("6 + 6", 12, "equation"),
    new GameCard("15", 15, "digit"), new GameCard("Fifteen", 15, "word"), new GameCard("30 / 2", 15, "equation"),
    new GameCard("20", 20, "digit"), new GameCard("Twenty", 20, "word"), new GameCard("40 / 2", 20, "equation"),
    new GameCard("5", 5, "digit"), new GameCard("Five", 5, "word"), new GameCard("25 / 5", 5, "equation"),
    new GameCard("11", 11, "digit"), new GameCard("Eleven", 11, "word"), new GameCard("22 / 2", 11, "equation"),
    new GameCard("18", 18, "digit"), new GameCard("Eighteen", 18, "word"), new GameCard("9 x 2", 18, "equation"),
    new GameCard("25", 25, "digit"), new GameCard("Twenty-Five", 25, "word"), new GameCard("5 x 5", 25, "equation"),
    new GameCard("10", 10, "digit"), new GameCard("Ten", 10, "word"), new GameCard("100 / 10", 10, "equation"),
    new GameCard("14", 14, "digit"), new GameCard("Fourteen", 14, "word"), new GameCard("7 + 7", 14, "equation"),
    new GameCard("16", 16, "digit"), new GameCard("Sixteen", 16, "word"), new GameCard("4 x 4", 16, "equation"),
    new GameCard("30", 30, "digit"), new GameCard("Thirty", 30, "word"), new GameCard("15 x 2", 30, "equation"),
    new GameCard("50", 50, "digit"), new GameCard("Fifty", 50, "word"), new GameCard("100 / 2", 50, "equation")
];
let activeDeck = [];

function buildActiveDeck() {
    let allowedCategories = [];
    if (gameSettings.pairType === "numberWord") allowedCategories = ["digit", "word"];
    else if (gameSettings.pairType === "sumAnswer") allowedCategories = ["digit", "equation"];
    else allowedCategories = ["digit", "word", "equation"];

    let filteredDeck = masterDeck.filter(card => allowedCategories.includes(card.category));
    let uniqueIds = [...new Set(filteredDeck.map(card => card.secretId))];
    uniqueIds.sort(() => Math.random() - 0.5);

    activeDeck = [];
    let pairsAdded = 0;

    for (let i = 0; i < uniqueIds.length; i++) {
        if (pairsAdded >= totalPairs) break;
        let currentId = uniqueIds[i];
        let matchingCards = filteredDeck.filter(card => card.secretId === currentId);
        if (matchingCards.length >= 2) {
            activeDeck.push(matchingCards[0]);
            activeDeck.push(matchingCards[1]);
            pairsAdded++;
        }
    }
}

function shuffleDeck(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- 5. Rendering the Board ---
function renderBoard() {
    gameBoard.innerHTML = "";
    for (let i = 0; i < activeDeck.length; i++) {
        let cardElement = document.createElement('div');
        cardElement.classList.add('number-card');
        cardElement.dataset.matchId = activeDeck[i].secretId;
        cardElement.dataset.displayValue = activeDeck[i].displayValue;

        cardElement.addEventListener('click', function() {
            handleCardClick(cardElement);
        });
        gameBoard.appendChild(cardElement);
    }
}

// --- 6. Gameplay Interaction ---
function handleCardClick(clickedCard) {
    if (!gameStarted) {
        alert("Please click 'Start Game' first!");
        return;
    }
    if (isBoardLocked || clickedCard.classList.contains('flipped') || clickedCard.classList.contains('matched')) return;

    clickedCard.classList.add('flipped');
    clickedCard.innerText = clickedCard.dataset.displayValue;
    flippedCards.push(clickedCard);

    if (flippedCards.length === 2) {
        checkForMatch();
    }
}

function checkForMatch() {
    isBoardLocked = true;
    let card1 = flippedCards[0];
    let card2 = flippedCards[1];

    if (card1.dataset.matchId === card2.dataset.matchId) {
        // MATCH: JS Pop Animation & Green Glow
        card1.classList.add('matched');
        card2.classList.add('matched');
        card1.style.pointerEvents = 'none';
        card2.style.pointerEvents = 'none';

        let popFadeFrames = [
            { transform: 'scale(1)', opacity: 1, boxShadow: 'none' },
            { transform: 'scale(1.15)', opacity: 1, boxShadow: '0 0 20px #10b981', offset: 0.4 },
            { transform: 'scale(0.5)', opacity: 0, boxShadow: 'none' }
        ];
        let popFadeTiming = { duration: 500, easing: 'ease-in', fill: 'forwards' };
        card1.animate(popFadeFrames, popFadeTiming);
        card2.animate(popFadeFrames, popFadeTiming);

        matchesFound++;
        displayMatches.innerText = matchesFound;

        let pointsEarned = (gameSettings.difficulty === "hard") ? 25 : (gameSettings.difficulty === "medium") ? 15 : 10;
        currentScore += pointsEarned;
        displayScore.innerText = currentScore;

        flippedCards = [];
        isBoardLocked = false;

        if (matchesFound === totalPairs) {
            clearInterval(timerInterval);
            setTimeout(() => { alert(`YOU WIN! Final Score: ${currentScore}`); }, 600);
        }
    } else {
        // MISTAKE: JS Shake Animation & Red Glow
        card1.classList.add('incorrect');
        card2.classList.add('incorrect');

        let shakeFrames = [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-6px)' },
            { transform: 'translateX(6px)' },
            { transform: 'translateX(-6px)' },
            { transform: 'translateX(6px)' },
            { transform: 'translateX(0)' }
        ];
        card1.animate(shakeFrames, { duration: 400, easing: 'ease' });
        card2.animate(shakeFrames, { duration: 400, easing: 'ease' });

        livesLeft--;
        displayLives.innerText = livesLeft;

        let penaltyDelay = (gameSettings.difficulty === "hard") ? 500 : (gameSettings.difficulty === "medium") ? 1000 : 1500;

        setTimeout(() => {
            card1.classList.remove('flipped', 'incorrect');
            card1.innerText = "";
            card2.classList.remove('flipped', 'incorrect');
            card2.innerText = "";
            flippedCards = [];

            if (livesLeft <= 0) {
                clearInterval(timerInterval);
                gameStarted = false;
                alert(`GAME OVER! You ran out of lives. Final Score: ${currentScore}`);
            } else {
                isBoardLocked = false;
            }
        }, penaltyDelay);
    }
}

// --- 7. Utilities & Game Log ---
function logEvent(messageString) {
    let newEntry = document.createElement('div');
    newEntry.classList.add('log-entry');
    let timeNow = new Date().toLocaleTimeString();
    newEntry.innerText = `[${timeNow}] ${messageString}`;
    logArea.prepend(newEntry);
}

// --- 8. Dashboard Buttons ---
document.getElementById('startBtn').addEventListener('click', function() {
    if (gameStarted || livesLeft <= 0) return;
    gameStarted = true;
    this.style.opacity = "0.5";
    timerInterval = setInterval(() => { 
        time++; 
        displayTime.innerText = time + "s"; 
    }, 1000);
    logEvent("Game has started.");
});

document.getElementById('hintBtn').addEventListener('click', function() {
    if (!gameStarted) return;
    if (gameSettings.enableHints === false) {
        alert("Hints were disabled in your pre-game settings!");
        return;
    }

    let activeCards = Array.from(document.querySelectorAll('.number-card:not(.matched)'));
    activeCards = activeCards.filter(card => card.style.pointerEvents !== 'none');
    if (activeCards.length < 2) return;

    let targetId = activeCards[0].dataset.matchId;
    let hintPair = activeCards.filter(card => card.dataset.matchId === targetId);

    hintPair.forEach(card => card.classList.add('hint'));
    currentScore = Math.max(0, currentScore - 5);
    displayScore.innerText = currentScore;
    logEvent("Hint used. Penalty: -5 points.");

    setTimeout(() => {
        hintPair.forEach(card => card.classList.remove('hint'));
    }, 2000);
});

document.getElementById('resetBtn').addEventListener('click', function() {
    if (confirm("Are you sure you want to reset? All progress will be lost!")) {
        currentScore = 0; matchesFound = 0; livesLeft = 3; time = 0;
        flippedCards = []; isBoardLocked = false; gameStarted = false;
        clearInterval(timerInterval);

        displayScore.innerText = "0";
        displayMatches.innerText = "0";
        displayLives.innerText = "3";
        displayTime.innerText = "0s";
        document.getElementById('startBtn').style.opacity = "1";
        logArea.innerHTML = ""; 

        buildActiveDeck();
        shuffleDeck(activeDeck);
        renderBoard();
        logEvent("Game reset by user.");
    }
});

document.getElementById('saveBtn').addEventListener('click', function() {
    let savedStats = { score: currentScore, matches: matchesFound, lives: livesLeft, time: time };
    sessionStorage.setItem('savedGameStats', JSON.stringify(savedStats));
    alert("Game session stats saved successfully!");
    logEvent("Game state saved.");
});

document.getElementById('loadBtn').addEventListener('click', function() {
    let loadedData = sessionStorage.getItem('savedGameStats');
    if (loadedData) {
        let parsedStats = JSON.parse(loadedData);
        currentScore = parsedStats.score;
        matchesFound = parsedStats.matches;
        livesLeft = parsedStats.lives;
        time = parsedStats.time || 0;

        displayScore.innerText = currentScore;
        displayMatches.innerText = matchesFound;
        displayLives.innerText = livesLeft;
        displayTime.innerText = time + "s";

        alert("Game session stats loaded!");
        logEvent("Game state loaded from save.");
    } else {
        alert("No saved session found!");
    }
});

document.getElementById('backBtn').addEventListener('click', function() {
    window.location.href = 'index.html';
});

// Run Initialization
initializeGameUI();
buildActiveDeck();
shuffleDeck(activeDeck);
renderBoard();
logEvent("Game initialized successfully.");
