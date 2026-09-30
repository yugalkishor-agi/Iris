const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Stop Metro from crawling/watching dirs the native app never bundles.
// `dist/` is web build output; `.expo` is transient. Trimming the file map
// speeds up cold start and lowers CPU/memory on Windows (no watchman).
const escapeRegex = (str) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
const distDir = escapeRegex(path.resolve(__dirname, 'dist'));
const expoDir = escapeRegex(path.resolve(__dirname, '.expo'));

config.resolver.blockList = [
  new RegExp(`^${distDir}.*`),
  new RegExp(`^${expoDir}.*`),
];

module.exports = config;