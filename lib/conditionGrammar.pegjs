start = and

and = o:operator rp:(" and " o:operator { return o; } )* { return o ? { type: "group", name: "and", args: [o].concat(rp) } : null; }
operator = comparison / callOperator / group
callOperator = n:name "(" args:( a:argument rp:( "," a:argument { return a } )* { return [a].concat(rp) } )? ")"  { return { name: n, args: args }; }
argument = callOperator / value
value = n:nchar+ { return n.join(""); } / typedValue / array
typedValue = c:nchar+ ":" v:nchar+ { return { type: c.join(""), value: v.join("") } }
array = "(" v:value rv:( "," iv:value {return iv;})* ")" { return [v].concat(rv); }
name = r:nchar+ { return r.join(""); }


comparator = "=" {return "eql";} / ">=" { return "gte"; } / "<=" { return "lte" } / ">" {return "gt"} / "<" { return "lt" }
comparison = n:name c:comparator v:value { return {name: c, args: [n,v] }; }
group = "(" op:( or / and) ")" { return op; }
or = o:operator rp:( " or " o:operator { return o; } )+ { return o ? { type: "group", name: "or", args: [o].concat(rp) } : null; }

nchar = unreserved / "*" / "+"
pctEncoded   = "%" HEXDIG HEXDIG
HEXDIG = [a-fA-F0-9]
unreserved    = [a-zA-Z] / [0-9] / "-" / "." / "_" / "~"