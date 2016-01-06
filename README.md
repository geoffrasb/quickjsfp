# quickjsfp, fp in JS with ADT and agda style module system, but without type checking

## language proposal

One plus three notions to realise in javascript:
* module system as in agda
* type introduction with ADT
* type elimination with numbers of ways of pattern matching
* function compositions with native javascript functions

## example

### Module

Modules should be defined in this way:

```
var mod1 = module('modName/1'
 , 'data Pair = Pr/2'
 , 'open moduleX'
 , 'data List = Cons/2 | Nil/0'
 , function (arg1){

   var subMod = module(...)

   var privateFunc = ...

   return 
    exporting(Pair,List,subMod)({
      f1 : ...
      f2 : ...
    })
 })
```
Numbers in `modeName/1`, `Pr/2`, `Cons/2`, or in `Nil/0` stand for arity of the constructor. Oringinally, those places should be type definitions (e.g., Cons : a -> List a -> List a), since we check only arity here, those informations are not important anymore.

Types and modules needed in the module should be declared first, as the arguments of `module`, then the module contents. Only things in the returning object (or called exporting table) are accessible from outside, otherwise are private objects (like `privateFunc` in the example above).

`exporting` is used to shorten the definition of the exporting table, thus `exporting(Pair)({ f1 : t1 })` is same as `{ f1 : t1, Cons : Cons, Nil : Nil }`.

### importing modules

### type introduction

### type elimination

### record type

