const LIFE_SLOTS = 3;
let currentLife = null;
let gameData = {
  ghosts: [],
  jobs: [],
  cars: [],
  items: [],
  houses: []
};
let activePhoneTab = 'dispatch';

const BASE_DATA = {
  ghosts: [
    { id: 1, name: 'Demon', aggression: 9, evidence: ['EMF Level 5', 'Freezing Temperatures'], description: 'Highly aggressive and fast.' },
    { id: 2, name: 'Spirit', aggression: 4, evidence: ['Spirit Box responses', 'Ghost Writing'], description: 'Balanced and quiet.' },
    { id: 3, name: 'Poltergeist', aggression: 6, evidence: ['Footprints / Salt interaction', 'Ghost Writing'], description: 'Object interaction focused.' },
    { id: 4, name: 'Wraith', aggression: 7, evidence: ['EMF Level 5', 'Spirit Box responses'], description: 'Teleports around the area.' },
    { id: 5, name: 'Phantom', aggression: 5, evidence: ['Freezing Temperatures', 'Spirit Box responses'], description: 'Vanishes at close range.' }
  ],
  jobs: [
    { id: 1, title: 'Haunted House Investigation', baseReward: 500 },
    { id: 2, title: 'Abandoned Road Case', baseReward: 420 },
    { id: 3, title: 'Industrial Site Haunting', baseReward: 680 }
  ],
  cars: [
    { id: 1, name: 'Basic Cruiser', speed: 60, storage: 8, fuel: 100, cost: 0 },
    { id: 2, name: 'Field Runner', speed: 80, storage: 12, fuel: 120, cost: 1200 },
    { id: 3, name: 'Heavy Hauler', speed: 50, storage: 18, fuel: 140, cost: 1800 }
  ],
  items: [
    { id: 1, name: 'Flashlight', category: 'tool', effect: 'Show hidden details', cost: 0 },
    { id: 2, name: 'EMF Reader', category: 'tool', effect: 'Detect EMF Level 5', cost: 200 },
    { id: 3, name: 'Spirit Box', category: 'tool', effect: 'Catch spirit responses', cost: 300 },
    { id: 4, name: 'Salt', category: 'tool', effect: 'Reveal footprints and salt interaction', cost: 150 },
    { id: 5, name: 'Night Vision Camera', category: 'tool', effect: 'See in the dark', cost: 350 },
    { id: 6, name: 'Ghost Lure', category: 'tool', effect: 'Increase ghost activity', cost: 250 },
    { id: 7, name: 'Writing Book', category: 'tool', effect: 'Capture ghost writing', cost: 180 }
  ],
  houses: [
    { id: 1, name: 'Oakwood Mansion', neighborhood: 'Oakwood', danger: 'High' },
    { id: 2, name: 'Raven Street Home', neighborhood: 'Raven Street', danger: 'Medium' },
    { id: 3, name: 'Forsaken Factory', neighborhood: 'Industrial Park', danger: 'Critical' },
    { id: 4, name: 'Foggy Road Cabin', neighborhood: 'Misty Hollow', danger: 'Medium' },
    { id: 5, name: 'Abandoned Motel', neighborhood: 'Route 7', danger: 'High' }
  ]
};

const DIFFICULTY_MODIFIERS = {
  Easy: { rewardMultiplier: 1.0, startingBalance: 700, evidencePenalty: 0 },
  Medium: { rewardMultiplier: 1.0, startingBalance: 500, evidencePenalty: 0 },
  Hard: { rewardMultiplier: 1.15, startingBalance: 300, evidencePenalty: 1 }
};

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('slotGrid')) initIndexPage();
  if (document.getElementById('playerName')) initGamePage();
});

function initIndexPage() {
  loadGameData();
  renderLifeSlots();
}

