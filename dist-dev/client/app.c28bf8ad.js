// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"../../node_modules/hyperapp/src/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.h = h;
exports.app = app;
function h(name, attributes) {
  var rest = [];
  var children = [];
  var length = arguments.length;

  while (length-- > 2) rest.push(arguments[length]);

  while (rest.length) {
    var node = rest.pop();
    if (node && node.pop) {
      for (length = node.length; length--;) {
        rest.push(node[length]);
      }
    } else if (node != null && node !== true && node !== false) {
      children.push(node);
    }
  }

  return typeof name === "function" ? name(attributes || {}, children) : {
    nodeName: name,
    attributes: attributes || {},
    children: children,
    key: attributes && attributes.key
  };
}

function app(state, actions, view, container) {
  var map = [].map;
  var rootElement = container && container.children[0] || null;
  var oldNode = rootElement && recycleElement(rootElement);
  var lifecycle = [];
  var skipRender;
  var isRecycling = true;
  var globalState = clone(state);
  var wiredActions = wireStateToActions([], globalState, clone(actions));

  scheduleRender();

  return wiredActions;

  function recycleElement(element) {
    return {
      nodeName: element.nodeName.toLowerCase(),
      attributes: {},
      children: map.call(element.childNodes, function (element) {
        return element.nodeType === 3 // Node.TEXT_NODE
        ? element.nodeValue : recycleElement(element);
      })
    };
  }

  function resolveNode(node) {
    return typeof node === "function" ? resolveNode(node(globalState, wiredActions)) : node != null ? node : "";
  }

  function render() {
    skipRender = !skipRender;

    var node = resolveNode(view);

    if (container && !skipRender) {
      rootElement = patch(container, rootElement, oldNode, oldNode = node);
    }

    isRecycling = false;

    while (lifecycle.length) lifecycle.pop()();
  }

  function scheduleRender() {
    if (!skipRender) {
      skipRender = true;
      setTimeout(render);
    }
  }

  function clone(target, source) {
    var out = {};

    for (var i in target) out[i] = target[i];
    for (var i in source) out[i] = source[i];

    return out;
  }

  function setPartialState(path, value, source) {
    var target = {};
    if (path.length) {
      target[path[0]] = path.length > 1 ? setPartialState(path.slice(1), value, source[path[0]]) : value;
      return clone(source, target);
    }
    return value;
  }

  function getPartialState(path, source) {
    var i = 0;
    while (i < path.length) {
      source = source[path[i++]];
    }
    return source;
  }

  function wireStateToActions(path, state, actions) {
    for (var key in actions) {
      typeof actions[key] === "function" ? function (key, action) {
        actions[key] = function (data) {
          var result = action(data);

          if (typeof result === "function") {
            result = result(getPartialState(path, globalState), actions);
          }

          if (result && result !== (state = getPartialState(path, globalState)) && !result.then // !isPromise
          ) {
              scheduleRender(globalState = setPartialState(path, clone(state, result), globalState));
            }

          return result;
        };
      }(key, actions[key]) : wireStateToActions(path.concat(key), state[key] = clone(state[key]), actions[key] = clone(actions[key]));
    }

    return actions;
  }

  function getKey(node) {
    return node ? node.key : null;
  }

  function eventListener(event) {
    return event.currentTarget.events[event.type](event);
  }

  function updateAttribute(element, name, value, oldValue, isSvg) {
    if (name === "key") {} else if (name === "style") {
      if (typeof value === "string") {
        element.style.cssText = value;
      } else {
        if (typeof oldValue === "string") oldValue = element.style.cssText = "";
        for (var i in clone(oldValue, value)) {
          var style = value == null || value[i] == null ? "" : value[i];
          if (i[0] === "-") {
            element.style.setProperty(i, style);
          } else {
            element.style[i] = style;
          }
        }
      }
    } else {
      if (name[0] === "o" && name[1] === "n") {
        name = name.slice(2);

        if (element.events) {
          if (!oldValue) oldValue = element.events[name];
        } else {
          element.events = {};
        }

        element.events[name] = value;

        if (value) {
          if (!oldValue) {
            element.addEventListener(name, eventListener);
          }
        } else {
          element.removeEventListener(name, eventListener);
        }
      } else if (name in element && name !== "list" && name !== "type" && name !== "draggable" && name !== "spellcheck" && name !== "translate" && !isSvg) {
        element[name] = value == null ? "" : value;
      } else if (value != null && value !== false) {
        element.setAttribute(name, value);
      }

      if (value == null || value === false) {
        element.removeAttribute(name);
      }
    }
  }

  function createElement(node, isSvg) {
    var element = typeof node === "string" || typeof node === "number" ? document.createTextNode(node) : (isSvg = isSvg || node.nodeName === "svg") ? document.createElementNS("http://www.w3.org/2000/svg", node.nodeName) : document.createElement(node.nodeName);

    var attributes = node.attributes;
    if (attributes) {
      if (attributes.oncreate) {
        lifecycle.push(function () {
          attributes.oncreate(element);
        });
      }

      for (var i = 0; i < node.children.length; i++) {
        element.appendChild(createElement(node.children[i] = resolveNode(node.children[i]), isSvg));
      }

      for (var name in attributes) {
        updateAttribute(element, name, attributes[name], null, isSvg);
      }
    }

    return element;
  }

  function updateElement(element, oldAttributes, attributes, isSvg) {
    for (var name in clone(oldAttributes, attributes)) {
      if (attributes[name] !== (name === "value" || name === "checked" ? element[name] : oldAttributes[name])) {
        updateAttribute(element, name, attributes[name], oldAttributes[name], isSvg);
      }
    }

    var cb = isRecycling ? attributes.oncreate : attributes.onupdate;
    if (cb) {
      lifecycle.push(function () {
        cb(element, oldAttributes);
      });
    }
  }

  function removeChildren(element, node) {
    var attributes = node.attributes;
    if (attributes) {
      for (var i = 0; i < node.children.length; i++) {
        removeChildren(element.childNodes[i], node.children[i]);
      }

      if (attributes.ondestroy) {
        attributes.ondestroy(element);
      }
    }
    return element;
  }

  function removeElement(parent, element, node) {
    function done() {
      parent.removeChild(removeChildren(element, node));
    }

    var cb = node.attributes && node.attributes.onremove;
    if (cb) {
      cb(element, done);
    } else {
      done();
    }
  }

  function patch(parent, element, oldNode, node, isSvg) {
    if (node === oldNode) {} else if (oldNode == null || oldNode.nodeName !== node.nodeName) {
      var newElement = createElement(node, isSvg);
      parent.insertBefore(newElement, element);

      if (oldNode != null) {
        removeElement(parent, element, oldNode);
      }

      element = newElement;
    } else if (oldNode.nodeName == null) {
      element.nodeValue = node;
    } else {
      updateElement(element, oldNode.attributes, node.attributes, isSvg = isSvg || node.nodeName === "svg");

      var oldKeyed = {};
      var newKeyed = {};
      var oldElements = [];
      var oldChildren = oldNode.children;
      var children = node.children;

      for (var i = 0; i < oldChildren.length; i++) {
        oldElements[i] = element.childNodes[i];

        var oldKey = getKey(oldChildren[i]);
        if (oldKey != null) {
          oldKeyed[oldKey] = [oldElements[i], oldChildren[i]];
        }
      }

      var i = 0;
      var k = 0;

      while (k < children.length) {
        var oldKey = getKey(oldChildren[i]);
        var newKey = getKey(children[k] = resolveNode(children[k]));

        if (newKeyed[oldKey]) {
          i++;
          continue;
        }

        if (newKey != null && newKey === getKey(oldChildren[i + 1])) {
          if (oldKey == null) {
            removeElement(element, oldElements[i], oldChildren[i]);
          }
          i++;
          continue;
        }

        if (newKey == null || isRecycling) {
          if (oldKey == null) {
            patch(element, oldElements[i], oldChildren[i], children[k], isSvg);
            k++;
          }
          i++;
        } else {
          var keyedNode = oldKeyed[newKey] || [];

          if (oldKey === newKey) {
            patch(element, keyedNode[0], keyedNode[1], children[k], isSvg);
            i++;
          } else if (keyedNode[0]) {
            patch(element, element.insertBefore(keyedNode[0], oldElements[i]), keyedNode[1], children[k], isSvg);
          } else {
            patch(element, oldElements[i], null, children[k], isSvg);
          }

          newKeyed[newKey] = children[k];
          k++;
        }
      }

      while (i < oldChildren.length) {
        if (getKey(oldChildren[i]) == null) {
          removeElement(element, oldElements[i], oldChildren[i]);
        }
        i++;
      }

      for (var i in oldKeyed) {
        if (!newKeyed[i]) {
          removeElement(element, oldKeyed[i][0], oldKeyed[i][1]);
        }
      }
    }
    return element;
  }
}
},{}],"state.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class State {
    constructor() {
        this.config = {};
        this.boards = [];
        this.sprints = [];
        this.sprintDetails = undefined;
    }
}
exports.State = State;
},{}],"../../node_modules/cross-fetch/dist/browser-ponyfill.js":[function(require,module,exports) {
var __root__ = (function (root) {
function F() { this.fetch = false; }
F.prototype = root;
return new F();
})(typeof self !== 'undefined' ? self : this);
(function(self) {

(function(self) {

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob();
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ];

    var isDataView = function(obj) {
      return obj && DataView.prototype.isPrototypeOf(obj)
    };

    var isArrayBufferView = ArrayBuffer.isView || function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift();
        return {done: value === undefined, value: value}
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      };
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1]);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue+','+value : value;
  };

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function(name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null
  };

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  };

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  };

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  Headers.prototype.keys = function() {
    var items = [];
    this.forEach(function(value, name) { items.push(name); });
    return iteratorFor(items)
  };

  Headers.prototype.values = function() {
    var items = [];
    this.forEach(function(value) { items.push(value); });
    return iteratorFor(items)
  };

  Headers.prototype.entries = function() {
    var items = [];
    this.forEach(function(value, name) { items.push([name, value]); });
    return iteratorFor(items)
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function() {
        reject(reader.error);
      };
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsArrayBuffer(blob);
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsText(blob);
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength);
      view.set(new Uint8Array(buf));
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function(body) {
      this._bodyInit = body;
      if (!body) {
        this._bodyText = '';
      } else if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer);
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer]);
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body);
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this);
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      };

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      };
    }

    this.text = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    };

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      };
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    };

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'omit';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body);
  }

  Request.prototype.clone = function() {
    return new Request(this, { body: this._bodyInit })
  };

  function decode(body) {
    var form = new FormData();
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=');
        var name = split.shift().replace(/\+/g, ' ');
        var value = split.join('=').replace(/\+/g, ' ');
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
    return headers
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status === undefined ? 200 : options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  };

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''});
    response.type = 'error';
    return response
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  };

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init);
      var xhr = new XMLHttpRequest();

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value);
      });

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    })
  };
  self.fetch.polyfill = true;
})(typeof self !== 'undefined' ? self : this);
}).call(__root__, void(0));
var fetch = __root__.fetch;
var Response = fetch.Response = __root__.Response;
var Request = fetch.Request = __root__.Request;
var Headers = fetch.Headers = __root__.Headers;
if (typeof module === 'object' && module.exports) {
module.exports = fetch;
}

},{}],"../common/utils.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.getNumberFromLocalStorage = name => {
    const value = window.localStorage.getItem(name);
    if (value) return parseInt(value);else return undefined;
};
exports.readableTime = date => {
    const dateObj = new Date(date);
    return dateObj.toLocaleString('pl-PL', { hour12: false });
};
exports.readableDuration = seconds => {
    if (seconds == 0) return "0m";
    const days = Math.floor(seconds / 28800);
    const hours = Math.floor(seconds % 28800 / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const str = `${days != 0 ? days + 'd ' : ''}${hours != 0 ? hours + 'h ' : ''}${minutes != 0 ? minutes + 'm ' : ''}`;
    return str.trim();
};
exports.numberOr = (valueToCheck, alternative) => {
    if (Number.isInteger(valueToCheck)) return valueToCheck;else return alternative;
};
exports.ifElse = (expr, t, f) => expr ? t() : f();
exports.orElse = (optional, elseF) => {
    if (optional) return optional;else return elseF();
};
exports.zip = (arrayA, arrayB) => {
    return arrayA.map((element, index) => [element, arrayB[index]]);
};
exports.flatMap = (array, callback) => {
    return array.reduce((result, item) => {
        return result.concat(callback(item));
    }, []);
};
},{}],"actions.ts":[function(require,module,exports) {
"use strict";

var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = this && this.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const utils_1 = require("../common/utils");
// TODO: Move it to Actions class after migration to Hyperapp 2
let serverURL = "";
class Actions {
    constructor() {
        this.fetch = resourcePath => __awaiter(this, void 0, void 0, function* () {
            const response = yield cross_fetch_1.default(`${serverURL}${resourcePath}`);
            const json = yield response.json();
            return json;
        });
        // TODO: This is only used to set server URL in tests. Should be constructor param in Hyperapp 2.
        this.setServerURL = url => {
            serverURL = url;
        };
        // TODO: Only used in tests. Should not be needed in Hyperapp 2.
        this.getState = () => (state, actions) => {
            return state;
        };
        this.init = () => (state, actions) => __awaiter(this, void 0, void 0, function* () {
            console.log("Initialize application...");
            yield actions.fetchConfig();
            yield actions.fetchBoards();
            yield actions.fetchSprints();
            yield actions.fetchSprintDetails();
        });
        this.fetchConfig = () => (state, actions) => __awaiter(this, void 0, void 0, function* () {
            console.log("Fetching config...");
            const config = yield this.fetch('/config');
            actions.updateConfig(config);
        });
        this.updateConfig = config => state => {
            console.log("Config updated.");
            return { config: config };
        };
        this.fetchBoards = () => (state, actions) => __awaiter(this, void 0, void 0, function* () {
            console.log("Fetching boards...");
            const boards = yield this.fetch('/boards');
            actions.updateBoards(boards);
            actions.updateSelectedBoard(undefined);
        });
        this.updateBoards = boards => state => {
            console.log("Boards updated.");
            return { boards: boards };
        };
        this.updateSelectedBoard = boardId => state => {
            const id = boardId ? boardId : utils_1.getNumberFromLocalStorage("selectedBoardId");
            const foundBoard = state.boards.find(board => board.id === id);
            const board = foundBoard ? foundBoard : state.boards[0];
            const targetId = board ? board.id : undefined;
            console.log(`Selected board updated to ${targetId}`);
            window.localStorage.setItem("selectedBoardId", String(targetId));
            return { selectedBoardId: targetId };
        };
        this.changeBoard = boardId => (state, actions) => __awaiter(this, void 0, void 0, function* () {
            console.log(`Changing board to ${boardId} ...`);
            if (boardId == state.selectedBoardId) return;
            actions.updateSelectedBoard(boardId);
            yield actions.fetchSprints();
            yield actions.fetchSprintDetails();
        });
        this.fetchSprints = () => (state, actions) => __awaiter(this, void 0, void 0, function* () {
            console.log("Fetching sprints...");
            const sprints = yield this.fetch(`/boards/${state.selectedBoardId}/sprints`);
            actions.updateSprints(sprints);
            actions.updateSelectedSprint(undefined);
        });
        this.updateSprints = sprints => state => {
            console.log("Sprints updated.");
            return { sprints: sprints };
        };
        this.updateSelectedSprint = sprintId => state => {
            const id = sprintId ? sprintId : utils_1.getNumberFromLocalStorage("selectedSprintId");
            const foundSprint = state.sprints.find(sprint => sprint.id === id);
            const sprint = foundSprint ? foundSprint : state.sprints[0];
            const targetId = sprint ? sprint.id : undefined;
            console.log(`Selected sprint updated to ${targetId}`);
            window.localStorage.setItem("selectedSprintId", String(targetId));
            return { selectedSprintId: targetId };
        };
        this.changeSprint = sprintId => (state, actions) => __awaiter(this, void 0, void 0, function* () {
            console.log(`Changing sprint to ${sprintId} ...`);
            if (sprintId == state.selectedSprintId) return;
            actions.updateSelectedSprint(sprintId);
            yield actions.fetchSprintDetails();
        });
        this.fetchSprintDetails = () => (state, actions) => __awaiter(this, void 0, void 0, function* () {
            if (state.selectedBoardId && state.selectedSprintId) {
                console.log("Fetching sprint details...");
                const sprintDetails = yield this.fetch(`/boards/${state.selectedBoardId}/sprints/${state.selectedSprintId}`);
                actions.updateSprintDetails(sprintDetails);
            }
        });
        this.updateSprintDetails = sprintDetails => state => {
            console.log("Sprint updated.");
            return { sprintDetails: sprintDetails };
        };
    }
}
exports.Actions = Actions;
},{"cross-fetch":"../../node_modules/cross-fetch/dist/browser-ponyfill.js","../common/utils":"../common/utils.ts"}],"../../node_modules/@hyperapp/html/dist/html.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.a = a;
exports.abbr = abbr;
exports.address = address;
exports.area = area;
exports.article = article;
exports.aside = aside;
exports.audio = audio;
exports.b = b;
exports.bdi = bdi;
exports.bdo = bdo;
exports.blockquote = blockquote;
exports.br = br;
exports.button = button;
exports.canvas = canvas;
exports.caption = caption;
exports.cite = cite;
exports.code = code;
exports.col = col;
exports.colgroup = colgroup;
exports.data = data;
exports.datalist = datalist;
exports.dd = dd;
exports.del = del;
exports.details = details;
exports.dfn = dfn;
exports.dialog = dialog;
exports.div = div;
exports.dl = dl;
exports.dt = dt;
exports.em = em;
exports.embed = embed;
exports.fieldset = fieldset;
exports.figcaption = figcaption;
exports.figure = figure;
exports.footer = footer;
exports.form = form;
exports.h1 = h1;
exports.h2 = h2;
exports.h3 = h3;
exports.h4 = h4;
exports.h5 = h5;
exports.h6 = h6;
exports.header = header;
exports.hr = hr;
exports.i = i;
exports.iframe = iframe;
exports.img = img;
exports.input = input;
exports.ins = ins;
exports.kbd = kbd;
exports.label = label;
exports.legend = legend;
exports.li = li;
exports.main = main;
exports.map = map;
exports.mark = mark;
exports.menu = menu;
exports.menuitem = menuitem;
exports.meter = meter;
exports.nav = nav;
exports.object = object;
exports.ol = ol;
exports.optgroup = optgroup;
exports.option = option;
exports.output = output;
exports.p = p;
exports.param = param;
exports.pre = pre;
exports.progress = progress;
exports.q = q;
exports.rp = rp;
exports.rt = rt;
exports.rtc = rtc;
exports.ruby = ruby;
exports.s = s;
exports.samp = samp;
exports.section = section;
exports.select = select;
exports.small = small;
exports.source = source;
exports.span = span;
exports.strong = strong;
exports.sub = sub;
exports.summary = summary;
exports.sup = sup;
exports.svg = svg;
exports.table = table;
exports.tbody = tbody;
exports.td = td;
exports.textarea = textarea;
exports.tfoot = tfoot;
exports.th = th;
exports.thead = thead;
exports.time = time;
exports.tr = tr;
exports.track = track;
exports.u = u;
exports.ul = ul;
exports.video = video;
exports.wbr = wbr;

