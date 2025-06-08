class CanvasManager {
    constructor(parent, canvas) {
        this.parent = parent;
        this.canvas = canvas;

        this._canvasWidth = 1920;
        this._canvasHeight = 1920;

        this.canvas.style.backgroundColor = 'transparent';

        this.recordFps = 60;
        this.userBitrate = null;

        this.recorder = null;
        this.chunks = [];
    }

    // ----

    get canvasWidth() {
        return this._canvasWidth;
    }
    set canvasWidth(w) {
        this._canvasWidth = w;
        this.parent.spineManager.resizeCanvas();
    }

    get canvasHeight() {
        return this._canvasHeight;
    }
    set canvasHeight(h) {
        this._canvasHeight = h;
        this.parent.spineManager.resizeCanvas();
    }

    // ----

    startRecord() {
        if (this.isRecording()) {
            return;
        }

        const stream = this.canvas.captureStream(this.recordFps);

        const width = this.canvas.width;
        const height = this.canvas.height;
        const fps = this.recordFps;

        const bitrate = this.userBitrate ?? this.calculateBitrate(width, height, fps);

        this.recorder = new MediaRecorder(stream, {
            mimeType: 'video/webm; codecs=vp9',
            videoBitsPerSecond: bitrate,
        });

        this.chunks = [];

        this.recorder.ondataavailable = (e) => {
            if (e.data.size > 0) this.chunks.push(e.data);
        };

        this.recorder.onstop = async () => {
            const blob = new Blob(this.chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'record.webm';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        };

        this.recorder.start();

        document.body.classList.add('recording');

        console.log('録画開始');
        console.log('bitrate', bitrate);
    }

    stopRecord() {
        if (this.isRecording()) {
            this.recorder.stop();
            this.recorder = null;
            this.chunks = [];

            document.body.classList.remove('recording');

            console.log('録画停止');
        }
    }

    calculateBitrate(width, height, fps) {
        const pixelCount = width * height;

        const basePixels = 1920 * 1080;
        const baseFps = 30;
        const baseBitrate = 10_000_000;

        // 解像度とfpsに応じてスケーリング
        let scale = (pixelCount / basePixels) * (fps / baseFps);

        // 透過あり映像のため1.5倍に増やす
        scale *= 1.5;

        // 最小 2 Mbps、最大 50 Mbps に制限
        return Math.min(Math.max(baseBitrate * scale, 2_000_000), 50_000_000);
    }

    isRecording() {
        return this.recorder && this.recorder.state === 'recording';
    }
}

export default CanvasManager;
