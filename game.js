// --- 1. DOM Elements ---
let gameBoard = document.getElementById("gameBoard");
let logArea = document.getElementById("logArea");
let messageArea = document.getElementById("messageArea");
let gameBoard = document.getElementById("gameBoard");


// Stats Displays
let displayPlayer = document.getElementById("displayPlayer");
let displayMoves = document.getElementById("displayMoves");
let displayMatches = document.getElementById("displayMatches");
let displayPairsLeft = document.getElementById("displayPairsLeft");
let displayScore = document.getElementById("displayScore");
let displayTime = document.getElementById("displayTime");

// Info Displays
let displayBoardSize = document.getElementById("displayBoardSize");
let displayDifficulty = document.getElementById("displayDifficulty");
let displayPairType = document.getElementById("displayPairType");
let displayBestScore = document.getElementById("displayBestScore");

// --- 2. Game State Variables ---
// We set these up to track the live game
let currentScore = 0;
let movesCount = 0;
let matchesFound = 0;
let totalPairs = 0; 
let flippedCards = []; // Temporarily holds the cards the user clicks
let isBoardLocked = false; // Prevents clicking while checking for a match

// Unpacking the settings
let gameSettings = JSON.parse(sessionStorage.getItem('numberMatchSettings'));

let playerName = document.cookie.split('; ').find(row => row.startsWith('playerName='))?.split('=')[1] || "Player";
// Security check: If someone bypassed the launcher and went straight to game.html
if (!gameSettings) {
    alert("No game settings found. Returning to launcher.");
    window.location.href = 'index.html';
}

// Unpacking the Player Name from the Cookie
// (Note: reading cookies requires a specific string split trick)
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
    // 1. Update the text displays
    displayPlayer.innerText = playerName;
    displayBoardSize.innerText = gameSettings.boardSize;
    displayDifficulty.innerText = gameSettings.difficulty;
    if (displayLives) displayLives.innerText = livesLeft; 
    
    /*if (gameSettings.showTimer === false) displayTime.parentElement.style.display = 'none'; 
    gameBoard.className = "game-board board-" + gameSettings.boardSize;*/
    document.getElementById("displayPlayer").innerText = decodeURIComponent(playerName);
    // 2. Shape the board using the CSS classes you built in styles.css
    gameBoard.className = "game-board"; // Reset to default
    gameBoard.classList.add("board-" + gameSettings.boardSize); 
    // 3. Determine how many total pairs we need to win the game
    if (gameSettings.boardSize === "4x4") totalPairs = 8;
    else if (gameSettings.boardSize === "4x5") totalPairs = 10;
    else if (gameSettings.boardSize === "6x6") totalPairs = 18;
    
    document.getElementById('displayPairsLeft').innerText = totalPairs;


}

// --- 4. Data Structures (Objects & Arrays) ---

// The Constructor Function for a Card
function GameCard(displayValue, secretId, category) {
    this.displayValue = displayValue; // What the user sees (e.g., "Five", "5", "2 + 3")
    this.secretId = secretId;         // The hidden link (e.g., the number 5)
    this.category = category;         // "word", "digit", or "equation"
}

// The Master Pool of all possible cards
const masterDeck = [
    // Group 1: The Number 4
    new GameCard("4", 4, "digit"),
    new GameCard("Four", 4, "word"),
    new GameCard("8 / 2", 4, "equation"),
    new GameCard("1 + 3", 4, "equation"),

    // Group 2: The Number 7
    new GameCard("7", 7, "digit"),
    new GameCard("Seven", 7, "word"),
    new GameCard("3 + 4", 7, "equation"),
    new GameCard("10 - 3", 7, "equation"),

    // Group 3: The Number 12
    new GameCard("12", 12, "digit"),
    new GameCard("Twelve", 12, "word"),
    new GameCard("3 x 4", 12, "equation"),

]
// This is the array that will actually be placed on the board
activeDeck = [];

// --- 5. Deck Building Logic ---

