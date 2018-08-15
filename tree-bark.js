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

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot(context, dimensions) {
  const [width, height] = dimensions;
  const margin = 1;
  const working_width = width - margin;
  const working_height = height - margin;

  const center = [width / 2, height / 2];
  const maxCircleRadius = 7.5;
  const minCircleRadius = 1.5;
  const polygonSides = 300;
  const numberOfCircles = 50;
  const circleZSpacing = 0;
  const noiseStrength = 1;
  const noiseScale = 0.05;
  const simplex = new SimplexNoise();
  const pen_thickness = 0.2;
  const max_line_width = 0.5;
  const min_line_width = 0.2;

  let lines = newArray(numberOfCircles).map((_, cirNum) => {
    const cirPos = center;
    const normalizedCirNum = cirNum / numberOfCircles;
    const radiusAdjustment = Math.sin(Math.PI * normalizedCirNum); // For looking more rounded
    const circleRadius = maxCircleRadius * normalizedCirNum;
    let circle = regularPolygon(polygonSides, cirPos, circleRadius);
    circle.push(circle[0]);
    // const line_width =  min_line_width + normalizedCirNum * (max_line_width - min_line_width);
    const line_width = max_line_width;

    // Offset the circle verticies by a noise function
    circle = circle.map((vertex) => {
      const angle = Vector.angle(Vector.subtract(center, vertex));
      const simplexAmmount = noiseStrength * noiseFunction(vertex);

      const noiseVector = Vector.Polar(simplexAmmount, angle);
      return Vector.add(vertex, noiseVector);
    });

    circle = createStroke(circle, line_width, pen_thickness);

    return circle;

  });

  // Clip all the lines to a margin
  const box = [margin, margin, working_width, working_height];
  lines = clipPolylinesToBox(lines, box);

  return {
    draw,
    print,
    background: '#eaeaea',
    animate: false,
    clear: true
  };
  
  function noiseFunction(vertex) {
    return noise(vertex, 1, 1, 5)

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

  function draw() {

    flattenLineTree(lines).forEach(circle => {
      context.beginPath();
      circle.forEach(p => context.lineTo(p[0], p[1]));
      context.stroke();
    });
  }

  function print() {
    return polylinesToSVG(flattenLineTree(lines), {
      dimensions
    });
  }
}