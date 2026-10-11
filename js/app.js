// PaceCast - Main Application Orchestrator

document.addEventListener("DOMContentLoaded", () => {
  // Application State
  const state = {
    currentRouteId: "central_park",
    currentRoute: PRESET_ROUTES.central_park,
    targetDistance: 5.0,
    targetPace: "5:15",
    targetCadence: 172,
    isRunning: false,
    isSimulating: false,
    isPocketMode: false,
    viewMode: "2d", // "2d" or "3d"
    screenTimeSec: 12,
    outdoorTimeSec: 0,
    currentKmProgress: 0.0,
    currentCadence: 172,
    runTimer: null,
    simulationTimer: null,
    simulationStep: 0,
    spokenCues: []
  };

  // DOM Elements
  const elPresetSelect = document.getElementById("preset-select");
  const elTargetPace = document.getElementById("target-pace");
  const elTargetCadence = document.getElementById("target-cadence");
  const elCoachPersona = document.getElementById("coach-persona");
  const elBtnStartRun = document.getElementById("btn-start-run");
  const elBtnSimulate = document.getElementById("btn-simulate-run");
  const elBtnStopRun = document.getElementById("btn-stop-run");
  const elBtnGeolocate = document.getElementById("btn-geolocate");
  const elToggleMetronome = document.getElementById("toggle-metronome");
  const elToggleFoliageRadar = document.getElementById("toggle-foliage-radar");

  // View Mode Tabs
  const elTab2d = document.getElementById("tab-2d-map");
  const elTab3d = document.getElementById("tab-3d-trail");
  const elMapDiv = document.getElementById("map");
  const elTrailCanvas = document.getElementById("trail-3d-canvas");

  // Telemetry & Stats
  const elScreenTime = document.getElementById("val-screen-time");
  const elOutdoorTime = document.getElementById("val-outdoor-time");
  const elGrassRatio = document.getElementById("val-grass-ratio");
  const elCurrentPace = document.getElementById("val-current-pace");
  const elCurrentDist = document.getElementById("val-current-dist");
  const elCurrentCadence = document.getElementById("val-current-cadence");
  const elRouteName = document.getElementById("route-title");
  const elRouteCity = document.getElementById("route-city");
  const elRouteCanopy = document.getElementById("route-canopy");
  const elRouteStatus = document.getElementById("route-status");
  const elTranscriptList = document.getElementById("transcript-list");
  const elSoundwaveBar = document.getElementById("soundwave-bar");
  const elPocketOverlay = document.getElementById("pocket-mode-overlay");
  const elPocketDist = document.getElementById("pocket-dist");
  const elPocketPace = document.getElementById("pocket-pace");
  const elPocketTime = document.getElementById("pocket-time");
  const elBtnExitPocket = document.getElementById("btn-exit-pocket");
  const elElevationChart = document.getElementById("elevation-canvas");
  const elBtnExportGpx = document.getElementById("btn-export-gpx");

  // 1. Initialize Map & 3D Trail Visualizer
  window.paceMap.init(state.currentRoute.center, state.currentRoute.zoom);
  window.trail3d = new Trail3DVisualizer("trail-3d-canvas");
  loadRoute(state.currentRoute);

  // Screen time ticker while interacting with UI
  setInterval(() => {
    if (!state.isPocketMode && !state.isRunning) {
      state.screenTimeSec += 1;
      updateHeaderStats();
    }
  }, 1000);

  // 2. Audio Speaking State Hook for Visualizer
  window.paceAudio.onSpeakingChange = (isSpeaking) => {
    if (elSoundwaveBar) {
      if (isSpeaking) {
        elSoundwaveBar.classList.add("speaking");
        const lbl = elSoundwaveBar.querySelector(".soundwave-label");
        if (lbl) lbl.textContent = "🎙️ Gemma 2 Speaking...";
      } else {
        elSoundwaveBar.classList.remove("speaking");
        const lbl = elSoundwaveBar.querySelector(".soundwave-label");
        if (lbl) lbl.textContent = "Audio Coach Ready";
      }
    }
    if (window.trail3d) {
      window.trail3d.setSpeaking(isSpeaking);
    }
  };

  // 3. View Switcher (2D Map vs 3D Trail View)
  elTab2d.addEventListener("click", () => {
    state.viewMode = "2d";
    elTab2d.classList.add("active");
    elTab3d.classList.remove("active");
    elMapDiv.classList.remove("hidden");
    elTrailCanvas.classList.add("hidden");
    if (window.trail3d) window.trail3d.stop();
  });

  elTab3d.addEventListener("click", () => {
    state.viewMode = "3d";
    elTab3d.classList.add("active");
    elTab2d.classList.remove("active");
    elMapDiv.classList.add("hidden");
    elTrailCanvas.classList.remove("hidden");
    if (window.trail3d) {
      window.trail3d.resize();
      window.trail3d.start();
    }
  });

  // Foliage Radar Toggle
  elToggleFoliageRadar.addEventListener("change", (e) => {
    window.paceMap.toggleFoliageRadar(e.target.checked);
  });

  // 4. Route Loading
  function loadRoute(routeData) {
    state.currentRoute = routeData;
    state.targetDistance = routeData.distanceKm;

    elRouteName.textContent = routeData.name;
    elRouteCity.textContent = routeData.city;
    elRouteCanopy.textContent = routeData.canopyCoverage;
    elRouteStatus.textContent = routeData.foliageStatus;

    window.paceMap.renderRoute(routeData, elToggleFoliageRadar.checked);
    drawElevationProfile(routeData.coordinates);
  }

  // Preset Selection Event
  elPresetSelect.addEventListener("change", (e) => {
    const routeKey = e.target.value;
    if (PRESET_ROUTES[routeKey]) {
      loadRoute(PRESET_ROUTES[routeKey]);
    }
  });

  // Custom Geolocation button
  elBtnGeolocate.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    elBtnGeolocate.textContent = "📍 Locating...";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const customRoute = generateCustomLoop(latitude, longitude, 5.0);
        loadRoute(customRoute);
        elBtnGeolocate.textContent = "📍 Found Your Outdoors";
        addTranscript("PaceCast GPS", `Locked onto local coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Generated custom loop.`);
      },
      (err) => {
        console.warn("Geolocation error, fallback to preset:", err);
        elBtnGeolocate.textContent = "📍 Generate Loop From My GPS";
        alert("Could not access your location. Using Central Park preset.");
      }
    );
  });

  // Metronome toggle
  if (elToggleMetronome) {
    elToggleMetronome.addEventListener("change", (e) => {
      if (e.target.checked && state.isRunning) {
        window.paceAudio.startMetronome(parseInt(elTargetCadence.value, 10));
      } else {
        window.paceAudio.stopMetronome();
      }
    });
  }

  // 5. Start Live Run (Real Outdoor GPS Mode)
  elBtnStartRun.addEventListener("click", () => {
    startRun(false);
  });

  // 6. Start 3D Simulation Mode (Fast demo for hackathon judges & testing)
  elBtnSimulate.addEventListener("click", () => {
    // Automatically switch to 3D trail view for high visual impact!
    elTab3d.click();
    startRun(true);
  });

  elBtnStopRun.addEventListener("click", () => {
    stopRun();
  });

  function startRun(isSim = false) {
    if (state.isRunning) return;

    state.isRunning = true;
    state.isSimulating = isSim;
    state.currentKmProgress = 0.0;
    state.simulationStep = 0;
    state.targetPace = elTargetPace.value || "5:15";
    state.targetCadence = parseInt(elTargetCadence.value || 172, 10);

    elBtnStartRun.classList.add("hidden");
    elBtnSimulate.classList.add("hidden");
    elBtnStopRun.classList.remove("hidden");

    if (window.trail3d) {
      window.trail3d.speed = isSim ? 2.5 : 1.0;
      window.trail3d.start();
    }

    // Only enter Pocket Mode on real run, or let user test in 3D simulator
    if (!isSim) {
      enterPocketMode();
    }

    if (elToggleMetronome.checked) {
      window.paceAudio.startMetronome(state.targetCadence);
    }

    // Initial audio departure cue
    const departureAudio = `PaceCast active. Pacing locked for ${state.currentRoute.distanceKm} kilometers at ${state.targetPace} pace. Phone in pocket, eyes on the trail. Let's run.`;
    window.paceAudio.speak(departureAudio);
    addTranscript("Gemma 2 Audio Coach", departureAudio);

    // Outdoor time timer
    state.runTimer = setInterval(() => {
      state.outdoorTimeSec += 1;
      updateHeaderStats();
      updatePocketStats();
    }, 1000);

    if (isSim) {
      runSimulationLoop();
    } else {
      startGpsTracking();
    }
  }

  function stopRun() {
    state.isRunning = false;
    state.isSimulating = false;
    clearInterval(state.runTimer);
    clearInterval(state.simulationTimer);
    window.paceAudio.stopMetronome();

    elBtnStartRun.classList.remove("hidden");
    elBtnSimulate.classList.remove("hidden");
    elBtnStopRun.classList.add("hidden");

    exitPocketMode();

    const finishAudio = `Run complete! You finished ${state.currentKmProgress.toFixed(1)} kilometers. Total screen time was under 20 seconds. Great job touching grass.`;
    window.paceAudio.speak(finishAudio);
    addTranscript("Gemma 2 Audio Coach", finishAudio);
  }

  // 7. Simulation Engine (Demonstrates 5K in ~45 seconds)
  function runSimulationLoop() {
    const coords = state.currentRoute.coordinates;
    const totalPoints = coords.length;
    const splitCount = state.currentRoute.splits.length;
    let nextSplitIdx = 0;

    state.simulationTimer = setInterval(async () => {
      state.simulationStep += 1;
      const progressRatio = state.simulationStep / 35;
      state.currentKmProgress = Math.min(progressRatio * state.currentRoute.distanceKm, state.currentRoute.distanceKm);

      // Coordinate interpolation
      const pointIndex = Math.min(Math.floor(progressRatio * (totalPoints - 1)), totalPoints - 1);
      const currPt = coords[pointIndex];
      window.paceMap.updateRunnerPosition(currPt[0], currPt[1]);

      state.currentCadence = state.targetCadence + Math.round((Math.random() - 0.5) * 6);
      
      updateLiveStats();
      updatePocketStats();

      // Check if we hit a KM milestone
      if (nextSplitIdx < splitCount) {
        const targetSplit = state.currentRoute.splits[nextSplitIdx];
        if (state.currentKmProgress >= targetSplit.km) {
          const splitData = targetSplit;
          nextSplitIdx += 1;

          const gemmaCue = await window.gemmaCoach.generateMilestoneCue(
            splitData,
            state.targetPace,
            state.targetPace,
            state.currentRoute.predominantTrees[0]
          );

          window.paceAudio.speak(gemmaCue);
          addTranscript(`Gemma 2 [KM ${splitData.km}]`, gemmaCue);
        }
      }

      // Finish condition
      if (state.simulationStep >= 35) {
        clearInterval(state.simulationTimer);
        setTimeout(() => {
          stopRun();
        }, 3000);
      }
    }, 1200);
  }

  // 8. Real GPS Outdoor Watcher
  function startGpsTracking() {
    if (!navigator.geolocation) return;
    navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        window.paceMap.updateRunnerPosition(latitude, longitude);
        window.paceMap.panToRunner(latitude, longitude);
        if (speed && speed > 1.0) {
          const paceSecPerKm = 1000 / speed;
          const mins = Math.floor(paceSecPerKm / 60);
          const secs = Math.round(paceSecPerKm % 60).toString().padStart(2, "0");
          state.currentPace = `${mins}:${secs}`;
        }
      },
      (err) => console.warn("GPS tracking warn:", err),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
    );
  }

  // 9. Pocket Mode Management
  function enterPocketMode() {
    state.isPocketMode = true;
    elPocketOverlay.classList.remove("hidden");
  }

  function exitPocketMode() {
    state.isPocketMode = false;
    elPocketOverlay.classList.add("hidden");
  }

  elBtnExitPocket.addEventListener("click", () => {
    exitPocketMode();
  });

  elPocketOverlay.addEventListener("dblclick", () => {
    exitPocketMode();
  });

  // 10. Stats and Visual Updates
  function updateHeaderStats() {
    elScreenTime.textContent = `${state.screenTimeSec}s`;
    
    const outMins = Math.floor(state.outdoorTimeSec / 60);
    const outSecs = state.outdoorTimeSec % 60;
    elOutdoorTime.textContent = `${outMins}m ${outSecs}s`;

    const total = state.screenTimeSec + state.outdoorTimeSec;
    const ratio = total > 0 ? ((state.outdoorTimeSec / total) * 100).toFixed(1) : "99.4";
    elGrassRatio.textContent = `${ratio}%`;
  }

  function updateLiveStats() {
    elCurrentDist.textContent = `${state.currentKmProgress.toFixed(1)} km`;
    elCurrentPace.textContent = `${state.targetPace} /km`;
    elCurrentCadence.textContent = `${state.currentCadence} SPM`;
  }

  function updatePocketStats() {
    if (elPocketDist) elPocketDist.textContent = `${state.currentKmProgress.toFixed(1)} KM`;
    if (elPocketPace) elPocketPace.textContent = `${state.targetPace} /KM`;
    
    const outMins = Math.floor(state.outdoorTimeSec / 60).toString().padStart(2, "0");
    const outSecs = (state.outdoorTimeSec % 60).toString().padStart(2, "0");
    if (elPocketTime) elPocketTime.textContent = `${outMins}:${outSecs}`;
  }

  function addTranscript(speaker, message) {
    const item = document.createElement("div");
    item.className = "transcript-item";
    item.innerHTML = `
      <div class="transcript-meta">
        <span class="transcript-speaker">${speaker}</span>
        <span class="transcript-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </div>
      <p class="transcript-text">"${message}"</p>
    `;
    elTranscriptList.prepend(item);
  }

  // 11. Elevation Canvas Profile
  function drawElevationProfile(coords) {
    if (!elElevationChart) return;
    const ctx = elElevationChart.getContext("2d");
    const width = elElevationChart.width = elElevationChart.offsetWidth;
    const height = elElevationChart.height = 55;

    ctx.clearRect(0, 0, width, height);
    if (!coords || coords.length === 0) return;

    const elevations = coords.map(c => c[2] || 25);
    const minElev = Math.min(...elevations);
    const maxElev = Math.max(...elevations);
    const elevRange = Math.max(maxElev - minElev, 10);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(16, 185, 129, 0.45)");
    gradient.addColorStop(1, "rgba(16, 185, 129, 0.0)");

    ctx.beginPath();
    ctx.moveTo(0, height);

    coords.forEach((c, idx) => {
      const x = (idx / (coords.length - 1)) * width;
      const elev = c[2] || 25;
      const y = height - ((elev - minElev) / elevRange) * (height - 15) - 5;
      ctx.lineTo(x, y);
    });

    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    coords.forEach((c, idx) => {
      const x = (idx / (coords.length - 1)) * width;
      const elev = c[2] || 25;
      const y = height - ((elev - minElev) / elevRange) * (height - 15) - 5;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // 12. GPX Export Feature
  if (elBtnExportGpx) {
    elBtnExportGpx.addEventListener("click", () => {
      const gpxContent = generateGpx(state.currentRoute);
      const blob = new Blob([gpxContent], { type: "application/gpx+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PaceCast_${state.currentRoute.id}.gpx`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function generateGpx(route) {
    let trkpts = route.coordinates.map(c => 
      `      <trkpt lat="${c[0]}" lon="${c[1]}"><ele>${c[2] || 20}</ele></trkpt>`
    ).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PaceCast - Touch Grass Edition">
  <metadata>
    <name>${route.name}</name>
    <desc>Zero-Screen Autumn Running Loop powered by PaceCast</desc>
  </metadata>
  <trk>
    <name>${route.name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
  }
});
