// PaceCast - OpenStreetMap Route & Canopy Data Engine
// Procedural and real-world running loops with rich tree canopy metadata

const PRESET_ROUTES = {
  central_park: {
    id: "central_park",
    name: "Central Park Autumn Reservoir & North Woods",
    city: "New York, NY",
    center: [40.785091, -73.968285],
    zoom: 14,
    distanceKm: 5.0,
    elevationGainM: 42,
    canopyCoverage: "88% Peak Deciduous",
    predominantTrees: ["Acer saccharum (Sugar Maple)", "Quercus rubra (Red Oak)", "Liquidambar (Sweetgum)"],
    foliageStatus: "Peak Crimson & Gold (Week 2 Oct)",
    // Closed-loop coordinates [lat, lng, elev, foliageDensity]
    coordinates: [
      [40.7828, -73.9654, 25, 0.9],
      [40.7845, -73.9642, 28, 0.95],
      [40.7871, -73.9625, 32, 0.85],
      [40.7905, -73.9602, 36, 0.9],
      [40.7932, -73.9585, 30, 0.95],
      [40.7955, -73.9572, 34, 0.8],
      [40.7972, -73.9590, 41, 0.9],
      [40.7958, -73.9628, 48, 0.95],
      [40.7935, -73.9660, 42, 0.9],
      [40.7902, -73.9695, 35, 0.85],
      [40.7870, -73.9720, 31, 0.8],
      [40.7842, -73.9705, 27, 0.85],
      [40.7828, -73.9654, 25, 0.9]
    ],
    splits: [
      { km: 1, lat: 40.7871, lng: -73.9625, cue: "Entering Bridal Path. Sugar maples overhead are dense and dropping crimson leaves. Keep shoulders relaxed." },
      { km: 2, lat: 40.7932, lng: -73.9585, cue: "Reservoir North bend. 15 feet elevation rise ahead. Shorten stride slightly, pump arms forward." },
      { km: 3, lat: 40.7958, lng: -73.9628, cue: "Highest elevation point: North Woods canopy. Air temp is 58 degrees. Inhale for three paces, exhale for three." },
      { km: 4, lat: 40.7870, lng: -73.9720, cue: "West Drive gentle descent. Let gravity carry your turnover. Cadence locked at 172 steps per minute." },
      { km: 5, lat: 40.7828, lng: -73.9654, cue: "Final straightaway! Loop complete. Great tempo rhythm. Walk out the final 200 meters and enjoy the cool breeze." }
    ]
  },
  burlington_foliage: {
    id: "burlington_foliage",
    name: "Lake Champlain & Waterfront Maple Ridge",
    city: "Burlington, VT",
    center: [44.4789, -73.2205],
    zoom: 14,
    distanceKm: 5.2,
    elevationGainM: 35,
    canopyCoverage: "94% Peak Northern Hardwoods",
    predominantTrees: ["Acer rubrum (Red Maple)", "Betula papyrifera (Paper Birch)", "Fagus grandifolia (Beech)"],
    foliageStatus: "100% Peak Color (Vibrant Amber)",
    coordinates: [
      [44.4752, -73.2215, 30, 0.95],
      [44.4785, -73.2230, 32, 0.9],
      [44.4820, -73.2245, 31, 0.85],
      [44.4862, -73.2258, 30, 0.95],
      [44.4895, -73.2235, 38, 1.0],
      [44.4880, -73.2185, 45, 0.9],
      [44.4845, -73.2160, 48, 0.85],
      [44.4802, -73.2175, 42, 0.9],
      [44.4770, -73.2195, 36, 0.95],
      [44.4752, -73.2215, 30, 0.95]
    ],
    splits: [
      { km: 1, lat: 44.4820, lng: -73.2245, cue: "Pacing along the waterfront bike path. Lake breeze off Champlain. Relax your jaw and breathe deep." },
      { km: 2, lat: 44.4895, lng: -73.2235, cue: "Entering the North Beach maple grove. Stunning scarlet canopy. Pace steady at 5:18 per kilometer." },
      { km: 3, lat: 44.4845, lng: -73.2160, cue: "Short hill up toward the tree line. Keep your cadence high, 175 steps per minute." },
      { km: 4, lat: 44.4770, lng: -73.2195, cue: "Descent through paper birches with bright yellow leaves. Soft footstrike." },
      { km: 5.2, lat: 44.4752, lng: -73.2215, cue: "Loop completed! 5.2 kilometers finished. Screen time under 15 seconds. Pure outdoor energy." }
    ]
  },
  portland_waterfront: {
    id: "portland_waterfront",
    name: "Willamette River Eastbank & Oak Grove Loop",
    city: "Portland, OR",
    center: [45.5185, -122.6685],
    zoom: 14,
    distanceKm: 4.8,
    elevationGainM: 22,
    canopyCoverage: "78% Mixed Evergreen & Maple",
    predominantTrees: ["Acer circinatum (Vine Maple)", "Pseudotsuga menziesii (Douglas Fir)", "Quercus garryana (Oregon White Oak)"],
    foliageStatus: "Golden Orange & Evergreen Mix",
    coordinates: [
      [45.5130, -122.6710, 15, 0.8],
      [45.5165, -122.6680, 14, 0.85],
      [45.5210, -122.6665, 14, 0.75],
      [45.5255, -122.6680, 16, 0.9],
      [45.5250, -122.6730, 24, 0.85],
      [45.5205, -122.6745, 20, 0.8],
      [45.5160, -122.6740, 18, 0.85],
      [45.5130, -122.6710, 15, 0.8]
    ],
    splits: [
      { km: 1, lat: 45.5165, lng: -122.6680, cue: "Crossing under Hawthorne. Crisp Pacific Northwest air. Lock in your baseline breathing rhythm." },
      { km: 2, lat: 45.5255, lng: -122.6680, cue: "Approaching Steel Bridge. Look up at the golden vine maples. Cadence is fluid and light." },
      { km: 3, lat: 45.5205, lng: -122.6745, cue: "Westbank esplanade. Halfway marker. 5:25 pace. Stay upright, core engaged." },
      { km: 4, lat: 45.5160, lng: -122.6740, cue: "Entering Governor Tom McCall Park. Cherry and oak leaves swirling on the pavement." },
      { km: 4.8, lat: 45.5130, lng: -122.6710, cue: "Done! 4.8 kilometers conquered without a single glance at your screen." }
    ]
  },
  hyde_park: {
    id: "hyde_park",
    name: "The Serpentine & Kensington Gardens Autumn Circuit",
    city: "London, UK",
    center: [51.5072, -0.1755],
    zoom: 14,
    distanceKm: 5.5,
    elevationGainM: 26,
    canopyCoverage: "85% Royal Parks Autumn Canopy",
    predominantTrees: ["Platanus x acerifolia (London Plane)", "Castanea sativa (Sweet Chestnut)", "Quercus robur (English Oak)"],
    foliageStatus: "Rich Gold & Russet Autumn",
    coordinates: [
      [51.5035, -0.1600, 20, 0.85],
      [51.5065, -0.1650, 22, 0.9],
      [51.5090, -0.1730, 24, 0.95],
      [51.5120, -0.1800, 28, 0.85],
      [51.5095, -0.1880, 26, 0.9],
      [51.5050, -0.1860, 23, 0.85],
      [51.5025, -0.1770, 21, 0.8],
      [51.5035, -0.1600, 20, 0.85]
    ],
    splits: [
      { km: 1, lat: 51.5065, lng: -0.1650, cue: "Passing the Serpentine lake. Crisp British autumn morning. Gentle morning light through plane trees." },
      { km: 2, lat: 51.5090, lng: -0.1730, cue: "Approaching Kensington Palace gardens. Golden sweet chestnut canopy overhead." },
      { km: 3, lat: 51.5095, lng: -0.1880, cue: "West gate loop. 170 steps per minute. Breathing smooth and steady." },
      { km: 4, lat: 51.5025, lng: -0.1770, cue: "South carriage drive. Slight tailwind. Open up your stride for the final kilometer." },
      { km: 5.5, lat: 51.5035, lng: -0.1600, cue: "Finish line! 5.5 kilometers complete. Excellent cadence." }
    ]
  }
};

