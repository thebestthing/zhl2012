/*************************************

项目名称：wolfram alpha
更新日期：2023-12-24
脚本作者：@zhlpp
使用声明：⚠️仅供参考，🈲转载与售卖！

**************************************

[rewrite_local]
^https:\/\/www\.wolframalpha\.com\/users\/me\/account* url script-response-body https://raw.githubusercontent.com/chankanzu/Quan-X-1.3/master/Wolfram1.js ^https:\/\/account\.wolfram\.com\/auth\/introspect$ url script-response-body https://raw.githubusercontent.com/chankanzu/Quan-X-1.3/master/Wolfram.js

[mitm]
hostname = www.wolframalpha.com

