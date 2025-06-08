class UiManager {
    constructor(parent) {
        this.parent = parent;

        this.modelBaseURL = ``;
    }

    async init() {
        // input-canvas-width
        this.inputCanvasWidth = document.querySelector('#input-canvas-width');
        this.inputCanvasWidth.addEventListener('input', this.changeCanvasSize);
        this.inputCanvasWidth.addEventListener('wheel', this.onNumMouseWheel);

        // input-canvas-height
        this.inputCanvasHeight = document.querySelector('#input-canvas-height');
        this.inputCanvasHeight.addEventListener('input', this.changeCanvasSize);
        this.inputCanvasHeight.addEventListener('wheel', this.onNumMouseWheel);

        // ----

        // idol-select
        this.idolSelect = document.querySelector('#idol-select');

        const idolList = await this.parent.database.idolList();
        this.idolSelectOptions = idolList.map((v) => v.idolName);

        this.idolSelect.innerHTML = this._createSelectHTML(this.idolSelectOptions);
        this.idolSelect.addEventListener('change', this.onIdolSelectChange);

        // dress-select
        this.dressSelect = document.querySelector('#dress-select');
        this.setDressesSelect();
        this.dressSelect.addEventListener('change', this.onDressesSelectChange);

        //type-select
        this.typeSelect = document.querySelector('#type-select');
        this.setTypeSelect();
        this.typeSelect.addEventListener('change', this.onTypeSelectChange);

        // ----

        // input-x
        this.inputX = document.querySelector('#input-x');
        this.inputX.addEventListener('input', this.setPos);
        this.inputX.addEventListener('wheel', this.onNumMouseWheel);

        // input-y
        this.inputY = document.querySelector('#input-y');
        this.inputY.addEventListener('input', this.setPos);
        this.inputY.addEventListener('wheel', this.onNumMouseWheel);

        // input-scale
        this.inputScale = document.querySelector('#input-scale');
        this.inputScale.addEventListener('input', this.setScale);
        this.inputScale.addEventListener('wheel', this.onNumMouseWheel);

        // ----

        // anim-select
        this.animSelect = document.querySelector('#anim-select');

        // input-anim-track
        this.animAnimTrack = document.querySelector('#input-anim-track');
        this.animAnimTrack.addEventListener('wheel', this.onNumMouseWheel);

        // anim-play-button
        this.animPlayButton = document.querySelector('#anim-play-button');
        this.animPlayButton.addEventListener('click', this.onClickPlay);

        // anim-clear-button
        this.animClearButton = document.querySelector('#anim-clear-button');
        this.animClearButton.addEventListener('click', this.onClickClear);

        // ----

        // anim-command-textarea
        this.animCommandTextarea = document.querySelector('#anim-command-textarea');
        this.initAnimCommandTextarea();

        // anim-command-play-button
        this.animCommandPlayButton = document.querySelector('#anim-command-play-button');
        this.animCommandPlayButton.addEventListener('click', this.playAnimCommand);

        // ----

        // input-animationMixDuration
        this.inputAnimationMixDuration = document.querySelector('#input-animationMixDuration');
        this.inputAnimationMixDuration.addEventListener('input', this.setAnimationDurationParameters);
        this.inputAnimationMixDuration.addEventListener('wheel', this.onNumMouseWheel);

        // input-relayDuration
        this.inputRelayDuration = document.querySelector('#input-relayDuration');
        this.inputRelayDuration.addEventListener('input', this.setAnimationDurationParameters);
        this.inputRelayDuration.addEventListener('wheel', this.onNumMouseWheel);

        // input-relayMixDuration_in
        this.inputRelayMixDuration_in = document.querySelector('#input-relayMixDuration_in');
        this.inputRelayMixDuration_in.addEventListener('input', this.setAnimationDurationParameters);
        this.inputRelayMixDuration_in.addEventListener('wheel', this.onNumMouseWheel);

        // inut-relayMixDuration_out
        this.inputRelayMixDuration_out = document.querySelector('#input-relayMixDuration_out');
        this.inputRelayMixDuration_out.addEventListener('input', this.setAnimationDurationParameters);
        this.inputRelayMixDuration_out.addEventListener('wheel', this.onNumMouseWheel);

        // ----

        // start-record-button
        this.startRecordButton = document.querySelector('#start-record-button');
        this.startRecordButton.addEventListener('click', this.startRecord);

        // start-record-button
        this.stopRecordButton = document.querySelector('#stop-record-button');
        this.stopRecordButton.addEventListener('click', this.stopRecord);

        // ----

        // input-animation-speed
        this.inputAnimationSpeed = document.querySelector('#input-animation-speed');
        this.inputAnimationSpeed.addEventListener('input', this.setAnimationSpeed);
        this.inputAnimationSpeed.addEventListener('wheel', this.onNumMouseWheel);

        // input-record-fps
        this.inputRecordFps = document.querySelector('#input-record-fps');
        this.inputRecordFps.addEventListener('input', this.setRecordFps);
        this.inputRecordFps.addEventListener('wheel', this.onNumMouseWheel);

        this.setPos();
        this.setScale();
    }

    // -- elements --

    async setDressesSelect(idolIdx = 0) {
        const dressList = await this.parent.database.dressList(idolIdx);
        this.dressSelectOptions = dressList.map((v) => [v.dressType, v.dressName]);

        this.dressSelect.innerHTML = this._createSelectHTML(this.dressSelectOptions);

        this.dressSelect.dispatchEvent(new Event('change'));
    }

    async setTypeSelect(idolIdx = 0, dressIdx = 0) {
        const dressData = await this.parent.database.dressList(idolIdx);

        this.TypeSelectOptions = [];
        if (dressData[dressIdx]?.big_Cloth0) this.TypeSelectOptions.push('通常 大');
        if (dressData[dressIdx]?.big_Cloth1) this.TypeSelectOptions.push('演出 大');
        if (dressData[dressIdx]?.sml_Cloth0) this.TypeSelectOptions.push('通常 小');
        if (dressData[dressIdx]?.sml_Cloth1) this.TypeSelectOptions.push('演出 小');

        this.typeSelect.innerHTML = this._createSelectHTML(this.TypeSelectOptions);

        this.typeSelect.dispatchEvent(new Event('change'));
    }

    async setAnimSelect() {
        this.animSelectOptions = this.parent.animationManager.animationList.map((v) => v.name);
        this.animSelect.innerHTML = this._createSelectHTML(this.animSelectOptions);

        const nowAnimation = this.parent.spineManager.spine.state.tracks[0]?.animation?.name;

        this.animSelect.value = nowAnimation;
    }

    initAnimCommandTextarea() {
        this.animCommandTextarea.value = `# ここにアニメーションの再生指示を書くと
# その流れに沿ったアニメーションが再生される

# 「#」以降はコメントとなり無視される

# 「anim トラック番号 アニメーション名」
# と書くとアニメーションが再生される
anim 0 anger1
anim 1 face_shy
anim 2 lip_sad

# トラックとは
# 各アニメーションを重ねるレイヤーの様なもの

# 「wait ミリ秒」でその時間待つ
wait 2000

anim 2 lip_sad_s # 口パクを止める

wait 2000

# 「clear トラック番号」で
# そのトラックのアニメーションを停止
clear 1
clear 2

# 「relay トラック番号」で
# 腕下げなどの繋ぎアニメーションを流す
relay 0

anim 0 wait

# 最後もwaitを指定しないと
# すぐに再生終了してしまう点に注意
wait 4000


# ↓ の「Play Command」ボタン押下で再生
`;

        CodeMirror.defineMode('animScript', function () {
            return {
                startOfLine: true,
                token: function (stream, state) {
                    if (stream.sol()) {
                        state.startOfLine = true;
                    }

                    // 行途中に # があったらコメント化
                    if (stream.peek() === '#') {
                        stream.skipToEnd();
                        return 'comment';
                    }

                    if (state.startOfLine) {
                        // 行頭の空白を飛ばす
                        stream.eatSpace();

                        if (stream.match('#')) {
                            // 行頭 # ならコメント行
                            stream.skipToEnd();
                            state.startOfLine = true;
                            return 'comment';
                        }

                        if (stream.match('anim') || stream.match('wait') || stream.match('clear') || stream.match('relay')) {
                            state.startOfLine = false;
                            return 'keyword';
                        }

                        state.startOfLine = false;
                    }

                    // 行頭キーワード以外は普通の単語・数字扱いにする
                    if (stream.match(/^\d+/)) return 'number';

                    if (stream.match(/^[a-zA-Z_][\w-]*/)) return 'variable';

                    stream.next();
                    return null;
                },
                startState: function () {
                    return { startOfLine: true };
                },
            };
        });

        this.editorCodeMirror = CodeMirror.fromTextArea(document.getElementById('anim-command-textarea'), {
            mode: 'animScript',
            lineNumbers: true,
            theme: 'default',
        });
    }

    // -- send --

    changeCanvasSize = () => {
        if (this.parent.canvasManager.canvasWidth != this.inputCanvasWidth.value) {
            this.parent.canvasManager.canvasWidth = this.inputCanvasWidth.value;
        }

        if (this.parent.canvasManager.canvasHeight != this.inputCanvasHeight.value) {
            this.parent.canvasManager.canvasHeight = this.inputCanvasHeight.value;
        }
    };

    TYPE_NAMES = {
        '通常 大': 'stand',
        '演出 大': 'stand_costume',
        '通常 小': 'cb',
        '演出 小': 'cb_costume',
    };
    nowDress = '';
    async changeIdol() {
        const dressList = await this.parent.database.dressList(this.idolSelect.selectedIndex);
        const dressData = dressList[this.dressSelect.selectedIndex];

        const nowDress = JSON.stringify(dressData) + this.typeSelect.value;
        if (nowDress === this.nowDress) return;

        this.nowDress = nowDress;

        await this.parent.spineManager.changeModel(dressData, this.TYPE_NAMES[this.typeSelect.value]);

        this.onModelLoad();
    }

    setPos = () => {
        const x = this.inputX.value;
        const y = this.inputY.value;
        this.parent.spineManager.setPos(x, y);
    };

    setScale = () => {
        const scale = this.inputScale.value;
        this.parent.spineManager.setScale(scale);
    };

    playAnimCommand = async (e) => {
        const scriptText = this.editorCodeMirror.getValue();
        const scriptLines = scriptText
            .split(/\r?\n/)
            .map((line, index) => ({ text: line.trim(), originalLineIndex: index }))
            .filter((lineObj) => lineObj.text && !lineObj.text.startsWith('#'));

        await app.animationManager.runScript(scriptLines);
    };

    setAnimationSpeed = (e) => {
        this.parent.animationManager.animationSpeed = Number(this.inputAnimationSpeed.value);
    };

    startRecord = (e) => {
        this.parent.canvasManager.startRecord();
    };

    stopRecord = (e) => {
        this.parent.canvasManager.stopRecord();
    };

    setRecordFps = (e) => {
        this.parent.canvasManager.recordFps = Number(this.inputRecordFps.value);
    };

    setAnimationDurationParameters = (e) => {
        this.parent.animationManager.animationMixDuration = Number(this.inputAnimationMixDuration.value);
        this.parent.animationManager.relayDuration = Number(this.inputRelayDuration.value);
        this.parent.animationManager.relayMixDuration_in = Number(this.inputRelayMixDuration_in.value);
        this.parent.animationManager.relayMixDuration_out = Number(this.inputRelayMixDuration_out.value);
    };

    // -- events --

    onIdolSelectChange = async (e) => {
        await this.setDressesSelect(this.idolSelect.selectedIndex);
        await this.setTypeSelect(this.idolSelect.selectedIndex, this.dressSelect.selectedIndex);

        this.changeIdol();
    };

    onDressesSelectChange = async (e) => {
        await this.setTypeSelect(this.idolSelect.selectedIndex, this.dressSelect.selectedIndex);

        this.changeIdol();
    };

    onTypeSelectChange = async (e) => {
        this.changeIdol();
    };

    onNumMouseWheel = (e) => {
        e.preventDefault();

        const baseStep = parseFloat(e.target.step) || 1;
        const step = e.shiftKey ? baseStep * 10 : baseStep;

        const min = e.target.min !== '' ? parseFloat(e.target.min) : -Infinity;
        const max = e.target.max !== '' ? parseFloat(e.target.max) : Infinity;
        let value = parseFloat(e.target.value) || 0;

        value += e.deltaY < 0 ? step : -step;

        value = Math.round(value * 1e6) / 1e6;

        value = Math.min(Math.max(value, min), max);

        e.target.value = value;
        e.target.dispatchEvent(new Event('input'));
    };

    onClickPlay = (e) => {
        const animName = this.animSelect.value;
        const trackIndex = this.animAnimTrack.value;

        if (!animName) return;

        this.parent.animationManager.playAnimation(animName, trackIndex);
    };

    onClickClear = (e) => {
        this.parent.animationManager.fadeoutAnimation(null, 0);
        this.parent.animationManager.scriptAnimationId = null;
    };

    onModelLoad = async () => {
        this.setAnimSelect();
    };

    // -- tools --

    _createSelectHTML(data) {
        let html = '';

        // 一次配列の場合、グループ無し
        if (this._isOneDimensionalArray(data)) {
            for (const option of data) {
                html += `<option value="${option}">${option}</option>`;
            }
        } else {
            const optgroups = {};
            for (const [key, name] of data) {
                if (!optgroups[key]) optgroups[key] = [];
                optgroups[key].push(name);
            }

            for (let key in optgroups) {
                html += `<optgroup label="${key}">`;

                for (const option of optgroups[key]) {
                    html += `<option value="${option}">${option}</option>`;
                }

                html += `</optgroup>`;
            }
        }

        return html;
    }

    _isOneDimensionalArray(arr) {
        if (!Array.isArray(arr)) {
            return false; // 配列でない場合はfalseを返す
        }

        for (let i = 0; i < arr.length; i++) {
            if (Array.isArray(arr[i])) {
                return false; // 要素が配列の場合、二次配列と判断しfalseを返す
            }
        }
        return true; // 全ての要素が一次要素の場合、一次配列と判断しtrueを返す
    }
}
export default UiManager;
