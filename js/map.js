// PaceCast - Leaflet Map & Geospatial Canopy Renderer

class PaceMapRenderer {
  constructor(mapContainerId = "map") {
    this.mapId = mapContainerId;
    this.map = null;
    this.routeLayer = null;
    this.splitMarkers = [];
    this.runnerMarker = null;
    this.canopyHeatLayers = [];
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

    // Add minimal zoom controls on bottom right
    L.control.zoom({ position: "bottomright" }).addTo(this.map);

    // Attribution in bottom left
    L.control.attribution({ position: "bottomleft", prefix: false })
      .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> & CartoDB')
      .addTo(this.map);
  }

  renderRoute(routeData) {
    this.currentRoute = routeData;
    if (!this.map) return;

    // Clear previous layers
    if (this.routeLayer) this.map.removeLayer(this.routeLayer);
    this.splitMarkers.forEach(m => this.map.removeLayer(m));
    this.splitMarkers = [];
    if (this.runnerMarker) this.map.removeLayer(this.runnerMarker);

    const latLngs = routeData.coordinates.map(pt => [pt[0], pt[1]]);

    // Render outer neon glow line
    const glowLine = L.polyline(latLngs, {
      color: "#10b981",
      weight: 8,
      opacity: 0.35,
      lineCap: "round",
      lineJoin: "round"
    }).addTo(this.map);

    // Render core crisp route line
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

    // Add Kilometer split markers
    if (routeData.splits && routeData.splits.length > 0) {
      routeData.splits.forEach(split => {
        const splitIcon = L.divIcon({
          className: "custom-pin km-pin",
          html: `<div class="pin-badge km-badge">${split.km}K</div>`,
          iconSize: [32, 24],
          iconAnchor: [16, 12]
        });

        const marker = L.marker([split.lat, split.lng], { icon: splitIcon })
          .bindPopup(`<b>Kilometer ${split.km} Split</b><br>${split.cue}`)
          .addTo(this.map);
        this.splitMarkers.push(marker);
      });
    }

    // Add Runner Position Marker
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
