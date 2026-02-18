// Game State
let gameState = {
    // Main Resources
    money: 0,
    experience: 0,
    level: 1,
    altitude: 0,
    speed: 0,
    
    // Upgrades
    upgrades: {
        strongerWings: { count: 0, purchased: false },
        birdFeathers: { count: 0, purchased: false },
        aerodynamic: { count: 0, purchased: false },
        windCatch: { count: 0, purchased: false },
        muscleMemory: { count: 0, purchased: false },
        thermals: { count: 0, purchased: false },
        goldenFeathers: { count: 0, purchased: false },
        skyDiving: { count: 0, purchased: false },
    },
    
    // Passive Abilities
    abilities: {
        autoFlap: { active: false, level: 0 },
        tailBoost: { active: false, level: 0 },
        soaring: { active: false, level: 0 },
        navigation: { active: false, level: 0 },
        skyMastery: { active: false, level: 0 },
    },
    
    // Prestige System
    prestigePoints: 0,
    prestigeLevel: 0,
    totalResets: 0,
    
    // Multipliers
    experienceMultiplier: 1,
    moneyMultiplier: 1,
    autoFlapRate: 0,
    
    // Stats
    totalClicks: 0,
    playTime: 0,
};

// Upgrade Definitions
const upgradeDefinitions = {
    strongerWings: {
        name: "Stronger Wings",
        description: "Increase experience per flap by 1",
        icon: "💪",
        baseCost: 10,
        effect: (count) => count * 1,
    },
    birdFeathers: {
        name: "Bird Feathers",
        description: "Increases earnings by 5% per level",
        icon: "🪶",
        baseCost: 25,
        effect: (count) => count * 0.05,
    },
    aerodynamic: {
        name: "Aerodynamic Body",
        description: "Boost speed by 10 km/h per upgrade",
        icon: "🌬️",
        baseCost: 50,
        effect: (count) => count * 10,
    },
    windCatch: {
        name: "Wind Catch",
        description: "Gain 2% of altitude as experience",
        icon: "💨",
        baseCost: 100,
        effect: (count) => count > 0,
    },
    muscleMemory: {
        name: "Muscle Memory",
        description: "+1 experience per second passively",
        icon: "🧠",
        baseCost: 200,
        effect: (count) => count,
    },
    thermals: {
        name: "Thermal Detection",
        description: "Find warm air currents for free altitude",
        icon: "🔥",
        baseCost: 500,
        effect: (count) => count > 0,
    },
    goldenFeathers: {
        name: "Golden Feathers",
        description: "x2 experience multiplier",
        icon: "✨",
        baseCost: 1000,
        effect: (count) => count > 0 ? 2 : 1,
    },
    skyDiving: {
        name: "Sky Diving Training",
        description: "+50% money from upgrades",
        icon: "🪂",
        baseCost: 2000,
        effect: (count) => count > 0 ? 0.5 : 0,
    },
};

// Ability Definitions
const abilityDefinitions = {
    autoFlap: {
        name: "Auto Flap",
        description: "Wings flap automatically every 3 seconds",
        icon: "🔄",
        baseCost: 75,
        requirements: { level: 5 },
        effect: () => 1,
    },
    tailBoost: {
        name: "Tail Boost",
        description: "Tail provides extra +2 experience per flap",
        icon: "🐦",
        baseCost: 150,
        requirements: { level: 10 },
        effect: () => 2,
    },
    soaring: {
        name: "Soaring",
        description: "Glide for +50 altitude per second",
        icon: "🌤️",
        baseCost: 300,
        requirements: { level: 15 },
        effect: () => 50,
    },
    navigation: {
        name: "Navigation",
        description: "Better air routes grant +25% experience",
        icon: "🧭",
        baseCost: 500,
        requirements: { level: 20 },
        effect: () => 0.25,
    },
    skyMastery: {
        name: "Sky Mastery",
        description: "Master the skies - x3 all production",
        icon: "👑",
        baseCost: 1500,
        requirements: { level: 30, prestigeLevel: 1 },
        effect: () => 3,
    },
};

