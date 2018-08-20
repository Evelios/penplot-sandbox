// Utilities
import { PaperSize, Orientation } from 'penplot';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';
import { randomFloat, setSeed } from 'penplot/util/random';
import flattenLineTree from './flatten-line-tree';
import optimizePaths from 'optimize-paths';
import Alea from 'alea';
import newArray from 'new-array';
// Geometry
import regularPolygon from 'regular-polygon';
import Vector from 'vector';
import poisson from 'adaptive-poisson-sampling';
import Voronoi from 'voronoi';
// Drawing
import createStroke from 'penplot-stroke';
import polyCrosshatch from 'polygon-crosshatching';

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot(context, dimensions) {

  // ---- Initilization Variables ----------------------------------------------

  // Page Dimensions
  const [width, height] = dimensions;
  const margin = 1;
  const working_width = width - margin;
  const working_height = height - margin;
  
  const voronoi = new Voronoi();
  const vor_bbox = {
    xl : margin,
    xr : margin + working_width,
    yt : margin,
    yb : margin + working_height
  };

  const poly_bbox = [
    [vor_bbox.xl, vor_bbox.yt], [vor_bbox.xr, vor_bbox.yt],
    [vor_bbox.xr, vor_bbox.yb], [vor_bbox.xl, vor_bbox.yb]
  ];

  // Random Number Generation
  const seed = Math.random();
  const alea = new Alea(seed);
  const rng = alea;
  setSeed(seed);
  // const rng = Math.random;

  // Algorithm Parameters
  const density = 2;
  const corner_verticies = 5;
  const center_verticies = 6;
  
  // Drawing properties
  const pen_width = 0.02;
  const point_radius = 0.1;
  const voronoi_width = pen_width * 3;
  const center_weight = pen_width * 6;
  const corner_weight = pen_width * 3;
  // const deluany_width = pen_width;
  const hatching_density = 0.1;

  // ---- Main Program ---------------------------------------------------------

  // ---- Create Points from the Poisson Distribution ----
  const centers = poisson(dimensions, density, rng);
  
  // --- Create The Voronoi Diagram ----
  const voronoi_sites = centers.map(vert => {
    return { x: vert[0], y: vert[1] };
  });
  const voronoi_diagram = voronoi.compute(voronoi_sites, vor_bbox);

  // ---- Extract Information from the Voronoi Diagram ----

  const corners = voronoi_diagram.vertices.map(vert => [vert.x, vert.y]);

  const deluany_lines = voronoi_diagram.edges
    .filter(edge => {
      return edge.rSite !== null && edge.lSite !== null;
    })
    // Convert edges from {x,y} => [x, y]
    .map(e => [ [e.lSite.x, e.lSite.y], [e.rSite.x, e.rSite.y], ]);

  const voronoi_lines = voronoi_diagram.edges
    .filter(e => e.rSite !== null && e.lSite !== null)
    .map(e => [ [e.va.x, e.va.y], [e.vb.x, e.vb.y], ]); // Convert edges from {x,y} => [x, y]


  const tiles = voronoi_diagram.cells
    // Make sure the cell has halfedges
    .filter(tile => tile.halfedges.length > 0)
    // Flatten the cell data structure
    .reduce((acc, tile) => acc.concat([tile.halfedges]), [])
    // Take out all the edges of the polygons
    .map(halfedges => {
      return halfedges
        .filter(halfedge => halfedge.edge.lSite && halfedge.edge.rSite)
        // Convert edge to [ [x,y], [x,y] ]
        .map(halfedge => {
          return [
            [halfedge.edge.va.x, halfedge.edge.va.y],
            [halfedge.edge.vb.x, halfedge.edge.vb.y] 
          ];
        });
    })
    // Polygon must have 3 or more edges
    .filter(edges => edges.length >= 3)
    // Flatten segments into a single array
    .map(edges => edges.reduce((acc, edge) => acc.concat(edge)))
    // Remove duplicate verticies
    .map(edges => {
      return edges
        .reduce((acc, edge) => {
          return acc.findIndex(unique => unique[0] == edge[0] && unique[1] == edge[1]) < 0 ?
            [...acc, edge] : acc;
        }, []);
    })
    // Sort the corners so that they are arranged in clockwise order
    .map(verticies => {
      const center = Vector.avg(verticies);
      const sortFn = comparePolyPoints(center);
      return verticies.slice().sort(sortFn);
    });

  // ---- Logging From Voronoi Logic ----

  // console.log('Centers : ', centers);
  // console.log('Vor Bbox : ',vor_bbox);
  // console.log('Vor Sites', voronoi_sites);
  // console.log('Voronoi : ', voronoi);
  // console.log('Diagram', voronoi_diagram);
  // console.log('Vertices', voronoi_diagram.vertices);
  // console.log('Edges : ', voronoi_diagram.edges);
  // console.log('Cells : ', voronoi_diagram.cells);
  // console.log('Tiles : ', tiles);

  // ---- Drawing Logic --------------------------------------------------------

  const center_dots = centers
    .map(point => regularPolygon(center_verticies, point, point_radius))
    .map(poly => poly.concat([poly[0]])) // Append the first vert to draw full circle
    .map(line => createStroke(line, center_weight, pen_width));

  const corner_dots = corners
    .map(point => regularPolygon(corner_verticies, point, point_radius))
    .map(poly => poly.concat([poly[0]])) // Append the first vert to draw full circle
    .map(line => createStroke(line, corner_weight, pen_width));

  const voronoi_strokes = voronoi_lines
    .map(line => createStroke(line, voronoi_width, pen_width));
  
  const tile_strokes = tiles
    .map(tile => polyCrosshatch(tile, hatching_density, randomFloat(2*Math.PI)));

  const tile_outline = tiles.map(tile => tile.concat([tile[0]]));

  // ---- Logging From Drawing Logic ----

  // console.log('Corner Dots :', corner_dots);
  // console.log('Center Dots :', center_dots);
  // console.log('Voronoi Strokes :', voronoi_strokes);
  // console.log('Tile Strokes : ', tile_strokes);
  // console.log('Tile Outline : ', tile_outline);

  // ---- Create the Main Drawing Container ------------------------------------
  let lines = [
    // corner_dots,
    // center_dots,
    // voronoi_lines,
    // voronoi_strokes,
    // deluany_lines,
    tile_strokes,
    // tile_outline,
  ];

  // console.log('Lines : ', lines);

  // ---- Clip the Lines to the Frame ----
  const box = [margin, margin, working_width, working_height];
  lines = clipPolylinesToBox(flattenLineTree(lines), box);

  return {
    draw,
    print,
    background: '#eaeaea',
    animate: false,
    clear: true
  };

  // ---- Canvas Drawing Function ----------------------------------------------

  function draw() {

    lines.forEach(circle => {
      context.beginPath();
      circle.forEach(p => context.lineTo(p[0], p[1]));
      context.stroke();
    });
  }

  // ---- SVG Drawing Function -------------------------------------------------

  function print() {
    return polylinesToSVG(optimizePaths(lines, pen_width), {
      dimensions : dimensions,
      lineWidth : pen_width
    });
  }

  // ---- Polygon Sorting Algorithm --------------------------------------------
  // http://stackoverflow.com/questions/6989100/sort-points-in-clockwise-order
  
  function comparePolyPoints(center) {
    return (a, b) => {

      if (a[0] - center[0] >= 0 && b[0] - center[0] <  0) return -1;
      if (a[0] - center[0] <  0 && b[0] - center[0] >= 0) return 1;

      if (a[0] === center[0] && b[0] === center[0]) {
          if (a[1] - center[1] >= 0 || b[1] - center[1] >= 0) {
            return a[1] > b[1] ? -1 : 1;
          }
          return b[1] > a[1] ? -1 : 1;
      }

      // compute the cross product of vectors (center -> a) x (center -> b)
      const det = (a[0] - center[0]) * (b[1] - center[1]) -
                  (b[0] - center[0]) * (a[1] - center[1]);

      if (det < 0) return -1;
      if (det > 0) return 1;

      // points a and b are on the same line from the center
      // check which point is closer to the center
      const d1 = Vector.distance(a, center);
      const d2 = Vector.distance(b, center);

      return d1 > d2 ? -1 : 1;
    };
  }
}