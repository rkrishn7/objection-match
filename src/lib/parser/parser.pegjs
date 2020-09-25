start
  = Search

/*
 * A search is defined as a single predicate
*/
Search
  = predicate:Predicate
  { return predicate; }

Predicate
  = match:Match
  { return match; }
  / comparator:Comparator
  { return comparator; }

Constraints
  = constraints:(
    head:Predicate
    tail:(value_separator p:Predicate { return p; })*
    { return [head].concat(tail); }
  )?
  { return constraints !== null ? constraints: []; }

Match
  = _ fn:LogicalFunction name_separator begin_object constraints:Constraints end_object
  { return { type: 'logical', fn: fn, constraints: constraints }; }

Args
  = begin_array identifier:string _ "," _ value:SerializableValue end_array
  { return { identifier: identifier, value: value }; }

Comparator
  = _ fn:ComparisonFunction name_separator args:Args _
  { return { type: 'comparison', fn: fn, args: args }; }

ComparisonFunction
  = "eq"
  / "leq"
  / "geq"
  / "neq"
  / "lt"
  / "gt"
  / "like"
  { return text(); }

LogicalFunction
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

SerializableValue
  = false
  / true
  / null
  / string
  / number

false = "false" { return false; }
null  = "null"  { return null;  }
true  = "true"  { return true;  }

// Numbers

number "number"
  = minus? int frac? exp? { return parseFloat(text()); }

decimal_point
  = "."

digit1_9
  = [1-9]

e
  = [eE]

exp
  = e (minus / plus)? DIGIT+

frac
  = decimal_point DIGIT+

int
  = zero / (digit1_9 DIGIT*)

minus
  = "-"

plus
  = "+"

zero
  = "0"

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
