/**
 * MICRO-UNIVERSO v1.2 - Cryptography & Entropy Module
 * Handles SHA-256 hashing, Shannon Entropy, and Avalanche Diffusion analysis.
 */

// Compute SHA-256 hash using the native Web Crypto API
async function computeSHA256(str) {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray;
}

// Calculate Shannon Entropy on strings or data streams (bits measure of uncertainty)
function calculateShannonEntropy(str) {
    if (!str || str.length === 0) return 0.0;
    const freqs = {};
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        freqs[char] = (freqs[char] || 0) + 1;
    }
    let entropy = 0;
    const len = str.length;
    for (const char in freqs) {
        const p = freqs[char] / len;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}

// Calculate Avalanche Effect diffusion percentage (Strict bit-flip dispersion test)
function calculateAvalancheDiffusion(str) {
    if (!str || str.length < 2) return 0.0;
    let bitDiffs = 0;
    for (let i = 0; i < str.length - 1; i++) {
        const xor = str.charCodeAt(i) ^ str.charCodeAt(i + 1);
        for (let b = 0; b < 8; b++) {
            if ((xor >> b) & 1) bitDiffs++;
        }
    }
    const maxBits = (str.length - 1) * 8;
    return (bitDiffs / maxBits) * 100;
}

// Map text or hash streams directly to 3D phase space coordinates for particles
async function applyCryptoEntropyInjection(inputText, count, targetPositions) {
    if (!inputText || inputText.trim() === '') return { entropy: 0, diffusion: 0 };

    const entropy = calculateShannonEntropy(inputText);
    const diffusion = calculateAvalancheDiffusion(inputText);
    const hashBytes = await computeSHA256(inputText);

    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const b1 = hashBytes[i % hashBytes.length];
        const b2 = hashBytes[(i + 1) % hashBytes.length];
        const b3 = hashBytes[(i + 2) % hashBytes.length];

        // Map bytes [0-255] to 3D phase space coordinates [-20, 20]
        const mapX = ((b1 / 255.0) - 0.5) * 40.0;
        const mapY = ((b2 / 255.0) - 0.5) * 40.0;
        const mapZ = ((b3 / 255.0) - 0.5) * 40.0;

        targetPositions[idx] = mapX + (Math.sin(i) * 2.0);
        targetPositions[idx + 1] = mapY + (Math.cos(i) * 2.0);
        targetPositions[idx + 2] = mapZ + (Math.sin(i * 0.5) * 2.0);
    }

    return { entropy, diffusion };
}