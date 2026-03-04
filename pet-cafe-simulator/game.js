// Pet Cafe Simulator - Game Logic

const petEmojis = ['🐕', '🐈', '🐇', '🐿️', '🦆', '🦜', '🦢', '🦊', '🐻', '🐼', '🐨', '🦁', '🦒', '🐢', '🦎'];

const game = {
    // Game State
    state: {
        money: 200,
        happiness: 50,
        level: 1,
        experience: 0,
        experienceToLevel: 100,
        
        // Rebirth System
        rebirths: 0,
        rebirthPoints: 0,
        
        // Statistics
        totalPets: 0,
        drinksServed: 0,
        totalEarned: 200,
        playTime: 0,
        
        // Pets
        pets: [],
        unlockedPetEmojis: ['🐕', '🐈', '🐇'],
        
        // Upgrades - Gameplay Benefits
        upgrades: {
            cooldownReduction1: { count: 0, cost: 2000, effect: 'Reduce pet cooldown by 1s' },
            cooldownReduction2: { count: 0, cost: 4000, effect: 'Reduce pet cooldown by 2s more' },
            incomeBoost: { count: 0, cost: 3000, effect: '+20% pet income' },
            happinessBoost: { count: 0, cost: 2500, effect: '+50% happiness from actions' },
            moneyBoost: { count: 0, cost: 3500, effect: '+25% money from drinks' },
            petPriceDown: { count: 0, cost: 5000, effect: '-15% pet cost' },
        },
        
        // Rebirth Upgrades - Permanent bonuses
        rebirthUpgrades: {
            moneyMultiplier: { level: 0, cost: 10, effect: '+5% money per level' },
            incomeMultiplier: { level: 0, cost: 15, effect: '+5% pet income per level' },
            startingMoney: { level: 0, cost: 8, effect: '+$100 starting money per level' },
            unlockAllPets: { level: 0, cost: 50, effect: 'Unlock all rare pets' },
            petStartingHappiness: { level: 0, cost: 12, effect: '+5 pet starting happiness per level' },
        },
        
        // Decorations
        decorations: {
            lights: { count: 0, cost: 100, happiness: 5 },
            plants: { count: 0, cost: 150, happiness: 8 },
            furniture: { count: 0, cost: 200, happiness: 10 },
            paintings: { count: 0, cost: 250, happiness: 12 },
            fountain: { count: 0, cost: 500, happiness: 25 },
            chandelier: { count: 0, cost: 800, happiness: 35 },
        },
        
        // Unlockable Pets - Much harder to unlock
        petUnlocks: {
            dragon: { cost: 25000, emoji: '🐉', unlocked: false },
            unicorn: { cost: 40000, emoji: '🦄', unlocked: false },
            phoenix: { cost: 65000, emoji: '🦅', unlocked: false },
            alienMonster: { cost: 100000, emoji: '👽', unlocked: false },
        }
    },
    
    // UI State
    multiSelectMode: false,
    selectedPets: new Set(),
    lastPetTime: 0,
    petCooldown: 10000, // 10 seconds in milliseconds

    init() {
        this.loadGame();
        this.applyRebirthBonuses();
        this.render();
        this.startAutoTick();
        console.log('🎮 Pet Cafe Simulator loaded!');
    },
    
    getEffectiveCooldown() {
        let cooldown = 10000; // Base 10 seconds
        cooldown -= this.state.upgrades.cooldownReduction1.count * 1000; // 1s per level
        cooldown -= this.state.upgrades.cooldownReduction2.count * 2000; // 2s per level
        return Math.max(1000, cooldown); // Minimum 1 second
    },
    
    applyRebirthBonuses() {
        // Apply permanent bonuses from rebirth upgrades
        // These will be applied to calculations as needed
    },

    petArrives() {
        const now = Date.now();
        
        const effectiveCooldown = this.getEffectiveCooldown();
        
        // Check cooldown
        if (now - this.lastPetTime < effectiveCooldown) {
            const remainingTime = Math.ceil((effectiveCooldown - (now - this.lastPetTime)) / 1000);
            this.showNotification(`⏱️ Wait ${remainingTime}s to add another pet!`, 'error');
            return;
        }
        
        this.lastPetTime = now;
        
        const randomEmoji = this.getRandomPet();
        let baseCost = 300;
        
        // Apply pet price reduction upgrade
        const priceMultiplier = Math.pow(0.85, this.state.upgrades.petPriceDown.count); // -15% per level
        baseCost = Math.floor(baseCost * priceMultiplier);
        
        const petCount = this.state.pets.length;
        // Exponential cost scaling: each pet costs 1.6x more than the last
        const petCost = Math.floor(baseCost * Math.pow(1.6, petCount));
        
        let startingHappiness = 50 + (this.state.rebirthUpgrades.petStartingHappiness.level * 5);
        
        this.state.pets.push({
            emoji: randomEmoji,
            happiness: startingHappiness,
            arrivedAt: Date.now(),
            cost: petCost,
            incomePerSecond: petCost * 0.05, // 5% of cost per second
            lastHappinessLoss: Date.now()
        });
        
        this.addMoney(10);
        this.state.totalPets++;
        const incomePerSec = petCost * 0.05;
        this.showNotification(`🐕 Pet arrived! (Cost: $${petCost}, Income: $${(incomePerSec).toFixed(2)}/s)`, 'success');
        this.render();
    },

    serveDrink() {
        if (this.state.pets.length === 0) {
            this.showNotification('No pets to serve!', 'error');
            return;
        }

        let earnings = 30;
        
        // Apply money boost upgrade multiplier
        const moneyBoost = 1 + (this.state.upgrades.moneyBoost.count * 0.25);
        earnings = Math.floor(earnings * moneyBoost);
        
        this.addMoney(earnings);
        this.state.drinksServed++;
        this.addExperience(15);
        
        this.showNotification(`☕ Earned $${earnings}!`, 'success');
        this.render();
    },

    giveSnack() {
        if (this.state.pets.length === 0) {
            this.showNotification('No pets to feed!', 'error');
            return;
        }

        const randomHappiness = Math.floor(Math.random() * 4) + 2; // 2-5 happiness
        this.increasePetHappiness(randomHappiness);
        this.addExperience(10);
        this.showNotification('🍪 Pets are happy!', 'success');
        this.render();
    },

    playGame() {
        if (this.state.pets.length === 0) {
            this.showNotification('No pets to play with!', 'error');
            return;
        }

        const decorBonus = Object.values(this.state.decorations).reduce((sum, dec) => sum + (dec.count * dec.happiness), 0);
        let happinessGain = 50 + Math.floor(decorBonus * 0.3);
        
        this.state.happiness = Math.min(100, this.state.happiness + Math.floor(happinessGain / this.state.pets.length));
        const randomHappiness = Math.floor(Math.random() * 4) + 2; // 2-5 happiness
        this.increasePetHappiness(randomHappiness);
        this.addExperience(25);
        
        this.showNotification('🎮 Pets had fun!', 'success');
        this.render();
    },

    getRandomPet() {
        return this.state.unlockedPetEmojis[Math.floor(Math.random() * this.state.unlockedPetEmojis.length)];
    },

    increasePetHappiness(amount) {
        this.state.pets.forEach(pet => {
            pet.happiness = Math.min(100, pet.happiness + amount);
        });
    },

    addMoney(amount) {
        this.state.money += amount;
        this.state.totalEarned += amount;
    },

    addExperience(amount) {
        this.state.experience += amount;
        if (this.state.experience >= this.state.experienceToLevel) {
            this.levelUp();
        }
    },

    levelUp() {
        this.state.level++;
        this.state.experience = 0;
        this.state.experienceToLevel = Math.floor(this.state.experienceToLevel * 1.15);
        this.showNotification('⭐ Level Up!', 'levelup');
    },

    buyUpgrade(upgradeName) {
        const upgrade = this.state.upgrades[upgradeName];
        if (!upgrade) return;

        const cost = Math.floor(upgrade.cost * Math.pow(1.25, upgrade.count));
        
        if (this.state.money < cost) {
            this.showNotification('Not enough money!', 'error');
            return;
        }

        this.state.money -= cost;
        upgrade.count++;
        this.showNotification(`✨ ${upgrade.effect}`, 'success');
        this.render();
    },
    
    buyRebirthUpgrade(upgradeName) {
        const upgrade = this.state.rebirthUpgrades[upgradeName];
        if (!upgrade) return;
        
        const cost = upgrade.cost;
        
        if (this.state.rebirthPoints < cost) {
            this.showNotification('Not enough rebirth points!', 'error');
            return;
        }
        
        this.state.rebirthPoints -= cost;
        upgrade.level++;
        this.showNotification(`🔄 ${upgrade.effect}`, 'success');
        this.render();
    },
    
    rebirth() {
        if (this.state.pets.length === 0) {
            this.showNotification('No pets yet!', 'error');
            return;
        }
        
        if (!confirm(`🔄 Rebirth? You'll get ${this.state.pets.length} rebirth points. Progress will reset!`)) {
            return;
        }
        
        // Calculate rebirth points based on pets (1 point per pet)
        const rebirthPointsGained = this.state.pets.length;
        
        // Keep rebirth points and reset everything else
        this.state.rebirthPoints += rebirthPointsGained;
        this.state.rebirths++;
        
        // Calculate bonuses from rebirth upgrades
        const moneyBonus = this.state.rebirthUpgrades.moneyMultiplier.level * 0.05;
        const incomeBonus = this.state.rebirthUpgrades.incomeMultiplier.level * 0.05;
        const startingMoneyBonus = this.state.rebirthUpgrades.startingMoney.level * 100;
        
        // Reset game state but keep rebirth upgrades and unlocks
        const oldPetUnlocks = JSON.parse(JSON.stringify(this.state.petUnlocks));
        const oldRebirthUpgrades = JSON.parse(JSON.stringify(this.state.rebirthUpgrades));
        const oldRebirthPoints = this.state.rebirthPoints;
        const oldRebirths = this.state.rebirths;
        
        // Check if should unlock all pets
        if (this.state.rebirthUpgrades.unlockAllPets.level > 0) {
            Object.keys(oldPetUnlocks).forEach(key => {
                oldPetUnlocks[key].unlocked = true;
            });
        }
        
        // Reset to initial state
        this.state = {
            money: 200 + startingMoneyBonus,
            happiness: 50,
            level: 1,
            experience: 0,
            experienceToLevel: 100,
            rebirths: oldRebirths,
            rebirthPoints: oldRebirthPoints,
            totalPets: 0,
            drinksServed: 0,
            totalEarned: 200 + startingMoneyBonus,
            playTime: 0,
            pets: [],
            unlockedPetEmojis: ['🐕', '🐈', '🐇'],
            upgrades: {
                cooldownReduction1: { count: 0, cost: 2000, effect: 'Reduce pet cooldown by 1s' },
                cooldownReduction2: { count: 0, cost: 4000, effect: 'Reduce pet cooldown by 2s more' },
                incomeBoost: { count: 0, cost: 3000, effect: '+20% pet income' },
                happinessBoost: { count: 0, cost: 2500, effect: '+50% happiness from actions' },
                moneyBoost: { count: 0, cost: 3500, effect: '+25% money from drinks' },
                petPriceDown: { count: 0, cost: 5000, effect: '-15% pet cost' },
            },
            rebirthUpgrades: oldRebirthUpgrades,
            decorations: {
                lights: { count: 0, cost: 100, happiness: 5 },
                plants: { count: 0, cost: 150, happiness: 8 },
                furniture: { count: 0, cost: 200, happiness: 10 },
                paintings: { count: 0, cost: 250, happiness: 12 },
                fountain: { count: 0, cost: 500, happiness: 25 },
                chandelier: { count: 0, cost: 800, happiness: 35 },
            },
            petUnlocks: oldPetUnlocks,
        };
        
        this.lastPetTime = 0;
        this.selectedPets.clear();
        this.multiSelectMode = false;
        
        this.showNotification(`🔄 Rebirthed! Gained ${rebirthPointsGained} rebirth points!`, 'success');
        this.render();
    },

    buyDecoration(decorName) {
        const decor = this.state.decorations[decorName];
        if (!decor) return;

        const cost = Math.floor(decor.cost * Math.pow(1.1, decor.count));
        
        if (this.state.money < cost) {
            this.showNotification('Not enough money!', 'error');
            return;
        }

        this.state.money -= cost;
        decor.count++;
        this.state.happiness = Math.min(100, this.state.happiness + decor.happiness);
        this.showNotification(`✨ ${decorName} added!`, 'success');
        this.render();
    },

    unlockPet(petName) {
        const petUnlock = this.state.petUnlocks[petName];
        if (!petUnlock || petUnlock.unlocked) return;

        if (this.state.money < petUnlock.cost) {
            this.showNotification('Not enough money!', 'error');
            return;
        }

        this.state.money -= petUnlock.cost;
        petUnlock.unlocked = true;
        this.state.unlockedPetEmojis.push(petUnlock.emoji);
        this.showNotification(`🎉 New pet unlocked: ${petUnlock.emoji}!`, 'success');
        this.render();
    },

    toggleMultiSelect() {
        this.multiSelectMode = !this.multiSelectMode;
        this.selectedPets.clear();
        const btn = document.getElementById('multiSelectBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        const selectionCount = document.getElementById('selectionCount');
        
        if (this.multiSelectMode) {
            btn.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ff4444 100%)';
            btn.textContent = '📋 Cancel';
            deleteBtn.style.display = 'block';
            selectionCount.style.display = 'inline-block';
        } else {
            btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            btn.textContent = '📋 Multiselect';
            deleteBtn.style.display = 'none';
            selectionCount.style.display = 'none';
        }
        
        this.render();
    },

    togglePetSelection(index) {
        if (this.selectedPets.has(index)) {
            this.selectedPets.delete(index);
        } else {
            this.selectedPets.add(index);
        }
        
        const selectionCount = document.getElementById('selectionCount');
        selectionCount.textContent = `${this.selectedPets.size} selected`;
        this.render();
    },

    deleteSelectedPets() {
        if (this.selectedPets.size === 0) {
            this.showNotification('No pets selected!', 'error');
            return;
        }
        
        const selectedCount = this.selectedPets.size;
        const refund = Array.from(this.selectedPets).reduce((sum, index) => {
            return sum + this.state.pets[index].cost;
        }, 0);
        
        // Delete pets in reverse order to avoid index shifting
        const indicesToDelete = Array.from(this.selectedPets).sort((a, b) => b - a);
        indicesToDelete.forEach(index => {
            this.state.pets.splice(index, 1);
        });
        
        this.addMoney(refund);
        this.selectedPets.clear();
        this.showNotification(`🗑️ Deleted ${selectedCount} pets! Refunded $${refund}`, 'success');
        
        const selectionCount = document.getElementById('selectionCount');
        selectionCount.textContent = '0 selected';
        
        this.render();
    },

    // Remove sad/old pets
    removeOldPets() {
        const now = Date.now();
        
        this.state.pets = this.state.pets.filter(pet => {
            // Remove pets with 0 happiness
            if (pet.happiness <= 0) {
                return false;
            }
            // Pets lose 5 happiness every 1.5 seconds
            if (now - pet.lastHappinessLoss >= 1500) {
                pet.happiness = Math.max(0, pet.happiness - 5);
                pet.lastHappinessLoss = now;
            }
            return true;
        });
    },

    showNotification(message, type = 'info') {
        const notif = document.getElementById('notification');
        notif.textContent = message;
        notif.className = 'notification show';
        
        if (type === 'success') {
            notif.style.background = '#4caf50';
        } else if (type === 'error') {
            notif.style.background = '#f44336';
        } else if (type === 'levelup') {
            notif.style.background = '#ffc107';
            notif.style.color = '#333';
        }

        setTimeout(() => {
            notif.classList.remove('show');
        }, 2000);
    },

    render() {
        // Update header
        document.getElementById('money').textContent = this.state.money;
        document.getElementById('happiness').textContent = this.state.happiness;
        document.getElementById('level').textContent = this.state.level;
        document.getElementById('rebirths').textContent = this.state.rebirths;
        document.getElementById('rebirthPoints').textContent = this.state.rebirthPoints;
        
        // Update pet button cooldown
        const petBtn = document.querySelector('button[onclick="game.petArrives()"]');
        if (petBtn) {
            const now = Date.now();
            const timeSinceLast = now - this.lastPetTime;
            const remainingCooldown = Math.max(0, this.getEffectiveCooldown() - timeSinceLast);
            
            if (remainingCooldown > 0) {
                const seconds = Math.ceil(remainingCooldown / 1000);
                petBtn.disabled = true;
                petBtn.style.opacity = '0.6';
                petBtn.textContent = `⏱️ Wait ${seconds}s`;
            } else {
                petBtn.disabled = false;
                petBtn.style.opacity = '1';
                petBtn.textContent = '🐕 Attract Pet';
            }
        }

        // Render pets
        this.renderPets();

        // Render store
        this.renderStore();
        
        // Render rebirth section
        this.renderRebirthSection();

        // Render decorations
        this.renderDecorations();

        // Render pet unlocks
        this.renderPetUnlocks();

        // Update statistics
        document.getElementById('totalPets').textContent = this.state.totalPets;
        document.getElementById('drinksServed').textContent = this.state.drinksServed;
        document.getElementById('totalEarned').textContent = this.state.totalEarned;
        document.getElementById('playTime').textContent = Math.floor(this.state.playTime / 1000);
    },

    renderPets() {
        const petsArea = document.getElementById('petsArea');
        petsArea.innerHTML = '';

        if (this.state.pets.length === 0) {
            petsArea.innerHTML = '<p style="color: #999; text-align: center; width: 100%;">No pets yet! Attract one!</p>';
            return;
        }

        this.state.pets.forEach((pet, index) => {
            const petEl = document.createElement('div');
            petEl.className = 'pet' + (this.selectedPets.has(index) ? ' selected' : '');
            petEl.title = `Cost: $${pet.cost}\nIncome: $${pet.incomePerSecond.toFixed(2)}/s\nHappiness: ${pet.happiness}%`;
            petEl.innerHTML = `
                <span class="pet-emoji">${pet.emoji}</span>
                <span class="pet-happiness" title="Happiness">${pet.happiness}%</span>
            `;
            
            if (this.multiSelectMode) {
                petEl.onclick = (e) => {
                    e.stopPropagation();
                    this.togglePetSelection(index);
                };
            } else {
                petEl.onclick = () => this.petClicked(index);
            }
            
            petsArea.appendChild(petEl);
        });
    },

    petClicked(index) {
        const pet = this.state.pets[index];
        pet.happiness = Math.min(100, pet.happiness + 10);
        this.addMoney(5);
        this.showNotification(`${pet.emoji} is happy!`);
        this.render();
    },

    renderStore() {
        const storeGrid = document.getElementById('storeGrid');
        storeGrid.innerHTML = '';

        Object.entries(this.state.upgrades).forEach(([name, upgrade]) => {
            const cost = Math.floor(upgrade.cost * Math.pow(1.25, upgrade.count));
            const canAfford = this.state.money >= cost;
            
            const item = document.createElement('div');
            item.className = `store-item ${canAfford ? 'affordable' : 'not-affordable'}`;
            item.innerHTML = `
                <h3>${this.getUpgradeEmoji(name)}</h3>
                <p>${upgrade.effect}</p>
                <p class="price">$${cost}</p>
                <span class="count">Lvl ${upgrade.count}</span>
                <button class="buy-btn" onclick="game.buyUpgrade('${name}')" ${!canAfford ? 'disabled' : ''}>Buy</button>
            `;
            storeGrid.appendChild(item);
        });
    },

    renderDecorations() {
        const decorGrid = document.getElementById('decorGrid');
        decorGrid.innerHTML = '';

        Object.entries(this.state.decorations).forEach(([name, decor]) => {
            const cost = Math.floor(decor.cost * Math.pow(1.1, decor.count));
            const canAfford = this.state.money >= cost;
            
            const item = document.createElement('div');
            item.className = `decor-item ${canAfford ? 'affordable' : 'not-affordable'}`;
            item.innerHTML = `
                <h3>${this.getDecorEmoji(name)}</h3>
                <p>${name}</p>
                <p class="price">$${cost}</p>
                <span class="count">${decor.count}x</span>
                <button class="buy-btn" onclick="game.buyDecoration('${name}')" ${!canAfford ? 'disabled' : ''}>Buy</button>
            `;
            decorGrid.appendChild(item);
        });
    },
    
    renderRebirthSection() {
        const rebirthSection = document.getElementById('rebirthSection');
        if (!rebirthSection) return;
        
        rebirthSection.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h3>🔄 Rebirths: ${this.state.rebirths}</h3>
                <h3>✨ Rebirth Points: ${this.state.rebirthPoints}</h3>
                <button class="btn btn-primary" onclick="game.rebirth()" style="margin-top: 10px;">🔄 Rebirth Now</button>
            </div>
            <div id="rebirthUpgradesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px;"></div>
        `;
        
        const upgradesGrid = document.getElementById('rebirthUpgradesGrid');
        
        Object.entries(this.state.rebirthUpgrades).forEach(([name, upgrade]) => {
            const canAfford = this.state.rebirthPoints >= upgrade.cost;
            
            const item = document.createElement('div');
            item.className = `store-item ${canAfford ? 'affordable' : 'not-affordable'}`;
            item.innerHTML = `
                <h3>✨</h3>
                <p>${upgrade.effect}</p>
                <p class="price">${upgrade.cost} pts</p>
                <span class="count">Lvl ${upgrade.level}</span>
                <button class="buy-btn" onclick="game.buyRebirthUpgrade('${name}')" ${!canAfford ? 'disabled' : ''}>Buy</button>
            `;
            upgradesGrid.appendChild(item);
        });
    },

    renderPetUnlocks() {
        const grid = document.getElementById('petsShopGrid');
        grid.innerHTML = '';

        Object.entries(this.state.petUnlocks).forEach(([name, petUnlock]) => {
            const canAfford = this.state.money >= petUnlock.cost;
            const isUnlocked = petUnlock.unlocked;
            
            const item = document.createElement('div');
            item.className = `pet-item ${isUnlocked ? 'unlocked' : ''} ${canAfford ? 'affordable' : 'not-affordable'}`;
            item.innerHTML = `
                <h3>${petUnlock.emoji}</h3>
                <p>${name}</p>
                <p class="price">$${petUnlock.cost}</p>
                <button class="buy-btn" onclick="game.unlockPet('${name}')" ${isUnlocked || !canAfford ? 'disabled' : ''}>
                    ${isUnlocked ? '✓ Unlocked' : 'Unlock'}
                </button>
            `;
            grid.appendChild(item);
        });
    },

    getUpgradeEmoji(name) {
        const emojis = {
            cooldownReduction1: '⏱️',
            cooldownReduction2: '⏱️',
            incomeBoost: '💰',
            happinessBoost: '😊',
            moneyBoost: '💵',
            petPriceDown: '🏷️'
        };
        return emojis[name] || '✨';
    },

    getDecorEmoji(name) {
        const emojis = {
            lights: '💡',
            plants: '🌿',
            furniture: '🛋️',
            paintings: '🖼️',
            fountain: '⛲',
            chandelier: '🕯️'
        };
        return emojis[name] || '✨';
    },

    startAutoTick() {
        setInterval(() => {
            this.state.playTime += 1000; // 1 second
            this.removeOldPets();
            
            // Auto-generate income from pets based on their cost
            if (this.state.pets.length > 0) {
                // Apply rebirth income bonus
                const incomeBonus = 1 + (this.state.rebirthUpgrades.incomeMultiplier.level * 0.05);
                // Apply income boost upgrade
                const upgradeBonus = 1 + (this.state.upgrades.incomeBoost.count * 0.2);
                
                const totalIncome = this.state.pets.reduce((sum, pet) => {
                    return sum + (pet.incomePerSecond * incomeBonus * upgradeBonus);
                }, 0);
                this.addMoney(Math.floor(totalIncome));
            }
            
            // Happiness degrades slowly
            if (this.state.happiness > 30) {
                this.state.happiness = Math.max(30, this.state.happiness - 0.1);
            }
            
            // Update cooldown display
            this.updateCooldownDisplay();
            this.render();
        }, 1000);
    },
    
    updateCooldownDisplay() {
        const petBtn = document.querySelector('button[onclick="game.petArrives()"]');
        if (petBtn) {
            const now = Date.now();
            const timeSinceLast = now - this.lastPetTime;
            const remainingCooldown = Math.max(0, this.petCooldown - timeSinceLast);
            
            if (remainingCooldown > 0) {
                const seconds = Math.ceil(remainingCooldown / 1000);
                petBtn.disabled = true;
                petBtn.style.opacity = '0.6';
                petBtn.textContent = `⏱️ Wait ${seconds}s`;
            } else {
                petBtn.disabled = false;
                petBtn.style.opacity = '1';
                petBtn.textContent = '🐕 Attract Pet';
            }
        }
    },

    saveGame() {
        localStorage.setItem('petCafeGame', JSON.stringify(this.state));
        this.showNotification('💾 Game saved!');
    },

    loadGame() {
        const saved = localStorage.getItem('petCafeGame');
        if (saved) {
            this.state = JSON.parse(saved);
            this.showNotification('📂 Game loaded!');
        }
    },

    resetGame() {
        if (confirm('Are you sure? This will reset all progress!')) {
            localStorage.removeItem('petCafeGame');
            location.reload();
        }
    }
};

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    game.init();
});
