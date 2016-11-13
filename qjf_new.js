

function checkType(x,types,xname,place){
  if(types.constructor !== Array){
    if(typeof(x) == 'undefined')
      throw "type error: "+place+": "+xname+" should be a "+types.name+", but it's undefined";
    if(x.constructor !== types)
      throw "type error: "+place+": "+xname+" should be a "+types.name+", but given: "+x.constructor.name;
  }else{
    var which_got_checked = [];
    types.forEach(function(y){
      if(x.constructor === y)
        which_got_checked.push(y);
    });
    if(which_got_checked.length==0){
      var types_to_match = [];
      types.forEach(function(y){
        types_to_match.push(y.name);
      })
      throw "type error: "+place+": "+xname+" should be one of:["
            +types_to_match.join(',')+"], but given a "+x.constructor.name;
    }
  }
}
function checkValue(x,v,xname,place){
  if(x != v)
    throw "value error: "+place+": "+xname+" should be: "+v.toString()+", but given "+x.toString();
}
function checkArrayType(x,type,xname,place){
  checkType(x,Array,xname,place);
  for(var i=0;i<x.length;i++){
    checkType(x[i], type, xname+'['+i+']', place);
  }
}

var nameReg = new RegExp('([a-zA-Z_$][a-zA-Z0-9_$]*)');
function Name(n){
  checkType(n,String,'n','Name');
  if(nameReg.test(n))
    this.text = n;
  else
    throw 'error: Name: wrong format, given:'+n;
}
function lName(n){
  checkType(n,String,'n','lName');
  this.name = n[0].toLowerCase() + n.slice(1);
}
function uName(n){
  checkType(n,String,'n','uName');
  this.name = n[0].toUpperCase() + n.slice(1);
}

function DontCare(){}
var insDontCare = new DontCare();

function Tuple(n,items){
  checkType(n,Number,'n','Tuple(internal)');
  checkType(items,Array,'items','Tuple');
  checkValue(items.length,n,'items.length','Tuple');

  this.items = items;
}

// function List(items){
//   checkType(items,Array,'items','List(internal)');
//   this.items = items;
// }

//----type

function ParamType(i,n,t){
  checkType(i,Boolean,'i', 'ParamType');
  checkType(n,Name,'n','ParamType');
  //t : Type

  this.implicit = i;
  this.name = n;
  this.type = t;
}
function ArrowType(t1,t2){
  //t1,t2 : Type
  this.lefttype = t1;
  this.righttype = t2;
}
function SubType(t){
  //t : Type
  this.subtype = t;
}
function SupType(t){
  //t : Type
  this.suptype = t;
}
function RecordType(keytypes){
  //keytypes : [[Name, Type], [Name, Type] ...]
  checkArrayType(keytypes, Array, 'keytypes', 'RecordType');
  for(var i=0;i<keytypes.length;i++){
    checkType(keytypes[i][0], Name, 'keytypes['+i+'][0]', 'RecordType');
    checkType(keytypes[i][1], Type, 'keytypes['+i+'][1]', 'RecordType');
  }

  this.keytypes = keytypes;
}
function ListType(t){
  //t : Type
  this.listype = t;
}

function ComposeType(f,args){ //args will stay as unevaluated javascript string
  checkType(f, Name, 'f', 'ComposeType');
  checkArrayType(args, String, 'args', 'ComposeType');

  this.f = f;
  this.args = args;
}


function Type(t){
  switch(t.constructor){
    case ParamType:
    case ArrowType:
    case SubType:
    case SupType:
    case Tuple:
    case RecordType:
    case ListType:
    case ComposeType:
    case Name:
    case DontCare:
      this.type = t;
      break;
    default:
      throw 'type error: new Type: invalid type kind'
  }
} 

function NoType(){}


//--------type manipulation utilities

function lastArrowOfChain(t){
  checkType(t, ArrowType, 't', 'lastArrowOfChain');
  checkType(t.righttype, Type, 't.righttype', 'lastArrowOfChain');

  if(t.righttype.type.constructor === ArrowType){
    return lastArrowOfChain(t.righttype.type);
  }else{
    return t;
  }
}

function listType2Arrow(ts){
  checkArrayType(ts, Type, 'ts', 'listType2Arrow');
  if(ts.length<1)
    throw "error in listType2Arrow: ts.length<1"

  var res = ts[ts.length-1];
  for(var i=ts.length-2; i>=0; i--){
    res = new Type(new ArrowType(ts[i], res));
  }
  return res;
}


// type parsing

















//------- patterns

function IntroFormPattern(cnstr, patterns){
  checkType(cnstr, Name, 'cnstr', 'IntroFormPattern');
  checkType(patterns,Array,'patterns','IntroFormPattern');
  //[IPattern]

  this.cnstr = cnstr;
  this.patterns = patterns;
}
function RecordPattern(leadvar, restvar, keypats){
  checkType(leadvar,Array,'leadvar','RecordPattern');
  if(leadvar.length>=1) //length==0: no leadvar
    checkType(leadvar[0], Name, 'leadvar[0]', 'RecordPattern');
  checkType(restvar,Array,'restvar','RecordPattern');
  if(restvar.length>=1) //length==0: no restvar
    checkType(restvar[0], [Name,DontCare], 'restvar[0]', 'RecordPattern');
  checkType(keypats,Array,'keypats','RecordPattern');
  //[[name,IPattern]]
  for(var i=0;i<keypats.length;i++){
    checkType(keypats[i][0],Name,'keypats['+i+'][0]', 'RecordPattern');
  }


  this.hasLeadvar = leadvar.length>=1;
  this.hasRestvar = restvar.length>=1;
  this.leadvar = this.hasLeadvar ? leadvar[0] : "";
  this.restvar = this.hasRestvar ? restvar[0] : ""; //"" for case of no restvar
  this.keypats = keypats;
}
function ConsPattern(x,xs){
  //x : IPattern
  //xs : IPattern

  this.head = x;
  this.tail = xs;
}
function NilPattern(){}
var insNilPattern = new NilPattern();

function IPattern(inp){
  checkType(inp, [ DontCare, Name, IntroFormPattern, Tuple
                 , Array, IPattern, RecordPattern
                 , ConsPattern, NilPattern, Number, String]
            , 'inp', 'IPattern');
  if(inp.constructor === Array)
    checkArrayType(inp, IPattern, 'inp', 'IPattern');


  this.ipattern = inp;
}

