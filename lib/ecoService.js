const store = require("./store");
const audit = require("./audit");
const boxService = require("./boxService");

function list(ctx) {
  const query = ctx.query;
  const keyword = (query.get("keyword") || "").trim();
  const projectId = query.get("projectId") || "";
  let rows = store.db.assessments.slice();
  if (keyword) rows = rows.filter(function (item) { return (item.projectName + item.materialName + item.conclusion).indexOf(keyword) >= 0; });
  if (projectId) rows = rows.filter(function (item) { return item.projectId === projectId; });
  rows.sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
  const page = Math.max(1, Number(query.get("page") || 1));
  const size = Math.min(50, Math.max(5, Number(query.get("size") || 10)));
  ctx.ok({
    total: rows.length,
    page: page,
    size: size,
    rows: rows.slice((page - 1) * size, page * size),
    summary: {
      total: store.db.assessments.length,
      average: store.db.assessments.length ? Math.round(store.db.assessments.reduce(function (sum, item) { return sum + item.score; }, 0) / store.db.assessments.length) : 0,
      good: store.db.assessments.filter(function (item) { return item.score >= 85; }).length,
      projects: store.db.projects.length
    }
  });
}

function detail(ctx) {
  const row = store.db.assessments.find(function (item) { return item.id === ctx.params[0]; });
  if (!row) {
    ctx.fail(404, "评估不存在");
    return;
  }
  const project = store.db.projects.find(function (item) { return item.id === row.projectId; });
  ctx.ok({ assessment: row, project: project });
}

function generate(ctx) {
  const body = ctx.body || {};
  const project = store.db.projects.find(function (item) { return item.id === body.projectId; });
  if (!project) {
    ctx.fail(404, "项目不存在");
    return;
  }
  const material = store.db.materials.find(function (item) { return item.id === project.materialId; });
  if (!material) {
    ctx.fail(400, "项目材料不存在");
    return;
  }
  const summary = boxService.summary(project, material);
  const row = {
    id: store.id("ECO"),
    projectId: project.id,
    projectName: project.name,
    materialName: material.name,
    areaSqm: summary.areaSqm,
    weightKg: summary.weightKg,
    cost: summary.cost,
    carbonKg: summary.carbonKg,
    recyclable: summary.recyclable,
    score: summary.score,
    conclusion: summary.conclusion,
    createdAt: store.now()
  };
  store.db.assessments.unshift(row);
  store.save();
  audit.write(ctx.user, "评估", "生成评估", row.id, project.name, ctx.req);
  ctx.ok({ assessment: row });
}

function exportJson(ctx) {
  const row = store.db.assessments.find(function (item) { return item.id === ctx.params[0]; });
  if (!row) {
    ctx.fail(404, "评估不存在");
    return;
  }
  audit.write(ctx.user, "评估", "导出JSON", row.id, row.projectName, ctx.req);
  ctx.ok({ filename: row.id + ".json", content: JSON.stringify(row, null, 2), type: "application/json" });
}

function exportCsv(ctx) {
  const row = store.db.assessments.find(function (item) { return item.id === ctx.params[0]; });
  if (!row) {
    ctx.fail(404, "评估不存在");
    return;
  }
  const header = ["评估编号", "项目", "材料", "面积m2", "重量kg", "成本元", "碳排kg", "可回收分", "综合分", "结论", "生成时间"];
  const line = [row.id, row.projectName, row.materialName, row.areaSqm, row.weightKg, row.cost, row.carbonKg, row.recyclable, row.score, row.conclusion, row.createdAt];
  audit.write(ctx.user, "评估", "导出CSV", row.id, row.projectName, ctx.req);
  ctx.ok({ filename: row.id + ".csv", content: header.join(",") + "\r\n" + line.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(","), type: "text/csv" });
}

module.exports = {
  list: list,
  detail: detail,
  generate: generate,
  exportJson: exportJson,
  exportCsv: exportCsv
};