function buildActiveDeck() {
    // 1. First, figure out what categories are allowed based on the settings
    let allowedCategories = [];
    if (gameSettings.pairType === "numberWord") {
        allowedCategories = ["digit", "word"];
    } else if (gameSettings.pairType === "sumAnswer") {
        allowedCategories = ["digit", "equation"];
    } else {
        // Mixed mode gets everything
        allowedCategories = ["digit", "word", "equation"]; 
    }

    // 2. Filter the master deck to ONLY include cards that match our allowed categories
    let filteredDeck = masterDeck.filter(card => allowedCategories.includes(card.category));

    // 3. Find all the unique Secret IDs in our newly filtered deck
    // (This uses a modern JS trick with the 'Set' object to remove duplicates)
    let uniqueIds = [...new Set(filteredDeck.map(card => card.secretId))];

    // 4. Randomize the order of our available IDs so every game feels different
    uniqueIds.sort(() => Math.random() - 0.5);

    // 5. Select the pairs we need
    activeDeck = []; // Ensure it's empty
    let pairsAdded = 0;

    for (let i = 0; i < uniqueIds.length; i++) {
        // Stop if we have enough pairs for the chosen board size
        if (pairsAdded >= totalPairs) break; 

        let currentId = uniqueIds[i];

        // Find all available cards that share this specific ID
        let matchingCards = filteredDeck.filter(card => card.secretId === currentId);

        // We need exactly 2 cards to make a pair. 
        // If our filter found 2 or more valid cards for this ID, we take the first two!
        if (matchingCards.length >= 2) {
            activeDeck.push(matchingCards[0]);
            activeDeck.push(matchingCards[1]);
            pairsAdded++;
        }
    }
}

function shuffleDeck(array) {
    for (let i = array.length - 1; i > 0; i--) {
        // Built-in Math functions to hit the rubric requirement
        const j = Math.floor(Math.random() * (i + 1));
        // Swap the elements
        [array[i], array[j]] = [array[j], array[i]]; 
    }
    return array;
}

// --- 6. Rendering the Board ---

function renderBoard() {
    // 1. Clear the board (important for when we build the Reset button later)
    gameBoard.innerHTML = "";

    // 2. Loop through our shuffled deck
    for (let i = 0; i < activeDeck.length; i++) {
        let currentCardData = activeDeck[i];

        // 3. Create the physical HTML element
        let cardElement = document.createElement('div');
        
        // 4. Apply the base CSS class you built in styles.css
        cardElement.classList.add('number-card'); 

        // 5. The "Secret Sauce": Storing data inside the HTML element
        // dataset.matchId holds the secret link (e.g., 5)
        cardElement.dataset.matchId = currentCardData.secretId; 
        // dataset.displayValue holds what the user will see when flipped (e.g., "Five")
        cardElement.dataset.displayValue = currentCardData.displayValue;

        // 6. Add the click event listener (We will write this function in the next step)
        cardElement.addEventListener('click', function() {
            handleCardClick(cardElement);
        });

        // 7. Put the card onto the screen
        gameBoard.appendChild(cardElement);
    }
}

// --- 7. Gameplay Interaction ---

function handleCardClick(clickedCard) {
    // 1. The Guardrails: Stop the click if the board is locked, 
    // or if the card is already flipped or matched.
    if (isBoardLocked) return;
    if (clickedCard.classList.contains('flipped')) return;
    if (clickedCard.classList.contains('matched')) return;

    // 2. Flip the card visually
    clickedCard.classList.add('flipped'); // Changes background to white via CSS
    clickedCard.innerText = clickedCard.dataset.displayValue; // Show the text

    // 3. Add it to our temporary tracking array
    flippedCards.push(clickedCard);

    // 4. Update the moves counter on the dashboard
    movesCount++;
    displayMoves.innerText = movesCount;

    // 5. If they have clicked exactly 2 cards, check for a match!
    if (flippedCards.length === 2) {
        checkForMatch();
    }
}

