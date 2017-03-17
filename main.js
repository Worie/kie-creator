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
maxerr: 50, browser: true */
/*global $, define, brackets, alert, Promise, Set */


define(function (require, exports, module) {
  "use strict";

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


  ExtensionUtils.loadStyleSheet(module, './css/styles.css');
  
  var $bottomPanel,
      selectionBookmark,
      snippetVersion = 0;
  
  var getRelativeFileName = function (path) {
    var projectPath = ProjectManager.getProjectRoot().fullPath;
    return FileUtils.getRelativeFilename(
      projectPath,
      path
    );
  };
  
  function createLiElement (marker, obj) {
    // Get codeMirror instance to which maker is hooked in
    var cm = marker.doc.cm,
        fullPath = EditorManager
                    .getCurrentFullEditor()
                    .getFile()
                    .fullPath;
    
    // List entry markup.
    var $li = $("<li></li>"),
        $btnWrapper = $(`<div class="wrapper"></div>`),
        $delBtn = $(`<button class="marker-delete"></button>`),
        $hideBtn = $(`<button class="marker-hide"></button>`),
        $lockBtn = $(`<button class="marker-lock"></button>`),
        $leftBtn = $('<button class="inclusive">L</button>'),
        $rightBtn = $('<button class="inclusive">R</button>'),
        $code = $('<div class="code"></div>');
    
    function selectMarker () {
      var obj = marker.find();
      cm.setSelection(obj.from, obj.to);
    };
    
    function removeBtnsListeners() {
      $delBtn.off(onDelBtnClick);
      $hideBtn.off(onHideBtnClick);
      $lockBtn.off(onLockBtnClick);
      $leftButton.off(onLeftBtnClick);
      $rightButton.off(onRightBtnClick);
    };
    
    $li.attr('data-file-name', getRelativeFileName(fullPath));
    $li.on("click", function () {
        FileViewController.openFileAndAddToWorkingSet(fullPath);
        selectMarker();
    });

    function onDelBtnClick () {
      selectMarker();
      marker.clear();
      $li.remove();
    };
    
    function onLockBtnClick () {
      selectMarker();
      if(obj.readOnly) {
        obj.className = obj.className.replace("locked", "");
        this.classList.remove('active');
      } else {
        obj.className += " locked";
        this.classList.add('active');
      }
      obj.readOnly = !obj.readOnly;

      var newmarker = cm.markText(marker.find().from, marker.find().to, obj);
      marker.clear();
      marker = newmarker;
    };
    
    function onLeftBtnClick () {
      selectMarker();
      obj.inclusiveLeft = !obj.inclusiveLeft;
      var newmarker = cm.markText(marker.find().from, marker.find().to, obj);
      marker.clear();
      marker = newmarker;
      this.classList.toggle('active');
    };
    
    function onRightBtnClick () {
      selectMarker();
      obj.inclusiveRight = !obj.inclusiveRight;
      var newmarker = cm.markText(marker.find().from, marker.find().to, obj);
      marker.clear();
      marker = newmarker;
      this.classList.toggle('active');
    };
    
    function onHideBtnClick () {
      selectMarker();
      if (!obj.hidden) {
        obj.className += ' hidden';  
      } else {
        obj.className = obj.className.replace("hidden", "");
      }
      obj.hidden = !obj.hidden;
      
      var newmarker = cm.markText(marker.find().from, marker.find().to, obj);
      marker.clear();
      marker = newmarker;
      this.classList.toggle('active');
    };
    
    $delBtn.on("click", onDelBtnClick);
    $lockBtn.on("click", onLockBtnClick);
    $leftBtn.on("click", onLeftBtnClick);
    $rightBtn.on("click", onRightBtnClick);
    $hideBtn.on("click", onHideBtnClick);
    
    $code.text(cm.getSelection());
    
    
    $btnWrapper
      .append($delBtn)
      .append($hideBtn)
      .append($lockBtn)
      .append($leftBtn)
      .append($rightBtn)
    
    $li
      .append($code)
      .append($btnWrapper);
    
    $bottomPanel
      .find('.marker-list')
      .append($li);
    
    var $tableContainer = $bottomPanel.find('.table-container');
    
    // Scroll top on each added list item
    $tableContainer.animate({ scrollTop: $tableContainer.find('.marker-list').height()}, 300);
  };
  
  function markSelection(obj) {
    var startIndex,
        endIndex,
        currentEditor = EditorManager.getCurrentFullEditor(),
        cm = currentEditor._codeMirror,
        selectedText = cm.getSelection();
    
    if (selectedText === '') { 
      return false;
    }
    
    if (!obj.className) {
      obj.className = {};
    }
    obj.addToHistory = true;
    obj.className += ' marked';
    
    startIndex = cm.indexFromPos(cm.getCursor('from'));
    endIndex = selectedText.length + startIndex;
    
    // Get Pos Object from string index ({line, ch})
    var from = cm.posFromIndex(startIndex),
        to = cm.posFromIndex(endIndex);
    
    createLiElement(
      cm.markText(from, to, obj),
      obj
    );
  };
  
  function parseMarkerToObj (marker) {
    var obj = {},
        range = marker.find();
    
    obj.range = {
      from: range.from,
      to: range.to
    };
    
      obj.className = marker.className.replace("[object Object]", "");
      obj.readOnly = marker.readOnly;
      obj.inclusiveLeft = marker.inclusiveLeft;
      obj.inclusiveRight = marker.inclusiveRight;
      obj.hidden = marker.hidden;

    return obj;
  };
  
  // helper function to create new file inside brackets. (root dir)
  function createNewFile (path, value) {
    var directory = FileSystem.getDirectoryForPath('/');
    
    ProjectManager.createNewItem(
        directory,
        FileUtils.getBaseName(path),
        true,
        false
    ).then(function (newFile) {
      newFile.write(value);
    });
  };

  function updateFile (filename, content) {
    var filePath = ProjectManager.getInitialProjectPath() + filename;
    DocumentManager
              .getDocumentForPath(filePath)
              .then(function (doc) {
                FileUtils.writeText(doc.file, content);
              });
  }

  function importSnapshot () {
    var $template = $(
      Mustache.render(require("text!html/import_dialog.html"), 
      {
        "Strings":Strings
      })
    );

    var d = Dialogs.showModalDialogUsingTemplate($template, true);
    var dialog = d.getElement();
    d.done(function(buttonId){
      if(buttonId === 'done') {
        var snippetId = dialog.find("#snippetId").val();
        DocumentManager
              .getDocumentForPath(ProjectManager.getInitialProjectPath() + '__snippet-project'+(snippetId) + ".json")
              .then(function (doc) {
                var json = JSON.parse(doc.getText());
                for (var file in json) {
                  updateFile(file, json[file].contents);
                }
              }).fail(function (err) {
                console.log(err);
              });
        
      }
    });
  }
  
  function exportProject () {
    var filePaths = [];
    
    // This is probably the most weird part of this extension.
    
    // You need a promise which will give you all files inside a project
    var allFilesPromise = ProjectManager.getAllFiles();

    return allFilesPromise
      .then(function (fileArray) {
        
        var textContents = fileArray.reduce(function (prev, file, idx) {
          return prev.then(function (arr) {
            return new Promise(function (resolve, reject) {
              var filePath = getRelativeFileName(file.fullPath);
              FileUtils.readAsText(file).then(function (val) {
                filePaths.push(filePath);
                arr.push(val);
                resolve(arr);
              }).fail(function () {
                resolve(arr);
              });
            });
          });
        }, Promise.resolve([]));

        var bracketsDocuments = Promise
          .all(fileArray.map(({fullPath}) => new Promise(resolve => {
            DocumentManager
              .getDocumentForPath(fullPath)
              .then(document => {
                resolve(document);
              })
              .fail(() => {
                resolve(null);
              });
          })))
          .then(documents => documents.filter(document => !!document));

        // Pass both promises further.
        return {
          textContents,
          bracketsDocuments
        };
      })
      .then(function (promises) {
        // Return an key-value object where key is a filepath, and value is a new object with contents property in it.
        var textContents = promises.textContents.then(function (fileContents) {
          var i = 0;
          var files = {};
          // We dont know the file paths here, so we are using the global filePaths obj
          fileContents.forEach(function (text) {
            files[filePaths[i++]] = { contents : text };
          });
          return files;
        });
        // Get the second promise and handle it.
        var codeMirrorInstances = promises.bracketsDocuments.then(function (docs) {
          var files = {};
          // 
          docs.forEach(function (doc) {
            if (doc._associatedFullEditors.length) {
              var filePath = getRelativeFileName(doc.file.fullPath);
              // Create more-or less same structure as in textContents promise, but add a codeMirror property to each obj.
              files[filePath] = { codeMirror : doc._associatedFullEditors[0]._codeMirror };
              return files;
            }
          });
          return files;
        });
        // When both promises resolves with values, we can move on
        return Promise.all([textContents, codeMirrorInstances]);
      })
      .then(function (promises) {
        promises.then(function (arr) {
          var finalObj = {},
              textContents = arr[0],
              codeMirrors = arr[1],
              markerList = new Set();
          
          // For each element in the first array (text)
          $.each(textContents, function(index, value) {
            
            // Init the obj property with file contents (key is path)
            finalObj[index] = value;
            
            // If there are any codeMirror instances for that file/path
            if(typeof codeMirrors[index] !== 'undefined') {
              
                codeMirrors[index]
                  .codeMirror
                  .getAllMarks()
                  // oh god, refactor
                  // i had to iterate over each line inside marker
                  // returned by getAllMarks to get the properties
                  // which were passed to markText as an option obj 
                  // (ex lock, hide, inclusiveLeft or right)
                  // for some weird implementation reason of CodeMirror itself,
                  // those are not present in marker returned by getAllMarks
                  // but they are stored inside the lines property (which contains list of all markers for that line)
                  // I store them in set to get rid of duplication 
                  .forEach(function(marker) {
                    marker.lines.forEach(function (line) {
                      line.markedSpans.forEach(function (markedSpan) {
                        markerList.add(markedSpan.marker);
                      });
                    });
                  });
                
                // Create an array from the set and parse each marker (with initial options stored in them, by now)
                // to raw object, so we don't have any junkies inside the final json file.
                finalObj[index]['markers']  = Array.from(markerList).map(function (marker) {
                  return parseMarkerToObj(marker);
                });
              
                // Clear the set so it can be used when iterating over different file
                markerList.clear();
            }
          });
          
          // Lets get rid of files which contain __ (wherever in their path, that means that directories with __ will also be ignored)
          Object.keys(finalObj)
            .filter(function (file) {
              return file.indexOf('__') > -1;
            })
            .forEach(function (file) {
              delete finalObj[file];
            });
          
          // Create a new file with a version name in it and the final object containing whole project with marks.
          createNewFile(
            '__snippet-project'+(snippetVersion++) + ".json",
            JSON.stringify(finalObj)
          );
        });
      });
  };
  
  function init () {
  
    // The extensions space, panel at the bottom of editor.
    var $bottomPanelTemplate = $(
      Mustache.render(require("text!html/bottom_panel.html"), 
      { "Strings":Strings})
    );
    
    // Brackets required stuff
    WorkspaceManager.createBottomPanel('snippet-creator-panel', $bottomPanelTemplate, 100);
    $bottomPanel = $('#snippet-creator-panel');
    Resizer.show($bottomPanel);
    
    
    var $createBtn = $bottomPanel.find('#create-marker'),
        $exportBtn = $bottomPanel.find('#export'),
        $importBtn = $bottomPanel.find('#import');
    
    $exportBtn.on('click', exportProject);
    $importBtn.on('click', importSnapshot);
    $createBtn.on('click', markSelection);
    $createBtn.hide();
    
    // When brackets is launching there are no activeEditors.
    var currentFulLEditor = false;
    
    EditorManager.on('activeEditorChange', function () {
      if(currentFulLEditor) {
        currentFulLEditor
          ._codeMirror
          .off('beforeSelectionChange', onBeforeSelectionChange);
      }
      
     function onBeforeSelectionChange(instance, obj) {
          
      // You need to compare the properties to check if those are the same as it is not the same obj
        if (
          obj.ranges[0].anchor.ch == obj.ranges[0].head.ch &&
          obj.ranges[0].anchor.line == obj.ranges[0].head.line
        ) {
           $createBtn.hide();
        } else {
          $createBtn.show();
        }
      }
      
      currentFulLEditor = EditorManager.getCurrentFullEditor();
      // Set listener directly on codeMirror as Brackets does not expose it
      currentFulLEditor
        ._codeMirror
        .on('beforeSelectionChange', onBeforeSelectionChange);
    });

    $createBtn.hide();
  };

  init();
});

// TODO:
// Import capability
// Clear/Restore markers on projectChange
// Remove event listeners on projectChange