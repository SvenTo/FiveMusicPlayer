
function fileNameWithoutExtension(fileName) {
  var array = fileName.split(".");
  if(array.length > 1) {
    array.pop();
    return array.concat();
  } else {
    return fileName;
  }
}

String.prototype.format = function() {
  var result = this;
  for (var i = 0; i < arguments.length; i++) {
      result = result.replace("{"+i+"}", arguments[i]);
  }
  return result;
};

Array.prototype.forEach = function(callback) {  
  for(var i = 0; i < this.length; i++) {
    callback(this[i]);
  }
};

Array.prototype.indexOf = function(item) {
  for(var i = 0; i < this.length; i++) {
    if(item == this[i]) {
      return i;
    }
  }
};

Array.prototype.remove = function(item) {
  var index = this.indexOf(item);
  if(index != undefined) {
    this.splice(index, 1);
    return true;
  }
  return false;
};

// TODO: prototype
function findKeyFramesRule(animationName) {
  var sheets = document.styleSheets;
  var ruleType = window.CSSRule.WEBKIT_KEYFRAMES_RULE;
  
  for (var i = 0; i < sheets.length; i++) {
    rules = sheets[i].cssRules;
    if(rules == null || rules == undefined) continue;
    for (var i = 0; i < rules.length; i++) {
      rule = rules[i];
      if(rule.type == ruleType && rule.name == animationName) {
        return rule;
      }
    }
  }
}

function replaceKeyFramesRule(cssKeyframesRule, key, newCSS) {
  var rule = cssKeyframesRule.deleteRule(key);
  var newRule = key + " { " + newCSS + " }";
  var rule = cssKeyframesRule.insertRule(newRule);
}

/**
 * 
 * @returns {EventSource}
 */
function EventSource() {
  var self = this;
  var handler = new Array();
  
  /**
   * 
   * @param event {Function}
   * @param args
   */
  this.raise = function(args) {
    handler.forEach(function(h) {
      h(args);
    });
  };

  /**
   * 
   * @param listener {Function}
   */
  this.register = function(listener) {
    handler.push(listener);
  };
  
  /**
   * 
   * @param event {Array}
   * @param listener {Function}
   */
  this.unregister = function(listener) {
    handler.remove(listener);
  };
}

// TEST CODE:

//test = new EventSource();
//test.raise("first");
//func1 = function(x) { alert('f1:' + x); };
//func2 = function(x) { alert('f2:' + x); };
//test.register(func1);
//test.register(func2);
//test.raise("secound");
//test.unregister(func1);
//test.raise("third");
