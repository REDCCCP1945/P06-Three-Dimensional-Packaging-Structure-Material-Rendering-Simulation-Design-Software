const ProjectsView = {
  state: { page: 1, size: 10, keyword: "", boxType: "", status: "" },
  render: async function (container) {
    async function load() {
      const query = "?page=" + ProjectsView.state.page + "&size=" + ProjectsView.state.size +
        "&keyword=" + encodeURIComponent(ProjectsView.state.keyword) + "&boxType=" + encodeURIComponent(ProjectsView.state.boxType) + "&status=" + encodeURIComponent(ProjectsView.state.status);
      const data = (await API.get("/api/projects" + query)).data;
      container.innerHTML = UI.pageHead("包装项目", "按盒型、尺寸与材料组织包装方案", App.user.role === "VIEWER" ? "" : '<button class="btn primary" id="project-add">新建项目</button>') +
        '<div class="kpi-grid">' +
        '<div class="kpi"><strong>' + UI.fmtInt(data.summary.total) + '</strong><span>全部项目</span></div>' +
        '<div class="kpi"><strong>' + UI.fmtInt(data.summary.active) + '</strong><span>进行中</span></div>' +
        '<div class="kpi"><strong>' + UI.fmtInt(data.summary.archived) + '</strong><span>已归档</span></div>' +
        '<div class="kpi"><strong>' + UI.fmtInt(data.summary.materials) + '</strong><span>启用材料</span></div>' +
        '</div>' +
        '<div class="card"><div class="card-body"><div class="filter-bar">' +
        '<input class="input" id="p-keyword" placeholder="名称、编码或说明" value="' + UI.esc(ProjectsView.state.keyword) + '">' +
        '<select class="input" id="p-box"><option value="">全部盒型</option>' + data.boxTypes.map(function (key) {
          return '<option value="' + key + '"' + (ProjectsView.state.boxType === key ? " selected" : "") + ">" + data.boxNames[key] + "</option>";
        }).join("") + '</select>' +
        '<select class="input" id="p-status"><option value="">全部状态</option><option value="active"' + (ProjectsView.state.status === "active" ? " selected" : "") + '>进行中</option><option value="archived"' + (ProjectsView.state.status === "archived" ? " selected" : "") + '>已归档</option></select>' +
        '<button class="btn" id="p-search">查询</button></div>' +
        UI.table({
          columns: [
            { title: "项目", key: "name", render: function (row) { return '<a href="#/editor/' + UI.esc(row.id) + '">' + UI.esc(row.name) + "</a>"; } },
            { title: "盒型", key: "boxType", render: function (row) { return data.boxNames[row.boxType] || row.boxType; } },
            { title: "尺寸mm", key: "length", render: function (row) { return row.length + "×" + row.width + "×" + row.height; } },
            { title: "材料", key: "materialName" },
            { title: "面积m²", key: "summary", render: function (row) { return row.summary ? row.summary.areaSqm : "—"; }, align: "right" },
            { title: "成本元", key: "summary", render: function (row) { return row.summary ? row.summary.cost : "—"; }, align: "right" },
            { title: "环保分", key: "summary", render: function (row) { return row.summary ? row.summary.score : "—"; }, align: "right" },
            { title: "状态", key: "status", render: function (row) { return UI.statusBadge(row.status === "active" ? "active" : "archived"); } },
            { title: "操作", key: "id", render: function (row) {
              const parts = ['<a class="link" href="#/editor/' + UI.esc(row.id) + '">编辑</a>'];
              if (App.user.role !== "VIEWER") parts.push('<button class="link" data-duplicate="' + UI.esc(row.id) + '">复制</button>');
              if (App.user.role !== "VIEWER") parts.push('<button class="link" data-archive="' + UI.esc(row.id) + '">' + (row.status === "archived" ? "恢复" : "归档") + "</button>");
              return parts.join("");
            } }
          ],
          rows: data.rows,
          empty: "暂无项目"
        }) + UI.pagination(data, function () {}) + '</div></div>';
      UI.bindPagination(container, ProjectsView.state, load);
      container.querySelector("#p-search").addEventListener("click", function () {
        ProjectsView.state.keyword = container.querySelector("#p-keyword").value.trim();
        ProjectsView.state.boxType = container.querySelector("#p-box").value;
        ProjectsView.state.status = container.querySelector("#p-status").value;
        ProjectsView.state.page = 1;
        load();
      });
      const add = container.querySelector("#project-add");
      if (add) add.addEventListener("click", function () { ProjectsView.openCreate(data, load); });
      container.querySelectorAll("[data-duplicate]").forEach(function (button) {
        button.addEventListener("click", async function () {
          try { await API.post("/api/projects/" + button.getAttribute("data-duplicate") + "/duplicate", {}); UI.toast("已复制", "success"); load(); }
          catch (error) { UI.toast(error.message, "error"); }
        });
      });
      container.querySelectorAll("[data-archive]").forEach(function (button) {
        button.addEventListener("click", async function () {
          try { await API.post("/api/projects/" + button.getAttribute("data-archive") + "/archive", {}); load(); }
          catch (error) { UI.toast(error.message, "error"); }
        });
      });
    }
    await load();
  },
  openCreate: async function (data, done) {
    const materials = (await API.get("/api/materials")).data.rows.filter(function (item) { return item.enabled; });
    const body = '<form id="project-form"><div class="form-grid">' +
      '<div class="field"><label>项目名称</label><input class="input" name="name" placeholder="2到40个字符"></div>' +
      '<div class="field"><label>项目编码</label><input class="input" name="code" placeholder="字母、数字或连字符"></div>' +
      '<div class="field"><label>盒型</label><select class="input" name="boxType">' + UI.optionList(data.boxTypes.map(function (key) { return { value: key, label: data.boxNames[key] }; }), "tuck") + '</select></div>' +
      '<div class="field"><label>长（mm）</label><input class="input" name="length" type="number" min="10" max="1000" value="260"></div>' +
      '<div class="field"><label>宽（mm）</label><input class="input" name="width" type="number" min="10" max="1000" value="180"></div>' +
      '<div class="field"><label>高（mm）</label><input class="input" name="height" type="number" min="10" max="1000" value="90"></div>' +
      '<div class="field"><label>克重/厚度（mm）</label><input class="input" name="caliper" type="number" step="0.1" min="0.2" max="5" value="0.6"></div>' +
      '<div class="field"><label>材料</label><select class="input" name="materialId">' + UI.optionList(materials.map(function (item) { return { value: item.id, label: item.name + " / " + item.grammage + "g" }; }), materials[0] ? materials[0].id : "") + '</select></div>' +
      '<div class="field"><label>颜色</label><input class="input" name="color" type="color" value="#B08A5A"></div>' +
      '<div class="field"><label>纹理</label><select class="input" name="pattern">' + UI.optionList(["solid", "kraft", "fiber", "grid", "foil", "transparent"], "kraft") + '</select></div>' +
      '<div class="field full"><label>说明</label><textarea class="input" name="description" rows="2"></textarea></div>' +
      '</div></form>';
    UI.modal({
      title: "新建包装项目",
      body: body,
      buttons: [
        { text: "取消" },
        { text: "创建", className: "primary", onClick: async function (api) {
          const form = api.find("#project-form");
          try {
            const result = await API.post("/api/projects", UI.formData(form));
            api.close();
            location.hash = "#/editor/" + result.data.project.id;
            if (done) done();
          } catch (error) { UI.showError(form, error); }
        } }
      ]
    });
  }
};

App.register("projects", ProjectsView);
