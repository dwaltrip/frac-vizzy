import posthog from 'posthog-js';


const POSTHOG_TOKEN = process.env.REACT_APP_POSTHOG_TOKEN;

function initPosthog() {
    const isProd = (
        !window.location.host.includes('127.0.0.1') &&
        !window.location.host.includes('localhost')
    );
    if (isProd) {
        posthog.init(POSTHOG_TOKEN, {
            api_host: 'https://fracvizzy.com/ingest',
        });
    }
}

export { initPosthog };
