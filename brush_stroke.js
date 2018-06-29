import newArray from 'new-array';
import flattenLineTree from './flatten-line-tree';
import { PaperSize, Orientation } from 'penplot';
import { randomFloat, setSeed } from 'penplot/util/random';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';

setSeed(2);

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot (context, dimensions) {
  const [ width, height ] = dimensions;
  const margin = 1;

  const num_rows = 10;
  const num_cols = 10;
  const line_size = 0.65;

  let lines = newArray(num_rows).map((_, row) => {
    return newArray(num_cols).map((_, col) => {

        const box_center = [
          row / num_rows * width + width / num_rows / 2,
          col / num_cols * height + height / num_cols / 2
        ];

        return createStroke([
          [box_center[0] - line_size, box_center[1]],
          [box_center[0] + line_size, box_center[1]],
      ], row / num_rows, col / num_cols);
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

  function createStroke(line, in_strokes, in_spread) {
    const max_strokes = 20;
    const max_spread = Math.PI / 4;
    const vertical_spread = 0.6;
    const horizontal_spread = 0.05;

    const num_strokes = Math.max(1, Math.min(in_strokes, 1) * max_strokes);
    const spread = Math.min(in_spread, 1) * max_spread;

    const stroke = newArray(num_strokes).map((_,__) => {
      return [
        line[0],
        [
          line[1][0] + randomFloat(-horizontal_spread, horizontal_spread),
          line[1][1] + randomFloat(spread * -vertical_spread, spread * vertical_spread)
        ]
      ];
    });

    return stroke;
  }

  function draw () {
    const line_list = flattenLineTree(lines);
    for (const line of line_list) {
      context.beginPath();
      line.forEach(p => context.lineTo(p[0], p[1]));
      context.stroke();
    }
  }

  function print () {
    return polylinesToSVG(lines, {
      dimensions
    });
  }
}

