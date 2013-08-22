/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = Help
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: Help(config)
 *
 *    Provides an action to popup a help menu.
 */
gxp.plugins.Help = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_help */
    ptype: "gxp_help",
    
    /** api: config[buttonText]
     *  ``String`` Text to show next to the help button
     */
     
    /** api: config[menuText]
     *  ``String``
     *  Text for help menu item (i18n).
     */
    menuText: "Help",

    /** api: config[tooltip]
     *  ``String``
     *  Text for help action tooltip (i18n).
     */
    tooltip: "Show Help",
    
    /** api: config[title]
     *  ``String``
     *  The title text used as the header.
     */
    title: "Help",

    /** api: config[autoScroll]
     *  ``String``
     *  True to use overflow:'auto' on the components layout and
     *  show scrollbars automatically when necessary.
     */
    autoScroll: true,

    /** api: config[html]
     *  ``String``
     *  HTML snippet to use for the help window body.
     */
    html: "testing",

    /** api: config[htmlUrl]
     *  ``String``
     *  HTML URL to use for the help window body.
     *  This will override the config[html] property if set.
     */
    htmlUrl: "help.html",

    /** private: property[iconCls]
     */
    iconCls: "gxp-icon-help",
    
    /** private: object[helpButton]
     */
    helpButton: null,
    
    /** private: object[helpWindow]
     */
    helpWindow: null,
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        gxp.plugins.Help.superclass.constructor.apply(this, arguments);
    },

    /** api: method[addActions]
     */
    addActions: function() {
        var mapWidth = this.target.mapPanel.map.getCurrentSize().w;
        var mapHeight = this.target.mapPanel.map.getCurrentSize().h;

	var helpButton = this;

        // construct the help window
        var helpWindow = new Ext.Window({
            title: this.title,
            autoScroll: this.autoScroll,
            closeAction: "hide",
            width: mapWidth / 2,
            height: mapHeight,
            autoLoad: {
                url: window.location + '/' + this.htmlUrl,
                scripts: true
            },
            bodyStyle: "background-color: #ffffff"
        });
        //helpWindow.center();

	// add the help button
        return gxp.plugins.Help.superclass.addActions.apply(this, [{
            text: this.buttonText,
            menuText: this.menuText,
            iconCls: this.iconCls,
            tooltip: this.tooltip,
            //enableToggle: true,
            allowDepress: true,
            handler: function() {
                if(helpWindow.hidden) {
                    helpWindow.show();
                    helpWindow.toFront();
                } else {
                    helpWindow.hide();
                }
            },
            scope: this
        }]);

    }

});

Ext.preg(gxp.plugins.Help.prototype.ptype, gxp.plugins.Help);
