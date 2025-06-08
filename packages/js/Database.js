const BASE_API_URL = `https://${atob('YXBpLnNoaW55Y29sb3JzLm1vZQ==')}`;
const BASE_STATIC_URL = `https://${atob('Y2Ytc3RhdGljLnNoaW55Y29sb3JzLm1vZQ==')}`;
const HADUKI_IDOL_ID = 91;

class Database {
    constructor(parent) {
        this.parent = parent;

        this._idolList = null;
    }

    async idolList() {
        if (this._idolList) return this._idolList;

        try {
            const response = await fetch(`${BASE_API_URL}/spine/idollist`);
            if (!response.ok) throw new Error(`Failed to fetch idol list: ${response.status}`);
            this._idolList = await response.json();
            return this._idolList;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    async dressList(idx) {
        const list = await this.idolList();
        if (!list || !list[idx]) return null;

        if (list[idx].dress) return list[idx].dress;

        const idolId = list[idx].idolId;
        const url = idolId === HADUKI_IDOL_ID ? `${BASE_STATIC_URL}/others/hazuki.json` : `${BASE_API_URL}/spine/dressList?idolId=${idolId}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch dress list for idol ${idolId}`);
            const dressData = await response.json();
            list[idx] = { ...list[idx], dress: dressData };

            return dressData;
        } catch (err) {
            console.error(err);
            return null;
        }
    }
}

export default Database;