function checkForMatch() {
    // 1. Lock the board so they can't click a 3rd card
    isBoardLocked = true;
    // Inside checkForMatch()
    //--- Change 7: Difficulty scaling for points and timing ---
    let pointsEarned = 10;
    let penaltyDelay = 1500; // Standard for Easy
    
    if (gameSettings.difficulty === "medium") {
        pointsEarned = 15;
        penaltyDelay = 1000;
    } else if (gameSettings.difficulty === "hard") {
        pointsEarned = 25;
        penaltyDelay = 500; // Much faster flip-back for Hard mode
    }
    
    // Apply these dynamically
    currentScore += pointsEarned;
    // ... later in the code ...
    setTimeout(() => {
        // flip cards back after the difficulty-based delay
    }, penaltyDelay);

    // 2. Grab the two cards they just clicked
    let card1 = flippedCards[0];
    let card2 = flippedCards[1];

    // 3. Check their hidden Secret IDs
    if (card1.dataset.matchId === card2.dataset.matchId) {
        // IT'S A MATCH
        // Add the green matched CSS class
        card1.classList.add('matched');
        card2.classList.add('matched');

        //This section stops the player from clicking them while they are animate away
        card1.style.pointerEvents = 'none';
        card2.style.pointerEvents = 'none';
        //The Javscript required to the cards to pop and fade away when correctly matched.
        let popFadrFrame = [
            { transform: 'scale(1)', opacity: 1, boxShadow: 'none' },
            { transform: 'scale(1.15)', opacity: 1, boxShadow: '0 0 20px #10b981', offset: 0.4 },
            { transform: 'scale(0.5)', opacity: 0, boxShadow: 'none' }
        ];
        let popFadeTiming = { duration: 500, easing: 'ease-in', fill: 'forwards' };
        card1.animate(popFadeFrames, popFadeTiming);
        card2.animate(popFadeFrames, popFadeTiming);
            
        // Update stats
        matchesFound++;
        displayMatches.innerText = matchesFound;
        
        // Give them points based on difficulty!
        let pointsEarned = (gameSettings.difficulty === "hard") ? 25 : (gameSettings.difficulty === "medium") ? 15 : 10;
        currentScore += pointsEarned; 
        displayScore.innerText = currentScore;
        
        currentScore += pointsEarned;
        displayScore.innerText = currentScore;

        // Clear the temporary array and unlock the board
        flippedCards = []; 
        isBoardLocked = false;

        // Check if they won the game
        if (matchesFound === totalPairs) {
            clearInterval(timerInterval);
            setTimeout(() => { showBanner(true); }, 600); // This section of code will trigger the Winner Banner 
        }
    } else {

        //This section is to trigger the incorrect animation (Red shake)
        card1.classList.add('incorrect'); 
        card2.classList.add('incorrect');

        //The the section of the code that will create the amnimation for the Error Shake 
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

        // --- SUBTRACT A LIFE ---
        livesLeft--;
        // Updates the screen with the most recent number of lives of lives left 
        if(displayLives) displayLives.innerText = livesLeft;

        let penaltyDelay = (gameSettings.difficulty === "hard") ? 500 : (gameSettings.difficulty === "medium") ? 1000 : 1500; 

        setTimeout(() => {
            card1.classList.remove('flipped', 'incorrect'); 
            card1.innerText = "";
            card2.classList.remove('flipped', 'incorrect'); 
            card2.innerText = "";
            flippedCards = [];
        
        // Check if they died!
            if (livesLeft <= 0) {
                clearInterval(timerInterval); 
                gameStarted = false; 
                showBanner(false); // Triggers the custom LOSE banner
            } else {
                isBoardLocked = false; 
            }
        }, penaltyDelay);
    }
}

// --- 8. Utilities & Game Log ---

