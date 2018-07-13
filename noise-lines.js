import newArray from 'new-array';
import flattenLineTree from './flatten-line-tree';
import { PaperSize, Orientation } from 'penplot';
import { randomFloat, setSeed } from 'penplot/util/random';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';
import SimplexNoise from 'simplex-noise';

setSeed(2);

export const orientation = Orientation.PORTRAIT;
export const dimensions = PaperSize.LETTER;

export default function createPlot (context, dimensions) {
  const simplex = new SimplexNoise();
  const [ width, height ] = dimensions;
  const margin = 1.5;
  const working_width = width - margin;
  const working_height = height - margin;
  const num_lines = 200;
  const line_segments = 300;
  const noise_scale = 3;
  const noise_strength = 12;
  

  let lines = newArray(num_lines).map((_, row) => {
    return newArray(line_segments).map((_, col) => {
      const xratio = row / num_lines;
      const yratio = col / line_segments;
      const inv_xratio = 1 - xratio;
      const inv_yratio = 1 - yratio;
      const min_xratio = Math.min(xratio, inv_xratio);
      const min_yratio = Math.min(yratio, inv_yratio);

      const basex = width  * xratio;
      const basey = height * yratio;

      const noise = noise_strength * simplex.noise2D(basex / noise_scale, basey / noise_scale);

      const x = basex + min_xratio *  noise * Math.pow(yratio, 3);
      const y = basey;

      return [x, y];

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
  }

  function print () {
    return polylinesToSVG(flattenLineTree(lines), {
      dimensions
    });
  }
}

