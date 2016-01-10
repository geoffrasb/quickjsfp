// to implement: module,exporting, lam, cases, lamcases
// function constructed by lam can either be curried or noncurried

var quickjsfp = (function(){

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





function parseDecl(str){
  str = str.trim();
  
  if(/data/.test(str)){
    // "data T = c1/1 | c2/2"
    // var declList = { decltype : "data"
    //   , typename : "List"
    //   , constructors : [["nil",0], ["cons",2]]
    // }
    
    var temp = str.split(/=/);
    var typename = temp[0].slice(temp[0].search(/\s+([a-zA-Z_][a-zA-Z0-9_]*)/),temp[0].length).trim();
    var raw_cnstrs = temp[1].trim().split(/\|/).map(function(x){return x.trim();});

    return { decltype : "data"
           , typename : typename
           , constructors : raw_cnstrs.map(function(x){ var p = x.split(/\//); return [p[0],parseInt(p[1])]})
           };



  }else if(/open/.test(str)){
    // open mod as X hiding (f1) using (f2;f3) renaming (f3 to g3)
    // var declM = { decltype : "open"
    // , quantifier : "M" //"" for no quantifier
    // , contents : {f1:5, f2:10, f3:15}
    // , use : ["f2","f3"]
    // , hides : ["f1"]
    // , renaming : [['f3','g3']]
    // }
    var modname = str.match(/open\s+([a-zA-Z_][a-zA-Z0-9_]*)/)[0].slice(4).trim(); 
    var mod = eval(modname);
    var asname = (asname = str.match(/as\s+([a-zA-Z_][a-zA-Z0-9_]*)/))? asname[0].slice(2).trim() : "";
    var hidingRaw = (hidingRaw = str.match(/hiding\s+\([^\)]*\)/))? hidingRaw[0].slice(hidingRaw[0].search(/\(/)+1,-1) : null;
    var usingRaw = (usingRaw = str.match(/using\s+\([^\)]*\)/))? usingRaw[0].slice(usingRaw[0].search(/\(/)+1,-1) : null;
    var renRaw = (renRaw = str.match(/renaming\s+\([^\)]*\)/))? renRaw[0].slice(renRaw[0].search(/\(/)+1,-1) : null;

    return { decltype : "open"
           , quantifier : asname
           , hides : hidingRaw? hidingRaw.split(";").map(function(x){return x.trim()}) : []
           , renaming : renRaw? renRaw.split(";").map(function(ren){return ren.split("to").map(function(x){return x.trim()})}) : []
           , contents : mod
           , use : usingRaw? usingRaw.split(";").map(function(x){return x.trim()}) : mod._exported
           }

  
  }else if(/record/.test(str)){
    // record R = f1 f2 f3
    // var declR = { decltype : "record"
    // , recordname : "R"
    // , fields : ["f1","f2"]
    // }
    var temp = str.split('=');
    return { decltype : "record"
           , recordname : temp[0].slice(6).match(/\s+([a-zA-Z_][a-zA-Z0-9_]*)/)[0].trim()
           ,fields : temp[1].trim().split(/\s+/)
           }
  }else{
    console.log("error at parseDecl");
  }
}





function declToCtx(decl){
  switch(decl.decltype){
    case "data":
      var res = {}
      res[decl.typename] = {intermediateDatatype:"data",constructors:[]};

      for(var i in decl.constructors){
        var cnstrArity = decl.constructors[i][1];
        var cnstrName = decl.constructors[i][0];
        res[cnstrName] = curryfree(eval("(function("+genVars(cnstrArity).toString()+"){\n" +
          "return { fromConstructor:\'"+cnstrName+"\'\n" +
          ", args: arguments } })"));
        res[decl.typename].constructors.push([cnstrName,res[cnstrName]]);
      }
      
      return res;
      break;


    case "open":
      var res = {};
      var opening = res;
      if(decl.quantifier != ""){
        res[decl.quantifier] = {};
        opening = res[decl.quantifier];
      }
      var in_hides_list = false;
      var nameAltered = false;
      var newName = "";
      for(var u in decl.use){
        var k = decl.use[u];
        in_hides_list = decl.hides.reduce(function(b,x){ return(x==k)||b;},false);
        if(!in_hides_list){
          //setting nameAltered and newName
          for(var i in decl.renaming){
            if(decl.renaming[i][0] == k){
              nameAltered = true;
              newName = decl.renaming[i][1];
              break;
            }
          }
          if(decl.contents[k] == null){
            console.log("Warning: using nonexist thing \'"+k+"\' of the module");
          }else{
            opening[nameAltered? newName : k] = decl.contents[k];
          }
          nameAltered = false;
        }
      }
      return res;
      break;



    case "record":
      var res = {};
      var vars = genVars(decl.fields.length);
      var cnstrRaw = "(function("+vars.join()+"){\nreturn { "
      
      for(var i in decl.fields){
        res[decl.fields[i]] = eval("(function(x){ return x[\'"+decl.fields[i]+"\']; })");
        cnstrRaw += (i==0?"":", ") + decl.fields[i]+" : "+vars[i]+"\n";
      }
      res[decl.recordname] = eval(cnstrRaw+"}})");
      res[decl.recordname]["intermediateDatatype"] = "record";
      res[decl.recordname]["getters"] = decl.fields;

      return res;
      break;
    default: console.log("error at declToCtx");
  }
}

//---------------------------------------------------------------------------------------------------

// bulit-in functions
// need builtin pragma

// how pattern matching works
// @ pattern
// match("(x:xs)",data,function(){ ...x,....xs...})
// record patterns
// "R{a,b,c}"
// "{a=x,b=y}"

var _builtin_list = {};
function set_builtin_list(x){ _builtin_list = x; }
var _builtin_pr2 = {};
function set_builtin_pr2(x) _builtin_pr2 = x; }
var _builtin_pr3 = {};
function set_builtin_pr3(x) _builtin_pr3 = x; }
var _builtin_pr4 = {};
function set_builtin_pr4(x) _builtin_pr4 = x; }
var _builtin_pr5 = {};
function set_builtin_pr5(x) _builtin_pr5 = x; }
var _builtin_pr6 = {};
function set_builtin_pr6(x) _builtin_pr6 = x; }
var _builtin_pr7 = {};
function set_builtin_pr7(x) _builtin_pr7 = x; }

function matchPattern(pat, data){
  // cases of paterns
  // "v"
  // "C pat1 pat2"
  // "(pat)"
  // "v1@(pat)"
  // special patterns for pairs and list
  // "(... , ... , ...)"
  // "[]"
  // "x : xs"
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


return { //exporting to quickjsfp
  module : module
, set_builtin_list : set_builtin_list
, set_builtin_pr2 : set_builtin_pr2
, set_builtin_pr3 : set_builtin_pr3
, set_builtin_pr4 : set_builtin_pr4
, set_builtin_pr5 : set_builtin_pr5
, set_builtin_pr6 : set_builtin_pr6
, set_builtin_pr7 : set_builtin_pr7
}
})(); // end of quickjsfp closure

// built-in modules




// functions to implement:
// cases
// lam
// lamcases
// ll
// lp
// comp


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


