const AssessmentDetailView = {
  render: async function (container, params) {
    const data = (await API.get("/api/assessments/" + params.id)).data;
    const row = data.assessment;
    container.innerHTML = UI.pageHead("评估 " + row.id, row.projectName + " · " + row.materialName,
      '<a class="btn" href="#/assessments">返回列表</a><button class="btn" id="export-json">导出JSON</button><button class="btn primary" id="export-csv">导出CSV</button>') +
      '<div class="kpi-grid">' +
      '<div class="kpi"><strong>' + row.areaSqm + '</strong><span>面积 m²</span></div>' +
      '<div class="kpi"><strong>' + row.weightKg + '</strong><span>重量 kg</span></div>' +
      '<div class="kpi"><strong>' + row.cost + '</strong><span>成本 元</span></div>' +
      '<div class="kpi"><strong>' + row.carbonKg + '</strong><span>碳排 kg</span></div>' +
      '<div class="kpi"><strong>' + row.recyclable + '</strong><span>可回收分</span></div>' +
      '<div class="kpi"><strong>' + row.score + '</strong><span>综合分</span></div>' +
      '</div>' +
      '<div class="two-col"><div class="card"><div class="card-head"><h3>指标与结论</h3><span class="muted">固定公式</span></div><div class="card-body">' +
      Charts.hbars([
        { name: "可回收分", value: row.recyclable },
        { name: "碳排评分", value: Math.max(0, Math.min(100, 100 - row.carbonKg * 40)) },
        { name: "综合分", value: row.score }
      ]) +
      '<div class="note-box" style="margin-top:16px">' + UI.esc(row.conclusion) + '</div></div></div>' +
      '<div class="card"><div class="card-head"><h3>计算依据</h3><span class="muted">可复算</span></div><div class="card-body">' +
      '<table class="info-table"><tbody>' +
      '<tr><td>项目</td><td><a href="#/editor/' + UI.esc(row.projectId) + '">' + UI.esc(row.projectName) + '</a></td></tr>' +
      '<tr><td>材料</td><td>' + UI.esc(row.materialName) + '</td></tr>' +
      '<tr><td>面积</td><td>2(LW+LH+WH)×1.15</td></tr>' +
      '<tr><td>重量</td><td>面积×克重÷1000</td></tr>' +
      '<tr><td>成本</td><td>面积×单价</td></tr>' +
      '<tr><td>碳排</td><td>重量×碳因子</td></tr>' +
      '<tr><td>综合分</td><td>可回收×0.6+(100-碳排×40)×0.4</td></tr>' +
      '</tbody></table></div></div></div>';
    container.querySelector("#export-json").addEventListener("click", async function () {
      const result = (await API.get("/api/assessments/" + row.id + "/export/json")).data;
      UI.downloadText(result.filename, result.content, result.type);
    });
    container.querySelector("#export-csv").addEventListener("click", async function () {
      const result = (await API.get("/api/assessments/" + row.id + "/export/csv")).data;
      UI.downloadText(result.filename, result.content, result.type);
    });
  }
};
App.register("assessment-detail", AssessmentDetailView);
