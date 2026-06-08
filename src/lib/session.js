const getSession = async (userId, password) => {
    if (userId && password) {
        const res = await fetch('https://dashblocks-server.vercel.app/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({userId, password}),
            credentials: 'include'
        });
        if (res.ok) return await res.json();
        return null;
    }

    try {
        const res = await fetch('https://dashblocks-server.vercel.app/session', {credentials: 'include'});
        if (res.ok) {
            const data = await res.json();
            return data;
        }
    } catch (error) {
        console.warn(error?.message || error);
        return null;
    }

    return null;
};

export default getSession;
