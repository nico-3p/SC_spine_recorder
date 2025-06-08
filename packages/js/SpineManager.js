class SpineManager {
    constructor(parent, canvas) {
        this.parent = parent;
        this.canvas = canvas;

        this._x = 0;
        this._y = 0;
        this._scale = 100;

        this.baseURL = `https://${atob('Y2Ytc3RhdGljLnNoaW55Y29sb3JzLm1vZQ==')}/spine/`;

        this.init();
    }

    // ----

    init() {
        this.app = new PIXI.Application({
            view: this.parent.canvasManager.canvas,
            width: this.parent.canvasManager.canvasWidth,
            height: this.parent.canvasManager.canvasHeight,
            antialias: true,
            transparent: true,
            backgroundAlpha: 0,
        });

        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);
    }

    resizeCanvas() {
        this.app.renderer.resize(this.parent.canvasManager.canvasWidth, this.parent.canvasManager.canvasHeight);

        this.initPos();
        this.setPos();
        this.setScale();
    }

    // ----

    async loadModel(modelPath) {
        await new Promise((resolve, reject) => {
            this.destroySpine();

            this.app.loader.reset();
            this.app.loader.add('model', modelPath).load(async (loader, res) => {
                try {
                    await this._onAssetsLoaded(loader, res);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    async changeModel(dressData, typeName) {
        const dressId = dressData.enzaId;

        let modelPath;
        if (dressData.dressType == 'S_UR') {
            modelPath = `support_idols/picture_motion/${dressId}/data.json`;
        } else if (dressData?.path) {
            modelPath = `sub_characters/${typeName}/${dressData.path}`;
        } else {
            modelPath = `idols/${typeName}/${dressId}/data.json`;
        }

        await this.loadModel(this.baseURL + modelPath);

        this.setPos();
        this.setScale();
    }

    destroySpine() {
        if (this.spine) {
            this.spine.state.removeListener(this.onComplete);
            this.spine.state.clearListeners();
            this.app.stage.removeChild(this.spine);
            this.spine.destroy({
                children: true,
                texture: true,
                baseTexture: true,
            });
            this.spine = null;
        }

        const texId = 'model_atlas_page_data.png';

        // Texture 削除
        const texture = PIXI.utils.TextureCache[texId];
        if (texture) {
            texture.destroy(true);
            delete PIXI.utils.TextureCache[texId];
        }

        // BaseTexture 削除
        const baseTexture = PIXI.utils.BaseTextureCache[texId];
        if (baseTexture) {
            baseTexture.destroy(true);
            delete PIXI.utils.BaseTextureCache[texId];
        }
    }

    // ----

    initPos() {
        const bounds = this.spine.getLocalBounds();

        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;

        this.container.pivot.set(centerX, centerY);
    }

    setPos(x, y) {
        if (x !== undefined) {
            this._x = Number(x);
        }
        if (y !== undefined) {
            this._y = Number(y);
        }

        this.container.position.set(this._x + this.app.view.width / 2, this._y + this.app.view.height / 2);
    }

    setScale(scale) {
        if (scale !== undefined) {
            this._scale = Number(scale);
        }

        this.container.scale.set(this._scale);
        this.setPos();
    }

    // ----

    async _onAssetsLoaded(loader, res) {
        this.spine = new PIXI.spine.Spine(res.model.spineData);
        this.container.addChild(this.spine);

        try {
            this.spine.skeleton.setSkinByName('normal');
        } catch (e) {
            this.spine.skeleton.setSkinByName('default');
        }

        const defaultAnimation = 'wait';
        this.spine.state.setAnimation(0, defaultAnimation, true);

        this.initPos();

        this.spine.state.addListener({
            complete: this.onComplete,
        });

        this.parent.animationManager.setSpine(this.spine);

        // イベント作成
        window.dispatchEvent(
            new CustomEvent('spineLoaded', {
                detail: {
                    spine: this.spine,
                },
            })
        );
    }

    onComplete = (entry) => {
        window.dispatchEvent(
            new CustomEvent('animationComplete', {
                detail: {
                    spine: this.spine,
                    entry: entry,
                },
            })
        );
    };
}

export default SpineManager;
