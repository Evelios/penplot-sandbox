import newArray from 'new-array';
import Vector from 'vector';
import regularPolygon from 'regular-polygon';
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
  const polygonSides = 300;
  const numberOfCircles = 150;
  const circleZSpacing = 0.125;
  const noiseStrength = 1.5;
  const noiseScale = 0.15;
  const simplex = new SimplexNoise();
  const worley = new WorleyNoise(100, randomInt(10000));
  const worleyScale = Math.max(width, height);
  const worleyStrength = 10;

  let lines = newArray(numberOfCircles).map((_, cirNum) => {
    const cirPos = center;
    const normalizedCirNum = cirNum / numberOfCircles;
    const radiusAdjustment = Math.sin(Math.PI * normalizedCirNum);
    const circleRadius = maxCircleRadius * radiusAdjustment;
    let circle = regularPolygon(polygonSides, cirPos, circleRadius);
    circle.push(circle[0]);

    // Offset the circle verticies by a noise function
    circle = circle.map((vertex) => {
      const angle = Vector.angle(Vector.subtract(center, vertex));
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
      const noiseAmmount = 1 * simplexAmmount + 1.5 * worleyAmmount;
      const noiseVector = Vector.Polar(noiseAmmount, angle);
      return Vector.add(vertex, noiseVector);
    });
    
    return circle;

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
        
    lines.forEach(circle => {
      context.beginPath();
      circle.forEach(p => context.lineTo(p[0], p[1]));
      context.stroke();
    });
  }

  function print () {
    return polylinesToSVG(lines, {
      dimensions
    });
  }
}