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
  const num_polys = 5;
  const circle_radius = 2;
  const circle_sides = 50;

  //---- Generate all the n-gon's ----
  let lines = newArray(num_polys).map((_, poly_num) => {
    const smallest_poly = 3;
    const poly_sides = smallest_poly + poly_num;
    const inner_radius = circle_radius * Math.cos(Math.PI / poly_sides);

    const poly_center = [
      margin + circle_radius + poly_num / num_polys * (working_width),
      height / 2
    ];

    // Generated the incircled polygon
    const outer_circle = regularPolygon(circle_sides, poly_center, circle_radius);
    const polygon_border = regularPolygon(poly_sides, poly_center, circle_radius);
    const inner_circle = regularPolygon(circle_sides, poly_center, inner_radius);

    return [outer_circle, inner_circle, polygon_border];
  });

  // --- Draw to the Web Canvas -----------------------------------------------
  function draw() {
    console.log(lines);

    lines.forEach(polygon_group => {
      polygon_group.forEach(poly => {
        context.beginPath();
        poly.forEach(p => context.lineTo(p[0], p[1]));
        context.lineTo(poly[0][0], poly[0][1]);
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
}