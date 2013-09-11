
/**
 */

/** api: (define)
 *  module = gxp
 *  class = LayerSelectorFilterPanel
 *  base_link = `Ext.Panel <http://extjs.com/deploy/dev/docs/?class=Ext.Panel>`_
 */
Ext.namespace("gxp");

/** api: constructor
 *  .. class:: AttributeFilterPanel(config)
 *   
 *      Create a panel for turning layers on and off. Doesn't actually filter anything.
 *      Kind of a hack, but whatever.
 */
gxp.LayerSelectorFilterPanel = Ext.extend(Ext.Panel, {
	
	// custom options
	config: {
		attributes: null
	},

	attributes: null,
	
	// This panel should not have a border by default.
	border: false,
	
	/** private: method[initComponent]
	 */
	initComponent: function() {
        // Get the list of layers
        var layerConfigs = this.target.map.layers
        
		// Get the map object
		var map = this.target.mapPanel.map;
        

		// Set up the UI elements for this filter panel.
		// Use composite fields to align and place in seperate rows.
		this.items = [];
		for(var i=0; i<layerConfigs.length; i++) {
            var layerConfig = layerConfigs[i];
            
            // Skip any layers that aren't in the default group
            if (layerConfig.group && layerConfig.group != "default") {
                continue;
            }
            /*
            var layers = map.getLayersBy("params", {
                test: function (value) {
                    return layerConfig.name == value;
                }
            });
            
            if (!layers || layers.length == 0) {
                continue;
            }
            
            var layer = layers[0];
            */
            var layerLabel = (layerConfig.title) ? layerConfig.title : layerConfig.name;
			this.items.push(
				{
					xtype: "compositefield",
					//width: 400,
					items: [
                        {
                            xtype: "checkbox",
                            name: layerConfig.name,
                            checked: layerConfig.visibility,
                            handler: function (checkbox, checked) {
                                //debugger;
                                var layers = this.target.mapPanel.map.getLayersBy("params", {
                                    test: function (value) {
                                        if (value && value['LAYERS']) {
                                            return checkbox.name == value['LAYERS'];
                                        }
                                        return false;
                                    }
                                });
                                
                                if (!layers || layers.length == 0) {
                                    return;
                                }                                
                                var layer = layers[0];
                                layer.setVisibility(checked);
                            },
                            scope: this
                        },
                        {
                            xtype: "label",
                            text: layerLabel,
                            style: "padding-left: 5px; padding-top: 0.3em;"
                        }
                    ],
					style: "padding: 2px 0;"
				}
			);
		}

		this.on({
			// When this panel is destroyed, we need to make sure the "add point" control and
			// the selection layer are removed from the map.
			beforedestroy: function() {
				//this.control.deactivate();
				//map.removeControl(this.control);
				//this.dropPointButton.disable();
				//map.removeLayer(this.bufferPointLayer);
			},
			// Need to deactivate the draw control when the fieldset is collapsed or the query box
			// is closed. Will need to find the appropriate event. Might need to set event handler
			// on parent object(s).
			// beforehide doesn't work
			beforehide: function() {
				//this.control.deactivate();
				//this.dropPointButton.toggle(false);
			},
			scope: this
		});
	
		// Make sure to call the superclass's method.
		gxp.LayerSelectorFilterPanel.superclass.initComponent.call(this);
	},

	hideParent: function(me) {
	
	},

	/** api: method[getFilters]
	 *  :return: ``Array`` of ``OpenLayers.Filter``
	 *  
	 *  Returns a filter that fits the model in the Filter Encoding
	 *  specification.  Use this method instead of directly accessing
	 *  the ``filter`` property.  Return will be ``false`` if any child
	 *  filter does not have a type, property, or value.
	 */
	getFilters: function() {
		return [];
	},

	clearFields: function() {
	}
});

/** api: xtype = gxp_layerselectorfilterpanel */
Ext.reg('gxp_layerselectorfilterpanel', gxp.LayerSelectorFilterPanel); 