function CPattern(observer, patterns){
  checkType(observer, [DontCare, Name], 'observer', 'CPattern');
  checkArrayType(patterns,IPattern,'patterns','CPattern');

  this.observer = observer;
  this.patterns = patterns;
}

function WholePattern(inp){
  checkType(inp, [Array,CPattern], 'inp', 'WholePattern');
  if(inp.constructor === Array){
    checkArrayType(inp, IPattern, 'inp', 'WholePattern');
  }
  this.wholepattern = inp;
}








//------- declarations

function qjf$Constructor(name, type){
  checkType(name, Name, 'name', 'qjf$Constructor');
  checkType(type, Type, 'type', 'qjf$Constructor');
  this.name = name;
  this.type = type;
  this.arity = countArity(type);
}


//record
function FieldVal(type,val){
  checkType(type,Type,'type','Field');

  this.type = type;
  this.val = val;
}


function Record(name,parameters,type,fields,hasCnstr,cnstr){
  checkType(name,Name,'name','Record');
  checkArrayType(parameters, ParamType, 'parameters', 'Record');
  checkType(type, [NoType, Type], 'type', 'Record');

  //fields : [keytype]
  checkArrayType(fields, Array, 'fields', 'Record');
  for(var i=0;i<fields.length;i++){
    checkType(fields[i][0], Name, 'fields['+i+'][0]', 'Record');
    checkType(fields[i][1], Type, 'fields['+i+'][1]', 'Record');
  }
  checkType(hasCnstr, Boolean, 'hasCnstr', 'Record');
  if(hasCnstr)
    checkType(cnstr, Name, 'cnstr', 'Record');


  this.recordname = name;
  this.parameters = parameters;   //Array of ParamType
  this.type = type;
  this.arity = parameters.length;
  this.fields = fields;
  this.hasRecConstructor = hasCnstr;

  //making record constructor information
  if(hasCnstr){
    // fields' types as the constructor's input
    var fieldtypes = [];
    for(var i=0;i<fields.length;i++){
      fieldtypes.push(fields[i][1]);
    }

    //deciding the output type of the constructor
    if(parameters.length<1){
      //If there's no parameter, then simply the recordname 
      //  will be the return type of the constructor.
      fieldtypes.push(new Type(name));

    }else{
      //Collect all the names of parameters;
      // if any parameter is implicit, it's appearance will add a pair of curly braces.
      // for example: (a : A) {b : B}
      //  will become: ['a', '{b}']
      var paramNameTexts = [];
      for(var i=0;i<parameters.length;i++){
        if(parameters[i].implicit)
          paramNames.push('{'+parameters[i].name.text+'}');
        else
          paramNames.push(parameters[i].name.text);
      }
      fieldtypes.push(new Type(new ComposeType(name, paramNames)));
    }
    this.recConstructor = new qjf$Constructor(cnstr, listType2Arrow(fieldtypes));
  }else{
    this.recConstructor = null;
  }
}
//module
function Module(name, parameters, fields){
  checkType(name, Name, 'name', 'Module');
  checkArrayType(parameters, ParamType, 'parameters', 'Module');
  
  //fields : {k1 : FieldVal, k2 ...}
  checkType(fields, Object, 'fields', 'Record');
  for(var k in fields){
    checkType(fields[k], FieldVal, 'fields['+k+']', 'Record');
  }

  this.modulename = name;
  this.parameters = parameters;
  this.arity = parameters.length;
  this.fields = fields;
}



function countArity(type){
  if(  type.constructor !== NoType
    && type.constructor !== Type )
    throw "error 1 in countArity"

  if(type.constructor === NoType)
    return 0;

  function rec(t,count){
    switch(t.type.constructor){
      case ArrowType:
        return rec(t.type.righttype, count+1);
      case ParamType:
        return t.type.implicit ? count : count+1;
      case SubType:
      case SupType:
      case DontCare:
      case Tuple:
      case RecordType:
      case ListType:
      case ComposeType:
      case Name:
        return count+1;
      default:
        throw 'error in rec of countArity'
    }
  }

  return rec(type,0)-1;
}

//data

function Data(name,params,type,cnstrs){
  checkType(name, Name, 'name', 'Data');
  checkArrayType(params, ParamType, 'params', 'Data');
  checkType(type, Type, 'type', 'Data');
  checkArrayType(cnstrs, qjf$Constructor, 'cnstrs', 'Data');

  this.name = name;
  this.params = params;
  this.type = type;
  this.constructors = cnstrs;
  this.arity = countArity(type)+params.length;
}


//codata
function qjf$Observer(name,type){
  checkType(name, Name, 'name', 'qjf$Observer');
  checkType(type, [Type, NoType], 'type', 'qjf$Observer');

  this.name = name;
  this.type = type;
}
function Codata(name,params,type,observers){
  checkType(name, Name, 'name', 'Codata');
  checkArrayType(params, ParamType, 'params', 'Codata');
  checkType(type, Type, 'type', 'Codata');
  checkArrayType(observers, qjf$Observer, 'observers', 'Codata');

  this.name = name;
  this.params = params;
  this.type = type;
  this.observers = observers;
  this.arity = countArity(type) + params.length;
}

// -----
//allparsers










allparsers = /*
 * Generated by PEG.js 0.10.0.
 *
 * http://pegjs.org/
 */
