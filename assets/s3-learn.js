(() => {
  const c = 299_792_458;
  const displayLimit = 6;
  const bandwidth = document.getElementById("lab-bandwidth");
  const pitch = document.getElementById("lab-pitch");
  const canvas = document.getElementById("lab-response");
  const result = document.getElementById("lab-result");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  function pointResponse(offset, nullDistance) {
    const phase = Math.PI * offset / nullDistance;
    return phase === 0 ? 1 : Math.abs(Math.sin(phase) / phase);
  }

  function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bandwidthMHz = Number(bandwidth.value);
    const spacing = Number(pitch.value);
    const nullDistance = c / (2 * bandwidthMHz * 1e6);
    const left = 38;
    const right = width - 17;
    const top = 28;
    const bottom = height - 46;
    const xAt = x => left + (x + displayLimit) / (2 * displayLimit) * (right - left);
    const yAt = y => bottom - y * (bottom - top);

    ctx.font = "12px system-ui, sans-serif";
    ctx.fillStyle = "#354858";
    ctx.textAlign = "left";
    ctx.fillText("Normalized amplitude", left, 14);
    for (const tick of [0, 0.5, 1]) {
      const y = yAt(tick);
      ctx.strokeStyle = "#c6d9df";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
      ctx.textAlign = "right";
      ctx.fillText(String(tick), left - 6, y + 4);
    }
    ctx.textAlign = "center";
    for (const tick of [-6, -3, 0, 3, 6]) {
      ctx.fillText(String(tick), xAt(tick), bottom + 17);
    }
    ctx.fillText("Slant-range offset (m)", (left + right) / 2, height - 8);

    ctx.strokeStyle = "#0b6d82";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 480; i++) {
      const x = displayLimit * (i / 240 - 1);
      const y = pointResponse(x, nullDistance);
      if (i === 0) ctx.moveTo(xAt(x), yAt(y));
      else ctx.lineTo(xAt(x), yAt(y));
    }
    ctx.stroke();

    ctx.fillStyle = "#984516";
    const count = Math.floor(displayLimit / spacing);
    for (let i = -count; i <= count; i++) {
      const x = i * spacing;
      ctx.beginPath();
      ctx.arc(xAt(x), yAt(pointResponse(x, nullDistance)), 3, 0, 2 * Math.PI);
      ctx.fill();
    }
    result.textContent = `At ${bandwidthMHz} MHz, the first null is ${nullDistance.toFixed(2)} m from the peak. The example samples the response every ${spacing.toFixed(2)} m.`;
  }

  bandwidth.closest(".learn-controls").hidden = false;
  canvas.closest(".learn-response").hidden = false;
  bandwidth.addEventListener("change", draw);
  pitch.addEventListener("change", draw);
  new ResizeObserver(draw).observe(canvas);
  draw();
})();
