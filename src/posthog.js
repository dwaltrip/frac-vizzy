import posthog from 'posthog-js'

function initPosthog() {
    const isProd = (
        !window.location.host.includes('127.0.0.1') &&
        !window.location.host.includes('localhost')
    );

    if (isProd) {
        posthog.init('phc_qtlIAex0PWqDBgQKFzw4G0OJw7aWThngdOZLv98jbzH', { api_host: 'https://app.posthog.com' })

        console.log('posthog initialized');
    }
}

export { initPosthog };
