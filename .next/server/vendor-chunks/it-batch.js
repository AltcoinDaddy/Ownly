"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/it-batch";
exports.ids = ["vendor-chunks/it-batch"];
exports.modules = {

/***/ "(rsc)/./node_modules/it-batch/index.js":
/*!****************************************!*\
  !*** ./node_modules/it-batch/index.js ***!
  \****************************************/
/***/ ((module) => {

eval("\n\n/**\n * Takes an (async) iterable that emits things and returns an async iterable that\n * emits those things in fixed-sized batches.\n *\n * @template T\n * @param {AsyncIterable<T>|Iterable<T>} source\n * @param {number} [size=1]\n * @returns {AsyncIterable<T[]>}\n */\nasync function * batch (source, size = 1) {\n  /** @type {T[]} */\n  let things = []\n\n  if (size < 1) {\n    size = 1\n  }\n\n  for await (const thing of source) {\n    things.push(thing)\n\n    while (things.length >= size) {\n      yield things.slice(0, size)\n\n      things = things.slice(size)\n    }\n  }\n\n  while (things.length) {\n    yield things.slice(0, size)\n\n    things = things.slice(size)\n  }\n}\n\nmodule.exports = batch\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvaXQtYmF0Y2gvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQVk7O0FBRVo7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsOEJBQThCO0FBQ3pDLFdBQVcsUUFBUTtBQUNuQixhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWEsS0FBSztBQUNsQjs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSIsInNvdXJjZXMiOlsiL2hvbWUvYWx0Y29pbi1kYWRkeS9Eb3dubG9hZHMvb3dubHkvbm9kZV9tb2R1bGVzL2l0LWJhdGNoL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4vKipcbiAqIFRha2VzIGFuIChhc3luYykgaXRlcmFibGUgdGhhdCBlbWl0cyB0aGluZ3MgYW5kIHJldHVybnMgYW4gYXN5bmMgaXRlcmFibGUgdGhhdFxuICogZW1pdHMgdGhvc2UgdGhpbmdzIGluIGZpeGVkLXNpemVkIGJhdGNoZXMuXG4gKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7QXN5bmNJdGVyYWJsZTxUPnxJdGVyYWJsZTxUPn0gc291cmNlXG4gKiBAcGFyYW0ge251bWJlcn0gW3NpemU9MV1cbiAqIEByZXR1cm5zIHtBc3luY0l0ZXJhYmxlPFRbXT59XG4gKi9cbmFzeW5jIGZ1bmN0aW9uICogYmF0Y2ggKHNvdXJjZSwgc2l6ZSA9IDEpIHtcbiAgLyoqIEB0eXBlIHtUW119ICovXG4gIGxldCB0aGluZ3MgPSBbXVxuXG4gIGlmIChzaXplIDwgMSkge1xuICAgIHNpemUgPSAxXG4gIH1cblxuICBmb3IgYXdhaXQgKGNvbnN0IHRoaW5nIG9mIHNvdXJjZSkge1xuICAgIHRoaW5ncy5wdXNoKHRoaW5nKVxuXG4gICAgd2hpbGUgKHRoaW5ncy5sZW5ndGggPj0gc2l6ZSkge1xuICAgICAgeWllbGQgdGhpbmdzLnNsaWNlKDAsIHNpemUpXG5cbiAgICAgIHRoaW5ncyA9IHRoaW5ncy5zbGljZShzaXplKVxuICAgIH1cbiAgfVxuXG4gIHdoaWxlICh0aGluZ3MubGVuZ3RoKSB7XG4gICAgeWllbGQgdGhpbmdzLnNsaWNlKDAsIHNpemUpXG5cbiAgICB0aGluZ3MgPSB0aGluZ3Muc2xpY2Uoc2l6ZSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhdGNoXG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/it-batch/index.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/it-batch/index.js":
/*!****************************************!*\
  !*** ./node_modules/it-batch/index.js ***!
  \****************************************/
/***/ ((module) => {

eval("\n\n/**\n * Takes an (async) iterable that emits things and returns an async iterable that\n * emits those things in fixed-sized batches.\n *\n * @template T\n * @param {AsyncIterable<T>|Iterable<T>} source\n * @param {number} [size=1]\n * @returns {AsyncIterable<T[]>}\n */\nasync function * batch (source, size = 1) {\n  /** @type {T[]} */\n  let things = []\n\n  if (size < 1) {\n    size = 1\n  }\n\n  for await (const thing of source) {\n    things.push(thing)\n\n    while (things.length >= size) {\n      yield things.slice(0, size)\n\n      things = things.slice(size)\n    }\n  }\n\n  while (things.length) {\n    yield things.slice(0, size)\n\n    things = things.slice(size)\n  }\n}\n\nmodule.exports = batch\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvaXQtYmF0Y2gvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQVk7O0FBRVo7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsOEJBQThCO0FBQ3pDLFdBQVcsUUFBUTtBQUNuQixhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWEsS0FBSztBQUNsQjs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSIsInNvdXJjZXMiOlsiL2hvbWUvYWx0Y29pbi1kYWRkeS9Eb3dubG9hZHMvb3dubHkvbm9kZV9tb2R1bGVzL2l0LWJhdGNoL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4vKipcbiAqIFRha2VzIGFuIChhc3luYykgaXRlcmFibGUgdGhhdCBlbWl0cyB0aGluZ3MgYW5kIHJldHVybnMgYW4gYXN5bmMgaXRlcmFibGUgdGhhdFxuICogZW1pdHMgdGhvc2UgdGhpbmdzIGluIGZpeGVkLXNpemVkIGJhdGNoZXMuXG4gKlxuICogQHRlbXBsYXRlIFRcbiAqIEBwYXJhbSB7QXN5bmNJdGVyYWJsZTxUPnxJdGVyYWJsZTxUPn0gc291cmNlXG4gKiBAcGFyYW0ge251bWJlcn0gW3NpemU9MV1cbiAqIEByZXR1cm5zIHtBc3luY0l0ZXJhYmxlPFRbXT59XG4gKi9cbmFzeW5jIGZ1bmN0aW9uICogYmF0Y2ggKHNvdXJjZSwgc2l6ZSA9IDEpIHtcbiAgLyoqIEB0eXBlIHtUW119ICovXG4gIGxldCB0aGluZ3MgPSBbXVxuXG4gIGlmIChzaXplIDwgMSkge1xuICAgIHNpemUgPSAxXG4gIH1cblxuICBmb3IgYXdhaXQgKGNvbnN0IHRoaW5nIG9mIHNvdXJjZSkge1xuICAgIHRoaW5ncy5wdXNoKHRoaW5nKVxuXG4gICAgd2hpbGUgKHRoaW5ncy5sZW5ndGggPj0gc2l6ZSkge1xuICAgICAgeWllbGQgdGhpbmdzLnNsaWNlKDAsIHNpemUpXG5cbiAgICAgIHRoaW5ncyA9IHRoaW5ncy5zbGljZShzaXplKVxuICAgIH1cbiAgfVxuXG4gIHdoaWxlICh0aGluZ3MubGVuZ3RoKSB7XG4gICAgeWllbGQgdGhpbmdzLnNsaWNlKDAsIHNpemUpXG5cbiAgICB0aGluZ3MgPSB0aGluZ3Muc2xpY2Uoc2l6ZSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhdGNoXG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/it-batch/index.js\n");

/***/ })

};
;