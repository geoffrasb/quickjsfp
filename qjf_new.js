

function checkType(x,types,xname,place){
  if(types.constructor !== Array){
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

var nameReg = new RegExp('([a-zA-Z_][a-zA-Z0-9_]*)');
function Name(n){
  checkType(n,String,'n','Name');
  if(nameReg.test(n))
    this.text = n;
  else
    throw 'error: Name: wrong format'
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

function Tuple(n,items){
  checkType(n,Number,'n','Tuple(internal)');
  checkType(items,Array,'items','Tuple');
  checkValue(items.length,n,'items.length','Tuple');

  this.items = items;
}

function List(items){
  checkType(items,Array,'items','List(internal)');
  this.items = items;
}

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

function RealType(introform){
  //introform : [Constructor, arg1, arg2...]
  this.introform = introform;
}

function NameType(name){
  checkType(name,Name,'name','NameType');
  this.name = name;
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
    case RealType:
    case NameType:
    case DontCare:
      this.type = t;
      break;
    default:
      throw 'type error: new Type: invalid type kind'
  }
} 

function NoType(){}


// type parsing


function lastArrowOfChain(t){
  checkType(t, ArrowType, 't', 'lastArrowOfChain');
  checkType(t.righttype, Type, 't.righttype', 'lastArrowOfChain');

  if(t.righttype.type.constructor === ArrowType){
    return lastArrowOfChain(t.righttype.type);
  }else{
    return t;
  }
}



















//------- patterns

function IntroForm(cnstr, patterns){
  checkType(patterns,Array,'patterns','IntroForm');
  //[IPattern]

  this.cnstr = cnstr;
  this.patterns = patterns;
}
function RecordPattern(leadvar, restvar, keyvals){
  checkType(leadvar,String,'leadvar','RecordPattern');
  checkType(restvar,String,'restvar','RecordPattern');
  checkType(keyvals,Array,'keyvals','RecordPattern');
  //[['k1',IPattern], ['k1',IPattern]]

  this.leadvar = leadvar; //"" for case of no leadvar
  this.restvar = restvar; //"" for case of no restvar
  this.keyvals = keyvals;
}
function ConsPattern(x,xs){
  //x : IPattern
  //xs : IPattern

  this.head = x;
  this.tail = xs;
}
function NilPattern(){}

function IPattern(inp){
  checkType(inp, [ DontCare, Name, IntroForm, Tuple
                 , List, IPattern, RecordPattern
                 , ConsPattern, NilPattern]
            , 'inp', 'IPattern');
  this.ipattern = inp;
  // switch(inp.constructor){
  //   case DontCare:
  //   case Name:
  //   case IntroForm:
  //   case Tuple:
  //   case List:
  //   case IPattern:
  //   case RecordPattern:
  //   case ConsPattern:
  //   case NilPattern:
  //     this.ipattern = inp;
  //     break;
  //   default:
  //     throw "error at IPattern"
  // }
}

function CPattern(observer, patterns){
  checkType(observer, [DontCare, Name], 'observer', 'CPattern');
  // if(observer.constructor !== DontCare
  //   && observer.constructor !== Name)
  //   throw "cpattern error"

  //patterns : [IPattern]
  checkType(patterns,Array,'patterns','CPattern');
  for(var i=0;i<patterns.length;i++){
    checkType(patterns[i], IPattern, 'patterns['+i+']', 'CPattern');
  }

  this.observer = observer;
  this.patterns = patterns;
}

function WholePattern(inp){
  checkType(inp, [Array,CPattern], 'inp', 'WholePattern');
  if(inp.constructor === Array){
    checkArrayType(inp, IPattern, 'inp', 'WholePattern');
  }
  this.wholepattern = inp;
  // switch(inp.constructor){
  //   case Array:
  //   case CPattern:
  //     this.wholepattern = inp;
  //     break;
  //   default:
  //     throw "error at WholePattern"
  // }
}

//------- declarations

//record
function FieldVal(type,val){
  checkType(type,Type,'type','Field');

  this.type = type;
  this.val = val;
}
function RecParam(name,type){
  checkType(name, Name, 'name', 'RecParam');
  checkType(type, Type, 'type', 'RecParam');

  this.name = name;
  this.type = type;
}

function Record(name,parameters,type,fields){
  checkType(name,Name,'name','Record');
  checkArrayType(parameters, RecParam, 'parameters', 'Record');
  // checkType(parameters, Array, 'parameters','Record');
  // for(var i=0;i<parameters.length;i++){
  //   checkType(parameters[i], RecParam, 'parameters['+i+']', 'Record');
  // }
  checkType(type, [NoType, Type], 'type', 'Record');
  // if(  type.constructor !== NoType
  //   && type.constructor !== Type )
  //   throw "error 1 in Record"

  //fields : {k1 : FieldVal, k2 ...}
  checkType(fields, Object, 'fields', 'Record');
  for(var k in fields){
    checkType(fields[k], FieldVal, 'fields['+k+']', 'Record');
  }

  this.recordname = name;
  this.parameters = parameters;
  this.type = type;
  this.arity = parameters.length;
  this.fields = fields;
}
//module
function Module(name, parameters, fields){
  checkType(name, Name, 'name', 'Module');
  checkArrayType(parameters, RecParam, 'parameters', 'Module');
  
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
      case Tuple:
      case RecordType:
      case ListType:
      case RealType:
      case NameType:
        return count+1;
      default:
        throw 'error in rec of countArity'
    }
  }

  return rec(type,0);
}

//data
function Constructor(name, type){
  checkType(name, Name, 'name', 'Constructor');
  checkType(type, Type, 'type', 'Constructor');
  this.name = name;
  this.type = type;
  this.arity = countArity(type);
}
function Data(name,type,cnstrs){
  checkType(name, Name, 'name', 'Data');
  checkType(type, Type, 'type', 'Data');
  checkArrayType(cnstrs, Constructor, 'cnstrs', 'Data');

  this.name = name;
  this.type = type;
  this.constructors = cnstrs;
  this.arity = countArity(type);
}


//codata
function Observer(name,type){
  checkType(name, Name, 'name', 'Observer');
  checkType(type.type, [RealType, NoType], 'type', 'Observer');

  this.name = name;
  this.type = type;
}
function Codata(name,type,observers){
  checkType(name, Name, 'name', 'Codata');
  checkType(type, Type, 'type', 'Codata');
  checkArrayType(observers, Observer, 'observers', 'Codata');

  this.name = name;
  this.type = type;
  this.observers = observers;
  this.arity = countArity(type);
}

//------- Q.J.F. API
// module,exporting,record,open,data,codata,func,REC,case; literal expression

function module(decstr, body){
  //body needs to be binded

}



function evExport(args){
  checkType(args, String, 'args', 'exporting');

  var res = '{';
  args.split(',').forEach(function(x){
    var y = x.trim();
    res += y + ':' + y + ',';
  });
  return res.slice(0,-1)+'}';
}