// DOM Elements
const elements = {
    money: document.getElementById('money'),
    experience: document.getElementById('experience'),
    altitude: document.getElementById('altitude'),
    speed: document.getElementById('speed'),
    levelDisplay: document.querySelector('.level-display'),
    progressFill: document.querySelector('.progress-fill'),
    progressText: document.getElementById('progress-text'),
    flapButton: document.getElementById('flap-button'),
    flightMessage: document.getElementById('flight-message'),
    upgradesList: document.getElementById('upgrades-list'),
    abilitiesList: document.getElementById('abilities-list'),
    prestigePointsDisplay: document.getElementById('prestige-points'),
    prestigeGainDisplay: document.getElementById('prestige-gain'),
    prestigeUpgrades: document.getElementById('prestige-upgrades'),
    prestigeResetBtn: document.getElementById('prestige-reset-btn'),
    activeEffects: document.getElementById('active-effects'),
    effectsContainer: document.getElementById('effects-container'),
};

// Initialize Game
function initGame() {
    loadGame();
    renderUI();
    setupEventListeners();
    startGameLoop();
}

// Setup Event Listeners
function setupEventListeners() {
    elements.flapButton.addEventListener('click', () => flap());
    
    // Tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });
    
    // Settings buttons
    document.getElementById('save-btn').addEventListener('click', saveGame);
    document.getElementById('load-btn').addEventListener('click', loadGame);
    document.getElementById('reset-btn').addEventListener('click', hardReset);
    
    // Prestige reset
    elements.prestigeResetBtn.addEventListener('click', prestigeReset);
}

// Main flap action
function flap() {
    gameState.totalClicks++;
    
    let expGain = 1 + (gameState.upgrades.strongerWings.count * 1);
    expGain = applyMultipliers(expGain);
    
    if (gameState.abilities.tailBoost.active) {
        expGain += gameState.abilities.tailBoost.level * 2;
    }
    
    gameState.experience += expGain;
    gameState.money += 1 * gameState.moneyMultiplier;
    gameState.speed = Math.min(gameState.speed + 0.5, 300);
    
    // Button animation
    elements.flapButton.classList.remove('pop');
    void elements.flapButton.offsetWidth; // Trigger reflow
    elements.flapButton.classList.add('pop');
    
    checkLevelUp();
    updateDisplay();
}

// Apply multipliers
function applyMultipliers(amount) {
    let multiplied = amount * gameState.experienceMultiplier;
    
    // Prestige bonuses
    multiplied *= (1 + gameState.prestigeLevel * 0.2);
    
    // Golden Feathers upgrade
    if (gameState.upgrades.goldenFeathers.count > 0) {
        multiplied *= 2;
    }
    
    // Navigation ability
    if (gameState.abilities.navigation.active) {
        multiplied *= (1 + 0.25 * gameState.abilities.navigation.level);
    }
    
    // Sky Mastery ability
    if (gameState.abilities.skyMastery.active) {
        multiplied *= 3;
    }
    
    return Math.floor(multiplied);
}

// Check for level up
function checkLevelUp() {
    const nextLevelExp = 100 * Math.pow(1.1, gameState.level - 1);
    
    if (gameState.experience >= nextLevelExp) {
        gameState.experience -= nextLevelExp;
        gameState.level++;
        gameState.altitude += 100 * (1 + gameState.prestigeLevel * 0.1);
        
        // Unlock abilities at certain levels
        if (gameState.level === 5 && !gameState.abilities.autoFlap.active) {
            showMessage("🎉 Auto Flap ability unlocked at Level 5!");
        }
        if (gameState.level === 10 && !gameState.abilities.tailBoost.active) {
            showMessage("🎉 Tail Boost ability unlocked at Level 10!");
        }
        if (gameState.level === 15 && !gameState.abilities.soaring.active) {
            showMessage("🎉 Soaring ability unlocked at Level 15!");
        }
        if (gameState.level === 20 && !gameState.abilities.navigation.active) {
            showMessage("🎉 Navigation ability unlocked at Level 20!");
        }
        if (gameState.level === 30 && !gameState.abilities.skyMastery.active) {
            showMessage("🎉 Sky Mastery ability unlocked at Level 30!");
        }
    }
}

// Purchase upgrade
function purchaseUpgrade(upgradeKey) {
    const upgrade = upgradeDefinitions[upgradeKey];
    const cost = getUpgradeCost(upgradeKey);
    
    if (gameState.money >= cost) {
        gameState.money -= cost;
        gameState.upgrades[upgradeKey].count++;
        gameState.upgrades[upgradeKey].purchased = true;
        
        // Apply effects
        if (upgradeKey === 'muscleMemory') {
            gameState.autoFlapRate += 1;
        }
        
        showMessage(`✅ Purchased ${upgrade.name}!`);
        renderUI();
    }
}

