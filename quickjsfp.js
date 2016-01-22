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

function mergeTables(tables){ // if exists repeated variables, take the value of the last one
  var res = {};
  for(var i in tables){
    for(var k in tables[i]){
      res[k] = tables[i][k];
    }
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
  if(f.length == 0){
    return f;
  }

  var F = eval("(function(" + genVars(f.length) + "){"              +
    "var thisF = arguments.callee;"                                 +
    "var restArity = thisF.length - arguments.length;"              +
    "if(restArity <=0){"                                            +
      "return f.apply(this,arguments);"                             +
    "}else{"                                                        +
      "var curArgs = [];"                                           +
      "for(var i in arguments){ curArgs.push(arguments[i]); }"      +

      "var nextF = eval(\"(function(\"+ genVars(restArity)+\"){\"+" +
      " \"for(var i in arguments){ curArgs.push(arguments[i]);}\"+" +
      "  \"return f.apply(this, curArgs);\"                      +" +
      "\"})\");"                                                    +
      "return curryfree(nextF);"                                    +
    "}"                                                             +
  "})")

  return F;
}

function alterCtx2(ctx, f){ // no eval
  return function(){return f.apply(ctx,arguments); }
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
        var f;
        if(cnstrArity==0){ // consturctor with arity=0, cnstr()==cnstr
          f = {fromConstructor:null, args:[]};
        }else{
          f = eval("curryfree(function("+genVars(cnstrArity).toString()+"){\n" +
                               "return { fromConstructor: f\n" +
                                      ", args: arguments } })");
        }
        res[cnstrName] = f;
        res[cnstrName]["constructorName"] = cnstrName;
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
            console.log("Warning: using nonexisting thing \'"+k+"\' of the module");
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
      res[decl.recordname] = curryfree(eval(cnstrRaw+"}})"));
      res[decl.recordname]["intermediateDatatype"] = "record";
      res[decl.recordname]["getters"] = decl.fields;

      return res;
      break;
    default: console.log("error at declToCtx");
  }
}

//---------------------------------------------------------------------------------------------------

var _ctx = "for(var k in this){ eval('var '+k+'='+this[k]+';'); }";

// bulit-in functions
var _builtins = {
    _builtin_cons : {}
  , _builtin_nil : {}
  , _builtin_pr2 : {}
  , _builtin_pr3 : {}
  , _builtin_pr4 : {}
  , _builtin_pr5 : {}
  , _builtin_pr6 : {}
  , _builtin_pr7 : {}
}
function set_builtin_pr2(x){ _builtins._builtin_pr2 = x; }
function set_builtin_pr3(x){ _builtins._builtin_pr3 = x; }
function set_builtin_pr4(x){ _builtins._builtin_pr4 = x; }
function set_builtin_pr5(x){ _builtins._builtin_pr5 = x; }
function set_builtin_pr6(x){ _builtins._builtin_pr6 = x; }
function set_builtin_pr7(x){ _builtins._builtin_pr7 = x; }

function set_builtin_nil(x){ _builtins._builtin_nil = x; }
function set_builtin_cons(x){ _builtins._builtin_cons = x; }

// testingData 
// var lst0 = {fromConstructor : _builtin_nil, args : [] }
// var lst1 = {fromConstructor : _builtin_cons, args : [1, lst0]}
// var lst2 = {fromConstructor : _builtin_cons, args : [2, lst1]}
// var pr12 = {fromConstructor : _builtin_pr2, args : [1,2]}
// var pr123 = {fromConstructor : _builtin_pr3, args : [1,2,3]}
// var Rf1f2 = curryfree(function(a,b){ return { f1 : a, f2 : b}});
// Rf1f2['intermediateDatatype'] = "record";
// Rf1f2['getters'] = ["f1","f2"];
// var rf1f2 = Rf1f2(1,2);
// var f1f2f3 = {f1 : 'a', f2:'b',f3:'c'};
// var C1 = function(x){ return {fromConstructor:C1, args:[x]}};
// C1['constructorName'] = 'C1';
// var C2 = curryfree(function(x,y){ return {fromConstructor:C2, args:[x,y]}});
// C2['constructorName'] = 'C2';
// var T1 = {intermediateDatatype:"data", constructors: [["C1",C1], ["C2",C2]]}

