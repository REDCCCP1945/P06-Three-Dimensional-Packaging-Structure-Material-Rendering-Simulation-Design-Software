const store = require("./store");
const audit = require("./audit");
const userService = require("./userService");

function get(ctx) {
  ctx.ok({
    settings: store.db.settings,
    roleMenus: store.db.settings.roleMenus,
    roleNames: userService.ROLE_NAMES,
    materials: store.db.materials
  });
}

function save(ctx) {
  const body = ctx.body || {};
  const settings = store.db.settings;
  const material = store.db.materials.find(function (item) { return item.id === String(body.defaultMaterial || ""); });
  if (body.defaultMaterial !== undefined && (!material || !material.enabled)) {
    ctx.fail(400, "默认材料无效", "defaultMaterial");
    return;
  }
  if (body.defaultMaterial !== undefined) settings.defaultMaterial = material.id;
  if (body.defaultUnit !== undefined) {
    if (["mm", "cm", "inch"].indexOf(String(body.defaultUnit)) < 0) {
      ctx.fail(400, "默认单位无效", "defaultUnit");
      return;
    }
    settings.defaultUnit = String(body.defaultUnit);
  }
  if (typeof body.aiNotice === "string" && body.aiNotice.trim()) settings.aiNotice = body.aiNotice.trim().slice(0, 300);
  store.save();
  audit.write(ctx.user, "系统设置", "保存默认参数", "默认材料与单位", settings.defaultMaterial + "/" + settings.defaultUnit, ctx.req);
  ctx.ok({ settings: settings });
}

function roleMenu(ctx) {
  ctx.ok({ roleMenus: store.db.settings.roleMenus, roleNames: userService.ROLE_NAMES });
}

function roleMenuSave(ctx) {
  const body = ctx.body || {};
  const role = String(body.role || "");
  const menus = Array.isArray(body.menus) ? body.menus.slice() : null;
  if (!userService.ROLE_NAMES[role]) {
    ctx.fail(400, "角色无效", "role");
    return;
  }
  if (!menus) {
    ctx.fail(400, "菜单列表无效", "menus");
    return;
  }
  if (role === "ADMIN") {
    ctx.fail(409, "内置管理员菜单不能修改");
    return;
  }
  store.db.settings.roleMenus[role] = menus;
  store.save();
  audit.write(ctx.user, "权限", "调整角色菜单", userService.ROLE_NAMES[role], menus.join("、"), ctx.req);
  ctx.ok({ roleMenus: store.db.settings.roleMenus });
}

module.exports = { get: get, save: save, roleMenu: roleMenu, roleMenuSave: roleMenuSave };
