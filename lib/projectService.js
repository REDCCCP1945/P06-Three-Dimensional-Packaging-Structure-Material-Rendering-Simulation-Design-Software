const crypto = require("crypto");
const store = require("./store");
const audit = require("./audit");
const boxService = require("./boxService");

function canAccess(user, project) {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (project.ownerId === user.id) return true;
  if (project.status === "active") return true;
  if (user.role === "VIEWER" && project.shareToken && project.shareExpiresAt > Date.now()) return true;
  return false;
}

function materialOf(project) {
  return store.db.materials.find(function (item) { return item.id === project.materialId; });
}

function enrich(project) {
  const material = materialOf(project);
  return Object.assign({}, project, {
    materialName: material ? material.name : "",
    materialColor: material ? material.color : "#CCCCCC",
    summary: material ? boxService.summary(project, material) : null
  });
}

function list(ctx) {
  const query = ctx.query;
  const keyword = (query.get("keyword") || "").trim();
  const boxType = query.get("boxType") || "";
  const status = query.get("status") || "";
  let rows = store.db.projects.filter(function (project) { return canAccess(ctx.user, project); });
  if (keyword) rows = rows.filter(function (project) { return (project.name + project.code + project.description).indexOf(keyword) >= 0; });
  if (boxType) rows = rows.filter(function (project) { return project.boxType === boxType; });
  if (status) rows = rows.filter(function (project) { return project.status === status; });
  rows.sort(function (a, b) { return a.updatedAt < b.updatedAt ? 1 : -1; });
  const page = Math.max(1, Number(query.get("page") || 1));
  const size = Math.min(50, Math.max(5, Number(query.get("size") || 10)));
  ctx.ok({
    total: rows.length,
    page: page,
    size: size,
    rows: rows.slice((page - 1) * size, page * size).map(enrich),
    summary: {
      total: store.db.projects.length,
      active: store.db.projects.filter(function (item) { return item.status === "active"; }).length,
      archived: store.db.projects.filter(function (item) { return item.status === "archived"; }).length,
      materials: store.db.materials.filter(function (item) { return item.enabled; }).length
    },
    boxTypes: boxService.BOX_TYPES,
    boxNames: boxService.BOX_NAMES
  });
}

function detail(ctx) {
  const project = store.db.projects.find(function (item) { return item.id === ctx.params[0]; });
  if (!project || !canAccess(ctx.user, project)) {
    ctx.fail(404, "项目不存在或无权访问");
    return;
  }
  ctx.ok({
    project: enrich(project),
    materials: store.db.materials.filter(function (item) { return item.enabled; }),
    versions: store.db.versions.filter(function (item) { return item.projectId === project.id; }),
    assessments: store.db.assessments.filter(function (item) { return item.projectId === project.id; }),
    boxTypes: boxService.BOX_TYPES,
    boxNames: boxService.BOX_NAMES,
    patterns: boxService.PATTERNS
  });
}

function create(ctx) {
  const body = ctx.body || {};
  const result = boxService.validate(body, null);
  if (result.error) {
    ctx.fail(400, result.error, result.field);
    return;
  }
  const material = store.db.materials.find(function (item) { return item.id === result.materialId; });
  if (!material || !material.enabled) {
    ctx.fail(400, "请选择启用的材料", "materialId");
    return;
  }
  const duplicate = store.db.projects.find(function (item) { return item.code === result.code; });
  if (duplicate) {
    ctx.fail(409, "项目编码已存在", "code");
    return;
  }
  const project = Object.assign({
    id: store.id("PRJ"),
    status: "active",
    ownerId: ctx.user.id,
    ownerName: ctx.user.name,
    shareToken: "",
    shareExpiresAt: 0,
    versionCount: 0,
    createdBy: ctx.user.id,
    createdByName: ctx.user.name,
    createdAt: store.now(),
    updatedAt: store.now()
  }, result);
  store.db.projects.unshift(project);
  store.save();
  audit.write(ctx.user, "项目", "创建项目", project.name, project.boxType, ctx.req);
  ctx.ok({ project: enrich(project) });
}

