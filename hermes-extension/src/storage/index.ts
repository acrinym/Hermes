export function saveDataToBackground(storageKey, data) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            { type: "SAVE_HERMES_DATA", payload: { key: storageKey, value: data } },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error(`Hermes CS: Error saving ${storageKey}:`, chrome.runtime.lastError.message);
                    reject(chrome.runtime.lastError.message);
                    return;
                }
                if (response && response.success) {
                    console.log(`Hermes CS: Data for ${storageKey} saved via background.`);
                    resolve(true);
                } else {
                    const errorMsg = response ? response.error : `Unknown error saving ${storageKey}`;
                    console.error(`Hermes CS: Error saving ${storageKey} via background:`, errorMsg);
                    reject(errorMsg);
                }
            }
        );
    });
}