(function() {
  "use strict";

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function peg$SyntaxError(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.location = location;
    this.name     = "SyntaxError";

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, peg$SyntaxError);
    }
  }

  peg$subclass(peg$SyntaxError, Error);

  peg$SyntaxError.buildMessage = function(expected, found) {
    var DESCRIBE_EXPECTATION_FNS = {
          literal: function(expectation) {
            return "\"" + literalEscape(expectation.text) + "\"";
          },

          "class": function(expectation) {
            var escapedParts = "",
                i;

            for (i = 0; i < expectation.parts.length; i++) {
              escapedParts += expectation.parts[i] instanceof Array
                ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
                : classEscape(expectation.parts[i]);
            }

            return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
          },

          any: function(expectation) {
            return "any character";
          },

          end: function(expectation) {
            return "end of input";
          },

          other: function(expectation) {
            return expectation.description;
          }
        };

    function hex(ch) {
      return ch.charCodeAt(0).toString(16).toUpperCase();
    }

    function literalEscape(s) {
      return s
        .replace(/\\/g, '\\\\')
        .replace(/"/g,  '\\"')
        .replace(/\0/g, '\\0')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
    }

    function classEscape(s) {
      return s
        .replace(/\\/g, '\\\\')
        .replace(/\]/g, '\\]')
        .replace(/\^/g, '\\^')
        .replace(/-/g,  '\\-')
        .replace(/\0/g, '\\0')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
    }

    function describeExpectation(expectation) {
      return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
    }

    function describeExpected(expected) {
      var descriptions = new Array(expected.length),
          i, j;

      for (i = 0; i < expected.length; i++) {
        descriptions[i] = describeExpectation(expected[i]);
      }

      descriptions.sort();

      if (descriptions.length > 0) {
        for (i = 1, j = 1; i < descriptions.length; i++) {
          if (descriptions[i - 1] !== descriptions[i]) {
            descriptions[j] = descriptions[i];
            j++;
          }
        }
        descriptions.length = j;
      }

      switch (descriptions.length) {
        case 1:
          return descriptions[0];

        case 2:
          return descriptions[0] + " or " + descriptions[1];

        default:
          return descriptions.slice(0, -1).join(", ")
            + ", or "
            + descriptions[descriptions.length - 1];
      }
    }

    function describeFound(found) {
      return found ? "\"" + literalEscape(found) + "\"" : "end of input";
    }

    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
  };

  function peg$parse(input, options) {
    options = options !== void 0 ? options : {};

    var peg$FAILED = {},

        peg$startRuleIndices = 
          { WholePattern: 0
          , CodataDecl: 12
          , RecordDecl: 13
          , DataDecl: 15
          , ModuleDecl: 20
          , Type: 22
          },
        peg$startRuleIndex   = 0,

        peg$consts = [
          function(ps) {return new WholePattern(ps)},
          function(cp) {return new WholePattern(cp)},
          function(p, ps) {ps.unshift(p); return ps},
          peg$anyExpectation(),
          function() {return []},
          function(n) {return new IPattern(n)},
          function(s) {return new IPattern(s)},
          "@",
          peg$literalExpectation("@", false),
          "*",
          peg$literalExpectation("*", false),
          function(c, ps) {
                  if(ps.length == 0){
                          return c.text=='_' ? new IPattern(insDontCare) : new IPattern(c);
                        }else{
                          return new IPattern(new IntroFormPattern(c, ps));
                        }
                },
          "(",
          peg$literalExpectation("(", false),
          ",",
          peg$literalExpectation(",", false),
          ")",
          peg$literalExpectation(")", false),
          function(p, ps) {
                      ps.unshift(p);
                      return new IPattern(new Tuple(ps.length,ps))
                      },
          ":",
          peg$literalExpectation(":", false),
          function(ph, ps) {
                        var pt = ps[ps.length-1];
                          for(var i=ps.length-2; i>=0; i--){
                            pt = new IPattern(new ConsPattern(ps[i], pt));
                          }
                        return new IPattern(new ConsPattern(ph,pt))
                      },
          function(p) {return p},
          "[]",
          peg$literalExpectation("[]", false),
          function() {return new IPattern(insNilPattern)},
          "[",
          peg$literalExpectation("[", false),
          "]",
          peg$literalExpectation("]", false),
          function(ps) {return new IPattern(ps)},
          "{",
          peg$literalExpectation("{", false),
          "|",
          peg$literalExpectation("|", false),
          "}",
          peg$literalExpectation("}", false),
          function(ln, rn, r) {
                       return new IPattern(
                         new RecordPattern( ln==null? [] : [ln[0]]
                          , rn==null? [] : [rn[0].text=='_'?insDontCare:rn[0]]
                          , r));
                     },
          /^[ \t\n\r]/,
          peg$classExpectation([" ", "\t", "\n", "\r"], false, false),
          function(ps) {return ps},
          function(p, ps) {ps.unshift(p);return ps},
          /^[)\]]/,
          peg$classExpectation([")", "]"], false, false),
          "=",
          peg$literalExpectation("=", false),
          function(k, p, rps) {
                  rps.unshift([k,p]);
                        return rps;
                      },
          function(rps) {return rps},
          function(o) {
                return new CPattern(o.text=='_'? insDontCare : o ,[])},
          function(o, ps) {
                       return new CPattern(o.text=='_'? insDontCare : o , ps)
                     },
          function(n, ps, t, r) {
                var obsvs = [];
                      for(var i=0;i<r.type.keytypes.length;i++){
                        obsvs.push(new qjf$Observer(r.type.keytypes[i][0], r.type.keytypes[i][1]));
                      }
                return new Codata(n,ps,t,obsvs);
                },
          function(n, ps, t, cnstr, r) {
                   if(cnstr===null){
                           return new Record(n,ps,t,r.type.keytypes,false);
                         }else{
                           return new Record(n,ps,t,r.type.keytypes,true,cnstr)
                         }      
                       },
          function(n, ps) {
                        var x = new ParamType(false,n,new Type(insDontCare));
                        ps.unshift(x);
                        return ps;
                      },
          function(p, ps) {
                       ps.unshift(p.type)
                       return ps;
                      },
          function(l, r) {return new Data(l[0],l[1],l[2],r);},
          function(n, ps, t) {return [n,ps,t];},
          function(p, ps) {
                          ps.unshift(p);
                          return ps;
                        },
          function(cs) {return cs},
          function(c, ct) {return [new qjf$Constructor(c,ct)];},
          function(c, ct, cs) {
                           cs.unshift(new qjf$Constructor(c,ct))
                           return cs;
                         },
          function(n, ts) {return {name : n, params:ts}},
          function() {return [];},
          function(n, ts) {
                        var x = new Type(new ParamType(false,n,new Type(insDontCare)));
                        ts.unshift(x);
                        return ts;
                      },
          function(t, ts) {
                       ts.unshift(t)
                       return ts;
                      },
          "->",
          peg$literalExpectation("->", false),
          function(st) {return st;},
          function(st, t) {return new Type(new ArrowType(st,t))},
          function(ps, t) {
              if(ps.type.constructor === ArrowType){
                var last = lastArrowOfChain(ps.type);
                last.righttype = new Type(new ArrowType(last.righttype, t));
                    return ps;
                  }else{
                    return new Type(new ArrowType(ps,t));
                  }},
          function(st, t) {return new Type(new ArrowType(st,t));},
          function(p) { return p },
          function(p, ps) { return new Type(new ArrowType(p,ps)) },
          function(n, t) { 
                 return new Type(new ParamType(false,n,t))
                  },
          function(n, t) { 
                  return new Type(new ParamType(true,n,t))
                  },
          function(p) { return p; },
          "-",
          peg$literalExpectation("-", false),
          function(t) { return new Type(new SubType(t)); },
          "+",
          peg$literalExpectation("+", false),
          function(t) { return new Type(new SupType(t)); },
          function(t, ts) {
                       ts.unshift(t);
                       return new Type(new Tuple(ts.length,ts));
                     },
          function(t) {return t;},
          function(r) {return r;},
          function(t) {return new Type(new ListType(t));},
          function(c, args) {
                       return new Type(new ComposeType(c,args));
                     },
          function(n) { 
                    if(n.text == '_'){
                        return new Type(insDontCare);
                      }else{
                      return new Type(n); 
                      }},
          function(s) {return [s]},
          function(s, ss) {
                        ss.unshift(s);
                        return ss;
                      },
          /^[^=([{ \t\n\r)\]}\-:,]/,
          peg$classExpectation(["=", "(", "[", "{", " ", "\t", "\n", "\r", ")", "]", "}", "-", ":", ","], true, false),
          function(s, ls) {
                  var res = s.join('')+ls;
                  return res;},
          /^[= \t\n\r)\]}\-:,]/,
          peg$classExpectation(["=", " ", "\t", "\n", "\r", ")", "]", "}", "-", ":", ","], false, false),
          function() {return ""},
          /^[([{]/,
          peg$classExpectation(["(", "[", "{"], false, false),
          /^[)\]}]/,
          peg$classExpectation([")", "]", "}"], false, false),
          function(ls) {return m+rp+ls},
          function(r) {return '('+r;},
          function(r) {return '['+r;},
          function(cb, r) {return cb+r;},
          /^[^)(]/,
          peg$classExpectation([")", "("], true, false),
          function(any, i, b) {return any.join('')+i+')'+b},
          function(any) {return any.join('')},
          /^[^\][]/,
          peg$classExpectation(["]", "["], true, false),
          function(any, i, b) {return any.join('')+i+']'+b},
          /^[^}{]/,
          peg$classExpectation(["}", "{"], true, false),
          function(any, i, rcb, b) {return any.join('')+i+rcb+b},
          function(t) { return [t]; },
          function(t, ts) {
                        ts.unshift(t);
                        return ts;
                      },
          function(lf) { return new Type(new RecordType(lf))},
          function(n, t) { return [[n,t]];},
          function(n, t, lf) {
                        lf.unshift([n,t]);
                          return lf;
                       },
          peg$otherExpectation("whitespace"),
          /^[a-zA-Z_$]/,
          peg$classExpectation([["a", "z"], ["A", "Z"], "_", "$"], false, false),
          /^[a-zA-Z0-9_$]/,
          peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "_", "$"], false, false),
          function(n) { return new Name(n[0]+n[1].join('')) },
          /^[0-9]/,
          peg$classExpectation([["0", "9"]], false, false),
          function(n) { return Number(n.join('')); },
          /^[^=`~!@#%\^&*\-+,.<>\/?|\\)}\]:;]/,
          peg$classExpectation(["=", "`", "~", "!", "@", "#", "%", "^", "&", "*", "-", "+", ",", ".", "<", ">", "/", "?", "|", "\\", ")", "}", "]", ":", ";"], true, false),
          /^[=`~!@#%\^&*\-+,.<>\/?|\\)}\]:;]/,
          peg$classExpectation(["=", "`", "~", "!", "@", "#", "%", "^", "&", "*", "-", "+", ",", ".", "<", ">", "/", "?", "|", "\\", ")", "}", "]", ":", ";"], false, false),
          "\"",
          peg$literalExpectation("\"", false),
          /^[^"]/,
          peg$classExpectation(["\""], true, false),
          function(s) {return s.join('')},
          "'",
          peg$literalExpectation("'", false),
          /^[^']/,
          peg$classExpectation(["'"], true, false)
        ],

        peg$bytecode = [
          peg$decode("%;!/' 8!: !! )./ &%;+/' 8!:!!! )"),
          peg$decode("%;#/;#;E/2$;\"/)$8#:\"#\"\" )(#'#(\"'#&'#"),
          peg$decode("%%<1\"\"5!7#=.##&&!&'#./ &%<;I=/##&'!&&#/& 8!:$! ).E &%;#/;#;E/2$;\"/)$8#:\"#\"\" )(#'#(\"'#&'#"),
          peg$decode("%;G/' 8!:%!! ).\u02AF &%;J/' 8!:&!! ).\u029D &%;F/b#;E/Y$%<2'\"\"6'7(.) &2)\"\"6)7*=.##&&!&'#/2$;$/)$8$:+$\"# )($'#(#'#(\"'#&'#.\u024E &%2,\"\"6,7-/t#;E/k$;#/b$;E/Y$2.\"\"6.7//J$;E/A$;'/8$20\"\"6071/)$8(:2(\"%!)(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u01E7 &%2,\"\"6,7-/}#;E/t$;#/k$;E/b$23\"\"6374/S$;E/J$;%/A$;E/8$20\"\"6071/)$8):5)\"&\")()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u0177 &%2,\"\"6,7-/R#;E/I$;#/@$;E/7$20\"\"6071/($8%:6%!\")(%'#($'#(#'#(\"'#&'#.\u0132 &%27\"\"6778/& 8!:9! ).\u011B &%2:\"\"6:7;/R#;E/I$;'/@$;E/7$2<\"\"6<7=/($8%:>%!\")(%'#($'#(#'#(\"'#&'#.\xD6 &%%;F/D#;E/;$2'\"\"6'7(/,$;E/#$+$)($'#(#'#(\"'#&'#.\" &\"/\x9C#2?\"\"6?7@/\x8D$;E/\x84$%;F/;#;E/2$2A\"\"6A7B/#$+#)(#'#(\"'#&'#.\" &\"/T$;E/K$;)/B$;E/9$2C\"\"6C7D/*$8(:E(#'$\")(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%%<1\"\"5!7#=.##&&!&'#./ &%<;I=/##&'!&&#/& 8!:$! ).T &%$4F\"\"5!7G/,#0)*4F\"\"5!7G&&&#/1#;!/($8\":H\"! )(\"'#&'#"),
          peg$decode("%;#/;#;E/2$;&/)$8#:I#\"\" )(#'#(\"'#&'#"),
          peg$decode("%23\"\"6374/1#;%/($8\":H\"! )(\"'#&'#.@ &%%<20\"\"6071=/##&'!&&#/& 8!:$! )"),
          peg$decode("%;#/;#;E/2$;(/)$8#:\"#\"\" )(#'#(\"'#&'#"),
          peg$decode("%2.\"\"6.7//:#;E/1$;'/($8#:H#! )(#'#(\"'#&'#.@ &%%<4J\"\"5!7K=/##&'!&&#/& 8!:$! )"),
          peg$decode("%;F/f#;E/]$2L\"\"6L7M/N$;E/E$;#/<$;E/3$;*/*$8':N'#&\" )(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%%<2C\"\"6C7D=/##&'!&&#/& 8!:$! ).J &%2.\"\"6.7//:#;E/1$;)/($8#:O#! )(#'#(\"'#&'#"),
          peg$decode("%;F/@#;E/7$2)\"\"6)7*/($8#:P#!\")(#'#(\"'#&'#.\x8D &%;F/\x83#;E/z$2,\"\"6,7-/k$;E/b$2)\"\"6)7*/S$;E/J$;!/A$;E/8$20\"\"6071/)$8):Q)\"(\")()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;F/\x91#;E/\x88$;./\x7F$;E/v$23\"\"6374/g$;E/^$;6/U$;E/L$2L\"\"6L7M/=$;E/4$;C/+$8+:R+$*($ )(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;F/\xA9#;E/\xA0$;./\x97$;E/\x8E$23\"\"6374/\x7F$;E/v$;6/m$;E/d$2L\"\"6L7M/U$;E/L$;F.\" &\"/>$;E/5$;C/,$8-:S-%,*&\" )(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%%<23\"\"6374=/##&'!&&#/& 8!:$! ).m &%;F/;#;E/2$;./)$8#:T#\"\" )(#'#(\"'#&'#.E &%;9/;#;E/2$;./)$8#:U#\"\" )(#'#(\"'#&'#"),
          peg$decode("%;0/S#;E/J$2L\"\"6L7M/;$;E/2$;2/)$8%:V%\"$ )(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;F/o#;E/f$;1/]$;E/T$23\"\"6374/E$;E/<$;6/3$;E/*$8(:W(#'%!)(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%%<%;E/2#2L\"\"6L7M/#$+\")(\"'#&'#=/##&'!&&#/& 8!:$! ).E &%;9/;#;E/2$;1/)$8#:X#\"\" )(#'#(\"'#&'#"),
          peg$decode("%%<1\"\"5!7#=.##&&!&'#/& 8!:$! )./ &%;3/' 8!:Y!! )"),
          peg$decode("%;F/v#;E/m$23\"\"6374/^$;E/U$;6/L$;E/C$%<1\"\"5!7#=.##&&!&'#/)$8':Z'\"&\")(''#(&'#(%'#($'#(#'#(\"'#&'#.\x88 &%;F/~#;E/u$23\"\"6374/f$;E/]$;6/T$;E/K$2A\"\"6A7B/<$;E/3$;3/*$8):[)#($ )()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;F/;#;E/2$;5/)$8#:\\#\"\" )(#'#(\"'#&'#"),
          peg$decode("%%<1\"\"5!7#=.##&&!&'#/& 8!:]! ).m &%;F/;#;E/2$;5/)$8#:^#\"\" )(#'#(\"'#&'#.E &%;9/;#;E/2$;5/)$8#:_#\"\" )(#'#(\"'#&'#"),
          peg$decode("%;:/L#;E/C$%<2`\"\"6`7a=.##&&!&'#/($8#:b#!\")(#'#(\"'#&'#.\x9D &%;:/S#;E/J$2`\"\"6`7a/;$;E/2$;7/)$8%:c%\"$ )(%'#($'#(#'#(\"'#&'#.] &%;8/S#;E/J$2`\"\"6`7a/;$;E/2$;7/)$8%:d%\"$ )(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;:/L#;E/C$%<2`\"\"6`7a=.##&&!&'#/($8#:b#!\")(#'#(\"'#&'#.] &%;:/S#;E/J$2`\"\"6`7a/;$;E/2$;7/)$8%:e%\"$ )(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;9/V#%<%;E/2#2`\"\"6`7a/#$+\")(\"'#&'#=/##&'!&&#/($8\":f\"!!)(\"'#&'#.E &%;9/;#;E/2$;8/)$8#:g#\"\" )(#'#(\"'#&'#"),
          peg$decode("%2,\"\"6,7-/t#;E/k$;F/b$;E/Y$23\"\"6374/J$;E/A$;6/8$20\"\"6071/)$8(:h(\"%!)(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\x84 &%2?\"\"6?7@/t#;E/k$;F/b$;E/Y$23\"\"6374/J$;E/A$;6/8$2C\"\"6C7D/)$8(:i(\"%!)(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;9/' 8!:j!! ).\u01D6 &%2k\"\"6k7l/:#;E/1$;7/($8#:m#! )(#'#(\"'#&'#.\u01A9 &%2n\"\"6n7o/:#;E/1$;7/($8#:p#! )(#'#(\"'#&'#.\u017C &%2,\"\"6,7-/}#;E/t$;6/k$;E/b$2.\"\"6.7//S$;E/J$;B/A$;E/8$20\"\"6071/)$8):q)\"&\")()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u010C &%2,\"\"6,7-/R#;E/I$;6/@$;E/7$20\"\"6071/($8%:r%!\")(%'#($'#(#'#(\"'#&'#.\xC7 &%;C/' 8!:s!! ).\xB5 &%2:\"\"6:7;/R#;E/I$;6/@$;E/7$2<\"\"6<7=/($8%:t%!\")(%'#($'#(#'#(\"'#&'#.p &%;F/T#$4F\"\"5!7G/,#0)*4F\"\"5!7G&&&#/2$;;/)$8#:u#\"\" )(#'#(\"'#&'#./ &%;F/' 8!:v!! )"),
          peg$decode("%;</g#%<%;E/C#%<1\"\"5!7#=.##&&!&'#.# &;I/#$+\")(\"'#&'#=/##&'!&&#/($8\":w\"!!)(\"'#&'#.^ &%;</T#$4F\"\"5!7G/,#0)*4F\"\"5!7G&&&#/2$;;/)$8#:x#\"\" )(#'#(\"'#&'#"),
          peg$decode("%%<;H=/##&'!&&#/T#$4y\"\"5!7z/,#0)*4y\"\"5!7z&&&#/2$;=/)$8#:{#\"! )(#'#(\"'#&'#"),
          peg$decode("%%<1\"\"5!7#=.##&&!&'#.5 &%<4|\"\"5!7}=/##&'!&&#/& 8!:~! ).o &%%%<4\x7F\"\"5!7\x80=/##&'!&&#/;#;>/2$4\x81\"\"5!7\x82/#$+#)(#'#(\"'#&'#/1#;</($8\":\x83\"! )(\"'#&'#"),
          peg$decode("%2,\"\"6,7-/1#;?/($8\":\x84\"! )(\"'#&'#.f &%2:\"\"6:7;/1#;@/($8\":\x85\"! )(\"'#&'#.B &%2?\"\"6?7@/2#;A/)$8\":\x86\"\"! )(\"'#&'#"),
          peg$decode("%$4\x87\"\"5!7\x880)*4\x87\"\"5!7\x88&/f#%<4\x7F\"\"5!7\x80=/##&'!&&#/K$;>/B$20\"\"6071/3$;?/*$8%:\x89%#$\" )(%'#($'#(#'#(\"'#&'#.` &%$4\x87\"\"5!7\x880)*4\x87\"\"5!7\x88&/C#%<20\"\"6071=/##&'!&&#/($8\":\x8A\"!!)(\"'#&'#"),
          peg$decode("%$4\x8B\"\"5!7\x8C0)*4\x8B\"\"5!7\x8C&/f#%<4\x7F\"\"5!7\x80=/##&'!&&#/K$;>/B$2<\"\"6<7=/3$;@/*$8%:\x8D%#$\" )(%'#($'#(#'#(\"'#&'#.` &%$4\x8B\"\"5!7\x8C0)*4\x8B\"\"5!7\x8C&/C#%<20\"\"6071=/##&'!&&#/($8\":\x8A\"!!)(\"'#&'#"),
          peg$decode("%$4\x8E\"\"5!7\x8F0)*4\x8E\"\"5!7\x8F&/g#%<4\x7F\"\"5!7\x80=/##&'!&&#/L$;>/C$2C\"\"6C7D/4$;A/+$8%:\x90%$$\"! )(%'#($'#(#'#(\"'#&'#.` &%$4\x8E\"\"5!7\x8F0)*4\x8E\"\"5!7\x8F&/C#%<20\"\"6071=/##&'!&&#/($8\":\x8A\"!!)(\"'#&'#"),
          peg$decode("%;6/V#%<%;E/2#20\"\"6071/#$+\")(\"'#&'#=/##&'!&&#/($8\":\x91\"!!)(\"'#&'#.] &%;6/S#;E/J$2.\"\"6.7//;$;E/2$;B/)$8%:\x92%\"$ )(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%2?\"\"6?7@/R#;E/I$;D/@$;E/7$2C\"\"6C7D/($8%:\x93%!\")(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;F/\x81#;E/x$23\"\"6374/i$;E/`$;6/W$%<%;E/2#2C\"\"6C7D/#$+\")(\"'#&'#=/##&'!&&#/)$8&:\x94&\"%!)(&'#(%'#($'#(#'#(\"'#&'#.\x91 &%;E/\x87#;F/~$;E/u$23\"\"6374/f$;E/]$;6/T$;E/K$2.\"\"6.7//<$;E/3$;D/*$8*:\x95*#($ )(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("<$4F\"\"5!7G0)*4F\"\"5!7G&=.\" 7\x96"),
          peg$decode("%%4\x97\"\"5!7\x98/?#$4\x99\"\"5!7\x9A0)*4\x99\"\"5!7\x9A&/#$+\")(\"'#&'#/' 8!:\x9B!! )"),
          peg$decode("%$4\x9C\"\"5!7\x9D/,#0)*4\x9C\"\"5!7\x9D&&&#/' 8!:\x9E!! )"),
          peg$decode("4\x9F\"\"5!7\xA0"),
          peg$decode("4\xA1\"\"5!7\xA2"),
          peg$decode("%2\xA3\"\"6\xA37\xA4/S#$4\xA5\"\"5!7\xA60)*4\xA5\"\"5!7\xA6&/7$2\xA3\"\"6\xA37\xA4/($8#:\xA7#!!)(#'#(\"'#&'#.c &%2\xA8\"\"6\xA87\xA9/S#$4\xAA\"\"5!7\xAB0)*4\xAA\"\"5!7\xAB&/7$2\xA8\"\"6\xA87\xA9/($8#:\xA7#!!)(#'#(\"'#&'#")
        ],

        peg$currPos          = 0,
        peg$savedPos         = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1 }],
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$resultsCache = {},

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleIndices)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleIndex = peg$startRuleIndices[options.startRule];
    }

    function text() {
      return input.substring(peg$savedPos, peg$currPos);
    }

    function location() {
      return peg$computeLocation(peg$savedPos, peg$currPos);
    }

    function expected(description, location) {
      location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

      throw peg$buildStructuredError(
        [peg$otherExpectation(description)],
        input.substring(peg$savedPos, peg$currPos),
        location
      );
    }

    function error(message, location) {
      location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

      throw peg$buildSimpleError(message, location);
    }

    function peg$literalExpectation(text, ignoreCase) {
      return { type: "literal", text: text, ignoreCase: ignoreCase };
    }

    function peg$classExpectation(parts, inverted, ignoreCase) {
      return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
    }

    function peg$anyExpectation() {
      return { type: "any" };
    }

    function peg$endExpectation() {
      return { type: "end" };
    }

    function peg$otherExpectation(description) {
      return { type: "other", description: description };
    }

    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos], p;

      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }

        details = peg$posDetailsCache[p];
        details = {
          line:   details.line,
          column: details.column
        };

        while (p < pos) {
          if (input.charCodeAt(p) === 10) {
            details.line++;
            details.column = 1;
          } else {
            details.column++;
          }

          p++;
        }

        peg$posDetailsCache[pos] = details;
        return details;
      }
    }

    function peg$computeLocation(startPos, endPos) {
      var startPosDetails = peg$computePosDetails(startPos),
          endPosDetails   = peg$computePosDetails(endPos);

      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildSimpleError(message, location) {
      return new peg$SyntaxError(message, null, null, location);
    }

    function peg$buildStructuredError(expected, found, location) {
      return new peg$SyntaxError(
        peg$SyntaxError.buildMessage(expected, found),
        expected,
        found,
        location
      );
    }

    function peg$decode(s) {
      var bc = new Array(s.length), i;

      for (i = 0; i < s.length; i++) {
        bc[i] = s.charCodeAt(i) - 32;
      }

      return bc;
    }

    function peg$parseRule(index) {
      var bc    = peg$bytecode[index],
          ip    = 0,
          ips   = [],
          end   = bc.length,
          ends  = [],
          stack = [],
          params, i;

      var key    = peg$currPos * 43 + index,
          cached = peg$resultsCache[key];

      if (cached) {
        peg$currPos = cached.nextPos;

        return cached.result;
      }

      while (true) {
        while (ip < end) {
          switch (bc[ip]) {
            case 0:
              stack.push(peg$consts[bc[ip + 1]]);
              ip += 2;
              break;

            case 1:
              stack.push(void 0);
              ip++;
              break;

            case 2:
              stack.push(null);
              ip++;
              break;

            case 3:
              stack.push(peg$FAILED);
              ip++;
              break;

            case 4:
              stack.push([]);
              ip++;
              break;

            case 5:
              stack.push(peg$currPos);
              ip++;
              break;

            case 6:
              stack.pop();
              ip++;
              break;

            case 7:
              peg$currPos = stack.pop();
              ip++;
              break;

            case 8:
              stack.length -= bc[ip + 1];
              ip += 2;
              break;

            case 9:
              stack.splice(-2, 1);
              ip++;
              break;

            case 10:
              stack[stack.length - 2].push(stack.pop());
              ip++;
              break;

            case 11:
              stack.push(stack.splice(stack.length - bc[ip + 1], bc[ip + 1]));
              ip += 2;
              break;

            case 12:
              stack.push(input.substring(stack.pop(), peg$currPos));
              ip++;
              break;

            case 13:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1]) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 14:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1] === peg$FAILED) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 15:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1] !== peg$FAILED) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 16:
              if (stack[stack.length - 1] !== peg$FAILED) {
                ends.push(end);
                ips.push(ip);

                end = ip + 2 + bc[ip + 1];
                ip += 2;
              } else {
                ip += 2 + bc[ip + 1];
              }

              break;

            case 17:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (input.length > peg$currPos) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 18:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (input.substr(peg$currPos, peg$consts[bc[ip + 1]].length) === peg$consts[bc[ip + 1]]) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 19:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (input.substr(peg$currPos, peg$consts[bc[ip + 1]].length).toLowerCase() === peg$consts[bc[ip + 1]]) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 20:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (peg$consts[bc[ip + 1]].test(input.charAt(peg$currPos))) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 21:
              stack.push(input.substr(peg$currPos, bc[ip + 1]));
              peg$currPos += bc[ip + 1];
              ip += 2;
              break;

            case 22:
              stack.push(peg$consts[bc[ip + 1]]);
              peg$currPos += peg$consts[bc[ip + 1]].length;
              ip += 2;
              break;

            case 23:
              stack.push(peg$FAILED);
              if (peg$silentFails === 0) {
                peg$fail(peg$consts[bc[ip + 1]]);
              }
              ip += 2;
              break;

            case 24:
              peg$savedPos = stack[stack.length - 1 - bc[ip + 1]];
              ip += 2;
              break;

            case 25:
              peg$savedPos = peg$currPos;
              ip++;
              break;

            case 26:
              params = bc.slice(ip + 4, ip + 4 + bc[ip + 3]);
              for (i = 0; i < bc[ip + 3]; i++) {
                params[i] = stack[stack.length - 1 - params[i]];
              }

              stack.splice(
                stack.length - bc[ip + 2],
                bc[ip + 2],
                peg$consts[bc[ip + 1]].apply(null, params)
              );

              ip += 4 + bc[ip + 3];
              break;

            case 27:
              stack.push(peg$parseRule(bc[ip + 1]));
              ip += 2;
              break;

            case 28:
              peg$silentFails++;
              ip++;
              break;

            case 29:
              peg$silentFails--;
              ip++;
              break;

            default:
              throw new Error("Invalid opcode: " + bc[ip] + ".");
          }
        }

        if (ends.length > 0) {
          end = ends.pop();
          ip = ips.pop();
        } else {
          break;
        }
      }

      peg$resultsCache[key] = { nextPos: peg$currPos, result: stack[0] };

      return stack[0];
    }

    peg$result = peg$parseRule(peg$startRuleIndex);

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail(peg$endExpectation());
      }

      throw peg$buildStructuredError(
        peg$maxFailExpected,
        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
        peg$maxFailPos < input.length
          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }

  return {
    SyntaxError: peg$SyntaxError,
    parse:       peg$parse
  };
})();















