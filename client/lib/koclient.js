(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.rfc6902 = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";

exports.diffAny = diffAny;
Object.defineProperty(exports, "__esModule", {
    value: true
});

var compare = _dereq_("./equal").compare;

function pushAll(array, items) {
    return Array.prototype.push.apply(array, items);
}
/**
subtract(a, b) returns the keys in `a` that are not in `b`.
*/
function subtract(a, b) {
    var obj = {};
    for (var add_key in a) {
        obj[add_key] = 1;
    }
    for (var del_key in b) {
        delete obj[del_key];
    }
    return Object.keys(obj);
}
/**
intersection(objects) returns the keys that shared by all given `objects`.
*/
function intersection(objects) {
    // initialize like union()
    var key_counts = {};
    objects.forEach(function (object) {
        for (var key in object) {
            key_counts[key] = (key_counts[key] || 0) + 1;
        }
    });
    // but then, extra requirement: delete less commonly-seen keys
    var threshold = objects.length;
    for (var key in key_counts) {
        if (key_counts[key] < threshold) {
            delete key_counts[key];
        }
    }
    return Object.keys(key_counts);
}
function objectType(object) {
    if (object === undefined) {
        return "undefined";
    }
    if (object === null) {
        return "null";
    }
    if (Array.isArray(object)) {
        return "array";
    }
    return typeof object;
}
/**
Array-diffing smarter (levenshtein-like) diffing here

To get from the input ABC to the output AZ we could just delete all the input
and say "insert A, insert Z" and be done with it. That's what we do if the
input is empty. But we can be smarter.

          output
               A   Z
               -   -
          [0]  1   2
input A |  1  [0]  1
      B |  2  [1]  1
      C |  3   2  [2]

1) start at 0,0 (+0)
2) keep A (+0)
3) remove B (+1)
4) replace C with Z (+1)

if input (source) is empty, they'll all be in the top row, just a bunch of
additions. If the output is empty, everything will be in the left column, as a
bunch of deletions.
*/
function diffArrays(input, output, ptr) {
    // set up cost matrix (very simple initialization: just a map)
    var memo = {
        "0,0": { operations: [], cost: 0 }
    };
    /**
    input[i's] -> output[j's]
       Given the layout above, i is the row, j is the col
       returns a list of Operations needed to get to from input.slice(0, i) to
    output.slice(0, j), the each marked with the total cost of getting there.
    `cost` is a non-negative integer.
    Recursive.
    */
    function dist(i, j) {
        // memoized
        var memoized = memo[i + "," + j];
        if (memoized === undefined) {
            if (compare(input[i - 1], output[j - 1])) {
                // equal (no operations => no cost)
                memoized = dist(i - 1, j - 1);
            } else {
                var alternatives = [];
                if (i > 0) {
                    // NOT topmost row
                    var remove_alternative = dist(i - 1, j);
                    alternatives.push({
                        // the new operation must be pushed on the end
                        operations: remove_alternative.operations.concat({
                            op: "remove",
                            index: i - 1 }),
                        cost: remove_alternative.cost + 1 });
                }
                if (j > 0) {
                    // NOT leftmost column
                    var add_alternative = dist(i, j - 1);
                    alternatives.push({
                        operations: add_alternative.operations.concat({
                            op: "add",
                            index: i - 1,
                            value: output[j - 1] }),
                        cost: add_alternative.cost + 1 });
                }
                if (i > 0 && j > 0) {
                    // TABLE MIDDLE
                    var replace_alternative = dist(i - 1, j - 1);
                    alternatives.push({
                        operations: replace_alternative.operations.concat({
                            op: "replace",
                            index: i - 1,
                            value: output[j - 1] }),
                        cost: replace_alternative.cost + 1 });
                }
                // the only other case, i === 0 && j === 0, has already been memoized
                // the meat of the algorithm:
                // sort by cost to find the lowest one (might be several ties for lowest)
                // [4, 6, 7, 1, 2].sort(function(a, b) {return a - b;}); -> [ 1, 2, 4, 6, 7 ]
                var best = alternatives.sort(function (a, b) {
                    return a.cost - b.cost;
                })[0];
                memoized = best;
            }
            memo[i + "," + j] = memoized;
        }
        return memoized;
    }
    var array_operations = dist(input.length, output.length).operations;
    var padding = 0;
    var operations = array_operations.map(function (array_operation) {
        if (array_operation.op === "add") {
            var padded_index = array_operation.index + 1 + padding;
            var index_token = padded_index < input.length ? String(padded_index) : "-";
            var operation = {
                op: array_operation.op,
                path: ptr.add(index_token).toString(),
                value: array_operation.value };
            padding++; // maybe only if array_operation.index > -1 ?
            return operation;
        } else if (array_operation.op === "remove") {
            var operation = {
                op: array_operation.op,
                path: ptr.add(String(array_operation.index + padding)).toString() };
            padding--;
            return operation;
        } else {
            return {
                op: array_operation.op,
                path: ptr.add(String(array_operation.index + padding)).toString(),
                value: array_operation.value };
        }
    });
    return operations;
}
function diffObjects(input, output, ptr) {
    // if a key is in input but not output -> remove it
    var operations = [];
    subtract(input, output).forEach(function (key) {
        operations.push({ op: "remove", path: ptr.add(key).toString() });
    });
    // if a key is in output but not input -> add it
    subtract(output, input).forEach(function (key) {
        operations.push({ op: "add", path: ptr.add(key).toString(), value: output[key] });
    });
    // if a key is in both, diff it recursively
    intersection([input, output]).forEach(function (key) {
        pushAll(operations, diffAny(input[key], output[key], ptr.add(key)));
    });
    return operations;
}
function diffValues(input, output, ptr) {
    var operations = [];
    if (!compare(input, output)) {
        operations.push({ op: "replace", path: ptr.toString(), value: output });
    }
    return operations;
}

function diffAny(input, output, ptr) {
    var input_type = objectType(input);
    var output_type = objectType(output);
    if (input_type == "array" && output_type == "array") {
        return diffArrays(input, output, ptr);
    }
    if (input_type == "object" && output_type == "object") {
        return diffObjects(input, output, ptr);
    }
    // only pairs of arrays and objects can go down a path to produce a smaller
    // diff; everything else must be wholesale replaced if inequal
    return diffValues(input, output, ptr);
}

},{"./equal":2}],2:[function(_dereq_,module,exports){

/**
`compare()` returns true if `left` and `right` are materially equal
(i.e., would produce equivalent JSON), false otherwise.

> Here, "equal" means that the value at the target location and the
> value conveyed by "value" are of the same JSON type, and that they
> are considered equal by the following rules for that type:
> o  strings: are considered equal if they contain the same number of
>    Unicode characters and their code points are byte-by-byte equal.
> o  numbers: are considered equal if their values are numerically
>    equal.
> o  arrays: are considered equal if they contain the same number of
>    values, and if each value can be considered equal to the value at
>    the corresponding position in the other array, using this list of
>    type-specific rules.
> o  objects: are considered equal if they contain the same number of
>    members, and if each member can be considered equal to a member in
>    the other object, by comparing their keys (as strings) and their
>    values (using this list of type-specific rules).
> o  literals (false, true, and null): are considered equal if they are
>    the same.
*/
"use strict";

exports.compare = compare;
Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
zip(a, b) assumes that a.length === b.length.
*/
function zip(a, b) {
    var zipped = [];
    for (var i = 0, l = a.length; i < l; i++) {
        zipped.push([a[i], b[i]]);
    }
    return zipped;
}
/**
compareArrays(left, right) assumes that `left` and `right` are both Arrays.
*/
function compareArrays(left, right) {
    if (left.length !== right.length) {
        return false;
    }return zip(left, right).every(function (pair) {
        return compare(pair[0], pair[1]);
    });
}
/**
compareObjects(left, right) assumes that `left` and `right` are both Objects.
*/
function compareObjects(left, right) {
    var left_keys = Object.keys(left);
    var right_keys = Object.keys(right);
    if (!compareArrays(left_keys, right_keys)) {
        return false;
    }return left_keys.every(function (key) {
        return compare(left[key], right[key]);
    });
}
function compare(left, right) {
    // strict equality handles literals, numbers, and strings (a sufficient but not necessary cause)
    if (left === right) {
        return true;
    } // check arrays
    if (Array.isArray(left) && Array.isArray(right)) {
        return compareArrays(left, right);
    }
    // check objects
    if (Object(left) === left && Object(right) === right) {
        return compareObjects(left, right);
    }
    // mismatched arrays & objects, etc., are always inequal
    return false;
}

},{}],3:[function(_dereq_,module,exports){
"use strict";

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var MissingError = exports.MissingError = (function (_Error) {
  function MissingError(path) {
    _classCallCheck(this, MissingError);

    _get(Object.getPrototypeOf(MissingError.prototype), "constructor", this).call(this, "Value required at path: " + path);
    this.name = this.constructor.name;
    this.path = path;
  }

  _inherits(MissingError, _Error);

  return MissingError;
})(Error);

var InvalidOperationError = exports.InvalidOperationError = (function (_Error2) {
  function InvalidOperationError(op) {
    _classCallCheck(this, InvalidOperationError);

    _get(Object.getPrototypeOf(InvalidOperationError.prototype), "constructor", this).call(this, "Invalid operation: " + op);
    this.name = this.constructor.name;
    this.op = op;
  }

  _inherits(InvalidOperationError, _Error2);

  return InvalidOperationError;
})(Error);

var TestError = exports.TestError = (function (_Error3) {
  function TestError(actual, expected) {
    _classCallCheck(this, TestError);

    _get(Object.getPrototypeOf(TestError.prototype), "constructor", this).call(this, "Test failed: " + actual + " != " + expected);
    this.name = this.constructor.name;
    this.actual = actual;
    this.expected = expected;
  }

  _inherits(TestError, _Error3);

  return TestError;
})(Error);

},{}],4:[function(_dereq_,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

/**
Apply a 'application/json-patch+json'-type patch to an object.

`patch` *must* be an array of operations.

> Operation objects MUST have exactly one "op" member, whose value
> indicates the operation to perform.  Its value MUST be one of "add",
> "remove", "replace", "move", "copy", or "test"; other values are
> errors.

This method currently operates on the target object in-place.

Returns list of results, one for each operation.
  - `null` indicated success.
  - otherwise, the result will be an instance of one of the Error classe
    defined in errors.js.
*/
exports.applyPatch = applyPatch;

/**
Produce a 'application/json-patch+json'-type patch to get from one object to
another.

This does not alter `input` or `output` unless they have a property getter with
side-effects (which is not a good idea anyway).

Returns list of operations to perform on `input` to produce `output`.
*/
exports.createPatch = createPatch;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var InvalidOperationError = _dereq_("./errors").InvalidOperationError;

var Pointer = _dereq_("./pointer").Pointer;

var operationFunctions = _interopRequireWildcard(_dereq_("./patch"));

var diffAny = _dereq_("./diff").diffAny;

var package_json = _interopRequire(_dereq_("./package"));

var version = package_json.version;exports.version = version;

function applyPatch(object, patch) {
  return patch.map(function (operation) {
    var operationFunction = operationFunctions[operation.op];
    // speedy exit if we don't recognize the operation name
    if (operationFunction === undefined) {
      return new InvalidOperationError(operation.op);
    }
    return operationFunction(object, operation);
  });
}

function createPatch(input, output) {
  var ptr = new Pointer();
  // a new Pointer gets a default path of [''] if not specified
  var operations = diffAny(input, output, ptr);
  operations.forEach(function (operation) {
    operation.path = operation.path.toString();
  });
  return operations;
}

},{"./diff":1,"./errors":3,"./package":5,"./patch":6,"./pointer":7}],5:[function(_dereq_,module,exports){
module.exports={
  "name": "rfc6902",
  "version": "1.1.0",
  "description": "Complete implementation of RFC6902 (patch and diff)",
  "keywords": [
    "json",
    "patch",
    "diff",
    "rfc6902"
  ],
  "homepage": "https://github.com/chbrown/rfc6902",
  "repository": {
    "type": "git",
    "url": "https://github.com/chbrown/rfc6902.git"
  },
  "author": "Christopher Brown <io@henrian.com> (http://henrian.com)",
  "license": "MIT",
  "main": "./rfc6902.js",
  "devDependencies": {
    "babel-core": "^5.0.0",
    "babelify": "^5.0.0",
    "browserify": "12.0.1",
    "coveralls": "*",
    "derequire": "2.0.3",
    "istanbul": "*",
    "js-yaml": "*",
    "mocha": "*",
    "mocha-lcov-reporter": "*",
    "typescript": "*"
  },
  "scripts": {
    "test": "make test"
  }
}

},{}],6:[function(_dereq_,module,exports){


/**
>  o  If the target location specifies an array index, a new value is
>     inserted into the array at the specified index.
>  o  If the target location specifies an object member that does not
>     already exist, a new member is added to the object.
>  o  If the target location specifies an object member that does exist,
>     that member's value is replaced.
*/
"use strict";

exports.add = add;

/**
> The "remove" operation removes the value at the target location.
> The target location MUST exist for the operation to be successful.
*/
exports.remove = remove;

/**
> The "replace" operation replaces the value at the target location
> with a new value.  The operation object MUST contain a "value" member
> whose content specifies the replacement value.
> The target location MUST exist for the operation to be successful.

> This operation is functionally identical to a "remove" operation for
> a value, followed immediately by an "add" operation at the same
> location with the replacement value.

Even more simply, it's like the add operation with an existence check.
*/
exports.replace = replace;

/**
> The "move" operation removes the value at a specified location and
> adds it to the target location.
> The operation object MUST contain a "from" member, which is a string
> containing a JSON Pointer value that references the location in the
> target document to move the value from.
> This operation is functionally identical to a "remove" operation on
> the "from" location, followed immediately by an "add" operation at
> the target location with the value that was just removed.

> The "from" location MUST NOT be a proper prefix of the "path"
> location; i.e., a location cannot be moved into one of its children.

TODO: throw if the check described in the previous paragraph fails.
*/
exports.move = move;

/**
> The "copy" operation copies the value at a specified location to the
> target location.
> The operation object MUST contain a "from" member, which is a string
> containing a JSON Pointer value that references the location in the
> target document to copy the value from.
> The "from" location MUST exist for the operation to be successful.

> This operation is functionally identical to an "add" operation at the
> target location using the value specified in the "from" member.

Alternatively, it's like 'move' without the 'remove'.
*/
exports.copy = copy;

/**
> The "test" operation tests that a value at the target location is
> equal to a specified value.
> The operation object MUST contain a "value" member that conveys the
> value to be compared to the target location's value.
> The target location MUST be equal to the "value" value for the
> operation to be considered successful.
*/
exports.test = test;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var Pointer = _dereq_("./pointer").Pointer;

var compare = _dereq_("./equal").compare;

var _errors = _dereq_("./errors");

var MissingError = _errors.MissingError;
var TestError = _errors.TestError;

function _add(object, key, value) {
  if (Array.isArray(object)) {
    // `key` must be an index
    if (key == "-") {
      object.push(value);
    } else {
      object.splice(key, 0, value);
    }
  } else {
    object[key] = value;
  }
}

function _remove(object, key) {
  if (Array.isArray(object)) {
    // '-' syntax doesn't make sense when removing
    object.splice(key, 1);
  } else {
    // not sure what the proper behavior is when path = ''
    delete object[key];
  }
}
function add(object, operation) {
  var endpoint = Pointer.fromJSON(operation.path).evaluate(object);
  // it's not exactly a "MissingError" in the same way that `remove` is -- more like a MissingParent, or something
  if (endpoint.parent === undefined) {
    return new MissingError(operation.path);
  }
  _add(endpoint.parent, endpoint.key, operation.value);
  return null;
}

function remove(object, operation) {
  // endpoint has parent, key, and value properties
  var endpoint = Pointer.fromJSON(operation.path).evaluate(object);
  if (endpoint.value === undefined) {
    return new MissingError(operation.path);
  }
  // not sure what the proper behavior is when path = ''
  _remove(endpoint.parent, endpoint.key);
  return null;
}

function replace(object, operation) {
  var endpoint = Pointer.fromJSON(operation.path).evaluate(object);
  if (endpoint.value === undefined) {
    return new MissingError(operation.path);
  }endpoint.parent[endpoint.key] = operation.value;
  return null;
}

function move(object, operation) {
  var from_endpoint = Pointer.fromJSON(operation.from).evaluate(object);
  if (from_endpoint.value === undefined) {
    return new MissingError(operation.from);
  }var endpoint = Pointer.fromJSON(operation.path).evaluate(object);
  if (endpoint.parent === undefined) {
    return new MissingError(operation.path);
  }_remove(from_endpoint.parent, from_endpoint.key);
  _add(endpoint.parent, endpoint.key, from_endpoint.value);
  return null;
}

function copy(object, operation) {
  var from_endpoint = Pointer.fromJSON(operation.from).evaluate(object);
  if (from_endpoint.value === undefined) {
    return new MissingError(operation.from);
  }var endpoint = Pointer.fromJSON(operation.path).evaluate(object);
  if (endpoint.parent === undefined) {
    return new MissingError(operation.path);
  }_remove(from_endpoint.parent, from_endpoint.key);
  _add(endpoint.parent, endpoint.key, from_endpoint.value);
  return null;
}

function test(object, operation) {
  var endpoint = Pointer.fromJSON(operation.path).evaluate(object);
  var result = compare(endpoint.value, operation.value);
  if (!result) {
    return new TestError(endpoint.value, operation.value);
  }return null;
}

},{"./equal":2,"./errors":3,"./pointer":7}],7:[function(_dereq_,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
Unescape token part of a JSON Pointer string

`token` should *not* contain any '/' characters.

> Evaluation of each reference token begins by decoding any escaped
> character sequence.  This is performed by first transforming any
> occurrence of the sequence '~1' to '/', and then transforming any
> occurrence of the sequence '~0' to '~'.  By performing the
> substitutions in this order, an implementation avoids the error of
> turning '~01' first into '~1' and then into '/', which would be
> incorrect (the string '~01' correctly becomes '~1' after
> transformation).

Here's my take:

~1 is unescaped with higher priority than ~0 because it is a lower-order escape character.
I say "lower order" because '/' needs escaping due to the JSON Pointer serialization technique.
Whereas, '~' is escaped because escaping '/' uses the '~' character.
*/
function unescape(token) {
    return token.replace(/~1/g, "/").replace(/~0/g, "~");
}
/** Escape token part of a JSON Pointer string

> '~' needs to be encoded as '~0' and '/'
> needs to be encoded as '~1' when these characters appear in a
> reference token.

This is the exact inverse of `unescape()`, so the reverse replacements must take place in reverse order.
*/
function escape(token) {
    return token.replace(/~/g, "~0").replace(/\//g, "~1");
}
/**
JSON Pointer representation
*/

var Pointer = exports.Pointer = (function () {
    function Pointer() {
        var tokens = arguments[0] === undefined ? [""] : arguments[0];

        _classCallCheck(this, Pointer);

        this.tokens = tokens;
    }

    _createClass(Pointer, {
        toString: {
            value: function toString() {
                return this.tokens.map(escape).join("/");
            }
        },
        evaluate: {
            /**
            Returns an object with 'parent', 'key', and 'value' properties.
            In the special case that pointer = "", parent and key will be null, and `value = obj`
            Otherwise, parent will be the such that `parent[key] == value`
            */

            value: function evaluate(object) {
                var parent = null;
                var token = null;
                for (var i = 1, l = this.tokens.length; i < l; i++) {
                    parent = object;
                    token = this.tokens[i];
                    // not sure if this the best way to handle non-existant paths...
                    object = (parent || {})[token];
                }
                return {
                    parent: parent,
                    key: token,
                    value: object };
            }
        },
        push: {
            value: function push(token) {
                // mutable
                this.tokens.push(token);
            }
        },
        add: {
            /**
            `token` should be a String. It'll be coerced to one anyway.
               immutable (shallowly)
            */

            value: function add(token) {
                var tokens = this.tokens.concat(String(token));
                return new Pointer(tokens);
            }
        }
    }, {
        fromJSON: {
            /**
            `path` *must* be a properly escaped string.
            */

            value: function fromJSON(path) {
                var tokens = path.split("/").map(unescape);
                if (tokens[0] !== "") throw new Error("Invalid JSON Pointer: " + path);
                return new Pointer(tokens);
            }
        }
    });

    return Pointer;
})();

},{}]},{},[4])(4)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],2:[function(require,module,exports){
var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz".split("");
function randomString(length) {
    if (length === void 0) { length = 8; }
    if (!length) {
        length = Math.floor(Math.random() * chars.length);
    }
    var str = "";
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}
exports.randomString = randomString;
function extend(dst) {
    var srcs = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        srcs[_i - 1] = arguments[_i];
    }
    srcs.forEach(function (src) {
        for (var prop in src) {
            if (src.hasOwnProperty(prop)) {
                dst[prop] = src[prop];
            }
        }
    });
    return dst;
}
exports.extend = extend;
function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
exports.clone = clone;
},{}],3:[function(require,module,exports){
var rfc6902 = require("rfc6902");
var Utils = require("../common/utils");
var ViewModel = require("./view-model");
exports.defaultConfiguration = {
    rootNode: null,
    socketEventName: "board",
    throttlingInterval: 1000
};
function start(config) {
    var app = new App();
    config = Utils.extend({}, exports.defaultConfiguration, config);
    app.start(config);
}
exports.start = start;
var App = (function () {
    function App() {
        var _this = this;
        this.shadowServer = {};
        this.shadowClient = {};
        this.boardVM = new ViewModel.Board();
        this.onMessage = function (msg) {
            var board = msg.board;
            var patch = msg.patch;
            if (board) {
            }
            else if (patch) {
                _this.applyServerPatch(patch);
            }
        };
        this.onInterval = function () {
            var current = _this.boardVM.toPlain();
            var myChanges = rfc6902.createPatch(_this.shadowServer, current);
            if (myChanges.length) {
                _this.socket.emit(_this.socketEventName, { patch: myChanges });
            }
        };
    }
    App.prototype.applyServerPatch = function (serverChanges) {
        var current = this.boardVM.toPlain();
        var myChanges = rfc6902.createPatch(this.shadowClient, current);
        rfc6902.applyPatch(this.shadowServer, Utils.clone(serverChanges));
        rfc6902.applyPatch(current, serverChanges);
        rfc6902.applyPatch(current, myChanges);
        this.boardVM.update(current);
        this.shadowClient = this.boardVM.toPlain();
    };
    App.prototype.start = function (config) {
        this.socketEventName = config.socketEventName;
        this.boardVM.update(this.shadowServer);
        this.boardVM.applyBindings(config.rootNode);
        this.shadowClient = this.boardVM.toPlain();
        this.socket = io();
        this.socket.on(this.socketEventName, this.onMessage);
        setInterval(this.onInterval, config.throttlingInterval);
    };
    return App;
})();
},{"../common/utils":2,"./view-model":7,"rfc6902":1}],4:[function(require,module,exports){
function register() {
    var _dragged;
    var _xFix;
    var _yFix;
    ko.bindingHandlers["drag"] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            element.setAttribute("draggable", "true");
            element.addEventListener("dragstart", function (e) {
                e.dataTransfer.setData("data", "data");
                _xFix = e.clientX - viewModel.posX();
                _yFix = e.clientY - viewModel.posY();
                _dragged = viewModel;
            }, false);
        }
    };
    ko.bindingHandlers["drop"] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            element.addEventListener("dragover", function (e) {
                e.preventDefault();
                return false;
            });
            element.addEventListener("drop", function (e) {
                _dragged.posX(e.clientX - _xFix);
                _dragged.posY(e.clientY - _yFix);
                return false;
            });
        }
    };
}
exports.register = register;
},{}],5:[function(require,module,exports){
function register() {
    ko.bindingHandlers["jeditable"] = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            var options = allBindingsAccessor().jeditableOptions || {};
            if (!options.onblur) {
                options.onblur = "submit";
            }
            $(element).editable(function (value, params) {
                valueAccessor()(value);
                return value;
            }, options);
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).editable("destroy");
            });
        },
        update: function (element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            $(element).html(value);
        }
    };
}
exports.register = register;
},{}],6:[function(require,module,exports){
var DragNDrop = require("./kobindings/dragndrop");
DragNDrop.register();
var JEditable = require("./kobindings/jeditable");
JEditable.register();
var App = require("./app");
App.start();
},{"./app":3,"./kobindings/dragndrop":4,"./kobindings/jeditable":5}],7:[function(require,module,exports){
var Utils = require("../common/utils");
var Note = (function () {
    function Note() {
        var _this = this;
        this.title = ko.observable();
        this.content = ko.observable();
        this.posX = ko.observable(0);
        this.posY = ko.observable(0);
        this.style = ko.computed(function () {
            var posX = _this.posX();
            var posY = _this.posY();
            return {
                top: posY ? posY + "px" : "0",
                left: posX ? posX + "px" : "0",
                display: posX != null && posY != null ? "block" : "none"
            };
        });
    }
    Note.prototype.update = function (plain) {
        this.title(plain.title);
        this.content(plain.content);
        this.posX(plain.posX);
        this.posY(plain.posY);
    };
    Note.prototype.toPlain = function () {
        var result = {};
        AddTruthyValue(result, "title", this.title());
        AddTruthyValue(result, "content", this.content());
        AddNumberValue(result, "posX", this.posX());
        AddNumberValue(result, "posY", this.posY());
        return result;
    };
    return Note;
})();
exports.Note = Note;
function AddTruthyValue(destination, key, value) {
    if (value) {
        destination[key] = value;
    }
}
function AddNumberValue(destination, key, value) {
    if (Object.prototype.toString.call(value) == "[object Number]") {
        destination[key] = value;
    }
}
var Board = (function () {
    function Board() {
        var _this = this;
        this.name = ko.observable();
        this.color = ko.observable();
        this.notes = ko.observableArray([]);
        this.notesById = {};
        this.newNote = function () {
            var note = _this.createNote();
            note.posX(0);
            note.posY(0);
            return note;
        };
    }
    Board.prototype.createNote = function (id) {
        if (id === void 0) { id = null; }
        id = id || Utils.randomString();
        var note = new Note();
        note.id = id;
        note.title("Title here");
        note.content("Content here");
        this.notesById[id] = note;
        this.notes.push(note);
        return note;
    };
    Board.prototype.deleteNote = function (id) {
        var note = this.notesById[id];
        delete this.notesById[id];
        this.notes.remove(note);
    };
    Board.prototype.update = function (plain) {
        this.name(plain.name);
        this.color(plain.color);
        var notes = plain.notes || {};
        for (var id in notes) {
            var noteVM = this.notesById[id];
            if (!noteVM) {
                noteVM = this.createNote(id);
            }
            noteVM.update(notes[id]);
        }
        for (var id in this.notesById) {
            if (!notes[id]) {
                this.deleteNote(id);
            }
        }
    };
    Board.prototype.toPlain = function () {
        var result = {};
        AddTruthyValue(result, "name", this.name());
        AddTruthyValue(result, "color", this.color());
        var noteVMs = this.notes();
        if (noteVMs.length) {
            var notes = {};
            for (var i in noteVMs) {
                var noteVM = noteVMs[i];
                notes[noteVM.id] = noteVM.toPlain();
            }
            result.notes = notes;
        }
        return result;
    };
    Board.prototype.applyBindings = function (rootNode) {
        ko.applyBindings(this, rootNode);
    };
    return Board;
})();
exports.Board = Board;
},{"../common/utils":2}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcmZjNjkwMi9yZmM2OTAyLmpzIiwic3JjL2NvbW1vbi91dGlscy50cyIsInNyYy9rb2NsaWVudC9hcHAudHMiLCJzcmMva29jbGllbnQva29iaW5kaW5ncy9kcmFnbmRyb3AudHMiLCJzcmMva29jbGllbnQva29iaW5kaW5ncy9qZWRpdGFibGUudHMiLCJzcmMva29jbGllbnQvbWFpbi50cyIsInNyYy9rb2NsaWVudC92aWV3LW1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM3VCQSxJQUFJLEtBQUssR0FBRywrREFBK0QsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDdEYsc0JBQTZCLE1BQWtCO0lBQWxCLHNCQUFrQixHQUFsQixVQUFrQjtJQUUzQyxFQUFFLENBQUMsQ0FBQyxDQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDWCxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRCxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDYixHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDOUIsR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUs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QUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDOUMsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzNCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ25CLElBQUksS0FBSyxHQUEyQixFQUFFLENBQUM7WUFDdkMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUN0QixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hCLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3RDLENBQUM7WUFDRCxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUN2QixDQUFDO1FBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQsNkJBQWEsR0FBYixVQUFjLFFBQWM7UUFDMUIsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUNILFlBQUM7QUFBRCxDQXhFQSxBQXdFQyxJQUFBO0FBeEVZLGFBQUssUUF3RWpCLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uKGYpe2lmKHR5cGVvZiBleHBvcnRzPT09XCJvYmplY3RcIiYmdHlwZW9mIG1vZHVsZSE9PVwidW5kZWZpbmVkXCIpe21vZHVsZS5leHBvcnRzPWYoKX1lbHNlIGlmKHR5cGVvZiBkZWZpbmU9PT1cImZ1bmN0aW9uXCImJmRlZmluZS5hbWQpe2RlZmluZShbXSxmKX1lbHNle3ZhciBnO2lmKHR5cGVvZiB3aW5kb3chPT1cInVuZGVmaW5lZFwiKXtnPXdpbmRvd31lbHNlIGlmKHR5cGVvZiBnbG9iYWwhPT1cInVuZGVmaW5lZFwiKXtnPWdsb2JhbH1lbHNlIGlmKHR5cGVvZiBzZWxmIT09XCJ1bmRlZmluZWRcIil7Zz1zZWxmfWVsc2V7Zz10aGlzfWcucmZjNjkwMiA9IGYoKX19KShmdW5jdGlvbigpe3ZhciBkZWZpbmUsbW9kdWxlLGV4cG9ydHM7cmV0dXJuIChmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pKHsxOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLmRpZmZBbnkgPSBkaWZmQW55O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgY29tcGFyZSA9IF9kZXJlcV8oXCIuL2VxdWFsXCIpLmNvbXBhcmU7XG5cbmZ1bmN0aW9uIHB1c2hBbGwoYXJyYXksIGl0ZW1zKSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGFycmF5LCBpdGVtcyk7XG59XG4vKipcbnN1YnRyYWN0KGEsIGIpIHJldHVybnMgdGhlIGtleXMgaW4gYGFgIHRoYXQgYXJlIG5vdCBpbiBgYmAuXG4qL1xuZnVuY3Rpb24gc3VidHJhY3QoYSwgYikge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICBmb3IgKHZhciBhZGRfa2V5IGluIGEpIHtcbiAgICAgICAgb2JqW2FkZF9rZXldID0gMTtcbiAgICB9XG4gICAgZm9yICh2YXIgZGVsX2tleSBpbiBiKSB7XG4gICAgICAgIGRlbGV0ZSBvYmpbZGVsX2tleV07XG4gICAgfVxuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopO1xufVxuLyoqXG5pbnRlcnNlY3Rpb24ob2JqZWN0cykgcmV0dXJucyB0aGUga2V5cyB0aGF0IHNoYXJlZCBieSBhbGwgZ2l2ZW4gYG9iamVjdHNgLlxuKi9cbmZ1bmN0aW9uIGludGVyc2VjdGlvbihvYmplY3RzKSB7XG4gICAgLy8gaW5pdGlhbGl6ZSBsaWtlIHVuaW9uKClcbiAgICB2YXIga2V5X2NvdW50cyA9IHt9O1xuICAgIG9iamVjdHMuZm9yRWFjaChmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgIGtleV9jb3VudHNba2V5XSA9IChrZXlfY291bnRzW2tleV0gfHwgMCkgKyAxO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgLy8gYnV0IHRoZW4sIGV4dHJhIHJlcXVpcmVtZW50OiBkZWxldGUgbGVzcyBjb21tb25seS1zZWVuIGtleXNcbiAgICB2YXIgdGhyZXNob2xkID0gb2JqZWN0cy5sZW5ndGg7XG4gICAgZm9yICh2YXIga2V5IGluIGtleV9jb3VudHMpIHtcbiAgICAgICAgaWYgKGtleV9jb3VudHNba2V5XSA8IHRocmVzaG9sZCkge1xuICAgICAgICAgICAgZGVsZXRlIGtleV9jb3VudHNba2V5XTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gT2JqZWN0LmtleXMoa2V5X2NvdW50cyk7XG59XG5mdW5jdGlvbiBvYmplY3RUeXBlKG9iamVjdCkge1xuICAgIGlmIChvYmplY3QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gXCJ1bmRlZmluZWRcIjtcbiAgICB9XG4gICAgaWYgKG9iamVjdCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gXCJudWxsXCI7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KG9iamVjdCkpIHtcbiAgICAgICAgcmV0dXJuIFwiYXJyYXlcIjtcbiAgICB9XG4gICAgcmV0dXJuIHR5cGVvZiBvYmplY3Q7XG59XG4vKipcbkFycmF5LWRpZmZpbmcgc21hcnRlciAobGV2ZW5zaHRlaW4tbGlrZSkgZGlmZmluZyBoZXJlXG5cblRvIGdldCBmcm9tIHRoZSBpbnB1dCBBQkMgdG8gdGhlIG91dHB1dCBBWiB3ZSBjb3VsZCBqdXN0IGRlbGV0ZSBhbGwgdGhlIGlucHV0XG5hbmQgc2F5IFwiaW5zZXJ0IEEsIGluc2VydCBaXCIgYW5kIGJlIGRvbmUgd2l0aCBpdC4gVGhhdCdzIHdoYXQgd2UgZG8gaWYgdGhlXG5pbnB1dCBpcyBlbXB0eS4gQnV0IHdlIGNhbiBiZSBzbWFydGVyLlxuXG4gICAgICAgICAgb3V0cHV0XG4gICAgICAgICAgICAgICBBICAgWlxuICAgICAgICAgICAgICAgLSAgIC1cbiAgICAgICAgICBbMF0gIDEgICAyXG5pbnB1dCBBIHwgIDEgIFswXSAgMVxuICAgICAgQiB8ICAyICBbMV0gIDFcbiAgICAgIEMgfCAgMyAgIDIgIFsyXVxuXG4xKSBzdGFydCBhdCAwLDAgKCswKVxuMikga2VlcCBBICgrMClcbjMpIHJlbW92ZSBCICgrMSlcbjQpIHJlcGxhY2UgQyB3aXRoIFogKCsxKVxuXG5pZiBpbnB1dCAoc291cmNlKSBpcyBlbXB0eSwgdGhleSdsbCBhbGwgYmUgaW4gdGhlIHRvcCByb3csIGp1c3QgYSBidW5jaCBvZlxuYWRkaXRpb25zLiBJZiB0aGUgb3V0cHV0IGlzIGVtcHR5LCBldmVyeXRoaW5nIHdpbGwgYmUgaW4gdGhlIGxlZnQgY29sdW1uLCBhcyBhXG5idW5jaCBvZiBkZWxldGlvbnMuXG4qL1xuZnVuY3Rpb24gZGlmZkFycmF5cyhpbnB1dCwgb3V0cHV0LCBwdHIpIHtcbiAgICAvLyBzZXQgdXAgY29zdCBtYXRyaXggKHZlcnkgc2ltcGxlIGluaXRpYWxpemF0aW9uOiBqdXN0IGEgbWFwKVxuICAgIHZhciBtZW1vID0ge1xuICAgICAgICBcIjAsMFwiOiB7IG9wZXJhdGlvbnM6IFtdLCBjb3N0OiAwIH1cbiAgICB9O1xuICAgIC8qKlxuICAgIGlucHV0W2knc10gLT4gb3V0cHV0W2onc11cbiAgICAgICBHaXZlbiB0aGUgbGF5b3V0IGFib3ZlLCBpIGlzIHRoZSByb3csIGogaXMgdGhlIGNvbFxuICAgICAgIHJldHVybnMgYSBsaXN0IG9mIE9wZXJhdGlvbnMgbmVlZGVkIHRvIGdldCB0byBmcm9tIGlucHV0LnNsaWNlKDAsIGkpIHRvXG4gICAgb3V0cHV0LnNsaWNlKDAsIGopLCB0aGUgZWFjaCBtYXJrZWQgd2l0aCB0aGUgdG90YWwgY29zdCBvZiBnZXR0aW5nIHRoZXJlLlxuICAgIGBjb3N0YCBpcyBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyLlxuICAgIFJlY3Vyc2l2ZS5cbiAgICAqL1xuICAgIGZ1bmN0aW9uIGRpc3QoaSwgaikge1xuICAgICAgICAvLyBtZW1vaXplZFxuICAgICAgICB2YXIgbWVtb2l6ZWQgPSBtZW1vW2kgKyBcIixcIiArIGpdO1xuICAgICAgICBpZiAobWVtb2l6ZWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKGNvbXBhcmUoaW5wdXRbaSAtIDFdLCBvdXRwdXRbaiAtIDFdKSkge1xuICAgICAgICAgICAgICAgIC8vIGVxdWFsIChubyBvcGVyYXRpb25zID0+IG5vIGNvc3QpXG4gICAgICAgICAgICAgICAgbWVtb2l6ZWQgPSBkaXN0KGkgLSAxLCBqIC0gMSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBhbHRlcm5hdGl2ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gTk9UIHRvcG1vc3Qgcm93XG4gICAgICAgICAgICAgICAgICAgIHZhciByZW1vdmVfYWx0ZXJuYXRpdmUgPSBkaXN0KGkgLSAxLCBqKTtcbiAgICAgICAgICAgICAgICAgICAgYWx0ZXJuYXRpdmVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIG5ldyBvcGVyYXRpb24gbXVzdCBiZSBwdXNoZWQgb24gdGhlIGVuZFxuICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0aW9uczogcmVtb3ZlX2FsdGVybmF0aXZlLm9wZXJhdGlvbnMuY29uY2F0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcDogXCJyZW1vdmVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogaSAtIDEgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3N0OiByZW1vdmVfYWx0ZXJuYXRpdmUuY29zdCArIDEgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChqID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBOT1QgbGVmdG1vc3QgY29sdW1uXG4gICAgICAgICAgICAgICAgICAgIHZhciBhZGRfYWx0ZXJuYXRpdmUgPSBkaXN0KGksIGogLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgYWx0ZXJuYXRpdmVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0aW9uczogYWRkX2FsdGVybmF0aXZlLm9wZXJhdGlvbnMuY29uY2F0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcDogXCJhZGRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogaSAtIDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG91dHB1dFtqIC0gMV0gfSksXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3N0OiBhZGRfYWx0ZXJuYXRpdmUuY29zdCArIDEgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpID4gMCAmJiBqID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUQUJMRSBNSURETEVcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlcGxhY2VfYWx0ZXJuYXRpdmUgPSBkaXN0KGkgLSAxLCBqIC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIGFsdGVybmF0aXZlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZXJhdGlvbnM6IHJlcGxhY2VfYWx0ZXJuYXRpdmUub3BlcmF0aW9ucy5jb25jYXQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wOiBcInJlcGxhY2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogaSAtIDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG91dHB1dFtqIC0gMV0gfSksXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3N0OiByZXBsYWNlX2FsdGVybmF0aXZlLmNvc3QgKyAxIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB0aGUgb25seSBvdGhlciBjYXNlLCBpID09PSAwICYmIGogPT09IDAsIGhhcyBhbHJlYWR5IGJlZW4gbWVtb2l6ZWRcbiAgICAgICAgICAgICAgICAvLyB0aGUgbWVhdCBvZiB0aGUgYWxnb3JpdGhtOlxuICAgICAgICAgICAgICAgIC8vIHNvcnQgYnkgY29zdCB0byBmaW5kIHRoZSBsb3dlc3Qgb25lIChtaWdodCBiZSBzZXZlcmFsIHRpZXMgZm9yIGxvd2VzdClcbiAgICAgICAgICAgICAgICAvLyBbNCwgNiwgNywgMSwgMl0uc29ydChmdW5jdGlvbihhLCBiKSB7cmV0dXJuIGEgLSBiO30pOyAtPiBbIDEsIDIsIDQsIDYsIDcgXVxuICAgICAgICAgICAgICAgIHZhciBiZXN0ID0gYWx0ZXJuYXRpdmVzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEuY29zdCAtIGIuY29zdDtcbiAgICAgICAgICAgICAgICB9KVswXTtcbiAgICAgICAgICAgICAgICBtZW1vaXplZCA9IGJlc3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZW1vW2kgKyBcIixcIiArIGpdID0gbWVtb2l6ZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1lbW9pemVkO1xuICAgIH1cbiAgICB2YXIgYXJyYXlfb3BlcmF0aW9ucyA9IGRpc3QoaW5wdXQubGVuZ3RoLCBvdXRwdXQubGVuZ3RoKS5vcGVyYXRpb25zO1xuICAgIHZhciBwYWRkaW5nID0gMDtcbiAgICB2YXIgb3BlcmF0aW9ucyA9IGFycmF5X29wZXJhdGlvbnMubWFwKGZ1bmN0aW9uIChhcnJheV9vcGVyYXRpb24pIHtcbiAgICAgICAgaWYgKGFycmF5X29wZXJhdGlvbi5vcCA9PT0gXCJhZGRcIikge1xuICAgICAgICAgICAgdmFyIHBhZGRlZF9pbmRleCA9IGFycmF5X29wZXJhdGlvbi5pbmRleCArIDEgKyBwYWRkaW5nO1xuICAgICAgICAgICAgdmFyIGluZGV4X3Rva2VuID0gcGFkZGVkX2luZGV4IDwgaW5wdXQubGVuZ3RoID8gU3RyaW5nKHBhZGRlZF9pbmRleCkgOiBcIi1cIjtcbiAgICAgICAgICAgIHZhciBvcGVyYXRpb24gPSB7XG4gICAgICAgICAgICAgICAgb3A6IGFycmF5X29wZXJhdGlvbi5vcCxcbiAgICAgICAgICAgICAgICBwYXRoOiBwdHIuYWRkKGluZGV4X3Rva2VuKS50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBhcnJheV9vcGVyYXRpb24udmFsdWUgfTtcbiAgICAgICAgICAgIHBhZGRpbmcrKzsgLy8gbWF5YmUgb25seSBpZiBhcnJheV9vcGVyYXRpb24uaW5kZXggPiAtMSA/XG4gICAgICAgICAgICByZXR1cm4gb3BlcmF0aW9uO1xuICAgICAgICB9IGVsc2UgaWYgKGFycmF5X29wZXJhdGlvbi5vcCA9PT0gXCJyZW1vdmVcIikge1xuICAgICAgICAgICAgdmFyIG9wZXJhdGlvbiA9IHtcbiAgICAgICAgICAgICAgICBvcDogYXJyYXlfb3BlcmF0aW9uLm9wLFxuICAgICAgICAgICAgICAgIHBhdGg6IHB0ci5hZGQoU3RyaW5nKGFycmF5X29wZXJhdGlvbi5pbmRleCArIHBhZGRpbmcpKS50b1N0cmluZygpIH07XG4gICAgICAgICAgICBwYWRkaW5nLS07XG4gICAgICAgICAgICByZXR1cm4gb3BlcmF0aW9uO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBvcDogYXJyYXlfb3BlcmF0aW9uLm9wLFxuICAgICAgICAgICAgICAgIHBhdGg6IHB0ci5hZGQoU3RyaW5nKGFycmF5X29wZXJhdGlvbi5pbmRleCArIHBhZGRpbmcpKS50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBhcnJheV9vcGVyYXRpb24udmFsdWUgfTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvcGVyYXRpb25zO1xufVxuZnVuY3Rpb24gZGlmZk9iamVjdHMoaW5wdXQsIG91dHB1dCwgcHRyKSB7XG4gICAgLy8gaWYgYSBrZXkgaXMgaW4gaW5wdXQgYnV0IG5vdCBvdXRwdXQgLT4gcmVtb3ZlIGl0XG4gICAgdmFyIG9wZXJhdGlvbnMgPSBbXTtcbiAgICBzdWJ0cmFjdChpbnB1dCwgb3V0cHV0KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgb3BlcmF0aW9ucy5wdXNoKHsgb3A6IFwicmVtb3ZlXCIsIHBhdGg6IHB0ci5hZGQoa2V5KS50b1N0cmluZygpIH0pO1xuICAgIH0pO1xuICAgIC8vIGlmIGEga2V5IGlzIGluIG91dHB1dCBidXQgbm90IGlucHV0IC0+IGFkZCBpdFxuICAgIHN1YnRyYWN0KG91dHB1dCwgaW5wdXQpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBvcGVyYXRpb25zLnB1c2goeyBvcDogXCJhZGRcIiwgcGF0aDogcHRyLmFkZChrZXkpLnRvU3RyaW5nKCksIHZhbHVlOiBvdXRwdXRba2V5XSB9KTtcbiAgICB9KTtcbiAgICAvLyBpZiBhIGtleSBpcyBpbiBib3RoLCBkaWZmIGl0IHJlY3Vyc2l2ZWx5XG4gICAgaW50ZXJzZWN0aW9uKFtpbnB1dCwgb3V0cHV0XSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHB1c2hBbGwob3BlcmF0aW9ucywgZGlmZkFueShpbnB1dFtrZXldLCBvdXRwdXRba2V5XSwgcHRyLmFkZChrZXkpKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG9wZXJhdGlvbnM7XG59XG5mdW5jdGlvbiBkaWZmVmFsdWVzKGlucHV0LCBvdXRwdXQsIHB0cikge1xuICAgIHZhciBvcGVyYXRpb25zID0gW107XG4gICAgaWYgKCFjb21wYXJlKGlucHV0LCBvdXRwdXQpKSB7XG4gICAgICAgIG9wZXJhdGlvbnMucHVzaCh7IG9wOiBcInJlcGxhY2VcIiwgcGF0aDogcHRyLnRvU3RyaW5nKCksIHZhbHVlOiBvdXRwdXQgfSk7XG4gICAgfVxuICAgIHJldHVybiBvcGVyYXRpb25zO1xufVxuXG5mdW5jdGlvbiBkaWZmQW55KGlucHV0LCBvdXRwdXQsIHB0cikge1xuICAgIHZhciBpbnB1dF90eXBlID0gb2JqZWN0VHlwZShpbnB1dCk7XG4gICAgdmFyIG91dHB1dF90eXBlID0gb2JqZWN0VHlwZShvdXRwdXQpO1xuICAgIGlmIChpbnB1dF90eXBlID09IFwiYXJyYXlcIiAmJiBvdXRwdXRfdHlwZSA9PSBcImFycmF5XCIpIHtcbiAgICAgICAgcmV0dXJuIGRpZmZBcnJheXMoaW5wdXQsIG91dHB1dCwgcHRyKTtcbiAgICB9XG4gICAgaWYgKGlucHV0X3R5cGUgPT0gXCJvYmplY3RcIiAmJiBvdXRwdXRfdHlwZSA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIHJldHVybiBkaWZmT2JqZWN0cyhpbnB1dCwgb3V0cHV0LCBwdHIpO1xuICAgIH1cbiAgICAvLyBvbmx5IHBhaXJzIG9mIGFycmF5cyBhbmQgb2JqZWN0cyBjYW4gZ28gZG93biBhIHBhdGggdG8gcHJvZHVjZSBhIHNtYWxsZXJcbiAgICAvLyBkaWZmOyBldmVyeXRoaW5nIGVsc2UgbXVzdCBiZSB3aG9sZXNhbGUgcmVwbGFjZWQgaWYgaW5lcXVhbFxuICAgIHJldHVybiBkaWZmVmFsdWVzKGlucHV0LCBvdXRwdXQsIHB0cik7XG59XG5cbn0se1wiLi9lcXVhbFwiOjJ9XSwyOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblxuLyoqXG5gY29tcGFyZSgpYCByZXR1cm5zIHRydWUgaWYgYGxlZnRgIGFuZCBgcmlnaHRgIGFyZSBtYXRlcmlhbGx5IGVxdWFsXG4oaS5lLiwgd291bGQgcHJvZHVjZSBlcXVpdmFsZW50IEpTT04pLCBmYWxzZSBvdGhlcndpc2UuXG5cbj4gSGVyZSwgXCJlcXVhbFwiIG1lYW5zIHRoYXQgdGhlIHZhbHVlIGF0IHRoZSB0YXJnZXQgbG9jYXRpb24gYW5kIHRoZVxuPiB2YWx1ZSBjb252ZXllZCBieSBcInZhbHVlXCIgYXJlIG9mIHRoZSBzYW1lIEpTT04gdHlwZSwgYW5kIHRoYXQgdGhleVxuPiBhcmUgY29uc2lkZXJlZCBlcXVhbCBieSB0aGUgZm9sbG93aW5nIHJ1bGVzIGZvciB0aGF0IHR5cGU6XG4+IG8gIHN0cmluZ3M6IGFyZSBjb25zaWRlcmVkIGVxdWFsIGlmIHRoZXkgY29udGFpbiB0aGUgc2FtZSBudW1iZXIgb2Zcbj4gICAgVW5pY29kZSBjaGFyYWN0ZXJzIGFuZCB0aGVpciBjb2RlIHBvaW50cyBhcmUgYnl0ZS1ieS1ieXRlIGVxdWFsLlxuPiBvICBudW1iZXJzOiBhcmUgY29uc2lkZXJlZCBlcXVhbCBpZiB0aGVpciB2YWx1ZXMgYXJlIG51bWVyaWNhbGx5XG4+ICAgIGVxdWFsLlxuPiBvICBhcnJheXM6IGFyZSBjb25zaWRlcmVkIGVxdWFsIGlmIHRoZXkgY29udGFpbiB0aGUgc2FtZSBudW1iZXIgb2Zcbj4gICAgdmFsdWVzLCBhbmQgaWYgZWFjaCB2YWx1ZSBjYW4gYmUgY29uc2lkZXJlZCBlcXVhbCB0byB0aGUgdmFsdWUgYXRcbj4gICAgdGhlIGNvcnJlc3BvbmRpbmcgcG9zaXRpb24gaW4gdGhlIG90aGVyIGFycmF5LCB1c2luZyB0aGlzIGxpc3Qgb2Zcbj4gICAgdHlwZS1zcGVjaWZpYyBydWxlcy5cbj4gbyAgb2JqZWN0czogYXJlIGNvbnNpZGVyZWQgZXF1YWwgaWYgdGhleSBjb250YWluIHRoZSBzYW1lIG51bWJlciBvZlxuPiAgICBtZW1iZXJzLCBhbmQgaWYgZWFjaCBtZW1iZXIgY2FuIGJlIGNvbnNpZGVyZWQgZXF1YWwgdG8gYSBtZW1iZXIgaW5cbj4gICAgdGhlIG90aGVyIG9iamVjdCwgYnkgY29tcGFyaW5nIHRoZWlyIGtleXMgKGFzIHN0cmluZ3MpIGFuZCB0aGVpclxuPiAgICB2YWx1ZXMgKHVzaW5nIHRoaXMgbGlzdCBvZiB0eXBlLXNwZWNpZmljIHJ1bGVzKS5cbj4gbyAgbGl0ZXJhbHMgKGZhbHNlLCB0cnVlLCBhbmQgbnVsbCk6IGFyZSBjb25zaWRlcmVkIGVxdWFsIGlmIHRoZXkgYXJlXG4+ICAgIHRoZSBzYW1lLlxuKi9cblwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLmNvbXBhcmUgPSBjb21wYXJlO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuLyoqXG56aXAoYSwgYikgYXNzdW1lcyB0aGF0IGEubGVuZ3RoID09PSBiLmxlbmd0aC5cbiovXG5mdW5jdGlvbiB6aXAoYSwgYikge1xuICAgIHZhciB6aXBwZWQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGEubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHppcHBlZC5wdXNoKFthW2ldLCBiW2ldXSk7XG4gICAgfVxuICAgIHJldHVybiB6aXBwZWQ7XG59XG4vKipcbmNvbXBhcmVBcnJheXMobGVmdCwgcmlnaHQpIGFzc3VtZXMgdGhhdCBgbGVmdGAgYW5kIGByaWdodGAgYXJlIGJvdGggQXJyYXlzLlxuKi9cbmZ1bmN0aW9uIGNvbXBhcmVBcnJheXMobGVmdCwgcmlnaHQpIHtcbiAgICBpZiAobGVmdC5sZW5ndGggIT09IHJpZ2h0Lmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfXJldHVybiB6aXAobGVmdCwgcmlnaHQpLmV2ZXJ5KGZ1bmN0aW9uIChwYWlyKSB7XG4gICAgICAgIHJldHVybiBjb21wYXJlKHBhaXJbMF0sIHBhaXJbMV0pO1xuICAgIH0pO1xufVxuLyoqXG5jb21wYXJlT2JqZWN0cyhsZWZ0LCByaWdodCkgYXNzdW1lcyB0aGF0IGBsZWZ0YCBhbmQgYHJpZ2h0YCBhcmUgYm90aCBPYmplY3RzLlxuKi9cbmZ1bmN0aW9uIGNvbXBhcmVPYmplY3RzKGxlZnQsIHJpZ2h0KSB7XG4gICAgdmFyIGxlZnRfa2V5cyA9IE9iamVjdC5rZXlzKGxlZnQpO1xuICAgIHZhciByaWdodF9rZXlzID0gT2JqZWN0LmtleXMocmlnaHQpO1xuICAgIGlmICghY29tcGFyZUFycmF5cyhsZWZ0X2tleXMsIHJpZ2h0X2tleXMpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9cmV0dXJuIGxlZnRfa2V5cy5ldmVyeShmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHJldHVybiBjb21wYXJlKGxlZnRba2V5XSwgcmlnaHRba2V5XSk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBjb21wYXJlKGxlZnQsIHJpZ2h0KSB7XG4gICAgLy8gc3RyaWN0IGVxdWFsaXR5IGhhbmRsZXMgbGl0ZXJhbHMsIG51bWJlcnMsIGFuZCBzdHJpbmdzIChhIHN1ZmZpY2llbnQgYnV0IG5vdCBuZWNlc3NhcnkgY2F1c2UpXG4gICAgaWYgKGxlZnQgPT09IHJpZ2h0KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gLy8gY2hlY2sgYXJyYXlzXG4gICAgaWYgKEFycmF5LmlzQXJyYXkobGVmdCkgJiYgQXJyYXkuaXNBcnJheShyaWdodCkpIHtcbiAgICAgICAgcmV0dXJuIGNvbXBhcmVBcnJheXMobGVmdCwgcmlnaHQpO1xuICAgIH1cbiAgICAvLyBjaGVjayBvYmplY3RzXG4gICAgaWYgKE9iamVjdChsZWZ0KSA9PT0gbGVmdCAmJiBPYmplY3QocmlnaHQpID09PSByaWdodCkge1xuICAgICAgICByZXR1cm4gY29tcGFyZU9iamVjdHMobGVmdCwgcmlnaHQpO1xuICAgIH1cbiAgICAvLyBtaXNtYXRjaGVkIGFycmF5cyAmIG9iamVjdHMsIGV0Yy4sIGFyZSBhbHdheXMgaW5lcXVhbFxuICAgIHJldHVybiBmYWxzZTtcbn1cblxufSx7fV0sMzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIF9nZXQgPSBmdW5jdGlvbiBnZXQob2JqZWN0LCBwcm9wZXJ0eSwgcmVjZWl2ZXIpIHsgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgcHJvcGVydHkpOyBpZiAoZGVzYyA9PT0gdW5kZWZpbmVkKSB7IHZhciBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTsgaWYgKHBhcmVudCA9PT0gbnVsbCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IGVsc2UgeyByZXR1cm4gZ2V0KHBhcmVudCwgcHJvcGVydHksIHJlY2VpdmVyKTsgfSB9IGVsc2UgaWYgKFwidmFsdWVcIiBpbiBkZXNjICYmIGRlc2Mud3JpdGFibGUpIHsgcmV0dXJuIGRlc2MudmFsdWU7IH0gZWxzZSB7IHZhciBnZXR0ZXIgPSBkZXNjLmdldDsgaWYgKGdldHRlciA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB1bmRlZmluZWQ7IH0gcmV0dXJuIGdldHRlci5jYWxsKHJlY2VpdmVyKTsgfSB9O1xuXG52YXIgX2luaGVyaXRzID0gZnVuY3Rpb24gKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gXCJmdW5jdGlvblwiICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgXCIgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH07XG5cbnZhciBfY2xhc3NDYWxsQ2hlY2sgPSBmdW5jdGlvbiAoaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIE1pc3NpbmdFcnJvciA9IGV4cG9ydHMuTWlzc2luZ0Vycm9yID0gKGZ1bmN0aW9uIChfRXJyb3IpIHtcbiAgZnVuY3Rpb24gTWlzc2luZ0Vycm9yKHBhdGgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTWlzc2luZ0Vycm9yKTtcblxuICAgIF9nZXQoT2JqZWN0LmdldFByb3RvdHlwZU9mKE1pc3NpbmdFcnJvci5wcm90b3R5cGUpLCBcImNvbnN0cnVjdG9yXCIsIHRoaXMpLmNhbGwodGhpcywgXCJWYWx1ZSByZXF1aXJlZCBhdCBwYXRoOiBcIiArIHBhdGgpO1xuICAgIHRoaXMubmFtZSA9IHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xuICB9XG5cbiAgX2luaGVyaXRzKE1pc3NpbmdFcnJvciwgX0Vycm9yKTtcblxuICByZXR1cm4gTWlzc2luZ0Vycm9yO1xufSkoRXJyb3IpO1xuXG52YXIgSW52YWxpZE9wZXJhdGlvbkVycm9yID0gZXhwb3J0cy5JbnZhbGlkT3BlcmF0aW9uRXJyb3IgPSAoZnVuY3Rpb24gKF9FcnJvcjIpIHtcbiAgZnVuY3Rpb24gSW52YWxpZE9wZXJhdGlvbkVycm9yKG9wKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEludmFsaWRPcGVyYXRpb25FcnJvcik7XG5cbiAgICBfZ2V0KE9iamVjdC5nZXRQcm90b3R5cGVPZihJbnZhbGlkT3BlcmF0aW9uRXJyb3IucHJvdG90eXBlKSwgXCJjb25zdHJ1Y3RvclwiLCB0aGlzKS5jYWxsKHRoaXMsIFwiSW52YWxpZCBvcGVyYXRpb246IFwiICsgb3ApO1xuICAgIHRoaXMubmFtZSA9IHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgICB0aGlzLm9wID0gb3A7XG4gIH1cblxuICBfaW5oZXJpdHMoSW52YWxpZE9wZXJhdGlvbkVycm9yLCBfRXJyb3IyKTtcblxuICByZXR1cm4gSW52YWxpZE9wZXJhdGlvbkVycm9yO1xufSkoRXJyb3IpO1xuXG52YXIgVGVzdEVycm9yID0gZXhwb3J0cy5UZXN0RXJyb3IgPSAoZnVuY3Rpb24gKF9FcnJvcjMpIHtcbiAgZnVuY3Rpb24gVGVzdEVycm9yKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgVGVzdEVycm9yKTtcblxuICAgIF9nZXQoT2JqZWN0LmdldFByb3RvdHlwZU9mKFRlc3RFcnJvci5wcm90b3R5cGUpLCBcImNvbnN0cnVjdG9yXCIsIHRoaXMpLmNhbGwodGhpcywgXCJUZXN0IGZhaWxlZDogXCIgKyBhY3R1YWwgKyBcIiAhPSBcIiArIGV4cGVjdGVkKTtcbiAgICB0aGlzLm5hbWUgPSB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XG4gICAgdGhpcy5hY3R1YWwgPSBhY3R1YWw7XG4gICAgdGhpcy5leHBlY3RlZCA9IGV4cGVjdGVkO1xuICB9XG5cbiAgX2luaGVyaXRzKFRlc3RFcnJvciwgX0Vycm9yMyk7XG5cbiAgcmV0dXJuIFRlc3RFcnJvcjtcbn0pKEVycm9yKTtcblxufSx7fV0sNDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIF9pbnRlcm9wUmVxdWlyZSA9IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9ialtcImRlZmF1bHRcIl0gOiBvYmo7IH07XG5cbnZhciBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZCA9IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgXCJkZWZhdWx0XCI6IG9iaiB9OyB9O1xuXG4vKipcbkFwcGx5IGEgJ2FwcGxpY2F0aW9uL2pzb24tcGF0Y2granNvbictdHlwZSBwYXRjaCB0byBhbiBvYmplY3QuXG5cbmBwYXRjaGAgKm11c3QqIGJlIGFuIGFycmF5IG9mIG9wZXJhdGlvbnMuXG5cbj4gT3BlcmF0aW9uIG9iamVjdHMgTVVTVCBoYXZlIGV4YWN0bHkgb25lIFwib3BcIiBtZW1iZXIsIHdob3NlIHZhbHVlXG4+IGluZGljYXRlcyB0aGUgb3BlcmF0aW9uIHRvIHBlcmZvcm0uICBJdHMgdmFsdWUgTVVTVCBiZSBvbmUgb2YgXCJhZGRcIixcbj4gXCJyZW1vdmVcIiwgXCJyZXBsYWNlXCIsIFwibW92ZVwiLCBcImNvcHlcIiwgb3IgXCJ0ZXN0XCI7IG90aGVyIHZhbHVlcyBhcmVcbj4gZXJyb3JzLlxuXG5UaGlzIG1ldGhvZCBjdXJyZW50bHkgb3BlcmF0ZXMgb24gdGhlIHRhcmdldCBvYmplY3QgaW4tcGxhY2UuXG5cblJldHVybnMgbGlzdCBvZiByZXN1bHRzLCBvbmUgZm9yIGVhY2ggb3BlcmF0aW9uLlxuICAtIGBudWxsYCBpbmRpY2F0ZWQgc3VjY2Vzcy5cbiAgLSBvdGhlcndpc2UsIHRoZSByZXN1bHQgd2lsbCBiZSBhbiBpbnN0YW5jZSBvZiBvbmUgb2YgdGhlIEVycm9yIGNsYXNzZVxuICAgIGRlZmluZWQgaW4gZXJyb3JzLmpzLlxuKi9cbmV4cG9ydHMuYXBwbHlQYXRjaCA9IGFwcGx5UGF0Y2g7XG5cbi8qKlxuUHJvZHVjZSBhICdhcHBsaWNhdGlvbi9qc29uLXBhdGNoK2pzb24nLXR5cGUgcGF0Y2ggdG8gZ2V0IGZyb20gb25lIG9iamVjdCB0b1xuYW5vdGhlci5cblxuVGhpcyBkb2VzIG5vdCBhbHRlciBgaW5wdXRgIG9yIGBvdXRwdXRgIHVubGVzcyB0aGV5IGhhdmUgYSBwcm9wZXJ0eSBnZXR0ZXIgd2l0aFxuc2lkZS1lZmZlY3RzICh3aGljaCBpcyBub3QgYSBnb29kIGlkZWEgYW55d2F5KS5cblxuUmV0dXJucyBsaXN0IG9mIG9wZXJhdGlvbnMgdG8gcGVyZm9ybSBvbiBgaW5wdXRgIHRvIHByb2R1Y2UgYG91dHB1dGAuXG4qL1xuZXhwb3J0cy5jcmVhdGVQYXRjaCA9IGNyZWF0ZVBhdGNoO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIEludmFsaWRPcGVyYXRpb25FcnJvciA9IF9kZXJlcV8oXCIuL2Vycm9yc1wiKS5JbnZhbGlkT3BlcmF0aW9uRXJyb3I7XG5cbnZhciBQb2ludGVyID0gX2RlcmVxXyhcIi4vcG9pbnRlclwiKS5Qb2ludGVyO1xuXG52YXIgb3BlcmF0aW9uRnVuY3Rpb25zID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2RlcmVxXyhcIi4vcGF0Y2hcIikpO1xuXG52YXIgZGlmZkFueSA9IF9kZXJlcV8oXCIuL2RpZmZcIikuZGlmZkFueTtcblxudmFyIHBhY2thZ2VfanNvbiA9IF9pbnRlcm9wUmVxdWlyZShfZGVyZXFfKFwiLi9wYWNrYWdlXCIpKTtcblxudmFyIHZlcnNpb24gPSBwYWNrYWdlX2pzb24udmVyc2lvbjtleHBvcnRzLnZlcnNpb24gPSB2ZXJzaW9uO1xuXG5mdW5jdGlvbiBhcHBseVBhdGNoKG9iamVjdCwgcGF0Y2gpIHtcbiAgcmV0dXJuIHBhdGNoLm1hcChmdW5jdGlvbiAob3BlcmF0aW9uKSB7XG4gICAgdmFyIG9wZXJhdGlvbkZ1bmN0aW9uID0gb3BlcmF0aW9uRnVuY3Rpb25zW29wZXJhdGlvbi5vcF07XG4gICAgLy8gc3BlZWR5IGV4aXQgaWYgd2UgZG9uJ3QgcmVjb2duaXplIHRoZSBvcGVyYXRpb24gbmFtZVxuICAgIGlmIChvcGVyYXRpb25GdW5jdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gbmV3IEludmFsaWRPcGVyYXRpb25FcnJvcihvcGVyYXRpb24ub3ApO1xuICAgIH1cbiAgICByZXR1cm4gb3BlcmF0aW9uRnVuY3Rpb24ob2JqZWN0LCBvcGVyYXRpb24pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUGF0Y2goaW5wdXQsIG91dHB1dCkge1xuICB2YXIgcHRyID0gbmV3IFBvaW50ZXIoKTtcbiAgLy8gYSBuZXcgUG9pbnRlciBnZXRzIGEgZGVmYXVsdCBwYXRoIG9mIFsnJ10gaWYgbm90IHNwZWNpZmllZFxuICB2YXIgb3BlcmF0aW9ucyA9IGRpZmZBbnkoaW5wdXQsIG91dHB1dCwgcHRyKTtcbiAgb3BlcmF0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChvcGVyYXRpb24pIHtcbiAgICBvcGVyYXRpb24ucGF0aCA9IG9wZXJhdGlvbi5wYXRoLnRvU3RyaW5nKCk7XG4gIH0pO1xuICByZXR1cm4gb3BlcmF0aW9ucztcbn1cblxufSx7XCIuL2RpZmZcIjoxLFwiLi9lcnJvcnNcIjozLFwiLi9wYWNrYWdlXCI6NSxcIi4vcGF0Y2hcIjo2LFwiLi9wb2ludGVyXCI6N31dLDU6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xubW9kdWxlLmV4cG9ydHM9e1xuICBcIm5hbWVcIjogXCJyZmM2OTAyXCIsXG4gIFwidmVyc2lvblwiOiBcIjEuMS4wXCIsXG4gIFwiZGVzY3JpcHRpb25cIjogXCJDb21wbGV0ZSBpbXBsZW1lbnRhdGlvbiBvZiBSRkM2OTAyIChwYXRjaCBhbmQgZGlmZilcIixcbiAgXCJrZXl3b3Jkc1wiOiBbXG4gICAgXCJqc29uXCIsXG4gICAgXCJwYXRjaFwiLFxuICAgIFwiZGlmZlwiLFxuICAgIFwicmZjNjkwMlwiXG4gIF0sXG4gIFwiaG9tZXBhZ2VcIjogXCJodHRwczovL2dpdGh1Yi5jb20vY2hicm93bi9yZmM2OTAyXCIsXG4gIFwicmVwb3NpdG9yeVwiOiB7XG4gICAgXCJ0eXBlXCI6IFwiZ2l0XCIsXG4gICAgXCJ1cmxcIjogXCJodHRwczovL2dpdGh1Yi5jb20vY2hicm93bi9yZmM2OTAyLmdpdFwiXG4gIH0sXG4gIFwiYXV0aG9yXCI6IFwiQ2hyaXN0b3BoZXIgQnJvd24gPGlvQGhlbnJpYW4uY29tPiAoaHR0cDovL2hlbnJpYW4uY29tKVwiLFxuICBcImxpY2Vuc2VcIjogXCJNSVRcIixcbiAgXCJtYWluXCI6IFwiLi9yZmM2OTAyLmpzXCIsXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcImJhYmVsLWNvcmVcIjogXCJeNS4wLjBcIixcbiAgICBcImJhYmVsaWZ5XCI6IFwiXjUuMC4wXCIsXG4gICAgXCJicm93c2VyaWZ5XCI6IFwiMTIuMC4xXCIsXG4gICAgXCJjb3ZlcmFsbHNcIjogXCIqXCIsXG4gICAgXCJkZXJlcXVpcmVcIjogXCIyLjAuM1wiLFxuICAgIFwiaXN0YW5idWxcIjogXCIqXCIsXG4gICAgXCJqcy15YW1sXCI6IFwiKlwiLFxuICAgIFwibW9jaGFcIjogXCIqXCIsXG4gICAgXCJtb2NoYS1sY292LXJlcG9ydGVyXCI6IFwiKlwiLFxuICAgIFwidHlwZXNjcmlwdFwiOiBcIipcIlxuICB9LFxuICBcInNjcmlwdHNcIjoge1xuICAgIFwidGVzdFwiOiBcIm1ha2UgdGVzdFwiXG4gIH1cbn1cblxufSx7fV0sNjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5cblxuLyoqXG4+ICBvICBJZiB0aGUgdGFyZ2V0IGxvY2F0aW9uIHNwZWNpZmllcyBhbiBhcnJheSBpbmRleCwgYSBuZXcgdmFsdWUgaXNcbj4gICAgIGluc2VydGVkIGludG8gdGhlIGFycmF5IGF0IHRoZSBzcGVjaWZpZWQgaW5kZXguXG4+ICBvICBJZiB0aGUgdGFyZ2V0IGxvY2F0aW9uIHNwZWNpZmllcyBhbiBvYmplY3QgbWVtYmVyIHRoYXQgZG9lcyBub3Rcbj4gICAgIGFscmVhZHkgZXhpc3QsIGEgbmV3IG1lbWJlciBpcyBhZGRlZCB0byB0aGUgb2JqZWN0LlxuPiAgbyAgSWYgdGhlIHRhcmdldCBsb2NhdGlvbiBzcGVjaWZpZXMgYW4gb2JqZWN0IG1lbWJlciB0aGF0IGRvZXMgZXhpc3QsXG4+ICAgICB0aGF0IG1lbWJlcidzIHZhbHVlIGlzIHJlcGxhY2VkLlxuKi9cblwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLmFkZCA9IGFkZDtcblxuLyoqXG4+IFRoZSBcInJlbW92ZVwiIG9wZXJhdGlvbiByZW1vdmVzIHRoZSB2YWx1ZSBhdCB0aGUgdGFyZ2V0IGxvY2F0aW9uLlxuPiBUaGUgdGFyZ2V0IGxvY2F0aW9uIE1VU1QgZXhpc3QgZm9yIHRoZSBvcGVyYXRpb24gdG8gYmUgc3VjY2Vzc2Z1bC5cbiovXG5leHBvcnRzLnJlbW92ZSA9IHJlbW92ZTtcblxuLyoqXG4+IFRoZSBcInJlcGxhY2VcIiBvcGVyYXRpb24gcmVwbGFjZXMgdGhlIHZhbHVlIGF0IHRoZSB0YXJnZXQgbG9jYXRpb25cbj4gd2l0aCBhIG5ldyB2YWx1ZS4gIFRoZSBvcGVyYXRpb24gb2JqZWN0IE1VU1QgY29udGFpbiBhIFwidmFsdWVcIiBtZW1iZXJcbj4gd2hvc2UgY29udGVudCBzcGVjaWZpZXMgdGhlIHJlcGxhY2VtZW50IHZhbHVlLlxuPiBUaGUgdGFyZ2V0IGxvY2F0aW9uIE1VU1QgZXhpc3QgZm9yIHRoZSBvcGVyYXRpb24gdG8gYmUgc3VjY2Vzc2Z1bC5cblxuPiBUaGlzIG9wZXJhdGlvbiBpcyBmdW5jdGlvbmFsbHkgaWRlbnRpY2FsIHRvIGEgXCJyZW1vdmVcIiBvcGVyYXRpb24gZm9yXG4+IGEgdmFsdWUsIGZvbGxvd2VkIGltbWVkaWF0ZWx5IGJ5IGFuIFwiYWRkXCIgb3BlcmF0aW9uIGF0IHRoZSBzYW1lXG4+IGxvY2F0aW9uIHdpdGggdGhlIHJlcGxhY2VtZW50IHZhbHVlLlxuXG5FdmVuIG1vcmUgc2ltcGx5LCBpdCdzIGxpa2UgdGhlIGFkZCBvcGVyYXRpb24gd2l0aCBhbiBleGlzdGVuY2UgY2hlY2suXG4qL1xuZXhwb3J0cy5yZXBsYWNlID0gcmVwbGFjZTtcblxuLyoqXG4+IFRoZSBcIm1vdmVcIiBvcGVyYXRpb24gcmVtb3ZlcyB0aGUgdmFsdWUgYXQgYSBzcGVjaWZpZWQgbG9jYXRpb24gYW5kXG4+IGFkZHMgaXQgdG8gdGhlIHRhcmdldCBsb2NhdGlvbi5cbj4gVGhlIG9wZXJhdGlvbiBvYmplY3QgTVVTVCBjb250YWluIGEgXCJmcm9tXCIgbWVtYmVyLCB3aGljaCBpcyBhIHN0cmluZ1xuPiBjb250YWluaW5nIGEgSlNPTiBQb2ludGVyIHZhbHVlIHRoYXQgcmVmZXJlbmNlcyB0aGUgbG9jYXRpb24gaW4gdGhlXG4+IHRhcmdldCBkb2N1bWVudCB0byBtb3ZlIHRoZSB2YWx1ZSBmcm9tLlxuPiBUaGlzIG9wZXJhdGlvbiBpcyBmdW5jdGlvbmFsbHkgaWRlbnRpY2FsIHRvIGEgXCJyZW1vdmVcIiBvcGVyYXRpb24gb25cbj4gdGhlIFwiZnJvbVwiIGxvY2F0aW9uLCBmb2xsb3dlZCBpbW1lZGlhdGVseSBieSBhbiBcImFkZFwiIG9wZXJhdGlvbiBhdFxuPiB0aGUgdGFyZ2V0IGxvY2F0aW9uIHdpdGggdGhlIHZhbHVlIHRoYXQgd2FzIGp1c3QgcmVtb3ZlZC5cblxuPiBUaGUgXCJmcm9tXCIgbG9jYXRpb24gTVVTVCBOT1QgYmUgYSBwcm9wZXIgcHJlZml4IG9mIHRoZSBcInBhdGhcIlxuPiBsb2NhdGlvbjsgaS5lLiwgYSBsb2NhdGlvbiBjYW5ub3QgYmUgbW92ZWQgaW50byBvbmUgb2YgaXRzIGNoaWxkcmVuLlxuXG5UT0RPOiB0aHJvdyBpZiB0aGUgY2hlY2sgZGVzY3JpYmVkIGluIHRoZSBwcmV2aW91cyBwYXJhZ3JhcGggZmFpbHMuXG4qL1xuZXhwb3J0cy5tb3ZlID0gbW92ZTtcblxuLyoqXG4+IFRoZSBcImNvcHlcIiBvcGVyYXRpb24gY29waWVzIHRoZSB2YWx1ZSBhdCBhIHNwZWNpZmllZCBsb2NhdGlvbiB0byB0aGVcbj4gdGFyZ2V0IGxvY2F0aW9uLlxuPiBUaGUgb3BlcmF0aW9uIG9iamVjdCBNVVNUIGNvbnRhaW4gYSBcImZyb21cIiBtZW1iZXIsIHdoaWNoIGlzIGEgc3RyaW5nXG4+IGNvbnRhaW5pbmcgYSBKU09OIFBvaW50ZXIgdmFsdWUgdGhhdCByZWZlcmVuY2VzIHRoZSBsb2NhdGlvbiBpbiB0aGVcbj4gdGFyZ2V0IGRvY3VtZW50IHRvIGNvcHkgdGhlIHZhbHVlIGZyb20uXG4+IFRoZSBcImZyb21cIiBsb2NhdGlvbiBNVVNUIGV4aXN0IGZvciB0aGUgb3BlcmF0aW9uIHRvIGJlIHN1Y2Nlc3NmdWwuXG5cbj4gVGhpcyBvcGVyYXRpb24gaXMgZnVuY3Rpb25hbGx5IGlkZW50aWNhbCB0byBhbiBcImFkZFwiIG9wZXJhdGlvbiBhdCB0aGVcbj4gdGFyZ2V0IGxvY2F0aW9uIHVzaW5nIHRoZSB2YWx1ZSBzcGVjaWZpZWQgaW4gdGhlIFwiZnJvbVwiIG1lbWJlci5cblxuQWx0ZXJuYXRpdmVseSwgaXQncyBsaWtlICdtb3ZlJyB3aXRob3V0IHRoZSAncmVtb3ZlJy5cbiovXG5leHBvcnRzLmNvcHkgPSBjb3B5O1xuXG4vKipcbj4gVGhlIFwidGVzdFwiIG9wZXJhdGlvbiB0ZXN0cyB0aGF0IGEgdmFsdWUgYXQgdGhlIHRhcmdldCBsb2NhdGlvbiBpc1xuPiBlcXVhbCB0byBhIHNwZWNpZmllZCB2YWx1ZS5cbj4gVGhlIG9wZXJhdGlvbiBvYmplY3QgTVVTVCBjb250YWluIGEgXCJ2YWx1ZVwiIG1lbWJlciB0aGF0IGNvbnZleXMgdGhlXG4+IHZhbHVlIHRvIGJlIGNvbXBhcmVkIHRvIHRoZSB0YXJnZXQgbG9jYXRpb24ncyB2YWx1ZS5cbj4gVGhlIHRhcmdldCBsb2NhdGlvbiBNVVNUIGJlIGVxdWFsIHRvIHRoZSBcInZhbHVlXCIgdmFsdWUgZm9yIHRoZVxuPiBvcGVyYXRpb24gdG8gYmUgY29uc2lkZXJlZCBzdWNjZXNzZnVsLlxuKi9cbmV4cG9ydHMudGVzdCA9IHRlc3Q7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgUG9pbnRlciA9IF9kZXJlcV8oXCIuL3BvaW50ZXJcIikuUG9pbnRlcjtcblxudmFyIGNvbXBhcmUgPSBfZGVyZXFfKFwiLi9lcXVhbFwiKS5jb21wYXJlO1xuXG52YXIgX2Vycm9ycyA9IF9kZXJlcV8oXCIuL2Vycm9yc1wiKTtcblxudmFyIE1pc3NpbmdFcnJvciA9IF9lcnJvcnMuTWlzc2luZ0Vycm9yO1xudmFyIFRlc3RFcnJvciA9IF9lcnJvcnMuVGVzdEVycm9yO1xuXG5mdW5jdGlvbiBfYWRkKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICBpZiAoQXJyYXkuaXNBcnJheShvYmplY3QpKSB7XG4gICAgLy8gYGtleWAgbXVzdCBiZSBhbiBpbmRleFxuICAgIGlmIChrZXkgPT0gXCItXCIpIHtcbiAgICAgIG9iamVjdC5wdXNoKHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb2JqZWN0LnNwbGljZShrZXksIDAsIHZhbHVlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0W2tleV0gPSB2YWx1ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfcmVtb3ZlKG9iamVjdCwga2V5KSB7XG4gIGlmIChBcnJheS5pc0FycmF5KG9iamVjdCkpIHtcbiAgICAvLyAnLScgc3ludGF4IGRvZXNuJ3QgbWFrZSBzZW5zZSB3aGVuIHJlbW92aW5nXG4gICAgb2JqZWN0LnNwbGljZShrZXksIDEpO1xuICB9IGVsc2Uge1xuICAgIC8vIG5vdCBzdXJlIHdoYXQgdGhlIHByb3BlciBiZWhhdmlvciBpcyB3aGVuIHBhdGggPSAnJ1xuICAgIGRlbGV0ZSBvYmplY3Rba2V5XTtcbiAgfVxufVxuZnVuY3Rpb24gYWRkKG9iamVjdCwgb3BlcmF0aW9uKSB7XG4gIHZhciBlbmRwb2ludCA9IFBvaW50ZXIuZnJvbUpTT04ob3BlcmF0aW9uLnBhdGgpLmV2YWx1YXRlKG9iamVjdCk7XG4gIC8vIGl0J3Mgbm90IGV4YWN0bHkgYSBcIk1pc3NpbmdFcnJvclwiIGluIHRoZSBzYW1lIHdheSB0aGF0IGByZW1vdmVgIGlzIC0tIG1vcmUgbGlrZSBhIE1pc3NpbmdQYXJlbnQsIG9yIHNvbWV0aGluZ1xuICBpZiAoZW5kcG9pbnQucGFyZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gbmV3IE1pc3NpbmdFcnJvcihvcGVyYXRpb24ucGF0aCk7XG4gIH1cbiAgX2FkZChlbmRwb2ludC5wYXJlbnQsIGVuZHBvaW50LmtleSwgb3BlcmF0aW9uLnZhbHVlKTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZShvYmplY3QsIG9wZXJhdGlvbikge1xuICAvLyBlbmRwb2ludCBoYXMgcGFyZW50LCBrZXksIGFuZCB2YWx1ZSBwcm9wZXJ0aWVzXG4gIHZhciBlbmRwb2ludCA9IFBvaW50ZXIuZnJvbUpTT04ob3BlcmF0aW9uLnBhdGgpLmV2YWx1YXRlKG9iamVjdCk7XG4gIGlmIChlbmRwb2ludC52YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG5ldyBNaXNzaW5nRXJyb3Iob3BlcmF0aW9uLnBhdGgpO1xuICB9XG4gIC8vIG5vdCBzdXJlIHdoYXQgdGhlIHByb3BlciBiZWhhdmlvciBpcyB3aGVuIHBhdGggPSAnJ1xuICBfcmVtb3ZlKGVuZHBvaW50LnBhcmVudCwgZW5kcG9pbnQua2V5KTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2Uob2JqZWN0LCBvcGVyYXRpb24pIHtcbiAgdmFyIGVuZHBvaW50ID0gUG9pbnRlci5mcm9tSlNPTihvcGVyYXRpb24ucGF0aCkuZXZhbHVhdGUob2JqZWN0KTtcbiAgaWYgKGVuZHBvaW50LnZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gbmV3IE1pc3NpbmdFcnJvcihvcGVyYXRpb24ucGF0aCk7XG4gIH1lbmRwb2ludC5wYXJlbnRbZW5kcG9pbnQua2V5XSA9IG9wZXJhdGlvbi52YWx1ZTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIG1vdmUob2JqZWN0LCBvcGVyYXRpb24pIHtcbiAgdmFyIGZyb21fZW5kcG9pbnQgPSBQb2ludGVyLmZyb21KU09OKG9wZXJhdGlvbi5mcm9tKS5ldmFsdWF0ZShvYmplY3QpO1xuICBpZiAoZnJvbV9lbmRwb2ludC52YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG5ldyBNaXNzaW5nRXJyb3Iob3BlcmF0aW9uLmZyb20pO1xuICB9dmFyIGVuZHBvaW50ID0gUG9pbnRlci5mcm9tSlNPTihvcGVyYXRpb24ucGF0aCkuZXZhbHVhdGUob2JqZWN0KTtcbiAgaWYgKGVuZHBvaW50LnBhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG5ldyBNaXNzaW5nRXJyb3Iob3BlcmF0aW9uLnBhdGgpO1xuICB9X3JlbW92ZShmcm9tX2VuZHBvaW50LnBhcmVudCwgZnJvbV9lbmRwb2ludC5rZXkpO1xuICBfYWRkKGVuZHBvaW50LnBhcmVudCwgZW5kcG9pbnQua2V5LCBmcm9tX2VuZHBvaW50LnZhbHVlKTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGNvcHkob2JqZWN0LCBvcGVyYXRpb24pIHtcbiAgdmFyIGZyb21fZW5kcG9pbnQgPSBQb2ludGVyLmZyb21KU09OKG9wZXJhdGlvbi5mcm9tKS5ldmFsdWF0ZShvYmplY3QpO1xuICBpZiAoZnJvbV9lbmRwb2ludC52YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG5ldyBNaXNzaW5nRXJyb3Iob3BlcmF0aW9uLmZyb20pO1xuICB9dmFyIGVuZHBvaW50ID0gUG9pbnRlci5mcm9tSlNPTihvcGVyYXRpb24ucGF0aCkuZXZhbHVhdGUob2JqZWN0KTtcbiAgaWYgKGVuZHBvaW50LnBhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG5ldyBNaXNzaW5nRXJyb3Iob3BlcmF0aW9uLnBhdGgpO1xuICB9X3JlbW92ZShmcm9tX2VuZHBvaW50LnBhcmVudCwgZnJvbV9lbmRwb2ludC5rZXkpO1xuICBfYWRkKGVuZHBvaW50LnBhcmVudCwgZW5kcG9pbnQua2V5LCBmcm9tX2VuZHBvaW50LnZhbHVlKTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHRlc3Qob2JqZWN0LCBvcGVyYXRpb24pIHtcbiAgdmFyIGVuZHBvaW50ID0gUG9pbnRlci5mcm9tSlNPTihvcGVyYXRpb24ucGF0aCkuZXZhbHVhdGUob2JqZWN0KTtcbiAgdmFyIHJlc3VsdCA9IGNvbXBhcmUoZW5kcG9pbnQudmFsdWUsIG9wZXJhdGlvbi52YWx1ZSk7XG4gIGlmICghcmVzdWx0KSB7XG4gICAgcmV0dXJuIG5ldyBUZXN0RXJyb3IoZW5kcG9pbnQudmFsdWUsIG9wZXJhdGlvbi52YWx1ZSk7XG4gIH1yZXR1cm4gbnVsbDtcbn1cblxufSx7XCIuL2VxdWFsXCI6MixcIi4vZXJyb3JzXCI6MyxcIi4vcG9pbnRlclwiOjd9XSw3OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGtleSBpbiBwcm9wcykgeyB2YXIgcHJvcCA9IHByb3BzW2tleV07IHByb3AuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKHByb3AudmFsdWUpIHByb3Aud3JpdGFibGUgPSB0cnVlOyB9IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpOyB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbnZhciBfY2xhc3NDYWxsQ2hlY2sgPSBmdW5jdGlvbiAoaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuLyoqXG5VbmVzY2FwZSB0b2tlbiBwYXJ0IG9mIGEgSlNPTiBQb2ludGVyIHN0cmluZ1xuXG5gdG9rZW5gIHNob3VsZCAqbm90KiBjb250YWluIGFueSAnLycgY2hhcmFjdGVycy5cblxuPiBFdmFsdWF0aW9uIG9mIGVhY2ggcmVmZXJlbmNlIHRva2VuIGJlZ2lucyBieSBkZWNvZGluZyBhbnkgZXNjYXBlZFxuPiBjaGFyYWN0ZXIgc2VxdWVuY2UuICBUaGlzIGlzIHBlcmZvcm1lZCBieSBmaXJzdCB0cmFuc2Zvcm1pbmcgYW55XG4+IG9jY3VycmVuY2Ugb2YgdGhlIHNlcXVlbmNlICd+MScgdG8gJy8nLCBhbmQgdGhlbiB0cmFuc2Zvcm1pbmcgYW55XG4+IG9jY3VycmVuY2Ugb2YgdGhlIHNlcXVlbmNlICd+MCcgdG8gJ34nLiAgQnkgcGVyZm9ybWluZyB0aGVcbj4gc3Vic3RpdHV0aW9ucyBpbiB0aGlzIG9yZGVyLCBhbiBpbXBsZW1lbnRhdGlvbiBhdm9pZHMgdGhlIGVycm9yIG9mXG4+IHR1cm5pbmcgJ34wMScgZmlyc3QgaW50byAnfjEnIGFuZCB0aGVuIGludG8gJy8nLCB3aGljaCB3b3VsZCBiZVxuPiBpbmNvcnJlY3QgKHRoZSBzdHJpbmcgJ34wMScgY29ycmVjdGx5IGJlY29tZXMgJ34xJyBhZnRlclxuPiB0cmFuc2Zvcm1hdGlvbikuXG5cbkhlcmUncyBteSB0YWtlOlxuXG5+MSBpcyB1bmVzY2FwZWQgd2l0aCBoaWdoZXIgcHJpb3JpdHkgdGhhbiB+MCBiZWNhdXNlIGl0IGlzIGEgbG93ZXItb3JkZXIgZXNjYXBlIGNoYXJhY3Rlci5cbkkgc2F5IFwibG93ZXIgb3JkZXJcIiBiZWNhdXNlICcvJyBuZWVkcyBlc2NhcGluZyBkdWUgdG8gdGhlIEpTT04gUG9pbnRlciBzZXJpYWxpemF0aW9uIHRlY2huaXF1ZS5cbldoZXJlYXMsICd+JyBpcyBlc2NhcGVkIGJlY2F1c2UgZXNjYXBpbmcgJy8nIHVzZXMgdGhlICd+JyBjaGFyYWN0ZXIuXG4qL1xuZnVuY3Rpb24gdW5lc2NhcGUodG9rZW4pIHtcbiAgICByZXR1cm4gdG9rZW4ucmVwbGFjZSgvfjEvZywgXCIvXCIpLnJlcGxhY2UoL34wL2csIFwiflwiKTtcbn1cbi8qKiBFc2NhcGUgdG9rZW4gcGFydCBvZiBhIEpTT04gUG9pbnRlciBzdHJpbmdcblxuPiAnficgbmVlZHMgdG8gYmUgZW5jb2RlZCBhcyAnfjAnIGFuZCAnLydcbj4gbmVlZHMgdG8gYmUgZW5jb2RlZCBhcyAnfjEnIHdoZW4gdGhlc2UgY2hhcmFjdGVycyBhcHBlYXIgaW4gYVxuPiByZWZlcmVuY2UgdG9rZW4uXG5cblRoaXMgaXMgdGhlIGV4YWN0IGludmVyc2Ugb2YgYHVuZXNjYXBlKClgLCBzbyB0aGUgcmV2ZXJzZSByZXBsYWNlbWVudHMgbXVzdCB0YWtlIHBsYWNlIGluIHJldmVyc2Ugb3JkZXIuXG4qL1xuZnVuY3Rpb24gZXNjYXBlKHRva2VuKSB7XG4gICAgcmV0dXJuIHRva2VuLnJlcGxhY2UoL34vZywgXCJ+MFwiKS5yZXBsYWNlKC9cXC8vZywgXCJ+MVwiKTtcbn1cbi8qKlxuSlNPTiBQb2ludGVyIHJlcHJlc2VudGF0aW9uXG4qL1xuXG52YXIgUG9pbnRlciA9IGV4cG9ydHMuUG9pbnRlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUG9pbnRlcigpIHtcbiAgICAgICAgdmFyIHRva2VucyA9IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gW1wiXCJdIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBQb2ludGVyKTtcblxuICAgICAgICB0aGlzLnRva2VucyA9IHRva2VucztcbiAgICB9XG5cbiAgICBfY3JlYXRlQ2xhc3MoUG9pbnRlciwge1xuICAgICAgICB0b1N0cmluZzoge1xuICAgICAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRva2Vucy5tYXAoZXNjYXBlKS5qb2luKFwiL1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZXZhbHVhdGU6IHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgUmV0dXJucyBhbiBvYmplY3Qgd2l0aCAncGFyZW50JywgJ2tleScsIGFuZCAndmFsdWUnIHByb3BlcnRpZXMuXG4gICAgICAgICAgICBJbiB0aGUgc3BlY2lhbCBjYXNlIHRoYXQgcG9pbnRlciA9IFwiXCIsIHBhcmVudCBhbmQga2V5IHdpbGwgYmUgbnVsbCwgYW5kIGB2YWx1ZSA9IG9iamBcbiAgICAgICAgICAgIE90aGVyd2lzZSwgcGFyZW50IHdpbGwgYmUgdGhlIHN1Y2ggdGhhdCBgcGFyZW50W2tleV0gPT0gdmFsdWVgXG4gICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZXZhbHVhdGUob2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgdmFyIHRva2VuID0gbnVsbDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMSwgbCA9IHRoaXMudG9rZW5zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQgPSBvYmplY3Q7XG4gICAgICAgICAgICAgICAgICAgIHRva2VuID0gdGhpcy50b2tlbnNbaV07XG4gICAgICAgICAgICAgICAgICAgIC8vIG5vdCBzdXJlIGlmIHRoaXMgdGhlIGJlc3Qgd2F5IHRvIGhhbmRsZSBub24tZXhpc3RhbnQgcGF0aHMuLi5cbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0ID0gKHBhcmVudCB8fCB7fSlbdG9rZW5dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHBhcmVudCxcbiAgICAgICAgICAgICAgICAgICAga2V5OiB0b2tlbixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG9iamVjdCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBwdXNoOiB7XG4gICAgICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcHVzaCh0b2tlbikge1xuICAgICAgICAgICAgICAgIC8vIG11dGFibGVcbiAgICAgICAgICAgICAgICB0aGlzLnRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgYWRkOiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgIGB0b2tlbmAgc2hvdWxkIGJlIGEgU3RyaW5nLiBJdCdsbCBiZSBjb2VyY2VkIHRvIG9uZSBhbnl3YXkuXG4gICAgICAgICAgICAgICBpbW11dGFibGUgKHNoYWxsb3dseSlcbiAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgIHZhbHVlOiBmdW5jdGlvbiBhZGQodG9rZW4pIHtcbiAgICAgICAgICAgICAgICB2YXIgdG9rZW5zID0gdGhpcy50b2tlbnMuY29uY2F0KFN0cmluZyh0b2tlbikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnRlcih0b2tlbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBmcm9tSlNPTjoge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICBgcGF0aGAgKm11c3QqIGJlIGEgcHJvcGVybHkgZXNjYXBlZCBzdHJpbmcuXG4gICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZnJvbUpTT04ocGF0aCkge1xuICAgICAgICAgICAgICAgIHZhciB0b2tlbnMgPSBwYXRoLnNwbGl0KFwiL1wiKS5tYXAodW5lc2NhcGUpO1xuICAgICAgICAgICAgICAgIGlmICh0b2tlbnNbMF0gIT09IFwiXCIpIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgSlNPTiBQb2ludGVyOiBcIiArIHBhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnRlcih0b2tlbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gUG9pbnRlcjtcbn0pKCk7XG5cbn0se31dfSx7fSxbNF0pKDQpXG59KTsiLCJ2YXIgY2hhcnMgPSBcIjAxMjM0NTY3ODlBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hUWmFiY2RlZmdoaWtsbW5vcHFyc3R1dnd4eXpcIi5zcGxpdChcIlwiKTtcclxuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbVN0cmluZyhsZW5ndGg6IG51bWJlciA9IDgpIDogc3RyaW5nIHtcclxuICAgIC8vIHdyaXRlIGEgYmV0dGVyIGdlbmVyYXRvclxyXG4gICAgaWYgKCEgbGVuZ3RoKSB7XHJcbiAgICAgICAgbGVuZ3RoID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hhcnMubGVuZ3RoKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgc3RyID0gXCJcIjtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBzdHIgKz0gY2hhcnNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hhcnMubGVuZ3RoKV07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc3RyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXh0ZW5kPFQ+KGRzdDogVCwgLi4uc3JjczogVFtdKSA6IFQge1xyXG4gIHNyY3MuZm9yRWFjaChzcmMgPT4ge1xyXG4gICAgZm9yICh2YXIgcHJvcCBpbiBzcmMpIHtcclxuICAgICAgaWYgKHNyYy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG4gICAgICAgICg8YW55PmRzdClbcHJvcF0gPSAoPGFueT5zcmMpW3Byb3BdO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGRzdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNsb25lPFQ+KG9iajogVCkgOiBUIHtcclxuICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvYmopKTtcclxufVxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vbm9kZV9tb2R1bGVzL3JmYzY5MDIvcmZjNjkwMi5kLnRzXCIgLz5cclxuXHJcbmltcG9ydCByZmM2OTAyID0gcmVxdWlyZShcInJmYzY5MDJcIik7XHJcbmltcG9ydCBVdGlscyA9IHJlcXVpcmUoXCIuLi9jb21tb24vdXRpbHNcIik7XHJcbmltcG9ydCBNb2RlbCA9IHJlcXVpcmUoXCIuLi9jb21tb24vbW9kZWxcIik7XHJcbmltcG9ydCBWaWV3TW9kZWwgPSByZXF1aXJlKFwiLi92aWV3LW1vZGVsXCIpO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBBcHBDb25maWd1cmF0aW9uIHtcclxuICByb290Tm9kZT86IGFueTtcclxuICBzb2NrZXRFdmVudE5hbWU/OiBzdHJpbmc7XHJcbiAgdGhyb3R0bGluZ0ludGVydmFsPzogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgdmFyIGRlZmF1bHRDb25maWd1cmF0aW9uOiBBcHBDb25maWd1cmF0aW9uID0ge1xyXG4gIHJvb3ROb2RlOiBudWxsLFxyXG4gIHNvY2tldEV2ZW50TmFtZTogXCJib2FyZFwiLFxyXG4gIHRocm90dGxpbmdJbnRlcnZhbDogMTAwMFxyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0KGNvbmZpZz86IEFwcENvbmZpZ3VyYXRpb24pIHtcclxuICB2YXIgYXBwID0gbmV3IEFwcCgpO1xyXG4gIGNvbmZpZyA9IFV0aWxzLmV4dGVuZCh7IH0sIGRlZmF1bHRDb25maWd1cmF0aW9uLCBjb25maWcpO1xyXG4gIGFwcC5zdGFydChjb25maWcpO1xyXG59XHJcblxyXG5jbGFzcyBBcHAge1xyXG4gIHNoYWRvd1NlcnZlcjogTW9kZWwuQm9hcmQgPSB7IH07XHJcbiAgc2hhZG93Q2xpZW50OiBNb2RlbC5Cb2FyZCA9IHsgfTtcclxuICBib2FyZFZNID0gbmV3IFZpZXdNb2RlbC5Cb2FyZCgpO1xyXG4gIHNvY2tldDogU29ja2V0SU9DbGllbnQuU29ja2V0O1xyXG4gIHNvY2tldEV2ZW50TmFtZTogc3RyaW5nO1xyXG5cclxuICBhcHBseVNlcnZlclBhdGNoKHNlcnZlckNoYW5nZXM6IE1vZGVsLlBhdGNoKSB7XHJcbiAgICB2YXIgY3VycmVudCA9IHRoaXMuYm9hcmRWTS50b1BsYWluKCk7XHJcbiAgICB2YXIgbXlDaGFuZ2VzID0gcmZjNjkwMi5jcmVhdGVQYXRjaCh0aGlzLnNoYWRvd0NsaWVudCwgY3VycmVudCk7XHJcbiAgICAvLyBJIGFtIGNsb25uaWcgcGF0Y2ggYmVjYXVzZSB0aGUgY3JlYXRlZCBvYmplY3RzIGhhcyB0aGUgc2FtZSByZWZlcmVuY2VcclxuICAgIHJmYzY5MDIuYXBwbHlQYXRjaCh0aGlzLnNoYWRvd1NlcnZlciwgVXRpbHMuY2xvbmUoc2VydmVyQ2hhbmdlcykpO1xyXG4gICAgcmZjNjkwMi5hcHBseVBhdGNoKGN1cnJlbnQsIHNlcnZlckNoYW5nZXMpO1xyXG4gICAgcmZjNjkwMi5hcHBseVBhdGNoKGN1cnJlbnQsIG15Q2hhbmdlcyk7XHJcbiAgICB0aGlzLmJvYXJkVk0udXBkYXRlKGN1cnJlbnQpO1xyXG4gICAgdGhpcy5zaGFkb3dDbGllbnQgPSB0aGlzLmJvYXJkVk0udG9QbGFpbigpO1xyXG4gIH1cclxuXHJcbiAgb25NZXNzYWdlID0gKG1zZzogTW9kZWwuTWVzc2FnZSkgPT4ge1xyXG4gICAgdmFyIGJvYXJkID0gKDxNb2RlbC5Cb2FyZE1lc3NhZ2U+bXNnKS5ib2FyZDtcclxuICAgIHZhciBwYXRjaCA9ICg8TW9kZWwuUGF0Y2hNZXNzYWdlPm1zZykucGF0Y2g7XHJcbiAgICBpZiAoYm9hcmQpIHtcclxuICAgICAgLy8gVE9ETzogcmVmcmVzaCBhbGwgdGhlIGJvYXJkXHJcbiAgICB9IGVsc2UgaWYgKHBhdGNoKSB7XHJcbiAgICAgIHRoaXMuYXBwbHlTZXJ2ZXJQYXRjaChwYXRjaCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgb25JbnRlcnZhbD0gKCkgPT4ge1xyXG4gICAgdmFyIGN1cnJlbnQgPSB0aGlzLmJvYXJkVk0udG9QbGFpbigpO1xyXG4gICAgdmFyIG15Q2hhbmdlcyA9IHJmYzY5MDIuY3JlYXRlUGF0Y2godGhpcy5zaGFkb3dTZXJ2ZXIsIGN1cnJlbnQpO1xyXG4gICAgaWYgKG15Q2hhbmdlcy5sZW5ndGgpIHtcclxuICAgICAgLy8gVE9ETzogY29uc2lkZXIgdG8gc2VuZCBpdCB1c2luZyBIVFRQIGluIHBsYWNlIG9mIFNvY2tldFxyXG4gICAgICB0aGlzLnNvY2tldC5lbWl0KHRoaXMuc29ja2V0RXZlbnROYW1lLCB7IHBhdGNoOiBteUNoYW5nZXMgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgc3RhcnQoY29uZmlnOiBBcHBDb25maWd1cmF0aW9uKSB7XHJcbiAgICB0aGlzLnNvY2tldEV2ZW50TmFtZSA9IGNvbmZpZy5zb2NrZXRFdmVudE5hbWU7XHJcbiAgICB0aGlzLmJvYXJkVk0udXBkYXRlKHRoaXMuc2hhZG93U2VydmVyKTtcclxuICAgIHRoaXMuYm9hcmRWTS5hcHBseUJpbmRpbmdzKGNvbmZpZy5yb290Tm9kZSk7XHJcbiAgICB0aGlzLnNoYWRvd0NsaWVudCA9IHRoaXMuYm9hcmRWTS50b1BsYWluKCk7XHJcbiAgICB0aGlzLnNvY2tldCA9IGlvKCk7XHJcblxyXG4gICAgdGhpcy5zb2NrZXQub24odGhpcy5zb2NrZXRFdmVudE5hbWUsIHRoaXMub25NZXNzYWdlKTtcclxuICAgIHNldEludGVydmFsKHRoaXMub25JbnRlcnZhbCwgY29uZmlnLnRocm90dGxpbmdJbnRlcnZhbCk7XHJcbiAgfVxyXG59XHJcbiIsImV4cG9ydCBmdW5jdGlvbiByZWdpc3RlcigpIHtcclxuICB2YXIgX2RyYWdnZWQ6IGFueTtcclxuICB2YXIgX3hGaXg6IG51bWJlcjtcclxuICB2YXIgX3lGaXg6IG51bWJlcjtcclxuXHJcbiAga28uYmluZGluZ0hhbmRsZXJzW1wiZHJhZ1wiXSA9IHtcclxuICAgIGluaXQ6IChlbGVtZW50OiBIVE1MRWxlbWVudCwgdmFsdWVBY2Nlc3NvcjogKCkgPT4gYW55LCBhbGxCaW5kaW5nc0FjY2Vzc29yOiBhbnksIHZpZXdNb2RlbDogYW55KSA9PiB7XHJcbiAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiZHJhZ2dhYmxlXCIsIFwidHJ1ZVwiKTtcclxuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIGUgPT4ge1xyXG4gICAgICAgIGUuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJkYXRhXCIsIFwiZGF0YVwiKTsgLy8gcmVxdWlyZWQgdG8gZHJhZ1xyXG4gICAgICAgIF94Rml4ID0gZS5jbGllbnRYIC0gdmlld01vZGVsLnBvc1goKTtcclxuICAgICAgICBfeUZpeCA9IGUuY2xpZW50WSAtIHZpZXdNb2RlbC5wb3NZKCk7XHJcbiAgICAgICAgX2RyYWdnZWQgPSB2aWV3TW9kZWw7XHJcbiAgICAgIH0sIGZhbHNlKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBrby5iaW5kaW5nSGFuZGxlcnNbXCJkcm9wXCJdID0ge1xyXG4gICAgaW5pdDogKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCB2YWx1ZUFjY2Vzc29yOiAoKSA9PiBhbnksIGFsbEJpbmRpbmdzQWNjZXNzb3I6IGFueSwgdmlld01vZGVsOiBhbnkpID0+IHtcclxuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ292ZXJcIiwgZSA9PiB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOyAvLyBhbGxvd3MgdXMgdG8gZHJvcFxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIGUgPT4ge1xyXG4gICAgICAgIF9kcmFnZ2VkLnBvc1goZS5jbGllbnRYIC0gX3hGaXgpO1xyXG4gICAgICAgIF9kcmFnZ2VkLnBvc1koZS5jbGllbnRZIC0gX3lGaXgpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxufVxyXG4iLCJleHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXIoKSB7XG4gIGtvLmJpbmRpbmdIYW5kbGVyc1tcImplZGl0YWJsZVwiXSA9IHtcbiAgICBpbml0OiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yLCBhbGxCaW5kaW5nc0FjY2Vzc29yKSB7XG4gICAgICAvLyBnZXQgdGhlIG9wdGlvbnMgdGhhdCB3ZXJlIHBhc3NlZCBpblxuICAgICAgdmFyIG9wdGlvbnMgPSBhbGxCaW5kaW5nc0FjY2Vzc29yKCkuamVkaXRhYmxlT3B0aW9ucyB8fCB7fTtcblxuICAgICAgLy8gXCJzdWJtaXRcIiBzaG91bGQgYmUgdGhlIGRlZmF1bHQgb25ibHVyIGFjdGlvbiBsaWtlIHJlZ3VsYXIga28gY29udHJvbHNcbiAgICAgIGlmICghb3B0aW9ucy5vbmJsdXIpIHtcbiAgICAgICAgb3B0aW9ucy5vbmJsdXIgPSBcInN1Ym1pdFwiO1xuICAgICAgfVxuXG4gICAgICAvLyBzZXQgdGhlIHZhbHVlIG9uIHN1Ym1pdCBhbmQgcGFzcyB0aGUgZWRpdGFibGUgdGhlIG9wdGlvbnNcbiAgICAgICQoZWxlbWVudCkuZWRpdGFibGUoZnVuY3Rpb24odmFsdWUsIHBhcmFtcykge1xuICAgICAgICB2YWx1ZUFjY2Vzc29yKCkodmFsdWUpO1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9LCBvcHRpb25zKTtcblxuICAgICAgLy9oYW5kbGUgZGlzcG9zYWwgKGlmIEtPIHJlbW92ZXMgYnkgdGhlIHRlbXBsYXRlIGJpbmRpbmcpXG4gICAgICBrby51dGlscy5kb21Ob2RlRGlzcG9zYWwuYWRkRGlzcG9zZUNhbGxiYWNrKGVsZW1lbnQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkKGVsZW1lbnQpLmVkaXRhYmxlKFwiZGVzdHJveVwiKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvL3VwZGF0ZSB0aGUgY29udHJvbCB3aGVuIHRoZSB2aWV3IG1vZGVsIGNoYW5nZXNcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IpIHtcbiAgICAgIHZhciB2YWx1ZSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUodmFsdWVBY2Nlc3NvcigpKTtcbiAgICAgICQoZWxlbWVudCkuaHRtbCh2YWx1ZSk7XG4gICAgfVxuICB9O1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL3R5cGluZ3MvanF1ZXJ5L2pxdWVyeS5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL3R5cGluZ3Mva25vY2tvdXQva25vY2tvdXQuZC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi90eXBpbmdzL3NvY2tldC5pby1jbGllbnQvc29ja2V0LmlvLWNsaWVudC5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2N1c3RvbS10eXBpbmdzL2RlZmF1bHRzLmQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vY3VzdG9tLXR5cGluZ3MvanF1ZXJ5LWplZGl0YWJsZS5kLnRzXCIgLz5cclxuXHJcbmltcG9ydCBEcmFnTkRyb3AgPSByZXF1aXJlKFwiLi9rb2JpbmRpbmdzL2RyYWduZHJvcFwiKTtcclxuRHJhZ05Ecm9wLnJlZ2lzdGVyKCk7XHJcblxyXG5pbXBvcnQgSkVkaXRhYmxlID0gcmVxdWlyZShcIi4va29iaW5kaW5ncy9qZWRpdGFibGVcIik7XHJcbkpFZGl0YWJsZS5yZWdpc3RlcigpO1xyXG5cclxuaW1wb3J0IEFwcCA9IHJlcXVpcmUoXCIuL2FwcFwiKTtcclxuQXBwLnN0YXJ0KCk7XHJcbiIsImltcG9ydCBVdGlscyA9IHJlcXVpcmUoXCIuLi9jb21tb24vdXRpbHNcIik7XHJcbmltcG9ydCBNb2RlbCA9IHJlcXVpcmUoXCIuLi9jb21tb24vbW9kZWxcIik7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIE5vdGVTdHlsZSB7XHJcbiAgdG9wOiBzdHJpbmc7XHJcbiAgbGVmdDogc3RyaW5nO1xyXG4gIGRpc3BsYXk6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE5vdGUge1xyXG4gIGlkOiBzdHJpbmc7XHJcblxyXG4gIHRpdGxlID0ga28ub2JzZXJ2YWJsZTxzdHJpbmc+KCk7XHJcbiAgY29udGVudCA9IGtvLm9ic2VydmFibGU8c3RyaW5nPigpO1xyXG4gIHBvc1ggPSBrby5vYnNlcnZhYmxlPG51bWJlcj4oMCk7XHJcbiAgcG9zWSA9IGtvLm9ic2VydmFibGU8bnVtYmVyPigwKTtcclxuXHJcbiAgc3R5bGUgPSBrby5jb21wdXRlZDxOb3RlU3R5bGU+KCgpID0+IHtcclxuICAgIHZhciBwb3NYID0gdGhpcy5wb3NYKCk7XHJcbiAgICB2YXIgcG9zWSA9IHRoaXMucG9zWSgpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdG9wOiBwb3NZID8gYCR7cG9zWX1weGAgOiBcIjBcIixcclxuICAgICAgbGVmdDogcG9zWCA/IGAke3Bvc1h9cHhgIDogXCIwXCIsXHJcbiAgICAgIGRpc3BsYXk6IHBvc1ggIT0gbnVsbCAmJiBwb3NZICE9IG51bGwgID8gXCJibG9ja1wiIDogXCJub25lXCJcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG5cclxuICB1cGRhdGUocGxhaW46IE1vZGVsLk5vdGUpIHtcclxuICAgIHRoaXMudGl0bGUocGxhaW4udGl0bGUpO1xyXG4gICAgdGhpcy5jb250ZW50KHBsYWluLmNvbnRlbnQpO1xyXG4gICAgdGhpcy5wb3NYKHBsYWluLnBvc1gpO1xyXG4gICAgdGhpcy5wb3NZKHBsYWluLnBvc1kpO1xyXG5cclxuICB9XHJcblxyXG4gIHRvUGxhaW4oKTogTW9kZWwuTm90ZSB7XHJcbiAgICB2YXIgcmVzdWx0ID0geyB9O1xyXG4gICAgQWRkVHJ1dGh5VmFsdWUocmVzdWx0LCBcInRpdGxlXCIsIHRoaXMudGl0bGUoKSk7XHJcbiAgICBBZGRUcnV0aHlWYWx1ZShyZXN1bHQsIFwiY29udGVudFwiLCB0aGlzLmNvbnRlbnQoKSk7XHJcbiAgICBBZGROdW1iZXJWYWx1ZShyZXN1bHQsIFwicG9zWFwiLCB0aGlzLnBvc1goKSk7XHJcbiAgICBBZGROdW1iZXJWYWx1ZShyZXN1bHQsIFwicG9zWVwiLCB0aGlzLnBvc1koKSk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gQWRkVHJ1dGh5VmFsdWUoZGVzdGluYXRpb246IGFueSwga2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcclxuICBpZiAodmFsdWUpIHtcclxuICAgIGRlc3RpbmF0aW9uW2tleV0gPSB2YWx1ZTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIEFkZE51bWJlclZhbHVlKGRlc3RpbmF0aW9uOiBhbnksIGtleTogc3RyaW5nLCB2YWx1ZTogbnVtYmVyKSB7XHJcbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gXCJbb2JqZWN0IE51bWJlcl1cIikge1xyXG4gICAgZGVzdGluYXRpb25ba2V5XSA9IHZhbHVlO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEJvYXJkIHtcclxuICBuYW1lID0ga28ub2JzZXJ2YWJsZTxzdHJpbmc+KCk7XHJcbiAgY29sb3IgPSBrby5vYnNlcnZhYmxlPHN0cmluZz4oKTtcclxuICBub3RlcyA9IGtvLm9ic2VydmFibGVBcnJheTxOb3RlPihbXSk7XHJcblxyXG4gIC8vIFRPRE86IGNvbnNpZGVyIHRvIHJlbW92ZSB0aGlzIGluZGV4XHJcbiAgcHJpdmF0ZSBub3Rlc0J5SWQ6IERpY3Rpb25hcnk8Tm90ZT4gPSB7fTtcclxuXHJcbiAgbmV3Tm90ZSA9ICgpID0+IHtcclxuICAgIHZhciBub3RlID0gdGhpcy5jcmVhdGVOb3RlKCk7XHJcbiAgICBub3RlLnBvc1goMCk7XHJcbiAgICBub3RlLnBvc1koMCk7XHJcbiAgICByZXR1cm4gbm90ZTtcclxuICB9O1xyXG5cclxuICBjcmVhdGVOb3RlKGlkOiBzdHJpbmcgPSBudWxsKSA6IE5vdGUge1xyXG4gICAgaWQgPSBpZCB8fCBVdGlscy5yYW5kb21TdHJpbmcoKTtcclxuICAgIHZhciBub3RlID0gbmV3IE5vdGUoKTtcclxuICAgIG5vdGUuaWQgPSBpZDtcclxuICAgIG5vdGUudGl0bGUoIFwiVGl0bGUgaGVyZVwiICk7XHJcbiAgICBub3RlLmNvbnRlbnQoXCJDb250ZW50IGhlcmVcIik7XHJcbiAgICB0aGlzLm5vdGVzQnlJZFtpZF0gPSBub3RlO1xyXG4gICAgdGhpcy5ub3Rlcy5wdXNoKG5vdGUpO1xyXG4gICAgcmV0dXJuIG5vdGU7XHJcbiAgfVxyXG5cclxuICBkZWxldGVOb3RlKGlkOiBzdHJpbmcpIHtcclxuICAgIHZhciBub3RlID0gdGhpcy5ub3Rlc0J5SWRbaWRdO1xyXG4gICAgZGVsZXRlIHRoaXMubm90ZXNCeUlkW2lkXTtcclxuICAgIHRoaXMubm90ZXMucmVtb3ZlKG5vdGUpO1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlKHBsYWluOiBNb2RlbC5Cb2FyZCkge1xyXG4gICAgdGhpcy5uYW1lKHBsYWluLm5hbWUpO1xyXG4gICAgdGhpcy5jb2xvcihwbGFpbi5jb2xvcik7XHJcblxyXG4gICAgLy8gVE9ETzogdXBkYXRlIG9ic2VydmVibGUgYXJyYXkgb25seSBhIHRpbWVcclxuXHJcbiAgICB2YXIgbm90ZXMgPSBwbGFpbi5ub3RlcyB8fCB7fTtcclxuICAgIGZvciAodmFyIGlkIGluIG5vdGVzKSB7XHJcbiAgICAgIHZhciBub3RlVk0gPSB0aGlzLm5vdGVzQnlJZFtpZF07XHJcbiAgICAgIGlmICghbm90ZVZNKSB7XHJcbiAgICAgICAgbm90ZVZNID0gdGhpcy5jcmVhdGVOb3RlKGlkKTtcclxuICAgICAgfVxyXG4gICAgICBub3RlVk0udXBkYXRlKG5vdGVzW2lkXSk7XHJcbiAgICB9XHJcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLm5vdGVzQnlJZCkge1xyXG4gICAgICBpZiAoIW5vdGVzW2lkXSkge1xyXG4gICAgICAgIHRoaXMuZGVsZXRlTm90ZShpZCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHRvUGxhaW4oKTogTW9kZWwuQm9hcmQge1xyXG4gICAgdmFyIHJlc3VsdCA9IDxNb2RlbC5Cb2FyZD57IH07XHJcbiAgICBBZGRUcnV0aHlWYWx1ZShyZXN1bHQsIFwibmFtZVwiLCB0aGlzLm5hbWUoKSk7XHJcbiAgICBBZGRUcnV0aHlWYWx1ZShyZXN1bHQsIFwiY29sb3JcIiwgdGhpcy5jb2xvcigpKTtcclxuICAgIHZhciBub3RlVk1zID0gdGhpcy5ub3RlcygpO1xyXG4gICAgaWYgKG5vdGVWTXMubGVuZ3RoKSB7XHJcbiAgICAgIHZhciBub3RlcyA9IDxEaWN0aW9uYXJ5PE1vZGVsLk5vdGU+Pnt9O1xyXG4gICAgICBmb3IgKHZhciBpIGluIG5vdGVWTXMpIHtcclxuICAgICAgICB2YXIgbm90ZVZNID0gbm90ZVZNc1tpXTtcclxuICAgICAgICBub3Rlc1tub3RlVk0uaWRdID0gbm90ZVZNLnRvUGxhaW4oKTtcclxuICAgICAgfVxyXG4gICAgICByZXN1bHQubm90ZXMgPSBub3RlcztcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICBhcHBseUJpbmRpbmdzKHJvb3ROb2RlPzogYW55KSB7XHJcbiAgICBrby5hcHBseUJpbmRpbmdzKHRoaXMsIHJvb3ROb2RlKTtcclxuICB9XHJcbn1cclxuIl19
