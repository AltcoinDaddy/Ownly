"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/it-take";
exports.ids = ["vendor-chunks/it-take"];
exports.modules = {

/***/ "(rsc)/./node_modules/it-take/index.js":
/*!***************************************!*\
  !*** ./node_modules/it-take/index.js ***!
  \***************************************/
/***/ ((module) => {

eval("\n\n/**\n * Stop iteration after n items have been received.\n *\n * @template T\n * @param {AsyncIterable<T>|Iterable<T>} source\n * @param {number} limit\n * @returns {AsyncIterable<T>}\n */\nconst take = async function * (source, limit) {\n  let items = 0\n\n  if (limit < 1) {\n    return\n  }\n\n  for await (const entry of source) {\n    yield entry\n\n    items++\n\n    if (items === limit) {\n      return\n    }\n  }\n}\n\nmodule.exports = take\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvaXQtdGFrZS9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBWTs7QUFFWjtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsOEJBQThCO0FBQ3pDLFdBQVcsUUFBUTtBQUNuQixhQUFhO0FBQ2I7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEiLCJzb3VyY2VzIjpbIi9ob21lL2FsdGNvaW4tZGFkZHkvRG93bmxvYWRzL293bmx5L25vZGVfbW9kdWxlcy9pdC10YWtlL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4vKipcbiAqIFN0b3AgaXRlcmF0aW9uIGFmdGVyIG4gaXRlbXMgaGF2ZSBiZWVuIHJlY2VpdmVkLlxuICpcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge0FzeW5jSXRlcmFibGU8VD58SXRlcmFibGU8VD59IHNvdXJjZVxuICogQHBhcmFtIHtudW1iZXJ9IGxpbWl0XG4gKiBAcmV0dXJucyB7QXN5bmNJdGVyYWJsZTxUPn1cbiAqL1xuY29uc3QgdGFrZSA9IGFzeW5jIGZ1bmN0aW9uICogKHNvdXJjZSwgbGltaXQpIHtcbiAgbGV0IGl0ZW1zID0gMFxuXG4gIGlmIChsaW1pdCA8IDEpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGZvciBhd2FpdCAoY29uc3QgZW50cnkgb2Ygc291cmNlKSB7XG4gICAgeWllbGQgZW50cnlcblxuICAgIGl0ZW1zKytcblxuICAgIGlmIChpdGVtcyA9PT0gbGltaXQpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRha2VcbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/it-take/index.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/it-take/index.js":
/*!***************************************!*\
  !*** ./node_modules/it-take/index.js ***!
  \***************************************/
/***/ ((module) => {

eval("\n\n/**\n * Stop iteration after n items have been received.\n *\n * @template T\n * @param {AsyncIterable<T>|Iterable<T>} source\n * @param {number} limit\n * @returns {AsyncIterable<T>}\n */\nconst take = async function * (source, limit) {\n  let items = 0\n\n  if (limit < 1) {\n    return\n  }\n\n  for await (const entry of source) {\n    yield entry\n\n    items++\n\n    if (items === limit) {\n      return\n    }\n  }\n}\n\nmodule.exports = take\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvaXQtdGFrZS9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBWTs7QUFFWjtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsOEJBQThCO0FBQ3pDLFdBQVcsUUFBUTtBQUNuQixhQUFhO0FBQ2I7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEiLCJzb3VyY2VzIjpbIi9ob21lL2FsdGNvaW4tZGFkZHkvRG93bmxvYWRzL293bmx5L25vZGVfbW9kdWxlcy9pdC10YWtlL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4vKipcbiAqIFN0b3AgaXRlcmF0aW9uIGFmdGVyIG4gaXRlbXMgaGF2ZSBiZWVuIHJlY2VpdmVkLlxuICpcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge0FzeW5jSXRlcmFibGU8VD58SXRlcmFibGU8VD59IHNvdXJjZVxuICogQHBhcmFtIHtudW1iZXJ9IGxpbWl0XG4gKiBAcmV0dXJucyB7QXN5bmNJdGVyYWJsZTxUPn1cbiAqL1xuY29uc3QgdGFrZSA9IGFzeW5jIGZ1bmN0aW9uICogKHNvdXJjZSwgbGltaXQpIHtcbiAgbGV0IGl0ZW1zID0gMFxuXG4gIGlmIChsaW1pdCA8IDEpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGZvciBhd2FpdCAoY29uc3QgZW50cnkgb2Ygc291cmNlKSB7XG4gICAgeWllbGQgZW50cnlcblxuICAgIGl0ZW1zKytcblxuICAgIGlmIChpdGVtcyA9PT0gbGltaXQpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRha2VcbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/it-take/index.js\n");

/***/ })

};
;