//------- Q.J.F. API
// module,exporting,record,open,data,codata,func,REC,cases; literal expression


// Without type checking, `module` just return a normal javascript object,
//  returned by `body`.
// `module` will change the context of `body`
function module(decstr, body){
  var mod = allparsers.parse(decstr, {startRule : 'ModuleDecl'});
  checkType(mod.name , Name, 'mod.name', 'module');
  checkArrayType(mod.params, Type, 'mod.params', 'module');
  checkType(body, Function, 'body', 'module');

  if(mod.params.length != body.length)
    throw 'error at module: declared numbers of parameter doesn\'t match to body\'s arity.'

  //Evaluating body:
  // If there's any parameter, returns a function that waits for it,
  // otherwise just returns the evaluating result of the body.
  // This is different from module system of agda.
  if(params.length==0){
    return body.call({});
  }else{
    return body.bind({});
  }
}

//self: the context of the evaluation, expected to be `this`
function evModule(self,decstr, body){
  checkType(self, Object, 'self', 'evModule');
  checkType(decstr, String, 'decstr', 'evModule');
  checkType(body, Function, 'body', 'evModule');


  var mod = allparsers.parse(decstr, {startRule : 'ModuleDecl'});
  checkType(mod.name , Name, 'mod.name', 'evModule');
  checkArrayType(mod.params, Type, 'mod.params', 'evModule');

  if(mod.params.length != body.length)
    throw 'error at evModule: declared numbers of parameter doesn\'t match to body\'s arity.'

  var resmod = mod.params.length==0? body.call({}) : body.bind({});
  var internalName = 'qjf$'+mod.name.text;
  self[internalName] = resmod;
  return 'var '+mod.name.text+' = this.'+internalName+';';
}




