export interface UserLocation {
  lat: number;
  lng: number;
  country: string;
  city: string;
  ip?: string;
}
export const DEFAULT_USER_LOCATION: UserLocation = {
  lat: -6.2088,
  lng: 106.8456,
  country: 'Indonesia',
  city: 'Jakarta',
  ip: '180.252.84.11',
};


interface IpGeoResponse {
  success: boolean;
  geo?: {
    ip: string;
    country: string;
    city: string;
    region: string;
    region_code: string;
    postal_code: string;
    latitude: string;
    longitude: string;
    timezone: string;
    continent: string;
  };
}

export async function getIpLocation(): Promise<UserLocation | null> {
  try {
    const res = await fetch('https://api.findy.juniyadi.id/ip');
    if (!res.ok) return null;
    const data: IpGeoResponse = await res.json();
    if (!data.success || !data.geo) return null;

    const lat = parseFloat(data.geo.latitude);
    const lng = parseFloat(data.geo.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

    return {
      lat,
      lng,
      country: data.geo.country,
      city: data.geo.city,
      ip: data.geo.ip,
    };
  } catch {
    return null;
  }
}
