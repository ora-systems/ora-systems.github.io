var glu = require('pex-glu');
var color = require('pex-color');
var Context = glu.Context;
var Material = glu.Material;
var Program = glu.Program;
var Color = color.Color;
var merge = require('merge');
var fs = require('fs');

var MayoMaterialGLSL = fs.readFileSync(__dirname + '/MayoMaterial.glsl', 'utf8');

function MayoMaterial(uniforms) {
  this.gl = Context.currentContext;
  var program = new Program(MayoMaterialGLSL);
  var defaults = {
    pointSize: 1,
    calories: 0
  };
  uniforms = merge(defaults, uniforms);
  Material.call(this, program, uniforms);
}

MayoMaterial.prototype = Object.create(Material.prototype);

module.exports = MayoMaterial;