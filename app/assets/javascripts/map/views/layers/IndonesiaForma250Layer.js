/**
 * The FORMA 250 layer module.
 *
 * @return Forma250Layer class (extends TorqueLayerClass)
 */

define([
  'abstract/layer/TorqueLayerClass',
  'text!map/cartocss/Forma250Layer.cartocss'
], function(TorqueLayerClass, CartoCSS) {

  'use strict';

  var IndonesiaForma250Layer = TorqueLayerClass.extend({

    options: {
      table: 'indonesia_250_daily',
      column: 'date',
      data_aggregation: 'cumulative',
      cartocss: CartoCSS
    }

  });

  return IndonesiaForma250Layer;

});
