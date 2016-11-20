

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

function genVars(n){
  //!n>=0
  var res = [];
  for(var i=0;i<n;i++){
    res.push("_"+i);
  }
  return res;
}

function uniqueArray(arr){
  checkType(arr, Array, 'arr', 'uniqueArray');
  var temp = {};
  for(var i=0;i<arr.length;i++){
    if(typeof(temp[arr[i]])=='undefined')
      temp[arr[i]] = 1;
  }
  var res = [];
  for(var k in temp){
    res.push(k);
  }
  return res;
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
          "(",
          peg$literalExpectation("(", false),
          "@",
          peg$literalExpectation("@", false),
          "*",
          peg$literalExpectation("*", false),
          ")",
          peg$literalExpectation(")", false),
          function(c, ps) {
                  if(ps.length == 0){
                          return c.text=='_' ? new IPattern(insDontCare) : new IPattern(c);
                        }else{
                          return new IPattern(new IntroFormPattern(c, ps));
                        }
                },
          ",",
          peg$literalExpectation(",", false),
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
          function(v) {return new IPattern(v); },
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
                        obsvs.push(new Observer(r.type.keytypes[i][0], r.type.keytypes[i][1]));
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
          peg$decode("%;G/' 8!:%!! ).\u0307 &%;J/' 8!:&!! ).\u02F5 &%2'\"\"6'7(/\xA2#;E/\x99$;F/\x90$%<%;E/J#%<2)\"\"6)7*.) &2+\"\"6+7,=.##&&!&'#/#$+\")(\"'#&'#=/##&'!&&#/J$;$/A$;E/8$2-\"\"6-7./)$8':/'\"$\")(''#(&'#(%'#($'#(#'#(\"'#&'#.\u0260 &%2'\"\"6'7(/t#;E/k$;#/b$;E/Y$20\"\"6071/J$;E/A$;'/8$2-\"\"6-7./)$8(:2(\"%!)(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u01F9 &%2'\"\"6'7(/}#;E/t$;#/k$;E/b$23\"\"6374/S$;E/J$;%/A$;E/8$2-\"\"6-7./)$8):5)\"&\")()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u0189 &%2'\"\"6'7(/R#;E/I$;#/@$;E/7$2-\"\"6-7./($8%:6%!\")(%'#($'#(#'#(\"'#&'#.\u0144 &%27\"\"6778/& 8!:9! ).\u012D &%2:\"\"6:7;/R#;E/I$;'/@$;E/7$2<\"\"6<7=/($8%:>%!\")(%'#($'#(#'#(\"'#&'#.\xE8 &%%;F/D#;E/;$2)\"\"6)7*/,$;E/#$+$)($'#(#'#(\"'#&'#.\" &\"/\x9C#2?\"\"6?7@/\x8D$;E/\x84$%;F/;#;E/2$2A\"\"6A7B/#$+#)(#'#(\"'#&'#.\" &\"/T$;E/K$;)/B$;E/9$2C\"\"6C7D/*$8(:E(#'$\")(('#(''#(&'#(%'#($'#(#'#(\"'#&'#./ &%;F/' 8!:F!! )"),
          peg$decode("%%<%;E/O#%<1\"\"5!7#=.##&&!&'#./ &%<;I=/##&'!&&#/#$+\")(\"'#&'#=/##&'!&&#/& 8!:$! ).T &%$4G\"\"5!7H/,#0)*4G\"\"5!7H&&&#/1#;!/($8\":I\"! )(\"'#&'#"),
          peg$decode("%;#/;#;E/2$;&/)$8#:J#\"\" )(#'#(\"'#&'#"),
          peg$decode("%23\"\"6374/1#;%/($8\":I\"! )(\"'#&'#.@ &%%<2-\"\"6-7.=/##&'!&&#/& 8!:$! )"),
          peg$decode("%;#/;#;E/2$;(/)$8#:\"#\"\" )(#'#(\"'#&'#"),
          peg$decode("%20\"\"6071/:#;E/1$;'/($8#:I#! )(#'#(\"'#&'#.@ &%%<4K\"\"5!7L=/##&'!&&#/& 8!:$! )"),
          peg$decode("%;F/f#;E/]$2M\"\"6M7N/N$;E/E$;#/<$;E/3$;*/*$8':O'#&\" )(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%%<2C\"\"6C7D=/##&'!&&#/& 8!:$! ).J &%20\"\"6071/:#;E/1$;)/($8#:P#! )(#'#(\"'#&'#"),
          peg$decode("%;F/@#;E/7$2+\"\"6+7,/($8#:Q#!\")(#'#(\"'#&'#.\x8D &%;F/\x83#;E/z$2'\"\"6'7(/k$;E/b$2+\"\"6+7,/S$;E/J$;!/A$;E/8$2-\"\"6-7./)$8):R)\"(\")()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;F/\x91#;E/\x88$;./\x7F$;E/v$23\"\"6374/g$;E/^$;6/U$;E/L$2M\"\"6M7N/=$;E/4$;C/+$8+:S+$*($ )(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;F/\xA9#;E/\xA0$;./\x97$;E/\x8E$23\"\"6374/\x7F$;E/v$;6/m$;E/d$2M\"\"6M7N/U$;E/L$;F.\" &\"/>$;E/5$;C/,$8-:T-%,*&\" )(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%%<23\"\"6374=/##&'!&&#/& 8!:$! ).m &%;F/;#;E/2$;./)$8#:U#\"\" )(#'#(\"'#&'#.E &%;9/;#;E/2$;./)$8#:V#\"\" )(#'#(\"'#&'#"),
          peg$decode("%;0/S#;E/J$2M\"\"6M7N/;$;E/2$;2/)$8%:W%\"$ )(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;F/o#;E/f$;./]$;E/T$23\"\"6374/E$;E/<$;6/3$;E/*$8(:X(#'%!)(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%%<%;E/2#23\"\"6374/#$+\")(\"'#&'#=/##&'!&&#/& 8!:$! ).E &%;9/;#;E/2$;1/)$8#:Y#\"\" )(#'#(\"'#&'#"),
          peg$decode("%%<1\"\"5!7#=.##&&!&'#/& 8!:$! )./ &%;3/' 8!:Z!! )"),
          peg$decode("%;F/v#;E/m$23\"\"6374/^$;E/U$;6/L$;E/C$%<1\"\"5!7#=.##&&!&'#/)$8':['\"&\")(''#(&'#(%'#($'#(#'#(\"'#&'#.\x88 &%;F/~#;E/u$23\"\"6374/f$;E/]$;6/T$;E/K$2A\"\"6A7B/<$;E/3$;3/*$8):\\)#($ )()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;F/;#;E/2$;5/)$8#:]#\"\" )(#'#(\"'#&'#"),
          peg$decode("%%<1\"\"5!7#=.##&&!&'#/& 8!:^! ).m &%;F/;#;E/2$;5/)$8#:_#\"\" )(#'#(\"'#&'#.E &%;9/;#;E/2$;5/)$8#:`#\"\" )(#'#(\"'#&'#"),
          peg$decode("%;:/L#;E/C$%<2a\"\"6a7b=.##&&!&'#/($8#:c#!\")(#'#(\"'#&'#.\x9D &%;:/S#;E/J$2a\"\"6a7b/;$;E/2$;7/)$8%:d%\"$ )(%'#($'#(#'#(\"'#&'#.] &%;8/S#;E/J$2a\"\"6a7b/;$;E/2$;7/)$8%:e%\"$ )(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;:/L#;E/C$%<2a\"\"6a7b=.##&&!&'#/($8#:c#!\")(#'#(\"'#&'#.] &%;:/S#;E/J$2a\"\"6a7b/;$;E/2$;7/)$8%:f%\"$ )(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;9/V#%<%;E/2#2a\"\"6a7b/#$+\")(\"'#&'#=/##&'!&&#/($8\":g\"!!)(\"'#&'#.E &%;9/;#;E/2$;8/)$8#:h#\"\" )(#'#(\"'#&'#"),
          peg$decode("%2'\"\"6'7(/t#;E/k$;F/b$;E/Y$23\"\"6374/J$;E/A$;6/8$2-\"\"6-7./)$8(:i(\"%!)(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\x84 &%2?\"\"6?7@/t#;E/k$;F/b$;E/Y$23\"\"6374/J$;E/A$;6/8$2C\"\"6C7D/)$8(:j(\"%!)(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;9/' 8!:k!! ).\u01D6 &%2l\"\"6l7m/:#;E/1$;7/($8#:n#! )(#'#(\"'#&'#.\u01A9 &%2o\"\"6o7p/:#;E/1$;7/($8#:q#! )(#'#(\"'#&'#.\u017C &%2'\"\"6'7(/}#;E/t$;6/k$;E/b$20\"\"6071/S$;E/J$;B/A$;E/8$2-\"\"6-7./)$8):r)\"&\")()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u010C &%2'\"\"6'7(/R#;E/I$;6/@$;E/7$2-\"\"6-7./($8%:s%!\")(%'#($'#(#'#(\"'#&'#.\xC7 &%;C/' 8!:t!! ).\xB5 &%2:\"\"6:7;/R#;E/I$;6/@$;E/7$2<\"\"6<7=/($8%:u%!\")(%'#($'#(#'#(\"'#&'#.p &%;F/T#$4G\"\"5!7H/,#0)*4G\"\"5!7H&&&#/2$;;/)$8#:v#\"\" )(#'#(\"'#&'#./ &%;F/' 8!:w!! )"),
          peg$decode("%;</g#%<%;E/C#%<1\"\"5!7#=.##&&!&'#.# &;I/#$+\")(\"'#&'#=/##&'!&&#/($8\":x\"!!)(\"'#&'#.^ &%;</T#$4G\"\"5!7H/,#0)*4G\"\"5!7H&&&#/2$;;/)$8#:y#\"\" )(#'#(\"'#&'#"),
          peg$decode("%%<;H=/##&'!&&#/T#$4z\"\"5!7{/,#0)*4z\"\"5!7{&&&#/2$;=/)$8#:|#\"! )(#'#(\"'#&'#"),
          peg$decode("%%<1\"\"5!7#=.##&&!&'#.5 &%<4}\"\"5!7~=/##&'!&&#/& 8!:\x7F! ).o &%%%<4\x80\"\"5!7\x81=/##&'!&&#/;#;>/2$4\x82\"\"5!7\x83/#$+#)(#'#(\"'#&'#/1#;</($8\":\x84\"! )(\"'#&'#"),
          peg$decode("%2'\"\"6'7(/1#;?/($8\":\x85\"! )(\"'#&'#.f &%2:\"\"6:7;/1#;@/($8\":\x86\"! )(\"'#&'#.B &%2?\"\"6?7@/2#;A/)$8\":\x87\"\"! )(\"'#&'#"),
          peg$decode("%$4\x88\"\"5!7\x890)*4\x88\"\"5!7\x89&/f#%<4\x80\"\"5!7\x81=/##&'!&&#/K$;>/B$2-\"\"6-7./3$;?/*$8%:\x8A%#$\" )(%'#($'#(#'#(\"'#&'#.` &%$4\x88\"\"5!7\x890)*4\x88\"\"5!7\x89&/C#%<2-\"\"6-7.=/##&'!&&#/($8\":\x8B\"!!)(\"'#&'#"),
          peg$decode("%$4\x8C\"\"5!7\x8D0)*4\x8C\"\"5!7\x8D&/f#%<4\x80\"\"5!7\x81=/##&'!&&#/K$;>/B$2<\"\"6<7=/3$;@/*$8%:\x8E%#$\" )(%'#($'#(#'#(\"'#&'#.` &%$4\x8C\"\"5!7\x8D0)*4\x8C\"\"5!7\x8D&/C#%<2-\"\"6-7.=/##&'!&&#/($8\":\x8B\"!!)(\"'#&'#"),
          peg$decode("%$4\x8F\"\"5!7\x900)*4\x8F\"\"5!7\x90&/g#%<4\x80\"\"5!7\x81=/##&'!&&#/L$;>/C$2C\"\"6C7D/4$;A/+$8%:\x91%$$\"! )(%'#($'#(#'#(\"'#&'#.` &%$4\x8F\"\"5!7\x900)*4\x8F\"\"5!7\x90&/C#%<2-\"\"6-7.=/##&'!&&#/($8\":\x8B\"!!)(\"'#&'#"),
          peg$decode("%;6/V#%<%;E/2#2-\"\"6-7./#$+\")(\"'#&'#=/##&'!&&#/($8\":\x92\"!!)(\"'#&'#.] &%;6/S#;E/J$20\"\"6071/;$;E/2$;B/)$8%:\x93%\"$ )(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%2?\"\"6?7@/R#;E/I$;D/@$;E/7$2C\"\"6C7D/($8%:\x94%!\")(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;F/\x81#;E/x$23\"\"6374/i$;E/`$;6/W$%<%;E/2#2C\"\"6C7D/#$+\")(\"'#&'#=/##&'!&&#/)$8&:\x95&\"%!)(&'#(%'#($'#(#'#(\"'#&'#.\x91 &%;E/\x87#;F/~$;E/u$23\"\"6374/f$;E/]$;6/T$;E/K$20\"\"6071/<$;E/3$;D/*$8*:\x96*#($ )(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("<$4G\"\"5!7H0)*4G\"\"5!7H&=.\" 7\x97"),
          peg$decode("%%4\x98\"\"5!7\x99/?#$4\x9A\"\"5!7\x9B0)*4\x9A\"\"5!7\x9B&/#$+\")(\"'#&'#/' 8!:\x9C!! )"),
          peg$decode("%$4\x9D\"\"5!7\x9E/,#0)*4\x9D\"\"5!7\x9E&&&#/' 8!:\x9F!! )"),
          peg$decode("4\xA0\"\"5!7\xA1"),
          peg$decode("4\xA2\"\"5!7\xA3"),
          peg$decode("%2\xA4\"\"6\xA47\xA5/S#$4\xA6\"\"5!7\xA70)*4\xA6\"\"5!7\xA7&/7$2\xA4\"\"6\xA47\xA5/($8#:\xA8#!!)(#'#(\"'#&'#.c &%2\xA9\"\"6\xA97\xAA/S#$4\xAB\"\"5!7\xAC0)*4\xAB\"\"5!7\xAC&/7$2\xA9\"\"6\xA97\xAA/($8#:\xA8#!!)(#'#(\"'#&'#")
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
  var mod = allparsers.parse(decstr.trim(), {startRule : 'ModuleDecl'});
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
  checkType(self, [Object,Window], 'self', 'evModule');
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
  var rec = allparsers.parse(decstr.trim(), {startRule : 'RecordDecl'});
  checkType(rec, Record, 'rec', 'record');

  var allkeys = [];
  for(var i=0;i<rec.fields.length;i++){
    allkeys.push(rec.fields[i][0].text);
  }


  var cnstr = {};
  if(rec.hasRecConstructor){
    cnstr = { nametext : rec.recConstructor.name.text
            , cnstrfunc: eval("(function("+genVars(allkeys.length).join(',')+"){"
                +"checkValue(arguments.length, allkeys.length, 'input length', rec.recConstructor.name.text);"
                +"var res = {};"
                +"for(var i=0;i<allkeys.length;i++){"
                +"  res[allkeys[i]] = arguments[i];"
                +"}"
                +"return res;"
              +"})")
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
  checkType(self, [Object,Window], 'self', 'evRecord');
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

  if(typeof(str) == 'undefined')
    str = '';
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
  if(src == '')
    ifOpenAll = true;

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
  var parseddata = allparsers.parse(decstr.trim(), {startRule : 'DataDecl'});

  var cnstr_aritys = {} //{cnstrName:arity}
  for(var i=0;i<parseddata.constructors.length;i++){
    cnstr_aritys[parseddata.constructors[i].name.text] = parseddata.constructors[i].arity;
  }

  var cnstrs = {}
  var backcnstrs = {}
  for(var k in cnstr_aritys){
    var vars = genVars(cnstr_aritys[k]);
    var declstr = "";
    for(var i=0;i<vars.length;i++){
      declstr += 'this.'+vars[i]+' = '+vars[i]+';\n';
    }

    backcnstrs['qjf$cnstr$'+k] = eval(
        "(function qjf$cnstr$"+k+"("+vars.join(',')+"){"
      +  declstr
      + "})"
      )

    if(cnstr_aritys[k]==0)
      cnstrs[k] = new backcnstrs['qjf$cnstr$'+k]();
    else{
      cnstrs[k] = eval("(function("+vars.join(',')+"){"
        + "return new backcnstrs[\'qjf$cnstr$"+k+"\']("+vars.join(',')+");})");
    }

  }

  return { typename: parseddata.name.text //String
         , cnstrs : cnstrs                //Object
         , backcnstrs : backcnstrs        //Object
         }
}

//expected self to be `this`
function evData(self,decstr){
  var d = data(decstr);
  var res = "";
  for(var k in d.cnstrs){
    self[k] = d.cnstrs[k];
    res += 'var '+k+' = this.'+k+';\n';
  }
  return res;
}






//brings two objects in: coinductions that make codatas, observer functions
// creates specific codata objects and observers
// function codata(decstr){
//   var parsedcodata = allparsers.parse(decstr.trim(), {startRule : 'CodataDecl'});

  
//   var codatacnstr = 
//     function cocnstrStream(ipats_cbacks){
//       //ipat_cbacks : [[[ipat], cback] ...]
//       checkArrayType(ipat_cbacks, Array, 'ipat_cbacks', 'cocnstrStream');
//       for(var i=0;i<ipat_cbacks.length;i++){
//         checkArrayType(ipat_cbacks[i][0], IPattern, 'ipat_cbacks['+i+'][0]', 'cocnstrStream');
//         checkType(ipat_cbacks[i][1], Function, 'ipat_cbacks['+i+'][1]', 'cocnstrStream');
//       }

//       this.qjf$obsvr$Stream$head = ...
//       this.qjf$obsvr$Stream$tail = ...
//     }

//   return { typename: parsedcodata.name.text
//          , codatacnstr:
//          , obsvrs:
//          }
// }
function evCodata(decstr){
}








//--------builtin data
//Here's the List that list pattern matches, tuples will match to Arrays
var _builtinList = 
  data('List a : _ = Cons : a -> List a -> List a '
                  +'| Nil : List a');
var _builtinCons = _builtinList.cnstrs.Cons;
var _builtinNil = _builtinList.cnstrs.Nil;

function array2list(arr){
  checkType(arr,Array,'arr','array2list');
  var res = _builtinNil;
  for(var i=arr.length-1; i>=0;i--){
    res = _builtinCons(arr[i], res);
  }
  return res;
}
function le(arr){
  checkType(arr,Array,'arr','le');
  return array2list(arr);
}

//--------------------


function makePattern(self,ipat,varnamelist){
  checkType(ipat, IPattern, 'ipat', 'makePattern');
  checkType(varnamelist, Array, 'varnamelist', 'makePattern');
  switch(ipat.ipattern.constructor){
    case DontCare:          
      return [unification._, varnamelist];

    case Name:
      //If failed finding the name in the context as a constructor,
      //  then make it a variable.
      if(  typeof(self[ipat.ipattern.text])!='undefined'
        && typeof(self['qjf\$cnstr\$'+ipat.ipattern.text])!='undefined'){
        //Suppose if the real constructor('s name) exists, 
        //  then the surfacial constructor exists.
        //This is guaranteed by definition in `data`.
        return [self[ipat.ipattern.text], varnamelist];
      }else{
        varnamelist.push(ipat.ipattern.text);
        return [unification.variable(ipat.ipattern.text), varnamelist];
      }

    case IntroFormPattern:
      //first item should be an existed constructor
      //all the expectations are the same as in case Name.
      if(  typeof(self[ipat.ipattern.text])=='undefined'
        || typeof(self['qjf\$cnstr\$'+ipat.ipattern.text])=='undefined'){
        throw "error in makePattern: no such constructor: "+ipat.ipattern.cnstr.text;
      }
      //match each pattern
      var arglist = [];
      for(var i=0;i<ipat.ipattern.patterns.length;i++){
        arglist.push(makePattern(self,ipat.ipattern.patterns[i], varnamelist));
      }
      return [self[ipat.ipattern.cnstr.text].apply(self, arglist), varnamelist];

    case Tuple:
      var x = [];
      for(var i=0;i<ipat.ipattern.items.length;i++){
        x.push(makePattern(self,ipat.ipattern.items[i],varnamelist)[0]);
      }
      return [x, varnamelist];

    case ConsPattern:
      return [_builtinCons( makePattern(self,ipat.ipattern.head, varnamelist)[0]
                         , makePattern(self,ipat.ipattern.tail, varnamelist)[0])
             , varnamelist];

    case NilPattern:
      return [_builtinNil, varnamelist];
    
    case Number:
      return [ipat.ipattern, varnamelist];
    
    case String:
      return [ipat.ipattern, varnamelist];
    
    default:
      throw "error in cases: unknown pattern (was given a "
            +ipat.ipattern.constructor.name+")";
  }
}

//returning false, or arguments to apply to corresponding body
function makeIPatsMatch(self, ipats, d){
  checkType(self, [Object,Window], 'self', 'makeIPatsMatch');
  checkArrayType(ipats, IPattern, 'ipats', 'makeIPatsMatch');
  if(typeof(d)=='undefined')
    throw "error in makeAnIPatMatch: no data to match"

  //start to construct pattern data for unification
  var totalVarnames = []
  var patternToMatch = []; //makePattern(self,ipat,[]);
  for(var i=0;i<ipats.length;i++){
    patternToMatch.push(makePattern(self,ipats[i],totalVarnames)[0]);
  }
  //start unification
  var unifyResult = unification.unify(patternToMatch, d);

  //feeding result to the corresponding callback
  if(unifyResult.constructor === Object){
    //extract variables from unifyResult, according to totalVarnames (namelist)
    var varindex = uniqueArray(totalVarnames);
    for(var i=0;i<varindex.length;i++){
      varindex[i] = unifyResult[varindex[i]];
    }
    return varindex;
  }else{
    return false;
  }
}

// no matter how many patterns in patsrc, it'll be parsed into an array
function Match(self, patsrc, callback){
  checkType(patsrc, String, 'patsrc', 'Match');
  checkType(callback, [String, Function], 'callback', 'Match');
  try{
    var pat = allparsers.parse(patsrc.trim(), {startRule: 'WholePattern'});

    this.pat = pat.wholepattern;
    this.isCopattern = pat.wholepattern.constructor === CPattern;
    this.matchData = function(d){
      if(this.isCopattern){
        console.log('Warning: copattern won\'t match, no result has been produced.');
      }else{
        var matchResult = makeIPatsMatch(self,this.pat,d);
        if(matchResult.constructor === Array){
          //match success
          if(callback.constructor === Function)
            return [true, callback.apply(self, matchResult)];
          else
            return [true, eval('('+callback+')')];
        }else{
          return [false, null]
        }
      }
    }
  }catch(e){
    throw 'Match:'+e;
  }
}

function makeMatches(self,pat_cb_args){
  if(pat_cb_args.length<2 || pat_cb_args.length%2!=0)
    throw "makeMatches: wrong pat_cb_args length which should be in even number and at least 2."
  for(var x = 0;x<pat_cb_args.length/2;x++){
    checkType(pat_cb_args[x*2], String, 'pat_cb_args['+x*2+']', 'makeMatches');
    checkType(pat_cb_args[x*2+1], [String, Function], 'pat_cb_args['+(x*2+1)+']', 'makeMatches');
  }

  var res = [];
  for(var x = 0;x<pat_cb_args.length/2;x++){
    res.push(new Match(self,pat_cb_args[x*2],pat_cb_args[x*2+1]));
  }
  return res;
}

//self is expected given `this`, in which available constructors are held.
function cases(self,d,args){
  if(arguments.length < 4)
    throw "error in cases: not given enough arguments"

  checkType(self,[Object,Window],'self','cases');

  var matches = makeMatches(self,Array.from(arguments).slice(2));
  for(var i = 0; i<matches.length; i++){
    if(matches[i].isCopattern)
      throw "copatterns can only be used in func."

    var mr = matches[i].matchData([d]);
    if(mr[0]){
      return mr[1];
    }

  }
  throw 'cases: no pattern matched'
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
// var recHelperNotInUse = function(){
//   throw "REC: wrong using situation. REC should only be used in `func`."
// }
// var recHelper = recHelperNotInUse;
var REC = {}//function(self){return recHelper.apply(self,arguments)}
//***need to change the context

//-----experiment with REC-----------
// var spmatches = makeMatches(this,['[]','0','(x:xs)',function(x,xs){return 1+REC(xs)}])
// var sp = function(_0){
//   return Y(function(rec){
//     REC = rec;
//     return function(_0){
//       var res = spmatches[0].matchData(Array.from(arguments));
//       if(res[0])
//         return res[1];
//       res = spmatches[1].matchData(Array.from(arguments));
//       if(res[0])
//         return res[1];
//       throw 'no pattern'
//     }
//   })(_0);
// }





//self is expected given `this`, in which available constructors are held.
function func(self,type,args){
  checkType(self, [Object,Window], 'self', 'func');
  checkType(type, String, 'type', 'funcs');
  if(arguments.length < 4)
    throw "error in func: not given enough arguments"

  var ptype = allparsers.parse(type, {startRule : 'Type'});
  var arity = countArity(ptype);

  var matches = makeMatches(self, Array.from(arguments).slice(2));
  //check if all of the matches are copattern
  var existsCP = matches[0].isCopattern;
  for(var i=1;i<matches.length;i++){
    if(existsCP && matches[i].isCopattern)
      throw 'func: copatterns and patterns cannot be mixed.'
    existsCP = matches[i].isCopattern;
  }
  if(existsCP){
    //dealling with copattern
  }else{
    return eval("(function(matches){\n"+

      "return function("+genVars(arity).join(',')+"){\n"+
      "  return Y(function(rec){\n"+
      "    REC = rec;\n"+
          //---
      "    return function("+genVars(arity).join(',')+"){\n"+
      "      for(var i=0;i<matches.length;i++){\n"+
      "        var res = matches[i].matchData(Array.from(arguments));\n"+
      "        if(res[0])\n"+
      "          return res[1];\n"+
      "      }\n"+
      "      throw 'no pattern matched'\n"+
      "    }\n"+
          //----
      "  })("+genVars(arity).join(',')+");\n"+
      "}\n"+



    "})")(matches)
    // return eval("(function(matches){\n"+
    // "  return function("+genVars(arity).join(',')+"){\n"+
    // "    for(var i=0;i<matches.length;i++){\n"+
    // "      var res = matches[i].matchData(Array.from(arguments));\n"+
    // "      if(res[0])\n"+
    // "        return res[1];\n"+
    // "    }\n"+
    // "    throw 'no pattern matched'\n"+
    // "  }\n"+
    // "})")(matches)
  }
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










