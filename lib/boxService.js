const BOX_TYPES = ["tuck", "mailer", "sleeve"];
const BOX_NAMES = { tuck: "管式折叠盒", mailer: "飞机盒", sleeve: "套筒盒" };
const PATTERNS = ["solid", "kraft", "fiber", "grid", "foil", "transparent"];

function round(value, digits) {
  const factor = Math.pow(10, digits === undefined ? 2 : digits);
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function blankArea(project) {
  const l = Number(project.length);
  const w = Number(project.width);
  const h = Number(project.height);
  return round(2 * (l * w + l * h + w * h) * 1.15 / 1000000, 4);
}

function weightKg(project, material) {
  const area = blankArea(project);
  return round(area * Number(material.grammage) / 1000, 4);
}

function costOf(project, material) {
  const area = blankArea(project);
  return round(area * Number(material.costPerSqm), 2);
}

function carbonOf(project, material) {
  const weight = weightKg(project, material);
  return round(weight * Number(material.carbonFactor), 4);
}

function ecoScore(material, carbonKg) {
  const recyclable = Number(material.recyclable);
  const carbonScore = clamp(100 - Number(carbonKg) * 40, 0, 100);
  return Math.round(recyclable * 0.6 + carbonScore * 0.4);
}

function ecoConclusion(score) {
  if (score >= 85) return "材料可回收性高，碳排较低，建议保留该方案。";
  if (score >= 70) return "整体表现良好，可比较更低克重或更高可回收材料。";
  if (score >= 55) return "环保表现一般，建议评估再生材料与结构减量。";
  return "环保表现偏低，建议更换材料或减小包装体积。";
}

function validate(body, current) {
  const name = String(body.name === undefined ? (current ? current.name : "") : body.name).trim();
  const code = String(body.code === undefined ? (current ? current.code : "") : body.code).trim();
  const boxType = String(body.boxType === undefined ? (current ? current.boxType : "tuck") : body.boxType);
  const length = Number(body.length === undefined ? (current ? current.length : 0) : body.length);
  const width = Number(body.width === undefined ? (current ? current.width : 0) : body.width);
  const height = Number(body.height === undefined ? (current ? current.height : 0) : body.height);
  const caliper = Number(body.caliper === undefined ? (current ? current.caliper : 0.6) : body.caliper);
  const materialId = String(body.materialId === undefined ? (current ? current.materialId : "") : body.materialId);
  const color = String(body.color === undefined ? (current ? current.color : "#B08A5A") : body.color).toUpperCase();
  const pattern = String(body.pattern === undefined ? (current ? current.pattern : "kraft") : body.pattern);
  const description = String(body.description === undefined ? (current ? current.description : "") : body.description).trim();
  if (name.length < 2 || name.length > 40) return { error: "项目名称应为2到40个字符", field: "name" };
  if (!/^[A-Za-z0-9-]{2,40}$/.test(code)) return { error: "项目编码应为2到40位字母、数字或连字符", field: "code" };
  if (BOX_TYPES.indexOf(boxType) < 0) return { error: "盒型无效", field: "boxType" };
  for (const item of [["length", length], ["width", width], ["height", height]]) {
    if (!Number.isFinite(item[1]) || item[1] < 10 || item[1] > 1000) return { error: item[0] + " 应在10到1000毫米之间", field: item[0] };
  }
  if (!Number.isFinite(caliper) || caliper < 0.2 || caliper > 5) return { error: "克重/厚度应在0.2到5毫米之间", field: "caliper" };
  if (!/^#[0-9A-F]{6}$/.test(color)) return { error: "颜色应为#RRGGBB", field: "color" };
  if (PATTERNS.indexOf(pattern) < 0) return { error: "纹理无效", field: "pattern" };
  if (description.length > 200) return { error: "说明不能超过200个字符", field: "description" };
  return {
    name: name, code: code, boxType: boxType, length: length, width: width, height: height,
    caliper: caliper, materialId: materialId, color: color, pattern: pattern, description: description
  };
}

function summary(project, material) {
  const area = blankArea(project);
  const weight = weightKg(project, material);
  const cost = costOf(project, material);
  const carbon = carbonOf(project, material);
  return {
    areaSqm: area,
    weightKg: weight,
    cost: cost,
    carbonKg: carbon,
    volumeL: round(Number(project.length) * Number(project.width) * Number(project.height) / 1000000, 3),
    recyclable: Number(material.recyclable),
    score: ecoScore(material, carbon),
    conclusion: ecoConclusion(ecoScore(material, carbon))
  };
}

module.exports = {
  BOX_TYPES: BOX_TYPES,
  BOX_NAMES: BOX_NAMES,
  PATTERNS: PATTERNS,
  blankArea: blankArea,
  weightKg: weightKg,
  costOf: costOf,
  carbonOf: carbonOf,
  ecoScore: ecoScore,
  ecoConclusion: ecoConclusion,
  validate: validate,
  summary: summary
};
