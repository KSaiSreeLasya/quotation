import { Point } from '../types';

export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return true; // No boundary defined
  
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

export function getPanelCorners(panel: { x: number, y: number, rotation: number, width: number, height: number }): Point[] {
  const rad = (panel.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  const hw = panel.width / 2;
  const hh = panel.height / 2;
  
  const corners = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh }
  ];
  
  return corners.map(p => ({
    x: panel.x + (p.x * cos - p.y * sin),
    y: panel.y + (p.x * sin + p.y * cos)
  }));
}

export function doPolygonsIntersect(polyA: Point[], polyB: Point[]): boolean {
  const polygons = [polyA, polyB];
  
  for (let i = 0; i < polygons.length; i++) {
    const polygon = polygons[i];
    for (let i1 = 0; i1 < polygon.length; i1++) {
      const i2 = (i1 + 1) % polygon.length;
      const p1 = polygon[i1];
      const p2 = polygon[i2];
      
      const normal = { x: p2.y - p1.y, y: p1.x - p2.x };
      
      let minA = Infinity, maxA = -Infinity;
      for (const p of polyA) {
        const projected = normal.x * p.x + normal.y * p.y;
        if (projected < minA) minA = projected;
        if (projected > maxA) maxA = projected;
      }
      
      let minB = Infinity, maxB = -Infinity;
      for (const p of polyB) {
        const projected = normal.x * p.x + normal.y * p.y;
        if (projected < minB) minB = projected;
        if (projected > maxB) maxB = projected;
      }
      
      if (maxA < minB || maxB < minA) return false;
    }
  }
  return true;
}

export function autoFillPanels(
  boundary: Point[],
  panelWidth: number,
  panelHeight: number,
  spacing: number,
  rowSpacing: number,
  rotation: number,
  isLandscape: boolean
): { x: number, y: number }[] {
  if (boundary.length < 3) return [];

  const pWidth = isLandscape ? panelHeight : panelWidth;
  const pHeight = isLandscape ? panelWidth : panelHeight;

  // Find bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  boundary.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });

  const results: { x: number, y: number }[] = [];
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Step through the bounding box with a grid
  // We use a larger grid and rotate the points to check
  const stepX = pWidth + spacing;
  const stepY = pHeight + rowSpacing;

  // For simplicity, we'll use a dense grid and check each point
  for (let y = minY - stepY; y <= maxY + stepY; y += stepY) {
    for (let x = minX - stepX; x <= maxX + stepX; x += stepX) {
      const corners = getPanelCorners({ x, y, rotation, width: pWidth, height: pHeight });
      
      // Check if all corners are inside the boundary
      const isInside = corners.every(c => isPointInPolygon(c, boundary));
      
      if (isInside) {
        // Check for collisions with already placed panels
        const hasCollision = results.some(r => {
          const otherCorners = getPanelCorners({ x: r.x, y: r.y, rotation, width: pWidth, height: pHeight });
          return doPolygonsIntersect(corners, otherCorners);
        });

        if (!hasCollision) {
          results.push({ x, y });
        }
      }
    }
  }

  return results;
}
