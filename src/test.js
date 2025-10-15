const checkForTests = () => {
    if (window.location.href == "https://dashblocks.github.io/scratch-gui") {
        const url = new URL(window.location.href);
        const params = url.searchParams;
        params.append('enabletests', '');
    }
}

export default checkForTests;
