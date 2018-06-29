import newArray from 'new-array';
import flattenLineTree from './flatten-line-tree';
import { PaperSize, Orientation } from 'penplot';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot (context, dimensions) {
  const [ width, height ] = dimensions;
  const margin = 5;
  const working_width = width - margin;
  const working_height = height - margin;

  const num_rows = 10;
  const num_cols = 10;
  const line_size = 0.5;

  let lines = newArray(num_rows).map((_, row) => {
    return newArray(num_cols).map((_, col) => {

        const box_center = [
          row / num_rows * working_width  + working_width  / num_rows / 2 + margin / 2,
          col / num_cols * working_height + working_height / num_cols / 2 + margin / 2
        ];

        return [
          [box_center[0] - line_size, box_center[1]],
          [box_center[0] + line_size, box_center[1]],
      ];
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
    const line_list = flattenLineTree(lines);
    for (const line of line_list) {
      context.beginPath();
      line.forEach(p => context.lineTo(p[0], p[1]));
      context.stroke();
    }

    // lines.forEach(col => {
    //   col.forEach(points=> {
    //     context.beginPath();
    //     points.forEach(p => context.lineTo(p[0], p[1]));
    //     context.stroke();
    //   });
    // });
  }

  function print () {
    return polylinesToSVG(lines, {
      dimensions
    });
  }
}
