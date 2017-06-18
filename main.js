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
/*global $, define, brackets, alert, Promise, Set, window */


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
      snippetVersion = 0,
      lastSnippetName = "",
      allMarkers = new Set(),
      loadedFiles = [];
  
  var getRelativeFileName = function (path) {
    var projectPath = ProjectManager.getProjectRoot().fullPath;
    return FileUtils.getRelativeFilename(
      projectPath,
      path
    );
  };
//  window.getDocument = DocumentManager.getDocumentForPath;
//  window.setview = FileViewController.openFileAndAddToWorkingSet;
  function createLiElement (marker, obj, fullPath, cm) {
    // List entry markup.
    var $li = $("<li></li>"),
        $btnWrapper = $(`<div class="wrapper"></div>`),
        $delBtn = $(`<button class="marker-delete"></button>`),
        $hideBtn = $(`<button class="marker-hide"></button>`),
        $lockBtn = $(`<button class="marker-lock"></button>`),
        $leftBtn = $('<button class="inclusive">L</button>'),
        $rightBtn = $('<button class="inclusive">R</button>'),
        $code = $('<div class="code"></div>');
    
    var range = marker.find() || obj;
    
    function selectMarker () {
      cm.setSelection(range.from, range.to);
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
      allMarkers.delete(marker);
      marker.clear();
      $li.remove();
    };
    
    function onLockBtnClick () {
      if (obj.hidden) {
        // if it is hidden, you cannot deselect the lock state
        return;
      }
      selectMarker();
      if(obj.readOnly) {
        obj.className = obj.className.replace("locked", "");
        this.classList.remove('active');
      } else {
        obj.className += " locked";
        this.classList.add('active');
      }
      obj.readOnly = !obj.readOnly;

      var newmarker = cm.markText(range.from, range.to, obj);
      allMarkers.delete(marker);
      marker.clear();
      marker = newmarker;
      allMarkers.add(marker);
    };
    
    function onLeftBtnClick () {
      selectMarker();
      obj.inclusiveLeft = !obj.inclusiveLeft;
      var newmarker = cm.markText(range.from, range.to, obj);
      allMarkers.delete(marker);
      marker.clear();
      marker = newmarker;
      allMarkers.add(marker);
      this.classList.toggle('active');
    };
    
    function onRightBtnClick () {
      selectMarker();
      obj.inclusiveRight = !obj.inclusiveRight;
      var newmarker = cm.markText(range.from, range.to, obj);
      allMarkers.delete(marker);
      marker.clear();
      marker = newmarker;
      allMarkers.add(marker);
      this.classList.toggle('active');
    };
    
    function onHideBtnClick () {
      selectMarker();
      if (!obj.hidden) {
        obj.className += ' hidden';  
        obj.readOnly = true;
        $lockBtn[0].classList.add('active');
      } else {
        obj.className = obj.className.replace("hidden", "");
        
        obj.className = obj.className.replace("locked", "");
        obj.readOnly = false;
        $lockBtn[0].classList.remove('active');
      }
      obj.hidden = !obj.hidden;
      obj.collapse = obj.hidden;
      
      var newmarker = cm.markText(range.from, range.to, obj);
      allMarkers.delete(marker);
      marker.clear();
      marker = newmarker;
      allMarkers.add(marker);
      this.classList.toggle('active');
    };
    
    selectMarker();
    
    $delBtn.on("click", onDelBtnClick);
    $lockBtn.on("click", onLockBtnClick);
    $leftBtn.on("click", onLeftBtnClick);
    $rightBtn.on("click", onRightBtnClick);
    $hideBtn.on("click", onHideBtnClick);
    
    $code.text(cm.getSelection());
    
    if(obj.readOnly) 
      $lockBtn.addClass('active');
    
    if(obj.inclusiveLeft)
      $leftBtn.addClass('active');
    
    if(obj.inclusiveRight)
      $rightBtn.addClass('active');
    
    if(obj.hidden)
      $hideBtn.addClass('active');
    
    if(obj.collapsed) {
      // so that it is not hidden inside brackets, but will be in exercises
      obj.collapse = true;
      obj.collapsed = false;
      var newmarker = cm.markText(range.from, range.to, obj);
      allMarkers.delete(marker);
      marker.clear();
      marker = newmarker;
      allMarkers.add(marker);
    }
    
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
  
  function markSelection(config) {
    var fullPath = EditorManager
                    .getCurrentFullEditor()
                    .getFile()
                    .fullPath,
        currentEditor = EditorManager.getCurrentFullEditor(),
        cm = currentEditor._codeMirror;
    
    if (!cm.somethingSelected()) { 
      return false;
    }

    var obj = config || {
      className: ""
    };

    if (obj.onlyVisible) {
      invertSelection(cm);
      obj.hidden = true;
      obj.readOnly = true;
      obj.className += ' hidden';
    }
    
    obj.addToHistory = true;
    obj.className += ' marked';
    obj.inclusiveLeft = true;
    obj.inclusiveRight = true;
    

    cm
      .listSelections()
      .forEach(function (range) {
        
        range = getSortedRange(cm, range);
        createLiElement(
          cm.markText(range.from, range.to, obj),
          obj,
          fullPath,
          cm
        );
      });
  };
    
  function getSortedRange (cm, range) {
    var from, to;
    if (cm.indexFromPos(range.anchor) > cm.indexFromPos(range.head)) {
        from = range.head;
        to = range.anchor;
    } else { 
      from = range.anchor;
      to = range.head;
    }
    
    return {from: from, to: to};
  }
  function invertSelection (cm) {
    var selections = cm.listSelections();
    var index = 0;
    var newSelections = [];
    selections.forEach(function (range) {
      range = getSortedRange(cm, range);
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
  };
  
  function parseMarkerToObj (marker) {
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
  
  // helper function to create new file inside brackets. (root dir)
  function createNewFile (path, value) {
    var directory = FileSystem.getDirectoryForPath('/');
    
    return ProjectManager.createNewItem(
        directory,
        FileUtils.getBaseName(path),
        true,
        false
    ).then(function (newFile) {
      var promise = new Promise(resolve => {
        newFile.write(value);
        setTimeout(function () {
          resolve(true);  
        }, 500);
      });
      return promise;
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
    
    ProjectManager.getAllFiles().then(function (fileArray) {
      loadedFiles = fileArray;
      var a = fileArray.filter(function (file) {
        return /__snippet-/.test(getRelativeFileName(file.fullPath));
      });
      var select = $template.find('#snippetSelect');
      a.forEach(function (el) {
        select.append(`<option value="${getRelativeFileName(el.fullPath)}"> ${getRelativeFileName(el.fullPath).replace(/__snippet-/,"").replace(/.json/,"")}</option>`); 
      });
      
      select.on('change', function () {
        if (select.val() == "*pickasnippet*") {
          $template.find('#importBTN').attr('disabled','disabled');
        } else {
          $template.find('#importBTN').attr('disabled',false);
        }
      })
    });


    var d = Dialogs.showModalDialogUsingTemplate($template, true);
    var dialog = d.getElement();
    d.done(function(buttonId){
      if(buttonId === 'done') {
            clearMarkers();
        var snippetId = dialog.find("#snippetSelect").val(),
            projectPath = ProjectManager.getInitialProjectPath();
        
        DocumentManager
              .getDocumentForPath(projectPath + snippetId)
              .then(function (doc) {
                var json = JSON.parse(doc.getText());
                var snippetName = Object.keys(json)[0];
                // ugh. dont know the name of the snippet, but theres only one key at this level 

                json[snippetName]['files'].forEach(function (file) {
                  // create file if does not exits
                  // probably remove all others?
                  // then
                  
                  var importMarkers = function (file) { 
                    var path = projectPath + file.fileName;
                    FileViewController
                          .openFileAndAddToWorkingSet(path)
                          .then(function () {
                             DocumentManager
                              .getDocumentForPath(path)
                              .then(function (doc) {
                                var cm = doc._masterEditor._codeMirror;
                               
                                 file.markers.forEach(function (marker) {
                                  var loadedMarker = cm.markText(marker.from, marker.to, marker.options);
                                  allMarkers.add(loadedMarker);
                                  var foo = Object.assign(marker, marker.options);
                                  createLiElement(
                                    loadedMarker,
                                    foo,
                                    projectPath + file.fileName,
                                    cm
                                  );
                                });
                              });
                          });
                  };
                  
                  
                  if (isInProject(file.fileName)) {
                    updateFile(file.fileName, file.contents);
                    importMarkers(file);
                  } else {
                    createNewFile(
                      file.fileName,
                      file.contents
                    ).then(function () {
                      importMarkers(file);
                    });
                  }
                
                
                });
            });

                  
//              }).fail(function (err) {
//                console.log(err);
//              });
        

    }
  });
  };
  
  /*
  
   if (typeof json[file].markers !== 'undefined') {
                    FileViewController
                      .openFileAndAddToWorkingSet(projectPath + file)
                      .then(function () {
                        DocumentManager
                      .getDocumentForPath(projectPath + file)
                      .then(function (doc) {
                        // so it'll be kept alive
                        doc.addRef();
//                          cm = doc._associatedFullEditors[0]._codeMirror;
                          console.log(doc);
                          setTimeout(function() {
                            console.log(doc);
                          },1000);
                          var cm = doc._associatedFullEditors[0]._codeMirror;
                        
                        if (typeof json[file].markers !== 'undefined') {
                          console.log(file, json[file].markers);
                          json[file].markers.forEach(function (marker) {

                            createLiElement(
                              cm.markText(
                                marker.from,
                                marker.to,
                                marker
                              ),
                              marker,
                              projectPath + file,
                              cm
                            );
                            doc.releaseRef();
                          });
                        }
                    });
                      
                    });
                  }
                  */
  
  function exportProject (snippetName) {
    
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
          var finalObj = [],
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
                finalObj[index]['markers'] = Array.from(markerList).map(function (marker) {
                  return parseMarkerToObj(marker);
                });
                
                finalObj[index]['cmMode'] = codeMirrors[index].codeMirror.getMode().name;
  
                // Clear the set so it can be used when iterating over different file
                markerList.clear();
            } else {
              finalObj[index]['markers'] = [];
              var cmMode = "";
              if (/.html$/.test(index)) {
                cmMode = "htmlmixed";
              } else if (/.css/.test(index)) {
                cmMode = "css";
              } else if ((/.js/.test(index))) {
                cmMode = "javascript";
              }
              finalObj[index]['cmMode'] = cmMode;
              //detect the cmMode manually by checking the file extension - todo
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
          
          
          // meh... finalObj and objTosave? improve later
          var objToSave = {};
          objToSave[snippetName] = { files: [] };
          
          Object.keys(finalObj).forEach(function (cmFile) {
            var singleFileObj = {fileName: cmFile};
            Object.assign(singleFileObj, finalObj[cmFile]);
            objToSave[snippetName].files.push(singleFileObj);
          });
          
          // Create a new file with a version name in it and the final object containing whole project with marks.
          // get file for path  '__snippet-' + snippetName + '.json'
          // if none, do below
          
          // check if file is in project
          var exportedFileName = '__snippet-' + snippetName + '.json';
          
          if (!isInProject(exportedFileName)) {
            createNewFile(
              exportedFileName,
              JSON.stringify(objToSave)
            );            
          } else {
            updateFile(exportedFileName, JSON.stringify(objToSave));  
          }
        });
      });
  };
  
  var isInProject = function (name) {
    return loadedFiles.some(function (file) {
      return file.fullPath === ProjectManager.getProjectRoot().fullPath + name;
    });
  };
  
  function init () {
    var mergerDomain = new NodeDomain("myMerger", ExtensionUtils.getModulePath(module, "node/mergeDomain"));
    
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
        $importBtn = $bottomPanel.find('#import'),
        $closeBtn = $bottomPanel.find('.close');
    var $mergeBtn = $bottomPanel.find('#merge');
    
    $mergeBtn.on('click', onMergeClicked);
    
    var toolbarButton = require('text!html/toolbar_button.html');
    $('#main-toolbar .buttons').append(toolbarButton);
    $('#snippet-creator-btn').on('click', function() {
      showBottomPanel();
    });

    var showBottomPanel = function () {
      Resizer.show($bottomPanel);
    };
    
    var onExportClicked = function () {
      
      if (lastSnippetName == "") {
        lastSnippetName = "snippet-project-" + snippetVersion;
      }
      
      var $template = $(
      Mustache.render(require("text!html/export_dialog.html"), 
        {
          "Strings":Strings,
          "SnippetName": lastSnippetName
        })
      );
      var d = Dialogs.showModalDialogUsingTemplate($template, true);
      var dialog = d.getElement();
      
      var select = $template.find('#snippetSelect');
      select.on('change', function () {
         if (select.val() != "*pickasnippet*") {
          dialog.find("#snippetId").val($(this).val());
         }
      })
      
     dialog.find("#snippetId").select();
      ProjectManager.getAllFiles().then(function (fileArray) {
        // those are just files in project. rename
        loadedFiles = fileArray;
        var a = fileArray.filter(function (file) {
          return /__snippet-/.test(getRelativeFileName(file.fullPath));
        });
        a.forEach(function (el) {
          var tmp = getRelativeFileName(el.fullPath).replace(/__snippet-/,"").replace(/.json/,"");
          select.append(`<option value="${tmp}"> ${tmp}</option>`); 
        });
      });

      
      d.done(function(buttonId){
        if(buttonId === 'done') {
          lastSnippetName = dialog.find("#snippetId").val();
          exportProject(lastSnippetName);
        }
      });
    };
    
    var closeBottomPanel = function () {
      Resizer.hide($bottomPanel);
    };
    
    var onMergeClicked = function () {
      mergerDomain.exec("merge", ProjectManager.getProjectRoot().fullPath);
    };
    
    $exportBtn.on('click', onExportClicked);
    $importBtn.on('click', importSnapshot);
    $createBtn.on('click', markSelection);
    $closeBtn.on('click', closeBottomPanel);
    $createBtn.hide();
    
    CommandManager.register("snippetsExport", "snippetsExport", onExportClicked);
    CommandManager.register("snippetsImport", "snippetsImport", importSnapshot);
    CommandManager.register("snippetsMerge", "snippetsMerge", onMergeClicked);
    CommandManager.register("snippetsMarkVisible", "snippetsMarkVisible",  function () {
      showBottomPanel();
      markSelection({
        onlyVisible: true
      });
    });
    CommandManager.register("snippetsMarkHidden", "snippetsMarkHidden",  function () {
      showBottomPanel();
      markSelection({
        hidden: true,
        readOnly: true,
        className: "hidden"
      });
    });
    CommandManager.register("snippetsMarkLocked", "snippetsMarkLocked",  function () {
      showBottomPanel();
      markSelection({
        readOnly: true,
        className: "locked"
      });
    });
    CommandManager.register("snippetsMark", "snippetsMark", function () {
      showBottomPanel();
      markSelection();
    });
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
    
    KeyBindingManager.addBinding("snippetsExport", "Shift-Cmd-E");
    KeyBindingManager.addBinding("snippetsImport", "Shift-Cmd-I");
    KeyBindingManager.addBinding("snippetsMerge", "Shift-Cmd-M");
    KeyBindingManager.addBinding("snippetsMark", "Shift-Cmd-N");
    KeyBindingManager.addBinding("snippetsMarkHidden", "Shift-Alt-Cmd-1");
    KeyBindingManager.addBinding("snippetsMarkLocked", "Shift-Alt-Cmd-2");
    KeyBindingManager.addBinding("snippetsMarkVisible", "Shift-Alt-Cmd-3");
  };
  
  
  var clearMarkers = function () {
    $bottomPanel
      .find('.marker-list').html('');
    
    allMarkers.forEach(function (marker) {
      marker.clear();                   
    });
    allMarkers.clear();
  };
  
  var loadMarker = function () {
  };
  
  var updateSnippet = function () {
    
  };

  ProjectManager.on("projectClose", clearMarkers);
  //ProjectManager.on("beforeProjectClose", handler)
  //ProjectManager.on("beforeProjectClose", handler)
  //ProjectManager.on("projectOpen", handler)
  
  init();
});

// TODO:
// Clear/Restore markers on projectChange
// Remove event listeners on projectChange


// Create files that are no longer in project but were in snippets
// remove files that are no longer in project (!! careful about snippets for ex)