// --- 1. DOM Elements ---
// Gathering the Ids from the index.html 
let setupForm = document.getElementById("setupForm");
let playerNameInput = document.getElementById("playerName");
let boardSizeSelect = document.getElementById("boardSize");
let difficultySelect = document.getElementById("difficulty");
let previewText = document.getElementById("previewText");
let openGameBtn = document.getElementById("openGameBtn");

// Options Checkboxes
let showTimerCheck = document.getElementById("showTimer");
let enableHintsCheck = document.getElementById("enableHints")

// --- 2. Live Preview Feature (Event Delegation) ---
/* 
The "input"event is synchronous. It fires instantly on every
keystroke or click making the UI feel incredible responsive to the user
*/
setupForm.addEventListener ("input", function(){
    //.trim() cleans up the input by removing accidental spaces at the start/end
    let currentName = playerNameInput.value.trim();

    // Fallback logic: Prevent the UI from looking roken if the user deletes their name 
    if (currentName === "") {
        currentName = "[No Name]";
    }

    // CSS Selector in JS: This finds the specific radio button that is currently active.
    let selectedPair = document.querySelector("input[name='pairType']:checked").value;

    // String Concatenation: Injecting live DOM states into a single readable string.
    previewText.innerText = "Player: " + currentName + 
                            " | Size: " + boardSizeSelect.value +
                            " | Mode: " + difficultySelect.value +
                            " | Type: " + selectedPair;
});

// --- 3. Launching the Game (Validation and Storage) ---
openGameBtn.addEventListener("click", function(){

    // A. Validation (Defensive Programming) ---
    let finalName = playerNameInput.value.trim();

    // If the input is empty, halt the flow and demand an answer using the required prompt()
    if (finalName === "") {
        finalName = prompt("Please enter you player name before starting:");

        // Strict validation: Check if they clicked 'Cancel' (null) or submitted blank spaces
        if (!finalName || finalName.trim() === "") {
            alert("Game cancelled: A player name is required.");
            return; // EXIT STRATEGY: This keyword instantly stops the function dead in its tracks.
        }
        
        // EXIT STRATEGY: This keyword instantly stops the function dead in its tracks.
        playerNameInput.value = finalName; 
    }

    // --- B. Global Storage (Cookies) --- 
    /* Cookies are attached to the browser. encodeURIComponent ensures that if they
    typed weird characters (like spaces or symbols), it doesn't break the cookie string.*/
    document.cookie = "playerName=" + encodeURIComponent(finalName) + "; path=/";

    // --- C. Session Storage (Data Transfer) ---
    // We bundle the scattered DOM values into a clean JavaScript Object (Key-Value pairs).
    let gameSettings = {
        boardSize: boardSizeSelect.value,
        difficulty: difficultySelect.value,
        pairType: document.querySelector('input[name="pairType"]:checked').value,
        showTimer: showTimerCheck.checked,
        enableHints: enableHintsCheck.checked
    };

    // sessionStorage only accepts flat strings, not Objects. 
    // JSON.stringify 'serializes' the object into a text format so it can be saved.
    sessionStorage.setItem('numberMatchSettings', JSON.stringify(gameSettings));

    // --- D. Execution ---
    // Opens the game file in a new browser tab.
    window.open('game.html', '_blank');
});
    