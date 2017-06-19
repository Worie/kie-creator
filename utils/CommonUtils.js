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

  var getRelativeFileName = function (path) {
    var projectPath = ProjectManager.getProjectRoot().fullPath;
    return FileUtils.getRelativeFilename(
      projectPath,
      path
    );
  };
  
  var getSortedRange = function (cm, range) {
    var from, to;
    if (cm.indexFromPos(range.anchor) > cm.indexFromPos(range.head)) {
        from = range.head;
        to = range.anchor;
    } else { 
      from = range.anchor;
      to = range.head;
    }
    
    return {from: from, to: to};
  };
  
  var isEqualPos = function(a, b) {
    return a.ch === b.ch && a.line === b.line;
  };
  
  var isInProject = function (fileArray, name) {
    return fileArray.some(function (file) {
      return file.fullPath === ProjectManager.getProjectRoot().fullPath + name;
    });
  };
  
  exports.getRelativeFileName = getRelativeFileName;
  exports.getSortedRange = getSortedRange;
  exports.isInProject = isInProject;
  exports.isEqualPos = isEqualPos;
});