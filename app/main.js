var Window        = require('pex-sys/Window');
var Color         = require('pex-color');
var Vec3          = require('pex-math/Vec3');
var Vec2          = require('pex-math/Vec2');
var Camera        = require('pex-cam').PerspCamera;
var Camera2D      = require('pex-cam').OrthoCamera;
var Arcball       = require('pex-cam').Arcball;
var GUI           = require('pex-gui');
var Halo          = require('ora-halo');
var isBrowser     = require('is-browser');
var isiOS         = require('is-ios');
var urify         = require('urify');
var fx            = require('pex-fx');
var random        = require('pex-random');

var ASSETS_PATH = isBrowser ? '/assets' : __dirname + '/../assets';

var State = {
  halo: null,
  camera: null,
  arcball: null,
  size: 0.6,
  color: 0.05,
  colorStr: '0.5,0.5',
  colorCenter: 0.0,
  colorCenterRatio: 0.0,
  highlightRing: 0.8,
  complexity: 0.7,
  brightness: 1,
  speed: 0.5,
  colorTextureIndex: 0,
  wobble: 0,
  wobbleFadeout: 1,
  debug: true,
  growth: 0.01,
  background: [0,0,0,1],
  glow: 0.75,
  growth: 0.05,
  solidLines: true,
  showGrid: false,
  evenLineDistribution: true,
  minRingRadius: 0.35,
  minNumRings: 10,
  maxNumRings: 80,
  ringResolution: 128,
  auraOpacity: 0.5,
  waveColor: 0.5,
  waveCount: 0,
  waveIntensity: 0,
  waveSpeed: 0.15,
  stratified: false,
  lateralSpeedup: 2,
  horizontalNoiseScale: 1,
  complexityFrequency: 1.2,
  tilt: 0
}

function HaloSetMode(mode) {
  if (!State.halo) return;
  State.halo.setMode(mode);
}

function HaloSetGlobalParam(name, value) {
  if (!State.halo) return;

  State.dirty = true;

  if (name == 'scale') {
      State.camera.setFov(value);
  }
  else {
      State.halo.setGlobalParam(name, value);
  }
}

function HaloSetGlobalParams(params) {
  if (!State.halo) return;
  Object.keys(params).forEach(function(paramName) {
    HaloSetGlobalParam(paramName, params[paramName]);
  });
}

function HaloResetCamera(mode) {
  if (!State.arcball) return;
  State.arcball.setPosition([1,1,1])
}

function HaloAddTimeStamp(params) {
  if (!State.halo) return;
  State.halo.addTimeStamp(params);
}

function HaloResetTimeStamps() {
  if (!State.halo) return;
  State.halo.ringInstances = [];
  State.halo.waveInstances = [];
}

function HaloSetTimeStampParam(i, name, value) {
  if (!State.halo) return;
  State.halo.setTimeStampParam(i, name, value);
}

