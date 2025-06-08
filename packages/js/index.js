import App from './App.js';

(async () => {
    const app = new App();
    await app.init();
    window.app = app;

    console.log(app);
})();
