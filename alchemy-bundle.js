import Vector from "vector";
import regularPolygon from "regular-polygon";

module.exports = (function() {


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

    // const base_rotation = Vector.angle(Vector.subtract(polygon[0], center));
    const base_rotation = 0;
    const rotation = base_rotation + Math.PI / nsides;

    const base_radius = Vector.distance(polygon[0], center);
    const radius = base_radius * Math.cos(Math.PI / nsides);

    return regularPolygon(nsides, center, radius, rotation);
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
  var elementCircle = function(polynum, center, radius, circle_sides=100) {
    const inner_radius = radius * Math.cos(Math.PI / polynum);
    const ele_circle_radius = (radius - inner_radius) / 2;

    const outer_circle =  regularPolygon(circle_sides, center, radius);
    const inner_circle =  regularPolygon(circle_sides, center, inner_radius);
    const inner_polygon = regularPolygon(polynum,      center, inner_radius);

    const ele_circle_centers = regularPolygon(polynum, center, radius - ele_circle_radius);
    const outer_circles = ele_circle_centers.map(vertex => {
      return regularPolygon(circle_sides, vertex, ele_circle_radius);
    });

    return [outer_circle, outer_circles, inner_circle, inner_polygon];
  };

  return {
    incircle        : incircle,
    outcircle       : outcircle,
    inscribePolygon : inscribePolygon,
    elementCircle   : elementCircle,
  };

})();