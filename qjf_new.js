

function checkType(x,type,xname,place){
  if(x.constructor !== type)
    throw "type error: "+place+": "+xname+" should be a "+type.name+", but given: "+x.constructor.name;
}
function checkValue(x,v,xname,place){
  if(x != v)
    throw "value error: "+place+": "+xname+" should be: "+v.toString()+", but given: "+x.toString();
}

var nameReg = new RegExp('([a-zA-Z_][a-zA-Z0-9_]*)');
function Name(n){
  checkType(n,String,'n','Name');
  if(nameReg.test(n))
    this.name = n;
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

function ImplicitType(n,t){
  checkType(n,Name,'n','ImplicitType');
  //t : Type

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
  //keytypes : [['k1', type], ['k2', type] ...]

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

function TypeVar(varname){
  checkType(varname,String,'varname','TypeVar');
  this.varname = varname;
}

function Type(t){
  switch(t.constructor){
    case ImplicitType:
    case ArrowType:
    case SubType:
    case SupType:
    case Tuple:
    case RecordType:
    case ListType:
    case RealType:
    case TypeVar:
      this.type = t;
    default:
      throw 'type error: new Type: invalid type kind'
  }
} 

function NoType(){}


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
  switch(inp.constructor){
    case DontCare:
    case Name:
    case IntroForm:
    case Tuple:
    case List:
    case IPattern:
    case RecordPattern:
    case ConsPattern:
    case NilPattern:
      this.ipattern = inp;
      break;
    default:
      throw "error at IPattern"
  }
}

function CPattern(observer, patterns){
  if(observer.constructor !== DontCare
    && observer.constructor !== Name)
    throw "cpattern error"
  checkType(patterns,Array,'patterns','CPattern');
  //patterns : [IPattern]

  this.observer = observer;
  this.patterns = patterns;
}

function WholePattern(inp){
  switch(inp.constructor){
    case Array:
    case CPattern:
      this.wholepattern = inp;
      break;
    default:
      throw "error at WholePattern"
  }
}

//------- declarations

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
      case ImplicitType:
        return count;
      case SubType:
      case SupType:
      case Tuple:
      case RecordType:
      case ListType:
      case RealType:
      case TypeVar:
        return count+1;
      default:
        throw 'error in rec of countArity'
    }
  }

  return rec(type,0);
}

//record
function Record(name,type,fields,arity){
  checkType(name,Name,'name','Record');
  if(  type.constructor !== NoType
    && type.constructor !== Type )
    throw "error 1 in Record"

  if(  type.constructor === NoType
    && (typeof arity == 'undefined' || arity.constructor !== Number))
    throw "error 2 in Record"

  //fields : {k1 : [type, val], k2 ...}

  //var countedArity = countArity(type);

  this.recordname = name;
  this.type = type;
  this.arity = type.constructor === NoType ? arity : countArity(type);
  this.fields = fields;
}
//module
// modules are actually records

//data
function Data(name,type,cnstrs,arity){
  checkType(name, Name
}
//codata
function Codata(name,type,observers,arity){
}

//------- Q.J.F. API
// module,record,data,codata,func,REC,case; literal expression, pattern assignment