var _hyperapp = require("hyperapp");

function vnode(name) {
  return function (attributes, children) {
    return typeof attributes === "object" && !Array.isArray(attributes) ? (0, _hyperapp.h)(name, attributes, children) : (0, _hyperapp.h)(name, {}, attributes);
  };
}

function a(attributes, children) {
  return vnode("a")(attributes, children);
}

function abbr(attributes, children) {
  return vnode("abbr")(attributes, children);
}

function address(attributes, children) {
  return vnode("address")(attributes, children);
}

function area(attributes, children) {
  return vnode("area")(attributes, children);
}

function article(attributes, children) {
  return vnode("article")(attributes, children);
}

function aside(attributes, children) {
  return vnode("aside")(attributes, children);
}

function audio(attributes, children) {
  return vnode("audio")(attributes, children);
}

function b(attributes, children) {
  return vnode("b")(attributes, children);
}

function bdi(attributes, children) {
  return vnode("bdi")(attributes, children);
}

function bdo(attributes, children) {
  return vnode("bdo")(attributes, children);
}

function blockquote(attributes, children) {
  return vnode("blockquote")(attributes, children);
}

function br(attributes, children) {
  return vnode("br")(attributes, children);
}

function button(attributes, children) {
  return vnode("button")(attributes, children);
}