function HaloInitialize(userOpts) {
  console.log('HaloInitialize', userOpts || '')
  opts = {
    width: 1280,
    height: 720,
    scale: 100,
    limitedGUI: false
  };
  for (var p in userOpts) {
    if (userOpts.hasOwnProperty(p)) {
      if (p == 'initialState') {
        var hstate = userOpts[p];
        for (var q in hstate) {
          if (hstate.hasOwnProperty(q)) {
            State[q] = hstate[q];
          }
        }
      } else {
        opts[p] = userOpts[p];
      }
    }
  }

  if (opts.assetsPath) {
    ASSETS_PATH = opts.assetsPath;
  }
  Window.create({
    settings: {
      width: opts.width,
      height: opts.height,
      canvas: isBrowser ? document.getElementById('haloCanvas') : null,
      fullScreen: opts.fullScreen,
      pixelRatio: isiOS ? 2 : 1
    },
    init: function() {
      var ctx = this.getContext();
      var width = this.getWidth();
      var height = this.getHeight();

      this.fx = fx(ctx);

      State.halo = this.halo = new Halo(ctx, this, {
        lineDotsTexture: isBrowser ? urify(__dirname + '/../assets/textures/line-dots.png') : ASSETS_PATH + '/textures/line-dots.png',
        lineSolidTexture: isBrowser ? urify(__dirname + '/../assets/textures/line-solid.png') : ASSETS_PATH + '/textures/line-solid.png',
        colorTexture: isBrowser ? urify(__dirname + '/../assets/textures/calories-gradient-v2.png') : ASSETS_PATH + '/textures/calories-gradient-v2.png',
        colorTextureOld: isBrowser ? urify(__dirname + '/../assets/textures/calories-gradient.png') : ASSETS_PATH + '/textures/calories-gradient.png',
        gridColorTexture: isBrowser ? urify(__dirname + '/../assets/textures/line-solid.png') : ASSETS_PATH + '/textures/line-solid.png',
      });

      Object.keys(State).forEach(function(param) {
          this.halo.setGlobalParam(param, State[param]);
      }.bind(this))

      this.initGUI();

      var fov = opts.scale;

      State.camera = new Camera(fov, width / height);
      State.camera.setPosition([0,3,0]);
      State.camera.setUp([0,0,1]);
      State.camera2D = new Camera2D(0, 0, width, height);
      if (opts.arcball !== false) {
        State.arcball = new Arcball(State.camera, width, height);
        this.addEventListener(State.arcball);
      }

      ctx.setProjectionMatrix(State.camera.getProjectionMatrix());
      ctx.setViewMatrix(State.camera.getViewMatrix())
    },
    onWindowResize: function() {
        State.camera.setAspectRatio(this.getWidth()/this.getHeight());
        this.ctx.viewport(0, 0, this.getWidth(), this.getHeight());
    },
    initGUI: function() {
      this.gui = new GUI(this.getContext(), this.getWidth(), this.getHeight());
      this.addEventListener(this.gui);

      if (isBrowser && (opts.gui !== true)) this.gui.toggleEnabled();
      else if (isiOS) this.gui.toggleEnabled();

      this.gui.addHeader('Global Params')
      this.gui.addParam('Tilt', State, 'tilt', { min: -90, max: 90 }, function(value) {
        this.halo.setGlobalParam('tilt', value)
      }.bind(this))
      if (opts.limitedGUI !== true) {
          this.gui.addParam('Global size', State, 'size', {}, function(value) {
            this.halo.setGlobalParam('size', value);
          }.bind(this));
          this.gui.addParam('Global color', State, 'color', {}, function(value) {
            this.halo.setGlobalParam('color', value);
          }.bind(this));
          this.gui.addParam('Global color (multiple)', State, 'colorStr', {}, function(value) {
            var colorRatios = value.split(',')
                .map(function(str) {
                    return parseFloat(str)
                })
                .filter(function(f) {
                    return !isNaN(f);
                });
            console.log('colorRatios', colorRatios);
            this.halo.setGlobalParam('color', colorRatios);
          }.bind(this));
          this.gui.addParam('Global color center', State, 'colorCenter', {}, function(value) {
            this.halo.setGlobalParam('colorCenter', value);
          }.bind(this));
          this.gui.addParam('Global color ratio', State, 'colorCenterRatio', {}, function(value) {
            this.halo.setGlobalParam('colorCenterRatio', value);
          }.bind(this));
      }
          this.gui.addParam('Global complexity', State, 'complexity', {}, function(value) {
            this.halo.setGlobalParam('complexity', value);
          }.bind(this));
          this.gui.addParam('Global wobble', State, 'wobble', {}, function(value) {
            this.halo.setGlobalParam('wobble', value);
          }.bind(this));
          this.gui.addParam('Global wobble fadeout', State, 'wobbleFadeout', {}, function(value) {
            this.halo.setGlobalParam('wobbleFadeout', value);
          }.bind(this));
          this.gui.addParam('Global speed', State, 'speed', {}, function(value) {
            this.halo.setGlobalParam('speed', value);
          }.bind(this));
          this.gui.addParam('Lateral speedup', State, 'lateralSpeedup', { min: 0, max: 5}, function(value) {
            this.halo.setGlobalParam('lateralSpeedup', value);
          }.bind(this));
          this.gui.addParam('Horizontal Noise', State, 'horizontalNoiseScale', { min: 0, max: 1}, function(value) {
            this.halo.setGlobalParam('horizontalNoiseScale', value);
          }.bind(this));
      if (opts.limitedGUI !== true) {
          this.gui.addParam('Global brightness', State, 'brightness', {}, function(value) {
            this.halo.setGlobalParam('brightness', value);
          }.bind(this));
          this.gui.addParam('Global background', State, 'background', {}, function(value) {
            this.halo.setGlobalParam('background', value);
          }.bind(this));
          this.gui.addParam('Global glow', State, 'glow', {}, function(value) {
            this.halo.setGlobalParam('glow', value);
          }.bind(this));
          this.gui.addParam('Global growth', State, 'growth', {}, function(value) {
            this.halo.setGlobalParam('growth', value);
          }.bind(this));
      }

      this.gui.addHeader('Additional Params');
      this.gui.addParam('ringResolution', State, 'ringResolution', { min: 24, max: 256}, function(value) {
        this.halo.setGlobalParam('ringResolution', value);
      }.bind(this));
      if (opts.limitedGUI !== true) {
          this.gui.addTexture2D('Line solid', this.halo.lineSolidTexture).setPosition(180, 10);
          this.gui.addTexture2D('Line dots', this.halo.lineDotsTexture);
          this.gui.addTexture2D('Grid color', this.halo.gridColorTexture);

          this.gui.addTexture2D('Color spectrum (overrides texture)', this.halo.colorSpectrumTexture);

      }

      this.gui.addParam('Max num rings', State, 'maxNumRings', { min: 1, max: 100 }, function(value) {
        this.halo.setGlobalParam('maxNumRings', value);
      }.bind(this));

      this.gui.addTexture2D('Color texture', this.halo.colorTexture);
      this.gui.addTexture2D('Color texture (old)', this.halo.colorTextureOld);

      this.gui.addParam('Min ring radius', State, 'minRingRadius', {}, function(value) {
        this.halo.setGlobalParam('minRingRadius', value);
      }.bind(this));
      this.gui.addParam('Highlight ring', State, 'highlightRing', {}, function(value) {
        this.halo.setGlobalParam('highlightRing', value);
      }.bind(this));


      this.gui.addParam('Even line distribution', State, 'evenLineDistribution', {}, function(value) {
        this.halo.setGlobalParam('evenLineDistribution', value);
      }.bind(this));

      this.gui.addParam('Aura opacity', State, 'auraOpacity', {}, function(value) {
        this.halo.setGlobalParam('auraOpacity', value);
      }.bind(this));

      this.gui.addParam('Wave intensity', State, 'waveIntensity', { min: 0, max: 1 }, function(value) {
        this.halo.setGlobalParam('waveIntensity', value);
      }.bind(this));

      this.gui.addParam('Wave speed', State, 'waveSpeed', {}, function(value) {
        this.halo.setGlobalParam('waveSpeed', value);
      }.bind(this));

      this.gui.addParam('Wave count', State, 'waveCount', { min: 0, max: 6, step: 1 }, function(value) {
        this.halo.setGlobalParam('waveCount', value);
      }.bind(this));

      this.gui.addParam('Wave color', State, 'waveColor', {}, function(value) {
        this.halo.setGlobalParam('waveColor', value);
      }.bind(this));

      this.gui.addParam('Stratified', State, 'stratified', {}, function(value) {
        this.halo.setGlobalParam('stratified', value);
      }.bind(this));

      if (opts.limitedGUI !== true) {
          this.gui.addParam('Solid lines', State, 'solidLines', {}, function(value) {
            this.halo.setGlobalParam('solidLines', value);
          }.bind(this));
          this.gui.addParam('Show grid', State, 'showGrid', {}, function(value) {
            this.halo.setGlobalParam('showGrid', value);
          }.bind(this));
          this.gui.addButton('Add few more data points', function() {
              var n = random.int(2, 10);
              for(var i=0; i<n; i++) {
                  var special = random.chance(0.3);
                  HaloAddTimeStamp({
                   color: 0.1 + (special ? random.float(0, 0.8) : 0),
                   complexity: 0.5 + (special ? random.float(0, 0.1) : 0),
                   speed: 0.2
                  })
              }
          }.bind(this))
          this.gui.addButton('Reset data points', function() {
              HaloResetTimeStamps();
          }.bind(this))
      }
    },
    onKeyPress: function(e) {
        if (e.str == 'G') {
          this.gui.toggleEnabled();
        }
        if (e.str == 'd') {
          State.debug = true;
        }
    },
    drawScene: function() {
        var ctx = this.getContext();
        ctx.pushState(ctx.COLOR_BIT | ctx.DEPTH_BIT | ctx.BLEND_BIT);
        ctx.pushViewMatrix();
        ctx.pushProjectionMatrix();

          ctx.setProjectionMatrix(State.camera.getProjectionMatrix())
          ctx.setViewMatrix(State.camera.getViewMatrix())
          ctx.setClearColor(0,0,0,0)
          ctx.setBlend(true);
          ctx.setBlendFunc(ctx.ONE, ctx.ONE);
          ctx.setDepthTest(false);
          ctx.setDepthMask(0);

          ctx.clear(ctx.COLOR_BIT);

          this.halo.draw(State.camera, State.camera2D, this.getWidth(), this.getHeight());

        ctx.popViewMatrix();
        ctx.popProjectionMatrix();
        ctx.popState();
    },
    drawSceneGlow: function() {
      var ctx = this.getContext();
      ctx.pushState(ctx.COLOR_BIT | ctx.DEPTH_BIT | ctx.BLEND_BIT);
      ctx.pushViewMatrix();
      ctx.pushProjectionMatrix();

        ctx.setProjectionMatrix(State.camera.getProjectionMatrix())
        ctx.setViewMatrix(State.camera.getViewMatrix())
        ctx.setClearColor(this.halo.backgroundTransparent[0], this.halo.backgroundTransparent[1], this.halo.backgroundTransparent[2], this.halo.backgroundTransparent[3])
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

        this.halo.drawSolid(State.camera, State.camera2D, this.getWidth(), this.getHeight());

      ctx.popViewMatrix();
      ctx.popProjectionMatrix();
      ctx.popState();
    },
    draw: function() {
      var ctx = this.getContext();
      ctx.setClearColor(this.halo.background[0], this.halo.background[1], this.halo.background[2], 1.0);
      ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
      ctx.setDepthTest(true);

      //Workaround for texture loading bug
      if (this.getTime().getElapsedFrames() < 5) {
          return;
      }


      var W = this.getWidth();
      var H = this.getHeight();

      if (State.arcball) State.arcball.apply()

      this.halo.update();

      var root = this.fx.reset();
      var color = root.render({ drawFunc: this.drawScene.bind(this), width: W, height: H});
      ctx.setBlend(false);
      glow = root
        .render({ drawFunc: this.drawSceneGlow.bind(this)})
        .downsample4()
        .downsample2()
        .blur5()
        .blur5();
      var final = color
        .add(glow, { scale: this.halo.glow});
      var blackBackground = ((this.halo.background[0] + this.halo.background[1] + this.halo.background[2]) == 0);
      if (!blackBackground) {
          //ctx.setBlend(true);
          //ctx.setBlendFunc(ctx.ONE, ctx.ONE);
      }
      ctx.setClearColor(this.halo.background[0], this.halo.background[1], this.halo.background[2], 1)
      ctx.clear(ctx.COLOR_BIT);

      final.blit({ width: W, height: H });

      if (this.gui) {
          if (this.gui.enabled && State.dirty) {
              this.gui.items[0].dirty = true;
              State.dirty = false;
          }
          this.gui.draw();
      }
    }
  });
}

