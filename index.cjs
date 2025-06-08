const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

let win;
const createWindow = () => {
    win = new BrowserWindow({
        width: 1200,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'packages/js/preload.cjs'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        },
    });
    // win.webContents.openDevTools();

    win.loadFile('packages/index.html');
};

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('save-webm-buffer', async (event, buffer) => {
    const tempWebmPath = path.join(__dirname, 'temp-recording.webm');

    try {
        fs.writeFileSync(tempWebmPath, buffer);
    } catch (err) {
        console.error('WebM一時ファイルの保存に失敗:', err);
        return;
    }

    // 保存先をユーザーに選ばせる
    const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Save MOV file',
        defaultPath: 'output.mov',
        filters: [{ name: 'QuickTime MOV', extensions: ['mov'] }],
    });

    if (canceled || !filePath) return;

    // FFmpeg による変換処理
    ffmpeg()
        .input(tempWebmPath)
        .inputOptions([
            '-c:v libvpx-vp9', // VP9 でアルファ付きとして読み込む
        ])
        .videoCodec('prores_ks')
        .outputOptions([
            '-profile:v 4', // ProRes 4444
            '-pix_fmt yuva444p10le', // アルファ維持
        ])
        .on('start', (commandLine) => {
            console.log('FFmpeg 実行コマンド:', commandLine);
        })
        .on('stderr', (stderrLine) => {
            console.log('FFmpeg stderr:', stderrLine);
        })
        .on('end', () => {
            fs.unlink(tempWebmPath, () => {}); // 一時ファイル削除
            console.log('MOV保存完了:', filePath);
        })
        .on('error', (err) => {
            console.error('FFmpeg変換エラー:', err);
        })
        .save(filePath);
});
