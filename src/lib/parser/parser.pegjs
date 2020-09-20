start
  = Query

Query
  = _ predicate:Predicate name_separator begin_object constraints:Constraints end_object _
  { return { predicate: predicate, constraints: constraints }; }

Constraints
  = constraints:(
    head:Constraint
    tail:(value_separator c:Constraint { return c; })*
    { return [head].concat(tail); }
  )?
  { return constraints !== null ? constraints: []; }

Set
  = begin_array key:string _ "," _ value:string end_array
  { return { key: key, value: value }; }

Constraint
  = op:Binop name_separator value:Set
  { return { op: op, value: value }; }
  / Query

Binop
  = "eq"
  / "leq"
  / "geq"
  / "neq"
  { return text(); }

Predicate
  = "match_all"
  / "match_any"
  { return text(); }

begin_object    = _ "{" _
end_object      = _ "}" _
begin_array     = _ "[" _
end_array       = _ "]" _
name_separator  = _ ":" _
value_separator = _ "," _

_ "whitespace"
  = [ \t\n\r]*

// Values

false = "false" { return false; }
null  = "null"  { return null;  }
true  = "true"  { return true;  }

// Strings

string "string"
  = quotation_mark chars:char* quotation_mark { return chars.join(""); }

char
  = unescaped
  / escape
    sequence:(
        '"'
      / "\\"
      / "/"
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
      / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
          return String.fromCharCode(parseInt(digits, 16));
        }
    )
    { return sequence; }

escape
  = "\\"

quotation_mark
  = '"'

unescaped
  = [^\0-\x1F\x22\x5C]

DIGIT  = [0-9]
HEXDIG = [0-9a-f]i
