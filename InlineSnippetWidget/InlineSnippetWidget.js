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

    var InlineWidget         = brackets.getModule("editor/InlineWidget").InlineWidget;
    var SnippetWidgetTemplate = require("text!./inline_editor.html");
//    $(Mustache.render(SnippetWidgetTemplate, Strings));


    /**
     * Inline widget containing a ColorEditor control
     * @param {!string} color  Initially selected color
     * @param {!CodeMirror.TextMarker} marker
     */
    function InlineSnippetWidget(color, marker) {
        this._color = color;
        this._marker = marker;
        this._isOwnChange = false;
        this._isHostChange = false;
//        this._origin = "+InlineSnippetWidget_" + (lastOriginId++);
        this._handleHostDocumentChange = this._handleHostDocumentChange.bind(this);

        InlineWidget.call(this);
    }

    InlineSnippetWidget.prototype = Object.create(InlineWidget.prototype);
    InlineSnippetWidget.prototype.constructor = InlineSnippetWidget;
    InlineSnippetWidget.prototype.parentClass = InlineWidget.prototype;

    /** @type {!string} Current value of the color picker control */
    InlineSnippetWidget.prototype._color = null;

    /**
     * Range of code we're attached to; _marker.find() may by null if sync is lost.
     * @type {!CodeMirror.TextMarker}
     */
    InlineSnippetWidget.prototype._marker = null;

    /** @type {boolean} True while we're syncing a color picker change into the code editor */
    InlineSnippetWidget.prototype._isOwnChange = null;

    /** @type {boolean} True while we're syncing a code editor change into the color picker */
    InlineSnippetWidget.prototype._isHostChange = null;

    /** @type {number} ID used to identify edits coming from this inline widget for undo batching */
//    InlineSnippetWidget.prototype._origin = null;


    /**
     * Returns the current text range of the color we're attached to, or null if
     * we've lost sync with what's in the code.
     * @return {?{start:{line:number, ch:number}, end:{line:number, ch:number}}}
     */
    InlineSnippetWidget.prototype.getCurrentRange = function () {
        var pos, start, end;

        pos = this._marker && this._marker.find();

        start = pos && pos.from;
        if (!start) {
            return null;
        }

        end = pos.to;
        if (!end) {
            end = {line: start.line};
        }

        // Even if we think we have a good range end, we want to run the
        // regexp match to see if there's a valid match that extends past the marker.
        // This can happen if the user deletes the end of the existing color and then
        // types some more.

        var line = this.hostEditor.document.getLine(start.line),
            matches = line.substr(start.ch).match(ColorUtils.COLOR_REGEX);

        // Note that end.ch is exclusive, so we don't need to add 1 before comparing to
        // the matched length here.
        if (matches && (end.ch === undefined || end.ch - start.ch < matches[0].length)) {
            end.ch = start.ch + matches[0].length;
            this._marker.clear();
            this._marker = this.hostEditor._codeMirror.markText(start, end);
        }

        if (end.ch === undefined) {
            // We were unable to resync the marker.
            return null;
        } else {
            return {start: start, end: end};
        }
    };

    /**
     * When the color picker's selected color changes, update text in code editor
     * @param {!string} colorString
     */
//    InlineSnippetWidget.prototype._handleColorChange = function (colorString) {
//        var self = this;
//        if (colorString !== this._color) {
//            var range = this.getCurrentRange();
//            if (!range) {
//                return;
//            }
//
//            // Don't push the change back into the host editor if it came from the host editor.
//            if (!this._isHostChange) {
//                var endPos = {
//                        line: range.start.line,
//                        ch: range.start.ch + colorString.length
//                    };
//                this._isOwnChange = true;
//                this.hostEditor.document.batchOperation(function () {
//                    // Replace old color in code with the picker's color, and select it
//                    self.hostEditor.setSelection(range.start, range.end); // workaround for #2805
//                    self.hostEditor.document.replaceRange(colorString, range.start, range.end, self._origin);
//                    self.hostEditor.setSelection(range.start, endPos);
//                    if (self._marker) {
//                        self._marker.clear();
//                        self._marker = self.hostEditor._codeMirror.markText(range.start, endPos);
//                    }
//                });
//                this._isOwnChange = false;
//            }
//
//            this._color = colorString;
//        }
//    };

    /**
     * @override
     * @param {!Editor} hostEditor
     */
    InlineSnippetWidget.prototype.load = function (hostEditor) {
        InlineSnippetWidget.prototype.parentClass.load.apply(this, arguments);

//        // Create color picker control
//              this.$element = $(Mustache.render(ColorEditorTemplate, Strings));
//        /$parent.append(this.$element);

        this.$htmlContent.append($(Mustache.render(SnippetWidgetTemplate)));
    };

    /**
     * @override
     * Perform sizing & focus once we've been added to Editor's DOM
     */
    InlineSnippetWidget.prototype.onAdded = function () {
        InlineSnippetWidget.prototype.parentClass.onAdded.apply(this, arguments);

        var doc = this.hostEditor.document;
        doc.addRef();
        doc.on("change", this._handleHostDocumentChange);

//        caution wojt
        this.hostEditor.setInlineWidgetHeight(this, "200px", true);
    };

    /**
     * @override
     * Called whenever the inline widget is closed, whether automatically or explicitly
     */
    InlineSnippetWidget.prototype.onClosed = function () {
        InlineSnippetWidget.prototype.parentClass.onClosed.apply(this, arguments);

        if (this._marker) {
            this._marker.clear();
        }

        var doc = this.hostEditor.document;
        doc.off("change", this._handleHostDocumentChange);
        doc.releaseRef();
    };

    /**
     * When text in the code editor changes, update color picker to reflect it
     */
    InlineSnippetWidget.prototype._handleHostDocumentChange = function () {
        // Don't push the change into the color editor if it came from the color editor.
        if (this._isOwnChange) {
            return;
        }

        var range = this.getCurrentRange();
        if (range) {
            var newColor = this.hostEditor.document.getRange(range.start, range.end);
            if (newColor !== this._color) {
//                if (this.colorEditor.isValidColor(newColor)) { // only update the editor if the color string is valid
//                    this._isHostChange = true;
//                    this.colorEditor.setColorFromString(newColor);
//                    this._isHostChange = false;
//                }
            }
        } else {
            // The edit caused our range to become invalid. Close the editor.
            this.close();
        }
    };

    exports.InlineSnippetWidget = InlineSnippetWidget;
});
