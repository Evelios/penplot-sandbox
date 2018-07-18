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
  const min_line_length = 0.1;
  const max_line_length = 0.2;
  const min_distance = 0.1;
  const max_distance = 0.5;
  const noise_scale = 0.15;

  //---- Utility Functions -----------------------------------------------------
  function noise_function(vec, z_offset=0) {
    const raw_noise = simplex.noise3D(
      vec[0] * noise_scale,
      vec[1] * noise_scale,
      z_offset
    );
    return Math.pow(Math.abs(raw_noise), 4);
  };

  function noise_density(vec) {
    return min_distance + noise_function(vec) * (max_distance - min_distance);
  };

  //---- Line Creation ---------------------------------------------------------

  let lines = poisson(dimensions, noise_density, min_distance_cellsize).map(point => {
    const initial_rotation = Math.PI;
    const noise_offset = 10;

    // Create the noise
    const raw_noise = noise_function(point);
    const offset_noise = noise_function(point, noise_offset);

    // Set the line vector
    const line_length = min_line_length + (1 - raw_noise) * (max_line_length -  min_line_length) ;
    const rotation = initial_rotation + 2*Math.PI * raw_noise;
    const vector_direction = Vector.Polar(line_length, rotation);
    
    return [point, Vector.add(point, vector_direction)];
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

  //---- Library Functions -----------------------------------------------------

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

