// NUMBER PAIR MATCH - MAIN GAME ENGINE 
// =========================================================
// This file reads the settings, builds the deck of cards, 
// and controls the rules of the game (matching, points, and timers).

// --- 1. Grabbing the HTML Elements ---
// We use 'document.getElementById' to link our JavaScript to the physical webpage.
let gameBoard = document.getElementById("gameBoard");
let logArea = document.getElementById("logArea");

// Finding the score boxes so we can update the numbers dynamically as the player plays
let displayPlayer = document.getElementById("displayPlayer");
let displayScore = document.getElementById("displayScore");
let displayMoves = document.getElementById("displayMoves"); 
let displayMatches = document.getElementById("displayMatches");
let displayPairsLeft = document.getElementById("displayPairsLeft");
let displayTime = document.getElementById("displayTime");

// --- 2. Setting Up the Game Trackers (Variables) ---
// We start all scores at zero and create empty containers for the cards
let currentScore = 0;
let movesCount = 0;
let matchesFound = 0;
let time = 0;
let totalPairs = 0;

let flippedCards = []; // An empty list (array) to hold the 2 cards the player is currently flipping
let isBoardLocked = true; // Start with the board locked so the user can't click before pressing 'Start Game'
let gameStarted = false; // Tracks if the game is currently active
let timerInterval; // A placeholder variable to hold our stopwatch later

// --- Loading Data from the Launcher ---
// We grab the rules from sessionStorage (temporary memory) and turn them back into a usable object 
let gameSettings = JSON.parse(sessionStorage.getItem('numberMatchSettings'));

// If someone tries to open the game directly without picking settings, send them back
if (!gameSettings) {
    alert("No game settings found. Returning to launcher.");
    window.location.href = 'index.html';
}

// Read the browser's cookies to find the player's name  
let playerName = "Unknown";
let cookies = document.cookie.split(';'); // Split the cookie text into individual pieces
for (let i = 0; i < cookies.length; i++) {
    let cookiePair = cookies[i].split('=');
    if (cookiePair[0].trim() === "playerName") {
        playerName = decodeURIComponent(cookiePair[1]); // decodeURIComponent cleans up special characters
    }
}

// --- 3. Preparing the Screen ---
function initializeGameUI() {
    displayPlayer.innerText = playerName;
    
    // Change the CSS class so the grid layout perfectly matches the size they picked
    gameBoard.className = "game-board board-" + gameSettings.boardSize;

    // Math logic: Figure out exactly how many pairs are needed based on the board size 
    if (gameSettings.boardSize === "4x4") totalPairs = 8;
    else if (gameSettings.boardSize === "4x5") totalPairs = 10;
    else if (gameSettings.boardSize === "6x6") totalPairs = 18;

    displayPairsLeft.innerText = totalPairs;
}

// --- 4. Creating the Deck of Cards (Objects) ---
// This is an Object Constructor. The best analogy is a blueprint
// for creating cards. Every card will have what it looks like, its secret ID, and its type.
function GameCard(displayValue, secretId, category) {
    this.displayValue = displayValue;
    this.secretId = secretId;
    this.category = category;
    
    // A function inside an object (Method) to check if two cards match
    this.checkMatch = function(otherCardId) {
        return this.secretId === parseInt(otherCardId);
    };
}

let masterDeck = []; // The giant list of all possible cards 

// Change 1: Dynamic Array Generation (Fixing Board Size Bug)
/*const masterDeck = [
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

]*/
// Replaced hardcoded cards with a dynamic loop.
const numWords = [
    "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", 
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty",
    "Twenty-One", "Twenty-Two", "Twenty-Three", "Twenty-Four", "Twenty-Five", "Twenty-Six", "Twenty-Seven", "Twenty-Eight", "Twenty-Nine", "Thirty",
    "Thirty-One", "Thirty-Two", "Thirty-Three", "Thirty-Four", "Thirty-Five"
];

// .push() adds the newly built cards into the masterDeck array 
for (let i = 1; i <= 35; i++) {
    masterDeck.push(new GameCard(i.toString(), i, "digit"));
    masterDeck.push(new GameCard(numWords[i], i, "word"));
    masterDeck.push(new GameCard(`${i} x 1`, i, "equation"));
    masterDeck.push(new GameCard(`${i + 1} - 1`, i, "equation"));
}
//-End of Change 1

let activeDeck = []; // The specific cards we will use for this current round