if (isBrowser) {
  window.HaloSetMode = HaloSetMode;
  window.HaloSetGlobalParam = HaloSetGlobalParam;
  window.HaloSetGlobalParams = HaloSetGlobalParams;
  window.HaloAddTimeStamp = HaloAddTimeStamp;
  window.HaloResetTimeStamps = HaloResetTimeStamps;
  window.HaloInitialize = HaloInitialize;
  window.HaloResetCamera = HaloResetCamera;
}
else {
  HaloInitialize();
  HaloSetMode('present')
  HaloSetGlobalParams({
    //size: 1,
    //color: 0.01,
    //colorCenter: 0.26,
    //colorCenterRatio: 0.5,
    //complexity: 0.7,
    //speed: 0.75,
    //brightness: 1,
    //wobble: 0.1,
    //background: '000000',
    //growth: 0.05,
    //scale: 100,
    //solidLines: true,
    //showGrid: true,
    //evenLineDistribution: false,
    //minRingRadius: 0.6,
    //showGrid: false,
    //evenLineDistribution: true,
    //maxNumRings: 60,
    //minRingRadius: 0.5,
    //maxRingRadius: 1,
    //showAuraAtRing: -1,
    //auraOpacity: 1,
    //waveCount: 0,
    //spectrum: ['FF0000', '00FF00', '0000FF'], //overrides color texture
    //colorTexture: __dirname + '/../assets/textures/halo-gradient-new.png' //custom color gradient
  })

  /*
  var lazyDay = [
      [0,0,0,0,1,1,1,1,5,6,2,1,1,1,9,1,1],
      [0,0,0,0,0,0,0,0,1,1,1,0,0,0,1,0,0]
  ]

  var activeDay = [
      [1,1,1,5,7,5,8,8,8,7,7,8,9,6,7,7,7,7,3,1,6,5,4,3,2,1,1],
      [1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,0,0,0]
  ]

  var currDay = activeDay;

  for(var i=0; i<currDay[1].length; i++) {
      var value = [];
      var numDataSeries = 2; //color + line type
      for(var j=0; j<numDataSeries; j++) {
          if (currDay[j][i] !== undefined) {
              value[j] = currDay[j][i];
          }
          else {
              value[j] = prevDay[j][i];
          }
      }
      var isPrevDay = false;
      var knokckout = false;
      HaloAddTimeStamp({
          color: isPrevDay ? -1 : value[0] / 10,
          complexity: 0.5,
          lineType: value[1],
          opacity: knokckout ? 0 : (isPrevDay ? 0.25 : 1)
      })
  }
  */
}
