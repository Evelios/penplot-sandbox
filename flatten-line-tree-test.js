const test = require('tape');

/**
 * Turn a tree structure of lines into a flat list of lines.
 * Lines are in array form following the form,
 * [ [x1,y1], [x2, y2] ]
 * 
 * @param {any} input 
 * @returns 
 */
function linesToList(input) {

  if (!Array.isArray(input)) {
    throw TypeError('Input value is not an array type');
  }

  if (isLine(input)) {
    return input;
  }

  let output = [];
  input.forEach(ele => {
    if (isLine(ele)) {
      output.push(ele);
    } else {
      output = output.concat(linesToList(ele));
    }
  });

  return output;
}

function lineObjToList(input) {
  if (isLineObj(input)) {
    return input;
  }

  if (!Array.isArray(input)) {
    throw TypeError('Input value is not an array type');
  }

  let output = [];
  input.forEach(ele => {
    if (isLineObj(ele)) {
      output.push(ele);
    } else {
      output = output.concat(lineObjToList(ele));
    }
  });

  return output;
}

/**
  * Returns true if the object is an array of the form,
  * [ [x1,y1], [x2, y2] ]
  * 
  * @param {any} obj The object to be tested
  * @returns {boolean}
  */
function isLine(obj) {
  return Array.isArray(obj)    && obj.length == 2       &&
         Array.isArray(obj[0]) && Array.isArray(obj[1]) &&
         !isNaN(obj[0][0])     && !isNaN(obj[0][1])     &&
         !isNaN(obj[1][0])     && !isNaN(obj[1][1]);
}

/**
  * Returns true if the object is a line written in the followng form
  * 
  * {
  *   p1: { x: x1, y: y1 },
  *   p2: { x: x2, y: y2 }
  * }
  * 
  * @param {any} obj The object to be tested
  * @returns {boolean}
  */
function isLineObj(obj) {
  return obj.hasOwnProperty("p1")   && obj.hasOwnProperty("p2") &&
         obj.p1.hasOwnProperty("x") && obj.p1.hasOwnProperty("y") &&
         obj.p2.hasOwnProperty("x") && obj.p2.hasOwnProperty("y");
}

test("Is Object a Line", function(t) {
  const good1 = [[1, 2], [2, 5]];
  const good2 = [[-61, 1], [53, -1]];
  const bad1 = [[[1, 2], [2, 5]], [[-61, 1], [53, -1]]];
  const bad2 = [[1, 2], [2, 5], [[-61, 1], [53, -1]]];

  t.ok(isLine(good1));
  t.ok(isLine(good2));
  t.notOk(isLine(bad1));
  t.notOk(isLine(bad2));
  t.end();
});

test("Lines to list - shallow", function(t) {
  const input =  [[1, 2], [2, 5]];
  const output = [[1, 2], [2, 5]];

  t.deepEqual(linesToList(input), output);
  t.end();
});

test("Lines to list - medium", function(t) {
  const input = [
    [ [ 1,  2], [ 2,  5] ],
    [ [-6,  1], [ 5, -1] ],
    [ [ 2,  5], [ 3,  1] ],
    [ [-6,  2], [-7, -3] ],
    [ [-5, -2], [-7, -7] ]
  ];
  const output = [
    [ [ 1,  2], [ 2,  5] ],
    [ [-6,  1], [ 5, -1] ],
    [ [ 2,  5], [ 3,  1] ],
    [ [-6,  2], [-7, -3] ],
    [ [-5, -2], [-7, -7] ]
  ];

  t.deepEqual(linesToList(input), output);
  t.end();
});

test("Lines to list - deep", function(t) {
  const input = [ 
    [
      [ [ 1,  2], [ 2,  5] ],
      [ [-6,  1], [ 5, -1] ]
    ],
    [
      [ [ 2,  5], [ 3,  1] ],
      [ [-6,  2], [-7, -3] ],
      [ [-5, -2], [-7, -7] ]
    ]
  ];
  const output = [
    [ [ 1,  2], [ 2,  5] ],
    [ [-6,  1], [ 5, -1] ],
    [ [ 2,  5], [ 3,  1] ],
    [ [-6,  2], [-7, -3] ],
    [ [-5, -2], [-7, -7] ]
  ];

  t.deepEqual(linesToList(input), output);
  t.end();
});

test("Lines to list - deeper", function(t) {
  const input = [ 
    [
      [ [ 1,  2], [ 2,  5] ],
      [ [-6,  1], [ 5, -1] ]
    ],
    [
      [
        [ [ 1,  2], [ 2,  5] ],
        [ [-6,  1], [ 5, -1] ]
      ],
      [ [ 2,  5], [ 3,  1] ],
      [ [-6,  2], [-7, -3] ],
      [ [-5, -2], [-7, -7] ]
    ]
  ];
  const output = [
    [ [ 1,  2], [ 2,  5] ],
    [ [-6,  1], [ 5, -1] ],
    [ [ 1,  2], [ 2,  5] ],
    [ [-6,  1], [ 5, -1] ],
    [ [ 2,  5], [ 3,  1] ],
    [ [-6,  2], [-7, -3] ],
    [ [-5, -2], [-7, -7] ]
  ];

  t.deepEqual(linesToList(input), output);
  t.end();
});

