import {useEffect, useState} from 'react';

const getHashUserId = () => window.location.hash.replace(/^#/, '');

const useHashUserId = () => {
    const [id, setId] = useState(getHashUserId());

    useEffect(() => {
        const handleHashChange = () => {
            setId(getHashUserId());
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    return id;
};

export default useHashUserId;
