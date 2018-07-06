import newArray from 'new-array';
import Vector from 'vector';
import regularPolygon from 'regular-polygon';
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
  const num_polys = 5;
  const circle_radius = 2;

  //---- Generate all the n-gon's ----
  let lines = newArray(num_polys).map((_, poly_num) => {
    const smallest_poly = 3;
    const poly_sides = smallest_poly + poly_num;

    console.log(`Number of Polygon Sides: ${poly_sides}`);
    const poly_center = [
      margin + circle_radius + poly_num / num_polys * (working_width),
      height / 2
    ];

    console.log(`Polygon Number: ${poly_sides}`);

    // Generate a single n-sided polygon
    const polygon_border = regularPolygon(poly_sides, poly_center, circle_radius);
    console.log(`Polygon Border: ${poly_sides}`);

    // Generate the internal polygon design
    const poly_design = generate_spokes(polygon_border);

    // console.log(polygon_border);
    // return polygon_border;
    console.log("Finished Designs:")
    console.log([polygon_border, poly_design]);
    return [polygon_border, poly_design];
  });

  /**
   * Generate the spokes from polygon vertex towards the center of a
   * regular polygon
   * 
   * @param {Vector[]} polygon_edges The edges of a regular polygon to create
   *  the spokes off of
   * @returns {Vector[]} All the spokes created inside a regular polygon
   */
  function generate_spokes(polygon_edges) {
    console.log(`Polygon Edges:`);
    console.log(polygon_edges);

    let alchemy_spokes = [];
    for (let vertex_count = 0; vertex_count < polygon_edges.length; vertex_count++) {
      const vertex = polygon_edges[vertex_count];
      const opposite_point = get_opposite_point(polygon_edges, vertex_count);

      alchemy_spokes.push([
        polygon_edges[vertex_count],
        opposite_point
      ]);
    }

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
      context.lineTo(poly[0][0], poly[0][1]);
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

  //---- Helper Functions ----------------------------------------------------

  /**
   * From a regular polygon, get the opposite point from a particular vertex.
   * If the polygon has an odd number of sides, this would be the midpoint
   * of the opposite edge.
   * @param {Vector[]} regular_polygon 
   * @param {number} vertex_index 
   * @returns {Vector} The location opposite a vertex
   */
  function get_opposite_point(regular_polygon, vertex_index) {
    const n_sides = regular_polygon.length;

    // Even number of verticies
    if (n_sides % 2 == 0) {
      const opposite_vertex = (n_sides + vertex_index) % n_sides;
      return regular_polygon[opposite_vertex];
    }

    // Odd number of verticies
    else {
      const half_minus_one = Math.floor(n_sides / 2);
      return Vector.midpoint(
        regular_polygon[half_minus_one % n_sides],
        regular_polygon[(half_minus_one + 1) % n_sides]
      );
    }
  }
}