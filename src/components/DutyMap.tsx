import React, { useMemo } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { WebView } from "react-native-webview";
import { colors } from "../theme";

export interface DutyMapPoint {
  lat: number;
  lng: number;
  /** Real compass heading in degrees, when the fix provided one. Only meaningful on driverPosition. */
  headingDegrees?: number | null;
}

export interface DutyMapRoute {
  geometry: DutyMapPoint[] | null;
  from?: DutyMapPoint | null;
  to?: DutyMapPoint | null;
}

export interface DutyMapProps {
  driverPosition?: DutyMapPoint | null;
  route?: DutyMapRoute | null;
  height?: number;
  style?: ViewStyle;
}

/*
 * Real OpenStreetMap tiles rendered via Leaflet inside a WebView, not
 * react-native-maps: on Android, react-native-maps needs a Google Maps API
 * key just to render a blank base map, which conflicts with "no paid map
 * APIs for local testing." react-native-webview has no such dependency and
 * is bundled in Expo Go (no dev-client rebuild needed). Everything drawn
 * here is real -- driverPosition comes from expo-location, route only when
 * Fleetovo's /end response actually returned one. Never a client-computed
 * route/fare.
 */
export function DutyMap({ driverPosition, route, height = 320, style }: DutyMapProps) {
  const html = useMemo(() => buildHtml(driverPosition ?? null, route ?? null), [driverPosition, route]);

  return (
    <View style={[styles.wrap, { height }, style]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  );
}

function buildHtml(driverPosition: DutyMapPoint | null, route: DutyMapRoute | null): string {
  const geometry = route?.geometry ?? [];
  const center = driverPosition ?? route?.from ?? route?.to ?? geometry[0] ?? null;
  const hasAnyRealPoint = !!center;
  // India-wide framing is only the initial camera position when there is
  // truly nothing real to show yet (e.g. GPS permission not yet granted) --
  // never rendered as a marker/location.
  const initialCenter = center ?? { lat: 22.3511, lng: 78.6677 };
  const initialZoom = hasAnyRealPoint ? 15 : 4;

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #e2e8f0; }
    .leaflet-control-attribution { font-size: 9px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${initialCenter.lat}, ${initialCenter.lng}], ${initialZoom});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var bounds = [];

    ${driverPosition ? `
    var driverIcon = L.divIcon({
      className: '',
      html: ${
        driverPosition.headingDegrees != null
          ? `'<div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:18px solid #2563eb;filter:drop-shadow(0 0 2px rgba(0,0,0,0.5));transform:rotate(${driverPosition.headingDegrees}deg);transform-origin:center center;"></div>'`
          : `'<div style="width:16px;height:16px;border-radius:8px;background:#2563eb;border:3px solid #fff;box-shadow:0 0 4px rgba(0,0,0,0.4);"></div>'`
      },
      iconSize: [18, 18]
    });
    L.marker([${driverPosition.lat}, ${driverPosition.lng}], { icon: driverIcon }).addTo(map);
    bounds.push([${driverPosition.lat}, ${driverPosition.lng}]);
    ` : ""}

    ${geometry.length > 1 ? `
    var routeLine = L.polyline(${JSON.stringify(geometry.map((p) => [p.lat, p.lng]))}, { color: '#d8b25c', weight: 4 }).addTo(map);
    routeLine.getLatLngs().forEach(function (p) { bounds.push([p.lat, p.lng]); });
    ` : ""}

    ${route?.from ? `
    L.circleMarker([${route.from.lat}, ${route.from.lng}], { radius: 6, color: '#16a34a', fillColor: '#16a34a', fillOpacity: 1 }).addTo(map);
    bounds.push([${route.from.lat}, ${route.from.lng}]);
    ` : ""}
    ${route?.to ? `
    L.circleMarker([${route.to.lat}, ${route.to.lng}], { radius: 6, color: '#dc2626', fillColor: '#dc2626', fillOpacity: 1 }).addTo(map);
    bounds.push([${route.to.lat}, ${route.to.lng}]);
    ` : ""}

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [28, 28] });
    }
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  wrap: { width: "100%", overflow: "hidden", backgroundColor: colors.slate[100] },
  webview: { flex: 1, backgroundColor: "transparent" },
});