function canvas(attributes, children) {
  return vnode("canvas")(attributes, children);
}

function caption(attributes, children) {
  return vnode("caption")(attributes, children);
}

function cite(attributes, children) {
  return vnode("cite")(attributes, children);
}

function code(attributes, children) {
  return vnode("code")(attributes, children);
}

function col(attributes, children) {
  return vnode("col")(attributes, children);
}

function colgroup(attributes, children) {
  return vnode("colgroup")(attributes, children);
}

function data(attributes, children) {
  return vnode("data")(attributes, children);
}

function datalist(attributes, children) {
  return vnode("datalist")(attributes, children);
}

function dd(attributes, children) {
  return vnode("dd")(attributes, children);
}

function del(attributes, children) {
  return vnode("del")(attributes, children);
}

function details(attributes, children) {
  return vnode("details")(attributes, children);
}

function dfn(attributes, children) {
  return vnode("dfn")(attributes, children);
}

function dialog(attributes, children) {
  return vnode("dialog")(attributes, children);
}

function div(attributes, children) {
  return vnode("div")(attributes, children);
}

function dl(attributes, children) {
  return vnode("dl")(attributes, children);
}

function dt(attributes, children) {
  return vnode("dt")(attributes, children);
}

function em(attributes, children) {
  return vnode("em")(attributes, children);
}

