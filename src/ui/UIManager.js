export class UIManager {
    constructor() {
        this.menuScreen = document.getElementById('menu-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.uiLayer = document.getElementById('ui-layer');
        this.healthBar = document.getElementById('health-bar');
        this.pranaBar = document.getElementById('prana-bar');
        this.levelDisplay = document.getElementById('level-display');
        this.coinDisplay = document.getElementById('coin-display');
        this.flashOverlay = document.getElementById('flash-overlay');
        this.finalScore = document.getElementById('final-score');
    }
    
    init(game) {
        document.getElementById('start-btn').addEventListener('click', () => game.start());
        document.getElementById('restart-btn').addEventListener('click', () => game.start());
    }
    
    showGame() {
        this.menuScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.uiLayer.classList.remove('hidden');
    }
    
    showGameOver(level) {
        this.uiLayer.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        this.finalScore.innerText = `You survived until Wave ${level}`;
    }
    
    updateHUD(game) {
        this.healthBar.style.width = Math.max(0, (game.player.health/game.player.maxHealth)*100) + '%';
        this.pranaBar.style.width = Math.max(0, (game.player.prana/game.player.maxPrana)*100) + '%';
        this.levelDisplay.innerText = 'Wave ' + game.levelManager.currentLevel + (game.levelManager.desperationTriggered ? ' [DESPERATION]' : '');
        this.coinDisplay.innerText = 'Souls: ' + game.levelManager.coinsCollected + ' / ' + game.levelManager.coinsNeeded;
    }
    
    updateDial(formId) {
        document.querySelectorAll('.dial-option').forEach(el => el.classList.remove('active'));
        document.getElementById('avatar-' + formId).classList.add('active');
    }
    
    flash() {
        this.flashOverlay.style.opacity = '1';
        setTimeout(() => this.flashOverlay.style.opacity = '0', 50);
    }
}
