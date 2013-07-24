
/**
 * @requires plugins/ClickableFeatures.js
 */
 
/** api: (define)
 *  module = gxp.plugins
 *  class = FeatureIntersection
 */

/** api: (extends)
 *  plugins/ClickableFeatures.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: FeatureIntersection(config)
 *
 *    Plugin for selecting vector features to perform intersection querying. Requires a
 *    :class:`gxp.plugins.FeatureManager`.
 */   
gxp.plugins.FeatureIntersection = Ext.extend(gxp.plugins.ClickableFeatures, {
    
    /** api: ptype = gxp_featureintersection */
    ptype: "gxp_featureintersection",
	
	constructor: function(config) {
        gxp.plugins.FeatureIntersection.superclass.constructor.apply(this, arguments);

	},
	
    /** private: method[init]
     */
	init: function(target) {
        gxp.plugins.FeatureIntersection.superclass.init.apply(this, arguments);

	    // a minimal SelectFeature control - used just to provide select and
        // unselect, won't be added to the map unless selectOnMap is true
        this.selectControl = new OpenLayers.Control.SelectFeature(
            this.target.tools[this.featureManager].featureLayer, this.initialConfig.controlOptions
        );
		
		// I think there should be checks here
		this.target.mapPanel.map.addControl(this.selectControl);		
		
	}
	
	                
});

Ext.preg(gxp.plugins.FeatureIntersection.prototype.ptype, gxp.plugins.FeatureIntersection);