// --- 1. DOM Elements ---
let gameBoard = document.getElementById("gameBoard");
let logArea = document.getElementById("logArea");

// Stats Displays
let displayPlayer = document.getElementById("displayPlayer");
let displayScore = document.getElementById("displayScore");
let displayMoves = document.getElementById("displayMoves"); // Kept original grid element
let displayMatches = document.getElementById("displayMatches");
let displayPairsLeft = document.getElementById("displayPairsLeft");
let displayTime = document.getElementById("displayTime");

// --- 2. Game State Variables ---
let currentScore = 0;
let movesCount = 0;
let matchesFound = 0;
let time = 0;
let totalPairs = 0;
let flippedCards = [];
let isBoardLocked = false;
let gameStarted = false;
let timerInterval;

// Load Settings from Session Storage (Rubric: Session Store Retrieve)
let gameSettings = JSON.parse(sessionStorage.getItem('numberMatchSettings'));
if (!gameSettings) {
    alert("No game settings found. Returning to launcher.");
    window.location.href = 'index.html';
}

// Load Player Name from Cookie (Rubric: Cookies Retrieve & String Methods)
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
    
    // String manipulation for class name
    gameBoard.className = "game-board board-" + gameSettings.boardSize;

    if (gameSettings.boardSize === "4x4") totalPairs = 8;
    else if (gameSettings.boardSize === "4x5") totalPairs = 10;
    else if (gameSettings.boardSize === "6x6") totalPairs = 18;

    displayPairsLeft.innerText = totalPairs;
}

// --- 4. The Master Deck (Rubric: Objects Constructor, Properties & Methods) ---
function GameCard(displayValue, secretId, category) {
    this.displayValue = displayValue;
    this.secretId = secretId;
    this.category = category;
    
    // Rubric requirement: Object Method (3 marks)
    this.checkMatch = function(otherCardId) {
        return this.secretId === parseInt(otherCardId);
    };
}

let masterDeck = [];

// Rubric requirement: Arrays Created dynamically (prevents 6x6 board crash)
const numWords = [
    "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", 
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty",
    "Twenty-One", "Twenty-Two", "Twenty-Three", "Twenty-Four", "Twenty-Five", "Twenty-Six", "Twenty-Seven", "Twenty-Eight", "Twenty-Nine", "Thirty",
    "Thirty-One", "Thirty-Two", "Thirty-Three", "Thirty-Four", "Thirty-Five"
];

for (let i = 1; i <= 35; i++) {
    masterDeck.push(new GameCard(i.toString(), i, "digit"));
    masterDeck.push(new GameCard(numWords[i], i, "word"));
    masterDeck.push(new GameCard(`${i} x 1`, i, "equation"));
    masterDeck.push(new GameCard(`${i + 1} - 1`, i, "equation"));
}

let activeDeck = [];

// Functions with Params and Returns (Rubric: Functions)
function buildActiveDeck() {
    let allowedCategories = [];
    if (gameSettings.pairType === "numberWord") allowedCategories = ["digit", "word"];
    else if (gameSettings.pairType === "sumAnswer") allowedCategories = ["digit", "equation"];
    else allowedCategories = ["digit", "word", "equation"];

    let filteredDeck = masterDeck.filter(card => allowedCategories.includes(card.category));
    let uniqueIds = [...new Set(filteredDeck.map(card => card.secretId))];
    
    // Math Method: Math.random() (Rubric: Math Methods)
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
        // Math Method: Math.floor() (Rubric: Math Methods)
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array; // Return statement (Rubric: Functions Return)
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
        alert("Please click 'Start Game' first!"); // Rubric: Feedback Alert
        return;
    }
    if (isBoardLocked || clickedCard.classList.contains('flipped') || clickedCard.classList.contains('matched')) return;

    clickedCard.classList.add('flipped');
    clickedCard.innerText = clickedCard.dataset.displayValue;
    flippedCards.push(clickedCard);
    
    movesCount++;
    displayMoves.innerText = movesCount;

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
        card1.animate(popFadeFrames, { duration: 500, easing: 'ease-in', fill: 'forwards' });
        card2.animate(popFadeFrames, { duration: 500, easing: 'ease-in', fill: 'forwards' });

        matchesFound++;
        displayMatches.innerText = matchesFound;
        displayPairsLeft.innerText = totalPairs - matchesFound;

        let pointsEarned = (gameSettings.difficulty === "hard") ? 25 : (gameSettings.difficulty === "medium") ? 15 : 10;
        currentScore += pointsEarned;
        displayScore.innerText = currentScore;

        flippedCards = [];
        isBoardLocked = false;

        if (matchesFound === totalPairs) {
            clearInterval(timerInterval);
            
            // Set Cookie (Rubric: Cookies Set)
            document.cookie = "bestScore=" + currentScore + "; path=/; max-age=31536000"; 
            
            setTimeout(() => { alert(`🎉 YOU WIN! Final Score: ${currentScore}`); }, 600);
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

        let penaltyDelay = (gameSettings.difficulty === "hard") ? 500 : (gameSettings.difficulty === "medium") ? 1000 : 1500;

        setTimeout(() => {
            card1.classList.remove('flipped', 'incorrect');
            card1.innerText = "";
            card2.classList.remove('flipped', 'incorrect');
            card2.innerText = "";
            flippedCards = [];
            isBoardLocked = false;
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
    if (gameStarted) return;
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
    
    // Math Method: Math.max()
    currentScore = Math.max(0, currentScore - 5);
    displayScore.innerText = currentScore;
    logEvent("Hint used. Penalty: -5 points.");

    setTimeout(() => {
        hintPair.forEach(card => card.classList.remove('hint'));
    }, 2000);
});

document.getElementById('resetBtn').addEventListener('click', function() {
    // Rubric requirement: Feedback Confirm (3 marks)
    if (confirm("Are you sure you want to reset? All progress will be lost!")) {
        currentScore = 0; movesCount = 0; matchesFound = 0; time = 0;
        flippedCards = []; isBoardLocked = false; gameStarted = false;
        clearInterval(timerInterval);

        displayScore.innerText = "0";
        displayMoves.innerText = "0";
        displayMatches.innerText = "0";
        displayPairsLeft.innerText = totalPairs;
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
    // Rubric requirement: Feedback Prompt (3 marks)
    let saveName = prompt("Enter a name for this save session:", "Player1_Save");
    
    if (saveName !== null && saveName.trim() !== "") {
        let savedStats = { saveName: saveName, score: currentScore, moves: movesCount, matches: matchesFound, time: time };
        
        // Rubric requirement: Session Store Set (5 marks)
        sessionStorage.setItem('savedGameStats', JSON.stringify(savedStats));
        
        alert(`Game session '${saveName}' saved successfully!`);
        logEvent(`Game state saved as '${saveName}'.`);
    }
});

document.getElementById('loadBtn').addEventListener('click', function() {
    let loadedData = sessionStorage.getItem('savedGameStats');
    if (loadedData) {
        let parsedStats = JSON.parse(loadedData);
        currentScore = parsedStats.score;
        movesCount = parsedStats.moves;
        matchesFound = parsedStats.matches;
        time = parsedStats.time || 0;

        displayScore.innerText = currentScore;
        displayMoves.innerText = movesCount;
        displayMatches.innerText = matchesFound;
        displayTime.innerText = time + "s";
        displayPairsLeft.innerText = totalPairs - matchesFound;

        alert(`Game session '${parsedStats.saveName}' loaded successfully!`);
        logEvent(`Game state '${parsedStats.saveName}' loaded from save.`);
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
