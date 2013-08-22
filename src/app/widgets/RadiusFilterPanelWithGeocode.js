
/**
 * @require plugins/BufferFeature.js
 * @require OpenLayers/Control/DrawFeature.js
 * @require OpenLayers/Handler/Point.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/Handler/Polygon.js
 * @require widgets/form/GoogleGeocoderComboBox.js
 * @require plugins/GoogleSource.js
 */

/** api: (define)
 *  module = gxp
 *  class = RadiusFilterPanelWithGeocode
 *  base_link = `Ext.Panel <http://extjs.com/deploy/dev/docs/?class=Ext.Panel>`_
 */
Ext.namespace("gxp");

/** api: constructor
 *  .. class:: RadiusFilterPanelWithGeocode(config)
 *   
 *      Create a panel for assembling radius filters.
 */
gxp.RadiusFilterPanelWithGeocode = Ext.extend(Ext.Panel, {
	
	/** api: config[allowedUnits]
	 *  ``Array`` of ``Object``
	 *  List of radius units and conversion functions.
	 *  Each unit ``Object`` should have a name ``String`` and a convert ``function``.
	 *  The convert function should convert the distance from the given units to meters.
	 *  Defaults to miles and kilometers.
	 */
	allowedUnits: [
		{
			name: "miles",
			convert: function (miles) {
				return miles * 1609.34;
			}
		}, 
		{
			name: "kilometers",
			convert: function (kilometers) {
				return kilometers * 1000;
			}
		}
	],
	
	defaultRadiusUnit: 0,
	
	defaultRadius: 200,

	// This panel should not have a border by default.
	border: false,

	// for storing point (used to update when changing radius size)
	featureCache: null,
	
	/** private: method[initComponent]
	 */
	initComponent: function() {	
		// Get the map object
		var map = this.target.mapPanel.map;
		
		// Make a vector layer for this tool to use
		this.bufferPointLayer = new OpenLayers.Layer.Vector(null, {
			displayInLayerSwitcher: false,
			styleMap: new OpenLayers.StyleMap({

				// well-known graphic name: "star", "cross", "x", "square", "triangle", and "circle"
				// Apparently you can make your own:
				// http://openlayers.org/dev/examples/graphic-name.html
				graphicName: "circle", 
				// based on feature.attributes.type
				pointRadius: "3",
				fillOpacity: ".4"
			})
		});

		// Add the layer to the map
		map.addLayers([this.bufferPointLayer]);

		// keep this vector layer on top so that it's visible
		map.events.on({
			addlayer: this.raiseLayer,
			scope: this
		});
		
		// Create the point drawing control
		this.control = new OpenLayers.Control.DrawFeature(
			this.bufferPointLayer,
			OpenLayers.Handler.Point,
			{
				eventListeners: {
					featureadded: this.getBufferedPoint,
					scope: this
				}
			}
		);
		
		// Set up the UI elements for this filter panel.
		// Only way I could get the buttons and stuff to line up nice was to wrap them in
		// a composite field. I don't really like this but it'll have to do until I can figure
		// out something better.
		this.items = [
			{
				xtype: "compositefield",
				style: "padding: 2px 0; padding-left: 5px;",
				items: [
					// Label for the radius text box
					{
						xtype: "label",
						text: "Radius:",
						style: "padding-top: 0.3em; width: 50px"
					},
					// Input box for the radius value
					{
						xtype: "numberfield",
						name: "radius",
						ref: "../radiusField",
						fieldLabel: "Radius",
						decimalPrecision: 20,
						width: 60,
						allowBlank: false,
						value: this.defaultRadius,
						listeners: {
							change: function() {
								if(this.refOwner.featureCache) {
									this.refOwner.getBufferedPoint(this.refOwner.featureCache);
								}
							},
							specialkey: function(field, e) {
								if(e.getKey() == e.ENTER) {
									if(this.refOwner.featureCache) {
										this.refOwner.getBufferedPoint(this.refOwner.featureCache);
									}
								}
							}
						}
					},
					// dropdown for the radius unit
					this.createRadiusUnitCombo()
				]
			},
			{
				xtype: "compositefield",
				style: "padding: 2px 0; padding-left: 5px;",
				items: [
					// Label for Google geocoder combobox
					{
						xtype: "label",
						text: "Address:",
						style: "padding-top: 0.3em; width: 50px"
					},
					// Google geocoder combobox
					new gxp.form.GoogleGeocoderComboBox(Ext.apply({
						ref: "../geocodeAddrComboBox",
						listeners: {
							focus: this.disablePointTool,
							select: this.onComboSelect,
							scope: this
						}
					}, {emptyText: "Enter an address..."})),
					// Label to seperate geocoder combobox and point tool button
					{
						xtype: "label",
						text: "OR",
						style: "padding-top: 0.3em"
					},
					// Button to activate the control for adding points.
					new Ext.Button(
						new GeoExt.Action({
							ref: "../dropPointButton",
							iconCls: "gxp-icon-point",
							text: "Point&nbsp;&nbsp;",
							toggleGroup: "editingtools",
							enableToggle: true,
							deactivateOnDisable: true,
							map: map,
							control: this.control
						})
					)
				]
			}
		];


		this.on({
			// When this panel is destroyed, we need to make sure the "add point" control and
			// the selection layer are removed from the map.
			beforedestroy: function() {
				this.control.deactivate();
				map.removeControl(this.control);
				//this.dropPointButton.disable();
				//map.removeLayer(this.bufferPointLayer);
				this.removeLayer();
			},

			// Need to deactivate the draw control when the fieldset is collapsed or the query box
			// is closed. Will need to find the appropriate event. Might need to set event handler
			// on parent object(s).
			// beforehide doesn't work
			beforehide: function() {
				this.control.deactivate();
				this.dropPointButton.toggle(false);
			},

			scope: this
		});
	
		// Make sure to call the superclass's method.
		gxp.RadiusFilterPanelWithGeocode.superclass.initComponent.call(this);
	},

	// Adds the buffer to the point
	getBufferedPoint: function(evt) {
		// for point tool or geocode?
		// also update featureCache
		this.featureCache = typeof evt.feature === 'undefined' ? evt : evt.feature;
		var layer = this.bufferPointLayer;
		// Get the radius in meters
		var radius = this.allowedUnits[this.radiusUnitField.getValue()].convert(this.radiusField.getValue());
		
		// Execute a WPS call to buffer the point by the given radius
		this.target.tools[this.process].execute(
			//evt.feature,
			this.featureCache,
			radius,
			function(bufferedFeature) {
				// Remove the original point feature
				layer.removeAllFeatures();
				
				// Add the buffered feature to this tool's vector layer
				// (The buffer process should only be returning one feature)
				if (bufferedFeature) {
					layer.addFeatures([bufferedFeature]);
					layer.selectedFeatures = [bufferedFeature];
				}
			}
		);
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
		var filters = [];
		
		for(var i = 0; i < this.bufferPointLayer.selectedFeatures.length; i++){
			filters.push(new OpenLayers.Filter.Spatial({
				type: OpenLayers.Filter.Spatial.INTERSECTS,
				value: this.bufferPointLayer.selectedFeatures[i].geometry
			}));
		}
		
		return filters;
	},

	createRadiusUnitCombo: function() {
		// Create an array for the value/name pairs of allowed radius units
		var data = new Array(this.allowedUnits.length);
		for(var i = 0; i < this.allowedUnits.length; ++i) {
			data[i] = [i, this.allowedUnits[i].name];
		}

		// Just return the Ext configuration for a combo box
		return {
			xtype: "combo",
			ref: "../radiusUnitField",
			store: new Ext.data.SimpleStore({
				data: data,
				fields: ["value", "name"]
			}),
			value: this.getDefaultRadiusUnit(),
			editable: false,
			displayField: "name",
			valueField: "value",
			triggerAction: "all",
			mode: "local",
			width: 85,
			listeners: {
				select: function() {
					this.refOwner.getBufferedPoint(this.refOwner.featureCache);
				}
			}
		};
	},

	// Let's do a sanity check on the configured default radius unit
	getDefaultRadiusUnit: function() {
		if (this.defaultRadiusUnit >= 0 && this.defaultRadiusUnit < this.allowedUnits.length) {
			return this.defaultRadiusUnit;
		} else {
			// default to the first allowed unit
			return 0;
		}
	},

	// Keep this layer on top so the user can see it.
	raiseLayer: function() {
		var map = this.bufferPointLayer && this.bufferPointLayer.map;
		if (map) {
			map.setLayerIndex(this.bufferPointLayer, map.layers.length);
		}
	},

	// remove the layer from the map
	removeLayer: function() {
		if(this.bufferPointLayer.features.length > 0) {
			this.bufferPointLayer.removeAllFeatures();
		}
	},

	// clear and default fields
	clearFields: function() {
		this.geocodeAddrComboBox.setValue("");
		this.radiusField.setValue(this.defaultRadius);
		this.radiusUnitField.setValue(this.getDefaultRadiusUnit());
		this.disablePointTool();
		this.featureCache = null;
	},

	disablePointTool: function() {
		this.control.deactivate();
		this.dropPointButton.toggle(false);
	},

	// geocode combobox listener for select
	onComboSelect: function(combo, record) {
		var map = this.target.mapPanel.map;

		// get the location information for our point
		var location = record.get("viewport").clone().transform(
			new OpenLayers.Projection("EPSG:4326"),
			map.getProjectionObject()
		);

		// make sure that it fills the coords
		location.getCenterLonLat();
		var lon = location.centerLonLat.lon;
		var lat = location.centerLonLat.lat;

		// not sure what happens if it falls through to else
		if (location instanceof OpenLayers.Bounds) {
			//map.zoomToExtent(location, false);

			// create a feature from location info
			var feature = new OpenLayers.Feature.Vector(
				new OpenLayers.Geometry.Point(lon, lat)
			);

			// set the buffer from the feature point
			this.getBufferedPoint(feature);

			map.setCenter(new OpenLayers.LonLat(lon, lat));
		} else {
			map.setCenter(location);
		}
	}
});

/** api: xtype = gxp_radiusfilterpanelwithgeocode */
Ext.reg('gxp_radiusfilterpanelwithgeocode', gxp.RadiusFilterPanelWithGeocode); 
