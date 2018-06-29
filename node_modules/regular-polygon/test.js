const test = require('tape');
const ArrayAlmost = require('test-fuzzy-array');
const regularPoly = require('./regular-polygon');

// test("Triangle - Centered", t => {
//   const almostDeepEqual = ArrayAlmost(t, 0.01);
//   const expected = [
//     [0, 1],
//     [Math.cos(7  * Math.PI/6), Math.sin(7  * Math.PI/6)],
//     [Math.cos(11 * Math.PI/6), Math.sin(11 * Math.PI/6)]
//   ];

//   almostDeepEqual(regularPoly(3), expected);
//   t.end();
// });

test("Square - Centered", t => {
  const almostDeepEqual = ArrayAlmost(t, 0.01);
  const size = 4;
  const expected = [
    [    0,  size],
    [-size,     0],
    [    0, -size],
    [ size,     0]
  ];

  almostDeepEqual(regularPoly(4, [0,0], size), expected);
  t.end();
});