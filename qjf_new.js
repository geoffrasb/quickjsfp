

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
  checkType(n,Number,'n','Tuple');
  checkType(items,Array,'items','Tuple');
  checkValue(items.length,n,'items.length','Tuple');

  this.items = items;
}

//----type

function ImplicitType(n,t){

  this.name = n;
  this.type = t;
}
function ArrowType(t1,t2){
  this.left = t1;
  this.right = t2;
}
function SubType(t){
  this.type = t;
}
function SupType(t){
  this.type = t;
}
function RecordType(obj){
  this.record = obj;
}
function ListType(t){
  this.type = t;
}

function Type(t){
  if(  t.constructor === ImplicitType
    || t.constructor === ArrowType
    || t.constructor === SubType
    || t.constructor === SupType
    || t.constructor === Tuple
    || t.constructor === RecordType
    || t.constructor === ListType
    || t.constructor === Name
  ){
    this.kind = t.constructor;
    this.type = t;
  }else{
    console.log('Error: new Type: invalid type kind');
  }
} 


//------- pattern

function IntroForm(cnstr, patterns){
}

function IPattern(inp){
  switch(inp){
    case DontCare:
    case Name:
    case IntroForm:
    case Tuple:
  }
}

function CPattern

function WholePattern

//------- Q.J.F. API
// module,record,data,codata,func,REC,case; literal expression, pattern assignment