// Functions with Params and Returns (Rubric: Functions)
function buildActiveDeck() {
    let allowedCategories = [];
    
    // Filter cards based on user settings
    if (gameSettings.pairType === "numberWord") allowedCategories = ["digit", "word"];
    else if (gameSettings.pairType === "sumAnswer") allowedCategories = ["digit", "equation"];
    else allowedCategories = ["digit", "word", "equation"];

    // Filter out card types we don't need for this game
    let filteredDeck = masterDeck.filter(card => allowedCategories.includes(card.category));
    let uniqueIds = [...new Set(filteredDeck.map(card => card.secretId))];
    
    // Math Method: Math.random() (Rubric: Math Methods)
    // This randomizes the order of our unique IDs
    uniqueIds.sort(() => Math.random() - 0.5);

    activeDeck = [];
    let pairsAdded = 0;

    // Loop through and grab pairs until the board is completely full
    for (let i = 0; i < uniqueIds.length; i++) {
        if (pairsAdded >= totalPairs) break; // Stop if we have enough cards
        
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
        // Shuffles the deck using a math algorithm so it's different every time
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array; // Return statement 
}

// --- 5. Rendering the Board ---
// This function creates the physical HTML elements for our cards
function renderBoard() {
    gameBoard.innerHTML = ""; // Clear the board to start fresh
    for (let i = 0; i < activeDeck.length; i++) {
        // Create a new <div> element to represent a card
        let cardElement = document.createElement('div');
        cardElement.classList.add('number-card'); // Give it styling
        
        // Hide the secret ID and display value inside the HTML element's dataset
        cardElement.dataset.matchId = activeDeck[i].secretId;
        cardElement.dataset.displayValue = activeDeck[i].displayValue;

        // Tell the card to listen for a mouse click
        cardElement.addEventListener('click', function() {
            handleCardClick(cardElement);
        });
        
        // Add the finished card to the webpage
        gameBoard.appendChild(cardElement);
    }
}

// --- 6. Gameplay Interaction ---
// This runs every single time a player clicks a card
function handleCardClick(clickedCard) {
    if (!gameStarted) {
        alert("Please click 'Start Game' first!");
        return; // Stop them from playing
    }
    
    // Ignore clicks if the board is locked, or if the card is already flipped/matched
    if (isBoardLocked || clickedCard.classList.contains('flipped') || clickedCard.classList.contains('matched')) return;

    // Flip the card over and show the text
    clickedCard.classList.add('flipped');
    clickedCard.innerText = clickedCard.dataset.displayValue;
    flippedCards.push(clickedCard); // Add it to our temporary list
    
    movesCount++;
    displayMoves.innerText = movesCount;

    // If they have flipped exactly 2 cards, trigger the logic to see if they match!
    if (flippedCards.length === 2) {
        checkForMatch();
    }
}

// The core logic function that decides if they won or made a mistake
function checkForMatch() {
    isBoardLocked = true; // Lock the board so they can't click a 3rd card quickly
    let card1 = flippedCards[0];
    let card2 = flippedCards[1];

    if (card1.dataset.matchId === card2.dataset.matchId) {
        // MATCH: JS Pop Animation & Green Glow
        card1.classList.add('matched');
        card2.classList.add('matched');
        
        // Make sure they can't be clicked again
        card1.style.pointerEvents = 'none';
        card2.style.pointerEvents = 'none';

        // Animate the cards popping out
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

        // Calculate points based on the difficulty level they chose
        let pointsEarned = (gameSettings.difficulty === "hard") ? 25 : (gameSettings.difficulty === "medium") ? 15 : 10;
        currentScore += pointsEarned;
        displayScore.innerText = currentScore;

        flippedCards = []; // Clear the array for the next turn
        isBoardLocked = false; // Unlock the board

        // Win Condition: Did they find all the pairs?
        if (matchesFound === totalPairs) {
            clearInterval(timerInterval); // Stop the clock
            
            // Set Cookie (Rubric: Cookies Set) - Saves best score for 1 year
            document.cookie = "bestScore=" + currentScore + "; path=/; max-age=31536000"; 
            
            // Wait just a split second so they can see the final card turn green before alerting
            setTimeout(() => { alert(`YOU WIN! Final Score: ${currentScore}`); }, 600);
        }
    } else {
        // MISTAKE: JS Shake Animation & Red Glow
        // Change 3: Enhanced Visual Feedback for Incorrect Matches
        /*let penaltyDelay = 1500; 

        setTimeout(() => {
            // It just removes the flip class...
            card1.classList.remove('flipped');
            card1.innerText = "";
            card2.classList.remove('flipped');
            card2.innerText = "";

            flippedCards = [];
            isBoardLocked = false;
        }, penaltyDelay);
    }*/
        card1.classList.add('incorrect');
        card2.classList.add('incorrect');
        logEvent("Incorrect pair selected.");

        // Animate the cards to shake back and forth
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

        // setTimeout pauses the code. After the delay, we hide the cards again.
       // 1. Add the red glow classes immediately
card1.classList.add('incorrect');
card2.classList.add('incorrect');

let penaltyDelay = 1500; 

setTimeout(() => {
    // 2. Remove BOTH the flip and the glow classes after the delay
    card1.classList.remove('flipped', 'incorrect');
    card1.innerText = "";
    
    card2.classList.remove('flipped', 'incorrect');
    card2.innerText = "";

    flippedCards = [];
    isBoardLocked = false;
}, penaltyDelay);
}

// --- 7. Utilities & Game Log ---
// This helper function adds a new timestamped line of text to our log box
function logEvent(messageString) {
    let newEntry = document.createElement('div');
    newEntry.classList.add('log-entry');
    let timeNow = new Date().toLocaleTimeString();
    newEntry.innerText = `[${timeNow}] ${messageString}`;
    logArea.prepend(newEntry); // prepend() puts the newest message at the TOP
}

// --- 8. Dashboard Buttons ---

// Change 2: Functional Timer and Game Log Tracking
    //Old code
    /*document.getElementById('startBtn').addEventListener('click', function() {
    // The button was clicked, but there is no code here to make the timer tick!
    gameStarted = true;
    logEvent("Game has started.");
});*/
document.getElementById('startBtn').addEventListener('click', function() {
    if (gameStarted) return; // Don't let them press start twice
    gameStarted = true;
    isBoardLocked = false; // Unlock the board so they can play
    this.style.opacity = "0.5"; // Make the button look faded out
    
    // setInterval acts as our stopwatch, running every 1000ms (1 second)
    if (gameSettings.showTimer) {
        timerInterval = setInterval(() => { 
            time++; 
            displayTime.innerText = time + "s"; 
        }, 1000);
    }
    logEvent("Game has started. Timer running.");
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
    // Prevents the score from dropping below zero
    currentScore = Math.max(0, currentScore - 5);
    displayScore.innerText = currentScore;
    logEvent("Hint used. Penalty: -5 points.");

    // Remove the hint glow after 2 seconds
    setTimeout(() => {
        hintPair.forEach(card => card.classList.remove('hint'));
    }, 2000);
});

document.getElementById('resetBtn').addEventListener('click', function() {
    // Rubric requirement: Feedback Confirm (3 marks)
    if (confirm("Are you sure you want to reset? All progress will be lost!")) {
        currentScore = 0; movesCount = 0; matchesFound = 0; time = 0;
        flippedCards = []; isBoardLocked = true; gameStarted = false; // Relock the board
        clearInterval(timerInterval); // Stop the clock

        // Reset the visual numbers on the screen
        displayScore.innerText = "0";
        displayMoves.innerText = "0";
        displayMatches.innerText = "0";
        displayPairsLeft.innerText = totalPairs;
        displayTime.innerText = "0s";
        document.getElementById('startBtn').style.opacity = "1";
        logArea.innerHTML = ""; 

        // Rebuild and reshuffle the cards for a fresh game
        buildActiveDeck();
        shuffleDeck(activeDeck);
        renderBoard();
        logEvent("Game reset by user.");
    }
});

document.getElementById('saveBtn').addEventListener('click', function() {
    
    let saveName = prompt("Enter a name for this save session:", "Player1_Save");
    
    if (saveName !== null && saveName.trim() !== "") {
        let savedStats = { saveName: saveName, score: currentScore, moves: movesCount, matches: matchesFound, time: time };
        
        
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

        // Update the screen with the loaded data
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

// A simple button to navigate back to the settings page
document.getElementById('backBtn').addEventListener('click', function() {
    window.location.href = 'index.html';
});

// Run Initialization - This runs as soon as the file loads!
initializeGameUI();
buildActiveDeck();
shuffleDeck(activeDeck);
renderBoard();
logEvent("Game initialized successfully.");