function loadGameData() {
  Promise.all([
    fetchData('data/ghosts.json', BASE_DATA.ghosts),
    fetchData('data/jobs.json', BASE_DATA.jobs),
    fetchData('data/cars.json', BASE_DATA.cars),
    fetchData('data/items.json', BASE_DATA.items),
    fetchData('data/houses.json', BASE_DATA.houses)
  ]).then(([ghosts, jobs, cars, items, houses]) => {
    gameData = { ghosts, jobs, cars, items, houses };
    if (currentLife) updateProfileUI();
    if (document.getElementById('phone')) updatePhoneIfLoaded();
  });
}

function fetchData(path, fallback) {
  return fetch(path).then((response) => {
    if (!response.ok) throw new Error('Fetch failed');
    return response.json();
  }).catch(() => fallback);
}

function renderLifeSlots() {
  const slotGrid = document.getElementById('slotGrid');
  if (!slotGrid) return;
  let html = '';
  for (let slot = 1; slot <= LIFE_SLOTS; slot++) {
    const raw = localStorage.getItem('life' + slot);
    if (raw) {
      const life = JSON.parse(raw);
      html += `
        <div class="lifeSlot">
          <div>
            <strong>${life.firstName} ${life.lastName}</strong><br>
            Role: ${life.role}<br>
            Difficulty: ${life.difficulty}<br>
            Balance: $${life.balance}
          </div>
          <div class="actionRow">
            <button onclick="loadLife(${slot})">Load</button>
            <button onclick="deleteLife(${slot})">Delete</button>
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="lifeSlot">
          <div>Empty slot ${slot}</div>
          <button onclick="openCreateLife()">Create</button>
        </div>
      `;
    }
  }
  slotGrid.innerHTML = html;
}

function openCreateLife() {
  document.getElementById('lifeSelect').classList.add('hidden');
  document.getElementById('createLife').classList.remove('hidden');
}

function backMenu() {
  document.getElementById('createLife').classList.add('hidden');
  document.getElementById('lifeSelect').classList.remove('hidden');
}

function saveLife() {
  const first = document.getElementById('firstName').value.trim();
  const last = document.getElementById('lastName').value.trim();
  const difficulty = document.getElementById('difficultySelect').value;
  let balance = parseInt(document.getElementById('startingBalance').value, 10);

  if (!first || !last || Number.isNaN(balance) || balance < 0) {
    alert('Please enter a valid name, balance, and difficulty.');
    return;
  }

  const diff = DIFFICULTY_MODIFIERS[difficulty] || DIFFICULTY_MODIFIERS.Medium;
  if (balance < diff.startingBalance) balance = diff.startingBalance;

  let slotToUse = null;
  for (let slot = 1; slot <= LIFE_SLOTS; slot++) {
    if (!localStorage.getItem('life' + slot)) { slotToUse = slot; break; }
  }
  if (!slotToUse) slotToUse = 1;

  const startingCar = BASE_DATA.cars[0].id;
  const unlocked = BASE_DATA.items.filter((item) => item.cost === 0).map((item) => item.id);

  const life = {
    firstName: first,
    lastName: last,
    role: 'Rookie Investigator',
    difficulty,
    balance,
    progress: 0,
    selectedCarId: startingCar,
    ownedCars: [startingCar],
    unlockedItems: unlocked,
    inventory: unlocked,
    currentJob: null,
    completedJobs: [],
    settings: { fov: 90, sensitivity: 1.0, graphics: 'Medium', minimap: true, fullscreen: false }
  };

  localStorage.setItem('life' + slotToUse, JSON.stringify(life));
  localStorage.setItem('currentLifeSlot', slotToUse);
  window.location.href = 'game.html';
}

function loadLife(slot) {
  const data = localStorage.getItem('life' + slot);
  if (!data) { alert('No file found in slot ' + slot); return; }
  localStorage.setItem('currentLifeSlot', slot);
  window.location.href = 'game.html';
}

