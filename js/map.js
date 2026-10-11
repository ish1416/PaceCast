// PaceCast - Leaflet Map, Geospatial Canopy & Foliage Radar Renderer

class PaceMapRenderer {
  constructor(mapContainerId = "map") {
    this.mapId = mapContainerId;
    this.map = null;
    this.routeLayer = null;
    this.splitMarkers = [];
    this.runnerMarker = null;
    this.foliageRadarLayer = null;
    this.currentRoute = null;
  }

  init(center = [40.785091, -73.968285], zoom = 14) {
    if (this.map) return;
    
    // Create Leaflet map
    this.map = L.map(this.mapId, {
      zoomControl: false,
      attributionControl: false
    }).setView(center, zoom);

    // Custom dark aesthetic tile layer (CartoDB DarkMatter)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd"
    }).addTo(this.map);

    // Minimal zoom controls on bottom right
    L.control.zoom({ position: "bottomright" }).addTo(this.map);

    // Attribution
    L.control.attribution({ position: "bottomleft", prefix: false })
      .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> & CartoDB')
      .addTo(this.map);
  }

  renderRoute(routeData, showFoliageRadar = true) {
    this.currentRoute = routeData;
    if (!this.map) return;

    // Clear previous layers
    if (this.routeLayer) this.map.removeLayer(this.routeLayer);
    if (this.foliageRadarLayer) this.map.removeLayer(this.foliageRadarLayer);
    this.splitMarkers.forEach(m => this.map.removeLayer(m));
    this.splitMarkers = [];
    if (this.runnerMarker) this.map.removeLayer(this.runnerMarker);

    const latLngs = routeData.coordinates.map(pt => [pt[0], pt[1]]);

    // 1. Autumn Foliage Canopy Heatmap / Radar
    if (showFoliageRadar) {
      const radarCircles = [];
      const foliageColors = ["#ef4444", "#f97316", "#f59e0b", "#fbbf24"];

      routeData.coordinates.forEach((pt, idx) => {
        const density = pt[3] || 0.85;
        const color = foliageColors[idx % foliageColors.length];
        const circle = L.circle([pt[0], pt[1]], {
          color: color,
          fillColor: color,
          fillOpacity: density * 0.35,
          radius: 90 * density,
          stroke: false
        });
        radarCircles.push(circle);
      });
      this.foliageRadarLayer = L.featureGroup(radarCircles).addTo(this.map);
    }

    // 2. Render outer neon glow route line
    const glowLine = L.polyline(latLngs, {
      color: "#10b981",
      weight: 8,
      opacity: 0.35,
      lineCap: "round",
      lineJoin: "round"
    }).addTo(this.map);

    // 3. Render core crisp route line
    const coreLine = L.polyline(latLngs, {
      color: "#34d399",
      weight: 4,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round"
    }).addTo(this.map);

    this.routeLayer = L.featureGroup([glowLine, coreLine]).addTo(this.map);

    // Add Start / Finish Pin
    const startPt = latLngs[0];
    const startIcon = L.divIcon({
      className: "custom-pin start-pin",
      html: `<div class="pin-badge start-badge">START</div>`,
      iconSize: [40, 24],
      iconAnchor: [20, 12]
    });
    const startMarker = L.marker(startPt, { icon: startIcon }).addTo(this.map);
    this.splitMarkers.push(startMarker);

    // Add Kilometer split markers with interactive popup
    if (routeData.splits && routeData.splits.length > 0) {
      routeData.splits.forEach(split => {
        const splitIcon = L.divIcon({
          className: "custom-pin km-pin",
          html: `<div class="pin-badge km-badge">${split.km}K</div>`,
          iconSize: [32, 24],
          iconAnchor: [16, 12]
        });

        const marker = L.marker([split.lat, split.lng], { icon: splitIcon })
          .bindPopup(`<div style="font-family: Outfit, sans-serif; color: #111;">
            <b style="color: #10b981; font-size: 14px;">Kilometer ${split.km} Split</b><br>
            <p style="margin-top: 4px; font-size: 12px; line-height: 1.4;">${split.cue}</p>
          </div>`)
          .addTo(this.map);
        this.splitMarkers.push(marker);
      });
    }

    // Add Animated Runner Position Marker
    const runnerIcon = L.divIcon({
      className: "runner-pin",
      html: `<div class="runner-dot"><div class="runner-pulse"></div></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    this.runnerMarker = L.marker(startPt, { icon: runnerIcon, zIndexOffset: 1000 }).addTo(this.map);

    // Fit view smoothly
    this.map.fitBounds(glowLine.getBounds(), { padding: [40, 40] });
  }

  toggleFoliageRadar(enabled) {
    if (!this.map) return;
    if (this.foliageRadarLayer) {
      if (enabled) {
        this.map.addLayer(this.foliageRadarLayer);
      } else {
        this.map.removeLayer(this.foliageRadarLayer);
      }
    }
  }

  updateRunnerPosition(lat, lng) {
    if (this.runnerMarker) {
      this.runnerMarker.setLatLng([lat, lng]);
    }
  }

  panToRunner(lat, lng) {
    if (this.map) {
      this.map.panTo([lat, lng], { animate: true, duration: 0.5 });
    }
  }
}

window.paceMap = new PaceMapRenderer();
