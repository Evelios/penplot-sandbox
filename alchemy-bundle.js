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
    const radius = base_radius + Math.cos(Math.PI / polygon.length);
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
    const nsides = polyogn.length;

    const base_rotation = Vector.angle(Vector.subtract(polygon[0], center));
    const rotation = base_rotation + Math.PI / nsides;

    const base_radius = Vector.distance(polygon[0], center);
    const radius = base_radius + Math.cos(Math.PI / nsides);

    return regularPolygon(nsides, center, radius, rotation);
  };

  return {
    incircle        : incircle,
    outcircle       : outcircle,
    inscribePolygon : inscribePolygon,
  };

});