function embed(attributes, children) {
  return vnode("embed")(attributes, children);
}

function fieldset(attributes, children) {
  return vnode("fieldset")(attributes, children);
}

function figcaption(attributes, children) {
  return vnode("figcaption")(attributes, children);
}

function figure(attributes, children) {
  return vnode("figure")(attributes, children);
}

function footer(attributes, children) {
  return vnode("footer")(attributes, children);
}

function form(attributes, children) {
  return vnode("form")(attributes, children);
}

function h1(attributes, children) {
  return vnode("h1")(attributes, children);
}

function h2(attributes, children) {
  return vnode("h2")(attributes, children);
}

function h3(attributes, children) {
  return vnode("h3")(attributes, children);
}

function h4(attributes, children) {
  return vnode("h4")(attributes, children);
}

function h5(attributes, children) {
  return vnode("h5")(attributes, children);
}

function h6(attributes, children) {
  return vnode("h6")(attributes, children);
}

function header(attributes, children) {
  return vnode("header")(attributes, children);
}

function hr(attributes, children) {
  return vnode("hr")(attributes, children);
}

function i(attributes, children) {
  return vnode("i")(attributes, children);
}

function iframe(attributes, children) {
  return vnode("iframe")(attributes, children);
}

function img(attributes, children) {
  return vnode("img")(attributes, children);
}

