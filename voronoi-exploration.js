import { PaperSize, Orientation } from 'penplot';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';
import flattenLineTree from './flatten-line-tree';
import optimizePaths from 'optimize-paths';
import Vector from 'vector';
import poisson from 'adaptive-poisson-sampling';
import voronoi from 'voronoi';
import newArray from 'new-array';
import createStroke from 'penplot-stroke';

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot(context, dimensions) {
  // Page Dimensions
  const [width, height] = dimensions;
  const margin = 1;
  const working_width = width - margin;
  const working_height = height - margin;

  // Parameters

  let lines = newArray(1).map((_, i) => {
    return [0, 0];
  });

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

  function draw() {

    lines.forEach(circle => {
      context.beginPath();
      circle.forEach(p => context.lineTo(p[0], p[1]));
      context.stroke();
    });
  }

  function print() {
    return polylinesToSVG(optimizePaths(lines), {
      dimensions
    });
  }
}