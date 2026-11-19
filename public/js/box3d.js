(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.Box3D = api;
})(typeof self !== "undefined" ? self : this, function () {
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function rotatePoint(point, yaw, pitch) {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const x1 = point.x * cy - point.z * sy;
    const z1 = point.x * sy + point.z * cy;
    const y1 = point.y * cp - z1 * sp;
    const z2 = point.y * sp + z1 * cp;
    return { x: x1, y: y1, z: z2 };
  }

  function project(point, zoom, width, height) {
    const distance = 900;
    const scale = 240 * zoom;
    const factor = distance / (distance + point.z + 600);
    return {
      x: width / 2 + point.x * scale * factor / 100,
      y: height / 2 - point.y * scale * factor / 100,
      z: point.z
    };
  }

  function vertices(length, width, height) {
    const l = length / 2;
    const w = width / 2;
    const h = height / 2;
    return [
      { x: -l, y: -h, z: -w }, { x: l, y: -h, z: -w }, { x: l, y: h, z: -w }, { x: -l, y: h, z: -w },
      { x: -l, y: -h, z: w }, { x: l, y: -h, z: w }, { x: l, y: h, z: w }, { x: -l, y: h, z: w }
    ];
  }

  const FACES = [
    [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [1, 2, 6, 5], [0, 3, 7, 4]
  ];

  function normal(points) {
    const a = points[0];
    const b = points[1];
    const c = points[2];
    const ux = b.x - a.x;
    const uy = b.y - a.y;
    const uz = b.z - a.z;
    const vx = c.x - a.x;
    const vy = c.y - a.y;
    const vz = c.z - a.z;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    return { x: nx / len, y: ny / len, z: nz / len };
  }

  function shade(normalVector, light) {
    const dot = normalVector.x * light.x + normalVector.y * light.y + normalVector.z * light.z;
    return clamp(0.48 + Math.abs(dot) * 0.52, 0.3, 1);
  }

  function faceDepth(points) {
    return points.reduce(function (sum, item) { return sum + item.z; }, 0) / points.length;
  }

  function zoomClamp(value) {
    return clamp(Number(value) || 1, 0.5, 2.5);
  }

  return {
    rotatePoint: rotatePoint,
    project: project,
    vertices: vertices,
    FACES: FACES,
    normal: normal,
    shade: shade,
    faceDepth: faceDepth,
    zoomClamp: zoomClamp
  };
});
