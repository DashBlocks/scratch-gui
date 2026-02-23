const getSession = async (userId, password) => {
    if (userId && password) {
        const res = await fetch("https://dashblocks-server.vercel.app/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, password }),
            credentials: "include"
        });
        if (res.ok) return await res.json();
        return null;
    }

    try {
        const res = await fetch("https://dashblocks-server.vercel.app/auth/me", {credentials: "include"});
        if (res.ok) {
            const data = await res.json();
            return data;
        }
    } catch (e) {
        console.error("Session failed", e);
    }

    return null;
};

export default getSession;
