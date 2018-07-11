import newArray from 'new-array';
import { PaperSize, Orientation } from 'penplot';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';

import regularPolygon from 'regular-polygon';
import flattenLineTree from './flatten-line-tree';
import Alchemy from './alchemy-bundle';
import Vector from 'vector';

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot(context, dimensions) {
  const [width, height] = dimensions;
  const margin = 1;
  const working_width = width - margin;
  const working_height = height - margin;
  const num_polys = 5;
  const nrows = 3;
  const circle_radius = 2;
  const starting_rotation = Math.PI / 2;

  //---- Generate all the n-gon's ----
  let lines = newArray(nrows).map((_, row) => { 
    return newArray(num_polys).map((_, poly_num) => {
      const smallest_poly = 3;
      const poly_sides = smallest_poly + poly_num;
      const depth = poly_sides;

      const poly_center = [
        margin     + circle_radius + poly_num / num_polys * working_width,
        margin * 2 + circle_radius + row      / nrows     * working_height
      ];

      const designPatterns = {
      
        0 : () => {
          return Alchemy.elementCircle(poly_sides, poly_center, circle_radius, starting_rotation);
        },

        1 : () => {

          const base = regularPolygon(poly_sides, poly_center, circle_radius, starting_rotation);

          const nestedCirclePoly = (poly, depth) => {
            const outcircle = Alchemy.outcircle(poly);
            const inscribed = Alchemy.inscribePolygon(poly);
            if (depth > 1) {
              return [outcircle, inscribed].concat(nestedCirclePoly(inscribed, depth - 1));
            } else {
              return [outcircle, inscribed];
            }
          };

          return [base].concat(nestedCirclePoly(base, num_polys));
        },

        2 : () => {
          const base = regularPolygon(poly_sides, poly_center, circle_radius, starting_rotation);

          const nestedCirclePoly = (poly, depth) => {
            const inscribed = Alchemy.inscribePolygon(poly);
            if (depth > 1) {
              return [inscribed].concat(nestedCirclePoly(inscribed, depth - 1));
            } else {
              return [inscribed];
            }
          };

          return [base].concat(nestedCirclePoly(base, num_polys));
        }

      };

      return [designPatterns[row]()];
    });
  });

  //---- Clip all the lines to a margin ----
  const box = [margin, margin, working_width, working_height];
  lines = clipPolylinesToBox(lines, box);

  // --- Draw to the Web Canvas -----------------------------------------------
  function draw() {
    console.log('Draw Output Lines');
    console.log(lines);

    // console.log('Flatten Output Structure');
    // console.log(flattenLineTree(lines, true));

    flattenLineTree(lines, true).forEach(path => {
      context.beginPath();
      path.forEach(p => context.lineTo(p[0], p[1]));
      context.stroke();
    });
  }

  // ---- Generate The SVG Output Format ---------------------------------------
  function print() {
    return polylinesToSVG(flattenLineTree(lines, true), {
      dimensions
    });
  }

  return {
    draw,
    print,
    background: '#eaeaea',
    animate: false,
    clear: true
  };
}