function input(attributes, children) {
  return vnode("input")(attributes, children);
}

function ins(attributes, children) {
  return vnode("ins")(attributes, children);
}

function kbd(attributes, children) {
  return vnode("kbd")(attributes, children);
}

function label(attributes, children) {
  return vnode("label")(attributes, children);
}

function legend(attributes, children) {
  return vnode("legend")(attributes, children);
}

function li(attributes, children) {
  return vnode("li")(attributes, children);
}

function main(attributes, children) {
  return vnode("main")(attributes, children);
}

function map(attributes, children) {
  return vnode("map")(attributes, children);
}

function mark(attributes, children) {
  return vnode("mark")(attributes, children);
}

function menu(attributes, children) {
  return vnode("menu")(attributes, children);
}

function menuitem(attributes, children) {
  return vnode("menuitem")(attributes, children);
}

function meter(attributes, children) {
  return vnode("meter")(attributes, children);
}

function nav(attributes, children) {
  return vnode("nav")(attributes, children);
}

function object(attributes, children) {
  return vnode("object")(attributes, children);
}

function ol(attributes, children) {
  return vnode("ol")(attributes, children);
}

function optgroup(attributes, children) {
  return vnode("optgroup")(attributes, children);
}

function option(attributes, children) {
  return vnode("option")(attributes, children);
}

