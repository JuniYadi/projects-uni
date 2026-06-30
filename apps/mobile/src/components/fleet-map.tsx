import { View, useColorScheme } from 'react-native';
import { WebView } from 'react-native-webview';
import type { VpnProfile } from '@/types/vpn';

// ponytail: static coords per countryCode fallback, add real geocoding API later
const FALLBACK_COORDS: Record<string, { lat: number; lng: number }> = {
  SG: { lat: 1.3521, lng: 103.8198 },
  JP: { lat: 35.6762, lng: 139.6503 },
  HK: { lat: 22.3193, lng: 114.1694 },
  NL: { lat: 52.3676, lng: 4.9041 },
  DE: { lat: 50.1109, lng: 8.6821 },
  US: { lat: 37.0902, lng: -95.7129 },
};

interface Props {
  profiles: VpnProfile[];
  activeProfileId: string | null;
  height?: number;
}

export default function FleetMap({ profiles, activeProfileId, height = 200 }: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const servers = profiles
    .filter((p) => p.latitude || p.longitude || FALLBACK_COORDS[p.countryCode])
    .map((p) => {
      const fallback = FALLBACK_COORDS[p.countryCode];
      return {
        id: p.id,
        lat: p.latitude ?? fallback?.lat ?? 0,
        lng: p.longitude ?? fallback?.lng ?? 0,
        name: p.name,
        code: p.countryCode,
        active: p.id === activeProfileId,
      };
    });

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const html = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0}
body{background:transparent}
#m{width:100vw;height:100vh}
${isDark ? '.leaflet-control-attribution{display:none!important}' : ''}
</style>
</head><body>
<div id="m"></div>
<script>
var d=${JSON.stringify(servers)};
var m=L.map('m',{zoomControl:false,scrollWheelZoom:false,dragging:false,doubleClickZoom:false,touchZoom:false,keyboard:false});
L.tileLayer('${tileUrl}',{maxZoom:18}).addTo(m);
var g=L.featureGroup();
d.forEach(function(s){
 if(!s.lat&&!s.lng)return;
 var c=s.active
  ? L.circleMarker([s.lat,s.lng],{radius:7,fillColor:'#00C781',color:'#fff',weight:2,fillOpacity:1})
  : L.circleMarker([s.lat,s.lng],{radius:3.5,fillColor:'#8e8e93',color:'#fff',weight:1,opacity:.5,fillOpacity:.35});
 c.addTo(m);g.addLayer(c);
});
if(g.getLayers().length>0)m.fitBounds(g.getBounds().pad(0.35));
</script>
</body></html>`;

  return (
    <View style={{ height, borderRadius: 16, overflow: 'hidden' }}>
      <WebView
        source={{ html }}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: 'transparent' }}
        androidLayerType="hardware"
      />
    </View>
  );
}