//[(T1,Rf1f2)]
//(Rf1f2,[T1])


var nameReg = "([a-zA-Z_][a-zA-Z0-9_]*)";
var closedBy = function(l,str,r){ 
  try{
    return str[0]==l && str[str.length-1]==r;
  }catch(e){
    return false;
  }
}
var revPar = function(par){
    if(par == ')') return '(';
    if(par == '}') return '{';
    console.log('error: unexpect input for revPar');
    return null;
  }
var findNextSplit = function(symb,str,start){
  var parRecord = []; // excluding symb in () and {}
  var spreg = new RegExp(symb);
  for(var i = start; i<str.length; i++){
    if(spreg.test(str[i]) && parRecord.length == 0){
      return i;
    }else if(str[i]=='(' || str[i]=='{'){
      parRecord.push(str[i]);
    }else if(str[i]==')' || str[i]=='}'){
      var temp = parRecord.pop();
      if(temp!=revPar(str[i])){
        console.log('error: invalid pattern list: \"'+str+'\".');
        return null;
      }
    }
  }
  return -1; //represent no next
}

var splitPatList = function(pat){ //"pat1 , pat2 ..." at least one
  pat = pat.trim();
  if(pat == "") {
    return []; }
  var allPats = [];
  var lastStart = 0;
  var next = findNextSplit(',',pat,lastStart);
  while(next!=-1 && next!=null){
    allPats.push(pat.slice(lastStart,next).trim());
    lastStart = next+1;
    next = findNextSplit(',',pat,lastStart);
  }
  allPats.push(pat.slice(lastStart));
  return allPats;
}

var parseSpacedPatterns = function(pat){
  pat = pat.trim();
  var res = [];
  var lasti = 0;
  var next = findNextSplit('\\s', pat, lasti);
  while(next != -1){
    res.push(pat.slice(lasti,next).trim());
    lasti = next;
    next = findNextSplit('\\s',pat, next+1);
  }
  res.push(pat.slice(lasti).trim());
  var cleared = [];
  for(var i in res){
    if(res[i]!="") cleared.push(res[i]);
  }
  return cleared;
}

