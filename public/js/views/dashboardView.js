const DashboardView = {
  render: async function (container) {
    const data = (await API.get("/api/dashboard")).data;
    const boxItems = Object.keys(data.boxTypes).map(function (key, index) {
      return { name: { tuck: "管式折叠盒", mailer: "飞机盒", sleeve: "套筒盒" }[key] || key, value: data.boxTypes[key], color: Charts.palette[index] };
    });
    container.innerHTML = UI.pageHead("工作台", "项目、材料、评估与版本概览", '<button class="btn primary" id="quick-project">新建包装项目</button>') +
      '<div class="kpi-grid">' +
      '<div class="kpi"><strong>' + UI.fmtInt(data.projectCount) + '</strong><span>包装项目</span></div>' +
      '<div class="kpi"><strong>' + UI.fmtInt(data.materialCount) + '</strong><span>启用材料</span></div>' +
      '<div class="kpi"><strong>' + UI.fmtInt(data.assessmentCount) + '</strong><span>环保评估</span></div>' +
      '<div class="kpi"><strong>' + UI.fmtInt(data.averageScore) + '</strong><span>平均环保分</span></div>' +
      '<div class="kpi"><strong>' + UI.fmtInt(data.versionCount) + '</strong><span>版本快照</span></div>' +
      '<div class="kpi"><strong>' + UI.fmtInt(data.pendingFeedback) + '</strong><span>待处理反馈</span></div>' +
      '</div>' +
      '<div class="two-col"><div class="card"><div class="card-head"><h3>盒型分布</h3><span class="muted">全部项目</span></div><div class="card-body">' + Charts.donut(boxItems) + '</div></div>' +
      '<div class="card"><div class="card-head"><h3>最近评估</h3><a href="#/assessments">查看全部</a></div><div class="card-body">' +
      UI.table({
        columns: [
          { title: "评估", key: "id", render: function (row) { return '<a href="#/assessments/' + UI.esc(row.id) + '">' + UI.esc(row.id) + "</a>"; } },
          { title: "项目", key: "projectName" },
          { title: "材料", key: "materialName" },
          { title: "综合分", key: "score", align: "right" },
          { title: "碳排kg", key: "carbonKg", align: "right" }
        ],
        rows: data.recentAssessments,
        empty: "暂无评估"
      }) + '</div></div></div>' +
      '<div class="card"><div class="card-head"><h3>最近项目</h3><a href="#/projects">查看全部</a></div><div class="card-body">' +
      UI.table({
        columns: [
          { title: "项目", key: "name", render: function (row) { return '<a href="#/editor/' + UI.esc(row.id) + '">' + UI.esc(row.name) + "</a>"; } },
          { title: "盒型", key: "boxType", render: function (row) { return { tuck: "管式折叠盒", mailer: "飞机盒", sleeve: "套筒盒" }[row.boxType] || row.boxType; } },
          { title: "尺寸", key: "length", render: function (row) { return row.length + "×" + row.width + "×" + row.height + " mm"; } },
          { title: "更新时间", key: "updatedAt", render: function (row) { return UI.fmtDateTime(row.updatedAt); } }
        ],
        rows: data.recentProjects,
        empty: "暂无项目"
      }) + '</div></div>';
    container.querySelector("#quick-project").addEventListener("click", function () { location.hash = "#/projects"; });
  }
};

App.register("dashboard", DashboardView);