function deleteLife(slot) {
  if (!confirm('Delete save slot ' + slot + '?')) return;
  localStorage.removeItem('life' + slot);
  const currentSlot = localStorage.getItem('currentLifeSlot');
  if (currentSlot === String(slot)) localStorage.removeItem('currentLifeSlot');
  renderLifeSlots();
}

function initGamePage() {
  loadGameData();
  const slot = localStorage.getItem('currentLifeSlot');
  if (!slot) { window.location.href = 'index.html'; return; }

  const raw = localStorage.getItem('life' + slot);
  if (!raw) { window.location.href = 'index.html'; return; }

  currentLife = JSON.parse(raw);
  updateProfileUI();
  initSettingsUI();
  showSection('hub');
  showPhoneTab('dispatch');
}

function updateProfileUI() {
  if (!currentLife) return;
  document.getElementById('playerName').innerText = `${currentLife.firstName} ${currentLife.lastName}`;
  document.getElementById('playerBalance').innerText = currentLife.balance;
  document.getElementById('playerDifficulty').innerText = currentLife.difficulty;
  document.getElementById('currentJobLabel').innerText = currentLife.currentJob ? currentLife.currentJob.title : 'None';
  document.getElementById('currentHouseLabel').innerText = currentLife.currentJob ? currentLife.currentJob.houseName : 'None';
  document.getElementById('selectedVehicleLabel').innerText = getSelectedVehicle().name;
  updateGarage();
  updateStorage();
  updatePhoneIfLoaded();
}

function initSettingsUI() {
  document.getElementById('fovSlider').value = currentLife.settings.fov;
  document.getElementById('sensitivitySlider').value = currentLife.settings.sensitivity;
  document.getElementById('graphicsQuality').innerHTML = '<option>Low</option><option>Medium</option><option selected>High</option>';
  document.getElementById('graphicsQuality').value = currentLife.settings.graphics;
  document.getElementById('minimapToggle').checked = currentLife.settings.minimap;
  document.getElementById('fullscreenToggle').checked = currentLife.settings.fullscreen;
  updateSettingLabel('fov');
  updateSettingLabel('sensitivity');
}

function getSelectedVehicle() {
  return gameData.cars.find((car) => car.id === currentLife.selectedCarId) || { name: 'Unknown Vehicle' };
}

function showSection(sectionId) {
  document.querySelectorAll('main#gameRoot > section').forEach((section) => {
    section.classList.add('hidden');
    section.classList.remove('activePanel');
  });
  const active = document.getElementById(sectionId);
  if (active) { active.classList.remove('hidden'); active.classList.add('activePanel'); }
}

function showPhoneTab(tabId) {
  if (!document.getElementById('phone')) return;
  showSection('phone');
  activePhoneTab = tabId;
  document.querySelectorAll('.phoneTab').forEach((tab) => tab.classList.add('hidden'));
  const active = document.getElementById(tabId + 'Tab');
  if (active) active.classList.remove('hidden');
  if (tabId === 'dispatch') loadDispatchTab();
  if (tabId === 'map') loadMapTab();
  if (tabId === 'inventory') loadInventoryTab();
  if (tabId === 'reports') loadReportsTab();
}

function updatePhoneIfLoaded() {
  if (document.getElementById('phone')) showPhoneTab(activePhoneTab);
}

function loadDispatchTab() {
  const container = document.getElementById('dispatchTab');
  container.innerHTML = '<h3>Dispatch</h3>';
  const list = document.createElement('div');
  list.className = 'itemGrid';
  gameData.jobs.forEach((job) => {
    const house = gameData.houses[Math.floor(Math.random() * gameData.houses.length)];
    const reward = Math.round(job.baseReward * DIFFICULTY_MODIFIERS[currentLife.difficulty].rewardMultiplier);
    const card = document.createElement('div');
    card.className = 'itemCard';
    card.innerHTML = `
      <h3>${job.title}</h3>
      <p><strong>Location:</strong> ${house.name}</p>
      <p><strong>Neighborhood:</strong> ${house.neighborhood}</p>
      <p><strong>Danger:</strong> ${house.danger}</p>
      <p><strong>Reward:</strong> $${reward}</p>
      <button onclick="acceptJob(${job.id}, ${house.id})">Accept Job</button>
    `;
    list.appendChild(card);
  });
  container.appendChild(list);
}

