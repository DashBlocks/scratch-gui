const getSession = async (userId, password, verificationCode) => {
    if (userId && password) {
        const res = await fetch('https://api.dashblocks.org/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                userId,
                password,
                ...(verificationCode ? {verificationCode} : {})
            }),
            credentials: 'include'
        });
        const data = await res.json();
        if (res.ok) {
            return {
                ...data.user,
                ...(!verificationCode ? {requiresVerification: data.requiresVerification} : {})
            };
        }
        return data.error ? {error: data.error} : {};
    }

    try {
        const res = await fetch('https://api.dashblocks.org/session', {credentials: 'include'});
        if (res.ok) {
            const data = await res.json();
            return data.user;
        }
    } catch (error) {
        console.warn(error?.message || error);
        return {};
    }

    return {};
};

export default getSession;
