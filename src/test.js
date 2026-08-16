const checkForTests = () => {
    if (window.location.href === 'https://dashblocks.org/scratch-gui') {
        const params = new URLSearchParams(window.location.href);
        params.append('enabletests', '');
        window.location.href = `https://dashblocks.org/scratch-gui?${params.toString()}`;
    }
};

export default checkForTests;
