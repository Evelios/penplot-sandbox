/**
 * Turn a tree structure of lines into a flat list of lines.
 * Lines are in array form following the form,
 * [ [x1,y1], [x2, y2] ]
 * 
 * @param {any} input 
 * @returns 
 */
export default function linesToList(input) {
  console.log(input);

  if (!Array.isArray(input)) {
    throw TypeError('Input value is not an array type ' + input);
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