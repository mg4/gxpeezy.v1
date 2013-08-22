
/**
 * @require widgets/form/ExtendedDateField.js
 */

/** api: (define)
 *  module = gxp
 *  class = DateFilterPanel
 *  base_link = `Ext.Panel <http://extjs.com/deploy/dev/docs/?class=Ext.Panel>`_
 */
Ext.namespace("gxp");

/** api: constructor
 *  .. class:: DateFilterPanel(config)
 *   
 *      Create a panel for assembling radius filters.
 */
gxp.DateFilterPanel = Ext.extend(Ext.Panel, {
	
	// custom options
	config: {
		dateAttribute: null,
		defaultDate: null
	},

	/** api: config[dateAttribute]
	 *  ***REQUIRED***
	 *  ``String``
	 *  The name of the attribute to filter by in our query.
	 */
	dateAttribute: null,

	/** api: config[defaultDate]
	 *  ``String``
	 *  The date to set as the default start date.  This can be a date string (able
	 *  to be parsed by the JS date parser) or "now" to use the current date/time. 
	 */
	defaultDate: null,
	
	// Used to format the datetime returned from the datetime fields to the correct format needed in the query
	formatDateForQuery: function(datestamp) {
		var d = new Date(datestamp*1000);
		return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + "T" + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
	},

	// Used to format the datetime defaulted to the datetime fields
	formatDateForFieldset: function(date) {
		var d = new Date(date);
		return d.getTime()/1000;
	},

	// This panel should not have a border by default.
	border: false,
	
	/** private: method[initComponent]
	 */
	initComponent: function() {	
		// Get the map object
		var map = this.target.mapPanel.map;

		// set date attribute and thow error if undefined
		if(this.config.dateAttribute) {
			this.dateAttribute = this.config.dateAttribute;
		} else {
			throw new Error("You must set the dateAttribute option within DateFilterPanel.config.");
		}

		// set the default date, if defined
		if(this.config.defaultDate == "now") {
			this.defaultDate = this.formatDateForFieldset(new Date());
		} else if(this.config.defaultDate) {
			if(!isNaN((new Date(this.config.defaultDate)).getTime())) {
				this.defaultDate = this.formatDateForFieldset(this.config.defaultDate);
			} else {
				throw new Error("You must set the defaultDate option to a valid date format within DateFilterPanel.config.");
			}
		}
		
		// Set up the UI elements for this filter panel.
		// Use composite fields to align and place in seperate rows.
		this.items = [
			// composite field for start date
			{
				xtype: "compositefield",
				items: [
					// Label for Start Date
					{
						xtype: "label",
						text: "Start Date:",
						style: "padding-left: 5px; padding-top: 0.3em; width: 75px;"
					},
					// Date input field for the start date value
					{
						xtype: "gxp_datetimefield",
						name: "startdate",
						ref: "../startDateField",
						fieldLabel: "StartDate",
						allowBlank: true,
						value: this.defaultDate
					}
				],
				style: "padding: 2px 0;"
			},
			// composite field for end date
			{
				xtype: "compositefield",
				items: [
					// Label for End Date
					{
						xtype: "label",
						text: "End Date:",
						style: " padding-left: 5px; padding-top: 0.3em; width: 75px;"
					},
					// Date input field for the end date value
					{
						xtype: "gxp_datetimefield",
						name: "enddate",
						ref: "../endDateField",
						fieldLabel: "EndDate",
						allowBlank: true
					}
				],
				style: "padding: 2px 0;"
			}
		];

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
		gxp.DateFilterPanel.superclass.initComponent.call(this);
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

		if(this.startDateField.getValue() && this.endDateField.getValue()) {
			// date attribute is between start and end date
			filters.push(new OpenLayers.Filter.Comparison(
				{
					type: OpenLayers.Filter.Comparison.BETWEEN,
					property: this.dateAttribute,
					lowerBoundary: this.formatDateForQuery(this.startDateField.getValue()),
					upperBoundary: this.formatDateForQuery(this.endDateField.getValue())
				}
			));
		} else if(this.startDateField.getValue()) {
			// date attribute is after start date
			filters.push(new OpenLayers.Filter.Comparison(
				{
					type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
					property: this.dateAttribute,
					value: this.formatDateForQuery(this.startDateField.getValue())
				}
			));
		} else if(this.endDateField.getValue()) {
			// date attribute is before end date
			filters.push(new OpenLayers.Filter.Comparison(
				{
					type: OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO,
					property: this.dateAttribute,
					value: this.formatDateForQuery(this.endDateField.getValue())
				}
			));
		}

		return filters;
	},

	// clear the fields
	clearFields: function() {
		this.startDateField.setValue("");
		this.endDateField.setValue("");
	}
});

/** api: xtype = gxp_datefilterpanel */
Ext.reg('gxp_datefilterpanel', gxp.DateFilterPanel); 