function logEvent(messageString) {
    // 1. Create a new div
    let newEntry = document.createElement('div');
    newEntry.classList.add('log-entry'); // From your styles.css
    
    // 2. Add the time and the message
    let timeNow = new Date().toLocaleTimeString();
    newEntry.innerText = `[${timeNow}] ${messageString}`;
    
    // 3. prepend() puts the newest message at the VERY TOP of the log!
    logArea.prepend(newEntry);
}

// --- 9. Dashboard Buttons ---

// --- Change 1: Start Button logic 
document.getElementById('startBtn').addEventListener('click', function() {
    gameStarted = true;
    startTimer();
    logEvent("Game has started")
}
// The Back Button
document.getElementById('backBtn').addEventListener('click', function() {
    // Sends the user back to the launcher
    window.location.href = 'index.html'; 
});

// The Reset Button
document.getElementById('resetBtn').addEventListener('click', function() {
    // Rubric requirement: confirm()
    if (confirm("Are you sure you want to reset? All current progress will be lost!")) {
        // 1. Reset all tracking variables back to 0
        currentScore = 0;
        movesCount = 0;
        matchesFound = 0;
        flippedCards = [];
        isBoardLocked = false;

        // 2. Update the HTML text to show 0
        displayScore.innerText = "0";
        displayMoves.innerText = "0";
        displayMatches.innerText = "0";
        logArea.innerHTML = ""; // Clear the log history

        logEvent("Game reset by user.");

        // 3. Rebuild and shuffle a brand new deck!
        buildActiveDeck();
        shuffleDeck(activeDeck);
        renderBoard();
    }
});

// --- Change 6: Defensive Hint Logic ---
document.getElementById('hintBtn').addEventListener('click', function() {
    // 1. Validation: Check if hints are actually enabled
    if (gameSettings.enableHints === false) {
        alert("Hints were disabled in your pre-game settings!");
        return; 
    }

    // 2. State Check: Only find matches for cards still on the board
    let activeCards = Array.from(document.querySelectorAll('.number-card:not(.matched)'));
    activeCards = activeCards.filter(card => card.style.pointerEvents !== 'none');
    
    if (activeCards.length < 2) return; 

    // 3. Logic: Find the first available pair and highlight it
    let targetId = activeCards[0].dataset.matchId;
    let hintPair = activeCards.filter(card => card.dataset.matchId === targetId);

    hintPair.forEach(card => card.classList.add('hint'));
    
    // 4. Penalty: Deduct points to keep the game balanced
    currentScore = Math.max(0, currentScore - 5); 
    displayScore.innerText = currentScore;
    logEvent(`Hint used. Penalty: -5 points.`);

    setTimeout(() => {
        hintPair.forEach(card => card.classList.remove('hint'));
    }, 2000);
});

document.getElementById('saveBtn').addEventListener('click', function() {
    // 1. Bundle the current stats into an Object
    let savedStats = {
        score: currentScore,
        moves: movesCount,
        matches: matchesFound
    };

    // 2. Convert to a string and save to sessionStorage
    sessionStorage.setItem('savedGameStats', JSON.stringify(savedStats));
    
    // 3. Feedback alert
    alert("Game session stats saved successfully!");
    logEvent("Game state saved.");
});

document.getElementById('loadBtn').addEventListener('click', function() {
    // 1. Retrieve the string from storage
    let loadedData = sessionStorage.getItem('savedGameStats');

    if (loadedData) {
        // 2. Convert back to a usable Object
        let parsedStats = JSON.parse(loadedData);

        // 3. Overwrite the live variables
        currentScore = parsedStats.score;
        movesCount = parsedStats.moves;
        matchesFound = parsedStats.matches;

        // 4. Update the HTML dashboard
        displayScore.innerText = currentScore;
        displayMoves.innerText = movesCount;
        displayMatches.innerText = matchesFound;

        alert("Game session stats loaded!");
        logEvent("Game state loaded from save.");
    } else {
        alert("No saved session found!");
    }
});


// This code runs immediately when the game.html file finishes loading.
initializeGameUI();
buildActiveDeck();
shuffleDeck(activeDeck);
renderBoard();
logEvent("Game initialized successfully.");
