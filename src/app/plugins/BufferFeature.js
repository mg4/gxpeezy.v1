/**
 * @require plugins/Tool.js
 * @require OpenLayers/WPSClient.js
 * @require OpenLayers/Feature/Vector.js
 * @require OpenLayers/Layer/Vector.js
 */
 
/** api: (define)
 *  module = gxp.plugins
 *  class = BufferFeature
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.ns("gxp.plugins");

/** api: constructor
 *  .. class:: BufferFeature(config)
 *
 *    Plugin for buffering a feature. Requires a server providing WPS with a buffer
 *    process.
 */  
gxp.plugins.BufferFeature = Ext.extend(gxp.plugins.Tool, {

    /** api: ptype = gxp_bufferfeature */
	ptype: "gxp_bufferfeature",
	
	/** api: config[wpsClient]
     *  ``OpenLayers.WPSClient`` A WPSClient object with servers set up.
     */	
	wpsClient: null,
	
	/** api: config[process]
     *  ``Object`` An object with "server" and "name" properties,
     *  used to decide which process to use to buffer.
     */
	process: null,
	
	    
    /** private: method[constructor]
     */
/*    constructor: function(config) {
        gxp.plugins.BufferFeature.superclass.constructor.apply(this, arguments);      
    }
*/

	execute: function(feature, radius, callback) {		
//		if (wpsClient && wpsClient instanceof OpenLayers.WPSClient &&
//				process && process.server && process.name &&
//				feature && feature instanceof OpenLayers.Feature.Vector && radius) {
	
//			var bufferProcess = this.wpsClient.getProcess(process.server, process.name);
			
			this.wpsClient.execute({
				server: this.process.server,
				process: this.process.name,
				inputs: {
					geom: feature.geometry,
					distance: radius
				},
				success: function(outputs) {
					// The buffer process should return at most 1 feature.
					callback(outputs.result[0]);
				},
				scope: this
			});
//		}
	}
});

Ext.preg(gxp.plugins.BufferFeature.prototype.ptype, gxp.plugins.BufferFeature);