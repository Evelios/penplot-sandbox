import newArray from 'new-array';
import Vector from 'vector';
import regularPolygon from 'regular-polygon';
import SimplexNoise from 'simplex-noise';
import { PaperSize, Orientation } from 'penplot';
import { randomFloat, setSeed } from 'penplot/util/random';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';

setSeed(2);

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot (context, dimensions) {
  const [ width, height ] = dimensions;
  const margin = 2.5;
  const working_width = width - margin;
  const working_height = height - margin;

  const center = [2 * width / 7, 3 * height / 4];
  const maxCircleRadius = 7.5;
  const minCircleRadius = 1.5;
  const polygonSides = 300;
  const numberOfCircles = 200;
  const circleZSpacing = 0.125;
  const noiseStrength = 1.5;
  const noiseScale = 0.15;
  const simplex = new SimplexNoise();

  let lines = newArray(numberOfCircles).map((_, cirNum) => {
    const cirPos = Vector.add(center, [
        1.25 * working_width  / 7 * cirNum / numberOfCircles,
           -working_height / 4 * cirNum / numberOfCircles
      ]);

    const circleRadius = minCircleRadius + (maxCircleRadius - minCircleRadius) * cirNum / numberOfCircles;
    let circle = regularPolygon(polygonSides, cirPos, circleRadius);
    // There is a bug in here somewhere. It could have to do with the
    // angle function clamping when x=0. There are weird artifacts at
    // the top and bottom of the circles (and occasionally broken things)

    // Offset the circle verticies by a noise function
    circle = circle.map((vertex) => {
      const angle = Vector.angle(Vector.subtract(center, vertex));
      const noiseAmmount = noiseStrength * simplex.noise3D(
        noiseScale * vertex[0],
        noiseScale * vertex[1],
        noiseScale * cirNum * circleZSpacing
      );
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