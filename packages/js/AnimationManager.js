class AnimationManager {
    constructor(parent) {
        this.parent = parent;

        this.spine = null;
        this.animationList = null;

        this._animationSpeed = 1;

        this.animationMixDuration = 0.7;
        this.relayDuration = 0.5;
        this.relayMixDuration_in = 0.4;
        this.relayMixDuration_out = 0.5;

        this._onAnimationComplete = this.onAnimationComplete.bind(this);
        window.addEventListener('animationComplete', this._onAnimationComplete);
    }

    get animationSpeed() {
        return this._animationSpeed;
    }
    set animationSpeed(animationSpeed) {
        this._animationSpeed = animationSpeed;

        if (this.spine) {
            this.spine.state.timeScale = this._animationSpeed;
        }
    }

    destroy() {
        window.removeEventListener('animationComplete', this._onAnimationComplete);
    }

    // ----

    setSpine(spine) {
        this.spine = spine;
        this.spine.state.timeScale = this._animationSpeed;

        this.animationList = spine.spineData.animations;

        this.scriptAnimationId = null;
    }

    // ----

    /**
     * 指定したアニメーションを再生する
     * @param {string} name - アニメーション名
     * @param {number} [trackIndex=0] - トラック番号
     * @param {boolean} [loop=false] - ループ再生するか
     * @param {number} [delay=0] - 遅延時間（秒）
     */
    playAnimation(name, trackIndex = 0, loop = false, delay = 0) {
        if (!this.spine || !this.spine.state) return;

        const animation = this.spine.spineData.findAnimation(name);
        if (!animation) {
            console.warn(`Animation "${name}" not found`);
            return;
        }

        this.spine.state.setAnimation(trackIndex, name, loop).delay = delay;
    }

    /**
     * アニメーションをキューに追加（前の再生が終わってから実行）
     * @param {string} name - アニメーション名
     * @param {number} [trackIndex=0] - トラック番号
     * @param {boolean} [loop=false] - ループ再生するか
     * @param {number} [delay=0] - 遅延時間（秒）
     */
    queueAnimation(name, trackIndex = 0, loop = false, delay = 0) {
        if (!this.spine || !this.spine.state) return;

        const animation = this.spine.spineData.findAnimation(name);
        if (!animation) {
            console.warn(`Animation "${name}" not found`);
            return;
        }

        this.spine.state.addAnimation(trackIndex, name, loop, delay);
    }

    clearAnimation(track = null) {
        this.spine.state.clearTracks(track);
    }

    fadeoutAnimation(track = null, fadeDuration = 0.3) {
        if (Number.isInteger(track)) {
            this.spine.state.setEmptyAnimation(track, fadeDuration);
        } else {
            for (let i = 0; i < this.spine.state.tracks.length; i++) {
                if (this.spine.state.tracks[i]) {
                    this.spine.state.setEmptyAnimation(i, fadeDuration);
                }
            }
        }
    }

    setUpAnimationMixes(scriptLines, mixDuration = 0.7) {
        const trackToLastAnim = {};
        const transitions = new Set();

        for (const line of scriptLines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('anim')) continue;

            const [, trackStr, name] = trimmed.split(' ');
            const trackIndex = parseInt(trackStr, 10);

            const lastAnim = trackToLastAnim[trackIndex];
            if (lastAnim && lastAnim !== name) {
                const key = `${lastAnim}>>${name}`;
                transitions.add(key);
            }
            trackToLastAnim[trackIndex] = name;
        }

        // 各アニメーションペアに setMix を設定
        for (const key of transitions) {
            const [from, to] = key.split('>>');
            this.spine.stateData.setMix(from, to, mixDuration);
        }
    }

    setupScript(scriptLines) {
        const commands = [];
        for (const line of scriptLines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            // wait
            if (trimmed.startsWith('wait')) {
                const parts = trimmed.split(' ');
                const duration = parseInt(parts[1], 10);

                commands.push({ type: 'wait', duration: duration });
            }
            // anim
            else if (trimmed.startsWith('anim')) {
                const parts = trimmed.split(' ');
                const trackIndex = parseInt(parts[1], 10);
                const animName = parts[2];

                commands.push({
                    type: 'anim',
                    trackIndex: trackIndex,
                    name: animName,
                });
            }
            // clear
            else if (trimmed.startsWith('clear')) {
                const parts = trimmed.split(' ');
                const trackIndex = parseInt(parts[1], 10);

                commands.push({
                    type: 'clear',
                    trackIndex: trackIndex,
                });
            }
            // relay
            else if (trimmed.startsWith('relay')) {
                const parts = trimmed.split(' ');
                const trackIndex = parseInt(parts[1], 10);

                commands.push({
                    type: 'relay',
                    trackIndex: trackIndex,
                });
            }
        }

        return commands;
    }

    scriptAnimationId = null;
    async runScript(scriptOptions) {
        try {
            const currentScriptAnimationId = Date.now();
            this.scriptAnimationId = currentScriptAnimationId;

            const scriptLines = scriptOptions.map((v) => v.text);
            const originalLineIndexList = scriptOptions.map((v) => v.originalLineIndex);

            this.fadeoutAnimation(null, 0);
            // this.setUpAnimationMixes(scriptLines, this.animationMixDuration);

            const commands = this.setupScript(scriptLines);
            // console.log(commands);

            const relayAnimations = [];
            let relayDduration = 0;
            for (let i = 0; i < commands.length; i++) {
                if (currentScriptAnimationId !== this.scriptAnimationId) {
                    console.log('script animation stop', currentScriptAnimationId);
                    return;
                }

                const command = commands[i];

                // wait
                if (command.type === 'wait') {
                    const duration = command.duration - relayDduration;
                    relayDduration = 0;

                    await new Promise((resolve) => setTimeout(resolve, duration / this._animationSpeed));
                }
                // anim
                else if (command.type === 'anim') {
                    const nowAnimation = this.spine.state.tracks[command.trackIndex]?.animation?.name;

                    if (nowAnimation && nowAnimation != '<empty>') {
                        this.spine.stateData.setMix(nowAnimation, command.name, this.animationMixDuration);
                    }

                    if (relayAnimations[command.trackIndex]) {
                        this.spine.stateData.setMix(relayAnimations[command.trackIndex], command.name, this.relayMixDuration_out);
                        relayAnimations[command.trackIndex] = null;
                    }

                    this.spine.state.setAnimation(command.trackIndex, command.name, false);
                }
                // clear
                else if (command.type === 'clear') {
                    this.fadeoutAnimation(command.trackIndex);
                }
                // relay
                else if (command.type === 'relay') {
                    const relayAnimation = await this.playRelayAnimation(command.trackIndex);

                    relayAnimations[command.trackIndex] = relayAnimation;
                    relayDduration = this.relayDuration * 1000;
                }

                if (currentScriptAnimationId !== this.scriptAnimationId) {
                    console.log('script animation stop', currentScriptAnimationId);
                    return;
                }
            }

            this.fadeoutAnimation(null, 0);

            return true;
        } catch (error) {
            alert(error.message);
        }
    }

    // ----

    getRelayAnimation(spine, animationName) {
        const animation = spine.spineData.findAnimation(animationName);

        if (!animation) return null;

        for (const event of animation.timelines.find((t) => t.events)?.events || []) {
            if (event.data.name === 'relay') {
                return event.stringValue;
            }
        }

        return null;
    }

    async playRelayAnimation(trackIndex) {
        const nowAnimation = this.spine.state.tracks[trackIndex]?.animation?.name;
        const relayAnimation = this.getRelayAnimation(this.spine, nowAnimation);

        if (relayAnimation == null) return;

        this.spine.stateData.setMix(nowAnimation, relayAnimation, this.relayMixDuration_in);

        this.spine.state.setAnimation(trackIndex, relayAnimation, false);

        await new Promise((resolve) => setTimeout(resolve, (this.relayDuration * 1000) / this._animationSpeed));

        return relayAnimation;
    }

    // ----

    getLoopStartTime(spine, animationName, eventName = 'loop_start') {
        const animation = spine.spineData.findAnimation(animationName);
        if (!animation) return 0;

        for (const event of animation.timelines.find((t) => t.events)?.events || []) {
            if (event.data.name === eventName) {
                return event.time;
            }
        }

        return 0;
    }

    // ----

    onAnimationComplete(e) {
        const spine = e.detail.spine;
        const entry = e.detail.entry;

        const nowAnimation = spine.state.tracks[entry.trackIndex]?.animation?.name;

        if (nowAnimation == '<empty>') return;

        const minLoopAnimationDuration = 1;
        if (spine.spineData.findAnimation(nowAnimation).duration <= minLoopAnimationDuration) return;

        const loopStartTime = this.getLoopStartTime(spine, nowAnimation, 'loop_start');

        spine.state.tracks[entry.trackIndex].trackTime = loopStartTime;
        // console.log(`loopStartTime: ${loopStartTime} animationName: ${nowAnimation}`);
    }
}

export default AnimationManager;
