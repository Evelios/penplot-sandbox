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

  const center = [width / 2, height / 2];
  const circleRadius = 5;
  const polygonSides = 10;
  const numberOfCircles = 1;
  const circleZSpacing = 0.5;
  const noiseStrength = 2;
  const noiseScale = 0.1;
  const simplex = new SimplexNoise();

  let lines = newArray(numberOfCircles).map((_, cirNum) => {

    let circle = regularPolygon(polygonSides, center, circleRadius);
    circle = circle.map((vertex) => {
      console.log(Vector.subtract(center, vertex));
      const angle = Vector.angle(Vector.subtract(center, vertex));
      console.log(angle * 180 / (2*Math.PI));
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
    background: 'white',
    animate: false,
    clear: true
  };

  function draw () {
        
    lines.forEach(circle => {

      // Fill in the stroke in polygon context
      context.beginPath();
      circle.forEach(p => context.lineTo(p[0], p[1]));
      context.lineTo(circle[0][0], circle[0][1]);
      context.stroke();

    });
  }

  function print () {
    return polylinesToSVG(lines, {
      dimensions
    });
  }
}