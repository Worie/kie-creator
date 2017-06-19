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

  var parseMarkerToObj = function (marker) {
    var obj = {},
        range = marker.find();
    
      obj.from = range.from;
      obj.to = range.to;
      obj.options = {
        className: marker.className.replace("[object Object]", ""),
        readOnly: marker.readOnly,
        inclusiveLeft: marker.inclusiveLeft,
        inclusiveRight: marker.inclusiveRight,
        hidden: marker.hidden,
        collapsed: marker.collapse
      };
    
    return obj;
  };
  
  exports.parseMarkerToObj = parseMarkerToObj;
});
