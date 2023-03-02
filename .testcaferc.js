const BASE_URL = 'http://localhost:1234';

module.exports = {
    'browsers': {
        'path': 'chromium',
        'cmd': '--window-size=1280,720'
    },
    'src': ['Tests/e2e/test_*/*.ts'],
    'appCommand': 'yarn dev',
    'baseUrl': BASE_URL,
    'screenshots': {
        'takeOnFails': true
    },
    'stopOnFirstFail': true,
    'hostname': 'localhost',
    'retryTestPages': true,
    'pageLoadTimeout': 10000,
    'pageRequestTimeout': 60000,
};
