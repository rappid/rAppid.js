start = text

varName = start:[a-zA-Z\$\_] end:[a-zA-Z0-9\$\_\-\ ] * {return start ? start + end.join("") : false; } / 

string = "'" s:(char:. { return char === "'" ? null : char; })* "'" { return s.join(""); }
number = n:"-"? digits:[0-9]+ { return parseInt(digits.join(""), 10) * (n ? -1 : 1); }
float = n:number "." d2:[0-9]+ { return parseFloat(n+"."+d2.join(""), 10) }
boolean = "true" { return true; } / "false" { return false; };

index = "[" n:number "]" { return n; }
parameter = string  / boolean / float / number / staticBinding / binding
parameterArray = s:parameter? rp:("," r:parameter {return r;})* {return s ? [s].concat(rp) : []; }

var = n:varName ind:index? { return {name: n, type: 'var', index: ind}; }
fnc = n:varName "(" pa:parameterArray? ")" ind:index? {return {name: n, type: 'fnc', parameter: pa, index: ind  }; }

pathElement = ind:index { return {type: 'index', index: ind }; } / fnc / var
path = s:pathElement rp:("." r:pathElement {return r;})* {return [s].concat(rp);}

binding = "{" path:path "}" { return path ? {path: path,type:'normal'} : false; }
twoWayBinding = "{{" path:path a:("|" p:path {return p;})? b:("|" p:path {return p;})? "}}" { return path ? {path: path,type:'twoWay', transformBack: a || false, transform: b || false} : false; }
staticBinding = "$" b:binding { b.type = 'static'; return b; }

text = t:twoWayBinding { return [t]; } / b:(staticBinding / binding / . ) *
