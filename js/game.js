var CLOSURE_NO_DEPS = true;
var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6186 = x == null ? null : x;
  if(p[goog.typeOf(x__6186)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6187__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6187 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6187__delegate.call(this, array, i, idxs)
    };
    G__6187.cljs$lang$maxFixedArity = 2;
    G__6187.cljs$lang$applyTo = function(arglist__6188) {
      var array = cljs.core.first(arglist__6188);
      var i = cljs.core.first(cljs.core.next(arglist__6188));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6188));
      return G__6187__delegate(array, i, idxs)
    };
    G__6187.cljs$lang$arity$variadic = G__6187__delegate;
    return G__6187
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____6273 = this$;
      if(and__3822__auto____6273) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6273
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2436__auto____6274 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6275 = cljs.core._invoke[goog.typeOf(x__2436__auto____6274)];
        if(or__3824__auto____6275) {
          return or__3824__auto____6275
        }else {
          var or__3824__auto____6276 = cljs.core._invoke["_"];
          if(or__3824__auto____6276) {
            return or__3824__auto____6276
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6277 = this$;
      if(and__3822__auto____6277) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6277
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2436__auto____6278 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6279 = cljs.core._invoke[goog.typeOf(x__2436__auto____6278)];
        if(or__3824__auto____6279) {
          return or__3824__auto____6279
        }else {
          var or__3824__auto____6280 = cljs.core._invoke["_"];
          if(or__3824__auto____6280) {
            return or__3824__auto____6280
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6281 = this$;
      if(and__3822__auto____6281) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6281
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2436__auto____6282 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6283 = cljs.core._invoke[goog.typeOf(x__2436__auto____6282)];
        if(or__3824__auto____6283) {
          return or__3824__auto____6283
        }else {
          var or__3824__auto____6284 = cljs.core._invoke["_"];
          if(or__3824__auto____6284) {
            return or__3824__auto____6284
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6285 = this$;
      if(and__3822__auto____6285) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6285
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2436__auto____6286 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6287 = cljs.core._invoke[goog.typeOf(x__2436__auto____6286)];
        if(or__3824__auto____6287) {
          return or__3824__auto____6287
        }else {
          var or__3824__auto____6288 = cljs.core._invoke["_"];
          if(or__3824__auto____6288) {
            return or__3824__auto____6288
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6289 = this$;
      if(and__3822__auto____6289) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6289
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2436__auto____6290 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6291 = cljs.core._invoke[goog.typeOf(x__2436__auto____6290)];
        if(or__3824__auto____6291) {
          return or__3824__auto____6291
        }else {
          var or__3824__auto____6292 = cljs.core._invoke["_"];
          if(or__3824__auto____6292) {
            return or__3824__auto____6292
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6293 = this$;
      if(and__3822__auto____6293) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6293
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2436__auto____6294 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6295 = cljs.core._invoke[goog.typeOf(x__2436__auto____6294)];
        if(or__3824__auto____6295) {
          return or__3824__auto____6295
        }else {
          var or__3824__auto____6296 = cljs.core._invoke["_"];
          if(or__3824__auto____6296) {
            return or__3824__auto____6296
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6297 = this$;
      if(and__3822__auto____6297) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6297
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2436__auto____6298 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6299 = cljs.core._invoke[goog.typeOf(x__2436__auto____6298)];
        if(or__3824__auto____6299) {
          return or__3824__auto____6299
        }else {
          var or__3824__auto____6300 = cljs.core._invoke["_"];
          if(or__3824__auto____6300) {
            return or__3824__auto____6300
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6301 = this$;
      if(and__3822__auto____6301) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6301
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2436__auto____6302 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6303 = cljs.core._invoke[goog.typeOf(x__2436__auto____6302)];
        if(or__3824__auto____6303) {
          return or__3824__auto____6303
        }else {
          var or__3824__auto____6304 = cljs.core._invoke["_"];
          if(or__3824__auto____6304) {
            return or__3824__auto____6304
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6305 = this$;
      if(and__3822__auto____6305) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6305
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2436__auto____6306 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6307 = cljs.core._invoke[goog.typeOf(x__2436__auto____6306)];
        if(or__3824__auto____6307) {
          return or__3824__auto____6307
        }else {
          var or__3824__auto____6308 = cljs.core._invoke["_"];
          if(or__3824__auto____6308) {
            return or__3824__auto____6308
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6309 = this$;
      if(and__3822__auto____6309) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6309
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2436__auto____6310 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6311 = cljs.core._invoke[goog.typeOf(x__2436__auto____6310)];
        if(or__3824__auto____6311) {
          return or__3824__auto____6311
        }else {
          var or__3824__auto____6312 = cljs.core._invoke["_"];
          if(or__3824__auto____6312) {
            return or__3824__auto____6312
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6313 = this$;
      if(and__3822__auto____6313) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6313
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2436__auto____6314 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6315 = cljs.core._invoke[goog.typeOf(x__2436__auto____6314)];
        if(or__3824__auto____6315) {
          return or__3824__auto____6315
        }else {
          var or__3824__auto____6316 = cljs.core._invoke["_"];
          if(or__3824__auto____6316) {
            return or__3824__auto____6316
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6317 = this$;
      if(and__3822__auto____6317) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6317
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2436__auto____6318 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6319 = cljs.core._invoke[goog.typeOf(x__2436__auto____6318)];
        if(or__3824__auto____6319) {
          return or__3824__auto____6319
        }else {
          var or__3824__auto____6320 = cljs.core._invoke["_"];
          if(or__3824__auto____6320) {
            return or__3824__auto____6320
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6321 = this$;
      if(and__3822__auto____6321) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6321
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2436__auto____6322 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6323 = cljs.core._invoke[goog.typeOf(x__2436__auto____6322)];
        if(or__3824__auto____6323) {
          return or__3824__auto____6323
        }else {
          var or__3824__auto____6324 = cljs.core._invoke["_"];
          if(or__3824__auto____6324) {
            return or__3824__auto____6324
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6325 = this$;
      if(and__3822__auto____6325) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6325
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2436__auto____6326 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6327 = cljs.core._invoke[goog.typeOf(x__2436__auto____6326)];
        if(or__3824__auto____6327) {
          return or__3824__auto____6327
        }else {
          var or__3824__auto____6328 = cljs.core._invoke["_"];
          if(or__3824__auto____6328) {
            return or__3824__auto____6328
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6329 = this$;
      if(and__3822__auto____6329) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6329
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2436__auto____6330 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6331 = cljs.core._invoke[goog.typeOf(x__2436__auto____6330)];
        if(or__3824__auto____6331) {
          return or__3824__auto____6331
        }else {
          var or__3824__auto____6332 = cljs.core._invoke["_"];
          if(or__3824__auto____6332) {
            return or__3824__auto____6332
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6333 = this$;
      if(and__3822__auto____6333) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6333
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2436__auto____6334 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6335 = cljs.core._invoke[goog.typeOf(x__2436__auto____6334)];
        if(or__3824__auto____6335) {
          return or__3824__auto____6335
        }else {
          var or__3824__auto____6336 = cljs.core._invoke["_"];
          if(or__3824__auto____6336) {
            return or__3824__auto____6336
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6337 = this$;
      if(and__3822__auto____6337) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6337
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2436__auto____6338 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6339 = cljs.core._invoke[goog.typeOf(x__2436__auto____6338)];
        if(or__3824__auto____6339) {
          return or__3824__auto____6339
        }else {
          var or__3824__auto____6340 = cljs.core._invoke["_"];
          if(or__3824__auto____6340) {
            return or__3824__auto____6340
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6341 = this$;
      if(and__3822__auto____6341) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6341
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2436__auto____6342 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6343 = cljs.core._invoke[goog.typeOf(x__2436__auto____6342)];
        if(or__3824__auto____6343) {
          return or__3824__auto____6343
        }else {
          var or__3824__auto____6344 = cljs.core._invoke["_"];
          if(or__3824__auto____6344) {
            return or__3824__auto____6344
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6345 = this$;
      if(and__3822__auto____6345) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6345
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2436__auto____6346 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6347 = cljs.core._invoke[goog.typeOf(x__2436__auto____6346)];
        if(or__3824__auto____6347) {
          return or__3824__auto____6347
        }else {
          var or__3824__auto____6348 = cljs.core._invoke["_"];
          if(or__3824__auto____6348) {
            return or__3824__auto____6348
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6349 = this$;
      if(and__3822__auto____6349) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6349
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2436__auto____6350 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6351 = cljs.core._invoke[goog.typeOf(x__2436__auto____6350)];
        if(or__3824__auto____6351) {
          return or__3824__auto____6351
        }else {
          var or__3824__auto____6352 = cljs.core._invoke["_"];
          if(or__3824__auto____6352) {
            return or__3824__auto____6352
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6353 = this$;
      if(and__3822__auto____6353) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6353
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2436__auto____6354 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6355 = cljs.core._invoke[goog.typeOf(x__2436__auto____6354)];
        if(or__3824__auto____6355) {
          return or__3824__auto____6355
        }else {
          var or__3824__auto____6356 = cljs.core._invoke["_"];
          if(or__3824__auto____6356) {
            return or__3824__auto____6356
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____6361 = coll;
    if(and__3822__auto____6361) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6361
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2436__auto____6362 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6363 = cljs.core._count[goog.typeOf(x__2436__auto____6362)];
      if(or__3824__auto____6363) {
        return or__3824__auto____6363
      }else {
        var or__3824__auto____6364 = cljs.core._count["_"];
        if(or__3824__auto____6364) {
          return or__3824__auto____6364
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____6369 = coll;
    if(and__3822__auto____6369) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6369
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2436__auto____6370 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6371 = cljs.core._empty[goog.typeOf(x__2436__auto____6370)];
      if(or__3824__auto____6371) {
        return or__3824__auto____6371
      }else {
        var or__3824__auto____6372 = cljs.core._empty["_"];
        if(or__3824__auto____6372) {
          return or__3824__auto____6372
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____6377 = coll;
    if(and__3822__auto____6377) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6377
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2436__auto____6378 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6379 = cljs.core._conj[goog.typeOf(x__2436__auto____6378)];
      if(or__3824__auto____6379) {
        return or__3824__auto____6379
      }else {
        var or__3824__auto____6380 = cljs.core._conj["_"];
        if(or__3824__auto____6380) {
          return or__3824__auto____6380
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____6389 = coll;
      if(and__3822__auto____6389) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6389
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2436__auto____6390 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6391 = cljs.core._nth[goog.typeOf(x__2436__auto____6390)];
        if(or__3824__auto____6391) {
          return or__3824__auto____6391
        }else {
          var or__3824__auto____6392 = cljs.core._nth["_"];
          if(or__3824__auto____6392) {
            return or__3824__auto____6392
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6393 = coll;
      if(and__3822__auto____6393) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6393
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2436__auto____6394 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6395 = cljs.core._nth[goog.typeOf(x__2436__auto____6394)];
        if(or__3824__auto____6395) {
          return or__3824__auto____6395
        }else {
          var or__3824__auto____6396 = cljs.core._nth["_"];
          if(or__3824__auto____6396) {
            return or__3824__auto____6396
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____6401 = coll;
    if(and__3822__auto____6401) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6401
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2436__auto____6402 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6403 = cljs.core._first[goog.typeOf(x__2436__auto____6402)];
      if(or__3824__auto____6403) {
        return or__3824__auto____6403
      }else {
        var or__3824__auto____6404 = cljs.core._first["_"];
        if(or__3824__auto____6404) {
          return or__3824__auto____6404
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6409 = coll;
    if(and__3822__auto____6409) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6409
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2436__auto____6410 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6411 = cljs.core._rest[goog.typeOf(x__2436__auto____6410)];
      if(or__3824__auto____6411) {
        return or__3824__auto____6411
      }else {
        var or__3824__auto____6412 = cljs.core._rest["_"];
        if(or__3824__auto____6412) {
          return or__3824__auto____6412
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____6417 = coll;
    if(and__3822__auto____6417) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6417
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2436__auto____6418 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6419 = cljs.core._next[goog.typeOf(x__2436__auto____6418)];
      if(or__3824__auto____6419) {
        return or__3824__auto____6419
      }else {
        var or__3824__auto____6420 = cljs.core._next["_"];
        if(or__3824__auto____6420) {
          return or__3824__auto____6420
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____6429 = o;
      if(and__3822__auto____6429) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6429
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2436__auto____6430 = o == null ? null : o;
      return function() {
        var or__3824__auto____6431 = cljs.core._lookup[goog.typeOf(x__2436__auto____6430)];
        if(or__3824__auto____6431) {
          return or__3824__auto____6431
        }else {
          var or__3824__auto____6432 = cljs.core._lookup["_"];
          if(or__3824__auto____6432) {
            return or__3824__auto____6432
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6433 = o;
      if(and__3822__auto____6433) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6433
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2436__auto____6434 = o == null ? null : o;
      return function() {
        var or__3824__auto____6435 = cljs.core._lookup[goog.typeOf(x__2436__auto____6434)];
        if(or__3824__auto____6435) {
          return or__3824__auto____6435
        }else {
          var or__3824__auto____6436 = cljs.core._lookup["_"];
          if(or__3824__auto____6436) {
            return or__3824__auto____6436
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____6441 = coll;
    if(and__3822__auto____6441) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6441
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2436__auto____6442 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6443 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2436__auto____6442)];
      if(or__3824__auto____6443) {
        return or__3824__auto____6443
      }else {
        var or__3824__auto____6444 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6444) {
          return or__3824__auto____6444
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6449 = coll;
    if(and__3822__auto____6449) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6449
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2436__auto____6450 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6451 = cljs.core._assoc[goog.typeOf(x__2436__auto____6450)];
      if(or__3824__auto____6451) {
        return or__3824__auto____6451
      }else {
        var or__3824__auto____6452 = cljs.core._assoc["_"];
        if(or__3824__auto____6452) {
          return or__3824__auto____6452
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____6457 = coll;
    if(and__3822__auto____6457) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6457
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2436__auto____6458 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6459 = cljs.core._dissoc[goog.typeOf(x__2436__auto____6458)];
      if(or__3824__auto____6459) {
        return or__3824__auto____6459
      }else {
        var or__3824__auto____6460 = cljs.core._dissoc["_"];
        if(or__3824__auto____6460) {
          return or__3824__auto____6460
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____6465 = coll;
    if(and__3822__auto____6465) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6465
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2436__auto____6466 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6467 = cljs.core._key[goog.typeOf(x__2436__auto____6466)];
      if(or__3824__auto____6467) {
        return or__3824__auto____6467
      }else {
        var or__3824__auto____6468 = cljs.core._key["_"];
        if(or__3824__auto____6468) {
          return or__3824__auto____6468
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6473 = coll;
    if(and__3822__auto____6473) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6473
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2436__auto____6474 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6475 = cljs.core._val[goog.typeOf(x__2436__auto____6474)];
      if(or__3824__auto____6475) {
        return or__3824__auto____6475
      }else {
        var or__3824__auto____6476 = cljs.core._val["_"];
        if(or__3824__auto____6476) {
          return or__3824__auto____6476
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____6481 = coll;
    if(and__3822__auto____6481) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6481
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2436__auto____6482 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6483 = cljs.core._disjoin[goog.typeOf(x__2436__auto____6482)];
      if(or__3824__auto____6483) {
        return or__3824__auto____6483
      }else {
        var or__3824__auto____6484 = cljs.core._disjoin["_"];
        if(or__3824__auto____6484) {
          return or__3824__auto____6484
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____6489 = coll;
    if(and__3822__auto____6489) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6489
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2436__auto____6490 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6491 = cljs.core._peek[goog.typeOf(x__2436__auto____6490)];
      if(or__3824__auto____6491) {
        return or__3824__auto____6491
      }else {
        var or__3824__auto____6492 = cljs.core._peek["_"];
        if(or__3824__auto____6492) {
          return or__3824__auto____6492
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6497 = coll;
    if(and__3822__auto____6497) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6497
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2436__auto____6498 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6499 = cljs.core._pop[goog.typeOf(x__2436__auto____6498)];
      if(or__3824__auto____6499) {
        return or__3824__auto____6499
      }else {
        var or__3824__auto____6500 = cljs.core._pop["_"];
        if(or__3824__auto____6500) {
          return or__3824__auto____6500
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____6505 = coll;
    if(and__3822__auto____6505) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6505
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2436__auto____6506 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6507 = cljs.core._assoc_n[goog.typeOf(x__2436__auto____6506)];
      if(or__3824__auto____6507) {
        return or__3824__auto____6507
      }else {
        var or__3824__auto____6508 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6508) {
          return or__3824__auto____6508
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____6513 = o;
    if(and__3822__auto____6513) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6513
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2436__auto____6514 = o == null ? null : o;
    return function() {
      var or__3824__auto____6515 = cljs.core._deref[goog.typeOf(x__2436__auto____6514)];
      if(or__3824__auto____6515) {
        return or__3824__auto____6515
      }else {
        var or__3824__auto____6516 = cljs.core._deref["_"];
        if(or__3824__auto____6516) {
          return or__3824__auto____6516
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____6521 = o;
    if(and__3822__auto____6521) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6521
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2436__auto____6522 = o == null ? null : o;
    return function() {
      var or__3824__auto____6523 = cljs.core._deref_with_timeout[goog.typeOf(x__2436__auto____6522)];
      if(or__3824__auto____6523) {
        return or__3824__auto____6523
      }else {
        var or__3824__auto____6524 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6524) {
          return or__3824__auto____6524
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____6529 = o;
    if(and__3822__auto____6529) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6529
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2436__auto____6530 = o == null ? null : o;
    return function() {
      var or__3824__auto____6531 = cljs.core._meta[goog.typeOf(x__2436__auto____6530)];
      if(or__3824__auto____6531) {
        return or__3824__auto____6531
      }else {
        var or__3824__auto____6532 = cljs.core._meta["_"];
        if(or__3824__auto____6532) {
          return or__3824__auto____6532
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____6537 = o;
    if(and__3822__auto____6537) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6537
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2436__auto____6538 = o == null ? null : o;
    return function() {
      var or__3824__auto____6539 = cljs.core._with_meta[goog.typeOf(x__2436__auto____6538)];
      if(or__3824__auto____6539) {
        return or__3824__auto____6539
      }else {
        var or__3824__auto____6540 = cljs.core._with_meta["_"];
        if(or__3824__auto____6540) {
          return or__3824__auto____6540
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____6549 = coll;
      if(and__3822__auto____6549) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6549
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2436__auto____6550 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6551 = cljs.core._reduce[goog.typeOf(x__2436__auto____6550)];
        if(or__3824__auto____6551) {
          return or__3824__auto____6551
        }else {
          var or__3824__auto____6552 = cljs.core._reduce["_"];
          if(or__3824__auto____6552) {
            return or__3824__auto____6552
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6553 = coll;
      if(and__3822__auto____6553) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6553
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2436__auto____6554 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6555 = cljs.core._reduce[goog.typeOf(x__2436__auto____6554)];
        if(or__3824__auto____6555) {
          return or__3824__auto____6555
        }else {
          var or__3824__auto____6556 = cljs.core._reduce["_"];
          if(or__3824__auto____6556) {
            return or__3824__auto____6556
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____6561 = coll;
    if(and__3822__auto____6561) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6561
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2436__auto____6562 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6563 = cljs.core._kv_reduce[goog.typeOf(x__2436__auto____6562)];
      if(or__3824__auto____6563) {
        return or__3824__auto____6563
      }else {
        var or__3824__auto____6564 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6564) {
          return or__3824__auto____6564
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____6569 = o;
    if(and__3822__auto____6569) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6569
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2436__auto____6570 = o == null ? null : o;
    return function() {
      var or__3824__auto____6571 = cljs.core._equiv[goog.typeOf(x__2436__auto____6570)];
      if(or__3824__auto____6571) {
        return or__3824__auto____6571
      }else {
        var or__3824__auto____6572 = cljs.core._equiv["_"];
        if(or__3824__auto____6572) {
          return or__3824__auto____6572
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____6577 = o;
    if(and__3822__auto____6577) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6577
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2436__auto____6578 = o == null ? null : o;
    return function() {
      var or__3824__auto____6579 = cljs.core._hash[goog.typeOf(x__2436__auto____6578)];
      if(or__3824__auto____6579) {
        return or__3824__auto____6579
      }else {
        var or__3824__auto____6580 = cljs.core._hash["_"];
        if(or__3824__auto____6580) {
          return or__3824__auto____6580
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____6585 = o;
    if(and__3822__auto____6585) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6585
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2436__auto____6586 = o == null ? null : o;
    return function() {
      var or__3824__auto____6587 = cljs.core._seq[goog.typeOf(x__2436__auto____6586)];
      if(or__3824__auto____6587) {
        return or__3824__auto____6587
      }else {
        var or__3824__auto____6588 = cljs.core._seq["_"];
        if(or__3824__auto____6588) {
          return or__3824__auto____6588
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____6593 = coll;
    if(and__3822__auto____6593) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6593
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2436__auto____6594 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6595 = cljs.core._rseq[goog.typeOf(x__2436__auto____6594)];
      if(or__3824__auto____6595) {
        return or__3824__auto____6595
      }else {
        var or__3824__auto____6596 = cljs.core._rseq["_"];
        if(or__3824__auto____6596) {
          return or__3824__auto____6596
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6601 = coll;
    if(and__3822__auto____6601) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6601
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2436__auto____6602 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6603 = cljs.core._sorted_seq[goog.typeOf(x__2436__auto____6602)];
      if(or__3824__auto____6603) {
        return or__3824__auto____6603
      }else {
        var or__3824__auto____6604 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6604) {
          return or__3824__auto____6604
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6609 = coll;
    if(and__3822__auto____6609) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6609
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2436__auto____6610 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6611 = cljs.core._sorted_seq_from[goog.typeOf(x__2436__auto____6610)];
      if(or__3824__auto____6611) {
        return or__3824__auto____6611
      }else {
        var or__3824__auto____6612 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6612) {
          return or__3824__auto____6612
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6617 = coll;
    if(and__3822__auto____6617) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6617
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2436__auto____6618 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6619 = cljs.core._entry_key[goog.typeOf(x__2436__auto____6618)];
      if(or__3824__auto____6619) {
        return or__3824__auto____6619
      }else {
        var or__3824__auto____6620 = cljs.core._entry_key["_"];
        if(or__3824__auto____6620) {
          return or__3824__auto____6620
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____6625 = coll;
    if(and__3822__auto____6625) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____6625
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2436__auto____6626 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6627 = cljs.core._comparator[goog.typeOf(x__2436__auto____6626)];
      if(or__3824__auto____6627) {
        return or__3824__auto____6627
      }else {
        var or__3824__auto____6628 = cljs.core._comparator["_"];
        if(or__3824__auto____6628) {
          return or__3824__auto____6628
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____6633 = o;
    if(and__3822__auto____6633) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____6633
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2436__auto____6634 = o == null ? null : o;
    return function() {
      var or__3824__auto____6635 = cljs.core._pr_seq[goog.typeOf(x__2436__auto____6634)];
      if(or__3824__auto____6635) {
        return or__3824__auto____6635
      }else {
        var or__3824__auto____6636 = cljs.core._pr_seq["_"];
        if(or__3824__auto____6636) {
          return or__3824__auto____6636
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IWriter = {};
cljs.core._write = function _write(writer, s) {
  if(function() {
    var and__3822__auto____6641 = writer;
    if(and__3822__auto____6641) {
      return writer.cljs$core$IWriter$_write$arity$2
    }else {
      return and__3822__auto____6641
    }
  }()) {
    return writer.cljs$core$IWriter$_write$arity$2(writer, s)
  }else {
    var x__2436__auto____6642 = writer == null ? null : writer;
    return function() {
      var or__3824__auto____6643 = cljs.core._write[goog.typeOf(x__2436__auto____6642)];
      if(or__3824__auto____6643) {
        return or__3824__auto____6643
      }else {
        var or__3824__auto____6644 = cljs.core._write["_"];
        if(or__3824__auto____6644) {
          return or__3824__auto____6644
        }else {
          throw cljs.core.missing_protocol.call(null, "IWriter.-write", writer);
        }
      }
    }().call(null, writer, s)
  }
};
cljs.core._flush = function _flush(writer) {
  if(function() {
    var and__3822__auto____6649 = writer;
    if(and__3822__auto____6649) {
      return writer.cljs$core$IWriter$_flush$arity$1
    }else {
      return and__3822__auto____6649
    }
  }()) {
    return writer.cljs$core$IWriter$_flush$arity$1(writer)
  }else {
    var x__2436__auto____6650 = writer == null ? null : writer;
    return function() {
      var or__3824__auto____6651 = cljs.core._flush[goog.typeOf(x__2436__auto____6650)];
      if(or__3824__auto____6651) {
        return or__3824__auto____6651
      }else {
        var or__3824__auto____6652 = cljs.core._flush["_"];
        if(or__3824__auto____6652) {
          return or__3824__auto____6652
        }else {
          throw cljs.core.missing_protocol.call(null, "IWriter.-flush", writer);
        }
      }
    }().call(null, writer)
  }
};
cljs.core.IPrintWithWriter = {};
cljs.core._pr_writer = function _pr_writer(o, writer, opts) {
  if(function() {
    var and__3822__auto____6657 = o;
    if(and__3822__auto____6657) {
      return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3
    }else {
      return and__3822__auto____6657
    }
  }()) {
    return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3(o, writer, opts)
  }else {
    var x__2436__auto____6658 = o == null ? null : o;
    return function() {
      var or__3824__auto____6659 = cljs.core._pr_writer[goog.typeOf(x__2436__auto____6658)];
      if(or__3824__auto____6659) {
        return or__3824__auto____6659
      }else {
        var or__3824__auto____6660 = cljs.core._pr_writer["_"];
        if(or__3824__auto____6660) {
          return or__3824__auto____6660
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintWithWriter.-pr-writer", o);
        }
      }
    }().call(null, o, writer, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____6665 = d;
    if(and__3822__auto____6665) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____6665
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2436__auto____6666 = d == null ? null : d;
    return function() {
      var or__3824__auto____6667 = cljs.core._realized_QMARK_[goog.typeOf(x__2436__auto____6666)];
      if(or__3824__auto____6667) {
        return or__3824__auto____6667
      }else {
        var or__3824__auto____6668 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____6668) {
          return or__3824__auto____6668
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____6673 = this$;
    if(and__3822__auto____6673) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____6673
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2436__auto____6674 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6675 = cljs.core._notify_watches[goog.typeOf(x__2436__auto____6674)];
      if(or__3824__auto____6675) {
        return or__3824__auto____6675
      }else {
        var or__3824__auto____6676 = cljs.core._notify_watches["_"];
        if(or__3824__auto____6676) {
          return or__3824__auto____6676
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____6681 = this$;
    if(and__3822__auto____6681) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____6681
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2436__auto____6682 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6683 = cljs.core._add_watch[goog.typeOf(x__2436__auto____6682)];
      if(or__3824__auto____6683) {
        return or__3824__auto____6683
      }else {
        var or__3824__auto____6684 = cljs.core._add_watch["_"];
        if(or__3824__auto____6684) {
          return or__3824__auto____6684
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____6689 = this$;
    if(and__3822__auto____6689) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____6689
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2436__auto____6690 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6691 = cljs.core._remove_watch[goog.typeOf(x__2436__auto____6690)];
      if(or__3824__auto____6691) {
        return or__3824__auto____6691
      }else {
        var or__3824__auto____6692 = cljs.core._remove_watch["_"];
        if(or__3824__auto____6692) {
          return or__3824__auto____6692
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____6697 = coll;
    if(and__3822__auto____6697) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____6697
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2436__auto____6698 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6699 = cljs.core._as_transient[goog.typeOf(x__2436__auto____6698)];
      if(or__3824__auto____6699) {
        return or__3824__auto____6699
      }else {
        var or__3824__auto____6700 = cljs.core._as_transient["_"];
        if(or__3824__auto____6700) {
          return or__3824__auto____6700
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____6705 = tcoll;
    if(and__3822__auto____6705) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____6705
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2436__auto____6706 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6707 = cljs.core._conj_BANG_[goog.typeOf(x__2436__auto____6706)];
      if(or__3824__auto____6707) {
        return or__3824__auto____6707
      }else {
        var or__3824__auto____6708 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____6708) {
          return or__3824__auto____6708
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6713 = tcoll;
    if(and__3822__auto____6713) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____6713
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2436__auto____6714 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6715 = cljs.core._persistent_BANG_[goog.typeOf(x__2436__auto____6714)];
      if(or__3824__auto____6715) {
        return or__3824__auto____6715
      }else {
        var or__3824__auto____6716 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____6716) {
          return or__3824__auto____6716
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____6721 = tcoll;
    if(and__3822__auto____6721) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____6721
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2436__auto____6722 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6723 = cljs.core._assoc_BANG_[goog.typeOf(x__2436__auto____6722)];
      if(or__3824__auto____6723) {
        return or__3824__auto____6723
      }else {
        var or__3824__auto____6724 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____6724) {
          return or__3824__auto____6724
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____6729 = tcoll;
    if(and__3822__auto____6729) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____6729
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2436__auto____6730 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6731 = cljs.core._dissoc_BANG_[goog.typeOf(x__2436__auto____6730)];
      if(or__3824__auto____6731) {
        return or__3824__auto____6731
      }else {
        var or__3824__auto____6732 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____6732) {
          return or__3824__auto____6732
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____6737 = tcoll;
    if(and__3822__auto____6737) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____6737
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2436__auto____6738 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6739 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2436__auto____6738)];
      if(or__3824__auto____6739) {
        return or__3824__auto____6739
      }else {
        var or__3824__auto____6740 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____6740) {
          return or__3824__auto____6740
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6745 = tcoll;
    if(and__3822__auto____6745) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____6745
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2436__auto____6746 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6747 = cljs.core._pop_BANG_[goog.typeOf(x__2436__auto____6746)];
      if(or__3824__auto____6747) {
        return or__3824__auto____6747
      }else {
        var or__3824__auto____6748 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____6748) {
          return or__3824__auto____6748
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____6753 = tcoll;
    if(and__3822__auto____6753) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____6753
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2436__auto____6754 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6755 = cljs.core._disjoin_BANG_[goog.typeOf(x__2436__auto____6754)];
      if(or__3824__auto____6755) {
        return or__3824__auto____6755
      }else {
        var or__3824__auto____6756 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____6756) {
          return or__3824__auto____6756
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____6761 = x;
    if(and__3822__auto____6761) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____6761
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2436__auto____6762 = x == null ? null : x;
    return function() {
      var or__3824__auto____6763 = cljs.core._compare[goog.typeOf(x__2436__auto____6762)];
      if(or__3824__auto____6763) {
        return or__3824__auto____6763
      }else {
        var or__3824__auto____6764 = cljs.core._compare["_"];
        if(or__3824__auto____6764) {
          return or__3824__auto____6764
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____6769 = coll;
    if(and__3822__auto____6769) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____6769
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2436__auto____6770 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6771 = cljs.core._drop_first[goog.typeOf(x__2436__auto____6770)];
      if(or__3824__auto____6771) {
        return or__3824__auto____6771
      }else {
        var or__3824__auto____6772 = cljs.core._drop_first["_"];
        if(or__3824__auto____6772) {
          return or__3824__auto____6772
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____6777 = coll;
    if(and__3822__auto____6777) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____6777
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2436__auto____6778 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6779 = cljs.core._chunked_first[goog.typeOf(x__2436__auto____6778)];
      if(or__3824__auto____6779) {
        return or__3824__auto____6779
      }else {
        var or__3824__auto____6780 = cljs.core._chunked_first["_"];
        if(or__3824__auto____6780) {
          return or__3824__auto____6780
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____6785 = coll;
    if(and__3822__auto____6785) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____6785
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2436__auto____6786 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6787 = cljs.core._chunked_rest[goog.typeOf(x__2436__auto____6786)];
      if(or__3824__auto____6787) {
        return or__3824__auto____6787
      }else {
        var or__3824__auto____6788 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____6788) {
          return or__3824__auto____6788
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____6793 = coll;
    if(and__3822__auto____6793) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____6793
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2436__auto____6794 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6795 = cljs.core._chunked_next[goog.typeOf(x__2436__auto____6794)];
      if(or__3824__auto____6795) {
        return or__3824__auto____6795
      }else {
        var or__3824__auto____6796 = cljs.core._chunked_next["_"];
        if(or__3824__auto____6796) {
          return or__3824__auto____6796
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6800__6801 = coll;
      if(G__6800__6801) {
        if(function() {
          var or__3824__auto____6802 = G__6800__6801.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____6802) {
            return or__3824__auto____6802
          }else {
            return G__6800__6801.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6800__6801.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6800__6801)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6800__6801)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6807__6808 = coll;
      if(G__6807__6808) {
        if(function() {
          var or__3824__auto____6809 = G__6807__6808.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6809) {
            return or__3824__auto____6809
          }else {
            return G__6807__6808.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6807__6808.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6807__6808)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6807__6808)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6810 = cljs.core.seq.call(null, coll);
      if(s__6810 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6810)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6815__6816 = coll;
      if(G__6815__6816) {
        if(function() {
          var or__3824__auto____6817 = G__6815__6816.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6817) {
            return or__3824__auto____6817
          }else {
            return G__6815__6816.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6815__6816.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6815__6816)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6815__6816)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6818 = cljs.core.seq.call(null, coll);
      if(!(s__6818 == null)) {
        return cljs.core._rest.call(null, s__6818)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6822__6823 = coll;
      if(G__6822__6823) {
        if(function() {
          var or__3824__auto____6824 = G__6822__6823.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____6824) {
            return or__3824__auto____6824
          }else {
            return G__6822__6823.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6822__6823.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6822__6823)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6822__6823)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____6826 = x === y;
    if(or__3824__auto____6826) {
      return or__3824__auto____6826
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6827__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6828 = y;
            var G__6829 = cljs.core.first.call(null, more);
            var G__6830 = cljs.core.next.call(null, more);
            x = G__6828;
            y = G__6829;
            more = G__6830;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6827 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6827__delegate.call(this, x, y, more)
    };
    G__6827.cljs$lang$maxFixedArity = 2;
    G__6827.cljs$lang$applyTo = function(arglist__6831) {
      var x = cljs.core.first(arglist__6831);
      var y = cljs.core.first(cljs.core.next(arglist__6831));
      var more = cljs.core.rest(cljs.core.next(arglist__6831));
      return G__6827__delegate(x, y, more)
    };
    G__6827.cljs$lang$arity$variadic = G__6827__delegate;
    return G__6827
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__6832 = null;
  var G__6832__2 = function(o, k) {
    return null
  };
  var G__6832__3 = function(o, k, not_found) {
    return not_found
  };
  G__6832 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6832__2.call(this, o, k);
      case 3:
        return G__6832__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6832
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.IPrintWithWriter["null"] = true;
cljs.core._pr_writer["null"] = function(o, writer, _) {
  return cljs.core._write.call(null, writer, "nil")
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__6833 = null;
  var G__6833__2 = function(_, f) {
    return f.call(null)
  };
  var G__6833__3 = function(_, f, start) {
    return start
  };
  G__6833 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6833__2.call(this, _, f);
      case 3:
        return G__6833__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6833
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__6834 = null;
  var G__6834__2 = function(_, n) {
    return null
  };
  var G__6834__3 = function(_, n, not_found) {
    return not_found
  };
  G__6834 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6834__2.call(this, _, n);
      case 3:
        return G__6834__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6834
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____6835 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____6835) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____6835
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
goog.provide("cljs.core.Reduced");
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__6836 = this;
  return this__6836.val
};
cljs.core.Reduced;
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__6849 = cljs.core._count.call(null, cicoll);
    if(cnt__6849 === 0) {
      return f.call(null)
    }else {
      var val__6850 = cljs.core._nth.call(null, cicoll, 0);
      var n__6851 = 1;
      while(true) {
        if(n__6851 < cnt__6849) {
          var nval__6852 = f.call(null, val__6850, cljs.core._nth.call(null, cicoll, n__6851));
          if(cljs.core.reduced_QMARK_.call(null, nval__6852)) {
            return cljs.core.deref.call(null, nval__6852)
          }else {
            var G__6861 = nval__6852;
            var G__6862 = n__6851 + 1;
            val__6850 = G__6861;
            n__6851 = G__6862;
            continue
          }
        }else {
          return val__6850
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6853 = cljs.core._count.call(null, cicoll);
    var val__6854 = val;
    var n__6855 = 0;
    while(true) {
      if(n__6855 < cnt__6853) {
        var nval__6856 = f.call(null, val__6854, cljs.core._nth.call(null, cicoll, n__6855));
        if(cljs.core.reduced_QMARK_.call(null, nval__6856)) {
          return cljs.core.deref.call(null, nval__6856)
        }else {
          var G__6863 = nval__6856;
          var G__6864 = n__6855 + 1;
          val__6854 = G__6863;
          n__6855 = G__6864;
          continue
        }
      }else {
        return val__6854
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6857 = cljs.core._count.call(null, cicoll);
    var val__6858 = val;
    var n__6859 = idx;
    while(true) {
      if(n__6859 < cnt__6857) {
        var nval__6860 = f.call(null, val__6858, cljs.core._nth.call(null, cicoll, n__6859));
        if(cljs.core.reduced_QMARK_.call(null, nval__6860)) {
          return cljs.core.deref.call(null, nval__6860)
        }else {
          var G__6865 = nval__6860;
          var G__6866 = n__6859 + 1;
          val__6858 = G__6865;
          n__6859 = G__6866;
          continue
        }
      }else {
        return val__6858
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__6879 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6880 = arr[0];
      var n__6881 = 1;
      while(true) {
        if(n__6881 < cnt__6879) {
          var nval__6882 = f.call(null, val__6880, arr[n__6881]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6882)) {
            return cljs.core.deref.call(null, nval__6882)
          }else {
            var G__6891 = nval__6882;
            var G__6892 = n__6881 + 1;
            val__6880 = G__6891;
            n__6881 = G__6892;
            continue
          }
        }else {
          return val__6880
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6883 = arr.length;
    var val__6884 = val;
    var n__6885 = 0;
    while(true) {
      if(n__6885 < cnt__6883) {
        var nval__6886 = f.call(null, val__6884, arr[n__6885]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6886)) {
          return cljs.core.deref.call(null, nval__6886)
        }else {
          var G__6893 = nval__6886;
          var G__6894 = n__6885 + 1;
          val__6884 = G__6893;
          n__6885 = G__6894;
          continue
        }
      }else {
        return val__6884
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6887 = arr.length;
    var val__6888 = val;
    var n__6889 = idx;
    while(true) {
      if(n__6889 < cnt__6887) {
        var nval__6890 = f.call(null, val__6888, arr[n__6889]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6890)) {
          return cljs.core.deref.call(null, nval__6890)
        }else {
          var G__6895 = nval__6890;
          var G__6896 = n__6889 + 1;
          val__6888 = G__6895;
          n__6889 = G__6896;
          continue
        }
      }else {
        return val__6888
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6900__6901 = x;
  if(G__6900__6901) {
    if(function() {
      var or__3824__auto____6902 = G__6900__6901.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____6902) {
        return or__3824__auto____6902
      }else {
        return G__6900__6901.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6900__6901.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6900__6901)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6900__6901)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6906__6907 = x;
  if(G__6906__6907) {
    if(function() {
      var or__3824__auto____6908 = G__6906__6907.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____6908) {
        return or__3824__auto____6908
      }else {
        return G__6906__6907.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6906__6907.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6906__6907)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6906__6907)
  }
};
goog.provide("cljs.core.IndexedSeq");
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199550
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6909 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6910 = this;
  if(this__6910.i + 1 < this__6910.a.length) {
    return new cljs.core.IndexedSeq(this__6910.a, this__6910.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6911 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6912 = this;
  var c__6913 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6913 > 0) {
    return new cljs.core.RSeq(coll, c__6913 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6914 = this;
  var this__6915 = this;
  return cljs.core.pr_str.call(null, this__6915)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6916 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6916.a)) {
    return cljs.core.ci_reduce.call(null, this__6916.a, f, this__6916.a[this__6916.i], this__6916.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6916.a[this__6916.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6917 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6917.a)) {
    return cljs.core.ci_reduce.call(null, this__6917.a, f, start, this__6917.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6918 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6919 = this;
  return this__6919.a.length - this__6919.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6920 = this;
  return this__6920.a[this__6920.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6921 = this;
  if(this__6921.i + 1 < this__6921.a.length) {
    return new cljs.core.IndexedSeq(this__6921.a, this__6921.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6922 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6923 = this;
  var i__6924 = n + this__6923.i;
  if(i__6924 < this__6923.a.length) {
    return this__6923.a[i__6924]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6925 = this;
  var i__6926 = n + this__6925.i;
  if(i__6926 < this__6925.a.length) {
    return this__6925.a[i__6926]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6927 = this;
  return cljs.core.List.EMPTY
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__6928 = null;
  var G__6928__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6928__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6928 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6928__2.call(this, array, f);
      case 3:
        return G__6928__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6928
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6929 = null;
  var G__6929__2 = function(array, k) {
    return array[k]
  };
  var G__6929__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6929 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6929__2.call(this, array, k);
      case 3:
        return G__6929__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6929
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6930 = null;
  var G__6930__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6930__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6930 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6930__2.call(this, array, n);
      case 3:
        return G__6930__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6930
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
goog.provide("cljs.core.RSeq");
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850574
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6931 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6932 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6933 = this;
  var this__6934 = this;
  return cljs.core.pr_str.call(null, this__6934)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6935 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6936 = this;
  return this__6936.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6937 = this;
  return cljs.core._nth.call(null, this__6937.ci, this__6937.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6938 = this;
  if(this__6938.i > 0) {
    return new cljs.core.RSeq(this__6938.ci, this__6938.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6939 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6940 = this;
  return new cljs.core.RSeq(this__6940.ci, this__6940.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6941 = this;
  return this__6941.meta
};
cljs.core.RSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6942 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6942.meta)
};
cljs.core.RSeq;
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__6944 = cljs.core.next.call(null, s);
    if(!(sn__6944 == null)) {
      var G__6945 = sn__6944;
      s = G__6945;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__6946__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6947 = conj.call(null, coll, x);
          var G__6948 = cljs.core.first.call(null, xs);
          var G__6949 = cljs.core.next.call(null, xs);
          coll = G__6947;
          x = G__6948;
          xs = G__6949;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6946 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6946__delegate.call(this, coll, x, xs)
    };
    G__6946.cljs$lang$maxFixedArity = 2;
    G__6946.cljs$lang$applyTo = function(arglist__6950) {
      var coll = cljs.core.first(arglist__6950);
      var x = cljs.core.first(cljs.core.next(arglist__6950));
      var xs = cljs.core.rest(cljs.core.next(arglist__6950));
      return G__6946__delegate(coll, x, xs)
    };
    G__6946.cljs$lang$arity$variadic = G__6946__delegate;
    return G__6946
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__6953 = cljs.core.seq.call(null, coll);
  var acc__6954 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6953)) {
      return acc__6954 + cljs.core._count.call(null, s__6953)
    }else {
      var G__6955 = cljs.core.next.call(null, s__6953);
      var G__6956 = acc__6954 + 1;
      s__6953 = G__6955;
      acc__6954 = G__6956;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    while(true) {
      if(coll == null) {
        throw new Error("Index out of bounds");
      }else {
        if(n === 0) {
          if(cljs.core.seq.call(null, coll)) {
            return cljs.core.first.call(null, coll)
          }else {
            throw new Error("Index out of bounds");
          }
        }else {
          if(cljs.core.indexed_QMARK_.call(null, coll)) {
            return cljs.core._nth.call(null, coll, n)
          }else {
            if(cljs.core.seq.call(null, coll)) {
              var G__6957 = cljs.core.next.call(null, coll);
              var G__6958 = n - 1;
              coll = G__6957;
              n = G__6958;
              continue
            }else {
              if("\ufdd0'else") {
                throw new Error("Index out of bounds");
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    while(true) {
      if(coll == null) {
        return not_found
      }else {
        if(n === 0) {
          if(cljs.core.seq.call(null, coll)) {
            return cljs.core.first.call(null, coll)
          }else {
            return not_found
          }
        }else {
          if(cljs.core.indexed_QMARK_.call(null, coll)) {
            return cljs.core._nth.call(null, coll, n, not_found)
          }else {
            if(cljs.core.seq.call(null, coll)) {
              var G__6959 = cljs.core.next.call(null, coll);
              var G__6960 = n - 1;
              var G__6961 = not_found;
              coll = G__6959;
              n = G__6960;
              not_found = G__6961;
              continue
            }else {
              if("\ufdd0'else") {
                return not_found
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6968__6969 = coll;
        if(G__6968__6969) {
          if(function() {
            var or__3824__auto____6970 = G__6968__6969.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6970) {
              return or__3824__auto____6970
            }else {
              return G__6968__6969.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6968__6969.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6968__6969)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6968__6969)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6971__6972 = coll;
        if(G__6971__6972) {
          if(function() {
            var or__3824__auto____6973 = G__6971__6972.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6973) {
              return or__3824__auto____6973
            }else {
              return G__6971__6972.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6971__6972.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6971__6972)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6971__6972)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__6976__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6975 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6977 = ret__6975;
          var G__6978 = cljs.core.first.call(null, kvs);
          var G__6979 = cljs.core.second.call(null, kvs);
          var G__6980 = cljs.core.nnext.call(null, kvs);
          coll = G__6977;
          k = G__6978;
          v = G__6979;
          kvs = G__6980;
          continue
        }else {
          return ret__6975
        }
        break
      }
    };
    var G__6976 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6976__delegate.call(this, coll, k, v, kvs)
    };
    G__6976.cljs$lang$maxFixedArity = 3;
    G__6976.cljs$lang$applyTo = function(arglist__6981) {
      var coll = cljs.core.first(arglist__6981);
      var k = cljs.core.first(cljs.core.next(arglist__6981));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6981)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6981)));
      return G__6976__delegate(coll, k, v, kvs)
    };
    G__6976.cljs$lang$arity$variadic = G__6976__delegate;
    return G__6976
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__6984__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6983 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6985 = ret__6983;
          var G__6986 = cljs.core.first.call(null, ks);
          var G__6987 = cljs.core.next.call(null, ks);
          coll = G__6985;
          k = G__6986;
          ks = G__6987;
          continue
        }else {
          return ret__6983
        }
        break
      }
    };
    var G__6984 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6984__delegate.call(this, coll, k, ks)
    };
    G__6984.cljs$lang$maxFixedArity = 2;
    G__6984.cljs$lang$applyTo = function(arglist__6988) {
      var coll = cljs.core.first(arglist__6988);
      var k = cljs.core.first(cljs.core.next(arglist__6988));
      var ks = cljs.core.rest(cljs.core.next(arglist__6988));
      return G__6984__delegate(coll, k, ks)
    };
    G__6984.cljs$lang$arity$variadic = G__6984__delegate;
    return G__6984
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6992__6993 = o;
    if(G__6992__6993) {
      if(function() {
        var or__3824__auto____6994 = G__6992__6993.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____6994) {
          return or__3824__auto____6994
        }else {
          return G__6992__6993.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6992__6993.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6992__6993)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6992__6993)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__6997__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6996 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6998 = ret__6996;
          var G__6999 = cljs.core.first.call(null, ks);
          var G__7000 = cljs.core.next.call(null, ks);
          coll = G__6998;
          k = G__6999;
          ks = G__7000;
          continue
        }else {
          return ret__6996
        }
        break
      }
    };
    var G__6997 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6997__delegate.call(this, coll, k, ks)
    };
    G__6997.cljs$lang$maxFixedArity = 2;
    G__6997.cljs$lang$applyTo = function(arglist__7001) {
      var coll = cljs.core.first(arglist__7001);
      var k = cljs.core.first(cljs.core.next(arglist__7001));
      var ks = cljs.core.rest(cljs.core.next(arglist__7001));
      return G__6997__delegate(coll, k, ks)
    };
    G__6997.cljs$lang$arity$variadic = G__6997__delegate;
    return G__6997
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__7003 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__7003;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__7003
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__7005 = cljs.core.string_hash_cache[k];
  if(!(h__7005 == null)) {
    return h__7005
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____7007 = goog.isString(o);
      if(and__3822__auto____7007) {
        return check_cache
      }else {
        return and__3822__auto____7007
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7011__7012 = x;
    if(G__7011__7012) {
      if(function() {
        var or__3824__auto____7013 = G__7011__7012.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____7013) {
          return or__3824__auto____7013
        }else {
          return G__7011__7012.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__7011__7012.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7011__7012)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7011__7012)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7017__7018 = x;
    if(G__7017__7018) {
      if(function() {
        var or__3824__auto____7019 = G__7017__7018.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____7019) {
          return or__3824__auto____7019
        }else {
          return G__7017__7018.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__7017__7018.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7017__7018)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7017__7018)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__7023__7024 = x;
  if(G__7023__7024) {
    if(function() {
      var or__3824__auto____7025 = G__7023__7024.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____7025) {
        return or__3824__auto____7025
      }else {
        return G__7023__7024.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__7023__7024.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7023__7024)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7023__7024)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__7029__7030 = x;
  if(G__7029__7030) {
    if(function() {
      var or__3824__auto____7031 = G__7029__7030.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____7031) {
        return or__3824__auto____7031
      }else {
        return G__7029__7030.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__7029__7030.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7029__7030)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7029__7030)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__7035__7036 = x;
  if(G__7035__7036) {
    if(function() {
      var or__3824__auto____7037 = G__7035__7036.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____7037) {
        return or__3824__auto____7037
      }else {
        return G__7035__7036.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__7035__7036.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7035__7036)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7035__7036)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7041__7042 = x;
    if(G__7041__7042) {
      if(function() {
        var or__3824__auto____7043 = G__7041__7042.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____7043) {
          return or__3824__auto____7043
        }else {
          return G__7041__7042.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__7041__7042.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7041__7042)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7041__7042)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__7047__7048 = x;
  if(G__7047__7048) {
    if(function() {
      var or__3824__auto____7049 = G__7047__7048.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____7049) {
        return or__3824__auto____7049
      }else {
        return G__7047__7048.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__7047__7048.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7047__7048)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7047__7048)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__7053__7054 = x;
  if(G__7053__7054) {
    if(function() {
      var or__3824__auto____7055 = G__7053__7054.cljs$lang$protocol_mask$partition1$ & 512;
      if(or__3824__auto____7055) {
        return or__3824__auto____7055
      }else {
        return G__7053__7054.cljs$core$IChunkedSeq$
      }
    }()) {
      return true
    }else {
      if(!G__7053__7054.cljs$lang$protocol_mask$partition1$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7053__7054)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7053__7054)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__7056__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__7056 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7056__delegate.call(this, keyvals)
    };
    G__7056.cljs$lang$maxFixedArity = 0;
    G__7056.cljs$lang$applyTo = function(arglist__7057) {
      var keyvals = cljs.core.seq(arglist__7057);
      return G__7056__delegate(keyvals)
    };
    G__7056.cljs$lang$arity$variadic = G__7056__delegate;
    return G__7056
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__7059 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__7059.push(key)
  });
  return keys__7059
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__7063 = i;
  var j__7064 = j;
  var len__7065 = len;
  while(true) {
    if(len__7065 === 0) {
      return to
    }else {
      to[j__7064] = from[i__7063];
      var G__7066 = i__7063 + 1;
      var G__7067 = j__7064 + 1;
      var G__7068 = len__7065 - 1;
      i__7063 = G__7066;
      j__7064 = G__7067;
      len__7065 = G__7068;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__7072 = i + (len - 1);
  var j__7073 = j + (len - 1);
  var len__7074 = len;
  while(true) {
    if(len__7074 === 0) {
      return to
    }else {
      to[j__7073] = from[i__7072];
      var G__7075 = i__7072 - 1;
      var G__7076 = j__7073 - 1;
      var G__7077 = len__7074 - 1;
      i__7072 = G__7075;
      j__7073 = G__7076;
      len__7074 = G__7077;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__7081__7082 = s;
    if(G__7081__7082) {
      if(function() {
        var or__3824__auto____7083 = G__7081__7082.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7083) {
          return or__3824__auto____7083
        }else {
          return G__7081__7082.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7081__7082.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7081__7082)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7081__7082)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7087__7088 = s;
  if(G__7087__7088) {
    if(function() {
      var or__3824__auto____7089 = G__7087__7088.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7089) {
        return or__3824__auto____7089
      }else {
        return G__7087__7088.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7087__7088.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7087__7088)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7087__7088)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____7092 = goog.isString(x);
  if(and__3822__auto____7092) {
    return!function() {
      var or__3824__auto____7093 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7093) {
        return or__3824__auto____7093
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7092
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7095 = goog.isString(x);
  if(and__3822__auto____7095) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7095
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7097 = goog.isString(x);
  if(and__3822__auto____7097) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7097
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7102 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7102) {
    return or__3824__auto____7102
  }else {
    var G__7103__7104 = f;
    if(G__7103__7104) {
      if(function() {
        var or__3824__auto____7105 = G__7103__7104.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7105) {
          return or__3824__auto____7105
        }else {
          return G__7103__7104.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7103__7104.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7103__7104)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7103__7104)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7109 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7109) {
    var and__3822__auto____7110 = !isNaN(n);
    if(and__3822__auto____7110) {
      var and__3822__auto____7111 = !(n === Infinity);
      if(and__3822__auto____7111) {
        return parseFloat(n) === parseInt(n, 10)
      }else {
        return and__3822__auto____7111
      }
    }else {
      return and__3822__auto____7110
    }
  }else {
    return and__3822__auto____7109
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(function() {
    var and__3822__auto____7114 = !(coll == null);
    if(and__3822__auto____7114) {
      var and__3822__auto____7115 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7115) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7115
      }
    }else {
      return and__3822__auto____7114
    }
  }()) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7124__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7120 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7121 = more;
        while(true) {
          var x__7122 = cljs.core.first.call(null, xs__7121);
          var etc__7123 = cljs.core.next.call(null, xs__7121);
          if(cljs.core.truth_(xs__7121)) {
            if(cljs.core.contains_QMARK_.call(null, s__7120, x__7122)) {
              return false
            }else {
              var G__7125 = cljs.core.conj.call(null, s__7120, x__7122);
              var G__7126 = etc__7123;
              s__7120 = G__7125;
              xs__7121 = G__7126;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7124 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7124__delegate.call(this, x, y, more)
    };
    G__7124.cljs$lang$maxFixedArity = 2;
    G__7124.cljs$lang$applyTo = function(arglist__7127) {
      var x = cljs.core.first(arglist__7127);
      var y = cljs.core.first(cljs.core.next(arglist__7127));
      var more = cljs.core.rest(cljs.core.next(arglist__7127));
      return G__7124__delegate(x, y, more)
    };
    G__7124.cljs$lang$arity$variadic = G__7124__delegate;
    return G__7124
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__7131__7132 = x;
            if(G__7131__7132) {
              if(function() {
                var or__3824__auto____7133 = G__7131__7132.cljs$lang$protocol_mask$partition1$ & 2048;
                if(or__3824__auto____7133) {
                  return or__3824__auto____7133
                }else {
                  return G__7131__7132.cljs$core$IComparable$
                }
              }()) {
                return true
              }else {
                if(!G__7131__7132.cljs$lang$protocol_mask$partition1$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7131__7132)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7131__7132)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__7138 = cljs.core.count.call(null, xs);
    var yl__7139 = cljs.core.count.call(null, ys);
    if(xl__7138 < yl__7139) {
      return-1
    }else {
      if(xl__7138 > yl__7139) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7138, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7140 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7141 = d__7140 === 0;
        if(and__3822__auto____7141) {
          return n + 1 < len
        }else {
          return and__3822__auto____7141
        }
      }()) {
        var G__7142 = xs;
        var G__7143 = ys;
        var G__7144 = len;
        var G__7145 = n + 1;
        xs = G__7142;
        ys = G__7143;
        len = G__7144;
        n = G__7145;
        continue
      }else {
        return d__7140
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7147 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7147)) {
        return r__7147
      }else {
        if(cljs.core.truth_(r__7147)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__7149 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7149, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7149)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____7155 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7155) {
      var s__7156 = temp__3971__auto____7155;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7156), cljs.core.next.call(null, s__7156))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7157 = val;
    var coll__7158 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7158) {
        var nval__7159 = f.call(null, val__7157, cljs.core.first.call(null, coll__7158));
        if(cljs.core.reduced_QMARK_.call(null, nval__7159)) {
          return cljs.core.deref.call(null, nval__7159)
        }else {
          var G__7160 = nval__7159;
          var G__7161 = cljs.core.next.call(null, coll__7158);
          val__7157 = G__7160;
          coll__7158 = G__7161;
          continue
        }
      }else {
        return val__7157
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7163 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7163);
  return cljs.core.vec.call(null, a__7163)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7170__7171 = coll;
      if(G__7170__7171) {
        if(function() {
          var or__3824__auto____7172 = G__7170__7171.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7172) {
            return or__3824__auto____7172
          }else {
            return G__7170__7171.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7170__7171.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7170__7171)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7170__7171)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7173__7174 = coll;
      if(G__7173__7174) {
        if(function() {
          var or__3824__auto____7175 = G__7173__7174.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7175) {
            return or__3824__auto____7175
          }else {
            return G__7173__7174.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7173__7174.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7173__7174)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7173__7174)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7176__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7176 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7176__delegate.call(this, x, y, more)
    };
    G__7176.cljs$lang$maxFixedArity = 2;
    G__7176.cljs$lang$applyTo = function(arglist__7177) {
      var x = cljs.core.first(arglist__7177);
      var y = cljs.core.first(cljs.core.next(arglist__7177));
      var more = cljs.core.rest(cljs.core.next(arglist__7177));
      return G__7176__delegate(x, y, more)
    };
    G__7176.cljs$lang$arity$variadic = G__7176__delegate;
    return G__7176
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7178__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7178 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7178__delegate.call(this, x, y, more)
    };
    G__7178.cljs$lang$maxFixedArity = 2;
    G__7178.cljs$lang$applyTo = function(arglist__7179) {
      var x = cljs.core.first(arglist__7179);
      var y = cljs.core.first(cljs.core.next(arglist__7179));
      var more = cljs.core.rest(cljs.core.next(arglist__7179));
      return G__7178__delegate(x, y, more)
    };
    G__7178.cljs$lang$arity$variadic = G__7178__delegate;
    return G__7178
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7180__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7180 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7180__delegate.call(this, x, y, more)
    };
    G__7180.cljs$lang$maxFixedArity = 2;
    G__7180.cljs$lang$applyTo = function(arglist__7181) {
      var x = cljs.core.first(arglist__7181);
      var y = cljs.core.first(cljs.core.next(arglist__7181));
      var more = cljs.core.rest(cljs.core.next(arglist__7181));
      return G__7180__delegate(x, y, more)
    };
    G__7180.cljs$lang$arity$variadic = G__7180__delegate;
    return G__7180
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7182__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7182 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7182__delegate.call(this, x, y, more)
    };
    G__7182.cljs$lang$maxFixedArity = 2;
    G__7182.cljs$lang$applyTo = function(arglist__7183) {
      var x = cljs.core.first(arglist__7183);
      var y = cljs.core.first(cljs.core.next(arglist__7183));
      var more = cljs.core.rest(cljs.core.next(arglist__7183));
      return G__7182__delegate(x, y, more)
    };
    G__7182.cljs$lang$arity$variadic = G__7182__delegate;
    return G__7182
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7184__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7185 = y;
            var G__7186 = cljs.core.first.call(null, more);
            var G__7187 = cljs.core.next.call(null, more);
            x = G__7185;
            y = G__7186;
            more = G__7187;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7184 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7184__delegate.call(this, x, y, more)
    };
    G__7184.cljs$lang$maxFixedArity = 2;
    G__7184.cljs$lang$applyTo = function(arglist__7188) {
      var x = cljs.core.first(arglist__7188);
      var y = cljs.core.first(cljs.core.next(arglist__7188));
      var more = cljs.core.rest(cljs.core.next(arglist__7188));
      return G__7184__delegate(x, y, more)
    };
    G__7184.cljs$lang$arity$variadic = G__7184__delegate;
    return G__7184
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7189__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7190 = y;
            var G__7191 = cljs.core.first.call(null, more);
            var G__7192 = cljs.core.next.call(null, more);
            x = G__7190;
            y = G__7191;
            more = G__7192;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7189 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7189__delegate.call(this, x, y, more)
    };
    G__7189.cljs$lang$maxFixedArity = 2;
    G__7189.cljs$lang$applyTo = function(arglist__7193) {
      var x = cljs.core.first(arglist__7193);
      var y = cljs.core.first(cljs.core.next(arglist__7193));
      var more = cljs.core.rest(cljs.core.next(arglist__7193));
      return G__7189__delegate(x, y, more)
    };
    G__7189.cljs$lang$arity$variadic = G__7189__delegate;
    return G__7189
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7194__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7195 = y;
            var G__7196 = cljs.core.first.call(null, more);
            var G__7197 = cljs.core.next.call(null, more);
            x = G__7195;
            y = G__7196;
            more = G__7197;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7194 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7194__delegate.call(this, x, y, more)
    };
    G__7194.cljs$lang$maxFixedArity = 2;
    G__7194.cljs$lang$applyTo = function(arglist__7198) {
      var x = cljs.core.first(arglist__7198);
      var y = cljs.core.first(cljs.core.next(arglist__7198));
      var more = cljs.core.rest(cljs.core.next(arglist__7198));
      return G__7194__delegate(x, y, more)
    };
    G__7194.cljs$lang$arity$variadic = G__7194__delegate;
    return G__7194
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7199__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7200 = y;
            var G__7201 = cljs.core.first.call(null, more);
            var G__7202 = cljs.core.next.call(null, more);
            x = G__7200;
            y = G__7201;
            more = G__7202;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7199 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7199__delegate.call(this, x, y, more)
    };
    G__7199.cljs$lang$maxFixedArity = 2;
    G__7199.cljs$lang$applyTo = function(arglist__7203) {
      var x = cljs.core.first(arglist__7203);
      var y = cljs.core.first(cljs.core.next(arglist__7203));
      var more = cljs.core.rest(cljs.core.next(arglist__7203));
      return G__7199__delegate(x, y, more)
    };
    G__7199.cljs$lang$arity$variadic = G__7199__delegate;
    return G__7199
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7204__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7204 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7204__delegate.call(this, x, y, more)
    };
    G__7204.cljs$lang$maxFixedArity = 2;
    G__7204.cljs$lang$applyTo = function(arglist__7205) {
      var x = cljs.core.first(arglist__7205);
      var y = cljs.core.first(cljs.core.next(arglist__7205));
      var more = cljs.core.rest(cljs.core.next(arglist__7205));
      return G__7204__delegate(x, y, more)
    };
    G__7204.cljs$lang$arity$variadic = G__7204__delegate;
    return G__7204
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7206__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7206 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7206__delegate.call(this, x, y, more)
    };
    G__7206.cljs$lang$maxFixedArity = 2;
    G__7206.cljs$lang$applyTo = function(arglist__7207) {
      var x = cljs.core.first(arglist__7207);
      var y = cljs.core.first(cljs.core.next(arglist__7207));
      var more = cljs.core.rest(cljs.core.next(arglist__7207));
      return G__7206__delegate(x, y, more)
    };
    G__7206.cljs$lang$arity$variadic = G__7206__delegate;
    return G__7206
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7209 = n % d;
  return cljs.core.fix.call(null, (n - rem__7209) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7211 = cljs.core.quot.call(null, n, d);
  return n - d * q__7211
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7214 = v - (v >> 1 & 1431655765);
  var v__7215 = (v__7214 & 858993459) + (v__7214 >> 2 & 858993459);
  return(v__7215 + (v__7215 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7216__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7217 = y;
            var G__7218 = cljs.core.first.call(null, more);
            var G__7219 = cljs.core.next.call(null, more);
            x = G__7217;
            y = G__7218;
            more = G__7219;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7216 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7216__delegate.call(this, x, y, more)
    };
    G__7216.cljs$lang$maxFixedArity = 2;
    G__7216.cljs$lang$applyTo = function(arglist__7220) {
      var x = cljs.core.first(arglist__7220);
      var y = cljs.core.first(cljs.core.next(arglist__7220));
      var more = cljs.core.rest(cljs.core.next(arglist__7220));
      return G__7216__delegate(x, y, more)
    };
    G__7216.cljs$lang$arity$variadic = G__7216__delegate;
    return G__7216
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7224 = n;
  var xs__7225 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7226 = xs__7225;
      if(and__3822__auto____7226) {
        return n__7224 > 0
      }else {
        return and__3822__auto____7226
      }
    }())) {
      var G__7227 = n__7224 - 1;
      var G__7228 = cljs.core.next.call(null, xs__7225);
      n__7224 = G__7227;
      xs__7225 = G__7228;
      continue
    }else {
      return xs__7225
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7229__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7230 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7231 = cljs.core.next.call(null, more);
            sb = G__7230;
            more = G__7231;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7229 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7229__delegate.call(this, x, ys)
    };
    G__7229.cljs$lang$maxFixedArity = 1;
    G__7229.cljs$lang$applyTo = function(arglist__7232) {
      var x = cljs.core.first(arglist__7232);
      var ys = cljs.core.rest(arglist__7232);
      return G__7229__delegate(x, ys)
    };
    G__7229.cljs$lang$arity$variadic = G__7229__delegate;
    return G__7229
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7233__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7234 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7235 = cljs.core.next.call(null, more);
            sb = G__7234;
            more = G__7235;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7233 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7233__delegate.call(this, x, ys)
    };
    G__7233.cljs$lang$maxFixedArity = 1;
    G__7233.cljs$lang$applyTo = function(arglist__7236) {
      var x = cljs.core.first(arglist__7236);
      var ys = cljs.core.rest(arglist__7236);
      return G__7233__delegate(x, ys)
    };
    G__7233.cljs$lang$arity$variadic = G__7233__delegate;
    return G__7233
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    var args__7240 = cljs.core.map.call(null, function(x) {
      if(function() {
        var or__3824__auto____7239 = cljs.core.keyword_QMARK_.call(null, x);
        if(or__3824__auto____7239) {
          return or__3824__auto____7239
        }else {
          return cljs.core.symbol_QMARK_.call(null, x)
        }
      }()) {
        return[cljs.core.str(x)].join("")
      }else {
        return x
      }
    }, args);
    return cljs.core.apply.call(null, goog.string.format, fmt, args__7240)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7241) {
    var fmt = cljs.core.first(arglist__7241);
    var args = cljs.core.rest(arglist__7241);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7244 = cljs.core.seq.call(null, x);
    var ys__7245 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7244 == null) {
        return ys__7245 == null
      }else {
        if(ys__7245 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7244), cljs.core.first.call(null, ys__7245))) {
            var G__7246 = cljs.core.next.call(null, xs__7244);
            var G__7247 = cljs.core.next.call(null, ys__7245);
            xs__7244 = G__7246;
            ys__7245 = G__7247;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7248_SHARP_, p2__7249_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7248_SHARP_, cljs.core.hash.call(null, p2__7249_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7253 = 0;
  var s__7254 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7254) {
      var e__7255 = cljs.core.first.call(null, s__7254);
      var G__7256 = (h__7253 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7255)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7255)))) % 4503599627370496;
      var G__7257 = cljs.core.next.call(null, s__7254);
      h__7253 = G__7256;
      s__7254 = G__7257;
      continue
    }else {
      return h__7253
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7261 = 0;
  var s__7262 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7262) {
      var e__7263 = cljs.core.first.call(null, s__7262);
      var G__7264 = (h__7261 + cljs.core.hash.call(null, e__7263)) % 4503599627370496;
      var G__7265 = cljs.core.next.call(null, s__7262);
      h__7261 = G__7264;
      s__7262 = G__7265;
      continue
    }else {
      return h__7261
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7273__7274 = cljs.core.seq.call(null, fn_map);
  while(true) {
    if(G__7273__7274) {
      var vec__7275__7276 = cljs.core.first.call(null, G__7273__7274);
      var key_name__7277 = cljs.core.nth.call(null, vec__7275__7276, 0, null);
      var f__7278 = cljs.core.nth.call(null, vec__7275__7276, 1, null);
      var str_name__7279 = cljs.core.name.call(null, key_name__7277);
      obj[str_name__7279] = f__7278;
      var G__7280 = cljs.core.next.call(null, G__7273__7274);
      G__7273__7274 = G__7280;
      continue
    }else {
    }
    break
  }
  return obj
};
goog.provide("cljs.core.List");
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7281 = this;
  var h__2252__auto____7282 = this__7281.__hash;
  if(!(h__2252__auto____7282 == null)) {
    return h__2252__auto____7282
  }else {
    var h__2252__auto____7283 = cljs.core.hash_coll.call(null, coll);
    this__7281.__hash = h__2252__auto____7283;
    return h__2252__auto____7283
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7284 = this;
  if(this__7284.count === 1) {
    return null
  }else {
    return this__7284.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7285 = this;
  return new cljs.core.List(this__7285.meta, o, coll, this__7285.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7286 = this;
  var this__7287 = this;
  return cljs.core.pr_str.call(null, this__7287)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7288 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7289 = this;
  return this__7289.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7290 = this;
  return this__7290.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7291 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7292 = this;
  return this__7292.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7293 = this;
  if(this__7293.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7293.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7294 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7295 = this;
  return new cljs.core.List(meta, this__7295.first, this__7295.rest, this__7295.count, this__7295.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7296 = this;
  return this__7296.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7297 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
goog.provide("cljs.core.EmptyList");
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7298 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7299 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7300 = this;
  return new cljs.core.List(this__7300.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7301 = this;
  var this__7302 = this;
  return cljs.core.pr_str.call(null, this__7302)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7303 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7304 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7305 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7306 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7307 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7308 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7309 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7310 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7311 = this;
  return this__7311.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7312 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7316__7317 = coll;
  if(G__7316__7317) {
    if(function() {
      var or__3824__auto____7318 = G__7316__7317.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7318) {
        return or__3824__auto____7318
      }else {
        return G__7316__7317.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7316__7317.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7316__7317)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7316__7317)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__7319__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7319 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7319__delegate.call(this, x, y, z, items)
    };
    G__7319.cljs$lang$maxFixedArity = 3;
    G__7319.cljs$lang$applyTo = function(arglist__7320) {
      var x = cljs.core.first(arglist__7320);
      var y = cljs.core.first(cljs.core.next(arglist__7320));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7320)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7320)));
      return G__7319__delegate(x, y, z, items)
    };
    G__7319.cljs$lang$arity$variadic = G__7319__delegate;
    return G__7319
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
goog.provide("cljs.core.Cons");
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7321 = this;
  var h__2252__auto____7322 = this__7321.__hash;
  if(!(h__2252__auto____7322 == null)) {
    return h__2252__auto____7322
  }else {
    var h__2252__auto____7323 = cljs.core.hash_coll.call(null, coll);
    this__7321.__hash = h__2252__auto____7323;
    return h__2252__auto____7323
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7324 = this;
  if(this__7324.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7324.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7325 = this;
  return new cljs.core.Cons(null, o, coll, this__7325.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7326 = this;
  var this__7327 = this;
  return cljs.core.pr_str.call(null, this__7327)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7328 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7329 = this;
  return this__7329.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7330 = this;
  if(this__7330.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7330.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7331 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7332 = this;
  return new cljs.core.Cons(meta, this__7332.first, this__7332.rest, this__7332.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7333 = this;
  return this__7333.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7334 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7334.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7339 = coll == null;
    if(or__3824__auto____7339) {
      return or__3824__auto____7339
    }else {
      var G__7340__7341 = coll;
      if(G__7340__7341) {
        if(function() {
          var or__3824__auto____7342 = G__7340__7341.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7342) {
            return or__3824__auto____7342
          }else {
            return G__7340__7341.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7340__7341.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7340__7341)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7340__7341)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7346__7347 = x;
  if(G__7346__7347) {
    if(function() {
      var or__3824__auto____7348 = G__7346__7347.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7348) {
        return or__3824__auto____7348
      }else {
        return G__7346__7347.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7346__7347.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7346__7347)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7346__7347)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7349 = null;
  var G__7349__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7349__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7349 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7349__2.call(this, string, f);
      case 3:
        return G__7349__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7349
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7350 = null;
  var G__7350__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7350__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7350 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7350__2.call(this, string, k);
      case 3:
        return G__7350__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7350
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7351 = null;
  var G__7351__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7351__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7351 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7351__2.call(this, string, n);
      case 3:
        return G__7351__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7351
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
goog.provide("cljs.core.Keyword");
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7363 = null;
  var G__7363__2 = function(this_sym7354, coll) {
    var this__7356 = this;
    var this_sym7354__7357 = this;
    var ___7358 = this_sym7354__7357;
    if(coll == null) {
      return null
    }else {
      var strobj__7359 = coll.strobj;
      if(strobj__7359 == null) {
        return cljs.core._lookup.call(null, coll, this__7356.k, null)
      }else {
        return strobj__7359[this__7356.k]
      }
    }
  };
  var G__7363__3 = function(this_sym7355, coll, not_found) {
    var this__7356 = this;
    var this_sym7355__7360 = this;
    var ___7361 = this_sym7355__7360;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7356.k, not_found)
    }
  };
  G__7363 = function(this_sym7355, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7363__2.call(this, this_sym7355, coll);
      case 3:
        return G__7363__3.call(this, this_sym7355, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7363
}();
cljs.core.Keyword.prototype.apply = function(this_sym7352, args7353) {
  var this__7362 = this;
  return this_sym7352.call.apply(this_sym7352, [this_sym7352].concat(args7353.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7372 = null;
  var G__7372__2 = function(this_sym7366, coll) {
    var this_sym7366__7368 = this;
    var this__7369 = this_sym7366__7368;
    return cljs.core._lookup.call(null, coll, this__7369.toString(), null)
  };
  var G__7372__3 = function(this_sym7367, coll, not_found) {
    var this_sym7367__7370 = this;
    var this__7371 = this_sym7367__7370;
    return cljs.core._lookup.call(null, coll, this__7371.toString(), not_found)
  };
  G__7372 = function(this_sym7367, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7372__2.call(this, this_sym7367, coll);
      case 3:
        return G__7372__3.call(this, this_sym7367, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7372
}();
String.prototype.apply = function(this_sym7364, args7365) {
  return this_sym7364.call.apply(this_sym7364, [this_sym7364].concat(args7365.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7374 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7374
  }else {
    lazy_seq.x = x__7374.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
goog.provide("cljs.core.LazySeq");
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7375 = this;
  var h__2252__auto____7376 = this__7375.__hash;
  if(!(h__2252__auto____7376 == null)) {
    return h__2252__auto____7376
  }else {
    var h__2252__auto____7377 = cljs.core.hash_coll.call(null, coll);
    this__7375.__hash = h__2252__auto____7377;
    return h__2252__auto____7377
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7378 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7379 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7380 = this;
  var this__7381 = this;
  return cljs.core.pr_str.call(null, this__7381)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7382 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7383 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7384 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7385 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7386 = this;
  return new cljs.core.LazySeq(meta, this__7386.realized, this__7386.x, this__7386.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7387 = this;
  return this__7387.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7388 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7388.meta)
};
cljs.core.LazySeq;
goog.provide("cljs.core.ChunkBuffer");
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7389 = this;
  return this__7389.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7390 = this;
  var ___7391 = this;
  this__7390.buf[this__7390.end] = o;
  return this__7390.end = this__7390.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7392 = this;
  var ___7393 = this;
  var ret__7394 = new cljs.core.ArrayChunk(this__7392.buf, 0, this__7392.end);
  this__7392.buf = null;
  return ret__7394
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
goog.provide("cljs.core.ArrayChunk");
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7395 = this;
  return cljs.core.array_reduce.call(null, this__7395.arr, f, this__7395.arr[this__7395.off], this__7395.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7396 = this;
  return cljs.core.array_reduce.call(null, this__7396.arr, f, start, this__7396.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7397 = this;
  if(this__7397.off === this__7397.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7397.arr, this__7397.off + 1, this__7397.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7398 = this;
  return this__7398.arr[this__7398.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7399 = this;
  if(function() {
    var and__3822__auto____7400 = i >= 0;
    if(and__3822__auto____7400) {
      return i < this__7399.end - this__7399.off
    }else {
      return and__3822__auto____7400
    }
  }()) {
    return this__7399.arr[this__7399.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7401 = this;
  return this__7401.end - this__7401.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
goog.provide("cljs.core.ChunkedCons");
cljs.core.ChunkedCons = function(chunk, more, meta, __hash) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition0$ = 31850604;
  this.cljs$lang$protocol_mask$partition1$ = 1536
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7402 = this;
  var h__2252__auto____7403 = this__7402.__hash;
  if(!(h__2252__auto____7403 == null)) {
    return h__2252__auto____7403
  }else {
    var h__2252__auto____7404 = cljs.core.hash_coll.call(null, coll);
    this__7402.__hash = h__2252__auto____7404;
    return h__2252__auto____7404
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7405 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7406 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7407 = this;
  return cljs.core._nth.call(null, this__7407.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7408 = this;
  if(cljs.core._count.call(null, this__7408.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7408.chunk), this__7408.more, this__7408.meta, null)
  }else {
    if(this__7408.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7408.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7409 = this;
  if(this__7409.more == null) {
    return null
  }else {
    return this__7409.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7410 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7411 = this;
  return new cljs.core.ChunkedCons(this__7411.chunk, this__7411.more, m, this__7411.__hash)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7412 = this;
  return this__7412.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7413 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7413.meta)
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7414 = this;
  return this__7414.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7415 = this;
  if(this__7415.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7415.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7419__7420 = s;
    if(G__7419__7420) {
      if(function() {
        var or__3824__auto____7421 = G__7419__7420.cljs$lang$protocol_mask$partition1$ & 1024;
        if(or__3824__auto____7421) {
          return or__3824__auto____7421
        }else {
          return G__7419__7420.cljs$core$IChunkedNext$
        }
      }()) {
        return true
      }else {
        if(!G__7419__7420.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7419__7420)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7419__7420)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7424 = [];
  var s__7425 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7425)) {
      ary__7424.push(cljs.core.first.call(null, s__7425));
      var G__7426 = cljs.core.next.call(null, s__7425);
      s__7425 = G__7426;
      continue
    }else {
      return ary__7424
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7430 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7431 = 0;
  var xs__7432 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7432) {
      ret__7430[i__7431] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7432));
      var G__7433 = i__7431 + 1;
      var G__7434 = cljs.core.next.call(null, xs__7432);
      i__7431 = G__7433;
      xs__7432 = G__7434;
      continue
    }else {
    }
    break
  }
  return ret__7430
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__7442 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7443 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7444 = 0;
      var s__7445 = s__7443;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7446 = s__7445;
          if(and__3822__auto____7446) {
            return i__7444 < size
          }else {
            return and__3822__auto____7446
          }
        }())) {
          a__7442[i__7444] = cljs.core.first.call(null, s__7445);
          var G__7449 = i__7444 + 1;
          var G__7450 = cljs.core.next.call(null, s__7445);
          i__7444 = G__7449;
          s__7445 = G__7450;
          continue
        }else {
          return a__7442
        }
        break
      }
    }else {
      var n__2598__auto____7447 = size;
      var i__7448 = 0;
      while(true) {
        if(i__7448 < n__2598__auto____7447) {
          a__7442[i__7448] = init_val_or_seq;
          var G__7451 = i__7448 + 1;
          i__7448 = G__7451;
          continue
        }else {
        }
        break
      }
      return a__7442
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__7459 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7460 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7461 = 0;
      var s__7462 = s__7460;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7463 = s__7462;
          if(and__3822__auto____7463) {
            return i__7461 < size
          }else {
            return and__3822__auto____7463
          }
        }())) {
          a__7459[i__7461] = cljs.core.first.call(null, s__7462);
          var G__7466 = i__7461 + 1;
          var G__7467 = cljs.core.next.call(null, s__7462);
          i__7461 = G__7466;
          s__7462 = G__7467;
          continue
        }else {
          return a__7459
        }
        break
      }
    }else {
      var n__2598__auto____7464 = size;
      var i__7465 = 0;
      while(true) {
        if(i__7465 < n__2598__auto____7464) {
          a__7459[i__7465] = init_val_or_seq;
          var G__7468 = i__7465 + 1;
          i__7465 = G__7468;
          continue
        }else {
        }
        break
      }
      return a__7459
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7476 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7477 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7478 = 0;
      var s__7479 = s__7477;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7480 = s__7479;
          if(and__3822__auto____7480) {
            return i__7478 < size
          }else {
            return and__3822__auto____7480
          }
        }())) {
          a__7476[i__7478] = cljs.core.first.call(null, s__7479);
          var G__7483 = i__7478 + 1;
          var G__7484 = cljs.core.next.call(null, s__7479);
          i__7478 = G__7483;
          s__7479 = G__7484;
          continue
        }else {
          return a__7476
        }
        break
      }
    }else {
      var n__2598__auto____7481 = size;
      var i__7482 = 0;
      while(true) {
        if(i__7482 < n__2598__auto____7481) {
          a__7476[i__7482] = init_val_or_seq;
          var G__7485 = i__7482 + 1;
          i__7482 = G__7485;
          continue
        }else {
        }
        break
      }
      return a__7476
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__7490 = s;
    var i__7491 = n;
    var sum__7492 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7493 = i__7491 > 0;
        if(and__3822__auto____7493) {
          return cljs.core.seq.call(null, s__7490)
        }else {
          return and__3822__auto____7493
        }
      }())) {
        var G__7494 = cljs.core.next.call(null, s__7490);
        var G__7495 = i__7491 - 1;
        var G__7496 = sum__7492 + 1;
        s__7490 = G__7494;
        i__7491 = G__7495;
        sum__7492 = G__7496;
        continue
      }else {
        return sum__7492
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7501 = cljs.core.seq.call(null, x);
      if(s__7501) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7501)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7501), concat.call(null, cljs.core.chunk_rest.call(null, s__7501), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7501), concat.call(null, cljs.core.rest.call(null, s__7501), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7505__delegate = function(x, y, zs) {
      var cat__7504 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7503 = cljs.core.seq.call(null, xys);
          if(xys__7503) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7503)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7503), cat.call(null, cljs.core.chunk_rest.call(null, xys__7503), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7503), cat.call(null, cljs.core.rest.call(null, xys__7503), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7504.call(null, concat.call(null, x, y), zs)
    };
    var G__7505 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7505__delegate.call(this, x, y, zs)
    };
    G__7505.cljs$lang$maxFixedArity = 2;
    G__7505.cljs$lang$applyTo = function(arglist__7506) {
      var x = cljs.core.first(arglist__7506);
      var y = cljs.core.first(cljs.core.next(arglist__7506));
      var zs = cljs.core.rest(cljs.core.next(arglist__7506));
      return G__7505__delegate(x, y, zs)
    };
    G__7505.cljs$lang$arity$variadic = G__7505__delegate;
    return G__7505
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__7507__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7507 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7507__delegate.call(this, a, b, c, d, more)
    };
    G__7507.cljs$lang$maxFixedArity = 4;
    G__7507.cljs$lang$applyTo = function(arglist__7508) {
      var a = cljs.core.first(arglist__7508);
      var b = cljs.core.first(cljs.core.next(arglist__7508));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7508)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7508))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7508))));
      return G__7507__delegate(a, b, c, d, more)
    };
    G__7507.cljs$lang$arity$variadic = G__7507__delegate;
    return G__7507
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7550 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7551 = cljs.core._first.call(null, args__7550);
    var args__7552 = cljs.core._rest.call(null, args__7550);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7551)
      }else {
        return f.call(null, a__7551)
      }
    }else {
      var b__7553 = cljs.core._first.call(null, args__7552);
      var args__7554 = cljs.core._rest.call(null, args__7552);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7551, b__7553)
        }else {
          return f.call(null, a__7551, b__7553)
        }
      }else {
        var c__7555 = cljs.core._first.call(null, args__7554);
        var args__7556 = cljs.core._rest.call(null, args__7554);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7551, b__7553, c__7555)
          }else {
            return f.call(null, a__7551, b__7553, c__7555)
          }
        }else {
          var d__7557 = cljs.core._first.call(null, args__7556);
          var args__7558 = cljs.core._rest.call(null, args__7556);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7551, b__7553, c__7555, d__7557)
            }else {
              return f.call(null, a__7551, b__7553, c__7555, d__7557)
            }
          }else {
            var e__7559 = cljs.core._first.call(null, args__7558);
            var args__7560 = cljs.core._rest.call(null, args__7558);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7551, b__7553, c__7555, d__7557, e__7559)
              }else {
                return f.call(null, a__7551, b__7553, c__7555, d__7557, e__7559)
              }
            }else {
              var f__7561 = cljs.core._first.call(null, args__7560);
              var args__7562 = cljs.core._rest.call(null, args__7560);
              if(argc === 6) {
                if(f__7561.cljs$lang$arity$6) {
                  return f__7561.cljs$lang$arity$6(a__7551, b__7553, c__7555, d__7557, e__7559, f__7561)
                }else {
                  return f__7561.call(null, a__7551, b__7553, c__7555, d__7557, e__7559, f__7561)
                }
              }else {
                var g__7563 = cljs.core._first.call(null, args__7562);
                var args__7564 = cljs.core._rest.call(null, args__7562);
                if(argc === 7) {
                  if(f__7561.cljs$lang$arity$7) {
                    return f__7561.cljs$lang$arity$7(a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563)
                  }else {
                    return f__7561.call(null, a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563)
                  }
                }else {
                  var h__7565 = cljs.core._first.call(null, args__7564);
                  var args__7566 = cljs.core._rest.call(null, args__7564);
                  if(argc === 8) {
                    if(f__7561.cljs$lang$arity$8) {
                      return f__7561.cljs$lang$arity$8(a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565)
                    }else {
                      return f__7561.call(null, a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565)
                    }
                  }else {
                    var i__7567 = cljs.core._first.call(null, args__7566);
                    var args__7568 = cljs.core._rest.call(null, args__7566);
                    if(argc === 9) {
                      if(f__7561.cljs$lang$arity$9) {
                        return f__7561.cljs$lang$arity$9(a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567)
                      }else {
                        return f__7561.call(null, a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567)
                      }
                    }else {
                      var j__7569 = cljs.core._first.call(null, args__7568);
                      var args__7570 = cljs.core._rest.call(null, args__7568);
                      if(argc === 10) {
                        if(f__7561.cljs$lang$arity$10) {
                          return f__7561.cljs$lang$arity$10(a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569)
                        }else {
                          return f__7561.call(null, a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569)
                        }
                      }else {
                        var k__7571 = cljs.core._first.call(null, args__7570);
                        var args__7572 = cljs.core._rest.call(null, args__7570);
                        if(argc === 11) {
                          if(f__7561.cljs$lang$arity$11) {
                            return f__7561.cljs$lang$arity$11(a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571)
                          }else {
                            return f__7561.call(null, a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571)
                          }
                        }else {
                          var l__7573 = cljs.core._first.call(null, args__7572);
                          var args__7574 = cljs.core._rest.call(null, args__7572);
                          if(argc === 12) {
                            if(f__7561.cljs$lang$arity$12) {
                              return f__7561.cljs$lang$arity$12(a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573)
                            }else {
                              return f__7561.call(null, a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573)
                            }
                          }else {
                            var m__7575 = cljs.core._first.call(null, args__7574);
                            var args__7576 = cljs.core._rest.call(null, args__7574);
                            if(argc === 13) {
                              if(f__7561.cljs$lang$arity$13) {
                                return f__7561.cljs$lang$arity$13(a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573, m__7575)
                              }else {
                                return f__7561.call(null, a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573, m__7575)
                              }
                            }else {
                              var n__7577 = cljs.core._first.call(null, args__7576);
                              var args__7578 = cljs.core._rest.call(null, args__7576);
                              if(argc === 14) {
                                if(f__7561.cljs$lang$arity$14) {
                                  return f__7561.cljs$lang$arity$14(a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573, m__7575, n__7577)
                                }else {
                                  return f__7561.call(null, a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573, m__7575, n__7577)
                                }
                              }else {
                                var o__7579 = cljs.core._first.call(null, args__7578);
                                var args__7580 = cljs.core._rest.call(null, args__7578);
                                if(argc === 15) {
                                  if(f__7561.cljs$lang$arity$15) {
                                    return f__7561.cljs$lang$arity$15(a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573, m__7575, n__7577, o__7579)
                                  }else {
                                    return f__7561.call(null, a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573, m__7575, n__7577, o__7579)
                                  }
                                }else {
                                  var p__7581 = cljs.core._first.call(null, args__7580);
                                  var args__7582 = cljs.core._rest.call(null, args__7580);
                                  if(argc === 16) {
                                    if(f__7561.cljs$lang$arity$16) {
                                      return f__7561.cljs$lang$arity$16(a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573, m__7575, n__7577, o__7579, p__7581)
                                    }else {
                                      return f__7561.call(null, a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573, m__7575, n__7577, o__7579, p__7581)
                                    }
                                  }else {
                                    var q__7583 = cljs.core._first.call(null, args__7582);
                                    var args__7584 = cljs.core._rest.call(null, args__7582);
                                    if(argc === 17) {
                                      if(f__7561.cljs$lang$arity$17) {
                                        return f__7561.cljs$lang$arity$17(a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573, m__7575, n__7577, o__7579, p__7581, q__7583)
                                      }else {
                                        return f__7561.call(null, a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573, m__7575, n__7577, o__7579, p__7581, q__7583)
                                      }
                                    }else {
                                      var r__7585 = cljs.core._first.call(null, args__7584);
                                      var args__7586 = cljs.core._rest.call(null, args__7584);
                                      if(argc === 18) {
                                        if(f__7561.cljs$lang$arity$18) {
                                          return f__7561.cljs$lang$arity$18(a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573, m__7575, n__7577, o__7579, p__7581, q__7583, r__7585)
                                        }else {
                                          return f__7561.call(null, a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573, m__7575, n__7577, o__7579, p__7581, q__7583, r__7585)
                                        }
                                      }else {
                                        var s__7587 = cljs.core._first.call(null, args__7586);
                                        var args__7588 = cljs.core._rest.call(null, args__7586);
                                        if(argc === 19) {
                                          if(f__7561.cljs$lang$arity$19) {
                                            return f__7561.cljs$lang$arity$19(a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573, m__7575, n__7577, o__7579, p__7581, q__7583, r__7585, s__7587)
                                          }else {
                                            return f__7561.call(null, a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573, m__7575, n__7577, o__7579, p__7581, q__7583, r__7585, s__7587)
                                          }
                                        }else {
                                          var t__7589 = cljs.core._first.call(null, args__7588);
                                          var args__7590 = cljs.core._rest.call(null, args__7588);
                                          if(argc === 20) {
                                            if(f__7561.cljs$lang$arity$20) {
                                              return f__7561.cljs$lang$arity$20(a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573, m__7575, n__7577, o__7579, p__7581, q__7583, r__7585, s__7587, t__7589)
                                            }else {
                                              return f__7561.call(null, a__7551, b__7553, c__7555, d__7557, e__7559, f__7561, g__7563, h__7565, i__7567, j__7569, k__7571, l__7573, m__7575, n__7577, o__7579, p__7581, q__7583, r__7585, s__7587, t__7589)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7605 = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc__7606 = cljs.core.bounded_count.call(null, args, fixed_arity__7605 + 1);
      if(bc__7606 <= fixed_arity__7605) {
        return cljs.core.apply_to.call(null, f, bc__7606, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7607 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7608 = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc__7609 = cljs.core.bounded_count.call(null, arglist__7607, fixed_arity__7608 + 1);
      if(bc__7609 <= fixed_arity__7608) {
        return cljs.core.apply_to.call(null, f, bc__7609, arglist__7607)
      }else {
        return f.cljs$lang$applyTo(arglist__7607)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7607))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7610 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7611 = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc__7612 = cljs.core.bounded_count.call(null, arglist__7610, fixed_arity__7611 + 1);
      if(bc__7612 <= fixed_arity__7611) {
        return cljs.core.apply_to.call(null, f, bc__7612, arglist__7610)
      }else {
        return f.cljs$lang$applyTo(arglist__7610)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7610))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7613 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7614 = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc__7615 = cljs.core.bounded_count.call(null, arglist__7613, fixed_arity__7614 + 1);
      if(bc__7615 <= fixed_arity__7614) {
        return cljs.core.apply_to.call(null, f, bc__7615, arglist__7613)
      }else {
        return f.cljs$lang$applyTo(arglist__7613)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7613))
    }
  };
  var apply__6 = function() {
    var G__7619__delegate = function(f, a, b, c, d, args) {
      var arglist__7616 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7617 = f.cljs$lang$maxFixedArity;
      if(f.cljs$lang$applyTo) {
        var bc__7618 = cljs.core.bounded_count.call(null, arglist__7616, fixed_arity__7617 + 1);
        if(bc__7618 <= fixed_arity__7617) {
          return cljs.core.apply_to.call(null, f, bc__7618, arglist__7616)
        }else {
          return f.cljs$lang$applyTo(arglist__7616)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7616))
      }
    };
    var G__7619 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7619__delegate.call(this, f, a, b, c, d, args)
    };
    G__7619.cljs$lang$maxFixedArity = 5;
    G__7619.cljs$lang$applyTo = function(arglist__7620) {
      var f = cljs.core.first(arglist__7620);
      var a = cljs.core.first(cljs.core.next(arglist__7620));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7620)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7620))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7620)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7620)))));
      return G__7619__delegate(f, a, b, c, d, args)
    };
    G__7619.cljs$lang$arity$variadic = G__7619__delegate;
    return G__7619
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7621) {
    var obj = cljs.core.first(arglist__7621);
    var f = cljs.core.first(cljs.core.next(arglist__7621));
    var args = cljs.core.rest(cljs.core.next(arglist__7621));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__7622__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7622 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7622__delegate.call(this, x, y, more)
    };
    G__7622.cljs$lang$maxFixedArity = 2;
    G__7622.cljs$lang$applyTo = function(arglist__7623) {
      var x = cljs.core.first(arglist__7623);
      var y = cljs.core.first(cljs.core.next(arglist__7623));
      var more = cljs.core.rest(cljs.core.next(arglist__7623));
      return G__7622__delegate(x, y, more)
    };
    G__7622.cljs$lang$arity$variadic = G__7622__delegate;
    return G__7622
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7624 = pred;
        var G__7625 = cljs.core.next.call(null, coll);
        pred = G__7624;
        coll = G__7625;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____7627 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____7627)) {
        return or__3824__auto____7627
      }else {
        var G__7628 = pred;
        var G__7629 = cljs.core.next.call(null, coll);
        pred = G__7628;
        coll = G__7629;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7630 = null;
    var G__7630__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7630__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7630__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7630__3 = function() {
      var G__7631__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7631 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7631__delegate.call(this, x, y, zs)
      };
      G__7631.cljs$lang$maxFixedArity = 2;
      G__7631.cljs$lang$applyTo = function(arglist__7632) {
        var x = cljs.core.first(arglist__7632);
        var y = cljs.core.first(cljs.core.next(arglist__7632));
        var zs = cljs.core.rest(cljs.core.next(arglist__7632));
        return G__7631__delegate(x, y, zs)
      };
      G__7631.cljs$lang$arity$variadic = G__7631__delegate;
      return G__7631
    }();
    G__7630 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7630__0.call(this);
        case 1:
          return G__7630__1.call(this, x);
        case 2:
          return G__7630__2.call(this, x, y);
        default:
          return G__7630__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7630.cljs$lang$maxFixedArity = 2;
    G__7630.cljs$lang$applyTo = G__7630__3.cljs$lang$applyTo;
    return G__7630
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7633__delegate = function(args) {
      return x
    };
    var G__7633 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7633__delegate.call(this, args)
    };
    G__7633.cljs$lang$maxFixedArity = 0;
    G__7633.cljs$lang$applyTo = function(arglist__7634) {
      var args = cljs.core.seq(arglist__7634);
      return G__7633__delegate(args)
    };
    G__7633.cljs$lang$arity$variadic = G__7633__delegate;
    return G__7633
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__7641 = null;
      var G__7641__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7641__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7641__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7641__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7641__4 = function() {
        var G__7642__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7642 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7642__delegate.call(this, x, y, z, args)
        };
        G__7642.cljs$lang$maxFixedArity = 3;
        G__7642.cljs$lang$applyTo = function(arglist__7643) {
          var x = cljs.core.first(arglist__7643);
          var y = cljs.core.first(cljs.core.next(arglist__7643));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7643)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7643)));
          return G__7642__delegate(x, y, z, args)
        };
        G__7642.cljs$lang$arity$variadic = G__7642__delegate;
        return G__7642
      }();
      G__7641 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7641__0.call(this);
          case 1:
            return G__7641__1.call(this, x);
          case 2:
            return G__7641__2.call(this, x, y);
          case 3:
            return G__7641__3.call(this, x, y, z);
          default:
            return G__7641__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7641.cljs$lang$maxFixedArity = 3;
      G__7641.cljs$lang$applyTo = G__7641__4.cljs$lang$applyTo;
      return G__7641
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7644 = null;
      var G__7644__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7644__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7644__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7644__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7644__4 = function() {
        var G__7645__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7645 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7645__delegate.call(this, x, y, z, args)
        };
        G__7645.cljs$lang$maxFixedArity = 3;
        G__7645.cljs$lang$applyTo = function(arglist__7646) {
          var x = cljs.core.first(arglist__7646);
          var y = cljs.core.first(cljs.core.next(arglist__7646));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7646)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7646)));
          return G__7645__delegate(x, y, z, args)
        };
        G__7645.cljs$lang$arity$variadic = G__7645__delegate;
        return G__7645
      }();
      G__7644 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7644__0.call(this);
          case 1:
            return G__7644__1.call(this, x);
          case 2:
            return G__7644__2.call(this, x, y);
          case 3:
            return G__7644__3.call(this, x, y, z);
          default:
            return G__7644__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7644.cljs$lang$maxFixedArity = 3;
      G__7644.cljs$lang$applyTo = G__7644__4.cljs$lang$applyTo;
      return G__7644
    }()
  };
  var comp__4 = function() {
    var G__7647__delegate = function(f1, f2, f3, fs) {
      var fs__7638 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7648__delegate = function(args) {
          var ret__7639 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7638), args);
          var fs__7640 = cljs.core.next.call(null, fs__7638);
          while(true) {
            if(fs__7640) {
              var G__7649 = cljs.core.first.call(null, fs__7640).call(null, ret__7639);
              var G__7650 = cljs.core.next.call(null, fs__7640);
              ret__7639 = G__7649;
              fs__7640 = G__7650;
              continue
            }else {
              return ret__7639
            }
            break
          }
        };
        var G__7648 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7648__delegate.call(this, args)
        };
        G__7648.cljs$lang$maxFixedArity = 0;
        G__7648.cljs$lang$applyTo = function(arglist__7651) {
          var args = cljs.core.seq(arglist__7651);
          return G__7648__delegate(args)
        };
        G__7648.cljs$lang$arity$variadic = G__7648__delegate;
        return G__7648
      }()
    };
    var G__7647 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7647__delegate.call(this, f1, f2, f3, fs)
    };
    G__7647.cljs$lang$maxFixedArity = 3;
    G__7647.cljs$lang$applyTo = function(arglist__7652) {
      var f1 = cljs.core.first(arglist__7652);
      var f2 = cljs.core.first(cljs.core.next(arglist__7652));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7652)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7652)));
      return G__7647__delegate(f1, f2, f3, fs)
    };
    G__7647.cljs$lang$arity$variadic = G__7647__delegate;
    return G__7647
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7653__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7653 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7653__delegate.call(this, args)
      };
      G__7653.cljs$lang$maxFixedArity = 0;
      G__7653.cljs$lang$applyTo = function(arglist__7654) {
        var args = cljs.core.seq(arglist__7654);
        return G__7653__delegate(args)
      };
      G__7653.cljs$lang$arity$variadic = G__7653__delegate;
      return G__7653
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7655__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7655 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7655__delegate.call(this, args)
      };
      G__7655.cljs$lang$maxFixedArity = 0;
      G__7655.cljs$lang$applyTo = function(arglist__7656) {
        var args = cljs.core.seq(arglist__7656);
        return G__7655__delegate(args)
      };
      G__7655.cljs$lang$arity$variadic = G__7655__delegate;
      return G__7655
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7657__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7657 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7657__delegate.call(this, args)
      };
      G__7657.cljs$lang$maxFixedArity = 0;
      G__7657.cljs$lang$applyTo = function(arglist__7658) {
        var args = cljs.core.seq(arglist__7658);
        return G__7657__delegate(args)
      };
      G__7657.cljs$lang$arity$variadic = G__7657__delegate;
      return G__7657
    }()
  };
  var partial__5 = function() {
    var G__7659__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7660__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7660 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7660__delegate.call(this, args)
        };
        G__7660.cljs$lang$maxFixedArity = 0;
        G__7660.cljs$lang$applyTo = function(arglist__7661) {
          var args = cljs.core.seq(arglist__7661);
          return G__7660__delegate(args)
        };
        G__7660.cljs$lang$arity$variadic = G__7660__delegate;
        return G__7660
      }()
    };
    var G__7659 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7659__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7659.cljs$lang$maxFixedArity = 4;
    G__7659.cljs$lang$applyTo = function(arglist__7662) {
      var f = cljs.core.first(arglist__7662);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7662));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7662)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7662))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7662))));
      return G__7659__delegate(f, arg1, arg2, arg3, more)
    };
    G__7659.cljs$lang$arity$variadic = G__7659__delegate;
    return G__7659
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7663 = null;
      var G__7663__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7663__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7663__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7663__4 = function() {
        var G__7664__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7664 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7664__delegate.call(this, a, b, c, ds)
        };
        G__7664.cljs$lang$maxFixedArity = 3;
        G__7664.cljs$lang$applyTo = function(arglist__7665) {
          var a = cljs.core.first(arglist__7665);
          var b = cljs.core.first(cljs.core.next(arglist__7665));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7665)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7665)));
          return G__7664__delegate(a, b, c, ds)
        };
        G__7664.cljs$lang$arity$variadic = G__7664__delegate;
        return G__7664
      }();
      G__7663 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7663__1.call(this, a);
          case 2:
            return G__7663__2.call(this, a, b);
          case 3:
            return G__7663__3.call(this, a, b, c);
          default:
            return G__7663__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7663.cljs$lang$maxFixedArity = 3;
      G__7663.cljs$lang$applyTo = G__7663__4.cljs$lang$applyTo;
      return G__7663
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7666 = null;
      var G__7666__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7666__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7666__4 = function() {
        var G__7667__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7667 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7667__delegate.call(this, a, b, c, ds)
        };
        G__7667.cljs$lang$maxFixedArity = 3;
        G__7667.cljs$lang$applyTo = function(arglist__7668) {
          var a = cljs.core.first(arglist__7668);
          var b = cljs.core.first(cljs.core.next(arglist__7668));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7668)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7668)));
          return G__7667__delegate(a, b, c, ds)
        };
        G__7667.cljs$lang$arity$variadic = G__7667__delegate;
        return G__7667
      }();
      G__7666 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7666__2.call(this, a, b);
          case 3:
            return G__7666__3.call(this, a, b, c);
          default:
            return G__7666__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7666.cljs$lang$maxFixedArity = 3;
      G__7666.cljs$lang$applyTo = G__7666__4.cljs$lang$applyTo;
      return G__7666
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7669 = null;
      var G__7669__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7669__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7669__4 = function() {
        var G__7670__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7670 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7670__delegate.call(this, a, b, c, ds)
        };
        G__7670.cljs$lang$maxFixedArity = 3;
        G__7670.cljs$lang$applyTo = function(arglist__7671) {
          var a = cljs.core.first(arglist__7671);
          var b = cljs.core.first(cljs.core.next(arglist__7671));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7671)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7671)));
          return G__7670__delegate(a, b, c, ds)
        };
        G__7670.cljs$lang$arity$variadic = G__7670__delegate;
        return G__7670
      }();
      G__7669 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7669__2.call(this, a, b);
          case 3:
            return G__7669__3.call(this, a, b, c);
          default:
            return G__7669__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7669.cljs$lang$maxFixedArity = 3;
      G__7669.cljs$lang$applyTo = G__7669__4.cljs$lang$applyTo;
      return G__7669
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__7687 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7695 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7695) {
        var s__7696 = temp__3974__auto____7695;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7696)) {
          var c__7697 = cljs.core.chunk_first.call(null, s__7696);
          var size__7698 = cljs.core.count.call(null, c__7697);
          var b__7699 = cljs.core.chunk_buffer.call(null, size__7698);
          var n__2598__auto____7700 = size__7698;
          var i__7701 = 0;
          while(true) {
            if(i__7701 < n__2598__auto____7700) {
              cljs.core.chunk_append.call(null, b__7699, f.call(null, idx + i__7701, cljs.core._nth.call(null, c__7697, i__7701)));
              var G__7702 = i__7701 + 1;
              i__7701 = G__7702;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7699), mapi.call(null, idx + size__7698, cljs.core.chunk_rest.call(null, s__7696)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7696)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7696)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7687.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____7712 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____7712) {
      var s__7713 = temp__3974__auto____7712;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7713)) {
        var c__7714 = cljs.core.chunk_first.call(null, s__7713);
        var size__7715 = cljs.core.count.call(null, c__7714);
        var b__7716 = cljs.core.chunk_buffer.call(null, size__7715);
        var n__2598__auto____7717 = size__7715;
        var i__7718 = 0;
        while(true) {
          if(i__7718 < n__2598__auto____7717) {
            var x__7719 = f.call(null, cljs.core._nth.call(null, c__7714, i__7718));
            if(x__7719 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7716, x__7719)
            }
            var G__7721 = i__7718 + 1;
            i__7718 = G__7721;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7716), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7713)))
      }else {
        var x__7720 = f.call(null, cljs.core.first.call(null, s__7713));
        if(x__7720 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7713))
        }else {
          return cljs.core.cons.call(null, x__7720, keep.call(null, f, cljs.core.rest.call(null, s__7713)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7747 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7757 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7757) {
        var s__7758 = temp__3974__auto____7757;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7758)) {
          var c__7759 = cljs.core.chunk_first.call(null, s__7758);
          var size__7760 = cljs.core.count.call(null, c__7759);
          var b__7761 = cljs.core.chunk_buffer.call(null, size__7760);
          var n__2598__auto____7762 = size__7760;
          var i__7763 = 0;
          while(true) {
            if(i__7763 < n__2598__auto____7762) {
              var x__7764 = f.call(null, idx + i__7763, cljs.core._nth.call(null, c__7759, i__7763));
              if(x__7764 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7761, x__7764)
              }
              var G__7766 = i__7763 + 1;
              i__7763 = G__7766;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7761), keepi.call(null, idx + size__7760, cljs.core.chunk_rest.call(null, s__7758)))
        }else {
          var x__7765 = f.call(null, idx, cljs.core.first.call(null, s__7758));
          if(x__7765 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7758))
          }else {
            return cljs.core.cons.call(null, x__7765, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7758)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7747.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7852 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7852)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____7852
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7853 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7853)) {
            var and__3822__auto____7854 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7854)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____7854
            }
          }else {
            return and__3822__auto____7853
          }
        }())
      };
      var ep1__4 = function() {
        var G__7923__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7855 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7855)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____7855
            }
          }())
        };
        var G__7923 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7923__delegate.call(this, x, y, z, args)
        };
        G__7923.cljs$lang$maxFixedArity = 3;
        G__7923.cljs$lang$applyTo = function(arglist__7924) {
          var x = cljs.core.first(arglist__7924);
          var y = cljs.core.first(cljs.core.next(arglist__7924));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7924)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7924)));
          return G__7923__delegate(x, y, z, args)
        };
        G__7923.cljs$lang$arity$variadic = G__7923__delegate;
        return G__7923
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7867 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7867)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____7867
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7868 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7868)) {
            var and__3822__auto____7869 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7869)) {
              var and__3822__auto____7870 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7870)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____7870
              }
            }else {
              return and__3822__auto____7869
            }
          }else {
            return and__3822__auto____7868
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7871 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7871)) {
            var and__3822__auto____7872 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7872)) {
              var and__3822__auto____7873 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____7873)) {
                var and__3822__auto____7874 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____7874)) {
                  var and__3822__auto____7875 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7875)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____7875
                  }
                }else {
                  return and__3822__auto____7874
                }
              }else {
                return and__3822__auto____7873
              }
            }else {
              return and__3822__auto____7872
            }
          }else {
            return and__3822__auto____7871
          }
        }())
      };
      var ep2__4 = function() {
        var G__7925__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7876 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7876)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7722_SHARP_) {
                var and__3822__auto____7877 = p1.call(null, p1__7722_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7877)) {
                  return p2.call(null, p1__7722_SHARP_)
                }else {
                  return and__3822__auto____7877
                }
              }, args)
            }else {
              return and__3822__auto____7876
            }
          }())
        };
        var G__7925 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7925__delegate.call(this, x, y, z, args)
        };
        G__7925.cljs$lang$maxFixedArity = 3;
        G__7925.cljs$lang$applyTo = function(arglist__7926) {
          var x = cljs.core.first(arglist__7926);
          var y = cljs.core.first(cljs.core.next(arglist__7926));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7926)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7926)));
          return G__7925__delegate(x, y, z, args)
        };
        G__7925.cljs$lang$arity$variadic = G__7925__delegate;
        return G__7925
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7896 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7896)) {
            var and__3822__auto____7897 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7897)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____7897
            }
          }else {
            return and__3822__auto____7896
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7898 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7898)) {
            var and__3822__auto____7899 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7899)) {
              var and__3822__auto____7900 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7900)) {
                var and__3822__auto____7901 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7901)) {
                  var and__3822__auto____7902 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7902)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____7902
                  }
                }else {
                  return and__3822__auto____7901
                }
              }else {
                return and__3822__auto____7900
              }
            }else {
              return and__3822__auto____7899
            }
          }else {
            return and__3822__auto____7898
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7903 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7903)) {
            var and__3822__auto____7904 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7904)) {
              var and__3822__auto____7905 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7905)) {
                var and__3822__auto____7906 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7906)) {
                  var and__3822__auto____7907 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7907)) {
                    var and__3822__auto____7908 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____7908)) {
                      var and__3822__auto____7909 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____7909)) {
                        var and__3822__auto____7910 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____7910)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____7910
                        }
                      }else {
                        return and__3822__auto____7909
                      }
                    }else {
                      return and__3822__auto____7908
                    }
                  }else {
                    return and__3822__auto____7907
                  }
                }else {
                  return and__3822__auto____7906
                }
              }else {
                return and__3822__auto____7905
              }
            }else {
              return and__3822__auto____7904
            }
          }else {
            return and__3822__auto____7903
          }
        }())
      };
      var ep3__4 = function() {
        var G__7927__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7911 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7911)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7723_SHARP_) {
                var and__3822__auto____7912 = p1.call(null, p1__7723_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7912)) {
                  var and__3822__auto____7913 = p2.call(null, p1__7723_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____7913)) {
                    return p3.call(null, p1__7723_SHARP_)
                  }else {
                    return and__3822__auto____7913
                  }
                }else {
                  return and__3822__auto____7912
                }
              }, args)
            }else {
              return and__3822__auto____7911
            }
          }())
        };
        var G__7927 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7927__delegate.call(this, x, y, z, args)
        };
        G__7927.cljs$lang$maxFixedArity = 3;
        G__7927.cljs$lang$applyTo = function(arglist__7928) {
          var x = cljs.core.first(arglist__7928);
          var y = cljs.core.first(cljs.core.next(arglist__7928));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7928)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7928)));
          return G__7927__delegate(x, y, z, args)
        };
        G__7927.cljs$lang$arity$variadic = G__7927__delegate;
        return G__7927
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__7929__delegate = function(p1, p2, p3, ps) {
      var ps__7914 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7724_SHARP_) {
            return p1__7724_SHARP_.call(null, x)
          }, ps__7914)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7725_SHARP_) {
            var and__3822__auto____7919 = p1__7725_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7919)) {
              return p1__7725_SHARP_.call(null, y)
            }else {
              return and__3822__auto____7919
            }
          }, ps__7914)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7726_SHARP_) {
            var and__3822__auto____7920 = p1__7726_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7920)) {
              var and__3822__auto____7921 = p1__7726_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____7921)) {
                return p1__7726_SHARP_.call(null, z)
              }else {
                return and__3822__auto____7921
              }
            }else {
              return and__3822__auto____7920
            }
          }, ps__7914)
        };
        var epn__4 = function() {
          var G__7930__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____7922 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____7922)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7727_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7727_SHARP_, args)
                }, ps__7914)
              }else {
                return and__3822__auto____7922
              }
            }())
          };
          var G__7930 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7930__delegate.call(this, x, y, z, args)
          };
          G__7930.cljs$lang$maxFixedArity = 3;
          G__7930.cljs$lang$applyTo = function(arglist__7931) {
            var x = cljs.core.first(arglist__7931);
            var y = cljs.core.first(cljs.core.next(arglist__7931));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7931)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7931)));
            return G__7930__delegate(x, y, z, args)
          };
          G__7930.cljs$lang$arity$variadic = G__7930__delegate;
          return G__7930
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__7929 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7929__delegate.call(this, p1, p2, p3, ps)
    };
    G__7929.cljs$lang$maxFixedArity = 3;
    G__7929.cljs$lang$applyTo = function(arglist__7932) {
      var p1 = cljs.core.first(arglist__7932);
      var p2 = cljs.core.first(cljs.core.next(arglist__7932));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7932)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7932)));
      return G__7929__delegate(p1, p2, p3, ps)
    };
    G__7929.cljs$lang$arity$variadic = G__7929__delegate;
    return G__7929
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____8013 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8013)) {
          return or__3824__auto____8013
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____8014 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8014)) {
          return or__3824__auto____8014
        }else {
          var or__3824__auto____8015 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8015)) {
            return or__3824__auto____8015
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8084__delegate = function(x, y, z, args) {
          var or__3824__auto____8016 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8016)) {
            return or__3824__auto____8016
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8084 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8084__delegate.call(this, x, y, z, args)
        };
        G__8084.cljs$lang$maxFixedArity = 3;
        G__8084.cljs$lang$applyTo = function(arglist__8085) {
          var x = cljs.core.first(arglist__8085);
          var y = cljs.core.first(cljs.core.next(arglist__8085));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8085)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8085)));
          return G__8084__delegate(x, y, z, args)
        };
        G__8084.cljs$lang$arity$variadic = G__8084__delegate;
        return G__8084
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____8028 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8028)) {
          return or__3824__auto____8028
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____8029 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8029)) {
          return or__3824__auto____8029
        }else {
          var or__3824__auto____8030 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8030)) {
            return or__3824__auto____8030
          }else {
            var or__3824__auto____8031 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8031)) {
              return or__3824__auto____8031
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____8032 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8032)) {
          return or__3824__auto____8032
        }else {
          var or__3824__auto____8033 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8033)) {
            return or__3824__auto____8033
          }else {
            var or__3824__auto____8034 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____8034)) {
              return or__3824__auto____8034
            }else {
              var or__3824__auto____8035 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____8035)) {
                return or__3824__auto____8035
              }else {
                var or__3824__auto____8036 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8036)) {
                  return or__3824__auto____8036
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8086__delegate = function(x, y, z, args) {
          var or__3824__auto____8037 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8037)) {
            return or__3824__auto____8037
          }else {
            return cljs.core.some.call(null, function(p1__7767_SHARP_) {
              var or__3824__auto____8038 = p1.call(null, p1__7767_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8038)) {
                return or__3824__auto____8038
              }else {
                return p2.call(null, p1__7767_SHARP_)
              }
            }, args)
          }
        };
        var G__8086 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8086__delegate.call(this, x, y, z, args)
        };
        G__8086.cljs$lang$maxFixedArity = 3;
        G__8086.cljs$lang$applyTo = function(arglist__8087) {
          var x = cljs.core.first(arglist__8087);
          var y = cljs.core.first(cljs.core.next(arglist__8087));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8087)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8087)));
          return G__8086__delegate(x, y, z, args)
        };
        G__8086.cljs$lang$arity$variadic = G__8086__delegate;
        return G__8086
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____8057 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8057)) {
          return or__3824__auto____8057
        }else {
          var or__3824__auto____8058 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8058)) {
            return or__3824__auto____8058
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____8059 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8059)) {
          return or__3824__auto____8059
        }else {
          var or__3824__auto____8060 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8060)) {
            return or__3824__auto____8060
          }else {
            var or__3824__auto____8061 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8061)) {
              return or__3824__auto____8061
            }else {
              var or__3824__auto____8062 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8062)) {
                return or__3824__auto____8062
              }else {
                var or__3824__auto____8063 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8063)) {
                  return or__3824__auto____8063
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____8064 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8064)) {
          return or__3824__auto____8064
        }else {
          var or__3824__auto____8065 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8065)) {
            return or__3824__auto____8065
          }else {
            var or__3824__auto____8066 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8066)) {
              return or__3824__auto____8066
            }else {
              var or__3824__auto____8067 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8067)) {
                return or__3824__auto____8067
              }else {
                var or__3824__auto____8068 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8068)) {
                  return or__3824__auto____8068
                }else {
                  var or__3824__auto____8069 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8069)) {
                    return or__3824__auto____8069
                  }else {
                    var or__3824__auto____8070 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8070)) {
                      return or__3824__auto____8070
                    }else {
                      var or__3824__auto____8071 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8071)) {
                        return or__3824__auto____8071
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__8088__delegate = function(x, y, z, args) {
          var or__3824__auto____8072 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8072)) {
            return or__3824__auto____8072
          }else {
            return cljs.core.some.call(null, function(p1__7768_SHARP_) {
              var or__3824__auto____8073 = p1.call(null, p1__7768_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8073)) {
                return or__3824__auto____8073
              }else {
                var or__3824__auto____8074 = p2.call(null, p1__7768_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8074)) {
                  return or__3824__auto____8074
                }else {
                  return p3.call(null, p1__7768_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8088 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8088__delegate.call(this, x, y, z, args)
        };
        G__8088.cljs$lang$maxFixedArity = 3;
        G__8088.cljs$lang$applyTo = function(arglist__8089) {
          var x = cljs.core.first(arglist__8089);
          var y = cljs.core.first(cljs.core.next(arglist__8089));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8089)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8089)));
          return G__8088__delegate(x, y, z, args)
        };
        G__8088.cljs$lang$arity$variadic = G__8088__delegate;
        return G__8088
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__8090__delegate = function(p1, p2, p3, ps) {
      var ps__8075 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7769_SHARP_) {
            return p1__7769_SHARP_.call(null, x)
          }, ps__8075)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7770_SHARP_) {
            var or__3824__auto____8080 = p1__7770_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8080)) {
              return or__3824__auto____8080
            }else {
              return p1__7770_SHARP_.call(null, y)
            }
          }, ps__8075)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7771_SHARP_) {
            var or__3824__auto____8081 = p1__7771_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8081)) {
              return or__3824__auto____8081
            }else {
              var or__3824__auto____8082 = p1__7771_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8082)) {
                return or__3824__auto____8082
              }else {
                return p1__7771_SHARP_.call(null, z)
              }
            }
          }, ps__8075)
        };
        var spn__4 = function() {
          var G__8091__delegate = function(x, y, z, args) {
            var or__3824__auto____8083 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8083)) {
              return or__3824__auto____8083
            }else {
              return cljs.core.some.call(null, function(p1__7772_SHARP_) {
                return cljs.core.some.call(null, p1__7772_SHARP_, args)
              }, ps__8075)
            }
          };
          var G__8091 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8091__delegate.call(this, x, y, z, args)
          };
          G__8091.cljs$lang$maxFixedArity = 3;
          G__8091.cljs$lang$applyTo = function(arglist__8092) {
            var x = cljs.core.first(arglist__8092);
            var y = cljs.core.first(cljs.core.next(arglist__8092));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8092)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8092)));
            return G__8091__delegate(x, y, z, args)
          };
          G__8091.cljs$lang$arity$variadic = G__8091__delegate;
          return G__8091
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__8090 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8090__delegate.call(this, p1, p2, p3, ps)
    };
    G__8090.cljs$lang$maxFixedArity = 3;
    G__8090.cljs$lang$applyTo = function(arglist__8093) {
      var p1 = cljs.core.first(arglist__8093);
      var p2 = cljs.core.first(cljs.core.next(arglist__8093));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8093)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8093)));
      return G__8090__delegate(p1, p2, p3, ps)
    };
    G__8090.cljs$lang$arity$variadic = G__8090__delegate;
    return G__8090
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8112 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8112) {
        var s__8113 = temp__3974__auto____8112;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8113)) {
          var c__8114 = cljs.core.chunk_first.call(null, s__8113);
          var size__8115 = cljs.core.count.call(null, c__8114);
          var b__8116 = cljs.core.chunk_buffer.call(null, size__8115);
          var n__2598__auto____8117 = size__8115;
          var i__8118 = 0;
          while(true) {
            if(i__8118 < n__2598__auto____8117) {
              cljs.core.chunk_append.call(null, b__8116, f.call(null, cljs.core._nth.call(null, c__8114, i__8118)));
              var G__8130 = i__8118 + 1;
              i__8118 = G__8130;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8116), map.call(null, f, cljs.core.chunk_rest.call(null, s__8113)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8113)), map.call(null, f, cljs.core.rest.call(null, s__8113)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8119 = cljs.core.seq.call(null, c1);
      var s2__8120 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8121 = s1__8119;
        if(and__3822__auto____8121) {
          return s2__8120
        }else {
          return and__3822__auto____8121
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8119), cljs.core.first.call(null, s2__8120)), map.call(null, f, cljs.core.rest.call(null, s1__8119), cljs.core.rest.call(null, s2__8120)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8122 = cljs.core.seq.call(null, c1);
      var s2__8123 = cljs.core.seq.call(null, c2);
      var s3__8124 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8125 = s1__8122;
        if(and__3822__auto____8125) {
          var and__3822__auto____8126 = s2__8123;
          if(and__3822__auto____8126) {
            return s3__8124
          }else {
            return and__3822__auto____8126
          }
        }else {
          return and__3822__auto____8125
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8122), cljs.core.first.call(null, s2__8123), cljs.core.first.call(null, s3__8124)), map.call(null, f, cljs.core.rest.call(null, s1__8122), cljs.core.rest.call(null, s2__8123), cljs.core.rest.call(null, s3__8124)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8131__delegate = function(f, c1, c2, c3, colls) {
      var step__8129 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8128 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8128)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8128), step.call(null, map.call(null, cljs.core.rest, ss__8128)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7933_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7933_SHARP_)
      }, step__8129.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8131 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8131__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8131.cljs$lang$maxFixedArity = 4;
    G__8131.cljs$lang$applyTo = function(arglist__8132) {
      var f = cljs.core.first(arglist__8132);
      var c1 = cljs.core.first(cljs.core.next(arglist__8132));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8132)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8132))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8132))));
      return G__8131__delegate(f, c1, c2, c3, colls)
    };
    G__8131.cljs$lang$arity$variadic = G__8131__delegate;
    return G__8131
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____8135 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8135) {
        var s__8136 = temp__3974__auto____8135;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8136), take.call(null, n - 1, cljs.core.rest.call(null, s__8136)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8142 = function(n, coll) {
    while(true) {
      var s__8140 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8141 = n > 0;
        if(and__3822__auto____8141) {
          return s__8140
        }else {
          return and__3822__auto____8141
        }
      }())) {
        var G__8143 = n - 1;
        var G__8144 = cljs.core.rest.call(null, s__8140);
        n = G__8143;
        coll = G__8144;
        continue
      }else {
        return s__8140
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8142.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8147 = cljs.core.seq.call(null, coll);
  var lead__8148 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8148) {
      var G__8149 = cljs.core.next.call(null, s__8147);
      var G__8150 = cljs.core.next.call(null, lead__8148);
      s__8147 = G__8149;
      lead__8148 = G__8150;
      continue
    }else {
      return s__8147
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8156 = function(pred, coll) {
    while(true) {
      var s__8154 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8155 = s__8154;
        if(and__3822__auto____8155) {
          return pred.call(null, cljs.core.first.call(null, s__8154))
        }else {
          return and__3822__auto____8155
        }
      }())) {
        var G__8157 = pred;
        var G__8158 = cljs.core.rest.call(null, s__8154);
        pred = G__8157;
        coll = G__8158;
        continue
      }else {
        return s__8154
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8156.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8161 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8161) {
      var s__8162 = temp__3974__auto____8161;
      return cljs.core.concat.call(null, s__8162, cycle.call(null, s__8162))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8167 = cljs.core.seq.call(null, c1);
      var s2__8168 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8169 = s1__8167;
        if(and__3822__auto____8169) {
          return s2__8168
        }else {
          return and__3822__auto____8169
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8167), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8168), interleave.call(null, cljs.core.rest.call(null, s1__8167), cljs.core.rest.call(null, s2__8168))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8171__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8170 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8170)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8170), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8170)))
        }else {
          return null
        }
      }, null)
    };
    var G__8171 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8171__delegate.call(this, c1, c2, colls)
    };
    G__8171.cljs$lang$maxFixedArity = 2;
    G__8171.cljs$lang$applyTo = function(arglist__8172) {
      var c1 = cljs.core.first(arglist__8172);
      var c2 = cljs.core.first(cljs.core.next(arglist__8172));
      var colls = cljs.core.rest(cljs.core.next(arglist__8172));
      return G__8171__delegate(c1, c2, colls)
    };
    G__8171.cljs$lang$arity$variadic = G__8171__delegate;
    return G__8171
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8182 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8180 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8180) {
        var coll__8181 = temp__3971__auto____8180;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8181), cat.call(null, cljs.core.rest.call(null, coll__8181), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8182.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8183__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8183 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8183__delegate.call(this, f, coll, colls)
    };
    G__8183.cljs$lang$maxFixedArity = 2;
    G__8183.cljs$lang$applyTo = function(arglist__8184) {
      var f = cljs.core.first(arglist__8184);
      var coll = cljs.core.first(cljs.core.next(arglist__8184));
      var colls = cljs.core.rest(cljs.core.next(arglist__8184));
      return G__8183__delegate(f, coll, colls)
    };
    G__8183.cljs$lang$arity$variadic = G__8183__delegate;
    return G__8183
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8194 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8194) {
      var s__8195 = temp__3974__auto____8194;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8195)) {
        var c__8196 = cljs.core.chunk_first.call(null, s__8195);
        var size__8197 = cljs.core.count.call(null, c__8196);
        var b__8198 = cljs.core.chunk_buffer.call(null, size__8197);
        var n__2598__auto____8199 = size__8197;
        var i__8200 = 0;
        while(true) {
          if(i__8200 < n__2598__auto____8199) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8196, i__8200)))) {
              cljs.core.chunk_append.call(null, b__8198, cljs.core._nth.call(null, c__8196, i__8200))
            }else {
            }
            var G__8203 = i__8200 + 1;
            i__8200 = G__8203;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8198), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8195)))
      }else {
        var f__8201 = cljs.core.first.call(null, s__8195);
        var r__8202 = cljs.core.rest.call(null, s__8195);
        if(cljs.core.truth_(pred.call(null, f__8201))) {
          return cljs.core.cons.call(null, f__8201, filter.call(null, pred, r__8202))
        }else {
          return filter.call(null, pred, r__8202)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8206 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8206.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8204_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8204_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8210__8211 = to;
    if(G__8210__8211) {
      if(function() {
        var or__3824__auto____8212 = G__8210__8211.cljs$lang$protocol_mask$partition1$ & 4;
        if(or__3824__auto____8212) {
          return or__3824__auto____8212
        }else {
          return G__8210__8211.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8210__8211.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8210__8211)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8210__8211)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8213__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8213 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8213__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8213.cljs$lang$maxFixedArity = 4;
    G__8213.cljs$lang$applyTo = function(arglist__8214) {
      var f = cljs.core.first(arglist__8214);
      var c1 = cljs.core.first(cljs.core.next(arglist__8214));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8214)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8214))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8214))));
      return G__8213__delegate(f, c1, c2, c3, colls)
    };
    G__8213.cljs$lang$arity$variadic = G__8213__delegate;
    return G__8213
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8221 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8221) {
        var s__8222 = temp__3974__auto____8221;
        var p__8223 = cljs.core.take.call(null, n, s__8222);
        if(n === cljs.core.count.call(null, p__8223)) {
          return cljs.core.cons.call(null, p__8223, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8222)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8224 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8224) {
        var s__8225 = temp__3974__auto____8224;
        var p__8226 = cljs.core.take.call(null, n, s__8225);
        if(n === cljs.core.count.call(null, p__8226)) {
          return cljs.core.cons.call(null, p__8226, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8225)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8226, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8231 = cljs.core.lookup_sentinel;
    var m__8232 = m;
    var ks__8233 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8233) {
        var m__8234 = cljs.core._lookup.call(null, m__8232, cljs.core.first.call(null, ks__8233), sentinel__8231);
        if(sentinel__8231 === m__8234) {
          return not_found
        }else {
          var G__8235 = sentinel__8231;
          var G__8236 = m__8234;
          var G__8237 = cljs.core.next.call(null, ks__8233);
          sentinel__8231 = G__8235;
          m__8232 = G__8236;
          ks__8233 = G__8237;
          continue
        }
      }else {
        return m__8232
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8238, v) {
  var vec__8243__8244 = p__8238;
  var k__8245 = cljs.core.nth.call(null, vec__8243__8244, 0, null);
  var ks__8246 = cljs.core.nthnext.call(null, vec__8243__8244, 1);
  if(cljs.core.truth_(ks__8246)) {
    return cljs.core.assoc.call(null, m, k__8245, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8245, null), ks__8246, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8245, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8247, f, args) {
    var vec__8252__8253 = p__8247;
    var k__8254 = cljs.core.nth.call(null, vec__8252__8253, 0, null);
    var ks__8255 = cljs.core.nthnext.call(null, vec__8252__8253, 1);
    if(cljs.core.truth_(ks__8255)) {
      return cljs.core.assoc.call(null, m, k__8254, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8254, null), ks__8255, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8254, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8254, null), args))
    }
  };
  var update_in = function(m, p__8247, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8247, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8256) {
    var m = cljs.core.first(arglist__8256);
    var p__8247 = cljs.core.first(cljs.core.next(arglist__8256));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8256)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8256)));
    return update_in__delegate(m, p__8247, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
goog.provide("cljs.core.Vector");
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8259 = this;
  var h__2252__auto____8260 = this__8259.__hash;
  if(!(h__2252__auto____8260 == null)) {
    return h__2252__auto____8260
  }else {
    var h__2252__auto____8261 = cljs.core.hash_coll.call(null, coll);
    this__8259.__hash = h__2252__auto____8261;
    return h__2252__auto____8261
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8262 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8263 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8264 = this;
  var new_array__8265 = this__8264.array.slice();
  new_array__8265[k] = v;
  return new cljs.core.Vector(this__8264.meta, new_array__8265, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8296 = null;
  var G__8296__2 = function(this_sym8266, k) {
    var this__8268 = this;
    var this_sym8266__8269 = this;
    var coll__8270 = this_sym8266__8269;
    return coll__8270.cljs$core$ILookup$_lookup$arity$2(coll__8270, k)
  };
  var G__8296__3 = function(this_sym8267, k, not_found) {
    var this__8268 = this;
    var this_sym8267__8271 = this;
    var coll__8272 = this_sym8267__8271;
    return coll__8272.cljs$core$ILookup$_lookup$arity$3(coll__8272, k, not_found)
  };
  G__8296 = function(this_sym8267, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8296__2.call(this, this_sym8267, k);
      case 3:
        return G__8296__3.call(this, this_sym8267, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8296
}();
cljs.core.Vector.prototype.apply = function(this_sym8257, args8258) {
  var this__8273 = this;
  return this_sym8257.call.apply(this_sym8257, [this_sym8257].concat(args8258.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8274 = this;
  var new_array__8275 = this__8274.array.slice();
  new_array__8275.push(o);
  return new cljs.core.Vector(this__8274.meta, new_array__8275, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8276 = this;
  var this__8277 = this;
  return cljs.core.pr_str.call(null, this__8277)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8278 = this;
  return cljs.core.ci_reduce.call(null, this__8278.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8279 = this;
  return cljs.core.ci_reduce.call(null, this__8279.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8280 = this;
  if(this__8280.array.length > 0) {
    var vector_seq__8281 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8280.array.length) {
          return cljs.core.cons.call(null, this__8280.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8281.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8282 = this;
  return this__8282.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8283 = this;
  var count__8284 = this__8283.array.length;
  if(count__8284 > 0) {
    return this__8283.array[count__8284 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8285 = this;
  if(this__8285.array.length > 0) {
    var new_array__8286 = this__8285.array.slice();
    new_array__8286.pop();
    return new cljs.core.Vector(this__8285.meta, new_array__8286, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8287 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8288 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8289 = this;
  return new cljs.core.Vector(meta, this__8289.array, this__8289.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8290 = this;
  return this__8290.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8291 = this;
  if(function() {
    var and__3822__auto____8292 = 0 <= n;
    if(and__3822__auto____8292) {
      return n < this__8291.array.length
    }else {
      return and__3822__auto____8292
    }
  }()) {
    return this__8291.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8293 = this;
  if(function() {
    var and__3822__auto____8294 = 0 <= n;
    if(and__3822__auto____8294) {
      return n < this__8293.array.length
    }else {
      return and__3822__auto____8294
    }
  }()) {
    return this__8293.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8295 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8295.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
goog.provide("cljs.core.VectorNode");
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2373__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode.cljs$lang$ctorPrWriter = function(this__2373__auto__, writer__2374__auto__) {
  return cljs.core._write.call(null, writer__2374__auto__, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__8298 = pv.cnt;
  if(cnt__8298 < 32) {
    return 0
  }else {
    return cnt__8298 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8304 = level;
  var ret__8305 = node;
  while(true) {
    if(ll__8304 === 0) {
      return ret__8305
    }else {
      var embed__8306 = ret__8305;
      var r__8307 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8308 = cljs.core.pv_aset.call(null, r__8307, 0, embed__8306);
      var G__8309 = ll__8304 - 5;
      var G__8310 = r__8307;
      ll__8304 = G__8309;
      ret__8305 = G__8310;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8316 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8317 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8316, subidx__8317, tailnode);
    return ret__8316
  }else {
    var child__8318 = cljs.core.pv_aget.call(null, parent, subidx__8317);
    if(!(child__8318 == null)) {
      var node_to_insert__8319 = push_tail.call(null, pv, level - 5, child__8318, tailnode);
      cljs.core.pv_aset.call(null, ret__8316, subidx__8317, node_to_insert__8319);
      return ret__8316
    }else {
      var node_to_insert__8320 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8316, subidx__8317, node_to_insert__8320);
      return ret__8316
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8324 = 0 <= i;
    if(and__3822__auto____8324) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8324
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8325 = pv.root;
      var level__8326 = pv.shift;
      while(true) {
        if(level__8326 > 0) {
          var G__8327 = cljs.core.pv_aget.call(null, node__8325, i >>> level__8326 & 31);
          var G__8328 = level__8326 - 5;
          node__8325 = G__8327;
          level__8326 = G__8328;
          continue
        }else {
          return node__8325.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8331 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8331, i & 31, val);
    return ret__8331
  }else {
    var subidx__8332 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8331, subidx__8332, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8332), i, val));
    return ret__8331
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8338 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8339 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8338));
    if(function() {
      var and__3822__auto____8340 = new_child__8339 == null;
      if(and__3822__auto____8340) {
        return subidx__8338 === 0
      }else {
        return and__3822__auto____8340
      }
    }()) {
      return null
    }else {
      var ret__8341 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8341, subidx__8338, new_child__8339);
      return ret__8341
    }
  }else {
    if(subidx__8338 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8342 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8342, subidx__8338, null);
        return ret__8342
      }else {
        return null
      }
    }
  }
};
goog.provide("cljs.core.PersistentVector");
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8345 = this;
  return new cljs.core.TransientVector(this__8345.cnt, this__8345.shift, cljs.core.tv_editable_root.call(null, this__8345.root), cljs.core.tv_editable_tail.call(null, this__8345.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8346 = this;
  var h__2252__auto____8347 = this__8346.__hash;
  if(!(h__2252__auto____8347 == null)) {
    return h__2252__auto____8347
  }else {
    var h__2252__auto____8348 = cljs.core.hash_coll.call(null, coll);
    this__8346.__hash = h__2252__auto____8348;
    return h__2252__auto____8348
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8349 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8350 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8351 = this;
  if(function() {
    var and__3822__auto____8352 = 0 <= k;
    if(and__3822__auto____8352) {
      return k < this__8351.cnt
    }else {
      return and__3822__auto____8352
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8353 = this__8351.tail.slice();
      new_tail__8353[k & 31] = v;
      return new cljs.core.PersistentVector(this__8351.meta, this__8351.cnt, this__8351.shift, this__8351.root, new_tail__8353, null)
    }else {
      return new cljs.core.PersistentVector(this__8351.meta, this__8351.cnt, this__8351.shift, cljs.core.do_assoc.call(null, coll, this__8351.shift, this__8351.root, k, v), this__8351.tail, null)
    }
  }else {
    if(k === this__8351.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8351.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8401 = null;
  var G__8401__2 = function(this_sym8354, k) {
    var this__8356 = this;
    var this_sym8354__8357 = this;
    var coll__8358 = this_sym8354__8357;
    return coll__8358.cljs$core$ILookup$_lookup$arity$2(coll__8358, k)
  };
  var G__8401__3 = function(this_sym8355, k, not_found) {
    var this__8356 = this;
    var this_sym8355__8359 = this;
    var coll__8360 = this_sym8355__8359;
    return coll__8360.cljs$core$ILookup$_lookup$arity$3(coll__8360, k, not_found)
  };
  G__8401 = function(this_sym8355, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8401__2.call(this, this_sym8355, k);
      case 3:
        return G__8401__3.call(this, this_sym8355, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8401
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8343, args8344) {
  var this__8361 = this;
  return this_sym8343.call.apply(this_sym8343, [this_sym8343].concat(args8344.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8362 = this;
  var step_init__8363 = [0, init];
  var i__8364 = 0;
  while(true) {
    if(i__8364 < this__8362.cnt) {
      var arr__8365 = cljs.core.array_for.call(null, v, i__8364);
      var len__8366 = arr__8365.length;
      var init__8370 = function() {
        var j__8367 = 0;
        var init__8368 = step_init__8363[1];
        while(true) {
          if(j__8367 < len__8366) {
            var init__8369 = f.call(null, init__8368, j__8367 + i__8364, arr__8365[j__8367]);
            if(cljs.core.reduced_QMARK_.call(null, init__8369)) {
              return init__8369
            }else {
              var G__8402 = j__8367 + 1;
              var G__8403 = init__8369;
              j__8367 = G__8402;
              init__8368 = G__8403;
              continue
            }
          }else {
            step_init__8363[0] = len__8366;
            step_init__8363[1] = init__8368;
            return init__8368
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8370)) {
        return cljs.core.deref.call(null, init__8370)
      }else {
        var G__8404 = i__8364 + step_init__8363[0];
        i__8364 = G__8404;
        continue
      }
    }else {
      return step_init__8363[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8371 = this;
  if(this__8371.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8372 = this__8371.tail.slice();
    new_tail__8372.push(o);
    return new cljs.core.PersistentVector(this__8371.meta, this__8371.cnt + 1, this__8371.shift, this__8371.root, new_tail__8372, null)
  }else {
    var root_overflow_QMARK___8373 = this__8371.cnt >>> 5 > 1 << this__8371.shift;
    var new_shift__8374 = root_overflow_QMARK___8373 ? this__8371.shift + 5 : this__8371.shift;
    var new_root__8376 = root_overflow_QMARK___8373 ? function() {
      var n_r__8375 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8375, 0, this__8371.root);
      cljs.core.pv_aset.call(null, n_r__8375, 1, cljs.core.new_path.call(null, null, this__8371.shift, new cljs.core.VectorNode(null, this__8371.tail)));
      return n_r__8375
    }() : cljs.core.push_tail.call(null, coll, this__8371.shift, this__8371.root, new cljs.core.VectorNode(null, this__8371.tail));
    return new cljs.core.PersistentVector(this__8371.meta, this__8371.cnt + 1, new_shift__8374, new_root__8376, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8377 = this;
  if(this__8377.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8377.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8378 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8379 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8380 = this;
  var this__8381 = this;
  return cljs.core.pr_str.call(null, this__8381)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8382 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8383 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8384 = this;
  if(this__8384.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8385 = this;
  return this__8385.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8386 = this;
  if(this__8386.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8386.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8387 = this;
  if(this__8387.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8387.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8387.meta)
    }else {
      if(1 < this__8387.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8387.meta, this__8387.cnt - 1, this__8387.shift, this__8387.root, this__8387.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8388 = cljs.core.array_for.call(null, coll, this__8387.cnt - 2);
          var nr__8389 = cljs.core.pop_tail.call(null, coll, this__8387.shift, this__8387.root);
          var new_root__8390 = nr__8389 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8389;
          var cnt_1__8391 = this__8387.cnt - 1;
          if(function() {
            var and__3822__auto____8392 = 5 < this__8387.shift;
            if(and__3822__auto____8392) {
              return cljs.core.pv_aget.call(null, new_root__8390, 1) == null
            }else {
              return and__3822__auto____8392
            }
          }()) {
            return new cljs.core.PersistentVector(this__8387.meta, cnt_1__8391, this__8387.shift - 5, cljs.core.pv_aget.call(null, new_root__8390, 0), new_tail__8388, null)
          }else {
            return new cljs.core.PersistentVector(this__8387.meta, cnt_1__8391, this__8387.shift, new_root__8390, new_tail__8388, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8393 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8394 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8395 = this;
  return new cljs.core.PersistentVector(meta, this__8395.cnt, this__8395.shift, this__8395.root, this__8395.tail, this__8395.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8396 = this;
  return this__8396.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8397 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8398 = this;
  if(function() {
    var and__3822__auto____8399 = 0 <= n;
    if(and__3822__auto____8399) {
      return n < this__8398.cnt
    }else {
      return and__3822__auto____8399
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8400 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8400.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8405 = xs.length;
  var xs__8406 = no_clone === true ? xs : xs.slice();
  if(l__8405 < 32) {
    return new cljs.core.PersistentVector(null, l__8405, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8406, null)
  }else {
    var node__8407 = xs__8406.slice(0, 32);
    var v__8408 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8407, null);
    var i__8409 = 32;
    var out__8410 = cljs.core._as_transient.call(null, v__8408);
    while(true) {
      if(i__8409 < l__8405) {
        var G__8411 = i__8409 + 1;
        var G__8412 = cljs.core.conj_BANG_.call(null, out__8410, xs__8406[i__8409]);
        i__8409 = G__8411;
        out__8410 = G__8412;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8410)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8413) {
    var args = cljs.core.seq(arglist__8413);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
goog.provide("cljs.core.ChunkedSeq");
cljs.core.ChunkedSeq = function(vec, node, i, off, meta, __hash) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition0$ = 31719660;
  this.cljs$lang$protocol_mask$partition1$ = 1536
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8414 = this;
  var h__2252__auto____8415 = this__8414.__hash;
  if(!(h__2252__auto____8415 == null)) {
    return h__2252__auto____8415
  }else {
    var h__2252__auto____8416 = cljs.core.hash_coll.call(null, coll);
    this__8414.__hash = h__2252__auto____8416;
    return h__2252__auto____8416
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8417 = this;
  if(this__8417.off + 1 < this__8417.node.length) {
    var s__8418 = cljs.core.chunked_seq.call(null, this__8417.vec, this__8417.node, this__8417.i, this__8417.off + 1);
    if(s__8418 == null) {
      return null
    }else {
      return s__8418
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8419 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8420 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8421 = this;
  return this__8421.node[this__8421.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8422 = this;
  if(this__8422.off + 1 < this__8422.node.length) {
    var s__8423 = cljs.core.chunked_seq.call(null, this__8422.vec, this__8422.node, this__8422.i, this__8422.off + 1);
    if(s__8423 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8423
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8424 = this;
  var l__8425 = this__8424.node.length;
  var s__8426 = this__8424.i + l__8425 < cljs.core._count.call(null, this__8424.vec) ? cljs.core.chunked_seq.call(null, this__8424.vec, this__8424.i + l__8425, 0) : null;
  if(s__8426 == null) {
    return null
  }else {
    return s__8426
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8427 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8428 = this;
  return cljs.core.chunked_seq.call(null, this__8428.vec, this__8428.node, this__8428.i, this__8428.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8429 = this;
  return this__8429.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8430 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8430.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8431 = this;
  return cljs.core.array_chunk.call(null, this__8431.node, this__8431.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8432 = this;
  var l__8433 = this__8432.node.length;
  var s__8434 = this__8432.i + l__8433 < cljs.core._count.call(null, this__8432.vec) ? cljs.core.chunked_seq.call(null, this__8432.vec, this__8432.i + l__8433, 0) : null;
  if(s__8434 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8434
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta, null)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
goog.provide("cljs.core.Subvec");
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8437 = this;
  var h__2252__auto____8438 = this__8437.__hash;
  if(!(h__2252__auto____8438 == null)) {
    return h__2252__auto____8438
  }else {
    var h__2252__auto____8439 = cljs.core.hash_coll.call(null, coll);
    this__8437.__hash = h__2252__auto____8439;
    return h__2252__auto____8439
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8440 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8441 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8442 = this;
  var v_pos__8443 = this__8442.start + key;
  return new cljs.core.Subvec(this__8442.meta, cljs.core._assoc.call(null, this__8442.v, v_pos__8443, val), this__8442.start, this__8442.end > v_pos__8443 + 1 ? this__8442.end : v_pos__8443 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8469 = null;
  var G__8469__2 = function(this_sym8444, k) {
    var this__8446 = this;
    var this_sym8444__8447 = this;
    var coll__8448 = this_sym8444__8447;
    return coll__8448.cljs$core$ILookup$_lookup$arity$2(coll__8448, k)
  };
  var G__8469__3 = function(this_sym8445, k, not_found) {
    var this__8446 = this;
    var this_sym8445__8449 = this;
    var coll__8450 = this_sym8445__8449;
    return coll__8450.cljs$core$ILookup$_lookup$arity$3(coll__8450, k, not_found)
  };
  G__8469 = function(this_sym8445, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8469__2.call(this, this_sym8445, k);
      case 3:
        return G__8469__3.call(this, this_sym8445, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8469
}();
cljs.core.Subvec.prototype.apply = function(this_sym8435, args8436) {
  var this__8451 = this;
  return this_sym8435.call.apply(this_sym8435, [this_sym8435].concat(args8436.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8452 = this;
  return new cljs.core.Subvec(this__8452.meta, cljs.core._assoc_n.call(null, this__8452.v, this__8452.end, o), this__8452.start, this__8452.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8453 = this;
  var this__8454 = this;
  return cljs.core.pr_str.call(null, this__8454)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8455 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8456 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8457 = this;
  var subvec_seq__8458 = function subvec_seq(i) {
    if(i === this__8457.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8457.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8458.call(null, this__8457.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8459 = this;
  return this__8459.end - this__8459.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8460 = this;
  return cljs.core._nth.call(null, this__8460.v, this__8460.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8461 = this;
  if(this__8461.start === this__8461.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8461.meta, this__8461.v, this__8461.start, this__8461.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8462 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8463 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8464 = this;
  return new cljs.core.Subvec(meta, this__8464.v, this__8464.start, this__8464.end, this__8464.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8465 = this;
  return this__8465.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8466 = this;
  return cljs.core._nth.call(null, this__8466.v, this__8466.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8467 = this;
  return cljs.core._nth.call(null, this__8467.v, this__8467.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8468 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8468.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__8471 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8471, 0, tl.length);
  return ret__8471
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8475 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8476 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8475, subidx__8476, level === 5 ? tail_node : function() {
    var child__8477 = cljs.core.pv_aget.call(null, ret__8475, subidx__8476);
    if(!(child__8477 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8477, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8475
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8482 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8483 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8484 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8482, subidx__8483));
    if(function() {
      var and__3822__auto____8485 = new_child__8484 == null;
      if(and__3822__auto____8485) {
        return subidx__8483 === 0
      }else {
        return and__3822__auto____8485
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8482, subidx__8483, new_child__8484);
      return node__8482
    }
  }else {
    if(subidx__8483 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8482, subidx__8483, null);
        return node__8482
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8490 = 0 <= i;
    if(and__3822__auto____8490) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8490
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8491 = tv.root;
      var node__8492 = root__8491;
      var level__8493 = tv.shift;
      while(true) {
        if(level__8493 > 0) {
          var G__8494 = cljs.core.tv_ensure_editable.call(null, root__8491.edit, cljs.core.pv_aget.call(null, node__8492, i >>> level__8493 & 31));
          var G__8495 = level__8493 - 5;
          node__8492 = G__8494;
          level__8493 = G__8495;
          continue
        }else {
          return node__8492.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
goog.provide("cljs.core.TransientVector");
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 88
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8535 = null;
  var G__8535__2 = function(this_sym8498, k) {
    var this__8500 = this;
    var this_sym8498__8501 = this;
    var coll__8502 = this_sym8498__8501;
    return coll__8502.cljs$core$ILookup$_lookup$arity$2(coll__8502, k)
  };
  var G__8535__3 = function(this_sym8499, k, not_found) {
    var this__8500 = this;
    var this_sym8499__8503 = this;
    var coll__8504 = this_sym8499__8503;
    return coll__8504.cljs$core$ILookup$_lookup$arity$3(coll__8504, k, not_found)
  };
  G__8535 = function(this_sym8499, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8535__2.call(this, this_sym8499, k);
      case 3:
        return G__8535__3.call(this, this_sym8499, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8535
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8496, args8497) {
  var this__8505 = this;
  return this_sym8496.call.apply(this_sym8496, [this_sym8496].concat(args8497.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8506 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8507 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8508 = this;
  if(this__8508.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8509 = this;
  if(function() {
    var and__3822__auto____8510 = 0 <= n;
    if(and__3822__auto____8510) {
      return n < this__8509.cnt
    }else {
      return and__3822__auto____8510
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8511 = this;
  if(this__8511.root.edit) {
    return this__8511.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8512 = this;
  if(this__8512.root.edit) {
    if(function() {
      var and__3822__auto____8513 = 0 <= n;
      if(and__3822__auto____8513) {
        return n < this__8512.cnt
      }else {
        return and__3822__auto____8513
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8512.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8518 = function go(level, node) {
          var node__8516 = cljs.core.tv_ensure_editable.call(null, this__8512.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8516, n & 31, val);
            return node__8516
          }else {
            var subidx__8517 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8516, subidx__8517, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8516, subidx__8517)));
            return node__8516
          }
        }.call(null, this__8512.shift, this__8512.root);
        this__8512.root = new_root__8518;
        return tcoll
      }
    }else {
      if(n === this__8512.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8512.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__8519 = this;
  if(this__8519.root.edit) {
    if(this__8519.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8519.cnt) {
        this__8519.cnt = 0;
        return tcoll
      }else {
        if((this__8519.cnt - 1 & 31) > 0) {
          this__8519.cnt = this__8519.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8520 = cljs.core.editable_array_for.call(null, tcoll, this__8519.cnt - 2);
            var new_root__8522 = function() {
              var nr__8521 = cljs.core.tv_pop_tail.call(null, tcoll, this__8519.shift, this__8519.root);
              if(!(nr__8521 == null)) {
                return nr__8521
              }else {
                return new cljs.core.VectorNode(this__8519.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8523 = 5 < this__8519.shift;
              if(and__3822__auto____8523) {
                return cljs.core.pv_aget.call(null, new_root__8522, 1) == null
              }else {
                return and__3822__auto____8523
              }
            }()) {
              var new_root__8524 = cljs.core.tv_ensure_editable.call(null, this__8519.root.edit, cljs.core.pv_aget.call(null, new_root__8522, 0));
              this__8519.root = new_root__8524;
              this__8519.shift = this__8519.shift - 5;
              this__8519.cnt = this__8519.cnt - 1;
              this__8519.tail = new_tail__8520;
              return tcoll
            }else {
              this__8519.root = new_root__8522;
              this__8519.cnt = this__8519.cnt - 1;
              this__8519.tail = new_tail__8520;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8525 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8526 = this;
  if(this__8526.root.edit) {
    if(this__8526.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8526.tail[this__8526.cnt & 31] = o;
      this__8526.cnt = this__8526.cnt + 1;
      return tcoll
    }else {
      var tail_node__8527 = new cljs.core.VectorNode(this__8526.root.edit, this__8526.tail);
      var new_tail__8528 = cljs.core.make_array.call(null, 32);
      new_tail__8528[0] = o;
      this__8526.tail = new_tail__8528;
      if(this__8526.cnt >>> 5 > 1 << this__8526.shift) {
        var new_root_array__8529 = cljs.core.make_array.call(null, 32);
        var new_shift__8530 = this__8526.shift + 5;
        new_root_array__8529[0] = this__8526.root;
        new_root_array__8529[1] = cljs.core.new_path.call(null, this__8526.root.edit, this__8526.shift, tail_node__8527);
        this__8526.root = new cljs.core.VectorNode(this__8526.root.edit, new_root_array__8529);
        this__8526.shift = new_shift__8530;
        this__8526.cnt = this__8526.cnt + 1;
        return tcoll
      }else {
        var new_root__8531 = cljs.core.tv_push_tail.call(null, tcoll, this__8526.shift, this__8526.root, tail_node__8527);
        this__8526.root = new_root__8531;
        this__8526.cnt = this__8526.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8532 = this;
  if(this__8532.root.edit) {
    this__8532.root.edit = null;
    var len__8533 = this__8532.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8534 = cljs.core.make_array.call(null, len__8533);
    cljs.core.array_copy.call(null, this__8532.tail, 0, trimmed_tail__8534, 0, len__8533);
    return new cljs.core.PersistentVector(null, this__8532.cnt, this__8532.shift, this__8532.root, trimmed_tail__8534, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
goog.provide("cljs.core.PersistentQueueSeq");
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8536 = this;
  var h__2252__auto____8537 = this__8536.__hash;
  if(!(h__2252__auto____8537 == null)) {
    return h__2252__auto____8537
  }else {
    var h__2252__auto____8538 = cljs.core.hash_coll.call(null, coll);
    this__8536.__hash = h__2252__auto____8538;
    return h__2252__auto____8538
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8539 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8540 = this;
  var this__8541 = this;
  return cljs.core.pr_str.call(null, this__8541)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8542 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8543 = this;
  return cljs.core._first.call(null, this__8543.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8544 = this;
  var temp__3971__auto____8545 = cljs.core.next.call(null, this__8544.front);
  if(temp__3971__auto____8545) {
    var f1__8546 = temp__3971__auto____8545;
    return new cljs.core.PersistentQueueSeq(this__8544.meta, f1__8546, this__8544.rear, null)
  }else {
    if(this__8544.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8544.meta, this__8544.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8547 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8548 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8548.front, this__8548.rear, this__8548.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8549 = this;
  return this__8549.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8550 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8550.meta)
};
cljs.core.PersistentQueueSeq;
goog.provide("cljs.core.PersistentQueue");
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8551 = this;
  var h__2252__auto____8552 = this__8551.__hash;
  if(!(h__2252__auto____8552 == null)) {
    return h__2252__auto____8552
  }else {
    var h__2252__auto____8553 = cljs.core.hash_coll.call(null, coll);
    this__8551.__hash = h__2252__auto____8553;
    return h__2252__auto____8553
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8554 = this;
  if(cljs.core.truth_(this__8554.front)) {
    return new cljs.core.PersistentQueue(this__8554.meta, this__8554.count + 1, this__8554.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8555 = this__8554.rear;
      if(cljs.core.truth_(or__3824__auto____8555)) {
        return or__3824__auto____8555
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8554.meta, this__8554.count + 1, cljs.core.conj.call(null, this__8554.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8556 = this;
  var this__8557 = this;
  return cljs.core.pr_str.call(null, this__8557)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8558 = this;
  var rear__8559 = cljs.core.seq.call(null, this__8558.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8560 = this__8558.front;
    if(cljs.core.truth_(or__3824__auto____8560)) {
      return or__3824__auto____8560
    }else {
      return rear__8559
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8558.front, cljs.core.seq.call(null, rear__8559), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8561 = this;
  return this__8561.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8562 = this;
  return cljs.core._first.call(null, this__8562.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8563 = this;
  if(cljs.core.truth_(this__8563.front)) {
    var temp__3971__auto____8564 = cljs.core.next.call(null, this__8563.front);
    if(temp__3971__auto____8564) {
      var f1__8565 = temp__3971__auto____8564;
      return new cljs.core.PersistentQueue(this__8563.meta, this__8563.count - 1, f1__8565, this__8563.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8563.meta, this__8563.count - 1, cljs.core.seq.call(null, this__8563.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8566 = this;
  return cljs.core.first.call(null, this__8566.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8567 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8568 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8569 = this;
  return new cljs.core.PersistentQueue(meta, this__8569.count, this__8569.front, this__8569.rear, this__8569.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8570 = this;
  return this__8570.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8571 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
goog.provide("cljs.core.NeverEquiv");
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8572 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8575 = array.length;
  var i__8576 = 0;
  while(true) {
    if(i__8576 < len__8575) {
      if(k === array[i__8576]) {
        return i__8576
      }else {
        var G__8577 = i__8576 + incr;
        i__8576 = G__8577;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8580 = cljs.core.hash.call(null, a);
  var b__8581 = cljs.core.hash.call(null, b);
  if(a__8580 < b__8581) {
    return-1
  }else {
    if(a__8580 > b__8581) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8589 = m.keys;
  var len__8590 = ks__8589.length;
  var so__8591 = m.strobj;
  var out__8592 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8593 = 0;
  var out__8594 = cljs.core.transient$.call(null, out__8592);
  while(true) {
    if(i__8593 < len__8590) {
      var k__8595 = ks__8589[i__8593];
      var G__8596 = i__8593 + 1;
      var G__8597 = cljs.core.assoc_BANG_.call(null, out__8594, k__8595, so__8591[k__8595]);
      i__8593 = G__8596;
      out__8594 = G__8597;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8594, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8603 = {};
  var l__8604 = ks.length;
  var i__8605 = 0;
  while(true) {
    if(i__8605 < l__8604) {
      var k__8606 = ks[i__8605];
      new_obj__8603[k__8606] = obj[k__8606];
      var G__8607 = i__8605 + 1;
      i__8605 = G__8607;
      continue
    }else {
    }
    break
  }
  return new_obj__8603
};
goog.provide("cljs.core.ObjMap");
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8610 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8611 = this;
  var h__2252__auto____8612 = this__8611.__hash;
  if(!(h__2252__auto____8612 == null)) {
    return h__2252__auto____8612
  }else {
    var h__2252__auto____8613 = cljs.core.hash_imap.call(null, coll);
    this__8611.__hash = h__2252__auto____8613;
    return h__2252__auto____8613
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8614 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8615 = this;
  if(function() {
    var and__3822__auto____8616 = goog.isString(k);
    if(and__3822__auto____8616) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8615.keys) == null)
    }else {
      return and__3822__auto____8616
    }
  }()) {
    return this__8615.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8617 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8618 = this__8617.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8618) {
        return or__3824__auto____8618
      }else {
        return this__8617.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8617.keys) == null)) {
        var new_strobj__8619 = cljs.core.obj_clone.call(null, this__8617.strobj, this__8617.keys);
        new_strobj__8619[k] = v;
        return new cljs.core.ObjMap(this__8617.meta, this__8617.keys, new_strobj__8619, this__8617.update_count + 1, null)
      }else {
        var new_strobj__8620 = cljs.core.obj_clone.call(null, this__8617.strobj, this__8617.keys);
        var new_keys__8621 = this__8617.keys.slice();
        new_strobj__8620[k] = v;
        new_keys__8621.push(k);
        return new cljs.core.ObjMap(this__8617.meta, new_keys__8621, new_strobj__8620, this__8617.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8622 = this;
  if(function() {
    var and__3822__auto____8623 = goog.isString(k);
    if(and__3822__auto____8623) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8622.keys) == null)
    }else {
      return and__3822__auto____8623
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8645 = null;
  var G__8645__2 = function(this_sym8624, k) {
    var this__8626 = this;
    var this_sym8624__8627 = this;
    var coll__8628 = this_sym8624__8627;
    return coll__8628.cljs$core$ILookup$_lookup$arity$2(coll__8628, k)
  };
  var G__8645__3 = function(this_sym8625, k, not_found) {
    var this__8626 = this;
    var this_sym8625__8629 = this;
    var coll__8630 = this_sym8625__8629;
    return coll__8630.cljs$core$ILookup$_lookup$arity$3(coll__8630, k, not_found)
  };
  G__8645 = function(this_sym8625, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8645__2.call(this, this_sym8625, k);
      case 3:
        return G__8645__3.call(this, this_sym8625, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8645
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8608, args8609) {
  var this__8631 = this;
  return this_sym8608.call.apply(this_sym8608, [this_sym8608].concat(args8609.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8632 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8633 = this;
  var this__8634 = this;
  return cljs.core.pr_str.call(null, this__8634)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8635 = this;
  if(this__8635.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8598_SHARP_) {
      return cljs.core.vector.call(null, p1__8598_SHARP_, this__8635.strobj[p1__8598_SHARP_])
    }, this__8635.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8636 = this;
  return this__8636.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8637 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8638 = this;
  return new cljs.core.ObjMap(meta, this__8638.keys, this__8638.strobj, this__8638.update_count, this__8638.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8639 = this;
  return this__8639.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8640 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8640.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8641 = this;
  if(function() {
    var and__3822__auto____8642 = goog.isString(k);
    if(and__3822__auto____8642) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8641.keys) == null)
    }else {
      return and__3822__auto____8642
    }
  }()) {
    var new_keys__8643 = this__8641.keys.slice();
    var new_strobj__8644 = cljs.core.obj_clone.call(null, this__8641.strobj, this__8641.keys);
    new_keys__8643.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8643), 1);
    cljs.core.js_delete.call(null, new_strobj__8644, k);
    return new cljs.core.ObjMap(this__8641.meta, new_keys__8643, new_strobj__8644, this__8641.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
goog.provide("cljs.core.HashMap");
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8649 = this;
  var h__2252__auto____8650 = this__8649.__hash;
  if(!(h__2252__auto____8650 == null)) {
    return h__2252__auto____8650
  }else {
    var h__2252__auto____8651 = cljs.core.hash_imap.call(null, coll);
    this__8649.__hash = h__2252__auto____8651;
    return h__2252__auto____8651
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8652 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8653 = this;
  var bucket__8654 = this__8653.hashobj[cljs.core.hash.call(null, k)];
  var i__8655 = cljs.core.truth_(bucket__8654) ? cljs.core.scan_array.call(null, 2, k, bucket__8654) : null;
  if(cljs.core.truth_(i__8655)) {
    return bucket__8654[i__8655 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8656 = this;
  var h__8657 = cljs.core.hash.call(null, k);
  var bucket__8658 = this__8656.hashobj[h__8657];
  if(cljs.core.truth_(bucket__8658)) {
    var new_bucket__8659 = bucket__8658.slice();
    var new_hashobj__8660 = goog.object.clone(this__8656.hashobj);
    new_hashobj__8660[h__8657] = new_bucket__8659;
    var temp__3971__auto____8661 = cljs.core.scan_array.call(null, 2, k, new_bucket__8659);
    if(cljs.core.truth_(temp__3971__auto____8661)) {
      var i__8662 = temp__3971__auto____8661;
      new_bucket__8659[i__8662 + 1] = v;
      return new cljs.core.HashMap(this__8656.meta, this__8656.count, new_hashobj__8660, null)
    }else {
      new_bucket__8659.push(k, v);
      return new cljs.core.HashMap(this__8656.meta, this__8656.count + 1, new_hashobj__8660, null)
    }
  }else {
    var new_hashobj__8663 = goog.object.clone(this__8656.hashobj);
    new_hashobj__8663[h__8657] = [k, v];
    return new cljs.core.HashMap(this__8656.meta, this__8656.count + 1, new_hashobj__8663, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8664 = this;
  var bucket__8665 = this__8664.hashobj[cljs.core.hash.call(null, k)];
  var i__8666 = cljs.core.truth_(bucket__8665) ? cljs.core.scan_array.call(null, 2, k, bucket__8665) : null;
  if(cljs.core.truth_(i__8666)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8691 = null;
  var G__8691__2 = function(this_sym8667, k) {
    var this__8669 = this;
    var this_sym8667__8670 = this;
    var coll__8671 = this_sym8667__8670;
    return coll__8671.cljs$core$ILookup$_lookup$arity$2(coll__8671, k)
  };
  var G__8691__3 = function(this_sym8668, k, not_found) {
    var this__8669 = this;
    var this_sym8668__8672 = this;
    var coll__8673 = this_sym8668__8672;
    return coll__8673.cljs$core$ILookup$_lookup$arity$3(coll__8673, k, not_found)
  };
  G__8691 = function(this_sym8668, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8691__2.call(this, this_sym8668, k);
      case 3:
        return G__8691__3.call(this, this_sym8668, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8691
}();
cljs.core.HashMap.prototype.apply = function(this_sym8647, args8648) {
  var this__8674 = this;
  return this_sym8647.call.apply(this_sym8647, [this_sym8647].concat(args8648.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8675 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8676 = this;
  var this__8677 = this;
  return cljs.core.pr_str.call(null, this__8677)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8678 = this;
  if(this__8678.count > 0) {
    var hashes__8679 = cljs.core.js_keys.call(null, this__8678.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8646_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8678.hashobj[p1__8646_SHARP_]))
    }, hashes__8679)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8680 = this;
  return this__8680.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8681 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8682 = this;
  return new cljs.core.HashMap(meta, this__8682.count, this__8682.hashobj, this__8682.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8683 = this;
  return this__8683.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8684 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8684.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8685 = this;
  var h__8686 = cljs.core.hash.call(null, k);
  var bucket__8687 = this__8685.hashobj[h__8686];
  var i__8688 = cljs.core.truth_(bucket__8687) ? cljs.core.scan_array.call(null, 2, k, bucket__8687) : null;
  if(cljs.core.not.call(null, i__8688)) {
    return coll
  }else {
    var new_hashobj__8689 = goog.object.clone(this__8685.hashobj);
    if(3 > bucket__8687.length) {
      cljs.core.js_delete.call(null, new_hashobj__8689, h__8686)
    }else {
      var new_bucket__8690 = bucket__8687.slice();
      new_bucket__8690.splice(i__8688, 2);
      new_hashobj__8689[h__8686] = new_bucket__8690
    }
    return new cljs.core.HashMap(this__8685.meta, this__8685.count - 1, new_hashobj__8689, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8692 = ks.length;
  var i__8693 = 0;
  var out__8694 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8693 < len__8692) {
      var G__8695 = i__8693 + 1;
      var G__8696 = cljs.core.assoc.call(null, out__8694, ks[i__8693], vs[i__8693]);
      i__8693 = G__8695;
      out__8694 = G__8696;
      continue
    }else {
      return out__8694
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8700 = m.arr;
  var len__8701 = arr__8700.length;
  var i__8702 = 0;
  while(true) {
    if(len__8701 <= i__8702) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8700[i__8702], k)) {
        return i__8702
      }else {
        if("\ufdd0'else") {
          var G__8703 = i__8702 + 2;
          i__8702 = G__8703;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
goog.provide("cljs.core.PersistentArrayMap");
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8706 = this;
  return new cljs.core.TransientArrayMap({}, this__8706.arr.length, this__8706.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8707 = this;
  var h__2252__auto____8708 = this__8707.__hash;
  if(!(h__2252__auto____8708 == null)) {
    return h__2252__auto____8708
  }else {
    var h__2252__auto____8709 = cljs.core.hash_imap.call(null, coll);
    this__8707.__hash = h__2252__auto____8709;
    return h__2252__auto____8709
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8710 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8711 = this;
  var idx__8712 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8712 === -1) {
    return not_found
  }else {
    return this__8711.arr[idx__8712 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8713 = this;
  var idx__8714 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8714 === -1) {
    if(this__8713.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8713.meta, this__8713.cnt + 1, function() {
        var G__8715__8716 = this__8713.arr.slice();
        G__8715__8716.push(k);
        G__8715__8716.push(v);
        return G__8715__8716
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8713.arr[idx__8714 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8713.meta, this__8713.cnt, function() {
          var G__8717__8718 = this__8713.arr.slice();
          G__8717__8718[idx__8714 + 1] = v;
          return G__8717__8718
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8719 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8751 = null;
  var G__8751__2 = function(this_sym8720, k) {
    var this__8722 = this;
    var this_sym8720__8723 = this;
    var coll__8724 = this_sym8720__8723;
    return coll__8724.cljs$core$ILookup$_lookup$arity$2(coll__8724, k)
  };
  var G__8751__3 = function(this_sym8721, k, not_found) {
    var this__8722 = this;
    var this_sym8721__8725 = this;
    var coll__8726 = this_sym8721__8725;
    return coll__8726.cljs$core$ILookup$_lookup$arity$3(coll__8726, k, not_found)
  };
  G__8751 = function(this_sym8721, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8751__2.call(this, this_sym8721, k);
      case 3:
        return G__8751__3.call(this, this_sym8721, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8751
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8704, args8705) {
  var this__8727 = this;
  return this_sym8704.call.apply(this_sym8704, [this_sym8704].concat(args8705.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8728 = this;
  var len__8729 = this__8728.arr.length;
  var i__8730 = 0;
  var init__8731 = init;
  while(true) {
    if(i__8730 < len__8729) {
      var init__8732 = f.call(null, init__8731, this__8728.arr[i__8730], this__8728.arr[i__8730 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8732)) {
        return cljs.core.deref.call(null, init__8732)
      }else {
        var G__8752 = i__8730 + 2;
        var G__8753 = init__8732;
        i__8730 = G__8752;
        init__8731 = G__8753;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8733 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8734 = this;
  var this__8735 = this;
  return cljs.core.pr_str.call(null, this__8735)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8736 = this;
  if(this__8736.cnt > 0) {
    var len__8737 = this__8736.arr.length;
    var array_map_seq__8738 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8737) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8736.arr[i], this__8736.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8738.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8739 = this;
  return this__8739.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8740 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8741 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8741.cnt, this__8741.arr, this__8741.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8742 = this;
  return this__8742.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8743 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8743.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8744 = this;
  var idx__8745 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8745 >= 0) {
    var len__8746 = this__8744.arr.length;
    var new_len__8747 = len__8746 - 2;
    if(new_len__8747 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8748 = cljs.core.make_array.call(null, new_len__8747);
      var s__8749 = 0;
      var d__8750 = 0;
      while(true) {
        if(s__8749 >= len__8746) {
          return new cljs.core.PersistentArrayMap(this__8744.meta, this__8744.cnt - 1, new_arr__8748, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8744.arr[s__8749])) {
            var G__8754 = s__8749 + 2;
            var G__8755 = d__8750;
            s__8749 = G__8754;
            d__8750 = G__8755;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8748[d__8750] = this__8744.arr[s__8749];
              new_arr__8748[d__8750 + 1] = this__8744.arr[s__8749 + 1];
              var G__8756 = s__8749 + 2;
              var G__8757 = d__8750 + 2;
              s__8749 = G__8756;
              d__8750 = G__8757;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__8758 = cljs.core.count.call(null, ks);
  var i__8759 = 0;
  var out__8760 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8759 < len__8758) {
      var G__8761 = i__8759 + 1;
      var G__8762 = cljs.core.assoc_BANG_.call(null, out__8760, ks[i__8759], vs[i__8759]);
      i__8759 = G__8761;
      out__8760 = G__8762;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8760)
    }
    break
  }
};
goog.provide("cljs.core.TransientArrayMap");
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 56;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8763 = this;
  if(cljs.core.truth_(this__8763.editable_QMARK_)) {
    var idx__8764 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8764 >= 0) {
      this__8763.arr[idx__8764] = this__8763.arr[this__8763.len - 2];
      this__8763.arr[idx__8764 + 1] = this__8763.arr[this__8763.len - 1];
      var G__8765__8766 = this__8763.arr;
      G__8765__8766.pop();
      G__8765__8766.pop();
      G__8765__8766;
      this__8763.len = this__8763.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8767 = this;
  if(cljs.core.truth_(this__8767.editable_QMARK_)) {
    var idx__8768 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8768 === -1) {
      if(this__8767.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8767.len = this__8767.len + 2;
        this__8767.arr.push(key);
        this__8767.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8767.len, this__8767.arr), key, val)
      }
    }else {
      if(val === this__8767.arr[idx__8768 + 1]) {
        return tcoll
      }else {
        this__8767.arr[idx__8768 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8769 = this;
  if(cljs.core.truth_(this__8769.editable_QMARK_)) {
    if(function() {
      var G__8770__8771 = o;
      if(G__8770__8771) {
        if(function() {
          var or__3824__auto____8772 = G__8770__8771.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____8772) {
            return or__3824__auto____8772
          }else {
            return G__8770__8771.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8770__8771.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8770__8771)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8770__8771)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8773 = cljs.core.seq.call(null, o);
      var tcoll__8774 = tcoll;
      while(true) {
        var temp__3971__auto____8775 = cljs.core.first.call(null, es__8773);
        if(cljs.core.truth_(temp__3971__auto____8775)) {
          var e__8776 = temp__3971__auto____8775;
          var G__8782 = cljs.core.next.call(null, es__8773);
          var G__8783 = tcoll__8774.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8774, cljs.core.key.call(null, e__8776), cljs.core.val.call(null, e__8776));
          es__8773 = G__8782;
          tcoll__8774 = G__8783;
          continue
        }else {
          return tcoll__8774
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8777 = this;
  if(cljs.core.truth_(this__8777.editable_QMARK_)) {
    this__8777.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8777.len, 2), this__8777.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8778 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8779 = this;
  if(cljs.core.truth_(this__8779.editable_QMARK_)) {
    var idx__8780 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8780 === -1) {
      return not_found
    }else {
      return this__8779.arr[idx__8780 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8781 = this;
  if(cljs.core.truth_(this__8781.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8781.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8786 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8787 = 0;
  while(true) {
    if(i__8787 < len) {
      var G__8788 = cljs.core.assoc_BANG_.call(null, out__8786, arr[i__8787], arr[i__8787 + 1]);
      var G__8789 = i__8787 + 2;
      out__8786 = G__8788;
      i__8787 = G__8789;
      continue
    }else {
      return out__8786
    }
    break
  }
};
goog.provide("cljs.core.Box");
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2373__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box.cljs$lang$ctorPrWriter = function(this__2373__auto__, writer__2374__auto__) {
  return cljs.core._write.call(null, writer__2374__auto__, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__8794__8795 = arr.slice();
    G__8794__8795[i] = a;
    return G__8794__8795
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8796__8797 = arr.slice();
    G__8796__8797[i] = a;
    G__8796__8797[j] = b;
    return G__8796__8797
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__8799 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8799, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8799, 2 * i, new_arr__8799.length - 2 * i);
  return new_arr__8799
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__8802 = inode.ensure_editable(edit);
    editable__8802.arr[i] = a;
    return editable__8802
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8803 = inode.ensure_editable(edit);
    editable__8803.arr[i] = a;
    editable__8803.arr[j] = b;
    return editable__8803
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__8810 = arr.length;
  var i__8811 = 0;
  var init__8812 = init;
  while(true) {
    if(i__8811 < len__8810) {
      var init__8815 = function() {
        var k__8813 = arr[i__8811];
        if(!(k__8813 == null)) {
          return f.call(null, init__8812, k__8813, arr[i__8811 + 1])
        }else {
          var node__8814 = arr[i__8811 + 1];
          if(!(node__8814 == null)) {
            return node__8814.kv_reduce(f, init__8812)
          }else {
            return init__8812
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8815)) {
        return cljs.core.deref.call(null, init__8815)
      }else {
        var G__8816 = i__8811 + 2;
        var G__8817 = init__8815;
        i__8811 = G__8816;
        init__8812 = G__8817;
        continue
      }
    }else {
      return init__8812
    }
    break
  }
};
goog.provide("cljs.core.BitmapIndexedNode");
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__8818 = this;
  var inode__8819 = this;
  if(this__8818.bitmap === bit) {
    return null
  }else {
    var editable__8820 = inode__8819.ensure_editable(e);
    var earr__8821 = editable__8820.arr;
    var len__8822 = earr__8821.length;
    editable__8820.bitmap = bit ^ editable__8820.bitmap;
    cljs.core.array_copy.call(null, earr__8821, 2 * (i + 1), earr__8821, 2 * i, len__8822 - 2 * (i + 1));
    earr__8821[len__8822 - 2] = null;
    earr__8821[len__8822 - 1] = null;
    return editable__8820
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8823 = this;
  var inode__8824 = this;
  var bit__8825 = 1 << (hash >>> shift & 31);
  var idx__8826 = cljs.core.bitmap_indexed_node_index.call(null, this__8823.bitmap, bit__8825);
  if((this__8823.bitmap & bit__8825) === 0) {
    var n__8827 = cljs.core.bit_count.call(null, this__8823.bitmap);
    if(2 * n__8827 < this__8823.arr.length) {
      var editable__8828 = inode__8824.ensure_editable(edit);
      var earr__8829 = editable__8828.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8829, 2 * idx__8826, earr__8829, 2 * (idx__8826 + 1), 2 * (n__8827 - idx__8826));
      earr__8829[2 * idx__8826] = key;
      earr__8829[2 * idx__8826 + 1] = val;
      editable__8828.bitmap = editable__8828.bitmap | bit__8825;
      return editable__8828
    }else {
      if(n__8827 >= 16) {
        var nodes__8830 = cljs.core.make_array.call(null, 32);
        var jdx__8831 = hash >>> shift & 31;
        nodes__8830[jdx__8831] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8832 = 0;
        var j__8833 = 0;
        while(true) {
          if(i__8832 < 32) {
            if((this__8823.bitmap >>> i__8832 & 1) === 0) {
              var G__8886 = i__8832 + 1;
              var G__8887 = j__8833;
              i__8832 = G__8886;
              j__8833 = G__8887;
              continue
            }else {
              nodes__8830[i__8832] = !(this__8823.arr[j__8833] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8823.arr[j__8833]), this__8823.arr[j__8833], this__8823.arr[j__8833 + 1], added_leaf_QMARK_) : this__8823.arr[j__8833 + 1];
              var G__8888 = i__8832 + 1;
              var G__8889 = j__8833 + 2;
              i__8832 = G__8888;
              j__8833 = G__8889;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8827 + 1, nodes__8830)
      }else {
        if("\ufdd0'else") {
          var new_arr__8834 = cljs.core.make_array.call(null, 2 * (n__8827 + 4));
          cljs.core.array_copy.call(null, this__8823.arr, 0, new_arr__8834, 0, 2 * idx__8826);
          new_arr__8834[2 * idx__8826] = key;
          new_arr__8834[2 * idx__8826 + 1] = val;
          cljs.core.array_copy.call(null, this__8823.arr, 2 * idx__8826, new_arr__8834, 2 * (idx__8826 + 1), 2 * (n__8827 - idx__8826));
          added_leaf_QMARK_.val = true;
          var editable__8835 = inode__8824.ensure_editable(edit);
          editable__8835.arr = new_arr__8834;
          editable__8835.bitmap = editable__8835.bitmap | bit__8825;
          return editable__8835
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8836 = this__8823.arr[2 * idx__8826];
    var val_or_node__8837 = this__8823.arr[2 * idx__8826 + 1];
    if(key_or_nil__8836 == null) {
      var n__8838 = val_or_node__8837.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8838 === val_or_node__8837) {
        return inode__8824
      }else {
        return cljs.core.edit_and_set.call(null, inode__8824, edit, 2 * idx__8826 + 1, n__8838)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8836)) {
        if(val === val_or_node__8837) {
          return inode__8824
        }else {
          return cljs.core.edit_and_set.call(null, inode__8824, edit, 2 * idx__8826 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8824, edit, 2 * idx__8826, null, 2 * idx__8826 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8836, val_or_node__8837, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8839 = this;
  var inode__8840 = this;
  return cljs.core.create_inode_seq.call(null, this__8839.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8841 = this;
  var inode__8842 = this;
  var bit__8843 = 1 << (hash >>> shift & 31);
  if((this__8841.bitmap & bit__8843) === 0) {
    return inode__8842
  }else {
    var idx__8844 = cljs.core.bitmap_indexed_node_index.call(null, this__8841.bitmap, bit__8843);
    var key_or_nil__8845 = this__8841.arr[2 * idx__8844];
    var val_or_node__8846 = this__8841.arr[2 * idx__8844 + 1];
    if(key_or_nil__8845 == null) {
      var n__8847 = val_or_node__8846.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8847 === val_or_node__8846) {
        return inode__8842
      }else {
        if(!(n__8847 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8842, edit, 2 * idx__8844 + 1, n__8847)
        }else {
          if(this__8841.bitmap === bit__8843) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8842.edit_and_remove_pair(edit, bit__8843, idx__8844)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8845)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8842.edit_and_remove_pair(edit, bit__8843, idx__8844)
      }else {
        if("\ufdd0'else") {
          return inode__8842
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8848 = this;
  var inode__8849 = this;
  if(e === this__8848.edit) {
    return inode__8849
  }else {
    var n__8850 = cljs.core.bit_count.call(null, this__8848.bitmap);
    var new_arr__8851 = cljs.core.make_array.call(null, n__8850 < 0 ? 4 : 2 * (n__8850 + 1));
    cljs.core.array_copy.call(null, this__8848.arr, 0, new_arr__8851, 0, 2 * n__8850);
    return new cljs.core.BitmapIndexedNode(e, this__8848.bitmap, new_arr__8851)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8852 = this;
  var inode__8853 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8852.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8854 = this;
  var inode__8855 = this;
  var bit__8856 = 1 << (hash >>> shift & 31);
  if((this__8854.bitmap & bit__8856) === 0) {
    return not_found
  }else {
    var idx__8857 = cljs.core.bitmap_indexed_node_index.call(null, this__8854.bitmap, bit__8856);
    var key_or_nil__8858 = this__8854.arr[2 * idx__8857];
    var val_or_node__8859 = this__8854.arr[2 * idx__8857 + 1];
    if(key_or_nil__8858 == null) {
      return val_or_node__8859.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8858)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8858, val_or_node__8859], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__8860 = this;
  var inode__8861 = this;
  var bit__8862 = 1 << (hash >>> shift & 31);
  if((this__8860.bitmap & bit__8862) === 0) {
    return inode__8861
  }else {
    var idx__8863 = cljs.core.bitmap_indexed_node_index.call(null, this__8860.bitmap, bit__8862);
    var key_or_nil__8864 = this__8860.arr[2 * idx__8863];
    var val_or_node__8865 = this__8860.arr[2 * idx__8863 + 1];
    if(key_or_nil__8864 == null) {
      var n__8866 = val_or_node__8865.inode_without(shift + 5, hash, key);
      if(n__8866 === val_or_node__8865) {
        return inode__8861
      }else {
        if(!(n__8866 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8860.bitmap, cljs.core.clone_and_set.call(null, this__8860.arr, 2 * idx__8863 + 1, n__8866))
        }else {
          if(this__8860.bitmap === bit__8862) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8860.bitmap ^ bit__8862, cljs.core.remove_pair.call(null, this__8860.arr, idx__8863))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8864)) {
        return new cljs.core.BitmapIndexedNode(null, this__8860.bitmap ^ bit__8862, cljs.core.remove_pair.call(null, this__8860.arr, idx__8863))
      }else {
        if("\ufdd0'else") {
          return inode__8861
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8867 = this;
  var inode__8868 = this;
  var bit__8869 = 1 << (hash >>> shift & 31);
  var idx__8870 = cljs.core.bitmap_indexed_node_index.call(null, this__8867.bitmap, bit__8869);
  if((this__8867.bitmap & bit__8869) === 0) {
    var n__8871 = cljs.core.bit_count.call(null, this__8867.bitmap);
    if(n__8871 >= 16) {
      var nodes__8872 = cljs.core.make_array.call(null, 32);
      var jdx__8873 = hash >>> shift & 31;
      nodes__8872[jdx__8873] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8874 = 0;
      var j__8875 = 0;
      while(true) {
        if(i__8874 < 32) {
          if((this__8867.bitmap >>> i__8874 & 1) === 0) {
            var G__8890 = i__8874 + 1;
            var G__8891 = j__8875;
            i__8874 = G__8890;
            j__8875 = G__8891;
            continue
          }else {
            nodes__8872[i__8874] = !(this__8867.arr[j__8875] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8867.arr[j__8875]), this__8867.arr[j__8875], this__8867.arr[j__8875 + 1], added_leaf_QMARK_) : this__8867.arr[j__8875 + 1];
            var G__8892 = i__8874 + 1;
            var G__8893 = j__8875 + 2;
            i__8874 = G__8892;
            j__8875 = G__8893;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8871 + 1, nodes__8872)
    }else {
      var new_arr__8876 = cljs.core.make_array.call(null, 2 * (n__8871 + 1));
      cljs.core.array_copy.call(null, this__8867.arr, 0, new_arr__8876, 0, 2 * idx__8870);
      new_arr__8876[2 * idx__8870] = key;
      new_arr__8876[2 * idx__8870 + 1] = val;
      cljs.core.array_copy.call(null, this__8867.arr, 2 * idx__8870, new_arr__8876, 2 * (idx__8870 + 1), 2 * (n__8871 - idx__8870));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8867.bitmap | bit__8869, new_arr__8876)
    }
  }else {
    var key_or_nil__8877 = this__8867.arr[2 * idx__8870];
    var val_or_node__8878 = this__8867.arr[2 * idx__8870 + 1];
    if(key_or_nil__8877 == null) {
      var n__8879 = val_or_node__8878.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8879 === val_or_node__8878) {
        return inode__8868
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8867.bitmap, cljs.core.clone_and_set.call(null, this__8867.arr, 2 * idx__8870 + 1, n__8879))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8877)) {
        if(val === val_or_node__8878) {
          return inode__8868
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8867.bitmap, cljs.core.clone_and_set.call(null, this__8867.arr, 2 * idx__8870 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8867.bitmap, cljs.core.clone_and_set.call(null, this__8867.arr, 2 * idx__8870, null, 2 * idx__8870 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8877, val_or_node__8878, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8880 = this;
  var inode__8881 = this;
  var bit__8882 = 1 << (hash >>> shift & 31);
  if((this__8880.bitmap & bit__8882) === 0) {
    return not_found
  }else {
    var idx__8883 = cljs.core.bitmap_indexed_node_index.call(null, this__8880.bitmap, bit__8882);
    var key_or_nil__8884 = this__8880.arr[2 * idx__8883];
    var val_or_node__8885 = this__8880.arr[2 * idx__8883 + 1];
    if(key_or_nil__8884 == null) {
      return val_or_node__8885.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8884)) {
        return val_or_node__8885
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__8901 = array_node.arr;
  var len__8902 = 2 * (array_node.cnt - 1);
  var new_arr__8903 = cljs.core.make_array.call(null, len__8902);
  var i__8904 = 0;
  var j__8905 = 1;
  var bitmap__8906 = 0;
  while(true) {
    if(i__8904 < len__8902) {
      if(function() {
        var and__3822__auto____8907 = !(i__8904 === idx);
        if(and__3822__auto____8907) {
          return!(arr__8901[i__8904] == null)
        }else {
          return and__3822__auto____8907
        }
      }()) {
        new_arr__8903[j__8905] = arr__8901[i__8904];
        var G__8908 = i__8904 + 1;
        var G__8909 = j__8905 + 2;
        var G__8910 = bitmap__8906 | 1 << i__8904;
        i__8904 = G__8908;
        j__8905 = G__8909;
        bitmap__8906 = G__8910;
        continue
      }else {
        var G__8911 = i__8904 + 1;
        var G__8912 = j__8905;
        var G__8913 = bitmap__8906;
        i__8904 = G__8911;
        j__8905 = G__8912;
        bitmap__8906 = G__8913;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8906, new_arr__8903)
    }
    break
  }
};
goog.provide("cljs.core.ArrayNode");
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8914 = this;
  var inode__8915 = this;
  var idx__8916 = hash >>> shift & 31;
  var node__8917 = this__8914.arr[idx__8916];
  if(node__8917 == null) {
    var editable__8918 = cljs.core.edit_and_set.call(null, inode__8915, edit, idx__8916, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8918.cnt = editable__8918.cnt + 1;
    return editable__8918
  }else {
    var n__8919 = node__8917.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8919 === node__8917) {
      return inode__8915
    }else {
      return cljs.core.edit_and_set.call(null, inode__8915, edit, idx__8916, n__8919)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8920 = this;
  var inode__8921 = this;
  return cljs.core.create_array_node_seq.call(null, this__8920.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8922 = this;
  var inode__8923 = this;
  var idx__8924 = hash >>> shift & 31;
  var node__8925 = this__8922.arr[idx__8924];
  if(node__8925 == null) {
    return inode__8923
  }else {
    var n__8926 = node__8925.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8926 === node__8925) {
      return inode__8923
    }else {
      if(n__8926 == null) {
        if(this__8922.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8923, edit, idx__8924)
        }else {
          var editable__8927 = cljs.core.edit_and_set.call(null, inode__8923, edit, idx__8924, n__8926);
          editable__8927.cnt = editable__8927.cnt - 1;
          return editable__8927
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8923, edit, idx__8924, n__8926)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8928 = this;
  var inode__8929 = this;
  if(e === this__8928.edit) {
    return inode__8929
  }else {
    return new cljs.core.ArrayNode(e, this__8928.cnt, this__8928.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8930 = this;
  var inode__8931 = this;
  var len__8932 = this__8930.arr.length;
  var i__8933 = 0;
  var init__8934 = init;
  while(true) {
    if(i__8933 < len__8932) {
      var node__8935 = this__8930.arr[i__8933];
      if(!(node__8935 == null)) {
        var init__8936 = node__8935.kv_reduce(f, init__8934);
        if(cljs.core.reduced_QMARK_.call(null, init__8936)) {
          return cljs.core.deref.call(null, init__8936)
        }else {
          var G__8955 = i__8933 + 1;
          var G__8956 = init__8936;
          i__8933 = G__8955;
          init__8934 = G__8956;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8934
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8937 = this;
  var inode__8938 = this;
  var idx__8939 = hash >>> shift & 31;
  var node__8940 = this__8937.arr[idx__8939];
  if(!(node__8940 == null)) {
    return node__8940.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8941 = this;
  var inode__8942 = this;
  var idx__8943 = hash >>> shift & 31;
  var node__8944 = this__8941.arr[idx__8943];
  if(!(node__8944 == null)) {
    var n__8945 = node__8944.inode_without(shift + 5, hash, key);
    if(n__8945 === node__8944) {
      return inode__8942
    }else {
      if(n__8945 == null) {
        if(this__8941.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8942, null, idx__8943)
        }else {
          return new cljs.core.ArrayNode(null, this__8941.cnt - 1, cljs.core.clone_and_set.call(null, this__8941.arr, idx__8943, n__8945))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8941.cnt, cljs.core.clone_and_set.call(null, this__8941.arr, idx__8943, n__8945))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8942
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8946 = this;
  var inode__8947 = this;
  var idx__8948 = hash >>> shift & 31;
  var node__8949 = this__8946.arr[idx__8948];
  if(node__8949 == null) {
    return new cljs.core.ArrayNode(null, this__8946.cnt + 1, cljs.core.clone_and_set.call(null, this__8946.arr, idx__8948, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8950 = node__8949.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8950 === node__8949) {
      return inode__8947
    }else {
      return new cljs.core.ArrayNode(null, this__8946.cnt, cljs.core.clone_and_set.call(null, this__8946.arr, idx__8948, n__8950))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8951 = this;
  var inode__8952 = this;
  var idx__8953 = hash >>> shift & 31;
  var node__8954 = this__8951.arr[idx__8953];
  if(!(node__8954 == null)) {
    return node__8954.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8959 = 2 * cnt;
  var i__8960 = 0;
  while(true) {
    if(i__8960 < lim__8959) {
      if(cljs.core.key_test.call(null, key, arr[i__8960])) {
        return i__8960
      }else {
        var G__8961 = i__8960 + 2;
        i__8960 = G__8961;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
goog.provide("cljs.core.HashCollisionNode");
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8962 = this;
  var inode__8963 = this;
  if(hash === this__8962.collision_hash) {
    var idx__8964 = cljs.core.hash_collision_node_find_index.call(null, this__8962.arr, this__8962.cnt, key);
    if(idx__8964 === -1) {
      if(this__8962.arr.length > 2 * this__8962.cnt) {
        var editable__8965 = cljs.core.edit_and_set.call(null, inode__8963, edit, 2 * this__8962.cnt, key, 2 * this__8962.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8965.cnt = editable__8965.cnt + 1;
        return editable__8965
      }else {
        var len__8966 = this__8962.arr.length;
        var new_arr__8967 = cljs.core.make_array.call(null, len__8966 + 2);
        cljs.core.array_copy.call(null, this__8962.arr, 0, new_arr__8967, 0, len__8966);
        new_arr__8967[len__8966] = key;
        new_arr__8967[len__8966 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8963.ensure_editable_array(edit, this__8962.cnt + 1, new_arr__8967)
      }
    }else {
      if(this__8962.arr[idx__8964 + 1] === val) {
        return inode__8963
      }else {
        return cljs.core.edit_and_set.call(null, inode__8963, edit, idx__8964 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8962.collision_hash >>> shift & 31), [null, inode__8963, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8968 = this;
  var inode__8969 = this;
  return cljs.core.create_inode_seq.call(null, this__8968.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8970 = this;
  var inode__8971 = this;
  var idx__8972 = cljs.core.hash_collision_node_find_index.call(null, this__8970.arr, this__8970.cnt, key);
  if(idx__8972 === -1) {
    return inode__8971
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8970.cnt === 1) {
      return null
    }else {
      var editable__8973 = inode__8971.ensure_editable(edit);
      var earr__8974 = editable__8973.arr;
      earr__8974[idx__8972] = earr__8974[2 * this__8970.cnt - 2];
      earr__8974[idx__8972 + 1] = earr__8974[2 * this__8970.cnt - 1];
      earr__8974[2 * this__8970.cnt - 1] = null;
      earr__8974[2 * this__8970.cnt - 2] = null;
      editable__8973.cnt = editable__8973.cnt - 1;
      return editable__8973
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8975 = this;
  var inode__8976 = this;
  if(e === this__8975.edit) {
    return inode__8976
  }else {
    var new_arr__8977 = cljs.core.make_array.call(null, 2 * (this__8975.cnt + 1));
    cljs.core.array_copy.call(null, this__8975.arr, 0, new_arr__8977, 0, 2 * this__8975.cnt);
    return new cljs.core.HashCollisionNode(e, this__8975.collision_hash, this__8975.cnt, new_arr__8977)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8978 = this;
  var inode__8979 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8978.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8980 = this;
  var inode__8981 = this;
  var idx__8982 = cljs.core.hash_collision_node_find_index.call(null, this__8980.arr, this__8980.cnt, key);
  if(idx__8982 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8980.arr[idx__8982])) {
      return cljs.core.PersistentVector.fromArray([this__8980.arr[idx__8982], this__8980.arr[idx__8982 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__8983 = this;
  var inode__8984 = this;
  var idx__8985 = cljs.core.hash_collision_node_find_index.call(null, this__8983.arr, this__8983.cnt, key);
  if(idx__8985 === -1) {
    return inode__8984
  }else {
    if(this__8983.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8983.collision_hash, this__8983.cnt - 1, cljs.core.remove_pair.call(null, this__8983.arr, cljs.core.quot.call(null, idx__8985, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8986 = this;
  var inode__8987 = this;
  if(hash === this__8986.collision_hash) {
    var idx__8988 = cljs.core.hash_collision_node_find_index.call(null, this__8986.arr, this__8986.cnt, key);
    if(idx__8988 === -1) {
      var len__8989 = this__8986.arr.length;
      var new_arr__8990 = cljs.core.make_array.call(null, len__8989 + 2);
      cljs.core.array_copy.call(null, this__8986.arr, 0, new_arr__8990, 0, len__8989);
      new_arr__8990[len__8989] = key;
      new_arr__8990[len__8989 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8986.collision_hash, this__8986.cnt + 1, new_arr__8990)
    }else {
      if(cljs.core._EQ_.call(null, this__8986.arr[idx__8988], val)) {
        return inode__8987
      }else {
        return new cljs.core.HashCollisionNode(null, this__8986.collision_hash, this__8986.cnt, cljs.core.clone_and_set.call(null, this__8986.arr, idx__8988 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8986.collision_hash >>> shift & 31), [null, inode__8987])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8991 = this;
  var inode__8992 = this;
  var idx__8993 = cljs.core.hash_collision_node_find_index.call(null, this__8991.arr, this__8991.cnt, key);
  if(idx__8993 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8991.arr[idx__8993])) {
      return this__8991.arr[idx__8993 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__8994 = this;
  var inode__8995 = this;
  if(e === this__8994.edit) {
    this__8994.arr = array;
    this__8994.cnt = count;
    return inode__8995
  }else {
    return new cljs.core.HashCollisionNode(this__8994.edit, this__8994.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9000 = cljs.core.hash.call(null, key1);
    if(key1hash__9000 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9000, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9001 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__9000, key1, val1, added_leaf_QMARK___9001).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___9001)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9002 = cljs.core.hash.call(null, key1);
    if(key1hash__9002 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9002, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9003 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__9002, key1, val1, added_leaf_QMARK___9003).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___9003)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
goog.provide("cljs.core.NodeSeq");
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9004 = this;
  var h__2252__auto____9005 = this__9004.__hash;
  if(!(h__2252__auto____9005 == null)) {
    return h__2252__auto____9005
  }else {
    var h__2252__auto____9006 = cljs.core.hash_coll.call(null, coll);
    this__9004.__hash = h__2252__auto____9006;
    return h__2252__auto____9006
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9007 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__9008 = this;
  var this__9009 = this;
  return cljs.core.pr_str.call(null, this__9009)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9010 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9011 = this;
  if(this__9011.s == null) {
    return cljs.core.PersistentVector.fromArray([this__9011.nodes[this__9011.i], this__9011.nodes[this__9011.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__9011.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9012 = this;
  if(this__9012.s == null) {
    return cljs.core.create_inode_seq.call(null, this__9012.nodes, this__9012.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__9012.nodes, this__9012.i, cljs.core.next.call(null, this__9012.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9013 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9014 = this;
  return new cljs.core.NodeSeq(meta, this__9014.nodes, this__9014.i, this__9014.s, this__9014.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9015 = this;
  return this__9015.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9016 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9016.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__9023 = nodes.length;
      var j__9024 = i;
      while(true) {
        if(j__9024 < len__9023) {
          if(!(nodes[j__9024] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__9024, null, null)
          }else {
            var temp__3971__auto____9025 = nodes[j__9024 + 1];
            if(cljs.core.truth_(temp__3971__auto____9025)) {
              var node__9026 = temp__3971__auto____9025;
              var temp__3971__auto____9027 = node__9026.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____9027)) {
                var node_seq__9028 = temp__3971__auto____9027;
                return new cljs.core.NodeSeq(null, nodes, j__9024 + 2, node_seq__9028, null)
              }else {
                var G__9029 = j__9024 + 2;
                j__9024 = G__9029;
                continue
              }
            }else {
              var G__9030 = j__9024 + 2;
              j__9024 = G__9030;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
goog.provide("cljs.core.ArrayNodeSeq");
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9031 = this;
  var h__2252__auto____9032 = this__9031.__hash;
  if(!(h__2252__auto____9032 == null)) {
    return h__2252__auto____9032
  }else {
    var h__2252__auto____9033 = cljs.core.hash_coll.call(null, coll);
    this__9031.__hash = h__2252__auto____9033;
    return h__2252__auto____9033
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9034 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__9035 = this;
  var this__9036 = this;
  return cljs.core.pr_str.call(null, this__9036)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9037 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9038 = this;
  return cljs.core.first.call(null, this__9038.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9039 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__9039.nodes, this__9039.i, cljs.core.next.call(null, this__9039.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9040 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9041 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__9041.nodes, this__9041.i, this__9041.s, this__9041.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9042 = this;
  return this__9042.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9043 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9043.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__9050 = nodes.length;
      var j__9051 = i;
      while(true) {
        if(j__9051 < len__9050) {
          var temp__3971__auto____9052 = nodes[j__9051];
          if(cljs.core.truth_(temp__3971__auto____9052)) {
            var nj__9053 = temp__3971__auto____9052;
            var temp__3971__auto____9054 = nj__9053.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____9054)) {
              var ns__9055 = temp__3971__auto____9054;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__9051 + 1, ns__9055, null)
            }else {
              var G__9056 = j__9051 + 1;
              j__9051 = G__9056;
              continue
            }
          }else {
            var G__9057 = j__9051 + 1;
            j__9051 = G__9057;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
goog.provide("cljs.core.PersistentHashMap");
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9060 = this;
  return new cljs.core.TransientHashMap({}, this__9060.root, this__9060.cnt, this__9060.has_nil_QMARK_, this__9060.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9061 = this;
  var h__2252__auto____9062 = this__9061.__hash;
  if(!(h__2252__auto____9062 == null)) {
    return h__2252__auto____9062
  }else {
    var h__2252__auto____9063 = cljs.core.hash_imap.call(null, coll);
    this__9061.__hash = h__2252__auto____9063;
    return h__2252__auto____9063
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9064 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9065 = this;
  if(k == null) {
    if(this__9065.has_nil_QMARK_) {
      return this__9065.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9065.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__9065.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9066 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____9067 = this__9066.has_nil_QMARK_;
      if(and__3822__auto____9067) {
        return v === this__9066.nil_val
      }else {
        return and__3822__auto____9067
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9066.meta, this__9066.has_nil_QMARK_ ? this__9066.cnt : this__9066.cnt + 1, this__9066.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9068 = new cljs.core.Box(false);
    var new_root__9069 = (this__9066.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9066.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9068);
    if(new_root__9069 === this__9066.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9066.meta, added_leaf_QMARK___9068.val ? this__9066.cnt + 1 : this__9066.cnt, new_root__9069, this__9066.has_nil_QMARK_, this__9066.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9070 = this;
  if(k == null) {
    return this__9070.has_nil_QMARK_
  }else {
    if(this__9070.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9070.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9093 = null;
  var G__9093__2 = function(this_sym9071, k) {
    var this__9073 = this;
    var this_sym9071__9074 = this;
    var coll__9075 = this_sym9071__9074;
    return coll__9075.cljs$core$ILookup$_lookup$arity$2(coll__9075, k)
  };
  var G__9093__3 = function(this_sym9072, k, not_found) {
    var this__9073 = this;
    var this_sym9072__9076 = this;
    var coll__9077 = this_sym9072__9076;
    return coll__9077.cljs$core$ILookup$_lookup$arity$3(coll__9077, k, not_found)
  };
  G__9093 = function(this_sym9072, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9093__2.call(this, this_sym9072, k);
      case 3:
        return G__9093__3.call(this, this_sym9072, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9093
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym9058, args9059) {
  var this__9078 = this;
  return this_sym9058.call.apply(this_sym9058, [this_sym9058].concat(args9059.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9079 = this;
  var init__9080 = this__9079.has_nil_QMARK_ ? f.call(null, init, null, this__9079.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9080)) {
    return cljs.core.deref.call(null, init__9080)
  }else {
    if(!(this__9079.root == null)) {
      return this__9079.root.kv_reduce(f, init__9080)
    }else {
      if("\ufdd0'else") {
        return init__9080
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9081 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9082 = this;
  var this__9083 = this;
  return cljs.core.pr_str.call(null, this__9083)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9084 = this;
  if(this__9084.cnt > 0) {
    var s__9085 = !(this__9084.root == null) ? this__9084.root.inode_seq() : null;
    if(this__9084.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9084.nil_val], true), s__9085)
    }else {
      return s__9085
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9086 = this;
  return this__9086.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9087 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9088 = this;
  return new cljs.core.PersistentHashMap(meta, this__9088.cnt, this__9088.root, this__9088.has_nil_QMARK_, this__9088.nil_val, this__9088.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9089 = this;
  return this__9089.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9090 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9090.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9091 = this;
  if(k == null) {
    if(this__9091.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9091.meta, this__9091.cnt - 1, this__9091.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9091.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9092 = this__9091.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9092 === this__9091.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9091.meta, this__9091.cnt - 1, new_root__9092, this__9091.has_nil_QMARK_, this__9091.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__9094 = ks.length;
  var i__9095 = 0;
  var out__9096 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9095 < len__9094) {
      var G__9097 = i__9095 + 1;
      var G__9098 = cljs.core.assoc_BANG_.call(null, out__9096, ks[i__9095], vs[i__9095]);
      i__9095 = G__9097;
      out__9096 = G__9098;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9096)
    }
    break
  }
};
goog.provide("cljs.core.TransientHashMap");
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 56;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9099 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9100 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9101 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9102 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9103 = this;
  if(k == null) {
    if(this__9103.has_nil_QMARK_) {
      return this__9103.nil_val
    }else {
      return null
    }
  }else {
    if(this__9103.root == null) {
      return null
    }else {
      return this__9103.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9104 = this;
  if(k == null) {
    if(this__9104.has_nil_QMARK_) {
      return this__9104.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9104.root == null) {
      return not_found
    }else {
      return this__9104.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9105 = this;
  if(this__9105.edit) {
    return this__9105.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9106 = this;
  var tcoll__9107 = this;
  if(this__9106.edit) {
    if(function() {
      var G__9108__9109 = o;
      if(G__9108__9109) {
        if(function() {
          var or__3824__auto____9110 = G__9108__9109.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9110) {
            return or__3824__auto____9110
          }else {
            return G__9108__9109.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9108__9109.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9108__9109)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9108__9109)
      }
    }()) {
      return tcoll__9107.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9111 = cljs.core.seq.call(null, o);
      var tcoll__9112 = tcoll__9107;
      while(true) {
        var temp__3971__auto____9113 = cljs.core.first.call(null, es__9111);
        if(cljs.core.truth_(temp__3971__auto____9113)) {
          var e__9114 = temp__3971__auto____9113;
          var G__9125 = cljs.core.next.call(null, es__9111);
          var G__9126 = tcoll__9112.assoc_BANG_(cljs.core.key.call(null, e__9114), cljs.core.val.call(null, e__9114));
          es__9111 = G__9125;
          tcoll__9112 = G__9126;
          continue
        }else {
          return tcoll__9112
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9115 = this;
  var tcoll__9116 = this;
  if(this__9115.edit) {
    if(k == null) {
      if(this__9115.nil_val === v) {
      }else {
        this__9115.nil_val = v
      }
      if(this__9115.has_nil_QMARK_) {
      }else {
        this__9115.count = this__9115.count + 1;
        this__9115.has_nil_QMARK_ = true
      }
      return tcoll__9116
    }else {
      var added_leaf_QMARK___9117 = new cljs.core.Box(false);
      var node__9118 = (this__9115.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9115.root).inode_assoc_BANG_(this__9115.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9117);
      if(node__9118 === this__9115.root) {
      }else {
        this__9115.root = node__9118
      }
      if(added_leaf_QMARK___9117.val) {
        this__9115.count = this__9115.count + 1
      }else {
      }
      return tcoll__9116
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9119 = this;
  var tcoll__9120 = this;
  if(this__9119.edit) {
    if(k == null) {
      if(this__9119.has_nil_QMARK_) {
        this__9119.has_nil_QMARK_ = false;
        this__9119.nil_val = null;
        this__9119.count = this__9119.count - 1;
        return tcoll__9120
      }else {
        return tcoll__9120
      }
    }else {
      if(this__9119.root == null) {
        return tcoll__9120
      }else {
        var removed_leaf_QMARK___9121 = new cljs.core.Box(false);
        var node__9122 = this__9119.root.inode_without_BANG_(this__9119.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9121);
        if(node__9122 === this__9119.root) {
        }else {
          this__9119.root = node__9122
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9121[0])) {
          this__9119.count = this__9119.count - 1
        }else {
        }
        return tcoll__9120
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9123 = this;
  var tcoll__9124 = this;
  if(this__9123.edit) {
    this__9123.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9123.count, this__9123.root, this__9123.has_nil_QMARK_, this__9123.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9129 = node;
  var stack__9130 = stack;
  while(true) {
    if(!(t__9129 == null)) {
      var G__9131 = ascending_QMARK_ ? t__9129.left : t__9129.right;
      var G__9132 = cljs.core.conj.call(null, stack__9130, t__9129);
      t__9129 = G__9131;
      stack__9130 = G__9132;
      continue
    }else {
      return stack__9130
    }
    break
  }
};
goog.provide("cljs.core.PersistentTreeMapSeq");
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850574
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9133 = this;
  var h__2252__auto____9134 = this__9133.__hash;
  if(!(h__2252__auto____9134 == null)) {
    return h__2252__auto____9134
  }else {
    var h__2252__auto____9135 = cljs.core.hash_coll.call(null, coll);
    this__9133.__hash = h__2252__auto____9135;
    return h__2252__auto____9135
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9136 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9137 = this;
  var this__9138 = this;
  return cljs.core.pr_str.call(null, this__9138)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9139 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9140 = this;
  if(this__9140.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9140.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9141 = this;
  return cljs.core.peek.call(null, this__9141.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9142 = this;
  var t__9143 = cljs.core.first.call(null, this__9142.stack);
  var next_stack__9144 = cljs.core.tree_map_seq_push.call(null, this__9142.ascending_QMARK_ ? t__9143.right : t__9143.left, cljs.core.next.call(null, this__9142.stack), this__9142.ascending_QMARK_);
  if(!(next_stack__9144 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9144, this__9142.ascending_QMARK_, this__9142.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9145 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9146 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9146.stack, this__9146.ascending_QMARK_, this__9146.cnt, this__9146.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9147 = this;
  return this__9147.meta
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9148 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9148.meta)
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____9150 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9150) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9150
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____9152 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9152) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9152
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9156 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9156)) {
    return cljs.core.deref.call(null, init__9156)
  }else {
    var init__9157 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9156) : init__9156;
    if(cljs.core.reduced_QMARK_.call(null, init__9157)) {
      return cljs.core.deref.call(null, init__9157)
    }else {
      var init__9158 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9157) : init__9157;
      if(cljs.core.reduced_QMARK_.call(null, init__9158)) {
        return cljs.core.deref.call(null, init__9158)
      }else {
        return init__9158
      }
    }
  }
};
goog.provide("cljs.core.BlackNode");
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9161 = this;
  var h__2252__auto____9162 = this__9161.__hash;
  if(!(h__2252__auto____9162 == null)) {
    return h__2252__auto____9162
  }else {
    var h__2252__auto____9163 = cljs.core.hash_coll.call(null, coll);
    this__9161.__hash = h__2252__auto____9163;
    return h__2252__auto____9163
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9164 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9165 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9166 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9166.key, this__9166.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9214 = null;
  var G__9214__2 = function(this_sym9167, k) {
    var this__9169 = this;
    var this_sym9167__9170 = this;
    var node__9171 = this_sym9167__9170;
    return node__9171.cljs$core$ILookup$_lookup$arity$2(node__9171, k)
  };
  var G__9214__3 = function(this_sym9168, k, not_found) {
    var this__9169 = this;
    var this_sym9168__9172 = this;
    var node__9173 = this_sym9168__9172;
    return node__9173.cljs$core$ILookup$_lookup$arity$3(node__9173, k, not_found)
  };
  G__9214 = function(this_sym9168, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9214__2.call(this, this_sym9168, k);
      case 3:
        return G__9214__3.call(this, this_sym9168, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9214
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9159, args9160) {
  var this__9174 = this;
  return this_sym9159.call.apply(this_sym9159, [this_sym9159].concat(args9160.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9175 = this;
  return cljs.core.PersistentVector.fromArray([this__9175.key, this__9175.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9176 = this;
  return this__9176.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9177 = this;
  return this__9177.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9178 = this;
  var node__9179 = this;
  return ins.balance_right(node__9179)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9180 = this;
  var node__9181 = this;
  return new cljs.core.RedNode(this__9180.key, this__9180.val, this__9180.left, this__9180.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9182 = this;
  var node__9183 = this;
  return cljs.core.balance_right_del.call(null, this__9182.key, this__9182.val, this__9182.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9184 = this;
  var node__9185 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9186 = this;
  var node__9187 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9187, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9188 = this;
  var node__9189 = this;
  return cljs.core.balance_left_del.call(null, this__9188.key, this__9188.val, del, this__9188.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9190 = this;
  var node__9191 = this;
  return ins.balance_left(node__9191)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9192 = this;
  var node__9193 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9193, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9215 = null;
  var G__9215__0 = function() {
    var this__9194 = this;
    var this__9196 = this;
    return cljs.core.pr_str.call(null, this__9196)
  };
  G__9215 = function() {
    switch(arguments.length) {
      case 0:
        return G__9215__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9215
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9197 = this;
  var node__9198 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9198, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9199 = this;
  var node__9200 = this;
  return node__9200
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9201 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9202 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9203 = this;
  return cljs.core.list.call(null, this__9203.key, this__9203.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9204 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9205 = this;
  return this__9205.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9206 = this;
  return cljs.core.PersistentVector.fromArray([this__9206.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9207 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9207.key, this__9207.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9208 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9209 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9209.key, this__9209.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9210 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9211 = this;
  if(n === 0) {
    return this__9211.key
  }else {
    if(n === 1) {
      return this__9211.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9212 = this;
  if(n === 0) {
    return this__9212.key
  }else {
    if(n === 1) {
      return this__9212.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9213 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
goog.provide("cljs.core.RedNode");
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9218 = this;
  var h__2252__auto____9219 = this__9218.__hash;
  if(!(h__2252__auto____9219 == null)) {
    return h__2252__auto____9219
  }else {
    var h__2252__auto____9220 = cljs.core.hash_coll.call(null, coll);
    this__9218.__hash = h__2252__auto____9220;
    return h__2252__auto____9220
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9221 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9222 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9223 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9223.key, this__9223.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9271 = null;
  var G__9271__2 = function(this_sym9224, k) {
    var this__9226 = this;
    var this_sym9224__9227 = this;
    var node__9228 = this_sym9224__9227;
    return node__9228.cljs$core$ILookup$_lookup$arity$2(node__9228, k)
  };
  var G__9271__3 = function(this_sym9225, k, not_found) {
    var this__9226 = this;
    var this_sym9225__9229 = this;
    var node__9230 = this_sym9225__9229;
    return node__9230.cljs$core$ILookup$_lookup$arity$3(node__9230, k, not_found)
  };
  G__9271 = function(this_sym9225, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9271__2.call(this, this_sym9225, k);
      case 3:
        return G__9271__3.call(this, this_sym9225, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9271
}();
cljs.core.RedNode.prototype.apply = function(this_sym9216, args9217) {
  var this__9231 = this;
  return this_sym9216.call.apply(this_sym9216, [this_sym9216].concat(args9217.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9232 = this;
  return cljs.core.PersistentVector.fromArray([this__9232.key, this__9232.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9233 = this;
  return this__9233.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9234 = this;
  return this__9234.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9235 = this;
  var node__9236 = this;
  return new cljs.core.RedNode(this__9235.key, this__9235.val, this__9235.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9237 = this;
  var node__9238 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9239 = this;
  var node__9240 = this;
  return new cljs.core.RedNode(this__9239.key, this__9239.val, this__9239.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9241 = this;
  var node__9242 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9243 = this;
  var node__9244 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9244, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9245 = this;
  var node__9246 = this;
  return new cljs.core.RedNode(this__9245.key, this__9245.val, del, this__9245.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9247 = this;
  var node__9248 = this;
  return new cljs.core.RedNode(this__9247.key, this__9247.val, ins, this__9247.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9249 = this;
  var node__9250 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9249.left)) {
    return new cljs.core.RedNode(this__9249.key, this__9249.val, this__9249.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9249.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9249.right)) {
      return new cljs.core.RedNode(this__9249.right.key, this__9249.right.val, new cljs.core.BlackNode(this__9249.key, this__9249.val, this__9249.left, this__9249.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9249.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9250, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9272 = null;
  var G__9272__0 = function() {
    var this__9251 = this;
    var this__9253 = this;
    return cljs.core.pr_str.call(null, this__9253)
  };
  G__9272 = function() {
    switch(arguments.length) {
      case 0:
        return G__9272__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9272
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9254 = this;
  var node__9255 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9254.right)) {
    return new cljs.core.RedNode(this__9254.key, this__9254.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9254.left, null), this__9254.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9254.left)) {
      return new cljs.core.RedNode(this__9254.left.key, this__9254.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9254.left.left, null), new cljs.core.BlackNode(this__9254.key, this__9254.val, this__9254.left.right, this__9254.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9255, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9256 = this;
  var node__9257 = this;
  return new cljs.core.BlackNode(this__9256.key, this__9256.val, this__9256.left, this__9256.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9258 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9259 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9260 = this;
  return cljs.core.list.call(null, this__9260.key, this__9260.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9261 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9262 = this;
  return this__9262.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9263 = this;
  return cljs.core.PersistentVector.fromArray([this__9263.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9264 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9264.key, this__9264.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9265 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9266 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9266.key, this__9266.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9267 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9268 = this;
  if(n === 0) {
    return this__9268.key
  }else {
    if(n === 1) {
      return this__9268.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9269 = this;
  if(n === 0) {
    return this__9269.key
  }else {
    if(n === 1) {
      return this__9269.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9270 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9276 = comp.call(null, k, tree.key);
    if(c__9276 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9276 < 0) {
        var ins__9277 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9277 == null)) {
          return tree.add_left(ins__9277)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9278 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9278 == null)) {
            return tree.add_right(ins__9278)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__9281 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9281)) {
            return new cljs.core.RedNode(app__9281.key, app__9281.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9281.left, null), new cljs.core.RedNode(right.key, right.val, app__9281.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9281, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9282 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9282)) {
              return new cljs.core.RedNode(app__9282.key, app__9282.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9282.left, null), new cljs.core.BlackNode(right.key, right.val, app__9282.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9282, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__9288 = comp.call(null, k, tree.key);
    if(c__9288 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9288 < 0) {
        var del__9289 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9290 = !(del__9289 == null);
          if(or__3824__auto____9290) {
            return or__3824__auto____9290
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9289, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9289, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9291 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9292 = !(del__9291 == null);
            if(or__3824__auto____9292) {
              return or__3824__auto____9292
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9291)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9291, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__9295 = tree.key;
  var c__9296 = comp.call(null, k, tk__9295);
  if(c__9296 === 0) {
    return tree.replace(tk__9295, v, tree.left, tree.right)
  }else {
    if(c__9296 < 0) {
      return tree.replace(tk__9295, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9295, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
goog.provide("cljs.core.PersistentTreeMap");
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9299 = this;
  var h__2252__auto____9300 = this__9299.__hash;
  if(!(h__2252__auto____9300 == null)) {
    return h__2252__auto____9300
  }else {
    var h__2252__auto____9301 = cljs.core.hash_imap.call(null, coll);
    this__9299.__hash = h__2252__auto____9301;
    return h__2252__auto____9301
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9302 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9303 = this;
  var n__9304 = coll.entry_at(k);
  if(!(n__9304 == null)) {
    return n__9304.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9305 = this;
  var found__9306 = [null];
  var t__9307 = cljs.core.tree_map_add.call(null, this__9305.comp, this__9305.tree, k, v, found__9306);
  if(t__9307 == null) {
    var found_node__9308 = cljs.core.nth.call(null, found__9306, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9308.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9305.comp, cljs.core.tree_map_replace.call(null, this__9305.comp, this__9305.tree, k, v), this__9305.cnt, this__9305.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9305.comp, t__9307.blacken(), this__9305.cnt + 1, this__9305.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9309 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9343 = null;
  var G__9343__2 = function(this_sym9310, k) {
    var this__9312 = this;
    var this_sym9310__9313 = this;
    var coll__9314 = this_sym9310__9313;
    return coll__9314.cljs$core$ILookup$_lookup$arity$2(coll__9314, k)
  };
  var G__9343__3 = function(this_sym9311, k, not_found) {
    var this__9312 = this;
    var this_sym9311__9315 = this;
    var coll__9316 = this_sym9311__9315;
    return coll__9316.cljs$core$ILookup$_lookup$arity$3(coll__9316, k, not_found)
  };
  G__9343 = function(this_sym9311, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9343__2.call(this, this_sym9311, k);
      case 3:
        return G__9343__3.call(this, this_sym9311, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9343
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9297, args9298) {
  var this__9317 = this;
  return this_sym9297.call.apply(this_sym9297, [this_sym9297].concat(args9298.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9318 = this;
  if(!(this__9318.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9318.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9319 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9320 = this;
  if(this__9320.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9320.tree, false, this__9320.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9321 = this;
  var this__9322 = this;
  return cljs.core.pr_str.call(null, this__9322)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9323 = this;
  var coll__9324 = this;
  var t__9325 = this__9323.tree;
  while(true) {
    if(!(t__9325 == null)) {
      var c__9326 = this__9323.comp.call(null, k, t__9325.key);
      if(c__9326 === 0) {
        return t__9325
      }else {
        if(c__9326 < 0) {
          var G__9344 = t__9325.left;
          t__9325 = G__9344;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9345 = t__9325.right;
            t__9325 = G__9345;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9327 = this;
  if(this__9327.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9327.tree, ascending_QMARK_, this__9327.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9328 = this;
  if(this__9328.cnt > 0) {
    var stack__9329 = null;
    var t__9330 = this__9328.tree;
    while(true) {
      if(!(t__9330 == null)) {
        var c__9331 = this__9328.comp.call(null, k, t__9330.key);
        if(c__9331 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9329, t__9330), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9331 < 0) {
              var G__9346 = cljs.core.conj.call(null, stack__9329, t__9330);
              var G__9347 = t__9330.left;
              stack__9329 = G__9346;
              t__9330 = G__9347;
              continue
            }else {
              var G__9348 = stack__9329;
              var G__9349 = t__9330.right;
              stack__9329 = G__9348;
              t__9330 = G__9349;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9331 > 0) {
                var G__9350 = cljs.core.conj.call(null, stack__9329, t__9330);
                var G__9351 = t__9330.right;
                stack__9329 = G__9350;
                t__9330 = G__9351;
                continue
              }else {
                var G__9352 = stack__9329;
                var G__9353 = t__9330.left;
                stack__9329 = G__9352;
                t__9330 = G__9353;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9329 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9329, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9332 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9333 = this;
  return this__9333.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9334 = this;
  if(this__9334.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9334.tree, true, this__9334.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9335 = this;
  return this__9335.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9336 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9337 = this;
  return new cljs.core.PersistentTreeMap(this__9337.comp, this__9337.tree, this__9337.cnt, meta, this__9337.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9338 = this;
  return this__9338.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9339 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9339.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9340 = this;
  var found__9341 = [null];
  var t__9342 = cljs.core.tree_map_remove.call(null, this__9340.comp, this__9340.tree, k, found__9341);
  if(t__9342 == null) {
    if(cljs.core.nth.call(null, found__9341, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9340.comp, null, 0, this__9340.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9340.comp, t__9342.blacken(), this__9340.cnt - 1, this__9340.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9356 = cljs.core.seq.call(null, keyvals);
    var out__9357 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9356) {
        var G__9358 = cljs.core.nnext.call(null, in__9356);
        var G__9359 = cljs.core.assoc_BANG_.call(null, out__9357, cljs.core.first.call(null, in__9356), cljs.core.second.call(null, in__9356));
        in__9356 = G__9358;
        out__9357 = G__9359;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9357)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9360) {
    var keyvals = cljs.core.seq(arglist__9360);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9361) {
    var keyvals = cljs.core.seq(arglist__9361);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9365 = [];
    var obj__9366 = {};
    var kvs__9367 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9367) {
        ks__9365.push(cljs.core.first.call(null, kvs__9367));
        obj__9366[cljs.core.first.call(null, kvs__9367)] = cljs.core.second.call(null, kvs__9367);
        var G__9368 = cljs.core.nnext.call(null, kvs__9367);
        kvs__9367 = G__9368;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9365, obj__9366)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__9369) {
    var keyvals = cljs.core.seq(arglist__9369);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9372 = cljs.core.seq.call(null, keyvals);
    var out__9373 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9372) {
        var G__9374 = cljs.core.nnext.call(null, in__9372);
        var G__9375 = cljs.core.assoc.call(null, out__9373, cljs.core.first.call(null, in__9372), cljs.core.second.call(null, in__9372));
        in__9372 = G__9374;
        out__9373 = G__9375;
        continue
      }else {
        return out__9373
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9376) {
    var keyvals = cljs.core.seq(arglist__9376);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9379 = cljs.core.seq.call(null, keyvals);
    var out__9380 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9379) {
        var G__9381 = cljs.core.nnext.call(null, in__9379);
        var G__9382 = cljs.core.assoc.call(null, out__9380, cljs.core.first.call(null, in__9379), cljs.core.second.call(null, in__9379));
        in__9379 = G__9381;
        out__9380 = G__9382;
        continue
      }else {
        return out__9380
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9383) {
    var comparator = cljs.core.first(arglist__9383);
    var keyvals = cljs.core.rest(arglist__9383);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__9384_SHARP_, p2__9385_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9387 = p1__9384_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9387)) {
            return or__3824__auto____9387
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9385_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9388) {
    var maps = cljs.core.seq(arglist__9388);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9396 = function(m, e) {
        var k__9394 = cljs.core.first.call(null, e);
        var v__9395 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9394)) {
          return cljs.core.assoc.call(null, m, k__9394, f.call(null, cljs.core._lookup.call(null, m, k__9394, null), v__9395))
        }else {
          return cljs.core.assoc.call(null, m, k__9394, v__9395)
        }
      };
      var merge2__9398 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9396, function() {
          var or__3824__auto____9397 = m1;
          if(cljs.core.truth_(or__3824__auto____9397)) {
            return or__3824__auto____9397
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9398, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9399) {
    var f = cljs.core.first(arglist__9399);
    var maps = cljs.core.rest(arglist__9399);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9404 = cljs.core.ObjMap.EMPTY;
  var keys__9405 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9405) {
      var key__9406 = cljs.core.first.call(null, keys__9405);
      var entry__9407 = cljs.core._lookup.call(null, map, key__9406, "\ufdd0'cljs.core/not-found");
      var G__9408 = cljs.core.not_EQ_.call(null, entry__9407, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9404, key__9406, entry__9407) : ret__9404;
      var G__9409 = cljs.core.next.call(null, keys__9405);
      ret__9404 = G__9408;
      keys__9405 = G__9409;
      continue
    }else {
      return ret__9404
    }
    break
  }
};
goog.provide("cljs.core.PersistentHashSet");
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9413 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9413.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9414 = this;
  var h__2252__auto____9415 = this__9414.__hash;
  if(!(h__2252__auto____9415 == null)) {
    return h__2252__auto____9415
  }else {
    var h__2252__auto____9416 = cljs.core.hash_iset.call(null, coll);
    this__9414.__hash = h__2252__auto____9416;
    return h__2252__auto____9416
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9417 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9418 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9418.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9439 = null;
  var G__9439__2 = function(this_sym9419, k) {
    var this__9421 = this;
    var this_sym9419__9422 = this;
    var coll__9423 = this_sym9419__9422;
    return coll__9423.cljs$core$ILookup$_lookup$arity$2(coll__9423, k)
  };
  var G__9439__3 = function(this_sym9420, k, not_found) {
    var this__9421 = this;
    var this_sym9420__9424 = this;
    var coll__9425 = this_sym9420__9424;
    return coll__9425.cljs$core$ILookup$_lookup$arity$3(coll__9425, k, not_found)
  };
  G__9439 = function(this_sym9420, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9439__2.call(this, this_sym9420, k);
      case 3:
        return G__9439__3.call(this, this_sym9420, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9439
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9411, args9412) {
  var this__9426 = this;
  return this_sym9411.call.apply(this_sym9411, [this_sym9411].concat(args9412.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9427 = this;
  return new cljs.core.PersistentHashSet(this__9427.meta, cljs.core.assoc.call(null, this__9427.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9428 = this;
  var this__9429 = this;
  return cljs.core.pr_str.call(null, this__9429)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9430 = this;
  return cljs.core.keys.call(null, this__9430.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9431 = this;
  return new cljs.core.PersistentHashSet(this__9431.meta, cljs.core.dissoc.call(null, this__9431.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9432 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9433 = this;
  var and__3822__auto____9434 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9434) {
    var and__3822__auto____9435 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9435) {
      return cljs.core.every_QMARK_.call(null, function(p1__9410_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9410_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9435
    }
  }else {
    return and__3822__auto____9434
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9436 = this;
  return new cljs.core.PersistentHashSet(meta, this__9436.hash_map, this__9436.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9437 = this;
  return this__9437.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9438 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9438.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9440 = cljs.core.count.call(null, items);
  var i__9441 = 0;
  var out__9442 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9441 < len__9440) {
      var G__9443 = i__9441 + 1;
      var G__9444 = cljs.core.conj_BANG_.call(null, out__9442, items[i__9441]);
      i__9441 = G__9443;
      out__9442 = G__9444;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9442)
    }
    break
  }
};
goog.provide("cljs.core.TransientHashSet");
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 136
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9462 = null;
  var G__9462__2 = function(this_sym9448, k) {
    var this__9450 = this;
    var this_sym9448__9451 = this;
    var tcoll__9452 = this_sym9448__9451;
    if(cljs.core._lookup.call(null, this__9450.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9462__3 = function(this_sym9449, k, not_found) {
    var this__9450 = this;
    var this_sym9449__9453 = this;
    var tcoll__9454 = this_sym9449__9453;
    if(cljs.core._lookup.call(null, this__9450.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9462 = function(this_sym9449, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9462__2.call(this, this_sym9449, k);
      case 3:
        return G__9462__3.call(this, this_sym9449, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9462
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9446, args9447) {
  var this__9455 = this;
  return this_sym9446.call.apply(this_sym9446, [this_sym9446].concat(args9447.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9456 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9457 = this;
  if(cljs.core._lookup.call(null, this__9457.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9458 = this;
  return cljs.core.count.call(null, this__9458.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9459 = this;
  this__9459.transient_map = cljs.core.dissoc_BANG_.call(null, this__9459.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9460 = this;
  this__9460.transient_map = cljs.core.assoc_BANG_.call(null, this__9460.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9461 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9461.transient_map), null)
};
cljs.core.TransientHashSet;
goog.provide("cljs.core.PersistentTreeSet");
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9465 = this;
  var h__2252__auto____9466 = this__9465.__hash;
  if(!(h__2252__auto____9466 == null)) {
    return h__2252__auto____9466
  }else {
    var h__2252__auto____9467 = cljs.core.hash_iset.call(null, coll);
    this__9465.__hash = h__2252__auto____9467;
    return h__2252__auto____9467
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9468 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9469 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9469.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9495 = null;
  var G__9495__2 = function(this_sym9470, k) {
    var this__9472 = this;
    var this_sym9470__9473 = this;
    var coll__9474 = this_sym9470__9473;
    return coll__9474.cljs$core$ILookup$_lookup$arity$2(coll__9474, k)
  };
  var G__9495__3 = function(this_sym9471, k, not_found) {
    var this__9472 = this;
    var this_sym9471__9475 = this;
    var coll__9476 = this_sym9471__9475;
    return coll__9476.cljs$core$ILookup$_lookup$arity$3(coll__9476, k, not_found)
  };
  G__9495 = function(this_sym9471, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9495__2.call(this, this_sym9471, k);
      case 3:
        return G__9495__3.call(this, this_sym9471, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9495
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9463, args9464) {
  var this__9477 = this;
  return this_sym9463.call.apply(this_sym9463, [this_sym9463].concat(args9464.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9478 = this;
  return new cljs.core.PersistentTreeSet(this__9478.meta, cljs.core.assoc.call(null, this__9478.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9479 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9479.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9480 = this;
  var this__9481 = this;
  return cljs.core.pr_str.call(null, this__9481)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9482 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9482.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9483 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9483.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9484 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9485 = this;
  return cljs.core._comparator.call(null, this__9485.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9486 = this;
  return cljs.core.keys.call(null, this__9486.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9487 = this;
  return new cljs.core.PersistentTreeSet(this__9487.meta, cljs.core.dissoc.call(null, this__9487.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9488 = this;
  return cljs.core.count.call(null, this__9488.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9489 = this;
  var and__3822__auto____9490 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9490) {
    var and__3822__auto____9491 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9491) {
      return cljs.core.every_QMARK_.call(null, function(p1__9445_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9445_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9491
    }
  }else {
    return and__3822__auto____9490
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9492 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9492.tree_map, this__9492.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9493 = this;
  return this__9493.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9494 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9494.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9500__delegate = function(keys) {
      var in__9498 = cljs.core.seq.call(null, keys);
      var out__9499 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9498)) {
          var G__9501 = cljs.core.next.call(null, in__9498);
          var G__9502 = cljs.core.conj_BANG_.call(null, out__9499, cljs.core.first.call(null, in__9498));
          in__9498 = G__9501;
          out__9499 = G__9502;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9499)
        }
        break
      }
    };
    var G__9500 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9500__delegate.call(this, keys)
    };
    G__9500.cljs$lang$maxFixedArity = 0;
    G__9500.cljs$lang$applyTo = function(arglist__9503) {
      var keys = cljs.core.seq(arglist__9503);
      return G__9500__delegate(keys)
    };
    G__9500.cljs$lang$arity$variadic = G__9500__delegate;
    return G__9500
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9504) {
    var keys = cljs.core.seq(arglist__9504);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9506) {
    var comparator = cljs.core.first(arglist__9506);
    var keys = cljs.core.rest(arglist__9506);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9512 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9513 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9513)) {
        var e__9514 = temp__3971__auto____9513;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9514))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9512, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9505_SHARP_) {
      var temp__3971__auto____9515 = cljs.core.find.call(null, smap, p1__9505_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9515)) {
        var e__9516 = temp__3971__auto____9515;
        return cljs.core.second.call(null, e__9516)
      }else {
        return p1__9505_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9546 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9539, seen) {
        while(true) {
          var vec__9540__9541 = p__9539;
          var f__9542 = cljs.core.nth.call(null, vec__9540__9541, 0, null);
          var xs__9543 = vec__9540__9541;
          var temp__3974__auto____9544 = cljs.core.seq.call(null, xs__9543);
          if(temp__3974__auto____9544) {
            var s__9545 = temp__3974__auto____9544;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9542)) {
              var G__9547 = cljs.core.rest.call(null, s__9545);
              var G__9548 = seen;
              p__9539 = G__9547;
              seen = G__9548;
              continue
            }else {
              return cljs.core.cons.call(null, f__9542, step.call(null, cljs.core.rest.call(null, s__9545), cljs.core.conj.call(null, seen, f__9542)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9546.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9551 = cljs.core.PersistentVector.EMPTY;
  var s__9552 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9552)) {
      var G__9553 = cljs.core.conj.call(null, ret__9551, cljs.core.first.call(null, s__9552));
      var G__9554 = cljs.core.next.call(null, s__9552);
      ret__9551 = G__9553;
      s__9552 = G__9554;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9551)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9557 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9557) {
        return or__3824__auto____9557
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9558 = x.lastIndexOf("/");
      if(i__9558 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9558 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____9561 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9561) {
      return or__3824__auto____9561
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9562 = x.lastIndexOf("/");
    if(i__9562 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9562)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9569 = cljs.core.ObjMap.EMPTY;
  var ks__9570 = cljs.core.seq.call(null, keys);
  var vs__9571 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9572 = ks__9570;
      if(and__3822__auto____9572) {
        return vs__9571
      }else {
        return and__3822__auto____9572
      }
    }()) {
      var G__9573 = cljs.core.assoc.call(null, map__9569, cljs.core.first.call(null, ks__9570), cljs.core.first.call(null, vs__9571));
      var G__9574 = cljs.core.next.call(null, ks__9570);
      var G__9575 = cljs.core.next.call(null, vs__9571);
      map__9569 = G__9573;
      ks__9570 = G__9574;
      vs__9571 = G__9575;
      continue
    }else {
      return map__9569
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9578__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9563_SHARP_, p2__9564_SHARP_) {
        return max_key.call(null, k, p1__9563_SHARP_, p2__9564_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9578 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9578__delegate.call(this, k, x, y, more)
    };
    G__9578.cljs$lang$maxFixedArity = 3;
    G__9578.cljs$lang$applyTo = function(arglist__9579) {
      var k = cljs.core.first(arglist__9579);
      var x = cljs.core.first(cljs.core.next(arglist__9579));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9579)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9579)));
      return G__9578__delegate(k, x, y, more)
    };
    G__9578.cljs$lang$arity$variadic = G__9578__delegate;
    return G__9578
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9580__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9576_SHARP_, p2__9577_SHARP_) {
        return min_key.call(null, k, p1__9576_SHARP_, p2__9577_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9580 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9580__delegate.call(this, k, x, y, more)
    };
    G__9580.cljs$lang$maxFixedArity = 3;
    G__9580.cljs$lang$applyTo = function(arglist__9581) {
      var k = cljs.core.first(arglist__9581);
      var x = cljs.core.first(cljs.core.next(arglist__9581));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9581)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9581)));
      return G__9580__delegate(k, x, y, more)
    };
    G__9580.cljs$lang$arity$variadic = G__9580__delegate;
    return G__9580
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9584 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9584) {
        var s__9585 = temp__3974__auto____9584;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9585), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9585)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9588 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9588) {
      var s__9589 = temp__3974__auto____9588;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9589)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9589), take_while.call(null, pred, cljs.core.rest.call(null, s__9589)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9591 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9591.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9603 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9604 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9604)) {
        var vec__9605__9606 = temp__3974__auto____9604;
        var e__9607 = cljs.core.nth.call(null, vec__9605__9606, 0, null);
        var s__9608 = vec__9605__9606;
        if(cljs.core.truth_(include__9603.call(null, e__9607))) {
          return s__9608
        }else {
          return cljs.core.next.call(null, s__9608)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9603, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9609 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9609)) {
      var vec__9610__9611 = temp__3974__auto____9609;
      var e__9612 = cljs.core.nth.call(null, vec__9610__9611, 0, null);
      var s__9613 = vec__9610__9611;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9612)) ? s__9613 : cljs.core.next.call(null, s__9613))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9625 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9626 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9626)) {
        var vec__9627__9628 = temp__3974__auto____9626;
        var e__9629 = cljs.core.nth.call(null, vec__9627__9628, 0, null);
        var s__9630 = vec__9627__9628;
        if(cljs.core.truth_(include__9625.call(null, e__9629))) {
          return s__9630
        }else {
          return cljs.core.next.call(null, s__9630)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9625, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9631 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9631)) {
      var vec__9632__9633 = temp__3974__auto____9631;
      var e__9634 = cljs.core.nth.call(null, vec__9632__9633, 0, null);
      var s__9635 = vec__9632__9633;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9634)) ? s__9635 : cljs.core.next.call(null, s__9635))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
goog.provide("cljs.core.Range");
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9636 = this;
  var h__2252__auto____9637 = this__9636.__hash;
  if(!(h__2252__auto____9637 == null)) {
    return h__2252__auto____9637
  }else {
    var h__2252__auto____9638 = cljs.core.hash_coll.call(null, rng);
    this__9636.__hash = h__2252__auto____9638;
    return h__2252__auto____9638
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9639 = this;
  if(this__9639.step > 0) {
    if(this__9639.start + this__9639.step < this__9639.end) {
      return new cljs.core.Range(this__9639.meta, this__9639.start + this__9639.step, this__9639.end, this__9639.step, null)
    }else {
      return null
    }
  }else {
    if(this__9639.start + this__9639.step > this__9639.end) {
      return new cljs.core.Range(this__9639.meta, this__9639.start + this__9639.step, this__9639.end, this__9639.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9640 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9641 = this;
  var this__9642 = this;
  return cljs.core.pr_str.call(null, this__9642)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9643 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9644 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9645 = this;
  if(this__9645.step > 0) {
    if(this__9645.start < this__9645.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9645.start > this__9645.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9646 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9646.end - this__9646.start) / this__9646.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9647 = this;
  return this__9647.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9648 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9648.meta, this__9648.start + this__9648.step, this__9648.end, this__9648.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9649 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9650 = this;
  return new cljs.core.Range(meta, this__9650.start, this__9650.end, this__9650.step, this__9650.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9651 = this;
  return this__9651.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9652 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9652.start + n * this__9652.step
  }else {
    if(function() {
      var and__3822__auto____9653 = this__9652.start > this__9652.end;
      if(and__3822__auto____9653) {
        return this__9652.step === 0
      }else {
        return and__3822__auto____9653
      }
    }()) {
      return this__9652.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9654 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9654.start + n * this__9654.step
  }else {
    if(function() {
      var and__3822__auto____9655 = this__9654.start > this__9654.end;
      if(and__3822__auto____9655) {
        return this__9654.step === 0
      }else {
        return and__3822__auto____9655
      }
    }()) {
      return this__9654.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9656 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9656.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9659 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9659) {
      var s__9660 = temp__3974__auto____9659;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9660), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9660)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9667 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9667) {
      var s__9668 = temp__3974__auto____9667;
      var fst__9669 = cljs.core.first.call(null, s__9668);
      var fv__9670 = f.call(null, fst__9669);
      var run__9671 = cljs.core.cons.call(null, fst__9669, cljs.core.take_while.call(null, function(p1__9661_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9670, f.call(null, p1__9661_SHARP_))
      }, cljs.core.next.call(null, s__9668)));
      return cljs.core.cons.call(null, run__9671, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9671), s__9668))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____9686 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9686) {
        var s__9687 = temp__3971__auto____9686;
        return reductions.call(null, f, cljs.core.first.call(null, s__9687), cljs.core.rest.call(null, s__9687))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9688 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9688) {
        var s__9689 = temp__3974__auto____9688;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9689)), cljs.core.rest.call(null, s__9689))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__9692 = null;
      var G__9692__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9692__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9692__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9692__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9692__4 = function() {
        var G__9693__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9693 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9693__delegate.call(this, x, y, z, args)
        };
        G__9693.cljs$lang$maxFixedArity = 3;
        G__9693.cljs$lang$applyTo = function(arglist__9694) {
          var x = cljs.core.first(arglist__9694);
          var y = cljs.core.first(cljs.core.next(arglist__9694));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9694)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9694)));
          return G__9693__delegate(x, y, z, args)
        };
        G__9693.cljs$lang$arity$variadic = G__9693__delegate;
        return G__9693
      }();
      G__9692 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9692__0.call(this);
          case 1:
            return G__9692__1.call(this, x);
          case 2:
            return G__9692__2.call(this, x, y);
          case 3:
            return G__9692__3.call(this, x, y, z);
          default:
            return G__9692__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9692.cljs$lang$maxFixedArity = 3;
      G__9692.cljs$lang$applyTo = G__9692__4.cljs$lang$applyTo;
      return G__9692
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9695 = null;
      var G__9695__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9695__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9695__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9695__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9695__4 = function() {
        var G__9696__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9696 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9696__delegate.call(this, x, y, z, args)
        };
        G__9696.cljs$lang$maxFixedArity = 3;
        G__9696.cljs$lang$applyTo = function(arglist__9697) {
          var x = cljs.core.first(arglist__9697);
          var y = cljs.core.first(cljs.core.next(arglist__9697));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9697)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9697)));
          return G__9696__delegate(x, y, z, args)
        };
        G__9696.cljs$lang$arity$variadic = G__9696__delegate;
        return G__9696
      }();
      G__9695 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9695__0.call(this);
          case 1:
            return G__9695__1.call(this, x);
          case 2:
            return G__9695__2.call(this, x, y);
          case 3:
            return G__9695__3.call(this, x, y, z);
          default:
            return G__9695__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9695.cljs$lang$maxFixedArity = 3;
      G__9695.cljs$lang$applyTo = G__9695__4.cljs$lang$applyTo;
      return G__9695
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9698 = null;
      var G__9698__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9698__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9698__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9698__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9698__4 = function() {
        var G__9699__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9699 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9699__delegate.call(this, x, y, z, args)
        };
        G__9699.cljs$lang$maxFixedArity = 3;
        G__9699.cljs$lang$applyTo = function(arglist__9700) {
          var x = cljs.core.first(arglist__9700);
          var y = cljs.core.first(cljs.core.next(arglist__9700));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9700)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9700)));
          return G__9699__delegate(x, y, z, args)
        };
        G__9699.cljs$lang$arity$variadic = G__9699__delegate;
        return G__9699
      }();
      G__9698 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9698__0.call(this);
          case 1:
            return G__9698__1.call(this, x);
          case 2:
            return G__9698__2.call(this, x, y);
          case 3:
            return G__9698__3.call(this, x, y, z);
          default:
            return G__9698__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9698.cljs$lang$maxFixedArity = 3;
      G__9698.cljs$lang$applyTo = G__9698__4.cljs$lang$applyTo;
      return G__9698
    }()
  };
  var juxt__4 = function() {
    var G__9701__delegate = function(f, g, h, fs) {
      var fs__9691 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9702 = null;
        var G__9702__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9672_SHARP_, p2__9673_SHARP_) {
            return cljs.core.conj.call(null, p1__9672_SHARP_, p2__9673_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9691)
        };
        var G__9702__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9674_SHARP_, p2__9675_SHARP_) {
            return cljs.core.conj.call(null, p1__9674_SHARP_, p2__9675_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9691)
        };
        var G__9702__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9676_SHARP_, p2__9677_SHARP_) {
            return cljs.core.conj.call(null, p1__9676_SHARP_, p2__9677_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9691)
        };
        var G__9702__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9678_SHARP_, p2__9679_SHARP_) {
            return cljs.core.conj.call(null, p1__9678_SHARP_, p2__9679_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9691)
        };
        var G__9702__4 = function() {
          var G__9703__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9680_SHARP_, p2__9681_SHARP_) {
              return cljs.core.conj.call(null, p1__9680_SHARP_, cljs.core.apply.call(null, p2__9681_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9691)
          };
          var G__9703 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9703__delegate.call(this, x, y, z, args)
          };
          G__9703.cljs$lang$maxFixedArity = 3;
          G__9703.cljs$lang$applyTo = function(arglist__9704) {
            var x = cljs.core.first(arglist__9704);
            var y = cljs.core.first(cljs.core.next(arglist__9704));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9704)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9704)));
            return G__9703__delegate(x, y, z, args)
          };
          G__9703.cljs$lang$arity$variadic = G__9703__delegate;
          return G__9703
        }();
        G__9702 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9702__0.call(this);
            case 1:
              return G__9702__1.call(this, x);
            case 2:
              return G__9702__2.call(this, x, y);
            case 3:
              return G__9702__3.call(this, x, y, z);
            default:
              return G__9702__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9702.cljs$lang$maxFixedArity = 3;
        G__9702.cljs$lang$applyTo = G__9702__4.cljs$lang$applyTo;
        return G__9702
      }()
    };
    var G__9701 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9701__delegate.call(this, f, g, h, fs)
    };
    G__9701.cljs$lang$maxFixedArity = 3;
    G__9701.cljs$lang$applyTo = function(arglist__9705) {
      var f = cljs.core.first(arglist__9705);
      var g = cljs.core.first(cljs.core.next(arglist__9705));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9705)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9705)));
      return G__9701__delegate(f, g, h, fs)
    };
    G__9701.cljs$lang$arity$variadic = G__9701__delegate;
    return G__9701
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__9708 = cljs.core.next.call(null, coll);
        coll = G__9708;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____9707 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____9707) {
          return n > 0
        }else {
          return and__3822__auto____9707
        }
      }())) {
        var G__9709 = n - 1;
        var G__9710 = cljs.core.next.call(null, coll);
        n = G__9709;
        coll = G__9710;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__9712 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9712), s)) {
    if(cljs.core.count.call(null, matches__9712) === 1) {
      return cljs.core.first.call(null, matches__9712)
    }else {
      return cljs.core.vec.call(null, matches__9712)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9714 = re.exec(s);
  if(matches__9714 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9714) === 1) {
      return cljs.core.first.call(null, matches__9714)
    }else {
      return cljs.core.vec.call(null, matches__9714)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9719 = cljs.core.re_find.call(null, re, s);
  var match_idx__9720 = s.search(re);
  var match_str__9721 = cljs.core.coll_QMARK_.call(null, match_data__9719) ? cljs.core.first.call(null, match_data__9719) : match_data__9719;
  var post_match__9722 = cljs.core.subs.call(null, s, match_idx__9720 + cljs.core.count.call(null, match_str__9721));
  if(cljs.core.truth_(match_data__9719)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9719, re_seq.call(null, re, post_match__9722))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9729__9730 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9731 = cljs.core.nth.call(null, vec__9729__9730, 0, null);
  var flags__9732 = cljs.core.nth.call(null, vec__9729__9730, 1, null);
  var pattern__9733 = cljs.core.nth.call(null, vec__9729__9730, 2, null);
  return new RegExp(pattern__9733, flags__9732)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9723_SHARP_) {
    return print_one.call(null, p1__9723_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.pr_sequential_writer = function pr_sequential_writer(writer, print_one, begin, sep, end, opts, coll) {
  cljs.core._write.call(null, writer, begin);
  if(cljs.core.seq.call(null, coll)) {
    print_one.call(null, cljs.core.first.call(null, coll), writer, opts)
  }else {
  }
  var G__9737__9738 = cljs.core.seq.call(null, cljs.core.next.call(null, coll));
  while(true) {
    if(G__9737__9738) {
      var o__9739 = cljs.core.first.call(null, G__9737__9738);
      cljs.core._write.call(null, writer, sep);
      print_one.call(null, o__9739, writer, opts);
      var G__9740 = cljs.core.next.call(null, G__9737__9738);
      G__9737__9738 = G__9740;
      continue
    }else {
    }
    break
  }
  return cljs.core._write.call(null, writer, end)
};
cljs.core.write_all = function() {
  var write_all__delegate = function(writer, ss) {
    var G__9744__9745 = cljs.core.seq.call(null, ss);
    while(true) {
      if(G__9744__9745) {
        var s__9746 = cljs.core.first.call(null, G__9744__9745);
        cljs.core._write.call(null, writer, s__9746);
        var G__9747 = cljs.core.next.call(null, G__9744__9745);
        G__9744__9745 = G__9747;
        continue
      }else {
        return null
      }
      break
    }
  };
  var write_all = function(writer, var_args) {
    var ss = null;
    if(goog.isDef(var_args)) {
      ss = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return write_all__delegate.call(this, writer, ss)
  };
  write_all.cljs$lang$maxFixedArity = 1;
  write_all.cljs$lang$applyTo = function(arglist__9748) {
    var writer = cljs.core.first(arglist__9748);
    var ss = cljs.core.rest(arglist__9748);
    return write_all__delegate(writer, ss)
  };
  write_all.cljs$lang$arity$variadic = write_all__delegate;
  return write_all
}();
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
goog.provide("cljs.core.StringBufferWriter");
cljs.core.StringBufferWriter = function(sb) {
  this.sb = sb;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073741824
};
cljs.core.StringBufferWriter.cljs$lang$type = true;
cljs.core.StringBufferWriter.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/StringBufferWriter")
};
cljs.core.StringBufferWriter.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/StringBufferWriter")
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_write$arity$2 = function(_, s) {
  var this__9749 = this;
  return this__9749.sb.append(s)
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_flush$arity$1 = function(_) {
  var this__9750 = this;
  return null
};
cljs.core.StringBufferWriter;
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____9760 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____9760)) {
            var and__3822__auto____9764 = function() {
              var G__9761__9762 = obj;
              if(G__9761__9762) {
                if(function() {
                  var or__3824__auto____9763 = G__9761__9762.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____9763) {
                    return or__3824__auto____9763
                  }else {
                    return G__9761__9762.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9761__9762.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9761__9762)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9761__9762)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____9764)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____9764
            }
          }else {
            return and__3822__auto____9760
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____9765 = !(obj == null);
          if(and__3822__auto____9765) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____9765
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9766__9767 = obj;
          if(G__9766__9767) {
            if(function() {
              var or__3824__auto____9768 = G__9766__9767.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____9768) {
                return or__3824__auto____9768
              }else {
                return G__9766__9767.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9766__9767.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9766__9767)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9766__9767)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_writer = function pr_writer(obj, writer, opts) {
  if(obj == null) {
    return cljs.core._write.call(null, writer, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core._write.call(null, writer, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        if(cljs.core.truth_(function() {
          var and__3822__auto____9781 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____9781)) {
            var and__3822__auto____9785 = function() {
              var G__9782__9783 = obj;
              if(G__9782__9783) {
                if(function() {
                  var or__3824__auto____9784 = G__9782__9783.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____9784) {
                    return or__3824__auto____9784
                  }else {
                    return G__9782__9783.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9782__9783.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9782__9783)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9782__9783)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____9785)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____9785
            }
          }else {
            return and__3822__auto____9781
          }
        }())) {
          cljs.core._write.call(null, writer, "^");
          pr_writer.call(null, cljs.core.meta.call(null, obj), writer, opts);
          cljs.core._write.call(null, writer, " ")
        }else {
        }
        if(function() {
          var and__3822__auto____9786 = !(obj == null);
          if(and__3822__auto____9786) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____9786
          }
        }()) {
          return obj.cljs$lang$ctorPrWriter(writer, opts)
        }else {
          if(function() {
            var G__9787__9788 = obj;
            if(G__9787__9788) {
              if(function() {
                var or__3824__auto____9789 = G__9787__9788.cljs$lang$protocol_mask$partition0$ & 2147483648;
                if(or__3824__auto____9789) {
                  return or__3824__auto____9789
                }else {
                  return G__9787__9788.cljs$core$IPrintWithWriter$
                }
              }()) {
                return true
              }else {
                if(!G__9787__9788.cljs$lang$protocol_mask$partition0$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IPrintWithWriter, G__9787__9788)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IPrintWithWriter, G__9787__9788)
            }
          }()) {
            return cljs.core._pr_writer.call(null, obj, writer, opts)
          }else {
            if(function() {
              var G__9790__9791 = obj;
              if(G__9790__9791) {
                if(function() {
                  var or__3824__auto____9792 = G__9790__9791.cljs$lang$protocol_mask$partition0$ & 536870912;
                  if(or__3824__auto____9792) {
                    return or__3824__auto____9792
                  }else {
                    return G__9790__9791.cljs$core$IPrintable$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9790__9791.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9790__9791)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9790__9791)
              }
            }()) {
              return cljs.core.apply.call(null, cljs.core.write_all, writer, cljs.core._pr_seq.call(null, obj, opts))
            }else {
              if(cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj))) {
                return cljs.core.write_all.call(null, writer, '#"', obj.source, '"')
              }else {
                if("\ufdd0'else") {
                  return cljs.core.write_all.call(null, writer, "#<", [cljs.core.str(obj)].join(""), ">")
                }else {
                  return null
                }
              }
            }
          }
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_seq_writer = function pr_seq_writer(objs, writer, opts) {
  cljs.core.pr_writer.call(null, cljs.core.first.call(null, objs), writer, opts);
  var G__9796__9797 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  while(true) {
    if(G__9796__9797) {
      var obj__9798 = cljs.core.first.call(null, G__9796__9797);
      cljs.core._write.call(null, writer, " ");
      cljs.core.pr_writer.call(null, obj__9798, writer, opts);
      var G__9799 = cljs.core.next.call(null, G__9796__9797);
      G__9796__9797 = G__9799;
      continue
    }else {
      return null
    }
    break
  }
};
cljs.core.pr_sb_with_opts = function pr_sb_with_opts(objs, opts) {
  var sb__9802 = new goog.string.StringBuffer;
  var writer__9803 = new cljs.core.StringBufferWriter(sb__9802);
  cljs.core.pr_seq_writer.call(null, objs, writer__9803, opts);
  cljs.core._flush.call(null, writer__9803);
  return sb__9802
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_.call(null, objs)) {
    return""
  }else {
    return[cljs.core.str(cljs.core.pr_sb_with_opts.call(null, objs, opts))].join("")
  }
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_.call(null, objs)) {
    return"\n"
  }else {
    var sb__9805 = cljs.core.pr_sb_with_opts.call(null, objs, opts);
    sb__9805.append("\n");
    return[cljs.core.str(sb__9805)].join("")
  }
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  return cljs.core.string_print.call(null, cljs.core.pr_str_with_opts.call(null, objs, opts))
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__9806) {
    var objs = cljs.core.seq(arglist__9806);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__9807) {
    var objs = cljs.core.seq(arglist__9807);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__9808) {
    var objs = cljs.core.seq(arglist__9808);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__9809) {
    var objs = cljs.core.seq(arglist__9809);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__9810) {
    var objs = cljs.core.seq(arglist__9810);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__9811) {
    var objs = cljs.core.seq(arglist__9811);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__9812) {
    var objs = cljs.core.seq(arglist__9812);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__9813) {
    var objs = cljs.core.seq(arglist__9813);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__9814) {
    var fmt = cljs.core.first(arglist__9814);
    var args = cljs.core.rest(arglist__9814);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9815 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9815, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9816 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9816, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9817 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9817, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____9818 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____9818)) {
        var nspc__9819 = temp__3974__auto____9818;
        return[cljs.core.str(nspc__9819), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____9820 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____9820)) {
          var nspc__9821 = temp__3974__auto____9820;
          return[cljs.core.str(nspc__9821), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9822 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9822, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__9824 = function(n, len) {
    var ns__9823 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9823) < len) {
        var G__9826 = [cljs.core.str("0"), cljs.core.str(ns__9823)].join("");
        ns__9823 = G__9826;
        continue
      }else {
        return ns__9823
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9824.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9824.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9824.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9824.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9824.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9824.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9825 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9825, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.HashMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair__9827 = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair__9827, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintWithWriter["number"] = true;
cljs.core._pr_writer["number"] = function(n, writer, opts) {
  1 / 0;
  return cljs.core._write.call(null, writer, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair__9828 = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair__9828, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair__9829 = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair__9829, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintWithWriter["boolean"] = true;
cljs.core._pr_writer["boolean"] = function(bool, writer, opts) {
  return cljs.core._write.call(null, writer, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintWithWriter["string"] = true;
cljs.core._pr_writer["string"] = function(obj, writer, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    cljs.core._write.call(null, writer, ":");
    var temp__3974__auto____9830 = cljs.core.namespace.call(null, obj);
    if(cljs.core.truth_(temp__3974__auto____9830)) {
      var nspc__9831 = temp__3974__auto____9830;
      cljs.core.write_all.call(null, writer, [cljs.core.str(nspc__9831)].join(""), "/")
    }else {
    }
    return cljs.core._write.call(null, writer, cljs.core.name.call(null, obj))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      var temp__3974__auto____9832 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____9832)) {
        var nspc__9833 = temp__3974__auto____9832;
        cljs.core.write_all.call(null, writer, [cljs.core.str(nspc__9833)].join(""), "/")
      }else {
      }
      return cljs.core._write.call(null, writer, cljs.core.name.call(null, obj))
    }else {
      if("\ufdd0'else") {
        if(cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts))) {
          return cljs.core._write.call(null, writer, goog.string.quote(obj))
        }else {
          return cljs.core._write.call(null, writer, obj)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair__9834 = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair__9834, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.List.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.IPrintWithWriter["array"] = true;
cljs.core._pr_writer["array"] = function(a, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintWithWriter["function"] = true;
cljs.core._pr_writer["function"] = function(this$, writer, _) {
  return cljs.core.write_all.call(null, writer, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core._write.call(null, writer, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintWithWriter$ = true;
Date.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(d, writer, _) {
  var normalize__9836 = function(n, len) {
    var ns__9835 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9835) < len) {
        var G__9838 = [cljs.core.str("0"), cljs.core.str(ns__9835)].join("");
        ns__9835 = G__9838;
        continue
      }else {
        return ns__9835
      }
      break
    }
  };
  return cljs.core.write_all.call(null, writer, '#inst "', [cljs.core.str(d.getUTCFullYear())].join(""), "-", normalize__9836.call(null, d.getUTCMonth() + 1, 2), "-", normalize__9836.call(null, d.getUTCDate(), 2), "T", normalize__9836.call(null, d.getUTCHours(), 2), ":", normalize__9836.call(null, d.getUTCMinutes(), 2), ":", normalize__9836.call(null, d.getUTCSeconds(), 2), ".", normalize__9836.call(null, d.getUTCMilliseconds(), 3), "-", '00:00"')
};
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair__9837 = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair__9837, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
goog.provide("cljs.core.Atom");
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856;
  this.cljs$lang$protocol_mask$partition1$ = 2
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9839 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9840 = this;
  var G__9841__9842 = cljs.core.seq.call(null, this__9840.watches);
  while(true) {
    if(G__9841__9842) {
      var vec__9843__9844 = cljs.core.first.call(null, G__9841__9842);
      var key__9845 = cljs.core.nth.call(null, vec__9843__9844, 0, null);
      var f__9846 = cljs.core.nth.call(null, vec__9843__9844, 1, null);
      f__9846.call(null, key__9845, this$, oldval, newval);
      var G__9854 = cljs.core.next.call(null, G__9841__9842);
      G__9841__9842 = G__9854;
      continue
    }else {
      return null
    }
    break
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__9847 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9847.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9848 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9848.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(a, writer, opts) {
  var this__9849 = this;
  cljs.core._write.call(null, writer, "#<Atom: ");
  cljs.core._pr_writer.call(null, this__9849.state, writer, opts);
  return cljs.core._write.call(null, writer, ">")
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9850 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9850.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9851 = this;
  return this__9851.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9852 = this;
  return this__9852.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9853 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9866__delegate = function(x, p__9855) {
      var map__9861__9862 = p__9855;
      var map__9861__9863 = cljs.core.seq_QMARK_.call(null, map__9861__9862) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9861__9862) : map__9861__9862;
      var validator__9864 = cljs.core._lookup.call(null, map__9861__9863, "\ufdd0'validator", null);
      var meta__9865 = cljs.core._lookup.call(null, map__9861__9863, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9865, validator__9864, null)
    };
    var G__9866 = function(x, var_args) {
      var p__9855 = null;
      if(goog.isDef(var_args)) {
        p__9855 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9866__delegate.call(this, x, p__9855)
    };
    G__9866.cljs$lang$maxFixedArity = 1;
    G__9866.cljs$lang$applyTo = function(arglist__9867) {
      var x = cljs.core.first(arglist__9867);
      var p__9855 = cljs.core.rest(arglist__9867);
      return G__9866__delegate(x, p__9855)
    };
    G__9866.cljs$lang$arity$variadic = G__9866__delegate;
    return G__9866
  }();
  atom = function(x, var_args) {
    var p__9855 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____9871 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____9871)) {
    var validate__9872 = temp__3974__auto____9871;
    if(cljs.core.truth_(validate__9872.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6683))))].join(""));
    }
  }else {
  }
  var old_value__9873 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9873, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__9874__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9874 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9874__delegate.call(this, a, f, x, y, z, more)
    };
    G__9874.cljs$lang$maxFixedArity = 5;
    G__9874.cljs$lang$applyTo = function(arglist__9875) {
      var a = cljs.core.first(arglist__9875);
      var f = cljs.core.first(cljs.core.next(arglist__9875));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9875)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9875))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9875)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9875)))));
      return G__9874__delegate(a, f, x, y, z, more)
    };
    G__9874.cljs$lang$arity$variadic = G__9874__delegate;
    return G__9874
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9876) {
    var iref = cljs.core.first(arglist__9876);
    var f = cljs.core.first(cljs.core.next(arglist__9876));
    var args = cljs.core.rest(cljs.core.next(arglist__9876));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
goog.provide("cljs.core.Delay");
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__9877 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9877.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9878 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9878.state, function(p__9879) {
    var map__9880__9881 = p__9879;
    var map__9880__9882 = cljs.core.seq_QMARK_.call(null, map__9880__9881) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9880__9881) : map__9880__9881;
    var curr_state__9883 = map__9880__9882;
    var done__9884 = cljs.core._lookup.call(null, map__9880__9882, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9884)) {
      return curr_state__9883
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9878.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__9905__9906 = options;
    var map__9905__9907 = cljs.core.seq_QMARK_.call(null, map__9905__9906) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9905__9906) : map__9905__9906;
    var keywordize_keys__9908 = cljs.core._lookup.call(null, map__9905__9907, "\ufdd0'keywordize-keys", null);
    var keyfn__9909 = cljs.core.truth_(keywordize_keys__9908) ? cljs.core.keyword : cljs.core.str;
    var f__9924 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2533__auto____9923 = function iter__9917(s__9918) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9918__9921 = s__9918;
                    while(true) {
                      if(cljs.core.seq.call(null, s__9918__9921)) {
                        var k__9922 = cljs.core.first.call(null, s__9918__9921);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9909.call(null, k__9922), thisfn.call(null, x[k__9922])], true), iter__9917.call(null, cljs.core.rest.call(null, s__9918__9921)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2533__auto____9923.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__9924.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9925) {
    var x = cljs.core.first(arglist__9925);
    var options = cljs.core.rest(arglist__9925);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9930 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9934__delegate = function(args) {
      var temp__3971__auto____9931 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9930), args, null);
      if(cljs.core.truth_(temp__3971__auto____9931)) {
        var v__9932 = temp__3971__auto____9931;
        return v__9932
      }else {
        var ret__9933 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9930, cljs.core.assoc, args, ret__9933);
        return ret__9933
      }
    };
    var G__9934 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9934__delegate.call(this, args)
    };
    G__9934.cljs$lang$maxFixedArity = 0;
    G__9934.cljs$lang$applyTo = function(arglist__9935) {
      var args = cljs.core.seq(arglist__9935);
      return G__9934__delegate(args)
    };
    G__9934.cljs$lang$arity$variadic = G__9934__delegate;
    return G__9934
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9937 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9937)) {
        var G__9938 = ret__9937;
        f = G__9938;
        continue
      }else {
        return ret__9937
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9939__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9939 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9939__delegate.call(this, f, args)
    };
    G__9939.cljs$lang$maxFixedArity = 1;
    G__9939.cljs$lang$applyTo = function(arglist__9940) {
      var f = cljs.core.first(arglist__9940);
      var args = cljs.core.rest(arglist__9940);
      return G__9939__delegate(f, args)
    };
    G__9939.cljs$lang$arity$variadic = G__9939__delegate;
    return G__9939
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__9942 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9942, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9942, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____9951 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____9951) {
      return or__3824__auto____9951
    }else {
      var or__3824__auto____9952 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____9952) {
        return or__3824__auto____9952
      }else {
        var and__3822__auto____9953 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____9953) {
          var and__3822__auto____9954 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____9954) {
            var and__3822__auto____9955 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____9955) {
              var ret__9956 = true;
              var i__9957 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____9958 = cljs.core.not.call(null, ret__9956);
                  if(or__3824__auto____9958) {
                    return or__3824__auto____9958
                  }else {
                    return i__9957 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9956
                }else {
                  var G__9959 = isa_QMARK_.call(null, h, child.call(null, i__9957), parent.call(null, i__9957));
                  var G__9960 = i__9957 + 1;
                  ret__9956 = G__9959;
                  i__9957 = G__9960;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____9955
            }
          }else {
            return and__3822__auto____9954
          }
        }else {
          return and__3822__auto____9953
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6967))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6971))))].join(""));
    }
    var tp__9969 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9970 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9971 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9972 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____9973 = cljs.core.contains_QMARK_.call(null, tp__9969.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9971.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9971.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9969, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9972.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9970, parent, ta__9971), "\ufdd0'descendants":tf__9972.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9971, tag, td__9970)})
    }();
    if(cljs.core.truth_(or__3824__auto____9973)) {
      return or__3824__auto____9973
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__9978 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9979 = cljs.core.truth_(parentMap__9978.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9978.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__9980 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9979)) ? cljs.core.assoc.call(null, parentMap__9978, tag, childsParents__9979) : cljs.core.dissoc.call(null, parentMap__9978, tag);
    var deriv_seq__9981 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9961_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9961_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9961_SHARP_), cljs.core.second.call(null, p1__9961_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9980)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9978.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9962_SHARP_, p2__9963_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9962_SHARP_, p2__9963_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9981))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__9989 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____9991 = cljs.core.truth_(function() {
    var and__3822__auto____9990 = xprefs__9989;
    if(cljs.core.truth_(and__3822__auto____9990)) {
      return xprefs__9989.call(null, y)
    }else {
      return and__3822__auto____9990
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____9991)) {
    return or__3824__auto____9991
  }else {
    var or__3824__auto____9993 = function() {
      var ps__9992 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9992) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9992), prefer_table))) {
          }else {
          }
          var G__9996 = cljs.core.rest.call(null, ps__9992);
          ps__9992 = G__9996;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____9993)) {
      return or__3824__auto____9993
    }else {
      var or__3824__auto____9995 = function() {
        var ps__9994 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9994) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9994), y, prefer_table))) {
            }else {
            }
            var G__9997 = cljs.core.rest.call(null, ps__9994);
            ps__9994 = G__9997;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____9995)) {
        return or__3824__auto____9995
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____9999 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____9999)) {
    return or__3824__auto____9999
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__10017 = cljs.core.reduce.call(null, function(be, p__10009) {
    var vec__10010__10011 = p__10009;
    var k__10012 = cljs.core.nth.call(null, vec__10010__10011, 0, null);
    var ___10013 = cljs.core.nth.call(null, vec__10010__10011, 1, null);
    var e__10014 = vec__10010__10011;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__10012)) {
      var be2__10016 = cljs.core.truth_(function() {
        var or__3824__auto____10015 = be == null;
        if(or__3824__auto____10015) {
          return or__3824__auto____10015
        }else {
          return cljs.core.dominates.call(null, k__10012, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__10014 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__10016), k__10012, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__10012), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__10016)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__10016
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__10017)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__10017));
      return cljs.core.second.call(null, best_entry__10017)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____10022 = mf;
    if(and__3822__auto____10022) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____10022
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2436__auto____10023 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10024 = cljs.core._reset[goog.typeOf(x__2436__auto____10023)];
      if(or__3824__auto____10024) {
        return or__3824__auto____10024
      }else {
        var or__3824__auto____10025 = cljs.core._reset["_"];
        if(or__3824__auto____10025) {
          return or__3824__auto____10025
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____10030 = mf;
    if(and__3822__auto____10030) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____10030
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2436__auto____10031 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10032 = cljs.core._add_method[goog.typeOf(x__2436__auto____10031)];
      if(or__3824__auto____10032) {
        return or__3824__auto____10032
      }else {
        var or__3824__auto____10033 = cljs.core._add_method["_"];
        if(or__3824__auto____10033) {
          return or__3824__auto____10033
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10038 = mf;
    if(and__3822__auto____10038) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10038
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2436__auto____10039 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10040 = cljs.core._remove_method[goog.typeOf(x__2436__auto____10039)];
      if(or__3824__auto____10040) {
        return or__3824__auto____10040
      }else {
        var or__3824__auto____10041 = cljs.core._remove_method["_"];
        if(or__3824__auto____10041) {
          return or__3824__auto____10041
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10046 = mf;
    if(and__3822__auto____10046) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10046
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2436__auto____10047 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10048 = cljs.core._prefer_method[goog.typeOf(x__2436__auto____10047)];
      if(or__3824__auto____10048) {
        return or__3824__auto____10048
      }else {
        var or__3824__auto____10049 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10049) {
          return or__3824__auto____10049
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10054 = mf;
    if(and__3822__auto____10054) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10054
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2436__auto____10055 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10056 = cljs.core._get_method[goog.typeOf(x__2436__auto____10055)];
      if(or__3824__auto____10056) {
        return or__3824__auto____10056
      }else {
        var or__3824__auto____10057 = cljs.core._get_method["_"];
        if(or__3824__auto____10057) {
          return or__3824__auto____10057
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10062 = mf;
    if(and__3822__auto____10062) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10062
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2436__auto____10063 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10064 = cljs.core._methods[goog.typeOf(x__2436__auto____10063)];
      if(or__3824__auto____10064) {
        return or__3824__auto____10064
      }else {
        var or__3824__auto____10065 = cljs.core._methods["_"];
        if(or__3824__auto____10065) {
          return or__3824__auto____10065
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10070 = mf;
    if(and__3822__auto____10070) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10070
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2436__auto____10071 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10072 = cljs.core._prefers[goog.typeOf(x__2436__auto____10071)];
      if(or__3824__auto____10072) {
        return or__3824__auto____10072
      }else {
        var or__3824__auto____10073 = cljs.core._prefers["_"];
        if(or__3824__auto____10073) {
          return or__3824__auto____10073
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10078 = mf;
    if(and__3822__auto____10078) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10078
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2436__auto____10079 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10080 = cljs.core._dispatch[goog.typeOf(x__2436__auto____10079)];
      if(or__3824__auto____10080) {
        return or__3824__auto____10080
      }else {
        var or__3824__auto____10081 = cljs.core._dispatch["_"];
        if(or__3824__auto____10081) {
          return or__3824__auto____10081
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10084 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10085 = cljs.core._get_method.call(null, mf, dispatch_val__10084);
  if(cljs.core.truth_(target_fn__10085)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10084)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10085, args)
};
goog.provide("cljs.core.MultiFn");
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 256
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10086 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10087 = this;
  cljs.core.swap_BANG_.call(null, this__10087.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10087.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10087.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10087.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10088 = this;
  cljs.core.swap_BANG_.call(null, this__10088.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10088.method_cache, this__10088.method_table, this__10088.cached_hierarchy, this__10088.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10089 = this;
  cljs.core.swap_BANG_.call(null, this__10089.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10089.method_cache, this__10089.method_table, this__10089.cached_hierarchy, this__10089.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10090 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10090.cached_hierarchy), cljs.core.deref.call(null, this__10090.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10090.method_cache, this__10090.method_table, this__10090.cached_hierarchy, this__10090.hierarchy)
  }
  var temp__3971__auto____10091 = cljs.core.deref.call(null, this__10090.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10091)) {
    var target_fn__10092 = temp__3971__auto____10091;
    return target_fn__10092
  }else {
    var temp__3971__auto____10093 = cljs.core.find_and_cache_best_method.call(null, this__10090.name, dispatch_val, this__10090.hierarchy, this__10090.method_table, this__10090.prefer_table, this__10090.method_cache, this__10090.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10093)) {
      var target_fn__10094 = temp__3971__auto____10093;
      return target_fn__10094
    }else {
      return cljs.core.deref.call(null, this__10090.method_table).call(null, this__10090.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10095 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10095.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10095.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10095.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10095.method_cache, this__10095.method_table, this__10095.cached_hierarchy, this__10095.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10096 = this;
  return cljs.core.deref.call(null, this__10096.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10097 = this;
  return cljs.core.deref.call(null, this__10097.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10098 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10098.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10100__delegate = function(_, args) {
    var self__10099 = this;
    return cljs.core._dispatch.call(null, self__10099, args)
  };
  var G__10100 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10100__delegate.call(this, _, args)
  };
  G__10100.cljs$lang$maxFixedArity = 1;
  G__10100.cljs$lang$applyTo = function(arglist__10101) {
    var _ = cljs.core.first(arglist__10101);
    var args = cljs.core.rest(arglist__10101);
    return G__10100__delegate(_, args)
  };
  G__10100.cljs$lang$arity$variadic = G__10100__delegate;
  return G__10100
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10102 = this;
  return cljs.core._dispatch.call(null, self__10102, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("cljs.core.UUID");
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690646016
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2371__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.cljs$lang$ctorPrWriter = function(this__2371__auto__, writer__2372__auto__) {
  return cljs.core._write.call(null, writer__2372__auto__, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10103 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(_10105, writer, _) {
  var this__10104 = this;
  return cljs.core._write.call(null, writer, [cljs.core.str('#uuid "'), cljs.core.str(this__10104.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10107, _) {
  var this__10106 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10106.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10108 = this;
  var and__3822__auto____10109 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10109) {
    return this__10108.uuid === other.uuid
  }else {
    return and__3822__auto____10109
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10110 = this;
  var this__10111 = this;
  return cljs.core.pr_str.call(null, this__10111)
};
cljs.core.UUID;
goog.provide("game.graphics");
goog.require("cljs.core");
game.graphics.request_frame = function() {
  var or__3824__auto____6163 = window.requestAnimationFrame;
  if(cljs.core.truth_(or__3824__auto____6163)) {
    return or__3824__auto____6163
  }else {
    var or__3824__auto____6164 = window.webkitRequestAnimationFrame;
    if(cljs.core.truth_(or__3824__auto____6164)) {
      return or__3824__auto____6164
    }else {
      var or__3824__auto____6165 = window.mozRequestAnimationFrame;
      if(cljs.core.truth_(or__3824__auto____6165)) {
        return or__3824__auto____6165
      }else {
        var or__3824__auto____6166 = window.oRequestAnimationFrame;
        if(cljs.core.truth_(or__3824__auto____6166)) {
          return or__3824__auto____6166
        }else {
          var or__3824__auto____6167 = window.msRequestAnimationFrame;
          if(cljs.core.truth_(or__3824__auto____6167)) {
            return or__3824__auto____6167
          }else {
            return function(callback) {
              return setTimeout(callback, 1E3 / 60)
            }
          }
        }
      }
    }
  }
}();
game.graphics.cancel_frame = function() {
  var or__3824__auto____6168 = window.cancelAnimationFrame;
  if(cljs.core.truth_(or__3824__auto____6168)) {
    return or__3824__auto____6168
  }else {
    var or__3824__auto____6169 = window.webkitCancelAnimationFrame;
    if(cljs.core.truth_(or__3824__auto____6169)) {
      return or__3824__auto____6169
    }else {
      var or__3824__auto____6170 = window.mozCancelAnimationFrame;
      if(cljs.core.truth_(or__3824__auto____6170)) {
        return or__3824__auto____6170
      }else {
        var or__3824__auto____6171 = window.oCancelAnimationFrame;
        if(cljs.core.truth_(or__3824__auto____6171)) {
          return or__3824__auto____6171
        }else {
          var or__3824__auto____6172 = window.msCancelAnimationFrame;
          if(cljs.core.truth_(or__3824__auto____6172)) {
            return or__3824__auto____6172
          }else {
            return function(frame_id) {
              return clearTimeout(frame_id)
            }
          }
        }
      }
    }
  }
}();
game.graphics.get_brush = function get_brush(canvas) {
  return canvas.getContext("2d")
};
game.graphics.clear = function clear(brush) {
  var width__6175 = brush.canvas.width;
  var height__6176 = brush.canvas.height;
  return brush.clearRect(0, 0, width__6175, height__6176)
};
game.graphics.fill_rect = function fill_rect(brush, color, x, y, width, height) {
  brush.save();
  brush.fillStyle = color;
  brush.fillRect(x, y, width, height);
  return brush.restore()
};
game.graphics.fill = function fill(brush, color) {
  var width__6179 = brush.canvas.width;
  var height__6180 = brush.canvas.height;
  return game.graphics.fill_rect.call(null, brush, 0, 0, width__6179, height__6180, color)
};
game.graphics.draw_image = function draw_image(brush, image, x, y) {
  return brush.drawImage(image, x, y)
};
goog.provide("game.core");
goog.require("cljs.core");
goog.require("game.graphics");
game.core.draw = function() {
  var method_table__2608__auto____161926 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var prefer_table__2609__auto____161927 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var method_cache__2610__auto____161928 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var cached_hierarchy__2611__auto____161929 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var hierarchy__2612__auto____161930 = cljs.core._lookup.call(null, cljs.core.ObjMap.EMPTY, "\ufdd0'hierarchy", cljs.core.global_hierarchy);
  return new cljs.core.MultiFn("draw", "\ufdd0'mode", "\ufdd0'default", hierarchy__2612__auto____161930, method_table__2608__auto____161926, prefer_table__2609__auto____161927, method_cache__2610__auto____161928, cached_hierarchy__2611__auto____161929)
}();
game.core.update = function() {
  var method_table__2608__auto____161931 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var prefer_table__2609__auto____161932 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var method_cache__2610__auto____161933 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var cached_hierarchy__2611__auto____161934 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var hierarchy__2612__auto____161935 = cljs.core._lookup.call(null, cljs.core.ObjMap.EMPTY, "\ufdd0'hierarchy", cljs.core.global_hierarchy);
  return new cljs.core.MultiFn("update", "\ufdd0'mode", "\ufdd0'default", hierarchy__2612__auto____161935, method_table__2608__auto____161931, prefer_table__2609__auto____161932, method_cache__2610__auto____161933, cached_hierarchy__2611__auto____161934)
}();
game.core.get_current_time = function get_current_time() {
  return new Date / 1E3
};
game.core.run = function run(game_state) {
  var current_game_state__161942 = cljs.core.deref.call(null, game_state);
  game.core.draw.call(null, current_game_state__161942);
  var current_time__161943 = game.core.get_current_time.call(null);
  var previous_time__161944 = cljs.core.deref.call(null, (new cljs.core.Keyword("\ufdd0'previous-frame")).call(null, current_game_state__161942));
  var seconds_elapsed__161945 = current_time__161943 - previous_time__161944;
  var next_game_state__161946 = game.core.update.call(null, current_game_state__161942, seconds_elapsed__161945);
  var next_frame_id__161947 = game.graphics.request_frame.call(null, function() {
    return run.call(null, game_state)
  });
  cljs.core.reset_BANG_.call(null, (new cljs.core.Keyword("\ufdd0'frame-id")).call(null, cljs.core.deref.call(null, game_state)), next_frame_id__161947);
  cljs.core.reset_BANG_.call(null, (new cljs.core.Keyword("\ufdd0'previous-frame")).call(null, cljs.core.deref.call(null, game_state)), current_time__161943);
  return cljs.core.swap_BANG_.call(null, game_state, cljs.core.merge, next_game_state__161946)
};
game.core.resume = function resume(game_state) {
  if(cljs.core.deref.call(null, (new cljs.core.Keyword("\ufdd0'frame-id")).call(null, cljs.core.deref.call(null, game_state))) == null) {
    cljs.core.reset_BANG_.call(null, (new cljs.core.Keyword("\ufdd0'previous-frame")).call(null, cljs.core.deref.call(null, game_state)), game.core.get_current_time.call(null));
    return game.core.run.call(null, game_state)
  }else {
    return null
  }
};
game.core.pause = function pause(game_state) {
  return cljs.core.swap_BANG_.call(null, (new cljs.core.Keyword("\ufdd0'frame-id")).call(null, cljs.core.deref.call(null, game_state)), function(frame_id) {
    if(frame_id == null) {
      return null
    }else {
      game.graphics.cancel_frame.call(null, frame_id);
      return null
    }
  })
};
game.core.start = function start(initial_state) {
  var game_state__161949 = cljs.core.atom.call(null, cljs.core.merge.call(null, initial_state, cljs.core.ObjMap.fromObject(["\ufdd0'frame-id", "\ufdd0'previous-frame"], {"\ufdd0'frame-id":cljs.core.atom.call(null, null), "\ufdd0'previous-frame":cljs.core.atom.call(null, null)})));
  game.core.resume.call(null, game_state__161949);
  return game_state__161949
};
goog.provide("game.components");
goog.require("cljs.core");
game.components.renderable = function renderable(render_fn) {
  return cljs.core.ObjMap.fromObject(["\ufdd0'renderable"], {"\ufdd0'renderable":cljs.core.ObjMap.fromObject(["\ufdd0'fn"], {"\ufdd0'fn":render_fn})})
};
game.components.position = function position(x, y) {
  return cljs.core.ObjMap.fromObject(["\ufdd0'position"], {"\ufdd0'position":cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y"], {"\ufdd0'x":x, "\ufdd0'y":y})})
};
game.components.image = function image(url) {
  return cljs.core.ObjMap.fromObject(["\ufdd0'image"], {"\ufdd0'image":cljs.core.ObjMap.fromObject(["\ufdd0'url"], {"\ufdd0'url":url})})
};
goog.provide("game.levels");
goog.require("cljs.core");
goog.require("game.components");
game.levels.levels = cljs.core.PersistentVector.fromArray([cljs.core.ObjMap.fromObject(["\ufdd0'grid", "\ufdd0'entities"], {"\ufdd0'grid":cljs.core.PersistentVector.fromArray([".....................", ".....................", "..p..................", "#####################"], true), "\ufdd0'entities":cljs.core.PersistentVector.EMPTY})], true);
game.levels._STAR_cell_width_STAR_ = 30;
game.levels._STAR_cell_height_STAR_ = 40;
game.levels.letters = cljs.core.ObjMap.fromObject(["#", "p"], {"#":game.components.image.call(null, "images/block.png"), "p":game.components.image.call(null, "images/player.png")});
game.levels.load_entity = function load_entity(letter, x, y) {
  var entity__172529 = game.levels.letters.call(null, letter);
  if(entity__172529 == null) {
    return null
  }else {
    var entity_with_position__172530 = cljs.core.merge.call(null, entity__172529, game.components.position.call(null, x, y));
    return entity_with_position__172530
  }
};
game.levels.load_row = function load_row(row_index, row) {
  return cljs.core.remove.call(null, cljs.core.nil_QMARK_, cljs.core.map_indexed.call(null, function(col_index, letter) {
    var x__172533 = col_index * game.levels._STAR_cell_width_STAR_;
    var y__172534 = row_index * game.levels._STAR_cell_height_STAR_;
    return game.levels.load_entity.call(null, letter, x__172533, y__172534)
  }, row))
};
game.levels.load_level = function load_level(level) {
  var rows__172539 = (new cljs.core.Keyword("\ufdd0'grid")).call(null, level);
  var grid_entities__172540 = cljs.core.apply.call(null, cljs.core.concat, cljs.core.map_indexed.call(null, game.levels.load_row, rows__172539));
  var additional_entities__172541 = (new cljs.core.Keyword("\ufdd0'entities")).call(null, level);
  var all_entities__172542 = cljs.core.concat.call(null, grid_entities__172540, additional_entities__172541);
  return all_entities__172542
};
goog.provide("game.util");
goog.require("cljs.core");
game.util.log = function() {
  var log__delegate = function(stuff) {
    return console.log(cljs.core.apply.call(null, cljs.core.pr_str, stuff))
  };
  var log = function(var_args) {
    var stuff = null;
    if(goog.isDef(var_args)) {
      stuff = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log__delegate.call(this, stuff)
  };
  log.cljs$lang$maxFixedArity = 0;
  log.cljs$lang$applyTo = function(arglist__158410) {
    var stuff = cljs.core.seq(arglist__158410);
    return log__delegate(stuff)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
goog.provide("game.main");
goog.require("cljs.core");
goog.require("game.graphics");
goog.require("game.levels");
goog.require("game.util");
goog.require("game.core");
cljs.core._add_method.call(null, game.core.draw, "\ufdd0'test", function(game_state) {
  var map__179609__179610 = game_state;
  var map__179609__179611 = cljs.core.seq_QMARK_.call(null, map__179609__179610) ? cljs.core.apply.call(null, cljs.core.hash_map, map__179609__179610) : map__179609__179610;
  var rect__179612 = cljs.core._lookup.call(null, map__179609__179611, "\ufdd0'rect", null);
  var brush__179613 = cljs.core._lookup.call(null, map__179609__179611, "\ufdd0'brush", null);
  game.graphics.clear.call(null, brush__179613);
  return cljs.core.apply.call(null, game.graphics.fill_rect, brush__179613, "red", rect__179612)
});
cljs.core._add_method.call(null, game.core.update, "\ufdd0'test", function(game_state, seconds_elapsed) {
  var vec__179614__179618 = (new cljs.core.Keyword("\ufdd0'rect")).call(null, game_state);
  var x__179619 = cljs.core.nth.call(null, vec__179614__179618, 0, null);
  var y__179620 = cljs.core.nth.call(null, vec__179614__179618, 1, null);
  var w__179621 = cljs.core.nth.call(null, vec__179614__179618, 2, null);
  var h__179622 = cljs.core.nth.call(null, vec__179614__179618, 3, null);
  var speed__179623 = 100;
  var offset__179624 = speed__179623 * seconds_elapsed;
  var vec__179615__179625 = cljs.core.map.call(null, cljs.core.partial.call(null, cljs.core._PLUS_, offset__179624), cljs.core.PersistentVector.fromArray([x__179619, y__179620], true));
  var x__179626 = cljs.core.nth.call(null, vec__179615__179625, 0, null);
  var y__179627 = cljs.core.nth.call(null, vec__179615__179625, 1, null);
  var canvas__179628 = (new cljs.core.Keyword("\ufdd0'canvas")).call(null, game_state);
  var vec__179616__179629 = cljs.core.PersistentVector.fromArray([canvas__179628.width, canvas__179628.height], true);
  var c_width__179630 = cljs.core.nth.call(null, vec__179616__179629, 0, null);
  var c_height__179631 = cljs.core.nth.call(null, vec__179616__179629, 1, null);
  var wrap_position__179632 = function(p1__179606_SHARP_, p2__179607_SHARP_, p3__179608_SHARP_) {
    if(p1__179606_SHARP_ < p2__179607_SHARP_) {
      return p1__179606_SHARP_
    }else {
      return p2__179607_SHARP_ - p1__179606_SHARP_ - p3__179608_SHARP_
    }
  };
  var vec__179617__179633 = cljs.core.map.call(null, wrap_position__179632, cljs.core.PersistentVector.fromArray([x__179626, y__179627], true), cljs.core.PersistentVector.fromArray([c_width__179630, c_height__179631], true), cljs.core.PersistentVector.fromArray([w__179621, h__179622], true));
  var x__179634 = cljs.core.nth.call(null, vec__179617__179633, 0, null);
  var y__179635 = cljs.core.nth.call(null, vec__179617__179633, 1, null);
  return cljs.core.ObjMap.fromObject(["\ufdd0'rect"], {"\ufdd0'rect":cljs.core.PersistentVector.fromArray([x__179634, y__179635, w__179621, h__179622], true)})
});
var canvas__179636 = document.getElementById("canvas");
var brush__179637 = game.graphics.get_brush.call(null, canvas__179636);
var initial_state__179638 = cljs.core.ObjMap.fromObject(["\ufdd0'canvas", "\ufdd0'brush", "\ufdd0'mode", "\ufdd0'rect"], {"\ufdd0'canvas":canvas__179636, "\ufdd0'brush":brush__179637, "\ufdd0'mode":"\ufdd0'test", "\ufdd0'rect":cljs.core.PersistentVector.fromArray([0, 0, 100, 100], true)});
window.state = game.core.start.call(null, initial_state__179638);
