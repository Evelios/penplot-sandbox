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
  const nrows = 4;
  const circle_radius = 2;
  const starting_rotation = Math.PI / 2;

  //---- Generate all the n-gon's ----
  let lines = newArray(nrows).map((_, row) => { 
    return newArray(num_polys).map((_, poly_num) => {
      const smallest_poly = 3;
      const poly_sides = smallest_poly + poly_num;
      const depth = poly_sides;

      const poly_center = [
        margin + circle_radius + poly_num / num_polys * working_width,
        margin + circle_radius + row      / nrows     * working_height
      ];

      const designPatterns = {
      
        0 : () => {
          const base = regularPolygon(poly_sides, poly_center, circle_radius, starting_rotation);
          const center_lines = Alchemy.cage(base);
          return [base, center_lines];
        },

        1 : () => {
          const base = regularPolygon(poly_sides, poly_center, circle_radius, starting_rotation);
          const center_lines = Alchemy.cage2(base);
          return [base, center_lines];
        },

        2 : () => {
          const base = regularPolygon(poly_sides, poly_center, circle_radius, starting_rotation);
          const center_lines = Alchemy.cage3(base);
          return [base, center_lines];
        },

        3 : () => {
          const base = regularPolygon(poly_sides, poly_center, circle_radius, starting_rotation);
          const center_lines = Alchemy.cage4(base);
          return [base, center_lines];
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