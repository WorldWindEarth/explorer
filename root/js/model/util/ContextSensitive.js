/* 
 * Copyright (c) 2015, Bruce Schubert <bruce@emxsys.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     - Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *
 *     - Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *
 *     - Neither the name of Bruce Schubert, Emxsys nor the names of its 
 *       contributors may be used to endorse or promote products derived
 *       from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*global define*/

/**
 * ContextSenstive is a mix-in module that adds the "Contextual Menu" capabilities to an object.
 * @param {Publisher} publisher Extends the object by adding the event generator
 * @returns {ContextSenstive}
 * 
 * @author Bruce Schubert
 */
define([
    'model/util/Publisher'],
    function (publisher) {
        "use strict";
        
        var ContextSenstive = {
            showContextMenu: function () {
                if (this.isContextSenstive) {
                    this.showMyContextMenu();
                }
            },
            /**
             * Adds the the ContextSenstive capabilities to the given object.
             * @param {Object} o The object that will become contextsenstive.
             * @param {Boolean Function()} openCallback The function that performs the edit.
             */
            makeContextSenstive: function (o, contextMenuCallback) {
                // Ensure we don't duplicate 
                if (o.showContextMenu) {
                    return; // o is already context senstive
                }
                // Add the function(s)
                var i;
                for (i in ContextSenstive) {
                    if (ContextSenstive.hasOwnProperty(i) && typeof ContextSenstive[i] === 'function') {
                        if (ContextSenstive[i] === this.makeContextSenstive) {
                            continue;
                        }
                        o[i] = ContextSenstive[i];
                    }
                }
                // Add the properties
                o.isContextSenstive = true;
                o.showMyContextMenu = contextMenuCallback;
                
                // Add the Publisher capability so that events can be generated.
                publisher.makePublisher(o);
            }
        };
        return ContextSenstive;
    }
);

