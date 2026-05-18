// NUMBER PAIR MATCH - MAIN GAME ENGINE 
// =========================================================

// --- 1. Grabbing the HTML Elements ---
let gameBoard = document.getElementById("gameBoard");
let logArea = document.getElementById("logArea");

let displayPlayer = document.getElementById("displayPlayer");
let displayScore = document.getElementById("displayScore");
let displayMoves = document.getElementById("displayMoves"); 
let displayMatches = document.getElementById("displayMatches");
let displayPairsLeft = document.getElementById("displayPairsLeft");
let displayTime = document.getElementById("displayTime");

// --- 2. Setting Up the Game Trackers (Variables) ---
let currentScore = 0;
let movesCount = 0;
let matchesFound = 0;
let time = 0;
let totalPairs = 0;

let flippedCards = []; 
let isBoardLocked = true; 
let gameStarted = false; 
let timerInterval; 

// --- Loading Data from the Launcher ---
let gameSettings = JSON.parse(sessionStorage.getItem('numberMatchSettings'));

if (!gameSettings) {
    alert("No game settings found. Returning to launcher.");
    window.location.href = 'index.html';
}

let playerName = "Unknown";
let cookies = document.cookie.split(';'); 
for (let i = 0; i < cookies.length; i++) {
    let cookiePair = cookies[i].split('=');
    if (cookiePair[0].trim() === "playerName") {
        playerName = decodeURIComponent(cookiePair[1]); 
    }
}

// --- 3. Preparing the Screen ---
function initializeGameUI() {
    displayPlayer.innerText = playerName;
    
    gameBoard.className = "game-board board-" + gameSettings.boardSize;

    if (gameSettings.boardSize === "4x4") totalPairs = 8;
    else if (gameSettings.boardSize === "4x5") totalPairs = 10;
    else if (gameSettings.boardSize === "6x6") totalPairs = 18;

    displayPairsLeft.innerText = totalPairs;
}

// --- 4. Creating the Deck of Cards (Objects) ---
function GameCard(displayValue, secretId, category) {
    this.displayValue = displayValue;
    this.secretId = secretId;
    this.category = category;
    
    this.checkMatch = function(otherCardId) {
        return this.secretId === parseInt(otherCardId);
    };
}

let masterDeck = []; 

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
        let j = Math.floor(Math.random() * (i + 1));
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
        // --- MATCH LOGIC ---
        card1.classList.add('matched');
        card2.classList.add('matched');
        
        card1.style.pointerEvents = 'none';
        card2.style.pointerEvents = 'none';

        let popFadeFrames = [
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(1.15)', opacity: 1, offset: 0.4 },
            { transform: 'scale(1)', opacity: 1 }
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
            document.cookie = "bestScore=" + currentScore + "; path=/; max-age=31536000"; 
            setTimeout(() => { alert(`YOU WIN! Final Score: ${currentScore}`); }, 600);
        }
    } else {
        // --- MISMATCH LOGIC ---
        card1.classList.add('incorrect');
        card2.classList.add('incorrect');
        logEvent("Incorrect pair selected.");

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
