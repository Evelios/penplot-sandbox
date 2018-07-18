import newArray from 'new-array';
import flattenLineTree from './flatten-line-tree';
import { PaperSize, Orientation } from 'penplot';
import { randomFloat, setSeed } from 'penplot/util/random';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';
import poisson from 'adaptive-poisson-sampling';
import SimplexNoise from 'simplex-noise';
import Vector from 'vector';

setSeed(2);

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot (context, dimensions) {
  const [ width, height ] = dimensions;
  const margin = 1;
  const simplex = new SimplexNoise();

  const min_distance_cellsize = 0.001;
  const min_distance = 0.5;
  const max_distance = 1;
  const noise_scale = 0.15;
  const noise_density = vec => {
    const noise = Math.abs(simplex.noise2D(vec[0] * noise_scale, vec[1] * noise_scale));
    return min_distance + noise * (max_distance - min_distance);
  };

  let lines = poisson(dimensions, noise_density, min_distance_cellsize).map(point => {
    const p1 = [point[0] + 0.1, point[1]];
    const p2 = point;
    return [p1, p2];
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

