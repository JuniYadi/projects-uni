/**
 * Force-upgrades com.wireguard.android:tunnel from 1.0.20211029 (4KB aligned)
 * to 1.0.20260102 (16KB aligned) via Gradle resolution strategy.
 *
 * Background: react-native-wireguard-vpn-patched depends on tunnel 1.0.20211029
 * whose prebuilt .so files use 2**12 (4KB) ELF alignment, failing Google Play's
 * 16KB page size requirement. Version 1.0.20260102 uses 2**14 (16KB) alignment
 * on arm64-v8a and x86_64 (the 64-bit ABIs that need it).
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const TUNNEL_VERSION = '1.0.20260102';
const MARKER = 'com.wireguard.android:tunnel:' + TUNNEL_VERSION;

const RESOLUTION_BLOCK = [
  '',
  '// Force wireguard tunnel to 16KB page-size aligned version (2**14).',
  '// react-native-wireguard-vpn-patched ships tunnel 1.0.20211029 (4KB/2**12 aligned),',
  "// which fails Google Play's 16KB memory page size requirement.",
  'configurations.all {',
  '    resolutionStrategy {',
  "        force 'com.wireguard.android:tunnel:" + TUNNEL_VERSION + "'",
  '    }',
  '}',
  '',
].join('\n');

module.exports = function withWireguard16kb(config) {
  return withAppBuildGradle(config, (cfg) => {
    const buildGradle = cfg.modResults.contents;

    if (buildGradle.includes(MARKER)) {
      // Already applied — idempotent.
      return cfg;
    }

    // Insert before the top-level dependencies { } block.
    cfg.modResults.contents = buildGradle.replace(
      /^(dependencies\s*\{)/m,
      RESOLUTION_BLOCK + '\n$1'
    );

    return cfg;
  });
};
