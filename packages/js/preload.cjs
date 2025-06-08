const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('videoExporter', {
    saveWebmBuffer: (arrayBuffer) => {
        const buffer = Buffer.from(arrayBuffer);
        ipcRenderer.send('save-webm-buffer', buffer);
    },
});
