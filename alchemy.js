import newArray from 'new-array';
import Vector from 'vector';
import regularPolygon from 'regular-polygon';
import lineIntersection from 'line-segment-intersection';
// import SimplexNoise from 'simplex-noise';
import flattenLineTree from './flatten-line-tree';
import SimplexNoise from 'simplex-noise';
import { PaperSize, Orientation } from 'penplot';
import { randomInt, randomFloat, setSeed } from 'penplot/util/random';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';

setSeed(Math.random());

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot(context, dimensions) {
  const [width, height] = dimensions;
  const margin = 1;
  const working_width = width - margin;
  const working_height = height - margin;
  const num_polys = 6;
  const circle_radius = 2;

  //---- Generate all the n-gon's ----
  let lines = newArray(num_polys).map((_, poly_num) => {
    const smallest_poly = 3;
    const poly_sides = smallest_poly + poly_num;

    const poly_center = [
      margin + circle_radius + poly_num / num_polys * (working_width),
      height / 2
    ];

    // Generate a single n-sided polygon
    const polygon_border = regularPolygon(poly_sides, poly_center, circle_radius);

    // Generate the internal polygon design
    const poly_design = generate_spokes(polygon_border);

    return [polygon_border, poly_design];
  });

  /**
   * Generate the spokes from polygon vertex towards the center of a
   * regular polygon
   * 
   * @param {Vector[]} polygon_verticies The edges of a regular polygon to create
   *  the spokes off of
   * @returns {Vector[]} All the spokes created inside a regular polygon
   */
  function generate_spokes(polygon_verticies) {
    const verticies_and_midpoints = polygon_verticies.reduce((acc, curr, index, array) => {
      const next_point = array[(index + 1) % array.length];
      return acc.concat([ curr, Vector.midpoint(curr, next_point) ]);
    }, []);

    let alchemy_spokes = [];
    const combined_length = verticies_and_midpoints.length;
    
    for (let vertex_index = 0; vertex_index < combined_length; vertex_index += 2) {
    // for (let vertex_index = 2; vertex_index < 4; vertex_index += 2) {
      // Generate the spoke line
      const opposite_index = (vertex_index + combined_length / 2 + 1) % combined_length;
      const vertex = verticies_and_midpoints[vertex_index];
      const opposite_point = verticies_and_midpoints[opposite_index];
      
      const extended_spoke = [
        vertex,
        opposite_point
      ];

      // alchemy_spokes.push(extended_spoke); // For Debug

      // Generate the line that will be the point for the spoke
      const adjacent_index = (combined_length + vertex_index - 1) % combined_length;
      const opposite_adj_index = (adjacent_index + combined_length / 2) % combined_length;
      const adjacent_vertex = verticies_and_midpoints[adjacent_index];
      const opposite_adj_vertex = verticies_and_midpoints[opposite_adj_index];

      const cutoff_line = [
        adjacent_vertex,
        opposite_adj_vertex
      ];

      // alchemy_spokes.push(cutoff_line); // For Debug

      // Now get the intersecion
      // ...
      const intersection = lineIntersection(extended_spoke, cutoff_line);

      // const internal_poly = regularPolygon(20, intersection, 0.2);
      // internal_poly.push(internal_poly[0]);
      // alchemy_spokes.push(internal_poly);

      alchemy_spokes.push([vertex, intersection]);
    }

    console.log(alchemy_spokes);
    return alchemy_spokes;
  }

  //---- Clip all the lines to a margin ----
  const box = [margin, margin, working_width, working_height];
  lines = clipPolylinesToBox(lines, box);

  return {
    draw,
    print,
    background: '#eaeaea',
    animate: false,
    clear: true
  };
  // --- Draw to the Web Canvas -----------------------------------------------
  function draw() {

    // ---- Column of Polygons ----
    lines.forEach(poly => {

      // ---- Polygon Border
      const polygon_edges = poly[0];
      context.beginPath();
      polygon_edges.forEach(p => context.lineTo(p[0], p[1]));
      context.lineTo(polygon_edges[0][0], polygon_edges[0][1]);
      context.stroke();

      // ---- Polygon Spokes
      const polygon_spokes = poly[1];
      polygon_spokes.forEach(poly => {
        context.beginPath();
        poly.forEach(p => context.lineTo(p[0], p[1]));
        context.stroke();
      });

    });
  }

  // ---- Generate The SVG Output Format ---------------------------------------
  function print() {
    return polylinesToSVG(lines, {
      dimensions
    });
  }
}