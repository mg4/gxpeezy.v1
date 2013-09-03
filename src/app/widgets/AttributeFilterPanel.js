
/**
 * @require OpenLayers/Handler/Point.js
 * @require OpenLayers/Handler/Path.js
 * @require OpenLayers/Handler/Polygon.js
 */

/** api: (define)
 *  module = gxp
 *  class = AttributeFilterPanel
 *  base_link = `Ext.Panel <http://extjs.com/deploy/dev/docs/?class=Ext.Panel>`_
 */
Ext.namespace("gxp");

/** api: constructor
 *  .. class:: AttributeFilterPanel(config)
 *   
 *      Create a panel for assembling radius filters.
 */
gxp.AttributeFilterPanel = Ext.extend(Ext.Panel, {
	
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
		// Get the map object
		var map = this.target.mapPanel.map;

		// set date attribute and thow error if undefined
		if(this.config.attributes) {
			this.attributes = this.config.attributes;
		} else {
			throw new Error("You must set the attributes option within AttributeFilterPanel.config.");
		}

		// Set up the UI elements for this filter panel.
		// Use composite fields to align and place in seperate rows.
		this.items = [];
		for(var i=0; i<this.attributes.length; i++) {
            var compositeFieldItems = [
                // Label for attribute
                {
                    xtype: "label",
                    text: this.attributes[i].label + ":",
                    style: "padding-left: 5px; padding-top: 0.3em; width: 75px; text-alight: right"
                }
            ];

            if (this.attributes[i].type == "yearrange") {
                compositeFieldItems.push({
                    xtype: "numberfield",
                    name: this.attributes[i].name + "_start",
                    ref: "../" + this.attributes[i].name + "_start",
                    fieldLabel: this.attributes[i].name + "_start",
                    allowDecimals: false,
                    allowNegative: false,
                    minLength: 4,
                    maxLength: 4,
                    width: 49
                });
                compositeFieldItems.push({
                    xtype: "label",
                    text: "to"
                });
                compositeFieldItems.push({
                    xtype: "numberfield",
                    name: this.attributes[i].name + "_end",
                    ref: "../" + this.attributes[i].name + "_end",
                    fieldLabel: this.attributes[i].name + "_end",
                    allowDecimals: false,
                    allowNegative: false,
                    minLength: 4,
                    maxLength: 4,
                    width: 49
                });
            } else {
                compositeFieldItems.push({
                    // Field for attribute filter
                    xtype: this.attributes[i].type,
                    name: this.attributes[i].name,
                    ref: "../" + this.attributes[i].name,
                    fieldLabel: this.attributes[i].name,
                    mode: "local",
                    valueField: "myId",
                    displayField: "displayText",
                    editable: true,
                    forceSelection: true,
                    autoSelect: true,
                    typeAhead: true,
                    triggerAction: 'all',
                    store: new Ext.data.ArrayStore({
                        fields: [
                            'myId',
                            'displayText'
                        ],
                        data: this.attributes[i].choices
                    }),
                    width: 120
                    //allowBlank: false
                });
            }
			this.items.push(
				{
					xtype: "compositefield",
					//width: 400,
					items: compositeFieldItems,
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
		gxp.AttributeFilterPanel.superclass.initComponent.call(this);
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

		var value, type;
		for(var i=0; i<this.attributes.length; i++) {
			type = this.attributes[i].type;

            if (type == "yearrange") {
                Array.prototype.push.apply(filters, this.getYearRangeFilter(i));
                continue;
            }

			value = this[this.attributes[i].name].getValue();
			if(value) {
				if(type == "numberfield") {
					// default to EQUAL_TO for number filter
					filters.push(new OpenLayers.Filter.Comparison(
						{
							type: OpenLayers.Filter.Comparison.EQUAL_TO,
							property: this.attributes[i].name,
							value: this[this.attributes[i].name].getValue()
						}
					));
                } else if(type == "datefield") {
                    // Use the dateParse function
					filters.push(new OpenLayers.Filter.Comparison(
						{
							type: OpenLayers.Filter.Comparison.EQUAL_TO,
							property: this.attributes[i].name,
							value: this.formatDateForQuery( this[this.attributes[i].name].getValue() )
						}
					));
				} else {
					// default to ILIKE for string filter
					filters.push(new OpenLayers.Filter.Comparison(
						{
							type: OpenLayers.Filter.Comparison.LIKE,
							property: this.attributes[i].name,
							value: "*" + this[this.attributes[i].name].getValue() + "*",
							matchCase: false
						}
					));
				}
			}
		}

		return filters;
	},

    getYearRangeFilter: function(i) {
        var startValue = this[this.attributes[i].name + "_start"].getValue();
        var endValue = this[this.attributes[i].name + "_end"].getValue();

        if (!startValue && !endValue) { 
            return [];
        }

        var startDate, endDate;

        if (startValue && endValue) {
            startDate = new Date(startValue, 0, 1, 0, 0, 0, 0);
            endDate = new Date(endValue + 1, 0, 1, 0, 0, 0, 0);
        } else if (startValue) {
            startDate = new Date(startValue, 0, 1, 0, 0, 0, 0);
            endDate = new Date(startValue + 1, 0, 1, 0, 0, 0, 0);
        } else if (endValue) {
            startDate = new Date(endValue, 0, 1, 0, 0, 0, 0);
            endDate = new Date(endValue + 1, 0, 1, 0, 0, 0, 0);
        }

        var filters = [];
        if (startDate && endDate) {
			// date attribute is after start date
			filters.push(new OpenLayers.Filter.Comparison(
				{
					type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
					property: this.attributes[i].name,
					value: this.formatDateForQuery(startDate)
				}
			));

			// date attribute is before end date
			filters.push(new OpenLayers.Filter.Comparison(
				{
					type: OpenLayers.Filter.Comparison.LESS_THAN,
					property: this.attributes[i].name,
					value: this.formatDateForQuery(endDate)
				}
			));
         }
         return filters;
    },
    
    // Used to format the datetime returned from the datetime fields to the correct format needed in the query
	formatDateForQuery: function(datestamp) {
		var d = new Date(datestamp);
        var formattedDate = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + "T" + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();

        return new OpenLayers.Filter.Function({
            name: "dateParse",
            params: ["yyyy-MM-dd'T'HH:mm:ss", formattedDate]
        });
	},

	clearFields: function() {
		for(var i=0; i<this.attributes.length; i++) {
            if (this.attributes[i].type == "yearrange") {
                this[this.attributes[i].name + "_start"].setValue("");
                this[this.attributes[i].name + "_end"].setValue("");
            } else {
                this[this.attributes[i].name].setValue("");
            }
		}
	}
});

/** api: xtype = gxp_attributefilterpanel */
Ext.reg('gxp_attributefilterpanel', gxp.AttributeFilterPanel); 