function acceptJob(jobId, houseId) {
  const job = gameData.jobs.find((j) => j.id === jobId);
  const house = gameData.houses.find((h) => h.id === houseId);
  if (!job || !house) return;
  const ghost = randomGhost();
  currentLife.currentJob = {
    title: job.title,
    jobId,
    houseId,
    houseName: house.name,
    neighborhood: house.neighborhood,
    reward: Math.round(job.baseReward * DIFFICULTY_MODIFIERS[currentLife.difficulty].rewardMultiplier),
    ghostId: ghost.id,
    ghostName: ghost.name,
    requiredEvidence: [...ghost.evidence],
    evidenceCollected: [],
    completed: false
  };
  saveCurrentLife();
  updateProfileUI();
  alert(`Job accepted: ${job.title} at ${house.name}.`);
}

function randomGhost() {
  return gameData.ghosts[Math.floor(Math.random() * gameData.ghosts.length)];
}

function loadMapTab() {
  const container = document.getElementById('mapTab');
  container.innerHTML = '<h3>Neighborhood Map</h3>';
  const mapList = document.createElement('div');
  mapList.className = 'itemGrid';
  gameData.houses.forEach((house) => {
    const card = document.createElement('div');
    card.className = 'itemCard';
    card.innerHTML = `
      <h3>${house.name}</h3>
      <p>${house.neighborhood}</p>
      <p>Danger: ${house.danger}</p>
      <button onclick="attemptInvestigation(${house.id})">Investigate</button>
    `;
    mapList.appendChild(card);
  });
  container.appendChild(mapList);
}

function attemptInvestigation(houseId) {
  if (!currentLife.currentJob || currentLife.currentJob.houseId !== houseId) {
    alert('You must accept the job at this location first.');
    return;
  }
  startInvestigation(houseId);
}