function matchPattern(pat, data){
  pat = pat.trim();
  // pat = v                          -> variable or Constructor with arity=0
  //     | []                         => ok
  //     | (pattern list)             -> haven't tested
  //     | { f1 = pat1 , f2 = pat2 }  -> haven't tested
  //     | R{ pat1 , pat2 }           -> haven't tested
  //     | v@(pat)                    => ok
  //     | v@R{ .. }                  => ok
  //     | v@{ .. }                   => ok
  //     | x : xs                     -> haven't tested
  //     | _                          -> haven't tested
  //     | "str"
  //     | 123
  //     | C f1 f2
  //     | .data                      -> value pattern, checked with (==)


  //return format: [['varname',data]]
  
  if(pat[0] == '.'){ //".data"
    var isdata = eval(pat.slice(1));
    if(isdata == data){
      return [];
    }else{
      return null;
    }
  }else if(/^\[\]$/.test(pat)){  //"[]"
    if(data.fromConstructor == _builtins._builtin_nil){
      return []; }
    else{
      return null;
    }

  }else if(pat[0]=='(' && pat[pat.length-1]==')'){ //"(pats)"
    var pats = splitPatList(pat.slice(1,-1));
    if(pats.length == 0){
      console.log('error: invalid pattern: \"'+pat+'\".');
      return null;
    }else if(pats.length == 1){
      return matchPattern(pat.slice(1,-1) ,data); 
    }else if(pats.length <=7){
      if(data.fromConstructor == eval("_builtins._builtin_pr"+pats.length)){
        var res = [];
        var temp = {};
        for(var i=0;i<pats.length;i++){
          temp = matchPattern(pats[i],data.args[i]);
          if(temp!=null){
            res = res.concat(temp);
          }else{
            return null;
          }
        }
        return res;
      }else{
        return null; }
    }else{
      console.log('error: cannot accept tupple over 7. (at: '+pat+')');
      return null;
    }
    

  }else if((new RegExp("^"+nameReg+"@")).test(pat)){
    var wholeVar = pat.match(new RegExp("^"+nameReg+"@"))[0].slice(0,-1);
    var restPat = pat.split(/@/)[1];
    if((new RegExp("^"+nameReg+"\\{.*\\}$")).test(restPat) //v@R{...}
             || closedBy('{',restPat,'}')                  //v@{...}
             || closedBy('(',restPat,')')){                //v@(pat)
      
      var next = matchPattern(restPat,data);
      return next? [[wholeVar, data]].concat(next) : null;
    }
    console.log("error: illegal pattern format: "+pat);
    return null;

  }else if((new RegExp("^"+nameReg+"$")).test(pat)){ //"v1"
    try{
      var intrptPat = eval(pat);
      if(intrptPat.fromConstructor==null){ // test if it's a constructor with arity=0
        return (data===intrptPat)? [] : null;
      }else{
        return [[pat, data]];
      }
    }catch(e){
      return [[pat, data]];
    }

  }else if((new RegExp("^"+nameReg+"\\{.*\\}$")).test(pat)){ //R{...}
    var recordName = pat.match(new RegExp(nameReg))[0];
    var pats = splitPatList(pat.slice(pat.search('{')+1,-1));
    var allFields = eval(recordName+".getters");
    if(pats.length!=allFields.length){
      console.log('error: number of patterns doesn\'t match the record \"'+recordName+'\", at \"'+pat+'\".');
      return null;
    }
    var res = [];
    var temp = {};
    for(var i=0;i<pats.length;i++){
      temp = matchPattern(pats[i], data[allFields[i]]);
      if(temp!=null){
        res = res.concat(temp);
      }else{
        return null;
      }
    }
    return res;


  }else if(pat[0]=='{' && pat[pat.length-1]=='}'){ //{f1=pat1, f2=pat2}
    var field_pats = splitPatList(pat.slice(1,-1)); 
    var temp=temp2={};
    var res = [];
    for(var i=0;i<field_pats.length;i++){
      temp = field_pats[i].split('=').map(function(x){return x.trim();});
      temp2 = matchPattern(temp[1], data[temp[0]]);
      if(temp2!=null){
        res = res.concat(temp2);
      }else{
        return null;
      }
    }
    return res;
  }else if(pat == "_"){
    return [];
  }else if(findNextSplit(':',pat,0)!=-1){ // pat : pat
    if(data.fromConstructor != _builtins._builtin_cons){
      return null;
    }
    var colonInd = findNextSplit(':',pat,0);
    var head = matchPattern(pat.slice(0,colonInd).trim(), data.args[0]);
    var tail = matchPattern(pat.slice(colonInd+1).trim(), data.args[1]);
    if(head==null || tail==null){
      return null;
    }else{
      return head.concat(tail);
    }

  }else if(closedBy('\'',pat,'\'') || closedBy('\"',pat,'\"') || !isNaN(parseFloat(pat))){
    if(eval(pat) == data){
      return [];
    }else{
      return null;
    }
  }else if((new RegExp("^"+nameReg)).test(pat)){
    var cnstrName = pat.match(new RegExp("^"+nameReg))[0];
    var restPats = parseSpacedPatterns(pat.slice(pat.search(' ')));
    try{
      if(data.fromConstructor == eval(cnstrName) && restPats.length == data.args.length){
        var res = [];
        var temp = {};
        for(var i in restPats){
          temp = matchPattern(restPats[i],data.args[i]);
          if(temp == null) return null;
          res = res.concat(temp);
        }
        return res;
      }else{
        return null;
      }
    }catch(e){ 
      console.log('error: possibly using undefined constructors');
      return null;
    }
  }else{
    console.log('error: \"'+pat+'\" is not an acceptable pattern.');
    return null;
  }
}