// Get upgrade cost (exponential scaling)
function getUpgradeCost(upgradeKey) {
    const baseCost = upgradeDefinitions[upgradeKey].baseCost;
    const count = gameState.upgrades[upgradeKey].count;
    return Math.ceil(baseCost * Math.pow(1.15, count));
}

// Purchase ability
function purchaseAbility(abilityKey) {
    const ability = abilityDefinitions[abilityKey];
    const cost = getAbilityCost(abilityKey);
    const requirements = ability.requirements;
    
    // Check requirements
    if (requirements.level && gameState.level < requirements.level) {
        showMessage(`❌ Requires Level ${requirements.level}`);
        return;
    }
    if (requirements.prestigeLevel && gameState.prestigeLevel < requirements.prestigeLevel) {
        showMessage(`❌ Requires Prestige Level ${requirements.prestigeLevel}`);
        return;
    }
    
    if (gameState.money >= cost) {
        gameState.money -= cost;
        gameState.abilities[abilityKey].active = true;
        gameState.abilities[abilityKey].level = (gameState.abilities[abilityKey].level || 0) + 1;
        
        showMessage(`✅ Unlocked ${ability.name}!`);
        renderUI();
    }
}

// Get ability cost
function getAbilityCost(abilityKey) {
    const baseCost = abilityDefinitions[abilityKey].baseCost;
    const level = gameState.abilities[abilityKey].level || 0;
    return Math.ceil(baseCost * Math.pow(1.2, level));
}

// Prestige reset
function prestigeReset() {
    if (gameState.level >= 10) {
        const prestigeGain = Math.floor(Math.sqrt(gameState.level - 1));
        gameState.prestigePoints += prestigeGain;
        gameState.prestigeLevel++;
        gameState.totalResets++;
        
        // Reset progress
        gameState.money = 0;
        gameState.experience = 0;
        gameState.level = 1;
        gameState.altitude = 0;
        gameState.speed = 0;
        
        // Keep prestige abilities and some bonuses
        for (let key in gameState.upgrades) {
            gameState.upgrades[key].count = 0;
        }
        
        showMessage(`🌟 Prestige Reset! Gained ${prestigeGain} Prestige Points! Now at Level ${gameState.prestigeLevel}!`);
        renderUI();
    } else {
        showMessage("❌ Reach Level 10 to prestige");
    }
}

// Render UI
function renderUI() {
    // Update stats display
    elements.money.textContent = '$' + formatNumber(gameState.money);
    elements.experience.textContent = formatNumber(gameState.experience);
    elements.altitude.textContent = formatNumber(gameState.altitude);
    elements.speed.textContent = gameState.speed.toFixed(1);
    elements.levelDisplay.textContent = gameState.level;
    
    // Update progress bar
    const nextLevelExp = 100 * Math.pow(1.1, gameState.level - 1);
    const progress = (gameState.experience / nextLevelExp) * 100;
    elements.progressFill.style.width = progress + '%';
    elements.progressText.textContent = `${formatNumber(gameState.experience)} / ${formatNumber(nextLevelExp)}`;
    
    // Update upgrades
    renderUpgrades();
    
    // Update abilities
    renderAbilities();
    
    // Update prestige
    renderPrestige();
    
    // Update active effects
    updateActiveEffects();
    
    // Update flight message
    updateFlightMessage();
}

// Render upgrades list
function renderUpgrades() {
    elements.upgradesList.innerHTML = '';
    
    for (let key in upgradeDefinitions) {
        const upgrade = upgradeDefinitions[key];
        const count = gameState.upgrades[key].count;
        const cost = getUpgradeCost(key);
        const canAfford = gameState.money >= cost;
        
        const upgradeEl = document.createElement('div');
        upgradeEl.className = `upgrade-item ${canAfford ? 'affordable' : ''} ${count === 0 ? '' : 'purchased'}`;
        upgradeEl.innerHTML = `
            <div class="upgrade-header">
                <span class="upgrade-name">${upgrade.icon} ${upgrade.name}</span>
                <span class="upgrade-count">${count}x</span>
            </div>
            <div class="upgrade-description">${upgrade.description}</div>
            <div class="upgrade-cost">Cost: $${formatNumber(cost)}</div>
        `;
        upgradeEl.addEventListener('click', () => purchaseUpgrade(key));
        
        elements.upgradesList.appendChild(upgradeEl);
    }
}

