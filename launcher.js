// DOM Elements
let setupForm = document.getElementById("setupForm");
let playerNameInput = document.getElementById("playerName");
let boardSizeSelect = document.getElementById("boardSize");
let difficultySelect = document.getElementById("difficulty");
let previewText = document.getElementById("previewText");
let showTimerCheck = document.getElementById("showTimer");
let enableHintsCheck = document.getElementById("enableHints");
let shuffleAnimationCheck = document.getElementById("shuffleAnimation");

// Update Live Preview dynamically as the user types or clicks
setupForm.addEventListener("input", function() {
    let currentName = playerNameInput.value.trim() || "[No Name]";
    let selectedPair = document.querySelector('input[name="pairType"]:checked').value;
    previewText.innerText = `Player: ${currentName} | Board: ${boardSizeSelect.value} | Mode: ${difficultySelect.value} | Type: ${selectedPair}`;
});

// Save Settings to LocalStorage (Persist launcher preferences)
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
    localStorage.setItem('launcherSettings', JSON.stringify(settings));
    alert("Launcher settings saved successfully!");
});

// Load Settings from LocalStorage
document.getElementById("loadSettingsBtn").addEventListener("click", function() {
    let saved = localStorage.getItem('launcherSettings');
    if (saved) {
        let parsed = JSON.parse(saved);
        playerNameInput.value = parsed.playerName || "";
        boardSizeSelect.value = parsed.boardSize || "4x4";
        difficultySelect.value = parsed.difficulty || "medium";
        
        if (parsed.pairType) {
            document.querySelector(`input[name="pairType"][value="${parsed.pairType}"]`).checked = true;
        }
        
        showTimerCheck.checked = parsed.showTimer !== false; 
        enableHintsCheck.checked = parsed.enableHints === true;
        shuffleAnimationCheck.checked = parsed.shuffleAnimation !== false;
        
        // Trigger the input event to update the live preview text
        setupForm.dispatchEvent(new Event('input'));
        alert("Settings loaded!");
    } else {
        alert("No saved settings found.");
    }
});

// Reset Settings
document.getElementById("resetSettingsBtn").addEventListener("click", function() {
    setupForm.reset();
    previewText.innerText = "No settings selected yet.";
});

// Open Game Window (Set Cookie & SessionStorage)
document.getElementById("openGameBtn").addEventListener("click", function() {
    let finalName = playerNameInput.value.trim();
    
    // Validation for Player Name (Cannot be empty)
    if (!finalName) {
        finalName = prompt("Please enter your player name before starting:");
        if (!finalName || finalName.trim() === "") {
            alert("Game cancelled: A player name is required.");
            return; 
        }
        playerNameInput.value = finalName; // Put it back in the input box
    }

    // Set persistent 7-day cookie for the Player Name
    let d = new Date();
    d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000)); 
    document.cookie = `playerName=${encodeURIComponent(finalName)}; expires=${d.toUTCString()}; path=/`;

    // Save game settings to SessionStorage for game.html to read
    let gameSettings = {
        boardSize: boardSizeSelect.value,
        difficulty: difficultySelect.value,
        pairType: document.querySelector('input[name="pairType"]:checked').value,
        showTimer: showTimerCheck.checked,
        enableHints: enableHintsCheck.checked
    };
    sessionStorage.setItem('numberMatchSettings', JSON.stringify(gameSettings));
    
    // Redirect to the game window
    window.location.href = 'game.html';
});
