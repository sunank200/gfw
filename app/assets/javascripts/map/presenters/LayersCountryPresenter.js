/**
 * The LayersCountryPresenter class for the LayersNavView.
 *
 * @return LayersCountryPresenter class.
 */
define([
  'underscore',
  'mps',
  'topojson',
  'map/presenters/PresenterClass',
  'map/services/LayerSpecService',
  'helpers/geojsonUtilsHelper',
  'map/services/CountryService',

], function(_, mps, topojson, PresenterClass, layerSpecService, geojsonUtilsHelper, countryService) {

  'use strict';

  var StatusModel = Backbone.Model.extend({
    defaults: {
      iso: null,
      dont_analyze: true
    }
  });

  var LayersCountryPresenter = PresenterClass.extend({

    init: function(view) {
      this.view = view;
      this._super();
      this.status = new StatusModel();
      this.listeners();
      mps.publish('Place/register', [this]);
    },

    getPlaceParams: function() {
      var p = {};
      p.iso = this.status.get('iso');
      p.dont_analyze = this.status.get('dont_analyze');
      return p;
    },

    listeners: function() {
      this.status.on('change:iso', this.countryAtlas.bind(this));
    },

    /**
     * Application subscriptions.
     */
    _subscriptions: [{
      'Place/go': function(place) {
        var params = place.params;
        
        this.status.set('dont_analyze', params.dont_analyze);

        if(!!params.iso.country && params.iso.country !== 'ALL'){
          this.view.setCountry(params.iso);          
          this.status.set('iso', params.iso);
        }
      }
    },{
      'Country/update': function(iso) {
        var currentIso = iso;
        var previousIso = this.status.get('iso');

        // Reset country layers only when the country are different or null
        if (!!previousIso && (currentIso.country != previousIso.country || ! !!currentIso.country)) {
          this.view.resetCountryLayers();
        }

        this.view.setCountry(iso);
        this.status.set('iso', _.clone(iso));
      }
    },{
      'Country/layers': function(layers) {
        this.view.setLayers(layers);
      }
    },{
      'Analysis/dont_analyze': function(enabled) {
        this.status.set('dont_analyze', enabled);
      }
    },{
      'Analysis/enabled': function(boolean) {
        this.view.setAnalysisButtonStatus(boolean);
      }
    },{
      'Subscribe/enabled': function(boolean) {
        this.view.setSubscribeButtonStatus(boolean);
      }
    }],



    notificate: function(id){
      mps.publish('Notification/open', [id]);
    },

    /**
     * Publish a a Country/update.
     *
     * @param  {object} iso: {country:'xxx', region: null}
     */
    publishIso: function(iso) {
      this.status.set('iso', iso);
      this.status.set('dont_analyze', true);        
      mps.publish('Country/update', [iso]);
      mps.publish('Analysis/dont_analyze', [this.status.get('dont_analyze')]);
      mps.publish('Place/update', [{go: false}]);

      // Fit country bounds
      this.countryBounds();
    },

    /**
     * Country bounds
     *
     * @param  {object} iso: {country:'xxx', region: null}
     */
    countryBounds: function() {
      var iso = this.status.get('iso');

      if(!!iso.country && iso.country !== 'ALL'){
        countryService.execute(iso.country, _.bind(function(results) {
          var objects = _.findWhere(results.topojson.objects, {
            type: 'MultiPolygon'
          });
          var geojson = topojson.feature(results.topojson,objects);

          var bounds = geojsonUtilsHelper.getBoundsFromGeojson(geojson);
          if (!!bounds) {
            mps.publish('Map/fit-bounds', [bounds]);
          }
        },this));
      }
    },

    /**
     * Country atlas
     *
     * @param  {object} iso: {country:'xxx', region: null}
     */
    countryAtlas: function() {
      var iso = this.status.get('iso');

      if(!!iso && !!iso.country && iso.country !== 'ALL'){
        countryService.execute(iso.country, _.bind(function(results) {
          var is_more = (!!results.indepth);
          var is_idn = (!!iso && !!iso.country && iso.country == 'IDN');
          
          if (is_more) {
            this.view.renderAtlas({
              name: results.name,
              url: results.indepth, 
              is_idn: is_idn
            });            
          }

        },this));
      }
    },

    /**
     * Analyze iso
     *
     * @param  {object} iso: {country:'xxx', region: null}
     */
    analyzeIso: function() {
      var iso = this.status.get('iso');
      this.status.set('dont_analyze', null);
      mps.publish('Analysis/iso', [iso]);
      mps.publish('Tab/open', ['#analysis-tab-button']);      
    },

    /**
     * Subscribe iso
     *
     * @param  {object} iso: {country:'xxx', region: null}
     */
    subscribeIso: function() {
      var iso = this.status.get('iso');
      mps.publish('Subscribe/iso', [iso]);
    },

    /**
     * Publish a a LayerNav/change.
     *
     * @param  {object} layerSpec
     */
    _toggleLayer: function(layerSlug) {
      var where = [{slug: layerSlug}];

      layerSpecService.toggle(where,
        _.bind(function(layerSpec) {
          mps.publish('LayerNav/change', [layerSpec]);
          mps.publish('Place/update', [{go: false}]);
        }, this));
    },

    _removeLayer: function(layer) {
      // Get current active layers from layerspec
      var currentLayers = layerSpecService._getLayers();

      if (!!layer.wrappers) {
        // Check if any of the wrapped layers is active and toggle it
        _.each(layer.wrappers, function(wrap_layer) {
          if (!!currentLayers[wrap_layer.slug]) {
            this._toggleLayer(wrap_layer.slug);
          }
        }.bind(this));
      } else {
        // Check if any of the regular layers is active and toggle it
        if (!!currentLayers[layer.slug]) {
          this._toggleLayer(layer.slug);
        }        
      }
    },

  });

  return LayersCountryPresenter;
});