function output(attributes, children) {
  return vnode("output")(attributes, children);
}

function p(attributes, children) {
  return vnode("p")(attributes, children);
}

function param(attributes, children) {
  return vnode("param")(attributes, children);
}

function pre(attributes, children) {
  return vnode("pre")(attributes, children);
}

function progress(attributes, children) {
  return vnode("progress")(attributes, children);
}

function q(attributes, children) {
  return vnode("q")(attributes, children);
}

function rp(attributes, children) {
  return vnode("rp")(attributes, children);
}

function rt(attributes, children) {
  return vnode("rt")(attributes, children);
}

function rtc(attributes, children) {
  return vnode("rtc")(attributes, children);
}

function ruby(attributes, children) {
  return vnode("ruby")(attributes, children);
}

function s(attributes, children) {
  return vnode("s")(attributes, children);
}

function samp(attributes, children) {
  return vnode("samp")(attributes, children);
}

function section(attributes, children) {
  return vnode("section")(attributes, children);
}

function select(attributes, children) {
  return vnode("select")(attributes, children);
}

function small(attributes, children) {
  return vnode("small")(attributes, children);
}

function source(attributes, children) {
  return vnode("source")(attributes, children);
}

function span(attributes, children) {
  return vnode("span")(attributes, children);
}

function strong(attributes, children) {
  return vnode("strong")(attributes, children);
}

function sub(attributes, children) {
  return vnode("sub")(attributes, children);
}

function summary(attributes, children) {
  return vnode("summary")(attributes, children);
}

function sup(attributes, children) {
  return vnode("sup")(attributes, children);
}

function svg(attributes, children) {
  return vnode("svg")(attributes, children);
}

