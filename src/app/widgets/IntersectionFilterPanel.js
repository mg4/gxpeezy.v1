
/**
 * @require plugins/FeatureManager.js
 */

/** api: (define)
 *  module = gxp
 *  class = IntersectionFilterPanel
 *  base_link = `Ext.Panel <http://extjs.com/deploy/dev/docs/?class=Ext.Panel>`_
 */
Ext.namespace("gxp");

/** api: constructor
 *  .. class:: IntersectionFilterPanel(config)
 *   
 *      Create a panel for assembling intersection filters.
 */
gxp.IntersectionFilterPanel = Ext.extend(Ext.Panel, {
	
	// This panel should not have a border by default.
	border: false,
	
    /** private: method[initComponent]
     */
    initComponent: function() {
		// Get the map object
		var map = this.target.mapPanel.map;
		var process = this.target.tools[this.process];
		var processFeatureManager = this.target.tools[process.featureManager];
	
		// Set up the UI elements for this filter panel.
		// Only way I could get the buttons and stuff to line up nice was to wrap them in
		// a composite field. I don't really like this but it'll have to do until I can figure
		// out something better.
		this.items = [{
            xtype: "compositefield",
			items: [
				// Button to activate the control for adding points.
				/*
				new Ext.Button(
					new GeoExt.Action(
					{
						ref: "../selectFeaturesButton",
						iconCls: "gxp-icon-selectfeature",
						text: "Select",
						toggleGroup: "editingtools",
						enableToggle: true,
						deactivateOnDisable: true,
						map: map,
						control: process.selectControl
					}
					)
				),
				*/
				{
					xtype: "button",
					ref: "../selectFeaturesButton",
					iconCls: "gxp-icon-selectfeature",
					text: "Select",
					toggleGroup: "editingtools",
					enableToggle: true,
				    toggleHandler: function(btn, pressed) {
						process.selectControl[pressed ? "activate" : "deactivate"]();
						processFeatureManager[pressed ? "showLayer" : "hideLayer"](this.id, "all");
					}
				},
				// Label for the radius text box
				{
					xtype: "label",
					text: "Layer:",
					style: "padding-left: 5px; padding-top: 0.3em"
				},
				// Layer Selection drop down
				this.createLayersDropdown()
			]
		}];
	
		// Make sure to call the superclass's method.
        gxp.IntersectionFilterPanel.superclass.initComponent.call(this);
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
		var filters = [];

		var process = this.target.tools[this.process];
		var processFeatureManager = this.target.tools[process.featureManager];

		for(var i = 0; i < processFeatureManager.featureLayer.selectedFeatures.length; i++){
			filters.push(new OpenLayers.Filter.Spatial({
				type: OpenLayers.Filter.Spatial.INTERSECTS,
				value: processFeatureManager.featureLayer.selectedFeatures[i].geometry
			}));
		}
		
		return filters.length > 1 ?
                        [ new OpenLayers.Filter.Logical({
                            type: OpenLayers.Filter.Logical.OR,
                            filters: filters
                        }) ] :
                        filters;

		//return filters;
	},
	
	hideParent: function(me) {
		// I had to pass in a reference to this object, because the scope that this function
		// executes in as a callback does not have that reference.
		var process = me.target.tools[me.process];
		var processFeatureManager = me.target.tools[process.featureManager];
		
		process.selectControl.deactivate();
		me.selectFeaturesButton.toggle(false);
		processFeatureManager.hideLayer(me.id, "all");
	},
	
	createLayersDropdown: function() {
	
		// Just return the Ext configuration for a combo box
        return {
            xtype: "combo",
			ref: "../layerField",
            /*
			store: new GeoExt.data.LayerStore({
				map: this.target.mapPanel.map,
				layers: this.target.mapPanel.map.layers
			}),
			*/
			store: this.target.mapPanel.layers,
			editable: false,
            displayField: "title",
            valueField: "layer",
            triggerAction: "all",
            mode: "local",
			listeners: {
                select: function(combo, record) {
					var process = this.target.tools[this.process];
					var processFeatureManager = this.target.tools[process.featureManager];
					processFeatureManager.setLayer(record);
                    this.fireEvent("change", this);
                },
                scope: this
            },
			width: 85			
		}
	}

});

/** api: xtype = gxp_intersectionfilterpanel */
Ext.reg('gxp_intersectionfilterpanel', gxp.IntersectionFilterPanel); 