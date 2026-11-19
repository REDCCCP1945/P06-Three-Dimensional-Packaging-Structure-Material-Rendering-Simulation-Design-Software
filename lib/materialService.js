const store = require("./store");
const audit = require("./audit");

const TYPES = ["kraft", "coated", "recycled", "pet", "foil", "corrugated"];
const TYPE_NAMES = { kraft: "牛皮纸", coated: "涂布纸", recycled: "再生纸", pet: "PET", foil: "金属卡纸", corrugated: "瓦楞纸" };
const PATTERNS = ["solid", "kraft", "fiber", "grid", "foil", "transparent"];

function list(ctx) {
  const rows = store.db.materials.map(function (item) {
    return Object.assign({}, item, {
      typeName: TYPE_NAMES[item.type] || item.type,
      projectCount: store.db.projects.filter(function (project) { return project.materialId === item.id; }).length
    });
  });
  ctx.ok({ rows: rows, types: TYPES, typeNames: TYPE_NAMES, patterns: PATTERNS });
}

function validate(body, current) {
  const name = String(body.name === undefined ? (current ? current.name : "") : body.name).trim();
  const type = String(body.type === undefined ? (current ? current.type : "") : body.type);
  const grammage = Number(body.grammage === undefined ? (current ? current.grammage : 0) : body.grammage);
  const color = String(body.color === undefined ? (current ? current.color : "#CCCCCC") : body.color).toUpperCase();
  const pattern = String(body.pattern === undefined ? (current ? current.pattern : "solid") : body.pattern);
  const recyclable = Number(body.recyclable === undefined ? (current ? current.recyclable : 50) : body.recyclable);
  const costPerSqm = Number(body.costPerSqm === undefined ? (current ? current.costPerSqm : 0) : body.costPerSqm);
  const carbonFactor = Number(body.carbonFactor === undefined ? (current ? current.carbonFactor : 1) : body.carbonFactor);
  const description = String(body.description === undefined ? (current ? current.description : "") : body.description).trim();
  if (name.length < 2 || name.length > 30) return { error: "材料名称应为2到30个字符", field: "name" };
  if (TYPES.indexOf(type) < 0) return { error: "材料类型无效", field: "type" };
  if (!Number.isFinite(grammage) || grammage < 0.2 || grammage > 1200) return { error: "克重应在0.2到1200之间", field: "grammage" };
  if (!/^#[0-9A-F]{6}$/.test(color)) return { error: "颜色应为#RRGGBB", field: "color" };
  if (PATTERNS.indexOf(pattern) < 0) return { error: "纹理无效", field: "pattern" };
  if (!Number.isFinite(recyclable) || recyclable < 0 || recyclable > 100) return { error: "可回收分应为0到100", field: "recyclable" };
  if (!Number.isFinite(costPerSqm) || costPerSqm < 0 || costPerSqm > 100) return { error: "单价应为0到100", field: "costPerSqm" };
  if (!Number.isFinite(carbonFactor) || carbonFactor < 0 || carbonFactor > 20) return { error: "碳因子应为0到20", field: "carbonFactor" };
  if (description.length > 200) return { error: "说明不能超过200个字符", field: "description" };
  return { name: name, type: type, grammage: grammage, color: color, pattern: pattern, recyclable: recyclable, costPerSqm: costPerSqm, carbonFactor: carbonFactor, description: description };
}

function create(ctx) {
  const result = validate(ctx.body || {}, null);
  if (result.error) {
    ctx.fail(400, result.error, result.field);
    return;
  }
  if (store.db.materials.some(function (item) { return item.name === result.name; })) {
    ctx.fail(409, "材料名称已存在", "name");
    return;
  }
  const row = Object.assign({ id: store.id("MAT"), enabled: true, createdAt: store.now() }, result);
  store.db.materials.push(row);
  store.save();
  audit.write(ctx.user, "材料", "新增材料", row.name, row.type, ctx.req);
  ctx.ok({ material: row });
}

function update(ctx) {
  const row = store.db.materials.find(function (item) { return item.id === ctx.params[0]; });
  if (!row) {
    ctx.fail(404, "材料不存在");
    return;
  }
  const result = validate(ctx.body || {}, row);
  if (result.error) {
    ctx.fail(400, result.error, result.field);
    return;
  }
  const duplicate = store.db.materials.find(function (item) { return item.name === result.name && item.id !== row.id; });
  if (duplicate) {
    ctx.fail(409, "材料名称已存在", "name");
    return;
  }
  Object.assign(row, result, { updatedAt: store.now() });
  store.save();
  audit.write(ctx.user, "材料", "修改材料", row.name, row.type, ctx.req);
  ctx.ok({ material: row });
}

function toggle(ctx) {
  const row = store.db.materials.find(function (item) { return item.id === ctx.params[0]; });
  if (!row) {
    ctx.fail(404, "材料不存在");
    return;
  }
  row.enabled = !row.enabled;
  row.updatedAt = store.now();
  store.save();
  audit.write(ctx.user, "材料", row.enabled ? "启用材料" : "停用材料", row.name, "", ctx.req);
  ctx.ok({ material: row });
}

function remove(ctx) {
  const row = store.db.materials.find(function (item) { return item.id === ctx.params[0]; });
  if (!row) {
    ctx.fail(404, "材料不存在");
    return;
  }
  const used = store.db.projects.some(function (project) { return project.materialId === row.id; });
  if (used) {
    ctx.fail(409, "该材料已被项目引用，只能停用");
    return;
  }
  store.db.materials = store.db.materials.filter(function (item) { return item.id !== row.id; });
  store.save();
  audit.write(ctx.user, "材料", "删除材料", row.name, "", ctx.req);
  ctx.ok({});
}

module.exports = {
  TYPES: TYPES,
  TYPE_NAMES: TYPE_NAMES,
  PATTERNS: PATTERNS,
  list: list,
  create: create,
  update: update,
  toggle: toggle,
  remove: remove
};