function update(ctx) {
  const project = store.db.projects.find(function (item) { return item.id === ctx.params[0]; });
  if (!project) {
    ctx.fail(404, "项目不存在");
    return;
  }
  if (ctx.user.role !== "ADMIN" && project.ownerId !== ctx.user.id) {
    ctx.fail(403, "只有项目负责人可以修改");
    return;
  }
  const result = boxService.validate(ctx.body || {}, project);
  if (result.error) {
    ctx.fail(400, result.error, result.field);
    return;
  }
  const material = store.db.materials.find(function (item) { return item.id === result.materialId; });
  if (!material || !material.enabled) {
    ctx.fail(400, "请选择启用的材料", "materialId");
    return;
  }
  Object.assign(project, result, { updatedAt: store.now() });
  if (ctx.body && ctx.body.status !== undefined && ["active", "archived"].indexOf(String(ctx.body.status)) >= 0) {
    project.status = String(ctx.body.status);
  }
  store.save();
  audit.write(ctx.user, "项目", "修改项目", project.name, project.boxType, ctx.req);
  ctx.ok({ project: enrich(project) });
}

function archive(ctx) {
  const project = store.db.projects.find(function (item) { return item.id === ctx.params[0]; });
  if (!project) {
    ctx.fail(404, "项目不存在");
    return;
  }
  if (ctx.user.role !== "ADMIN" && project.ownerId !== ctx.user.id) {
    ctx.fail(403, "只有项目负责人可以归档");
    return;
  }
  project.status = project.status === "archived" ? "active" : "archived";
  project.updatedAt = store.now();
  store.save();
  audit.write(ctx.user, "项目", project.status === "archived" ? "归档项目" : "恢复项目", project.name, "", ctx.req);
  ctx.ok({ project: project });
}

function duplicate(ctx) {
  const source = store.db.projects.find(function (item) { return item.id === ctx.params[0]; });
  if (!source || !canAccess(ctx.user, source)) {
    ctx.fail(404, "项目不存在或无权访问");
    return;
  }
  const project = Object.assign({}, source, {
    id: store.id("PRJ"),
    name: source.name + "（副本）",
    code: source.code + "-copy-" + Date.now().toString(36),
    status: "active",
    ownerId: ctx.user.id,
    ownerName: ctx.user.name,
    shareToken: "",
    shareExpiresAt: 0,
    versionCount: 0,
    createdBy: ctx.user.id,
    createdByName: ctx.user.name,
    createdAt: store.now(),
    updatedAt: store.now()
  });
  store.db.projects.unshift(project);
  store.save();
  audit.write(ctx.user, "项目", "复制项目", source.name, project.code, ctx.req);
  ctx.ok({ project: enrich(project) });
}

function share(ctx) {
  const project = store.db.projects.find(function (item) { return item.id === ctx.params[0]; });
  if (!project) {
    ctx.fail(404, "项目不存在");
    return;
  }
  if (ctx.user.role !== "ADMIN" && project.ownerId !== ctx.user.id) {
    ctx.fail(403, "只有项目负责人可以分享");
    return;
  }
  project.shareToken = crypto.randomBytes(16).toString("hex");
  project.shareExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
  project.updatedAt = store.now();
  store.save();
  audit.write(ctx.user, "分享", "生成分享链接", project.name, "有效期24小时", ctx.req);
  ctx.ok({
    token: project.shareToken,
    expiresAt: project.shareExpiresAt,
    url: "/share.html?token=" + project.shareToken
  });
}

function publicShare(ctx) {
  const project = store.db.projects.find(function (item) { return item.shareToken === ctx.params[0]; });
  if (!project) {
    ctx.fail(404, "分享链接不存在");
    return;
  }
  if (!project.shareExpiresAt || project.shareExpiresAt < Date.now()) {
    ctx.fail(410, "分享链接已过期");
    return;
  }
  const material = materialOf(project);
  const summary = material ? boxService.summary(project, material) : null;
  ctx.ok({
    project: {
      id: project.id, name: project.name, code: project.code, boxType: project.boxType,
      length: project.length, width: project.width, height: project.height, caliper: project.caliper,
      color: project.color, pattern: project.pattern, materialName: material ? material.name : "",
      ownerName: project.ownerName, shareExpiresAt: project.shareExpiresAt
    },
    summary: summary ? { areaSqm: summary.areaSqm, weightKg: summary.weightKg, recyclable: summary.recyclable, score: summary.score } : null
  });
}

module.exports = {
  canAccess: canAccess,
  materialOf: materialOf,
  list: list,
  detail: detail,
  create: create,
  update: update,
  archive: archive,
  duplicate: duplicate,
  share: share,
  publicShare: publicShare
};
