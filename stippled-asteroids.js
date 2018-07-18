import newArray from 'new-array';
import flattenLineTree from './flatten-line-tree';
import { PaperSize, Orientation } from 'penplot';
import { randomFloat, setSeed } from 'penplot/util/random';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';
import poisson from 'adaptive-poisson-sampling';
import SimplexNoise from 'simplex-noise';
import regularPolygon from 'regular-polygon';
import Vector from 'vector';

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot (context, dimensions) {
  const [ width, height ] = dimensions;
  const margin = 2;
  const simplex = new SimplexNoise();

  const min_distance_cellsize = 0.001;
  const min_distance = 0.1;
  const max_distance = 1;
  const noise_scale = 0.15;
  const noise_function = vec => {
    const noise = simplex.noise2D(vec[0] * noise_scale, vec[1] * noise_scale);
    const noise_skewed = Math.sqrt(Math.abs(noise));
    return min_distance + noise_skewed * (max_distance - min_distance);
  };

  let lines = poisson(dimensions, noise_function, min_distance_cellsize).map(point => {
    return mangledPolygon(point, noise_function(point));
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

  // Center=position of poly, mangle_ammount(0-1)=ammount of jitter
  function mangledPolygon(center, mangle_ammount=0) {
    const poly_size = 0.05 + Math.pow(mangle_ammount, 4) * 0.45;
    const jitter_size = poly_size / 2;
    const poly_sides = 3 + Math.floor(Math.pow(mangle_ammount, 4) * 8);
    const angle = randomFloat(0, 2*Math.PI);
    let polygon = regularPolygon(poly_sides, center, poly_size, angle);

    // Add the jitter
    let mangled = polygon.map(point => {
      const jitter = Vector.Polar(randomFloat(0, jitter_size),
                                  randomFloat(0, 2*Math.PI));
      return Vector.add(point, jitter);
    });

    mangled.push(mangled[0]);
    return mangled;
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
    return polylinesToSVG(flattenLineTree(lines), {
      dimensions
    });
  }
}

