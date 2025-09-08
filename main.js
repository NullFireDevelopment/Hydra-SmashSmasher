(function() {
    'use strict';

    function logLastStatus(data) {
        const answers = data?.data?.answers;
        if (answers && answers.length > 0) {
            const last = answers[answers.length - 1];
            console.clear(); // Clear the console every time
            console.log("Is answer correct?:", last.status);
        }
    }

    // Patch fetch
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        return originalFetch.apply(this, args).then(response => {
            if (args[0].includes('/services/api/grades/partial/add')) {
                response.clone().json()
                    .then(logLastStatus)
                    .catch(() => console.log("[Captured Response] Non-JSON"));
            }
            return response;
        });
    };

    // Patch XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    function XHRProxy() {
        const xhr = new originalXHR();
        const open = xhr.open;
        xhr.open = function(method, url, ...rest) {
            this._url = url;
            return open.apply(this, [method, url, ...rest]);
        };
        const send = xhr.send;
        xhr.send = function(body) {
            this.addEventListener('load', () => {
                if (this._url.includes('/services/api/grades/partial/add')) {
                    try {
                        logLastStatus(JSON.parse(this.responseText));
                    } catch { /* ignore non-JSON responses */ }
                }
            });
            return send.apply(this, [body]);
        };
        return xhr;
    }
    window.XMLHttpRequest = XHRProxy;

})();
