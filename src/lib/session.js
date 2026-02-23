const getSession = async (userId, password) => {
    if (localStorage.getItem("session")) return JSON.parse(localStorage.getItem("session"));
    if (!userId || !password) return null;

    const res = await fetch("https://dashblocks-server.vercel.app/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password })
    });

    const result = await res.json();
    if (res.ok) {
        localStorage.setItem("session",
            JSON.stringify({
                userId: userId,
                password: password,
                username: result.username
            })
        );
        return JSON.parse(localStorage.getItem("session"));
    } else {
        return null;
    }
};

export default getSession;