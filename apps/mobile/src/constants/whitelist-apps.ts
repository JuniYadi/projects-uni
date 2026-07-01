export interface CuratedApp {
  packageName: string;
  appName: string;
  category: string;
}

export const CURATED_WHITELIST_APPS: CuratedApp[] = [
  // Social
  { packageName: 'com.whatsapp', appName: 'WhatsApp', category: 'Social' },
  { packageName: 'com.instagram.android', appName: 'Instagram', category: 'Social' },
  { packageName: 'com.facebook.katana', appName: 'Facebook', category: 'Social' },
  { packageName: 'com.zhiliaoapp.musically', appName: 'TikTok', category: 'Social' },
  { packageName: 'com.twitter.android', appName: 'X (Twitter)', category: 'Social' },
  { packageName: 'com.snapchat.android', appName: 'Snapchat', category: 'Social' },
  { packageName: 'com.linkedin.android', appName: 'LinkedIn', category: 'Social' },
  { packageName: 'com.discord', appName: 'Discord', category: 'Social' },
  { packageName: 'com.telegram.messenger', appName: 'Telegram', category: 'Social' },

  // Streaming
  { packageName: 'com.google.android.youtube', appName: 'YouTube', category: 'Streaming' },
  { packageName: 'com.netflix.mediaclient', appName: 'Netflix', category: 'Streaming' },
  { packageName: 'com.spotify.music', appName: 'Spotify', category: 'Streaming' },
  { packageName: 'com.google.android.apps.youtube.music', appName: 'YouTube Music', category: 'Streaming' },
  { packageName: 'com.apple.android.music', appName: 'Apple Music', category: 'Streaming' },
  { packageName: 'com.amazon.avod.thirdpartyclient', appName: 'Prime Video', category: 'Streaming' },
  { packageName: 'sg.bigo.live', appName: 'Bigo Live', category: 'Streaming' },

  // Shopping & Food
  { packageName: 'com.shopee.id', appName: 'Shopee', category: 'Shopping' },
  { packageName: 'com.tokopedia.tkpd', appName: 'Tokopedia', category: 'Shopping' },
  { packageName: 'com.lazada.android', appName: 'Lazada', category: 'Shopping' },
  { packageName: 'com.bukalapak.android', appName: 'Bukalapak', category: 'Shopping' },
  { packageName: 'com.grabtaxi.passenger', appName: 'Grab', category: 'Shopping' },
  { packageName: 'com.gojek.app', appName: 'Gojek', category: 'Shopping' },
  { packageName: 'com.foodpanda.android', appName: 'Foodpanda', category: 'Shopping' },

  // Banking & Payments
  { packageName: 'com.bca.mybca', appName: 'myBCA', category: 'Finance' },
  { packageName: 'src.com.bri.brimo', appName: 'BRImo', category: 'Finance' },
  { packageName: 'com.bankmandiri.mandirionline', appName: 'Livin\u2019 by Mandiri', category: 'Finance' },
  { packageName: 'com.dana', appName: 'DANA', category: 'Finance' },
  { packageName: 'com.ovo.vo', appName: 'OVO', category: 'Finance' },
  { packageName: 'com.gojek.gopay', appName: 'GoPay', category: 'Finance' },
  { packageName: 'com.paypal.android.p2paymobile', appName: 'PayPal', category: 'Finance' },

  // Browsers
  { packageName: 'com.android.chrome', appName: 'Chrome', category: 'Browsers' },
  { packageName: 'org.mozilla.firefox', appName: 'Firefox', category: 'Browsers' },
  { packageName: 'com.sec.android.app.sbrowser', appName: 'Samsung Internet', category: 'Browsers' },
  { packageName: 'com.microsoft.emmx', appName: 'Edge', category: 'Browsers' },
  { packageName: 'com.opera.browser', appName: 'Opera Browser', category: 'Browsers' },
  { packageName: 'com.brave.browser', appName: 'Brave', category: 'Browsers' },
  { packageName: 'com.duckduckgo.mobile.android', appName: 'DuckDuckGo', category: 'Browsers' },
  { packageName: 'com.vivaldi.browser', appName: 'Vivaldi', category: 'Browsers' },

  // Speed Test
  { packageName: 'org.zwanoo.android.speedtest', appName: 'Speedtest by Ookla', category: 'Speed Test' },
  { packageName: 'com.netflix.Speedtest', appName: 'FAST Speed Test', category: 'Speed Test' },
  { packageName: 'com.meteor.android', appName: 'Meteor', category: 'Speed Test' },
  { packageName: 'com.speedtest.net.speedtest', appName: 'Speedtest', category: 'Speed Test' },

  // Games
  { packageName: 'com.dts.freefireth', appName: 'Free Fire', category: 'Games' },
  { packageName: 'com.tencent.ig', appName: 'PUBG Mobile', category: 'Games' },
  { packageName: 'com.supercell.clashofclans', appName: 'Clash of Clans', category: 'Games' },
  { packageName: 'com.nianticlabs.pokemongo', appName: 'Pokémon GO', category: 'Games' },
];

export const CURATED_CATEGORIES = Array.from(
  new Set(CURATED_WHITELIST_APPS.map((app) => app.category))
);
