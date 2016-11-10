

function checkType(x,type,xname,place){
  if(x.constructor !== type)
    throw "type error: "+place+": "+xname+" should be a "+type.name+", but given: "+x.constructor.name;
}
function checkValue(x,v,xname,place){
  if(x != v)
    throw "value error: "+place+": "+xname+" should be: "+v.toString()+", but given: "+x.toString();
}

function Name(n){
  checkType(n,String,'n','Name');
  this.name = n;
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
  if(  t.constructor === ImplicitType
    || t.constructor === ArrowType
    || t.constructor === SubType
    || t.constructor === SupType
    || t.constructor === Tuple
    || t.constructor === RecordType
    || t.constructor === ListType
    || t.constructor === RealType
    || t.constructor === TypeVar
  ){
    this.type = t;
  }else{
    console.log('type error: new Type: invalid type kind');
  }
} 

//------- declarations


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

//------- Q.J.F. API
// module,record,data,codata,func,REC,case; literal expression, pattern assignment

