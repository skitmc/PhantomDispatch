let currentLife = null;

// LOAD
function loadLife(slot) {
  let data = localStorage.getItem("life" + slot);

  if(data) {
    currentLife = JSON.parse(data);
    enterMainMenu();
  } else {
    alert("NO FILE FOUND");
  }
}

// CREATE LIFE SCREEN
function openCreateLife() {
  document.getElementById("lifeSelect").classList.add("hidden");
  document.getElementById("createLife").classList.remove("hidden");
}

// SAVE LIFE (FIRST + LAST NAME)
function saveLife() {
  let first = document.getElementById("firstName").value;
  let last = document.getElementById("lastName").value;
  let character = document.getElementById("characterSelect").value;

  if(!first || !last) {
    alert("ENTER FULL NAME");
    return;
  }

  currentLife = {
    firstName: first,
    lastName: last,
    character: character,
    money: 0,
    progress: 0
  };

  for(let i = 1; i <= 3; i++) {
    if(!localStorage.getItem("life" + i)) {
      localStorage.setItem("life" + i, JSON.stringify(currentLife));
      break;
    }
  }

  enterMainMenu();
}

// MAIN MENU
function enterMainMenu() {
  hideAll();

  document.getElementById("mainMenu").classList.remove("hidden");

  document.getElementById("welcomeText").innerText =
    "AGENT: " + currentLife.firstName + " " + currentLife.lastName;
}

// START GAME
function startGame() {
  alert("CONNECTING TO DISPATCH...");
  window.location.href = "game.html";
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

// DELETE
function resetLife() {
  for(let i = 1; i <= 3; i++) {
    localStorage.removeItem("life" + i);
  }
  location.reload();
}