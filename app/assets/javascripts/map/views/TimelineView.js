/**
 * The TimelineView class for the Google Map.
 *
 * @return TimelineView class (extends Backbone.View)
 */
define([
  'backbone',
  'underscore',
  'handlebars',
  'views/Widget',
  'presenters/TimelinePresenter',
  'text!templates/timeline.handlebars'
], function(Backbone, _, Handlebars, Widget, Presenter, tpl) {

  'use strict';

  var TimelineView = Widget.extend({

    className: 'widget widget-timeline',

    template: Handlebars.compile(tpl),

    options: {
      hidden: true,
      boxClosed: false
    },

    initialize: function() {
      this.presenter = new Presenter(this);
      this.currentTimeline = null;
      TimelineView.__super__.initialize.apply(this);
    },

    _cacheSelector: function() {
      TimelineView.__super__._cacheSelector.apply(this);
      this.$timelineName = this.$el.find('.timeline-name');
      this.$timelineLatlng = this.$el.find('.timeline-latlng');
    },

    update: function(layerTitle) {
      var html = this.template({
        layerTitle: layerTitle
      });

      this._update(html);
    },

    getCurrentDate: function() {
      if (this.currentTimeline) {
        return this.currentTimeline.getCurrentDate();
      }
    }
  });

  return TimelineView;
});
