import newArray from 'new-array';
import Vector from "vector";
import regularPolygon from "regular-polygon";
import { PaperSize, Orientation } from 'penplot';
import { setSeed } from 'penplot/util/random';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';

setSeed(2);

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot (context, dimensions) {
  const [ width, height ] = dimensions;
  const margin = 2.5;
  const working_width = width - margin;
  const working_height = height - margin;

  const num_rows = 16;
  const num_cols = 8;
  const max_poly_size = 0.4;
  const jitter_size = 0.35;

  let lines = newArray(num_cols).map((_, col) => {
    return newArray(num_rows).map((_, row) => {

      const box_center = [
        row / num_rows * working_width  + working_width  / num_rows / 2 + margin / 2,
        col / num_cols * working_height + working_height / num_cols / 2 + margin / 2
      ];

      let polygon = regularPolygon(col + 3, box_center, 0.2 + row / num_rows * max_poly_size);
      polygon = polygon.map(point => {
        const jitter = Vector.Polar(Math.random() * row / num_rows * jitter_size,
                                    Math.random() * 2*Math.PI);
        return Vector.add(point, jitter);
      });
      
      return polygon;
    });
  });

  // Clip all the lines to a margin
  const box = [ margin, margin, width - margin, height - margin ];
  lines = clipPolylinesToBox(lines, box);

  return {
    draw,
    print,
    background: 'white',
    animate: false,
    clear: true
  };

  function draw () {
        
    lines.forEach(col => {
      col.forEach(poly => {

        // Fill in the stroke in polygon context
        context.beginPath();
        poly.forEach(p => context.lineTo(p[0], p[1]));
        context.lineTo(poly[0][0], poly[0][1]);
        context.stroke();

      });
    });
  }

  function print () {
    return polylinesToSVG(lines, {
      dimensions
    });
  }
}