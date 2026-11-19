const auth = require("./auth");
const boxService = require("./boxService");

function user(id, username, name, role, password) {
  const salt = auth.createSalt();
  return {
    id: id, username: username, name: name, role: role,
    email: username + "@school.local", status: "active",
    salt: salt, passwordHash: auth.hashPassword(password, salt),
    createdAt: "2026-04-10T08:00:00.000Z", lastLoginAt: ""
  };
}

function material(id, name, type, grammage, color, pattern, recyclable, costPerSqm, carbonFactor) {
  return {
    id: id, name: name, type: type, grammage: grammage, color: color, pattern: pattern,
    recyclable: recyclable, costPerSqm: costPerSqm, carbonFactor: carbonFactor,
    enabled: true, description: name + "，克重" + grammage + "g/m²",
    createdAt: "2026-04-10T08:00:00.000Z"
  };
}

function build(secret, dir) {
  const users = [
    user("USR-01", "admin01", "系统管理员", "ADMIN", "Admin@2026"),
    user("USR-02", "designer01", "包装设计师", "DESIGNER", "Designer@2026"),
    user("USR-03", "viewer01", "浏览客户", "VIEWER", "Viewer@2026")
  ];
  const materials = [
    material("MAT-01", "牛皮纸", "kraft", 300, "#B08A5A", "kraft", 90, 3.6, 0.9),
    material("MAT-02", "白卡纸", "coated", 350, "#F2EEE4", "fiber", 88, 5.2, 1.1),
    material("MAT-03", "铜版纸", "coated", 250, "#FFFFFF", "solid", 70, 4.8, 1.3),
    material("MAT-04", "再生纸板", "recycled", 400, "#C9BFA8", "fiber", 95, 3.2, 0.7),
    material("MAT-05", "黑卡纸", "kraft", 300, "#1C1C1C", "solid", 60, 5.6, 1.2),
    material("MAT-06", "PET透明片", "pet", 0.4, "#BFE3E0", "transparent", 30, 9.5, 2.8),
    material("MAT-07", "金银卡纸", "foil", 300, "#D8C08A", "foil", 45, 12.0, 3.6),
    material("MAT-08", "瓦楞纸板", "corrugated", 5, "#C2A57A", "kraft", 92, 2.8, 0.8)
  ];
  const specs = [
    { id: "PRJ-01", name: "中秋礼盒结构方案", code: "mid-autumn-box", boxType: "tuck", length: 260, width: 180, height: 90, caliper: 0.6, materialId: "MAT-01", color: "#B08A5A", pattern: "kraft", description: "中秋文创礼盒，管式折叠盒" },
    { id: "PRJ-02", name: "茶礼飞机盒", code: "tea-mailer", boxType: "mailer", length: 220, width: 160, height: 80, caliper: 0.5, materialId: "MAT-02", color: "#F2EEE4", pattern: "fiber", description: "茶叶礼盒，飞机盒结构" },
    { id: "PRJ-03", name: "香氛套筒盒", code: "fragrance-sleeve", boxType: "sleeve", length: 90, width: 90, height: 210, caliper: 0.4, materialId: "MAT-03", color: "#FFFFFF", pattern: "grid", description: "香氛套筒，简洁留白" },
    { id: "PRJ-04", name: "文创盲盒外箱", code: "blindbox-carton", boxType: "tuck", length: 120, width: 90, height: 150, caliper: 0.7, materialId: "MAT-04", color: "#C9BFA8", pattern: "fiber", description: "再生纸板盲盒外箱" },
    { id: "PRJ-05", name: "数码产品包装", code: "digital-pack", boxType: "mailer", length: 200, width: 150, height: 70, caliper: 0.5, materialId: "MAT-05", color: "#1C1C1C", pattern: "solid", description: "黑色数码产品包装" },
    { id: "PRJ-06", name: "食品礼盒套筒", code: "food-sleeve", boxType: "sleeve", length: 180, width: 120, height: 60, caliper: 0.4, materialId: "MAT-08", color: "#C2A57A", pattern: "kraft", description: "瓦楞纸食品礼盒套筒" }
  ];
  const projects = specs.map(function (spec, index) {
    return Object.assign({}, spec, {
      status: "active",
      ownerId: "USR-02",
      ownerName: "包装设计师",
      shareToken: "",
      shareExpiresAt: 0,
      versionCount: 1,
      createdBy: "USR-02",
      createdByName: "包装设计师",
      createdAt: "2026-04-10T09:0" + index + ":00.000Z",
      updatedAt: "2026-04-10T09:0" + index + ":00.000Z"
    });
  });
  const assessments = projects.slice(0, 6).map(function (project, index) {
    const material = materials.find(function (item) { return item.id === project.materialId; });
    const summary = boxService.summary(project, material);
    return {
      id: "ECO-0" + (index + 1),
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
      createdAt: "2026-04-10T10:0" + index + ":00.000Z"
    };
  });
  const versions = projects.slice(0, 5).map(function (project, index) {
    return {
      id: "VER-0" + (index + 1),
      projectId: project.id,
      label: "V1.0 初始方案",
      snapshot: {
        boxType: project.boxType, length: project.length, width: project.width, height: project.height,
        caliper: project.caliper, materialId: project.materialId, color: project.color, pattern: project.pattern
      },
      createdBy: "USR-02",
      createdByName: "包装设计师",
      createdAt: "2026-04-10T11:0" + index + ":00.000Z"
    };
  });
  const feedback = [
    { id: "FB-01", userId: "USR-02", userName: "包装设计师", type: "建议", content: "希望增加盒型模板库。", status: "replied", reply: "已记录，后续版本评估。", createdAt: "2026-04-10T12:00:00.000Z", repliedAt: "2026-04-10T12:30:00.000Z" },
    { id: "FB-02", userId: "USR-03", userName: "浏览客户", type: "问题", content: "分享页能否隐藏成本？", status: "closed", reply: "分享页不显示成本与碳排。", createdAt: "2026-04-10T13:00:00.000Z", repliedAt: "2026-04-10T13:10:00.000Z" }
  ];
  const auditLogs = [
    { id: "LOG-01", userId: "USR-02", username: "designer01", role: "DESIGNER", category: "项目", action: "创建项目", target: "PRJ-01", detail: "中秋礼盒结构方案", ip: "127.0.0.1", createdAt: "2026-04-10T09:00:00.000Z" },
    { id: "LOG-02", userId: "USR-02", username: "designer01", role: "DESIGNER", category: "评估", action: "生成评估", target: "ECO-01", detail: "中秋礼盒结构方案", ip: "127.0.0.1", createdAt: "2026-04-10T10:00:00.000Z" }
  ];
  return {
    meta: { createdAt: "2026-04-10T08:00:00.000Z", version: 1 },
    users: users,
    tokens: [],
    projects: projects,
    materials: materials,
    assessments: assessments,
    versions: versions,
    feedback: feedback,
    auditLogs: auditLogs,
    settings: {
      softwareName: "三维包装结构与材质渲染仿真设计软件",
      softwareVersion: "V1.0.0",
      defaultUnit: "mm",
      defaultMaterial: "MAT-01",
      aiNotice: "本软件的三维预览与刀版图由本地程序按参数绘制，评估结果由固定公式计算。",
      roleMenus: {
        ADMIN: ["dashboard", "projects", "editor", "materials", "assessments", "users", "audit", "settings", "feedback", "profile", "help"],
        DESIGNER: ["dashboard", "projects", "editor", "materials", "assessments", "feedback", "profile", "help"],
        VIEWER: ["dashboard", "projects", "assessments", "feedback", "profile", "help"]
      }
    }
  };
}

module.exports = { build: build };