function matchPatterns(pats, datas){
  //pats.length == datas.length
  var temp = {};
  var varBindings = [];
  for(var i in pats){
    temp = matchPattern(pats[i], datas[i]);
    if(temp == null) return null;
    varBindings = varBindings.concat(temp);
  }
  return varBindings;
}

//-----------------------------------------------------------------------------------------
function bindsToCtx(binds){
  var res = {};
  for(var i in binds){
    res[binds[i][0]] = binds[i][1];
  }
  return res;
}

function splittingPatFuncString(src){
  // if src has the form "pattern -> body" then return [pattern, body], else []
  var pos = src.search("->");
  if(pos!=-1){
    return [src.slice(0,pos).trim(), src.slice(pos+2).trim()];
  }else{
    return [];
  }
}

function fb(str){ //function body
  // find last (;) the (;) is not in any curly braces {} or parenthesis()
  var start = 0;
  var pos = 0;
  var temp = 0;
  while(temp!=-1){
    temp = findNextSplit(';',str,start);
    start = temp + 1;
    if(temp!=-1) pos = temp;
  }
  // do all the inserting job
  var funcstr = "(function(){eval(\""+_ctx+"\");"; //eval(_ctx)
  funcstr += str.slice(0,pos+1) + "return "+ str.slice(pos+1) +"})";
  return eval(funcstr);
}


function cases(/*args*/){ //(a,b,c)(pat,func, pat,func...
  var datas = [];
  for(var i in arguments){
    datas.push(arguments[i]);
  }

  return function(){
    var argi = 0;
    var temp = {};
    var state = 0; //0=reading pattern, 1=finding callback function
    var temp_bind = null;
    while(argi < arguments.length){
      if(state == 0){ // reading pattern
        temp = splittingPatFuncString(arguments[argi]);
        if(temp.length!=0){ // it's a combined form (pat -> funcBody)
          temp = matchPatterns(parseSpacedPatterns(temp[0]), datas);
          if(temp!=null){ // match success
            return bf(temp[1]).call(mergeTables([this, bindsToCtx(temp)]));
          }else{ // match failed
            argi += 1;
          }
        }else{ // it's just a pattern
          temp = matchPatterns(parseSpacedPatterns(arguments[argi]), datas);
          if(temp!=null){ // match success
            temp_bind = temp;
            argi += 1;
            state = 1;
          }else{ // match failed
            argi += 2;
          }
        }
      }else{ // finding callback function
        return arguments[argi].call(mergeTables([this, bindsToCtx(temp_bind)]));
      }
    }
    console.log('error: no appropriate pattern to match');
    return null;
  }
}

function lam(/*args*/){ //(pat,func,pat,func...
  var temp = splittingPatFuncString(arguments[0]);
  var len = -1;
  if(temp.length!=0){ // it's combined pattern
    len = parseSpacedPatterns(temp[0]).length;
  }else{
    len = parseSpacedPatterns(arguments[0]).length;
  }
  var vars = genVars(len);
  var args = [];
  for(var i in arguments){
    args.push(arguments[i]);
  }
  return curryfree(eval("(function("+vars+"){ return cases("+vars+").apply(this,args); })"))
}

function ll(/*args*/){ // mimicing literal list
  var res = _builtins._builtin_nil;
  for(var i = arguments.length-1; i>=0; i--){
    res = _builtins._builtin_cons(arguments[i], res);
  }
  return res;
}

