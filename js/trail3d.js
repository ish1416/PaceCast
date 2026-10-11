// PaceCast - 3D Autumn Canopy Trail Canvas & Stride Visualizer
// High-performance 60FPS particle & perspective trail simulator

class Trail3DVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.animationFrame = null;
    this.isRunning = false;
    this.speed = 1.0;
    this.distanceProgress = 0;
    this.roadOffset = 0;
    
    // Leaf Particles
    this.leaves = [];
    this.maxLeaves = 45;
    this.leafColors = ["#ef4444", "#f97316", "#f59e0b", "#fbbf24", "#dc2626"];

    // Soundwave / Cadence Wave
    this.wavePhase = 0;
    this.isSpeaking = false;

    if (this.canvas) {
      this.resize();
      window.addEventListener("resize", () => this.resize());
      this.initLeaves();
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.parentElement.clientWidth || 800;
    this.canvas.height = this.canvas.parentElement.clientHeight || 450;
  }

  initLeaves() {
    this.leaves = [];
    for (let i = 0; i < this.maxLeaves; i++) {
      this.leaves.push({
        x: Math.random() * (this.canvas ? this.canvas.width : 800),
        y: Math.random() * (this.canvas ? this.canvas.height : 450),
        size: 4 + Math.random() * 8,
        speedX: -1 + Math.random() * 2,
        speedY: 1 + Math.random() * 2.5,
        rotation: Math.random() * 360,
        rotSpeed: -3 + Math.random() * 6,
        color: this.leafColors[Math.floor(Math.random() * this.leafColors.length)],
        depth: 0.2 + Math.random() * 0.8
      });
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  setSpeaking(speaking) {
    this.isSpeaking = speaking;
  }

  animate() {
    if (!this.isRunning || !this.ctx) return;

    this.render();
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Sky & Atmospheric Forest Gradient (Golden Hour Autumn)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, "#090d16");
    skyGrad.addColorStop(0.35, "#1e140d");
    skyGrad.addColorStop(0.55, "#381a0b");
    skyGrad.addColorStop(1, "#07090d");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Autumn Tree Canopy Silhouette in Horizon
    this.drawTreeCanopyHorizon(ctx, w, h);

    // 3. Perspective 3D Trail / Road
    this.drawPerspectiveTrail(ctx, w, h);

    // 4. Falling 3D Autumn Leaves
    this.updateAndDrawLeaves(ctx, w, h);

    // 5. Stride Cadence & Gemma Audio Equalizer Waveform Overlay
    this.drawAudioCadenceWave(ctx, w, h);
  }

  drawTreeCanopyHorizon(ctx, w, h) {
    const horizonY = h * 0.42;

    // Distant golden canopy glow
    ctx.beginPath();
    ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
    ctx.arc(w * 0.5, horizonY - 10, w * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Tree silhouettes along the sides of the trail
    const treeColors = ["#451a03", "#78350f", "#9a3412", "#b45309"];
    for (let i = 0; i < 18; i++) {
      const isLeft = i % 2 === 0;
      const xRatio = isLeft ? 0.05 + (i * 0.02) : 0.95 - (i * 0.02);
      const x = w * xRatio;
      const treeH = 60 + (i * 8);
      const treeW = 35 + (i * 5);
      const y = horizonY + (i * 12);

      ctx.beginPath();
      ctx.fillStyle = treeColors[i % treeColors.length];
      // Draw stylized pine / maple canopy
      ctx.ellipse(x, y - treeH * 0.6, treeW * 0.5, treeH * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPerspectiveTrail(ctx, w, h) {
    const horizonY = h * 0.45;
    const topWidth = w * 0.08;
    const bottomWidth = w * 0.72;

    // Trail base polygon (Dirt / Autumn pavement path)
    ctx.beginPath();
    ctx.moveTo((w - topWidth) / 2, horizonY);
    ctx.lineTo((w + topWidth) / 2, horizonY);
    ctx.lineTo((w + bottomWidth) / 2, h);
    ctx.lineTo((w - bottomWidth) / 2, h);
    ctx.closePath();

    const trailGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    trailGrad.addColorStop(0, "#1f2937");
    trailGrad.addColorStop(1, "#111827");
    ctx.fillStyle = trailGrad;
    ctx.fill();

    // Trail border glow lines (Neon Emerald PaceCast theme)
    ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo((w - topWidth) / 2, horizonY);
    ctx.lineTo((w - bottomWidth) / 2, h);
    ctx.moveTo((w + topWidth) / 2, horizonY);
    ctx.lineTo((w + bottomWidth) / 2, h);
    ctx.stroke();

    // Moving Center Dashes (Simulates running motion)
    this.roadOffset = (this.roadOffset + 4 * this.speed) % 40;
    ctx.strokeStyle = "rgba(52, 211, 153, 0.7)";
    ctx.lineWidth = 2.5;

    for (let y = horizonY + this.roadOffset; y < h; y += 38) {
      const progress = (y - horizonY) / (h - horizonY);
      const dashLen = 10 + progress * 24;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, y);
      ctx.lineTo(w * 0.5, Math.min(y + dashLen, h));
      ctx.stroke();
    }
  }

  updateAndDrawLeaves(ctx, w, h) {
    this.leaves.forEach(leaf => {
      leaf.x += leaf.speedX * this.speed;
      leaf.y += leaf.speedY * this.speed;
      leaf.rotation += leaf.rotSpeed;

      // Wrap around
      if (leaf.y > h + 10) {
        leaf.y = -10;
        leaf.x = Math.random() * w;
      }
      if (leaf.x < -20) leaf.x = w + 10;
      if (leaf.x > w + 20) leaf.x = -10;

      // Draw leaf
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate((leaf.rotation * Math.PI) / 180);
      ctx.fillStyle = leaf.color;
      ctx.shadowColor = leaf.color;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.ellipse(0, 0, leaf.size * leaf.depth, leaf.size * 0.5 * leaf.depth, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  drawAudioCadenceWave(ctx, w, h) {
    this.wavePhase += 0.08;
    const waveY = h - 35;
    const numPoints = 64;

    ctx.beginPath();
    ctx.strokeStyle = this.isSpeaking ? "#38bdf8" : "#10b981";
    ctx.lineWidth = this.isSpeaking ? 3.5 : 2;
    ctx.shadowColor = this.isSpeaking ? "#38bdf8" : "#10b981";
    ctx.shadowBlur = this.isSpeaking ? 16 : 8;

    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * w;
      const amp = this.isSpeaking ? 18 : 6;
      const freq = this.isSpeaking ? 4 : 2;
      const y = waveY + Math.sin(this.wavePhase * freq + (i * 0.25)) * amp * Math.sin((i / numPoints) * Math.PI);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // HUD Text above wave
    ctx.font = "600 12px Outfit, sans-serif";
    ctx.fillStyle = this.isSpeaking ? "#38bdf8" : "#a7f3d0";
    ctx.textAlign = "center";
    const statusText = this.isSpeaking 
      ? "🎙️ GEMMA 2 AUDIO COACH ACTIVE — EARS UP, EYES ON TRAIL"
      : "🏃 CADENCE SYNCHRONIZED — 172 STEPS / MINUTE &bull; POCKET MODE READY";
    ctx.fillText(statusText, w * 0.5, waveY - 14);
  }
}

window.Trail3DVisualizer = Trail3DVisualizer;
