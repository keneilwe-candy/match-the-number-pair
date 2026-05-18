// NUMBER PAIR MATCH - LAUNCHER LOGIC
// =====================================================
// This file runs the settings page. 
// It listens for what the user or the tester clicks, 
// saves those clicks and sends them to yhe game. 
// =====================================================

//  ---1. Grabbing the HTML Elements ----
// We use 'document.getElementById' to find the parts of our webpage. 
// This allows JavaScript to read what the use typed or clicked.
let setupForm = document.getElementById("setupForm");
let playerNameInput = document.getElementById("playerName");
let boardSizeSelect = document.getElementById("boardSize");
let difficultySelect = document.getElementById("difficulty");
let previewText = document.getElementById("previewText");
let openGameBtn = document.getElementById("openGameBtn");

//Grabbing the checkoxes (True/False settings)
let showTimerCheck = document.getElementById("showTimer");
let enableHintsCheck = document.getElementById("enableHints");
let shuffleAnimationCheck = document.getElementById("shuffleAnimation");

// Grabbing the buttons at the bottom of the form
let saveSettingsBtn = document.getElementById("saveSettingsBtn");
let loadSettingsBtn = document.getElementById("loadSettingsBtn");
let resetSettingsBtn = document.getElementById("resetSettingsBtn");

// --- 2. Live Preview Feature ---
//'addEventListener' waits for user and/or testser to do something. 
//Here, we (the game and I) wait for any 'input' (typing  or clicking) on the form.
setupForm.addEventListener("input", function() {

    //.trim is added to clean up any accidental spaces the user typed by mistake.
    let currentName = playerNameInput.value.trim() || "[No Name]";
    let selectedPair = document.querySelector('input[name="pairType"]:checked').value;
    previewText.innerText = `Player: ${currentName} | Board: ${boardSizeSelect.value} | Mode: ${difficultySelect.value} | Type: ${selectedPair}`;
});

// --- 3. Saving Settings (Local Storage) ---
// Local Storage saves data to the user's browser permanently (until cleared).
saveSettingsBtn.addEventListener("click", function() {
document.getElementById("saveSettingsBtn").addEventListener("click", function() {
    let settings = {
        playerName: playerNameInput.value.trim(),
        boardSize: boardSizeSelect.value,
        difficulty: difficultySelect.value,
        pairType: document.querySelector('input[name="pairType"]:checked').value,
        showTimer: showTimerCheck.checked,
        enableHints: enableHintsCheck.checked,
        shuffleAnimation: shuffleAnimationCheck.checked
    };
    // Local storage only accepts text. JSON.stringify turns our Object into text.
    localStorage.setItem('launcherSettings', JSON.stringify(settings));
    alert("Launcher settings saved successfully!");
});

// Loading Settings back from Local Storage
document.getElementById("loadSettingsBtn").addEventListener("click", function() {
    let savedData = localStorage.getItem('launcherSettings');

    //Loading settings back from loacal Storage 
    if (savedData) {
        // JSON.parse turns the text back into a usable JavaScript object 
        let parsed = JSON.parse(savedData);
        playerNameInput.value = parsed.playerName || "";
        boardSizeSelect.value = parsed.boardSize || "4x4";
        difficultySelect.value = parsed.difficulty || "medium";
        
        if (parsed.pairType) {
            document.querySelector(`input[name="pairType"][value="${parsed.pairType}"]`).checked = true;
        }
        
        showTimerCheck.checked = parsed.showTimer !== false; 
        enableHintsCheck.checked = parsed.enableHints === true;
        shuffleAnimationCheck.checked = parsed.shuffleAnimation !== false;
        
        // This tricks the form into updaing the live Preview text automatically 
        setupForm.dispatchEvent(new Event('input'));
        alert("Settings loaded!");
    } else {
        alert("No saved settings found.");
    }
});

// --- 4. Starting the Game ---
document.getElementById("resetSettingsBtn").addEventListener("click", function() {
    setupForm.reset();
    previewText.innerText = "No settings selected yet.";
});

// Open Game Window (Set Cookie & SessionStorage)
document.getElementById("openGameBtn").addEventListener("click", function() {
    let finalName = playerNameInput.value.trim();
    
    //Form Validation: Make sure the player didnt leave the name blank 
    if (!finalName) {
        finalName = prompt("Please enter your player name before starting:");
        //If they click cancel on the prompt, stop the function surinf 'return'
        if (!finalName || finalName.trim() === "") {
            alert("Game cancelled: A player name is required.");
            return; 
        }
        playerNameInput.value = finalName; // Put it back in the input box
    }

    // Set persistent 7-day cookie for the Player Name
    let d = new Date();
    d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000)); 
    

    // Save a Cookine: this remembers the player's details name for 1 day
    document.cookie = `playerName=${encodeURIComponent(finalName)}; expires=${d.toUTCString()}; path=/`;

    // Session Storage: This holds the game rules temporarily. 
    // It is destroyed when the browser tab is closed.
    let gameSettings = {
        boardSize: boardSizeSelect.value,
        difficulty: difficultySelect.value,
        pairType: document.querySelector('input[name="pairType"]:checked').value,
        showTimer: showTimerCheck.checked,
        enableHints: enableHintsCheck.checked
    };
    sessionStorage.setItem('numberMatchSettings', JSON.stringify(gameSettings));
    
    // Finally, send the user to the actual game page
    window.location.href = 'game.html';
});
