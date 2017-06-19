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

define(function (require, exports, module) {

  var ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
      NodeDomain     = brackets.getModule("utils/NodeDomain"),
      EditorManager  = brackets.getModule("editor/EditorManager"),
      CommandManager = brackets.getModule("command/CommandManager"),
      Menus          = brackets.getModule("command/Menus"),
      Dialogs        = brackets.getModule("widgets/Dialogs"),
      DefaultDialogs = brackets.getModule("widgets/DefaultDialogs"),
      Strings        = brackets.getModule("strings"),
      Mustache       = brackets.getModule("thirdparty/mustache/mustache"),
      Preferences    = brackets.getModule("preferences/PreferencesManager"),
      MainViewManager = brackets.getModule("view/MainViewManager"),
      FileUtils = brackets.getModule("file/FileUtils"),
      DocumentManager = brackets.getModule("document/DocumentManager"),
      FileSystem = brackets.getModule("filesystem/FileSystem"),
      ProjectManager = brackets.getModule("project/ProjectManager"),
      KeyBindingManager = brackets.getModule("command/KeyBindingManager"),
      WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
      Resizer = brackets.getModule("utils/Resizer"),
      FileViewController = brackets.getModule("project/FileViewController");

  var invertSelection = function (cm, selections) {
    var index = 0;
    var newSelections = [];
    selections.forEach(function (range) {
      var start = cm.indexFromPos(range.from);
      var end = cm.indexFromPos(range.to);
      
      if (index <= start) {
        var indexPos = cm.posFromIndex(index);
        var startPos = range.from;
        var endPos = range.to;
        newSelections.push({anchor: indexPos, head: startPos});
        index = end;
      }
    });
    
    if (cm.somethingSelected()) {
      var end = cm.getValue().length;
      var indexPos = cm.posFromIndex(index);
      var endPos = cm.posFromIndex(end);
      newSelections.push({anchor: indexPos, head: endPos});
    }
    
    newSelections = newSelections.filter(function (el) {
      return cm.indexFromPos(el.anchor) != cm.indexFromPos(el.head);
    });
    cm.setSelections(newSelections);
    
    // NOTICE: hacky workaround for a bug #CMSELECTIONS
    // hacky. CM has a bug that makes listSelections() return only last element of the array. Thats why I return the 
    // uninverted selection so I can use it later, somewhere else...
    
    return selections;
  };
  
  
  var getMarkerByRange = function (markers, search, filePath) {
    return Array.from(markers).find(function (marker) {
      var range = marker.find();
      return range.from.ch === search.from.ch &&
        range.from.line === search.from.line &&
        range.to.ch === search.to.ch &&
        range.to.line === search.to.line &&
        marker.filePath === filePath;
    });
  };
  
  exports.invertSelection = invertSelection;
  exports.getMarkerByRange = getMarkerByRange;
});