function table(attributes, children) {
  return vnode("table")(attributes, children);
}

function tbody(attributes, children) {
  return vnode("tbody")(attributes, children);
}

function td(attributes, children) {
  return vnode("td")(attributes, children);
}

function textarea(attributes, children) {
  return vnode("textarea")(attributes, children);
}

function tfoot(attributes, children) {
  return vnode("tfoot")(attributes, children);
}

function th(attributes, children) {
  return vnode("th")(attributes, children);
}

function thead(attributes, children) {
  return vnode("thead")(attributes, children);
}

function time(attributes, children) {
  return vnode("time")(attributes, children);
}

function tr(attributes, children) {
  return vnode("tr")(attributes, children);
}

function track(attributes, children) {
  return vnode("track")(attributes, children);
}

function u(attributes, children) {
  return vnode("u")(attributes, children);
}

function ul(attributes, children) {
  return vnode("ul")(attributes, children);
}

function video(attributes, children) {
  return vnode("video")(attributes, children);
}

function wbr(attributes, children) {
  return vnode("wbr")(attributes, children);
}
},{"hyperapp":"../../node_modules/hyperapp/src/index.js"}],"../../node_modules/classcat/src/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = cc;
var isArray = Array.isArray;

function cc(names) {
  var i,
      len,
      tmp,
      out = "",
      type = typeof names;

  if (type === "string" || type === "number") return names || "";

  if (isArray(names) && names.length > 0) {
    for (i = 0, len = names.length; i < len; i++) {
      if ((tmp = cc(names[i])) !== "") out += (out && " ") + tmp;
    }
  } else {
    for (i in names) {
      if (names.hasOwnProperty(i) && names[i]) out += (out && " ") + i;
    }
  }

  return out;
}
},{}],"components.ts":[function(require,module,exports) {
"use strict";

var __importDefault = this && this.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const classcat_1 = __importDefault(require("classcat"));
const html_1 = require("@hyperapp/html");
const utils_1 = require("../common/utils");
;
exports.Selector = ({ items, selectedId, onchange }) => html_1.div({ class: "select" }, [html_1.select({ value: selectedId, onchange: e => onchange(parseInt(e.target.value)) }, items.map(item => html_1.option({ value: item.id }, item.name)))]);
exports.IssuesTable = ({ issues }) => html_1.table({ class: "table is-narrow is-fullwidth is-striped" }, [html_1.thead([html_1.tr([html_1.th("T"), html_1.th("Issue"), html_1.th("P"), html_1.th("Summary"), html_1.th("Assignee"), html_1.th("Original estimate"), html_1.th("Time spent"), html_1.th("Sprint estimate"), html_1.th("Sprint time spent"), html_1.th("Remaining estimate"), html_1.th("Sprint work ratio"), html_1.th("Status")])]), ...issues.map(issue => html_1.tbody([exports.IssueRow({ issue: issue }), ...issue.children.map(child => exports.IssueRow({ issue: child }))]))]);
exports.IssueRow = ({ issue }) => html_1.tr({ key: issue.key }, [html_1.td([html_1.img({ src: issue.issuetypeIconUrl })]), html_1.td({ class: "text-nowrap" }, [html_1.a({ href: issue.url }, issue.key)]), html_1.td([html_1.img({ src: issue.priorityIconUrl })]), html_1.td(issue.summary), html_1.td({ class: `user-${issue.assigneeId}` }, issue.assignee), html_1.td({ class: "text-nowrap" }, utils_1.readableDuration(issue.originalEstimate)), html_1.td({ class: "text-nowrap" }, utils_1.readableDuration(issue.timeSpent)), html_1.td({ class: "text-nowrap" }, utils_1.readableDuration(issue.sprintEstimate)), html_1.td({ class: "text-nowrap" }, utils_1.readableDuration(issue.sprintTimeSpent)), html_1.td({
    class: `text-nowrap remaining${issue.remainingEstimate > 0 ? "" : "-zero"}`
}, utils_1.readableDuration(issue.remainingEstimate)), html_1.td({ class: "text-nowrap" }, [issue.sprintWorkRatio < 100 ? html_1.span({ class: "green" }, `${issue.sprintWorkRatio}%`) : html_1.span({ class: "red" }, `${issue.sprintWorkRatio}%`)]), html_1.td({ class: "text-nowrap" }, [html_1.span({
    class: classcat_1.default({
        "tag": true,
        "is-warning": issue.status === "Open",
        "is-info": issue.status === "In Progress",
        "is-success": issue.status === "Implemented" || issue.status === "Resolved",
        "is-dark": issue.status === "Closed",
        "is-danger": issue.status === "Reopened"
    })
}, issue.status)])]);
exports.UsersTable = ({ users }) => html_1.table({ class: "table is-striped is-narrow is-fullwidth" }, [html_1.thead([html_1.th("User"), html_1.th("Time spent")]), html_1.tbody(users.map(user => html_1.tr([html_1.td(user.name), html_1.td(utils_1.readableDuration(user.timeSpent))])))]);
},{"classcat":"../../node_modules/classcat/src/index.js","@hyperapp/html":"../../node_modules/@hyperapp/html/dist/html.js","../common/utils":"../common/utils.ts"}],"view.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const html_1 = require("@hyperapp/html");
const utils_1 = require("../common/utils");
const components_1 = require("./components");
exports.view = (state, actions) => html_1.div({ oncreate: actions.init }, [html_1.section({ class: "section" }, [html_1.nav({ class: "level" }, [html_1.div({ class: "level-left" }, [html_1.div({ class: "level-item" }, [html_1.span({ id: "logo" }, "Szpion"), html_1.span("Daily Sprint Invigilation")])]), html_1.div({ class: "level-right" }, [html_1.div({ class: "tabs" }, [html_1.ul([html_1.li({ class: "is-active" }, [html_1.a("Sprint")]), html_1.li([html_1.a("Epic")])])])])])]), html_1.span("Board"), components_1.Selector({
    items: state.boards,
    selectedId: state.selectedBoardId,
    onchange: actions.changeBoard
}), html_1.span("Sprint"), components_1.Selector({
    items: state.sprints, selectedId: state.selectedSprintId,
    onchange: actions.changeSprint
}), html_1.section({ class: "section" }, [state.sprintDetails ? html_1.div({ class: "container is-fluid" }, [html_1.div({ class: "columns" }, [html_1.div({ class: "column" }, []), html_1.div({ class: "column" }, [html_1.div(`Issues: ${state.sprintDetails.issuesCount}`), html_1.div(`Issues completed: ${state.sprintDetails.completedIssuesCount}`)]), html_1.div({ class: "column" }, [html_1.div(`Start date: ${utils_1.readableTime(state.sprintDetails.startDate)}`), html_1.div(`End date: ${utils_1.readableTime(state.sprintDetails.endDate)}`)]), html_1.div({ class: "column" }, [html_1.div(`Estimate: ${utils_1.readableDuration(state.sprintDetails.estimate)}`), html_1.div(`Time spent: ${utils_1.readableDuration(state.sprintDetails.timeSpent)}`), html_1.div(`Remaining estimate: ${utils_1.readableDuration(state.sprintDetails.remainingEstimate)}`)])]), components_1.IssuesTable({
    issues: state.sprintDetails.issues.filter(issue => issue.status !== "Closed")
}), html_1.h3("Closed issues"), components_1.IssuesTable({
    issues: state.sprintDetails.issues.filter(issue => issue.status === "Closed")
}), html_1.h3("Users"), components_1.UsersTable({ users: state.sprintDetails.users })]) : html_1.div("Loading data")])]);
},{"@hyperapp/html":"../../node_modules/@hyperapp/html/dist/html.js","../common/utils":"../common/utils.ts","./components":"components.ts"}],"app.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const hyperapp_1 = require("hyperapp");
const state_1 = require("./state");
const actions_1 = require("./actions");
const view_1 = require("./view");
const actions = new actions_1.Actions();
const state = new state_1.State();
hyperapp_1.app(state, actions, view_1.view, document.body);
},{"hyperapp":"../../node_modules/hyperapp/src/index.js","./state":"state.ts","./actions":"actions.ts","./view":"view.ts"}],"../../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';

var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };

  module.bundle.hotData = null;
}

module.bundle.Module = Module;

var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = '' || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + '37836' + '/');
  ws.onmessage = function (event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      console.clear();

      data.assets.forEach(function (asset) {
        hmrApply(global.parcelRequire, asset);
      });

      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.parcelRequire, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();
      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');

      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);

      removeErrorOverlay();

      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  // html encode message and stack trace
  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;

  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';

  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  bundle.hotData = {};
  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);

  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAccept(global.parcelRequire, id);
  });
}
},{}]},{},["../../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","app.ts"], null)
//# sourceMappingURL=/app.c28bf8ad.map