import newArray from 'new-array';
import { PaperSize, Orientation } from 'penplot';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';

import Vector from 'vector';
import regularPolygon from 'regular-polygon';
import flattenLineTree from './flatten-line-tree';
import Alchemy from './alchemy-bundle';

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
  const circle_sides = 50;

  //---- Generate all the n-gon's ----
  let lines = newArray(nrows).map((_, row) => { 
    return newArray(num_polys).map((_, poly_num) => {
      const smallest_poly = 3;
      const poly_sides = smallest_poly + poly_num;
      const inner_radius = circle_radius * Math.cos(Math.PI / poly_sides);

      const poly_center = [
        margin     + circle_radius + poly_num / num_polys * working_width,
        margin * 2 + circle_radius + row      / nrows     * working_height
      ];

      let out = [];

      const designPatterns = {
      
        0 : () => {
            return Alchemy.elementCircle(poly_sides, poly_center, circle_radius);
        },

        1 : () => {
          const base = regularPolygon(poly_sides, poly_center, circle_radius);
          const outside = Alchemy.outcircle(base, poly_center);
          return [base, outside];
        },

        2 : () => {
          const base = regularPolygon(poly_sides, poly_center, circle_radius);
          const inside = Alchemy.inscribePolygon(base, poly_center);
          return [base, inside];
        }

      };

      return [designPatterns[row]()];
    });
  });

  // --- Draw to the Web Canvas -----------------------------------------------
  function draw() {
    console.log(flattenLineTree(lines, true));

    flattenLineTree(lines, true).forEach(path => {
      context.beginPath();
      path.forEach(p => context.lineTo(p[0], p[1]));
      context.stroke();
    });

    // lines.forEach(row => {
    //   row.forEach(polygonGroup => {
    //     polygonGroup.forEach(poly => {
    //       context.beginPath();
    //       poly.forEach(p => context.lineTo(p[0], p[1]));
    //       context.lineTo(poly[0][0], poly[0][1]);
    //       context.stroke();
    //     });
    //   });
    // });

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