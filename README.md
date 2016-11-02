# quickjsfp, fp in JS with ADT and agda style module system, but without type checking

## language proposal

One plus three notions to realise in javascript:
* module system as in agda
* type introduction with ADT
* type elimination with numbers of ways of pattern matching
* function compositions with native javascript functions

## Declarations

### all together
```
var mod1 = module('modName x y'
  , function(x,y){
    data('List/1 = Nil/0 | Cons/2')
    codata('Stream/1 = {head, tail}')
    record('R/0 = {f1, f2, f3}')
    subMod = module(...)

    _builtinNil(Nil);
    _builtinCons(Cons);

    open(/*module*/, [/*usings*/], [/*renamings*/])

    var g1 = function(args){ ... }
    var f1 = //f1 : Int -> [Int] -> Int
      func(2 
      , 'n []'     , function(n){
                      return n;}
      , 'n (x:xs)' , function(n,x,xs){
                      return REC(n+x,xs)}
      )

    var id = function(x){return x;}
    
    var toStream = //[a] -> Stream (Maybe a)
      func(1
      , '_ (* [])'        , Nothing
      , 'head (* (x:xs))' , function(x){return Just(x);}
      , 'tail (* (x:xs))' , _.compose(REC,id)
      )

    //fromStream : Stream (Maybe a) -> [a]
    function fromStream(s){
      return case( s
      , '(Just a)' , function(a){return Cons(a, fromStream(tail(s)));}
      , 'Nothing'  , Nil
    }


    return exporting(Nil,Cons,Stream,R,subMod)(
    { g : g1
    , f : f1
    })
  })
```
    indNat(function(){return 0;}
       ,function(n){return IH(n);})
    var indNat = function(f0,fn){
      return function(m){
      
        return Y(function(rec){
          gg.f = rec;
          return function(n){
            return (n==0)? f0() : fn(n-1);
          }
        })(m);

      }

    }


### Function

## example

### Module

Modules should be defined in this way:

```
var mod1 = module('modName/1'
 , 'data Pair = Pr/2'
 , 'open moduleX'
 , 'data List = Cons/2 | Nil/0'
 , 'record R = f1 f2 f3'
 , function (arg1){
   data('Pair/0 = Pr/2');
   open('moduleX 

   var subMod = module(...)

   var privateFunc = ...

   return 
    exporting(this.Pair,this.List,this.subMod)({
      f1 : ...
      f2 : ...
    })
 })
```
Numbers in `modeName/1`, `Pr/2`, `Cons/2`, or in `Nil/0` stand for arities of the constructors. 
It will check only arity when doing pattern matching or function application, so precise type information is discarded.

Types and modules needed in the module should be declared first, as the arguments of `module`, then the module contents. Only things in the returning object (or called exporting table) are accessible from outside, otherwise are private objects (like `privateFunc` in the example above).

`exporting` is used to shorten the definition of the exporting table, thus `exporting(Pair)({ f1 : t1 })` is same as `{ f1 : t1, Cons : Cons, Nil : Nil }`.

### importing modules

### type introduction

  data
  module
  record
  function

  codata

  typeclass?

### type elimination


