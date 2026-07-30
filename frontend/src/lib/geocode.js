// Зочны браузерийн координатыг backend-ийн /api/geocode/reverse (Nominatim proxy)
// руу дамжуулж уншигдах хаяг болгож хөрвүүлнэ. Алдаа гарвал координатаа
// шууд харуулах fallback-тай (сүлжээ тасарсан үед ч зочин үргэлжлүүлж чадна).
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
    if (!res.ok) throw new Error('geocode failed');
    const data = await res.json();
    return { address: data.address, lat, lng };
  } catch {
    return { address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng };
  }
}

export function detectCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('unsupported'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err)
    );
  });
}
