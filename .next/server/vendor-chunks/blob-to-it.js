"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/blob-to-it";
exports.ids = ["vendor-chunks/blob-to-it"];
exports.modules = {

/***/ "(rsc)/./node_modules/blob-to-it/index.js":
/*!******************************************!*\
  !*** ./node_modules/blob-to-it/index.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("/* eslint-env browser */\n\n\n\nconst browserReadableStreamToIt = __webpack_require__(/*! browser-readablestream-to-it */ \"(rsc)/./node_modules/browser-readablestream-to-it/index.js\")\n\n/**\n * @param {Blob} blob\n * @returns {AsyncIterable<Uint8Array>}\n */\nfunction blobToIt (blob) {\n  if (typeof blob.stream === 'function') {\n    // @ts-ignore missing some properties\n    return browserReadableStreamToIt(blob.stream())\n  }\n\n  // firefox < 69 does not support blob.stream()\n  // @ts-ignore - response.body is optional, but in practice it's a stream.\n  return browserReadableStreamToIt(new Response(blob).body)\n}\n\nmodule.exports = blobToIt\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvYmxvYi10by1pdC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBQTs7QUFFWTs7QUFFWixrQ0FBa0MsbUJBQU8sQ0FBQyxnR0FBOEI7O0FBRXhFO0FBQ0EsV0FBVyxNQUFNO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUEiLCJzb3VyY2VzIjpbIi9ob21lL2FsdGNvaW4tZGFkZHkvRG93bmxvYWRzL293bmx5L25vZGVfbW9kdWxlcy9ibG9iLXRvLWl0L2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4ndXNlIHN0cmljdCdcblxuY29uc3QgYnJvd3NlclJlYWRhYmxlU3RyZWFtVG9JdCA9IHJlcXVpcmUoJ2Jyb3dzZXItcmVhZGFibGVzdHJlYW0tdG8taXQnKVxuXG4vKipcbiAqIEBwYXJhbSB7QmxvYn0gYmxvYlxuICogQHJldHVybnMge0FzeW5jSXRlcmFibGU8VWludDhBcnJheT59XG4gKi9cbmZ1bmN0aW9uIGJsb2JUb0l0IChibG9iKSB7XG4gIGlmICh0eXBlb2YgYmxvYi5zdHJlYW0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBAdHMtaWdub3JlIG1pc3Npbmcgc29tZSBwcm9wZXJ0aWVzXG4gICAgcmV0dXJuIGJyb3dzZXJSZWFkYWJsZVN0cmVhbVRvSXQoYmxvYi5zdHJlYW0oKSlcbiAgfVxuXG4gIC8vIGZpcmVmb3ggPCA2OSBkb2VzIG5vdCBzdXBwb3J0IGJsb2Iuc3RyZWFtKClcbiAgLy8gQHRzLWlnbm9yZSAtIHJlc3BvbnNlLmJvZHkgaXMgb3B0aW9uYWwsIGJ1dCBpbiBwcmFjdGljZSBpdCdzIGEgc3RyZWFtLlxuICByZXR1cm4gYnJvd3NlclJlYWRhYmxlU3RyZWFtVG9JdChuZXcgUmVzcG9uc2UoYmxvYikuYm9keSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBibG9iVG9JdFxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/blob-to-it/index.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/blob-to-it/index.js":
/*!******************************************!*\
  !*** ./node_modules/blob-to-it/index.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("/* eslint-env browser */\n\n\n\nconst browserReadableStreamToIt = __webpack_require__(/*! browser-readablestream-to-it */ \"(ssr)/./node_modules/browser-readablestream-to-it/index.js\")\n\n/**\n * @param {Blob} blob\n * @returns {AsyncIterable<Uint8Array>}\n */\nfunction blobToIt (blob) {\n  if (typeof blob.stream === 'function') {\n    // @ts-ignore missing some properties\n    return browserReadableStreamToIt(blob.stream())\n  }\n\n  // firefox < 69 does not support blob.stream()\n  // @ts-ignore - response.body is optional, but in practice it's a stream.\n  return browserReadableStreamToIt(new Response(blob).body)\n}\n\nmodule.exports = blobToIt\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvYmxvYi10by1pdC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBQTs7QUFFWTs7QUFFWixrQ0FBa0MsbUJBQU8sQ0FBQyxnR0FBOEI7O0FBRXhFO0FBQ0EsV0FBVyxNQUFNO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUEiLCJzb3VyY2VzIjpbIi9ob21lL2FsdGNvaW4tZGFkZHkvRG93bmxvYWRzL293bmx5L25vZGVfbW9kdWxlcy9ibG9iLXRvLWl0L2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4ndXNlIHN0cmljdCdcblxuY29uc3QgYnJvd3NlclJlYWRhYmxlU3RyZWFtVG9JdCA9IHJlcXVpcmUoJ2Jyb3dzZXItcmVhZGFibGVzdHJlYW0tdG8taXQnKVxuXG4vKipcbiAqIEBwYXJhbSB7QmxvYn0gYmxvYlxuICogQHJldHVybnMge0FzeW5jSXRlcmFibGU8VWludDhBcnJheT59XG4gKi9cbmZ1bmN0aW9uIGJsb2JUb0l0IChibG9iKSB7XG4gIGlmICh0eXBlb2YgYmxvYi5zdHJlYW0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBAdHMtaWdub3JlIG1pc3Npbmcgc29tZSBwcm9wZXJ0aWVzXG4gICAgcmV0dXJuIGJyb3dzZXJSZWFkYWJsZVN0cmVhbVRvSXQoYmxvYi5zdHJlYW0oKSlcbiAgfVxuXG4gIC8vIGZpcmVmb3ggPCA2OSBkb2VzIG5vdCBzdXBwb3J0IGJsb2Iuc3RyZWFtKClcbiAgLy8gQHRzLWlnbm9yZSAtIHJlc3BvbnNlLmJvZHkgaXMgb3B0aW9uYWwsIGJ1dCBpbiBwcmFjdGljZSBpdCdzIGEgc3RyZWFtLlxuICByZXR1cm4gYnJvd3NlclJlYWRhYmxlU3RyZWFtVG9JdChuZXcgUmVzcG9uc2UoYmxvYikuYm9keSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBibG9iVG9JdFxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/blob-to-it/index.js\n");

/***/ })

};
;