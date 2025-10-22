"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/web-encoding";
exports.ids = ["vendor-chunks/web-encoding"];
exports.modules = {

/***/ "(rsc)/./node_modules/web-encoding/src/lib.mjs":
/*!***********************************************!*\
  !*** ./node_modules/web-encoding/src/lib.mjs ***!
  \***********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   TextDecoder: () => (/* binding */ Decoder),\n/* harmony export */   TextEncoder: () => (/* binding */ Encoder)\n/* harmony export */ });\n// In node `export { TextEncoder }` throws:\n// \"Export 'TextEncoder' is not defined in module\"\n// To workaround we first define constants and then export with as.\nconst Encoder = TextEncoder\nconst Decoder = TextDecoder\n\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvd2ViLWVuY29kaW5nL3NyYy9saWIubWpzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQUEscUJBQXFCLGFBQWE7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7O0FBRXlEIiwic291cmNlcyI6WyIvaG9tZS9hbHRjb2luLWRhZGR5L0Rvd25sb2Fkcy9vd25seS9ub2RlX21vZHVsZXMvd2ViLWVuY29kaW5nL3NyYy9saWIubWpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIEluIG5vZGUgYGV4cG9ydCB7IFRleHRFbmNvZGVyIH1gIHRocm93czpcbi8vIFwiRXhwb3J0ICdUZXh0RW5jb2RlcicgaXMgbm90IGRlZmluZWQgaW4gbW9kdWxlXCJcbi8vIFRvIHdvcmthcm91bmQgd2UgZmlyc3QgZGVmaW5lIGNvbnN0YW50cyBhbmQgdGhlbiBleHBvcnQgd2l0aCBhcy5cbmNvbnN0IEVuY29kZXIgPSBUZXh0RW5jb2RlclxuY29uc3QgRGVjb2RlciA9IFRleHREZWNvZGVyXG5cbmV4cG9ydCB7IEVuY29kZXIgYXMgVGV4dEVuY29kZXIsIERlY29kZXIgYXMgVGV4dERlY29kZXIgfVxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/web-encoding/src/lib.mjs\n");

/***/ }),

/***/ "(ssr)/./node_modules/web-encoding/src/lib.mjs":
/*!***********************************************!*\
  !*** ./node_modules/web-encoding/src/lib.mjs ***!
  \***********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   TextDecoder: () => (/* binding */ Decoder),\n/* harmony export */   TextEncoder: () => (/* binding */ Encoder)\n/* harmony export */ });\n// In node `export { TextEncoder }` throws:\n// \"Export 'TextEncoder' is not defined in module\"\n// To workaround we first define constants and then export with as.\nconst Encoder = TextEncoder\nconst Decoder = TextDecoder\n\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvd2ViLWVuY29kaW5nL3NyYy9saWIubWpzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQUEscUJBQXFCLGFBQWE7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7O0FBRXlEIiwic291cmNlcyI6WyIvaG9tZS9hbHRjb2luLWRhZGR5L0Rvd25sb2Fkcy9vd25seS9ub2RlX21vZHVsZXMvd2ViLWVuY29kaW5nL3NyYy9saWIubWpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIEluIG5vZGUgYGV4cG9ydCB7IFRleHRFbmNvZGVyIH1gIHRocm93czpcbi8vIFwiRXhwb3J0ICdUZXh0RW5jb2RlcicgaXMgbm90IGRlZmluZWQgaW4gbW9kdWxlXCJcbi8vIFRvIHdvcmthcm91bmQgd2UgZmlyc3QgZGVmaW5lIGNvbnN0YW50cyBhbmQgdGhlbiBleHBvcnQgd2l0aCBhcy5cbmNvbnN0IEVuY29kZXIgPSBUZXh0RW5jb2RlclxuY29uc3QgRGVjb2RlciA9IFRleHREZWNvZGVyXG5cbmV4cG9ydCB7IEVuY29kZXIgYXMgVGV4dEVuY29kZXIsIERlY29kZXIgYXMgVGV4dERlY29kZXIgfVxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/web-encoding/src/lib.mjs\n");

/***/ })

};
;