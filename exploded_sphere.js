import newArray from 'new-array';
import Vector from 'vector';
import regularPolygon from 'regular-polygon';
import optimizePaths from 'optimize-paths';
import flattenLines from './flatten-line-tree';
import SimplexNoise from 'simplex-noise';
import WorleyNoise from 'worley-noise';
import { PaperSize, Orientation } from 'penplot';
import { randomFloat, setSeed, randomInt } from 'penplot/util/random';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot (context, dimensions) {
  const [ width, height ] = dimensions;
  const margin = 1;
  const working_width = width - margin;
  const working_height = height - margin;

  const center = [width / 2, height / 2];
  const maxCircleRadius = 7.5;
  const minCircleRadius = 1.5;
  const polygonSides = 200;
  const numberOfCircles = 150 ;
  const circleZSpacing = 0.125;
  const noiseStrength = 2.5;
  const noiseScale = 0.125;
  const simplex = new SimplexNoise();
  const worley = new WorleyNoise(100, randomInt(10000));
  const worleyScale = 0.9 * Math.max(width, height);
  const worleyStrength = 30;
  const worley_simplex = 0.5;
  const offset_chance = 1/8;

  function noiseFunction(vertex, cirNum) {
    const simplexAmmount = noiseStrength * simplex.noise3D(
      noiseScale * vertex[0],
      noiseScale * vertex[1],
      noiseScale * cirNum * circleZSpacing
    );
    const worleyAmmount = worleyStrength * worley.getEuclidean(
      vertex[0] / worleyScale,
      vertex[1] / worleyScale,
      1
    );
    const noiseAmmount = (1 - worley_simplex) * simplexAmmount
      + worley_simplex * worleyAmmount;

    return noiseAmmount;
  }

  let lines = newArray(numberOfCircles).map((_, cirNum) => {
    const cirPos = center;
    const normalizedCirNum = cirNum / numberOfCircles;
    const radiusAdjustment = Math.sin(Math.PI * normalizedCirNum);
    const circleRadius = maxCircleRadius * radiusAdjustment;
    let circle = regularPolygon(polygonSides, cirPos, circleRadius, randomFloat(0, Math.PI));
    circle.push(circle[0]);

    // Offset the circle verticies by a noise function
    circle = circle.map((vertex) => {
      const noiseAmmount = noiseFunction(vertex, cirNum);
      const angle = Vector.angle(Vector.subtract(center, vertex));
      const noiseVector = Vector.Polar(noiseAmmount, angle);
      return Vector.add(vertex, noiseVector);
    });

    let broken_circle = [];
    // For each vertex in the circle
    for (let vert_index = 0; vert_index < circle.length - 1; vert_index++) {
      // Pull out individual segments and plot them on their own
      const vert1 = circle[vert_index];
      const vert2 = circle[vert_index + 1];

      const radius1 = Vector.magnitude(Vector.subtract(vert1, center));
      const radius2 = Vector.magnitude(Vector.subtract(vert2, center));

      const angle1 = Vector.angle(Vector.subtract(vert1, center));
      const angle2 = Vector.angle(Vector.subtract(vert1, center));
      const avg_angle = (angle1 + angle2) / 2
      const noise_offset = noiseFunction(vert1, cirNum);

      // For each segment check to see if the segment will be broken
      const breaking_distance = 2.5;
      const min_angle = 0;
      const max_angle = 2 * Math.PI;
      const rotation = Math.PI / 2;
      const angle_range = max_angle - min_angle;
      const rotated_angle = (rotation + avg_angle) % (2 * Math.PI);
      const lower_rate = 2 * (avg_angle - min_angle) / angle_range;
      const upper_rate = 2 * (max_angle - avg_angle) / angle_range;
      const will_break = Math.pow(Math.random(), 4) < Math.sqrt(noise_offset) * Math.min(lower_rate, upper_rate) &&
        Math.random() > offset_chance;
      if (will_break && radius1 > breaking_distance && radius2 > breaking_distance
        && angle1 < max_angle && angle2 < max_angle && angle1 > min_angle && angle2 > min_angle) {

        const offset_strength = 0.03;
        const adjusted_radius = Math.pow(Math.max(radius1, radius2) - breaking_distance, 3);
        const offset_ammount = noise_offset * offset_strength * adjusted_radius;
        const offset_vector = Vector.Polar(offset_ammount, randomFloat(2*Math.PI));

        const vert1_moved = Vector.add(vert1, offset_vector);
        const vert2_moved = Vector.add(vert2, offset_vector);

        broken_circle.push([vert1_moved, vert2_moved]);
      }
      // Return the segment as is and don't change it
      else {
        broken_circle.push([vert1, vert2]);
      }
    }
    
    return broken_circle;

  });

  // Clip all the lines to a margin
  const box = [ margin, margin, working_width, working_height ];
  lines = clipPolylinesToBox(lines, box);

  return {
    draw,
    print,
    background: '#eaeaea',
    animate: false,
    clear: true
  };

  function draw () {
    
    flattenLines(lines).forEach(path => {
      context.beginPath();
      path.forEach(p => context.lineTo(p[0], p[1]));
      context.stroke();
    });
  }

  function print () {
    return polylinesToSVG(optimizePaths(flattenLines(lines)), {
      dimensions
    });
  }
}