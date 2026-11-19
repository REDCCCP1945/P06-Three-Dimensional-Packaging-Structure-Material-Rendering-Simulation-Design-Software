const store = require("./store");
const boxService = require("./boxService");

function summary(ctx) {
  const projects = store.db.projects;
  const assessments = store.db.assessments;
  const boxTypes = {};
  boxService.BOX_TYPES.forEach(function (key) { boxTypes[key] = 0; });
  projects.forEach(function (item) { boxTypes[item.boxType] = (boxTypes[item.boxType] || 0) + 1; });
  ctx.ok({
    projectCount: projects.length,
    activeProjects: projects.filter(function (item) { return item.status === "active"; }).length,
    materialCount: store.db.materials.filter(function (item) { return item.enabled; }).length,
    assessmentCount: assessments.length,
    averageScore: assessments.length ? Math.round(assessments.reduce(function (sum, item) { return sum + item.score; }, 0) / assessments.length) : 0,
    versionCount: store.db.versions.length,
    pendingFeedback: store.db.feedback.filter(function (item) { return item.status === "pending"; }).length,
    boxTypes: boxTypes,
    recentProjects: projects.slice(0, 6).map(function (item) {
      return { id: item.id, name: item.name, boxType: item.boxType, length: item.length, width: item.width, height: item.height, updatedAt: item.updatedAt };
    }),
    recentAssessments: assessments.slice(0, 5)
  });
}

module.exports = { summary: summary };
