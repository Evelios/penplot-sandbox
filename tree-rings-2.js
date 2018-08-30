import newArray from 'new-array';
import Vector from 'vector';
import regularPolygon from 'regular-polygon';
import SimplexNoise from 'simplex-noise';
import WorleyNoise from 'worley-noise';
import { PaperSize, Orientation } from 'penplot';
import { randomFloat, setSeed, randomInt } from 'penplot/util/random';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';
import createStroke from 'penplot-stroke';
import flattenLineTree from './flatten-line-tree';
import optimizePath from 'optimize-paths';

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot(context, dimensions) {
  const [width, height] = dimensions;
  const margin = 1;
  const working_width = width - margin;
  const working_height = height - margin;

  const center = [width / 2, height / 2];
  const maxCircleRadius = 7.5;
  const minCircleRadius = 0.1;
  const polygonSides = 300;
  const numberOfCircles = 20;
  const noiseStrength = 2;
  const stroke_noise_strength = 5;
  const noiseScale = 0.075;
  const stroke_noise_scale = 0.075;
  const simplex = new SimplexNoise();
  const pen_thickness = 0.03;
  const line_width = pen_thickness * 15;
  // const max_line_width = pen_thickness * 5;
  // const min_line_width = pen_thickness;

  let lines = newArray(numberOfCircles).map((_, cirNum) => {
    const cirPos = center;
    const normalizedCirNum = cirNum / numberOfCircles;
    const radiusAdjustment = Math.sin(Math.PI * normalizedCirNum); // For looking more rounded
    const circleRadius = minCircleRadius + maxCircleRadius * radiusAdjustment;
    const circle = regularPolygon(polygonSides, cirPos, circleRadius, randomFloat(2*Math.PI));

    // const line_width_noise = noiseFunction(Vector.Polar(circleRadius * 20, 0));
    // const norm_line_width_noise = (line_width_noise + 1) / 2;
    // const line_width =  min_line_width + norm_line_width_noise * (max_line_width - min_line_width);

    // Offset the circle verticies by a noise function
    const circle_offset = circle.map((vertex) => {
      const angle = Vector.angle(Vector.subtract(center, vertex));
      const simplex_ammount = noiseStrength * noiseFunction(vertex);

      const noise_vector = Vector.Polar(simplex_ammount, angle);

      return Vector.add(vertex, noise_vector);
    });

    const line_width_style = circle.map(vertex => {
      const raw_noise = strokeOffsetNoiseFunction(vertex);
      const min_value = 0.05;
      const adjusted_noise = raw_noise < min_value && raw_noise > -min_value ?
        min_value : raw_noise;
          
      return stroke_noise_strength * adjusted_noise;
    });

    const circle_strokes = createStroke(circle_offset, line_width, pen_thickness, {

      // line_width_style : [5, 4, 3, 2, 1, 0.5, 0.25, 0, 0.25, 0.5, 1, 2, 3, 4],
      line_width_style : line_width_style,
      polygon : true,
    });

    return circle_strokes;

  });

  lines.shift(); // Hack to remove not working circle

  
  // Clip all the lines to a margin
  const box = [margin, margin, working_width, working_height];
  lines = clipPolylinesToBox(flattenLineTree(lines), box);

  return {
    draw,
    print,
    background: '#eaeaea',
    animate: false,
    clear: true
  };
  
  function noiseFunction(vertex) {
    return noise(vertex, 1, 1, 5);

    function noise(vertex, strength, frequency, depth) {
      const recursive_noise = depth > 0 ?
       noise(vertex, strength / 2, frequency / 2, depth - 1) :
       0;

      return strength * simplex.noise2D(
        noiseScale * (vertex[0] / frequency),
        noiseScale * (vertex[1] / frequency)
      ) + recursive_noise;
    }
  }

  function strokeOffsetNoiseFunction(vertex) {
    return noise(vertex, 1, 1, 5);

    function noise(vertex, strength, frequency, depth) {
      const recursive_noise = depth > 0 ?
       noise(vertex, strength / 2, frequency / 2, depth - 1) :
       0;

      return strength * simplex.noise2D(
        stroke_noise_scale * (vertex[0] / frequency),
        stroke_noise_scale * (vertex[1] / frequency)
      ) + recursive_noise;
    }
  }

  function draw() {

    lines.forEach(circle => {
      context.beginPath();
      context.lineWidth = pen_thickness;
      circle.forEach(p => context.lineTo(p[0], p[1]));
      context.stroke();
    });
  }

  function print() {
    return polylinesToSVG(optimizePath(lines), {
      dimensions : dimensions,
      lineWidth  : pen_thickness
    });
  }
}