function loadInventoryTab() {
  const container = document.getElementById('inventoryTab');
  container.innerHTML = '<h3>Inventory</h3>';
  const inventoryGrid = document.createElement('div');
  inventoryGrid.className = 'itemGrid';
  gameData.items.forEach((item) => {
    const owned = currentLife.unlockedItems.includes(item.id);
    const card = document.createElement('div');
    card.className = 'itemCard';
    card.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.effect}</p>
      <p>Cost: $${item.cost}</p>
      <button ${owned ? 'disabled' : ''} onclick="buyItem(${item.id})">${owned ? 'Owned' : 'Buy'}</button>
    `;
    inventoryGrid.appendChild(card);
  });
  container.appendChild(inventoryGrid);
}

function loadReportsTab() {
  const container = document.getElementById('reportsTab');
  container.innerHTML = '<h3>Reports</h3>';
  const panel = document.createElement('div');
  panel.className = 'itemCard';
  panel.innerHTML = `
    <p><strong>Completed Jobs:</strong> ${currentLife.completedJobs.length}</p>
    <p><strong>Progress:</strong> ${currentLife.progress}</p>
    <p><strong>Selected Car:</strong> ${getSelectedVehicle().name}</p>
    <p><strong>Available Tools:</strong> ${currentLife.unlockedItems.length}</p>
  `;
  container.appendChild(panel);
}

function startInvestigation(houseId) {
  if (!currentLife.currentJob || currentLife.currentJob.houseId !== houseId) {
    alert('You must accept a matching job before investigating.');
    return;
  }
  showSection('investigation');
  document.getElementById('ghostName').innerText = currentLife.currentJob.ghostName;
  renderEvidenceList();
  renderToolButtons();
  document.getElementById('investigationMessage').innerText = 'Start gathering evidence with your tools. Beware of ghost events.';
  if (Math.random() < 0.35) triggerHorrorEvent();
}

function renderEvidenceList() {
  const list = document.getElementById('collectedEvidence');
  list.innerHTML = '';
  const evidence = currentLife.currentJob ? currentLife.currentJob.evidenceCollected : [];
  if (!evidence.length) {
    list.innerHTML = '<li>No evidence collected yet.</li>';
    return;
  }
  evidence.forEach((ev) => {
    const li = document.createElement('li');
    li.innerText = ev;
    list.appendChild(li);
  });
}

function renderToolButtons() {
  const container = document.getElementById('toolButtons');
  container.innerHTML = '';
  const tools = gameData.items.filter((item) => currentLife.unlockedItems.includes(item.id));
  tools.forEach((tool) => {
    const button = document.createElement('button');
    button.innerText = tool.name;
    button.onclick = () => useTool(tool.id);
    container.appendChild(button);
  });
}

function useTool(itemId) {
  if (!currentLife.currentJob) { alert('No active investigation.'); return; }
  const item = gameData.items.find((i) => i.id === itemId);
  if (!item) return;
  const evidence = getEvidenceForTool(item.id);
  const message = evidence ? `Evidence found: ${evidence}.` : 'No useful evidence found.';
  if (evidence && !currentLife.currentJob.evidenceCollected.includes(evidence)) {
    currentLife.currentJob.evidenceCollected.push(evidence);
    saveCurrentLife();
  }
  renderEvidenceList();
  document.getElementById('investigationMessage').innerText = `Used ${item.name}. ${message}`;
}

function getEvidenceForTool(itemId) {
  const ghost = gameData.ghosts.find((g) => g.id === currentLife.currentJob.ghostId);
  if (!ghost) return null;
  const toolMap = {
    1: 'Freezing Temperatures',
    2: 'EMF Level 5',
    3: 'Spirit Box responses',
    4: 'Footprints / Salt interaction',
    5: 'Freezing Temperatures',
    6: ghost.evidence[Math.floor(Math.random() * ghost.evidence.length)],
    7: 'Ghost Writing'
  };
  const evidence = toolMap[itemId];
  return ghost.evidence.includes(evidence) ? evidence : null;
}

function submitReport() {
  if (!currentLife.currentJob) { alert('No job to submit.'); return; }
  const required = currentLife.currentJob.requiredEvidence;
  const collected = currentLife.currentJob.evidenceCollected;
  const correctCount = required.filter((ev) => collected.includes(ev)).length;
  const penalty = DIFFICULTY_MODIFIERS[currentLife.difficulty].evidencePenalty;
  const threshold = Math.max(required.length - penalty, 1);
  if (correctCount >= threshold) {
    currentLife.balance += currentLife.currentJob.reward;
    currentLife.completedJobs.push(currentLife.currentJob);
    currentLife.progress += 1;
    document.getElementById('investigationMessage').innerText = `Report accepted. Earned $${currentLife.currentJob.reward}.`;
  } else {
    currentLife.balance = Math.max(0, currentLife.balance - 50);
    document.getElementById('investigationMessage').innerText = 'Report rejected. Evidence incomplete. Lost $50.';
  }
  currentLife.currentJob = null;
  saveCurrentLife();
  updateProfileUI();
}

function returnToHub() {
  showSection('hub');
}

function updateGarage() {
  const container = document.getElementById('garageList');
  if (!container) return;
  container.innerHTML = '';
  gameData.cars.forEach((car) => {
    const owned = currentLife.ownedCars.includes(car.id);
    const selected = currentLife.selectedCarId === car.id;
    const card = document.createElement('div');
    card.className = 'itemCard';
    card.innerHTML = `
      <h3>${car.name}</h3>
      <p>Speed: ${car.speed}</p>
      <p>Storage: ${car.storage}</p>
      <p>Fuel: ${car.fuel}</p>
      <div class="actionRow">
        <button ${selected ? 'disabled' : ''} onclick="selectCar(${car.id})">${selected ? 'Selected' : 'Select'}</button>
        <button ${owned ? 'disabled' : ''} onclick="buyCar(${car.id})">${owned ? 'Owned' : 'Buy $' + car.cost}</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function updateStorage() {
  const container = document.getElementById('storageList');
  if (!container) return;
  container.innerHTML = '';
  gameData.items.forEach((item) => {
    const owned = currentLife.unlockedItems.includes(item.id);
    const card = document.createElement('div');
    card.className = 'itemCard';
    card.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.effect}</p>
      <p>${owned ? 'Owned' : 'Cost: $' + item.cost}</p>
      <button ${owned ? 'disabled' : ''} onclick="buyItem(${item.id})">${owned ? 'Equipped' : 'Buy'}</button>
    `;
    container.appendChild(card);
  });
}

function buyItem(itemId) {
  const item = gameData.items.find((i) => i.id === itemId);
  if (!item) return;
  if (currentLife.unlockedItems.includes(itemId)) { alert('Already owned.'); return; }
  if (currentLife.balance < item.cost) { alert('Not enough money.'); return; }
  currentLife.balance -= item.cost;
  currentLife.unlockedItems.push(itemId);
  currentLife.inventory.push(itemId);
  saveCurrentLife();
  updateProfileUI();
  alert(item.name + ' purchased.');
}

function buyCar(carId) {
  const car = gameData.cars.find((c) => c.id === carId);
  if (!car) return;
  if (currentLife.ownedCars.includes(carId)) { alert('Already owned.'); return; }
  if (currentLife.balance < car.cost) { alert('Not enough money.'); return; }
  currentLife.balance -= car.cost;
  currentLife.ownedCars.push(carId);
  saveCurrentLife();
  updateProfileUI();
  alert(car.name + ' purchased.');
}

function selectCar(carId) {
  if (!currentLife.ownedCars.includes(carId)) { alert('You must own this car first.'); return; }
  currentLife.selectedCarId = carId;
  saveCurrentLife();
  updateProfileUI();
}

function updateSettingLabel(id) {
  const slider = document.getElementById(id + 'Slider');
  if (!slider) return;
  const label = document.getElementById(id + 'Label');
  if (label) label.innerText = slider.value;
}

function saveSettings() {
  if (!currentLife) return;
  currentLife.settings.fov = parseInt(document.getElementById('fovSlider').value, 10);
  currentLife.settings.sensitivity = parseFloat(document.getElementById('sensitivitySlider').value);
  currentLife.settings.graphics = document.getElementById('graphicsQuality').value;
  currentLife.settings.minimap = document.getElementById('minimapToggle').checked;
  currentLife.settings.fullscreen = document.getElementById('fullscreenToggle').checked;
  saveCurrentLife();
  alert('Settings saved.');
}

function exitLife() {
  if (!confirm('Save and exit to the main menu?')) return;
  saveCurrentLife();
  localStorage.removeItem('currentLifeSlot');
  window.location.href = 'index.html';
}

function saveCurrentLife() {
  const slot = localStorage.getItem('currentLifeSlot');
  if (!slot || !currentLife) return;
  localStorage.setItem('life' + slot, JSON.stringify(currentLife));
}

function triggerHorrorEvent() {
  const messages = [
    'A flicker of light pulses through the room.',
    'You hear faint whispers coming from the walls.',
    'Static crackles from your equipment.',
    'Shadow movement triggers your instincts.'
  ];
  const message = messages[Math.floor(Math.random() * messages.length)];
  document.getElementById('investigationMessage').innerText = `HORROR EVENT: ${message}`;
}