// Procedural loop generator for ANY custom user GPS coordinates
function generateCustomLoop(lat, lng, targetKm = 5.0) {
  const points = [];
  const numPoints = 16;
  // Radius roughly approximates target loop distance: Circumference = 2 * PI * r
  const radiusKm = targetKm / (2 * Math.PI) * 0.9;
  const latDelta = radiusKm / 111.0;
  const lngDelta = radiusKm / (111.0 * Math.cos(lat * Math.PI / 180));

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    // Add realistic perturbation for organic road winding
    const jitter = 1 + 0.18 * Math.sin(angle * 3) + 0.08 * Math.cos(angle * 5);
    const pLat = lat + Math.sin(angle) * latDelta * jitter;
    const pLng = lng + Math.cos(angle) * lngDelta * jitter;
    const elev = Math.round(20 + 15 * Math.sin(angle * 2) + Math.random() * 5);
    const foliage = 0.75 + 0.25 * Math.sin(angle);
    points.push([pLat, pLng, elev, foliage]);
  }

  // Generate splits
  const splitInterval = targetKm / 5;
  const splits = [];
  for (let s = 1; s <= 5; s++) {
    const kmMark = (s * splitInterval).toFixed(1);
    const ptIndex = Math.min(Math.round((s / 5) * (points.length - 1)), points.length - 1);
    const pt = points[ptIndex];
    splits.push({
      km: parseFloat(kmMark),
      lat: pt[0],
      lng: pt[1],
      cue: `Kilometer ${kmMark} split reached. Maintain smooth arm turnover and rhythmic 3-step breathing.`
    });
  }

  return {
    id: "custom_user_route",
    name: `Local ${targetKm}K Autumn Canopy Loop`,
    city: "Your Local Outdoors",
    center: [lat, lng],
    zoom: 14,
    distanceKm: parseFloat(targetKm),
    elevationGainM: 32,
    canopyCoverage: "82% Shaded Pedestrian Trails",
    predominantTrees: ["Native Mixed Deciduous", "Autumn Canopy"],
    foliageStatus: "Active Autumn Turning",
    coordinates: points,
    splits: splits
  };
}
