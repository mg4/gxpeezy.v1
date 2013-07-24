/**
 * @requires plugins/QueryForm.js
 */

/** api: (define)
 *  module = opencop.plugins
 *  class = OpenCopQueryFormPanel
 */

/** api: (extends)
 *  plugins/QueryForm.js
 */
Ext.namespace("opencop.plugins");

/** api: constructor
 *  .. class:: OpenCopQueryFormPanel(config)
 *
 *    Plugin for performing queries on feature layers
 *    TODO Replace this tool with something that is less like GeoEditor and
 *    more like filtering.
 */
opencop.plugins.OpenCopQueryFormPanel = Ext.extend(gxp.plugins.QueryForm, {

	/** api: ptype = opencop_queryformpanel */
	ptype: "opencop_queryformpanel",

	/** api: config[queryFilters]
	 *  ``String``
	 *  Array of custom query filters.
	 */

	/** api: method[addOutput]
	 */
	addOutput: function(config) {
		var featureManager = this.target.tools[this.featureManager];

		// I'm redefining a bunch of stuff here because later on in some callback functions

		// I cannot dereference this.
		var target = this.target;

		// If filterPanels isn't defined, default it to an empty array.
		this.filterPanels = this.filterPanels || [];
		var filterPanels = this.filterPanels;
		var getFieldsetRef = this.getFieldsetRef;

		config = Ext.apply({
			border: false,
			bodyStyle: "padding: 10px",
			layout: "form",
			width: 320,
			autoScroll: false,
			items: [],
			bbar: [
				"->",
				{
					text: this.cancelButtonText,
					iconCls: "cancel",
					handler: function() {
						var ownerCt = this.outputTarget ? queryForm.ownerCt : queryForm.ownerCt.ownerCt;
						if (ownerCt && ownerCt instanceof Ext.Window) {
							ownerCt.hide();
						}

						addFilterBuilder(featureManager, featureManager.layerRecord, featureManager.schema);
						featureManager.loadFeatures();
					}
				},
				{
					text: this.queryActionText,
					iconCls: "gxp-icon-find",
					handler: function() {
						var filters = [];
					
						// Add our custom filters to the filter list
						for (var i = 0; i < filterPanels.length; i++) {
							var fieldset = queryForm[getFieldsetRef(filterPanels[i].ref)];
							if (fieldset.collapsed !== true) {
								filters.push.apply(filters, fieldset[filterPanels[i].ref].getFilters());
							}
						}
					
						featureManager.loadFeatures(
							filters.length > 1 ?
							new OpenLayers.Filter.Logical({
								type: OpenLayers.Filter.Logical.AND,
								filters: filters
							}) :
							filters[0]
						);
					},
					scope: this
				}
			]
		},
		config || {});

		// Add fieldsets for our custom filter panels
		for (var i = 0; i < this.filterPanels.length; i++) {
			config.items.push({
				xtype: "fieldset",
				ref: this.getFieldsetRef(this.filterPanels[i].ref),
				title: this.filterPanels[i].fieldsetTitle,
				//anchor: "97%",
				//style: "margin-bottom:0",
				//checkboxToggle: true,
				//collapsed: false,
				//collapsible: true,
				config: this.filterPanels[i].config
			});
		}

		var queryForm = gxp.plugins.QueryForm.superclass.addOutput.call(this, config);

		var expandContainer = null, userExpand = true;
		if (this.autoExpand) {
			expandContainer = Ext.getCmp(this.autoExpand);

			function stopAutoExpand() {
				if(userExpand) {
					expandContainer.un('expand', stopAutoExpand);
					expandContainer.un('collapse', stopAutoExpand);
					expandContainer = null;
				}
				userExpand = true;
			}

			expandContainer.on({
				'expand': stopAutoExpand,
				'collapse': stopAutoExpand
			});
		}

		var addFilterBuilder = function(mgr, rec, schema) {
			// Remove the custom filter panels from their fieldsets.
			// If we don't, the panels will just keep getting added each time the
			// query form is opened.
			for (var i = 0; i < filterPanels.length; i++) {
				queryForm[getFieldsetRef(filterPanels[i].ref)].removeAll();
			}
            
			queryForm.setDisabled(!schema);
			if (expandContainer) {
				userExpand = false;
				expandContainer[schema ? 'expand' : 'collapse']();

				// if we're wrapped in another collapsed container, expand it
				if(schema && expandContainer && expandContainer.ownerCt && expandContainer.ownerCt instanceof Ext.Panel) {
					expandContainer.ownerCt.expand();
                		}
			}

			// Here we add the actual custom filter panels to their respective fieldsets.
			for (var i = 0; i < filterPanels.length; i++) {
				// Need to make sure target gets passed in, for some reason target doesn't
				// automatically get passed to widgets, only plugins.
				filterPanels[i].target = target;
				queryForm[getFieldsetRef(filterPanels[i].ref)].add(filterPanels[i]);
			}

/*	
                queryForm.spatialFieldset.expand();
                queryForm.attributeFieldset.expand();
            } else {
                queryForm.attributeFieldset.rendered && queryForm.attributeFieldset.collapse();
                queryForm.spatialFieldset.rendered && queryForm.spatialFieldset.collapse();
*/
				
				// If the schema doesn't exist (i.e., a layer is selected that doesn't have a WFS (I think))
				// make sure the fieldsets for our custom filter panels are collapsed
/*
				for (var i = 0; i < filterPanels.length; i++) {
					var fieldset = queryForm[getFieldsetRef(filterPanels[i].ref)];
					fieldset.rendered && fieldset.collapse();
					//queryForm.radiusFieldset.rendered && queryForm.radiusFieldset.collapse();
				}
*/
/*
            }
            queryForm.attributeFieldset.doLayout();
*/
			
			// Calculate the layout for the fieldsets of our custom filter panels.
			for (var i = 0; i < filterPanels.length; i++) {
				var fieldset = queryForm[getFieldsetRef(filterPanels[i].ref)];
				fieldset.doLayout();
				//queryForm.radiusFieldset.doLayout();
			}
		};

		featureManager.on("layerchange", addFilterBuilder);
		addFilterBuilder(featureManager, featureManager.layerRecord, featureManager.schema);

		featureManager.on({
			"beforequery": function() {
				new Ext.LoadMask(
					queryForm.getEl(),
					{
						store: featureManager.featureStore,
						msg: this.queryMsg
					}
				).show();
			},
			"query": function(tool, store) {
				if (store) {
					if (this.target.tools[this.featureManager].featureStore !== null) {
						store.getCount() || Ext.Msg.show(
							{
								title: this.noFeaturesTitle,
								msg: this.noFeaturesMessage,
								buttons: Ext.Msg.OK,
								icon: Ext.Msg.INFO
							}
						);

						if (this.autoHide) {
							var ownerCt = this.outputTarget ? queryForm.ownerCt : queryForm.ownerCt.ownerCt;
							ownerCt instanceof Ext.Window && ownerCt.hide();
						}
					}
				}
			},
			scope: this
		});
        
		return queryForm;
	},
	
	getFieldsetRef: function(ref) {
		return ref + "Fieldset";
	}
});

Ext.preg(opencop.plugins.OpenCopQueryFormPanel.prototype.ptype, opencop.plugins.OpenCopQueryFormPanel);
