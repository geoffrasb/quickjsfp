

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
                 , ConsPattern, NilPattern]
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

function Constructor(name, type){
  checkType(name, Name, 'name', 'Constructor');
  checkType(type, Type, 'type', 'Constructor');
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
      fildtypes.push(fields[i][1]);
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
    this.recConstrcutor = new Constructor(cnstr, listType2Arrow(fieldtypes));
  }else{
    this.recConstrcutor = null;
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
  checkArrayType(cnstrs, Constructor, 'cnstrs', 'Data');

  this.name = name;
  this.params = params;
  this.type = type;
  this.constructors = cnstrs;
  this.arity = countArity(type)+params.length;
}


//codata
function Observer(name,type){
  checkType(name, Name, 'name', 'Observer');
  checkType(type, [Type, NoType], 'type', 'Observer');

  this.name = name;
  this.type = type;
}
function Codata(name,params,type,observers){
  checkType(name, Name, 'name', 'Codata');
  checkArrayType(params, ParamType, 'params', 'Codata');
  checkType(type, Type, 'type', 'Codata');
  checkArrayType(observers, Observer, 'observers', 'Codata');

  this.name = name;
  this.params = params;
  this.type = type;
  this.observers = observers;
  this.arity = countArity(type) + params.length;
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










