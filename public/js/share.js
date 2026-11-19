(async function () {
  const token = new URLSearchParams(location.search).get("token") || "";
  const title = document.getElementById("share-title");
  const sub = document.getElementById("share-sub");
  const meta = document.getElementById("share-meta");
  if (!token) {
    title.textContent = "链接无效";
    sub.textContent = "缺少分享令牌";
    return;
  }
  try {
    const response = await fetch("/api/share/" + encodeURIComponent(token));
    const payload = await response.json();
    if (!response.ok || payload.code !== 0) {
      title.textContent = "链接不可用";
      sub.textContent = payload.message || "链接不存在或已过期";
      return;
    }
    const project = payload.data.project;
    const summary = payload.data.summary || {};
    title.textContent = project.name;
    sub.textContent = project.code + " · 有效期至 " + new Date(project.shareExpiresAt).toLocaleString("zh-CN", { hour12: false });
    meta.innerHTML = [
      ["盒型", { tuck: "管式折叠盒", mailer: "飞机盒", sleeve: "套筒盒" }[project.boxType] || project.boxType],
      ["尺寸", project.length + " × " + project.width + " × " + project.height + " mm"],
      ["克重/厚度", project.caliper + " mm"],
      ["材料", project.materialName],
      ["面积", summary.areaSqm + " m²"],
      ["重量", summary.weightKg + " kg"],
      ["可回收分", summary.recyclable],
      ["环保分", summary.score],
      ["负责人", project.ownerName]
    ].map(function (item) { return item[0] + "：<b>" + item[1] + "</b>"; }).join("<br>");
    draw(project);
  } catch (error) {
    title.textContent = "无法加载";
    sub.textContent = "请确认本机服务已启动";
  }

  function draw(project) {
    const canvas = document.getElementById("share3d");
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#101822");
    gradient.addColorStop(1, "#080d13");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    const fit = Math.min(1, 360 / Math.max(project.length, project.width, project.height));
    const verts = Box3D.vertices(project.length, project.width, project.height).map(function (point) {
      const rotated = Box3D.rotatePoint(point, -0.6, 0.35);
      return Object.assign({}, Box3D.project(rotated, fit, w, h), { z: rotated.z });
    });
    const faces = Box3D.FACES.map(function (indices) {
      const points = indices.map(function (index) { return verts[index]; });
      return { points: points, depth: Box3D.faceDepth(points) };
    }).sort(function (a, b) { return a.depth - b.depth; });
    const hex = project.color.replace("#", "");
    const base = { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
    const light = { x: -0.4, y: 0.72, z: 0.55 };
    faces.forEach(function (face) {
      const shade = Box3D.shade(Box3D.normal(face.points), light);
      ctx.beginPath();
      ctx.moveTo(face.points[0].x, face.points[0].y);
      for (let i = 1; i < face.points.length; i += 1) ctx.lineTo(face.points[i].x, face.points[i].y);
      ctx.closePath();
      ctx.fillStyle = "rgb(" + Math.round(base.r * shade) + "," + Math.round(base.g * shade) + "," + Math.round(base.b * shade) + ")";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.stroke();
    });
    ctx.fillStyle = "rgba(220,235,240,0.65)";
    ctx.font = "12px SimSun";
    ctx.fillText(project.length + " × " + project.width + " × " + project.height + " mm", 16, h - 18);
  }
})();