// How to make an instance of a record?
// Either with the record constructor, or javascript objects with exact same fields.
// There should be a way holding type informations but at this point it's not needed.
// `record` will make the record constructor if it's declared, and getters, 
//   all wrapping in an object.
function record(decstr){
  var rec = allparsers.parse(decstr, {startRule : 'RecordDecl'});
  checkType(rec, Record, 'rec', 'record');

  var allkeys = [];
  for(var i=0;i<rec.fields.length;i++){
    allkeys.push(rec.fields[i][0].text);
  }


  var cnstr = {};
  if(rec.hasRecConstructor){
    cnstr = { nametext : rec.recConstructor.name.text
            , cnstrfunc: function(){
                checkValue(arguments.length, allkeys.length, 'input length', rec.recConstructor.name.text);
                var res = {};
                for(var i=0;i<allkeys.length;i++){
                  res[allkeys[i]] = arguments[i];
                }
                return res;
              }
            }
    cnstr.cnstrfunc.length = allkeys.length;
  }else{
    cnstr = null;
  }


  var checkAllKeys = function(o){
    for(var i=0;i<allkeys.length;i++){
      if(typeof(o[allkeys[i]])=='undefined'){
        console.log('Warning: you applied getter \''+allkeys[i]+'\' to a non-'+rec.recordname.text+' object.');
      }
    }
  }

  var getters = {};
  for(var i=0;i<allkeys.length;i++){
    getters[allkeys[i]] = (function(k){
      return function(o){
        checkAllKeys(o);
        return o[k];
      }
    })(allkeys[i]);
  }

  return { recordname : rec.recordname
         , cnstr      : cnstr
         , getters    : getters
         }
}




