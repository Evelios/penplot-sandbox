import { PaperSize, Orientation } from 'penplot';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';
// import { randomFloat } from 'penplot/util/util/random'
import flattenLineTree from './flatten-line-tree';
import optimizePaths from 'optimize-paths';
import regularPolygon from 'regular-polygon';
import Vector from 'vector';
import poisson from 'adaptive-poisson-sampling';
import Voronoi from 'voronoi';
import newArray from 'new-array';
import createStroke from 'penplot-stroke';
import Alea from 'alea';

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot(context, dimensions) {

  // ---- Initilization Variables ----------------------------------------------

  // Page Dimensions
  const [width, height] = dimensions;
  const margin = 1;
  const working_width = width - margin;
  const working_height = height - margin;
  const alea = new Alea();
  const rng = Math.random; // or alea
  const voronoi = new Voronoi();;
  const vor_bbox = {
    xl : margin,
    xr : margin + working_width,
    yt : margin,
    yb : margin + working_height
  };
  
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

  // ---- Main Program ---------------------------------------------------------

  // ---- Create Points from the Poisson Distribution ----
  const centers = poisson(dimensions, density); // rng
  
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
    .map(edge => {
      return [
        [ edge.lSite.x, edge.lSite.y ],
        [ edge.rSite.x, edge.rSite.y ],
      ];
    });

  const voronoi_lines = voronoi_diagram.edges
    .filter(edge => {
      return edge.rSite !== null && edge.lSite !== null;
    })
    .map(edge => {
      return [
        [edge.va.x, edge.va.y],
        [edge.vb.x, edge.vb.y],
      ];
    });
  
  // ---- Logging From Voronoi Logic ----

  // console.log('Centers : ', centers);
  // console.log('Vor Bbox : ',vor_bbox);
  // console.log('Vor Sites', voronoi_sites);
  // console.log('Voronoi : ', voronoi);
  // console.log('Diagram', voronoi_diagram);
  // console.log('Vertices', voronoi_diagram.vertices);
  // console.log('Edges : ', voronoi_diagram.edges);

  // ---- Main Program ---------------------------------------------------------

  const center_dots = centers
    .map(point => regularPolygon(center_verticies, point, point_radius))
    // Append the first vert to draw full circle
    .map(poly => poly.concat([poly[0]]))
    .map(line => createStroke(line, center_weight, pen_width));
    

  const corner_dots = corners
    .map(point => regularPolygon(corner_verticies, point, point_radius))
    // Append the first vert to draw full circle
    .map(poly => poly.concat([poly[0]])) 
    .map(line => createStroke(line, corner_weight, pen_width));

  const voronoi_strokes = voronoi_lines
    .map(line => createStroke(line, voronoi_width, pen_width))


  // ---- Logging From Drawing Logic ----

  // console.log('Corner Dots :', corner_dots);
  // console.log('Center Dots :', center_dots);
  // console.log('Voronoi Strokes :', voronoi_strokes);

  // ---- Create the Main Drawing Container ------------------------------------
  let lines = [
    corner_dots,
    center_dots,
    // voronoi_lines,
    voronoi_strokes,
    deluany_lines
  ];

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
}