function lt(/*args*/){ //mimicing literal tuples
  if(arguments.length > 1 && arguments.length <=7){
    return eval("_builtins._builtin_pr"+ arguments.length +".apply(this, arguments);");
  }else{
    console.log('error: function \'lt\' accepts only 2~7 items.');
    return null;
  }
}

function cp(/*args*/){ //composing functions
  var funcs = [];
  for(var i in arguments){
    funcs.unshift(arguments[i]);
  }
  return curryfree(function(x){
    return funcs.reduce(function(b,a){return a(b);}, x);
  });
}

function module(modname){
  //length of arguments should be at least one(modname),
  // then followed by numbers of data,module declaration,
  // then last the module body

  //!arguments checking

  var args = [];
  for(var i in arguments){
    args.push(arguments[i]);
  }

  var decls = args.slice(1,-1);
  var modulebody = args[arguments.length-1];

  var contexts = decls.map(function(x){ return declToCtx(parseDecl(x));}); 
  //a context :: a table of symbol to be used in the module body

  if(modulebody.length==0){
    // {_exported:[f1,f2...], f1:..., f2:...}
    var res = alterCtx(contexts, modulebody)();
    var exp = [];
    for(var k in res){
      exp.push(k);
    }
    res['_exported'] = exp;
    return res;
  }else{
    var runbody = alterCtx(contexts, modulebody);
    var addexp = eval("(function("+genVars(modulebody.length)+"){" +
      "var res = runbody.apply(this,arguments)"                    +
      "var exp = [];"                                              +
      "for(var k in res){"                                         +
      "  exp.push(k);"                                             +
      "}"                                                          +
      "res[\'_exported\'] = exp;"                                  +
      "return res;"                                                +
    "})");
    return curryfree(addexp);
  }

}

function setModule(env){
  return alterCtx([env], module);
}

return { //exporting to quickjsfp
  setModule : setModule
, _ctx : _ctx
, set_builtin_cons : set_builtin_cons
, set_builtin_nil : set_builtin_nil
, set_builtin_pr2 : set_builtin_pr2
, set_builtin_pr3 : set_builtin_pr3
, set_builtin_pr4 : set_builtin_pr4
, set_builtin_pr5 : set_builtin_pr5
, set_builtin_pr6 : set_builtin_pr6
, set_builtin_pr7 : set_builtin_pr7
, curryfree : curryfree
, fb : fb
, cases : cases
, lam : lam
, ll : ll
, lt : lt
, cp : cp
}
})(); // end of quickjsfp closure

var module = quickjsfp.setModule(quickjsfp);
function open2window(obj){
  for(var i in obj){
    window[i] = obj[i];
  }
}

// var ListMod = 
//   module( "List/0"
//   , "data List = Nil/0 | Cons/2"
//   , function(){

//     set_builtin_cons(Cons);
//     set_builtin_nil(Nil);
    
//     return exporting(List)({
//         head : lam('x:xs', function(){ return x; })
//       , tail : lam('x:xs', function(){ return xs; })
//     });
//   });

// open2window(quickjsfp);
// open2window(ListMod);

// var TPr2Mod =
//   module( "TPr2Mod/0"
//   , "data TPr2 = Pr2/2"
//   , function(){
//     return exporting(TPr2)({
//         fst : lam('(x,_)', function(){ return x; })
//       , snd : lam('(_,y)', function(){ return y; })
//     });
//   });
// quickjsfp.set_builtin_pr2(TPr2Mod.Pr2);

// var TPr3Mod =
//   module( "TPr3Mod/0"
//   , "data TPr3 = Pr3/3"
//   , function(){
//     return exporting(TPr3)({
//         fst3 : lam('(x,_,_)', function(){ return x; })
//       , snd3 : lam('(_,y,_)', function(){ return y; })
//       , thd3 : lam('(_,_,z)', function(){ return z; })
//     });
//   });
// quickjsfp.set_builtin_pr3(TPr3Mod.Pr3);




