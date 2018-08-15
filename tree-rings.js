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
  const minCircleRadius = 0.1;
  const polygonSides = 300;
  const numberOfCircles = 60;
  const circleZSpacing = 0;
  const noiseStrength = 1;
  const noiseScale = 0.05;
  const simplex = new SimplexNoise();
  const pen_thickness = 0.03;
  const max_line_width = 0.1;
  const min_line_width = pen_thickness;

  let lines = newArray(numberOfCircles).map((_, cirNum) => {
    const cirPos = center;
    const normalizedCirNum = cirNum / numberOfCircles;
    const radiusAdjustment = Math.sin(Math.PI * normalizedCirNum); // For looking more rounded
    const circleRadius = minCircleRadius + maxCircleRadius * radiusAdjustment;
    let circle = regularPolygon(polygonSides, cirPos, circleRadius);
    circle.push(circle[0]);

    const line_width =  min_line_width + 
      ((noiseFunction(Vector.Polar(circleRadius * 20, 0)) + 1) / 2) *
      (max_line_width - min_line_width);

    // Offset the circle verticies by a noise function
    circle = circle.map((vertex) => {
      const angle = Vector.angle(Vector.subtract(center, vertex));
      const simplexAmmount = noiseStrength * noiseFunction(vertex);

      const noiseVector = Vector.Polar(simplexAmmount, angle);
      return Vector.add(vertex, noiseVector);
    });

    // console.log("Before", circle);
    circle = createStroke(circle, line_width, pen_thickness);
    // console.log("After", circle);

    return circle;

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

  function draw() {

    lines.forEach(circle => {
      context.beginPath();
      context.lineWidth = pen_thickness;
      circle.forEach(p => context.lineTo(p[0], p[1]));
      context.stroke();
    });
  }

  function print() {
    return polylinesToSVG(lines, {
      dimensions : dimensions,
      lineWidth  : pen_thickness
    });
  }
}