//self, expected given `this`
function evRecord(self, decstr){
  checkType(self, Object, 'self', 'evRecord');
  checkType(decstr, String, 'decstr', 'evRecord');

  var parsedrec = record(decstr);
  var decstr = "";
  if(parsedrec.cnstr!=null){
    self[parsedrec.cnstr.nametext] = parsedrec.cnstr.cnstrfunc;
    decstr += 'var '+parsedrec.cnstr.nametext+' = this.'+parsedrec.cnstr.nametext+';\n';
  }
  for(var k in parsedrec.getters){
    self[k] = parsedrec.getters[k];
    decstr += 'var '+k+' = this.'+k+';\n';
  }
  return decstr;
}




function Open$Hid(s){
  checkType(s,String,'s','Open$Hid');
  s = s.trim();
  if(!nameReg.test(s))
    throw "error in Open$Hid: bad format:s="+s;
  this.hiding = s;
}
function Open$Ren(f,t){
  checkType(f,String,'f','Open$Ren');
  checkType(t,String,'t','Open$Ren');
  f = f.trim();
  t = t.trim();
  if(!(nameReg.test(f) && nameReg.test(t)))
    throw "error in Open$Ren: bad format:f="+f+", t="+t;
  this.from = f;
  this.to = t;
}

//modnad is expected to be the symbol points to mod
function evOpen(mod,modname,str){
  //mod could be javascript object or qjf's module
  checkType(mod, Object, 'obj', 'evOpen');
  checkType(modname, String, 'mod', 'evOpen');
  checkType(str, String, 'str', 'evOpen');

  var src = str.split(',');
  try{
    for(var i=0;i<src.length;i++){
      var temp = src[i].split(' as ');
      if(temp.length>1)
        src[i] = new Open$Ren(temp[0],temp[1]);
      else if(/-/.test(temp[0].trim()))
        src[i] = new Open$Hid(temp[0].split('-')[1])
      else
        src[i] = src[i].trim();
    }
  }catch(e){
    throw 'error in evOpen, possibly because of bad input string:'+e;
  }

  var ifOpenAll = true;
    for(var i=0;i<src.length;i++){
      if(src[i].constructor === String)
        ifOpenAll = false;
    }

    var nameTable = {};
    if(ifOpenAll){
      for(var k in mod){
        nameTable[k] = k;
      }
    }
    for(var i=0;i<src.length;i++){
      switch(src[i].constructor){
        case String:
          nameTable[src[i]] = src[i];
          break;
        case Open$Hid:
          nameTable[src[i].hiding] = "";
          break;
        case Open$Ren:
          nameTable[src[i].from] = src[i].to;
          break;
        default:
          throw 'error 1 in evOpen';
      }
    }

    var res = "";
    for(var k in nameTable){
      if(nameTable[k]!=""){
        res += 'var '+nameTable[k]+' = '+modname+'.'+k+';\n'
      }
    }
    return res;
}








//`data` will make its constructors available
//the constructors should contain information that helps pattern matching

function data(decstr){
  var parseddata = allparsers.parse(decstr, {startRule : 'DataDecl'});
}
function evData(decstr){
}







function codata(decstr){
  allparsers.parse(decstr, {startRule : 'CodataDecl'});
}
function evCodata(decstr){
}

var Y = function(le) {
    return function(f) {
        return f(f);
    }(function(f) {
        return le(
            function(x) { return (f(f))(x); }
        );
    });
};

var recHelper = {};

function cases(data,args){
}

function func(type,args){
}




function evExport(args){
  //symbols in args are not limited to qjf's objects
  checkType(args, String, 'args', 'exporting');

  var res = '{';
  args.split(',').forEach(function(x){
    var y = x.trim();
    res += y + ':' + y + ',';
  });
  return res.slice(0,-1)+'}';
}










