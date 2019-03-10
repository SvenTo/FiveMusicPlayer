
function fileNameWithoutExtension(fileName) {
  var array = fileName.split(".");
  if(array.length > 1) {
    array.pop();
    return array.concat();
  } else {
    return fileName;
  }
}

function findKeyFramesRule(animationName) {
  var sheets = document.styleSheets;
  var ruleType = window.CSSRule.KEYFRAMES_RULE;
  
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
  var rule = cssKeyframesRule.appendRule(newRule);
}
