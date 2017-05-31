/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global, brackets*/

(function () {
    "use strict";
  
    var glob = require('glob-fs')({ gitignore: true });
    var fs = require('fs');
    
      
    function merge (projectPath) {
      console.log(projectPath);
      var files = glob.readdirSync(projectPath + '__snippet-*.json', {});
      var result = {};


      console.log(files);
      files.forEach(function (path) {
        var file = require('/'+path);
        var snippetName = Object.keys(file)[0];
        result[snippetName] = file[snippetName];
      });
      
//      console.log(result);
//    
      fs.writeFile(projectPath + '__merged.json', JSON.stringify(result));
//      console.log(projectPath + '__merged.json');
    };
    /**
     * 
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        if (!domainManager.hasDomain("myMerger")) {
          domainManager.registerDomain("myMerger", {major: 0, minor: 1});
        }
      domainManager.registerCommand(
        "myMerger",
        "merge",
        merge,
        false,
        "Merges snippet objects",
        [
          {
            name: "path",
            type: "String",
            description: "project path"
          }
        ],
        []
      );
    }
    
    exports.init = init;
}());