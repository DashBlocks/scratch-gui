const API_ORIGIN = 'https://api.dashblocks.org';

let refreshPromise = null;

const refreshSession = async () => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = fetch(`${API_ORIGIN}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
    }).finally(() => {
        refreshPromise = null;
    });

    const res = await refreshPromise;
    return res.ok;
};

const requestDashApi = async (endpoint, options = {}, retryCount = 0) => {
    const res = await fetch(`${API_ORIGIN}${endpoint}`, options);

    if (res.ok) {
        return res;
    }

    if (res.status === 401 && endpoint !== '/auth/refresh' && retryCount === 0) {
        const refreshed = await refreshSession();

        if (refreshed) {
            return requestDashApi(endpoint, options, retryCount + 1);
        }
    }

    console.warn(`Request ${API_ORIGIN}${endpoint} failed (${res.status})`);
    return res;
};

const getSession = async (userId, password, verificationCode, captchaToken) => {
    if (userId && password) {
        const res = await requestDashApi('/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                userId,
                password,
                ...(verificationCode ? {verificationCode} : {}),
                ...(captchaToken ? {captchaToken} : {})
            }),
            credentials: 'include'
        });
        const data = await res.json();

        if (data?.error) {
            return {error: data.error};
        }

        if (data?.user) {
            return {
                ...data.user,
                ...(verificationCode ? {} : {requiresVerification: data.requiresVerification})
            };
        }

        return {};
    }

    try {
        const res = await requestDashApi('/session', {credentials: 'include'});
        const data = await res.json();
        return data?.user ?? {};
    } catch (error) {
        console.warn(error?.message || error);
        return {};
    }
};

export {
    requestDashApi,
    getSession as default
};