// Render abilities list
function renderAbilities() {
    elements.abilitiesList.innerHTML = '';
    
    for (let key in abilityDefinitions) {
        const ability = abilityDefinitions[key];
        const isActive = gameState.abilities[key].active;
        const cost = getAbilityCost(key);
        const canAfford = gameState.money >= cost;
        const requirements = ability.requirements;
        
        let canUnlock = true;
        if (requirements.level && gameState.level < requirements.level) canUnlock = false;
        if (requirements.prestigeLevel && gameState.prestigeLevel < requirements.prestigeLevel) canUnlock = false;
        
        const abilityEl = document.createElement('div');
        abilityEl.className = `ability-item ${canAfford && canUnlock ? 'affordable' : ''} ${isActive ? 'active' : ''}`;
        
        let requirementText = '';
        if (!canUnlock) {
            if (requirements.level && gameState.level < requirements.level) {
                requirementText = ` (Requires Level ${requirements.level})`;
            }
            if (requirements.prestigeLevel && gameState.prestigeLevel < requirements.prestigeLevel) {
                requirementText = ` (Requires Prestige ${requirements.prestigeLevel})`;
            }
        }
        
        abilityEl.innerHTML = `
            <div class="upgrade-header">
                <span class="upgrade-name">${ability.icon} ${ability.name}</span>
                ${isActive ? '<span class="upgrade-count">UNLOCKED</span>' : ''}
            </div>
            <div class="upgrade-description">${ability.description}${requirementText}</div>
            <div class="upgrade-cost">Cost: $${formatNumber(cost)}</div>
        `;
        
        if (!isActive) {
            abilityEl.addEventListener('click', () => purchaseAbility(key));
        }
        
        elements.abilitiesList.appendChild(abilityEl);
    }
}

// Render prestige section
function renderPrestige() {
    elements.prestigePointsDisplay.textContent = gameState.prestigePoints;
    
    const prestigeGain = gameState.level >= 10 ? Math.floor(Math.sqrt(gameState.level - 1)) : 0;
    elements.prestigeGainDisplay.textContent = prestigeGain;
    
    // Prestige upgrades can be added here if needed
}

// Update active effects
function updateActiveEffects() {
    const effects = [];
    
    if (gameState.upgrades.muscleMemory.count > 0) {
        effects.push(`⚡ Passive +${gameState.upgrades.muscleMemory.count} exp/sec`);
    }
    if (gameState.abilities.soaring.active) {
        effects.push(`🌤️ Soaring: +${gameState.abilities.soaring.level * 50} altitude/sec`);
    }
    if (gameState.abilities.navigation.active) {
        effects.push(`🧭 Navigation: +${Math.round(gameState.abilities.navigation.level * 25)}% exp`);
    }
    if (gameState.abilities.skyMastery.active) {
        effects.push(`👑 Sky Mastery: x3 production`);
    }
    if (gameState.upgrades.goldenFeathers.count > 0) {
        effects.push(`✨ Golden Feathers: x2 experience`);
    }
    
    if (effects.length > 0) {
        elements.effectsContainer.style.display = 'block';
        elements.activeEffects.innerHTML = effects
            .map(e => `<div class="effect-item">${e}</div>`)
            .join('');
    } else {
        elements.effectsContainer.style.display = 'none';
    }
}

// Update flight message
function updateFlightMessage() {
    const messages = [
        "Just learning to flap...",
        "Flapping is getting easier!",
        "Your wings are getting stronger!",
        "You're lifting off the ground!",
        "You're getting altitude!",
        "Flying higher and higher!",
        "The sky is your playground!",
        "You're a true sky explorer!",
        "Mastering the art of flight!",
        "You are ONE with the sky!",
    ];
    
    const messageIndex = Math.min(Math.floor(gameState.level / 3), messages.length - 1);
    elements.flightMessage.textContent = messages[messageIndex];
}

