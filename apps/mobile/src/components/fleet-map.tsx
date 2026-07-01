import { View, Text, useColorScheme } from 'react-native';
import { WebView } from 'react-native-webview';
import type { VpnProfile } from '@/types/vpn';
import { countryFlag } from '@/utils/formatters';

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
  selectedProfileId?: string | null;
  height?: number;
}

export default function FleetMap({ profiles, activeProfileId, selectedProfileId = activeProfileId, height = 200 }: Props) {
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
        country: p.country,
        flag: countryFlag(p.countryCode),
        active: p.id === activeProfileId,
        selected: p.id === selectedProfileId,
      };
    });

  const activeServer = servers.find((s) => s.active);
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png'
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
#m.dark{filter:brightness(1.3)contrast(1.3)saturate(0.9)}
.leaflet-control-attribution{display:none!important}
.marker-label{background:${isDark?'rgba(17,24,39,.92)':'rgba(255,255,255,.92)'};border:0;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.25);color:${isDark?'#fff':'#111'};font-size:12px;font-weight:700;padding:5px 7px;text-align:center;white-space:nowrap}
.marker-label small{color:${isDark?'#d1d5db':'#6b7280'};display:block;font-size:10px;font-weight:600;margin-top:1px}
.marker-label:before{display:none}
</style>
</head><body>
<div id="m"${isDark?' class="dark"':''}></div>
<script>
var d=${JSON.stringify(servers)};
var a=${JSON.stringify(activeServer)};
var m=L.map('m',{zoomControl:false,scrollWheelZoom:false,dragging:false,doubleClickZoom:false,touchZoom:false,keyboard:false});
L.tileLayer('${tileUrl}',{maxZoom:18}).addTo(m);
var g=L.featureGroup();
d.forEach(function(s){
 if(!s.lat&&!s.lng)return;
 var c;
 if(s.active || s.selected){
  c=L.circleMarker([s.lat,s.lng],{radius:s.active?9:7,fillColor:s.active?'#00C781':'#0A84FF',color:'#fff',weight:3,fillOpacity:1});
  c.bindTooltip((s.flag + ' ' + s.country),{permanent:true,direction:'top',offset:[0,-14],className:'marker-label'});
 }else{
  c=L.circleMarker([s.lat,s.lng],{radius:5,fillColor:'#8e8e93',color:undefined,weight:0,fillOpacity:0.6});
 }
 c.addTo(m);g.addLayer(c);
});
if(a){
 m.setView([a.lat,a.lng],7);
}else if(g.getLayers().length>0){
 m.fitBounds(g.getBounds().pad(0.4));
}
</script>
</body></html>`;

  return (
    <View className="rounded-2xl overflow-hidden" style={{ height, backgroundColor: isDark ? '#111827' : '#eef2f7' }}>
      <View className="absolute top-2 left-3 z-10">
        <Text className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 tracking-widest uppercase">
          Server Locations
        </Text>
      </View>
      <WebView
        source={{ html }}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: 'transparent', marginTop: 20 }}
        androidLayerType="hardware"
      />
    </View>
  );
}
