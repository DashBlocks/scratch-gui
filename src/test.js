const checkForTests = () => {
    if (window.location.href == "https://dashblocks.github.io/scratch-gui") {
        const params = new URLSearchParams(window.location.href);
        params.append('enabletests', '');
        window.location.href = `https://dashblocks.github.io/scratch-gui?${params.toString()}`;
    }
}

export default checkForTests;
