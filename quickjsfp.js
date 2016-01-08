// to implement: module,exporting, lam, cases, lamcases
// function constructed by lam can either be curried or noncurried

function genVars(n){
  //!n>=0
  var res = [];
  for(var i=0;i<n;i++){
    res.push("_"+i);
  }
  return res;
}

function alterCtx(ctxs,f){
  //!ctxs is a list of objects
  //!check overlaped existence of keys

  var fstr = "(function(){\n";
  for(var i=0;i<ctxs.length;i++){
    for(var k in ctxs[i]){
      fstr += "var "+k+"=ctxs[\'"+i+"\'][\'"+k+"\'];\n";
    }
  }
  fstr += "return ("+f.toString()+");})()"
  return eval(fstr);
}


function curryfree(f){
  if(f._length == null){
    f['_length'] = f.length; }

  var F = function(){
    var thisF = arguments.callee;
    var restArity = thisF._length - arguments.length;
    if(restArity <=0){
      return f.apply(this,arguments);
    }else{
      var curArgs = [];
      for(var i in arguments){ curArgs.push(arguments[i]); }

      var nextF = function(){
        for(var i in arguments){ curArgs.push(arguments[i]); }
        return f.apply(this, curArgs);
      }
      nextF['_length'] = restArity;
      return curryFree(nextF);
    }
  }
  F['_length'] = f._length;
  return F;
}
// ---------------------------------------------------------------------------------------------

function exporting(/*args*/){
  // args are type names, module names, record names
  var expargs = arguments;
  return function(expobj){
    for(var i in expargs){
      if(expargs[i]['_exported']!=null){ //expargs[i] is a module
        // adding exported fields of the module to the incoming expobj
        expargs[i]._exported.forEach(function(exportedThing){
          expobj[exportedThing] = expargs[i][exportedThing];
        });

      }else if(expargs[i].intermediateDatatype == 'data'){
        // adding constructors of the data to the incoming expobj
        for(var x in expargs[i].constructors){
          expobj[expargs[i].constructors[x][0]] = expargs[i].constructors[x][1];
        }

      }else if(expargs[i].intermediateDatatype == 'record'){
        // adding getters of the record to the incoming expobj
        expargs[i].getters.forEach(function(getterName){
          expobj[getterName] = function(r){ return r[getterName]; }
        });

      }else{
        console.log('error at exporting');
      }
    }
    return expobj;
    }
  }
}

// intermediate data
// data -> {intermediateDatatype:"data", constructors:[["Cons",Cons], ["Nil",Nil]]}
// module -> {_exported:["xxx","yyy"], xxx :..., yyy:...}
// record -> {intermediateDatatype:"record", getters:["f1","f2"]}

// how constructors work?
// making objects:{
//   fromConstructor: Cons
//   args: [x,xs]
//   }

// how pattern matching works
// @ pattern
// match("(x:xs)",data,function(){ ...x,....xs...})
// record patterns
// "R{a,b,c}"
// "{a=x,b=y}"


// how modules work?
// basically, objects.

// how records work?
// records are objects
// record name "R" can help make an object, but it's not necessary
// but "R" itself contains accessor for the record




function parseDecl(str){
  // data T = c1/n1 | c2/n2
}




// decl intermediate data
var declList = { decltype : "data"
  , typename : "List"
  , constructors : [["nil",0], ["cons",2]]
}
var declM = { decltype : "open"
, quantifier : "M" //"" for no quantifier
, contents : {f1:5, f2:10, f3:15}
, hides : ["f1"]
, renaming : [['f3','g3']]
}
var declR{ decltype : "record"
, recordname : "R"
, fields : ["f1","f2"]
}
function declToCtx(decl){
  switch(decl.decltype){
    case "data":
      var res = {}
      // how constructors work?
      // making objects:{
      //   fromConstructor: Cons
      //   args: [x,xs]
      //   }
      // intermediate data
      // data -> {intermediateDatatype:"data", constructors:[["Cons",Cons], ["Nil",Nil]]}
      res[decl.typename] = {intermediateDatatype:"data",constructors:[]};

      for(var i in decl.constructors){
        var cnstrArity = decl.constructors[i][1];
        var cnstrName = decl.constructors[i][0];
        res[cnstrName] = curryfree(eval("(function("+genVars(cnstrArity).toString()+"){\n" +
          "return { fromConstructor:"+cnstrName+"\n" +
          ", args: arguments } })"));
        res[decl.typename].constructors.push([cnstrName,res[cnstrName]]);
      }
      
      return res;
      break;




    case "open":
      break;




    case "record":
      break;
    default: console.log("error at declToCtx");
  }
}

function module(modname){
  //length of arguments should be at least one(modname),
  // then followed by numbers of data,module declaration,
  // then last the module body

  //!arguments checking

  var decls = arguments.slice(1,arguments.length);
  var modulebody = arguments[arguments.length-1];

  var contexts = decls.map(function(x){ return declToCtx(parseDecl(x));}); 
  //a context :: a table of symbol to be used in the module body

 return curryfree(alterCtx(contexts, modulebody));


}

//record/module system
/*

mod1 = module( 'mod1/2'
,' data T1 = C1/0 | C2/0'
,' open modx (as M) using () | hiding () | renaming ()'
,' data T2 = C3/1 | C4/2'
, function (arg1,opr1){

  privateFunc = ...

  return 
    exporting(T1,T2)({
    t1 : term1
    t2 : term2
  })
})


*/


//core types: data(constructed by),function(arity)
//simple check: function arity check
// pattern matching handling
// introducing types
/*
function def
in string:
lam(`\\ x y . t `) , can do single case pattern matching
same as
function(x,y){return t;}
note that
`\\ x y . t` =! `\\ x . \\ y . t`

lamCases([ 'Case1 . t1'
       , 'Case2 . t2'
       ])
cases( x , y,
   ['(Pr a b) (Cns h t) . t1'
   ,'(Pr a b) _ . t2'
   ])

*/



// composition
/* f : a -> b
   g : b -> c
   h : a -> b -> c
   x : a

   f(x)
   h(f(x))
   g(f(x))
*/


/* example
D('List = Cons 2 | Nil 0')
length = lamInd( 'Cons x xs . 1 + length(xs)'
               , 'Nil . 0'
               )
*/