test("Is Object a Line Object", function(t) {
  const good1 = {
    p1 : { x: 1, y: 2},
    p2 : { x: 2, y: 5},
  };
  const good2 = {
    p1: { x: -61, y: 1},
    p2: { x: 53,  y: -1}
  };

  const bad1 = {
    p1 : { x: 1, y: 2},
    p2 : { y: 5},
  };
  const bad2 = {
    p2: { x: 53,  y: -1}
  };

  t.ok(isLineObj(good1));
  t.ok(isLineObj(good2));
  t.notOk(isLineObj(bad1));
  t.notOk(isLineObj(bad2));
  t.end();
});

test("Lines object to list - shallow", function(t) {
  const input = {
    p1 : { x: 1, y: 2},
    p2 : { x: 2, y: 5},
  };
  const output = {
    p1 : { x: 1, y: 2},
    p2 : { x: 2, y: 5},
  };

  t.deepEqual(lineObjToList(input), output);
  t.end();
});

test("Lines object to list - medium", function(t) {
  const input = [ 
    { p1: { x: 1, y:  2}, p2: { x: 2, y:  5} },
    { p1: { x:-6, y:  1}, p2: { x: 5, y: -1} },
    { p1: { x: 2, y:  5}, p2: { x: 3, y:  1} },
    { p1: { x:-6, y:  2}, p2: { x:-7, y: -3} },
    { p1: { x:-5, y: -2}, p2: { x:-7, y: -7} }
  ];
  const output = [
    { p1: { x: 1, y:  2}, p2: { x: 2, y:  5} },
    { p1: { x:-6, y:  1}, p2: { x: 5, y: -1} },
    { p1: { x: 2, y:  5}, p2: { x: 3, y:  1} },
    { p1: { x:-6, y:  2}, p2: { x:-7, y: -3} },
    { p1: { x:-5, y: -2}, p2: { x:-7, y: -7} }
  ];

  t.deepEqual(lineObjToList(input), output);
  t.end();
});

test("Lines object to list - deep", function(t) {
  const input = [ 
    [
      { p1: { x: 1, y:  2}, p2: { x: 2, y:  5} },
      { p1: { x:-6, y:  1}, p2: { x: 5, y: -1} }
    ],
    [
      { p1: { x: 2, y:  5}, p2: { x: 3, y:  1} },
      { p1: { x:-6, y:  2}, p2: { x:-7, y: -3} },
      { p1: { x:-5, y: -2}, p2: { x:-7, y: -7} }
    ]
  ];
  const output = [
    { p1: { x: 1, y:  2}, p2: { x: 2, y:  5} },
    { p1: { x:-6, y:  1}, p2: { x: 5, y: -1} },
    { p1: { x: 2, y:  5}, p2: { x: 3, y:  1} },
    { p1: { x:-6, y:  2}, p2: { x:-7, y: -3} },
    { p1: { x:-5, y: -2}, p2: { x:-7, y: -7} }
  ];

  t.deepEqual(lineObjToList(input), output);
  t.end();
});

test("Lines object to list - deeper", function(t) {
  const input = [ 
    [
      { p1: { x: 1, y:  2}, p2: { x: 2, y:  5} },
      { p1: { x:-6, y:  1}, p2: { x: 5, y: -1} }
    ],
    [
      [
        { p1: { x: 1, y:  2}, p2: { x: 2, y:  5} },
        { p1: { x:-6, y:  1}, p2: { x: 5, y: -1} }
      ],
      { p1: { x: 2, y:  5}, p2: { x: 3, y:  1} },
      { p1: { x:-6, y:  2}, p2: { x:-7, y: -3} },
      { p1: { x:-5, y: -2}, p2: { x:-7, y: -7} }
    ]
  ];
  const output = [
    { p1: { x: 1, y:  2}, p2: { x: 2, y:  5} },
    { p1: { x:-6, y:  1}, p2: { x: 5, y: -1} },
    { p1: { x: 1, y:  2}, p2: { x: 2, y:  5} },
    { p1: { x:-6, y:  1}, p2: { x: 5, y: -1} },
    { p1: { x: 2, y:  5}, p2: { x: 3, y:  1} },
    { p1: { x:-6, y:  2}, p2: { x:-7, y: -3} },
    { p1: { x:-5, y: -2}, p2: { x:-7, y: -7} }
  ];

  t.deepEqual(lineObjToList(input), output);
  t.end();
});