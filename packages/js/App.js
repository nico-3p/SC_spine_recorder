import { install } from 'https://cdn.jsdelivr.net/npm/@pixi/unsafe-eval@5.3.12/+esm';
install(window.PIXI);

import Database from './Database.js';
import CanvasManager from './CanvasManager.js';
import SpineManager from './SpineManager.js';
import UiManager from './UiManager.js';
import AnimationManager from './AnimationManager.js';

class App {
    constructor() {}

    async init() {
        this.database = new Database(this);
        this.canvasManager = new CanvasManager(this, document.getElementById('scspine-canvas'));
        this.spineManager = new SpineManager(this, document.getElementById('scspine-canvas'));
        this.uiManager = new UiManager(this);
        this.animationManager = new AnimationManager(this);

        await this.uiManager.init();
    }
}

export default App;
