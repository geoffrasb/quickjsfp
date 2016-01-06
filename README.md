# quickjsfp, fp in JS with ADT and agda style module system, but without type checking

## language proposal

One plus three notions to realise in javascript:
* module system as in agda
* type introduction with ADT
* type elimination
* function composition

## example

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


