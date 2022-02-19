# quickjsfp, fp in JS with ADT and agda style module system, but without type checking

## language proposal

Notions to realise in javascript:
* module system as in agda
* inductive and coinductive datatypes
* induction and coinduction (pattern matching)
* function compositions with native javascript functions

## Declarations

### List of functionalities

* module
* record
* data
* codata
* induction
* coinduction

### all together
```
eval(module('modName x y'
  , function(x,y){
    eval( data('List/1 = Nil/0 | Cons/2')
        + codata('Stream/1 = {head, tail}')
        + record('R/0 = {f1, f2, f3}')
        )
    subMod = module(...)

    _builtinNil(Nil);
    _builtinCons(Cons);

    eval(open(/*module*/, [/*usings*/]))

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
      return case( head(s)
      , '(Just a)' , function(a){return Cons(a, fromStream(tail(s)));}
      , 'Nothing'  , Nil
      )
    }


    return exporting(Nil,Cons,Stream,R,subMod)(
    { g : g1
    , f : f1
    })
  }))
```
    var IH = function(){return gg.f.apply(this,arguments)}
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



