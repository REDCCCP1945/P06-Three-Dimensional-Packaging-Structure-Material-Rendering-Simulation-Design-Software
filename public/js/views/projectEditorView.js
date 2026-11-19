const ProjectEditorView = {
  project: null,
  materials: [],
  yaw: -0.6,
  pitch: 0.35,
  zoom: 1,
  drag: null,

  render: async function (container, params) {
    ProjectEditorView.yaw = -0.6;
    ProjectEditorView.pitch = 0.35;
    ProjectEditorView.zoom = 1;
    const data = (await API.get("/api/projects/" + params.id)).data;
    ProjectEditorView.project = data.project;
    ProjectEditorView.materials = data.materials;
    const project = data.project;
    const readOnly = App.user.role === "VIEWER";
    container.innerHTML = UI.pageHead(project.name, project.code + " · " + (data.boxNames[project.boxType] || project.boxType),
      '<a class="btn" href="#/projects">返回列表</a>' +
      (readOnly ? "" : '<button class="btn primary" id="save-project">保存</button><button class="btn" id="save-version">保存版本</button><button class="btn" id="make-eco">生成评估</button>') +
      '<button class="btn" id="share-project">分享</button><button class="btn" id="export-png">导出PNG</button><button class="btn" id="export-svg">导出SVG</button>') +
      '<div class="editor-grid"><div class="card"><div class="card-head"><h3>结构参数</h3><span class="muted">毫米</span></div><div class="card-body">' +
      '<form id="editor-form"><div class="form-grid">' +
      '<div class="field full"><label>项目名称</label><input class="input" name="name" value="' + UI.esc(project.name) + '"' + (readOnly ? " disabled" : "") + '></div>' +
      '<div class="field"><label>盒型</label><select class="input" name="boxType"' + (readOnly ? " disabled" : "") + '>' + UI.optionList(data.boxTypes.map(function (key) { return { value: key, label: data.boxNames[key] }; }), project.boxType) + '</select></div>' +
      '<div class="field"><label>长</label><input class="input" name="length" type="number" min="10" max="1000" value="' + project.length + '"' + (readOnly ? " disabled" : "") + '></div>' +
      '<div class="field"><label>宽</label><input class="input" name="width" type="number" min="10" max="1000" value="' + project.width + '"' + (readOnly ? " disabled" : "") + '></div>' +
      '<div class="field"><label>高</label><input class="input" name="height" type="number" min="10" max="1000" value="' + project.height + '"' + (readOnly ? " disabled" : "") + '></div>' +
      '<div class="field"><label>克重/厚度</label><input class="input" name="caliper" type="number" step="0.1" min="0.2" max="5" value="' + project.caliper + '"' + (readOnly ? " disabled" : "") + '></div>' +
      '<div class="field"><label>材料</label><select class="input" name="materialId"' + (readOnly ? " disabled" : "") + '>' + UI.optionList(data.materials.map(function (item) { return { value: item.id, label: item.name + " / " + item.grammage + "g" }; }), project.materialId) + '</select></div>' +
      '<div class="field"><label>颜色</label><input class="input" name="color" type="color" value="' + project.color + '"' + (readOnly ? " disabled" : "") + '></div>' +
      '<div class="field"><label>纹理</label><select class="input" name="pattern"' + (readOnly ? " disabled" : "") + '>' + UI.optionList(data.patterns, project.pattern) + '</select></div>' +
      '<div class="field full"><label>说明</label><textarea class="input" name="description" rows="2"' + (readOnly ? " disabled" : "") + '>' + UI.esc(project.description) + '</textarea></div>' +
      '</div></form></div></div>' +
      '<div class="editor-main"><div class="card"><div class="card-head"><h3>三维预览</h3><span class="muted">拖拽旋转 · 滚轮缩放</span></div><div class="card-body"><canvas id="view3d" width="760" height="380"></canvas></div></div>' +
      '<div class="card"><div class="card-head"><h3>刀版图</h3><span class="muted">实线切线 · 虚线折线</span></div><div class="card-body"><canvas id="dieline" width="760" height="300"></canvas></div></div></div>' +
      '<div class="editor-side"><div class="card"><div class="card-head"><h3>BOM与环保</h3><span class="muted">固定公式</span></div><div class="card-body" id="summary-box"></div></div>' +
      '<div class="card"><div class="card-head"><h3>版本记录</h3><a href="#/versions/' + UI.esc(project.id) + '">全部</a></div><div class="card-body">' +
      (data.versions.length ? data.versions.slice(0, 4).map(function (item) {
        return '<div class="version-row"><strong>' + UI.esc(item.label) + '</strong><span>' + UI.fmtDateTime(item.createdAt) + '</span></div>';
      }).join("") : UI.empty("暂无版本", "保存后可回看")) + '</div></div>' +
      '<div class="card"><div class="card-head"><h3>最近评估</h3><a href="#/assessments?projectId=' + UI.esc(project.id) + '">查看</a></div><div class="card-body">' +
      (data.assessments.length ? data.assessments.slice(0, 3).map(function (item) {
        return '<div class="version-row"><a href="#/assessments/' + UI.esc(item.id) + '">' + UI.esc(item.id) + '</a><span>' + item.score + ' 分</span></div>';
      }).join("") : UI.empty("暂无评估", "点击生成评估")) + '</div></div></div></div>';

    const canvas3d = container.querySelector("#view3d");
    const canvasDie = container.querySelector("#dieline");
    const form = container.querySelector("#editor-form");
    function current() {
      const values = UI.formData(form);
      return {
        boxType: values.boxType,
        length: Number(values.length),
        width: Number(values.width),
        height: Number(values.height),
        caliper: Number(values.caliper),
        materialId: values.materialId,
        color: values.color,
        pattern: values.pattern
      };
    }
    function redraw() {
      ProjectEditorView.draw3D(canvas3d, current());
      ProjectEditorView.drawDieline(canvasDie, current());
      ProjectEditorView.renderSummary(container, current());
    }
    form.addEventListener("input", redraw);
    form.addEventListener("change", redraw);
    canvas3d.addEventListener("pointerdown", function (event) {
      ProjectEditorView.drag = { x: event.clientX, y: event.clientY, yaw: ProjectEditorView.yaw, pitch: ProjectEditorView.pitch };
      canvas3d.setPointerCapture(event.pointerId);
    });
    canvas3d.addEventListener("pointermove", function (event) {
      if (!ProjectEditorView.drag) return;
      ProjectEditorView.yaw = ProjectEditorView.drag.yaw + (event.clientX - ProjectEditorView.drag.x) * 0.01;
      ProjectEditorView.pitch = Math.max(-1.2, Math.min(1.2, ProjectEditorView.drag.pitch + (event.clientY - ProjectEditorView.drag.y) * 0.008));
      redraw();
    });
    canvas3d.addEventListener("pointerup", function () { ProjectEditorView.drag = null; });
    canvas3d.addEventListener("wheel", function (event) {
      event.preventDefault();
      ProjectEditorView.zoom = Box3D.zoomClamp(ProjectEditorView.zoom - event.deltaY * 0.001);
      redraw();
    }, { passive: false });

    const save = container.querySelector("#save-project");
    if (save) {
      save.addEventListener("click", async function () {
        try {
          await API.put("/api/projects/" + project.id, Object.assign(UI.formData(form), { code: project.code }));
          UI.toast("已保存", "success");
        } catch (error) { UI.showError(form, error); }
      });
    }
    const version = container.querySelector("#save-version");
    if (version) {
      version.addEventListener("click", function () { ProjectEditorView.saveVersion(project, container, params); });
    }
    const eco = container.querySelector("#make-eco");
    if (eco) {
      eco.addEventListener("click", async function () {
        try {
          const result = await API.post("/api/assessments", { projectId: project.id });
          UI.toast("评估已生成", "success");
          location.hash = "#/assessments/" + result.data.assessment.id;
        } catch (error) { UI.toast(error.message, "error"); }
      });
    }
    container.querySelector("#share-project").addEventListener("click", async function () {
      try {
        const result = await API.post("/api/projects/" + project.id + "/share", {});
        const url = location.origin + result.data.url;
        UI.modal({ title: "分享链接", size: "narrow", body: '<p class="mono" style="word-break:break-all">' + UI.esc(url) + '</p><p class="muted">有效期24小时，分享页不显示成本与碳排。</p>' });
      } catch (error) { UI.toast(error.message, "error"); }
    });
    container.querySelector("#export-png").addEventListener("click", function () {
      const link = document.createElement("a");
      link.href = canvas3d.toDataURL("image/png");
      link.download = project.code + "-3d.png";
      link.click();
    });
    container.querySelector("#export-svg").addEventListener("click", function () {
      const svg = ProjectEditorView.buildSvg(current());
      UI.downloadText(project.code + "-dieline.svg", svg, "image/svg+xml");
    });
    redraw();
  },

  material: function (values) {
    return ProjectEditorView.materials.find(function (item) { return item.id === values.materialId; }) || ProjectEditorView.materials[0];
  },

  summary: function (values) {
    const material = ProjectEditorView.material(values);
    const area = Math.round(2 * (values.length * values.width + values.length * values.height + values.width * values.height) * 1.15 / 10000) / 100;
    const weight = Math.round(area * material.grammage / 1000 * 10000) / 10000;
    const cost = Math.round(area * material.costPerSqm * 100) / 100;
    const carbon = Math.round(weight * material.carbonFactor * 10000) / 10000;
    const carbonScore = Math.max(0, Math.min(100, 100 - carbon * 40));
    const score = Math.round(material.recyclable * 0.6 + carbonScore * 0.4);
    const conclusion = score >= 85 ? "材料可回收性高，碳排较低，建议保留该方案。" : score >= 70 ? "整体表现良好，可比较更低克重或更高可回收材料。" : score >= 55 ? "环保表现一般，建议评估再生材料与结构减量。" : "环保表现偏低，建议更换材料或减小包装体积。";
    return { material: material, area: area, weight: weight, cost: cost, carbon: carbon, score: score, conclusion: conclusion };
  },

  renderSummary: function (container, values) {
    const summary = ProjectEditorView.summary(values);
    container.querySelector("#summary-box").innerHTML =
      '<div class="metric-grid">' +
      '<div class="metric"><strong>' + summary.area + '</strong><span>面积 m²</span></div>' +
      '<div class="metric"><strong>' + summary.weight + '</strong><span>重量 kg</span></div>' +
      '<div class="metric"><strong>' + summary.cost + '</strong><span>成本 元</span></div>' +
      '<div class="metric"><strong>' + summary.score + '</strong><span>环保分</span></div>' +
      '</div><div class="note-box">材料：' + UI.esc(summary.material.name) + ' · 可回收分 ' + summary.material.recyclable +
      ' · 碳排 ' + summary.carbon + ' kg<br>' + UI.esc(summary.conclusion) + '</div>' +
      '<p class="muted">面积=2(LW+LH+WH)×1.15；重量=面积×克重；成本=面积×单价；碳排=重量×碳因子。</p>';
  },

  draw3D: function (canvas, values) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#101822");
    gradient.addColorStop(1, "#080d13");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    const material = ProjectEditorView.material(values);
    const base = new THREE_COLOR(values.color);
    const fitZoom = ProjectEditorView.zoom * Math.min(1, 360 / Math.max(values.length, values.width, values.height));
    const verts = Box3D.vertices(values.length, values.width, values.height).map(function (point) {
      const rotated = Box3D.rotatePoint(point, ProjectEditorView.yaw, ProjectEditorView.pitch);
      return Object.assign({}, Box3D.project(rotated, fitZoom, w, h), { z: rotated.z });
    });
    const faces = Box3D.FACES.map(function (indices) {
      const points = indices.map(function (index) { return verts[index]; });
      return { points: points, depth: Box3D.faceDepth(points) };
    }).sort(function (a, b) { return a.depth - b.depth; });
    const light = { x: -0.4, y: 0.72, z: 0.55 };
    faces.forEach(function (face) {
      const normal = Box3D.normal(face.points);
      const shade = Box3D.shade(normal, light);
      const color = base.scale(shade);
      ctx.beginPath();
      ctx.moveTo(face.points[0].x, face.points[0].y);
      for (let i = 1; i < face.points.length; i += 1) ctx.lineTo(face.points[i].x, face.points[i].y);
      ctx.closePath();
      ctx.globalAlpha = values.pattern === "transparent" ? 0.62 : 1;
      ctx.fillStyle = "rgb(" + color.r + "," + color.g + "," + color.b + ")";
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.fillStyle = "rgba(230,240,245,0.75)";
    ctx.font = "12px SimSun";
    ctx.fillText(values.length + " × " + values.width + " × " + values.height + " mm", 18, h - 18);
    ctx.fillText(material.name + " · " + values.pattern, 18, h - 38);
  },

  drawDieline: function (canvas, values) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0d1218";
    ctx.fillRect(0, 0, w, h);
    const layout = DieLine.net(values.boxType, values.length, values.width, values.height);
    const extent = DieLine.extent(layout);
    const scale = Math.min((w - 80) / extent.width, (h - 70) / extent.height);
    const offsetX = (w - extent.width * scale) / 2;
    const offsetY = (h - extent.height * scale) / 2;
    layout.panels.forEach(function (panel) {
      const x = offsetX + panel.x * scale;
      const y = offsetY + panel.y * scale;
      ctx.fillStyle = "rgba(200,220,225,0.06)";
      ctx.fillRect(x, y, panel.w * scale, panel.h * scale);
      ctx.strokeStyle = panel.fold ? "#e0a43a" : "#9fd8cf";
      ctx.lineWidth = panel.fold ? 1.4 : 1.8;
      ctx.setLineDash(panel.fold ? [6, 4] : []);
      ctx.strokeRect(x, y, panel.w * scale, panel.h * scale);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(220,235,240,0.65)";
      ctx.font = "10px SimSun";
      if (panel.w * scale > 40 && panel.h * scale > 18) ctx.fillText(panel.name, x + 4, y + 14);
    });
    ctx.fillStyle = "rgba(200,220,225,0.55)";
    ctx.font = "11px SimSun";
    ctx.fillText("刀版展开 " + extent.width + " × " + extent.height + " mm · 切线" + layout.cutCount + " · 折线" + layout.foldCount, 18, h - 16);
  },

  buildSvg: function (values) {
    const layout = DieLine.net(values.boxType, values.length, values.width, values.height);
    const extent = DieLine.extent(layout);
    let body = "";
    layout.panels.forEach(function (panel) {
      body += '<rect x="' + panel.x + '" y="' + panel.y + '" width="' + panel.w + '" height="' + panel.h + '" fill="none" stroke="' + (panel.fold ? "#E0A43A" : "#1F6F5F") + '" stroke-width="1.2"' + (panel.fold ? ' stroke-dasharray="6 4"' : "") + "/>";
      body += '<text x="' + (panel.x + 3) + '" y="' + (panel.y + 12) + '" font-size="9" fill="#555">' + panel.name + "</text>";
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + extent.width + '" height="' + extent.height + '" viewBox="0 0 ' + extent.width + " " + extent.height + '"><rect width="100%" height="100%" fill="#FFFFFF"/>' + body + "</svg>";
  },

  saveVersion: function (project, container, params) {
    const body = '<form id="version-form"><div class="field"><label>版本名称</label><input class="input" name="label" value="方案 ' + new Date().toLocaleDateString("zh-CN") + '"></div></form>';
    UI.modal({
      title: "保存版本",
      size: "narrow",
      body: body,
      buttons: [
        { text: "取消" },
        { text: "保存", className: "primary", onClick: async function (api) {
          const form = api.find("#version-form");
          try {
            await API.post("/api/versions", { projectId: project.id, label: form.label.value });
            api.close();
            UI.toast("版本已保存", "success");
            ProjectEditorView.render(container, params);
          } catch (error) { UI.showError(form, error); }
        } }
      ]
    });
  }
};

function THREE_COLOR(hex) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return {
    scale: function (factor) {
      return {
        r: Math.round(r * factor),
        g: Math.round(g * factor),
        b: Math.round(b * factor)
      };
    }
  };
}

App.register("editor", ProjectEditorView);