// Game Loop (for passive generation)
function gameLoop() {
    // Auto flap from Muscle Memory
    if (gameState.upgrades.muscleMemory.count > 0) {
        let autoExp = gameState.upgrades.muscleMemory.count * gameState.experienceMultiplier;
        autoExp *= (1 + gameState.prestigeLevel * 0.2);
        
        if (gameState.upgrades.goldenFeathers.count > 0) {
            autoExp *= 2;
        }
        
        gameState.experience += Math.floor(autoExp);
        checkLevelUp();
    }
    
    // Soaring altitude gain
    if (gameState.abilities.soaring.active) {
        gameState.altitude += gameState.abilities.soaring.level * 50;
    }
    
    // Thermals passive altitude
    if (gameState.upgrades.thermals.count > 0) {
        gameState.altitude += gameState.upgrades.thermals.count * 5;
    }
    
    // Wind Catch passive experience
    if (gameState.upgrades.windCatch.count > 0) {
        let windExp = Math.floor(gameState.altitude * 0.02);
        gameState.experience += windExp;
        checkLevelUp();
    }
    
    // Auto flap ability
    if (gameState.abilities.autoFlap.active) {
        let autoFlapExp = 1 + gameState.upgrades.strongerWings.count;
        autoFlapExp = applyMultipliers(autoFlapExp);
        gameState.experience += autoFlapExp;
        gameState.money += 0.5 * gameState.moneyMultiplier;
        checkLevelUp();
    }
    
    updateDisplay();
}

// Start game loop (runs every second)
function startGameLoop() {
    setInterval(gameLoop, 1000);
}

// Display update
function updateDisplay() {
    elements.money.textContent = '$' + formatNumber(gameState.money);
    elements.experience.textContent = formatNumber(gameState.experience);
    elements.altitude.textContent = formatNumber(gameState.altitude);
    
    const nextLevelExp = 100 * Math.pow(1.1, gameState.level - 1);
    const progress = (gameState.experience / nextLevelExp) * 100;
    elements.progressFill.style.width = progress + '%';
    elements.progressText.textContent = `${formatNumber(gameState.experience)} / ${formatNumber(nextLevelExp)}`;
}

// Show temporary message
function showMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(72, 187, 120, 0.9);
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        font-size: 1.2em;
        z-index: 1000;
        pointer-events: none;
        animation: fadeIn 0.3s ease, fadeOut 0.3s ease 1.7s forwards;
    `;
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => messageEl.remove(), 2000);
}

// Format number with commas
function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num).toString();
}

// Switch tabs
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Save game
function saveGame() {
    localStorage.setItem('flightIdleGame', JSON.stringify(gameState));
    showMessage('💾 Game Saved!');
}

// Load game
function loadGame() {
    const saved = localStorage.getItem('flightIdleGame');
    if (saved) {
        try {
            gameState = JSON.parse(saved);
            showMessage('📂 Game Loaded!');
        } catch (e) {
            console.error('Failed to load game:', e);
        }
    }
}

// Hard reset
function hardReset() {
    if (confirm('Are you sure you want to completely reset the game? This cannot be undone!')) {
        gameState = {
            money: 0,
            experience: 0,
            level: 1,
            altitude: 0,
            speed: 0,
            upgrades: {
                strongerWings: { count: 0, purchased: false },
                birdFeathers: { count: 0, purchased: false },
                aerodynamic: { count: 0, purchased: false },
                windCatch: { count: 0, purchased: false },
                muscleMemory: { count: 0, purchased: false },
                thermals: { count: 0, purchased: false },
                goldenFeathers: { count: 0, purchased: false },
                skyDiving: { count: 0, purchased: false },
                profitableClicks: { count: 0, purchased: false },
            },
            abilities: {
                autoFlap: { active: false, level: 0 },
                tailBoost: { active: false, level: 0 },
                soaring: { active: false, level: 0 },
                navigation: { active: false, level: 0 },
                skyMastery: { active: false, level: 0 },
            },
            prestigePoints: 0,
            prestigeLevel: 0,
            totalResets: 0,
            experienceMultiplier: 1,
            moneyMultiplier: 1,
            autoFlapRate: 0,
            totalClicks: 0,
            playTime: 0,
        };
        localStorage.removeItem('flightIdleGame');
        renderUI();
        showMessage('🔄 Game Reset!');
    }
}

// Add CSS for animations if not in stylesheet
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        to { opacity: 0; transform: translate(-50%, -60%); }
    }
`;
document.head.appendChild(style);

// Start the game
initGame();
