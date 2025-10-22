"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/it-last";
exports.ids = ["vendor-chunks/it-last"];
exports.modules = {

/***/ "(rsc)/./node_modules/it-last/index.js":
/*!***************************************!*\
  !*** ./node_modules/it-last/index.js ***!
  \***************************************/
/***/ ((module) => {

eval("\n\n/**\n * Returns the last item of an (async) iterable, unless empty, in which case\n * return `undefined`.\n *\n * @template T\n * @param {AsyncIterable<T>|Iterable<T>} source\n */\nconst last = async (source) => {\n  let res\n\n  for await (const entry of source) {\n    res = entry\n  }\n\n  return res\n}\n\nmodule.exports = last\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvaXQtbGFzdC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBWTs7QUFFWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyw4QkFBOEI7QUFDekM7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBIiwic291cmNlcyI6WyIvaG9tZS9hbHRjb2luLWRhZGR5L0Rvd25sb2Fkcy9vd25seS9ub2RlX21vZHVsZXMvaXQtbGFzdC9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBsYXN0IGl0ZW0gb2YgYW4gKGFzeW5jKSBpdGVyYWJsZSwgdW5sZXNzIGVtcHR5LCBpbiB3aGljaCBjYXNlXG4gKiByZXR1cm4gYHVuZGVmaW5lZGAuXG4gKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7QXN5bmNJdGVyYWJsZTxUPnxJdGVyYWJsZTxUPn0gc291cmNlXG4gKi9cbmNvbnN0IGxhc3QgPSBhc3luYyAoc291cmNlKSA9PiB7XG4gIGxldCByZXNcblxuICBmb3IgYXdhaXQgKGNvbnN0IGVudHJ5IG9mIHNvdXJjZSkge1xuICAgIHJlcyA9IGVudHJ5XG4gIH1cblxuICByZXR1cm4gcmVzXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbGFzdFxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/it-last/index.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/it-last/index.js":
/*!***************************************!*\
  !*** ./node_modules/it-last/index.js ***!
  \***************************************/
/***/ ((module) => {

eval("\n\n/**\n * Returns the last item of an (async) iterable, unless empty, in which case\n * return `undefined`.\n *\n * @template T\n * @param {AsyncIterable<T>|Iterable<T>} source\n */\nconst last = async (source) => {\n  let res\n\n  for await (const entry of source) {\n    res = entry\n  }\n\n  return res\n}\n\nmodule.exports = last\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvaXQtbGFzdC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBWTs7QUFFWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyw4QkFBOEI7QUFDekM7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBIiwic291cmNlcyI6WyIvaG9tZS9hbHRjb2luLWRhZGR5L0Rvd25sb2Fkcy9vd25seS9ub2RlX21vZHVsZXMvaXQtbGFzdC9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBsYXN0IGl0ZW0gb2YgYW4gKGFzeW5jKSBpdGVyYWJsZSwgdW5sZXNzIGVtcHR5LCBpbiB3aGljaCBjYXNlXG4gKiByZXR1cm4gYHVuZGVmaW5lZGAuXG4gKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7QXN5bmNJdGVyYWJsZTxUPnxJdGVyYWJsZTxUPn0gc291cmNlXG4gKi9cbmNvbnN0IGxhc3QgPSBhc3luYyAoc291cmNlKSA9PiB7XG4gIGxldCByZXNcblxuICBmb3IgYXdhaXQgKGNvbnN0IGVudHJ5IG9mIHNvdXJjZSkge1xuICAgIHJlcyA9IGVudHJ5XG4gIH1cblxuICByZXR1cm4gcmVzXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbGFzdFxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/it-last/index.js\n");

/***/ })

};
;