import {useEffect, useState} from 'react';

const getHashId = () => window.location.hash.replace(/^#/, '');

const useHashId = () => {
    const [id, setId] = useState(getHashId());

    useEffect(() => {
        const handleHashChange = () => {
            setId(getHashId());
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    return id;
};

export default useHashId;
