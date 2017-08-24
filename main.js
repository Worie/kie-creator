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
  
  var CommonUtils = require("./utils/CommonUtils"),
      EditorUtils = require("./utils/EditorUtils"),
      SnippetUtils = require("./utils/SnippetUtils");
  
  
  // Load Utilities
  var getRelativeFileName = CommonUtils.getRelativeFileName;
  var getSortedRange = CommonUtils.getSortedRange;
  var isEqualPos = CommonUtils.isEqualPos;
  var isInProject = CommonUtils.isInProject;
  
  var invertSelection = EditorUtils.invertSelection;
  var getMarkerByRange = EditorUtils.getMarkerByRange;
  var parseMarkerToObj = EditorUtils.parseMarkerToObj;

  ExtensionUtils.loadStyleSheet(module, './css/styles.css');
  
  var $bottomPanel,
      lastSnippetName = "",
      allMarkers = new Set(),
      loadedFiles = [],
      markerFileId = 0,
      markerRangeId = 0,
      markerFilesMap = new Map(),
      markerRangeMap = new Map();
  
  
//  window.getDocument = DocumentManager.getDocumentForPath;
//  window.setview = FileViewController.openFileAndAddToWorkingSet;
  function createLiElement (marker, obj, fullPath, cm) {
    // List entry markup.
    var range = marker.find() || obj;
    
    // those are needed so I can query the li elements that represent markers
    var rangeId = null;
    var fileId = null;
    
    var stringRange = JSON.stringify(range);
    
    if (markerRangeMap.get(stringRange)) {
      rangeId = markerRangeMap.get(stringRange);
    } else {
      markerRangeMap.set(stringRange, markerRangeId);
      rangeId = markerRangeId;
      markerRangeId++;
    }

    if (markerFilesMap.get(fullPath)) {
      fileId = markerFilesMap.get(fullPath);
    } else {
      markerFilesMap.set(fullPath, markerFileId);
      fileId = markerFileId;
      markerFileId++;
    }    
    var $li = $(`<li data-marker-range="${rangeId}" data-marker-file="${fileId}"></li>`),
        $btnWrapper = $(`<div class="wrapper"></div>`),
        $delBtn = $(`<button class="marker-delete"></button>`),
        $hideBtn = $(`<button class="marker-hide"></button>`),
        $lockBtn = $(`<button class="marker-lock"></button>`),
        $leftBtn = $('<button class="inclusive">L</button>'),
        $rightBtn = $('<button class="inclusive">R</button>'),
        $code = $('<div class="code"></div>');
    
    marker.filePath = fullPath;
    

    
    function selectMarker () {
      var range = marker.find();
      if (!range) {
        removeBtnsListeners();
        $li.remove();
      } else {
        cm.setSelection(range.from, range.to);
      }
      
    };
    
    function removeBtnsListeners() {
      $delBtn.off(onDelBtnClick);
      $hideBtn.off(onHideBtnClick);
      $lockBtn.off(onLockBtnClick);
      $leftButton.off(onLeftBtnClick);
      $rightButton.off(onRightBtnClick);
    };
    
    $li.attr('data-file-name', getRelativeFileName(fullPath));
    $li.on("click", function (ev) {
        FileViewController.openFileAndAddToWorkingSet(fullPath);
        if (!ev.altKey) {
          selectMarker();
        } else {
          cm.addSelection(range.from, range.to);
        }
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
    
    var cache = {};

    obj.inclusiveLeft = true;
    obj.inclusiveRight = true;
    
    if (obj.onlyVisible) {
      var selections = cm.listSelections().map(function (range) {
        return getSortedRange(cm, range);
      });
      cache.oldSelections = invertSelection(cm, selections);
      obj.hidden = true;
      obj.readOnly = true;
      obj.className += ' hidden';
      obj.inclusiveLeft = false;
      obj.inclusiveRight = false;
    }
    
    obj.addToHistory = true;
    obj.className += ' marked';
    
    cm
      .listSelections()
      .forEach(function (range, i, arr) {
        var iterationObj = {};
        if (obj.onlyVisible) {
          if (cm.indexFromPos(range.anchor) == 0) {
            iterationObj.inclusiveLeft = true;
          }
          if (cm.indexFromPos(range.head) == cm.getValue().length) {
            iterationObj.inclusiveRight = true;
          }
        }
        
        var config = Object.assign({}, obj, iterationObj);
        range = getSortedRange(cm, range);
        var marker = getMarkerByRange(allMarkers, range, fullPath);
        if (!marker) {
          marker = cm.markText(range.from, range.to, config);
          marker.filePath = fullPath;
          allMarkers.add(marker);
        } else {
          
          // reconsider showing that the marker already exists
//          $bottomPanel
//            .find(`.marker-list li[data-marker-range="${markerRangeMap.get(JSON.stringify(range))}"][data-marker-file="${markerFilesMap.get(fullPath)}"]`)[0].scrollIntoView();
          return;
        }
        
        createLiElement(
          marker,
          config,
          fullPath,
          cm
        );
      });
    
    if (obj.onlyVisible) {
      // hacky workaround. search #CMSELECTIONS
      // if it wouldnt happen, I could simply invoke invertSelection();
      cm.setSelections(cache.oldSelections);
    }
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
            removeAllMarkers();
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
                  
                  
                  if (isInProject(loadedFiles, file.fileName)) {
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

    }
  });
  };
    
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
          
          if (!isInProject(loadedFiles, exportedFileName)) {
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
    
    $mergeBtn.on('click', function () {
      mergerDomain.exec("merge", ProjectManager.getProjectRoot().fullPath);
    });
    
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
        lastSnippetName = "snippet-project-0";
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
    
    var onRemoveClicked = function () {
      var cm = EditorManager.getCurrentFullEditor()._codeMirror;
      removeMarkersMatchingSelections(cm);
    };
    
    $exportBtn.on('click', onExportClicked);
    $importBtn.on('click', importSnapshot);
    $createBtn.on('click', markSelection);
    $closeBtn.on('click', closeBottomPanel);
    $createBtn.hide();
    
    CommandManager.register("snippetsExport", "snippetsExport", onExportClicked);
    CommandManager.register("snippetsImport", "snippetsImport", importSnapshot);
    CommandManager.register("snippetsMerge", "snippetsMerge", onMergeClicked);
    CommandManager.register("snippetsMarkRemove", "snippetsMarkRemove", onRemoveClicked);
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
        className: "hidden",
        collapse: true
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
    KeyBindingManager.addBinding("snippetsMarkRemove", "Shift-Cmd-Backspace");
    KeyBindingManager.addBinding("snippetsMarkHidden", "Shift-Alt-Cmd-1");
    KeyBindingManager.addBinding("snippetsMarkLocked", "Shift-Alt-Cmd-2");
    KeyBindingManager.addBinding("snippetsMarkVisible", "Shift-Alt-Cmd-3");
  };
  
  var removeAllMarkers = function () {
    $bottomPanel
      .find('.marker-list').html('');
    
    allMarkers.forEach(function (marker) {
      marker.clear();                   
    });
    allMarkers.clear();
  };
  
  ProjectManager.on("projectClose", removeAllMarkers);
  //ProjectManager.on("beforeProjectClose", handler)
  //ProjectManager.on("beforeProjectClose", handler)
  //ProjectManager.on("projectOpen", handler)
  
  init();
  
  var removeMarkersMatchingSelections = function (cm) {
    
    var selections = cm.listSelections(),
        toBeRemoved = [],
        filePath = EditorManager
                    .getCurrentFullEditor()
                    .getFile()
                    .fullPath;
    
    Array.from(allMarkers).forEach(function (marker) {
      if (marker.filePath != filePath)
        return;
      
      var range = marker.find();
      
      
      var matchedSelection = selections.find(function (search) {
        search = getSortedRange(cm, search);
        return isEqualPos(range.from, search.from) && isEqualPos(range.to, search.to);
      });
      
      if (matchedSelection) {
        toBeRemoved.push(marker);
        var sorted = getSortedRange(cm, matchedSelection);
        var text = cm.getRange(sorted.from, sorted.to);
        
        $bottomPanel
          .find(`.marker-list li[data-marker-range="${markerRangeMap.get(JSON.stringify(sorted))}"][data-marker-file="${markerFilesMap.get(filePath)}"]`)
          .remove();
      }
    });
    toBeRemoved.forEach(function (marker) {
      allMarkers.delete(marker);
      marker.clear();
    });
  };
  
//   require("./InlineSnippetWidget/main");

});

// TODO:
// Clear/Restore markers on projectChange
// Remove event listeners on projectChange


// Create files that are no longer in project but were in snippets
// remove files that are no longer in project (!! careful about snippets for ex)
