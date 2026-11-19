(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.DieLine = api;
})(typeof self !== "undefined" ? self : this, function () {
  function round(value, digits) {
    const factor = Math.pow(10, digits === undefined ? 2 : digits);
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function tuckNet(length, width, height) {
    const glue = 15;
    const tuck = Math.max(18, width * 0.18);
    const dust = Math.max(10, length * 0.08);
    const panels = [
      { name: "正面", x: glue, y: tuck + dust, w: length, h: height, cut: true },
      { name: "右侧", x: glue + length, y: tuck + dust, w: width, h: height, cut: true },
      { name: "背面", x: glue + length + width, y: tuck + dust, w: length, h: height, cut: true },
      { name: "左侧", x: glue + length * 2 + width, y: tuck + dust, w: width, h: height, cut: true },
      { name: "粘口", x: 0, y: tuck + dust, w: glue, h: height, cut: true },
      { name: "上插舌", x: glue, y: dust, w: length, h: tuck, cut: true, fold: true },
      { name: "下插舌", x: glue, y: tuck + dust + height, w: length, h: tuck, cut: true, fold: true },
      { name: "上防尘左", x: glue + length, y: 0, w: width, h: dust, cut: true, fold: true },
      { name: "上防尘右", x: glue + length + width, y: 0, w: length, h: dust, cut: true, fold: true },
      { name: "下防尘左", x: glue + length, y: tuck + dust + height, w: width, h: dust, cut: true, fold: true },
      { name: "下防尘右", x: glue + length + width, y: tuck + dust + height, w: length, h: dust, cut: true, fold: true }
    ];
    return { panels: panels, width: glue + length * 2 + width * 2, height: (tuck + dust + height) * 2, foldCount: 9, cutCount: 11 };
  }

  function mailerNet(length, width, height) {
    const flap = Math.max(12, height * 0.25);
    const panels = [
      { name: "底板", x: 0, y: flap, w: length, h: width, cut: true },
      { name: "前侧", x: 0, y: flap + width, w: length, h: height, cut: true, fold: true },
      { name: "后侧", x: 0, y: flap + width + height, w: length, h: height, cut: true, fold: true },
      { name: "盖板", x: 0, y: flap + width + height * 2, w: length, h: width, cut: true, fold: true },
      { name: "左侧翼", x: 0, y: flap + width, w: flap, h: height, cut: true, fold: true },
      { name: "右侧翼", x: length - flap, y: flap + width, w: flap, h: height, cut: true, fold: true },
      { name: "前插舌", x: 0, y: 0, w: length, h: flap, cut: true, fold: true },
      { name: "盖插舌", x: 0, y: flap + width + height * 2 + width, w: length, h: flap, cut: true, fold: true }
    ];
    return { panels: panels, width: length, height: flap * 2 + width * 2 + height * 2, foldCount: 7, cutCount: 8 };
  }

  function sleeveNet(length, width, height) {
    const glue = 12;
    const panels = [
      { name: "正面", x: glue, y: 0, w: length, h: height, cut: true },
      { name: "右侧", x: glue + length, y: 0, w: width, h: height, cut: true },
      { name: "背面", x: glue + length + width, y: 0, w: length, h: height, cut: true },
      { name: "左侧", x: glue + length * 2 + width, y: 0, w: width, h: height, cut: true },
      { name: "粘口", x: 0, y: 0, w: glue, h: height, cut: true }
    ];
    return { panels: panels, width: glue + length * 2 + width * 2, height: height, foldCount: 4, cutCount: 5 };
  }

  function net(boxType, length, width, height) {
    if (boxType === "mailer") return mailerNet(Number(length), Number(width), Number(height));
    if (boxType === "sleeve") return sleeveNet(Number(length), Number(width), Number(height));
    return tuckNet(Number(length), Number(width), Number(height));
  }

  function extent(layout) {
    let maxX = 0;
    let maxY = 0;
    layout.panels.forEach(function (panel) {
      maxX = Math.max(maxX, panel.x + panel.w);
      maxY = Math.max(maxY, panel.y + panel.h);
    });
    return { width: round(maxX, 1), height: round(maxY, 1) };
  }

  return { net: net, extent: extent };
});
