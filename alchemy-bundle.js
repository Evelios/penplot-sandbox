import Vector from 'vector';
import regularPolygon from 'regular-polygon';

module.exports = (function() {

  //---- Basic Functions -------------------------------------------------------
  var connectVerticies = function(polygon) {
    if (polygon.length % 2 !== 0) {
      return connectMidpoints(polygon);
    }

    let out_lines = [];
    for (let vertex = 0; vertex < polygon.length / 2; vertex++) {
      const opposite_vertex = (vertex + polygon.length / 2) % polygon.length;
      out_lines.push([polygon[vertex], polygon[opposite_vertex]]);
    }

    return out_lines;
  };

  var connectMidpoints = function(polygon) {
    let out_lines = [];
    const midpoints = inscribePolygon(polygon);

    if (polygon.length % 2 === 0) {
      for (let vertex = 0; vertex < midpoints.length / 2; vertex++) {
        const opposite_vertex = (vertex + midpoints.length / 2) % midpoints.length;
        out_lines.push([midpoints[vertex], midpoints[opposite_vertex]]);
      }
    }
    else {
      for (let vertex = 0; vertex < polygon.length; vertex++) {
        const opposite_vertex = (vertex + Math.floor(polygon.length / 2)) % polygon.length;
        out_lines.push([polygon[vertex], midpoints[opposite_vertex]]);
      }
    }

    return out_lines;  
  };

  var inset = function(polygon, ammount=0.5, rotation=0) {
    const center = Vector.avg(polygon);
    const base_radius = Vector.distance(polygon[0], center);
    const radius = base_radius * ammount;
    const base_rotation = Vector.angle(Vector.subtract(polygon[0], center));
    const inset_rotation = base_rotation + rotation;
    return regularPolygon(polygon.length, center, radius, inset_rotation);
  };

  /**
   * Create a circle that is inscribed in a polygon
   * 
   * @returns {Vector[]} The circle inscribed in the polygon
   */
  var incircle = function(polygon, center=Vector.avg(polygon), nsides=100) {
    const base_radius = Vector.distance(polygon[0], center);
    const radius = base_radius * Math.cos(Math.PI / polygon.length);
    return regularPolygon(nsides, center, radius);
  };

  /**
   * Create a circle that containes a polygon. That is, the circle that
   * would be inscribed by the input circle
   * 
   * @returns {Vector[]} The outer circle from the polygon
   */
  var outcircle = function(polygon, center=Vector.avg(polygon), nsides=100) {
    const radius = Vector.distance(polygon[0], center);
    return regularPolygon(nsides, center, radius);
  };

  /**
   * Inscribe a regular polygon inside another regular polygon. The new polygon
   * will have the same number of sides as the origional and will be rotated so
   * that the endpoints of the inner polygon touch the midpoints of the outer
   * polygon.
   * 
   * @returns {Vector[]} The inscribed polygon
   */
  var inscribePolygon = function(polygon, center=Vector.avg(polygon)) {
    const nsides = polygon.length;
    const rotation = Math.PI / nsides;
    const inset_ammount = Math.cos(Math.PI / nsides);

    return inset(polygon, inset_ammount, rotation);
  };

  //---- Complex Behaviors -----------------------------------------------------

  var cage = function(polygon, ammount=0.5) {
    const inset_polygon = inset(polygon, ammount);
    let spokes = [];

    for (let vertex = 0; vertex < polygon.length; vertex++) {
      spokes.push([polygon[vertex], inset_polygon[vertex]]);
    }

    return [inset_polygon, spokes];
  };

  var cage2 = function(polygon, ammount=0.5) {
    const midpoints = inscribePolygon(polygon);
    const inset_polygon = inset(polygon, ammount);
    const inset_midpoints = inscribePolygon(inset_polygon);
    let spokes = [];

    for (let vertex = 0; vertex < polygon.length; vertex++) {
      spokes.push([midpoints[vertex], inset_midpoints[vertex]]);
    }

    return [inset_polygon, spokes];
  };

  var cage3 = function(polygon, ammount=0.5) {
    const inset_rotation = -Math.PI / polygon.length;
    const inset_polygon = inset(polygon, ammount, inset_rotation);
    const inset_midpoints = inscribePolygon(inset_polygon);
    let spokes = [];

    for (let vertex = 0; vertex < polygon.length; vertex++) {
      spokes.push([polygon[vertex], inset_midpoints[vertex]]);
    }

    return [inset_polygon, spokes];
  };

  var cage4 = function(polygon, ammount=0.5) {
    const midpoints = inscribePolygon(polygon);
    const inset_rotation = Math.PI / polygon.length;
    const inset_polygon = inset(polygon, ammount, inset_rotation);
    let spokes = [];

    for (let vertex = 0; vertex < polygon.length; vertex++) {
      spokes.push([midpoints[vertex], inset_polygon[vertex]]);
    }

    return [inset_polygon, spokes];
  };

  /**
   * Create an elemental circle which consists of two circles with a polygon
   * in the center. The outer ring created by the two outer circles contains
   * 'n' small circles. The number of circles 'n' is the number of edges in
   * the inner polygon.
   * 
   * @param {Vector} center 
   * @param {number} radius 
   * @param {number} nsides 
   */
  var elementCircle = function(polynum, center, radius, rotation=Math.PI/2, circle_sides=100) {
    const inner_radius = radius * Math.cos(Math.PI / polynum);
    const ele_circle_radius = (radius - inner_radius) / 2;

    const outer_circle =  regularPolygon(circle_sides, center, radius, rotation);
    const inner_circle =  regularPolygon(circle_sides, center, inner_radius, rotation);
    const inner_polygon = regularPolygon(polynum,      center, inner_radius, rotation);

    const ele_circle_centers = regularPolygon(polynum, center, radius - ele_circle_radius, rotation);
    const outer_circles = ele_circle_centers.map(vertex => {
      return regularPolygon(circle_sides, vertex, ele_circle_radius);
    });

    return [outer_circle, outer_circles, inner_circle, inner_polygon];
  };

  return {
    // Basic
    connectVerticies : connectVerticies,
    connectMidpoints : connectMidpoints,
    inset            : inset,
    incircle         : incircle,
    outcircle        : outcircle,
    inscribePolygon  : inscribePolygon,

    // Shrink
    cage             : cage,
    cage2            : cage2,
    cage3            : cage3,
    cage4            : cage4,

    // Advanced
    elementCircle    : elementCircle,
  };

})();
