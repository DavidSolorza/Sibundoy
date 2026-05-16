import L from "leaflet";

const markerIcon = L.divIcon({
  className: "",
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -42],
  html: `<svg viewBox="0 0 28 40" width="28" height="40" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#34d399"/>
        <stop offset="100%" stop-color="#059669"/>
      </linearGradient>
      <filter id="ms" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.35"/>
      </filter>
    </defs>
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="url(#mg)" filter="url(#ms)"/>
    <circle cx="14" cy="14" r="8" fill="#fff" opacity="0.95"/>
    <circle cx="14" cy="14" r="5" fill="url(#mg)"/>
    <circle cx="14" cy="14" r="1.5" fill="#fff" opacity="0.5"/>
  </svg>`,
});

const tempMarkerIcon = L.divIcon({
  className: "",
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -42],
  html: `<svg viewBox="0 0 28 40" width="28" height="40" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f87171"/>
        <stop offset="100%" stop-color="#dc2626"/>
      </linearGradient>
      <filter id="ts" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.35"/>
      </filter>
    </defs>
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="url(#tg)" filter="url(#ts)"/>
    <circle cx="14" cy="14" r="8" fill="#fff" opacity="0.95"/>
    <circle cx="14" cy="14" r="5" fill="url(#tg)"/>
    <circle cx="14" cy="14" r="1.5" fill="#fff" opacity="0.5"/>
  </svg>`,
});

export { markerIcon, tempMarkerIcon };
