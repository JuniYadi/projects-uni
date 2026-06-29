const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withWireguardExported(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const service = {
      $: {
        'android:name': 'com.wireguard.android.backend.GoBackend$VpnService',
        'android:exported': 'false',
      },
    };
    if (!manifest.application || !manifest.application[0]) return cfg;
    manifest.application[0]['service'] = manifest.application[0]['service'] || [];
    manifest.application[0]['service'].push(service);
    return cfg;
  });
};
