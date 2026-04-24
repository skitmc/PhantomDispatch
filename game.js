let currentLife = null;

// LOAD LIFE
function loadLife(slot) {
  let data = localStorage.getItem("life" + slot);

  if(data) {
    currentLife = JSON.parse(data);
    enterMainMenu();
  } else {
    alert("No life found. Create one.");
  }
}

// CREATE LIFE SCREEN
function openCreateLife() {
  document.getElementById("lifeSelect").classList.add("hidden");
  document.getElementById("createLife").classList.remove("hidden");
}

// SAVE LIFE
function saveLife() {
  let name = document.getElementById("playerName").value;
  let character = document.getElementById("characterSelect").value;

  if(!name) return alert("Enter a name!");

  currentLife = {
    name: name,
    character: character,
    money: 0,
    progress: 0
  };

  // find empty slot
  for(let i = 1; i <= 3; i++) {
    if(!localStorage.getItem("life" + i)) {
      localStorage.setItem("life" + i, JSON.stringify(currentLife));
      alert("Life saved in slot " + i);
      break;
    }
  }

  enterMainMenu();
}

// MAIN MENU
function enterMainMenu() {
  document.getElementById("lifeSelect").classList.add("hidden");
  document.getElementById("createLife").classList.add("hidden");
  document.getElementById("mainMenu").classList.remove("hidden");

  document.getElementById("welcomeText").innerText =
    "Welcome " + currentLife.name + " (" + currentLife.character + ")";
}

// START GAME
function startGame() {
  alert("Loading Phantom Dispatch...");
  window.location.href = "game.html"; // later you’ll make this
}

// INFO / CREDITS
function showInfo() {
  hideAll();
  document.getElementById("info").classList.remove("hidden");
}

function showCredits() {
  hideAll();
  document.getElementById("credits").classList.remove("hidden");
}

function backMenu() {
  hideAll();
  document.getElementById("mainMenu").classList.remove("hidden");
}

function hideAll() {
  document.querySelectorAll("#menu > div").forEach(d => d.classList.add("hidden"));
}

// DELETE LIFE
function resetLife() {
  for(let i = 1; i <= 3; i++) {
    localStorage.removeItem("life" + i);
  }
  alert("All lives deleted");
  location.reload();
}