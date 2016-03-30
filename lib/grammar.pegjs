start = text

varName = end:[^{}.,()[\]|\n\r\t ]+ {return end.join(""); }

string = ['] s:(char:[^'])* ['] { return s.join(""); }
number = n:"-"? digits:[0-9]+ { return parseInt(digits.join(""), 10) * (n ? -1 : 1); }
float = v:"-"? n:number "." d2:[0-9]+ { return parseFloat(n+"."+d2.join(""), 10) * (v ? -1 : 1); }
boolean = "true" { return true; } / "false" { return false; };
null = "null" { return null; }

index = "[" n:number "]" { return n; }
ws = [ \n\r\t]
parameter =  ws* v:(null / string / boolean / float / number / staticBinding / path) ws* { return v;}
parameterArray =  s:parameter rp:("," r:parameter {return r;})* { if(s && s.name === "null") { s = null; }; for(var i = 0; i < rp.length;i++){ if(rp[i] && rp[i][0] && rp[i][0].name === "null") { rp[i] = null; }; }; return typeof s !== "undefined" ? [s].concat(rp) : []; } / "" {return []}

var = n:varName ind:index? { return {name: n, type: 'var', index: ind}; }
fnc = n:varName "(" pa:parameterArray? ")" ind:index? {return {name: n, type: 'fnc', parameter: pa, index: ind  }; }

pathElement = ind:index { return {type: 'index', index: ind }; } /  fnc / var
path = s:pathElement rp:("." r:pathElement {return r;})* {return [s].concat(rp);}

binding = "{" path:path "}" { return path ? {path: path,type:'normal'} : false; }
twoWayBinding = ws* "{{" path:path a:("|" p:path {return p;})? b:("|" p:path {return p;})? "}}" ws* { return path ? {path: path,type:'twoWay', transform: a || false, transformBack: b || false} : false; }
staticBinding = "$" b:binding { b.type = 'static'; return b; }

text = t:twoWayBinding { return [t]; } / b:(staticBinding / binding / . ) *  {
  var obj, prevObj;
  for (var i = b.length - 1; i >= 0; i--) {
      obj = b[i];
      if (i > 0) {
          prevObj = b[i - 1];
          if (typeof(obj) == "string" && typeof(prevObj) == "string") {
              b.splice(i,1);
              b[i - 1] = prevObj + obj;
          }
      }

  }
  return b;
}

eventHandler = fnc / var