const MaterialsView = {
  rows: [],
  render: async function (container) {
    const data = (await API.get("/api/materials")).data;
    MaterialsView.rows = data.rows;
    const isAdmin = App.user.role === "ADMIN";
    container.innerHTML = UI.pageHead("材料库", "纸张、塑料与金属卡纸的克重、单价与碳因子", isAdmin ? '<button class="btn primary" id="material-add">新增材料</button>' : "") +
      '<div class="card"><div class="card-body">' +
      UI.table({
        columns: [
          { title: "材料", key: "name" },
          { title: "类型", key: "typeName" },
          { title: "克重", key: "grammage", align: "right" },
          { title: "颜色", key: "color", render: function (row) { return '<span class="swatch-inline" style="background:' + UI.esc(row.color) + '"></span>' + UI.esc(row.color); } },
          { title: "纹理", key: "pattern" },
          { title: "可回收分", key: "recyclable", align: "right" },
          { title: "单价", key: "costPerSqm", align: "right" },
          { title: "碳因子", key: "carbonFactor", align: "right" },
          { title: "引用", key: "projectCount", align: "right" },
          { title: "状态", key: "enabled", render: function (row) { return UI.statusBadge(row.enabled ? "active" : "disabled"); } },
          { title: "操作", key: "id", render: function (row) {
            if (!isAdmin) return "—";
            return '<button class="link" data-edit="' + UI.esc(row.id) + '">编辑</button><button class="link" data-toggle="' + UI.esc(row.id) + '">' + (row.enabled ? "停用" : "启用") + "</button>";
          } }
        ],
        rows: data.rows,
        empty: "暂无材料"
      }) + '</div></div>';
    if (!isAdmin) return;
    container.querySelector("#material-add").addEventListener("click", function () { MaterialsView.openForm(null, data, container); });
    container.querySelectorAll("[data-edit]").forEach(function (button) {
      const row = data.rows.find(function (item) { return item.id === button.getAttribute("data-edit"); });
      button.addEventListener("click", function () { MaterialsView.openForm(row, data, container); });
    });
    container.querySelectorAll("[data-toggle]").forEach(function (button) {
      button.addEventListener("click", async function () {
        try { await API.post("/api/materials/" + button.getAttribute("data-toggle") + "/toggle", {}); MaterialsView.render(container); }
        catch (error) { UI.toast(error.message, "error"); }
      });
    });
  },
  openForm: function (row, data, container) {
    const body = '<form id="material-form"><div class="form-grid">' +
      '<div class="field"><label>名称</label><input class="input" name="name" value="' + (row ? UI.esc(row.name) : "") + '"></div>' +
      '<div class="field"><label>类型</label><select class="input" name="type">' + UI.optionList(data.types.map(function (key) { return { value: key, label: data.typeNames[key] }; }), row ? row.type : "kraft") + '</select></div>' +
      '<div class="field"><label>克重 g/m²</label><input class="input" name="grammage" type="number" step="0.1" min="0.2" max="1200" value="' + (row ? row.grammage : 300) + '"></div>' +
      '<div class="field"><label>颜色</label><input class="input" name="color" type="color" value="' + (row ? row.color : "#B08A5A") + '"></div>' +
      '<div class="field"><label>纹理</label><select class="input" name="pattern">' + UI.optionList(data.patterns, row ? row.pattern : "kraft") + '</select></div>' +
      '<div class="field"><label>可回收分</label><input class="input" name="recyclable" type="number" min="0" max="100" value="' + (row ? row.recyclable : 80) + '"></div>' +
      '<div class="field"><label>单价 元/m²</label><input class="input" name="costPerSqm" type="number" step="0.1" min="0" max="100" value="' + (row ? row.costPerSqm : 4) + '"></div>' +
      '<div class="field"><label>碳因子</label><input class="input" name="carbonFactor" type="number" step="0.1" min="0" max="20" value="' + (row ? row.carbonFactor : 1) + '"></div>' +
      '<div class="field full"><label>说明</label><textarea class="input" name="description" rows="2">' + (row ? UI.esc(row.description) : "") + '</textarea></div>' +
      '</div></form>';
    UI.modal({
      title: row ? "编辑材料" : "新增材料",
      body: body,
      buttons: [
        { text: "取消" },
        { text: "保存", className: "primary", onClick: async function (api) {
          const form = api.find("#material-form");
          try {
            if (row) await API.put("/api/materials/" + row.id, UI.formData(form));
            else await API.post("/api/materials", UI.formData(form));
            api.close();
            UI.toast("已保存", "success");
            MaterialsView.render(container);
          } catch (error) { UI.showError(form, error); }
        } }
      ]
    });
  }
};
App.register("materials", MaterialsView);
