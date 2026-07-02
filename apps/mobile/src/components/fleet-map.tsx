import { View, useColorScheme } from 'react-native';
import { WebView } from 'react-native-webview';
import type { VpnProfile } from '@/types/vpn';
import { countryFlag } from '@/utils/formatters';

export interface UserLocation {
  lat: number;
  lng: number;
  country?: string;
  city?: string;
}

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
  userLocation?: UserLocation | null;
}

export default function FleetMap({ profiles, activeProfileId, selectedProfileId = activeProfileId, height = 200, userLocation }: Props) {
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
  const selectedServer = servers.find((s) => s.selected);
  const focusedServer = selectedServer || activeServer;
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
.leaflet-control-attribution{display:none!important}
.marker-label{background:${isDark?'rgba(17,24,39,.92)':'rgba(255,255,255,.92)'};border:0;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.25);color:${isDark?'#fff':'#111'};font-size:12px;font-weight:700;padding:5px 7px;text-align:center;white-space:nowrap}
.marker-label small{color:${isDark?'#d1d5db':'#6b7280'};display:block;font-size:10px;font-weight:600;margin-top:1px}
.marker-label:before{display:none}
.animated-line{animation: dash 1s linear infinite}
@keyframes dash{to{stroke-dashoffset:-16}}
</style>
</head><body>
<div id="m"></div>
<script>
var d=${JSON.stringify(servers)};
var f=${JSON.stringify(focusedServer)};
var u=${JSON.stringify(userLocation ?? null)};
var m=L.map('m',{zoomControl:true,scrollWheelZoom:false,dragging:false,doubleClickZoom:false,touchZoom:false,keyboard:false});
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
if(u){
 var uc=L.circleMarker([u.lat,u.lng],{radius:7,fillColor:'#0A84FF',color:'#fff',weight:2,fillOpacity:1});
 uc.bindTooltip('You',{permanent:true,direction:'bottom',offset:[0,10],className:'marker-label'});
 uc.addTo(m);g.addLayer(uc);
 if(f){
  L.polyline([[u.lat,u.lng],[f.lat,f.lng]],{color:'#00C781',weight:2.5,opacity:0.85,dashArray:'8, 8',className:'animated-line'}).addTo(m);
 }
}
if(u && f){
 m.fitBounds([[u.lat,u.lng],[f.lat,f.lng]],{padding:[60,60],maxZoom:5});
}else if(f){
 m.setView([f.lat,f.lng],7);
}else if(g.getLayers().length>0){
 m.fitBounds(g.getBounds().pad(0.4));
}
</script>
</body></html>`;

  return (
    <View className="rounded-2xl overflow-hidden" style={{ height, backgroundColor: isDark ? '#111827' : '#eef2f7' }}>
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
