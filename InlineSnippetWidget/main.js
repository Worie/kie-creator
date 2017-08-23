/*
 * Copyright (c) 2012 - present Adobe Systems Incorporated. All rights reserved.
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
    "use strict";

    var EditorManager       = brackets.getModule("editor/EditorManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        InlineColorEditor   = require("./InlineSnippetWidget").InlineSnippetWidget;


    /**
     * Prepare hostEditor for an InlineColorEditor at pos if possible. Return
     * editor context if so; otherwise null.
     *
     * @param {Editor} hostEditor
     * @param {{line:Number, ch:Number}} pos
     * @return {?{color:String, marker:TextMarker}}
     */
    function prepareEditorForProvider(hostEditor, pos) {
        var snippetRegEx, cursorLine, match, sel, start, end, endPos, marker;

        sel = hostEditor.getSelection();
        if (sel.start.line !== sel.end.line) {
            return null;
        }

        snippetRegEx = new RegExp(/snippet/g);
        cursorLine = hostEditor.document.getLine(pos.line);

        // Loop through each match of colorRegEx and stop when the one that contains pos is found.
        do {
            match = snippetRegEx.exec(cursorLine);
            if (match) {
                start = match.index;
                end = start + match[0].length;
            }
        } while (match && (pos.ch < start || pos.ch > end));

        if (!match) {
            return null;
        }

        // Adjust pos to the beginning of the match so that the inline editor won't get
        // dismissed while we're updating the color with the new values from user's inline editing.
        pos.ch = start;
        endPos = {line: pos.line, ch: end};

        marker = hostEditor._codeMirror.markText(pos, endPos);
        hostEditor.setSelection(pos, endPos);

        return {
            color: match[0],
            marker: marker
        };
    }

    /**
     * Registered as an inline editor provider: creates an InlineEditorColor when the cursor
     * is on a color value (in any flavor of code).
     *
     * @param {!Editor} hostEditor
     * @param {!{line:Number, ch:Number}} pos
     * @return {?$.Promise} synchronously resolved with an InlineWidget, or null if there's
     *      no color at pos.
     */
    function inlineSnippetWidgetProvider(hostEditor, pos) {
        var context = prepareEditorForProvider(hostEditor, pos),
            inlineSnippetWidget,
            result;

        if (!context) {
            return null;
        } else {
            inlineSnippetWidget = new InlineColorEditor(context.color, context.marker);
            inlineSnippetWidget.load(hostEditor);

            result = new $.Deferred();
            result.resolve(inlineSnippetWidget);
            return result.promise();
        }
    }


    // Initialize extension
    ExtensionUtils.loadStyleSheet(module, "main.less");

    EditorManager.registerInlineEditProvider(inlineSnippetWidgetProvider);
  
//  CodeMirror          = require("thirdparty/CodeMirror/lib/codemirror"),
});
