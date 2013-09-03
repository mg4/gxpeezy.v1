/**
 * Add all your dependencies here.
 *
 * @require widgets/Viewer.js
 * @require plugins/LayerTree.js
 * @require plugins/OLSource.js
 * @require plugins/OSMSource.js
 * @require plugins/WMSCSource.js
 * @require plugins/Zoom.js
 * @require plugins/ZoomToExtent.js
 * @require plugins/ZoomToSelectedFeatures.js
 * @require plugins/NavigationHistory.js
 * @require plugins/AddLayers.js
 * @require plugins/RemoveLayer.js
 * @require RowExpander.js
 * @require plugins/FeatureManager.js
 * @require plugins/FeatureGridWithCSVExport.js
 * @require OpenLayers/WPSClient.js
 * @require plugins/OpenCopQueryFormPanel.js
 * @require plugins/BufferFeature.js
 * @require widgets/DateFilterPanel.js
 * @require widgets/AttributeFilterPanel.js
 * @require widgets/RadiusFilterPanelWithGeocode.js
 * @require overrides/override-ext-ajax.js
 * @require plugins/WMSGetFeatureInfo.js
 * @require plugins/Help.js
 */

var defaultLayer;

var app = new gxp.Viewer({
	portalConfig: {
		layout: "border",
		region: "center",
		//renderTo: "map",
		//height: 800,

		// by configuring items here, we don't need to configure
		// portalItems and save a wrapping container
		items: [
			{
				id: "centerpanel",
				xtype: "panel",
				layout: "fit",
				region: "center",
				border: false,
				items: ["mymap"]
			},
			{
				id: "westpanel",
				xtype: "panel",
				layout: "fit",
				region: "west",
				width: 375,
                border: true,
				title: "<< Filters",
				titleCollapse: true,
				collapsible: true,
				//collapsed: true,
				//forceLayout: true,
				//collapseMode: "mini",
				//hideCollapseTool: true,
				//split: true,
				//floating: true,
				animCollapse: true
				//activeItem: "queryformpanel"
				//activeItem: 1
			},
			{
				id: "southpanel",
				xtype: "container",
				layout: "fit",
				region: "south",
				border: false,
				titleCollapse: true,
				collapsible: true,
				split: true,
				height: 200
			}
		]
	},
    
	// configuration of all tool plugins for this application
	tools: [
		{
			ptype: "gxp_zoomtoselectedfeatures",
			actionTarget: "map.tbar",
			featureManager: "featuremanager",
			menuText: "Zoom to selected features"
		},
        /*
		{
			ptype: "gxp_wmsgetfeatureinfo",
			format: "grid",
			actionTarget: "map.tbar",
            controlOptions: {
                queryVisible: false
            }
			//defaultAction: 0,
			//autoActivate: true
		},
        */
/*
		{
			ptype: "gxp_addlayers",
			actionTarget: "map.tbar"
		},
		{
			ptype: "gxp_removelayer",
			actionTarget: "map.tbar"
		},
*/
		{
			ptype: "gxp_zoomtoextent",
			actionTarget: "map.tbar"
		},
		{
			ptype: "gxp_zoom",
			actionTarget: "map.tbar"
		},
		{
			ptype: "gxp_navigationhistory",
			actionTarget: "map.tbar"
		},
		{
			ptype: "gxp_help",
			actionTarget: "map.tbar"
		},
	
		/**
		 * Query Tools:
		 * Feature Manager - Handles behind the scenes loading
		 * of vector layers for the selected WMS layer. No visible
		 * action or output.
		 */
		{
			ptype: "gxp_featuremanager",
			id: "featuremanager",
			paging: false,
			//autoSetLayer: true,
			//autoLoadFeatures: true,
			symbolizer: {
				fillColor: "blue",
				fillOpacity: 1,
				strokeColor: "red",
				strokeOpacity: 1,
				graphicName: "triangle",
				pointRadius: 8
			},
			selectStyle: {
				fillColor: "yellow",
				fillOpacity: 1,
				strokeColor: "red",
				strokeOpacity: 1,
				graphicName: "triangle",
				pointRadius: 9
			},
			maxFeatures: 2000
		},

		/**
		 * Feature Grid - Table showing all the features for the
		 * selected layer. When used with the QueryForm, will show
		 * only the features matching the query's criteria.
		 */
		{
			ptype: "gxp_featuregrid",
			featureManager: "featuremanager",
			selectOnMap: true,
			//autoLoadFeature: true, // Uses WMS.GetFeatureInfo to select a feature
			displayMode: "all", // Only show the vector layer for the selected feature, not every feature
			alwaysDisplayOnMap: true, // Always show the vector layer on the map, no button in the grid toolbar
			outputConfig: {
				id: "grid",
				title: "Query Results",
				loadMask: true
			},
			controlOptions: {
				multiple: true,
				toggle: true
			},
			showExportCSV: true,
            displayExportCSVText: "Export to Excel",
			outputTarget: "southpanel"
/*
				columns: {
						FIRST: "First Name",
						LAST: "Last Name",
						STREET_NUMBER: "Street Number",
						STREET_NAME: "Street Name",
						STREET_TYPE: "Street Type",
						CITY: "City",
						STATE: "State",
						GRID: "Grid",
						ArrestDate: "Date Arrested",
					}
*/
		},
	
		/**
		 * Buffer Feature - Tool that will take a feature, call a
		 * buffer WPS process, and return a buffered feature. This
		 * is used in the Query by radius filter panel of the
		 * Query Form.
		 */
		{
			ptype: "gxp_bufferfeature",
			id: "bufferfeature",
			wpsClient: new OpenLayers.WPSClient({
				servers: {
					local: "/geoserver/wps"
				}
			}),
			process: {
				server: "local",
				name: "JTS:buffer"
			}
		}, 
	
		/**
		 * Feature Manager - Same kind of feature manager as before,
		 * but this one will be used in the feature intersection tool.
		 */
/*
		{
			ptype: "gxp_featuremanager",
			id: "intersection_fm",
			paging: false,
			autoSetLayer: true,
			autoLoadFeatures: true
		},
*/

		/**
		 * Feature Intersection - Tool that will use the geometry of
		 * feature(s) from one layer as an intersection filter for
		 * the queried layer. Requires its own feature manager to
		 * handle selecting features from the map to use as filtering
		 * parameters.
		 */
/*
		{
			ptype: "gxp_featureintersection",
			id: "featureintersection",
			featureManager: "intersection_fm",
			controlOptions: {
				multiple: true,
				toggle: true
			}
		},
*/
	
		/**
		 * OpenCOP Query Form Panel - A customized version of the standard
		 * GXP QueryForm that allows for additional query filters to
		 * be added to the form and displayed in a panel.
		 */
		{
			ptype: "opencop_queryformpanel",
			id: "queryformpanel",
			featureManager: "featuremanager",
			actions: null,
			actionTarget: null,
			//actionTarget: ["map.tbar"],
			outputConfig: {
				title: null
			},
			outputTarget: "westpanel",
			filterPanels: [
				{
					xtype: "gxp_datefilterpanel",
					ref: "dateFilter",
					fieldsetTitle: "Filter by arrest date",
					config: {
						dateAttribute: "ARREST_DATE_TIME"
						//defaultDate: "now"
					}
				},
/*
				{
					xtype: "gxp_intersectionfilterpanel",
					ref: "intersectionFilter",
					fieldsetTitle: "Filter by feature intersection",
					process: "featureintersection"
				},
*/
				{
					xtype: "gxp_radiusfilterpanelwithgeocode",
					ref: "radiusFilter",
					fieldsetTitle: "Filter by radius",
					process: "bufferfeature",
					defaultRadius: 2
				},
				{
					xtype: "gxp_attributefilterpanel",
					ref: "attributeFilter",
					fieldsetTitle: "Filter by attribute",
					config: {
						attributes: [
							{
								name: "FIRST",
								label: "First Name",
								type: "textfield"
							},
							{
								name: "LAST",
								label: "Last Name",
								type: "textfield"
							},
							{
								name: "RACE",
								label: "Race",
								type: "combo",
                                choices: [
                                    ["W", "White"],
                                    ["B", "Black"],
                                    ["A", "Asian"]
                                ]
							},
                            {
                                name: "SEX",
                                label: "Sex",
                                type: "combo",
                                choices: [
                                    ["M", "Male"],
                                    ["F", "Female"]
                                ]
                            },
							{
								name: "DOB",
								label: "Year of Birth",
								type: "yearrange"
							},
							{
								name: "CCN",
								label: "CCN",
								type: "numberfield"
							},
							{
								name: "ATN",
								label: "ATN",
								type: "numberfield"
							},
							{
								name: "STREET_NUMBER",
								label: "Street No",
								type: "textfield"
							},
							{
								name: "STREET_NAME",
								label: "Street Name",
								type: "textfield"
							},
							{
								name: "CITY",
								label: "City",
								type: "textfield"
							},
							{
								name: "STATE",
								label: "State",
								type: "textfield"
							},
							{
								name: "GRID",
								label: "Grid",
								type: "numberfield"
							}
						]
					}
					//process: "datefeature"
				}
			]
		}
        /*,
		{
			ptype: "gxp_layertree",
			outputConfig: {
				id: "tree",
				border: true,
				title: "Layers",
				tbar: [] // add buttons to "tree.bbar" later
			},
			outputTarget: "westpanel"
		}
        */
	],
    
	/*
	 * Using the GeoExplorer proxy because the GeoServer Proxy included in
	 * the OpenGeo Suite doesn't do POST properly. Unfortunately the
	 * GeoExplorer proxy doesn't work in debug mode because the app will
	 * most likely be running on port 9080 and GeoExplorer will most likely
	 * be on 8080.
	 */
	//proxy: "/geoexplorer/proxy/?url=",
	
	/**
	 * If the GeoServer proxy is working properly, you can use that one
	 * instead and it will work in debug and deployed modes.
	 */
	proxy: "/geoserver/rest/proxy?url=",
	
	/**
	 * The GXP SDK has a built-in proxy when in debug mode but not when
	 * deployed.
	 */
	//proxy: "/proxy/?url=",
	
	defaultSourceType: "gxp_wmssource",
	
	// layer sources
	sources: {
		"local": {
			ptype: "gxp_wmssource",
			url: "/geoserver/wms",
			version: "1.1.1"
		},
		"google": {
			ptype: "gxp_googlesource"
		},
		"osm": {
			ptype: "gxp_osmsource"
		}
	},
    
	// map and layers
	map: {
		id: "mymap", // id needed to reference map in portalConfig above
		projection: "EPSG:900913",
		//center: [-10764594.758211, 4523072.3184791],
		center: [-10020000, 3456000],
		zoom: 9,
		//maxExtent: [-10503310.61577,3324531.32344,-9859850.98707,3933519.90060],
		//restrictedExtent: [-10503310.61577,3324531.32344,-9859850.98707,3933519.90060],
		//maxExtent: [-20037508,-20037508,20037508,20037508],
		//maxExtent: [-1.04688395642358,3357106.1917930474,-9880533.61799454,3897899.8140160986],
		//restrictedExtent: [-120,29,-10,33],
		tbar: {
			id: "geocoder"
		},
		layers: [
			{
				source: "osm",
				name: "mapnik",
				group: "background"
			},
			{
				source: "local",
				name: "LA:parishes_ldotd_2007",
				visibility: true,
				selected: false,
				group: "default"
			},
			{
				source: "local",
				name: "JPSO:ARMMS",
				visibility: false,
				selected: true
			},

			/**
			 * Background layers
			 */
/*
			{
				source: "google",
				name: "TERRAIN",
				group: "background"
			},
			{
				source: "google",
				name: "SATELLITE",
				group: "background"
			},
			{
				source: "google",
				name: "HYBRID",
				group: "background"
			},
			{
				source: "google",
				name: "ROADMAP",
				group: "background"
			}
            */
		],
		items: [
			{
				xtype: "gx_zoomslider",
				vertical: true,
				height: 100
			}
		]
	}
});

