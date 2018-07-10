/**
 * Turn a tree structure of lines into a flat list of lines.
 * Lines are in array form following the form,
 * [ [x1,y1], [x2, y2] ]
 * 
 * @param {any} input 
 * @returns 
 */
export default function linesToList(input, loopPath=false) {

  if (!Array.isArray(input)) {
    throw TypeError('Input value is not an array type ' + input);
  }

  if (isLine(input)) {
    return input;
  }
  else if (isPath(input)) {
    return loopPath ? input.concat([input[0]]) : input;
  }

  let output = [];
  input.forEach(ele => {

    if (isLine(ele)) {
      output.push(ele);
    }
    else if (isPath(ele)) {
      const path = loopPath ? ele.concat([ele[0]]) : ele;
      output.push(path);
    }
    else {
      output = output.concat(linesToList(ele, loopPath));
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

function isPath(obj) {
  return Array.isArray(obj) && obj.length != 0 && obj.length != 1 &&
    obj.reduce((acc, cur) => {
      return acc && !isNaN(cur[0]) && !isNaN(cur[1]);
    }, true);
}