const sortedParts = parts => [...parts].sort((a, b) => a.p - b.p);

const encodeGradHTML = ({type, dir, parts}) => {
    const stops = sortedParts(parts).map(part => `${part.c} ${part.p}%`)
        .join(', ');
    return type === 'Linear' ? `linear-gradient(${dir}deg, ${stops})` : `radial-gradient(${stops})`;
};

const pointerPercent = (clientX, left, width) => Math.min(100, Math.max(0, ((clientX - left) / width) * 100));

const profileBackground = gradient => {
    if (!gradient || !gradient.stops.length) return null;
    return encodeGradHTML({
        type: 'Linear',
        dir: gradient.angle,
        parts: gradient.stops.map(stop => ({
            p: parseFloat(stop.position),
            c: `color-mix(in srgb, ${stop.color}, var(--ui-white) 60%)`
        }))
    });
};

export {encodeGradHTML, pointerPercent, profileBackground, sortedParts};
