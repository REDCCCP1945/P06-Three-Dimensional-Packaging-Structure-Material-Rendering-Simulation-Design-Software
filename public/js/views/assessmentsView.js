const AssessmentsView = {
  state: { page: 1, size: 10, keyword: "" },
  render: async function (container) {
    async function load() {
      const data = (await API.get("/api/assessments?page=" + AssessmentsView.state.page + "&size=" + AssessmentsView.state.size + "&keyword=" + encodeURIComponent(AssessmentsView.state.keyword))).data;
      container.innerHTML = UI.pageHead("环保评估", "面积、重量、成本、碳排与可回收分的固定公式评估") +
        '<div class="kpi-grid">' +
        '<div class="kpi"><strong>' + UI.fmtInt(data.summary.total) + '</strong><span>评估总数</span></div>' +
        '<div class="kpi"><strong>' + UI.fmtInt(data.summary.average) + '</strong><span>平均环保分</span></div>' +
        '<div class="kpi"><strong>' + UI.fmtInt(data.summary.good) + '</strong><span>85分以上</span></div>' +
        '<div class="kpi"><strong>' + UI.fmtInt(data.summary.projects) + '</strong><span>项目数</span></div>' +
        '</div>' +
        '<div class="card"><div class="card-body"><div class="filter-bar"><input class="input" id="a-keyword" placeholder="项目、材料或结论" value="' + UI.esc(AssessmentsView.state.keyword) + '"><button class="btn" id="a-search">查询</button></div>' +
        UI.table({
          columns: [
            { title: "评估", key: "id", render: function (row) { return '<a href="#/assessments/' + UI.esc(row.id) + '">' + UI.esc(row.id) + "</a>"; } },
            { title: "项目", key: "projectName" },
            { title: "材料", key: "materialName" },
            { title: "面积m²", key: "areaSqm", align: "right" },
            { title: "重量kg", key: "weightKg", align: "right" },
            { title: "成本元", key: "cost", align: "right" },
            { title: "碳排kg", key: "carbonKg", align: "right" },
            { title: "可回收", key: "recyclable", align: "right" },
            { title: "综合分", key: "score", align: "right" },
            { title: "时间", key: "createdAt", render: function (row) { return UI.fmtDateTime(row.createdAt); } }
          ],
          rows: data.rows,
          empty: "暂无评估"
        }) + UI.pagination(data, function () {}) + '</div></div>';
      UI.bindPagination(container, AssessmentsView.state, load);
      container.querySelector("#a-search").addEventListener("click", function () {
        AssessmentsView.state.keyword = container.querySelector("#a-keyword").value.trim();
        AssessmentsView.state.page = 1;
        load();
      });
    }
    await load();
  }
};
App.register("assessments", AssessmentsView);
