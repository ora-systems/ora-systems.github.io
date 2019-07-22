(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (__dirname){
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
        lineDotsTexture: isBrowser ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAAgCAYAAAD9qabkAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAA3XAAAN1wFCKJt4AAACMGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIj4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BY29ybiB2ZXJzaW9uIDQuNS42PC94bXA6Q3JlYXRvclRvb2w+CiAgICAgICAgIDx0aWZmOkNvbXByZXNzaW9uPjU8L3RpZmY6Q29tcHJlc3Npb24+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjkwPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpYUmVzb2x1dGlvbj45MDwvdGlmZjpYUmVzb2x1dGlvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+Cv3R9vgAAAESSURBVHgB7dTBDQAgDMSwism7ObBFPmaBSC66ue3b8VKBf/4Nv4D7p9efOXFfngCBUMAAhPjSBGoBA1BfQJ9AKGAAQnxpArWAAagvoE8gFDAAIb40gVrAANQX0CcQChiAEF+aQC1gAOoL6BMIBQxAiC9NoBYwAPUF9AmEAgYgxJcmUAsYgPoC+gRCAQMQ4ksTqAUMQH0BfQKhgAEI8aUJ1AIGoL6APoFQwACE+NIEagEDUF9An0AoYABCfGkCtYABqC+gTyAUMAAhvjSBWsAA1BfQJxAKGIAQX5pALWAA6gvoEwgFDECIL02gFjAA9QX0CYQCBiDElyZQCxiA+gL6BEIBAxDiSxOoBQxAfQF9AqHAA8/R/cI9DrF6AAAAAElFTkSuQmCC" : ASSETS_PATH + '/textures/line-dots.png',
        lineSolidTexture: isBrowser ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAAgCAIAAAByyzGzAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAA3XAAAN1wFCKJt4AAACMGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIj4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BY29ybiB2ZXJzaW9uIDQuNS40PC94bXA6Q3JlYXRvclRvb2w+CiAgICAgICAgIDx0aWZmOkNvbXByZXNzaW9uPjU8L3RpZmY6Q29tcHJlc3Npb24+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjkwPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpYUmVzb2x1dGlvbj45MDwvdGlmZjpYUmVzb2x1dGlvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CgvZ/TsAAAC3SURBVHgB7dMBFQAgDIRQtX/n7ZmDvwZw487McQxUDbwqOG4GvgEB+IO0AQGk5wcvAD+QNiCA9PzgBeAH0gYEkJ4fvAD8QNqAANLzgxeAH0gbEEB6fvAC8ANpAwJIzw9eAH4gbUAA6fnBC8APpA0IID0/eAH4gbQBAaTnBy8AP5A2IID0/OAF4AfSBgSQnh+8APxA2oAA0vODF4AfSBsQQHp+8ALwA2kDAkjPD14AfiBtQADp+cEvr0sDPePH0dAAAAAASUVORK5CYII=" : ASSETS_PATH + '/textures/line-solid.png',
        colorTexture: isBrowser ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA+gAAADICAIAAAD0hVwYAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAA8xpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8eG1wOk1vZGlmeURhdGU+MjAxNi0wNS0xNlQxNToyMzozNzwveG1wOk1vZGlmeURhdGU+CiAgICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKE1hY2ludG9zaCk8L3htcDpDcmVhdG9yVG9vbD4KICAgICAgICAgPHhtcDpDcmVhdGVEYXRlPjIwMTYtMDUtMTZUMTU6MjM6Mzc8L3htcDpDcmVhdGVEYXRlPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPHRpZmY6WFJlc29sdXRpb24+NzI8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+MTAwMDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj4yMDA8L2V4aWY6UGl4ZWxZRGltZW5zaW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KwSHSrAAAEQlJREFUeAHt1lGW4rgSBNAqekPv7X9tA5OSbCB6NhAflzOHJo0sp2+amvj93/9fP6+f9fr9eZwPu/rv2+/P8/vg77xec+g1/8yH9+uxPz1/n/duc+B5Fr9ea93vWXGfcC+b+rP/2XDO+vl9zlnn9PuMtTL3WN885ga+drgXXJ1dHf6uS6xt9+tu+1z38fg6fS+77msamCbnrHf/c+JrWvu664Mza/btfG5k7bOuNUeWw/r48/PnHNvnf22yvr06u5t8vP7aKsprn3vbfe6npwWy73e2/UaeZW+B+6vPtr/X0zDfrBtcK/cm9w6z8tA+T+f/XfC+hb3DzG7W767WI/FBWCc+12Rn/3vzOePq5G5yTlzuq5v79T2m3eGM6Vowu+2uPptcl97m50E6t3OaP5c797M6mQc1LvU897J2fb3+XA3MsRn+x2EO3wN9n74aeJ97znvcTd5fXU3+uS/53flaszs5z9OUh2gd3F/sbufg951en9fi6wH7ht3U66d03eFtft3jnHWfeO2zWT57znlz0YHYb9cv+v2Azbl747V+TtwrP+eua93X3V/NquvbrbQ+j+Ea0G7rXjuHV7ezZs6aD3PW1fbvUD/2WNYdrefqftTvc9/7X/e7T19vb7TrSJy4zjo/8/Pt4+vnsI+8t53qfL4e6eu69257n3/mfd3vc/dwd7YOrgPXVvNpvb5OvNbfC9bifcLX35zlv7jum3vTnc32+211Dt2Pyr3g76vfz8P6fu02r7uBfcpn/fa59O/drn//tp3D131dP4197r34b9s5/rnKmfccer3+Wb3s16b4rNnfxiP9tf+iuTeJU+IqX7/KOX48x3m/1r/Lfv47/nvxe835cN/gOeX9Hvirq/XEvr89u075OTTF91+29d31W5s1z3nW3yffHz439f1H+5x4r1n//j2Urydtvp2u9nO1dvvSOyeurw/+11fnutdjv9bt19fdnfqrvXWXn/Ks/7xnP+f4/RP4rNqfLq7/WLxbWnf7Pmda/0xnBJfh/C/n/cdkZZeTRuacc5vz9+dq9LEWz1ZzfJ+ytp3P8+dy/lLN+6w8VzoHz3y+F58LreiwX/PVz95zfjl7q2n1vo+9Zi2YS87e98op78Vz7t5l3u5N1rXWE/I6+3xudr6YHT77rG3Wz3XvPz7vlXvZ3N3+Y75vbZYOyNE4nZ8/yOfI6mC3ena7JZ+nydPh2vO+nf2/lut29tWfu9VPM3PwXD3uerOs0ay72Hr7du5bOJusTtaCubf9flhWue50P9Jrg9j/XZ41+3bOLN7LZsT7invzNeXZ676dfb8zoDh4Oj93cQaxTlltrO1n6QzivpdP5+urx250Hv61Zv3PdSHPtfbpa6t93et9rZkm95fb5/04rK28CBAgQIAAAQIECBDoFBDcO+eiKwIECBAgQIAAAQIhILgHh4IAAQIECBAgQIBAp4Dg3jkXXREgQIAAAQIECBAIAcE9OBQECBAgQIAAAQIEOgUE98656IoAAQIECBAgQIBACAjuwaEgQIAAAQIECBAg0CkguHfORVcECBAgQIAAAQIEQkBwDw4FAQIECBAgQIAAgU4Bwb1zLroiQIAAAQIECBAgEAKCe3AoCBAgQIAAAQIECHQKCO6dc9EVAQIECBAgQIAAgRAQ3INDQYAAAQIECBAgQKBTQHDvnIuuCBAgQIAAAQIECISA4B4cCgIECBAgQIAAAQKdAoJ751x0RYAAAQIECBAgQCAEBPfgUBAgQIAAAQIECBDoFBDcO+eiKwIECBAgQIAAAQIhILgHh4IAAQIECBAgQIBAp4Dg3jkXXREgQIAAAQIECBAIAcE9OBQECBAgQIAAAQIEOgUE98656IoAAQIECBAgQIBACAjuwaEgQIAAAQIECBAg0CkguHfORVcECBAgQIAAAQIEQkBwDw4FAQIECBAgQIAAgU4Bwb1zLroiQIAAAQIECBAgEAKCe3AoCBAgQIAAAQIECHQKCO6dc9EVAQIECBAgQIAAgRAQ3INDQYAAAQIECBAgQKBTQHDvnIuuCBAgQIAAAQIECISA4B4cCgIECBAgQIAAAQKdAoJ751x0RYAAAQIECBAgQCAEBPfgUBAgQIAAAQIECBDoFBDcO+eiKwIECBAgQIAAAQIhILgHh4IAAQIECBAgQIBAp4Dg3jkXXREgQIAAAQIECBAIAcE9OBQECBAgQIAAAQIEOgUE98656IoAAQIECBAgQIBACAjuwaEgQIAAAQIECBAg0CkguHfORVcECBAgQIAAAQIEQkBwDw4FAQIECBAgQIAAgU4Bwb1zLroiQIAAAQIECBAgEAKCe3AoCBAgQIAAAQIECHQKCO6dc9EVAQIECBAgQIAAgRAQ3INDQYAAAQIECBAgQKBTQHDvnIuuCBAgQIAAAQIECISA4B4cCgIECBAgQIAAAQKdAoJ751x0RYAAAQIECBAgQCAEBPfgUBAgQIAAAQIECBDoFBDcO+eiKwIECBAgQIAAAQIhILgHh4IAAQIECBAgQIBAp4Dg3jkXXREgQIAAAQIECBAIAcE9OBQECBAgQIAAAQIEOgUE98656IoAAQIECBAgQIBACAjuwaEgQIAAAQIECBAg0CkguHfORVcECBAgQIAAAQIEQkBwDw4FAQIECBAgQIAAgU4Bwb1zLroiQIAAAQIECBAgEAKCe3AoCBAgQIAAAQIECHQKCO6dc9EVAQIECBAgQIAAgRAQ3INDQYAAAQIECBAgQKBTQHDvnIuuCBAgQIAAAQIECISA4B4cCgIECBAgQIAAAQKdAoJ751x0RYAAAQIECBAgQCAEBPfgUBAgQIAAAQIECBDoFBDcO+eiKwIECBAgQIAAAQIhILgHh4IAAQIECBAgQIBAp4Dg3jkXXREgQIAAAQIECBAIAcE9OBQECBAgQIAAAQIEOgUE98656IoAAQIECBAgQIBACAjuwaEgQIAAAQIECBAg0CkguHfORVcECBAgQIAAAQIEQkBwDw4FAQIECBAgQIAAgU4Bwb1zLroiQIAAAQIECBAgEAKCe3AoCBAgQIAAAQIECHQKCO6dc9EVAQIECBAgQIAAgRAQ3INDQYAAAQIECBAgQKBTQHDvnIuuCBAgQIAAAQIECISA4B4cCgIECBAgQIAAAQKdAoJ751x0RYAAAQIECBAgQCAEBPfgUBAgQIAAAQIECBDoFBDcO+eiKwIECBAgQIAAAQIhILgHh4IAAQIECBAgQIBAp4Dg3jkXXREgQIAAAQIECBAIAcE9OBQECBAgQIAAAQIEOgUE98656IoAAQIECBAgQIBACAjuwaEgQIAAAQIECBAg0CkguHfORVcECBAgQIAAAQIEQkBwDw4FAQIECBAgQIAAgU4Bwb1zLroiQIAAAQIECBAgEAKCe3AoCBAgQIAAAQIECHQKCO6dc9EVAQIECBAgQIAAgRAQ3INDQYAAAQIECBAgQKBTQHDvnIuuCBAgQIAAAQIECISA4B4cCgIECBAgQIAAAQKdAoJ751x0RYAAAQIECBAgQCAEBPfgUBAgQIAAAQIECBDoFBDcO+eiKwIECBAgQIAAAQIhILgHh4IAAQIECBAgQIBAp4Dg3jkXXREgQIAAAQIECBAIAcE9OBQECBAgQIAAAQIEOgUE98656IoAAQIECBAgQIBACAjuwaEgQIAAAQIECBAg0CkguHfORVcECBAgQIAAAQIEQkBwDw4FAQIECBAgQIAAgU4Bwb1zLroiQIAAAQIECBAgEAKCe3AoCBAgQIAAAQIECHQKCO6dc9EVAQIECBAgQIAAgRAQ3INDQYAAAQIECBAgQKBTQHDvnIuuCBAgQIAAAQIECISA4B4cCgIECBAgQIAAAQKdAoJ751x0RYAAAQIECBAgQCAEBPfgUBAgQIAAAQIECBDoFBDcO+eiKwIECBAgQIAAAQIhILgHh4IAAQIECBAgQIBAp4Dg3jkXXREgQIAAAQIECBAIAcE9OBQECBAgQIAAAQIEOgUE98656IoAAQIECBAgQIBACAjuwaEgQIAAAQIECBAg0CkguHfORVcECBAgQIAAAQIEQkBwDw4FAQIECBAgQIAAgU4Bwb1zLroiQIAAAQIECBAgEAKCe3AoCBAgQIAAAQIECHQKCO6dc9EVAQIECBAgQIAAgRAQ3INDQYAAAQIECBAgQKBTQHDvnIuuCBAgQIAAAQIECISA4B4cCgIECBAgQIAAAQKdAoJ751x0RYAAAQIECBAgQCAEBPfgUBAgQIAAAQIECBDoFBDcO+eiKwIECBAgQIAAAQIhILgHh4IAAQIECBAgQIBAp4Dg3jkXXREgQIAAAQIECBAIAcE9OBQECBAgQIAAAQIEOgUE98656IoAAQIECBAgQIBACAjuwaEgQIAAAQIECBAg0CkguHfORVcECBAgQIAAAQIEQkBwDw4FAQIECBAgQIAAgU4Bwb1zLroiQIAAAQIECBAgEAKCe3AoCBAgQIAAAQIECHQKCO6dc9EVAQIECBAgQIAAgRAQ3INDQYAAAQIECBAgQKBTQHDvnIuuCBAgQIAAAQIECISA4B4cCgIECBAgQIAAAQKdAoJ751x0RYAAAQIECBAgQCAEBPfgUBAgQIAAAQIECBDoFBDcO+eiKwIECBAgQIAAAQIhILgHh4IAAQIECBAgQIBAp4Dg3jkXXREgQIAAAQIECBAIAcE9OBQECBAgQIAAAQIEOgUE98656IoAAQIECBAgQIBACAjuwaEgQIAAAQIECBAg0CkguHfORVcECBAgQIAAAQIEQkBwDw4FAQIECBAgQIAAgU4Bwb1zLroiQIAAAQIECBAgEAKCe3AoCBAgQIAAAQIECHQKCO6dc9EVAQIECBAgQIAAgRAQ3INDQYAAAQIECBAgQKBTQHDvnIuuCBAgQIAAAQIECISA4B4cCgIECBAgQIAAAQKdAoJ751x0RYAAAQIECBAgQCAEBPfgUBAgQIAAAQIECBDoFBDcO+eiKwIECBAgQIAAAQIhILgHh4IAAQIECBAgQIBAp4Dg3jkXXREgQIAAAQIECBAIAcE9OBQECBAgQIAAAQIEOgUE98656IoAAQIECBAgQIBACAjuwaEgQIAAAQIECBAg0CkguHfORVcECBAgQIAAAQIEQkBwDw4FAQIECBAgQIAAgU4Bwb1zLroiQIAAAQIECBAgEAKCe3AoCBAgQIAAAQIECHQKCO6dc9EVAQIECBAgQIAAgRAQ3INDQYAAAQIECBAgQKBTQHDvnIuuCBAgQIAAAQIECISA4B4cCgIECBAgQIAAAQKdAoJ751x0RYAAAQIECBAgQCAEBPfgUBAgQIAAAQIECBDoFBDcO+eiKwIECBAgQIAAAQIhILgHh4IAAQIECBAgQIBAp4Dg3jkXXREgQIAAAQIECBAIAcE9OBQECBAgQIAAAQIEOgUE98656IoAAQIECBAgQIBACAjuwaEgQIAAAQIECBAg0CkguHfORVcECBAgQIAAAQIEQkBwDw4FAQIECBAgQIAAgU4Bwb1zLroiQIAAAQIECBAgEAKCe3AoCBAgQIAAAQIECHQKCO6dc9EVAQIECBAgQIAAgRAQ3INDQYAAAQIECBAgQKBTQHDvnIuuCBAgQIAAAQIECISA4B4cCgIECBAgQIAAAQKdAoJ751x0RYAAAQIECBAgQCAEBPfgUBAgQIAAAQIECBDoFBDcO+eiKwIECBAgQIAAAQIhILgHh4IAAQIECBAgQIBAp4Dg3jkXXREgQIAAAQIECBAIAcE9OBQECBAgQIAAAQIEOgUE98656IoAAQIECBAgQIBACAjuwaEgQIAAAQIECBAg0CnwL8WUsdRI3y1xAAAAAElFTkSuQmCC" : ASSETS_PATH + '/textures/calories-gradient-v2.png',
        colorTextureOld: isBrowser ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAABACAYAAABsv8+/AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAHXSURBVHic7dZLTuNAAEDB7pxo5v53S7OAiAAxsQ2aWbwqKcJOuz9BXrz55+9ac4xx+4y767k+3X8e3/ju0P06t8ahORt7/Pjs99+tX1jj2f06Mefovgf3OLXvjvfq6/0ac6y3v9fXg95dv45dN555PDbHGmPtmX99uP9tztM9Np85MX99nX+7P77/x9/13fznzzwYW8fO+P7Mmf33zf/23VmP9jgwf+vdm2uMyxzjMt4+T67njmc+XG+MzyNrHFtnnVlvntn/N/4/e85yt3bI5X8fAAD49wQAAAQJAAAIEgAAECQAACBIAABAkAAAgCABAABBAgAAggQAAAQJAAAIEgAAECQAACBIAABAkAAAgCABAABBAgAAggQAAAQJAAAIEgAAECQAACBIAABAkAAAgCABAABBAgAAggQAAAQJAAAIEgAAECQAACBIAABAkAAAgCABAABBAgAAggQAAAQJAAAIEgAAECQAACBIAABAkAAAgCABAABBAgAAggQAAAQJAAAIEgAAECQAACBIAABAkAAAgCABAABBAgAAggQAAAQJAAAIEgAAECQAACBIAABAkAAAgCABAABBAgAAggQAAAQJAAAIEgAAECQAACBIAABAkAAAgKAXcnS/sfhruFcAAAAASUVORK5CYII=" : ASSETS_PATH + '/textures/calories-gradient.png',
        gridColorTexture: isBrowser ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAAgCAIAAAByyzGzAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAA3XAAAN1wFCKJt4AAACMGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIj4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BY29ybiB2ZXJzaW9uIDQuNS40PC94bXA6Q3JlYXRvclRvb2w+CiAgICAgICAgIDx0aWZmOkNvbXByZXNzaW9uPjU8L3RpZmY6Q29tcHJlc3Npb24+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjkwPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpYUmVzb2x1dGlvbj45MDwvdGlmZjpYUmVzb2x1dGlvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CgvZ/TsAAAC3SURBVHgB7dMBFQAgDIRQtX/n7ZmDvwZw487McQxUDbwqOG4GvgEB+IO0AQGk5wcvAD+QNiCA9PzgBeAH0gYEkJ4fvAD8QNqAANLzgxeAH0gbEEB6fvAC8ANpAwJIzw9eAH4gbUAA6fnBC8APpA0IID0/eAH4gbQBAaTnBy8AP5A2IID0/OAF4AfSBgSQnh+8APxA2oAA0vODF4AfSBsQQHp+8ALwA2kDAkjPD14AfiBtQADp+cEvr0sDPePH0dAAAAAASUVORK5CYII=" : ASSETS_PATH + '/textures/line-solid.png',
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

}).call(this,"/app")
},{"is-browser":13,"is-ios":14,"ora-halo":6,"pex-cam":24,"pex-color":26,"pex-fx":55,"pex-gui":63,"pex-math/Vec2":74,"pex-math/Vec3":75,"pex-random":78,"pex-sys/Window":88}],2:[function(require,module,exports){
var isBrowser = require('is-browser');
var plask = isBrowser ? {} : require('plask');
var interpolateArrays = require('interpolate-arrays');

function fromHex(hex) {
    hex = hex.replace(/^#/, "");
    var num = parseInt(hex, 16);

    var color = [0,0,0,0];

    color[0] = (num >> 16 & 255) / 255;
    color[1] = (num >> 8 & 255) / 255;
    color[2] = (num & 255) / 255;
    color[3] = 1

    return color;
}

function series(n) {
    var result = [];
    for(var i=0; i<n; i++) {
        result.push(i);
    }
    return result;
}

function colorGradient(colors, numSteps) {
    return series(numSteps).map(function(i) {
        return interpolateArrays(colors, i/numSteps);
    })
}

function createGradientBrowser(colors, w, h) {
    var gradient = colorGradient(colors, w);

    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    var ctx = canvas.getContext('2d');

    gradient.forEach(function(color, i) {
        var r = (color[0] * 255) | 0;
        var g = (color[1] * 255) | 0;
        var b = (color[2] * 255) | 0;
        ctx.fillStyle = 'rgb('+r+','+g+','+b+')';
        ctx.fillRect(i, 0, 1, h);
    })

    return canvas;
}

function createGradientSkia(colors, w, h) {
    var gradient = colorGradient(colors, w);

    var canvas = plask.SkCanvas.create(w, h);
    var paint = new plask.SkPaint();
    gradient.forEach(function(color, i) {
        paint.setColor((color[0] * 255) | 0, (color[1] * 255) | 0, (color[2] * 255) | 0, 255);
        canvas.drawRect(paint, i, 0, i+1, h);
    })

    return canvas;
}

function createGradient(colors, w, h) {
    if (typeof(colors[0]) == 'string') {
        colors = colors.map(fromHex);
    }
    if (isBrowser) {
        return createGradientBrowser(colors, w, h);
    }
    else {
        return createGradientSkia(colors, w, h);
    }
}

module.exports = createGradient;

},{"interpolate-arrays":12,"is-browser":13,"plask":8}],3:[function(require,module,exports){
module.exports = geoArc;

function geoArc(options) {

  var geo = {
    positions: [],
    cells: [],
    uvs: [] //VORG
  };

  options = options || {};
  options.cellSize = options.cellSize || 3;
  options.x = options.x || 0;
  options.y = options.y || 0;
  options.z = options.z || 0;
  options.startRadian = options.startRadian || 0;
  options.endRadian = options.endRadian || Math.PI * 1.5;
  options.innerRadius = typeof options.innerRadius == 'number' ? options.innerRadius : 40;
  options.outerRadius = options.outerRadius || 200;
  options.numBands = options.numBands || 2;
  options.numSlices = options.numSlices || 40;
  options.drawOutline = options.drawOutline !== undefined ? options.drawOutline : true;

  createGeometry(options, geo.positions, geo.cells, geo.uvs); //VORG

  return geo;
}

function createGeometry(options, positions, cells, uvs) {

    var o = options;
    var idxSize = o.cellSize;
    var radDist = o.endRadian - o.startRadian;
    var numSlices = Math.floor(Math.abs(radDist) / (Math.PI * 2) * o.numSlices);
    var radInc = radDist / numSlices;
    var bandInc = (o.outerRadius - o.innerRadius) / (o.numBands - 1); //VORG: fix 1
    var cRad, x, y, z, cRadius, curSlideIdx, prevSlideIdx;

  for(var i = 0, len = numSlices; i <= len; i++) {

    cRad = i * radInc + o.startRadian;
    prevSlideIdx = (i - 1) * o.numBands;
    curSlideIdx = i * o.numBands;

    for(var j = 0, lenJ = o.numBands; j < lenJ; j++) {

      cRadius = o.innerRadius + bandInc * j;

      x = Math.cos(cRad) * cRadius + o.x;
      y = o.y;
      z = Math.sin(cRad) * cRadius + o.z;

      positions.push([ x, y, z ]);

      uvs.push([i/len, j/(lenJ-1)]); //VORG, check for 0

      //if we've added in positions then we'll add cells
      if(idxSize == 1) {

        cells.push([ curSlideIdx + j ]);
      } else if(idxSize == 2) {

        if(i > 0 && j + 1 < lenJ) {

          cells.push( [
                        prevSlideIdx + j,
                        curSlideIdx + j
                      ]);

          cells.push( [
                        curSlideIdx + j + 1,
                        prevSlideIdx + j + 1
                      ]);

          if( !o.drawOutline ) {

            cells.push( [
                          curSlideIdx + j,
                          curSlideIdx + j + 1
                        ]);
          }
        }
      } else if(idxSize == 3) {

        if(i > 0 && j + 1 < lenJ) {

          cells.push( [
                        curSlideIdx + j,
                        prevSlideIdx + j + 1,
                        prevSlideIdx + j
                      ]);

          cells.push( [
                        curSlideIdx + j,
                        curSlideIdx + j + 1,
                        prevSlideIdx + j + 1
                      ]);
        }
      }
    }
  }

  //cap it off
  if(idxSize == 2) {

    // if it's going all the way around then we wont put the connecting line
    if( radDist % Math.PI * 2 != 0 ) {

      for(var j = 0, lenJ = o.numBands - 1; j < lenJ; j++) {

        cells.push([
                      curSlideIdx + j,
                      curSlideIdx + j + 1 ]);
      }

      curSlideIdx = 0;

      for(var j = 0, lenJ = o.numBands - 1; j < lenJ; j++) {

        cells.push([
                      curSlideIdx + j,
                      curSlideIdx + j + 1 ]);
      }
    }
  }
}

},{}],4:[function(require,module,exports){
var lerp = require('lerp-array');

function interpolateFloats(arrays, t) {
    if (t >= 1) {
        return arrays[arrays.length - 1];
    }
    if (arrays.length == 1) {
        return arrays[0];
    }
    var numStops = arrays.length - 1;
    var stopF = t * numStops;
    var stop = Math.floor(stopF);
    var k = stopF - stop;
    return lerp(arrays[stop], arrays[stop+1], k);
}

module.exports = interpolateFloats;

},{"lerp-array":16}],5:[function(require,module,exports){
function makeCircle(r, numSteps, u, v, closed) {
  r = r || 1;
  numSteps = numSteps || 16;
  u = u || 0; //x
  v = v || 1; //y
  closed = (closed === undefined) ? false : true;

  var lastStep = closed ? numSteps - 1 : numSteps;

  var points = [];
  for(var i=0; i<numSteps; i++) {
    var p = [0, 0, 0];
    var a = 2.0 * Math.PI * i/lastStep;
    p[u] = r * Math.cos(a);
    p[v] = r * Math.sin(a);
    points.push(p);
  }
  return points;
}

module.exports = makeCircle;

},{}],6:[function(require,module,exports){
var Vec3        = require('pex-math/Vec3');
var Vec2        = require('pex-math/Vec2');
var Color       = require('pex-color');
var makeCircle  = require('make-circle');
var remap       = require('re-map');
var R           = require('ramda');
//TODO: var TextBox     = require('../typo/TextBox');
var createGradient = require('create-gradient');
var isBrowser   = require('is-browser');
var io          = require('pex-io');

var geoArc      = require('geo-arc');
var MathUtils   = require('pex-math/Utils')
var interpolateFloats = require('interpolate-floats');
var floor       = Math.floor;
var pow         = Math.pow;
var smoothstep  = MathUtils.smoothstep;
var clamp       = MathUtils.clamp;
var lerp        = MathUtils.lerp;

var HALO_RING_VERT = "#define GLSLIFY 1\nfloat remap(float v, float oldmin, float oldmax, float newmin, float newmax) {\n  return newmin + (v - oldmin)/(oldmax - oldmin)*(newmax - newmin);\n}\n\nuniform mat4 uProjectionMatrix;\nuniform mat4 uViewMatrix;\nuniform mat4 uModelMatrix;\n\nuniform float radius;\nuniform float radiusHeightScale;\nuniform float radiusHeightLocalScale;\nuniform float complexity;\nuniform float time;\nuniform float time5;\nuniform float speed;\nuniform float wobble;\nuniform float wobbleFadeout;\nuniform float wobbleFrequency;\nuniform float horizontalOffset;\nuniform float horizontalOffset2;\nuniform float amplitudeScale;\nuniform float lateralSpeedup;\nuniform float horizontalNoiseScale;\nuniform float complexityFrequency;\nuniform bool stratified;\n\nattribute vec3 aPosition;\nattribute vec2 aTexCoord0;\n\nvarying vec2 vTexCoord;\n\nconst float PI = 3.14159265359;\n\n//\n// GLSL textureless classic 2D noise \"cnoise\",\n// with an RSL-style periodic variant \"pnoise\".\n// Author:  Stefan Gustavson (stefan.gustavson@liu.se)\n// Version: 2011-08-22\n//\n// Many thanks to Ian McEwan of Ashima Arts for the\n// ideas for permutation and gradient selection.\n//\n// Copyright (c) 2011 Stefan Gustavson. All rights reserved.\n// Distributed under the MIT license. See LICENSE file.\n// https://github.com/ashima/webgl-noise\n//\n\nvec4 mod289_0(vec4 x)\n{\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 permute_0(vec4 x)\n{\n  return mod289_0(((x*34.0)+1.0)*x);\n}\n\nvec4 taylorInvSqrt_0(vec4 r)\n{\n  return 1.79284291400159 - 0.85373472095314 * r;\n}\n\nvec2 fade_0(vec2 t) {\n  return t*t*t*(t*(t*6.0-15.0)+10.0);\n}\n\n// Classic Perlin noise\nfloat cnoise_0(vec2 P)\n{\n  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);\n  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);\n  Pi = mod289_0(Pi); // To avoid truncation effects in permutation\n  vec4 ix = Pi.xzxz;\n  vec4 iy = Pi.yyww;\n  vec4 fx = Pf.xzxz;\n  vec4 fy = Pf.yyww;\n\n  vec4 i = permute_0(permute_0(ix) + iy);\n\n  vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0 ;\n  vec4 gy = abs(gx) - 0.5 ;\n  vec4 tx = floor(gx + 0.5);\n  gx = gx - tx;\n\n  vec2 g00 = vec2(gx.x,gy.x);\n  vec2 g10 = vec2(gx.y,gy.y);\n  vec2 g01 = vec2(gx.z,gy.z);\n  vec2 g11 = vec2(gx.w,gy.w);\n\n  vec4 norm = taylorInvSqrt_0(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));\n  g00 *= norm.x;\n  g01 *= norm.y;\n  g10 *= norm.z;\n  g11 *= norm.w;\n\n  float n00 = dot(g00, vec2(fx.x, fy.x));\n  float n10 = dot(g10, vec2(fx.y, fy.y));\n  float n01 = dot(g01, vec2(fx.z, fy.z));\n  float n11 = dot(g11, vec2(fx.w, fy.w));\n\n  vec2 fade_xy = fade_0(Pf.xy);\n  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);\n  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);\n  return 2.3 * n_xy;\n}\n\n//\n// GLSL textureless classic 3D noise \"cnoise\",\n// with an RSL-style periodic variant \"pnoise\".\n// Author:  Stefan Gustavson (stefan.gustavson@liu.se)\n// Version: 2011-10-11\n//\n// Many thanks to Ian McEwan of Ashima Arts for the\n// ideas for permutation and gradient selection.\n//\n// Copyright (c) 2011 Stefan Gustavson. All rights reserved.\n// Distributed under the MIT license. See LICENSE file.\n// https://github.com/ashima/webgl-noise\n//\n\nvec3 mod289_1(vec3 x)\n{\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 mod289_1(vec4 x)\n{\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 permute_1(vec4 x)\n{\n  return mod289_1(((x*34.0)+1.0)*x);\n}\n\nvec4 taylorInvSqrt_1(vec4 r)\n{\n  return 1.79284291400159 - 0.85373472095314 * r;\n}\n\nvec3 fade_1(vec3 t) {\n  return t*t*t*(t*(t*6.0-15.0)+10.0);\n}\n\n// Classic Perlin noise\nfloat cnoise_1(vec3 P)\n{\n  vec3 Pi0 = floor(P); // Integer part for indexing\n  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1\n  Pi0 = mod289_1(Pi0);\n  Pi1 = mod289_1(Pi1);\n  vec3 Pf0 = fract(P); // Fractional part for interpolation\n  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0\n  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);\n  vec4 iy = vec4(Pi0.yy, Pi1.yy);\n  vec4 iz0 = Pi0.zzzz;\n  vec4 iz1 = Pi1.zzzz;\n\n  vec4 ixy = permute_1(permute_1(ix) + iy);\n  vec4 ixy0 = permute_1(ixy + iz0);\n  vec4 ixy1 = permute_1(ixy + iz1);\n\n  vec4 gx0 = ixy0 * (1.0 / 7.0);\n  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;\n  gx0 = fract(gx0);\n  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);\n  vec4 sz0 = step(gz0, vec4(0.0));\n  gx0 -= sz0 * (step(0.0, gx0) - 0.5);\n  gy0 -= sz0 * (step(0.0, gy0) - 0.5);\n\n  vec4 gx1 = ixy1 * (1.0 / 7.0);\n  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;\n  gx1 = fract(gx1);\n  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);\n  vec4 sz1 = step(gz1, vec4(0.0));\n  gx1 -= sz1 * (step(0.0, gx1) - 0.5);\n  gy1 -= sz1 * (step(0.0, gy1) - 0.5);\n\n  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);\n  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);\n  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);\n  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);\n  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);\n  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);\n  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);\n  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);\n\n  vec4 norm0 = taylorInvSqrt_1(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));\n  g000 *= norm0.x;\n  g010 *= norm0.y;\n  g100 *= norm0.z;\n  g110 *= norm0.w;\n  vec4 norm1 = taylorInvSqrt_1(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));\n  g001 *= norm1.x;\n  g011 *= norm1.y;\n  g101 *= norm1.z;\n  g111 *= norm1.w;\n\n  float n000 = dot(g000, Pf0);\n  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));\n  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));\n  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));\n  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));\n  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));\n  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));\n  float n111 = dot(g111, Pf1);\n\n  vec3 fade_xyz = fade_1(Pf0);\n  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);\n  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);\n  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);\n  return 2.2 * n_xyz;\n}\n\nvoid main() {\n  float t = aTexCoord0.x;\n  vec3 pos = aPosition.xyz;\n  if (!stratified) {\n    pos *= radius;\n  }\n  float x = pos.x;\n  float z = pos.z;\n  float nx = x * 14.0; //remaping 0..1 to 3..14 radius of original halo\n  float nz = z * 14.0; //remaping 0..1 to 3..14 radius of original halo\n  float horizontalNoiseScaleValue = horizontalNoiseScale;\n  if (stratified) {\n    pos *= radius;\n    x *= radius;\n    z *= radius;\n    horizontalNoiseScaleValue = 0.5;\n  }\n\n  float sinValue = sin( t * PI * 2.0 );\n  float cosValue = cos( t * PI * 2.0 );\n\n  float rampedComplexity = complexity;\n  float frequency = remap(rampedComplexity, 0.0, 1.0, 0.1, complexityFrequency);\n  float amplitude = radiusHeightScale * (1.0 - (1.0 - radiusHeightLocalScale) * (1.0 - radiusHeightLocalScale)); //remaping 0..1 to 3..14 radius of original halo\n\n  float amplitude2 = 3.0 * (1.0 - (1.0 - radiusHeightLocalScale) * (1.0 - radiusHeightLocalScale)); //remaping 0..1 to 3..14 radius of original halo\n\n  float horizontalFrequency = rampedComplexity * 1.0 * complexityFrequency;\n  float horizontalAmplitude = horizontalNoiseScaleValue * radiusHeightScale * amplitude2 * complexity; //remaping 0..1 to 3..14 radius of original halo\n  float horizontalSpeed = speed;\n  float horizontalOffsetAmplitude = amplitudeScale * sin(horizontalOffset/5.0 * PI) / 5.0; //remaping 0..1 to 3..14 radius of original halo\n  float horizontalOffsetAmplitude2 = amplitudeScale * sin(horizontalOffset2/5.0 * PI) / 5.0; //remaping 0..1 to 3..14 radius of original halo\n  float wobbleAmplitude = wobble * (1.0 - wobbleFadeout + (wobbleFadeout * radiusHeightLocalScale * amplitude));\n\n  vec2 noiseDir = vec2(frequency * nx + time * (speed + lateralSpeedup), frequency * nz + time * (speed + lateralSpeedup));\n\n  vec2 wobbleDir = vec2( wobbleFrequency * nx + time * speed, wobbleFrequency * nz + time * speed );\n\n  float y = amplitudeScale * amplitude * ( 0.5 + 0.5 * cnoise_0( noiseDir ));\n\n  vec2 horizontalNoiseDir = vec2( horizontalFrequency * nx, horizontalFrequency * nz);\n  horizontalNoiseDir -= normalize(horizontalNoiseDir) * horizontalOffset;\n\n  vec2 horizontalNoiseDir2 = vec2( horizontalFrequency * nx, horizontalFrequency * nz);\n  horizontalNoiseDir2 -= normalize(horizontalNoiseDir2) * horizontalOffset2;\n\n  float perlin1 = cnoise_0( horizontalNoiseDir );\n  float perlin2 = cnoise_0( horizontalNoiseDir2 );\n  float perlin3 = cnoise_0( wobbleDir );\n\n  x += horizontalOffsetAmplitude * horizontalAmplitude * ( perlin1 ) * cosValue;\n  z += horizontalOffsetAmplitude * horizontalAmplitude * ( perlin1 ) * sinValue;\n\n  x += horizontalOffsetAmplitude2 * horizontalAmplitude * ( perlin2 ) * cosValue;\n  z += horizontalOffsetAmplitude2 * horizontalAmplitude * ( perlin2 ) * sinValue;\n\n  //wobble\n  x += wobbleAmplitude * ( perlin3 ) * cosValue;\n  z += wobbleAmplitude * ( perlin3 ) * sinValue;\n\n  pos.x += x;\n  pos.y = y;\n  pos.z += z;\n\n  vTexCoord = aTexCoord0;\n\n  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(pos, 1.0);\n}\n"
var HALO_RING_FRAG = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\n\nuniform sampler2D lineTexture;\nuniform sampler2D colorTexture;\nuniform float radiusHeightScale;\n\nuniform float radius;\nuniform float complexity;\nuniform float color;\nuniform float colorCenter;\nuniform float colorCenterRatio;\nuniform vec4  colorOverride;\nuniform float brightness;\nuniform float alpha;\nuniform float opacity;\nuniform float index;\nuniform float lineType;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  vec2 lineTextureScale = vec2(floor(150.0 * radius * (1.0 + complexity)), 1.0);\n  vec4 linePattern = texture2D(lineTexture, (1.0 - lineType) * vTexCoord * lineTextureScale);\n  vec4 lineColorOutside  = texture2D(colorTexture, vec2(color, 0.5));\n  vec4 lineColorCenter  = texture2D(colorTexture, vec2(colorCenter, 0.5));\n\n  //0....ratio.....1\n  //0    1         1\n  float k = 1.0;\n  float ratio = 2.0 * colorCenterRatio;\n  if (index < ratio && ratio > 0.0) {\n    k = index / ratio;\n  }\n  vec4 lineColor = mix(lineColorCenter, lineColorOutside, k);\n\n  if (color < 0.0) {\n      lineColor = vec4(1.0);\n  }\n\n  gl_FragColor = linePattern * lineColor;\n\n  gl_FragColor *= alpha * brightness * opacity;\n}\n"
var HALO_AURA_VERT = "#define GLSLIFY 1\nattribute vec4 aPosition;\nattribute vec2 aTexCoord0;\n\nuniform mat4 uProjectionMatrix;\nuniform mat4 uViewMatrix;\nuniform mat4 uModelMatrix;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition;\n    vTexCoord = aTexCoord0;\n}\n"
var HALO_AURA_FRAG = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\n\nvarying vec2 vTexCoord;\nuniform float opacity;\n\nvoid main() {\n    gl_FragColor = vec4(0.0, 0.0, 0.25 * (1.0-vTexCoord.y), 1.0);\n    gl_FragColor *= vec4(smoothstep(0.0, 0.1, vTexCoord.y));\n    gl_FragColor.rgb *= opacity;\n}\n"


var HaloModes = {
    PRESENT: 'present',
    TIMELINE: 'timeline'
}

if (isBrowser) {
    io.loadImage = function(url, callback) {
        var img = new Image();
        img.onload = function() {
            callback(null, img);
        }
        img.onerror = function(err) {
            console.log('err', err);
        }
        img.src = url;
    }
}


function Halo(ctx, window, opts) {
  this.ctx = ctx;
  this.window = window;
  this.minRingRadius = 0.2;
  this.maxRingRadius = 1.0;
  this.minNumRings = 10;
  this.maxNumRings = 80;
  this.tilt = 0;
  this.size = 0;
  this.speed = 0.5;
  this.lateralSpeedup = 2;
  this.horizontalNoiseScale = 1;
  this.color = 0;
  this.colorCenter = 0;
  this.colorCenterRatio = 0;
  this.complexity = 0;
  this.brightness = 1;
  this.wobble = 0;
  this.wobbleFadeout = 1;
  this.time = 0;
  this.mode = HaloModes.PRESENT;
  this.enableLabels = false;
  this.background = [0,0,0,1];
  this.backgroundTransparent = [0,0,0,0];
  this.grid = [0.75, 0.75, 0.75, 1];
  this.showGrid = true;
  this.spectrum = [[0.1,0.1,0.1,1]];
  this.growth = 0.05;
  this.glow = 0.75;
  this.scale = 40;
  this.ringResolution = 128; //32
  //if true then all rings at the same angle / clock hour will have the same freequency sync
  this.stratified = false;
  this.showAuraAtRing = -1;
  this.auraOpacity = 0.5;
  this.amplitudeScale = 1;
  this.highlightRing = 0.8;
  this.complexityFrequency = 1.2;

  this.ringInstances = [];
  this.waveInstances = [];
  this.waveIntensity = 0;
  this.waveSpeed = 0.15;
  this.waveColor = 0.5;
  this.waveCount = 0;
  this.buildMesh(opts);

  this.gridLineInstances = [];
  this.gridLineLabels = [];
  this.updateGridLines();

  this.solidLines = false;
  this.evenLineDistribution = false;

  this.buildAura();
}

Halo.prototype.buildMesh = function(opts) {
  var ctx = this.ctx;

  var lineDotsTexture = this.lineDotsTexture = ctx.createTexture2D(null, 256, 32, { repeat: true, mipmap: true });
  io.loadImage(opts.lineDotsTexture, function(err, img) {
    lineDotsTexture.update(img, img.width, img.height, { repeat: true, mipmap: true });
    ctx.bindTexture(lineDotsTexture);
  }.bind(this))

  var lineSolidTexture = this.lineSolidTexture = ctx.createTexture2D(null, 256, 32, { repeat: true, mipmap: true });
  io.loadImage(opts.lineSolidTexture, function(err, img) {
    lineSolidTexture.update(img, img.width, img.height, { repeat: true, mipmap: true });
    ctx.bindTexture(lineDotsTexture);
  }.bind(this))

  var colorTexture = this.colorTexture = ctx.createTexture2D(null, 256, 32);
  io.loadImage(opts.colorTexture, function(err, img) {
    colorTexture.update(img, img.width, img.height, { repeat: false });
  })
  var colorTextureOld = this.colorTextureOld = ctx.createTexture2D(null, 256, 32);
  io.loadImage(opts.colorTextureOld, function(err, img) {
    colorTextureOld.update(img, img.width, img.height, { repeat: false });
  })
  var colorSpectrumTexture = this.colorSpectrumTexture = ctx.createTexture2D(createGradient(this.spectrum, 256, 32), 256, 32);
  var gridColorTexture = this.gridColorTexture = ctx.createTexture2D(createGradient([this.grid], 256, 32), 256, 32);

  this.ringProgram = ctx.createProgram(HALO_RING_VERT, HALO_RING_FRAG);
  this.gridProgram = ctx.createProgram(HALO_RING_VERT, HALO_RING_FRAG);

  this.defaultRingUniforms = { lineTexture: lineDotsTexture, colorTexture: colorTexture }
  this.defaultGridUniforms = { lineTexture: lineDotsTexture, colorTexture: gridColorTexture };

  this.updateGeometry(this.mode);
}

Halo.prototype.buildAura = function() {
    var ctx = this.ctx;

    var geo = geoArc( {
        cellSize: 3, // 1 == points, 2 == lines, 3 == triangles
        x: 0, // x position of the center of the arc
        y: 0, // y position of the center of the arc
        z: 0, // z position of the center of the arc
        startRadian: 0, // start radian for the arc
        endRadian: 2 * Math.PI, // end radian for the arc
        innerRadius: 2, // inner radius of the arc
        outerRadius: 2.5, // outside radius of the arc
        numBands: 2, // subdivision from inside out
        numSlices: 40, // subdivision along curve
        drawOutline: false // if cellSize == 2 draw only the outside of the shape
    });

    var texCoords = [];

    var attributes = [
      { data: geo.positions, location: ctx.ATTRIB_POSITION },
      { data: geo.uvs, location: ctx.ATTRIB_TEX_COORD_0 }
    ];
    var indices = { data: geo.cells, usage: ctx.STATIC_DRAW };

    this.auraMesh = ctx.createMesh(attributes, indices, ctx.TRIANGLES);
    this.auraProgram = ctx.createProgram(HALO_AURA_VERT, HALO_AURA_FRAG);
}

Halo.prototype.setMode = function(mode) {
  this.mode = mode;
  this.ringInstances = [];
  this.updateGeometry(this.mode);
}

Halo.prototype.updateGeometry = function(mode) {
  var ctx = this.ctx;
  var numPoints = this.ringResolution;
  var points    = makeCircle(1, numPoints, 0, 2, true); //x,z plane
  var texCoords = points.map(function(v, i) { return [i/(points.length-1), 0]});
  var edges     = points.map(function(v, i) { return [ i, (i+1) % points.length ]});
  edges.pop();

  var attributes = [
    { data: points, location: ctx.ATTRIB_POSITION },
    { data: texCoords, location: ctx.ATTRIB_TEX_COORD_0 }
  ];
  var indices = { data: edges, usage: ctx.STATIC_DRAW };

  if (this.ringMesh) {
    //TODO: this.ringMesh.dispose();
    //TODO: this.gridMesh.dispose();
  }
  this.ringMesh = ctx.createMesh(attributes, indices, ctx.LINES);
  this.gridMesh = ctx.createMesh(attributes, indices, ctx.LINES);
}

Halo.prototype.updateGridLines = function() {
  this.gridLineInstances = [];
  var numGridLines = 10;
  for(var i=1; i<=numGridLines; i++) {
    var k = i/numGridLines;
    var k2 = this.evenLineDistribution ? k : 1.0 - (k - 1.0) * (k - 1.0);
    var radius = remap(k2, 0, 1, this.minRingRadius, this.maxRingRadius*1.1);
    this.gridLineInstances.push({
      uniforms: {
        radius: radius,
        color: 0,
        colorCenter: 0,
        colorCenterRatio: 0,
        complexity: 0,
        speed: 0.5,
        time: 0,
        alpha: 0.5,
        brightness: 1,
        wobble: 0,
        wobbleFadeout: this.wobbleFadeout,
        wobbleFrequency: 0.08,
        horizontalOffset: 0,
        horizontalOffset2: 2.5,
        stratified: this.stratified,
        amplitudeScale: this.amplitudeScale
      }
    })
    if (i >= 2 && this.enableLabels) {
      var r = '' + i/10;
      if (r == '1') r = '1.0';
      var label = new TextBox('' + r, 'Arial', 10, { origin: TextBox.Origin.Left });
      label.radius = radius;
      this.gridLineLabels[i] = label;
    }
  }
}

Halo.prototype.setGlobalParam = function(param, value) {
  if (this[param] !== undefined && typeof(this[param]) !== 'function') {
    if (param == 'background') {
        if (Array.isArray(value)) {
            this[param] = value;
        }
        else {
            this[param] = Color.fromHex(value);
        }
    }
    else if (param == 'colorTexture') {
        this.setColorTexture(value);
    }
    else if (param == 'spectrum') {
        this.setColorSpectrum(value);
    }
    else if (param == 'waveIntensity') {
        console.log('waveIntensity', value)
        this.waveCount = Math.ceil(value * 8.0);
        this.waveSpeed = 0.1 + value * 0.15;
    }
    else if (param == 'color') {
        if (!Array.isArray(value)) {
            value = [value];
        }
        if (value.length == 0) {
            value = [0]
        }
        this[param] = value;
    }
    else {
        this[param] = value;
    }


    if (param == 'minRingRadius') {
        this.updateGridLines();
    }
    if (param == 'ringResolution') {
        this.updateGeometry();
    }

    if (this.mode == HaloModes.TIMELINE) {
        for(var i=0; i<this.ringInstances.length; i++) {
            this.setTimeStampParam(i, param, value)
        }
    }
  }
}

Halo.prototype.setTimeStampParam = function(ringIndex, param, value) {
    if (ringIndex >= this.ringInstances.length) {
        return;
    }

    var ring = this.ringInstances[ringIndex];
    ring.uniforms[param] = value;
    ring.uniformsTargets[param] = value;
}

Halo.prototype.update = function() {
    var speed = remap(this.speed, 0.0, 1.0, 0.2, 1.0);
    this.time += speed * this.window.getTime().getDeltaSeconds();

    this.amplitudeScale = 2 - this.size;

    if (this.size < 0.2) {
        this.complexityFrequency = remap(this.size, 0.0, 0.2, 3.0, 2.5);
    }
    else if (this.size < 0.5) {
        this.complexityFrequency = remap(this.size, 0.2, 0.5, 2.5, 1.75);
    }
    else if (this.size < 0.5) {
        this.complexityFrequency = remap(this.size, 0.2, 0.5, 2.5, 1.5);
    }
    else {
        this.complexityFrequency = remap(this.size, 0.5, 1.0, 1.5, 1.0);
    }

  if (this.mode == HaloModes.PRESENT) {
    this.updateParams();
  }

  this.animate();
  this.updateWaves();
}

Halo.prototype.updateWaves = function() {
    var seconds = this.window.getTime().getElapsedSeconds();

    var numActiveRings = 0;
    for(var i=0; i<this.ringInstances.length; i++) {
        if (this.ringInstances[i].uniforms.opacity == 1) {
            numActiveRings = i;
        }
    }

    this.waveInstances.forEach(function(wave) {
        wave.uniforms.waveLife += this.waveSpeed * this.window.getTime().getDeltaSeconds();
        if (wave.uniforms.waveLife > 1) {
            wave.uniforms.waveLife = 0
        }

        var lastRing = this.ringInstances[Math.min(Math.floor(wave.uniforms.waveLife * this.maxNumRings), this.ringInstances.length-1)];
        var params = lastRing ? Object.keys(lastRing.uniforms) : [];
        for(var i=0; i<params.length; i++) {
            wave.uniforms[params[i]] = lastRing.uniforms[params[i]];
        }

        if (wave.uniforms.waveLife < 0.05) {
            wave.uniforms.opacity = smoothstep(0, 0.05, wave.uniforms.waveLife)
        }

        var cutoffThresold = 1;
        if (wave.uniforms.waveLife > cutoffThresold - 0.05) {
            wave.uniforms.opacity = 1.0 - clamp(smoothstep(cutoffThresold - 0.05, cutoffThresold, wave.uniforms.waveLife), 0.0, 1.0)
        }

        var i = numActiveRings * wave.uniforms.waveLife;
        var k = remap(i, 0, this.maxNumRings, 0, 1);
        var k2 = this.evenLineDistribution ? k : 1.0 - (k - 1.0) * (k - 1.0);
        wave.uniforms.radius = remap(k2, 0, 1, this.minRingRadius, this.maxRingRadius)
        wave.uniforms.color = this.waveColor;
        wave.uniforms.brightness = 1;
        wave.uniforms.alpha = 1;
    }.bind(this))

    var prevCount = this.waveInstances.length;

    if (this.waveInstances.length > this.waveCount) {
        this.waveInstances.length = this.waveCount
    }

    while(this.waveInstances.length < this.waveCount) {

        var k = (this.waveInstances.length + 1)/5
        var k2 = this.evenLineDistribution ? k : 1.0 - (k - 1.0) * (k - 1.0);

        this.waveInstances.push({
            uniforms: {
                waveLife: this.waveInstances.length / 5,
                radius: remap(k2, 0, 1, this.minRingRadius, this.maxRingRadius),
                color: this.waveColor,
                colorCenter: 0,
                colorCenterRatio: 0,
                complexity: this.complexity,
                speed: this.speed,
                time: 0,
                alpha: 1,
                opacity: 0,
                lineType: 1,
                brightness: 1,
                wobble: this.wobble,
                wobbleFadeout: this.wobbleFadeout,
                wobbleFrequency: 0.08,
                radiusHeightScale: 1,
                radiusHeightLocalScale: 1,
                horizontalOffset: 0,
                horizontalOffset2: 2.5,
                stratified: false,
                amplitudeScale: this.amplitudeScale
            },
            uniformsTargets: {
                waveLife: this.waveInstances.length / 5,
                radius: remap(k2, 0, 1, this.minRingRadius, this.maxRingRadius),
                color: this.waveColor,
                colorCenter: 0,
                colorCenterRatio: 0,
                complexity: this.complexity,
                speed: this.speed,
                time: 0,
                alpha: 1,
                opacity: 0,
                lineType: 1,
                brightness: 1,
                wobble: this.wobble,
                wobbleFadeout: this.wobbleFadeout,
                wobbleFrequency: 0.08,
                radiusHeightScale: 1,
                radiusHeightLocalScale: 1,
                horizontalOffset: 0,
                horizontalOffset2: 2.5,
                stratified: false,
                amplitudeScale: this.amplitudeScale
            }
        });
    }

    if (prevCount != this.waveInstances.length) {
        this.waveInstances.forEach(function(instance, i) {
            instance.uniforms.waveLife = i / this.waveInstances.length;
        }.bind(this))
    }
}

Halo.prototype.updateParams = function() {
  var numRings = floor(remap(this.size, 0, 1, this.minNumRings, this.maxNumRings));

  var lastRing = this.ringInstances[this.ringInstances.length-1];

  var speed = remap(this.speed, 0.0, 1.0, 0.2, 1.0);

  while(this.ringInstances.length < numRings) {
    //$("#sizeSlider").slider({ change: function(event, ui) { HaloSetParam('size', ui.value/100); } })
    //$("#colorSlider").slider({ change: function(event, ui) { HaloSetParam('color', ui.value/100); } })
    //$("#complexitySlider").slider({ change: function(event, ui) { HaloSetParam('complexity', ui.value/100); } })
    //$("#speedSlider").slider({ change: function(event, ui) { HaloSetParam('speed', ui.value/100); } })
    //$("#brightnessSlider").slider({ change: function(event, ui) { HaloSetParam('brightness', ui.value/100); } })
    //$("#wobbleSlider").slider({ change: function(event, ui) { HaloSetParam('wobble', ui.value/100); } })

    this.ringInstances.push({
      uniforms: {
        radius: 1,
        color: 0,
        colorCenter: 0,
        colorCenterRatio: 0,
        complexity: lastRing ? lastRing.uniforms.complexity : 0,
        speed: 0.5,
        time: lastRing ? lastRing.uniforms.time : 0,
        alpha: 0,
        opacity: 1,
        lineType: 0,
        brightness: 1,
        wobble: 0,
        wobbleFadeout: this.wobbleFadeout,
        wobbleFrequency: 0.08,
        horizontalOffset: 0,
        horizontalOffset2: 2.5,
        stratified: this.stratified,
        amplitudeScale: this.amplitudeScale
      },
      uniformsTargets: {
        radius: 1,
        color: 0,
        colorCenter: 0,
        colorCenterRatio: 0,
        complexity: lastRing ? lastRing.uniforms.complexity : 0,
        speed: 0.5,
        time: 0,
        alpha: 1,
        opacity: 1,
        lineType: 0,
        brightness: 1,
        wobble: 0,
        wobbleFadeout: this.wobbleFadeout,
        wobbleFrequency: 0.08,
        horizontalOffset: 0,
        horizontalOffset2: 2.5,
        stratified: this.stratified,
        amplitudeScale: this.amplitudeScale
      },
    })
  }

  while(this.ringInstances.length > 0 && this.ringInstances.length > this.maxNumRings) {
      this.ringInstances.pop();
  }

  var hasColorGradient = (this.color.length > 1);
  for(var i=0; i<this.ringInstances.length; i++) {
    var ring = this.ringInstances[i];
    ring.uniformsTargets.alpha = (i < numRings) ? 1 : 0;
    if (ring.uniformsTargets.alpha == 0) {
      ring.uniforms.alpha = 0;
    }

    var k = remap(i, 0, this.maxNumRings, 0, 1);
    var k2 = this.evenLineDistribution ? k : 1.0 - (k - 1.0) * (k - 1.0);
    ring.uniformsTargets.radius = remap(k2, 0, 1, this.minRingRadius, this.maxRingRadius);
    ring.uniforms.radius = remap(k2, 0, 1, this.minRingRadius, this.maxRingRadius);


    ring.uniformsTargets.color = interpolateFloats(this.color, i/this.ringInstances.length);
    ring.uniformsTargets.colorCenter = hasColorGradient ? 0 : this.colorCenter;
    ring.uniformsTargets.colorCenterRatio = hasColorGradient ? 0 : this.colorCenterRatio;
    ring.uniformsTargets.complexity = this.complexity;
    ring.uniformsTargets.speed = remap(this.speed, 0.0, 1.0, 0.2, 1.0);
    ring.uniformsTargets.brightness = remap(this.brightness, 0.0, 1.0, 0.3, 1.0);
    ring.uniformsTargets.wobble = remap(this.wobble, 0.0, 1.0, 0.0, 1.0);
  }
}

Halo.prototype.addTimeStamp = function(params) {
  if (this.ringInstances.length >= this.maxNumRings) {
      return;
  }
  var lastRing = this.ringInstances[this.ringInstances.length-1];
  var k = remap(this.ringInstances.length, 0, this.maxNumRings, 0, 1);
  var k2 = this.evenLineDistribution ? k : 1.0 - (k - 1.0) * (k - 1.0);

  this.ringInstances.push({
    uniforms: {
      radius: remap(k2, 0, 1, this.minRingRadius, this.maxRingRadius),
      color: params.color,
      colorCenter: params.colorCenter,
      colorCenterRatio: params.colorCenterRatio,
      complexity: this.complexity,
      speed: params.speed || this.speed,
      time: 0,//lastRing ? lastRing.uniforms.time : 0,
      alpha: 0,
      opacity: (params.opacity !== undefined) ? params.opacity : 1,
      lineType: (params.lineType !== undefined) ? params.lineType : 0,
      brightness: 1,
      wobble: this.wobble,
      wobbleFadeout: this.wobbleFadeout,
      wobbleFrequency: 0.08,
      radiusHeightScale: 1,
      radiusHeightLocalScale: 1,
      horizontalOffset: 0,
      horizontalOffset2: 2.5,
      stratified: this.stratified,
      amplitudeScale: this.amplitudeScale
    },
    uniformsTargets: {
      radius: 1,
      color: params.color,
      colorCenter: params.colorCenter,
      colorCenterRatio: params.colorCenterRatio,
      complexity: this.complexity,
      speed: params.speed || this.speed,
      time: 0,
      alpha: 1,
      opacity: (params.opacity !== undefined) ? params.opacity : 1,
      lineType: (params.lineType !== undefined) ? params.lineType : 0,
      brightness: 1,
      wobble: 0,
      radiusHeightScale: 1,
      radiusHeightLocalScale: 1,
      horizontalOffset: 0,
      horizontalOffset2: 0,
      stratified: this.stratified,
      amplitudeScale: this.amplitudeScale
    },
  })

  for(var i=0; i<this.ringInstances.length - this.maxNumRings; i++) {
      //this.ringInstances.shift();
      this.ringInstances[i].uniformsTargets.alpha = 0;
  }

  for(var i=0; i<this.ringInstances.length; i++) {
    var ring = this.ringInstances[i];
    var k = remap(i, 0, this.maxNumRings, 0, 1);
    var k2 = this.evenLineDistribution ? k : 1.0 - (k - 1.0) * (k - 1.0);
    ring.uniformsTargets.radius = remap(k2, 0, 1, this.minRingRadius, this.maxRingRadius);
  }
}

Halo.prototype.animate = function() {
  for(var i=0; i<this.ringInstances.length; i++) {
    var ring = this.ringInstances[i];

    var maxHeightFadeout = remap(i, 0, this.maxNumRings, 0, 1);
    var minHeightFadeout = clamp(remap(i, 0, (this.minNumRings + this.size * (this.maxNumRings - this.minNumRings)), 0, 1), 0, 1);
    ring.uniforms.radiusHeightScale = this.ringInstances.length/this.maxNumRings;
    ring.uniforms.radiusHeightLocalScale = clamp(remap((i+1)/this.maxNumRings, 0, this.size, 0, 1), 0, 1);
    ring.uniforms.radius      += (ring.uniformsTargets.radius - ring.uniforms.radius) * this.growth;
    ring.uniforms.color       += (ring.uniformsTargets.color - ring.uniforms.color) * this.growth;
    ring.uniforms.colorCenter      += (ring.uniformsTargets.colorCenter - ring.uniforms.colorCenter) * this.growth;
    ring.uniforms.colorCenterRatio += (ring.uniformsTargets.colorCenterRatio - ring.uniforms.colorCenterRatio) * this.growth;
    ring.uniforms.complexity  += (ring.uniformsTargets.complexity - ring.uniforms.complexity) * this.growth;
    ring.uniforms.speed       += (ring.uniformsTargets.speed - ring.uniforms.speed) * this.growth;
    ring.uniforms.brightness  += (ring.uniformsTargets.brightness - ring.uniforms.brightness) * this.growth;
    ring.uniforms.alpha       += (ring.uniformsTargets.alpha - ring.uniforms.alpha) * this.growth/2;
    ring.uniforms.wobble      += (ring.uniformsTargets.wobble - ring.uniforms.wobble) * this.growth/2;
    ring.uniforms.index       = i/this.ringInstances.length;
    ring.uniforms.time        = this.time * 0.25;
    ring.uniforms.stratified  = this.stratified;
    ring.uniforms.highlight = 0;
    ring.uniforms.lateralSpeedup = this.lateralSpeedup;
    ring.uniforms.horizontalNoiseScale = this.horizontalNoiseScale;
    ring.uniforms.amplitudeScale = this.amplitudeScale;
    ring.uniforms.complexityFrequency = this.complexityFrequency;

    if (this.highlightRing) {
        var s = (i - 1) / this.maxNumRings;
        var ns = (i) / this.maxNumRings;
        if (s <= this.highlightRing && this.highlightRing < ns) {
            ring.uniforms.highlight = 4 * this.window.getPixelRatio();
        }
    }

    var seconds = this.window.getTime().getElapsedSeconds();

    ring.uniforms.horizontalOffset =  this.stratified ? 0.05 * (seconds/5 - Math.floor(seconds/5)) : 5 * (seconds/5 - Math.floor(seconds/5));
    ring.uniforms.horizontalOffset2  = this.stratified ? 0.05 * ((seconds + 2.5)/5 - Math.floor((seconds + 2.5)/5)) : 5 * ((seconds + 2.5)/5 - Math.floor((seconds + 2.5)/5));


    if (ring.uniformsTargets.alpha == 0 && ring.uniforms.alpha < 0.01) {
      this.ringInstances.splice(i, 1);
      i--;
    }
  }


  for(var i=0; i<this.ringInstances.length; i++) {
    var ring = this.ringInstances[i];
    var k = remap(i, 0, this.maxNumRings, 0, 1);
    var k2 = this.evenLineDistribution ? k : 1.0 - (k - 1.0) * (k - 1.0);
    ring.uniformsTargets.radius = remap(k2, 0, 1, this.minRingRadius, this.maxRingRadius);
  }
}

Halo.prototype.setColorTexture = function(path) {
    io.loadImage(path, function(err, img) {
        if (err) {
            console.log(err);
            return;
        }
        console.log('old', this.colorTexture.getWidth(), this.colorTexture.getHeight())
        console.log('new', img.width, img.height)
        this.colorTexture.update(img, img.width, img.height)
    }.bind(this))
}

Halo.prototype.setColorSpectrum = function(colors) {
    this.spectrum = colors;
    var tex = this.colorSpectrumTexture;
    console.log('Halo.setColorSpectrum', colors, tex.getWidth(), tex.getHeight());

    var gradient = createGradient(colors, tex.getWidth(), tex.getHeight());
    tex.update(gradient);
    this.defaultRingUniforms.colorTexture = this.colorSpectrumTexture
}

Halo.prototype.drawMeshInstances = function(ctx, camera, program, instances, defaultUniforms) {
  ctx.bindProgram(program);
  ctx.bindMesh(this.ringMesh);

  var numTextures = 0;
  for (uniformName in defaultUniforms) {
      if (program.hasUniform(uniformName)) {
          ctx.bindTexture(defaultUniforms[uniformName], numTextures)
          program.setUniform(uniformName, numTextures);
          numTextures++;
      }
  }

  for (var i = 0; i < instances.length; i++) {
    var instance = instances[i];
    if (instance.uniforms.highlight) {
        ctx.pushState(ctx.LINE_WIDTH_BIT);
        ctx.setLineWidth(instance.uniforms.highlight);
        instance.uniforms.color = -1;
    }
    for (uniformName in instance.uniforms) {
        if (program.hasUniform(uniformName)) {
            program.setUniform(uniformName, instance.uniforms[uniformName])
        }
    }
    ctx.drawMesh();
    if (instance.uniforms.highlight) {
        ctx.popState();
    }
  }
}

Halo.prototype.draw = function(camera, camera2D, w, h) {
  var ctx = this.ctx;

  this.defaultRingUniforms.lineTexture = this.solidLines ? this.lineSolidTexture : this.lineDotsTexture;

  ctx.pushModelMatrix()
  ctx.rotate(this.tilt/180*Math.PI, [1, 0, 0])

  ctx.pushState(ctx.LINE_WIDTH_BIT);
  //ctx.setLineWidth(this.solidLines ? 1 : 2);
  ctx.setLineWidth(1);
  this.drawMeshInstances(ctx, camera, this.ringProgram, this.ringInstances, this.defaultRingUniforms)
  ctx.setLineWidth(2);
  this.drawMeshInstances(ctx, camera, this.ringProgram, this.waveInstances, this.defaultRingUniforms)
  ctx.setLineWidth(2);
  if (this.showGrid) {
      this.drawMeshInstances(ctx, camera, this.gridProgram, this.gridLineInstances, this.defaultGridUniforms)
  }
  ctx.popState();

  if (this.showAuraAtRing > -1) {
      ctx.bindProgram(this.auraProgram);
      this.auraProgram.setUniform('opacity', this.auraOpacity);
      ctx.bindMesh(this.auraMesh);
      ctx.drawMesh();
  }

  //TODO: this.gridLineLabels.forEach(function(label, i) {
    //var pos = camera.getScreenPos({ x: 0, y: 0, z:  label.radius * 2}, w, h);
    //var pos3 = label._position;
    //pos3.copy(pos);
    //label.setPosition(pos3);
    //label.draw(camera2D);
  //}.bind(this));

  ctx.popModelMatrix()
}

Halo.prototype.drawSolid = function(camera) {
  var ctx = this.ctx;

  ctx.pushModelMatrix()
  ctx.rotate(this.tilt/180*Math.PI, [1, 0, 0])

  this.backgroundTransparent[0] = this.background[0];
  this.backgroundTransparent[1] = this.background[1];
  this.backgroundTransparent[2] = this.background[2];
  ctx.pushState(ctx.LINE_WIDTH_BIT);
  ctx.setLineWidth(3 * this.window.getPixelRatio());

  this.defaultRingUniforms.lineTexture = this.lineSolidTexture;
  this.drawMeshInstances(ctx, camera, this.ringProgram, this.ringInstances, this.defaultRingUniforms);
  this.drawMeshInstances(ctx, camera, this.ringProgram, this.waveInstances, this.defaultRingUniforms)
  ctx.popState();

  ctx.popModelMatrix()
}

Halo.prototype.dispose = function() {
  this.mesh.material.dispose();
  this.mesh.dispose();
}

Halo.HaloModes = HaloModes;

module.exports = Halo;

},{"create-gradient":2,"geo-arc":3,"interpolate-floats":4,"is-browser":13,"make-circle":5,"pex-color":26,"pex-io":64,"pex-math/Utils":73,"pex-math/Vec2":74,"pex-math/Vec3":75,"ramda":98,"re-map":99}],7:[function(require,module,exports){

},{}],8:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],9:[function(require,module,exports){
module.exports = hsl2rgb
function hsl2rgb (hsl) {
  var h = hsl[0],
    s = hsl[1],
    l = hsl[2],
    t1, t2, t3, rgb, val

  if (s === 0) {
    val = l
    return [val, val, val]
  }

  if (l < 0.5) {
    t2 = l * (1 + s)
  } else {
    t2 = l + s - l * s
  }
  t1 = 2 * l - t2

  rgb = [0, 0, 0]
  for (var i = 0; i < 3; i++) {
    t3 = h + 1 / 3 * -(i - 1)
    if (t3 < 0) {
      t3++
    }
    if (t3 > 1) {
      t3--
    }

    if (6 * t3 < 1) {
      val = t1 + (t2 - t1) * 6 * t3
    } else if (2 * t3 < 1) {
      val = t2
    } else if (3 * t3 < 2) {
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6
    } else {
      val = t1
    }

    rgb[i] = val
  }

  return rgb
}

},{}],10:[function(require,module,exports){
module.exports = rgb2hsl
function rgb2hsl (rgb) {
  var r = rgb[0],
    g = rgb[1],
    b = rgb[2],
    min = Math.min(r, g, b),
    max = Math.max(r, g, b),
    delta = max - min,
    h, s, l

  if (max === min) {
    h = 0
  } else if (r === max) {
    h = (g - b) / delta
  } else if (g === max) {
    h = 2 + (b - r) / delta
  } else if (b === max) {
    h = 4 + (r - g) / delta
  }

  h = Math.min(h * 60, 360)

  if (h < 0) {
    h += 360
  }

  l = (min + max) / 2

  if (max === min) {
    s = 0
  } else if (l <= 0.5) {
    s = delta / (max + min)
  } else {
    s = delta / (2 - max - min)
  }

  return [h / 360, s, l]
}

},{}],11:[function(require,module,exports){
(function (global){
var win;

if (typeof window !== "undefined") {
    win = window;
} else if (typeof global !== "undefined") {
    win = global;
} else if (typeof self !== "undefined"){
    win = self;
} else {
    win = {};
}

module.exports = win;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],12:[function(require,module,exports){
var lerp = require('lerp-array');

function interpolateArrays(arrays, t) {
    if (t >= 1) {
        return arrays[arrays.length - 1];
    }
    if (arrays.length == 1) {
        return arrays[0];
    }
    var numStops = arrays.length - 1;
    var stopF = t * numStops;
    var stop = Math.floor(stopF);
    var k = stopF - stop;
    return lerp(arrays[stop], arrays[stop+1], k);
}

module.exports = interpolateArrays;

},{"lerp-array":16}],13:[function(require,module,exports){
module.exports = true;
},{}],14:[function(require,module,exports){
'use strict'

var navigator = require('global/window').navigator

module.exports = (function detect_iOS (userAgent) {
  return /iPad|iPhone|iPod/.test(userAgent)
})(navigator ? navigator.userAgent : '')

},{"global/window":11}],15:[function(require,module,exports){
var plask = require('plask-wrap')

module.exports = plask.SkCanvas ? true : false

},{"plask-wrap":94}],16:[function(require,module,exports){
var lerp = require('lerp')

module.exports = function lerpValues(value1, value2, t, out) {
    if (typeof value1 === 'number'
            && typeof value2 === 'number')
        return lerp(value1, value2, t)
    else { //assume array
        var len = Math.min(value1.length, value2.length)
        out = out||new Array(len)
        for (var i=0; i<len; i++) 
            out[i] = lerp(value1[i], value2[i], t)
        return out
    }
}
},{"lerp":17}],17:[function(require,module,exports){
function lerp(v0, v1, t) {
    return v0*(1-t)+v1*t
}
module.exports = lerp
},{}],18:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.7.1
(function() {
  var getNanoSeconds, hrtime, loadTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - loadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    loadTime = getNanoSeconds();
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

}).call(this,require('_process'))
},{"_process":95}],19:[function(require,module,exports){
var Mat4 = require('pex-math/Mat4');
var Vec2 = require('pex-math/Vec2');
var Vec3 = require('pex-math/Vec3');
var Vec4 = require('pex-math/Vec4');

var STR_ERROR_NOT_IMPLEMENTED = '%s not implemented.';

var Y_AXIS    = Vec3.yAxis();
var TEMP_VEC4 = Vec4.create();
var TEMP_MAT4 = Mat4.create();

function CameraAbstract(){
    this._position = [0,0,5];
    this._target   = Vec3.create();
    this._up       = Vec3.yAxis();

    this._aspectRatio = -1;

    this._fov  = 0;
    this._near = 0;
    this._far  = 0;

    this._frustumLeft   = -1;
    this._frustumRight  = -1;
    this._frustumBottom = -1;
    this._frustumTop    = -1;

    this._matrixProjection = Mat4.create();
    this._matrixView       = Mat4.create();
    this._matrixViewInv    = Mat4.create();

    this._matrixProjectionDirty = true;
    this._matrixViewDirty       = true;
    this._matrixViewInvDirty    = true;
}

CameraAbstract.prototype.setTarget = function(target){
    Vec3.set(this._target,target);
    this._matrixViewDirty = true;
};

CameraAbstract.prototype.getTarget = function(out){
    out = out === undefined ? Vec3.create() : out;
    return Vec3.set(out,this._target);
};

CameraAbstract.prototype.setPosition = function(position){
    Vec3.set(this._position,position);
    this._matrixViewDirty = true;
};

CameraAbstract.prototype.getPosition = function(out){
    out = out === undefined ? Vec3.create() : out;
    return Vec3.set(out, this._position);
};

CameraAbstract.prototype.setUp = function(up){
    Vec3.set(this._up, up);
    this._matrixViewDirty = true;
};

CameraAbstract.prototype.getUp = function(out){
    out = out === undefined ? Vec3.create() : out;
    return Vec3.set(out, this._up);
};

CameraAbstract.prototype.lookAt = function(from, to, up){
    up = up === undefined ? Y_AXIS : up;

    Vec3.set(this._position,from);
    Vec3.set(this._target,to);
    Vec3.set(this._up,up);
    this._matrixViewDirty = true;
};

CameraAbstract.prototype.getDistance = function(){
    return Vec3.distance(this._target, this._position);
};

CameraAbstract.prototype.setNear = function(near){
    this._near = near;
    this._matrixProjectionDirty = true;
};

CameraAbstract.prototype.getNear = function(){
    return this._near;
};

CameraAbstract.prototype.setFar = function(far){
    this._far = far;
    this._matrixProjectionDirty = true;
};

CameraAbstract.prototype.getFar = function(){
    return this._far;
};

CameraAbstract.prototype.getAspectRatio = function(){
    return this._aspectRatio;
};

CameraAbstract.prototype._updateProjectionMatrix = function(){
    throw new Error(STR_ERROR_NOT_IMPLEMENTED.replace('%s','updateProjectionMatrix'));
};

CameraAbstract.prototype._updateViewMatrix = function(){
    if(!this._matrixViewDirty){
        return;
    }
    Mat4.lookAt(this._matrixView, this._position,this._target,this._up);
    this._matrixViewDirty = false;
    this._matrixViewInvDirty = true;
};

CameraAbstract.prototype.getProjectionMatrix = function(){
    this._updateProjectionMatrix();
    return this._matrixProjection;
};

CameraAbstract.prototype.getViewMatrix = function(){
    this._updateViewMatrix();
    return this._matrixView;
};

CameraAbstract.prototype.getInverseViewMatrix = function(out){
    this._updateViewMatrix();
    if(this._matrixViewInvDirty){
        Mat4.invert(Mat4.set(this._matrixViewInv,this._matrixView));
        this._matrixViewInvDirty = false;
    }
    out = out === undefined ? TEMP_MAT4 : out;
    return Mat4.set(out,this._matrixViewInv);
};

CameraAbstract.prototype.setFrustumOffset = function(x, y, width, height, widthTotal, heightTotal){
    throw new Error(STR_ERROR_NOT_IMPLEMENTED.replace('%s','setFrusumOffset'));
};

CameraAbstract.prototype.getViewRay = function(point, width, height){
    throw new Error(STR_ERROR_NOT_IMPLEMENTED.replace('%s','getViewRay'));
};

CameraAbstract.prototype.getWorldRay = function(point, width, height){
    throw new Error(STR_ERROR_NOT_IMPLEMENTED.replace('%s','getWorldMatrix'));
};

CameraAbstract.prototype.getFrustumClippingPlanes = function(){
    throw new Error(STR_ERROR_NOT_IMPLEMENTED.replace('%s','getFrustumClippingPlanes'));
};

module.exports = CameraAbstract;
},{"pex-math/Mat4":71,"pex-math/Vec2":74,"pex-math/Vec3":75,"pex-math/Vec4":76}],20:[function(require,module,exports){
var Vec2  = require('pex-math/Vec2');
var Vec3  = require('pex-math/Vec3');
var Mat4  = require('pex-math/Mat4');
var Quat  = require('pex-math/Quat');
var Plane = require('pex-geom/Plane');

//https://www.talisman.org/~erlkonig/misc/shoemake92-arcball.pdf

var DEFAULT_RADIUS_SCALE = 1.0;
var DEFAULT_SPEED = 0.35;
var DEFAULT_DISTANCE_STEP = 0.05;

var TEMP_VEC2_0 = Vec2.create();
var TEMP_VEC2_1 = Vec2.create();
var TEMP_VEC3_0 = Vec3.create();
var TEMP_VEC3_1 = Vec3.create();
var TEMP_VEC3_2 = Vec3.create();
var TEMP_QUAT_0 = Quat.create();
var TEMP_QUAT_1 = Quat.create();

var X_AXIS = [1,0,0];
var Y_AXIS = [0,1,0];
var Z_AXIS = [0,0,1];

var ConstrainAxisMode = {
    NONE   : -1,
    CAMERA : 0,
    WORLD  : 1
};

//http://jsperf.com/quaternion-slerp-implementations
//modified to prevent taking shortest path
function slerpLongest(a,b,t){
    var ax = a[0];
    var ay = a[1];
    var az = a[2];
    var aw = a[3];
    var bx = b[0];
    var by = b[1];
    var bz = b[2];
    var bw = b[3];

    var omega, cosom, sinom, scale0, scale1;

    cosom = ax * bx + ay * by + az * bz + aw * bw;

    if ( (1.0 - cosom) > 0.000001 ) {
        omega  = Math.acos(cosom);
        sinom  = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
    } else {
        scale0 = 1.0 - t;
        scale1 = t;
    }

    a[0] = scale0 * ax + scale1 * bx;
    a[1] = scale0 * ay + scale1 * by;
    a[2] = scale0 * az + scale1 * bz;
    a[3] = scale0 * aw + scale1 * bw;

    return a;
}

function Arcball(camera, windowWidth, windowHeight){
    this._camera = null;;

    this._boundsSize = [windowWidth,windowHeight];
    this._center     = [windowWidth * 0.5, windowHeight * 0.5];

    this._radius      = null;
    this._radiusScale = null;
    this.setRadiusScale(DEFAULT_RADIUS_SCALE);

    this._speed = null;
    this.setSpeed(DEFAULT_SPEED);

    this._zoom = false;

    this._distanceStep   = DEFAULT_DISTANCE_STEP;
    this._distance       = 0;
    this._distancePrev   = 0;
    this._distanceTarget = 0;
    this._distanceMax    = Number.MAX_VALUE;
    this._distanceMin    = Number.MIN_VALUE;

    this._drag = false;

    this._posDown    = Vec2.create();
    this._posDrag    = Vec2.create();
    this._posDownPtr = Vec3.create();
    this._posDragPtr = Vec3.create();
    this._posMovePtr = Vec3.create();

    this._orientCurr   = Quat.create();
    this._orientDown   = Quat.create();
    this._orientDrag   = Quat.create();
    this._orientTarget = Quat.create();

    this._pan = false;

    this._targetCameraView          = Vec3.create();
    this._targetCameraWorld         = Vec3.create();
    this._targetCameraWorldOriginal = Vec3.create();

    this._planeTargetView   = Plane.create();
    this._planeTargetWorld  = Plane.create();

    this._planePosDownView = Vec3.create();
    this._planePosDragView = Vec3.create();

    this._planePosDownWorld = Vec3.create();
    this._planePosDragWorld = Vec3.create();

    this._constrain           = false;
    this._constrainAxes       = [Vec3.copy(X_AXIS), Vec3.copy(Y_AXIS), Vec3.copy(Z_AXIS)];
    this._constrainAxisIndex  = 1;
    this._constrainMode       = ConstrainAxisMode.WORLD;
    this._constrainModePrev   = -1;

    this._interactive = true;

    this._updateRadius();
    this.setCamera(camera);
}

Arcball.prototype.setCamera = function(camera){
    this._camera         = camera;
    this._distance       = camera.getDistance();
    this._distancePrev   = this._distance;
    this._distanceTarget = this._distance;

    Vec2.toZero(this._posDown);
    Vec2.toZero(this._posDrag);
    Vec3.toZero(this._posDownPtr);
    Vec3.toZero(this._posDragPtr);
    Vec3.toZero(this._posMovePtr);

    Quat.fromMat4(this._orientCurr,camera.getViewMatrix());
    Quat.identity(this._orientDown);
    Quat.identity(this._orientDrag);
    Quat.set(this._orientTarget,this._orientCurr);

    Vec3.toZero(this._targetCameraView);
    Vec3.toZero(this._targetCameraWorld);
    Vec3.set(this._targetCameraWorldOriginal,camera.getTarget());

    Vec3.set3(this._planeTargetView[0],0,0,0);
    Vec3.set3(this._planeTargetView[1],0,1,0);

    Vec3.set3(this._planeTargetWorld[0],0,0,0);
    Vec3.set3(this._planeTargetWorld[1],0,1,0);

    Vec3.toZero(this._planePosDownView);
    Vec3.toZero(this._planePosDragView);

    Vec3.toZero(this._planePosDownWorld);
    Vec3.toZero(this._planePosDragWorld);
};

Arcball.prototype.setLookDirection = function(direction){
    direction = Vec3.normalize(Vec3.copy(direction));
    var orientation = Quat.fromDirection(Quat.create(),direction);
    Quat.set(this._orientTarget,Quat.normalize(Quat.invert(orientation)));
};

Arcball.prototype.getBoundsSize = function(out){
    out = out === undefined ? Vec2.create() : out;
    return Vec2.set(out,this._boundsSize);
};

Arcball.prototype.setDistanceMin = function(min){
    this._distanceMin = min;
};

Arcball.prototype.setDistanceMax = function(max){
    this._distanceMax = max;
};

Arcball.prototype.setDistance = function(distance){
    this._distanceTarget = distance;
};

Arcball.prototype.getDistance = function(){
    return this._distance;
};

Arcball.prototype.setRadiusScale = function(scale){
    this._radiusScale = 1.0 / (1.0 / (scale === undefined ? DEFAULT_RADIUS_SCALE : scale) * 2);
    this._updateRadius();
};

Arcball.prototype.getRadiusScale = function(){
    return this._radiusScale;
};

Arcball.prototype.setSpeed = function(speed){
    this._speed = speed;
};

Arcball.prototype.getSpeed = function(){
    return this._speed;
};

Arcball.prototype.enable = function(){
    this._interactive = true;
};

Arcball.prototype.disable = function(){
    this._interactive = false;
};

Arcball.prototype.isEnabled = function(){
    return this._interactive;
};

Arcball.prototype._updateModifierInput = function(e){
    this._constrainModePrev = this._constrainMode;
    this._constrainMode     = e.shiftKey && e.ctrlKey ? ConstrainAxisMode.CAMERA : e.shiftKey && e.altKey ? ConstrainAxisMode.WORLD : ConstrainAxisMode.NONE;
    this._constrain         = this._constrainMode != ConstrainAxisMode.NONE;
    this._pan               = e.shiftKey && !this._constrain
};

Arcball.prototype._updateRadius = function(){
    var boundsSize = this._boundsSize;
    this._radius = Math.min(boundsSize[0],boundsSize[1]) * this._radiusScale;
};

Arcball.prototype._mapSphere = function(pos,constrain){
    pos       = Vec2.set(TEMP_VEC2_0,pos);
    constrain = this._constrain && (constrain || constrain === undefined);

    var dir = this._distance < 0 ? -1 : 1;

    pos = Vec2.sub(pos,this._center);
    pos = Vec2.scale(pos, 1.0 / this._radius);
    pos = Vec3.set3(TEMP_VEC2_1,pos[0],pos[1] * dir, 0);

    var r = Vec3.lengthSq(pos);
    if(r > 1.0){
        Vec3.normalize(pos);
    }
    else{
        pos[2] = Math.sqrt(1 - r);
    }

    if(constrain){
        this._constrainToAxis(pos,this._constrainAxes[this._constrainAxisIndex]);
    }

    return pos;
};

Arcball.prototype._constrainToAxis = function(pos, axis){
    var dot  = Vec3.dot(pos,axis);
    var proj = Vec3.sub(pos,Vec3.scale(Vec3.set(TEMP_VEC3_2,axis),dot));
    var norm = Vec3.length(proj);

    if(norm > 0){
        if(proj[2] < 0.0){
            Vec3.invert(proj);
        }
        Vec3.normalize(pos);
    } else if(axis[2] == 1.0){
        Vec3.set3(pos,1,0,0);
    } else {
        Vec3.set3(pos,-axis[1],axis[0],0);
    }
    return pos;
};

//Graphics Gems IV, Page 177, Ken Shoemake
Arcball.prototype._updateNearestAxis = function(pos){
    if(!this._constrain){
        return;
    }

    var constrainAxes = this._constrainAxes;

    var max = -1;
    var index  = 0;

    for(var i = 0, l = constrainAxes.length, point, dot; i < l; ++i){
        point = this._constrainToAxis(Vec3.set(TEMP_VEC3_0,pos), constrainAxes[i]);
        dot   = Vec3.dot(point, pos);
        if(dot > max){
            index = i;
            max = dot;
        }
    }
    this._constrainAxisIndex = index;
};

Arcball.prototype.onMouseDown = function(e){
    if(!this._interactive){
        return;
    }

    this._updateModifierInput(e);
    this._drag = false;

    var boundsHeight = this._boundsSize[1];
    var mousePos     = Vec2.set2(TEMP_VEC2_0, e.x, e.y);
    this._posDown    = Vec2.set(this._posDown, mousePos);

    var pos = Vec2.set2(TEMP_VEC2_0, mousePos[0],boundsHeight - mousePos[1]);

    Vec3.set(this._posDownPtr, this._mapSphere(pos));
    Quat.set(this._orientDown, this._orientCurr);
    Quat.identity(this._orientDrag);

    if(this._pan){

        Vec3.set(this._targetCameraWorld,this._camera.getTarget());
        Vec3.multMat4(Vec3.set(this._targetCameraView,this._targetCameraWorld),this._camera.getViewMatrix());

        Vec3.set(this._planeTargetView[0],this._targetCameraView);
        Vec3.set(this._planeTargetView[1],Z_AXIS);

        Vec3.multMat4(Vec3.set(this._planeTargetWorld[1],this._planeTargetView[1]),this._camera.getInverseViewMatrix());
    }
};

Arcball.prototype.onMouseDrag = function(e){
    if(!this._interactive){
        return;
    }

    this._updateModifierInput(e);
    this._drag = true;

    var boundsWidth  = this._boundsSize[0];
    var boundsHeight = this._boundsSize[1];
    var mousePos     = Vec2.set2(TEMP_VEC2_0, e.x, e.y);

    this._posDrag = Vec2.set(this._posDrag,mousePos);

    if(this._pan){
        Plane.getRayIntersection(this._planeTargetView,this._camera.getViewRay(this._posDown,boundsWidth,boundsHeight),this._planePosDownView);
        Plane.getRayIntersection(this._planeTargetView,this._camera.getViewRay(this._posDrag,boundsWidth,boundsHeight),this._planePosDragView);

        var invViewMatrix = this._camera.getInverseViewMatrix();

        Vec3.multMat4(Vec3.set(this._planePosDownWorld,this._planePosDownView),invViewMatrix);
        Vec3.multMat4(Vec3.set(this._planePosDragWorld,this._planePosDragView),invViewMatrix);

        var targetCameraWorld = Vec3.set(TEMP_VEC3_0,this._targetCameraWorld);
        var planePosDragWorld = Vec3.set(TEMP_VEC3_1,this._planePosDragWorld);
        var planePosDelta     = Vec3.sub(planePosDragWorld,this._planePosDownWorld);

        this._camera.setTarget(Vec3.sub(targetCameraWorld,planePosDelta));
    }
    else {
        var pos = Vec2.set2(TEMP_VEC2_0, mousePos[0], boundsHeight - mousePos[1]);

        var posDownPtr = this._posDownPtr;
        var posDragPtr = Vec3.set(this._posDragPtr,this._mapSphere(pos));
        var temp       = Vec3.cross(Vec3.set(Vec3.create(),posDownPtr), posDragPtr);

        Quat.set4(this._orientDrag,temp[0],temp[1],temp[2],Vec3.dot(posDownPtr,posDragPtr));
        Quat.normalize(this._orientDrag);
        Quat.set(this._orientTarget, this._orientDrag);
        Quat.mult(this._orientTarget, this._orientDown);
    }
};

Arcball.prototype.onMouseMove = function(e){
    this._updateModifierInput(e);
    var pos = Vec2.set2(TEMP_VEC2_0, e.x, this._boundsSize[1] - e.y);
    Vec3.set(this._posMovePtr,this._mapSphere(pos,false));
};

Arcball.prototype.onKeyPress = function(e){
    this._updateModifierInput(e);
};

Arcball.prototype.onKeyUp = function(){
    this._constrain = false;
};

Arcball.prototype.onMouseUp = function(e){
    this._constrain = !e.shiftKey ? false : this._constrain;
    this._drag = false;
};

Arcball.prototype.onMouseScroll = function(e){
    if(!this._interactive){
        return;
    }
    var direction = e.dy < 0 ? -1 : e.dy > 0 ? 1 : 0;
    if(direction == 0){
        return;
    }
    this._distanceTarget += direction * -1 * this._distanceStep * (e.altKey ? 2.0 : 1.0);
    this._distanceTarget  = Math.max(this._distanceMin, Math.min(this._distanceTarget,this._distanceMax));
};

Arcball.prototype.onWindowResize = function(e){
    var width  = e.width;
    var height = e.height;
    Vec2.set2(this._boundsSize,width,height);
    Vec2.set2(this._center, width * 0.5, height * 0.5);
    this._updateRadius();
};

Arcball.prototype.apply = function(){
    this._distance += (this._distanceTarget - this._distance) * this._speed;

    var orient = Quat.set(TEMP_QUAT_0,this._orientCurr);
    orient[3] *= -1;

    if(this._constrain){
        Quat.slerp(this._orientCurr,this._orientTarget,this._speed);

        if(!this._drag){
            switch (this._constrainMode){
                case ConstrainAxisMode.CAMERA :
                    if(this._constrainMode != this._constrainModePrev){
                        Vec3.set(this._constrainAxes[0],X_AXIS);
                        Vec3.set(this._constrainAxes[1],Y_AXIS);
                        Vec3.set(this._constrainAxes[2],Z_AXIS);
                    }
                    break;
                case ConstrainAxisMode.WORLD :
                    var orientWorld = Quat.invert(Quat.set(TEMP_QUAT_1,orient));

                    Vec3.set(this._constrainAxes[0],X_AXIS);
                    Vec3.set(this._constrainAxes[1],Y_AXIS);
                    Vec3.set(this._constrainAxes[2],Z_AXIS);
                    Vec3.multQuat(this._constrainAxes[0],orientWorld);
                    Vec3.multQuat(this._constrainAxes[1],orientWorld);
                    Vec3.multQuat(this._constrainAxes[2],orientWorld);
                    break;
            }
        }
    } else {
        slerpLongest(this._orientCurr,this._orientTarget,this._speed);
    }

    this._updateNearestAxis(this._posMovePtr);

    var target   = this._camera.getTarget();
    var offset   = Vec3.multQuat(Vec3.set3(TEMP_VEC3_0,0,0,this._distance),orient);
    var position = Vec3.add(Vec3.set(TEMP_VEC3_1,target),offset);
    var up       = Vec3.multQuat(Vec3.set(TEMP_VEC3_0,Y_AXIS),orient);

    this._camera.lookAt(position,target,up);

    this._zoom = this._distance != this._distancePrev;
    this._distancePrev = this._distance;
};

Arcball.prototype.resetPanning = function(){
    this._camera.setTarget(this._targetCameraWorldOriginal);
    this._pan = false;
};

Arcball.prototype.isPanning = function(){
    return this._pan;
};

Arcball.prototype.isZooming = function(){
    return this._zoom;
};

Arcball.prototype.isDragging = function(){
    return this._drag;
};

Arcball.prototype.isConstrained = function(){
    return this._constrain;
};

Arcball.prototype.isActive = function(){
    return this._pan || this._zoom || this._drag || this._constrain;
};

Arcball.prototype.getState = function(){
    return [this._camera.getPosition(),this._camera.getTarget(),this._camera.getUp(),this._interactive];
};

Arcball.prototype.setState = function(state){
    if(state.length !== 4){
        throw new Error('Invalid state.');
    }
    this._camera.lookAt(state[0],state[1],state[2]);
    this._interactive = state[3];
    this.setCamera(this._camera);
};

module.exports = Arcball;
},{"pex-geom/Plane":56,"pex-math/Mat4":71,"pex-math/Quat":72,"pex-math/Vec2":74,"pex-math/Vec3":75}],21:[function(require,module,exports){
function CameraOrbiter(){

}

CameraOrbiter.prototype.onMouseDown = function(){

};

CameraOrbiter.prototype.onMouseDrag = function(){

};

CameraOrbiter.prototype.onMouseUp = function(){

};

CameraOrbiter.prototype.onMouseWheel = function(){

};


module.exports = CameraOrbiter;

},{}],22:[function(require,module,exports){
var AbstractCamera = require('./AbstractCamera');
var Mat4 = require('pex-math/Mat4');

var DEFAULT_NEAR = -10;
var DEFAULT_FAR  =  10;

function OrthoCamera(aspectRatio, near, far){
    AbstractCamera.call(this);

    near = near === undefined ? DEFAULT_NEAR : near;
    far  = far  === undefined ? DEFAULT_FAR  : far;

    this._frustumLeftInitial   = -1;
    this._frustumRightInitial  = -1;
    this._frustumBottomInitial = -1;
    this._frustumTopInitial    = -1;

    this._aspectRatio = aspectRatio;
    this.setOrtho(-aspectRatio, aspectRatio, -1, 1, near, far);
}

OrthoCamera.prototype = Object.create(AbstractCamera.prototype);
OrthoCamera.prototype.constructor = OrthoCamera;

OrthoCamera.prototype.setAspectRatio = function(aspectRatio){
    this._aspectRatio  = aspectRatio;
    this._frustumLeft  = this._frustumLeftInitial  = -aspectRatio;
    this._frustumRight = this._frustumRightInitial =  aspectRatio;
    this._matrixProjectionDirty = true;
};

OrthoCamera.prototype.setOrtho = function(left, right, bottom, top, near, far){
    this._frustumLeft   = this._frustumLeftInitial   = left;
    this._frustumRight  = this._frustumRightInitial  = right;
    this._frustumBottom = this._frustumBottomInitial = bottom;
    this._frustumTop    = this._frustumTopInitial    = top;
    this._near          = near;
    this._far           = far;
    this._matrixProjectionDirty = true;
};

OrthoCamera.prototype._updateProjectionMatrix = function(){
    if(!this._matrixProjectionDirty){
        return;
    }
    Mat4.ortho(this._matrixProjection, this._frustumLeft, this._frustumRight, this._frustumBottom, this._frustumTop, this._near, this._far);
    this._matrixProjectionDirty = false;
};

OrthoCamera.prototype.scaleFrustum = function(n){
    this._frustumLeft   = this._frustumLeftInitial * n;
    this._frustumRight  = this._frustumRightInitial * n;
    this._frustumBottom = this._frustumBottomInitial * n;
    this._frustumTop    = this._frustumTopInitial * n;
    this._matrixProjectionDirty = true;
};

module.exports = OrthoCamera;
},{"./AbstractCamera":19,"pex-math/Mat4":71}],23:[function(require,module,exports){
var AbstractCamera = require('./AbstractCamera');
var Vec2 = require('pex-math/Vec2');
var Vec3 = require('pex-math/Vec3');
var Vec4 = require('pex-math/Vec4');
var Mat4 = require('pex-math/Mat4');

var DEFAULT_FOV          = 60.0;
var DEFAULT_NEAR         = 0.01;
var DEFAULT_FAR          = 10.0;
var DEFAULT_ASPECT_RATIO = 4 / 3;

var TEMP_VEC2   = Vec2.create();
var TEMP_VEC3_0 = Vec3.create();
var TEMO_VEC3_1 = Vec3.create();
var TEMP_VEC3_2 = Vec3.create();
var TEMP_VEC4   = Vec4.create();
var TEMP_MAT4   = Mat4.create();

function PerspCamera(fov, aspectRatio, near, far){
    AbstractCamera.call(this);

    this._aspectRatio = aspectRatio;

    this.setPerspective(
        fov         === undefined ? DEFAULT_FOV : fov,
        aspectRatio === undefined ? DEFAULT_ASPECT_RATIO : aspectRatio,
        near        === undefined ? DEFAULT_NEAR : near,
        far         === undefined ? DEFAULT_FAR : far
    );
}

PerspCamera.prototype = Object.create(AbstractCamera.prototype);
PerspCamera.prototype.constructor = PerspCamera;

PerspCamera.prototype.setFov = function(fov){
    this._fov = fov;
    this._matrixProjectionDirty = true;
};

PerspCamera.prototype.getFov = function(){
    return this._fov;
};

PerspCamera.prototype.setAspectRatio = function(aspectRatio){
    this._aspectRatio = aspectRatio;
    this._matrixProjectionDirty = true;
};

PerspCamera.prototype.setDistance = function(distance){
    Vec3.sub(this._position, this._target);
    Vec3.normalize(this._position);
    Vec3.scale(this._position, distance);
    this._matrixViewDirty = true;
};

PerspCamera.prototype.setPerspective = function(fov, aspectRatio, near, far){
    this._fov         = fov;
    this._aspectRatio = aspectRatio;
    this._near        = near;
    this._far         = far;
    this._matrixProjectionDirty = true;
};

PerspCamera.prototype._updateProjectionMatrix = function(){
    if(!this._matrixProjectionDirty){
        return;
    }
    Mat4.perspective(this._matrixProjection, this._fov, this._aspectRatio, this._near, this._far);
    this._matrixProjectionDirty = false;
};

PerspCamera.prototype.getViewRay = function(point, width, height, out){
    if(out === undefined){
        out = [[0,0],[0,0]];
    }
    else {
        out[0] = out[0] === undefined ? [0,0] : out[0];
        out[1] = out[1] === undefined ? [0,0] : out[1];
    }

    var x =  point[0] / width * 2 - 1;
    var y = -point[1] / height * 2 + 1;

    var hNear = 2 * Math.tan(this._fov / 180 * Math.PI / 2) * this._near;
    var wNear = hNear * this._aspectRatio;

    x *= (wNear * 0.5);
    y *= (hNear * 0.5);

    Vec3.set3(out[0],0,0,0);
    Vec3.normalize(Vec3.set3(out[1], x, y, -this._near));

    return out;
};

PerspCamera.prototype.getWorldRay = function(point, width, height, out){
    if(out === undefined){
        out = [[0,0],[0,0]];
    }
    else {
        out[0] = out[0] === undefined ? [0,0] : out[0];
        out[1] = out[1] === undefined ? [0,0] : out[1];
    }
    var viewRay       = this.getViewRay(point,width,height,out);
    var invViewMatrix = Mat4.invert(Mat4.set(TEMP_MAT4,this._matrixView));

    Vec3.multMat4(viewRay[0],invViewMatrix);
    Vec3.multMat4(viewRay[1],invViewMatrix);
    Vec3.normalize(Vec3.sub(viewRay[1],viewRay[0]));

    return viewRay;
};

PerspCamera.prototype.setFrustumOffset = function(x, y, width, height, widthTotal, heightTotal){
    widthTotal  = widthTotal === undefined ? width : widthTotal;
    heightTotal = heightTotal === undefined ? height : heightTotal;

    var near = this._near;
    var far  = this._far;

    var aspectRatio = widthTotal / heightTotal;

    var top     = Math.tan(this._fov * Math.PI / 180 * 0.5) * near;
    var bottom  = -top;
    var left    = aspectRatio * bottom;
    var right   = aspectRatio * top;
    var width_  = Math.abs(right - left);
    var height_ = Math.abs(top - bottom);
    var widthNormalized  = width_ / widthTotal;
    var heightNormalized = height_ / heightTotal;

    var l = left + x * widthNormalized;
    var r = left + (x + width) * widthNormalized;
    var b = top - (y + height) * heightNormalized;
    var t = top - y * heightNormalized;

    Mat4.frustum(this._matrixProjection, l, r, b, t, near, far);
};

module.exports = PerspCamera;
},{"./AbstractCamera":19,"pex-math/Mat4":71,"pex-math/Vec2":74,"pex-math/Vec3":75,"pex-math/Vec4":76}],24:[function(require,module,exports){
module.exports = {
    OrthoCamera : require('./OrthoCamera'),
    PerspCamera : require('./PerspCamera'),
    Arcball     : require('./Arcball'),
    CameraOrbiter : require('./CameraOrbiter')
};
},{"./Arcball":20,"./CameraOrbiter":21,"./OrthoCamera":22,"./PerspCamera":23}],25:[function(require,module,exports){
/**
 * Float (0..1) RGBA Color utility class
 */

//Dependencies imports
var lerp = require('lerp');

/**
 * RGBA color constructor function
 * @param  {Number} [r=0] - red component (0..1)
 * @param  {Number} [g=0] - green component (0..1)
 * @param  {Number} [b=0] - blue component (0..1)
 * @param  {Number} [a=1] - alpha component (0..1)
 * @return {Array}  - RGBA color array [r,g,b,a] (0..1)
 */
function create(r, g, b, a) {
  return [r || 0, g || 0, b || 0, (a === undefined) ? 1 : a];
}


//### copy()
//Copies rgba values from another color into this instance
//`c` - another color to copy values from *{ Color }*
/**
 * Copies color
 * @param  {Array} color - color to copy
 * @param  {Array} [out] - color to copy values into
 * @return {Array} - new RGBA color array [r,g,b,a] (0..1) or updated out color
 */
function copy(color, out) {
    if (out !== undefined) {
        out[0] = color[0];
        out[1] = color[1];
        out[2] = color[2];
        out[3] = color[3];
        return out;
    }
    return color.slice(0);
}

/**
 * Creates new color from RGBA values. Alias for create(r, g, b, a)
 * @param  {Number} r - red component (0..1)
 * @param  {Number} g - green component (0..1)
 * @param  {Number} b - blue component (0..1)
 * @param  {Number} [a=1] - alpha component (0..1)
 * @return {Array} - RGBA color array [r,g,b,a] (0..1)
 */
function fromRGB(r, g, b, a) {
    return create(r, g, b, a);
}

/**
 * @param  {Array} color   - RGBA color array [r,g,b,a] to update
 * @param  {Number} r      - red component (0..1)
 * @param  {Number} g      - green component (0..1)
 * @param  {Number} b      - blue component (0..1)
 * @param  {Number} [a=1]  - alpha component (0..1)
 * @return {Array} - updated RGBA color array [r,g,b,a] (0..1)
 */
function set(color, r, g, b, a) {
  color[0] = r;
  color[1] = g;
  color[2] = b;
  color[3] = (a !== undefined) ? a : 1;

  return color;
}

/**
 * Updates a color based on r, g, b, a component values
 * @param  {Array} color   - RGBA color array [r,g,b,a] to update
 * @param  {Number} r      - red component (0..1)
 * @param  {Number} g      - green component (0..1)
 * @param  {Number} b      - blue component (0..1)
 * @param  {Number} [a=1]  - alpha component (0..1)
 * @return {Array} - updated RGBA color array [r,g,b,a] (0..1)
 */
function setRGB(color, r, g, b, a) {
    color[0] = r;
    color[1] = g;
    color[2] = b;
    color[3] = (a !== undefined) ? a : 1;

    return color;
}

/**
 * Creates new color from array of 4 byte (0..255) values [r, g, b, a]
 * @param  {Array} bytes - RGB color byte array [r,g,b,a] (0..255)
 * @return {Array} - RGBA color array [r,g,b,a] (0..1)
 */
function fromRGBBytes(bytes) {
    return [ bytes[0]/255, bytes[1]/255, bytes[2]/255, (bytes.length == 4) ? bytes[3]/255 : 1];
}

/**
 * Returns RGB color components as bytes (0..255)
 * @param  {Array} color - RGBA color array [r,g,b,a]
 * @param  {Array} out   - array to copy values into
 * @return {Array}       - RGB color byte array [r,g,b] (0..255) or updated out array
 */
function getRGBBytes(color, out) {
    out = out || [0, 0, 0];
    out[0] = Math.round(color[0]*255);
    out[1] = Math.round(color[1]*255);
    out[2] = Math.round(color[2]*255);
    return out;
}

/**
 * Creates new color from hue, saturation and value
 * @param  {Number} h - hue (0..1)
 * @param  {Number} s - saturation (0..1)
 * @param  {Number} v - value (0..1)
 * @param  {Number} [a=1] - alpha (0..1)
 * @return {Array}    - RGBA color array [r,g,b,a] (0..1)
 */
function fromHSV(h, s, v, a) {
  var color = create();
  setHSV(color, h, s, v, a)
  return color;
}

/**
 * Updates a color based on hue, saturation, value and alpha
 * @param  {Array} color   - RGBA color array [r,g,b,a] to update
 * @param  {Number} h - hue (0..1)
 * @param  {Number} s - saturation (0..1)
 * @param  {Number} v - value (0..1)
 * @param  {Number} [a=1] - alpha (0..1)
 * @return {Array}    - updated RGBA color array [r,g,b,a] (0..1)
 */
function setHSV(color, h, s, v, a) {
  a = a || 1;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: color[0] = v; color[1] = t; color[2] = p; break;
    case 1: color[0] = q; color[1] = v; color[2] = p; break;
    case 2: color[0] = p; color[1] = v; color[2] = t; break;
    case 3: color[0] = p; color[1] = q; color[2] = v; break;
    case 4: color[0] = t; color[1] = p; color[2] = v; break;
    case 5: color[0] = v; color[1] = p; color[2] = q; break;
  }

  color[3] = a;
  return color;
}

/**
 * Get hue, saturation, value and alpha of given color
 * @param  {Array} color  - RGBA color array [r,g,b,a]
 * @return {Array}        - HSVA values array [h,s,v,a] (0..1)
 */
function getHSV(color) {
  var r = color[0];
  var g = color[1];
  var b = color[2];
  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var h;
  var v = max;
  var d = max - min;
  var s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0; // achromatic
  }
  else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [ h, s, v, color[3] ];
}

/**
 * Creates new color from hue, saturation, lightness and alpha
 * @param  {Number} h - hue (0..1)
 * @param  {Number} s - saturation (0..1)
 * @param  {Number} l - lightness (0..1)
 * @param  {Number} [a=1] - alpha (0..1)
 * @return {Array} - RGBA color array [r,g,b,a] (0..1)
 */
function fromHSL(h, s, l, a) {
    var color = create();
    setHSL(color, h, s, l, a);
    return color;
}

/**
 * Updates a color based on hue, saturation, lightness and alpha
 * @param  {Array} color   - RGBA color array [r,g,b,a] to update
 * @param  {Number} h - hue (0..1)
 * @param  {Number} s - saturation (0..1)
 * @param  {Number} l - lightness (0..1)
 * @param  {Number} [a=1] - alpha (0..1)
 * @return {Array} - updated RGBA color array [r,g,b,a] (0..1)
 */
function setHSL(color, h, s, l, a) {
    a = a || 1;

    function hue2rgb(p, q, t) {
        if (t < 0) { t += 1; }
        if (t > 1) { t -= 1; }
        if (t < 1/6) { return p + (q - p) * 6 * t; }
        if (t < 1/2) { return q; }
        if (t < 2/3) { return p + (q - p) * (2/3 - t) * 6; }
        return p;
    }

    if (s === 0) {
        color[0] = color[1] = color[2] = l; // achromatic
    }
    else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        color[0] = hue2rgb(p, q, h + 1/3);
        color[1] = hue2rgb(p, q, h);
        color[2] = hue2rgb(p, q, h - 1/3);
    }

    color[3] = a;
    return color;
}

/**
 * Returns hue, saturation, lightness and alpha of given color.
 * @param  {Array} color  - RGBA color array [r,g,b,a]
 * @return {Array}        - HSLA values array [h,s,l,a] (0..1)
 */
function getHSL(color) {
    var r = color[0];
    var g = color[1];
    var b = color[2];
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var l = (max + min) / 2;
    var h;
    var s;

    if (max === min) {
        h = s = 0; // achromatic
    }
    else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return  [ h, s, l, color[3] ];
}

/**
 * Creates new color from html hex string
 * @param  {String} hex    - html hex string #RRGGBB (# is optional)
 * @return {Array} - RGBA color array [r,g,b,a] (0..1)
 */
function fromHex(hex) {
    var color = create();
    setHex(color, hex);
    return color;
}

/**
 * Updates a color based on html hex string e.g. #FF0000 -> 1,0,0,1
 * @param  {Array} color   - RGBA color array [r,g,b,a] to update
 * @param  {String} hex    - html hex string #RRGGBB (# is optional)
 * @return {Array} - updated RGBA color array [r,g,b,a] (0..1)
 */
function setHex(color, hex) {
    hex = hex.replace(/^#/, "");
    var num = parseInt(hex, 16);

    color[0] = (num >> 16 & 255) / 255;
    color[1] = (num >> 8 & 255) / 255;
    color[2] = (num & 255) / 255;
    color[3] = 1

    return color;
}

/**
 * Returns html hex representation of given color
 * @param  {Array} color  - RGBA color array [r,g,b,a]
 * @return {String}       - html hex color including leading hash e.g. #FF0000
 */
function getHex(color) {
    var c = [ color[0], color[1], color[2] ].map(function(val) {
        return Math.floor(val * 255);
    });

    return "#" + ((c[2] | c[1] << 8 | c[0] << 16) | 1 << 24)
        .toString(16)
        .slice(1)
        .toUpperCase();
}

/**
 * Creates new color from XYZ values
 * @param  {Number} x - x component (0..95)
 * @param  {Number} y - y component (0..100)
 * @param  {Number} z - z component (0..108)
 * @return {Array} - RGBA color array [r,g,b,a] (0..1)
 */
function fromXYZ(x, y, z) {
    var color = create();
    setXYZ(color, x, y, z);
    return color;
}

function fromXYZValue(val) {
    val /= 100;

    if (val < 0) {
        val = 0;
    }

    if (val > 0.0031308) {
        val = 1.055 * Math.pow(val, (1 / 2.4)) - 0.055;
    }
    else {
        val *= 12.92;
    }

    return val;
}

function toXYZValue(val) {
    if (val > 0.04045) {
        val = Math.pow(((val + 0.055) / 1.055), 2.4);
    }
    else {
        val /= 12.92;
    }

    val *= 100;

    return val;
}

/**
 * Updates a color based on x, y, z component values
 * @param  {Array} color   - RGBA color array [r,g,b,a] to update
 * @param  {Number} x - x component (0..95)
 * @param  {Number} y - y component (0..100)
 * @param  {Number} z - z component (0..108)
 * @return {Array} - updated RGBA color array [r,g,b,a] (0..1)
 */
function setXYZ(color, x, y, z) {
    var r = x *  3.2406 + y * -1.5372 + z * -0.4986;
    var g = x * -0.9689 + y *  1.8758 + z *  0.0415;
    var b = x *  0.0557 + y * -0.2040 + z *  1.0570;

    color[0] = fromXYZValue(r);
    color[1] = fromXYZValue(g);
    color[2] = fromXYZValue(b);
    color[3] = 1.0;

    return color;
}

/**
 * Returns XYZ representation of given color
 * @param  {Array} color  - RGBA color array [r,g,b,a]
 * @return {Array}        - [x,y,z] (x:0..95, y:0..100, z:0..108)
 */
function getXYZ(color) {
    var r = toXYZValue(color[0]);
    var g = toXYZValue(color[1]);
    var b = toXYZValue(color[2]);

    return [
        r * 0.4124 + g * 0.3576 + b * 0.1805,
        r * 0.2126 + g * 0.7152 + b * 0.0722,
        r * 0.0193 + g * 0.1192 + b * 0.9505
    ]
}

/**
 * Creates new color from l,a,b component values
 * @param  {Number} l - l component (0..100)
 * @param  {Number} a - a component (-128..127)
 * @param  {Number} b - b component (-128..127)
 * @return {Array} - RGBA color array [r,g,b,a] (0..1)
 */
function fromLab(l, a, b) {
    var color = create();
    setLab(color, l, a, b);
    return color;
}

function fromLabValueToXYZValue(val, white) {
    var pow = Math.pow(val, 3);

    if (pow > 0.008856) {
        val = pow;
    }
    else {
        val = (val - 16 / 116) / 7.787;
    }

    val *= white;;

    return val;
}

function fromXYZValueToLabValue(val, white) {
    val /= white;

    if (val > 0.008856) {
        val = Math.pow(val, 1 / 3);
    }
    else {
        val = (7.787 * val) + (16 / 116);
    }
    return val;
}

/**
 * Updates a color based on l, a, b, component values
 * @param  {Array} color   - RGBA color array [r,g,b,a] to update
 * @param  {Number} l - l component (0..100)
 * @param  {Number} a - a component (-128..127)
 * @param  {Number} b - b component (-128..127)
 * @return {Array} - updated RGBA color array [r,g,b,a] (0..1)
 */
function setLab(color, l, a, b) {
    var white = [ 95.047, 100.000, 108.883 ]; //for X, Y, Z

    var y = (l + 16) / 116;
    var x = a / 500 + y;
    var z = y - b / 200;

    x = fromLabValueToXYZValue(x, white[0]);
    y = fromLabValueToXYZValue(y, white[1]);
    z = fromLabValueToXYZValue(z, white[2]);

    return setXYZ(color, x, y, z);
}

/**
 * Returns LAB color components
 * @param  {Array} color - RGBA color array [r,g,b,a]
 * @return {Array}       - LAB values array [l,a,b] (l:0..100, a:-128..127, b:-128..127)
 */
function getLab(color) {
    var xyz = getXYZ(color);

    var white = [ 95.047, 100.000, 108.883 ]; //for X, Y, Z

    var x = fromXYZValueToLabValue(xyz[0], white[0]);
    var y = fromXYZValueToLabValue(xyz[1], white[1]);
    var z = fromXYZValueToLabValue(xyz[2], white[2]);

    return [
        116 * y - 16,
        500 * (x - y),
        200 * (y - z)
    ]
}

/*
//### distance(color)
//Returns distance (CIE76) between this and given color using Lab representation *{ Number }*
//Based on [http://en.wikipedia.org/wiki/Color_difference](http://en.wikipedia.org/wiki/Color_difference)
function distance(color) {
  var lab1 = color.getLab();
  var lab2 = color.getLab();

  var dl = lab2.l - lab1.l;
  var da = lab2.a - lab1.a;
  var db = lab2.b - lab1.b;

  return Math.sqrt(dl * dl, da * da, db * db);
}
*/

/*
//TODO: add gamma correct interpolation
//### lerp(startColor, endColor, t, mode)
//Creates new color from linearly interpolated two colors
//`startColor` - *{ Color }*
//`endColor` - *{ Color } *
//`t` - interpolation ratio *{ Number 0..1 }*
//`mode` - interpolation mode : 'rgb', 'hsv', 'hsl' *{ String }* = 'rgb'
function lerp(startColor, endColor, t, mode) {
    mode = mode || 'rgb';

    if (mode === 'rgb') {
        return fromRGB(
            lerp(startColor.r, endColor.r, t),
            lerp(startColor.g, endColor.g, t),
            lerp(startColor.b, endColor.b, t),
            lerp(startColor.a, endColor.a, t)
        );
    }
    else if (mode === 'hsv') {
        var startHSV = startColor.getHSV();
        var endHSV = endColor.getHSV();
        return fromHSV(
            lerp(startHSV.h, endHSV.h, t),
            lerp(startHSV.s, endHSV.s, t),
            lerp(startHSV.v, endHSV.v, t),
            lerp(startHSV.a, endHSV.a, t)
        );
    }
    else if (mode === 'hsl') {
        var startHSL = startColor.getHSL();
        var endHSL = endColor.getHSL();
        return fromHSL(
            lerp(startHSL.h, endHSL.h, t),
            lerp(startHSL.s, endHSL.s, t),
            lerp(startHSL.l, endHSL.l, t),
            lerp(startHSL.a, endHSL.a, t)
        );
    }
    else {
        return startColor;
    }
}
*/

/**
 * @name pex-color
 * @desc RGBA color array utility functions
 */
var Color = {
    create   : create,
    copy     : copy,

    fromRGB  : fromRGB,
    setRGB   : setRGB,
    set      : set,

    fromRGBBytes: fromRGBBytes,
    getRGBBytes : getRGBBytes,

    fromHSV  : fromHSV,
    setHSV   : setHSV,
    getHSV   : getHSV,

    fromHSL  : fromHSL,
    setHSL   : setHSL,
    getHSL   : getHSL,

    fromHex  : fromHex,
    setHex   : setHex,
    getHex   : getHex,

    fromXYZ  : fromXYZ,
    setXYZ   : setXYZ,
    getXYZ   : getXYZ,

    fromLab  : fromLab,
    setLab   : setLab,
    getLab   : getLab
}


module.exports = Color;

},{"lerp":17}],26:[function(require,module,exports){
module.exports = require('./Color');

},{"./Color":25}],27:[function(require,module,exports){
/**
 * @example
 * //Create static buffer
 * var buffer = new Buffer(ctx,
 *     ctx.ARRAY_BUFFER,
 *     new Float32Array([
 *         1,1,1,1
 *     ]),ctx.STATIC_DRAW
 * );
 *
 * @example
 * //Create dynamic buffer with preserved data
 * var buffer = new Buffer(ctx,
 *     ctx.ARRAY_BUFFER,
 *     new Float32Array([
 *         1,1,1,1
 *     ]),ctx.DYNAMIC_DRAW,
 *     true
 * );
 *
 * @example
 * //Create index buffer
 * var buffer = new Buffer(ctx,
 *     ctx.ELEMENT_ARRAY_BUFFER,
 *     new Uint8Array([
 *         0,1,2
 *         3,2,1
 *     ]), ctx.STATIC_DRAW
 * );
 *
 * @param {Context} ctx
 * @param {Number} target - The target buffer object
 * @param {Number| Uint8Array|Uint16Array|Uint32Array|Float32Array} sizeOrData - The size in bytes of the buffers new data store OR the data that will be copied into the data store fore initialization
 * @param {Number} [usage] - The usage pattern of the data store
 * @param {Boolean} [preserveData] - If true the buffered data will be preserved locally for fast access and rebuffering
 * @constructor
 */
function Buffer(ctx, target, sizeOrData, usage, preserveData) {
    var gl = ctx.getGL();

    this._ctx          = ctx;
    this._target       = target === undefined ? gl.ARRAY_BUFFER : target;
    this._usage        = usage  === undefined ? gl.STATIC_DRAW  : usage;
    this._length       = 0;
    this._byteLength   = 0;
    this._data         = null;
    this._dataType     = null;
    this._preserveData = preserveData === undefined ? false : preserveData;
    this._handle       = gl.createBuffer();

    if(sizeOrData !== undefined && sizeOrData !== 0){
        this.bufferData(sizeOrData);
    }
}

Buffer.prototype._getHandle = function(){
    return this._handle;
};

/**
 * Sets the target buffer object.
 * @param {Number} target
 */
Buffer.prototype.setTarget = function(target){
    this._target = target;
};

/**
 * Returns the target buffer object.
 * @returns {Number}
 */
Buffer.prototype.getTarget = function(){
    return this._target;
};

/**
 * Sets the usage pattern of the data store.
 * @param {Number} usage
 */
Buffer.prototype.setUsage = function(usage){
    this._usage = usage;
};

/**
 * Returns the usage pattern of the data store set.
 * @returns {Number}
 */
Buffer.prototype.getUsage = function(){
    return this._usage;
};

/**
 * Returns the length of the data.
 * @returns {Number}
 */
Buffer.prototype.getLength = function(){
    return this._length;
};

/**
 * Returns the byte length of the data.
 * @returns {null|Number}
 */
Buffer.prototype.getByteLength = function(){
    return this._byteLength;
};

/**
 * Returns the type of tha data stored.
 * @returns {Number}
 */
Buffer.prototype.getDataType = function(){
    return this._dataType;
};

/**
 * Returns the data send to the buffer. (Returns null if preserveData is set to false on creation)
 * @returns {null|Uint8Array|Uint16Array|Uint32Array|Float32Array}
 */
Buffer.prototype.getData = function(){
    return this._data;
};

/**
 * Allocates a size or copies data into the data store.
 * @param {Number|Uint8Array|Uint16Array|Uint32Array|Float32Array} [sizeOrData]
 */
Buffer.prototype.bufferData = function(sizeOrData){
    var ctx = this._ctx;
    var gl  = ctx.getGL();

    ctx._bindBuffer(this);

    if(sizeOrData === undefined){
        if(this._data !== null){
            gl.bufferData(this._target,this._data,this._usage);
            ctx._unbindBuffer(this);
            return;
        } else {
            throw new Error('No size or data passed. Or no preserved data set.');
        }
    }

    if(sizeOrData !== this._data){
        if(sizeOrData.byteLength !== undefined){
            this._length     = sizeOrData.length;
            this._byteLength = sizeOrData.byteLength;
            var data_ctor    = sizeOrData.constructor;

            switch(data_ctor){
                case Float32Array:
                    this._dataType = gl.FLOAT;
                    break;
                case Uint16Array:
                    this._dataType = gl.UNSIGNED_SHORT;
                    break;
                case Uint32Array:
                    this._dataType = gl.UNSIGNED_INT;
                    break;
                default:
                    throw new TypeError('Unsupported data type.');
                    break;
            }

            if(this._preserveData && sizeOrData){
                if(this._data !== null && this._data.length == sizeOrData.length){
                    this._data.set(sizeOrData);
                }
                else {
                    this._data = new data_ctor(sizeOrData);
                }
            }
        } else {
            this._length     = sizeOrData;
            this._byteLength = null;
            this._dataType   = null;
            this._data       = null;
        }
    }

    gl.bufferData(this._target,sizeOrData,this._usage);

    ctx._unbindBuffer(this);
};

/**
 * Redefines some or all of the data store.
 * @param {Number} offset - The offset into the buffers data store where the data replacement will begin, measure in bytes
 * @param {Uint8Array|Uint16Array|Uint32Array|Float32Array} data - The new data that will be copied into the data store
 */
Buffer.prototype.bufferSubData = function(offset,data){
    var gl = this._ctx.getGL();
    gl.bufferSubData(this._target,offset,data);

    if(this._preserveData && data != this._data){
        offset = offset / this._data.BYTES_PER_ELEMENT;
        for(var i = 0, l = this._data.length; offset < l; ++i, offset+=1){
            this._data[offset] = data[i];
        }
    }
};

/**
 * Disposes the buffer and removes its content.
 */
Buffer.prototype.dispose = function(){
    if(!this._handle){
        throw new Error('Buffer already disposed.');
    }
    this._gl.deleteBuffer(this._handle);
    this._handle = null;
    this._data = null;
};

module.exports = Buffer;

},{}],28:[function(require,module,exports){
var Mat3 = require('pex-math/Mat3');
var Mat4 = require('pex-math/Mat4');
var Vec2 = require('pex-math/Vec2');
var Vec3 = require('pex-math/Vec3');
var Vec4 = require('pex-math/Vec4');

var Program        = require('./Program');
var ProgramUniform = require('./ProgramUniform');
var ProgramAttributeLocation = require('./ProgramAttributeLocation');

var Buffer      = require('./Buffer');
var VertexArray = require('./VertexArray');
var Mesh        = require('./Mesh');

var Framebuffer = require('./Framebuffer');

var Texture2D   = require('./Texture2D');
var TextureCube = require('./TextureCube');

var isPlask     = require('is-plask');

var STR_ERROR_STACK_POP_BIT = 'Invalid pop. Bit %s stack is empty.';

//STATE BITS

var ALL_BIT        = (1 << 30) - 1;
var DEPTH_BIT      = 1 << 1;
var COLOR_BIT      = 1 << 2;
var STENCIL_BIT    = 1 << 3;
var VIEWPORT_BIT   = 1 << 4;
var SCISSOR_BIT    = 1 << 5;
var CULL_BIT       = 1 << 6;
var BLEND_BIT      = 1 << 7;
var LINE_WIDTH_BIT = 1 << 8;

var MATRIX_PROJECTION_BIT = 1 << 16;
var MATRIX_VIEW_BIT       = 1 << 17;
var MATRIX_MODEL_BIT      = 1 << 18;
var FRAMEBUFFER_BIT       = 1 << 19;
var VERTEX_ARRAY_BIT      = 1 << 21;
var PROGRAM_BIT           = 1 << 22;
var TEXTURE_BIT           = 1 << 23;
var MESH_BIT              = 1 << 24;

var MATRIX_PROJECTION    = 'matrixProjection';
var MATRIX_VIEW          = 'matrixView';
var MATRIX_MODEL         = 'matrixModel';
var MATRIX_NORMAL        = 'matrixNormal';
var MATRIX_INVERSE_VIEW  = 'matrixInverseView';

var CAPS_WEBGL2                    = 0;
var CAPS_INSTANCED_ARRAYS          = 1;
var CAPS_TEXTURE_FLOAT             = 2;
var CAPS_TEXTURE_FLOAT_LINEAR      = 3;
var CAPS_TEXTURE_HALF_FLOAT        = 4;
var CAPS_TEXTURE_HALF_FLOAT_LINEAR = 5;
var CAPS_DEPTH_TEXTURE             = 6;
var CAPS_SRGB                      = 7;
var CAPS_ELEMENT_INDEX_UINT        = 8;
var CAPS_DRAW_BUFFERS              = 9;
var CAPS_SHADER_TEXTURE_LOD        = 10;
var CAPS_STANDARD_DERIVATIVES      = 11;


//UITLS

function glObjToArray(obj){
    if(Array.isArray(obj)){
        return obj;
    }
    var out = new Array(Object.keys(obj).length);
    for(var entry in obj){
        out[+entry] = obj[entry];
    }
    return out;
}

function Context(gl){
    this._gl = gl;

    this._mask      = -1;
    this._maskStack = [];

    this._bitMap = {};
    this._bitMap[DEPTH_BIT] = gl.DEPTH_BUFFER_BIT;
    this._bitMap[COLOR_BIT] = gl.COLOR_BUFFER_BIT;
    this._bitMap[DEPTH_BIT | COLOR_BIT] = gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT;

    /**
     * [BIT description here]
     * @type {Number}
     * @const
     */
    this.ALL_BIT = ALL_BIT;

    /**
     * [BIT description here]
     * @type {Number}
     * @const
     */
    this.DEPTH_BIT        = DEPTH_BIT;
    this._depthTest       = false;
    this._depthMask       = gl.getParameter(gl.DEPTH_WRITEMASK);
    this._depthFunc       = gl.getParameter(gl.DEPTH_FUNC);
    this._depthClearValue = gl.getParameter(gl.DEPTH_CLEAR_VALUE);
    this._depthRange      = glObjToArray(gl.getParameter(gl.DEPTH_RANGE)).slice(0,2);
    this._polygonOffset   = [gl.getParameter(gl.POLYGON_OFFSET_FACTOR),gl.getParameter(gl.POLYGON_OFFSET_UNITS)];
    this._depthStack      = [];

    /**
     * [BIT description here]
     * @type {Number}
     * @const
     */
    this.COLOR_BIT   = COLOR_BIT;
    this._clearColor = [0, 0, 0, 1];
    this._colorMask  = gl.getParameter(gl.COLOR_WRITEMASK);
    this._colorStack = [];

    /**
     * [BIT description here]
     * @type {Number}
     * @const
     */
    this.SCISSOR_BIT   = SCISSOR_BIT;
    this._scissorTest  = gl.getParameter(gl.SCISSOR_TEST);
    this._scissorBox   = glObjToArray(gl.getParameter(gl.SCISSOR_BOX)).slice(0,4);
    this._scissorStack = [];

    /**
     * [BIT description here]
     * @type {Number}
     * @const
     */
    this.VIEWPORT_BIT   = VIEWPORT_BIT;
    this._viewport      = glObjToArray(gl.getParameter(gl.VIEWPORT)).slice(0,4);
    this._viewportStack = [];

    /**
     * [BIT description here]
     * @type {Number}
     * @const
     */
    this.STENCIL_BIT          = STENCIL_BIT;
    this._stencilTest         = gl.getParameter(gl.STENCIL_TEST);
    this._stencilFunc         = [gl.getParameter(gl.STENCIL_FUNC),gl.getParameter(gl.STENCIL_REF),0xFF];
    this._stencilFuncSeparate = [gl.FRONT,this._stencilFunc[0],gl.getParameter(gl.STENCIL_REF),this._stencilFunc[2]];
    this._stencilOp           = [gl.getParameter(gl.STENCIL_FAIL),gl.getParameter(gl.STENCIL_PASS_DEPTH_FAIL),gl.getParameter(gl.STENCIL_PASS_DEPTH_PASS)];
    this._stencilOpSeparate   = [gl.FRONT,this._stencilOp[0],this._stencilOp[1],this._stencilOp[2]];
    this._stencilStack        = [];

    /**
     * [BIT description here]
     * @type {Number}
     * @const
     */
    this.CULL_BIT      = CULL_BIT;
    this._cullFace      = gl.getParameter(gl.CULL_FACE);
    this._cullFaceMode = gl.getParameter(gl.CULL_FACE_MODE);
    this._cullStack    = [];

    /**
     * [BIT description here]
     * @type {Number}
     * @const
     */
    this.BLEND_BIT              = BLEND_BIT;
    this._blend                 = gl.getParameter(gl.BLEND);
    this._blendColor            = glObjToArray(gl.getParameter(gl.BLEND_COLOR)).slice(0,4);
    this._blendEquation         = gl.getParameter(gl.BLEND_EQUATION);
    this._blendEquationSeparate = [gl.getParameter(gl.BLEND_EQUATION_RGB),gl.getParameter(gl.BLEND_EQUATION_ALPHA)];
    this._blendFunc             = [gl.ONE,gl.ZERO];
    this._blendFuncSeparate     = [gl.ZERO,gl.ZERO,gl.ZERO,gl.ZERO];
    this._blendStack            = [];

    /**
     * [BIT description here]
     * @type {Number}
     * @const
     */
    this.LINE_WIDTH_BIT  = LINE_WIDTH_BIT;
    this._lineWidth      = gl.getParameter(gl.LINE_WIDTH);
    this._lineWidthStack = [];

    /**
     * [BIT description here]
     * @type {Number}
     * @const
     */
    this.MATRIX_PROJECTION_BIT = MATRIX_PROJECTION_BIT;

    /**
     * [BIT description here]
     * @type {Number}
     * @const
     */
    this.MATRIX_VIEW_BIT       = MATRIX_VIEW_BIT;

    /**
     * [BIT description here]
     * @type {Number}
     * @const
     */
    this.MATRIX_MODEL_BIT      = MATRIX_MODEL_BIT;
    this._matrix = {};
    this._matrix[MATRIX_PROJECTION]   = Mat4.create();
    this._matrix[MATRIX_VIEW]         = Mat4.create();
    this._matrix[MATRIX_MODEL]        = Mat4.create();
    this._matrix[MATRIX_NORMAL]       = Mat3.create();
    this._matrix[MATRIX_INVERSE_VIEW] = Mat4.create();

    this._matrixStack = {};
    this._matrixStack[MATRIX_PROJECTION_BIT] = [];
    this._matrixStack[MATRIX_VIEW_BIT]       = [];
    this._matrixStack[MATRIX_MODEL_BIT]      = [];

    this._matrixTypeByUniformNameMap = {};
    this._matrixTypeByUniformNameMap[ProgramUniform.PROJECTION_MATRIX]   = MATRIX_PROJECTION;
    this._matrixTypeByUniformNameMap[ProgramUniform.VIEW_MATRIX]         = MATRIX_VIEW;
    this._matrixTypeByUniformNameMap[ProgramUniform.MODEL_MATRIX]        = MATRIX_MODEL;
    this._matrixTypeByUniformNameMap[ProgramUniform.NORMAL_MATRIX]       = MATRIX_NORMAL;
    this._matrixTypeByUniformNameMap[ProgramUniform.INVERSE_VIEW_MATRIX] = MATRIX_INVERSE_VIEW;

    this._matrix4Temp    = Mat4.create();
    this._matrix4F32Temp = new Float32Array(16);
    this._matrix3F32Temp = new Float32Array(9);

    this._matrixTempByTypeMap = {};
    this._matrixTempByTypeMap[MATRIX_PROJECTION] =
    this._matrixTempByTypeMap[MATRIX_VIEW] =
    this._matrixTempByTypeMap[MATRIX_MODEL] =
    this._matrixTempByTypeMap[MATRIX_INVERSE_VIEW] = this._matrix4F32Temp;
    this._matrixTempByTypeMap[MATRIX_NORMAL] = this._matrix3F32Temp;

    this._matrixSend = {};
    this._matrixSend[MATRIX_PROJECTION]  = false;
    this._matrixSend[MATRIX_VIEW]        = false;
    this._matrixSend[MATRIX_MODEL]       = false;
    this._matrixSend[MATRIX_NORMAL]      = false;
    this._matrixSend[MATRIX_INVERSE_VIEW]= false;

    this._matrixTypesByUniformInProgram = {};

    /**
     * [BIT description here]
     * @type {Number}
     * @const
     */
    this.PROGRAM_BIT = PROGRAM_BIT;
    this._program = null;
    this._programStack = [];

    this._bufferPrev = {};
    this._bufferPrev[gl.ARRAY_BUFFER] = null;
    this._bufferPrev[gl.ELEMENT_ARRAY_BUFFER] = null;
    this._buffer = {};
    this._buffer[gl.ARRAY_BUFFER] = null;
    this._buffer[gl.ELEMENT_ARRAY_BUFFER] = null;

    /**
     * [BIT description here]
     * @type {Number}
     * @const
     */
    this.VERTEX_ARRAY_BIT = VERTEX_ARRAY_BIT;
    this._vertexArray = null;
    this._vertexArrayHasIndexBuffer = false;
    this._vertexArrayIndexBufferDataType = null;
    this._vertexArrayHasDivisor = false;
    this._vertexArrayStack = [];

    /**
     * [BIT description here]
     * @type {Number}
     * @const
     */
    this.MESH_BIT = MESH_BIT;
    this._mesh = null;
    this._meshPrimitiveType = null;
    this._meshHasIndexBuffer = false;
    this._meshIndexBufferDataType = null;
    this._meshCount = 0;
    this._meshHasDivisor = false;
    this._meshStack = [];

    /**
     * [BIT description here]
     * @type {number}
     * @const
     */
    this.TEXTURE_BIT = TEXTURE_BIT;
    this._maxTextureImageUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    this._textures = new Array(this._maxTextureImageUnits);
    this._textureStack = [];
    this.MAX_TEXTURE_IMAGE_UNITS = this._maxTextureImageUnits;

    /**
     * [BIT description here]
     * @type {number}
     * @const
     */
    this.FRAMEBUFFER_BIT = FRAMEBUFFER_BIT;
    this._framebuffer = null;
    this._framebufferStack = [];

    /**
     * [BIT description here]
     * @type {number}
     * @const
     */
    this.ATTRIB_POSITION    = ProgramAttributeLocation.POSITION;
    this.ATTRIB_COLOR       = ProgramAttributeLocation.COLOR;
    this.ATTRIB_TEX_COORD_0 = ProgramAttributeLocation.TEX_COORD_0;
    this.ATTRIB_TEX_COORD_1 = ProgramAttributeLocation.TEX_COORD_1;
    this.ATTRIB_TEX_COORD_2 = ProgramAttributeLocation.TEX_COORD_2;
    this.ATTRIB_TEX_COORD_3 = ProgramAttributeLocation.TEX_COORD_3;
    this.ATTRIB_NORMAL      = ProgramAttributeLocation.NORMAL;
    this.ATTRIB_TANGENT     = ProgramAttributeLocation.TANGENT;
    this.ATTRIB_BITANGENT   = ProgramAttributeLocation.BITANGENT;
    this.ATTRIB_BONE_INDEX  = ProgramAttributeLocation.BONE_INDEX;
    this.ATTRIB_BONE_WEIGHT = ProgramAttributeLocation.BONE_WEIGHT;
    this.ATTRIB_CUSTOM_0    = ProgramAttributeLocation.CUSTOM_0;
    this.ATTRIB_CUSTOM_1    = ProgramAttributeLocation.CUSTOM_1;
    this.ATTRIB_CUSTOM_2    = ProgramAttributeLocation.CUSTOM_2;
    this.ATTRIB_CUSTOM_3    = ProgramAttributeLocation.CUSTOM_3;
    this.ATTRIB_CUSTOM_4    = ProgramAttributeLocation.CUSTOM_4;

    //Blend
    this.FUNC_ADD               = gl.FUNC_ADD;
    this.FUNC_SUBTRACT         = gl.FUNC_SUBTRACT;
    this.FUNC_REVERSE_SUBTRACT = gl.FUNC_REVERSE_SUBTRACT;
    this.ZERO                = gl.ZERO;
    this.ONE                 = gl.ONE;
    this.SRC_COLOR           = gl.SRC_COLOR;
    this.ONE_MINUS_SRC_COLOR = gl.ONE_MINUS_SRC_COLOR;
    this.DST_COLOR           = gl.DST_COLOR;
    this.ONE_MINUS_DST_COLOR = gl.ONE_MINUS_DST_COLOR;
    this.SRC_ALPHA           = gl.SRC_ALPHA;
    this.ONE_MINUS_SRC_ALPHA = gl.ONE_MINUS_SRC_ALPHA;
    this.DST_ALPHA           = gl.DST_ALPHA;
    this.ONE_MINUS_DST_ALPHA = gl.ONE_MINUS_DST_ALPHA;
    this.SRC_ALPHA_SATURATE  = gl.SRC_ALPHA_SATURATE;
    this.CONSTANT_COLOR           = gl.CONSTANT_COLOR;
    this.ONE_MINUS_CONSTANT_COLOR = gl.CONSTANT_COLOR;
    this.CONSTANT_ALPHA           = gl.CONSTANT_ALPHA;
    this.ONE_MINUS_CONSTANT_ALPHA = gl.ONE_MINUS_CONSTANT_ALPHA;

    //Culling
    this.FRONT          = gl.FRONT;
    this.BACK           = gl.BACK;
    this.FRONT_AND_BACK = gl.FRONT_AND_BACK;

    //Data Types
    this.FLOAT          = gl.FLOAT;
    this.UNSIGNED_SHORT = gl.UNSIGNED_SHORT;
    this.UNSIGNED_INT   = gl.UNSIGNED_INT;
    this.UNSIGNED_BYTE  = gl.UNSIGNED_BYTE;

    //Texture Formats
    this.RGBA           = gl.RGBA;
    this.DEPTH_COMPONENT= gl.DEPTH_COMPONENT;
    this.NEAREST        = gl.NEAREST;
    this.LINEAR         = gl.LINEAR;
    this.NEAREST_MIPMAP_NEAREST = gl.NEAREST_MIPMAP_NEAREST;
    this.NEAREST_MIPMAP_LINEAR  = gl.NEAREST_MIPMAP_LINEAR;
    this.LINEAR_MIPMAP_NEAREST  = gl.LINEAR_MIPMAP_NEAREST;
    this.LINEAR_MIPMAP_LINEAR   = gl.LINEAR_MIPMAP_LINEAR;

    //Texture Targets
    this.TEXTURE_2D = gl.TEXTURE_2D;
    this.TEXTURE_CUBE_MAP = gl.TEXTURE_CUBE_MAP;
    this.TEXTURE_CUBE_MAP_POSITIVE_X = gl.TEXTURE_CUBE_MAP_POSITIVE_X;
    this.TEXTURE_CUBE_MAP_NEGATIVE_X = gl.TEXTURE_CUBE_MAP_NEGATIVE_X;
    this.TEXTURE_CUBE_MAP_POSITIVE_Y = gl.TEXTURE_CUBE_MAP_POSITIVE_Y;
    this.TEXTURE_CUBE_MAP_NEGATIVE_Y = gl.TEXTURE_CUBE_MAP_NEGATIVE_Y;
    this.TEXTURE_CUBE_MAP_POSITIVE_Z = gl.TEXTURE_CUBE_MAP_POSITIVE_Z;
    this.TEXTURE_CUBE_MAP_NEGATIVE_Z = gl.TEXTURE_CUBE_MAP_NEGATIVE_Z;

    //Vertex Array
    this.STATIC_DRAW    = gl.STATIC_DRAW;
    this.DYNAMIC_DRAW   = gl.DYNAMIC_DRAW;
    this.ARRAY_BUFFER   = gl.ARRAY_BUFFER;
    this.ELEMENT_ARRAY_BUFFER = gl.ELEMENT_ARRAY_BUFFER;

    //Primitive Types
    this.POINTS         = gl.POINTS;
    this.LINES          = gl.LINES;
    this.LINE_STRIP     = gl.LINE_STRIP;
    this.LINE_LOOP      = gl.LINE_LOOP;
    this.TRIANGLES      = gl.TRIANGLES;
    this.TRIANGLE_STRIP = gl.TRIANGLE_STRIP;
    this.TRIANGLE_FAN   = gl.TRIANGLE_FAN;

    //Extensions and Capabilities

    this._caps = [];
    this.CAPS_WEBGL2                        = CAPS_WEBGL2;
    this.CAPS_INSTANCED_ARRAYS              = CAPS_INSTANCED_ARRAYS;
    this.CAPS_TEXTURE_FLOAT                 = CAPS_TEXTURE_FLOAT;
    this.CAPS_TEXTURE_FLOAT_LINEAR          = CAPS_TEXTURE_FLOAT_LINEAR;
    this.CAPS_TEXTURE_HALF_FLOAT            = CAPS_TEXTURE_HALF_FLOAT;
    this.CAPS_TEXTURE_HALF_FLOAT_LINEAR     = CAPS_TEXTURE_HALF_FLOAT_LINEAR;
    this.CAPS_DEPTH_TEXTURE                 = CAPS_DEPTH_TEXTURE;
    this.CAPS_SRGB                          = CAPS_SRGB;
    this.CAPS_ELEMENT_INDEX_UINT            = CAPS_ELEMENT_INDEX_UINT;
    this.CAPS_DRAW_BUFFERS                  = CAPS_DRAW_BUFFERS;
    this.CAPS_SHADER_TEXTURE_LOD            = CAPS_SHADER_TEXTURE_LOD;
    this.CAPS_STANDARD_DERIVATIVES          = CAPS_STANDARD_DERIVATIVES;

    //TODO: implement webgl 2 check
    var isWebGL2              = false;
    this._caps[CAPS_WEBGL2]   = isWebGL2;

    //ANGLE_instanced_arrays
    if (!gl.drawElementsInstanced) {
        var ext = gl.getExtension('ANGLE_instanced_arrays');
        if (!ext) {
            this._caps[CAPS_INSTANCED_ARRAYS] = false;
            gl.drawElementsInstanced = function() {
                throw new Error('ANGLE_instanced_arrays not supported');
            };
            gl.drawArraysInstanced = function() {
                throw new Error('ANGLE_instanced_arrays not supported');
            };
            gl.vertexAttribDivisor = function() {
                throw new Error('ANGLE_instanced_arrays not supported');
            };
        }
        else {
            this._caps[CAPS_INSTANCED_ARRAYS] = true;
            gl.drawElementsInstanced = ext.drawElementsInstancedANGLE.bind(ext);
            gl.drawArraysInstanced = ext.drawArraysInstancedANGLE.bind(ext);
            gl.vertexAttribDivisor = ext.vertexAttribDivisorANGLE.bind(ext);
        }
    }
    else {
        this._caps[CAPS_INSTANCED_ARRAYS] = true;
    }

    //OES_texture_float
    this._caps[CAPS_TEXTURE_FLOAT]             = isPlask || isWebGL2 || (gl.getExtension('OES_texture_float') != null);
    this._caps[CAPS_TEXTURE_FLOAT_LINEAR]      = isPlask || isWebGL2 || (gl.getExtension('OES_texture_float_linear') != null);
    this._caps[CAPS_TEXTURE_HALF_FLOAT]        = isPlask || isWebGL2 || (gl.getExtension('OES_texture_half_float') != null);
    this._caps[CAPS_TEXTURE_HALF_FLOAT_LINEAR] = isPlask || isWebGL2 || (gl.getExtension('OES_texture_half_float_linear') != null);

    if (gl.HALF_FLOAT) {
        this.HALF_FLOAT = gl.HALF_FLOAT;
    }
    else {
        var ext = gl.getExtension('OES_texture_half_float');
        if (ext) {
            this.HALF_FLOAT = ext.HALF_FLOAT_OES;
        }
    }

    //WEBGL_depth_texture
    this._caps[CAPS_DEPTH_TEXTURE]             = isPlask || isWebGL2 || (gl.getExtension('WEBGL_depth_texture') != null);

    //EXT_sRGB
    if (gl.SRGB) {
        this._caps[CAPS_SRGB] = true;
        this.SRGB         = gl.SRGB_EXT;
        this.SRGB8_ALPHA8 = gl.SRGB8_ALPHA8_EXT;
        this.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING = gl.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING;
    }
    else {
        var ext = gl.getExtension('EXT_sRGB');
        if (ext) {
            this._caps[CAPS_SRGB] = true;
            this.SRGB         = ext.SRGB_EXT;
            this.SRGB8_ALPHA8 = ext.SRGB8_ALPHA8_EXT;
            this.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING = ext.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT;
        }
        else {
            this._caps[CAPS_SRGB] = false;
        }
    }

    if (isPlask || isWebGL2) {
        this._caps[CAPS_ELEMENT_INDEX_UINT] = true;
    }
    else {
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext) {
            this._caps[CAPS_ELEMENT_INDEX_UINT] = true;
        }
        else {
            this._caps[CAPS_ELEMENT_INDEX_UINT] = false;
        }
    }

    if (isPlask || isWebGL2) {
        this._caps[CAPS_DRAW_BUFFERS] = true;
    }
    else {
        var ext = gl.getExtension('WEBGL_draw_buffers');
        if (ext) {
            this._caps[CAPS_DRAW_BUFFERS] = true;
        }
        else {
            this._caps[CAPS_DRAW_BUFFERS] = false;
        }

    }

    if (isPlask || isWebGL2) {
        this._caps[CAPS_SHADER_TEXTURE_LOD] = true;
    }
    else {
        var ext = gl.getExtension('EXT_shader_texture_lod');
        if (ext) {
            this._caps[CAPS_SHADER_TEXTURE_LOD] = true;
        }
        else {
            this._caps[CAPS_SHADER_TEXTURE_LOD] = false;
        }
    }

    if (isPlask || isWebGL2) {
        this._caps[CAPS_STANDARD_DERIVATIVES] = true;
    }
    else {
        var ext = gl.getExtension('OES_standard_derivatives');
        if (ext) {
            this._caps[CAPS_STANDARD_DERIVATIVES] = true;
        }
        else {
            this._caps[CAPS_STANDARD_DERIVATIVES] = false;
        }

    }
}

/**
 * Returns the underlying gl context.
 * @returns {WebGLRenderingContext}
 */

Context.prototype.getGL = function(){
    return this._gl;
};

/**
 *
 * @param {Number} [mask]
 */

Context.prototype.pushState = function(mask){
    mask = mask === undefined ? ALL_BIT : mask;

    if((mask & DEPTH_BIT) == DEPTH_BIT){
        this._depthStack.push([
            this._depthTest, this._depthMask, this._depthFunc, this._depthClearValue, Vec2.copy(this._depthRange), Vec2.copy(this._polygonOffset)
        ]);
    }

    if((mask & COLOR_BIT) == COLOR_BIT){
        this._colorStack.push([Vec4.copy(this._clearColor), Vec4.copy(this._colorMask)]);
    }

    if((mask & STENCIL_BIT) == STENCIL_BIT){
        this._stencilStack.push([this._stencilTest,Vec3.copy(this._stencilFunc),Vec4.copy(this._stencilFuncSeparate),Vec3.copy(this._stencilOp),Vec4.copy(this._stencilOpSeparate)]);
    }

    if((mask & VIEWPORT_BIT) == VIEWPORT_BIT){
        this._viewportStack.push(Vec4.copy(this._viewport));
    }

    if((mask & SCISSOR_BIT) == SCISSOR_BIT){
        this._scissorStack.push([this._scissorTest, Vec4.copy(this._scissorBox)]);
    }

    if((mask & CULL_BIT) == CULL_BIT){
        this._cullStack.push([this._cullFace,this._cullFaceMode]);
    }

    if((mask & BLEND_BIT) == BLEND_BIT){
        this._blendStack.push([this._blend, Vec4.copy(this._blendColor), this._blendEquation, Vec2.copy(this._blendEquationSeparate), Vec2.copy(this._blendFunc), Vec4.copy(this._blendFuncSeparate)]);
    }

    if((mask & LINE_WIDTH_BIT) == LINE_WIDTH_BIT){
        this._lineWidthStack.push(this._lineWidth);
    }

    if((mask & MATRIX_PROJECTION_BIT) == MATRIX_PROJECTION_BIT){
        this.pushProjectionMatrix();
    }

    if((mask & MATRIX_VIEW_BIT) == MATRIX_VIEW_BIT){
        this.pushViewMatrix();
    }

    if((mask & MATRIX_MODEL_BIT) == MATRIX_MODEL_BIT){
        this.pushModelMatrix();
    }

    if((mask & VERTEX_ARRAY_BIT) == VERTEX_ARRAY_BIT){
        this._vertexArrayStack.push(this._vertexArray);
    }

    if((mask & PROGRAM_BIT) == PROGRAM_BIT){
        this._programStack.push(this._program);
    }

    if((mask & TEXTURE_BIT) == TEXTURE_BIT){
        this._textureStack.push(this._textures.slice(0));
    }

    if((mask & FRAMEBUFFER_BIT) == FRAMEBUFFER_BIT){
        this._framebufferStack.push(this._framebuffer);
    }

    if((mask & MESH_BIT) == MESH_BIT){
        this._meshStack.push(this._mesh);
    }

    this._mask = mask;
    this._maskStack.push(this._mask);
};

/**
 *
 */

Context.prototype.popState = function(){
    var mask = this._mask = this._maskStack.pop();
    var stack, value;

    if((mask & COLOR_BIT) == COLOR_BIT){
        if(this._colorStack.length == 0){
            throw new Error(STR_ERROR_STACK_POP_BIT.replace('%s','COLOR_BIT'));
        }
        stack = this._colorStack[this._colorStack.length - 1];

        value = stack[0];
        this.setClearColor(value[0],value[1],value[2],value[3]);

        value = stack[1];
        this.setColorMask(value[0],value[1],value[2],value[3]);
    }

    if((mask & DEPTH_BIT) == DEPTH_BIT){
        if(this._depthStack.length == 0){
            throw new Error(STR_ERROR_STACK_POP_BIT.replace('%s','DEPTH_BIT'));
        }
        stack = this._depthStack.pop();

        this.setDepthTest(stack[0]);
        this.setDepthMask(stack[1]);
        this.setDepthFunc(stack[2]);
        this.setClearDepth(stack[3]);

        value = stack[4];
        this.setDepthRange(value[0],value[1]);

        value = stack[5];
        this.setPolygonOffset(value[0],value[1]);
    }

    if((mask & STENCIL_BIT) == STENCIL_BIT){
        if(this._stencilStack.length == 0){
            throw new Error(STR_ERROR_STACK_POP_BIT.replace('%s','STENCIL_BIT'));
        }
        stack = this._stencilStack.pop();

        this.setStencilTest(stack[0]);
        value = stack[1];
        this.setStencilFunc(value[0],value[1],value[2]);
        value = stack[2];
        this.setStencilFuncSeparate(value[0],value[1],value[2],value[3]);
        value = stack[3];
        this.setStencilOp(value[0],value[1],value[2]);
        value = stack[4];
        this.setStencilOpSeparate(value[0],value[1],value[2],value[3]);
    }

    if((mask & VIEWPORT_BIT) == VIEWPORT_BIT){
        if(this._viewportStack.length == 0){
            throw new Error(STR_ERROR_STACK_POP_BIT.replace('%s','VIEWPORT_BIT'));
        }

        value = this._viewportStack.pop();
        this.setViewport(value[0],value[1],value[2],value[3]);
    }

    if((mask & SCISSOR_BIT) == SCISSOR_BIT){
        if(this._scissorStack.length == 0){
            throw new Error(STR_ERROR_STACK_POP_BIT.replace('%s','SCISSOR_BIT'));
        }
        stack = this._scissorStack.pop();

        this.setScissorTest(stack[0]);

        value = stack[1];
        this.setScissor(value[0],value[1],value[2],value[3]);
    }

    if((mask & CULL_BIT) == CULL_BIT){
        if(this._cullStack.length == 0){
            throw new Error(STR_ERROR_STACK_POP_BIT.replace('%s','CULL_BIT'));
        }
        stack = this._cullStack.pop();
        this.setCullFace(stack[0]);
        this.setCullFaceMode(stack[1]);
    }

    if((mask & BLEND_BIT) == BLEND_BIT){
        if(this._blendStack.length == 0){
            throw new Error(STR_ERROR_STACK_POP_BIT.replace('%s','BLEND_BIT'));
        }
        stack = this._blendStack.pop();

        this.setBlend(stack[0]);
        value = stack[1];
        this.setBlendColor(value[0],value[1],value[2],value[3]);
        this.setBlendEquation(stack[2]);
        value = stack[3];
        this.setBlendEquationSeparate(value[0],value[1]);
        value = stack[4];
        this.setBlendFunc(value[0],value[1]);
        value = stack[5];
        this.setBlendFuncSeparate(value[0],value[1],value[2],value[3]);
    }

    if((mask & LINE_WIDTH_BIT) == LINE_WIDTH_BIT){
        if(this._lineWidthStack.length == 0){
            throw new Error(STR_ERROR_STACK_POP_BIT.replace('%s','LINE_WIDTH_BIT'));
        }
        value = this._lineWidthStack.pop();
        this.setLineWidth(value);
    }

    if((mask & MATRIX_PROJECTION_BIT) == MATRIX_PROJECTION_BIT){
        this.popProjectionMatrix();
    }

    if((mask & MATRIX_VIEW_BIT) == MATRIX_VIEW_BIT){
        this.popViewMatrix();
    }

    if((mask & MATRIX_MODEL_BIT) == MATRIX_MODEL_BIT){
        this.popModelMatrix();
    }

    if((mask & PROGRAM_BIT) == PROGRAM_BIT){
        if(this._programStack.length == 0){
            throw new Error(STR_ERROR_STACK_POP_BIT.replace('%s','PROGRAM_BIT'));
        }
        value = this._programStack.pop();
        this.bindProgram(value);
    }

    if((mask & VERTEX_ARRAY_BIT) == VERTEX_ARRAY_BIT){
        if(this._vertexArrayStack.length == 0){
            throw new Error(STR_ERROR_STACK_POP_BIT.replace('%s','VERTEX_ARRAY_BIT'));
        }
        value = this._vertexArrayStack.pop();
        this.bindVertexArray(value);
    }

    if((mask & TEXTURE_BIT) == TEXTURE_BIT){
        if(this._textureStack.length == 0){
            throw new Error(STR_ERROR_STACK_POP_BIT.replace('%s','TEXTURE_BIT'));
        }
        stack = this._textureStack.pop();
        for(var i = 0, l = stack.length; i < l; ++i){
            this.bindTexture(stack[i],i);
        }
    }

    if((mask & FRAMEBUFFER_BIT) == FRAMEBUFFER_BIT){
        value = this._framebufferStack.pop();
        this.bindFramebuffer(value);
    }

    if((mask & MESH_BIT) == MESH_BIT){
        value = this._meshStack.pop();
        this.bindMesh(value);
    }
};

/**
 *
 * @param {Number} [mask]
 * @returns {Array}
 */

Context.prototype.getState = function(mask){
    mask = mask === undefined ? ALL_BIT : mask;

    var state = [];

    if((mask & DEPTH_BIT) == DEPTH_BIT){
        state.push([
            this._depthTest, this._depthMask, this._depthFunc, this._depthClearValue, Vec2.copy(this._depthRange), Vec2.copy(this._polygonOffset)
        ]);
    }

    if((mask & COLOR_BIT) == COLOR_BIT){
        state.push([Vec4.copy(this._clearColor), Vec4.copy(this._colorMask)]);
    }

    if((mask & STENCIL_BIT) == STENCIL_BIT){
        state.push([this._stencilTest,Vec3.copy(this._stencilFunc),Vec4.copy(this._stencilFuncSeparate),Vec3.copy(this._stencilOp),Vec4.copy(this._stencilOpSeparate)]);
    }

    if((mask & VIEWPORT_BIT) == VIEWPORT_BIT){
        state.push(Vec4.copy(this._viewport));
    }

    if((mask & SCISSOR_BIT) == SCISSOR_BIT){
        state.push([this._scissorTest, this._scissorStack]);
    }

    if((mask & CULL_BIT) == CULL_BIT){
        state.push([this._cullFace, this._cullFaceMode]);
    }

    if((mask & BLEND_BIT) == BLEND_BIT){
        state.push([this._blend,Vec4.copy(this._blendColor),this._blendEquation,Vec2.copy(this._blendEquationSeparate),Vec2.copy(this._blendFunc)]);
    }

    if((mask & LINE_WIDTH_BIT) == LINE_WIDTH_BIT){
        state.push(this._lineWidth);
    }

    if((mask & MATRIX_PROJECTION_BIT) == MATRIX_PROJECTION_BIT){
        state.push(Mat4.copy(this._matrix[MATRIX_PROJECTION_BIT]));
    }

    if((mask & MATRIX_VIEW_BIT) == MATRIX_VIEW_BIT){
        state.push(Mat4.copy(this._matrix[MATRIX_VIEW_BIT]));
    }

    if((mask & MATRIX_MODEL_BIT) == MATRIX_MODEL_BIT){
        state.push(Mat4.copy(this._matrix[MATRIX_MODEL_BIT]));
    }

    if((mask & PROGRAM_BIT) == PROGRAM_BIT){
        state.push(this._program);
    }

    if((mask & TEXTURE_BIT) == TEXTURE_BIT){
        state.push(this._textures.slice(0));
    }

    if((mask & FRAMEBUFFER_BIT) == FRAMEBUFFER_BIT){
        state.push(this._framebuffer);
    }

    if((mask & MESH_BIT) == MESH_BIT){
        state.push(this._mesh);
    }

    return state.length > 1 ? state : state[0];
};

/**
 * Sets the viewport.
 * @param {Number} x - origin x (lower left corner)
 * @param {Number} y - origin y (lower left corner)
 * @param {Number} width - rectangle width
 * @param {Number} height - rectangle height
 */

Context.prototype.setViewport = function(x,y,width,height){
    if(Vec4.equals4(this._viewport,x,y,width,height)){
        return;
    }
    Vec4.set4(this._viewport,x,y,width,height);
    this._gl.viewport(x,y,width,height);
};

/**
 * Returns the current viewport rectangle.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getViewport = function(out){
    out = out === undefined ? Vec4.create() : out;
    return Vec4.set(out,this._viewport);
};

/**
 * Enables / disables culling polygons based on their winding in window coordinates.
 * @param {Boolean} culling
 */

Context.prototype.setCullFace = function(culling){
    if(culling == this._cullFace){
        return;
    }
    if(culling){
        this._gl.enable(this._gl.CULL_FACE);
    }
    else {
        this._gl.disable(this._gl.CULL_FACE);
    }
    this._cullFace = culling;
};

/**
 * Returns true if culling is enabled.
 * @returns {Boolean}
 */

Context.prototype.getCullFace = function(){
    return this._cullFace;
};

/**
 * Specify whether front- or back-facing polygons can be culled.
 * @param {Number} mode
 */

Context.prototype.setCullFaceMode = function(mode){
    if(mode == this._cullFaceMode){
        return;
    }
    this._gl.cullFace(mode);
    this._cullFaceMode = mode;
};

/**
 * Returns the current cull face mode.
 * @returns {Number}
 */

Context.prototype.getCullFaceMode = function(){
    return this._cullFaceMode;
};

/**
 * Enables / disables discarding fragments that are outside the scissor rectangle.
 * @param {Boolean} scissor
 */

Context.prototype.setScissorTest = function(scissor){
    if(scissor == this._scissorTest){
        return;
    }
    scissor ? this._gl.enable(this._gl.SCISSOR_TEST) : this._gl.disable(this._gl.SCISSOR_TEST);
    this._scissorTest = scissor;
};

/**
 * Returns true if scissor test is enabled.
 * @returns {Boolean}
 */

Context.prototype.getScissorTest = function(){
    return this._scissorTest
};

/**
 * Defines the scissor box.
 * @param {Number} x - origin x (lower left corner)
 * @param {Number} y - origin y (lower left corner)
 * @param {Number} w - width of the rectangle
 * @param {Number} h - height of the rectangle
 */

Context.prototype.setScissor = function(x,y,w,h){
    if(Vec4.equals4(this._scissorBox,x,y,w,h)){
        return;
    }
    this._gl.scissor(x,y,w,h);
    Vec4.set4(this._scissorBox,x,y,w,h);
};

/**
 * Returns the current scissor box.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getScissor = function(out){
    out = out === undefined ? Vec4.create() : out;
    return Vec4.set(out, this._scissorBox);
};

/**
 * Enables / disables stencil testing and updating the stencil buffer.
 * @param {Boolean} stencilTest
 */

Context.prototype.setStencilTest = function(stencilTest){
    if(stencilTest == this._stencilTest){
        return;
    }
    if(stencilTest){
        this._gl.enable(this._gl.STENCIL_TEST);
    }
    else{
        this._gl.disable(this._gl.STENCIL_TEST);
    }
    this._stencilTest = stencilTest;
};

/**
 * Returns true if stencil testing is enabled.
 * @returns {Boolean}
 */

Context.prototype.getStencilTest = function(){
    return this._stencilTest;
};

/**
 * Sets the front and back function and reference value for stencil testing.
 * @param {Number} func - The test function
 * @param {Number} ref - The reference value for the stencil test
 * @param {Number} mask - A mask that is ANDed with both the reference value and the stored stencil value whe the test is done
 */

Context.prototype.setStencilFunc = function(func,ref,mask){
    if(Vec3.equals3(this._stencilFunc,func,ref,mask)){
        return;
    }
    this._gl.stencilFunc(func,ref,mask);
    Vec3.set3(this._stencilFunc,func,ref,mask);
};

/**
 * Returns the current stencil func set.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getStencilFunc = function(out){
    out = out === undefined ? Vec3.create() : out;
    return Vec3.set(out, this._stencilFunc);
};

/**
 * Sets the front and back function and reference value for stencil testing.
 * @param {Number} face - Either front and/or back stencil to be updated
 * @param {Number} func - The test function
 * @param {Number} ref - The reference value for the stencil test
 * @param {Number} mask - A mask that is ANDed with both the reference value and the stored stencil value whe the test is done
 */

Context.prototype.setStencilFuncSeparate = function(face, func, ref, mask){
    if(Vec4.equals4(this._stencilFuncSeparate,face,func,ref,mask)){
        return;
    }
    this._gl.stencilFuncSeparate(face,func,ref,mask);
    Vec4.set4(this._stencilFuncSeparate,face,func,ref,mask);
};

/**
 * Returns the current stencil func separate set.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getStencilFuncSeparate = function(out){
    out = out === undefined ? Vec4.create() : out;
    return Vec4.set(out, this._stencilFuncSeparate);
};

/**
 * Sets the front and back stencil test actions.
 * @param {Number} fail - The action to take when stencil test fails
 * @param {Number} zfail - The stencil action when the stencil passes, but the depth test fails
 * @param {Number} zpass - The stencil action when both the stencil and the depth test pass, or when the stencil passes and either there is no depth buffer or depth testing is not enabled
 */

Context.prototype.setStencilOp = function(fail, zfail, zpass){
    if(Vec3.equals3(this._stencilOp,fail,zfail,zpass)){
        return;
    }
    this._gl.stencilOp(fail,zfail,zpass);
    Vec3.set3(this._stencilOp,fail,zfail,zpass);
};

/**
 * Returns the current front and back stencil test actions set.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getStencilOp = function(out){
    out = out === undefined ? Vec3.create() : out;
    return Vec3.set(out, this._stencilOp);
};

/**
 * Sets the front and/or back stencil test actions.
 * @param {Number} face - Either the front and/or back stencil to be updated
 * @param {Number} fail - The action to take when stencil test fails
 * @param {Number} zfail - The stencil action when the stencil passes, but the depth test fails
 * @param {Number} zpass - The stencil action when both the stencil and the depth test pass, or when the stencil passes and either there is no depth buffer or depth testing is not enabled
 */

Context.prototype.setStencilOpSeparate = function(face, fail, zfail, zpass){
    if(Vec4.equals4(this._stencilFuncSeparate,face,fail,zfail,zpass)){
        return;
    }
    this._gl.stencilOpSeparate(face,fail,zfail,zpass);
    Vec4.set4(this._stencilFuncSeparate,face,fail,zfail,zpass);
};

/**
 * Returns the current stencil test separate set.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getStencilOpSeparate = function(out){
    out = out === undefined ? Vec4.create() : out;
    return Vec4.set(out, this._stencilOpSeparate);
};

/**
 * Sets the clear value for the stencil buffer.
 * @param {Number} s - The index to be used when the stencil buffer is cleared.
 */

Context.prototype.clearStencil = function(s){
    this._gl.clearStencil(s);
};

/**
 * Sets the clear values for the color buffers.
 * @param {Number} r - Red value
 * @param {Number} g - Green value
 * @param {Number} b - Blue value
 * @param {Number} a - Alpha value
 */

Context.prototype.setClearColor = function(r,g,b,a){
    if(Vec4.equals4(this._clearColor,r,g,b,a)){
        return;
    }
    this._gl.clearColor(r,g,b,a);
    Vec4.set4(this._clearColor,r,g,b,a);
};

/**
 * Returns the current clear color set.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getClearColor = function(out){
    out = out === undefined ? Vec4.create() : out;
    return Vec4.set(out,this._clearColor);
};

/**
 * Enables / disables writing of frame buffer color components.
 * @param {Boolean} r
 * @param {Boolean} g
 * @param {Boolean} b
 * @param {Boolean} a
 */

Context.prototype.setColorMask = function(r,g,b,a){
    if(Vec4.equals4(this._colorMask,r,g,b,a)){
        return;
    }
    this._gl.colorMask(r,g,b,a);
    Vec4.set4(this._colorMask,r,g,b,a);
};

/**
 * Returns the current color mask set.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getColorMask = function(out){
    out = out === undefined ? Vec4.create() : out;
    return Vec4.set(out,this._colorMask);
};

/**
 * Enables / disables depth comparisons and updating the depth buffer.
 * @param {Boolean} depthTest
 */

Context.prototype.setDepthTest = function(depthTest){
    if(depthTest ===this._depthTest){
        return;
    }
    if(depthTest){
        this._gl.enable(this._gl.DEPTH_TEST);
    }
    else {
        this._gl.disable(this._gl.DEPTH_TEST);
    }
    this._depthTest = depthTest;
};

/**
 * Returns true if depth testing is enabled.
 * @returns {Boolean}
 */

Context.prototype.getDepthTest = function(){
    return this._depthTest;
};

/**
 * Enables / disables writing into the depth buffer.
 * @param {Boolean} flag
 */

Context.prototype.setDepthMask = function(flag){
    if(flag == this._depthMask){
        return;
    }
    this._gl.depthMask(flag);
    this._depthMask = flag;
};

/**
 * Returns true if writing into depth buffer is enabled.
 * @returns {Boolean}
 */

Context.prototype.getDepthMask = function(){
    return this._depthMask;
};

/**
 * Sets the value used for depth comparisons.
 * @param {Number} func
 */

Context.prototype.setDepthFunc = function(func){
    if(func == this._depthFunc){
        return;
    }
    this._gl.depthFunc(func);
    this._depthFunc = func;
};

/**
 * Returns the current depth func set.
 * @returns {Number}
 */

Context.prototype.getDepthFunc = function(){
    return this._depthFunc;
};

/**
 * Sets the clear value for the depth buffer.
 * @param {Number} depth
 */

Context.prototype.setClearDepth = function(depth){
    if(depth == this._depthClearValue){
        return;
    }
    this._gl.clearDepth(depth);
    this._depthClearValue = depth;
};

/**
 * Returns the current depth buffer clear value set.
 * @returns {Number}
 */

Context.prototype.getClearDepth = function(){
    return this._depthClearValue;
};

/**
 * Sets the mapping of depth values from normalized device coordinates to window coordinates.
 * @param {Number} znear - The mapping of the near clipping plane to window coordinates
 * @param {Number} zfar - The mapping of the far clipping plane to window coordinates
 */

Context.prototype.setDepthRange = function(znear,zfar){
    if(Vec2.equals2(this._depthRange,znear,zfar)){
        return;
    }
    this._gl.depthRange(znear,zfar);
    this._depthRange[0] = znear;
    this._depthRange[1] = zfar;
};

/**
 * Returns the current depth range values set.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getDepthRange = function(out){
    out = out === undefined ? Vec2.create() : out;
    return Vec2.set(out,this._depthRange);
};

/**
 * Sets the scale and units used to calculate depth values
 * @param {Number} factor
 * @param {Number} units
 */

Context.prototype.setPolygonOffset = function(factor,units){
    if(Vec2.equals(this._polygonOffset,factor,units)){
        return;
    }
    this._gl.polygonOffset(factor,units);
    this._polygonOffset[0] = factor;
    this._polygonOffset[1] = units;
};

/**
 * Returns the current polygon offset values.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getPolygonOffset = function(out){
    out = out === undefined ? Vec2.create() : out;
    return Vec2.set(out,this._polygonOffset);
};

/**
 * Sets the width of rasterized lines.
 * @param {Number} lineWidth
 */

Context.prototype.setLineWidth = function(lineWidth){
    if(this._lineWidth == lineWidth){
        return;
    }
    this._gl.lineWidth(lineWidth);
    this._lineWidth = lineWidth;
};

/**
 * Returns the current line width value.
 * @returns {Number}
 */

Context.prototype.getLineWidth = function(){
    return this._lineWidth;
};

/**
 * Enables / disables blending the computed fragment color values with the values in the color buffers.
 * @param {Boolean} blend
 */

Context.prototype.setBlend = function(blend){
    if(blend == this._blend){
        return;
    }
    if(blend){
        this._gl.enable(this._gl.BLEND);
    }
    else {
        this._gl.disable(this._gl.BLEND);
    }
    this._blend = blend;
};

/**
 * Returns true if blending is enabled.
 * @returns {Boolean}
 */

Context.prototype.getBlend = function(){
    return this._blend;
};

/**
 * Sets the blend color.
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b
 * @param {Number} a
 */

Context.prototype.setBlendColor = function(r,g,b,a){
    if(Vec4.equals4(this._blendColor,r,g,b,a)){
        return;
    }
    this._gl.blendColor(r,g,b,a);
    Vec4.set4(this._blendColor,r,g,b,a);
};

/**
 * Return the current blend color set.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getBlendColor = function(out){
    out = out === undefined ? Vec4.create() : out;
    return Vec4.set(out, this._blendColor);
};

/**
 * Sets the equation used for both the RGB blend equation and the alpha blend equation.
 * @param {Number} mode
 */

Context.prototype.setBlendEquation = function(mode){
    if(mode == this._blendEquation){
        return;
    }
    this._gl.blendEquation(mode);
    this._blendEquation = mode;
};

/**
 * Returns the current blend equation set.
 * @returns {Number}
 */

Context.prototype.getBlendEquation = function(){
    return this._blendEquation;
};

/**
 * Sets the RGB blend equation and the alpha blend equation separately.
 * @param {Number} modeRGB
 * @param {Number} modeAlpha
 */

Context.prototype.setBlendEquationSeparate = function(modeRGB, modeAlpha){
    if(Vec2.equals2(this._blendEquationSeparate,modeRGB,modeAlpha)){
        return;
    }
    this._gl.blendEquationSeparate(modeRGB,modeAlpha);
    Vec2.set2(this._blendEquationSeparate,modeRGB,modeAlpha);
};

/**
 * Returns the current RGB and alpha blend equation set.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getBlendEquationSeparate = function(out){
    out = out === undefined ? Vec2.create() : out;
    return Vec2.set(out, this._blendEquationSeparate);
};

/**
 * Sets the pixel arithmetic.
 * @param {Number} sfactor - Specifies how the red, green, blue, and alpha source blending factors are computed
 * @param {Number} dfactor - Specifies how the red, green, blue, and alpha destination blending factors are computed
 */

Context.prototype.setBlendFunc = function(sfactor,dfactor){
    if(Vec2.equals2(this._blendFunc,sfactor,dfactor)){
        return;
    }
    this._gl.blendFunc(sfactor,dfactor);
    Vec2.set2(this._blendFunc,sfactor,dfactor);
};

/**
 * Returns the current pixel arithmetic set.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getBlendFunc = function(out){
    out = out === undefined ? Vec2.create() : out;
    return Vec2.set(out, this._blendFunc);
};

/**
 * Sets the pixel arithmetic for RGB and alpha components separately.
 * @param {Number} srcRGB - Specifies how the red, green, and blue blending factors are computed
 * @param {Number} dstRGB - Specifies how the red, green, and blue destination blending factors are computed
 * @param {Number} srcAlpha - Specifies how the alpha source blending factor is computed
 * @param {Number} dstAlpha Specifies how the alpha destination blending factor is computed
 */

Context.prototype.setBlendFuncSeparate = function(srcRGB,dstRGB,srcAlpha,dstAlpha){
    if(Vec4.equals4(this._blendFuncSeparate,srcRGB,dstRGB,srcAlpha,dstAlpha)){
        return;
    }
    this._gl.blendFuncSeparate(srcRGB,dstRGB,srcAlpha,dstAlpha);
    Vec4.set4(this._blendFuncSeparate,srcRGB,dstRGB,srcAlpha,dstAlpha);
};

/**
 * Returns the current pixel arithmetic for RGB and alpha components separately set.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getBlendFuncSeparate = function(out){
    out = out === undefined ? Vec4.create() : out;
    return Vec4.set(out,this._blendFuncSeparate);
};

/**
 * Clears buffers to preset values.
 * @param {Number} mask - Bitwise OR of masks that indicate the buffers to be cleared
 */

Context.prototype.clear = function(mask){
    this._gl.clear(this._bitMap[mask]);
};

/**
 * Sets the projection matrix to be used.
 * @param {Array} matrix
 */

Context.prototype.setProjectionMatrix = function(matrix){
    Mat4.set(this._matrix[MATRIX_PROJECTION],matrix);
    this._matrixSend[MATRIX_PROJECTION] = false;
};

/**
 * Sets the view matrix to be used.
 * @param {Array} matrix
 */

Context.prototype.setViewMatrix = function(matrix){
    Mat4.set(this._matrix[MATRIX_VIEW],matrix);
    this._matrixSend[MATRIX_VIEW] = false;
};

/**
 * Set the model matrix to be used.
 * @param {Array} matrix
 */

Context.prototype.setModelMatrix = function(matrix){
    Mat4.set(this._matrix[MATRIX_MODEL],matrix);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Returns the current projection matrix.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getProjectionMatrix = function(out){
    out = out === undefined ? Mat4.create() : out;
    return Mat4.set(out, this._matrix[MATRIX_PROJECTION]);
};

/**
 * Returns the current view matrix.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getViewMatrix = function(out){
    out = out === undefined ? Mat4.create() : out;
    return Mat4.set(out, this._matrix[MATRIX_VIEW]);
};

/**
 * Returns the current model matrix.
 * @param {Array} [out]
 * @returns {Array}
 */

Context.prototype.getModelMatrix = function(out){
    out = out === undefined ? Mat4.create() : out;
    return Mat4.set(out, this._matrix[MATRIX_MODEL]);
};

/**
 * Pushes the current projection matrix on the projection matrix stack.
 */

Context.prototype.pushProjectionMatrix = function(){
    this._matrixStack[MATRIX_PROJECTION_BIT].push(Mat4.copy(this._matrix[MATRIX_PROJECTION]));
};

/**
 * Replaces the current projection matrix with the matrix previously pushed on the stack and removes the top.
 */

Context.prototype.popProjectionMatrix = function(){
    this._matrix[MATRIX_PROJECTION] = this._matrixStack[MATRIX_PROJECTION_BIT].pop();
    this._matrixSend[MATRIX_PROJECTION] = false;
};

/**
 * Pushes the current view matrix on the view matrix stack.
 */


Context.prototype.pushViewMatrix = function(){
    this._matrixStack[MATRIX_VIEW_BIT].push(Mat4.copy(this._matrix[MATRIX_VIEW]));
};

/**
 * Replaces the current view matrix with the matrix previously pushed on the stack and removes the top.
 */

Context.prototype.popViewMatrix = function(){
    this._matrix[MATRIX_VIEW] = this._matrixStack[MATRIX_VIEW_BIT].pop();
    this._matrixSend[MATRIX_VIEW] = false;
};

/**
 * Pushes the current model matrix on the model matrix stack.
 */

Context.prototype.pushModelMatrix = function(){
    this._matrixStack[MATRIX_MODEL_BIT].push(Mat4.copy(this._matrix[MATRIX_MODEL]));
};

/**
 * Replaces the current model matrix with the matrix previously pushed on the stack and removes the top.
 */

Context.prototype.popModelMatrix = function(){
    this._matrix[MATRIX_MODEL] = this._matrixStack[MATRIX_MODEL_BIT].pop();
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Pushes all matrices on their stack.
 */
Context.prototype.pushMatrices = function(){
    this.pushProjectionMatrix();
    this.pushViewMatrix();
    this.pushModelMatrix();
}

/**
 * Replaces all matrices with the matrices previously pushed on the stack and removes the top.
 */
Context.prototype.popMatrices = function(){
    this.popModelMatrix();
    this.popViewMatrix();
    this.popProjectionMatrix();
}

/**
 * Resets the current model matrix to its identity.
 */

Context.prototype.loadIdentity = function(){
    Mat4.identity(this._matrix[MATRIX_MODEL]);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Resets all matrices to their identities.
 */
Context.prototype.loadIdentities = function(){
    Mat4.identity(this._matrix[MATRIX_PROJECTION]);
    this._matrixSend[MATRIX_PROJECTION] = false;
    Mat4.identity(this._matrix[MATRIX_VIEW]);
    this._matrixSend[MATRIX_VIEW] = false;
    this.loadIdentity();
}

/**
 * Scales the current model matrix.
 * @param {Array} v
 */

Context.prototype.scale = function(v){
    Mat4.scale(this._matrix[MATRIX_MODEL],v);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Translates the current model matrix.
 * @param {Array} v
 */

Context.prototype.translate = function(v){
    Mat4.translate(this._matrix[MATRIX_MODEL],v);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Rotates the current model matrix with angle and axis.
 * @param {Number} r
 * @param {Array} v
 */

Context.prototype.rotate = function(r,v){
    Mat4.rotate(this._matrix[MATRIX_MODEL],r,v);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Rotates the current model matrix with rotation per axis.
 * @param {Array} v
 */

Context.prototype.rotateXYZ = function(v){
    Mat4.rotateXYZ(this._matrix[MATRIX_MODEL],v);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Rotates the current model matrix with a quaternion.
 * @param {Array} q
 */

Context.prototype.rotateQuat = function(q){
    Mat4.mult(this._matrix[MATRIX_MODEL],Mat4.fromQuat(this._matrix4Temp,q));
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Multiplies the current model matrix with another matrix.
 * @param {Array} m
 */

Context.prototype.multMatrix = function(m){
    Mat4.mult(this._matrix[MATRIX_MODEL],m);
    this._matrixSend[MATRIX_MODEL] = false;
};

/**
 * Creates a program object.
 * @param {String} vertSrc
 * @param {String} [fragSrc] - vert shader source (or combined vert/fragShader)
 * @param {Array} [attributeLocationMap] - attribute locations map { 0: 'aPositon', 1: 'aNormal', 2: 'aColor' }
 * @returns {Program}
 */

Context.prototype.createProgram = function(vertSrc, fragSrc, attributeLocationMap){
    return new Program(this, vertSrc, fragSrc, attributeLocationMap);
};

/**
 * Binds a program object as part of the current rendering state.
 * @param {Program} program
 */

Context.prototype.bindProgram = function(program) {
    if(program === this._program){
        return;
    }

    if (!program) {
        this._program = null;
        this._matrixTypesByUniformInProgram = {};
        return;
    }

    program._bindInternal();

    this._program = program;
    this._matrixSend[MATRIX_PROJECTION]   = false;
    this._matrixSend[MATRIX_VIEW]         = false;
    this._matrixSend[MATRIX_MODEL]        = false;
    this._matrixSend[MATRIX_NORMAL]       = false;
    this._matrixSend[MATRIX_INVERSE_VIEW] = false;

    this._matrixTypesByUniformInProgram = {};
    for(var entry in ProgramUniform){
        var uniformName = ProgramUniform[entry];
        if(program.hasUniform(uniformName)){
            this._matrixTypesByUniformInProgram[uniformName] = this._matrixTypeByUniformNameMap[uniformName];
        }
    }
};

/**
 * Returns the current program used.
 * @returns {null|Program}
 */

Context.prototype.getProgram = function(){
    return this._program;
};

/**
 * Creates a buffer object.
 * @param {Number} target
 * @param {(Number|Float32Array|Uint8Array|Uint16Array|Uint32Array)} sizeOrData
 * @param {Number} [usage]
 * @param {Boolean} [preserveData]
 * @returns {Buffer}
 */

Context.prototype.createBuffer = function(target, sizeOrData, usage, preserveData) {
    return new Buffer(this, target, sizeOrData, usage, preserveData);
};

Context.prototype._bindBuffer = function(buffer){
    var target = buffer.getTarget();
    this._bufferPrev[target] = this._buffer[target];

    if(buffer !== this._buffer[target]){
        this._gl.bindBuffer(target,buffer._getHandle());
    }

    this._buffer[target] = buffer;
};

Context.prototype._unbindBuffer = function(buffer){
    var target = buffer.getTarget();
    var bufferPrev = this._bufferPrev[target];

    if(this._buffer[target] !== bufferPrev){
        this._gl.bindBuffer(target, bufferPrev !== null ? bufferPrev._getHandle() : bufferPrev);
    }

    this._buffer[target] = bufferPrev;
};

/**
 * Creates a vertex array object.
 * @param {Array} attributes
 * @param {Buffer} [indexBuffer]
 * @returns {VertexArray}
 */

Context.prototype.createVertexArray = function(attributes, indexBuffer) {
    return new VertexArray(this, attributes, indexBuffer);
};

/**
 * Binds a vertex array object.
 * @param {VertexArray} vertexArray
 */

Context.prototype.bindVertexArray = function(vertexArray) {
    if(vertexArray === this._vertexArray){
        return;
    }
    else if (this._vertexArray){
        this._vertexArray._unbindInternal(vertexArray);
    }

    if (!vertexArray) {
        this._vertexArray = null;
        this._vertexArrayHasIndexBuffer = false;
        this._vertexArrayIndexBufferDataType = null;
        this._vertexArrayHasDivisor = false;
        return;
    }

    vertexArray._bindInternal();

    this._vertexArray = vertexArray;
    this._vertexArrayHasIndexBuffer = vertexArray.hasIndexBuffer();
    this._vertexArrayIndexBufferDataType = this._vertexArrayHasIndexBuffer ? vertexArray.getIndexBuffer().getDataType() : null;
    this._vertexArrayHasDivisor = vertexArray.hasDivisor();
};

/**
 * Returns the current vertex array object used.
 * @returns {null|VertexArray}
 */

Context.prototype.getVertexArray = function(){
    return this._vertexArray;
};

/**
 * Creates a mesh object.
 * @param attributes
 * @param indicesInfo
 * @param primitiveType
 * @returns {Mesh}
 */

Context.prototype.createMesh = function(attributes, indicesInfo, primitiveType){
    return new Mesh(this,attributes,indicesInfo,primitiveType);
};

/**
 * Binds a mesh object.
 * @param {Mesh} mesh
 */

Context.prototype.bindMesh = function(mesh){
    if(mesh === null){
        this._meshPrimitiveType = null;
        this._meshHasIndexBuffer = false;
        this._meshIndexBufferDataType = null;
        this._meshCount = 0;
        this._meshHasDivisor = null;
    } else {
        this._meshPrimitiveType = mesh._primiviteType;
        this._meshHasIndexBuffer = mesh._indices !== null;
        this._meshIndexBufferDataType = this._meshHasIndexBuffer ? mesh._indices.buffer.getDataType() : null;
        this._meshCount = mesh._count;
        this._meshHasDivisor = mesh._hasDivisor;
        this.bindVertexArray(mesh._vao);
    }
    this._mesh = mesh;
};

/**
 * Draws the mesh currently bound.
 * @param {Number} [primcount]
 */

//TODO: fix this, how does passing instances count work, are count and offset supported?
Context.prototype.drawMesh = function(primcount){
    this._updateMatrixUniforms();

    if(this._meshHasIndexBuffer){
        if(this._meshHasDivisor){
            this._gl.drawElementsInstanced(this._meshPrimitiveType, this._meshCount, this._meshIndexBufferDataType, 0, primcount);
        }
        else{
            this._gl.drawElements(this._meshPrimitiveType, this._meshCount, this._meshIndexBufferDataType, 0);
        }
    }
    else{
        if(this._meshHasDivisor){
            this._gl.drawArraysInstanced(this._meshPrimitiveType, 0, this._meshCount, primcount);
        }
        else {
            this._gl.drawArrays(this._meshPrimitiveType, 0, this._meshCount);
        }
    }
};

/**
 * Returns the mesh currently used.
 * @returns {null|Mesh}
 */

Context.prototype.getMesh = function(){
    return this._mesh;
};

/**
 *
 * @param data
 * @param width
 * @param height
 * @param options
 * @returns {Texture2D}
 */

Context.prototype.createTexture2D = function(data, width, height, options) {
    return new Texture2D(this, data, width, height, options);
};

/**
 *
 * @param facesData
 * @param width
 * @param height
 * @param options
 * @returns {TextureCube}
 */

Context.prototype.createTextureCube = function(facesData, width, height, options) {
    return new TextureCube(this, facesData, width, height, options);
};

/**
 *
 * @param texture
 * @param textureUnit
 */

Context.prototype.bindTexture = function(texture, textureUnit) {
    textureUnit = textureUnit || 0;
    if(this._textures[textureUnit] == texture){
        return;
    }
    this._gl.activeTexture(this._gl.TEXTURE0 + textureUnit);
    if (texture) {
        texture._bindInternal();
    }
    this._textures[textureUnit] = texture;
};

/**
 * Returns the current texture bound.
 * @param {Number} [textureUnit]
 * @returns {null|Texture2D|TextureCube}
 */

Context.prototype.getTexture = function(textureUnit){
    textureUnit = textureUnit || 0;
    return this._textures[textureUnit];
};

/**
 * Creates a frambuffer object.
 * @param colorAttachments
 * @param depthAttachment
 * @returns {Framebuffer}
 */

Context.prototype.createFramebuffer = function(colorAttachments, depthAttachment) {
    return new Framebuffer(this, colorAttachments, depthAttachment);
};

/**
 * Binds a framebuffer object.
 * @param {Framebuffer} framebuffer
 */

Context.prototype.bindFramebuffer = function(framebuffer) {
    framebuffer = framebuffer === undefined ? null : framebuffer;
    if(framebuffer == this._framebuffer){
        return;
    }
    if (framebuffer) {
        framebuffer._bindInternal();
    }
    else {
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    }
    this._framebuffer = framebuffer;
};

/**
 * Returns the current frambuffer object bound.
 * @returns {null|Framebuffer}
 */

Context.prototype.getFramebuffer = function(){
    return this._framebuffer;
};

Context.prototype._updateMatrixUniforms = function(){
    if(this._matrixTypesByUniformInProgram[ProgramUniform.NORMAL_MATRIX] !== undefined &&
       (!this._matrixSend[MATRIX_VIEW] || !this._matrixSend[MATRIX_MODEL])){

        var temp = Mat4.set(this._matrix4Temp,this._matrix[MATRIX_VIEW]);
        Mat4.mult(temp, this._matrix[MATRIX_MODEL]);

        Mat4.invert(temp);
        Mat4.transpose(temp);
        Mat3.fromMat4(this._matrix[MATRIX_NORMAL],temp)
        this._matrixSend[MATRIX_NORMAL] = false;
    }

    if (this._matrixTypesByUniformInProgram[ProgramUniform.INVERSE_VIEW_MATRIX] !== undefined &&
        (!this._matrixSend[MATRIX_VIEW])) {
        Mat4.invert(Mat4.set(this._matrix[MATRIX_INVERSE_VIEW], this._matrix[MATRIX_VIEW]));
        this._matrixSend[MATRIX_INVERSE_VIEW] = false;
    }

    for(var uniformName in this._matrixTypesByUniformInProgram){
        var matrixType = this._matrixTypesByUniformInProgram[uniformName];
        if(!this._matrixSend[matrixType]){
            var tempMatrixF32 = this._matrixTempByTypeMap[matrixType];
                tempMatrixF32.set(this._matrix[matrixType]);
            this._program.setUniform(uniformName,tempMatrixF32);
            this._matrixSend[matrixType] = true;
        }
    }
};

/**
 * Renders primitives from array data.
 * @param {Number} mode
 * @param {Number} first
 * @param {Number} count
 */

Context.prototype.drawArrays = function(mode, first, count){
    this._updateMatrixUniforms();
    this._gl.drawArrays(mode, first, count);
};

/**
 * Draws multiple instances of a range of elements.
 * @param {Number} mode
 * @param {Number} first
 * @param {Number} count
 * @param {Number} primcount
 */

Context.prototype.drawArraysInstanced = function(mode, first, count, primcount){
    this._updateMatrixUniforms();
    this._gl.drawArraysInstanced(mode, first, count, primcount);
};

/**
 * Renders primitives from array data
 * @param {Number} mode
 * @param {Number} count
 * @param {Number} offset
 */

Context.prototype.drawElements = function(mode, count, offset){
    this._updateMatrixUniforms();
    this._gl.drawElements(mode, count, this._vertexArrayIndexBufferDataType, offset);
};

/**
 * Draw multiple instances of a set of elements
 * @param {Number} mode
 * @param {Number} count
 * @param {Number} offset
 * @param {Number} primcount
 */

Context.prototype.drawElementsInstanced = function(mode, count, offset, primcount){
    this._updateMatrixUniforms();
    this._gl.drawElementsInstanced(mode, count, this._vertexArrayIndexBufferDataType, offset, primcount);
};

//NOTE: We keep this for a moment to prevent breaking everything atm.
Context.prototype.draw = function(mode, first, count){
    this._updateMatrixUniforms();

    if (this._vertexArrayHasIndexBuffer) {
        if (this._vertexArrayHasDivisor) {
            //FIXME: Hardcoded num of instances
            this._gl.drawElementsInstanced(mode, count, this._vertexArrayIndexBufferDataType, 0, 1000);
        }
        else {
            this._gl.drawElements(mode, count, this._vertexArrayIndexBufferDataType, first);
        }
    }
    else {
        if (this._vertexArrayHasDivisor) {
            //FIXME: Hardcoded num of instances
            this._gl.drawArraysInstanced(mode, first, count, 1000);
        }
        else {
            this._gl.drawArrays(mode, first, count);
        }

    }
};

Context.prototype.readPixels = function(x,y,width,height,format,type,pixels){
    this._gl.readPixels(x,y,width,height,format,type,pixels);
}

Context.prototype.isSupported = function(flag) {
    return this._caps[flag];
};

module.exports = Context;

},{"./Buffer":27,"./Framebuffer":29,"./Mesh":30,"./Program":31,"./ProgramAttributeLocation":32,"./ProgramUniform":33,"./Texture2D":34,"./TextureCube":35,"./VertexArray":36,"is-plask":15,"pex-math/Mat3":70,"pex-math/Mat4":71,"pex-math/Vec2":74,"pex-math/Vec3":75,"pex-math/Vec4":76}],29:[function(require,module,exports){
var isBrowser = !require('is-plask');

/**
 * Assumptions:
 * - colorAttachments is an array or null
 * - depthAttachment is a Texture or null
 * - no support for automatically created textures as color targets
 * - no support for automatically created depth render buffers or textures as depth targets
 */
function Framebuffer(ctx, colorAttachments, depthAttachment) {
    this._ctx = ctx;
    var gl = ctx.getGL();

    this._handle = gl.createFramebuffer();
    this._colorAttachments = [];
    this._colorAttachmentsPositions = [];
    this._depthAttachment = null;
    this._width = 0;
    this._height = 0;

    //TODO: how to handle that?
    if (isBrowser) {
        //TODO: Not required in WebGL 2.0
        //TODO: Throw on extension not supported?
        this._webglDrawBuffersExt = gl.getExtension('WEBGL_draw_buffers');
        console.log(this._webglDrawBuffersExt)
    }

    if (colorAttachments && colorAttachments[0]) {
        this._width = colorAttachments[0].texture.getWidth();
        this._height = colorAttachments[0].texture.getHeight();
    }
    else if (depthAttachment) {
        this._width = depthAttachment.texture.getWidth();
        this._height = depthAttachment.texture.getHeight();
    }

    ctx.bindFramebuffer(this); //TODO: Should we push and pop?

    if (colorAttachments) {
        for(var i=0; i<colorAttachments.length; i++) {
            var colorAttachment = colorAttachments[i];
            var colorTexture = colorAttachment.texture;
            var level = colorAttachment.level || 0;
            var target = colorTexture.getTarget() || colorAttachment.target;
            var handle = colorTexture.getHandle();
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, target, handle, level);
            this._colorAttachments.push(colorAttachment);
            this._colorAttachmentsPositions.push(gl.COLOR_ATTACHMENT0 + i);
        }
    }

    if (depthAttachment) {
        var depthTexture = depthAttachment.texture;
        var target = depthTexture.getTarget() || depthAttachment.target;
        var level = depthAttachment.level || 0;
        var handle = depthTexture.getHandle();
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, target, handle, level);
        this._depthAttachment = depthAttachment;
    }

    //TODO: unbind -> pop?
    ctx.bindFramebuffer(null);
}

//TODO: should i save setColorAttachment to _colorAttachments
Framebuffer.prototype.setColorAttachment = function(attachment, textureTarget, textureHandle, level) {
    var gl = this._ctx.getGL();
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + attachment, textureTarget, textureHandle, level);
}

Framebuffer.prototype.getColorAttachment = function(attachment) {
    return this._colorAttachments[attachment];
}

//TODO: should i save setDepthAttachment to _depthAttachment
Framebuffer.prototype.setDepthAttachment = function(textureTarget, textureHandle, level) {
    var gl = this._ctx.getGL();
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, textureTarget, textureHandle, level);
}

Framebuffer.prototype.getDepthAttachment = function() {
    return this._depthAttachment;
}

Framebuffer.prototype.getWidth = function() {
    return this._width;
}

Framebuffer.prototype.getHeight = function() {
    return this._height;
}

Framebuffer.prototype._bindInternal = function() {
    var gl  = this._ctx.getGL();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._handle);

    if (this._colorAttachmentsPositions.length > 1) {
        if (isBrowser) {
          this._webglDrawBuffersExt.drawBuffersWEBGL(this._colorAttachmentsPositions);
        }
        else {
            gl.drawBuffers(this._colorAttachmentsPositions);
        }
    }
}

module.exports = Framebuffer;

},{"is-plask":15}],30:[function(require,module,exports){
function unpack(src, out, elemSize) {
    for(var i=0, len=src.length; i<len; i++) {
        for(var j=0; j<elemSize; j++) {
            out[i * elemSize + j] = src[i][j];
        }
    }
}

function isFlatArray(a) {
    return (a.length == 0) || (a[0].length === undefined);
}

/**
 * [Mesh description]
 * @param {[type]} ctx              Context
 * @param {[type]} attributes       Array of { data: Array(flat or list of verts), location: Int, size: Int or guess, usage: Int or guess}
 * @param {[type]} indicesInfo      { data : Array(flat or list faces), usage: Int or guess }
 * @param {[type]} primitiveType    PrimitiveType (default guesses from indices: no indices = POINTS, list of edges = LINES, list of faces = TRIANGLES)
 */
function Mesh(ctx, attributes, indicesInfo, primitiveType) {
    this._ctx = ctx;

    var attributesDesc = [];

    this._attributes = [];
    this._attributesMap = [];
    this._hasDivisor = false;


    var vertexCount = 0;

    for(var i=0, len=attributes.length; i<len; i++) {
        var attributeInfo = attributes[i];
        var data = attributeInfo.data;
        var location = attributeInfo.location;
        var elementSize = attributeInfo.size;
        if (!elementSize) {
            elementSize = (data[0] && data[0].length) ? data[0].length : 1
        }

        //TODO: are we allowing empty attributes e.g. data=[] ?
        if (!data.length) {
            throw new Error('Mesh: Empty attribute data is not supported');
        }

        if (location === undefined) {
            throw new Error('Mesh: Unknown attribute location at index ' + i);
        }

        var dataArray = new Float32Array(data.length * elementSize);
        var isFlat = isFlatArray(data);
        if (isFlat) {
            dataArray.set(data);
        }
        else {
            unpack(data, dataArray, elementSize);
        }

        var usage = attributeInfo.usage || ctx.STATIC_DRAW;

        var buffer = ctx.createBuffer(ctx.ARRAY_BUFFER, dataArray, usage);

        var attributeDesc = {
            buffer: buffer,
            location : location,
            size: attributeInfo.size || elementSize,
            divisor: attributeInfo.divisor || null
        }

        var attribute = {
            data: data,
            dataArray: dataArray,
            buffer: buffer,
            location : location,
            size: attributeInfo.size || elementSize
        }

        attributesDesc.push(attributeDesc);
        this._attributes.push(attribute);
        this._attributesMap[location] = attribute;

        if (location == ctx.ATTRIB_POSITION) {
            if (isFlat) {
                vertexCount = data.length / elementSize;
            }
            else {
                vertexCount = data.length;
            }
        }

        if (attributeDesc.divisor !== null) {
            this._hasDivisor = true;
        }
    }

    var indicesCount = 0;

    if (indicesInfo) {
        var indicesData = indicesInfo.data;
        var indicesDataElementSize = indicesInfo.size;
        if (!indicesDataElementSize) {
            indicesDataElementSize = (indicesData[0] && indicesData[0].length) ? indicesData[0].length : 1;
        }
        var indicesDataType = indicesInfo.type;
        if (!indicesDataType) {
            if (ctx.isSupported(ctx.CAPS_ELEMENT_INDEX_UINT)) {
                indicesDataType = ctx.UNSIGNED_INT;
            }
            else {
                indicesDataType = ctx.UNSIGNED_SHORT;
            }
        }
        var indicesDataArrayType = (indicesDataType === ctx.UNSIGNED_INT) ? Uint32Array : Uint16Array;
        var indicesDataArray = new indicesDataArrayType(indicesData.length * indicesDataElementSize);

        if (isFlatArray(indicesData)) {
            indicesDataArray.set(indicesData);
        }
        else {
            unpack(indicesData, indicesDataArray, indicesDataElementSize)
        }

        var usage = indicesInfo.usage || ctx.STATIC_DRAW;

        var indicesBuffer  = ctx.createBuffer(ctx.ELEMENT_ARRAY_BUFFER, indicesDataArray, usage);

        if (primitiveType === undefined) {
            if (indicesDataElementSize == 1) primitiveType = ctx.POINTS;
            if (indicesDataElementSize == 2) primitiveType = ctx.LINES;
            if (indicesDataElementSize == 3) primitiveType = ctx.TRIANGLES;
        }

        this._indices = {
            data: indicesData,
            dataArray: indicesDataArray,
            buffer: indicesBuffer,
            size: indicesDataElementSize
        };

        indicesCount = indicesData.length * indicesDataElementSize;
    }
    else {
        this._indices = null;
    }

    if (primitiveType === undefined) {
        primitiveType = ctx.TRIANGLES;
    }

    this._primiviteType = primitiveType;
    this._count = indicesCount || vertexCount;
    this._offset = 0;
    this._vao = ctx.createVertexArray(attributesDesc, this._indices ? this._indices.buffer : null);
}

Mesh.prototype.getAttribute = function(location) {
    return this._attributesMap[location];
}

Mesh.prototype.updateAttribute = function(location, data) {
    var ctx = this._ctx;
    var attribute = this._attributesMap[location];

    if (!attribute) {
        throw new Error('Mesh.updateAttribute: invalid attribute loaction');
    }

    if (data.length * attribute.size != attribute.dataArray.length) {
        attribute.dataArray = new Float32Array(data.length * attribute.size);
    }

    var isFlat = isFlatArray(data)
    if (isFlat) {
        attribute.dataArray.set(data);
    }
    else {
        //ASSUMING we don't suddently change Vec2 into Vec3, so size is the same
        unpack(data, attribute.dataArray, attribute.size);
    }

    attribute.data = data;

    //TODO: test this
    if (location == ctx.ATTRIB_POSITION && this._indices === null) {
        if (isFlat) {
            this._count = data.length / attribute.size;
        }
        else {
            this._count = data.length;
        }
    }

    attribute.buffer.bufferData(attribute.dataArray);
}

Mesh.prototype.getIndices = function() {
    return this._indices;
}

//TODO: test this
//TODO: update count
//TODO: copy data ref
/**
 * Updates index buffer
 * @param  {Array of Int or Array or Arrays} data must have length > 0
 */
Mesh.prototype.updateIndices = function(data) {
    var indices = this._indices;

    if (!indices) {
        throw new Error('Mesh.updateIndices: mesh has no indices to update');
    }
    if (data.length * indices.size != indices.dataArray.length) {
        if (indices.dataArray instanceof Uint32Array) {
            indices.dataArray = new Uint32Array(data.length * indices.size);
        }
        else {
            indices.dataArray = new Uint16Array(data.length * indices.size);
        }
    }

    if (isFlatArray(data)) {
        indices.dataArray.set(data);
    }
    else {
        //ASSUMING we don't suddently change face3 into face2 or flat, so size is the same
        unpack(data, indices.dataArray, indices.size);
    }

    indices.data = data;

    //ASSUMING we don't suddently change face3 into face2 or flat, so size is the same
    //TODO: test this
    this._count = data.length * indices.size;
    indices.buffer.bufferData(indices.dataArray);
}

module.exports = Mesh;

},{}],31:[function(require,module,exports){
var DEFAULT_ATTRIB_LOCATION_BINDING = {
    0 : 'aPosition',
    1 : 'aColor',
    2 : 'aTexCoord0',
    3 : 'aTexCoord1',
    4 : 'aTexCoord2',
    5 : 'aTexCoord3',
    6 : 'aNormal',
    7 : 'aTangent',
    8 : 'aBitangent',
    9 : 'aBoneIndex',
    10 : 'aBoneWeight',
    11 : 'aCustom0',
    12 : 'aCustom1',
    13 : 'aCustom2',
    14 : 'aCustom3',
    15 : 'aCustom4'
};

//TODO: this is true in 99% of cases, might be implementation specific
var NUM_VERTEX_ATTRIBUTES_MAX = 16;

var STR_ERROR_UNIFORM_UNDEFINED = 'Uniform "%s" is not defined.';
var STR_ERROR_WRONG_NUM_ARGS = 'Wrong number of arguments.';
var STR_ERROR_INVALID_UNIFORM_TYPE = 'Unsupported uniform type "%s".';
var STR_ERROR_ATTRIBUTE_BINDING_UNDEFINED = 'Attribute "%s" is not present in program.';

/**
 * @example
 * var program = new Program(ctx, vertexSrc, fragmentSrc, { 0: 'aPositon', 1: 'aNormal', 2: 'aColor' });
 *
 * @param {Context} context
 * @param {String} vertSrc
 * @param {String} [fragSrc]
 * @param {Object} attributeLocationBinding
 * @constructor
 */

function Program(context, vertSrc, fragSrc, attributeLocationBinding){
    var gl = this._gl = context.getGL();

    this._handle = gl.createProgram();
    this._attributes            = {};
    this._attributesPerLocation = {};
    this._uniforms         = {};
    this._uniformSetterMap = {};
    if(vertSrc){
        this.update(vertSrc, fragSrc, attributeLocationBinding);
    }
}

/**
 * Returns the underlying WebGLProgram handle.
 * @returns {WebGLProgram|null}
 */

Program.prototype.getHandle = function(){
    return this._handle;
};

Program.prototype._bindInternal = function(){
    this._gl.useProgram(this._handle);
};

/**
 * updates shaders sources and links the program
 * @param  {String} vertSrc                 - vert shader source (or combined vert/fragShader)
 * @param  {String} [fragSrc]               - frag shader source
 * @param  {String} [attributeLocationBinding] - attribute locations map { 0: 'aPositon', 1: 'aNormal', 2: 'aColor' }
 */
Program.prototype.update = function(vertSrc, fragSrc, attributeLocationBinding){
    var gl = this._gl;
    var program = this._handle;

    var vertShader = this._compileSource(gl.VERTEX_SHADER, vertSrc);
    var fragShader = this._compileSource(gl.FRAGMENT_SHADER, fragSrc);

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);

    for(var location = 0; location < NUM_VERTEX_ATTRIBUTES_MAX; location++){
        var attributeName = (attributeLocationBinding && attributeLocationBinding[location]) || DEFAULT_ATTRIB_LOCATION_BINDING[location];
        gl.bindAttribLocation(program, location, attributeName);
    }

    gl.linkProgram(program);

    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        throw new Error('PROGRAM: ' + gl.getProgramInfoLog(program));
    }

    //Mark for deletion, they are not actually deleted until you call deleteProgram() in dispose()
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);

    this._updateUniforms();
    this._updateAttributes();

    for(var location in attributeLocationBinding){
        var attributeName = attributeLocationBinding[location];
        if(this._attributes[attributeName] === undefined){
            throw new Error(STR_ERROR_ATTRIBUTE_BINDING_UNDEFINED.replace('%s', attributeName));
        }
    }

    this._updateUniformSetterMap();
};

Program.prototype._updateUniforms = function(){
    var gl = this._gl;
    var program     = this._handle;
    var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    var uniforms    = this._uniforms = {};

    for(var i = 0, info, name; i < numUniforms; ++i){
        info = gl.getActiveUniform(program, i);
        name = info.name;
        uniforms[name] = {
            type : info.type,
            location : gl.getUniformLocation(program, name)
        };
    }
};

Program.prototype._updateAttributes = function(){
    var gl = this._gl;
    var program = this._handle;
    var numAttributes         = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    var attributes            = this._attributes = {};
    var attributesPerLocation = this._attributesPerLocation = {};

    for(var i = 0, info, name, attrib; i < numAttributes; ++i){
        info   = gl.getActiveAttrib(program, i);
        name   = info.name;
        attrib = attributes[name] = {
            type : info.type,
            location : gl.getAttribLocation(program, name)
        }
        attributesPerLocation[attrib.location] = attrib;
    }
};

Program.prototype._compileSource = function(type, src){
    var gl = this._gl;
    var shader = gl.createShader(type);

    gl.shaderSource(shader, src + '\n');
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        var shaderType = (type === gl.VERTEX_SHADER) ? 'Vertex' : 'Fragment';
        console.log(shaderType + ' shader compilation failed');
        console.log(src);
        throw new Error(shaderType + ' shader error: ' + gl.getShaderInfoLog(shader));
    }
    return shader;
};

Program.prototype._updateUniformSetterMap = function(){
    var gl = this._gl;

    this._uniformSetterMap = {};
    for(var entry in this._uniforms){
        var type = this._uniforms[entry].type;
        if(this._uniformSetterMap[type] === undefined){
            switch (type){
                case gl.INT:
                case gl.BOOL:
                case gl.SAMPLER_2D:
                case gl.SAMPLER_2D_RECT: //Plask/OpenGL only
                case gl.SAMPLER_CUBE:
                    this._uniformSetterMap[gl.INT] = this._uniformSetterMap[gl.INT] || function(location,x,y,z,w){
                        if(x === undefined || y !== undefined){
                            throw new Error(STR_ERROR_WRONG_NUM_ARGS);
                        }
                        gl.uniform1i(location,x);
                    };
                    this._uniformSetterMap[type] = this._uniformSetterMap[gl.INT];
                    break;
                case gl.FLOAT:
                    this._uniformSetterMap[type] = function(location,x,y,z,w){
                        if(x === undefined || y !== undefined){
                            throw new Error(STR_ERROR_WRONG_NUM_ARGS);
                        }
                        gl.uniform1f(location,x);
                    };
                    break;
                case gl.FLOAT_VEC2:
                    this._uniformSetterMap[type] = function(location,x,y,z,w){
                        if(x === undefined || z !== undefined){
                            throw new Error(STR_ERROR_WRONG_NUM_ARGS);
                        }
                        if(y === undefined){
                            gl.uniform2fv(location,x);
                        }
                        else {
                            gl.uniform2f(location,x,y);
                        }
                    };
                    break;
                case gl.FLOAT_VEC3:
                    this._uniformSetterMap[type] = function(location,x,y,z,w){
                        if(x === undefined || w !== undefined || (y !== undefined && z === undefined)){
                            throw new Error(STR_ERROR_WRONG_NUM_ARGS);
                        }
                        if(y === undefined){
                            gl.uniform3fv(location,x);
                        }
                        else {
                            gl.uniform3f(location,x,y,z);
                        }
                    };
                    break;
                case gl.FLOAT_VEC4:
                    this._uniformSetterMap[type] = function(location,x,y,z,w){
                        if(x === undefined || (y !== undefined && z === undefined) || (z !== undefined && w === undefined)){
                            throw new Error(STR_ERROR_WRONG_NUM_ARGS);
                        }
                        if(y === undefined){
                            gl.uniform4fv(location,x);
                        }
                        else {
                            gl.uniform4f(location,x,y,z,w);
                        }
                    };
                    break;
                case gl.FLOAT_MAT2:
                    this._uniformSetterMap[type] = function(location,x,y,z,w){
                        if(x === undefined || y !== undefined){
                            throw new Error(STR_ERROR_WRONG_NUM_ARGS);
                        }
                        gl.uniformMatrix2fv(location,false,x);
                    };
                    break;
                case gl.FLOAT_MAT3:
                    this._uniformSetterMap[type] = function(location,x,y,z,w){
                        if(x === undefined || y !== undefined){
                            throw new Error(STR_ERROR_WRONG_NUM_ARGS);
                        }
                        gl.uniformMatrix3fv(location,false,x);
                    };
                    break;
                case gl.FLOAT_MAT4:
                    this._uniformSetterMap[type] = function(location,x,y,z,w){
                        if(x === undefined || y !== undefined){
                            throw new Error(STR_ERROR_WRONG_NUM_ARGS);
                        }
                        gl.uniformMatrix4fv(location,false,x);
                    };
                    break;
                default:
                    throw new Error(STR_ERROR_INVALID_UNIFORM_TYPE.replace('%s',type));
                    break;
            }
        }
    }
};

/**
 * Specifies the value of a uniform variable for the program bound.
 * @param {String} name
 * @param {Boolean|Number|Float32Array|Uint8Array|Uint16Array|Uint32Array} x
 * @param {Number} [y]
 * @param {Number} [z]
 * @param {Number} [w]
 */

Program.prototype.setUniform = function(name, x, y, z, w){
    var uniform = this._uniforms[name];
    if(uniform === undefined){
        throw new Error(STR_ERROR_UNIFORM_UNDEFINED.replace('%s', name));
    }
    this._uniformSetterMap[uniform.type](uniform.location,x,y,z,w);
};

/**
 * Returns true if there is an attribute bound to the location passed.
 * @param {Boolean} location
 * @returns {boolean}
 */

Program.prototype.hasAttributeAtLocation = function(location){
    return this._attributesPerLocation[location] !== undefined;
};

/**
 * Returns true if the uniform is present in the program.
 * @param {String} name
 * @returns {boolean}
 */

Program.prototype.hasUniform = function(name){
    return this._uniforms[name] !== undefined;
};

/**
 * Frees the memory and invalidates the program.
 * @returns {Program}
 */

Program.prototype.dispose = function(){
    if(!this._handle){
        return this;
    }
    this._gl.deleteProgram(this._handle);
    this._handle = null;
    return this;
};

module.exports = Program;

},{}],32:[function(require,module,exports){
var ProgramAttributeLocation = {
    POSITION    : 0,
    COLOR       : 1,
    TEX_COORD_0 : 2,
    TEX_COORD_1 : 3,
    TEX_COORD_2 : 4,
    TEX_COORD_3 : 5,
    NORMAL      : 6,
    TANGENT     : 7,
    BITANGENT   : 8,
    BONE_INDEX  : 9,
    BONE_WEIGHT : 10,
    CUSTOM_0    : 11,
    CUSTOM_1    : 12,
    CUSTOM_2    : 13,
    CUSTOM_3    : 14,
    CUSTOM_4    : 15
};

module.exports = ProgramAttributeLocation;

},{}],33:[function(require,module,exports){
var ProgramUniform = {
    PROJECTION_MATRIX    : 'uProjectionMatrix',
    VIEW_MATRIX          : 'uViewMatrix',
    MODEL_MATRIX         : 'uModelMatrix',
    NORMAL_MATRIX        : 'uNormalMatrix',
    INVERSE_VIEW_MATRIX  : 'uInverseViewMatrix'
};

module.exports = ProgramUniform;
},{}],34:[function(require,module,exports){
var isPlask = require('is-plask');
var plask = require('plask-wrap');

//TODO: update width and height if not passed but data is Image or Canvas
function Texture2D(ctx, data, width, height, options) {
    this._ctx        = ctx;
    var gl           = ctx.getGL();
    this._handle     = gl.createTexture();
    this._target     = gl.TEXTURE_2D;
    this._width      = width  || (data && data.width ) || 0;
    this._height     = height || (data && data.height) || 0;

    this.update(data, width, height, options);
}

//TODO: update width and height if not passed but data is Image or Canvas
//NOTE: flipY for compressed images is not supported
Texture2D.prototype.update = function(data, width, height, options) {
    var ctx = this._ctx;
    var gl  = ctx.getGL();

    width  = this._width  = width  || (data && data.width ) || 0;
    height = this._height = height || (data && data.height) || 0;

    ctx.pushState(ctx.TEXTURE_BIT);
    ctx.bindTexture(this, 0);

    //TODO: this should remember settings from constructor
    var internalFormat  = (options && options.format) || gl.RGBA;
    var format          = (options && options.format) || gl.RGBA;
    var repeat          = (options && options.repeat) || false;
    var dataType        = (options && options.type  ) || gl.UNSIGNED_BYTE;
    var lod             = (options && options.lod   ) || 0;
    //TODO: redo this so we don't depend on strings
    var compressed      = (options && options.compressed) || false;
    var flipY           = (options && options.flipY !== undefined) ? options.flipY : true;

    var repeat          = (options && options.repeat    ) || false;
    var magFilter       = (options && options.magFilter ) || gl.LINEAR;
    var minFilter       = (options && options.minFilter ) || gl.LINEAR;

    if (options && options.mipmap) {
        minFilter = gl.LINEAR_MIPMAP_LINEAR;
    }

    var wrapS = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    var wrapT = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);

    if (format == ctx.DEPTH_COMPONENT && !ctx.isSupported(ctx.CAPS_DEPTH_TEXTURE)) {
        throw new Error('Texture2D - Depth Texture format is not supported');
    }

    if (dataType == ctx.FLOAT && !ctx.isSupported(ctx.CAPS_TEXTURE_FLOAT)) {
        throw new Error('Texture2D - Float type is not supported');
    }

    //TODO: is that working at all?, if extension is not supported then ctx.HALF_FLOAT is undefined?
    if (dataType == ctx.HALF_FLOAT && !ctx.isSupported(ctx.CAPS_TEXTURE_HALF_FLOAT)) {
        throw new Error('Texture2D - Half Float type is not supported');
    }

    if (!data) {
        gl.texImage2D(gl.TEXTURE_2D, lod, internalFormat, width, height, 0, format, dataType, null);
    }
    else if (isPlask) { //assuming Plask
        if (data instanceof plask.SkCanvas) {
            //FIXME: using SKCanvas methods ignores format and internal format which forces RGBA and doesn't allow e.g. SRGB
            if (flipY) {
              gl.texImage2DSkCanvas(this._target, lod, data);
            }
            else {
              gl.texImage2DSkCanvasNoFlip(this._target, lod, data);
            }
        }
        else {
            if (compressed) {
                if (compressed == 'dxt1') {
                    gl.compressedTexImage2D(gl.TEXTURE_2D, 0, gl.COMPRESSED_RGB_S3TC_DXT1_EXT, width, height, 0, data);
                }
                if (compressed == 'dxt5') {
                    gl.compressedTexImage2D(gl.TEXTURE_2D, lod, gl.COMPRESSED_RGBA_S3TC_DXT5_EXT, width, height, 0, data);
                }
            }
            else {
                if (flipY) {
                    flipImageData(data, width, height);
                }
                gl.texImage2D(gl.TEXTURE_2D, lod, internalFormat, width, height, 0, format, dataType, data);
                if (flipY) {
                    //unflip it
                    flipImageData(data, width, height);
                }
            }
        }
    }
    else { //assuming browser
        if (compressed == 'dxt1') {
            var ext = gl.getExtension('WEBGL_compressed_texture_s3tc');
            gl.compressedTexImage2D(gl.TEXTURE_2D, lod, ext.COMPRESSED_RGB_S3TC_DXT1_EXT, width, height, 0, data);
        }
        if (compressed == 'dxt5') {
            var ext = gl.getExtension('WEBGL_compressed_texture_s3tc');
            gl.compressedTexImage2D(gl.TEXTURE_2D, lod, ext.COMPRESSED_RGBA_S3TC_DXT5_EXT, width, height, 0, data);
        }
        else {
            //gl.texImage2D(gl.TEXTURE_2D, lod, internalFormat, width, height, 0, format, dataType, data);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
            //Image, ImageData or Canvas
            if ((data.width && data.height) || (data.videoWidth && data.videoHeight)) {
                gl.texImage2D(gl.TEXTURE_2D, lod, internalFormat, format, dataType, data);
            }
            //Array buffer
            else {
                gl.texImage2D(gl.TEXTURE_2D, lod, internalFormat, width, height, 0, format, dataType, data);
            }
        }
    }

    if (options && options.mipmap) {
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    ctx.popState(gl.TEXTURE_BIT);
}

Texture2D.prototype._bindInternal = function() {
    var gl  = this._ctx.getGL();
    gl.bindTexture(this._target, this._handle);
}

Texture2D.prototype.getHandle = function() {
    return this._handle;
}

Texture2D.prototype.getTarget = function() {
    return this._target;
}

Texture2D.prototype.getWidth = function() {
    return this._width;
}

Texture2D.prototype.getHeight = function() {
    return this._height;
}


Texture2D.prototype.dispose = function(){
    var gl  = this._ctx.getGL();
    gl.deleteTexture(this._handle);
    this._width = 0;
    this._height = 0;
};

function flipImageData(data, width, height) {
    var numComponents = data.length / (width * height);
    //flipping array buffer in place
    for(var y=0; y<height/2; y++) {
        for(var x=0; x<width; x++) {
            for(var c=0; c<numComponents; c++) {
                var i = (y * width + x) * numComponents + c;
                var flippedI = ((height - y - 1) * width + x) * numComponents + c;
                var tmp = data[i];
                data[i] = data[flippedI];
                data[flippedI] = tmp
            }
        }
    }
}

module.exports = Texture2D;

},{"is-plask":15,"plask-wrap":94}],35:[function(require,module,exports){
var isPlask = require('is-plask');
var plask = require('plask-wrap');

//TODO: update width and height if not passed but data is Image or Canvas
//facesData = Array of {
//  face - face index 0..6 for +x, -x, +y, -y, +z, -z
//  level - mipmap level
//  width - faceWidth,
//  height - faceHeight
//  data - faceData - SkCanvas, HTMLCanvas, ImageData, TypeArray
// }
function TextureCube(ctx, facesData, width, height, options) {
    this._ctx        = ctx;
    var gl           = ctx.getGL();
    this._handle     = gl.createTexture();
    this._target     = gl.TEXTURE_CUBE_MAP;
    this._width      = width  || (facesData && facesData[0] && facesData[0].data.width ) || 0;
    this._height     = height || (facesData && facesData[0] && facesData[0].data.height) || 0;

    //TODO: remember these settings
    var internalFormat  = (options && options.format     ) || gl.RGBA;
    var format          = (options && options.format     ) || gl.RGBA;
    var repeat          = (options && options.repeat     ) || false;
    var dataType        = (options && options.type       ) || gl.UNSIGNED_BYTE;
    var flipY           = (options && options.flipY      ) || false;
    var magFilter       = (options && options.magFilter  ) || gl.LINEAR;
    var minFilter       = (options && options.minFilter  ) || gl.LINEAR;
    var lod            = 0;

    //TODO: Should we push stack here?
    //ctx.pushState(ctx.TEXTURE_BIT);
    ctx.bindTexture(this, 0);

    var wrapS = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    var wrapT = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, wrapT);

    if (format == gl.DEPTH_COMPONENT && !ctx.isSupported(ctx.CAPS_DEPTH_TEXTURE)) {
        throw new Error('TextureCube - Depth Texture format is not supported');
    }

    if (dataType == gl.FLOAT && !ctx.isSupported(ctx.CAPS_TEXTURE_FLOAT)) {
        throw new Error('TextureCube - Float type is not supported');
    }

    if (dataType == gl.HALF_FLOAT && !ctx.isSupported(ctx.CAPS_TEXTURE_HALF_FLOAT)) {
        throw new Error('TextureCube - Half Float type is not supported');
    }

    this.update(facesData, width, height, options);
    //ctx.popState(ctx.TEXTURE_BIT);
}

TextureCube.prototype.update = function(facesData, width, height, options) {
    var ctx = this._ctx;
    var gl  = ctx.getGL();

    //TODO: Should we push stack here?
    ctx.bindTexture(this, 0);

    //TODO: this should remember settings from constructor
    var internalFormat  = (options && options.format    ) || gl.RGBA;
    var format          = (options && options.format    ) || gl.RGBA;
    var repeat          = (options && options.repeat    ) || false;
    var dataType        = (options && options.type      ) || gl.UNSIGNED_BYTE;
    var flipY           = (options && options.flipY     ) || false;
    var flipEnvMap      = (options && options.flipEnvMap ) || -1; //dynamic cubemaps should have this set to 1
    var lod             = (options && options.lod       ) || 0;

    var numFaces = facesData ? facesData.length : 6;

    this._width      = width  || (facesData && facesData[0] && facesData[0].data.width ) || 0;
    this._height     = height || (facesData && facesData[0] && facesData[0].data.height) || 0;
    this._flipEnvMap = flipEnvMap;

    for(var i=0; i<numFaces; i++) {
        var face = facesData ? facesData[i] : null;
        var data = facesData ? face.data : null;
        var width = facesData ? face.width : width;
        var height = facesData ? face.height : width;
        var lod = facesData ? (face.lod || 0) : 0;
        var faceSide = facesData ? (face.face || i) : i;
        var target = ctx.TEXTURE_CUBE_MAP_POSITIVE_X + faceSide;
        if (!data) {
            gl.texImage2D(target, lod, internalFormat, width, height, 0, format, dataType, null);
        }
        else if (isPlask) {
            if (data instanceof plask.SkCanvas) {
                if (flipY) {
                  gl.texImage2DSkCanvas(target, lod, data);
                }
                else {
                  gl.texImage2DSkCanvasNoFlip(target, lod, data);
                }
            }
            else {
                gl.texImage2D(target, lod, internalFormat, width, height, 0, format, dataType, data);
            }
        }
        else { //assuming Browser
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
            //Image, ImageData or Canvas
            if (data.width && data.height) {
                gl.texImage2D(target, lod, internalFormat, format, dataType, data);
            }
            //Array buffer
            else {
                console.log(dataType, 'gl.FLOAT', ctx.FLOAT);
                gl.texImage2D(target, lod, internalFormat, width, height, 0, format, dataType, data);
            }
        }
    }
}

TextureCube.prototype._bindInternal = function() {
    var gl  = this._ctx.getGL();
    gl.bindTexture(this._target, this._handle);
}

TextureCube.prototype.getHandle = function() {
    return this._handle;
}

TextureCube.prototype.getTarget = function() {
    return this._target;
}

TextureCube.prototype.getWidth = function() {
    return this._width;
}

TextureCube.prototype.getHeight = function() {
    return this._height;
}

TextureCube.prototype.getFlipEnvMap = function() {
    return this._flipEnvMap;
}

TextureCube.prototype.dispose = function(){
    var gl  = this._ctx.getGL();
    gl.deleteTexture(this._handle);
    this._width = 0;
    this._height = 0;
};

module.exports = TextureCube;

},{"is-plask":15,"plask-wrap":94}],36:[function(require,module,exports){
var DEFAULT_VERTEX_ATTRIB = {
    enabled    : true,
    location   : -1,
    size       : -1,
    type       : null,
    normalized : false,
    stride     : 0,
    offset     : 0,
    divisor    : null,

    prevEnabled : false
};

var STR_ERROR_ATTRIB_PROPERTY_MISSING   = 'Attribute property "%s" missing.';
var STR_ERROR_ATTRIB_PROPERTY_NOT_VALID = 'Attribute property "%s" not valid.';
var STR_ERROR_ATTRIB_LOCATION_DUPLICATE = 'Attribute at location "%s" has already been defined.';

/**
 * @example
 * //init with interleaved buffer and index buffer
 * var vertexArray = new VertexArray(ctx,[
 *     {buffer : buffer0, location : ctx.ATTRIB_POSITION, size : 3, stride : 0, offset : 0 },
 *     {buffer : buffer0, location : ctx.ATTRIB_NORMAL, size : 3, stride : 0, offset : 4 * 3 * 4},
 *     {buffer : buffer1, location : ctx.ATTRIB_COLOR, size : 4},
 * ], indexBuffer);
 *
 *
 * @param {Context} ctx
 * @param {Array} attributes
 * @param {Buffer} [indexBuffer]
 * @constructor
 */

function VertexArray(ctx,attributes,indexBuffer){
    this._ctx = ctx;

    this._attributes            = {};
    this._attributesPerLocation = {};

    this._arrayBuffers = [];
    this._indexBuffer  = indexBuffer !== undefined ? indexBuffer : null;

    this._hasDivisor   = false;

    var attrib, attribCopy, defaultProp, buffer;
    var attributesPerBuffer;
    var bufferIndex;

    for(var i = 0, numAttributes = attributes.length; i < numAttributes; ++i){
        attrib = attributes[i];

        if(attrib['location'] === undefined){
            throw new Error(STR_ERROR_ATTRIB_PROPERTY_MISSING.replace('%s','location'));
        }
        if(attrib['size'] === undefined){
            throw new Error(STR_ERROR_ATTRIB_PROPERTY_MISSING.replace('%s','size'));
        }
        if(attrib['buffer'] === undefined){
            throw new Error(STR_ERROR_ATTRIB_PROPERTY_MISSING.replace('%s','buffer'));
        }

        //Check if all passed parameters are valid (e.g. no typos)
        attribCopy = {};
        for(var property in attrib){
            defaultProp = DEFAULT_VERTEX_ATTRIB[property];
            if(defaultProp === undefined && property !== 'buffer'){
                throw new Error(STR_ERROR_ATTRIB_PROPERTY_NOT_VALID.replace('%s',property));
            }
            attribCopy[property] = attrib[property];
        }
        //Assign default values
        for(var property in DEFAULT_VERTEX_ATTRIB){
            defaultProp = DEFAULT_VERTEX_ATTRIB[property];
            if (attribCopy[property] === undefined) {
                attribCopy[property] = defaultProp;
            }
         }

        //Check if location for that attribute is not taken already
        for(var bufferAttributeKey in this._attributes){
            attributesPerBuffer = this._attributes[bufferAttributeKey];
            for(var j = 0; j < attributesPerBuffer.length; ++j){
                if(attributesPerBuffer[j].location === attrib.location){
                    throw new Error(STR_ERROR_ATTRIB_LOCATION_DUPLICATE.replace('%s',attrib.location));
                }
            }
        }

        buffer      = attribCopy.buffer;
        bufferIndex = this._arrayBuffers.indexOf(buffer);
        if(bufferIndex == -1){
            this._arrayBuffers.push(buffer);
            bufferIndex = this._arrayBuffers.length - 1;
            this._attributes[bufferIndex] = [];
        }

        attribCopy.type = buffer.getDataType();
        delete attribCopy.buffer;

        this._hasDivisor = this._hasDivisor || attribCopy.divisor !== null;
        this._attributes[bufferIndex].push(attribCopy);
        this._attributesPerLocation[attribCopy.location] = attribCopy;
    }
}

/**
 * Returns the attribute properties at an attribute location.
 * @param {Number} location
 * @returns {undefined|Object}
 */

VertexArray.prototype.getAttribute = function(location){
    return this._attributesPerLocation[location];
}

/**
 * Returns true if vertex array has an ctx.ELEMENT_BUFFER bound
 * @returns {boolean}
 */

VertexArray.prototype.hasIndexBuffer = function(){
    return this._indexBuffer !== null;
};

/**
 * Returns the index buffer buffer bound.
 * @returns {Buffer|null}
 */

VertexArray.prototype.getIndexBuffer = function(){
    return this._indexBuffer;
};

/**
 * Returns true if there is at least one attribute with divisor set.
 * @returns {Boolean}
 */

VertexArray.prototype.hasDivisor = function(){
    return this._hasDivisor;
};

VertexArray.prototype._unbindInternal = function(nextVertexArray){
    var ctx = this._ctx;
    var gl  = ctx.getGL();

    var arrayBuffers = this._arrayBuffers;
    var attributes   = this._attributes;

    var bufferAttributes, attribute, location;

    for(var i = 0, numArrayBuffers = arrayBuffers.length; i < numArrayBuffers; ++i) {
        ctx._unbindBuffer(arrayBuffers[i]);
        bufferAttributes = attributes[i];

        for(var j = 0, numBufferAttribs = bufferAttributes.length; j < numBufferAttribs; ++j){

            attribute = bufferAttributes[j];
            location  = attribute.location;

            if (nextVertexArray && !nextVertexArray._attributesPerLocation[location]) {
                gl.disableVertexAttribArray(location);
            }
        }
    }
}

VertexArray.prototype._bindInternal = function(){
    var ctx = this._ctx;
    var gl  = ctx.getGL();

    var arrayBuffers = this._arrayBuffers;
    var attributes   = this._attributes;

    var bufferAttributes, attribute, location;

    for(var i = 0, numArrayBuffers = arrayBuffers.length; i < numArrayBuffers; ++i) {
        ctx._bindBuffer(arrayBuffers[i]);
        bufferAttributes = attributes[i];

        for(var j = 0, numBufferAttribs = bufferAttributes.length; j < numBufferAttribs; ++j){
            attribute = bufferAttributes[j];
            location  = attribute.location;

            if(!attribute.enabled){
                gl.disableVertexAttribArray(location);
                continue;
            }

            gl.enableVertexAttribArray(location);

            gl.vertexAttribPointer(
                location,
                attribute.size,
                attribute.type,
                attribute.normalized,
                attribute.stride,
                attribute.offset
            );

            if(attribute.divisor === null){
                continue;
            }
            gl.vertexAttribDivisor(location,attribute.divisor);
        }
    }

    if(this._indexBuffer !== null){
        ctx._bindBuffer(this._indexBuffer);
    }
};

module.exports = VertexArray;

},{}],37:[function(require,module,exports){
//Adds another texture to current fx stage

//## Example use
//     var fx = require('pex-fx');
//
//     var color = fx(ctx).render({ drawFunc: this.draw.bind(this) });
//     var glow = color.downsample().blur3().blur3();
//     var final = color.add(glow, { scale: 2 });
//     final.blit();
//

//## Reference

//Dependencies
var FXStage = require('./FXStage');


var VERT = "attribute vec2 aPosition;\nattribute vec2 aTexCoord0;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(aPosition, 0.0, 1.0);\n  vTexCoord = aTexCoord0;\n}\n";
var FRAG = "#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec2 vTexCoord;\nuniform sampler2D tex0;\nuniform sampler2D tex1;\nuniform float scale;\n\nvoid main() {\n  vec4 color = texture2D(tex0, vTexCoord).rgba;\n  vec4 color2 = texture2D(tex1, vTexCoord).rgba;\n\n  gl_FragColor = color + color2 * scale;\n}\n";

//### Add(source2, options)
//Adds another texture to current fx stage
//`source2` - a texture source to add *{ Texture2D or RenderTarget or FXStage }*
//`options` - available options:
// - `scale` - amount of source2 texture to add  *{ Number 0..1 }*

FXStage.prototype.add = function (source2, options) {
    var ctx = this.ctx;
    options = options || {};
    scale = options.scale !== undefined ? options.scale : 1;
    var outputSize = this.getOutputSize(options.width, options.height);
    var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);

    var program = this.getShader(VERT, FRAG);

    ctx.pushState(ctx.FRAMEBUFFER_BIT | ctx.TEXTURE_BIT | ctx.PROGRAM_BIT);
        ctx.bindFramebuffer(rt);
        ctx.setClearColor(0,0,0,0);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

        ctx.bindTexture(this.getSourceTexture(), 0)
        ctx.bindTexture(this.getSourceTexture(source2), 1)

        ctx.bindProgram(program);
        program.setUniform('tex0', 0);
        program.setUniform('tex1', 1);
        program.setUniform('scale', scale);

        this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
    ctx.popState(ctx.FRAMEBUFFER_BIT | ctx.TEXTURE_BIT | ctx.PROGRAM_BIT);

    return this.asFXStage(rt, 'add');
};

module.exports = FXStage;

},{"./FXStage":47}],38:[function(require,module,exports){
var FXStage = require('./FXStage');

FXStage.prototype.blit = function (options) {
    options = options || {};
    var outputSize = this.getOutputSize(options.width, options.height);
    var x = options.x || 0;
    var y = options.y || 0;
    this.drawFullScreenQuadAt(x, y, outputSize.width, outputSize.height, this.getSourceTexture());
    return this;
};

module.exports = FXStage;

},{"./FXStage":47}],39:[function(require,module,exports){
var FXStage = require('./FXStage');


var VERT = "attribute vec2 aPosition;\nattribute vec2 aTexCoord0;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(aPosition, 0.0, 1.0);\n  vTexCoord = aTexCoord0;\n}\n";
var FRAG = "#define GLSLIFY 1\n#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D image;\nuniform vec2 imageSize;\n\nuniform vec2 direction;\n\nvec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {\n  vec4 color = vec4(0.0);\n  vec2 off1 = vec2(1.3846153846) * direction;\n  vec2 off2 = vec2(3.2307692308) * direction;\n  color += texture2D(image, uv) * 0.2270270270;\n  color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;\n  color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;\n  color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;\n  color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;\n  return color;\n}\n\nvoid main() {\n    gl_FragColor = blur9(image, vTexCoord, imageSize.xy, direction);\n}\n";


FXStage.prototype.blur = function (options) {
    options = options || {};
    var outputSize = this.getOutputSize(options.width, options.height);
    var readRT = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
    var writeRT = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
    var source = this.getSourceTexture();
    var program = this.getShader(VERT, FRAG);

    var ctx = this.ctx;

    ctx.bindProgram(program);

    var iterations = options.iterations || 2;
    var strength = typeof(options.strength) === 'undefined' ? 2 : options.strength;

    ctx.pushState(ctx.PROGRAM_BIT | ctx.FRAMEBUFFER_BIT);
    for(var i=0; i<iterations * 2; i++) {
        var radius = (iterations - Math.floor(i / 2)) * strength;
        var direction = i % 2 === 0 ? [radius, 0] : [0, radius];

        var src = (i == 0) ? source : readRT.getColorAttachment(0).texture;

        ctx.bindFramebuffer(writeRT);
        ctx.setClearColor(0,0,0,1);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
        program.setUniform('direction', direction)
        this.drawFullScreenQuad(outputSize.width, outputSize.height, src, program);

        var tmp = writeRT;
        writeRT = readRT;
        readRT = tmp;
    }
    ctx.popState(ctx.PROGRAM_BIT | ctx.FRAMEBUFFER_BIT);

    return this.asFXStage(readRT, 'blur');
};

module.exports = FXStage;

},{"./FXStage":47}],40:[function(require,module,exports){
var FXStage = require('./FXStage');


var VERT = "attribute vec2 aPosition;\nattribute vec2 aTexCoord0;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(aPosition, 0.0, 1.0);\n  vTexCoord = aTexCoord0;\n}\n";
var FRAG_H = "#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D image;\nuniform vec2 imageSize;\n\nvoid main() {\n  vec2 texel = vec2(1.0 / imageSize.x, 1.0 / imageSize.y);\n\n  vec4 color = vec4(0.0);\n  color += 0.25 * texture2D(image, vTexCoord + vec2(texel.x * -1.0, 0.0));\n  color += 0.50 * texture2D(image, vTexCoord);\n  color += 0.25 * texture2D(image, vTexCoord + vec2(texel.x *  1.0, 0.0));\n  gl_FragColor = color;\n}\n";
var FRAG_V = "#ifdef GL_ES\nprecision highp float;\n#endif\nvarying vec2 vTexCoord;\n\nuniform sampler2D image;\nuniform vec2 imageSize;\n\nvoid main() {\n  vec2 texel = vec2(1.0 / imageSize.x, 1.0 / imageSize.y);\n\n  vec4 color = vec4(0.0);\n  color += 0.25 * texture2D(image, vTexCoord + vec2(0.0, texel.y * -1.0));\n  color += 0.50 * texture2D(image, vTexCoord);\n  color += 0.25 * texture2D(image, vTexCoord + vec2(0.0, texel.y *  1.0));\n  gl_FragColor = color;\n}\n";


FXStage.prototype.blur3 = function (options) {
    options = options || {};
    var outputSize = this.getOutputSize(options.width, options.height);
    var rth = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
    var rtv = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
    var source = this.getSourceTexture();
    var programH = this.getShader(VERT, FRAG_H);
    var programV = this.getShader(VERT, FRAG_V);

    var ctx = this.ctx;

    ctx.pushState(ctx.PROGRAM_BIT | ctx.FRAMEBUFFER_BIT);
        ctx.bindFramebuffer(rth);
        ctx.setClearColor(0,0,0,0);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
        this.drawFullScreenQuad(outputSize.width, outputSize.height, source, programH);

        ctx.bindFramebuffer(rtv);
        ctx.setClearColor(0,0,0,0);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
        this.drawFullScreenQuad(outputSize.width, outputSize.height, rth.getColorAttachment(0).texture, programV);
    ctx.popState(ctx.PROGRAM_BIT | ctx.FRAMEBUFFER_BIT);

    return this.asFXStage(rtv, 'blur3');
};

module.exports = FXStage;

},{"./FXStage":47}],41:[function(require,module,exports){
var FXStage = require('./FXStage');


var VERT = "attribute vec2 aPosition;\nattribute vec2 aTexCoord0;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(aPosition, 0.0, 1.0);\n  vTexCoord = aTexCoord0;\n}\n";
var FRAG_H = "#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D image;\nuniform vec2 imageSize;\n\nvoid main() {\n    vec2 texel = vec2(1.0 / imageSize.x, 1.0 / imageSize.y);\n\n    vec4 color = vec4(0.0);\n    color += 1.0/16.0 * texture2D(image, vTexCoord + vec2(texel.x * -2.0, 0.0));\n    color += 4.0/16.0 * texture2D(image, vTexCoord + vec2(texel.x * -1.0, 0.0));\n    color += 6.0/16.0 * texture2D(image, vTexCoord + vec2(texel.x *  0.0, 0.0));\n    color += 4.0/16.0 * texture2D(image, vTexCoord + vec2(texel.x *  1.0, 0.0));\n    color += 1.0/16.0 * texture2D(image, vTexCoord + vec2(texel.x *  2.0, 0.0));\n    gl_FragColor = color;\n}\n";
var FRAG_V = "#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D image;\nuniform vec2 imageSize;\n\nvoid main() {\n    vec2 texel = vec2(1.0 / imageSize.x, 1.0 / imageSize.y);\n\n    vec4 color = vec4(0.0);\n    color += 1.0/16.0 * texture2D(image, vTexCoord + vec2(0.0, texel.y * -2.0));\n    color += 4.0/16.0 * texture2D(image, vTexCoord + vec2(0.0, texel.y * -1.0));\n    color += 6.0/16.0 * texture2D(image, vTexCoord + vec2(0.0, texel.y *  0.0));\n    color += 4.0/16.0 * texture2D(image, vTexCoord + vec2(0.0, texel.y *  1.0));\n    color += 1.0/16.0 * texture2D(image, vTexCoord + vec2(0.0, texel.y *  2.0));\n    gl_FragColor = color;\n}\n";


FXStage.prototype.blur5 = function (options) {
    options = options || {};
    var outputSize = this.getOutputSize(options.width, options.height);
    var rth = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
    var rtv = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
    var source = this.getSourceTexture();
    var programH = this.getShader(VERT, FRAG_H);
    var programV = this.getShader(VERT, FRAG_V);

    var ctx = this.ctx;

    ctx.pushState(ctx.PROGRAM_BIT | ctx.FRAMEBUFFER_BIT);
        ctx.bindFramebuffer(rth);
        ctx.setClearColor(0,0,0,0);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
        this.drawFullScreenQuad(outputSize.width, outputSize.height, source, programH);

        ctx.bindFramebuffer(rtv);
        ctx.setClearColor(0,0,0,0);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
        this.drawFullScreenQuad(outputSize.width, outputSize.height, rth.getColorAttachment(0).texture, programV);
    ctx.popState(ctx.PROGRAM_BIT | ctx.FRAMEBUFFER_BIT);

    return this.asFXStage(rtv, 'blur5');
};

module.exports = FXStage;

},{"./FXStage":47}],42:[function(require,module,exports){
var FXStage = require('./FXStage');


var VERT = "attribute vec2 aPosition;\nattribute vec2 aTexCoord0;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(aPosition, 0.0, 1.0);\n  vTexCoord = aTexCoord0;\n}\n";
var FRAG = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\n\nconst float gamma = 2.2;\n\nfloat toGamma(float v) {\n  return pow(v, 1.0 / gamma);\n}\n\nvec2 toGamma(vec2 v) {\n  return pow(v, vec2(1.0 / gamma));\n}\n\nvec3 toGamma(vec3 v) {\n  return pow(v, vec3(1.0 / gamma));\n}\n\nvec4 toGamma(vec4 v) {\n  return vec4(toGamma(v.rgb), v.a);\n}\n\nvarying vec2 vTexCoord;\nuniform sampler2D tex0;\n\nvoid main() {\n    vec4 color = texture2D(tex0, vTexCoord).rgba;\n    //premultiplied linear\n    //http://ssp.impulsetrain.com/gamma-premult.html\n    gl_FragColor.rgb = toGamma(color.rgb/color.a)*color.a;\n    gl_FragColor.a = color.a;\n}\n";

FXStage.prototype.correctGamma = function (options) {
  var ctx = this.ctx;
  options = options || {};
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  var program = this.getShader(VERT, FRAG);

  ctx.pushState(ctx.FRAMEBUFFER_BIT | ctx.TEXTURE_BIT | ctx.PROGRAM_BIT);
      ctx.bindFramebuffer(rt);
      ctx.setClearColor(0,0,0,0);
      ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

      ctx.bindTexture(this.getSourceTexture(), 0)

      ctx.bindProgram(program);
      program.setUniform('tex0', 0);

      this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
  ctx.popState(ctx.FRAMEBUFFER_BIT | ctx.TEXTURE_BIT | ctx.PROGRAM_BIT);

  return this.asFXStage(rt, 'correctGamma');
};

module.exports = FXStage;

},{"./FXStage":47}],43:[function(require,module,exports){
var FXStage = require('./FXStage');


var VERT = "attribute vec2 aPosition;\nattribute vec2 aTexCoord0;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(aPosition, 0.0, 1.0);\n  vTexCoord = aTexCoord0;\n}\n";
var FRAG = "#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D image;\nuniform vec2 imageSize;\n\nvoid main() {\n    vec2 texel = vec2(1.0 / imageSize.x, 1.0 / imageSize.y);\n    vec4 color = vec4(0.0);\n    color += texture2D(image, vTexCoord + vec2(texel.x * -1.0, texel.y * -1.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x *  0.0, texel.y * -1.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x * -1.0, texel.y *  0.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x *  0.0, texel.y *  0.0));\n    gl_FragColor = color / 4.0;\n}\n";

FXStage.prototype.downsample2 = function (options) {
    options = options || {};
    var outputSize = this.getOutputSize(options.width, options.height);
    outputSize.width /= 2;
    outputSize.height /= 2;
    var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
    var source = this.getSourceTexture();
    var program = this.getShader(VERT, FRAG);

    var ctx = this.ctx;

    ctx.pushState(ctx.FRAMEBUFFER_BIT);
        ctx.bindFramebuffer(rt);
        ctx.setClearColor(0,0,0,0);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

        this.drawFullScreenQuad(outputSize.width, outputSize.height, source, program);
    ctx.popState(ctx.FRAMEBUFFER_BIT);

    return this.asFXStage(rt, 'downsample2');
};

module.exports = FXStage;

},{"./FXStage":47}],44:[function(require,module,exports){
var FXStage = require('./FXStage');


var VERT = "attribute vec2 aPosition;\nattribute vec2 aTexCoord0;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(aPosition, 0.0, 1.0);\n  vTexCoord = aTexCoord0;\n}\n";
var FRAG = "#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D image;\nuniform vec2 imageSize;\n\nvoid main() {\n    vec2 texel = vec2(1.0 / imageSize.x, 1.0 / imageSize.y);\n    vec4 color = vec4(0.0);\n    color += texture2D(image, vTexCoord + vec2(texel.x * -2.0, texel.y * -2.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x * -1.0, texel.y * -2.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x *  0.0, texel.y * -2.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x *  1.0, texel.y * -2.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x * -2.0, texel.y * -1.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x * -1.0, texel.y * -1.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x *  0.0, texel.y * -1.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x *  1.0, texel.y * -1.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x * -2.0, texel.y *  0.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x * -1.0, texel.y *  0.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x *  0.0, texel.y *  0.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x *  1.0, texel.y *  0.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x * -2.0, texel.y *  1.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x * -1.0, texel.y *  1.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x *  0.0, texel.y *  1.0));\n    color += texture2D(image, vTexCoord + vec2(texel.x *  1.0, texel.y *  1.0));\n    gl_FragColor = color / 16.0;\n}\n";

FXStage.prototype.downsample4 = function (options) {
    options = options || {};
    var outputSize = this.getOutputSize(options.width, options.height);
    outputSize.width /= 4;
    outputSize.height /= 4;
    var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
    var source = this.getSourceTexture();
    var program = this.getShader(VERT, FRAG);

    var ctx = this.ctx;

    ctx.pushState(ctx.FRAMEBUFFER_BIT);
        ctx.bindFramebuffer(rt);
        ctx.setClearColor(0,0,0,0);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
        this.drawFullScreenQuad(outputSize.width, outputSize.height, source, program);
    ctx.popState(ctx.FRAMEBUFFER_BIT);

    return this.asFXStage(rt, 'downsample4');
};

module.exports = FXStage;

},{"./FXStage":47}],45:[function(require,module,exports){
var FXStage = require('./FXStage');


var VERT = "float FXAA_SUBPIX_SHIFT = 1.0/4.0;\n\nuniform float rtWidth;\nuniform float rtHeight;\nattribute vec2 aPosition;\nattribute vec2 aTexCoord0;\nvarying vec4 posPos;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(aPosition, 0.0, 1.0);\n\n  vec2 rcpFrame = vec2(1.0/rtWidth, 1.0/rtHeight);\n  posPos.xy = aTexCoord0.xy;\n  posPos.zw = aTexCoord0.xy - (rcpFrame * (0.5 + FXAA_SUBPIX_SHIFT));\n}\n";
var FRAG = "#ifdef GL_ES\nprecision highp float;\n#endif\n\n#define FXAA_REDUCE_MIN   (1.0/ 128.0)\n#define FXAA_REDUCE_MUL   (1.0 / 8.0)\n#define FXAA_SPAN_MAX     8.0\n\nuniform sampler2D tex0;\nvarying vec4 posPos;\nuniform float rtWidth;\nuniform float rtHeight;\n\nvec4 applyFXAA(vec2 fragCoord, sampler2D tex)\n{\n    vec4 color;\n    vec2 inverseVP = vec2(1.0 / rtWidth, 1.0 / rtHeight);\n    vec3 rgbNW = texture2D(tex, (fragCoord + vec2(-1.0, -1.0)) * inverseVP).xyz;\n    vec3 rgbNE = texture2D(tex, (fragCoord + vec2(1.0, -1.0)) * inverseVP).xyz;\n    vec3 rgbSW = texture2D(tex, (fragCoord + vec2(-1.0, 1.0)) * inverseVP).xyz;\n    vec3 rgbSE = texture2D(tex, (fragCoord + vec2(1.0, 1.0)) * inverseVP).xyz;\n    vec3 rgbM  = texture2D(tex, fragCoord  * inverseVP).xyz;\n    vec3 luma = vec3(0.299, 0.587, 0.114);\n    float lumaNW = dot(rgbNW, luma);\n    float lumaNE = dot(rgbNE, luma);\n    float lumaSW = dot(rgbSW, luma);\n    float lumaSE = dot(rgbSE, luma);\n    float lumaM  = dot(rgbM,  luma);\n    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));\n    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));\n\n    //return texture2D(tex, fragCoord);\n    //return vec4(fragCoord, 0.0, 1.0);\n    //return vec4(rgbM, 1.0);\n\n    vec2 dir;\n    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));\n    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));\n\n    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *\n                          (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);\n\n    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);\n    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),\n              max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),\n              dir * rcpDirMin)) * inverseVP;\n\n    vec3 rgbA = 0.5 * (\n        texture2D(tex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)).xyz +\n        texture2D(tex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)).xyz);\n    vec3 rgbB = rgbA * 0.5 + 0.25 * (\n        texture2D(tex, fragCoord * inverseVP + dir * -0.5).xyz +\n        texture2D(tex, fragCoord * inverseVP + dir * 0.5).xyz);\n\n    float lumaB = dot(rgbB, luma);\n    if ((lumaB < lumaMin) || (lumaB > lumaMax))\n        color = vec4(rgbA, 1.0);\n    else\n        color = vec4(rgbB, 1.0);\n    return color;\n}\n\nvoid main() {\n  gl_FragColor = applyFXAA(posPos.xy * vec2(rtWidth, rtHeight), tex0);\n}\n\n//#version 120\n/*\nuniform sampler2D tex0;\nvarying vec4 posPos;\nuniform float rtWidth;\nuniform float rtHeight;\nfloat FXAA_SPAN_MAX = 8.0;\nfloat FXAA_REDUCE_MUL = 1.0/8.0;\n\n#define FxaaInt2 ivec2\n#define FxaaFloat2 vec2\n#define FxaaTexLod0(t, p) texture2DLod(t, p, 0.0)\n#define FxaaTexOff(t, p, o, r) texture2DLodOffset(t, p, 0.0, o)\n\nvec3 FxaaPixelShader(\n  vec4 posPos, // Output of FxaaVertexShader interpolated across screen.\n  sampler2D tex, // Input texture.\n  vec2 rcpFrame) // Constant {1.0/frameWidth, 1.0/frameHeight}.\n{\n//---------------------------------------------------------\n    #define FXAA_REDUCE_MIN   (1.0/128.0)\n    //#define FXAA_REDUCE_MUL   (1.0/8.0)\n    //#define FXAA_SPAN_MAX     8.0\n//---------------------------------------------------------\n    vec3 rgbNW = FxaaTexLod0(tex, posPos.zw).xyz;\n    vec3 rgbNE = FxaaTexOff(tex, posPos.zw, FxaaInt2(1,0), rcpFrame.xy).xyz;\n    vec3 rgbSW = FxaaTexOff(tex, posPos.zw, FxaaInt2(0,1), rcpFrame.xy).xyz;\n    vec3 rgbSE = FxaaTexOff(tex, posPos.zw, FxaaInt2(1,1), rcpFrame.xy).xyz;\n    vec3 rgbM  = FxaaTexLod0(tex, posPos.xy).xyz;\n//---------------------------------------------------------\n    vec3 luma = vec3(0.299, 0.587, 0.114);\n    float lumaNW = dot(rgbNW, luma);\n    float lumaNE = dot(rgbNE, luma);\n    float lumaSW = dot(rgbSW, luma);\n    float lumaSE = dot(rgbSE, luma);\n    float lumaM  = dot(rgbM,  luma);\n/*---------------------------------------------------------\n    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));\n    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));\n/*---------------------------------------------------------\n    vec2 dir;\n    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));\n    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));\n/*---------------------------------------------------------\n    float dirReduce = max(\n        (lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL),\n        FXAA_REDUCE_MIN);\n    float rcpDirMin = 1.0/(min(abs(dir.x), abs(dir.y)) + dirReduce);\n    dir = min(FxaaFloat2( FXAA_SPAN_MAX,  FXAA_SPAN_MAX),\n          max(FxaaFloat2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),\n          dir * rcpDirMin)) * rcpFrame.xy;\n/*--------------------------------------------------------\n    vec3 rgbA = (1.0/2.0) * (\n        FxaaTexLod0(tex, posPos.xy + dir * (1.0/3.0 - 0.5)).xyz +\n        FxaaTexLod0(tex, posPos.xy + dir * (2.0/3.0 - 0.5)).xyz);\n    vec3 rgbB = rgbA * (1.0/2.0) + (1.0/4.0) * (\n        FxaaTexLod0(tex, posPos.xy + dir * (0.0/3.0 - 0.5)).xyz +\n        FxaaTexLod0(tex, posPos.xy + dir * (3.0/3.0 - 0.5)).xyz);\n    float lumaB = dot(rgbB, luma);\n    if((lumaB < lumaMin) || (lumaB > lumaMax)) return rgbA;\n    return rgbB; }\n\nvec4 PostFX(sampler2D tex, vec2 uv, float time)\n{\n  vec4 c = vec4(0.0);\n  vec2 rcpFrame = vec2(1.0/rt_w, 1.0/rt_h);\n  c.rgb = FxaaPixelShader(posPos, tex, rcpFrame);\n  //c.rgb = 1.0 - texture2D(tex, posPos.xy).rgb;\n  c.a = 1.0;\n  return c;\n}\n\nvoid main()\n{\n  vec2 uv = posPos.xy;\n  gl_FragColor = PostFX(tex0, uv, 0.0);\n}\n\n*/\n";

FXStage.prototype.fxaa = function (options) {
  var ctx = this.ctx;
  options = options || {};
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  var program = this.getShader(VERT, FRAG);

  ctx.pushState(ctx.FRAMEBUFFER_BIT | ctx.TEXTURE_BIT | ctx.PROGRAM_BIT);
      ctx.bindFramebuffer(rt);
      ctx.setClearColor(0,0,0,0);
      ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

      var source = this.getSourceTexture();

      ctx.bindTexture(source, 0)

      ctx.bindProgram(program);
      program.setUniform('tex0', 0);
      program.setUniform('rtWidth', source.getWidth());
      program.setUniform('rtHeight', source.getHeight());

      this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
  ctx.popState(ctx.FRAMEBUFFER_BIT | ctx.TEXTURE_BIT | ctx.PROGRAM_BIT);

  return this.asFXStage(rt, 'fxaa');
};

module.exports = FXStage;


module.exports = FXStage;

},{"./FXStage":47}],46:[function(require,module,exports){
function FXResourceMgr() {
  this.cache = [];
}

FXResourceMgr.prototype.getResource = function(type, properties) {
    properties = properties || {};
    for (var i = 0; i < this.cache.length; i++) {
        var res = this.cache[i];
        if (res.type == type && !res.used) {
            var areTheSame = true;
            for (var propName in properties) {
                if (properties[propName] != res.properties[propName]) {
                    areTheSame = false;
                }
            }
            if (areTheSame) {
                return res;
            }
        }
    }
    return null;
};

FXResourceMgr.prototype.addResource = function(type, obj, properties) {
    var res = {
        type: type,
        obj: obj,
        properties: properties
    };
    this.cache.push(res);
    return res;
};

FXResourceMgr.prototype.markAllAsNotUsed = function() {
    for (var i = 0; i < this.cache.length; i++) {
        this.cache[i].used = false;
    }
};

module.exports = FXResourceMgr;

},{}],47:[function(require,module,exports){
var FXResourceMgr = require('./FXResourceMgr');
var ScreenImage = require('./ScreenImage');
var FXStageCount = 0;

function FXStage(ctx, source, resourceMgr, fullscreenQuad) {
    this.id = FXStageCount++;
    this.ctx = ctx;
    this.source = source || null;
    this.resourceMgr = resourceMgr || new FXResourceMgr(ctx);
    this.fullscreenQuad = fullscreenQuad || new ScreenImage(ctx);
    this.defaultBPP = 8;
}

FXStage.prototype.reset = function() {
    this.resourceMgr.markAllAsNotUsed();
    return this;
};

FXStage.prototype.getOutputSize = function(width, height) {
    if (width && height) {
        return {
            width: width,
            height: height
        };
    }
    else if (this.source && this.source.width) {
        return {
            width: this.source.width,
            height: this.source.height
        };
    }
    else if (this.source && this.source.getWidth) {
        return {
            width: this.source.getWidth(),
            height: this.source.getHeight()
        };
    }
    else {
        var viewport = this.ctx.getViewport()
        return {
            width: viewport[2],
            height: viewport[3]
        };
    }
};

FXStage.prototype.getRenderTarget = function(w, h, depth, bpp) {
    depth = depth || false;
    bpp = bpp || this.defaultBPP;
    var resProps = {
        w: w,
        h: h,
        depth: depth,
        bpp: bpp
    };
    var res = this.resourceMgr.getResource('RenderTarget', resProps);
    var ctx = this.ctx;
    if (!res) {
        var type = ctx.UNSIGNED_BYTE;
        if (bpp == 16) type = ctx.HALF_FLOAT;
        if (bpp == 32) type = ctx.FLOAT;
        var colorTex = ctx.createTexture2D(null, w, h, { magFilter: ctx.LINEAR, minFilter: ctx.LINEAR, type: type });
        var colorAttachments = [{
            texture: colorTex
        }]

        var depthAttachment = null;
        if (depth) {
            var depthTex = ctx.createTexture2D(null, w, h, { magFilter: ctx.NEAREST, minFilter: ctx.NEAREST, format: ctx.DEPTH_COMPONENT, type: ctx.UNSIGNED_SHORT });
            depthAttachment = {
                texture: depthTex
            }
        }

        var renderTarget = ctx.createFramebuffer(colorAttachments, depthAttachment);
        res = this.resourceMgr.addResource('RenderTarget', renderTarget, resProps);
    }
    res.used = true;
    return res.obj;
};

FXStage.prototype.getFXStage = function(name) {
    var resProps = {};
    var res = this.resourceMgr.getResource('FXStage', resProps);
    if (!res) {
        var fxState = new FXStage(this.ctx, null, this.resourceMgr, this.fullscreenQuad);
        res = this.resourceMgr.addResource('FXStage', fxState, resProps);
    }
    res.used = true;
    return res.obj;
};

FXStage.prototype.asFXStage = function(source, name) {
    var stage = this.getFXStage(name);
    stage.source = source;
    stage.name = name + '_' + stage.id;
    return stage;
};

FXStage.prototype.getShader = function(vert, frag) {
    var resProps = { vert: vert, frag: frag };
    var res = this.resourceMgr.getResource('Program', resProps);
    if (!res) {
        var ctx = this.ctx;
        var program = ctx.createProgram(vert, frag);
        res = this.resourceMgr.addResource('Program', program, resProps);
    }
    res.used = true;
    return res.obj;
};

FXStage.prototype.getSourceTexture = function(source) {
    if (source) {
        if (source.source) {
            if (source.source.getColorAttachment) {
                return source.source.getColorAttachment(0).texture;
            }
            else return source.source;
        }
        else if (source.getColorAttachment) {
            return source.getColorAttachment(0).texture;
        }
        else return source;
    }
    else if (this.source) {
        if (this.source.getColorAttachment) {
            return this.source.getColorAttachment(0).texture;
        }
        else return this.source;
    }
    else throw 'FXStage.getSourceTexture() No source texture!';
};

FXStage.prototype.drawFullScreenQuad = function(width, height, image, program) {
    this.drawFullScreenQuadAt(0, 0, width, height, image, program);
};

FXStage.prototype.drawFullScreenQuadAt = function(x, y, width, height, image, program) {
    var ctx = this.ctx;
    program = program || this.fullscreenQuad.program
    ctx.pushState(ctx.DEPTH_BIT | ctx.VIEWPORT_BIT | ctx.MESH_BIT | ctx.PROGRAM_BIT | ctx.TEXTURE_BIT);
        ctx.setDepthTest(false);
        ctx.setDepthMask(0);
        ctx.setViewport(x, y, width, height);
        ctx.bindMesh(this.fullscreenQuad.mesh);
        ctx.bindProgram(program);
        if (image) {
            if (program.hasUniform('imageSize')) {
                var w = image.width || image.getWidth()
                var h = image.height || image.getHeight()
                program.setUniform('imageSize', [w, h]); //TODO: reuse imageSize array
            }
            ctx.bindTexture(image, 0);
        }
        ctx.drawMesh();
    ctx.popState(ctx.DEPTH_BIT | ctx.VIEWPORT_BIT | ctx.MESH_BIT | ctx.PROGRAM_BIT | ctx.TEXTURE_BIT);
};

FXStage.prototype.getImage = function(path) {
    throw new Error('FXStage.getImage is not implemented!');
    //var resProps = { path: path };
    //var res = this.resourceMgr.getResource('Image', resProps);
    //if (!res) {
    //    var image = Texture2D.load(path);
    //    res = this.resourceMgr.addResource('Image', image, resProps);
    //}
    //res.used = false;
    ////can be shared so no need for locking
    //return res.obj;
};

FXStage.prototype.getFullScreenQuad = function() {
    return this.fullscreenQuad;
};

module.exports = FXStage;

},{"./FXResourceMgr":46,"./ScreenImage":53}],48:[function(require,module,exports){
var FXStage = require('./FXStage');

FXStage.prototype.image = function (src) {
    return this.asFXStage(src, 'image');
}

module.exports = FXStage;

},{"./FXStage":47}],49:[function(require,module,exports){
var FXStage = require('./FXStage');


var VERT = "attribute vec2 aPosition;\nattribute vec2 aTexCoord0;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(aPosition, 0.0, 1.0);\n  vTexCoord = aTexCoord0;\n}\n";
var FRAG = "#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec2 vTexCoord;\nuniform sampler2D tex0;\nuniform sampler2D tex1;\n\nvoid main() {\n  vec4 color = texture2D(tex0, vTexCoord);\n  vec4 color2 = texture2D(tex1, vTexCoord);\n\n  gl_FragColor = color * color2;\n}\n";

FXStage.prototype.mult = function (source2, options) {
    var ctx = this.ctx;
    options = options || {};
    scale = options.scale !== undefined ? options.scale : 1;
    var outputSize = this.getOutputSize(options.width, options.height);
    var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);

    var program = this.getShader(VERT, FRAG);

    ctx.pushState(ctx.FRAMEBUFFER_BIT | ctx.TEXTURE_BIT | ctx.PROGRAM_BIT);
        ctx.bindFramebuffer(rt);
        ctx.setClearColor(0,0,0,0);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

        ctx.bindTexture(this.getSourceTexture(), 0)
        ctx.bindTexture(this.getSourceTexture(source2), 1)

        ctx.bindProgram(program);
        program.setUniform('tex0', 0);
        program.setUniform('tex1', 1);

        this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
    ctx.popState(ctx.FRAMEBUFFER_BIT | ctx.TEXTURE_BIT | ctx.PROGRAM_BIT);

    return this.asFXStage(rt, 'mult');
};

module.exports = FXStage;

},{"./FXStage":47}],50:[function(require,module,exports){
var FXStage = require('./FXStage');

FXStage.prototype.render = function (options) {
    var outputSize = this.getOutputSize(options.width, options.height);
    var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
    var ctx = this.ctx;
    ctx.pushState(ctx.VIEWPORT_BIT | ctx.FRAMEBUFFER_BIT);
        ctx.setViewport(0, 0, outputSize.width, outputSize.height);
        ctx.bindFramebuffer(rt);
        if (options.drawFunc) {
            options.drawFunc();
        }
    ctx.popState(ctx.VIEWPORT_BIT | ctx.FRAMEBUFFER_BIT);
    return this.asFXStage(rt, 'render');
};

},{"./FXStage":47}],51:[function(require,module,exports){
var FXStage = require('./FXStage');

FXStage.prototype.beginRender = function (options) {
    options = options || {};
    var outputSize = this.getOutputSize(options.width, options.height);
    var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);

    var ctx = this.ctx;

    ctx.pushState(ctx.VIEWPORT_BIT | ctx.FRAMEBUFFER_BIT);
        ctx.setViewport(0, 0, outputSize.width, outputSize.height);
        ctx.bindFramebuffer(rt);
        ctx.setClearColor(0,0,0,0);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

    return this.asFXStage(rt, 'render');
};

FXStage.prototype.endRender = function () {
    var ctx = this.ctx;
    ctx.popState(ctx.VIEWPORT_BIT | ctx.FRAMEBUFFER_BIT);
}

module.exports = FXStage;

},{"./FXStage":47}],52:[function(require,module,exports){
var FXStage = require('./FXStage');


var VERT = "attribute vec2 aPosition;\nattribute vec2 aTexCoord0;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(aPosition, 0.0, 1.0);\n  vTexCoord = aTexCoord0;\n}\n";
var FRAG = "#ifdef GL_ES\nprecision highp float;\n#endif\n\n#define PI    3.14159265\n\nvarying vec2 vTexCoord;\n\nuniform sampler2D depthMap;\nuniform vec2 textureSize;\nuniform float near;\nuniform float far;\n\nconst int samples = 3;\nconst int rings = 5;\n\nuniform float strength;\nuniform float offset;\n\nvec2 rand(vec2 coord) {\n  float noiseX = (fract(sin(dot(coord, vec2(12.9898,78.233))) * 43758.5453));\n  float noiseY = (fract(sin(dot(coord, vec2(12.9898,78.233) * 2.0)) * 43758.5453));\n  return vec2(noiseX,noiseY) * 0.004;\n}\n\nfloat compareDepths( in float depth1, in float depth2 )\n{\n  float depthTolerance = far / 5.0;\n  float occlusionTolerance = far / 100.0;\n  float diff = (depth1 - depth2);\n\n  if (diff <= 0.0) return 0.0;\n  if (diff > depthTolerance) return 0.0;\n  if (diff < occlusionTolerance) return 0.0;\n\n  return 1.0;\n}\n\n//fron depth buf normalized z to linear (eye space) z\n//http://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer\nfloat readDepth(vec2 coord) {\n  float z_b = texture2D(depthMap, coord).r;\n  float z_n = 2.0 * z_b - 1.0;\n  float z_e = 2.0 * near * far / (far + near - z_n * (far - near));\n  return z_e;\n}\n\nvoid main() {\n  vec2 texCoord = vec2(gl_FragCoord.x / textureSize.x, gl_FragCoord.y / textureSize.y);\n  float depth = readDepth(texCoord);\n  float z_b = texture2D(depthMap, texCoord).r;\n\n  float d;\n\n  float aspect = textureSize.x / textureSize.y;\n  vec2 noise = rand(vTexCoord);\n\n  float w = (1.0 / textureSize.x)/clamp(z_b,0.1,1.0)+(noise.x*(1.0-noise.x));\n  float h = (1.0 / textureSize.y)/clamp(z_b,0.1,1.0)+(noise.y*(1.0-noise.y));\n\n  float pw;\n  float ph;\n\n  float ao = 0.0;\n  float s = 0.0;\n  float fade = 4.0;\n\n  for (int i = 0 ; i < rings; i += 1)\n  {\n    fade *= 0.5;\n    for (int j = 0 ; j < samples*rings; j += 1)\n    {\n      if (j >= samples*i) break;\n      float step = PI * 2.0 / (float(samples) * float(i));\n      float r = 4.0 * float(i);\n      pw = r * (cos(float(j)*step));\n      ph = r * (sin(float(j)*step)) * aspect;\n      d = readDepth( vec2(texCoord.s + pw * w,texCoord.t + ph * h));\n      ao += compareDepths(depth, d) * fade;\n      s += 1.0 * fade;\n    }\n  }\n\n  ao /= s;\n  ao = clamp(ao, 0.0, 1.0);\n  ao = 1.0 - ao;\n  ao = offset + (1.0 - offset) * ao;\n  ao = pow(ao, strength);\n\n  gl_FragColor = vec4(ao, ao, ao, 1.0);\n}\n";

FXStage.prototype.ssao = function (options) {
    var ctx = this.ctx;
    options = options || {};
    scale = options.scale !== undefined ? options.scale : 1;
    var outputSize = this.getOutputSize(options.width, options.height);
    var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);

    var program = this.getShader(VERT, FRAG);

    ctx.pushState(ctx.FRAMEBUFFER_BIT | ctx.TEXTURE_BIT | ctx.PROGRAM_BIT);
        ctx.bindFramebuffer(rt);
        ctx.setClearColor(0,0,0,0);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

        ctx.bindTexture(this.getSourceTexture(options.depthMap), 0)

        ctx.bindProgram(program);
        program.setUniform('textureSize', [outputSize.width, outputSize.height]);
        program.setUniform('depthMap', 0);
        program.setUniform('strength', options.strength || 1);
        program.setUniform('offset', options.offset || 0);
        program.setUniform('near', options.camera.getNear());
        program.setUniform('far', options.camera.getFar());

        this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
    ctx.popState(ctx.FRAMEBUFFER_BIT | ctx.TEXTURE_BIT | ctx.PROGRAM_BIT);

    return this.asFXStage(rt, 'mult');
};

module.exports = FXStage;

},{"./FXStage":47}],53:[function(require,module,exports){


var VERT = "attribute vec2 aPosition;\nattribute vec2 aTexCoord0;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(aPosition, 0.0, 1.0);\n  vTexCoord = aTexCoord0;\n}\n";
var FRAG = "#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec2 vTexCoord;\nuniform sampler2D uTexture;\nvoid main() {\n    gl_FragColor = texture2D(uTexture, vTexCoord);\n}\n";

function ScreenImage(ctx) {
    this.mesh = ctx.createMesh([
        { data: [[-1,-1], [1,-1], [1, 1], [-1, 1]], location: ctx.ATTRIB_POSITION },
        { data: [[ 0, 0], [1, 0], [1, 1], [ 0, 1]], location: ctx.ATTRIB_TEX_COORD_0 }
    ],  { data: [[0, 1, 2], [0, 2, 3]] });

    ctx.pushState(ctx.PROGRAM_BIT);
        this.program = ctx.createProgram(VERT, FRAG);
        ctx.bindProgram(this.program);
        this.program.setUniform('uTexture', 0);
    ctx.popState(ctx.PROGRAM_BIT);
}

module.exports = ScreenImage;

},{}],54:[function(require,module,exports){
var FXStage = require('./FXStage');


var VERT = "attribute vec2 aPosition;\nattribute vec2 aTexCoord0;\n\nvarying vec2 vTexCoord;\n\nvoid main() {\n  gl_Position = vec4(aPosition, 0.0, 1.0);\n  vTexCoord = aTexCoord0;\n}\n";
var FRAG = "#ifdef GL_ES\nprecision highp float;\n#endif\n\nvarying vec2 vTexCoord;\nuniform sampler2D tex0;\n\nvoid main() {\n  vec4 color = texture2D(tex0, vTexCoord).rgba;\n  if (color.a > 0.0) {\n    color.rgb /= color.a;\n  }\n\n  gl_FragColor = color;\n}\n";

FXStage.prototype.unpremultiply = function (options) {
  var ctx = this.ctx;
  options = options || {};
  var outputSize = this.getOutputSize(options.width, options.height);
  var rt = this.getRenderTarget(outputSize.width, outputSize.height, options.depth, options.bpp);
  var program = this.getShader(VERT, FRAG);

  ctx.pushState(ctx.FRAMEBUFFER_BIT | ctx.TEXTURE_BIT | ctx.PROGRAM_BIT);
      ctx.bindFramebuffer(rt);
      ctx.setClearColor(0,0,0,0);
      ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

      var source = this.getSourceTexture();

      ctx.bindTexture(source, 0)

      ctx.bindProgram(program);
      program.setUniform('tex0', 0);

      this.drawFullScreenQuad(outputSize.width, outputSize.height, null, program);
  ctx.popState(ctx.FRAMEBUFFER_BIT | ctx.TEXTURE_BIT | ctx.PROGRAM_BIT);

  return this.asFXStage(rt, 'unpremultiply');
};

module.exports = FXStage;


module.exports = FXStage;

},{"./FXStage":47}],55:[function(require,module,exports){
var FXStage = require('./FXStage');
require('./Render');
require('./Blit');
require('./Add');
require('./Blur3');
require('./Blur5');
require('./Blur');
require('./Downsample2');
require('./Downsample4');
require('./Image');
require('./FXAA');
require('./CorrectGamma');
//require('./TonemapReinhard');
//require('./Save');
require('./Mult');
require('./SSAO');
require('./RenderWrap');
require('./Unpremultiply');

//
//var globalFx;
//
//module.exports = function() {
//  if (!globalFx) {
//    globalFx = new FXStage();
//  }
//  globalFx.reset();
//  return globalFx;
//};

module.exports = function(ctx) {
    return new FXStage(ctx);
}

module.exports.FXStage = FXStage;

},{"./Add":37,"./Blit":38,"./Blur":39,"./Blur3":40,"./Blur5":41,"./CorrectGamma":42,"./Downsample2":43,"./Downsample4":44,"./FXAA":45,"./FXStage":47,"./Image":48,"./Mult":49,"./Render":50,"./RenderWrap":51,"./SSAO":52,"./Unpremultiply":54}],56:[function(require,module,exports){
var Ray = require('./Ray');
var Vec3 = require('pex-math/Vec3');

var tmp = Vec3.create();

function create(){
    return [[0,0,0],[0,1,0]];
}

function getRayIntersection(plane,ray,out){
    return Ray.hitTestPlane(ray, plane[0], plane[1], out);
}


function side(plane, point) {
    var planePoint = plane[0];
    var planeNormal = plane[1];
    Vec3.set(tmp, planePoint);
    Vec3.sub(tmp, point);
    Vec3.normalize(tmp);
    var dot = Vec3.dot(tmp, planeNormal);
    if (dot > 0) return 1;
    if (dot < 0) return -1;
    return 0;
}

/**
 * [Plane description]
 * @type {Object}
 */
var Plane = {
    /**
     * [create description]
     * @type {Function}
     */
    create : create,
    /**
     * [create description]
     * @type {Function}
     */
    getRayIntersection : getRayIntersection,
    /**
     * [create description]
     * @type {Function}
     */
    side: side
};

module.exports = Plane;

},{"./Ray":57,"pex-math/Vec3":75}],57:[function(require,module,exports){
var Vec3 = require('pex-math/Vec3');

var TEMP_VEC3_0 = Vec3.create();
var TEMP_VEC3_1 = Vec3.create();
var TEMP_VEC3_2 = Vec3.create();
var TEMP_VEC3_3 = Vec3.create();
var TEMP_VEC3_4 = Vec3.create();
var TEMP_VEC3_5 = Vec3.create();
var TEMP_VEC3_6 = Vec3.create();
var TEMP_VEC3_7 = Vec3.create();

var EPSILON = 0.000001;

function create(){
    return [[0,0,0],[0,0,1]];
}

function hitTestTriangle3(a,p0,p1,p2,out){
    var origin    = a[0];
    var direction = a[1];

    var u = Vec3.sub(Vec3.set(TEMP_VEC3_0,p1),p0);
    var v = Vec3.sub(Vec3.set(TEMP_VEC3_1,p2),p0);
    var n = Vec3.cross(Vec3.set(TEMP_VEC3_2,u),v);

    if(Vec3.length(n) < EPSILON){
        return -1;
    }

    var w0 = Vec3.sub(Vec3.set(TEMP_VEC3_3,origin),p0);
    var a_ = -Vec3.dot(n,w0);
    var b  = Vec3.dot(n,direction);

    if(Math.abs(b) < EPSILON){
        if(a_ == 0){
            return -2;
        }
        return -3;
    }

    var r = a_ / b;
    if(r < -EPSILON){
        return -4;
    }

    var I = Vec3.add(Vec3.set(TEMP_VEC3_4,origin),Vec3.scale(Vec3.set(TEMP_VEC3_5,direction),r));

    var uu = Vec3.dot(u,u);
    var uv = Vec3.dot(u,v);
    var vv = Vec3.dot(v,v);

    var w = Vec3.sub(Vec3.set(TEMP_VEC3_6,I),p0);

    var wu = Vec3.dot(w,u);
    var wv = Vec3.dot(w,v);

    var D = uv * uv - uu * vv;

    var s = (uv * wv - vv * wu) / D;

    if (s < -EPSILON || s > 1.0 + EPSILON){
        return -5;
    }

    var t = (uv * wu - uu * wv) / D;

    if (t < -EPSILON || (s + t) > 1.0 + EPSILON) {
        return -6;
    }

    out = out === undefined ? Vec3.create() : out;

    Vec3.set(out,u);
    Vec3.scale(out,s);
    Vec3.add(out,Vec3.scale(Vec3.set(TEMP_VEC3_7,v),t));
    Vec3.add(out,p0);

    return 1;
}

function hitTestTriangle(a,triangle,out){
    return hitTestTriangle3(a,triangle[0],triangle[1],triangle[2],out);
}

function hitTestPlane(a,point,normal,out) {
    var origin    = Vec3.set(TEMP_VEC3_0,a[0]);
    var direction = Vec3.set(TEMP_VEC3_1,a[1]);

    point = Vec3.set(TEMP_VEC3_2,point);

    var dotDirectionNormal = Vec3.dot(direction,normal);

    if (dotDirectionNormal == 0) {
        return null;
    }

    var t = Vec3.dot(Vec3.sub(point,origin),normal) / dotDirectionNormal;

    if(t < 0){
        return null;
    }

    out = out === undefined ? Vec3.create() : out;
    return Vec3.set(out,Vec3.add(origin,Vec3.scale(direction,t)));
}

//http://gamedev.stackexchange.com/questions/18436/most-efficient-aabb-vs-ray-collision-algorithms
function intersectsAABB(a,aabb){
    var origin    = a[0];
    var direction = a[1];

    var dirFracx = 1.0 / direction[0];
    var dirFracy = 1.0 / direction[1];
    var dirFracz = 1.0 / direction[2];

    var min  = aabb[0];
    var max  = aabb[1];

    var minx = min[0];
    var miny = min[1];
    var minz = min[2];

    var maxx = max[0];
    var maxy = max[1];
    var maxz = max[2];

    var t1 = (minx - origin[0]) * dirFracx;
    var t2 = (maxx - origin[0]) * dirFracx;

    var t3 = (miny - origin[1]) * dirFracy;
    var t4 = (maxy - origin[1]) * dirFracy;

    var t5 = (minz - origin[2]) * dirFracz;
    var t6 = (maxz - origin[2]) * dirFracz;

    var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
    var tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

    return !(tmax < 0 || tmin > tmax);
}

/**
 * [Ray description]
 * @type {Object}
 */
var Ray = {
    /**
     * [create description]
     * @type {[type]}
     */
    create : create,
    /**
     * [create description]
     * @type {[type]}
     */
    hitTestTriangle3 : hitTestTriangle3,
    /**
     * [create description]
     * @type {[type]}
     */
    hitTestTriangle  : hitTestTriangle,
    /**
     * [create description]
     * @type {[type]}
     */
    hitTestPlane     : hitTestPlane,
    /**
     * [create description]
     * @type {[type]}
     */
    intersectsAABB   : intersectsAABB
};

module.exports = Ray;

},{"pex-math/Vec3":75}],58:[function(require,module,exports){
function create(){
    return [[Infinity,Infinity],[-Infinity,-Infinity]];
}

function zero(){
    return [[0,0],[0,0]];
}

function copy(a){
    return [a[0].slice(0),a[1].slice()];
}

function set(a,b){
    a[0][0] = b[0][0];
    a[0][1] = b[0][1];
    a[1][0] = b[1][0];
    a[1][1] = b[1][1];
    return a;
}

function set4(a,x,y,w,h){
    a[0][0] = x;
    a[0][1] = y;
    a[1][0] = x + w;
    a[1][1] = y + h;
    return a;
}

function scale(a,n){
    a[0][0] *= n;
    a[0][1] *= n;
    a[1][0] *= n;
    a[1][1] *= n;
    return a;
}

function setMinMax(a,min,max){
    a[0][0] = min[0];
    a[0][1] = min[1];
    a[1][0] = max[0];
    a[1][1] = max[1];
    return a;
}

function setMinMax4(a,minx,miny,maxx,maxy){
    a[0][0] = minx;
    a[0][1] = miny;
    a[1][0] = maxx;
    a[1][1] = maxy;
    return a;
}

function getMin(a,out){
    if(out === undefined){
        return [a[0][0],a[0][1]];
    }
    out[0] = a[0][0];
    out[1] = a[0][1];
    return out;
}

function getMax(a,out){
    if(out === undefined){
        return [a[1][0],a[1][1]];
    }
    out[0] = a[1][0];
    out[1] = a[1][1];
    return out;
}

function setSize2(a,width,height){
    a[1][0] = a[0][0] + width;
    a[1][1] = a[0][1] + height;
    return a;
}

function setSize(a,size){
    a[1][0] = a[0][0] + size[0];
    a[1][1] = a[0][1] + size[1];
    return a;
}

function getSize(a,out){
    var width  = getWidth(a);
    var height = getHeight(a);
    if(out === undefined){
        return [width,height];
    }
    out[0] = width;
    out[1] = height;
    return out;
}

function setWidth(a,width){
    a[1][0] = a[0][0] + width;
    return a;
}

function setHeight(a,height){
    a[1][1] = a[0][1] + height;
    return a;
}

function getWidth(a){
    return a[1][0] - a[0][0];
}

function getHeight(a){
    return a[1][1] - a[0][1];
}

function getAspectRatio(a){
    return getWidth(a) / getHeight(a);
}

function setPosition(a,position){
    return setPosition2(a,position[0],position[1]);
}

function setPosition2(a,x,y){
    a[0][0] = x;
    a[0][1] = y;
    a[1][0] = x + getWidth(a);
    a[1][1] = y + getHeight(a);
    return a;
}

function getTR(a,out){
    if(out === undefined){
        return [a[1][0],a[1]];
    }
    out[0] = a[1][0];
    out[1] = a[0][1];
    return out;
}

function getBL(a,out){
    if(out === undefined){
        return [a[0][0],a[1][1]];
    }
    out[0] = a[0][0];
    out[1] = a[1][1];
    return out;
}

function getCenter(a,out){
    var x = getWidth(a) * 0.5;
    var y = getHeight(a) * 0.5;
    if(out === undefined){
        return [x,y];
    }
    out[0] = x;
    out[1] = y;
    return out;
}

function containsPoint(a,point){
    return containsPoint2(a,point[0],point[1]);
}

function containsPoint2(a,x,y){
    return x >= a[0][0] && x <= a[1][0] && y >= a[0][1] && y <= a[1][1];
}

function containsRect(a,b){
    return containsPoint2(a,b[0][0],b[0][1]) && containsPoint2(a,b[1][0],b[1][1]);
}

function includePoint(a,point){
    return includePoint2(a,point[0],point[1]);
}

function includePoint2(a,x,y){
    var minx = a[0][0];
    var miny = a[0][1];
    var maxx = a[1][0];
    var maxy = a[1][1];

    a[0][0] = minx > x ? x : minx;
    a[0][1] = miny > y ? y : miny;
    a[1][0] = maxx < x ? x : maxx;
    a[1][1] = maxy < y ? y : maxy;

    return a;
}

function includePoints(a,points){
    var minx = a[0][0];
    var miny = a[0][1];
    var maxx = a[1][0];
    var maxy = a[1][1];

    for(var i = 0, l = points.length, x, y; i < l; ++i){
        x = points[i][0];
        y = points[i][1];

        minx = minx > x ? x : minx;
        miny = miny > y ? y : miny;
        maxx = maxx < x ? x : maxx;
        maxy = maxy < y ? y : maxy;
    }

    a[0][0] = minx;
    a[0][1] = miny;
    a[1][0] = maxx;
    a[1][1] = maxy;

    return a;
}

function includePointsFlat(a,points){
    var minx = a[0][0];
    var miny = a[0][1];
    var maxx = a[1][0];
    var maxy = a[1][1];

    for(var i = 0, l = points.length, x, y; i < l; i+=2){
        x = points[i  ];
        y = points[i+1];

        minx = minx > x ? x : minx;
        miny = miny > y ? y : miny;
        maxx = maxx < x ? x : maxx;
        maxy = maxy < y ? y : maxy;
    }

    a[0][0] = minx;
    a[0][1] = miny;
    a[1][0] = maxx;
    a[1][1] = maxy;

    return a;
}

function includeRect(a,rect){
    includePoint(a,rect[0]);
    includePoint(a,rect[1]);
    return a;
}

function includeRects(a,rects){
    for(var i = 0, l = rects.length; i < l; ++i){
        includeRect(a,rects[i]);
    }
    return a;
}

function mapPoint(a,point){
    var minx = a[0][0];
    var miny = a[0][1];
    var maxx = a[1][0];
    var maxy = a[1][1];
    var x = point[0];
    var y = point[1];

    point[0] = Math.max(minx,Math.min(x,maxx)) - minx;
    point[1] = Math.max(miny,Math.min(y,maxy)) - miny;
    return point;
}

function clampPoint(a,point){

    var minx = a[0][0];
    var miny = a[0][1];
    var maxx = a[1][0];
    var maxy = a[1][1];

    point[0] = Math.max(minx,Math.min(point[0],maxx));
    point[1] = Math.max(miny,Math.min(point[1],maxy));
    return point;
}

function toMax(a){
    a[0][0] = a[1][0] = -Number.MAX_VALUE;
    a[0][1] = a[1][1] =  Number.MAX_VALUE;
}

function setEmpty(a){
    a[0][0] = a[0][1] =  Infinity;
    a[1][0] = a[1][1] = -Infinity;
    return a;
}

function isEmpty(a){
    return (a[0][0] > a[1][0]) || (a[0][1] > a[1][1]);
}

function isZero(a){
    return a[0][0] == 0 && a[0][1] == 0 && a[1][0] == 0 && a[1][1] == 0;
}

function setZero(a){
    a[0][0] = a[0][1] = a[1][0] = a[1][1] = 0;
    return a;
}

function createFromPoints(points){
    return includePoints(create(),points);
}

function createFromPointsFlat(points){
    return includePointsFlat(create(),points);
}

function createFromRects(rects){
    return includeRects(create(),rects);
}

/**
 * [Rect description]
 * @type {Object}
 */
var Rect = {
    /**
     * [create description]
     * @type {[type]}
     */
    create : create,
    /**
     * [zero description]
     * @type {[type]}
     */
    zero   : zero,
    /**
     * [copy description]
     * @type {[type]}
     */
    copy   : copy,
    /**
     * [set description]
     * @type {[type]}
     */
    set  : set,
    /**
     * [set4 description]
     * @type {[type]}
     */
    set4 : set4,
    /**
     * [scale description]
     * @type {[type]}
     */
    scale : scale,
    /**
     * [setMinMax description]
     * @type {[type]}
     */
    setMinMax : setMinMax,
    /**
     * [setMinMax4 description]
     * @type {[type]}
     */
    setMinMax4 : setMinMax4,
    /**
     * [getMin description]
     * @type {[type]}
     */
    getMin : getMin,
    /**
     * [getMax description]
     * @type {[type]}
     */
    getMax : getMax,
    /**
     * [setSize2 description]
     * @type {[type]}
     */
    setSize2  : setSize2,
    /**
     * [setSize description]
     * @type {[type]}
     */
    setSize   : setSize,
    /**
     * [getSize description]
     * @type {[type]}
     */
    getSize   : getSize,
    /**
     * [setWidth description]
     * @type {[type]}
     */
    setWidth  : setWidth,
    /**
     * [getWidth description]
     * @type {[type]}
     */
    getWidth  : getWidth,
    /**
     * [setHeight description]
     * @type {[type]}
     */
    setHeight : setHeight,
    /**
     * [getHeight description]
     * @type {[type]}
     */
    getHeight : getHeight,
    /**
     * [getAspectRatio description]
     * @type {[type]}
     */
    getAspectRatio : getAspectRatio,
    /**
     * [setPosition description]
     * @type {[type]}
     */
    setPosition  : setPosition,
    /**
     * [setPosition2 description]
     * @type {[type]}
     */
    setPosition2 : setPosition2,
    /**
     * [getPosition description]
     * @type {[type]}
     */
    getPosition  : getMin,
    /**
     * [getTL description]
     * @type {[type]}
     */
    getTL : getMin,
    /**
     * [getTR description]
     * @type {[type]}
     */
    getTR : getTR,
    /**
     * [getBL description]
     * @type {[type]}
     */
    getBL : getBL,
    /**
     * [getBR description]
     * @type {[type]}
     */
    getBR : getMax,
    /**
     * [getCenter description]
     * @type {[type]}
     */
    getCenter : getCenter,
    /**
     * [containsPoint description]
     * @type {[type]}
     */
    containsPoint : containsPoint,
    /**
     * [containsPoint2 description]
     * @type {[type]}
     */
    containsPoint2 : containsPoint2,
    /**
     * [containsRect description]
     * @type {[type]}
     */
    containsRect   : containsRect,
    /**
     * [includePoint description]
     * @type {[type]}
     */
    includePoint      : includePoint,
    /**
     * [includePoint2 description]
     * @type {[type]}
     */
    includePoint2     : includePoint2,
    /**
     * [includePoints description]
     * @type {[type]}
     */
    includePoints     : includePoints,
    /**
     * [includePointsFlat description]
     * @type {[type]}
     */
    includePointsFlat : includePointsFlat,
    /**
     * [includeRect description]
     * @type {[type]}
     */
    includeRect   : includeRect,
    /**
     * [includeRects description]
     * @type {[type]}
     */
    includeRects  : includeRects,
    /**
     * [mapPoint description]
     * @type {[type]}
     */
    mapPoint   : mapPoint,
    /**
     * [clampPoint description]
     * @type {[type]}
     */
    clampPoint : clampPoint,
    /**
     * [isZero description]
     * @type {Boolean}
     */
    isZero   : isZero,
    /**
     * [isEmpty description]
     * @type {Boolean}
     */
    isEmpty  : isEmpty,
    /**
     * [setEmpty description]
     * @type {[type]}
     */
    setEmpty : setEmpty,
    /**
     * [toMax description]
     * @type {[type]}
     */
    toMax  : toMax,
    /**
     * [setZero description]
     * @type {[type]}
     */
    setZero : setZero,
    /**
     * [createFromPoints description]
     * @type {[type]}
     */
    createFromPoints     : createFromPoints,
    /**
     * [createFromPointsFlat description]
     * @type {[type]}
     */
    createFromPointsFlat : createFromPointsFlat,
    /**
     * [createFromRects description]
     * @type {[type]}
     */
    createFromRects      : createFromRects
};

module.exports = Rect;

},{}],59:[function(require,module,exports){
var isPlask = require('is-plask');
var GUIControl = require('./GUIControl');
var Renderer = isPlask ? require('./SkiaRenderer') : require('./HTMLCanvasRenderer');
var Rect = require('pex-geom/Rect');
var KeyboardEvent = require('pex-sys/KeyboardEvent');

var VERT = '\
attribute vec4 aPosition; \
attribute vec2 aTexCoord0; \
uniform vec2 uWindowSize; \
uniform vec4 uRect; \
varying vec2 vTexCoord0; \
void main() { \
    vTexCoord0 = aTexCoord0; \
    vec2 pos = aPosition.xy * 0.5 + 0.5; \
    pos.x = uRect.x + pos.x * (uRect.z - uRect.x); \
    pos.y = uRect.y + pos.y * (uRect.w - uRect.y); \
    pos.x /= uWindowSize.x; \
    pos.y /= uWindowSize.y; \
    pos = (pos - 0.5) * 2.0; \
    gl_Position = vec4(pos, 0.0, 1.0); \
}';

var TEXTURE_2D_FRAG = '\
varying vec2 vTexCoord0; \
uniform sampler2D uTexture; \
uniform float uHDR; \
void main() { \
    gl_FragColor = texture2D(uTexture, vec2(vTexCoord0.x, vTexCoord0.y)); \
    if (uHDR == 1.0) { \
        gl_FragColor.rgb = gl_FragColor.rgb / (gl_FragColor.rgb + 1.0); \
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0/2.2)); \
    }\
}';

//we want normal (not fliped) cubemaps maps to be represented same way as
//latlong panoramas so we flip by -1.0 by default
//render target dynamic cubemaps should be not flipped
var TEXTURE_CUBE_FRAG = '\
const float PI = 3.1415926; \
varying vec2 vTexCoord0; \
uniform samplerCube uTexture; \
uniform float uHDR; \
uniform float uFlipEnvMap; \
uniform float uLevel; \
void main() { \
    float theta = vTexCoord0.x * 2.0 * PI - PI/2.0; \
    float phi = vTexCoord0.y * PI; \
    float x = cos(theta) * sin(phi); \
    float y = -cos(phi); \
    float z = sin(theta) * sin(phi); \
    vec3 N = normalize(vec3(uFlipEnvMap * x, y, z));\n' + 
'#ifdef CAPS_SHADER_TEXTURE_LOD\n' + 
    'gl_FragColor = textureCubeLod(uTexture, N, uLevel); \n' + 
'#else \n' + 
    'gl_FragColor = textureCube(uTexture, N, uLevel); \n' + 
'#endif \n' +
    'if (uHDR == 1.0) { \
        gl_FragColor.rgb = gl_FragColor.rgb / (gl_FragColor.rgb + 1.0); \
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0/2.2)); \
    }\
}';


/**
 * [GUI description]
 * @param {[type]} ctx          [description]
 * @param {[type]} windowWidth  [description]
 * @param {[type]} windowHeight [description]
 */
function GUI(ctx, windowWidth, windowHeight, pixelRatio) {
    console.log('GUI+', windowWidth, windowHeight, pixelRatio);
    pixelRatio = pixelRatio || 1;
    this._ctx = ctx;
    this._pixelRatio = pixelRatio;
    this._windowWidth = windowWidth;
    this._windowHeight = windowHeight;
    this._windowSize = [this._windowWidth, this._windowHeight];
    this._textureRect = [0, 0, windowWidth, windowHeight];
    this._textureTmpRect = [0, 0, 0, 0];
    this.x = 0;
    this.y = 0;
    this.mousePos = [0, 0];
    this.scale = 1;

    if (!isPlask) {
        TEXTURE_2D_FRAG = 'precision highp float;\n' + TEXTURE_2D_FRAG;
        TEXTURE_CUBE_FRAG = 'precision highp float;\n' + TEXTURE_CUBE_FRAG;
        if (ctx.isSupported(ctx.CAPS_SHADER_TEXTURE_LOD)) {
          TEXTURE_CUBE_FRAG = '#define CAPS_SHADER_TEXTURE_LOD\n' + TEXTURE_CUBE_FRAG;
          TEXTURE_CUBE_FRAG = '#extension GL_EXT_shader_texture_lod : require\n' + TEXTURE_CUBE_FRAG;
        }
        TEXTURE_CUBE_FRAG = '#define textureCubeLod textureCubeLodEXT\n' + TEXTURE_CUBE_FRAG;
    }
    else {
        TEXTURE_CUBE_FRAG = '#extension GL_ARB_shader_texture_lod : require\n' + TEXTURE_CUBE_FRAG;
    }

    this.texture2DProgram = ctx.createProgram(VERT, TEXTURE_2D_FRAG);
    this.textureCubeProgram = ctx.createProgram(VERT, TEXTURE_CUBE_FRAG);
    this.rectMesh = ctx.createMesh([
        { data: [[-1,-1], [1,-1], [1, 1], [-1, 1]], location: ctx.ATTRIB_POSITION },
        { data: [[ 0, 0], [1, 0], [1, 1], [ 0, 1]], location: ctx.ATTRIB_TEX_COORD_0 }
    ],  { data: [[0, 1, 2], [0, 2, 3]] }
    );

    this.renderer = new Renderer(ctx,windowWidth, windowHeight, pixelRatio);

    this.screenBounds = [0, 0, windowWidth, windowHeight];

    this.items = [];
    this.enabled = true;
}

/**
 * [onMouseDown description]
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
GUI.prototype.onMouseDown = function (e) {
  if (!this.enabled) return;

  this.items.forEach(function(item) {
    if (item.type == 'text') {
      if (item.focus) {
        item.focus = false;
        item.dirty = true;
      }
    }
  })

  this.activeControl = null;
  this.mousePos[0] = e.x / this._pixelRatio - this.x;
  this.mousePos[1] = e.y / this._pixelRatio - this.y;
  for (var i = 0; i < this.items.length; i++) {
    if (Rect.containsPoint(this.items[i].activeArea, this.mousePos)) {
      this.activeControl = this.items[i];
      var aa = this.activeControl.activeArea;
      var aaWidth  = aa[1][0] - aa[0][0];
      var aaHeight = aa[1][1] - aa[0][1];
      this.activeControl.active = true;
      this.activeControl.dirty = true;
      if (this.activeControl.type == 'button') {
        if (this.activeControl.onclick) this.activeControl.onclick();
      }
      else if (this.activeControl.type == 'toggle') {
        this.activeControl.contextObject[this.activeControl.attributeName] = !this.activeControl.contextObject[this.activeControl.attributeName];
        if (this.activeControl.onchange) {
          this.activeControl.onchange(this.activeControl.contextObject[this.activeControl.attributeName]);
        }
      }
      else if (this.activeControl.type == 'radiolist') {
        var hitY = this.mousePos[1] - aa[0][1];
        var hitItemIndex = Math.floor(this.activeControl.items.length * hitY / aaHeight);
        if (hitItemIndex < 0)
          continue;
        if (hitItemIndex >= this.activeControl.items.length)
          continue;
        this.activeControl.contextObject[this.activeControl.attributeName] = this.activeControl.items[hitItemIndex].value;
        if (this.activeControl.onchange) {
          this.activeControl.onchange(this.activeControl.items[hitItemIndex].value);
        }
      }
      else if (this.activeControl.type == 'texturelist') {
        var clickedItem = null;
        this.activeControl.items.forEach(function(item) {
          if (Rect.containsPoint(item.activeArea, this.mousePos)) {
            clickedItem = item;
          }
        }.bind(this))

        if (!clickedItem)
          continue;

        this.activeControl.contextObject[this.activeControl.attributeName] = clickedItem.value;
        if (this.activeControl.onchange) {
          this.activeControl.onchange(clickedItem.value);
        }
      }
      else if (this.activeControl.type == 'color') {
        var numSliders = this.activeControl.options.alpha ? 4 : 3;
        var slidersHeight = aaHeight;
        if (this.activeControl.options.palette) {
          var iw = this.activeControl.options.paletteImage.width;
          var ih = this.activeControl.options.paletteImage.height;
          var y = e.y / this._pixelRatio - aa[0][1];
          slidersHeight = aaHeight - aaWidth * ih / iw;
          var imageDisplayHeight = aaWidth * ih / iw;
          var imageStartY = aaHeight - imageDisplayHeight;

          if (y > imageStartY) {
            var u = (e.x /this._pixelRatio - aa[0][0]) / aaWidth;
            var v = (y - imageStartY) / imageDisplayHeight;
            var x = Math.floor(iw * u);
            var y = Math.floor(ih * v);
            var color = this.renderer.getImageColor(this.activeControl.options.paletteImage, x, y);
            this.activeControl.dirty = true;

            this.activeControl.contextObject[this.activeControl.attributeName][0] = color[0];
            this.activeControl.contextObject[this.activeControl.attributeName][1] = color[1];
            this.activeControl.contextObject[this.activeControl.attributeName][2] = color[2];
            if (this.activeControl.onchange) {
              this.activeControl.onchange(this.activeControl.contextObject[this.activeControl.attributeName]);
            }
            continue;
          }
        }
      }
      else if (this.activeControl.type == 'text') {
        this.activeControl.focus = true;
      }
      e.stopPropagation()
      this.onMouseDrag(e);
      break;
    }
  }
};

/**
 * [onMouseDrag description]
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
GUI.prototype.onMouseDrag = function (e) {
  if (!this.enabled) return;

  if (this.activeControl) {
    var aa = this.activeControl.activeArea;
    var aaWidth  = aa[1][0] - aa[0][0];
    var aaHeight = aa[1][1] - aa[0][1];
    if (this.activeControl.type == 'slider') {
      var val = (e.x / this._pixelRatio - aa[0][0]) / aaWidth;
      val = Math.max(0, Math.min(val, 1));
      this.activeControl.setNormalizedValue(val);
      if (this.activeControl.onchange) {
        this.activeControl.onchange(this.activeControl.contextObject[this.activeControl.attributeName]);
      }
      this.activeControl.dirty = true;
    }
    else if (this.activeControl.type == 'multislider') {
      var val = (e.x / this._pixelRatio - aa[0][0]) / aaWidth;
      val = Math.max(0, Math.min(val, 1));
      var idx = Math.floor(this.activeControl.getValue().length * (e.y / this._pixelRatio - aa[0][1]) / aaHeight);
      if (!isNaN(this.activeControl.clickedSlider)) {
        idx = this.activeControl.clickedSlider;
      }
      else {
        this.activeControl.clickedSlider = idx;
      }
      this.activeControl.setNormalizedValue(val, idx);
      if (this.activeControl.onchange) {
        this.activeControl.onchange(this.activeControl.contextObject[this.activeControl.attributeName]);
      }
      this.activeControl.dirty = true;
    }
    else if (this.activeControl.type == 'color') {
      var numSliders = this.activeControl.options.alpha ? 4 : 3;
      var slidersHeight = aaHeight;
      if (this.activeControl.options.palette) {
        var iw = this.activeControl.options.paletteImage.width;
        var ih = this.activeControl.options.paletteImage.height;
        var y = e.y / this._pixelRatio - aa[0][1];
        slidersHeight = aaHeight - aaWidth * ih / iw;
        var imageDisplayHeight = aaWidth * ih / iw;
        var imageStartY = aaHeight - imageDisplayHeight;
        if (y > imageStartY && isNaN(this.activeControl.clickedSlider)) {
            var u = (e.x /this._pixelRatio - aa[0][0]) / aaWidth;
            var v = (y - imageStartY) / imageDisplayHeight;
            var x = Math.floor(iw * u);
            var y = Math.floor(ih * v);
            var color = this.renderer.getImageColor(this.activeControl.options.paletteImage, x, y);
            this.activeControl.dirty = true;
            this.activeControl.contextObject[this.activeControl.attributeName][0] = color[0];
            this.activeControl.contextObject[this.activeControl.attributeName][1] = color[1];
            this.activeControl.contextObject[this.activeControl.attributeName][2] = color[2];
            if (this.activeControl.onchange) {
              this.activeControl.onchange(this.activeControl.contextObject[this.activeControl.attributeName]);
            }
            e.stopPropagation()
            return;
          }
      }

      var val = (e.x / this._pixelRatio - aa[0][0]) / aaWidth;
      val = Math.max(0, Math.min(val, 1));
      var idx = Math.floor(numSliders * (e.y / this._pixelRatio - aa[0][1]) / slidersHeight);
      if (!isNaN(this.activeControl.clickedSlider)) {
        idx = this.activeControl.clickedSlider;
      }
      else {
        this.activeControl.clickedSlider = idx;
      }
      this.activeControl.setNormalizedValue(val, idx);
      if (this.activeControl.onchange) {
        this.activeControl.onchange(this.activeControl.contextObject[this.activeControl.attributeName]);
      }
      this.activeControl.dirty = true;
    }
    e.stopPropagation()
  }
};

/**
 * [onMouseUp description]
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
GUI.prototype.onMouseUp = function (e) {
  if (!this.enabled) return;

  if (this.activeControl) {
    this.activeControl.active = false;
    this.activeControl.dirty = true;
    this.activeControl.clickedSlider = undefined;
    this.activeControl = null;
  }
};

/**
 * [onKeyDown description]
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
GUI.prototype.onKeyDown = function (e) {
  var focusedItem = this.items.filter(function(item) { return item.type == 'text' && item.focus})[0];
  if (!focusedItem) {
      return;
  }

  switch(e.keyCode) {
    case KeyboardEvent.VK_BACKSPACE:
      var str = focusedItem.contextObject[focusedItem.attributeName];
      focusedItem.contextObject[focusedItem.attributeName] = str.substr(0, Math.max(0, str.length-1));
      focusedItem.dirty = true;
      if (focusedItem.onchange) {
        focusedItem.onchange(focusedItem.contextObject[focusedItem.attributeName]);
      }
      e.stopPropagation()
      break;

  }
}

/**
 * [onKeyPress description]
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
GUI.prototype.onKeyPress = function (e) {
    var focusedItem = this.items.filter(function(item) { return item.type == 'text' && item.focus})[0];
    if (!focusedItem) {
        return;
    }

    var c = e.str.charCodeAt(0);
    if (c >= 32 && c <= 126) {
      focusedItem.contextObject[focusedItem.attributeName] += e.str;
      focusedItem.dirty = true;
      if (focusedItem.onchange) {
        focusedItem.onchange(focusedItem.contextObject[focusedItem.attributeName]);
      }
      e.stopPropagation()
    }
}

/**
 * [addHeader description]
 * @param {[type]} title [description]
 */
GUI.prototype.addHeader = function (title) {
  var ctrl = new GUIControl({
    type: 'header',
    title: title,
    dirty: true,
    activeArea: [[0, 0], [0, 0]],
    setTitle: function (title) {
      this.title = title;
      this.dirty = true;
    }
  });
  this.items.push(ctrl);
  return ctrl;
};

/**
 * [addSeparator description]
 * @param {[type]} title [description]
 */
GUI.prototype.addSeparator = function (title) {
  var ctrl = new GUIControl({
    type: 'separator',
    dirty: true,
    activeArea: [[0, 0], [0, 0]]
  });
  this.items.push(ctrl);
  return ctrl;
};

/**
 * [addLabel description]
 * @param {[type]} title [description]
 */
GUI.prototype.addLabel = function (title) {
  var ctrl = new GUIControl({
    type: 'label',
    title: title,
    dirty: true,
    activeArea: [[0, 0], [0, 0]],
    setTitle: function (title) {
      this.title = title;
      this.dirty = true;
    }
  });
  this.items.push(ctrl);
  return ctrl;
};

/**
 * [addParam description]
 * @param {[type]} title         [description]
 * @param {[type]} contextObject [description]
 * @param {[type]} attributeName [description]
 * @param {[type]} options       [description]
 * @param {[type]} onchange      [description]
 */
GUI.prototype.addParam = function (title, contextObject, attributeName, options, onchange) {
    options = options || {};
    if (typeof(options.min) == 'undefined') options.min = 0;
    if (typeof(options.max) == 'undefined') options.max = 1;
    if (contextObject[attributeName] === false || contextObject[attributeName] === true) {
        var ctrl = new GUIControl({
            type: 'toggle',
            title: title,
            contextObject: contextObject,
            attributeName: attributeName,
            activeArea: [[0, 0], [0, 0]],
            options: options,
            onchange: onchange,
            dirty: true
        });
        this.items.push(ctrl);
        return ctrl;
    }
    else if (!isNaN(contextObject[attributeName])) {
        var ctrl = new GUIControl({
            type: 'slider',
            title: title,
            contextObject: contextObject,
            attributeName: attributeName,
            activeArea: [[0, 0], [0, 0]],
            options: options,
            onchange: onchange,
            dirty: true
        });
        this.items.push(ctrl);
        return ctrl;
    }
    else if ((contextObject[attributeName] instanceof Array) && (options && options.type == 'color')) {
        var ctrl = new GUIControl({
            type: 'color',
            title: title,
            contextObject: contextObject,
            attributeName: attributeName,
            activeArea: [[0, 0], [0, 0]],
            options: options,
            onchange: onchange,
            dirty: true
        });
        this.items.push(ctrl);
        return ctrl;
    }
    else if (contextObject[attributeName] instanceof Array) {
        var ctrl = new GUIControl({
            type: 'multislider',
            title: title,
            contextObject: contextObject,
            attributeName: attributeName,
            activeArea: [[0, 0], [0, 0]],
            options: options,
            onchange: onchange,
            dirty: true
        });
        this.items.push(ctrl);
        return ctrl;
    }
    else if (typeof contextObject[attributeName] == 'string') {
        var ctrl = new GUIControl({
            type: 'text',
            title: title,
            contextObject: contextObject,
            attributeName: attributeName,
            activeArea: [[0, 0], [0, 0]],
            options: options,
            onchange: onchange,
            dirty: true
        });
        this.items.push(ctrl);
        return ctrl;
    }
};

/**
 * [addButton description]
 * @param {[type]} title   [description]
 * @param {[type]} onclick [description]
 */
GUI.prototype.addButton = function (title, onclick) {
    var ctrl = new GUIControl({
        type: 'button',
        title: title,
        onclick: onclick,
        activeArea: [[0, 0], [0, 0]],
        dirty: true,
        options: {}
    });
    this.items.push(ctrl);
    return ctrl;
};

/**
 * [addRadioList description]
 * @param {[type]} title         [description]
 * @param {[type]} contextObject [description]
 * @param {[type]} attributeName [description]
 * @param {[type]} items         [description]
 * @param {[type]} onchange      [description]
 */
GUI.prototype.addRadioList = function (title, contextObject, attributeName, items, onchange) {
    var ctrl = new GUIControl({
        type: 'radiolist',
        title: title,
        contextObject: contextObject,
        attributeName: attributeName,
        activeArea: [[0, 0], [0, 0]],
        items: items,
        onchange: onchange,
        dirty: true
    });
    this.items.push(ctrl);
    return ctrl;
};

/**
 * [addTexture2DList description]
 * @param {[type]} title         [description]
 * @param {[type]} contextObject [description]
 * @param {[type]} attributeName [description]
 * @param {[type]} items         [description]
 * @param {[type]} itemsPerRow   [description]
 * @param {[type]} onchange      [description]
 */
GUI.prototype.addTexture2DList = function (title, contextObject, attributeName, items, itemsPerRow, onchange) {
    var ctrl = new GUIControl({
        type: 'texturelist',
        title: title,
        contextObject: contextObject,
        attributeName: attributeName,
        activeArea: [[0, 0], [0, 0]],
        items: items,
        itemsPerRow: itemsPerRow || 4,
        onchange: onchange,
        dirty: true
    });
    this.items.push(ctrl);
    return ctrl;
};

/**
 * [addTexture2D description]
 * @param {[type]} title   [description]
 * @param {[type]} texture [description]
 * @param {[type]} options [description]
 */
GUI.prototype.addTexture2D = function (title, texture, options) {
    var ctrl = new GUIControl({
        type: 'texture2D',
        title: title,
        texture: texture,
        options: options,
        activeArea: [[0, 0], [0, 0]],
        dirty: true
    });
    this.items.push(ctrl);
    return ctrl;
};

GUI.prototype.addTextureCube = function(title, texture, options) {
    var ctrl = new GUIControl({
        type: 'textureCube',
        title: title,
        texture: texture,
        options: options,
        activeArea: [[0, 0], [0, 0]],
        dirty: true,
        flipZ: 1
    });
    this.items.push(ctrl);
    return ctrl;
};

/**
 * [dispose description]
 * @return {[type]} [description]
 */
GUI.prototype.dispose = function () {
};

/**
 * [function description]
 * @param  {[type]} items [description]
 * @return {[type]}       [description]
 */
GUI.prototype.isAnyItemDirty = function(items) {
  var dirty = false;
  items.forEach(function(item) {
    if (item.dirty) {
      item.dirty = false;
      dirty = true;
    }
  });
  return dirty;
};

/**
 * [draw description]
 * @return {[type]} [description]
 */
GUI.prototype.draw = function () {
    if (!this.enabled) {
        return;
    }

    if (this.items.length === 0) {
        return;
    }

    if (this.isAnyItemDirty(this.items)) {
        this.renderer.draw(this.items, this.scale);
    }

    var ctx = this._ctx;

    ctx.pushState(ctx.DEPTH_BIT | ctx.BLEND_BIT);
    ctx.setDepthTest(false);
    ctx.setBlend(true);
    ctx.setBlendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA);
    ctx.bindProgram(this.texture2DProgram);
    this.texture2DProgram.setUniform('uTexture', 0);
    this.texture2DProgram.setUniform('uWindowSize', this._windowSize);
    this.texture2DProgram.setUniform('uRect', this._textureRect);
    ctx.bindMesh(this.rectMesh);
    ctx.bindTexture(this.renderer.getTexture())
    ctx.drawMesh();
    ctx.bindProgram(this.textureCubeProgram);
    this.textureCubeProgram.setUniform('uTexture', 0);
    this.textureCubeProgram.setUniform('uWindowSize', this._windowSize);


    this.drawTextures();
    ctx.popState(ctx.DEPTH_BIT | ctx.BLEND_BIT);
};

/**
 * [drawTextures description]
 * @return {[type]} [description]
 */
GUI.prototype.drawTextures = function () {
  var ctx = this._ctx;
  for (var i = 0; i < this.items.length; i++) {
    var item = this.items[i];
    var scale = this.scale * this._pixelRatio;
    if (item.type == 'texture2D') {
      //we are trying to match flipped gui texture which 0,0 starts at the top with window coords that have 0,0 at the bottom
      var bounds = [item.activeArea[0][0] * scale, this._windowHeight - item.activeArea[1][1] * scale, item.activeArea[1][0] * scale, this._windowHeight - item.activeArea[0][1] * scale];
      ctx.bindProgram(this.texture2DProgram);
      ctx.bindTexture(item.texture);
      this.texture2DProgram.setUniform('uRect', bounds);
      this.texture2DProgram.setUniform('uHDR', item.options && item.options.hdr ? 1 : 0);
      ctx.drawMesh();
    }
    if (item.type == 'texturelist') {
    ctx.bindProgram(this.texture2DProgram);
      item.items.forEach(function(textureItem) {
        //var bounds = [item.activeArea[0][0] * scale, this._windowHeight - item.activeArea[1][1] * scale, item.activeArea[1][0] * scale, this._windowHeight - item.activeArea[0][1] * scale];
        var bounds = [textureItem.activeArea[0][0] * scale, this._windowHeight - textureItem.activeArea[1][1] * scale, textureItem.activeArea[1][0] * scale, this._windowHeight - textureItem.activeArea[0][1] * scale];
        this.texture2DProgram.setUniform('uRect', bounds);
        this.texture2DProgram.setUniform('uHDR', item.options && item.options.hdr ? 1 : 0);
        ctx.bindTexture(textureItem.texture);
        ctx.drawMesh();
      }.bind(this));
    }
    if (item.type == 'textureCube') {
      var level = (item.options && item.options.level !== undefined) ? item.options.level : 0
      ctx.bindProgram(this.textureCubeProgram);
      //we are trying to match flipped gui texture which 0,0 starts at the top with window coords that have 0,0 at the bottom
      var bounds = [item.activeArea[0][0] * scale, this._windowHeight - item.activeArea[1][1] * scale, item.activeArea[1][0] * scale, this._windowHeight - item.activeArea[0][1] * scale];
      ctx.bindTexture(item.texture);
      this.textureCubeProgram.setUniform('uRect', bounds);
      this.textureCubeProgram.setUniform('uLevel', level);
      this.textureCubeProgram.setUniform('uHDR', item.options && item.options.hdr ? 1 : 0);
      this.textureCubeProgram.setUniform('uFlipEnvMap', item.texture.getFlipEnvMap());
      ctx.drawMesh();
    }
  }
  //this.screenImage.setBounds(this.screenBounds);
  //this.screenImage.setImage(this.renderer.getTexture());
};

/**
 * [serialize description]
 * @return {[type]} [description]
 */
GUI.prototype.serialize = function () {
  var data = {};
  this.items.forEach(function (item, i) {
    data[item.title] = item.getSerializedValue();
  });
  return data;
};

/**
 * [deserialize description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
GUI.prototype.deserialize = function (data) {
  this.items.forEach(function (item, i) {
    if (data[item.title] !== undefined) {
      item.setSerializedValue(data[item.title]);
      item.dirty = true;
    }
  });
};

/**
 * [save description]
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
GUI.prototype.save = function (path) {
  var data = this.serialize();
  IO.saveTextFile(path, JSON.stringify(data));
};

/**
 * [load description]
 * @param  {[type]}   path     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
GUI.prototype.load = function (path, callback) {
  var self = this;
  IO.loadTextFile(path, function (dataStr) {
    var data = JSON.parse(dataStr);
    self.deserialize(data);
    if (callback) {
      callback();
    }
  });
};

/**
 * [function description]
 * @param  {[type]} state [description]
 * @return {[type]}       [description]
 */
GUI.prototype.setEnabled = function(state) {
  this.enabled = state;
}

/**
 * [function description]
 * @return {[type]} [description]
 */
GUI.prototype.isEnabled = function() {
  return this.enabled;
}

/**
 * [function description]
 * @return {[type]} [description]
 */
GUI.prototype.toggleEnabled = function() {
  return this.enabled = !this.enabled;
}

module.exports = GUI;

},{"./GUIControl":60,"./HTMLCanvasRenderer":61,"./SkiaRenderer":62,"is-plask":15,"pex-geom/Rect":58,"pex-sys/KeyboardEvent":82}],60:[function(require,module,exports){
var rgb2hsl = require('float-rgb2hsl');
var hsl2rgb = require('float-hsl2rgb');

/**
 * [GUIControl description]
 * @param {[type]} o [description]
 */
function GUIControl(o) {
  for (var i in o) {
    this[i] = o[i];
  }
}

/**
 * [function description]
 * @param  {[type]} x [description]
 * @param  {[type]} y [description]
 * @return {[type]}   [description]
 */
GUIControl.prototype.setPosition = function(x, y) {
  this.px = x;
  this.py = y;
};

/**
 * [function description]
 * @param  {[type]} idx [description]
 * @return {[type]}     [description]
 */
GUIControl.prototype.getNormalizedValue = function(idx) {
  if (!this.contextObject) {
    return 0;
  }

  var val = this.contextObject[this.attributeName];
  var options = this.options;
  if (options && options.min !== undefined && options.max !== undefined) {
    if (this.type == 'multislider') {
      val = (val[idx] - options.min) / (options.max - options.min);
    }
    else if (this.type == 'color') {
      var hsl = rgb2hsl(val);
      if (idx == 0) val = hsl[0];
      if (idx == 1) val = hsl[1];
      if (idx == 2) val = hsl[2];
      if (idx == 3) val = val[4];
    }
    else {
      val = (val - options.min) / (options.max - options.min);
    }
  }
  return val;
};

/**
 * [function description]
 * @param  {[type]} val [description]
 * @param  {[type]} idx [description]
 * @return {[type]}     [description]
 */
GUIControl.prototype.setNormalizedValue = function(val, idx) {
  if (!this.contextObject) {
    return;
  }

  var options = this.options;
  if (options && options.min !== undefined && options.max !== undefined) {
    if (this.type == 'multislider') {
      var a = this.contextObject[this.attributeName];
      if (idx >= a.length) {
        return;
      }
      a[idx] = options.min + val * (options.max - options.min);
      val = a;
    }
    else if (this.type == 'color') {
      var c = this.contextObject[this.attributeName];
      var hsl = rgb2hsl(c);
      if (idx == 0) hsl[0] = val;
      if (idx == 1) hsl[1] = val;
      if (idx == 2) hsl[2] = val;
      if (idx == 3) c[4] = val;

      if (idx != 3) {
          var rgb = hsl2rgb(hsl);
          c[0] = rgb[0];
          c[1] = rgb[1];
          c[2] = rgb[2];
      }
      val = c;
    }
    else {
      val = options.min + val * (options.max - options.min);
    }
    if (options && options.step) {
      val = val - val % options.step;
    }
  }
  this.contextObject[this.attributeName] = val;
};

/**
 * [function description]
 * @return {[type]} [description]
 */
GUIControl.prototype.getSerializedValue = function() {
  if (this.contextObject) {
    return this.contextObject[this.attributeName];
  }
  else {
    return '';
  }

}

/**
 * [function description]
 * @param  {[type]} value [description]
 * @return {[type]}       [description]
 */
GUIControl.prototype.setSerializedValue = function(value) {
  if (this.type == 'slider') {
    this.contextObject[this.attributeName] = value;
  }
  else if (this.type == 'multislider') {
    this.contextObject[this.attributeName] = value;
  }
  else if (this.type == 'color') {
    this.contextObject[this.attributeName].r = value.r;
    this.contextObject[this.attributeName].g = value.g;
    this.contextObject[this.attributeName].b = value.b;
    this.contextObject[this.attributeName].a = value.a;
  }
  else if (this.type == 'toggle') {
    this.contextObject[this.attributeName] = value;
  }
  else if (this.type == 'radiolist') {
    this.contextObject[this.attributeName] = value;
  }
}


/**
 * [function description]
 * @return {[type]} [description]
 */
GUIControl.prototype.getValue = function() {
  if (this.type == 'slider') {
    return this.contextObject[this.attributeName];
  }
  else if (this.type == 'multislider') {
    return this.contextObject[this.attributeName];
  }
  else if (this.type == 'color') {
    return this.contextObject[this.attributeName];
  }
  else if (this.type == 'toggle') {
    return this.contextObject[this.attributeName];
  }
  else {
    return 0;
  }
};

/**
 * [function description]
 * @return {[type]} [description]
 */
GUIControl.prototype.getStrValue = function() {
  if (this.type == 'slider') {
    var str = '' + this.contextObject[this.attributeName];
    var dotPos = str.indexOf('.') + 1;
    if (dotPos === 0) {
      return str + '.0';
    }
    while (str.charAt(dotPos) == '0') {
      dotPos++;
    }
    return str.substr(0, dotPos + 2);
  }
  else if (this.type == 'color') {
    return 'HSLA';
  }
  else if (this.type == 'toggle') {
    return this.contextObject[this.attributeName];
  }
  else {
    return '';
  }
};

module.exports = GUIControl;
GUIControl;

},{"float-hsl2rgb":9,"float-rgb2hsl":10}],61:[function(require,module,exports){
var Rect = require('pex-geom/Rect');
var rgb2hex = require('rgb-hex');

function floatRgb2Hex(rgb) {
    return rgb2hex(Math.floor(rgb[0] * 255), Math.floor(rgb[1] * 255), Math.floor(rgb[2] * 255));
}

/**
 * [HTMLCanvasRenderer description]
 * @param {[type]} ctx    [description]
 * @param {[type]} width  [description]
 * @param {[type]} height [description]
 */
function HTMLCanvasRenderer(ctx, width, height, pixelRatio) {
    console.log('HTMLCanvasRenderer pixelRatio', width, height, pixelRatio)
  this._ctx = ctx;
  this.pixelRatio = pixelRatio || 1;
  this.canvas = document.createElement('canvas');
  //TODO: move this up
  this.tex = ctx.createTexture2D(null, width, height);
  this.canvas.width = width;
  this.canvas.height = height;
  this.ctx = this.canvas.getContext('2d');
  this.dirty = true;
}


/**
 * [draw description]
 * @param  {[type]} items [description]
 * @param  {[type]} scale [description]
 * @return {[type]}       [description]
 */
HTMLCanvasRenderer.prototype.draw = function (items, scale) {
  var ctx = this.ctx;
  ctx.save();
  ctx.scale(this.pixelRatio, this.pixelRatio);
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  ctx.font = '10px Monaco';
  var dy = 10;
  var dx = 10;
  var w = 160;

  var cellSize = 0;
  var numRows = 0;
  var margin = 3;

  for (var i = 0; i < items.length; i++) {
    var e = items[i];

    if (e.px && e.px) {
      dx = e.px / this.pixelRatio;
      dy = e.py / this.pixelRatio;
    }

    var eh = 20 * scale;
    if (e.type == 'slider') eh = 20 * scale + 14;
    if (e.type == 'toggle') eh = 20 * scale;
    if (e.type == 'multislider') eh = 20 + e.getValue().length * 14 * scale;
    if (e.type == 'color') eh = 20 + (e.options.alpha ? 4 : 3) * 14 * scale;
    if (e.type == 'color' && e.options.paletteImage) eh += (w * e.options.paletteImage.height/e.options.paletteImage.width + 2) * scale;
    if (e.type == 'button') eh = 24 * scale;
    if (e.type == 'texture2D') eh = 24 + e.texture.getHeight() * w / e.texture.getWidth();
    if (e.type == 'textureCube') eh = 24 + w / 2;
    if (e.type == 'radiolist') eh = 18 + e.items.length * 20 * scale;
    if (e.type == 'texturelist') {
      var aspectRatio = e.items[0].texture.getWidth() / e.items[0].texture.getHeight();
      cellSize = Math.floor((w - 2*margin) / e.itemsPerRow);
      numRows = Math.ceil(e.items.length / e.itemsPerRow);
      eh = 18 + 3 + numRows * cellSize / aspectRatio;
    }
    if (e.type == 'header') eh = 26 * scale;
    if (e.type == 'text') eh = 45 * scale;

    if (e.type != 'separator') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.56)';
      ctx.fillRect(dx, dy, w, eh - 2);
    }

    if (e.options && e.options.palette && !e.options.paletteImage) {
        function makePaletteImage(img) {
            var canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = w * img.height / img.width;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            e.options.paletteImage = canvas;
            e.options.paletteImage.ctx = ctx;
            e.options.paletteImage.data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            e.dirty = true;
        }
        if (e.options.palette.width) {
            makePaletteImage(e.options.palette);
        }
        else {
            var img = new Image();
            img.src = e.options.palette;
            img.onload = function() {
                makePaletteImage(img);
            }
        }
    }

    if (e.type == 'slider') {
      ctx.fillStyle = 'rgba(150, 150, 150, 1)';
      ctx.fillRect(dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
      ctx.fillStyle = 'rgba(255, 255, 0, 1)';
      ctx.fillRect(dx + 3, dy + 18, (w - 3 - 3) * e.getNormalizedValue(), eh - 5 - 18);
      Rect.set4(e.activeArea, dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title + ' : ' + e.getStrValue(), dx + 4, dy + 13);
    }
    else if (e.type == 'multislider') {
      for (var j = 0; j < e.getValue().length; j++) {
        ctx.fillStyle = 'rgba(150, 150, 150, 1)';
        ctx.fillRect(dx + 3, dy + 18 + j * 14 * scale, w - 6, 14 * scale - 3);
        ctx.fillStyle = 'rgba(255, 255, 0, 1)';
        ctx.fillRect(dx + 3, dy + 18 + j * 14 * scale, (w - 6) * e.getNormalizedValue(j), 14 * scale - 3);
      }
      Rect.set4(e.activeArea, dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title + ' : ' + e.getStrValue(), dx + 4, dy + 13);
    }
    else if (e.type == 'color') {
      var numSliders = e.options.alpha ? 4 : 3;
      for (var j = 0; j < numSliders; j++) {
        ctx.fillStyle = 'rgba(150, 150, 150, 1)';
        ctx.fillRect(dx + 3, dy + 18 + j * 14 * scale, w - 6, 14 * scale - 3);
        ctx.fillStyle = 'rgba(255, 255, 0, 1)';
        ctx.fillRect(dx + 3, dy + 18 + j * 14 * scale, (w - 6) * e.getNormalizedValue(j), 14 * scale - 3);
      }
      ctx.fillStyle = '#' + floatRgb2Hex(e.contextObject[e.attributeName]);
      ctx.fillRect(dx + w - 12 - 3, dy + 3, 12, 12);
      if (e.options.paletteImage) {
        ctx.drawImage(e.options.paletteImage, dx + 3, dy + 18 + 14 * numSliders, w - 6, w * e.options.paletteImage.height/e.options.paletteImage.width);
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title + ' : ' + e.getStrValue(), dx + 4, dy + 13);
      Rect.set4(e.activeArea, dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
    }
    else if (e.type == 'button') {
      ctx.fillStyle = e.active ? 'rgba(255, 255, 0, 1)' : 'rgba(150, 150, 150, 1)';
      ctx.fillRect(dx + 3, dy + 3, w - 3 - 3, eh - 5 - 3);
      Rect.set4(e.activeArea, dx + 3, dy + 3, w - 3 - 3, eh - 5 - 3);
      ctx.fillStyle = e.active ? 'rgba(100, 100, 100, 1)' : 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title, dx + 5, dy + 15);
      if (e.options.color) {
        var c = e.options.color;
        ctx.fillStyle = 'rgba(' + c[0] * 255 + ', ' + c[1] * 255 + ', ' + c[2] * 255 + ', 1)';
        ctx.fillRect(dx + w - 8, dy + 3, 5, eh - 5 - 3);
      }
    }
    else if (e.type == 'toggle') {
      var on = e.contextObject[e.attributeName];
      ctx.fillStyle = on ? 'rgba(255, 255, 0, 1)' : 'rgba(150, 150, 150, 1)';
      ctx.fillRect(dx + 3, dy + 3, eh - 5 - 3, eh - 5 - 3);
      Rect.set4(e.activeArea, dx + 3, dy + 3, eh - 5 - 3, eh - 5 - 3);
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title, dx + eh, dy + 12);
    }
    else if (e.type == 'radiolist') {
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(e.title, dx + 4, dy + 13);
      var itemHeight = 20 * scale;
      for (var j = 0; j < e.items.length; j++) {
        var item = e.items[j];
        var on = e.contextObject[e.attributeName] == item.value;
        ctx.fillStyle = on ? 'rgba(255, 255, 0, 1)' : 'rgba(150, 150, 150, 1)';
        ctx.fillRect(dx + 3, 18 + j * itemHeight + dy + 3, itemHeight - 5 - 3, itemHeight - 5 - 3);
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillText(item.name, dx + 5 + itemHeight - 5, 18 + j * itemHeight + dy + 13);
      }
      Rect.set4(e.activeArea, dx + 3, 18 + dy + 3, itemHeight - 5, e.items.length * itemHeight - 5);
    }
    else if (e.type == 'texturelist') {
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(e.title, dx + 4, dy + 13);
      for (var j = 0; j < e.items.length; j++) {
        var col = j % e.itemsPerRow;
        var row = Math.floor(j / e.itemsPerRow);
        var itemColor = this.controlBgPaint;
        var shrink = 0;
        if (e.items[j].value == e.contextObject[e.attributeName]) {
          ctx.fillStyle = 'none';
          ctx.strokeStyle = 'rgba(255, 255, 0, 1)';
          ctx.lineWidth = '2';
          ctx.strokeRect(dx + 3 + col * cellSize + 1, dy + 18 + row * cellSize + 1, cellSize - 1 - 2, cellSize - 1 - 2)
          ctx.lineWidth = '1';
          shrink = 2;
        }
        if (!e.items[j].activeArea) {
          e.items[j].activeArea = [[0,0], [0,0]];
        }
        Rect.set4(e.items[j].activeArea, dx + 3 + col * cellSize + shrink, dy + 18 + row * cellSize + shrink, cellSize - 1 - 2 * shrink, cellSize - 1 - 2 * shrink);
      }
      Rect.set4(e.activeArea, dx + 3, 18 + dy + 3, w - 3 - 3, cellSize * numRows - 5);
    }
    else if (e.type == 'texture2D') {
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title, dx + 5, dy + 15);
      Rect.set4(e.activeArea, dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
    }
    else if (e.type == 'textureCube') {
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title, dx + 5, dy + 15);
      Rect.set4(e.activeArea, dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
    }
    else if (e.type == 'header') {
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillRect(dx + 3, dy + 3, w - 3 - 3, eh - 5 - 3);
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillText(items[i].title, dx + 5, dy + 16);
    }
    else if (e.type == 'text') {
      Rect.set4(e.activeArea, dx + 3, dy + 20, w - 6, eh - 20 - 5);
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title, dx + 3, dy + 13);
      ctx.fillStyle = 'rgba(50, 50, 50, 1)';
      ctx.fillRect(dx + 3, dy + 20, e.activeArea[1][0] - e.activeArea[0][0], e.activeArea[1][1] - e.activeArea[0][1]);
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(e.contextObject[e.attributeName], dx + 3 + 3, dy + 15 + 20);
      if (e.focus) {
        ctx.strokeStyle = 'rgba(255, 255, 0, 1)';
        ctx.strokeRect(e.activeArea[0][0]-0.5, e.activeArea[0][1]-0.5, e.activeArea[1][0] - e.activeArea[0][0], e.activeArea[1][1] - e.activeArea[0][1]);
      }
    }
    else if (e.type == 'separator') {
      //do nothing
    }
    else {
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillText(items[i].title, dx + 5, dy + 13);
    }
    dy += eh;
  }
  ctx.restore();
  this.updateTexture();
};

/**
 * [getTexture description]
 * @return {[type]} [description]
 */
HTMLCanvasRenderer.prototype.getTexture = function () {
  return this.tex;
};

/**
 * [function description]
 * @param  {[type]} image [description]
 * @param  {[type]} x     [description]
 * @param  {[type]} y     [description]
 * @return {[type]}       [description]
 */
HTMLCanvasRenderer.prototype.getImageColor = function(image, x, y) {
  var r = image.data[(x + y * image.width)*4 + 0]/255;
  var g = image.data[(x + y * image.width)*4 + 1]/255;
  var b = image.data[(x + y * image.width)*4 + 2]/255;
  return [r, g, b];
}

/**
 * [updateTexture description]
 * @return {[type]} [description]
 */
HTMLCanvasRenderer.prototype.updateTexture = function () {
  var gl = this.gl;

  this.tex.update(this.canvas, this.canvas.width, this.canvas.height, { flip: false})
};

module.exports = HTMLCanvasRenderer;

},{"pex-geom/Rect":58,"rgb-hex":100}],62:[function(require,module,exports){
var plask     = require('plask');
var SkCanvas  = plask.SkCanvas;
var SkPaint   = plask.SkPaint;
var Rect = require('pex-geom/Rect');

/**
 * [SkiaRenderer description]
 * @param {[type]} ctx    [description]
 * @param {[type]} width  [description]
 * @param {[type]} height [description]
 */
function SkiaRenderer(ctx, width, height, pixelRatio) {
    this._ctx = ctx;
    this.tex = ctx.createTexture2D(null, width, height);
    this.pixelRatio = pixelRatio;
    this.canvas = new SkCanvas.create(width, height);
    this.canvasPaint = new SkPaint();
    this.fontPaint = new SkPaint();
    this.fontPaint.setStyle(SkPaint.kFillStyle);
    this.fontPaint.setColor(255, 255, 255, 255);
    this.fontPaint.setTextSize(10);
    this.fontPaint.setFontFamily('Monaco');
    this.fontPaint.setStrokeWidth(0);
    this.headerFontPaint = new SkPaint();
    this.headerFontPaint.setStyle(SkPaint.kFillStyle);
    this.headerFontPaint.setColor(0, 0, 0, 255);
    this.headerFontPaint.setTextSize(10);
    this.headerFontPaint.setFontFamily('Monaco');
    this.headerFontPaint.setStrokeWidth(0);
    this.fontHighlightPaint = new SkPaint();
    this.fontHighlightPaint.setStyle(SkPaint.kFillStyle);
    this.fontHighlightPaint.setColor(100, 100, 100, 255);
    this.fontHighlightPaint.setTextSize(10);
    this.fontHighlightPaint.setFontFamily('Monaco');
    this.fontHighlightPaint.setStrokeWidth(0);
    this.panelBgPaint = new SkPaint();
    this.panelBgPaint.setStyle(SkPaint.kFillStyle);
    this.panelBgPaint.setColor(0, 0, 0, 150);
    this.headerBgPaint = new SkPaint();
    this.headerBgPaint.setStyle(SkPaint.kFillStyle);
    this.headerBgPaint.setColor(255, 255, 255, 255);
    this.textBgPaint = new SkPaint();
    this.textBgPaint.setStyle(SkPaint.kFillStyle);
    this.textBgPaint.setColor(50, 50, 50, 255);
    this.textBorderPaint = new SkPaint();
    this.textBorderPaint.setStyle(SkPaint.kStrokeStyle);
    this.textBorderPaint.setColor(255, 255, 0, 255);
    this.controlBgPaint = new SkPaint();
    this.controlBgPaint.setStyle(SkPaint.kFillStyle);
    this.controlBgPaint.setColor(150, 150, 150, 255);
    this.controlHighlightPaint = new SkPaint();
    this.controlHighlightPaint.setStyle(SkPaint.kFillStyle);
    this.controlHighlightPaint.setColor(255, 255, 0, 255);
    this.controlHighlightPaint.setAntiAlias(true);
    this.controlStrokeHighlightPaint = new SkPaint();
    this.controlStrokeHighlightPaint.setStyle(SkPaint.kStrokeStyle);
    this.controlStrokeHighlightPaint.setColor(255, 255, 0, 255);
    this.controlStrokeHighlightPaint.setAntiAlias(false);
    this.controlStrokeHighlightPaint.setStrokeWidth(2);
    this.controlFeaturePaint = new SkPaint();
    this.controlFeaturePaint.setStyle(SkPaint.kFillStyle);
    this.controlFeaturePaint.setColor(255, 255, 255, 255);
    this.controlFeaturePaint.setAntiAlias(true);
    this.imagePaint = new SkPaint();
    this.imagePaint.setStyle(SkPaint.kFillStyle);
    this.imagePaint.setColor(255, 255, 255, 255);
    this.colorPaint = new SkPaint();
    this.colorPaint.setStyle(SkPaint.kFillStyle);
    this.colorPaint.setColor(255, 255, 255, 255);
}

/**
 * [function description]
 * @param  {[type]} items [description]
 * @param  {[type]} scale [description]
 * @return {[type]}       [description]
 */
SkiaRenderer.prototype.draw = function(items, scale) {
  var canvas = this.canvas;
  canvas.save();
  canvas.scale(this.pixelRatio, this.pixelRatio);
  canvas.drawColor(0, 0, 0, 0, plask.SkPaint.kClearMode);
  //transparent
  var dy = 10;
  var dx = 10;
  var w = 160;
  var cellSize = 0;
  var numRows = 0;
  var margin = 3;

  for (var i = 0; i < items.length; i++) {
    var e = items[i];
    if (e.px && e.px) {
      dx = e.px / this.pixelRatio;
      dy = e.py / this.pixelRatio;
    }
    var eh = 20;

    if (e.options && e.options.palette && !e.options.paletteImage) {
        if (e.options.palette.width) {
            e.options.paletteImage = e.options.palette;
        }
        else {
            e.options.paletteImage = plask.SkCanvas.createFromImage(e.options.palette);
        }
    }

    if (e.type == 'slider') eh = 20 * scale + 14;
    if (e.type == 'toggle') eh = 20 * scale;
    if (e.type == 'multislider') eh = 20 + e.getValue().length * 14 * scale;
    if (e.type == 'color') eh = 20 + (e.options.alpha ? 4 : 3) * 14 * scale;
    if (e.type == 'color' && e.options.paletteImage) eh += (w * e.options.paletteImage.height/e.options.paletteImage.width + 2) * scale;
    if (e.type == 'button') eh = 24 * scale;
    if (e.type == 'texture2D') eh = 24 + e.texture.getHeight() * w / e.texture.getWidth();
    if (e.type == 'textureCube') eh = 24 + w / 2;
    if (e.type == 'radiolist') eh = 18 + e.items.length * 20 * scale;
    if (e.type == 'texturelist') {
      var aspectRatio = e.items[0].texture.getWidth() / e.items[0].texture.getHeight();
      cellSize = Math.floor((w - 2*margin) / e.itemsPerRow);
      numRows = Math.ceil(e.items.length / e.itemsPerRow);
      eh = 18 + 3 + numRows * cellSize / aspectRatio;
    }
    if (e.type == 'header') eh = 26 * scale;
    if (e.type == 'text') eh = 45 * scale;

    if (e.type != 'separator') {
      canvas.drawRect(this.panelBgPaint, dx, dy, dx + w, dy + eh - 2);
    }

    if (e.type == 'slider') {
      var value = e.getValue();
      canvas.drawRect(this.controlBgPaint, dx + 3, dy + 18, dx + w - 3, dy + eh - 5);
      canvas.drawRect(this.controlHighlightPaint, dx + 3, dy + 18, dx + 3 + (w - 6) * e.getNormalizedValue(), dy + eh - 5);
      Rect.set4(e.activeArea, dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
      canvas.drawText(this.fontPaint, items[i].title + ' : ' + e.getStrValue(), dx + 4, dy + 13);
    }
    else if (e.type == 'multislider') {
      for (var j = 0; j < e.getValue().length; j++) {
        canvas.drawRect(this.controlBgPaint, dx + 3, dy + 18 + j * 14 * scale, dx + w - 3, dy + 18 + (j + 1) * 14 * scale - 3);
        canvas.drawRect(this.controlHighlightPaint, dx + 3, dy + 18 + j * 14 * scale, dx + 3 + (w - 6) * e.getNormalizedValue(j), dy + 18 + (j + 1) * 14 * scale - 3);
      }
      canvas.drawText(this.fontPaint, items[i].title + ' : ' + e.getStrValue(), dx + 4, dy + 13);
      Rect.set4(e.activeArea, dx + 4, dy + 18, w - 3 - 3, eh - 5 - 18);
    }
    else if (e.type == 'color') {
      var numSliders = e.options.alpha ? 4 : 3;
      for (var j = 0; j < numSliders; j++) {
        canvas.drawRect(this.controlBgPaint, dx + 3, dy + 18 + j * 14 * scale, dx + w - 3, dy + 18 + (j + 1) * 14 * scale - 3);
        canvas.drawRect(this.controlHighlightPaint, dx + 3, dy + 18 + j * 14 * scale, dx + 3 + (w - 6) * e.getNormalizedValue(j), dy + 18 + (j + 1) * 14 * scale - 3);
      }
      var c = e.getValue();
      this.colorPaint.setColor(255*c[0], 255*c[1], 255*c[2], 255);
      canvas.drawRect(this.colorPaint, dx + w - 12 - 3, dy + 3, dx + w - 3, dy + 3 + 12);
      if (e.options.paletteImage) {
        canvas.drawCanvas(this.imagePaint, e.options.paletteImage, dx + 3, dy + 18 + 14 * numSliders, dx + w - 3, dy + 18 + 14 * numSliders + w * e.options.paletteImage.height/e.options.paletteImage.width);
      }
      canvas.drawText(this.fontPaint, items[i].title + ' : ' + e.getStrValue(), dx + 3, dy + 13);
      Rect.set4(e.activeArea, dx + 4, dy + 18, w - 3 - 3, eh - 5 - 18);
    }
    else if (e.type == 'button') {
      var btnColor = e.active ? this.controlHighlightPaint : this.controlBgPaint;
      var btnFont = e.active ? this.fontHighlightPaint : this.fontPaint;
      canvas.drawRect(btnColor, dx + 3, dy + 3, dx + w - 3, dy + eh - 5);
      Rect.set4(e.activeArea, dx + 3, dy + 3, w - 3 - 3, eh - 5);
      if (e.options.color) {
        var c = e.options.color;
        this.controlFeaturePaint.setColor(255 * c[0], 255 * c[1], 255 * c[2], 255);
        canvas.drawRect(this.controlFeaturePaint, dx + w - 8, dy + 3, dx + w - 3, dy + eh - 5);
      }
      canvas.drawText(btnFont, items[i].title, dx + 5, dy + 15);
    }
    else if (e.type == 'toggle') {
      var on = e.contextObject[e.attributeName];
      var toggleColor = on ? this.controlHighlightPaint : this.controlBgPaint;
      canvas.drawRect(toggleColor, dx + 3, dy + 3, dx + eh - 5, dy + eh - 5);
      Rect.set4(e.activeArea, dx + 3, dy + 3, eh - 5, eh - 5);
      canvas.drawText(this.fontPaint, items[i].title, dx + eh, dy + 13);
    }
    else if (e.type == 'radiolist') {
      canvas.drawText(this.fontPaint, e.title, dx + 4, dy + 14);
      var itemColor = this.controlBgPaint;
      var itemHeight = 20 * scale;
      for (var j = 0; j < e.items.length; j++) {
        var item = e.items[j];
        var on = e.contextObject[e.attributeName] == item.value;
        var itemColor = on ? this.controlHighlightPaint : this.controlBgPaint;
        canvas.drawRect(itemColor, dx + 3, 18 + j * itemHeight + dy + 3, dx + itemHeight - 5, itemHeight + j * itemHeight + dy + 18 - 5);
        canvas.drawText(this.fontPaint, item.name, dx + itemHeight, 18 + j * itemHeight + dy + 13);
      }
      Rect.set4(e.activeArea, dx + 3, 18 + dy + 3, itemHeight - 5, e.items.length * itemHeight - 5);
    }
    else if (e.type == 'texturelist') {
      canvas.drawText(this.fontPaint, e.title, dx + 4, dy + 14);
      for (var j = 0; j < e.items.length; j++) {
        var col = j % e.itemsPerRow;
        var row = Math.floor(j / e.itemsPerRow);
        var itemColor = this.controlBgPaint;
        var shrink = 0;
        canvas.drawRect(itemColor, dx + 3 + col * cellSize, dy + 18 + row * cellSize, dx + 3 + (col + 1) * cellSize - 1, dy + 18 + (row + 1) * cellSize - 1);
        if (e.items[j].value == e.contextObject[e.attributeName]) {
          var strokeColor = this.controlStrokeHighlightPaint;
          canvas.drawRect(strokeColor, dx + 3 + col * cellSize + 1, dy + 18 + row * cellSize + 1, dx + 3 + (col + 1) * cellSize - 1 - 1, dy + 18 + (row + 1) * cellSize - 1 - 1);
          shrink = 2;
        }
        if (!e.items[j].activeArea) {
          e.items[j].activeArea = [[0,0],[0,0]];
        }
        Rect.set4(e.items[j].activeArea, dx + 3 + col * cellSize + shrink, dy + 18 + row * cellSize + shrink, cellSize - 1 - 2 * shrink, cellSize - 1 - 2 * shrink);
      }
      Rect.set4(e.activeArea, dx + 3, 18 + dy + 3, w - 3 - 3, cellSize * numRows - 5);
    }
    else if (e.type == 'texture2D') {
      canvas.drawText(this.fontPaint, e.title, dx + 3, dy + 13);
      Rect.set4(e.activeArea, dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
    }
    else if (e.type == 'textureCube') {
      canvas.drawText(this.fontPaint, e.title, dx + 3, dy + 13);
      Rect.set4(e.activeArea, dx + 3, dy + 18, w - 3 - 3, eh - 5 - 18);
    }
    else if (e.type == 'header') {
      canvas.drawRect(this.headerBgPaint, dx + 3, dy + 3, dx + w - 3, dy + eh - 5);
      canvas.drawText(this.headerFontPaint, items[i].title, dx + 6, dy + 16);
    }
    else if (e.type == 'text') {
      canvas.drawText(this.fontPaint, items[i].title, dx + 3, dy + 13);
      canvas.drawRect(this.textBgPaint, dx + 3, dy + 20, dx + w - 3, dy + eh - 5);
      canvas.drawText(this.fontPaint, e.contextObject[e.attributeName], dx + 3 + 3, dy + 15 + 20);
      Rect.set4(e.activeArea, dx + 3, dy + 20, w - 6, eh - 20 - 5);
      if (e.focus) {
        canvas.drawRect(this.textBorderPaint, e.activeArea[0][0], e.activeArea[0][1], e.activeArea[1][0], e.activeArea[1][1]);
      }
    }
    else if (e.type == 'separator') {
      //do nothing
    }
    else {
      canvas.drawText(this.fontPaint, items[i].title, dx + 3, dy + 13);
    }
    dy += eh;
  }
  canvas.restore();
  this.updateTexture();
};

/**
 * [function description]
 * @param  {[type]} image [description]
 * @param  {[type]} x     [description]
 * @param  {[type]} y     [description]
 * @return {[type]}       [description]
 */
SkiaRenderer.prototype.getImageColor = function(image, x, y) {
  var pixels = image.pixels || image;
  //Skia stores canvas data as BGR
  var r = pixels[(x + y * image.width)*4 + 2]/255;
  var g = pixels[(x + y * image.width)*4 + 1]/255;
  var b = pixels[(x + y * image.width)*4 + 0]/255;
  return [r, g, b]
}

/**
 * [function description]
 * @return {[type]} [description]
 */
SkiaRenderer.prototype.getTexture = function() {
  return this.tex;
};

/**
 * [function description]
 * @return {[type]} [description]
 */
SkiaRenderer.prototype.getCanvas = function() {
  return this.canvas;
};

/**
 * [function description]
 * @return {[type]} [description]
 */
SkiaRenderer.prototype.getCanvasPaint = function() {
  return this.canvasPaint;
};

/**
 * [function description]
 * @return {[type]} [description]
 */
SkiaRenderer.prototype.updateTexture = function() {
  if (!this.tex) return;
  this.tex.update(this.canvas, this.canvas.width, this.canvas.height);
};

module.exports = SkiaRenderer;

},{"pex-geom/Rect":58,"plask":8}],63:[function(require,module,exports){
module.exports = require('./GUI');

},{"./GUI":59}],64:[function(require,module,exports){
module.exports = {
  load: require('./load'),
  loadBinary: require('./loadBinary'),
  loadImage: require('./loadImage'),
  loadText: require('./loadText'),
  loadJSON: require('./loadJSON')
}

},{"./load":65,"./loadBinary":66,"./loadImage":67,"./loadJSON":68,"./loadText":69}],65:[function(require,module,exports){
var loadImage = require('./loadImage')
var loadBinary = require('./loadBinary')
var loadText = require('./loadText')
var loadJSON = require('./loadJSON')

/**
 * Load provided resources
 * @param   {Object} resources - map of resources, see example
 * @param   {Function} callback function(err, resources), see example
 * @returns {Object}   - with same properties are resource list but resolved to the actual data
 *
 * @example
 * var resources = {
 *   img     : { image: __dirname + '/tex.jpg'},
 *   hdrImg  : { binary: __dirname + '/tex.hdr'}
 *   data    : { json: __dirname + '/data.json'},
 *   hello   : { text: __dirname + '/hello.txt'}
 * }
 * load(resources, function(err, res) {
 *   res.img    //{Image} in a Browser or {SkCanvas} in Plask
 *   res.hdrImg //{ArrayBuffer}
 *   res.data   //{JSON}
 *   res.hello  //{String}
 * })
 */
function load (resources, callback) {
  var results = {}
  var errors = {}
  var hadErrors = false

  // TODO: use `async` module instead?
  var loadedResources = 0
  var resourceNames = Object.keys(resources)
  var numResources = resourceNames.length

  function onFinish () {
    try {
      if (hadErrors) {
        callback(errors, null)
      } else {
        callback(null, results)
      }
    } catch (e) {
      console.log(e)
      console.log(e.stack)
    }
  }

  resourceNames.forEach(function (name) {
    function onLoaded (err, data) {
      if (err) {
        hadErrors = true
        errors[name] = err
      } else {
        results[name] = data
      }

      if (++loadedResources === numResources) {
        onFinish()
      }
    }

    var res = resources[name]
    if (res.image) {
      loadImage(res.image, onLoaded)
    } else if (res.text) {
      loadText(res.text, onLoaded)
    } else if (res.json) {
      loadJSON(res.json, onLoaded)
    } else if (res.binary) {
      loadBinary(res.binary, onLoaded)
    } else {
      onLoaded('pex-io/load unknown resource type ' + Object.keys(res), null)
    }
  })

  if (resourceNames.length === 0) {
    onFinish()
  }
}

module.exports = load

},{"./loadBinary":66,"./loadImage":67,"./loadJSON":68,"./loadText":69}],66:[function(require,module,exports){
var isPlask = require('is-plask')
var fs = require('fs')

function toArrayBuffer (buffer) {
  var ab = new ArrayBuffer(buffer.length)
  var view = new Uint8Array(ab)
  for (var i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i]
  }
  return ab
}

function loadBinaryBrowser (url, callback) {
  var request = new window.XMLHttpRequest()
  request.open('GET', url, true)
  request.responseType = 'arraybuffer'
  request.onreadystatechange = function (e) {
    if (request.readyState === 4) {
      if (request.status === 200) {
        callback(null, request.response)
      } else {
        callback('loadBinary error : ' + request.response, null)
      }
    }
  }
  request.send(null)
}

function loadBinaryPlask (file, callback) {
  try {
    if (!fs.existsSync(file)) {
      if (callback) {
        return callback('loadBinary error: File doesn\t exist', null)
      }
    }
  } catch(e) {
    return callback('loadBinary error : ' + e.toString(), null)
  }
  var rawData = fs.readFileSync(file)
  var data = toArrayBuffer(rawData)
  callback(null, data)
}

/**
 * Loads binary data
 * @param {String} file - url addess (Browser) or file path (Plask)
 * @param {Function} callback - function(err, data) { }
 * @param {Error} callback.err - error if any or null
 * @param {ArrayBuffer} callback.data - loaded binary data
 */
function loadBinary (file, callback) {
  if (isPlask) {
    loadBinaryPlask(file, callback)
  } else {
    loadBinaryBrowser(file, callback)
  }
}

module.exports = loadBinary

},{"fs":8,"is-plask":15}],67:[function(require,module,exports){
var isPlask = require('is-plask')
var plask = require('plask-wrap')

function loadImageBrowser (url, callback, crossOrigin) {
  var img = new window.Image()
  if (crossOrigin) {
    img.crossOrigin = 'anonymous'
  }
  img.onerror = function () {
    callback(new Error('Failed to load ' + url), null)
  }
  img.onload = function () {
    callback(null, img)
  }
  img.src = url
}

function bgra2rgba (width, height, pixels) {
  var rgba = new Uint8Array(width * height * 4)
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var i = (x + y * width) * 4
      rgba[i + 0] = pixels[i + 2]
      rgba[i + 1] = pixels[i + 1]
      rgba[i + 2] = pixels[i + 0]
      rgba[i + 3] = pixels[i + 3]
    }
  }
  return rgba
}

function loadImagePlask (path, callback) {
  var img
  try {
    img = plask.SkCanvas.createFromImage(path)
    img.data = bgra2rgba(img.width, img.height, img.pixels)
  } catch (e) {
    callback(new Error(e + ' ' + '"' + path + '"'), null)
  }
  callback(null, img)
}

/**
 * Loads a HTML Image from an url in the borwser, SkCanvas from a file in Plask
 * @param {String} file - url addess (Browser) or file path (Plask)
 * @param {Function} callback - function(err, image) { }
 * @param {Error} callback.err - error if any or null
 * @param {Image|SkCanvas} callback.image - loaded image
 */
function loadImage (file, callback, crossOrigin) {
  if (isPlask) {
    loadImagePlask(file, callback)
  } else {
    loadImageBrowser(file, callback, crossOrigin)
  }
}

module.exports = loadImage

},{"is-plask":15,"plask-wrap":94}],68:[function(require,module,exports){
var loadText = require('./loadText')

/**
 * Loads JSON data
 * @param {String} file - url addess (Browser) or file path (Plask)
 * @param {Function} callback - function(err, json) { }
 * @param {Error} callback.err - error if any or null
 * @param {String} callback.json - loaded JSON data
 */
function loadJSON (file, callback) {
  loadText(file, function (err, data) {
    if (err) {
      callback(err, null)
    } else {
      var json = null
      try {
        json = JSON.parse(data)
      } catch (e) {
        return callback(e.toString(), null)
      }
      callback(null, json)
    }
  })
}

module.exports = loadJSON

},{"./loadText":69}],69:[function(require,module,exports){
var isPlask = require('is-plask')
var fs = require('fs')

function loadTextBrowser (url, callback) {
  var request = new window.XMLHttpRequest()
  request.open('GET', url, true)
  request.onreadystatechange = function (e) {
    if (request.readyState === 4) {
      if (request.status === 200) {
        if (callback) {
          callback(null, request.responseText)
        }
      } else {
        callback('loadText error: ' + request.statusText, null)
      }
    }
  }
  request.send(null)
}

function loadTextPlask (path, callback) {
  if (!fs.existsSync(path)) {
    if (callback) {
      return callback('loadText error: File doesn\'t exist ' + '"' + path + '"', null)
    }
  }
  var data = fs.readFileSync(path, 'utf8')
  if (callback) {
    callback(null, data)
  }
}

/**
 * @desc Loads text string
 * @param {String} file - url addess (Browser) or file path (Plask)
 * @param {Function} callback - function(err, text) { }
 * @param {Error} callback.err - error if any or null
 * @param {String} callback.text - loaded text
 */
function loadText (file, callback) {
  if (isPlask) {
    loadTextPlask(file, callback)
  } else {
    loadTextBrowser(file, callback)
  }
}

module.exports = loadText

},{"fs":8,"is-plask":15}],70:[function(require,module,exports){
/*
 *  Row major memory layout
 *
 *   0   1   2
 *   3   4   5
 *   6   7   8
 *
 *  equivalent to the column major OpenGL spec
 *
 *   0   3   6
 *   1   4   7
 *   2   5   8
 *
 *  m00 m10 m20
 *  m01 m11 m21
 *  m02 m12 m22
 */

function create () {
  return [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ]
}

function equals (a, b) {
  return a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3] &&
    a[4] === b[4] &&
    a[5] === b[5] &&
    a[6] === b[6] &&
    a[7] === b[7] &&
    a[8] === b[8] &&
    a[9] === b[9]
}

function set9 (a, b00, b01, b02, b10, b11, b12, b20, b21, b22) {
  a[0] = b00
  a[1] = b01
  a[2] = b02
  a[3] = b10
  a[4] = b11
  a[5] = b12
  a[6] = b20
  a[7] = b21
  a[8] = b22
  return a
}

function set (a, b) {
  a[0] = b[0]
  a[1] = b[1]
  a[2] = b[2]
  a[3] = b[3]
  a[4] = b[4]
  a[5] = b[5]
  a[6] = b[6]
  a[7] = b[7]
  a[8] = b[8]
  return a
}

function identity (a) {
  a[0] = a[4] = a[8] = 1
  a[1] = a[2] = a[3] = a[5] = a[6] = a[7] = 0
  return a
}

function fromMat4 (a, b) {
  a[ 0] = b[ 0]
  a[ 1] = b[ 1]
  a[ 2] = b[ 2]
  a[ 3] = b[ 4]
  a[ 4] = b[ 5]
  a[ 5] = b[ 6]
  a[ 6] = b[ 8]
  a[ 7] = b[ 9]
  a[ 8] = b[10]
  return a
}

function fromQuat (a, b) {
  var x = b[0]
  var y = b[1]
  var z = b[2]
  var w = b[3]

  var x2 = x + x
  var y2 = y + y
  var z2 = z + z

  var xx = x * x2
  var xy = x * y2
  var xz = x * z2

  var yy = y * y2
  var yz = y * z2
  var zz = z * z2

  var wx = w * x2
  var wy = w * y2
  var wz = w * z2

  a[0] = 1 - (yy + zz)
  a[3] = xy - wz
  a[6] = xz + wy

  a[1] = xy + wz
  a[4] = 1 - (xx + zz)
  a[7] = yz - wx

  a[2] = xz - wy
  a[5] = yz + wx
  a[8] = 1 - (xx + yy)

  return a
}

/**
 * [Mat3 description]
 * @type {Object}
 */
var Mat3 = {
  /**
* [create description]
* @type {[type]}
*/
  create: create,
  set: set,
  set9: set9,
  identity: identity,
    /**
  * [equals description]
  * @type {[type]}
  */
  equals: equals,
    /**
  * [fromMat4 description]
  * @type {[type]}
  */
  fromMat4: fromMat4,
    /**
  * [fromQuat description]
  * @type {[type]}
  */
  fromQuat: fromQuat
}

module.exports = Mat3

},{}],71:[function(require,module,exports){
/**
 * Returns a 4x4 identity matrix.
 * Row major memory layout
 *
 *   0   1   2   3
 *   4   5   6   7
 *   8   9  10  11
 *  12  13  14  15
 *
 * equivalent to the column major OpenGL spec
 *
 *   0   4   8  12
 *   1   5   9  13
 *   2   6  10  14
 *   3   7  11  15
 *
 *  m00 m10 m20 m30
 *  m01 m11 m21 m31
 *  m02 m12 m22 m32
 *  m03 m13 m23 m33
 *
 * @returns {Number[]}
 */
function create () {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]
}

/**
 * Sets a 4x4 matrix from another 4x4 matrix components.
 * @param {Number[]|Float32Array} a - Dst Matrix (Array of length 16)
 * @param {{Number[]|Float32Array} b - Src Matrix (Array of length 16)
 * @returns {{Number[]|Float32Array}
 */
function set (a, b) {
  a[0] = b[0]
  a[1] = b[1]
  a[2] = b[2]
  a[3] = b[3]
  a[4] = b[4]
  a[5] = b[5]
  a[6] = b[6]
  a[7] = b[7]
  a[8] = b[8]
  a[9] = b[9]
  a[10] = b[10]
  a[11] = b[11]
  a[12] = b[12]
  a[13] = b[13]
  a[14] = b[14]
  a[15] = b[15]
  return a
}

/**
 * Sets a 4x4 matrix from single components.
 * @param {Number[]|Float32Array} a - Dst Matrix (Array of length 16)
 * @param {Number} a00
 * @param {Number} a01
 * @param {Number} a02
 * @param {Number} a03
 * @param {Number} a10
 * @param {Number} a11
 * @param {Number} a12
 * @param {Number} a13
 * @param {Number} a20
 * @param {Number} a21
 * @param {Number} a22
 * @param {Number} a23
 * @param {Number} a30
 * @param {Number} a31
 * @param {Number} a32
 * @param {Number} a33
 * @returns {Array|Float32Array
 */
function set16 (a, a00, a01, a02, a03,
               a10, a11, a12, a13,
               a20, a21, a22, a23,
               a30, a31, a32, a33) {
  a[0] = a00
  a[1] = a01
  a[2] = a02
  a[3] = a03
  a[4] = a10
  a[5] = a11
  a[6] = a12
  a[7] = a13
  a[8] = a20
  a[9] = a21
  a[10] = a22
  a[11] = a23
  a[12] = a30
  a[13] = a31
  a[14] = a32
  a[15] = a33
  return a
}

/**
 * Returns true if two 4x4 matrices are equal.
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param {Number[]|Float32Array} b - 4x4 matrix (Array of length 16)
 * @returns {boolean}
 */
function equals (a, b) {
  return a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3] &&
    a[4] === b[4] &&
    a[5] === b[5] &&
    a[6] === b[6] &&
    a[7] === b[7] &&
    a[8] === b[8] &&
    a[9] === b[9] &&
    a[10] === b[10] &&
    a[11] === b[11] &&
    a[12] === b[12] &&
    a[13] === b[13] &&
    a[14] === b[14] &&
    a[15] === b[15]
}

/**
 * Returns a copy of the src 4x4 matrix.
 * @param {Number[]|Float32Array} a - 4x4 src matrix (Array of length 16)
 * @returns {Number[]|Float32Array}
 */
function copy (a) {
  return a.slice(0)
}

/**
 * Multiplies a matrix with single matrix components.
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param {Number} b00
 * @param {Number} b01
 * @param {Number} b02
 * @param {Number} b03
 * @param {Number} b10
 * @param {Number} b11
 * @param {Number} b12
 * @param {Number} b13
 * @param {Number} b20
 * @param {Number} b21
 * @param {Number} b22
 * @param {Number} b23
 * @param {Number} b30
 * @param {Number} b31
 * @param {Number} b32
 * @param {Number} b33
 * @returns {Number[]|Float32Array}
 */
function mult16 (a, b00, b01, b02, b03,
                b10, b11, b12, b13,
                b20, b21, b22, b23,
                b30, b31, b32, b33) {
  var a00 = a[ 0], a01 = a[ 1], a02 = a[ 2], a03 = a[ 3]
  var a10 = a[ 4], a11 = a[ 5], a12 = a[ 6], a13 = a[ 7]
  var a20 = a[ 8], a21 = a[ 9], a22 = a[10], a23 = a[11]
  var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15]

  a[ 0] = (b00 * a00) + (b01 * a10) + (b02 * a20) + (b03 * a30)
  a[ 1] = (b00 * a01) + (b01 * a11) + (b02 * a21) + (b03 * a31)
  a[ 2] = (b00 * a02) + (b01 * a12) + (b02 * a22) + (b03 * a32)
  a[ 3] = (b00 * a03) + (b01 * a13) + (b02 * a23) + (b03 * a33)

  a[ 4] = (b10 * a00) + (b11 * a10) + (b12 * a20) + (b13 * a30)
  a[ 5] = (b10 * a01) + (b11 * a11) + (b12 * a21) + (b13 * a31)
  a[ 6] = (b10 * a02) + (b11 * a12) + (b12 * a22) + (b13 * a32)
  a[ 7] = (b10 * a03) + (b11 * a13) + (b12 * a23) + (b13 * a33)

  a[ 8] = (b20 * a00) + (b21 * a10) + (b22 * a20) + (b23 * a30)
  a[ 9] = (b20 * a01) + (b21 * a11) + (b22 * a21) + (b23 * a31)
  a[10] = (b20 * a02) + (b21 * a12) + (b22 * a22) + (b23 * a32)
  a[11] = (b20 * a03) + (b21 * a13) + (b22 * a23) + (b23 * a33)

  a[12] = (b30 * a00) + (b31 * a10) + (b32 * a20) + (b33 * a30)
  a[13] = (b30 * a01) + (b31 * a11) + (b32 * a21) + (b33 * a31)
  a[14] = (b30 * a02) + (b31 * a12) + (b32 * a22) + (b33 * a32)
  a[15] = (b30 * a03) + (b31 * a13) + (b32 * a23) + (b33 * a33)

  return a
}

/**
 * Multiplies a 4x4 matrix with another 4x4 matrix.
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param {Number[]|Float32Array} b - 4x4 matrix (Array of length 16)
 * @returns {Number[]|Float32Array}
 */
function mult (a, b) {
  var a00 = a[ 0], a01 = a[ 1], a02 = a[ 2], a03 = a[ 3]
  var a10 = a[ 4], a11 = a[ 5], a12 = a[ 6], a13 = a[ 7]
  var a20 = a[ 8], a21 = a[ 9], a22 = a[10], a23 = a[11]
  var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15]

  var b00 = b[ 0], b01 = b[ 1], b02 = b[ 2], b03 = b[ 3]
  var b10 = b[ 4], b11 = b[ 5], b12 = b[ 6], b13 = b[ 7]
  var b20 = b[ 8], b21 = b[ 9], b22 = b[10], b23 = b[11]
  var b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15]

  a[ 0] = (b00 * a00) + (b01 * a10) + (b02 * a20) + (b03 * a30)
  a[ 1] = (b00 * a01) + (b01 * a11) + (b02 * a21) + (b03 * a31)
  a[ 2] = (b00 * a02) + (b01 * a12) + (b02 * a22) + (b03 * a32)
  a[ 3] = (b00 * a03) + (b01 * a13) + (b02 * a23) + (b03 * a33)

  a[ 4] = (b10 * a00) + (b11 * a10) + (b12 * a20) + (b13 * a30)
  a[ 5] = (b10 * a01) + (b11 * a11) + (b12 * a21) + (b13 * a31)
  a[ 6] = (b10 * a02) + (b11 * a12) + (b12 * a22) + (b13 * a32)
  a[ 7] = (b10 * a03) + (b11 * a13) + (b12 * a23) + (b13 * a33)

  a[ 8] = (b20 * a00) + (b21 * a10) + (b22 * a20) + (b23 * a30)
  a[ 9] = (b20 * a01) + (b21 * a11) + (b22 * a21) + (b23 * a31)
  a[10] = (b20 * a02) + (b21 * a12) + (b22 * a22) + (b23 * a32)
  a[11] = (b20 * a03) + (b21 * a13) + (b22 * a23) + (b23 * a33)

  a[12] = (b30 * a00) + (b31 * a10) + (b32 * a20) + (b33 * a30)
  a[13] = (b30 * a01) + (b31 * a11) + (b32 * a21) + (b33 * a31)
  a[14] = (b30 * a02) + (b31 * a12) + (b32 * a22) + (b33 * a32)
  a[15] = (b30 * a03) + (b31 * a13) + (b32 * a23) + (b33 * a33)

  return a
}

/**
 * Inverts a 4x4 matrix.
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @returns {Number[]|Float32Array}
 */
function invert (a) {
  var a00 = a[ 0], a10 = a[ 1], a20 = a[ 2], a30 = a[ 3]
  var a01 = a[ 4], a11 = a[ 5], a21 = a[ 6], a31 = a[ 7]
  var a02 = a[ 8], a12 = a[ 9], a22 = a[10], a32 = a[11]
  var a03 = a[12], a13 = a[13], a23 = a[14], a33 = a[15]

  // TODO: add caching

  a[ 0] = a11 * a22 * a33 - a11 * a32 * a23 - a12 * a21 * a33 + a12 * a31 * a23 + a13 * a21 * a32 - a13 * a31 * a22
  a[ 4] = -a01 * a22 * a33 + a01 * a32 * a23 + a02 * a21 * a33 - a02 * a31 * a23 - a03 * a21 * a32 + a03 * a31 * a22
  a[ 8] = a01 * a12 * a33 - a01 * a32 * a13 - a02 * a11 * a33 + a02 * a31 * a13 + a03 * a11 * a32 - a03 * a31 * a12
  a[12] = -a01 * a12 * a23 + a01 * a22 * a13 + a02 * a11 * a23 - a02 * a21 * a13 - a03 * a11 * a22 + a03 * a21 * a12

  a[ 1] = -a10 * a22 * a33 + a10 * a32 * a23 + a12 * a20 * a33 - a12 * a30 * a23 - a13 * a20 * a32 + a13 * a30 * a22
  a[ 5] = a00 * a22 * a33 - a00 * a32 * a23 - a02 * a20 * a33 + a02 * a30 * a23 + a03 * a20 * a32 - a03 * a30 * a22
  a[ 9] = -a00 * a12 * a33 + a00 * a32 * a13 + a02 * a10 * a33 - a02 * a30 * a13 - a03 * a10 * a32 + a03 * a30 * a12
  a[13] = a00 * a12 * a23 - a00 * a22 * a13 - a02 * a10 * a23 + a02 * a20 * a13 + a03 * a10 * a22 - a03 * a20 * a12

  a[ 2] = a10 * a21 * a33 - a10 * a31 * a23 - a11 * a20 * a33 + a11 * a30 * a23 + a13 * a20 * a31 - a13 * a30 * a21
  a[ 6] = -a00 * a21 * a33 + a00 * a31 * a23 + a01 * a20 * a33 - a01 * a30 * a23 - a03 * a20 * a31 + a03 * a30 * a21
  a[10] = a00 * a11 * a33 - a00 * a31 * a13 - a01 * a10 * a33 + a01 * a30 * a13 + a03 * a10 * a31 - a03 * a30 * a11
  a[14] = -a00 * a11 * a23 + a00 * a21 * a13 + a01 * a10 * a23 - a01 * a20 * a13 - a03 * a10 * a21 + a03 * a20 * a11

  a[ 3] = -a10 * a21 * a32 + a10 * a31 * a22 + a11 * a20 * a32 - a11 * a30 * a22 - a12 * a20 * a31 + a12 * a30 * a21
  a[ 7] = a00 * a21 * a32 - a00 * a31 * a22 - a01 * a20 * a32 + a01 * a30 * a22 + a02 * a20 * a31 - a02 * a30 * a21
  a[11] = -a00 * a11 * a32 + a00 * a31 * a12 + a01 * a10 * a32 - a01 * a30 * a12 - a02 * a10 * a31 + a02 * a30 * a11
  a[15] = a00 * a11 * a22 - a00 * a21 * a12 - a01 * a10 * a22 + a01 * a20 * a12 + a02 * a10 * a21 - a02 * a20 * a11

  var det = a00 * a[0] + a10 * a[4] + a20 * a[8] + a30 * a[12]

  if (det === 0) {
    return null
  }

  det = 1.0 / det

  a[0] *= det
  a[1] *= det
  a[2] *= det
  a[3] *= det
  a[4] *= det
  a[5] *= det
  a[6] *= det
  a[7] *= det
  a[8] *= det
  a[9] *= det
  a[10] *= det
  a[11] *= det
  a[12] *= det
  a[13] *= det
  a[14] *= det
  a[15] *= det

  return a
}

/**
 * Transposes a 4x4 matrix.
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @returns {Number[]|Float32Array}
 */
function transpose (a) {
  var a01 = a[ 1], a02 = a[ 2], a03 = a[ 3]
  var a12 = a [6], a13 = a[ 7]
  var a20 = a[ 8], a21 = a[ 9], a23 = a[11]
  var a30 = a[12], a31 = a[13], a32 = a[14]

  // 1st row - keeping a00
  a[ 1] = a[ 4]
  a[ 2] = a20
  a[ 3] = a30
  // 2nd row - keeping a11
  a[ 4] = a01
  a[ 6] = a21
  a[ 7] = a31
  // 3rd row - keeping a22
  a[ 8] = a02
  a[ 9] = a12
  a[11] = a32
  // 4th row - keeping a33
  a[12] = a03
  a[13] = a13
  a[14] = a23

  return a
}

/**
 * Sets a 4x4 matrix to its identity.
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @returns {Number[]|Float32Array}
 */
function identity (a) {
  a[0] = a[5] = a[10] = a[15] = 1
  a[1] = a[2] = a[3] = a[4] = a[6] = a[7] = a[8] = a[9] = a[11] = a[12] = a[13] = a[14] = 0
  return a
}

/**
 *
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param x
 * @param y
 * @param z
 * @returns {Number[]|Float32Array}
 */
function setScale3 (a, x, y, z) {
  a[ 0] = x
  a[ 5] = y
  a[10] = z
  return a
}

/**
 *
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param v
 * @returns {Number[]|Float32Array}
 */
function setScale (a, v) {
  return setScale3(a, v[0], v[1], v[2])
}

/**
 *
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param x
 * @param y
 * @param z
 * @returns {Number[]|Float32Array}
 */
function scale3 (a, x, y, z) {
  return mult16(a, x, 0, 0, 0,
                0, y, 0, 0,
                0, 0, z, 0,
                0, 0, 0, 1)
}

/**
 *
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param v
 * @returns {Number[]|Float32Array}
 */
function scale (a, v) {
  return scale3(a, v[0], v[1], v[2])
}

/**
 *
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param x
 * @param y
 * @param z
 * @returns {Number[]|Float32Array}
 */
function setTranslation3 (a, x, y, z) {
  a[12] = x
  a[13] = y
  a[14] = z
  return a
}

/**
 *
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param v
 * @returns {Number[]|Float32Array}
 */
function setTranslation (a, v) {
  return setTranslation3(a, v[0], v[1], v[2])
}

/**
 *
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param x
 * @param y
 * @param z
 * @returns {Number[]|Float32Array}
 */
function translate3 (a, x, y, z) {
  return mult16(a, 1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                x, y, z, 1)
}

/**
 *
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param v
 * @returns {Number[]|Float32Array}
 */
function translate (a, v) {
  return translate3(a, v[0], v[1], v[2])
}

/**
 * Sets the rotation components by angle and axis. (Rotation is counter clockwise.)
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param r
 * @param x
 * @param y
 * @param z
 * @returns {Number[]|Float32Array}
 */
function setRotation3 (a, r, x, y, z) {
  var len = Math.sqrt(x * x + y * y + z * z)

  if (len < 0.0001) {
    return null
  }

  var s, c, t
  var a00, a01, a02, a03
  var a10, a11, a12, a13
  var a20, a21, a22, a23
  var b00, b01, b02
  var b10, b11, b12
  var b20, b21, b22

  len = 1 / len

  x *= len
  y *= len
  z *= len

  s = Math.sin(r)
  c = Math.cos(r)
  t = 1 - c

  a00 = a11 = a22 = 1
  a01 = a02 = a03 = a10 = a12 = a13 = a20 = a21 = a23 = 0

  b00 = x * x * t + c
  b01 = y * x * t + z * s
  b02 = z * x * t - y * s
  b10 = x * y * t - z * s
  b11 = y * y * t + c
  b12 = z * y * t + x * s
  b20 = x * z * t + y * s
  b21 = y * z * t - x * s
  b22 = z * z * t + c

  a[0 ] = a00 * b00 + a10 * b01 + a20 * b02
  a[1 ] = a01 * b00 + a11 * b01 + a21 * b02
  a[2 ] = a02 * b00 + a12 * b01 + a22 * b02
  a[3 ] = a03 * b00 + a13 * b01 + a23 * b02
  a[4 ] = a00 * b10 + a10 * b11 + a20 * b12
  a[5 ] = a01 * b10 + a11 * b11 + a21 * b12
  a[6 ] = a02 * b10 + a12 * b11 + a22 * b12
  a[7 ] = a03 * b10 + a13 * b11 + a23 * b12
  a[8 ] = a00 * b20 + a10 * b21 + a20 * b22
  a[9 ] = a01 * b20 + a11 * b21 + a21 * b22
  a[10] = a02 * b20 + a12 * b21 + a22 * b22
  a[11] = a03 * b20 + a13 * b21 + a23 * b22

  return a
}

/**
 * Sets the rotation components by angle and axis. (Rotation is counter clockwise.)
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param r
 * @param v
 * @returns {Number[]|Float32Array}
 */
function setRotation (a, r, v) {
  return setRotation3(a, r, v[0], v[1], v[2])
}

/**
 * Rotates the matrix by angle and axis. (Rotation is counter clockwise.)
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param r
 * @param x
 * @param y
 * @param z
 * @returns {Number[]|Float32Array}
 */
function rotate3 (a, r, x, y, z) {
  var len = Math.sqrt(x * x + y * y + z * z)

  if (len < 0.0001) {
    return null
  }

  var s, c, t
  var a00, a01, a02, a03
  var a10, a11, a12, a13
  var a20, a21, a22, a23
  var b00, b01, b02
  var b10, b11, b12
  var b20, b21, b22

  len = 1 / len

  x *= len
  y *= len
  z *= len

  s = Math.sin(r)
  c = Math.cos(r)
  t = 1 - c

  a00 = a11 = a22 = 1
  a01 = a02 = a03 = a10 = a12 = a13 = a20 = a21 = a23 = 0

  b00 = x * x * t + c
  b01 = y * x * t + z * s
  b02 = z * x * t - y * s
  b10 = x * y * t - z * s
  b11 = y * y * t + c
  b12 = z * y * t + x * s
  b20 = x * z * t + y * s
  b21 = y * z * t - x * s
  b22 = z * z * t + c

  var _a00 = a00 * b00 + a10 * b01 + a20 * b02
  var _a01 = a01 * b00 + a11 * b01 + a21 * b02
  var _a02 = a02 * b00 + a12 * b01 + a22 * b02
  var _a03 = a03 * b00 + a13 * b01 + a23 * b02
  var _a10 = a00 * b10 + a10 * b11 + a20 * b12
  var _a11 = a01 * b10 + a11 * b11 + a21 * b12
  var _a12 = a02 * b10 + a12 * b11 + a22 * b12
  var _a13 = a03 * b10 + a13 * b11 + a23 * b12
  var _a20 = a00 * b20 + a10 * b21 + a20 * b22
  var _a21 = a01 * b20 + a11 * b21 + a21 * b22
  var _a22 = a02 * b20 + a12 * b21 + a22 * b22
  var _a23 = a03 * b20 + a13 * b21 + a23 * b22

  return mult16(a, _a00, _a01, _a02, _a03,
                _a10, _a11, _a12, _a13,
                _a20, _a21, _a22, _a23,
                0, 0, 0, 1)
}

/**
 * Rotates the matrix by angle and axis. (Rotation is counter clockwise.)
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param r
 * @param v
 * @returns {Number[]|Float32Array}
 */
function rotate (a, r, v) {
  return rotate3(a, r, v[0], v[1], v[2])
}

/**
 * Sets the rotation components by rotation per axis. (Rotation is counter clockwise.)
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param x
 * @param y
 * @param z
 * @returns {Number[]|Float32Array}
 */
function setRotationXYZ3 (a, x, y, z) {
  var cosx = Math.cos(x)
  var sinx = Math.sin(x)
  var cosy = Math.cos(y)
  var siny = Math.sin(y)
  var cosz = Math.cos(z)
  var sinz = Math.sin(z)

  // column 1
  a[ 0] = cosy * cosz
  a[ 4] = -cosx * sinz + sinx * siny * cosz
  a[ 8] = sinx * sinz + cosx * siny * cosz

  // column 2
  a[ 1] = cosy * sinz
  a[ 5] = cosx * cosz + sinx * siny * sinz
  a[ 9] = -sinx * cosz + cosx * siny * sinz

  // column 3
  a[ 2] = -siny
  a[ 6] = sinx * cosy
  a[10] = cosx * cosy

  return a
}

/**
 *
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param v
 * @returns {Number[]|Float32Array}
 */
function setRotationXYZ (a, v) {
  return setRotationXYZ3(a, v[0], v[1], v[2])
}

/**
 *
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param x
 * @param y
 * @param z
 * @returns {Number[]|Float32Array}
 */
function rotateXYZ3 (a, x, y, z) {
  var cosx = Math.cos(x)
  var sinx = Math.sin(x)
  var cosy = Math.cos(y)
  var siny = Math.sin(y)
  var cosz = Math.cos(z)
  var sinz = Math.sin(z)

  var a00 = cosy * cosz
  var a10 = -cosx * sinz + sinx * siny * cosz
  var a20 = sinx * sinz + cosx * siny * cosz

  var a01 = cosy * sinz
  var a11 = cosx * cosz + sinx * siny * sinz
  var a21 = -sinx * cosz + cosx * siny * sinz

  var a02 = -siny
  var a12 = sinx * cosy
  var a22 = cosx * cosy

  return mult16(a, a00, a01, a02, 0,
                a10, a11, a12, 0,
                a20, a21, a22, 0,
                0, 0, 0, 1)
}

/**
 *
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param v
 * @returns {Number[]|Float32Array}
 */
function rotateXYZ (a, v) {
  return rotateXYZ3(a, v[0], v[1], v[2])
}

function setRotationFromOnB9 (a, ux, uy, uz, vx, vy, vz, wx, wy, wz) {
  a[ 0] = ux
  a[ 1] = uy
  a[ 2] = uz

  a[ 4] = vx
  a[ 5] = vy
  a[ 6] = vz

  a[ 8] = wx
  a[ 9] = wy
  a[10] = wz

  return a
}

/**
 *
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param u
 * @param v
 * @param w
 * @returns {Number[]|Float32Array}
 */
function setRotationFromOnB (a, u, v, w) {
  return setRotationFromOnB9(a, u[0], u[1], u[2], v[0], v[1], v[2], w[0], w[1], w[2])
}

/**
 *
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param b
 * @returns {Number[]|Float32Array}
 */
function fromQuat (a, b) {
  var x = b[0]
  var y = b[1]
  var z = b[2]
  var w = b[3]

  var x2 = x + x
  var y2 = y + y
  var z2 = z + z

  var xx = x * x2
  var xy = x * y2
  var xz = x * z2

  var yy = y * y2
  var yz = y * z2
  var zz = z * z2

  var wx = w * x2
  var wy = w * y2
  var wz = w * z2

  a[ 0] = 1 - (yy + zz)
  a[ 4] = xy - wz
  a[ 8] = xz + wy

  a[ 1] = xy + wz
  a[ 5] = 1 - (xx + zz)
  a[ 9] = yz - wx

  a[ 2] = xz - wy
  a[ 6] = yz + wx
  a[10] = 1 - (xx + yy)

  a[ 3] = a[ 7] = a[11] = a[12] = a[13] = a[14] = 0
  a[15] = 1

  return a
}

/**
 * Sets a 4x4 matrix from a 3x3 rotation matrix.
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param {Number[]|Float32Array} b - 3x3 matrix (Array of length 9)
 * @returns {Number[]|Float32Array}
 */
function fromMat3 (a, b) {
  a[ 0] = b[ 0]
  a[ 1] = b[ 1]
  a[ 2] = b[ 2]

  a[ 4] = b[ 3]
  a[ 5] = b[ 4]
  a[ 6] = b[ 5]

  a[ 8] = b[ 6]
  a[ 9] = b[ 7]
  a[10] = b[ 8]

  a[ 3] = a[ 7] = a[11] =
    a[12] = a[13] = a[14] = 0
  a[15] = 1.0

  return a
}

/**
 *
 * @param x
 * @param y
 * @param z
 * @returns {Number[]|Float32Array}
 */
function createFromScale3 (x, y, z) {
  return setScale3(create(), x, y, z)
}

/**
 *
 * @param v
 * @returns {Number[]|Float32Array}
 */
function createFromScale (v) {
  return createFromScale3(v[0], v[1], v[2])
}

/**
 *
 * @param x
 * @param y
 * @param z
 * @returns {Number[]|Float32Array}
 */
function createFromTranslation3 (x, y, z) {
  return setTranslation3(create(), x, y, z)
}

/**
 *
 * @param v
 * @returns {Number[]|Float32Array}
 */
function createFromTranslation (v) {
  return createFromTranslation3(v[0], v[1], v[2])
}

/**
 *
 * @param r
 * @param x
 * @param y
 * @param z
 * @returns {Number[]|Float32Array}
 */
function createFromRotation3 (r, x, y, z) {
  return setRotation3(create(), r, x, y, z)
}

/**
 *
 * @param r
 * @param v
 * @returns {Number[]|Float32Array}
 */
function createFromRotation (r, v) {
  return createFromRotation3(r, v[0], v[1], v[2])
}

/**
 *
 * @param x
 * @param y
 * @param z
 * @returns {Number[]|Float32Array}
 */
function createFromRotationXYZ3 (x, y, z) {
  return setRotationXYZ3(create(), x, y, z)
}

/**
 *
 * @param v
 * @returns {Number[]|Float32Array}
 */
function createFromRotationXYZ (v) {
  return createFromRotationXYZ3(v[0], v[1], v[2])
}

/**
 *
 * @param ux
 * @param uy
 * @param uz
 * @param vx
 * @param vy
 * @param vz
 * @param wx
 * @param wy
 * @param wz
 * @returns {Number[]|Float32Array}
 */
function createFromOnB9 (ux, uy, uz, vx, vy, vz, wx, wy, wz) {
  return setRotationFromOnB9(create(), ux, uy, uz, vx, vy, vz, wx, wy, wz)
}

/**
 *
 * @param u
 * @param v
 * @param w
 * @returns {Number[]|Float32Array}
 */
function createFromOnB (u, v, w) {
  return createFromOnB9(u[0], u[1], u[2], v[0], v[1], v[2], w[0], w[1], w[2])
}

/**
 *
 * @param a - 4x4 matrix (Array of length 16)
 * @param left
 * @param right
 * @param bottom
 * @param top
 * @param near
 * @param far
 * @returns {Number[]|Float32Array}
 */
function frustum (a, left, right, bottom, top, near, far) {
  var rl = 1.0 / (right - left)
  var tb = 1.0 / (top - bottom)
  var nf = 1.0 / (near - far)

  var near2 = near * 2

  a[ 0] = near2 * rl
  a[ 1] = a[ 2] = 0
  a[ 3] = 0
  a[ 4] = 0
  a[ 5] = near2 * tb
  a[ 6] = 0
  a[ 7] = 0
  a[ 8] = (right + left) * rl
  a[ 9] = (top + bottom) * tb
  a[10] = (far + near) * nf
  a[11] = -1
  a[12] = 0
  a[13] = 0
  a[14] = (far * near2) * nf
  a[15] = 0

  return a
}

/**
 * Calculate perspective matrix
 * @param  {Mat4} a        - out matrix
 * @param  {Number} fov    - field of view in degrees
 * @param  {Number} aspect - aspect ratio
 * @param  {Number} near   - near clipping plane
 * @param  {Number} far    - far clipping plane distance
 * @return {Mat4}          - returns out matrix
 */
function perspective (a, fov, aspect, near, far) {
  var f = 1.0 / Math.tan(fov / 180.0 * Math.PI * 0.5)
  var nf = 1.0 / (near - far)

  a[1] = a[2] = a[3] = a[4] = a[6] = a[7] = a[8] = a[9] = a[12] = a[13] = a[15] = 0

  a[ 0] = f / aspect
  a[ 5] = f
  a[10] = (far + near) * nf
  a[11] = -1
  a[14] = (2 * far * near) * nf

  return a
}

/**
 *
 * @param {Number[]|Float32Array} a - 4x4 matrix (Array of length 16)
 * @param left
 * @param right
 * @param bottom
 * @param top
 * @param near
 * @param far
 * @returns {Number[]|Float32Array}
 */

function ortho (a, left, right, bottom, top, near, far) {
  var lr = left - right
  var bt = bottom - top
  var nf = near - far

  a[1] = a[2] = a[3] = a[4] = a[6] = a[7] = a[8] = a[9] = a[11] = 0

  a[0] = -2 / lr
  a[5] = -2 / bt
  a[10] = 2 / nf

  a[12] = (left + right) / lr
  a[13] = (top + bottom) / bt
  a[14] = (far + near) / nf
  a[15] = 1

  return a
}

/**
 *
 * @param {Number[]|Float32Array} a
 * @param eyex
 * @param eyey
 * @param eyez
 * @param targetx
 * @param targety
 * @param targetz
 * @param upx
 * @param upy
 * @param upz
 * @returns {Number[]|Float32Array}
 */

function lookAt9 (a, eyex, eyey, eyez, targetx, targety, targetz, upx, upy, upz) {
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len

  if (Math.abs(eyex - targetx) < 0.000001 &&
      Math.abs(eyey - targety) < 0.000001 &&
      Math.abs(eyez - targetz) < 0.000001) {
    a[ 0] = 1
    a[ 1] = a[ 2] = a[ 3] = 0
    a[ 5] = 1
    a[ 4] = a[ 6] = a[ 7] = 0
    a[10] = 1
    a[ 8] = a[ 9] = a[11] = 0
    a[15] = 1
    a[12] = a[13] = a[14] = 0

    return a
  }

  z0 = eyex - targetx
  z1 = eyey - targety
  z2 = eyez - targetz

  len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2)
  z0 *= len
  z1 *= len
  z2 *= len

  x0 = upy * z2 - upz * z1
  x1 = upz * z0 - upx * z2
  x2 = upx * z1 - upy * z0

  len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2)

  if (len) {
    len = 1.0 / len
    x0 *= len
    x1 *= len
    x2 *= len
  }

  y0 = z1 * x2 - z2 * x1
  y1 = z2 * x0 - z0 * x2
  y2 = z0 * x1 - z1 * x0

  len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2)

  if (len) {
    len = 1.0 / len
    x0 *= len
    x1 *= len
    x2 *= len
  }

  a[0] = x0
  a[1] = y0
  a[2] = z0
  a[3] = 0
  a[4] = x1
  a[5] = y1
  a[6] = z1
  a[7] = 0
  a[8] = x2
  a[9] = y2
  a[10] = z2
  a[11] = 0
  a[12] = -(x0 * eyex + x1 * eyey + x2 * eyez)
  a[13] = -(y0 * eyex + y1 * eyey + y2 * eyez)
  a[14] = -(z0 * eyex + z1 * eyey + z2 * eyez)
  a[15] = 1

  return a
}

/**
 *
 * @param {Number[]|Float32Array} a
 * @param from
 * @param to
 * @param up
 * @returns {Number[]|Float32Array}
 */

function lookAt (a, from, to, up) {
  return lookAt9(a, from[0], from[1], from[2], to[0], to[1], to[2], up[0], up[1], up[2])
}

var Mat4 = {
  create: create,
  set: set,
  set16: set16,
  equals: equals,
  copy: copy,
  mult16: mult16,
  mult: mult,
  invert: invert,
  transpose: transpose,
  setScale3: setScale3,
  setScale: setScale,
  scale3: scale3,
  scale: scale,
  setTranslation3: setTranslation3,
  setTranslation: setTranslation,
  translate3: translate3,
  translate: translate,
  setRotationXYZ3: setRotationXYZ3,
  setRotationXYZ: setRotationXYZ,
  rotateXYZ3: rotateXYZ3,
  rotateXYZ: rotateXYZ,
  setRotation3: setRotation3,
  setRotation: setRotation,
  rotate3: rotate3,
  rotate: rotate,
  setRotationFromOnB9: setRotationFromOnB9,
  setRotationFromOnB: setRotationFromOnB,
  fromQuat: fromQuat,
  fromMat3: fromMat3,
  identity: identity,
  createFromScale3: createFromScale3,
  createFromScale: createFromScale,
  createFromTranslation3: createFromTranslation3,
  createFromTranslation: createFromTranslation,
  createFromRotation3: createFromRotation3,
  createFromRotation: createFromRotation,
  createFromRotationXYZ: createFromRotationXYZ,
  createFromRotationXYZ3: createFromRotationXYZ3,
  createFromOnB9: createFromOnB9,
  createFromOnB: createFromOnB,
  frustum: frustum,
  perspective: perspective,
  ortho: ortho,
  lookAt9: lookAt9,
  lookAt: lookAt
}

module.exports = Mat4

},{}],72:[function(require,module,exports){
var Vec3 = require('./Vec3')

var EPSILON = Math.pow(2, -24)

var Y_AXIS = [0, 1, 0]
var TEMP_VEC3_0 = [0, 0, 0]
var TEMP_VEC3_1 = [0, 0, 0]
var TEMP_VEC3_2 = [0, 0, 0]
var TEMP_VEC3_3 = [0, 0, 0]

function create () {
  return [0, 0, 0, 1]
}

function equals (a, b) {
  return a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3]
}

function identity (a) {
  a[0] = a[1] = a[2] = 0.0
  a[3] = 1.0
  return a
}

function copy (a) {
  return a.slice(0)
}

function set (a, b) {
  a[0] = b[0]
  a[1] = b[1]
  a[2] = b[2]
  a[3] = b[3]
  return a
}

function set4 (a, x, y, z, w) {
  a[0] = x
  a[1] = y
  a[2] = z
  a[3] = w
  return a
}

function mult (a, b) {
  var ax = a[0]
  var ay = a[1]
  var az = a[2]
  var aw = a[3]
  var bx = b[0]
  var by = b[1]
  var bz = b[2]
  var bw = b[3]

  a[0] = aw * bx + ax * bw + ay * bz - az * by
  a[1] = aw * by + ay * bw + az * bx - ax * bz
  a[2] = aw * bz + az * bw + ax * by - ay * bx
  a[3] = aw * bw - ax * bx - ay * by - az * bz

  return a
}

function invert (a) {
  var l = dot(a, a)
  l = l ? 1.0 / l : 0.0

  a[0] *= -l
  a[1] *= -l
  a[2] *= -l
  a[3] *= l
  return a
}

function conjugate (a) {
  a[0] *= -1
  a[1] *= -1
  a[2] *= -1
  return a
}

function length (a) {
  var x = a[0]
  var y = a[1]
  var z = a[2]
  var w = a[3]
  return Math.sqrt(x * x + y * y + z * z + w * w)
}

function normalize (a) {
  var l = length(a)
  if (l > EPSILON) {
    l = 1.0 / l
    a[0] *= l
    a[1] *= l
    a[2] *= l
    a[3] *= l
  }
  return a
}

function dot (a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
}

function setAxisAngle3 (a, angle, x, y, z) {
  var angle_2 = angle * 0.5
  var sin_2 = Math.sin(angle_2)
  a[0] = x * sin_2
  a[1] = y * sin_2
  a[2] = z * sin_2
  a[3] = Math.cos(angle_2)
  return normalize(a)
}

function setAxisAngle (a, angle, v) {
  return setAxisAngle3(a, angle, v[0], v[1], v[2])
}

function fromMat39 (a, m0, m1, m2,
                   m3, m4, m5,
                   m6, m7, m8) {
  var trace = m0 + m4 + m8
  var s

  if (trace >= 0) {
    s = Math.sqrt(trace + 1)
    a[3] = 0.5 * s
    s = 0.5 / s
    a[0] = (m5 - m7) * s
    a[1] = (m6 - m2) * s
    a[2] = (m1 - m3) * s

  } else if ((m0 > m4) && (m0 > m8)) {
    s = Math.sqrt(1.0 + m0 - m4 - m8)
    a[0] = s * 0.5
    s = 0.5 / s
    a[1] = (m1 + m3) * s
    a[2] = (m6 + m2) * s
    a[3] = (m5 - m7) * s

  } else if (m4 > m8) {
    s = Math.sqrt(1.0 + m4 - m0 - m8)
    a[1] = s * 0.5
    s = 0.5 / s
    a[0] = (m1 + m3) * s
    a[2] = (m5 + m7) * s
    a[3] = (m6 - m2) * s

  } else {
    s = Math.sqrt(1.0 + m8 - m0 - m4)
    a[2] = s * 0.5
    s = 0.5 / s
    a[0] = (m6 + m2) * s
    a[1] = (m5 + m7) * s
    a[3] = (m1 - m3) * s
  }
  return a
}

function fromMat3 (a, m) {
  return fromMat39(a, m[0], m[1], m[2],
                   m[3], m[4], m[5],
                   m[6], m[7], m[8])
}

function fromMat4 (a, m) {
  return fromMat39(a, m[ 0], m[ 1], m[ 2],
                   m[ 4], m[ 5], m[ 6],
                   m[ 8], m[ 9], m[10])
}

function setAxes9 (a, xx, xy, xz, yx, yy, yz, zx, zy, zz) {
  return fromMat39(a, xx, xy, xz, yx, yy, yz, zx, zy, zz)
}

function setAxes (a, x, y, z) {
  return setAxes9(a, x[0], x[1], x[2], y[0], y[1], y[2], z[0], z[1], z[2])
}

function getAngle (a) {
  return Math.acos(a[3]) * 2.0
}

function getAxisAngle (a, out) {
  out[3] = getAngle(a)
  getAxis(a, out)
  return out
}

function fromDirection (a, direction, up) {
  up = Vec3.set(TEMP_VEC3_0, up === undefined ? Y_AXIS : up)

  var tangent = TEMP_VEC3_1
  var normal = TEMP_VEC3_2
  var bitangent = TEMP_VEC3_3

  tangent = Vec3.normalize(Vec3.set(tangent, direction))
  bitangent = Vec3.normalize(Vec3.cross(Vec3.set(bitangent, up), tangent))

  normal = Vec3.cross(Vec3.set(normal, tangent), bitangent)

  return setAxes(a, bitangent, normal, tangent)
}

function setEuler (q, yaw, pitch, roll) {
  pitch *= 0.5
  yaw *= 0.5
  roll *= 0.5

  var spitch = Math.sin(pitch)
  var cpitch = Math.cos(pitch)
  var syaw = Math.sin(yaw)
  var cyaw = Math.cos(yaw)
  var sroll = Math.sin(roll)
  var croll = Math.cos(roll)
  var cpitchCosYaw = cpitch * cyaw
  var spitchSinYaw = spitch * syaw

  q[0] = sroll * cpitchCosYaw - croll * spitchSinYaw
  q[1] = croll * spitch * cyaw + sroll * cpitch * syaw
  q[2] = croll * cpitch * syaw - sroll * spitch * cyaw
  q[3] = croll * cpitchCosYaw + sroll * spitchSinYaw

  return q
}

function fromTo9 (a, fromx, fromy, fromz, tox, toy, toz, upx, upy, upz) {
  var from = Vec3.set3(TEMP_VEC3_0, fromx, fromy, fromz)
  var to = Vec3.set3(TEMP_VEC3_1, tox, toy, toz)
  var direction = Vec3.normalize(Vec3.sub(to, from))
  var up = Vec3.set3(TEMP_VEC3_2, upx, upy, upz)

  return fromDirection(a, direction, up)
}

function fromTo (a, from, to, up) {
  return fromTo9(a, from[0], from[1], from[2], to[0], to[1], to[2], up[0], up[1], up[2])
}

function getAxis (a, out) {
  var w = a[3]
  var s = 1.0 / Math.sqrt(1.0 - w * w)
  out[0] = a[0] * s
  out[1] = a[1] * s
  out[2] = a[2] * s
  return out
}

function slerp (a, b, t) {
  // http://jsperf.com/quaternion-slerp-implementations
  var ax = a[0]
  var ay = a[1]
  var az = a[2]
  var aw = a[3]
  var bx = b[0]
  var by = b[1]
  var bz = b[2]
  var bw = b[3]

  var omega, cosom, sinom, scale0, scale1

  cosom = dot(a, b)

  if (cosom < 0.0) {
    cosom = -cosom
    a[0] = -bx
    a[1] = -by
    a[2] = -bz
    a[3] = -bw
  } else {
    a[0] = bx
    a[1] = by
    a[2] = bz
    a[3] = bw
  }

  if ((1.0 - cosom) > 0.000001) {
    omega = Math.acos(cosom)
    sinom = Math.sin(omega)
    scale0 = Math.sin((1.0 - t) * omega) / sinom
    scale1 = Math.sin(t * omega) / sinom
  } else {
    scale0 = 1.0 - t
    scale1 = t
  }

  a[0] = scale0 * ax + scale1 * a[0]
  a[1] = scale0 * ay + scale1 * a[1]
  a[2] = scale0 * az + scale1 * a[2]
  a[3] = scale0 * aw + scale1 * a[3]
  return a
}

function createFromEuler (yaw, pitch, roll) {
  return setEuler(create(), yaw, pitch, roll)
}

var Quat = {
  create: create,
  equals: equals,
  identity: identity,
  copy: copy,
  set: set,
  set4: set4,
  mult: mult,
  invert: invert,
  conjugate: conjugate,
  dot: dot,
  length: length,
  normalize: normalize,
  setAxisAngle3: setAxisAngle3,
  setAxisAngle: setAxisAngle,
  fromMat3: fromMat3,
  fromMat4: fromMat4,
  setAxes9: setAxes9,
  setAxes: setAxes,
  getAngle: getAngle,
  getAxis: getAxis,
  getAxisAngle: getAxisAngle,
  setEuler: setEuler,
  fromDirection: fromDirection,
  slerp: slerp,
  fromTo9: fromTo9,
  fromTo: fromTo,
  createFromEuler: createFromEuler
}

module.exports = Quat

},{"./Vec3":75}],73:[function(require,module,exports){
function lerp (a, b, t) {
  return a + (b - a) * t
}

function clamp (a, min, max) {
  return Math.max(min, Math.min(a, max))
}

function smoothstep (min, max, x) {
  x = clamp((x - min) / (max - min), 0.0, 1.0)
  return x * x * (3 - 2 * x)
}

function normalize (a, start, end) {
  return (a - start) / (end - start)
}

function map (a, inStart, inEnd, outStart, outEnd) {
  return outStart + (outEnd - outStart) * normalize(a, inStart, inEnd)
}

function toRadians (degrees) {
  return degrees * Math.PI / 180.0
}

function toDegrees (radians) {
  return radians * 180 / Math.PI
}

function frac (a) {
  return a - Math.floor(a)
}

function sgn (a) {
  return a / Math.abs(a)
}

function isPOT (a) {
  return (a & (a - 1)) === 0
}

var Utils = {
  lerp: lerp,
  clamp: clamp,
  smoothstep: smoothstep,
  normalize: normalize,
  map: map,
  toRadians: toRadians,
  toDegrees: toDegrees,
  frac: frac,
  sgn: sgn,
  isPOT: isPOT
}

module.exports = Utils

},{}],74:[function(require,module,exports){
function create () {
  return [0, 0]
}

function set (a, b) {
  a[0] = b[0]
  a[1] = b[1]
  return a
}

function set2 (a, x, y) {
  a[0] = x
  a[1] = y
  return a
}

function equals (a, b) {
  return a[0] === b[0] &&
    a[1] === b[1]
}

function equals2 (a, x, y) {
  return a[0] === x &&
    a[1] === y
}

function copy (a, out) {
  if (out !== undefined) {
    out[0] = a[0]
    out[1] = a[1]
    return out
  }
  return a.slice(0)
}

function add (a, b) {
  a[0] += b[0]
  a[1] += b[1]
  return a
}

function add2 (a, x, y) {
  a[0] += x
  a[1] += y
  return a
}

function sub (a, b) {
  a[0] -= b[0]
  a[1] -= b[1]
  return a
}

function sub2 (a, x, y) {
  a[0] -= x
  a[1] -= y
  return a
}

function scale (a, n) {
  a[0] *= n
  a[1] *= n
  return a
}

function dot (a, b) {
  return a[0] * b[0] + a[1] * b[1]
}

function length (a) {
  var x = a[0]
  var y = a[1]
  return Math.sqrt(x * x + y * y)
}

function lengthSq (a) {
  var x = a[0]
  var y = a[1]
  return x * x + y * y
}

function normalize (a) {
  var x = a[0]
  var y = a[1]
  var l = Math.sqrt(x * x + y * y)

  l = 1.0 / (l || 1)
  a[0] *= l
  a[1] *= l
  return a
}

function distance (a, b) {
  return distance2(a, b[0], b[1])
}

function distance2 (a, x, y) {
  var dx = x - a[0]
  var dy = y - a[1]
  return Math.sqrt(dx * dx + dy * dy)
}

function distanceSq (a, b) {
  return distanceSq2(a, b[0], b[1], b[2])
}

function distanceSq2 (a, x, y) {
  var dx = x - a[0]
  var dy = y - a[1]
  return dx * dx + dy * dy
}

function limit (a, n) {
  var x = a[0]
  var y = a[1]

  var dsq = x * x + y * y
  var lsq = n * n

  if (lsq > 0 && dsq > lsq) {
    var nd = n / Math.sqrt(dsq)
    a[0] *= nd
    a[1] *= nd
  }

  return a
}

function invert (a) {
  a[0] *= -1
  a[1] *= -1
  return a
}

function lerp (a, b, n) {
  var x = a[0]
  var y = a[1]

  a[0] = x + (b[0] - x) * n
  a[1] = y + (b[1] - y) * n

  return a
}

function toMin (a) {
  a[0] = a[1] = -Number.MAX_VALUE
  return a
}

function toMax (a) {
  a[0] = a[1] = Number.MAX_VALUE
  return a
}

function toZero (a) {
  a[0] = a[1] = 0
  return a
}

var Vec2 = {
  create: create,
  set: set,
  set2: set2,
  copy: copy,
  equals: equals,
  equals2: equals2,
  add: add,
  add2: add2,
  sub: sub,
  sub2: sub2,
  scale: scale,
  dot: dot,
  length: length,
  lengthSq: lengthSq,
  normalize: normalize,
  distance: distance,
  distance2: distance2,
  distanceSq: distanceSq,
  distanceSq2: distanceSq2,
  limit: limit,
  invert: invert,
  lerp: lerp,
  toMin: toMin,
  toMax: toMax,
  toZero: toZero
}

module.exports = Vec2

},{}],75:[function(require,module,exports){
function create () {
  return [0, 0, 0]
}

function equals (a, b) {
  return a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2]
}

function equals3 (a, x, y, z) {
  return a[0] === x &&
    a[1] === y &&
    a[2] === z
}

function set (a, b) {
  a[0] = b[0]
  a[1] = b[1]
  a[2] = b[2]
  return a
}

function set3 (a, x, y, z) {
  a[0] = x
  a[1] = y
  a[2] = z
  return a
}

function add (a, b) {
  a[0] += b[0]
  a[1] += b[1]
  a[2] += b[2]
  return a
}

function add3 (a, x, y, z) {
  a[0] += x
  a[1] += y
  a[2] += z
  return a
}

function sub (a, b) {
  a[0] -= b[0]
  a[1] -= b[1]
  a[2] -= b[2]
  return a
}

function sub3 (a, x, y, z) {
  a[0] -= x
  a[1] -= y
  a[2] -= z
  return a
}

function scale (a, n) {
  a[0] *= n
  a[1] *= n
  a[2] *= n
  return a
}

function multMat4 (a, m) {
  var x = a[0]
  var y = a[1]
  var z = a[2]

  a[0] = m[ 0] * x + m[ 4] * y + m[ 8] * z + m[12]
  a[1] = m[ 1] * x + m[ 5] * y + m[ 9] * z + m[13]
  a[2] = m[ 2] * x + m[ 6] * y + m[10] * z + m[14]

  return a
}

function multQuat (a, q) {
  var x = a[0]
  var y = a[1]
  var z = a[2]

  var qx = q[0]
  var qy = q[1]
  var qz = q[2]
  var qw = q[3]

  var ix = qw * x + qy * z - qz * y
  var iy = qw * y + qz * x - qx * z
  var iz = qw * z + qx * y - qy * x
  var iw = -qx * x - qy * y - qz * z

  a[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy
  a[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz
  a[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx

  return a
}

function dot (a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function cross (a, b) {
  var x = a[0]
  var y = a[1]
  var z = a[2]
  var vx = b[0]
  var vy = b[1]
  var vz = b[2]

  a[0] = y * vz - vy * z
  a[1] = z * vx - vz * x
  a[2] = x * vy - vx * y
  return a
}

function cross3 (a, x, y, z) {
  var _x = a[0]
  var _y = a[1]
  var _z = a[2]

  a[0] = _y * z - y * _z
  a[1] = _z * x - z * _x
  a[2] = _x * y - x * _y
  return a
}

function length (a) {
  var x = a[0]
  var y = a[1]
  var z = a[2]
  return Math.sqrt(x * x + y * y + z * z)
}

function lengthSq (a) {
  var x = a[0]
  var y = a[1]
  var z = a[2]
  return x * x + y * y + z * z
}

function normalize (a) {
  var x = a[0]
  var y = a[1]
  var z = a[2]
  var l = Math.sqrt(x * x + y * y + z * z)

  l = 1.0 / (l || 1)
  a[0] *= l
  a[1] *= l
  a[2] *= l
  return a
}

function distance (a, b) {
  return distance3(a, b[0], b[1], b[2])
}

function distance3 (a, x, y, z) {
  var dx = x - a[0]
  var dy = y - a[1]
  var dz = z - a[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function distanceSq (a, b) {
  return distanceSq3(a, b[0], b[1], b[2])
}

function distanceSq3 (a, x, y, z) {
  var dx = x - a[0]
  var dy = y - a[1]
  var dz = z - a[2]
  return dx * dx + dy * dy + dz * dz
}

function limit (a, n) {
  var x = a[0]
  var y = a[1]
  var z = a[2]

  var dsq = x * x + y * y + z * z
  var lsq = n * n

  if (lsq > 0 && dsq > lsq) {
    var nd = n / Math.sqrt(dsq)
    a[0] *= nd
    a[1] *= nd
    a[2] *= nd
  }

  return a
}

function invert (a) {
  a[0] *= -1
  a[1] *= -1
  a[2] *= -1
  return a
}

function lerp (a, b, n) {
  var x = a[0]
  var y = a[1]
  var z = a[2]

  a[0] = x + (b[0] - x) * n
  a[1] = y + (b[1] - y) * n
  a[2] = z + (b[2] - z) * n

  return a
}

function toZero (a) {
  a[0] = a[1] = a[2] = 0
  return a
}

function toOne (a) {
  a[0] = a[1] = a[2] = 1
  return a
}

function toMax (a) {
  a[0] = a[1] = a[2] = Number.MAX_VALUE
  return a
}

function toMin (a) {
  a[0] = a[1] = a[2] = -Number.MAX_VALUE
  return a
}

function toAbs (a) {
  a[0] = Math.abs(a[0])
  a[1] = Math.abs(a[1])
  a[2] = Math.abs(a[2])
  return a
}

function xAxis () {
  return [1, 0, 0]
}

function yAxis () {
  return [0, 1, 0]
}

function zAxis () {
  return [0, 0, 1]
}

function toString (a, precision) {
  precision = precision || Math.pow(10, 4)
  var s = '['
  s += Math.floor(a[0] * precision) / precision + ', '
  s += Math.floor(a[1] * precision) / precision + ', '
  s += Math.floor(a[2] * precision) / precision + ']'
  return s
}

function copy (a, out) {
  if (out !== undefined) {
    out[0] = a[0]
    out[1] = a[1]
    out[2] = a[2]
    return out
  }
  return a.slice(0)
}

var Vec3 = {
  create: create,
  set: set,
  set3: set3,
  copy: copy,
  equals: equals,
  equals3: equals3,
  add: add,
  add3: add3,
  sub: sub,
  sub3: sub3,
  scale: scale,
  multMat4: multMat4,
  multQuat: multQuat,
  dot: dot,
  cross: cross,
  cross3: cross3,
  length: length,
  lengthSq: lengthSq,
  normalize: normalize,
  distance: distance,
  distance3: distance3,
  distanceSq: distanceSq,
  distanceSq3: distanceSq3,
  limit: limit,
  invert: invert,
  lerp: lerp,
  toZero: toZero,
  toOne: toOne,
  toMin: toMin,
  toMax: toMax,
  toAbs: toAbs,
  xAxis: xAxis,
  yAxis: yAxis,
  zAxis: zAxis,
  toString: toString
}

module.exports = Vec3

},{}],76:[function(require,module,exports){
function create () {
  return [0, 0, 0, 1]
}

function equals (a, b) {
  return a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3]
}

function equals4 (a, x, y, z, w) {
  return a[0] === x &&
    a[1] === y &&
    a[2] === z &&
    a[3] === w
}

function set (a, b) {
  a[0] = b[0]
  a[1] = b[1]
  a[2] = b[2]
  a[3] = b[3]
  return a
}

function set4 (a, x, y, z, w) {
  a[0] = x
  a[1] = y
  a[2] = z
  a[3] = w
  return a
}

function fromVec3 (a, b) {
  a[0] = b[0]
  a[1] = b[1]
  a[2] = b[2]
  return a
}

function copy (a, out) {
  if (out !== undefined) {
    out[0] = a[0]
    out[1] = a[1]
    out[2] = a[2]
    out[3] = a[3]
    return out
  }
  return a.slice(0)
}

function multMat4 (a, m) {
  var x = a[0]
  var y = a[1]
  var z = a[2]
  var w = a[3]
  a[0] = m[ 0] * x + m[ 4] * y + m[ 8] * z + m[12] * w
  a[1] = m[ 1] * x + m[ 5] * y + m[ 9] * z + m[13] * w
  a[2] = m[ 2] * x + m[ 6] * y + m[10] * z + m[14] * w
  a[3] = m[ 3] * x + m[ 7] * y + m[11] * z + m[15] * w
  return a
}

function lerp (a, b, n) {
  var x = a[0]
  var y = a[1]
  var z = a[2]
  var w = a[3]

  a[0] = x + (b[0] - x) * n
  a[1] = y + (b[1] - y) * n
  a[2] = z + (b[2] - z) * n
  a[3] = w + (b[3] - w) * n

  return a
}

var Vec4 = {
  create: create,
  set: set,
  set4: set4,
  fromVec3: fromVec3,
  multMat4: multMat4,
  copy: copy,
  equals: equals,
  equals4: equals4,
  lerp: lerp
}

module.exports = Vec4

},{}],77:[function(require,module,exports){
var seedrandom = require('seedrandom');
var SimplexNoise = require('simplex-noise');

var simplex = new SimplexNoise(Math.random);

var Random = {};

Random.seed = function(s) {
  Math.seedrandom(s);
  simplex = new SimplexNoise(Math.random);
};

Random.float = function(min, max) {
  if (arguments.length == 0) {
    min = 0;
    max = 1;
  }
  else if (arguments.length == 1) {
    max = min;
    min = 0;
  }
  return min + (max - min) * Math.random();
};

//Using max safe integer as max value unless otherwise specified
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
Random.int = function(min, max) {
  if (arguments.length == 0) {
    min = 0;
    max = Math.pow(2, 53) - 1;
  }
  else if (arguments.length == 1) {
    max = min;
    min = 0;
  }
  return Math.floor(Random.float(min, max));
};

Random.vec2 = function(r) {
  if (typeof r == 'undefined') r = 1;
  var x = 2 * Math.random() - 1;
  var y = 2 * Math.random() - 1;
  var rr = Math.random() * r;
  var len = Math.sqrt(x*x + y*y);
  return [rr * x / len, rr * y / len];
};

Random.vec3 = function(r) {
  if (typeof r == 'undefined') r = 1;
  var x = 2 * Math.random() - 1;
  var y = 2 * Math.random() - 1;
  var z = 2 * Math.random() - 1;
  var rr = Math.random() * r;
  var len = Math.sqrt(x*x + y*y + z*z);
  return [rr * x/len, rr * y/len, rr * z/len];
};

Random.vec2InRect = function(rect) {
  return [rect[0][0] + Math.random() * (rect[1][0] - rect[0][0]), rect[0][1] + Math.random() * (rect[1][1] - rect[0][1])];
};

Random.vec3InAABB = function(bbox) {
  var x = bbox[0][0] + Math.random() * (bbox[1][0] - bbox[0][0]);
  var y = bbox[0][1] + Math.random() * (bbox[1][1] - bbox[0][1]);
  var z = bbox[0][2] + Math.random() * (bbox[1][2] - bbox[0][2]);
  return [x, y, z];
};

Random.chance = function(probability) {
  return Math.random() <= probability;
};

Random.element = function(list) {
  return list[Math.floor(Math.random() * list.length)];
};

Random.noise2 = function(x, y) {
  return simplex.noise2D(x, y);
};

Random.noise3 = function(x, y, z) {
  return simplex.noise3D(x, y, z);
};

Random.noise4 = function(x, y, z, w) {
  return simplex.noise4D(x, y, z, w);
};

module.exports = Random;

},{"seedrandom":101,"simplex-noise":109}],78:[function(require,module,exports){
module.exports = require('./Random');

},{"./Random":77}],79:[function(require,module,exports){
/**
 * Base Event class.
 * @param {String} type - The type
 * @param {Object} [data] - The data
 * @constructor
 * @class
 */
function Event(type, data){
    this._sender = null;
    this._type   = type;
    this._data   = data;

    for(var prop in data) {
        this[prop] = data[prop];
    }

    this._stopPropagation = false;
}
/**
 * Returns a copy of the event.
 * @returns {Event} - copy of this event
 */
Event.prototype.copy = function(){
    var evt = new Event(this._type, this._data);
    evt.setSender(this._sender);
    return evt;
};

/**
 * Stop event from being passed to the subsequent event listenerers
 */
Event.prototype.stopPropagation = function(){
    this._stopPropagation = true;
};

/**
 * @return {EventDispatcher} - dispatcher of the event
 */
Event.prototype.getSender = function(){
    return this._sender;
};

/**
 * Used by the EventDispatcher that dispatches the event.
 * @param  {EventDispatcher} sender - dispatcher of the event
 */
Event.prototype.setSender = function(sender) {
    this._sender = sender;
};

/**
 * @return {String} type of the event
 */
Event.prototype.getType = function(){
    return this._type;
};

module.exports = Event;

},{}],80:[function(require,module,exports){
/**
 * Broadcasts events to registered event listeners.
 * @constructor
 * @class
 */
EventDispatcher = function () {
    this._listeners = {};
};

/**
 * Register an event callback for a certain type.
 * @param {String} type - The event type
 * @param {Function} method - Callback if event is raised
 */

EventDispatcher.prototype.addEventListener = function (type, method) {
    this._listeners[type] = this._listeners[type] || [];
    this._listeners[type].push(method);
};

/**
 * Sends given event to all registered event listeners for that event type
 * @param {Event} event - The event
 */
EventDispatcher.prototype.dispatchEvent = function (event) {
    var type = event.getType();
    if (!this.hasEventListener(type)){
        return;
    }
    event.setSender(this);
    var methods = this._listeners[type];
    var i = -1, l = methods.length;
    while (++i < l) {
        methods[i](event);
        if(event._stopPropagation){
            break;
        }
    }
};

/**
 * Remove a callback from the dispatcher.
 * @param {String} type = The type
 * @param {Function} [method] - The callback to be removed (if not specified, all callbacks will be removed)
 */

EventDispatcher.prototype.removeEventListener = function (type, method) {
    if (!this.hasEventListener(type)){
        return;
    }

    if(method){
        var methods = this._listeners[type];
        var i = methods.length;
        while (--i > -1) {
            if (methods[i] == method) {
                methods.splice(i, 1);
                if (methods.length == 0){
                    delete this._listeners[type];
                }
                break;
            }
        }
        return;
    }
    delete this._listeners[type];
};

/**
 * Completely remove all listeners.
 */

EventDispatcher.prototype.removeAllEventListeners = function () {
    this._listeners = {};
};

/**
 * Returns true there are listeners for a event type.
 * @param {String} type - The type
 * @returns {Boolean}
 */

EventDispatcher.prototype.hasEventListener = function (type) {
    return this._listeners[type] != undefined && this._listeners[type] != null;
};

///**
// * Returns the number of listerners for a certain event type.
// * @returns {*}
// */
//
//EventDispatcher.prototype.getNumListerners = function(){
//    return ObjectUtil.getNumKeys(this._listeners);
//}

module.exports = EventDispatcher;

},{}],81:[function(require,module,exports){
var EventDispatcher = require('./EventDispatcher');
var KeyboardEvent   = require('./KeyboardEvent');

/**
 * EventDispatcher for keyboard events
 * @class
 *
 * @example
 * var Window = require('pex-sys').Window;
 * var KeyboardEvent = require('pex-sys').KeyboardEvent;
 *
 * Window.create({
 * 	 init: function() {
 * 	 	var kbd = this.getKeyboard()
 * 	 	kbd.addEventListener(KeyboardEvent.KEY_DOWN, function(e){ });
 * 	 	kbd.addEventListener(KeyboardEvent.KEY_PRESS, function(e){ });
 * 	 	kbd.addEventListener(KeyboardEvent.KEY_UP, function(e){ });
 * 	 }
 * })
 */
function Keyboard() {
    EventDispatcher.call(this);
}

Keyboard.prototype = Object.create(EventDispatcher.prototype);
Keyboard.prototype.constructor = Keyboard;

/**
 * Fires KEY_DOWN event
 * @protected
 *
 * @param {Object} e            - event data
 * @param {String} e.str        - '' (not used for KEY_DOWN)
 * @param {Number} e.keyCode    - key code (not ASCI code)
 * @param {Boolean} e.altKey    - is alt key pressed?
 * @param {Boolean} e.shiftKey  - is shift key pressed?
 * @param {Boolean} e.ctrlKey   - is ctrl key pressed?
 * @param {Boolean} e.metaKey   - is meta (apple/win) key pressed?
 */
Keyboard.prototype.handleKeyDown = function(e) {
    e.keyboard = this;
    this.dispatchEvent(new KeyboardEvent(KeyboardEvent.KEY_DOWN, e));
}

/**
 * Fires KEY_PRESS event
 * @protected
 *
 * @param {Object} e           - event data
 * @param {String} e.str       - string character representing that key
 * @param {Number} e.keyCode   - key code (not ASCI code)
 * @param {Boolean} e.altKey   - is alt key pressed?
 * @param {Boolean} e.shiftKey - is shift key pressed?
 * @param {Boolean} e.ctrlKey  - is ctrl key pressed?
 * @param {Boolean} e.metaKey  - is meta (apple/win) key pressed?
 */
Keyboard.prototype.handleKeyPress = function(e) {
    e.keyboard = this;
    this.dispatchEvent(new KeyboardEvent(KeyboardEvent.KEY_PRESS, e));
}

/**
 * Fires KEY_UP event
 * @protected
 *
 * @param {Object} e           - event data
 * @param {String} e.str       - '' (not used for KEY_UP)
 * @param {Number} e.keyCode   - key code (not ASCI code)
 * @param {Boolean} e.altKey   - is alt key pressed?
 * @param {Boolean} e.shiftKey - is shift key pressed?
 * @param {Boolean} e.ctrlKey  - is ctrl key pressed?
 * @param {Boolean} e.metaKey  - is meta (apple/win) key pressed?
 */
Keyboard.prototype.handleKeyUp = function(e) {
    e.keyboard = this;
    this.dispatchEvent(new KeyboardEvent(KeyboardEvent.KEY_UP, e));
}

module.exports = Keyboard;

},{"./EventDispatcher":80,"./KeyboardEvent":82}],82:[function(require,module,exports){
var Event = require('./Event');
var isPlask = require('is-plask');

/**
 * Keyboard Event class
 * @property {String} str       - string character representing that key (if any)
 * @property {Number} keyCode   - key code (not ASCI code)
 * @property {Boolean} altKey    - is alt key pressed?
 * @property {Boolean} shiftKey  - is shift key pressed?
 * @property {Boolean} ctrlKey   - is ctrl key pressed?
 * @property {Boolean} metaKey   - is meta (apple/win) key pressed?
 *
 * @param {String} type
 * @param {Object} data            - event data
 * @param {String} data.str        - string character representing that key (if any)
 * @param {Number} data.keyCode    - key code (not ASCI code)
 * @param {Boolean} data.altKey    - is alt key pressed?
 * @param {Boolean} data.shiftKey  - is shift key pressed?
 * @param {Boolean} data.ctrlKey   - is ctrl key pressed?
 * @param {Boolean} data.metaKey   - is meta (apple/win) key pressed?
 */
function KeyboardEvent(type, data) {
    Event.call(this, type, data);
}

KeyboardEvent.prototype = Object.create(Event.prototype);
KeyboardEvent.prototype.constructor = KeyboardEvent;

/**
 * Key down event constant
 * @instance
 */
KeyboardEvent.KEY_DOWN  = 'keydown';

/**
 * Key press event constant
 * @constant
 */
KeyboardEvent.KEY_PRESS = 'keypress';

/**
 * Key up event constant
 * @constant
 */
KeyboardEvent.KEY_UP    = 'keyup';

/**
 * Backspace key code
 * @constant
 */

KeyboardEvent.VK_BACKSPACE  = isPlask ?  51 : 8;

/**
 * Enter key code
 * @constant
 */
KeyboardEvent.VK_ENTER      = isPlask ? 56 : 13;

/**
 * Space key code
 * @constant
 */
KeyboardEvent.VK_SPACE   = isPlask ? 49 : 32;

/**
 * Delete key code
 * @constant
 */
KeyboardEvent.VK_DELETE  = isPlask ? 117 : 46;

/**
 * Tab key code
 * @constant
 */
KeyboardEvent.VK_TAB     = isPlask ? 48 : 9;

/**
 * Escape key code
 * @constant
 */
KeyboardEvent.VK_ESC     = isPlask ? 53 : 27;

/**
 * Up arrow key code
 * @constant
 */
KeyboardEvent.VK_UP      = isPlask ? 126 : 38;

/**
 * Down arrow key code
 * @constant
 */
KeyboardEvent.VK_DOWN    = isPlask ? 125 : 40;

/**
 * Left arrow key code
 * @constant
 */
KeyboardEvent.VK_LEFT    = isPlask ? 123 : 37;

/**
 * Right arrow key code
 * @constant
 */
KeyboardEvent.VK_RIGHT   = isPlask ? 124 : 39;

module.exports = KeyboardEvent;

},{"./Event":79,"is-plask":15}],83:[function(require,module,exports){
var EventDispatcher = require('./EventDispatcher');
var MouseEvent      = require('./MouseEvent');

/**
 * EventDispatcher for mouse events
 * @class
 *
 * @example
 * var Window = require('pex-sys').Window;
 * var MouseEvent = require('pex-sys').MouseEvent;
 *
 * Window.create({
 * 	 init: function() {
 * 	 	var mouse = this.getMouse()
 * 	 	mouse.addEventListener(MouseEvent.MOUSE_DOWN, function(e){ });
 * 	 	mouse.addEventListener(MouseEvent.MOUSE_UP, function(e){ });
 * 	 	mouse.addEventListener(MouseEvent.MOUSE_MOVE, function(e){ });
 * 	 	mouse.addEventListener(MouseEvent.MOUSE_DRAG, function(e){ });
 * 	 	mouse.addEventListener(MouseEvent.MOUSE_SCROLL, function(e){ });
 * 	 }
 * })
 */
function Mouse() {
    EventDispatcher.call(this);

    this._x = 0;
    this._y = 0;
    this._prevX = 0;
    this._prevY = 0;
    this._deltaX = 0;
    this._deltaY = 0;
    this._isDown = false;
}

Mouse.prototype = Object.create(EventDispatcher.prototype);
Mouse.prototype.constructor = Mouse;

/**
 * @return {Number} mouse x position
 */
Mouse.prototype.getPosX = function() {
    return this._x;
};

/**
 * @return {Number} mouse y position
 */
Mouse.prototype.getPosY = function() {
    return this._y;
};

/**
 * @return {Array} mouse position as [x, y]
 */
Mouse.prototype.getPos = function(out){
    if(out === undefined){
        return [this._x,this._y];
    }
    out[0] = this._x;
    out[1] = this._y;
    return out;
};

/**
 * @return {Number} previous mouse x position
 */
Mouse.prototype.getPrevPosX = function() {
    return this._prevX;
};

/**
 * @return {Number} previous mouse y position
 */
Mouse.prototype.getPrevPosY = function() {
    return this._prevY;
};

/**
 * @return {Array} previous mouse position as [x, y]
 */
Mouse.prototype.getPrevPos = function(out){
    if(out === undefined){
        return [this._prevX,this._prevY];
    }
    out[0] = this._prevX;
    out[1] = this._prevY;
    return out;
};

/**
 * @return {Number} the difference between current and the last position on the x axis
 */
Mouse.prototype.getDeltaX = function() {
    return this._deltaX;
};

/**
 * @return {Number} the difference between current and the last position on the y axis
 */
Mouse.prototype.getDeltaY = function() {
    return this._deltaY;
};

/**
 * @return {Array} the difference between current and the last position as [x,y]
 */
Mouse.prototype.getDelta = function(out){
    if(out === undefined){
        return [this._deltaX,this._deltaY];
    }
    out[0] = this._deltaX;
    out[1] = this._deltaY;
    return out;
};

/**
 * Fires MOUSE_DOWN event
 * @protected
 *
 * @param {Object} e            - event data
 * @param {String} e.x          - mouse x position
 * @param {Number} e.y          - mouse y position
 * @param {Boolean} e.altKey    - is alt key pressed?
 * @param {Boolean} e.shiftKey  - is shift key pressed?
 * @param {Boolean} e.ctrlKey   - is ctrl key pressed?
 * @param {Boolean} e.metaKey   - is meta (apple/win) key pressed?
 */
Mouse.prototype.handleMouseDown = function(e) {
    this._isDown = true;
    e.mouse = this;
    this.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_DOWN, e));
}

/**
 * Fires MOUSE_UP event
 * @protected
 *
 * @param {Object} e            - event data
 * @param {String} e.x          - mouse x position
 * @param {Number} e.y          - mouse y position
 * @param {Boolean} e.altKey    - is alt key pressed?
 * @param {Boolean} e.shiftKey  - is shift key pressed?
 * @param {Boolean} e.ctrlKey   - is ctrl key pressed?
 * @param {Boolean} e.metaKey   - is meta (apple/win) key pressed?
 */
Mouse.prototype.handleMouseUp = function(e) {
    this._isDown = false;
    e.mouse = this;
    this.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_UP, e));
}

/**
 * Fires MOUSE_MOVE event
 * @protected
 *
 * @param {Object} e            - event data
 * @param {String} e.x          - mouse x position
 * @param {Number} e.y          - mouse y position
 * @param {Boolean} e.altKey    - is alt key pressed?
 * @param {Boolean} e.shiftKey  - is shift key pressed?
 * @param {Boolean} e.ctrlKey   - is ctrl key pressed?
 * @param {Boolean} e.metaKey   - is meta (apple/win) key pressed?
 */
Mouse.prototype.handleMouseMove = function(e) {
    this._prevX = this._x;
    this._prevY = this._y;
    this._x = e.x;
    this._y = e.y;
    this._deltaX = this._x - this._prevX;
    this._deltaY = this._y - this._prevY;

    e.mouse = this;

    //don't fire mouse move events while dragging
    if (this._isDown) {
        this.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_DRAG, e));
    }
    else {
        this.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_MOVE, e));
    }
}

/**
 * Fires MOUSE_SCROLL event
 * @protected
 *
 * @param {Object} e            - event data
 * @param {String} e.dx         - amount of scroll in x direction
 * @param {Number} e.dy         - amount of scroll in y direction
 * @param {Boolean} e.altKey    - is alt key pressed?
 * @param {Boolean} e.shiftKey  - is shift key pressed?
 * @param {Boolean} e.ctrlKey   - is ctrl key pressed?
 * @param {Boolean} e.metaKey   - is meta (apple/win) key pressed?
 */
Mouse.prototype.handleMouseScroll = function(e) {
    e.mouse = this;
    this.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_SCROLL, e));
}

module.exports = Mouse;

},{"./EventDispatcher":80,"./MouseEvent":84}],84:[function(require,module,exports){
var Event = require('./Event');

/**
 * Mouse event
 * @class
 * @param {String} type
 * @param {Object} data
 * @param {Number} data.x         - x mouse position
 * @param {Number} data.y         - y mouse position
 * @param {Boolean} data.altKey    - is alt key pressed?
 * @param {Boolean} data.shiftKey  - is shift key pressed?
 * @param {Boolean} data.ctrlKey   - is ctrl key pressed?
 * @param {Boolean} data.metaKey   - is meta (apple/win) key pressed?
 */
function MouseEvent(type, data) {
    Event.call(this, type, data);
}

MouseEvent.prototype = Object.create(Event.prototype);
MouseEvent.prototype.constructor = MouseEvent;

/**
 * Mouse down event constat
 * @constant
 */
MouseEvent.MOUSE_DOWN   = 'mousedown';

/**
 * Mouse down event constat
 * @constant
 */
MouseEvent.MOUSE_UP     = 'mouseup';

/**
 * Mouse down event constat
 * @constant
 */
MouseEvent.MOUSE_MOVE   = 'mousemove';

/**
 * Mouse down event constat
 * @constant
 */
MouseEvent.MOUSE_DRAG   = 'mousedrag';

/**
 * Mouse scroll event constat
 * @constant
 */
MouseEvent.MOUSE_SCROLL = 'mousescroll';

module.exports = MouseEvent;

},{"./Event":79}],85:[function(require,module,exports){
var io = require('pex-io');

/**
 * ResourceLoader class
 * @class
 */
var ResourceLoader = {
}

/**
 * Load provided resources
 * @param   {Object} resources - map of resources, see example
 * @param   {Function} callback function(err, resources), see example
 * @returns {Object}   - with same properties are resource list but resolved to the actual data
 *
 * @example
 * var glslify = require('glslify-promise');
 * var resources = {
 *     vert    : { glsl: glslify(__dirname + '/shader.vert') },
 *     frag    : { glsl: glslify(__dirname + '/shader.frag') },
 *     img     : { image: __dirname + '/tex.jpg', crossOrigin: true/false},
 *     hdrImg  : { binary: __dirname + '/tex.hdr'}
 *     data    : { json: __dirname + '/data.json'},
 *     hello   : { text: __dirname + '/hello.txt'}
 * };
 * Resource.load(resources, function(err, res) {
 * 	  res.vert   //{Promise}
 * 	  res.frag   //{Promise}
 * 	  res.img    //{Image} in a Browser or {SkCanvas} in Plask
 * 	  res.hdrImg //{ArrayBuffer}
 * 	  res.data   //{JSON}
 * 	  res.hello  //{String}
 * })
 */
ResourceLoader.load = function(resources, callback) {
    var results = {};
    var errors = {};
    var hadErrors = false;

    //TODO: use `async` module instead?
    var loadedResources = 0;
    var resourceNames = Object.keys(resources);
    var numResources = resourceNames.length;

    function onFinish() {
        if (hadErrors) {
            callback(errors, null);
        }
        else {
            callback(null, resources);
        }
    }

    resourceNames.forEach(function(name) {
        function onLoaded(err, data) {
            if (err) {
                hadErrors = true;
                errors[name] = err;
            }
            else {
                resources[name] = data;
            }

            if (++loadedResources == numResources) {
                onFinish();
            }
        }

        var res = resources[name];
        if (res.image) {
            io.loadImage(res.image, onLoaded, res.crossOrigin);
        }
        else if (res.text) {
            io.loadText(res.text, onLoaded);
        }
        else if (res.json) {
            io.loadJSON(res.json, onLoaded);
        }
        else if (res.binary) {
            io.loadBinary(res.binary, onLoaded);
        }
        else if (res.glsl) {
            res.glsl.then(function(glslString) {
                //Escape promise catch-all-errors sinkhole
                setTimeout(function() {
                    onLoaded(null, glslString);
                }, 1);
            }).catch(function(e) {
                onLoaded(e, null);
            })
        }
        else {
            onLoaded('ResourceLoader.load unknown resource type ' + Object.keys(res), null);
        }
    });

    if (resourceNames.length == 0) {
        onFinish();
    }
}



module.exports = ResourceLoader;

},{"pex-io":64}],86:[function(require,module,exports){
var isPlask  = require('is-plask');
var plask    = require('plask-wrap')

/**
 * Singleton for retrieving information about available screens / displays
 */
var Screen = {
    /**
     * @return {Number} number of screens
     */
    getNumScreens: function() {
        if (isPlask) {
            return plask.Window.screensInfo().length;
        }
        else {
            return 1;
        }

        return this._screens;
    },
    /**
     *
     * @param  {Number} screenId - id of the screen we query about
     * @return {Number}          - width of the given screen in px
     */
    getWidth: function(screenId) {
        screenId = screenId || 0;

        if (isPlask) {
            return plask.Window.screensInfo()[screenId].width;
        }
        else {
            return window.innerWidth;
        }
    },
    /**
     *
     * @param  {Number} screenId - id of the screen we query about
     * @return {Number}          - height of the given screen in px
     */
    getHeight: function(screenId) {
        screenId = screenId || 0;

        if (isPlask) {
            return plask.Window.screensInfo()[screenId].height;
        }
        else {
            return window.innerHeight;
        }
    },
    /**
     *
     * @param  {Number} screenId - id of the screen we query about
     * @return {Number}          - device pixel ratio of the given screen (e.g. 2 for retina)
     */
    getDevicePixelRatio: function(screenId) {
        screenId = screenId || 0;

        if (isPlask) {
            return plask.Window.screensInfo()[screenId].highdpi;
        }
        else {
            return window.devicePixelRatio;
        }
    }
};


module.exports = Screen;

},{"is-plask":15,"plask-wrap":94}],87:[function(require,module,exports){
/**
 * Time class
 * @class
 */
function Time() {
    this._start = 0;
    this._now = 0;
    this._prev = 0;
    this._delta = 0;
    this._deltaSeconds = 0;
    this._elapsedSeconds = 0;
    this._frames = -1;
    this._stopped = false;

    this._fpsUpdateFrequency = 1000; //1s
    this._fpsFrames = 0;
    this._fpsTime = 0;
    this._fps = 0;
}

/**
 * Update time. Used by a Window instance.
 * @protected
 * @param  {Number} now - current time in miliseconds
 */
Time.prototype._update = function(now) {
    this._prev = this._now;
    this._now = now;
    this._delta = this._now - this._prev;

    this._deltaSeconds = this._delta / 1000;
    this._elapsedSeconds = (this._now - this._start) / 1000;

    this._frames++;

    if (this._fpsTime > this._fpsUpdateFrequency) {
        this._fps = Math.floor(this._fpsFrames / (this._fpsTime / 1000)*10)/10;
        this._fpsTime = 0;
        this._fpsFrames = 0;
    }
    else {
        this._fpsTime += this._delta;
        this._fpsFrames++;
    }
}

/**
 * Stops updating the time. Used by a Window instance.
 * @protected
 */
Time.prototype._stop = function() {
    this._stopped = true;
    this._delta = 0;
    this._deltaSeconds = 0;

    this._fpsFrames = 0;
    this._fpsTime = 0;
    this._fps = 0;
}

/**
 * Restarts counting the time. Used by a Window instance.
 * @protected
 */
Time.prototype._restart = function(now) {
    now = now || 0
    this._start = now;
    this._now = now;
    this._prev = now;
    this._delta = 0;
    this._frames = 0;
    this._stopped = false;
    this._deltaSeconds = 0;
    this._elapsedSeconds = 0;

    this._fpsFrames = 0;
    this._fpsTime = 0;
    this._fps = 0;
}

/**
 * Resumes counting the time. Used by a Window instance.
 * @protected
 */
Time.prototype._resume = function(now) {
    this._now = now;
    this._prev = now;
    this._delta = 0;
    this._stopped = false;

    this._fpsFrames = 0;
    this._fpsTime = 0;
    this._fps = 0;
}

/**
 * Get frame delta time in miliseconds
 * @return {Number}
 */
Time.prototype.getDelta = function() {
    return this._delta;
}

/**
 * Get frame delta time in seconds
 * @return {Number}
 */
Time.prototype.getDeltaSeconds = function() {
    return this._deltaSeconds;
}

/**
 * Get number of seconds since the start of this Timer
 * @return {Number}
 */
Time.prototype.getElapsedSeconds = function() {
    return this._elapsedSeconds;
}

/**
 * Get number of frames since the start of this Timer
 * @return {Number}
 */
Time.prototype.getElapsedFrames = function() {
    return this._frames;
}

/**
 * Get average frames per seconds
 * @return {Number}
 */
Time.prototype.getFPS = function() {
    return this._fps;
}

module.exports = Time;

},{}],88:[function(require,module,exports){
(function (process){
var Context           = require('pex-context/Context');
var isPlask           = require('is-plask');
var EventDispatcher   = require('./EventDispatcher');
var WindowEvent       = require('./WindowEvent');
var ResourceLoader    = require('./ResourceLoader');
var WindowImpl        = isPlask ? require('./WindowImplPlask') : require('./WindowImplBrowser');
var Time              = require('./Time');
var Mouse             = require('./Mouse');
var MouseEvent        = require('./MouseEvent');
var Keyboard          = require('./Keyboard');
var KeyboardEvent     = require('./KeyboardEvent');

var current = null;

var ListenerCallbackMethod = {
    MOUSE_DOWN    : 'onMouseDown',
    MOUSE_UP      : 'onMouseUp',
    MOUSE_DRAG    : 'onMouseDrag',
    MOUSE_MOVE    : 'onMouseMove',
    MOUSE_SCROLL  : 'onMouseScroll',
    KEY_DOWN      : 'onKeyDown',
    KEY_PRESS     : 'onKeyPress',
    KEY_UP        : 'onKeyUp',
    WINDOW_RESIZE : 'onWindowResize'
};

function Window(){
    EventDispatcher.call(this);

    this._impl = null;

    this._ctx = null;
    this._resources = {};

    this._time = new Time();
    this._mouse = new Mouse();
    this._keyboard = new Keyboard();
}

Window.prototype = Object.create(EventDispatcher.prototype);
Window.prototype.constructor = Window;

Window.prototype.setSize = function(width,height,pixelRatio){
    this._impl.setSize(width,height,pixelRatio);

    this.dispatchEvent(new WindowEvent(WindowEvent.WINDOW_RESIZE, {
        width  : this.getWidth(),
        height : this.getHeight(),
        pixelRatio: this.getPixelRatio()
    }))
};

/**
 * Get current window (or canvas) size
 * @param {Array} array to put data into
 * @return {Array} [width, height]
 */
Window.prototype.getSize = function(out){
    out = out || new Array(2);
    out[0] = this._impl.width;
    out[1] = this._impl.height;
    return out;
};

/**
 * Get current window (or canvas) width in px
 * @return {Number}
 */
Window.prototype.getWidth = function(){
    return this._impl.width;
};

/**
 * Get current window (or canvas) height in px
 * @return {Number}
 */
Window.prototype.getHeight = function(){
    return this._impl.height;
};

/**
 * Get current window (or canvas) aspect ratio
 * @return {Number}
 */
Window.prototype.getAspectRatio = function(){
    return this._impl.width / this._impl.height;
};

Window.prototype.getPixelRatio = function(){
    return this._impl.pixelRatio;
};

/**
 * Get current window (or canvas) bounds
 * @param {Array} array to put data into
 * @return {Array} [0, 0, width, height]
 */
Window.prototype.getBounds = function(out){
    out = out || new Array(4);
    out[0] = out[1] = 0;
    out[2] = this.getWidth();
    out[3] = this.getHeight();
    return out;
};

Window.prototype.setFullScreen = function(enable){
    this._impl.setFullScreen(enable);
};

Window.prototype.isFullScreen = function(){
    return this._impl.fullScreen;
};

Window.prototype.toggleFullScreen = function(){
    this.isFullScreen() ? this.setFullScreen(false) : this.setFullScreen(true);
};

/**
 * Get WebGL Context instance associated with this window or canvas
 * @return {Context}
 */
Window.prototype.getContext = function(){
    return this._ctx;
};

/**
 * Get loaded resources
 * @return {Object} @see ResourceLoader
 */
Window.prototype.getResources = function(){
    return this._resources;
};

/**
 * Get Time instance associated with this window or canvas
 * @return {Time}
 */
Window.prototype.getTime = function(){
    return this._time;
};

/**
 * Get Mouse instance associated with this window or canvas
 * @return {Mouse}
 */
Window.prototype.getMouse = function(){
    return this._mouse;
};

/**
 * Get Keyboard instance associated with this window or canvas
 * @return {Keyboard}
 */
Window.prototype.getKeyboard = function(){
    return this._keyboard;
};

Window.prototype._addEventListener = Window.prototype.addEventListener;

/**
 * Helper method for registering multiple event listeners at once
 * @param  {Object|String} listenerObjOrType
 * @param  {Function} listenerObjOrType.onMouseDown
 * @param  {Function} listenerObjOrType.onMouseUp
 * @param  {Function} listenerObjOrType.onMouseDrag
 * @param  {Function} listenerObjOrType.onMouseMove
 * @param  {Function} listenerObjOrType.onMouseScroll
 * @param  {Function} listenerObjOrType.onKeyDown
 * @param  {Function} listenerObjOrType.onKeyPress
 * @param  {Function} listenerObjOrType.onKeyUp
 * @param  {Function} listenerObjOrType.onWindowResize
 * @param  {Function} [calback] callback function requried type is String
 */
Window.prototype.addEventListener = function(listenerObjOrType, method){
    if(method === undefined){
        if(listenerObjOrType === null || typeof listenerObjOrType !== 'object'){
            throw new Error('Invalid listener object.');
        }
        var mouse    = this._mouse;
        var keyboard = this._keyboard;
        for(var p in listenerObjOrType){
            if(typeof listenerObjOrType[p] !== 'function'){
                continue;
            }
            var func = listenerObjOrType[p];
            switch (p){
                case ListenerCallbackMethod.MOUSE_DOWN :
                    mouse.addEventListener(MouseEvent.MOUSE_DOWN,func.bind(listenerObjOrType));
                    break;
                case ListenerCallbackMethod.MOUSE_UP :
                    mouse.addEventListener(MouseEvent.MOUSE_UP,func.bind(listenerObjOrType));
                    break;
                case ListenerCallbackMethod.MOUSE_DRAG :
                    mouse.addEventListener(MouseEvent.MOUSE_DRAG,func.bind(listenerObjOrType));
                    break;
                case ListenerCallbackMethod.MOUSE_MOVE :
                    mouse.addEventListener(MouseEvent.MOUSE_MOVE,func.bind(listenerObjOrType));
                    break;
                case ListenerCallbackMethod.MOUSE_SCROLL:
                    mouse.addEventListener(MouseEvent.MOUSE_SCROLL,func.bind(listenerObjOrType));
                    break;
                case ListenerCallbackMethod.KEY_DOWN :
                    keyboard.addEventListener(KeyboardEvent.KEY_DOWN,func.bind(listenerObjOrType));
                    break;
                case ListenerCallbackMethod.KEY_PRESS :
                    keyboard.addEventListener(KeyboardEvent.KEY_PRESS,func.bind(listenerObjOrType));
                    break;
                case ListenerCallbackMethod.KEY_UP :
                    keyboard.addEventListener(KeyboardEvent.KEY_UP,func.bind(listenerObjOrType));
                    break;
                case ListenerCallbackMethod.WINDOW_RESIZE :
                    this.addEventListener(WindowEvent.WINDOW_RESIZE, func.bind(listenerObjOrType));
                    break;
            }
        }
        return;
    }

    this._addEventListener(listenerObjOrType,method);
};

/**
 * Create new window instance
 * @param  {Object} obj
 * @param  {Object} [obj.resources] - resources to load before init using @see ResourceLoader
 * @param  {Object} obj.init - Function called once after the resources finised loading and WebGL context has been created.
 * @param  {Object} obj.draw - Function called every frame
 */
Window.create = function(obj){
    var window = new Window();

    for(var p in obj){
        window[p] = obj[p];
    }

    window.resources = window.resources || {};

    var settings = obj.settings;

    settings.width      = settings.width  || 1280;
    settings.height     = settings.height || 720;
    settings.pixelRatio = settings.pixelRatio || 1;
    settings.fullScreen = settings.fullScreen || false;
    settings.debug      = settings.debug || false;

    function initWindowImpl(){
        var mouse = window._mouse;
        var keyboard = window._keyboard;

        //Wait with adding event listeners until the app initializes
        //This allow a GUI or an Arcball controller to get priority over e.g. onMouseDown
        function addWindowEventListeners() {
            if(window.onMouseDown){
                mouse.addEventListener(MouseEvent.MOUSE_DOWN, window.onMouseDown.bind(window));
            }
            if(window.onMouseUp){
                mouse.addEventListener(MouseEvent.MOUSE_UP, window.onMouseUp.bind(window));
            }
            if(window.onMouseMove){
                mouse.addEventListener(MouseEvent.MOUSE_MOVE, window.onMouseMove.bind(window));
            }
            if(window.onMouseDrag){
                mouse.addEventListener(MouseEvent.MOUSE_DRAG, window.onMouseDrag.bind(window));
            }
            if(window.onMouseScroll){
                mouse.addEventListener(MouseEvent.MOUSE_SCROLL, window.onMouseScroll.bind(window));
            }


            if(window.onKeyDown){
                keyboard.addEventListener(KeyboardEvent.KEY_DOWN, window.onKeyDown.bind(window));
            }
            if(window.onKeyPress){
                keyboard.addEventListener(KeyboardEvent.KEY_PRESS, window.onKeyPress.bind(window));
            }
            if(window.onKeyUp){
                keyboard.addEventListener(KeyboardEvent.KEY_UP, window.onKeyUp.bind(window));
            }
            if(window.onWindowResize) {
                window.addEventListener(WindowEvent.WINDOW_RESIZE, window.onWindowResize.bind(window));
            }
        }

        var impl = WindowImpl.create(window, settings);

        impl.addEventListener(WindowEvent.WINDOW_RESIZE, function(e) {
            window.dispatchEvent(new WindowEvent(WindowEvent.WINDOW_RESIZE, e))
        });

        impl.addEventListener(WindowEvent.WINDOW_READY, function() {
            // start counting from init, not from window creation
            window._time._restart()
            if (settings.debug) {
                try {
                    window.init();
                }
                catch (e) {
                    console.log('Window.init error:', e);
                    console.log('Window.init error stack:', e.stack);
                    if (isPlask) {
                        process.exit(-1)
                    }
                }
            }
            else {
                window.init()
            }
            addWindowEventListeners();
        }.bind(this));

        window._impl = impl;
    }

    ResourceLoader.load(window.resources, function(err, res){
        if(err){
            console.log('Window.create failed loading resources');
            console.log(err);
        }
        else {
            window._resources = res;
            delete window.resources;

            initWindowImpl();
        }
    });
};

module.exports = Window;

}).call(this,require('_process'))
},{"./EventDispatcher":80,"./Keyboard":81,"./KeyboardEvent":82,"./Mouse":83,"./MouseEvent":84,"./ResourceLoader":85,"./Time":87,"./WindowEvent":89,"./WindowImplBrowser":91,"./WindowImplPlask":92,"_process":95,"is-plask":15,"pex-context/Context":28}],89:[function(require,module,exports){
var Event = require('./Event');

function WindowEvent(type, data){
    Event.call(this, type, data);
}

WindowEvent.prototype = Object.create(Event.prototype);
WindowEvent.prototype.constructor = WindowEvent;

WindowEvent.WINDOW_RESIZE = 'windowresize';
WindowEvent.WINDOW_READY = 'windowready';

module.exports = WindowEvent;

},{"./Event":79}],90:[function(require,module,exports){
var EventDispatcher   = require('./EventDispatcher');

function WindowImpl() {
    EventDispatcher.call(this);
    this.width = 0;
    this.height = 0;
    this.fullScreen = false;
    this.pixelRatio = 1;
}

WindowImpl.prototype = Object.create(EventDispatcher.prototype);

WindowImpl.prototype.setSize = function(width,height,pixelRatio){};

WindowImpl.prototype.setFullScreen = function(enable){};

module.exports = WindowImpl;

},{"./EventDispatcher":80}],91:[function(require,module,exports){
var raf         = require('raf');

var WindowImpl  = require('./WindowImpl');
var Context     = require('pex-context/Context');
var WindowEvent       = require('./WindowEvent');
var WebGLDebugUtils   = require('webgl-debug');

var WebGLContextNames = [
    'experimental-webgl',
    'webgl'
];

var DefaultWebGLContextOptions = {
    alpha                           : false,
    depth                           : true,
    stencil                         : false,
    antialias                       : true,
    premultipliedAlpha              : true,
    preserveDrawingBuffer           : false,
    preferLowPowerToHighPerformance : false,
    failIfMajorPerformanceCaveat    : false
};

var isiOS9 = function() {
    var deviceAgent = navigator.userAgent.toLowerCase();
    return /(iphone|ipod|ipad).* os 9_/.test(deviceAgent);
};

function getWebGLContext(canvas, contextOptions) {
    var gl = null;
    for(var i=0; i<WebGLContextNames.length; i++) {
        try {
            gl = canvas.getContext(WebGLContextNames[i], contextOptions);
            if (gl) {
                break;
            }
        }
        catch (err) {
        }
    }
    return gl;
}

function setCanvasSize(canvas,width,height,pixelRatio){
    pixelRatio = pixelRatio === undefined ? 1 : pixelRatio;

    canvas.width  = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width  = width  + 'px';
    canvas.style.height = height + 'px';
}

function WindowImplBrowser(){
    WindowImpl.call(this);
    this.canvas = null;
}

WindowImplBrowser.prototype = Object.create(WindowImpl.prototype);
WindowImplBrowser.prototype.constructor = WindowImplBrowser;

WindowImplBrowser.prototype.setSize = function(width,height,pixelRatio){
    pixelRatio = pixelRatio === undefined ? this.pixelRatio : pixelRatio;

    setCanvasSize(this.canvas, width, height, pixelRatio);
    this.width  = width * pixelRatio;
    this.height = height * pixelRatio;
    this.pixelRatio = pixelRatio;
};

WindowImplBrowser.prototype.setFullScreen = function(enable){
    var isDocumentFullScreen = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;

    if((enable && this.fullScreen && isDocumentFullScreen) ||
        (!enable && !this.fullScreen && !isDocumentFullScreen)){
        return;
    }

    if(enable){
        var canvas = this.canvas;
        this.fullScreen = true;

        if(canvas.requestFullScreen){
            canvas.requestFullScreen();
        }
        else if(canvas.webkitRequestFullScreen){
            canvas.webkitRequestFullScreen();
        }
        else if(canvas.mozRequestFullScreen){
            canvas.mozRequestFullScreen();
        }
    }
    else {
        this.fullScreen = false;

        if(document.exitFullscreen){
            document.exitFullscreen();
        }
        else if(document.webkitExitFullscreen){
            document.webkitExitFullscreen();
        }
        else if(document.mozCancelFullScreen){
            document.mozCancelFullScreen();
        }
    }
};

WindowImplBrowser.create = function(windowPex,settings){
    var canvas  = settings.canvas || document.createElement('canvas');

    var width, height;
    var pixelRatio = settings.pixelRatio || 1;
    if(settings.fullScreen){
        width = isiOS9 ? document.documentElement.clientWidth : window.innerWidth;
        height = isiOS9 ? document.documentElement.clientHeight : window.innerHeight;
    }
    else {
        width  = settings.width;
        height = settings.height;
    }


    var impl = new WindowImplBrowser();
    impl.canvas = canvas;
    impl.setSize(width,height,pixelRatio);

    var mouse = windowPex._mouse;

    impl.canvas.addEventListener('mousedown', function(e) {
        mouse.handleMouseDown({
            x        : e.offsetX * pixelRatio,
            y        : e.offsetY * pixelRatio,
            altKey   : e.altKey,
            shiftKey : e.shiftKey,
            ctrlKey  : e.ctrlKey,
            metaKey  : e.metaKey
        });
    });

    impl.canvas.addEventListener('mouseup', function(e) {
        mouse.handleMouseUp({
            x        : e.offsetX * pixelRatio,
            y        : e.offsetY * pixelRatio,
            altKey   : e.altKey,
            shiftKey : e.shiftKey,
            ctrlKey  : e.ctrlKey,
            metaKey  : e.metaKey
        });
    });

    impl.canvas.addEventListener('mousemove', function(e) {
        mouse.handleMouseMove({
            x        : e.offsetX * pixelRatio,
            y        : e.offsetY * pixelRatio,
            altKey   : e.altKey,
            shiftKey : e.shiftKey,
            ctrlKey  : e.ctrlKey,
            metaKey  : e.metaKey
        });
    });

    var lastTouch = null;
    impl.canvas.addEventListener('touchstart', function(e) {
        var touches = Array.prototype.slice.call(e.touches).map(function(touch) {
            touch.x = touch.clientX * pixelRatio;
            touch.y = touch.clientY * pixelRatio;
            return touch;
        })
        lastTouch = touches[0];
        mouse.handleMouseDown({
            x        : touches[0].x,
            y        : touches[0].y,
            altKey   : false,
            shiftKey : false,
            ctrlKey  : false,
            metaKey  : false,
            touches  : touches
        });
        e.preventDefault();
        e.stopPropagation();
        return false;
    })

    impl.canvas.addEventListener('touchend', function(e) {
        var touches = Array.prototype.slice.call(e.touches).map(function(touch) {
            touch.x = touch.clientX * pixelRatio;
            touch.y = touch.clientY * pixelRatio;
            return touch;
        })
        mouse.handleMouseUp({
            x        : lastTouch.x,
            y        : lastTouch.y,
            altKey   : false,
            shiftKey : false,
            ctrlKey  : false,
            metaKey  : false,
            touches  : touches
        });
        lastTouch = null;
        e.preventDefault();
        e.stopPropagation();
        return false;
    })

    impl.canvas.addEventListener('touchmove', function(e) {
        var touches = Array.prototype.slice.call(e.touches).map(function(touch) {
            touch.x = touch.clientX * pixelRatio;
            touch.y = touch.clientY * pixelRatio;
            return touch;
        })
        mouse.handleMouseMove({
            x        : touches[0].x,
            y        : touches[0].y,
            altKey   : false,
            shiftKey : false,
            ctrlKey  : false,
            metaKey  : false,
            touches  : touches
        });
        e.preventDefault();
        e.stopPropagation();
        return false;
    })

    var mouseWheelEvent = /Firefox/i.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel';
    //FIXME: horizontal scroll in the browser? What is .detail?
    window.addEventListener(mouseWheelEvent, function(e) {
        var dx = 0;
        var dy = e.wheelDelta / 10 || -e.detail / 10;
        mouse.handleMouseScroll({
            dx       : dx,
            dy       : dy,
            altKey   : e.altKey,
            shiftKey : e.shiftKey,
            ctrlKey  : e.ctrlKey,
            metaKey  : e.metaKey
        });
    });

    var keyboard = windowPex._keyboard;

    window.addEventListener('keydown', function(e) {
        keyboard.handleKeyDown({
            str      : '',
            keyCode  : e.keyCode,
            altKey   : e.altKey,
            shiftKey : e.shiftKey,
            ctrlKey  : e.ctrlKey,
            metaKey  : e.metaKey
        });
    });

    window.addEventListener('keypress', function(e) {
        keyboard.handleKeyPress({
            str      : String.fromCharCode(e.charCode),
            keyCode  : e.keyCode,
            altKey   : e.altKey,
            shiftKey : e.shiftKey,
            ctrlKey  : e.ctrlKey,
            metaKey  : e.metaKey
        });
    });

    window.addEventListener('keyup', function(e) {
        keyboard.handleKeyUp({
            str      : '',
            keyCode  : e.keyCode,
            altKey   : e.altKey,
            shiftKey : e.shiftKey,
            ctrlKey  : e.ctrlKey,
            metaKey  : e.metaKey
        });
    });

    window.addEventListener('resize', function(e) {
        e.width = isiOS9 ? document.documentElement.clientWidth : window.innerWidth;
        e.height = isiOS9 ? document.documentElement.clientHeight : window.innerHeight;
        if(settings.fullScreen) {
            impl.setSize(e.width, e.height, settings.pixelRatio);
        }

        impl.dispatchEvent(new WindowEvent(WindowEvent.WINDOW_RESIZE, e));
    });

    function drawLoop(now){
        windowPex._time._update(now);
        if (settings.debug) {
            try {
                windowPex.draw();
                raf(drawLoop);
            }
            catch(e) {
                console.log(e);
                console.log(e.stack);
            }
        }
        else {
            windowPex.draw()
            raf(drawLoop);
        }
    }

    function go(){
        if (!settings.canvas) {
            //we careted new canvas, so we need to add it to the DOM
            document.body.appendChild(canvas);
        }

        impl.width    = width * pixelRatio;
        impl.height   = height * pixelRatio;
        impl.pixelRatio = pixelRatio;

        if (settings.type == '2d') {
            windowPex._ctx = canvas.getContext('2d');
        }
        else {
            var options = Object.assign({}, DefaultWebGLContextOptions, settings);

            var gl = getWebGLContext(canvas,options);
            if(gl === null){
                throw new Error('WindowImplBrowser: No WebGL context is available.');
            }

            if (settings.debug) {
                function throwOnGLError(err, funcName, args) {
                    throw new Error('WindowImplBrowser ' + WebGLDebugUtils.glEnumToString(err) + " was caused by call to " + funcName);
                };
                gl = WebGLDebugUtils.makeDebugContext(gl, throwOnGLError);
            }

            windowPex._ctx = new Context(gl);
        }

        setTimeout(function() {
            impl.dispatchEvent(new WindowEvent(WindowEvent.WINDOW_READY, {}));
            drawLoop(0);
        }, 1)
    }

    if(!canvas.parentNode){
        //Window already loaded, or script inside body
        if (document.body) {
            go();
        }
        //Wait for window to load
        else {
            window.addEventListener('load',function(){
                go();
            },false);
        }
    }
    else{
        //Canvas element node already attached, ready to go
        go();
    }

    return impl;
};

module.exports = WindowImplBrowser;

},{"./WindowEvent":89,"./WindowImpl":90,"pex-context/Context":28,"raf":96,"webgl-debug":110}],92:[function(require,module,exports){
(function (process){
var plask      = require('plask-wrap');
var now        = require("performance-now");
var WindowImpl = require('./WindowImpl');
var WindowEvent = require('./WindowEvent');
var Context    = require('pex-context/Context');
var omgcanvas  = require('omgcanvas');
var WebGLDebugUtils   = require('webgl-debug');

var Screen = require('./Screen');

function WindowImplPlask(){
    WindowImpl.call(this);

    this.plaskObj = null;
    this.title = '';
}

WindowImplPlask.prototype = Object.create(WindowImpl.prototype);
WindowImplPlask.prototype.constructor = WindowImplPlask;

WindowImplPlask.prototype.setFullScreen = function(){
    this.fullScreen = !this.fullScreen;
    this.plaskObj.setFullscreen(this.fullScreen);
};

WindowImplPlask.create = function(windowPex,settings){
    settings.type = settings.type || '3d';
    settings.multisample = settings.multisample === undefined ? true : settings.multisample;
    settings.title = settings.title || 'pex';
    settings.fullscreen = settings.fullScreen || false;

    var pixelRatio = settings.pixelRatio = settings.highdpi = settings.pixelRatio || 1;

    if(settings.fullScreen) {
      settings.width = Screen.getWidth();
      settings.height = Screen.getHeight();
    }
    settings.width *= pixelRatio;
    settings.height *= pixelRatio;

    var impl = new WindowImplPlask();

    var obj = {};
    obj.settings = settings;
    obj.init = function(){
        this.framerate(60);

        var mouse = windowPex._mouse;

        this.on('mouseDown', function(e) {
            mouse.handleMouseDown({
                x        : e.x,
                y        : e.y,
                altKey   : e.option,
                shiftKey : e.shift,
                ctrlKey  : e.ctrl,
                metaKey  : e.cmd
            });
        });

        this.on('mouseUp', function(e) {
            mouse.handleMouseUp({
                x        : e.x,
                y        : e.y,
                altKey   : e.option,
                shiftKey : e.shift,
                ctrlKey  : e.ctrl,
                metaKey  : e.cmd
            });
        });

        this.on('mouseMoved', function(e) {
            mouse.handleMouseMove({
                x        : e.x,
                y        : e.y,
                altKey   : e.option,
                shiftKey : e.shift,
                ctrlKey  : e.ctrl,
                metaKey  : e.cmd
            });
        });

        this.on('mouseDragged', function(e) {
            //mouse move events are not fired while dragging
            mouse.handleMouseMove({
                x        : e.x,
                y        : e.y,
                altKey   : e.option,
                shiftKey : e.shift,
                ctrlKey  : e.ctrl,
                metaKey  : e.cmd
            });
        });

        this.on('scrollWheel', function(e) {
            mouse.handleMouseScroll({
                dx       : e.dx,
                dy       : e.dy,
                altKey   : e.option,
                shiftKey : e.shift,
                ctrlKey  : e.ctrl,
                metaKey  : e.cmd
            });
        });

        var keyboard = windowPex._keyboard;

        this.on('keyDown', function(e) {
            keyboard.handleKeyDown({
                str      : '',
                keyCode  : e.keyCode,
                altKey   : e.option,
                shiftKey : e.shift,
                ctrlKey  : e.ctrl,
                metaKey  : e.cmd
            });
            keyboard.handleKeyPress({
                str      : e.str,
                keyCode  : e.keyCode,
                altKey   : e.option,
                shiftKey : e.shift,
                ctrlKey  : e.ctrl,
                metaKey  : e.cmd
            });
        });

        this.on('keyUp', function(e) {
            keyboard.handleKeyUp({
                str      : '',
                keyCode  : e.keyCode,
                altKey   : e.option,
                shiftKey : e.shift,
                ctrlKey  : e.ctrl,
                metaKey  : e.cmd
            });
        });

        impl.plaskObj = this;
        impl.width    = this.settings.width;
        impl.height   = this.settings.height;
        impl.pixelRatio = this.settings.pixelRatio;

        if (settings.type == '2d') {
            windowPex._ctx = new omgcanvas.CanvasContext(this.canvas);
        }
        else {
            if (settings.debug) {
                function throwOnGLError(err, funcName, args) {
                    throw new Error(WebGLDebugUtils.glEnumToString(err) + " was caused by call to " + funcName);
                };
                this.gl = WebGLDebugUtils.makeDebugContext(this.gl, throwOnGLError);
            }
            windowPex._ctx  = new Context(this.gl);
        }

        impl.dispatchEvent(new WindowEvent(WindowEvent.WINDOW_READY, {}));
    };

    obj.draw = function(){
        windowPex._time._update(now());
        if (settings.debug) {
            try {
                windowPex.draw();
            }
            catch(e) {
                console.log(e);
                console.log(e.stack);
                process.exit(-1);
            }
        }
        else {
            windowPex.draw()
        }
    };

    setTimeout(function() {
        plask.simpleWindow(obj);
    }, 1);

    return impl;
};

module.exports = WindowImplPlask;

}).call(this,require('_process'))
},{"./Screen":86,"./WindowEvent":89,"./WindowImpl":90,"_process":95,"omgcanvas":93,"performance-now":18,"pex-context/Context":28,"plask-wrap":94,"webgl-debug":110}],93:[function(require,module,exports){
module.exports = {}

},{}],94:[function(require,module,exports){
module.exports = { }

},{}],95:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],96:[function(require,module,exports){
(function (global){
var now = require('performance-now')
  , root = typeof window === 'undefined' ? global : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = root['request' + suffix]
  , caf = root['cancel' + suffix] || root['cancelRequest' + suffix]

for(var i = 0; !raf && i < vendors.length; i++) {
  raf = root[vendors[i] + 'Request' + suffix]
  caf = root[vendors[i] + 'Cancel' + suffix]
      || root[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  return raf.call(root, fn)
}
module.exports.cancel = function() {
  caf.apply(root, arguments)
}
module.exports.polyfill = function(object) {
  if (!object) {
    object = root;
  }
  object.requestAnimationFrame = raf
  object.cancelAnimationFrame = caf
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"performance-now":97}],97:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.12.2
(function() {
  var getNanoSeconds, hrtime, loadTime, moduleLoadTime, nodeLoadTime, upTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - nodeLoadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    moduleLoadTime = getNanoSeconds();
    upTime = process.uptime() * 1e9;
    nodeLoadTime = moduleLoadTime - upTime;
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);



}).call(this,require('_process'))
},{"_process":95}],98:[function(require,module,exports){
//  Ramda v0.19.1
//  https://github.com/ramda/ramda
//  (c) 2013-2016 Scott Sauyet, Michael Hurley, and David Chambers
//  Ramda may be freely distributed under the MIT license.

;(function() {

  'use strict';

  /**
     * A special placeholder value used to specify "gaps" within curried functions,
     * allowing partial application of any combination of arguments, regardless of
     * their positions.
     *
     * If `g` is a curried ternary function and `_` is `R.__`, the following are
     * equivalent:
     *
     *   - `g(1, 2, 3)`
     *   - `g(_, 2, 3)(1)`
     *   - `g(_, _, 3)(1)(2)`
     *   - `g(_, _, 3)(1, 2)`
     *   - `g(_, 2, _)(1, 3)`
     *   - `g(_, 2)(1)(3)`
     *   - `g(_, 2)(1, 3)`
     *   - `g(_, 2)(_, 3)(1)`
     *
     * @constant
     * @memberOf R
     * @since v0.6.0
     * @category Function
     * @example
     *
     *      var greet = R.replace('{name}', R.__, 'Hello, {name}!');
     *      greet('Alice'); //=> 'Hello, Alice!'
     */
    var __ = { '@@functional/placeholder': true };

    /* eslint-disable no-unused-vars */
    var _arity = function _arity(n, fn) {
        /* eslint-disable no-unused-vars */
        switch (n) {
        case 0:
            return function () {
                return fn.apply(this, arguments);
            };
        case 1:
            return function (a0) {
                return fn.apply(this, arguments);
            };
        case 2:
            return function (a0, a1) {
                return fn.apply(this, arguments);
            };
        case 3:
            return function (a0, a1, a2) {
                return fn.apply(this, arguments);
            };
        case 4:
            return function (a0, a1, a2, a3) {
                return fn.apply(this, arguments);
            };
        case 5:
            return function (a0, a1, a2, a3, a4) {
                return fn.apply(this, arguments);
            };
        case 6:
            return function (a0, a1, a2, a3, a4, a5) {
                return fn.apply(this, arguments);
            };
        case 7:
            return function (a0, a1, a2, a3, a4, a5, a6) {
                return fn.apply(this, arguments);
            };
        case 8:
            return function (a0, a1, a2, a3, a4, a5, a6, a7) {
                return fn.apply(this, arguments);
            };
        case 9:
            return function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
                return fn.apply(this, arguments);
            };
        case 10:
            return function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
                return fn.apply(this, arguments);
            };
        default:
            throw new Error('First argument to _arity must be a non-negative integer no greater than ten');
        }
    };

    var _arrayFromIterator = function _arrayFromIterator(iter) {
        var list = [];
        var next;
        while (!(next = iter.next()).done) {
            list.push(next.value);
        }
        return list;
    };

    var _cloneRegExp = function _cloneRegExp(pattern) {
        return new RegExp(pattern.source, (pattern.global ? 'g' : '') + (pattern.ignoreCase ? 'i' : '') + (pattern.multiline ? 'm' : '') + (pattern.sticky ? 'y' : '') + (pattern.unicode ? 'u' : ''));
    };

    var _complement = function _complement(f) {
        return function () {
            return !f.apply(this, arguments);
        };
    };

    /**
     * Private `concat` function to merge two array-like objects.
     *
     * @private
     * @param {Array|Arguments} [set1=[]] An array-like object.
     * @param {Array|Arguments} [set2=[]] An array-like object.
     * @return {Array} A new, merged array.
     * @example
     *
     *      _concat([4, 5, 6], [1, 2, 3]); //=> [4, 5, 6, 1, 2, 3]
     */
    var _concat = function _concat(set1, set2) {
        set1 = set1 || [];
        set2 = set2 || [];
        var idx;
        var len1 = set1.length;
        var len2 = set2.length;
        var result = [];
        idx = 0;
        while (idx < len1) {
            result[result.length] = set1[idx];
            idx += 1;
        }
        idx = 0;
        while (idx < len2) {
            result[result.length] = set2[idx];
            idx += 1;
        }
        return result;
    };

    var _containsWith = function _containsWith(pred, x, list) {
        var idx = 0;
        var len = list.length;
        while (idx < len) {
            if (pred(x, list[idx])) {
                return true;
            }
            idx += 1;
        }
        return false;
    };

    var _filter = function _filter(fn, list) {
        var idx = 0;
        var len = list.length;
        var result = [];
        while (idx < len) {
            if (fn(list[idx])) {
                result[result.length] = list[idx];
            }
            idx += 1;
        }
        return result;
    };

    var _forceReduced = function _forceReduced(x) {
        return {
            '@@transducer/value': x,
            '@@transducer/reduced': true
        };
    };

    var _has = function _has(prop, obj) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    };

    var _identity = function _identity(x) {
        return x;
    };

    var _isArguments = function () {
        var toString = Object.prototype.toString;
        return toString.call(arguments) === '[object Arguments]' ? function _isArguments(x) {
            return toString.call(x) === '[object Arguments]';
        } : function _isArguments(x) {
            return _has('callee', x);
        };
    }();

    /**
     * Tests whether or not an object is an array.
     *
     * @private
     * @param {*} val The object to test.
     * @return {Boolean} `true` if `val` is an array, `false` otherwise.
     * @example
     *
     *      _isArray([]); //=> true
     *      _isArray(null); //=> false
     *      _isArray({}); //=> false
     */
    var _isArray = Array.isArray || function _isArray(val) {
        return val != null && val.length >= 0 && Object.prototype.toString.call(val) === '[object Array]';
    };

    /**
     * Determine if the passed argument is an integer.
     *
     * @private
     * @param {*} n
     * @category Type
     * @return {Boolean}
     */
    var _isInteger = Number.isInteger || function _isInteger(n) {
        return n << 0 === n;
    };

    var _isNumber = function _isNumber(x) {
        return Object.prototype.toString.call(x) === '[object Number]';
    };

    var _isObject = function _isObject(x) {
        return Object.prototype.toString.call(x) === '[object Object]';
    };

    var _isPlaceholder = function _isPlaceholder(a) {
        return a != null && typeof a === 'object' && a['@@functional/placeholder'] === true;
    };

    var _isRegExp = function _isRegExp(x) {
        return Object.prototype.toString.call(x) === '[object RegExp]';
    };

    var _isString = function _isString(x) {
        return Object.prototype.toString.call(x) === '[object String]';
    };

    var _isTransformer = function _isTransformer(obj) {
        return typeof obj['@@transducer/step'] === 'function';
    };

    var _map = function _map(fn, functor) {
        var idx = 0;
        var len = functor.length;
        var result = Array(len);
        while (idx < len) {
            result[idx] = fn(functor[idx]);
            idx += 1;
        }
        return result;
    };

    var _of = function _of(x) {
        return [x];
    };

    var _pipe = function _pipe(f, g) {
        return function () {
            return g.call(this, f.apply(this, arguments));
        };
    };

    var _pipeP = function _pipeP(f, g) {
        return function () {
            var ctx = this;
            return f.apply(ctx, arguments).then(function (x) {
                return g.call(ctx, x);
            });
        };
    };

    // \b matches word boundary; [\b] matches backspace
    var _quote = function _quote(s) {
        var escaped = s.replace(/\\/g, '\\\\').replace(/[\b]/g, '\\b')    // \b matches word boundary; [\b] matches backspace
    .replace(/\f/g, '\\f').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/\v/g, '\\v').replace(/\0/g, '\\0');
        return '"' + escaped.replace(/"/g, '\\"') + '"';
    };

    var _reduced = function _reduced(x) {
        return x && x['@@transducer/reduced'] ? x : {
            '@@transducer/value': x,
            '@@transducer/reduced': true
        };
    };

    /**
     * An optimized, private array `slice` implementation.
     *
     * @private
     * @param {Arguments|Array} args The array or arguments object to consider.
     * @param {Number} [from=0] The array index to slice from, inclusive.
     * @param {Number} [to=args.length] The array index to slice to, exclusive.
     * @return {Array} A new, sliced array.
     * @example
     *
     *      _slice([1, 2, 3, 4, 5], 1, 3); //=> [2, 3]
     *
     *      var firstThreeArgs = function(a, b, c, d) {
     *        return _slice(arguments, 0, 3);
     *      };
     *      firstThreeArgs(1, 2, 3, 4); //=> [1, 2, 3]
     */
    var _slice = function _slice(args, from, to) {
        switch (arguments.length) {
        case 1:
            return _slice(args, 0, args.length);
        case 2:
            return _slice(args, from, args.length);
        default:
            var list = [];
            var idx = 0;
            var len = Math.max(0, Math.min(args.length, to) - from);
            while (idx < len) {
                list[idx] = args[from + idx];
                idx += 1;
            }
            return list;
        }
    };

    /**
     * Polyfill from <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString>.
     */
    var _toISOString = function () {
        var pad = function pad(n) {
            return (n < 10 ? '0' : '') + n;
        };
        return typeof Date.prototype.toISOString === 'function' ? function _toISOString(d) {
            return d.toISOString();
        } : function _toISOString(d) {
            return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + '.' + (d.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) + 'Z';
        };
    }();

    var _xfBase = {
        init: function () {
            return this.xf['@@transducer/init']();
        },
        result: function (result) {
            return this.xf['@@transducer/result'](result);
        }
    };

    var _xwrap = function () {
        function XWrap(fn) {
            this.f = fn;
        }
        XWrap.prototype['@@transducer/init'] = function () {
            throw new Error('init not implemented on XWrap');
        };
        XWrap.prototype['@@transducer/result'] = function (acc) {
            return acc;
        };
        XWrap.prototype['@@transducer/step'] = function (acc, x) {
            return this.f(acc, x);
        };
        return function _xwrap(fn) {
            return new XWrap(fn);
        };
    }();

    var _aperture = function _aperture(n, list) {
        var idx = 0;
        var limit = list.length - (n - 1);
        var acc = new Array(limit >= 0 ? limit : 0);
        while (idx < limit) {
            acc[idx] = _slice(list, idx, idx + n);
            idx += 1;
        }
        return acc;
    };

    /**
     * Similar to hasMethod, this checks whether a function has a [methodname]
     * function. If it isn't an array it will execute that function otherwise it
     * will default to the ramda implementation.
     *
     * @private
     * @param {Function} fn ramda implemtation
     * @param {String} methodname property to check for a custom implementation
     * @return {Object} Whatever the return value of the method is.
     */
    var _checkForMethod = function _checkForMethod(methodname, fn) {
        return function () {
            var length = arguments.length;
            if (length === 0) {
                return fn();
            }
            var obj = arguments[length - 1];
            return _isArray(obj) || typeof obj[methodname] !== 'function' ? fn.apply(this, arguments) : obj[methodname].apply(obj, _slice(arguments, 0, length - 1));
        };
    };

    /**
     * Optimized internal one-arity curry function.
     *
     * @private
     * @category Function
     * @param {Function} fn The function to curry.
     * @return {Function} The curried function.
     */
    var _curry1 = function _curry1(fn) {
        return function f1(a) {
            if (arguments.length === 0 || _isPlaceholder(a)) {
                return f1;
            } else {
                return fn.apply(this, arguments);
            }
        };
    };

    /**
     * Optimized internal two-arity curry function.
     *
     * @private
     * @category Function
     * @param {Function} fn The function to curry.
     * @return {Function} The curried function.
     */
    var _curry2 = function _curry2(fn) {
        return function f2(a, b) {
            switch (arguments.length) {
            case 0:
                return f2;
            case 1:
                return _isPlaceholder(a) ? f2 : _curry1(function (_b) {
                    return fn(a, _b);
                });
            default:
                return _isPlaceholder(a) && _isPlaceholder(b) ? f2 : _isPlaceholder(a) ? _curry1(function (_a) {
                    return fn(_a, b);
                }) : _isPlaceholder(b) ? _curry1(function (_b) {
                    return fn(a, _b);
                }) : fn(a, b);
            }
        };
    };

    /**
     * Optimized internal three-arity curry function.
     *
     * @private
     * @category Function
     * @param {Function} fn The function to curry.
     * @return {Function} The curried function.
     */
    var _curry3 = function _curry3(fn) {
        return function f3(a, b, c) {
            switch (arguments.length) {
            case 0:
                return f3;
            case 1:
                return _isPlaceholder(a) ? f3 : _curry2(function (_b, _c) {
                    return fn(a, _b, _c);
                });
            case 2:
                return _isPlaceholder(a) && _isPlaceholder(b) ? f3 : _isPlaceholder(a) ? _curry2(function (_a, _c) {
                    return fn(_a, b, _c);
                }) : _isPlaceholder(b) ? _curry2(function (_b, _c) {
                    return fn(a, _b, _c);
                }) : _curry1(function (_c) {
                    return fn(a, b, _c);
                });
            default:
                return _isPlaceholder(a) && _isPlaceholder(b) && _isPlaceholder(c) ? f3 : _isPlaceholder(a) && _isPlaceholder(b) ? _curry2(function (_a, _b) {
                    return fn(_a, _b, c);
                }) : _isPlaceholder(a) && _isPlaceholder(c) ? _curry2(function (_a, _c) {
                    return fn(_a, b, _c);
                }) : _isPlaceholder(b) && _isPlaceholder(c) ? _curry2(function (_b, _c) {
                    return fn(a, _b, _c);
                }) : _isPlaceholder(a) ? _curry1(function (_a) {
                    return fn(_a, b, c);
                }) : _isPlaceholder(b) ? _curry1(function (_b) {
                    return fn(a, _b, c);
                }) : _isPlaceholder(c) ? _curry1(function (_c) {
                    return fn(a, b, _c);
                }) : fn(a, b, c);
            }
        };
    };

    /**
     * Internal curryN function.
     *
     * @private
     * @category Function
     * @param {Number} length The arity of the curried function.
     * @param {Array} received An array of arguments received thus far.
     * @param {Function} fn The function to curry.
     * @return {Function} The curried function.
     */
    var _curryN = function _curryN(length, received, fn) {
        return function () {
            var combined = [];
            var argsIdx = 0;
            var left = length;
            var combinedIdx = 0;
            while (combinedIdx < received.length || argsIdx < arguments.length) {
                var result;
                if (combinedIdx < received.length && (!_isPlaceholder(received[combinedIdx]) || argsIdx >= arguments.length)) {
                    result = received[combinedIdx];
                } else {
                    result = arguments[argsIdx];
                    argsIdx += 1;
                }
                combined[combinedIdx] = result;
                if (!_isPlaceholder(result)) {
                    left -= 1;
                }
                combinedIdx += 1;
            }
            return left <= 0 ? fn.apply(this, combined) : _arity(left, _curryN(length, combined, fn));
        };
    };

    /**
     * Returns a function that dispatches with different strategies based on the
     * object in list position (last argument). If it is an array, executes [fn].
     * Otherwise, if it has a function with [methodname], it will execute that
     * function (functor case). Otherwise, if it is a transformer, uses transducer
     * [xf] to return a new transformer (transducer case). Otherwise, it will
     * default to executing [fn].
     *
     * @private
     * @param {String} methodname property to check for a custom implementation
     * @param {Function} xf transducer to initialize if object is transformer
     * @param {Function} fn default ramda implementation
     * @return {Function} A function that dispatches on object in list position
     */
    var _dispatchable = function _dispatchable(methodname, xf, fn) {
        return function () {
            var length = arguments.length;
            if (length === 0) {
                return fn();
            }
            var obj = arguments[length - 1];
            if (!_isArray(obj)) {
                var args = _slice(arguments, 0, length - 1);
                if (typeof obj[methodname] === 'function') {
                    return obj[methodname].apply(obj, args);
                }
                if (_isTransformer(obj)) {
                    var transducer = xf.apply(null, args);
                    return transducer(obj);
                }
            }
            return fn.apply(this, arguments);
        };
    };

    var _dropLastWhile = function dropLastWhile(pred, list) {
        var idx = list.length - 1;
        while (idx >= 0 && pred(list[idx])) {
            idx -= 1;
        }
        return _slice(list, 0, idx + 1);
    };

    var _xall = function () {
        function XAll(f, xf) {
            this.xf = xf;
            this.f = f;
            this.all = true;
        }
        XAll.prototype['@@transducer/init'] = _xfBase.init;
        XAll.prototype['@@transducer/result'] = function (result) {
            if (this.all) {
                result = this.xf['@@transducer/step'](result, true);
            }
            return this.xf['@@transducer/result'](result);
        };
        XAll.prototype['@@transducer/step'] = function (result, input) {
            if (!this.f(input)) {
                this.all = false;
                result = _reduced(this.xf['@@transducer/step'](result, false));
            }
            return result;
        };
        return _curry2(function _xall(f, xf) {
            return new XAll(f, xf);
        });
    }();

    var _xany = function () {
        function XAny(f, xf) {
            this.xf = xf;
            this.f = f;
            this.any = false;
        }
        XAny.prototype['@@transducer/init'] = _xfBase.init;
        XAny.prototype['@@transducer/result'] = function (result) {
            if (!this.any) {
                result = this.xf['@@transducer/step'](result, false);
            }
            return this.xf['@@transducer/result'](result);
        };
        XAny.prototype['@@transducer/step'] = function (result, input) {
            if (this.f(input)) {
                this.any = true;
                result = _reduced(this.xf['@@transducer/step'](result, true));
            }
            return result;
        };
        return _curry2(function _xany(f, xf) {
            return new XAny(f, xf);
        });
    }();

    var _xaperture = function () {
        function XAperture(n, xf) {
            this.xf = xf;
            this.pos = 0;
            this.full = false;
            this.acc = new Array(n);
        }
        XAperture.prototype['@@transducer/init'] = _xfBase.init;
        XAperture.prototype['@@transducer/result'] = function (result) {
            this.acc = null;
            return this.xf['@@transducer/result'](result);
        };
        XAperture.prototype['@@transducer/step'] = function (result, input) {
            this.store(input);
            return this.full ? this.xf['@@transducer/step'](result, this.getCopy()) : result;
        };
        XAperture.prototype.store = function (input) {
            this.acc[this.pos] = input;
            this.pos += 1;
            if (this.pos === this.acc.length) {
                this.pos = 0;
                this.full = true;
            }
        };
        XAperture.prototype.getCopy = function () {
            return _concat(_slice(this.acc, this.pos), _slice(this.acc, 0, this.pos));
        };
        return _curry2(function _xaperture(n, xf) {
            return new XAperture(n, xf);
        });
    }();

    var _xdrop = function () {
        function XDrop(n, xf) {
            this.xf = xf;
            this.n = n;
        }
        XDrop.prototype['@@transducer/init'] = _xfBase.init;
        XDrop.prototype['@@transducer/result'] = _xfBase.result;
        XDrop.prototype['@@transducer/step'] = function (result, input) {
            if (this.n > 0) {
                this.n -= 1;
                return result;
            }
            return this.xf['@@transducer/step'](result, input);
        };
        return _curry2(function _xdrop(n, xf) {
            return new XDrop(n, xf);
        });
    }();

    var _xdropLast = function () {
        function XDropLast(n, xf) {
            this.xf = xf;
            this.pos = 0;
            this.full = false;
            this.acc = new Array(n);
        }
        XDropLast.prototype['@@transducer/init'] = _xfBase.init;
        XDropLast.prototype['@@transducer/result'] = function (result) {
            this.acc = null;
            return this.xf['@@transducer/result'](result);
        };
        XDropLast.prototype['@@transducer/step'] = function (result, input) {
            if (this.full) {
                result = this.xf['@@transducer/step'](result, this.acc[this.pos]);
            }
            this.store(input);
            return result;
        };
        XDropLast.prototype.store = function (input) {
            this.acc[this.pos] = input;
            this.pos += 1;
            if (this.pos === this.acc.length) {
                this.pos = 0;
                this.full = true;
            }
        };
        return _curry2(function _xdropLast(n, xf) {
            return new XDropLast(n, xf);
        });
    }();

    var _xdropRepeatsWith = function () {
        function XDropRepeatsWith(pred, xf) {
            this.xf = xf;
            this.pred = pred;
            this.lastValue = undefined;
            this.seenFirstValue = false;
        }
        XDropRepeatsWith.prototype['@@transducer/init'] = function () {
            return this.xf['@@transducer/init']();
        };
        XDropRepeatsWith.prototype['@@transducer/result'] = function (result) {
            return this.xf['@@transducer/result'](result);
        };
        XDropRepeatsWith.prototype['@@transducer/step'] = function (result, input) {
            var sameAsLast = false;
            if (!this.seenFirstValue) {
                this.seenFirstValue = true;
            } else if (this.pred(this.lastValue, input)) {
                sameAsLast = true;
            }
            this.lastValue = input;
            return sameAsLast ? result : this.xf['@@transducer/step'](result, input);
        };
        return _curry2(function _xdropRepeatsWith(pred, xf) {
            return new XDropRepeatsWith(pred, xf);
        });
    }();

    var _xdropWhile = function () {
        function XDropWhile(f, xf) {
            this.xf = xf;
            this.f = f;
        }
        XDropWhile.prototype['@@transducer/init'] = _xfBase.init;
        XDropWhile.prototype['@@transducer/result'] = _xfBase.result;
        XDropWhile.prototype['@@transducer/step'] = function (result, input) {
            if (this.f) {
                if (this.f(input)) {
                    return result;
                }
                this.f = null;
            }
            return this.xf['@@transducer/step'](result, input);
        };
        return _curry2(function _xdropWhile(f, xf) {
            return new XDropWhile(f, xf);
        });
    }();

    var _xfilter = function () {
        function XFilter(f, xf) {
            this.xf = xf;
            this.f = f;
        }
        XFilter.prototype['@@transducer/init'] = _xfBase.init;
        XFilter.prototype['@@transducer/result'] = _xfBase.result;
        XFilter.prototype['@@transducer/step'] = function (result, input) {
            return this.f(input) ? this.xf['@@transducer/step'](result, input) : result;
        };
        return _curry2(function _xfilter(f, xf) {
            return new XFilter(f, xf);
        });
    }();

    var _xfind = function () {
        function XFind(f, xf) {
            this.xf = xf;
            this.f = f;
            this.found = false;
        }
        XFind.prototype['@@transducer/init'] = _xfBase.init;
        XFind.prototype['@@transducer/result'] = function (result) {
            if (!this.found) {
                result = this.xf['@@transducer/step'](result, void 0);
            }
            return this.xf['@@transducer/result'](result);
        };
        XFind.prototype['@@transducer/step'] = function (result, input) {
            if (this.f(input)) {
                this.found = true;
                result = _reduced(this.xf['@@transducer/step'](result, input));
            }
            return result;
        };
        return _curry2(function _xfind(f, xf) {
            return new XFind(f, xf);
        });
    }();

    var _xfindIndex = function () {
        function XFindIndex(f, xf) {
            this.xf = xf;
            this.f = f;
            this.idx = -1;
            this.found = false;
        }
        XFindIndex.prototype['@@transducer/init'] = _xfBase.init;
        XFindIndex.prototype['@@transducer/result'] = function (result) {
            if (!this.found) {
                result = this.xf['@@transducer/step'](result, -1);
            }
            return this.xf['@@transducer/result'](result);
        };
        XFindIndex.prototype['@@transducer/step'] = function (result, input) {
            this.idx += 1;
            if (this.f(input)) {
                this.found = true;
                result = _reduced(this.xf['@@transducer/step'](result, this.idx));
            }
            return result;
        };
        return _curry2(function _xfindIndex(f, xf) {
            return new XFindIndex(f, xf);
        });
    }();

    var _xfindLast = function () {
        function XFindLast(f, xf) {
            this.xf = xf;
            this.f = f;
        }
        XFindLast.prototype['@@transducer/init'] = _xfBase.init;
        XFindLast.prototype['@@transducer/result'] = function (result) {
            return this.xf['@@transducer/result'](this.xf['@@transducer/step'](result, this.last));
        };
        XFindLast.prototype['@@transducer/step'] = function (result, input) {
            if (this.f(input)) {
                this.last = input;
            }
            return result;
        };
        return _curry2(function _xfindLast(f, xf) {
            return new XFindLast(f, xf);
        });
    }();

    var _xfindLastIndex = function () {
        function XFindLastIndex(f, xf) {
            this.xf = xf;
            this.f = f;
            this.idx = -1;
            this.lastIdx = -1;
        }
        XFindLastIndex.prototype['@@transducer/init'] = _xfBase.init;
        XFindLastIndex.prototype['@@transducer/result'] = function (result) {
            return this.xf['@@transducer/result'](this.xf['@@transducer/step'](result, this.lastIdx));
        };
        XFindLastIndex.prototype['@@transducer/step'] = function (result, input) {
            this.idx += 1;
            if (this.f(input)) {
                this.lastIdx = this.idx;
            }
            return result;
        };
        return _curry2(function _xfindLastIndex(f, xf) {
            return new XFindLastIndex(f, xf);
        });
    }();

    var _xmap = function () {
        function XMap(f, xf) {
            this.xf = xf;
            this.f = f;
        }
        XMap.prototype['@@transducer/init'] = _xfBase.init;
        XMap.prototype['@@transducer/result'] = _xfBase.result;
        XMap.prototype['@@transducer/step'] = function (result, input) {
            return this.xf['@@transducer/step'](result, this.f(input));
        };
        return _curry2(function _xmap(f, xf) {
            return new XMap(f, xf);
        });
    }();

    var _xtake = function () {
        function XTake(n, xf) {
            this.xf = xf;
            this.n = n;
        }
        XTake.prototype['@@transducer/init'] = _xfBase.init;
        XTake.prototype['@@transducer/result'] = _xfBase.result;
        XTake.prototype['@@transducer/step'] = function (result, input) {
            if (this.n === 0) {
                return _reduced(result);
            } else {
                this.n -= 1;
                return this.xf['@@transducer/step'](result, input);
            }
        };
        return _curry2(function _xtake(n, xf) {
            return new XTake(n, xf);
        });
    }();

    var _xtakeWhile = function () {
        function XTakeWhile(f, xf) {
            this.xf = xf;
            this.f = f;
        }
        XTakeWhile.prototype['@@transducer/init'] = _xfBase.init;
        XTakeWhile.prototype['@@transducer/result'] = _xfBase.result;
        XTakeWhile.prototype['@@transducer/step'] = function (result, input) {
            return this.f(input) ? this.xf['@@transducer/step'](result, input) : _reduced(result);
        };
        return _curry2(function _xtakeWhile(f, xf) {
            return new XTakeWhile(f, xf);
        });
    }();

    /**
     * Adds two numbers. Equivalent to `a + b` but curried.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Math
     * @sig Number -> Number -> Number
     * @param {Number} a
     * @param {Number} b
     * @return {Number}
     * @see R.subtract
     * @example
     *
     *      R.add(2, 3);       //=>  5
     *      R.add(7)(10);      //=> 17
     */
    var add = _curry2(function add(a, b) {
        return a + b;
    });

    /**
     * Applies a function to the value at the given index of an array, returning a
     * new copy of the array with the element at the given index replaced with the
     * result of the function application.
     *
     * @func
     * @memberOf R
     * @since v0.14.0
     * @category List
     * @sig (a -> a) -> Number -> [a] -> [a]
     * @param {Function} fn The function to apply.
     * @param {Number} idx The index.
     * @param {Array|Arguments} list An array-like object whose value
     *        at the supplied index will be replaced.
     * @return {Array} A copy of the supplied array-like object with
     *         the element at index `idx` replaced with the value
     *         returned by applying `fn` to the existing element.
     * @see R.update
     * @example
     *
     *      R.adjust(R.add(10), 1, [0, 1, 2]);     //=> [0, 11, 2]
     *      R.adjust(R.add(10))(1)([0, 1, 2]);     //=> [0, 11, 2]
     */
    var adjust = _curry3(function adjust(fn, idx, list) {
        if (idx >= list.length || idx < -list.length) {
            return list;
        }
        var start = idx < 0 ? list.length : 0;
        var _idx = start + idx;
        var _list = _concat(list);
        _list[_idx] = fn(list[_idx]);
        return _list;
    });

    /**
     * Returns `true` if all elements of the list match the predicate, `false` if
     * there are any that don't.
     *
     * Dispatches to the `all` method of the second argument, if present.
     *
     * Acts as a transducer if a transformer is given in list position.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig (a -> Boolean) -> [a] -> Boolean
     * @param {Function} fn The predicate function.
     * @param {Array} list The array to consider.
     * @return {Boolean} `true` if the predicate is satisfied by every element, `false`
     *         otherwise.
     * @see R.any, R.none, R.transduce
     * @example
     *
     *      var lessThan2 = R.flip(R.lt)(2);
     *      var lessThan3 = R.flip(R.lt)(3);
     *      R.all(lessThan2)([1, 2]); //=> false
     *      R.all(lessThan3)([1, 2]); //=> true
     */
    var all = _curry2(_dispatchable('all', _xall, function all(fn, list) {
        var idx = 0;
        while (idx < list.length) {
            if (!fn(list[idx])) {
                return false;
            }
            idx += 1;
        }
        return true;
    }));

    /**
     * Returns a function that always returns the given value. Note that for
     * non-primitives the value returned is a reference to the original value.
     *
     * This function is known as `const`, `constant`, or `K` (for K combinator) in
     * other languages and libraries.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Function
     * @sig a -> (* -> a)
     * @param {*} val The value to wrap in a function
     * @return {Function} A Function :: * -> val.
     * @example
     *
     *      var t = R.always('Tee');
     *      t(); //=> 'Tee'
     */
    var always = _curry1(function always(val) {
        return function () {
            return val;
        };
    });

    /**
     * Returns `true` if both arguments are `true`; `false` otherwise.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Logic
     * @sig * -> * -> *
     * @param {Boolean} a A boolean value
     * @param {Boolean} b A boolean value
     * @return {Boolean} `true` if both arguments are `true`, `false` otherwise
     * @see R.both
     * @example
     *
     *      R.and(true, true); //=> true
     *      R.and(true, false); //=> false
     *      R.and(false, true); //=> false
     *      R.and(false, false); //=> false
     */
    var and = _curry2(function and(a, b) {
        return a && b;
    });

    /**
     * Returns `true` if at least one of elements of the list match the predicate,
     * `false` otherwise.
     *
     * Dispatches to the `any` method of the second argument, if present.
     *
     * Acts as a transducer if a transformer is given in list position.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig (a -> Boolean) -> [a] -> Boolean
     * @param {Function} fn The predicate function.
     * @param {Array} list The array to consider.
     * @return {Boolean} `true` if the predicate is satisfied by at least one element, `false`
     *         otherwise.
     * @see R.all, R.none, R.transduce
     * @example
     *
     *      var lessThan0 = R.flip(R.lt)(0);
     *      var lessThan2 = R.flip(R.lt)(2);
     *      R.any(lessThan0)([1, 2]); //=> false
     *      R.any(lessThan2)([1, 2]); //=> true
     */
    var any = _curry2(_dispatchable('any', _xany, function any(fn, list) {
        var idx = 0;
        while (idx < list.length) {
            if (fn(list[idx])) {
                return true;
            }
            idx += 1;
        }
        return false;
    }));

    /**
     * Returns a new list, composed of n-tuples of consecutive elements If `n` is
     * greater than the length of the list, an empty list is returned.
     *
     * Dispatches to the `aperture` method of the second argument, if present.
     *
     * Acts as a transducer if a transformer is given in list position.
     *
     * @func
     * @memberOf R
     * @since v0.12.0
     * @category List
     * @sig Number -> [a] -> [[a]]
     * @param {Number} n The size of the tuples to create
     * @param {Array} list The list to split into `n`-tuples
     * @return {Array} The new list.
     * @see R.transduce
     * @example
     *
     *      R.aperture(2, [1, 2, 3, 4, 5]); //=> [[1, 2], [2, 3], [3, 4], [4, 5]]
     *      R.aperture(3, [1, 2, 3, 4, 5]); //=> [[1, 2, 3], [2, 3, 4], [3, 4, 5]]
     *      R.aperture(7, [1, 2, 3, 4, 5]); //=> []
     */
    var aperture = _curry2(_dispatchable('aperture', _xaperture, _aperture));

    /**
     * Returns a new list containing the contents of the given list, followed by
     * the given element.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig a -> [a] -> [a]
     * @param {*} el The element to add to the end of the new list.
     * @param {Array} list The list whose contents will be added to the beginning of the output
     *        list.
     * @return {Array} A new list containing the contents of the old list followed by `el`.
     * @see R.prepend
     * @example
     *
     *      R.append('tests', ['write', 'more']); //=> ['write', 'more', 'tests']
     *      R.append('tests', []); //=> ['tests']
     *      R.append(['tests'], ['write', 'more']); //=> ['write', 'more', ['tests']]
     */
    var append = _curry2(function append(el, list) {
        return _concat(list, [el]);
    });

    /**
     * Applies function `fn` to the argument list `args`. This is useful for
     * creating a fixed-arity function from a variadic function. `fn` should be a
     * bound function if context is significant.
     *
     * @func
     * @memberOf R
     * @since v0.7.0
     * @category Function
     * @sig (*... -> a) -> [*] -> a
     * @param {Function} fn
     * @param {Array} args
     * @return {*}
     * @see R.call, R.unapply
     * @example
     *
     *      var nums = [1, 2, 3, -99, 42, 6, 7];
     *      R.apply(Math.max, nums); //=> 42
     */
    var apply = _curry2(function apply(fn, args) {
        return fn.apply(this, args);
    });

    /**
     * Makes a shallow clone of an object, setting or overriding the specified
     * property with the given value. Note that this copies and flattens prototype
     * properties onto the new object as well. All non-primitive properties are
     * copied by reference.
     *
     * @func
     * @memberOf R
     * @since v0.8.0
     * @category Object
     * @sig String -> a -> {k: v} -> {k: v}
     * @param {String} prop the property name to set
     * @param {*} val the new value
     * @param {Object} obj the object to clone
     * @return {Object} a new object similar to the original except for the specified property.
     * @see R.dissoc
     * @example
     *
     *      R.assoc('c', 3, {a: 1, b: 2}); //=> {a: 1, b: 2, c: 3}
     */
    var assoc = _curry3(function assoc(prop, val, obj) {
        var result = {};
        for (var p in obj) {
            result[p] = obj[p];
        }
        result[prop] = val;
        return result;
    });

    /**
     * Makes a shallow clone of an object, setting or overriding the nodes required
     * to create the given path, and placing the specific value at the tail end of
     * that path. Note that this copies and flattens prototype properties onto the
     * new object as well. All non-primitive properties are copied by reference.
     *
     * @func
     * @memberOf R
     * @since v0.8.0
     * @category Object
     * @sig [String] -> a -> {k: v} -> {k: v}
     * @param {Array} path the path to set
     * @param {*} val the new value
     * @param {Object} obj the object to clone
     * @return {Object} a new object similar to the original except along the specified path.
     * @see R.dissocPath
     * @example
     *
     *      R.assocPath(['a', 'b', 'c'], 42, {a: {b: {c: 0}}}); //=> {a: {b: {c: 42}}}
     */
    var assocPath = _curry3(function assocPath(path, val, obj) {
        switch (path.length) {
        case 0:
            return val;
        case 1:
            return assoc(path[0], val, obj);
        default:
            return assoc(path[0], assocPath(_slice(path, 1), val, Object(obj[path[0]])), obj);
        }
    });

    /**
     * Creates a function that is bound to a context.
     * Note: `R.bind` does not provide the additional argument-binding capabilities of
     * [Function.prototype.bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
     *
     * @func
     * @memberOf R
     * @since v0.6.0
     * @category Function
     * @category Object
     * @sig (* -> *) -> {*} -> (* -> *)
     * @param {Function} fn The function to bind to context
     * @param {Object} thisObj The context to bind `fn` to
     * @return {Function} A function that will execute in the context of `thisObj`.
     * @see R.partial
     */
    var bind = _curry2(function bind(fn, thisObj) {
        return _arity(fn.length, function () {
            return fn.apply(thisObj, arguments);
        });
    });

    /**
     * A function wrapping calls to the two functions in an `&&` operation,
     * returning the result of the first function if it is false-y and the result
     * of the second function otherwise. Note that this is short-circuited,
     * meaning that the second function will not be invoked if the first returns a
     * false-y value.
     *
     * @func
     * @memberOf R
     * @since v0.12.0
     * @category Logic
     * @sig (*... -> Boolean) -> (*... -> Boolean) -> (*... -> Boolean)
     * @param {Function} f a predicate
     * @param {Function} g another predicate
     * @return {Function} a function that applies its arguments to `f` and `g` and `&&`s their outputs together.
     * @see R.and
     * @example
     *
     *      var gt10 = x => x > 10;
     *      var even = x => x % 2 === 0;
     *      var f = R.both(gt10, even);
     *      f(100); //=> true
     *      f(101); //=> false
     */
    var both = _curry2(function both(f, g) {
        return function _both() {
            return f.apply(this, arguments) && g.apply(this, arguments);
        };
    });

    /**
     * Makes a comparator function out of a function that reports whether the first
     * element is less than the second.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Function
     * @sig (a, b -> Boolean) -> (a, b -> Number)
     * @param {Function} pred A predicate function of arity two.
     * @return {Function} A Function :: a -> b -> Int that returns `-1` if a < b, `1` if b < a, otherwise `0`.
     * @example
     *
     *      var cmp = R.comparator((a, b) => a.age < b.age);
     *      var people = [
     *        // ...
     *      ];
     *      R.sort(cmp, people);
     */
    var comparator = _curry1(function comparator(pred) {
        return function (a, b) {
            return pred(a, b) ? -1 : pred(b, a) ? 1 : 0;
        };
    });

    /**
     * Returns a function, `fn`, which encapsulates if/else-if/else logic.
     * `R.cond` takes a list of [predicate, transform] pairs. All of the arguments
     * to `fn` are applied to each of the predicates in turn until one returns a
     * "truthy" value, at which point `fn` returns the result of applying its
     * arguments to the corresponding transformer. If none of the predicates
     * matches, `fn` returns undefined.
     *
     * @func
     * @memberOf R
     * @since v0.6.0
     * @category Logic
     * @sig [[(*... -> Boolean),(*... -> *)]] -> (*... -> *)
     * @param {Array} pairs
     * @return {Function}
     * @example
     *
     *      var fn = R.cond([
     *        [R.equals(0),   R.always('water freezes at 0°C')],
     *        [R.equals(100), R.always('water boils at 100°C')],
     *        [R.T,           temp => 'nothing special happens at ' + temp + '°C']
     *      ]);
     *      fn(0); //=> 'water freezes at 0°C'
     *      fn(50); //=> 'nothing special happens at 50°C'
     *      fn(100); //=> 'water boils at 100°C'
     */
    var cond = _curry1(function cond(pairs) {
        return function () {
            var idx = 0;
            while (idx < pairs.length) {
                if (pairs[idx][0].apply(this, arguments)) {
                    return pairs[idx][1].apply(this, arguments);
                }
                idx += 1;
            }
        };
    });

    /**
     * Counts the elements of a list according to how many match each value of a
     * key generated by the supplied function. Returns an object mapping the keys
     * produced by `fn` to the number of occurrences in the list. Note that all
     * keys are coerced to strings because of how JavaScript objects work.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Relation
     * @sig (a -> String) -> [a] -> {*}
     * @param {Function} fn The function used to map values to keys.
     * @param {Array} list The list to count elements from.
     * @return {Object} An object mapping keys to number of occurrences in the list.
     * @example
     *
     *      var numbers = [1.0, 1.1, 1.2, 2.0, 3.0, 2.2];
     *      var letters = R.split('', 'abcABCaaaBBc');
     *      R.countBy(Math.floor)(numbers);    //=> {'1': 3, '2': 2, '3': 1}
     *      R.countBy(R.toLower)(letters);   //=> {'a': 5, 'b': 4, 'c': 3}
     */
    var countBy = _curry2(function countBy(fn, list) {
        var counts = {};
        var len = list.length;
        var idx = 0;
        while (idx < len) {
            var key = fn(list[idx]);
            counts[key] = (_has(key, counts) ? counts[key] : 0) + 1;
            idx += 1;
        }
        return counts;
    });

    /**
     * Returns a curried equivalent of the provided function, with the specified
     * arity. The curried function has two unusual capabilities. First, its
     * arguments needn't be provided one at a time. If `g` is `R.curryN(3, f)`, the
     * following are equivalent:
     *
     *   - `g(1)(2)(3)`
     *   - `g(1)(2, 3)`
     *   - `g(1, 2)(3)`
     *   - `g(1, 2, 3)`
     *
     * Secondly, the special placeholder value `R.__` may be used to specify
     * "gaps", allowing partial application of any combination of arguments,
     * regardless of their positions. If `g` is as above and `_` is `R.__`, the
     * following are equivalent:
     *
     *   - `g(1, 2, 3)`
     *   - `g(_, 2, 3)(1)`
     *   - `g(_, _, 3)(1)(2)`
     *   - `g(_, _, 3)(1, 2)`
     *   - `g(_, 2)(1)(3)`
     *   - `g(_, 2)(1, 3)`
     *   - `g(_, 2)(_, 3)(1)`
     *
     * @func
     * @memberOf R
     * @since v0.5.0
     * @category Function
     * @sig Number -> (* -> a) -> (* -> a)
     * @param {Number} length The arity for the returned function.
     * @param {Function} fn The function to curry.
     * @return {Function} A new, curried function.
     * @see R.curry
     * @example
     *
     *      var sumArgs = (...args) => R.sum(args);
     *
     *      var curriedAddFourNumbers = R.curryN(4, sumArgs);
     *      var f = curriedAddFourNumbers(1, 2);
     *      var g = f(3);
     *      g(4); //=> 10
     */
    var curryN = _curry2(function curryN(length, fn) {
        if (length === 1) {
            return _curry1(fn);
        }
        return _arity(length, _curryN(length, [], fn));
    });

    /**
     * Decrements its argument.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category Math
     * @sig Number -> Number
     * @param {Number} n
     * @return {Number}
     * @see R.inc
     * @example
     *
     *      R.dec(42); //=> 41
     */
    var dec = add(-1);

    /**
     * Returns the second argument if it is not `null`, `undefined` or `NaN`
     * otherwise the first argument is returned.
     *
     * @func
     * @memberOf R
     * @since v0.10.0
     * @category Logic
     * @sig a -> b -> a | b
     * @param {a} val The default value.
     * @param {b} val The value to return if it is not null or undefined
     * @return {*} The the second value or the default value
     * @example
     *
     *      var defaultTo42 = R.defaultTo(42);
     *
     *      defaultTo42(null);  //=> 42
     *      defaultTo42(undefined);  //=> 42
     *      defaultTo42('Ramda');  //=> 'Ramda'
     *      defaultTo42(parseInt('string')); //=> 42
     */
    var defaultTo = _curry2(function defaultTo(d, v) {
        return v == null || v !== v ? d : v;
    });

    /**
     * Finds the set (i.e. no duplicates) of all elements in the first list not
     * contained in the second list. Duplication is determined according to the
     * value returned by applying the supplied predicate to two list elements.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Relation
     * @sig (a -> a -> Boolean) -> [*] -> [*] -> [*]
     * @param {Function} pred A predicate used to test whether two items are equal.
     * @param {Array} list1 The first list.
     * @param {Array} list2 The second list.
     * @return {Array} The elements in `list1` that are not in `list2`.
     * @see R.difference
     * @example
     *
     *      function cmp(x, y) => x.a === y.a;
     *      var l1 = [{a: 1}, {a: 2}, {a: 3}];
     *      var l2 = [{a: 3}, {a: 4}];
     *      R.differenceWith(cmp, l1, l2); //=> [{a: 1}, {a: 2}]
     */
    var differenceWith = _curry3(function differenceWith(pred, first, second) {
        var out = [];
        var idx = 0;
        var firstLen = first.length;
        while (idx < firstLen) {
            if (!_containsWith(pred, first[idx], second) && !_containsWith(pred, first[idx], out)) {
                out.push(first[idx]);
            }
            idx += 1;
        }
        return out;
    });

    /**
     * Returns a new object that does not contain a `prop` property.
     *
     * @func
     * @memberOf R
     * @since v0.10.0
     * @category Object
     * @sig String -> {k: v} -> {k: v}
     * @param {String} prop the name of the property to dissociate
     * @param {Object} obj the object to clone
     * @return {Object} a new object similar to the original but without the specified property
     * @see R.assoc
     * @example
     *
     *      R.dissoc('b', {a: 1, b: 2, c: 3}); //=> {a: 1, c: 3}
     */
    var dissoc = _curry2(function dissoc(prop, obj) {
        var result = {};
        for (var p in obj) {
            if (p !== prop) {
                result[p] = obj[p];
            }
        }
        return result;
    });

    /**
     * Makes a shallow clone of an object, omitting the property at the given path.
     * Note that this copies and flattens prototype properties onto the new object
     * as well. All non-primitive properties are copied by reference.
     *
     * @func
     * @memberOf R
     * @since v0.11.0
     * @category Object
     * @sig [String] -> {k: v} -> {k: v}
     * @param {Array} path the path to set
     * @param {Object} obj the object to clone
     * @return {Object} a new object without the property at path
     * @see R.assocPath
     * @example
     *
     *      R.dissocPath(['a', 'b', 'c'], {a: {b: {c: 42}}}); //=> {a: {b: {}}}
     */
    var dissocPath = _curry2(function dissocPath(path, obj) {
        switch (path.length) {
        case 0:
            return obj;
        case 1:
            return dissoc(path[0], obj);
        default:
            var head = path[0];
            var tail = _slice(path, 1);
            return obj[head] == null ? obj : assoc(head, dissocPath(tail, obj[head]), obj);
        }
    });

    /**
     * Divides two numbers. Equivalent to `a / b`.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Math
     * @sig Number -> Number -> Number
     * @param {Number} a The first value.
     * @param {Number} b The second value.
     * @return {Number} The result of `a / b`.
     * @see R.multiply
     * @example
     *
     *      R.divide(71, 100); //=> 0.71
     *
     *      var half = R.divide(R.__, 2);
     *      half(42); //=> 21
     *
     *      var reciprocal = R.divide(1);
     *      reciprocal(4);   //=> 0.25
     */
    var divide = _curry2(function divide(a, b) {
        return a / b;
    });

    /**
     * Returns a new list containing the last `n` elements of a given list, passing
     * each value to the supplied predicate function, skipping elements while the
     * predicate function returns `true`. The predicate function is passed one
     * argument: *(value)*.
     *
     * Dispatches to the `dropWhile` method of the second argument, if present.
     *
     * Acts as a transducer if a transformer is given in list position.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category List
     * @sig (a -> Boolean) -> [a] -> [a]
     * @param {Function} fn The function called per iteration.
     * @param {Array} list The collection to iterate over.
     * @return {Array} A new array.
     * @see R.takeWhile, R.transduce, R.addIndex
     * @example
     *
     *      var lteTwo = x => x <= 2;
     *
     *      R.dropWhile(lteTwo, [1, 2, 3, 4, 3, 2, 1]); //=> [3, 4, 3, 2, 1]
     */
    var dropWhile = _curry2(_dispatchable('dropWhile', _xdropWhile, function dropWhile(pred, list) {
        var idx = 0;
        var len = list.length;
        while (idx < len && pred(list[idx])) {
            idx += 1;
        }
        return _slice(list, idx);
    }));

    /**
     * A function wrapping calls to the two functions in an `||` operation,
     * returning the result of the first function if it is truth-y and the result
     * of the second function otherwise. Note that this is short-circuited,
     * meaning that the second function will not be invoked if the first returns a
     * truth-y value.
     *
     * @func
     * @memberOf R
     * @since v0.12.0
     * @category Logic
     * @sig (*... -> Boolean) -> (*... -> Boolean) -> (*... -> Boolean)
     * @param {Function} f a predicate
     * @param {Function} g another predicate
     * @return {Function} a function that applies its arguments to `f` and `g` and `||`s their outputs together.
     * @see R.or
     * @example
     *
     *      var gt10 = x => x > 10;
     *      var even = x => x % 2 === 0;
     *      var f = R.either(gt10, even);
     *      f(101); //=> true
     *      f(8); //=> true
     */
    var either = _curry2(function either(f, g) {
        return function _either() {
            return f.apply(this, arguments) || g.apply(this, arguments);
        };
    });

    /**
     * Returns the empty value of its argument's type. Ramda defines the empty
     * value of Array (`[]`), Object (`{}`), String (`''`), and Arguments. Other
     * types are supported if they define `<Type>.empty` and/or
     * `<Type>.prototype.empty`.
     *
     * Dispatches to the `empty` method of the first argument, if present.
     *
     * @func
     * @memberOf R
     * @since v0.3.0
     * @category Function
     * @sig a -> a
     * @param {*} x
     * @return {*}
     * @example
     *
     *      R.empty(Just(42));      //=> Nothing()
     *      R.empty([1, 2, 3]);     //=> []
     *      R.empty('unicorns');    //=> ''
     *      R.empty({x: 1, y: 2});  //=> {}
     */
    // else
    var empty = _curry1(function empty(x) {
        return x != null && typeof x.empty === 'function' ? x.empty() : x != null && x.constructor != null && typeof x.constructor.empty === 'function' ? x.constructor.empty() : _isArray(x) ? [] : _isString(x) ? '' : _isObject(x) ? {} : _isArguments(x) ? function () {
            return arguments;
        }() : // else
        void 0;
    });

    /**
     * Creates a new object by recursively evolving a shallow copy of `object`,
     * according to the `transformation` functions. All non-primitive properties
     * are copied by reference.
     *
     * A `transformation` function will not be invoked if its corresponding key
     * does not exist in the evolved object.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category Object
     * @sig {k: (v -> v)} -> {k: v} -> {k: v}
     * @param {Object} transformations The object specifying transformation functions to apply
     *        to the object.
     * @param {Object} object The object to be transformed.
     * @return {Object} The transformed object.
     * @example
     *
     *      var tomato  = {firstName: '  Tomato ', data: {elapsed: 100, remaining: 1400}, id:123};
     *      var transformations = {
     *        firstName: R.trim,
     *        lastName: R.trim, // Will not get invoked.
     *        data: {elapsed: R.add(1), remaining: R.add(-1)}
     *      };
     *      R.evolve(transformations, tomato); //=> {firstName: 'Tomato', data: {elapsed: 101, remaining: 1399}, id:123}
     */
    var evolve = _curry2(function evolve(transformations, object) {
        var result = {};
        var transformation, key, type;
        for (key in object) {
            transformation = transformations[key];
            type = typeof transformation;
            result[key] = type === 'function' ? transformation(object[key]) : type === 'object' ? evolve(transformations[key], object[key]) : object[key];
        }
        return result;
    });

    /**
     * Returns the first element of the list which matches the predicate, or
     * `undefined` if no element matches.
     *
     * Dispatches to the `find` method of the second argument, if present.
     *
     * Acts as a transducer if a transformer is given in list position.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig (a -> Boolean) -> [a] -> a | undefined
     * @param {Function} fn The predicate function used to determine if the element is the
     *        desired one.
     * @param {Array} list The array to consider.
     * @return {Object} The element found, or `undefined`.
     * @see R.transduce
     * @example
     *
     *      var xs = [{a: 1}, {a: 2}, {a: 3}];
     *      R.find(R.propEq('a', 2))(xs); //=> {a: 2}
     *      R.find(R.propEq('a', 4))(xs); //=> undefined
     */
    var find = _curry2(_dispatchable('find', _xfind, function find(fn, list) {
        var idx = 0;
        var len = list.length;
        while (idx < len) {
            if (fn(list[idx])) {
                return list[idx];
            }
            idx += 1;
        }
    }));

    /**
     * Returns the index of the first element of the list which matches the
     * predicate, or `-1` if no element matches.
     *
     * Dispatches to the `findIndex` method of the second argument, if present.
     *
     * Acts as a transducer if a transformer is given in list position.
     *
     * @func
     * @memberOf R
     * @since v0.1.1
     * @category List
     * @sig (a -> Boolean) -> [a] -> Number
     * @param {Function} fn The predicate function used to determine if the element is the
     * desired one.
     * @param {Array} list The array to consider.
     * @return {Number} The index of the element found, or `-1`.
     * @see R.transduce
     * @example
     *
     *      var xs = [{a: 1}, {a: 2}, {a: 3}];
     *      R.findIndex(R.propEq('a', 2))(xs); //=> 1
     *      R.findIndex(R.propEq('a', 4))(xs); //=> -1
     */
    var findIndex = _curry2(_dispatchable('findIndex', _xfindIndex, function findIndex(fn, list) {
        var idx = 0;
        var len = list.length;
        while (idx < len) {
            if (fn(list[idx])) {
                return idx;
            }
            idx += 1;
        }
        return -1;
    }));

    /**
     * Returns the last element of the list which matches the predicate, or
     * `undefined` if no element matches.
     *
     * Dispatches to the `findLast` method of the second argument, if present.
     *
     * Acts as a transducer if a transformer is given in list position.
     *
     * @func
     * @memberOf R
     * @since v0.1.1
     * @category List
     * @sig (a -> Boolean) -> [a] -> a | undefined
     * @param {Function} fn The predicate function used to determine if the element is the
     * desired one.
     * @param {Array} list The array to consider.
     * @return {Object} The element found, or `undefined`.
     * @see R.transduce
     * @example
     *
     *      var xs = [{a: 1, b: 0}, {a:1, b: 1}];
     *      R.findLast(R.propEq('a', 1))(xs); //=> {a: 1, b: 1}
     *      R.findLast(R.propEq('a', 4))(xs); //=> undefined
     */
    var findLast = _curry2(_dispatchable('findLast', _xfindLast, function findLast(fn, list) {
        var idx = list.length - 1;
        while (idx >= 0) {
            if (fn(list[idx])) {
                return list[idx];
            }
            idx -= 1;
        }
    }));

    /**
     * Returns the index of the last element of the list which matches the
     * predicate, or `-1` if no element matches.
     *
     * Dispatches to the `findLastIndex` method of the second argument, if present.
     *
     * Acts as a transducer if a transformer is given in list position.
     *
     * @func
     * @memberOf R
     * @since v0.1.1
     * @category List
     * @sig (a -> Boolean) -> [a] -> Number
     * @param {Function} fn The predicate function used to determine if the element is the
     * desired one.
     * @param {Array} list The array to consider.
     * @return {Number} The index of the element found, or `-1`.
     * @see R.transduce
     * @example
     *
     *      var xs = [{a: 1, b: 0}, {a:1, b: 1}];
     *      R.findLastIndex(R.propEq('a', 1))(xs); //=> 1
     *      R.findLastIndex(R.propEq('a', 4))(xs); //=> -1
     */
    var findLastIndex = _curry2(_dispatchable('findLastIndex', _xfindLastIndex, function findLastIndex(fn, list) {
        var idx = list.length - 1;
        while (idx >= 0) {
            if (fn(list[idx])) {
                return idx;
            }
            idx -= 1;
        }
        return -1;
    }));

    /**
     * Iterate over an input `list`, calling a provided function `fn` for each
     * element in the list.
     *
     * `fn` receives one argument: *(value)*.
     *
     * Note: `R.forEach` does not skip deleted or unassigned indices (sparse
     * arrays), unlike the native `Array.prototype.forEach` method. For more
     * details on this behavior, see:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach#Description
     *
     * Also note that, unlike `Array.prototype.forEach`, Ramda's `forEach` returns
     * the original array. In some libraries this function is named `each`.
     *
     * Dispatches to the `forEach` method of the second argument, if present.
     *
     * @func
     * @memberOf R
     * @since v0.1.1
     * @category List
     * @sig (a -> *) -> [a] -> [a]
     * @param {Function} fn The function to invoke. Receives one argument, `value`.
     * @param {Array} list The list to iterate over.
     * @return {Array} The original list.
     * @see R.addIndex
     * @example
     *
     *      var printXPlusFive = x => console.log(x + 5);
     *      R.forEach(printXPlusFive, [1, 2, 3]); //=> [1, 2, 3]
     *      //-> 6
     *      //-> 7
     *      //-> 8
     */
    var forEach = _curry2(_checkForMethod('forEach', function forEach(fn, list) {
        var len = list.length;
        var idx = 0;
        while (idx < len) {
            fn(list[idx]);
            idx += 1;
        }
        return list;
    }));

    /**
     * Creates a new object out of a list key-value pairs.
     *
     * @func
     * @memberOf R
     * @since v0.3.0
     * @category List
     * @sig [[k,v]] -> {k: v}
     * @param {Array} pairs An array of two-element arrays that will be the keys and values of the output object.
     * @return {Object} The object made by pairing up `keys` and `values`.
     * @see R.toPairs, R.pair
     * @example
     *
     *      R.fromPairs([['a', 1], ['b', 2],  ['c', 3]]); //=> {a: 1, b: 2, c: 3}
     */
    var fromPairs = _curry1(function fromPairs(pairs) {
        var idx = 0;
        var len = pairs.length;
        var out = {};
        while (idx < len) {
            if (_isArray(pairs[idx]) && pairs[idx].length) {
                out[pairs[idx][0]] = pairs[idx][1];
            }
            idx += 1;
        }
        return out;
    });

    /**
     * Returns `true` if the first argument is greater than the second; `false`
     * otherwise.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Relation
     * @sig Ord a => a -> a -> Boolean
     * @param {*} a
     * @param {*} b
     * @return {Boolean}
     * @see R.lt
     * @example
     *
     *      R.gt(2, 1); //=> true
     *      R.gt(2, 2); //=> false
     *      R.gt(2, 3); //=> false
     *      R.gt('a', 'z'); //=> false
     *      R.gt('z', 'a'); //=> true
     */
    var gt = _curry2(function gt(a, b) {
        return a > b;
    });

    /**
     * Returns `true` if the first argument is greater than or equal to the second;
     * `false` otherwise.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Relation
     * @sig Ord a => a -> a -> Boolean
     * @param {Number} a
     * @param {Number} b
     * @return {Boolean}
     * @see R.lte
     * @example
     *
     *      R.gte(2, 1); //=> true
     *      R.gte(2, 2); //=> true
     *      R.gte(2, 3); //=> false
     *      R.gte('a', 'z'); //=> false
     *      R.gte('z', 'a'); //=> true
     */
    var gte = _curry2(function gte(a, b) {
        return a >= b;
    });

    /**
     * Returns whether or not an object has an own property with the specified name
     *
     * @func
     * @memberOf R
     * @since v0.7.0
     * @category Object
     * @sig s -> {s: x} -> Boolean
     * @param {String} prop The name of the property to check for.
     * @param {Object} obj The object to query.
     * @return {Boolean} Whether the property exists.
     * @example
     *
     *      var hasName = R.has('name');
     *      hasName({name: 'alice'});   //=> true
     *      hasName({name: 'bob'});     //=> true
     *      hasName({});                //=> false
     *
     *      var point = {x: 0, y: 0};
     *      var pointHas = R.has(R.__, point);
     *      pointHas('x');  //=> true
     *      pointHas('y');  //=> true
     *      pointHas('z');  //=> false
     */
    var has = _curry2(_has);

    /**
     * Returns whether or not an object or its prototype chain has a property with
     * the specified name
     *
     * @func
     * @memberOf R
     * @since v0.7.0
     * @category Object
     * @sig s -> {s: x} -> Boolean
     * @param {String} prop The name of the property to check for.
     * @param {Object} obj The object to query.
     * @return {Boolean} Whether the property exists.
     * @example
     *
     *      function Rectangle(width, height) {
     *        this.width = width;
     *        this.height = height;
     *      }
     *      Rectangle.prototype.area = function() {
     *        return this.width * this.height;
     *      };
     *
     *      var square = new Rectangle(2, 2);
     *      R.hasIn('width', square);  //=> true
     *      R.hasIn('area', square);  //=> true
     */
    var hasIn = _curry2(function hasIn(prop, obj) {
        return prop in obj;
    });

    /**
     * Returns true if its arguments are identical, false otherwise. Values are
     * identical if they reference the same memory. `NaN` is identical to `NaN`;
     * `0` and `-0` are not identical.
     *
     * @func
     * @memberOf R
     * @since v0.15.0
     * @category Relation
     * @sig a -> a -> Boolean
     * @param {*} a
     * @param {*} b
     * @return {Boolean}
     * @example
     *
     *      var o = {};
     *      R.identical(o, o); //=> true
     *      R.identical(1, 1); //=> true
     *      R.identical(1, '1'); //=> false
     *      R.identical([], []); //=> false
     *      R.identical(0, -0); //=> false
     *      R.identical(NaN, NaN); //=> true
     */
    // SameValue algorithm
    // Steps 1-5, 7-10
    // Steps 6.b-6.e: +0 != -0
    // Step 6.a: NaN == NaN
    var identical = _curry2(function identical(a, b) {
        // SameValue algorithm
        if (a === b) {
            // Steps 1-5, 7-10
            // Steps 6.b-6.e: +0 != -0
            return a !== 0 || 1 / a === 1 / b;
        } else {
            // Step 6.a: NaN == NaN
            return a !== a && b !== b;
        }
    });

    /**
     * A function that does nothing but return the parameter supplied to it. Good
     * as a default or placeholder function.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Function
     * @sig a -> a
     * @param {*} x The value to return.
     * @return {*} The input value, `x`.
     * @example
     *
     *      R.identity(1); //=> 1
     *
     *      var obj = {};
     *      R.identity(obj) === obj; //=> true
     */
    var identity = _curry1(_identity);

    /**
     * Creates a function that will process either the `onTrue` or the `onFalse`
     * function depending upon the result of the `condition` predicate.
     *
     * @func
     * @memberOf R
     * @since v0.8.0
     * @category Logic
     * @sig (*... -> Boolean) -> (*... -> *) -> (*... -> *) -> (*... -> *)
     * @param {Function} condition A predicate function
     * @param {Function} onTrue A function to invoke when the `condition` evaluates to a truthy value.
     * @param {Function} onFalse A function to invoke when the `condition` evaluates to a falsy value.
     * @return {Function} A new unary function that will process either the `onTrue` or the `onFalse`
     *                    function depending upon the result of the `condition` predicate.
     * @see R.unless, R.when
     * @example
     *
     *      var incCount = R.ifElse(
     *        R.has('count'),
     *        R.over(R.lensProp('count'), R.inc),
     *        R.assoc('count', 1)
     *      );
     *      incCount({});           //=> { count: 1 }
     *      incCount({ count: 1 }); //=> { count: 2 }
     */
    var ifElse = _curry3(function ifElse(condition, onTrue, onFalse) {
        return curryN(Math.max(condition.length, onTrue.length, onFalse.length), function _ifElse() {
            return condition.apply(this, arguments) ? onTrue.apply(this, arguments) : onFalse.apply(this, arguments);
        });
    });

    /**
     * Increments its argument.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category Math
     * @sig Number -> Number
     * @param {Number} n
     * @return {Number}
     * @see R.dec
     * @example
     *
     *      R.inc(42); //=> 43
     */
    var inc = add(1);

    /**
     * Inserts the supplied element into the list, at index `index`. _Note that
     * this is not destructive_: it returns a copy of the list with the changes.
     * <small>No lists have been harmed in the application of this function.</small>
     *
     * @func
     * @memberOf R
     * @since v0.2.2
     * @category List
     * @sig Number -> a -> [a] -> [a]
     * @param {Number} index The position to insert the element
     * @param {*} elt The element to insert into the Array
     * @param {Array} list The list to insert into
     * @return {Array} A new Array with `elt` inserted at `index`.
     * @example
     *
     *      R.insert(2, 'x', [1,2,3,4]); //=> [1,2,'x',3,4]
     */
    var insert = _curry3(function insert(idx, elt, list) {
        idx = idx < list.length && idx >= 0 ? idx : list.length;
        var result = _slice(list);
        result.splice(idx, 0, elt);
        return result;
    });

    /**
     * Inserts the sub-list into the list, at index `index`. _Note that this is not
     * destructive_: it returns a copy of the list with the changes.
     * <small>No lists have been harmed in the application of this function.</small>
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category List
     * @sig Number -> [a] -> [a] -> [a]
     * @param {Number} index The position to insert the sub-list
     * @param {Array} elts The sub-list to insert into the Array
     * @param {Array} list The list to insert the sub-list into
     * @return {Array} A new Array with `elts` inserted starting at `index`.
     * @example
     *
     *      R.insertAll(2, ['x','y','z'], [1,2,3,4]); //=> [1,2,'x','y','z',3,4]
     */
    var insertAll = _curry3(function insertAll(idx, elts, list) {
        idx = idx < list.length && idx >= 0 ? idx : list.length;
        return _concat(_concat(_slice(list, 0, idx), elts), _slice(list, idx));
    });

    /**
     * Creates a new list with the separator interposed between elements.
     *
     * Dispatches to the `intersperse` method of the second argument, if present.
     *
     * @func
     * @memberOf R
     * @since v0.14.0
     * @category List
     * @sig a -> [a] -> [a]
     * @param {*} separator The element to add to the list.
     * @param {Array} list The list to be interposed.
     * @return {Array} The new list.
     * @example
     *
     *      R.intersperse('n', ['ba', 'a', 'a']); //=> ['ba', 'n', 'a', 'n', 'a']
     */
    var intersperse = _curry2(_checkForMethod('intersperse', function intersperse(separator, list) {
        var out = [];
        var idx = 0;
        var length = list.length;
        while (idx < length) {
            if (idx === length - 1) {
                out.push(list[idx]);
            } else {
                out.push(list[idx], separator);
            }
            idx += 1;
        }
        return out;
    }));

    /**
     * See if an object (`val`) is an instance of the supplied constructor. This
     * function will check up the inheritance chain, if any.
     *
     * @func
     * @memberOf R
     * @since v0.3.0
     * @category Type
     * @sig (* -> {*}) -> a -> Boolean
     * @param {Object} ctor A constructor
     * @param {*} val The value to test
     * @return {Boolean}
     * @example
     *
     *      R.is(Object, {}); //=> true
     *      R.is(Number, 1); //=> true
     *      R.is(Object, 1); //=> false
     *      R.is(String, 's'); //=> true
     *      R.is(String, new String('')); //=> true
     *      R.is(Object, new String('')); //=> true
     *      R.is(Object, 's'); //=> false
     *      R.is(Number, {}); //=> false
     */
    var is = _curry2(function is(Ctor, val) {
        return val != null && val.constructor === Ctor || val instanceof Ctor;
    });

    /**
     * Tests whether or not an object is similar to an array.
     *
     * @func
     * @memberOf R
     * @since v0.5.0
     * @category Type
     * @category List
     * @sig * -> Boolean
     * @param {*} x The object to test.
     * @return {Boolean} `true` if `x` has a numeric length property and extreme indices defined; `false` otherwise.
     * @example
     *
     *      R.isArrayLike([]); //=> true
     *      R.isArrayLike(true); //=> false
     *      R.isArrayLike({}); //=> false
     *      R.isArrayLike({length: 10}); //=> false
     *      R.isArrayLike({0: 'zero', 9: 'nine', length: 10}); //=> true
     */
    var isArrayLike = _curry1(function isArrayLike(x) {
        if (_isArray(x)) {
            return true;
        }
        if (!x) {
            return false;
        }
        if (typeof x !== 'object') {
            return false;
        }
        if (x instanceof String) {
            return false;
        }
        if (x.nodeType === 1) {
            return !!x.length;
        }
        if (x.length === 0) {
            return true;
        }
        if (x.length > 0) {
            return x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1);
        }
        return false;
    });

    /**
     * Checks if the input value is `null` or `undefined`.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category Type
     * @sig * -> Boolean
     * @param {*} x The value to test.
     * @return {Boolean} `true` if `x` is `undefined` or `null`, otherwise `false`.
     * @example
     *
     *      R.isNil(null); //=> true
     *      R.isNil(undefined); //=> true
     *      R.isNil(0); //=> false
     *      R.isNil([]); //=> false
     */
    var isNil = _curry1(function isNil(x) {
        return x == null;
    });

    /**
     * Returns a list containing the names of all the enumerable own properties of
     * the supplied object.
     * Note that the order of the output array is not guaranteed to be consistent
     * across different JS platforms.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Object
     * @sig {k: v} -> [k]
     * @param {Object} obj The object to extract properties from
     * @return {Array} An array of the object's own properties.
     * @example
     *
     *      R.keys({a: 1, b: 2, c: 3}); //=> ['a', 'b', 'c']
     */
    // cover IE < 9 keys issues
    // Safari bug
    var keys = function () {
        // cover IE < 9 keys issues
        var hasEnumBug = !{ toString: null }.propertyIsEnumerable('toString');
        var nonEnumerableProps = [
            'constructor',
            'valueOf',
            'isPrototypeOf',
            'toString',
            'propertyIsEnumerable',
            'hasOwnProperty',
            'toLocaleString'
        ];
        // Safari bug
        var hasArgsEnumBug = function () {
            'use strict';
            return arguments.propertyIsEnumerable('length');
        }();
        var contains = function contains(list, item) {
            var idx = 0;
            while (idx < list.length) {
                if (list[idx] === item) {
                    return true;
                }
                idx += 1;
            }
            return false;
        };
        return typeof Object.keys === 'function' && !hasArgsEnumBug ? _curry1(function keys(obj) {
            return Object(obj) !== obj ? [] : Object.keys(obj);
        }) : _curry1(function keys(obj) {
            if (Object(obj) !== obj) {
                return [];
            }
            var prop, nIdx;
            var ks = [];
            var checkArgsLength = hasArgsEnumBug && _isArguments(obj);
            for (prop in obj) {
                if (_has(prop, obj) && (!checkArgsLength || prop !== 'length')) {
                    ks[ks.length] = prop;
                }
            }
            if (hasEnumBug) {
                nIdx = nonEnumerableProps.length - 1;
                while (nIdx >= 0) {
                    prop = nonEnumerableProps[nIdx];
                    if (_has(prop, obj) && !contains(ks, prop)) {
                        ks[ks.length] = prop;
                    }
                    nIdx -= 1;
                }
            }
            return ks;
        });
    }();

    /**
     * Returns a list containing the names of all the properties of the supplied
     * object, including prototype properties.
     * Note that the order of the output array is not guaranteed to be consistent
     * across different JS platforms.
     *
     * @func
     * @memberOf R
     * @since v0.2.0
     * @category Object
     * @sig {k: v} -> [k]
     * @param {Object} obj The object to extract properties from
     * @return {Array} An array of the object's own and prototype properties.
     * @example
     *
     *      var F = function() { this.x = 'X'; };
     *      F.prototype.y = 'Y';
     *      var f = new F();
     *      R.keysIn(f); //=> ['x', 'y']
     */
    var keysIn = _curry1(function keysIn(obj) {
        var prop;
        var ks = [];
        for (prop in obj) {
            ks[ks.length] = prop;
        }
        return ks;
    });

    /**
     * Returns the number of elements in the array by returning `list.length`.
     *
     * @func
     * @memberOf R
     * @since v0.3.0
     * @category List
     * @sig [a] -> Number
     * @param {Array} list The array to inspect.
     * @return {Number} The length of the array.
     * @example
     *
     *      R.length([]); //=> 0
     *      R.length([1, 2, 3]); //=> 3
     */
    var length = _curry1(function length(list) {
        return list != null && is(Number, list.length) ? list.length : NaN;
    });

    /**
     * Returns `true` if the first argument is less than the second; `false`
     * otherwise.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Relation
     * @sig Ord a => a -> a -> Boolean
     * @param {*} a
     * @param {*} b
     * @return {Boolean}
     * @see R.gt
     * @example
     *
     *      R.lt(2, 1); //=> false
     *      R.lt(2, 2); //=> false
     *      R.lt(2, 3); //=> true
     *      R.lt('a', 'z'); //=> true
     *      R.lt('z', 'a'); //=> false
     */
    var lt = _curry2(function lt(a, b) {
        return a < b;
    });

    /**
     * Returns `true` if the first argument is less than or equal to the second;
     * `false` otherwise.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Relation
     * @sig Ord a => a -> a -> Boolean
     * @param {Number} a
     * @param {Number} b
     * @return {Boolean}
     * @see R.gte
     * @example
     *
     *      R.lte(2, 1); //=> false
     *      R.lte(2, 2); //=> true
     *      R.lte(2, 3); //=> true
     *      R.lte('a', 'z'); //=> true
     *      R.lte('z', 'a'); //=> false
     */
    var lte = _curry2(function lte(a, b) {
        return a <= b;
    });

    /**
     * The mapAccum function behaves like a combination of map and reduce; it
     * applies a function to each element of a list, passing an accumulating
     * parameter from left to right, and returning a final value of this
     * accumulator together with the new list.
     *
     * The iterator function receives two arguments, *acc* and *value*, and should
     * return a tuple *[acc, value]*.
     *
     * @func
     * @memberOf R
     * @since v0.10.0
     * @category List
     * @sig (acc -> x -> (acc, y)) -> acc -> [x] -> (acc, [y])
     * @param {Function} fn The function to be called on every element of the input `list`.
     * @param {*} acc The accumulator value.
     * @param {Array} list The list to iterate over.
     * @return {*} The final, accumulated value.
     * @see R.addIndex
     * @example
     *
     *      var digits = ['1', '2', '3', '4'];
     *      var append = (a, b) => [a + b, a + b];
     *
     *      R.mapAccum(append, 0, digits); //=> ['01234', ['01', '012', '0123', '01234']]
     */
    var mapAccum = _curry3(function mapAccum(fn, acc, list) {
        var idx = 0;
        var len = list.length;
        var result = [];
        var tuple = [acc];
        while (idx < len) {
            tuple = fn(tuple[0], list[idx]);
            result[idx] = tuple[1];
            idx += 1;
        }
        return [
            tuple[0],
            result
        ];
    });

    /**
     * The mapAccumRight function behaves like a combination of map and reduce; it
     * applies a function to each element of a list, passing an accumulating
     * parameter from right to left, and returning a final value of this
     * accumulator together with the new list.
     *
     * Similar to `mapAccum`, except moves through the input list from the right to
     * the left.
     *
     * The iterator function receives two arguments, *acc* and *value*, and should
     * return a tuple *[acc, value]*.
     *
     * @func
     * @memberOf R
     * @since v0.10.0
     * @category List
     * @sig (acc -> x -> (acc, y)) -> acc -> [x] -> (acc, [y])
     * @param {Function} fn The function to be called on every element of the input `list`.
     * @param {*} acc The accumulator value.
     * @param {Array} list The list to iterate over.
     * @return {*} The final, accumulated value.
     * @see R.addIndex
     * @example
     *
     *      var digits = ['1', '2', '3', '4'];
     *      var append = (a, b) => [a + b, a + b];
     *
     *      R.mapAccumRight(append, 0, digits); //=> ['04321', ['04321', '0432', '043', '04']]
     */
    var mapAccumRight = _curry3(function mapAccumRight(fn, acc, list) {
        var idx = list.length - 1;
        var result = [];
        var tuple = [acc];
        while (idx >= 0) {
            tuple = fn(tuple[0], list[idx]);
            result[idx] = tuple[1];
            idx -= 1;
        }
        return [
            tuple[0],
            result
        ];
    });

    /**
     * Tests a regular expression against a String. Note that this function will
     * return an empty array when there are no matches. This differs from
     * [`String.prototype.match`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match)
     * which returns `null` when there are no matches.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category String
     * @sig RegExp -> String -> [String | Undefined]
     * @param {RegExp} rx A regular expression.
     * @param {String} str The string to match against
     * @return {Array} The list of matches or empty array.
     * @see R.test
     * @example
     *
     *      R.match(/([a-z]a)/g, 'bananas'); //=> ['ba', 'na', 'na']
     *      R.match(/a/, 'b'); //=> []
     *      R.match(/a/, null); //=> TypeError: null does not have a method named "match"
     */
    var match = _curry2(function match(rx, str) {
        return str.match(rx) || [];
    });

    /**
     * mathMod behaves like the modulo operator should mathematically, unlike the
     * `%` operator (and by extension, R.modulo). So while "-17 % 5" is -2,
     * mathMod(-17, 5) is 3. mathMod requires Integer arguments, and returns NaN
     * when the modulus is zero or negative.
     *
     * @func
     * @memberOf R
     * @since v0.3.0
     * @category Math
     * @sig Number -> Number -> Number
     * @param {Number} m The dividend.
     * @param {Number} p the modulus.
     * @return {Number} The result of `b mod a`.
     * @example
     *
     *      R.mathMod(-17, 5);  //=> 3
     *      R.mathMod(17, 5);   //=> 2
     *      R.mathMod(17, -5);  //=> NaN
     *      R.mathMod(17, 0);   //=> NaN
     *      R.mathMod(17.2, 5); //=> NaN
     *      R.mathMod(17, 5.3); //=> NaN
     *
     *      var clock = R.mathMod(R.__, 12);
     *      clock(15); //=> 3
     *      clock(24); //=> 0
     *
     *      var seventeenMod = R.mathMod(17);
     *      seventeenMod(3);  //=> 2
     *      seventeenMod(4);  //=> 1
     *      seventeenMod(10); //=> 7
     */
    var mathMod = _curry2(function mathMod(m, p) {
        if (!_isInteger(m)) {
            return NaN;
        }
        if (!_isInteger(p) || p < 1) {
            return NaN;
        }
        return (m % p + p) % p;
    });

    /**
     * Returns the larger of its two arguments.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Relation
     * @sig Ord a => a -> a -> a
     * @param {*} a
     * @param {*} b
     * @return {*}
     * @see R.maxBy, R.min
     * @example
     *
     *      R.max(789, 123); //=> 789
     *      R.max('a', 'b'); //=> 'b'
     */
    var max = _curry2(function max(a, b) {
        return b > a ? b : a;
    });

    /**
     * Takes a function and two values, and returns whichever value produces the
     * larger result when passed to the provided function.
     *
     * @func
     * @memberOf R
     * @since v0.8.0
     * @category Relation
     * @sig Ord b => (a -> b) -> a -> a -> a
     * @param {Function} f
     * @param {*} a
     * @param {*} b
     * @return {*}
     * @see R.max, R.minBy
     * @example
     *
     *      //  square :: Number -> Number
     *      var square = n => n * n;
     *
     *      R.maxBy(square, -3, 2); //=> -3
     *
     *      R.reduce(R.maxBy(square), 0, [3, -5, 4, 1, -2]); //=> -5
     *      R.reduce(R.maxBy(square), 0, []); //=> 0
     */
    var maxBy = _curry3(function maxBy(f, a, b) {
        return f(b) > f(a) ? b : a;
    });

    /**
     * Creates a new object with the own properties of the two provided objects. If
     * a key exists in both objects, the provided function is applied to the key
     * and the values associated with the key in each object, with the result being
     * used as the value associated with the key in the returned object. The key
     * will be excluded from the returned object if the resulting value is
     * `undefined`.
     *
     * @func
     * @memberOf R
     * @since 0.19.1
     * @since 0.19.0
     * @category Object
     * @sig (String -> a -> a -> a) -> {a} -> {a} -> {a}
     * @param {Function} fn
     * @param {Object} l
     * @param {Object} r
     * @return {Object}
     * @see R.merge, R.mergeWith
     * @example
     *
     *      let concatValues = (k, l, r) => k == 'values' ? R.concat(l, r) : r
     *      R.mergeWithKey(concatValues,
     *                     { a: true, thing: 'foo', values: [10, 20] },
     *                     { b: true, thing: 'bar', values: [15, 35] });
     *      //=> { a: true, b: true, thing: 'bar', values: [10, 20, 15, 35] }
     */
    var mergeWithKey = _curry3(function mergeWithKey(fn, l, r) {
        var result = {};
        var k;
        for (k in l) {
            if (_has(k, l)) {
                result[k] = _has(k, r) ? fn(k, l[k], r[k]) : l[k];
            }
        }
        for (k in r) {
            if (_has(k, r) && !_has(k, result)) {
                result[k] = r[k];
            }
        }
        return result;
    });

    /**
     * Returns the smaller of its two arguments.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Relation
     * @sig Ord a => a -> a -> a
     * @param {*} a
     * @param {*} b
     * @return {*}
     * @see R.minBy, R.max
     * @example
     *
     *      R.min(789, 123); //=> 123
     *      R.min('a', 'b'); //=> 'a'
     */
    var min = _curry2(function min(a, b) {
        return b < a ? b : a;
    });

    /**
     * Takes a function and two values, and returns whichever value produces the
     * smaller result when passed to the provided function.
     *
     * @func
     * @memberOf R
     * @since v0.8.0
     * @category Relation
     * @sig Ord b => (a -> b) -> a -> a -> a
     * @param {Function} f
     * @param {*} a
     * @param {*} b
     * @return {*}
     * @see R.min, R.maxBy
     * @example
     *
     *      //  square :: Number -> Number
     *      var square = n => n * n;
     *
     *      R.minBy(square, -3, 2); //=> 2
     *
     *      R.reduce(R.minBy(square), Infinity, [3, -5, 4, 1, -2]); //=> 1
     *      R.reduce(R.minBy(square), Infinity, []); //=> Infinity
     */
    var minBy = _curry3(function minBy(f, a, b) {
        return f(b) < f(a) ? b : a;
    });

    /**
     * Divides the second parameter by the first and returns the remainder. Note
     * that this function preserves the JavaScript-style behavior for modulo. For
     * mathematical modulo see `mathMod`.
     *
     * @func
     * @memberOf R
     * @since v0.1.1
     * @category Math
     * @sig Number -> Number -> Number
     * @param {Number} a The value to the divide.
     * @param {Number} b The pseudo-modulus
     * @return {Number} The result of `b % a`.
     * @see R.mathMod
     * @example
     *
     *      R.modulo(17, 3); //=> 2
     *      // JS behavior:
     *      R.modulo(-17, 3); //=> -2
     *      R.modulo(17, -3); //=> 2
     *
     *      var isOdd = R.modulo(R.__, 2);
     *      isOdd(42); //=> 0
     *      isOdd(21); //=> 1
     */
    var modulo = _curry2(function modulo(a, b) {
        return a % b;
    });

    /**
     * Multiplies two numbers. Equivalent to `a * b` but curried.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Math
     * @sig Number -> Number -> Number
     * @param {Number} a The first value.
     * @param {Number} b The second value.
     * @return {Number} The result of `a * b`.
     * @see R.divide
     * @example
     *
     *      var double = R.multiply(2);
     *      var triple = R.multiply(3);
     *      double(3);       //=>  6
     *      triple(4);       //=> 12
     *      R.multiply(2, 5);  //=> 10
     */
    var multiply = _curry2(function multiply(a, b) {
        return a * b;
    });

    /**
     * Wraps a function of any arity (including nullary) in a function that accepts
     * exactly `n` parameters. Any extraneous parameters will not be passed to the
     * supplied function.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Function
     * @sig Number -> (* -> a) -> (* -> a)
     * @param {Number} n The desired arity of the new function.
     * @param {Function} fn The function to wrap.
     * @return {Function} A new function wrapping `fn`. The new function is guaranteed to be of
     *         arity `n`.
     * @example
     *
     *      var takesTwoArgs = (a, b) => [a, b];
     *
     *      takesTwoArgs.length; //=> 2
     *      takesTwoArgs(1, 2); //=> [1, 2]
     *
     *      var takesOneArg = R.nAry(1, takesTwoArgs);
     *      takesOneArg.length; //=> 1
     *      // Only `n` arguments are passed to the wrapped function
     *      takesOneArg(1, 2); //=> [1, undefined]
     */
    var nAry = _curry2(function nAry(n, fn) {
        switch (n) {
        case 0:
            return function () {
                return fn.call(this);
            };
        case 1:
            return function (a0) {
                return fn.call(this, a0);
            };
        case 2:
            return function (a0, a1) {
                return fn.call(this, a0, a1);
            };
        case 3:
            return function (a0, a1, a2) {
                return fn.call(this, a0, a1, a2);
            };
        case 4:
            return function (a0, a1, a2, a3) {
                return fn.call(this, a0, a1, a2, a3);
            };
        case 5:
            return function (a0, a1, a2, a3, a4) {
                return fn.call(this, a0, a1, a2, a3, a4);
            };
        case 6:
            return function (a0, a1, a2, a3, a4, a5) {
                return fn.call(this, a0, a1, a2, a3, a4, a5);
            };
        case 7:
            return function (a0, a1, a2, a3, a4, a5, a6) {
                return fn.call(this, a0, a1, a2, a3, a4, a5, a6);
            };
        case 8:
            return function (a0, a1, a2, a3, a4, a5, a6, a7) {
                return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7);
            };
        case 9:
            return function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
                return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8);
            };
        case 10:
            return function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
                return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9);
            };
        default:
            throw new Error('First argument to nAry must be a non-negative integer no greater than ten');
        }
    });

    /**
     * Negates its argument.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category Math
     * @sig Number -> Number
     * @param {Number} n
     * @return {Number}
     * @example
     *
     *      R.negate(42); //=> -42
     */
    var negate = _curry1(function negate(n) {
        return -n;
    });

    /**
     * Returns `true` if no elements of the list match the predicate, `false`
     * otherwise.
     *
     * Dispatches to the `any` method of the second argument, if present.
     *
     * @func
     * @memberOf R
     * @since v0.12.0
     * @category List
     * @sig (a -> Boolean) -> [a] -> Boolean
     * @param {Function} fn The predicate function.
     * @param {Array} list The array to consider.
     * @return {Boolean} `true` if the predicate is not satisfied by every element, `false` otherwise.
     * @see R.all, R.any
     * @example
     *
     *      var isEven = n => n % 2 === 0;
     *
     *      R.none(isEven, [1, 3, 5, 7, 9, 11]); //=> true
     *      R.none(isEven, [1, 3, 5, 7, 8, 11]); //=> false
     */
    var none = _curry2(_complement(_dispatchable('any', _xany, any)));

    /**
     * A function that returns the `!` of its argument. It will return `true` when
     * passed false-y value, and `false` when passed a truth-y one.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Logic
     * @sig * -> Boolean
     * @param {*} a any value
     * @return {Boolean} the logical inverse of passed argument.
     * @see R.complement
     * @example
     *
     *      R.not(true); //=> false
     *      R.not(false); //=> true
     *      R.not(0); => true
     *      R.not(1); => false
     */
    var not = _curry1(function not(a) {
        return !a;
    });

    /**
     * Returns the nth element of the given list or string. If n is negative the
     * element at index length + n is returned.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig Number -> [a] -> a | Undefined
     * @sig Number -> String -> String
     * @param {Number} offset
     * @param {*} list
     * @return {*}
     * @example
     *
     *      var list = ['foo', 'bar', 'baz', 'quux'];
     *      R.nth(1, list); //=> 'bar'
     *      R.nth(-1, list); //=> 'quux'
     *      R.nth(-99, list); //=> undefined
     *
     *      R.nth('abc', 2); //=> 'c'
     *      R.nth('abc', 3); //=> ''
     */
    var nth = _curry2(function nth(offset, list) {
        var idx = offset < 0 ? list.length + offset : offset;
        return _isString(list) ? list.charAt(idx) : list[idx];
    });

    /**
     * Returns a function which returns its nth argument.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category Function
     * @sig Number -> *... -> *
     * @param {Number} n
     * @return {Function}
     * @example
     *
     *      R.nthArg(1)('a', 'b', 'c'); //=> 'b'
     *      R.nthArg(-1)('a', 'b', 'c'); //=> 'c'
     */
    var nthArg = _curry1(function nthArg(n) {
        return function () {
            return nth(n, arguments);
        };
    });

    /**
     * Creates an object containing a single key:value pair.
     *
     * @func
     * @memberOf R
     * @since v0.18.0
     * @category Object
     * @sig String -> a -> {String:a}
     * @param {String} key
     * @param {*} val
     * @return {Object}
     * @see R.pair
     * @example
     *
     *      var matchPhrases = R.compose(
     *        R.objOf('must'),
     *        R.map(R.objOf('match_phrase'))
     *      );
     *      matchPhrases(['foo', 'bar', 'baz']); //=> {must: [{match_phrase: 'foo'}, {match_phrase: 'bar'}, {match_phrase: 'baz'}]}
     */
    var objOf = _curry2(function objOf(key, val) {
        var obj = {};
        obj[key] = val;
        return obj;
    });

    /**
     * Returns a singleton array containing the value provided.
     *
     * Note this `of` is different from the ES6 `of`; See
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/of
     *
     * @func
     * @memberOf R
     * @since v0.3.0
     * @category Function
     * @sig a -> [a]
     * @param {*} x any value
     * @return {Array} An array wrapping `x`.
     * @example
     *
     *      R.of(null); //=> [null]
     *      R.of([42]); //=> [[42]]
     */
    var of = _curry1(_of);

    /**
     * Accepts a function `fn` and returns a function that guards invocation of
     * `fn` such that `fn` can only ever be called once, no matter how many times
     * the returned function is invoked. The first value calculated is returned in
     * subsequent invocations.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Function
     * @sig (a... -> b) -> (a... -> b)
     * @param {Function} fn The function to wrap in a call-only-once wrapper.
     * @return {Function} The wrapped function.
     * @example
     *
     *      var addOneOnce = R.once(x => x + 1);
     *      addOneOnce(10); //=> 11
     *      addOneOnce(addOneOnce(50)); //=> 11
     */
    var once = _curry1(function once(fn) {
        var called = false;
        var result;
        return _arity(fn.length, function () {
            if (called) {
                return result;
            }
            called = true;
            result = fn.apply(this, arguments);
            return result;
        });
    });

    /**
     * Returns `true` if one or both of its arguments are `true`. Returns `false`
     * if both arguments are `false`.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Logic
     * @sig * -> * -> *
     * @param {Boolean} a A boolean value
     * @param {Boolean} b A boolean value
     * @return {Boolean} `true` if one or both arguments are `true`, `false` otherwise
     * @see R.either
     * @example
     *
     *      R.or(true, true); //=> true
     *      R.or(true, false); //=> true
     *      R.or(false, true); //=> true
     *      R.or(false, false); //=> false
     */
    var or = _curry2(function or(a, b) {
        return a || b;
    });

    /**
     * Returns the result of "setting" the portion of the given data structure
     * focused by the given lens to the result of applying the given function to
     * the focused value.
     *
     * @func
     * @memberOf R
     * @since v0.16.0
     * @category Object
     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
     * @sig Lens s a -> (a -> a) -> s -> s
     * @param {Lens} lens
     * @param {*} v
     * @param {*} x
     * @return {*}
     * @see R.prop, R.lensIndex, R.lensProp
     * @example
     *
     *      var headLens = R.lensIndex(0);
     *
     *      R.over(headLens, R.toUpper, ['foo', 'bar', 'baz']); //=> ['FOO', 'bar', 'baz']
     */
    var over = function () {
        var Identity = function (x) {
            return {
                value: x,
                map: function (f) {
                    return Identity(f(x));
                }
            };
        };
        return _curry3(function over(lens, f, x) {
            return lens(function (y) {
                return Identity(f(y));
            })(x).value;
        });
    }();

    /**
     * Takes two arguments, `fst` and `snd`, and returns `[fst, snd]`.
     *
     * @func
     * @memberOf R
     * @since v0.18.0
     * @category List
     * @sig a -> b -> (a,b)
     * @param {*} fst
     * @param {*} snd
     * @return {Array}
     * @see R.createMapEntry, R.of
     * @example
     *
     *      R.pair('foo', 'bar'); //=> ['foo', 'bar']
     */
    var pair = _curry2(function pair(fst, snd) {
        return [
            fst,
            snd
        ];
    });

    /**
     * Retrieve the value at a given path.
     *
     * @func
     * @memberOf R
     * @since v0.2.0
     * @category Object
     * @sig [String] -> {k: v} -> v | Undefined
     * @param {Array} path The path to use.
     * @param {Object} obj The object to retrieve the nested property from.
     * @return {*} The data at `path`.
     * @example
     *
     *      R.path(['a', 'b'], {a: {b: 2}}); //=> 2
     *      R.path(['a', 'b'], {c: {b: 2}}); //=> undefined
     */
    var path = _curry2(function path(paths, obj) {
        var val = obj;
        var idx = 0;
        while (idx < paths.length) {
            if (val == null) {
                return;
            }
            val = val[paths[idx]];
            idx += 1;
        }
        return val;
    });

    /**
     * If the given, non-null object has a value at the given path, returns the
     * value at that path. Otherwise returns the provided default value.
     *
     * @func
     * @memberOf R
     * @since v0.18.0
     * @category Object
     * @sig a -> [String] -> Object -> a
     * @param {*} d The default value.
     * @param {Array} p The path to use.
     * @param {Object} obj The object to retrieve the nested property from.
     * @return {*} The data at `path` of the supplied object or the default value.
     * @example
     *
     *      R.pathOr('N/A', ['a', 'b'], {a: {b: 2}}); //=> 2
     *      R.pathOr('N/A', ['a', 'b'], {c: {b: 2}}); //=> "N/A"
     */
    var pathOr = _curry3(function pathOr(d, p, obj) {
        return defaultTo(d, path(p, obj));
    });

    /**
     * Returns `true` if the specified object property at given path satisfies the
     * given predicate; `false` otherwise.
     *
     * @func
     * @memberOf R
     * @since 0.19.1
     * @since 0.19.0
     * @category Logic
     * @sig (a -> Boolean) -> [String] -> Object -> Boolean
     * @param {Function} pred
     * @param {Array} propPath
     * @param {*} obj
     * @return {Boolean}
     * @see R.propSatisfies, R.path
     * @example
     *
     *      R.pathSatisfies(y => y > 0, ['x', 'y'], {x: {y: 2}}); //=> true
     */
    var pathSatisfies = _curry3(function pathSatisfies(pred, propPath, obj) {
        return propPath.length > 0 && pred(path(propPath, obj));
    });

    /**
     * Returns a partial copy of an object containing only the keys specified. If
     * the key does not exist, the property is ignored.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Object
     * @sig [k] -> {k: v} -> {k: v}
     * @param {Array} names an array of String property names to copy onto a new object
     * @param {Object} obj The object to copy from
     * @return {Object} A new object with only properties from `names` on it.
     * @see R.omit, R.props
     * @example
     *
     *      R.pick(['a', 'd'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1, d: 4}
     *      R.pick(['a', 'e', 'f'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1}
     */
    var pick = _curry2(function pick(names, obj) {
        var result = {};
        var idx = 0;
        while (idx < names.length) {
            if (names[idx] in obj) {
                result[names[idx]] = obj[names[idx]];
            }
            idx += 1;
        }
        return result;
    });

    /**
     * Similar to `pick` except that this one includes a `key: undefined` pair for
     * properties that don't exist.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Object
     * @sig [k] -> {k: v} -> {k: v}
     * @param {Array} names an array of String property names to copy onto a new object
     * @param {Object} obj The object to copy from
     * @return {Object} A new object with only properties from `names` on it.
     * @see R.pick
     * @example
     *
     *      R.pickAll(['a', 'd'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1, d: 4}
     *      R.pickAll(['a', 'e', 'f'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1, e: undefined, f: undefined}
     */
    var pickAll = _curry2(function pickAll(names, obj) {
        var result = {};
        var idx = 0;
        var len = names.length;
        while (idx < len) {
            var name = names[idx];
            result[name] = obj[name];
            idx += 1;
        }
        return result;
    });

    /**
     * Returns a partial copy of an object containing only the keys that satisfy
     * the supplied predicate.
     *
     * @func
     * @memberOf R
     * @since v0.8.0
     * @category Object
     * @sig (v, k -> Boolean) -> {k: v} -> {k: v}
     * @param {Function} pred A predicate to determine whether or not a key
     *        should be included on the output object.
     * @param {Object} obj The object to copy from
     * @return {Object} A new object with only properties that satisfy `pred`
     *         on it.
     * @see R.pick, R.filter
     * @example
     *
     *      var isUpperCase = (val, key) => key.toUpperCase() === key;
     *      R.pickBy(isUpperCase, {a: 1, b: 2, A: 3, B: 4}); //=> {A: 3, B: 4}
     */
    var pickBy = _curry2(function pickBy(test, obj) {
        var result = {};
        for (var prop in obj) {
            if (test(obj[prop], prop, obj)) {
                result[prop] = obj[prop];
            }
        }
        return result;
    });

    /**
     * Returns a new list with the given element at the front, followed by the
     * contents of the list.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig a -> [a] -> [a]
     * @param {*} el The item to add to the head of the output list.
     * @param {Array} list The array to add to the tail of the output list.
     * @return {Array} A new array.
     * @see R.append
     * @example
     *
     *      R.prepend('fee', ['fi', 'fo', 'fum']); //=> ['fee', 'fi', 'fo', 'fum']
     */
    var prepend = _curry2(function prepend(el, list) {
        return _concat([el], list);
    });

    /**
     * Returns a function that when supplied an object returns the indicated
     * property of that object, if it exists.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Object
     * @sig s -> {s: a} -> a | Undefined
     * @param {String} p The property name
     * @param {Object} obj The object to query
     * @return {*} The value at `obj.p`.
     * @example
     *
     *      R.prop('x', {x: 100}); //=> 100
     *      R.prop('x', {}); //=> undefined
     */
    var prop = _curry2(function prop(p, obj) {
        return obj[p];
    });

    /**
     * If the given, non-null object has an own property with the specified name,
     * returns the value of that property. Otherwise returns the provided default
     * value.
     *
     * @func
     * @memberOf R
     * @since v0.6.0
     * @category Object
     * @sig a -> String -> Object -> a
     * @param {*} val The default value.
     * @param {String} p The name of the property to return.
     * @param {Object} obj The object to query.
     * @return {*} The value of given property of the supplied object or the default value.
     * @example
     *
     *      var alice = {
     *        name: 'ALICE',
     *        age: 101
     *      };
     *      var favorite = R.prop('favoriteLibrary');
     *      var favoriteWithDefault = R.propOr('Ramda', 'favoriteLibrary');
     *
     *      favorite(alice);  //=> undefined
     *      favoriteWithDefault(alice);  //=> 'Ramda'
     */
    var propOr = _curry3(function propOr(val, p, obj) {
        return obj != null && _has(p, obj) ? obj[p] : val;
    });

    /**
     * Returns `true` if the specified object property satisfies the given
     * predicate; `false` otherwise.
     *
     * @func
     * @memberOf R
     * @since v0.16.0
     * @category Logic
     * @sig (a -> Boolean) -> String -> {String: a} -> Boolean
     * @param {Function} pred
     * @param {String} name
     * @param {*} obj
     * @return {Boolean}
     * @see R.propEq, R.propIs
     * @example
     *
     *      R.propSatisfies(x => x > 0, 'x', {x: 1, y: 2}); //=> true
     */
    var propSatisfies = _curry3(function propSatisfies(pred, name, obj) {
        return pred(obj[name]);
    });

    /**
     * Acts as multiple `prop`: array of keys in, array of values out. Preserves
     * order.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Object
     * @sig [k] -> {k: v} -> [v]
     * @param {Array} ps The property names to fetch
     * @param {Object} obj The object to query
     * @return {Array} The corresponding values or partially applied function.
     * @example
     *
     *      R.props(['x', 'y'], {x: 1, y: 2}); //=> [1, 2]
     *      R.props(['c', 'a', 'b'], {b: 2, a: 1}); //=> [undefined, 1, 2]
     *
     *      var fullName = R.compose(R.join(' '), R.props(['first', 'last']));
     *      fullName({last: 'Bullet-Tooth', age: 33, first: 'Tony'}); //=> 'Tony Bullet-Tooth'
     */
    var props = _curry2(function props(ps, obj) {
        var len = ps.length;
        var out = [];
        var idx = 0;
        while (idx < len) {
            out[idx] = obj[ps[idx]];
            idx += 1;
        }
        return out;
    });

    /**
     * Returns a list of numbers from `from` (inclusive) to `to` (exclusive).
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig Number -> Number -> [Number]
     * @param {Number} from The first number in the list.
     * @param {Number} to One more than the last number in the list.
     * @return {Array} The list of numbers in tthe set `[a, b)`.
     * @example
     *
     *      R.range(1, 5);    //=> [1, 2, 3, 4]
     *      R.range(50, 53);  //=> [50, 51, 52]
     */
    var range = _curry2(function range(from, to) {
        if (!(_isNumber(from) && _isNumber(to))) {
            throw new TypeError('Both arguments to range must be numbers');
        }
        var result = [];
        var n = from;
        while (n < to) {
            result.push(n);
            n += 1;
        }
        return result;
    });

    /**
     * Returns a single item by iterating through the list, successively calling
     * the iterator function and passing it an accumulator value and the current
     * value from the array, and then passing the result to the next call.
     *
     * Similar to `reduce`, except moves through the input list from the right to
     * the left.
     *
     * The iterator function receives two values: *(acc, value)*
     *
     * Note: `R.reduceRight` does not skip deleted or unassigned indices (sparse
     * arrays), unlike the native `Array.prototype.reduce` method. For more details
     * on this behavior, see:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduceRight#Description
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig (a,b -> a) -> a -> [b] -> a
     * @param {Function} fn The iterator function. Receives two values, the accumulator and the
     *        current element from the array.
     * @param {*} acc The accumulator value.
     * @param {Array} list The list to iterate over.
     * @return {*} The final, accumulated value.
     * @see R.addIndex
     * @example
     *
     *      var pairs = [ ['a', 1], ['b', 2], ['c', 3] ];
     *      var flattenPairs = (acc, pair) => acc.concat(pair);
     *
     *      R.reduceRight(flattenPairs, [], pairs); //=> [ 'c', 3, 'b', 2, 'a', 1 ]
     */
    var reduceRight = _curry3(function reduceRight(fn, acc, list) {
        var idx = list.length - 1;
        while (idx >= 0) {
            acc = fn(acc, list[idx]);
            idx -= 1;
        }
        return acc;
    });

    /**
     * Returns a value wrapped to indicate that it is the final value of the reduce
     * and transduce functions. The returned value should be considered a black
     * box: the internal structure is not guaranteed to be stable.
     *
     * Note: this optimization is unavailable to functions not explicitly listed
     * above. For instance, it is not currently supported by reduceRight.
     *
     * @func
     * @memberOf R
     * @since v0.15.0
     * @category List
     * @sig a -> *
     * @param {*} x The final value of the reduce.
     * @return {*} The wrapped value.
     * @see R.reduce, R.transduce
     * @example
     *
     *      R.reduce(
     *        R.pipe(R.add, R.when(R.gte(R.__, 10), R.reduced)),
     *        0,
     *        [1, 2, 3, 4, 5]) // 10
     */
    var reduced = _curry1(_reduced);

    /**
     * Removes the sub-list of `list` starting at index `start` and containing
     * `count` elements. _Note that this is not destructive_: it returns a copy of
     * the list with the changes.
     * <small>No lists have been harmed in the application of this function.</small>
     *
     * @func
     * @memberOf R
     * @since v0.2.2
     * @category List
     * @sig Number -> Number -> [a] -> [a]
     * @param {Number} start The position to start removing elements
     * @param {Number} count The number of elements to remove
     * @param {Array} list The list to remove from
     * @return {Array} A new Array with `count` elements from `start` removed.
     * @example
     *
     *      R.remove(2, 3, [1,2,3,4,5,6,7,8]); //=> [1,2,6,7,8]
     */
    var remove = _curry3(function remove(start, count, list) {
        return _concat(_slice(list, 0, Math.min(start, list.length)), _slice(list, Math.min(list.length, start + count)));
    });

    /**
     * Replace a substring or regex match in a string with a replacement.
     *
     * @func
     * @memberOf R
     * @since v0.7.0
     * @category String
     * @sig RegExp|String -> String -> String -> String
     * @param {RegExp|String} pattern A regular expression or a substring to match.
     * @param {String} replacement The string to replace the matches with.
     * @param {String} str The String to do the search and replacement in.
     * @return {String} The result.
     * @example
     *
     *      R.replace('foo', 'bar', 'foo foo foo'); //=> 'bar foo foo'
     *      R.replace(/foo/, 'bar', 'foo foo foo'); //=> 'bar foo foo'
     *
     *      // Use the "g" (global) flag to replace all occurrences:
     *      R.replace(/foo/g, 'bar', 'foo foo foo'); //=> 'bar bar bar'
     */
    var replace = _curry3(function replace(regex, replacement, str) {
        return str.replace(regex, replacement);
    });

    /**
     * Returns a new list or string with the elements or characters in reverse
     * order.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig [a] -> [a]
     * @sig String -> String
     * @param {Array|String} list
     * @return {Array|String}
     * @example
     *
     *      R.reverse([1, 2, 3]);  //=> [3, 2, 1]
     *      R.reverse([1, 2]);     //=> [2, 1]
     *      R.reverse([1]);        //=> [1]
     *      R.reverse([]);         //=> []
     *
     *      R.reverse('abc');      //=> 'cba'
     *      R.reverse('ab');       //=> 'ba'
     *      R.reverse('a');        //=> 'a'
     *      R.reverse('');         //=> ''
     */
    var reverse = _curry1(function reverse(list) {
        return _isString(list) ? list.split('').reverse().join('') : _slice(list).reverse();
    });

    /**
     * Scan is similar to reduce, but returns a list of successively reduced values
     * from the left
     *
     * @func
     * @memberOf R
     * @since v0.10.0
     * @category List
     * @sig (a,b -> a) -> a -> [b] -> [a]
     * @param {Function} fn The iterator function. Receives two values, the accumulator and the
     *        current element from the array
     * @param {*} acc The accumulator value.
     * @param {Array} list The list to iterate over.
     * @return {Array} A list of all intermediately reduced values.
     * @example
     *
     *      var numbers = [1, 2, 3, 4];
     *      var factorials = R.scan(R.multiply, 1, numbers); //=> [1, 1, 2, 6, 24]
     */
    var scan = _curry3(function scan(fn, acc, list) {
        var idx = 0;
        var len = list.length;
        var result = [acc];
        while (idx < len) {
            acc = fn(acc, list[idx]);
            result[idx + 1] = acc;
            idx += 1;
        }
        return result;
    });

    /**
     * Returns the result of "setting" the portion of the given data structure
     * focused by the given lens to the given value.
     *
     * @func
     * @memberOf R
     * @since v0.16.0
     * @category Object
     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
     * @sig Lens s a -> a -> s -> s
     * @param {Lens} lens
     * @param {*} v
     * @param {*} x
     * @return {*}
     * @see R.prop, R.lensIndex, R.lensProp
     * @example
     *
     *      var xLens = R.lensProp('x');
     *
     *      R.set(xLens, 4, {x: 1, y: 2});  //=> {x: 4, y: 2}
     *      R.set(xLens, 8, {x: 1, y: 2});  //=> {x: 8, y: 2}
     */
    var set = _curry3(function set(lens, v, x) {
        return over(lens, always(v), x);
    });

    /**
     * Returns the elements of the given list or string (or object with a `slice`
     * method) from `fromIndex` (inclusive) to `toIndex` (exclusive).
     *
     * Dispatches to the `slice` method of the third argument, if present.
     *
     * @func
     * @memberOf R
     * @since v0.1.4
     * @category List
     * @sig Number -> Number -> [a] -> [a]
     * @sig Number -> Number -> String -> String
     * @param {Number} fromIndex The start index (inclusive).
     * @param {Number} toIndex The end index (exclusive).
     * @param {*} list
     * @return {*}
     * @example
     *
     *      R.slice(1, 3, ['a', 'b', 'c', 'd']);        //=> ['b', 'c']
     *      R.slice(1, Infinity, ['a', 'b', 'c', 'd']); //=> ['b', 'c', 'd']
     *      R.slice(0, -1, ['a', 'b', 'c', 'd']);       //=> ['a', 'b', 'c']
     *      R.slice(-3, -1, ['a', 'b', 'c', 'd']);      //=> ['b', 'c']
     *      R.slice(0, 3, 'ramda');                     //=> 'ram'
     */
    var slice = _curry3(_checkForMethod('slice', function slice(fromIndex, toIndex, list) {
        return Array.prototype.slice.call(list, fromIndex, toIndex);
    }));

    /**
     * Returns a copy of the list, sorted according to the comparator function,
     * which should accept two values at a time and return a negative number if the
     * first value is smaller, a positive number if it's larger, and zero if they
     * are equal. Please note that this is a **copy** of the list. It does not
     * modify the original.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig (a,a -> Number) -> [a] -> [a]
     * @param {Function} comparator A sorting function :: a -> b -> Int
     * @param {Array} list The list to sort
     * @return {Array} a new array with its elements sorted by the comparator function.
     * @example
     *
     *      var diff = function(a, b) { return a - b; };
     *      R.sort(diff, [4,2,7,5]); //=> [2, 4, 5, 7]
     */
    var sort = _curry2(function sort(comparator, list) {
        return _slice(list).sort(comparator);
    });

    /**
     * Sorts the list according to the supplied function.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Relation
     * @sig Ord b => (a -> b) -> [a] -> [a]
     * @param {Function} fn
     * @param {Array} list The list to sort.
     * @return {Array} A new list sorted by the keys generated by `fn`.
     * @example
     *
     *      var sortByFirstItem = R.sortBy(R.prop(0));
     *      var sortByNameCaseInsensitive = R.sortBy(R.compose(R.toLower, R.prop('name')));
     *      var pairs = [[-1, 1], [-2, 2], [-3, 3]];
     *      sortByFirstItem(pairs); //=> [[-3, 3], [-2, 2], [-1, 1]]
     *      var alice = {
     *        name: 'ALICE',
     *        age: 101
     *      };
     *      var bob = {
     *        name: 'Bob',
     *        age: -10
     *      };
     *      var clara = {
     *        name: 'clara',
     *        age: 314.159
     *      };
     *      var people = [clara, bob, alice];
     *      sortByNameCaseInsensitive(people); //=> [alice, bob, clara]
     */
    var sortBy = _curry2(function sortBy(fn, list) {
        return _slice(list).sort(function (a, b) {
            var aa = fn(a);
            var bb = fn(b);
            return aa < bb ? -1 : aa > bb ? 1 : 0;
        });
    });

    /**
     * Splits a given list or string at a given index.
     *
     * @func
     * @memberOf R
     * @since 0.19.1
     * @since 0.19.0
     * @category List
     * @sig Number -> [a] -> [[a], [a]]
     * @sig Number -> String -> [String, String]
     * @param {Number} index The index where the array/string is split.
     * @param {Array|String} array The array/string to be split.
     * @return {Array}
     * @example
     *
     *      R.splitAt(1, [1, 2, 3]);          //=> [[1], [2, 3]]
     *      R.splitAt(5, 'hello world');      //=> ['hello', ' world']
     *      R.splitAt(-1, 'foobar');          //=> ['fooba', 'r']
     */
    var splitAt = _curry2(function splitAt(index, array) {
        return [
            slice(0, index, array),
            slice(index, length(array), array)
        ];
    });

    /**
     * Splits a collection into slices of the specified length.
     *
     * @func
     * @memberOf R
     * @since v0.16.0
     * @category List
     * @sig Number -> [a] -> [[a]]
     * @sig Number -> String -> [String]
     * @param {Number} n
     * @param {Array} list
     * @return {Array}
     * @example
     *
     *      R.splitEvery(3, [1, 2, 3, 4, 5, 6, 7]); //=> [[1, 2, 3], [4, 5, 6], [7]]
     *      R.splitEvery(3, 'foobarbaz'); //=> ['foo', 'bar', 'baz']
     */
    var splitEvery = _curry2(function splitEvery(n, list) {
        if (n <= 0) {
            throw new Error('First argument to splitEvery must be a positive integer');
        }
        var result = [];
        var idx = 0;
        while (idx < list.length) {
            result.push(slice(idx, idx += n, list));
        }
        return result;
    });

    /**
     * Takes a list and a predicate and returns a pair of lists with the following properties:
     *
     *  - the result of concatenating the two output lists is equivalent to the input list;
     *  - none of the elements of the first output list satisfies the predicate; and
     *  - if the second output list is non-empty, its first element satisfies the predicate.
     *
     * @func
     * @memberOf R
     * @since 0.19.1
     * @since 0.19.0
     * @category List
     * @sig (a -> Boolean) -> [a] -> [[a], [a]]
     * @param {Function} pred The predicate that determines where the array is split.
     * @param {Array} list The array to be split.
     * @return {Array}
     * @example
     *
     *      R.splitWhen(R.equals(2), [1, 2, 3, 1, 2, 3]);   //=> [[1], [2, 3, 1, 2, 3]]
     */
    var splitWhen = _curry2(function splitWhen(pred, list) {
        var idx = 0;
        var len = list.length;
        var prefix = [];
        while (idx < len && !pred(list[idx])) {
            prefix.push(list[idx]);
            idx += 1;
        }
        return [
            prefix,
            _slice(list, idx)
        ];
    });

    /**
     * Subtracts two numbers. Equivalent to `a - b` but curried.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Math
     * @sig Number -> Number -> Number
     * @param {Number} a The first value.
     * @param {Number} b The second value.
     * @return {Number} The result of `a - b`.
     * @see R.add
     * @example
     *
     *      R.subtract(10, 8); //=> 2
     *
     *      var minus5 = R.subtract(R.__, 5);
     *      minus5(17); //=> 12
     *
     *      var complementaryAngle = R.subtract(90);
     *      complementaryAngle(30); //=> 60
     *      complementaryAngle(72); //=> 18
     */
    var subtract = _curry2(function subtract(a, b) {
        return a - b;
    });

    /**
     * Returns all but the first element of the given list or string (or object
     * with a `tail` method).
     *
     * Dispatches to the `slice` method of the first argument, if present.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig [a] -> [a]
     * @sig String -> String
     * @param {*} list
     * @return {*}
     * @see R.head, R.init, R.last
     * @example
     *
     *      R.tail([1, 2, 3]);  //=> [2, 3]
     *      R.tail([1, 2]);     //=> [2]
     *      R.tail([1]);        //=> []
     *      R.tail([]);         //=> []
     *
     *      R.tail('abc');  //=> 'bc'
     *      R.tail('ab');   //=> 'b'
     *      R.tail('a');    //=> ''
     *      R.tail('');     //=> ''
     */
    var tail = _checkForMethod('tail', slice(1, Infinity));

    /**
     * Returns the first `n` elements of the given list, string, or
     * transducer/transformer (or object with a `take` method).
     *
     * Dispatches to the `take` method of the second argument, if present.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig Number -> [a] -> [a]
     * @sig Number -> String -> String
     * @param {Number} n
     * @param {*} list
     * @return {*}
     * @see R.drop
     * @example
     *
     *      R.take(1, ['foo', 'bar', 'baz']); //=> ['foo']
     *      R.take(2, ['foo', 'bar', 'baz']); //=> ['foo', 'bar']
     *      R.take(3, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
     *      R.take(4, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
     *      R.take(3, 'ramda');               //=> 'ram'
     *
     *      var personnel = [
     *        'Dave Brubeck',
     *        'Paul Desmond',
     *        'Eugene Wright',
     *        'Joe Morello',
     *        'Gerry Mulligan',
     *        'Bob Bates',
     *        'Joe Dodge',
     *        'Ron Crotty'
     *      ];
     *
     *      var takeFive = R.take(5);
     *      takeFive(personnel);
     *      //=> ['Dave Brubeck', 'Paul Desmond', 'Eugene Wright', 'Joe Morello', 'Gerry Mulligan']
     */
    var take = _curry2(_dispatchable('take', _xtake, function take(n, xs) {
        return slice(0, n < 0 ? Infinity : n, xs);
    }));

    /**
     * Returns a new list containing the last `n` elements of a given list, passing
     * each value to the supplied predicate function, and terminating when the
     * predicate function returns `false`. Excludes the element that caused the
     * predicate function to fail. The predicate function is passed one argument:
     * *(value)*.
     *
     * @func
     * @memberOf R
     * @since v0.16.0
     * @category List
     * @sig (a -> Boolean) -> [a] -> [a]
     * @param {Function} fn The function called per iteration.
     * @param {Array} list The collection to iterate over.
     * @return {Array} A new array.
     * @see R.dropLastWhile, R.addIndex
     * @example
     *
     *      var isNotOne = x => x !== 1;
     *
     *      R.takeLastWhile(isNotOne, [1, 2, 3, 4]); //=> [2, 3, 4]
     */
    var takeLastWhile = _curry2(function takeLastWhile(fn, list) {
        var idx = list.length - 1;
        while (idx >= 0 && fn(list[idx])) {
            idx -= 1;
        }
        return _slice(list, idx + 1, Infinity);
    });

    /**
     * Returns a new list containing the first `n` elements of a given list,
     * passing each value to the supplied predicate function, and terminating when
     * the predicate function returns `false`. Excludes the element that caused the
     * predicate function to fail. The predicate function is passed one argument:
     * *(value)*.
     *
     * Dispatches to the `takeWhile` method of the second argument, if present.
     *
     * Acts as a transducer if a transformer is given in list position.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig (a -> Boolean) -> [a] -> [a]
     * @param {Function} fn The function called per iteration.
     * @param {Array} list The collection to iterate over.
     * @return {Array} A new array.
     * @see R.dropWhile, R.transduce, R.addIndex
     * @example
     *
     *      var isNotFour = x => x !== 4;
     *
     *      R.takeWhile(isNotFour, [1, 2, 3, 4, 3, 2, 1]); //=> [1, 2, 3]
     */
    var takeWhile = _curry2(_dispatchable('takeWhile', _xtakeWhile, function takeWhile(fn, list) {
        var idx = 0;
        var len = list.length;
        while (idx < len && fn(list[idx])) {
            idx += 1;
        }
        return _slice(list, 0, idx);
    }));

    /**
     * Runs the given function with the supplied object, then returns the object.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Function
     * @sig (a -> *) -> a -> a
     * @param {Function} fn The function to call with `x`. The return value of `fn` will be thrown away.
     * @param {*} x
     * @return {*} `x`.
     * @example
     *
     *      var sayX = x => console.log('x is ' + x);
     *      R.tap(sayX, 100); //=> 100
     *      //-> 'x is 100'
     */
    var tap = _curry2(function tap(fn, x) {
        fn(x);
        return x;
    });

    /**
     * Calls an input function `n` times, returning an array containing the results
     * of those function calls.
     *
     * `fn` is passed one argument: The current value of `n`, which begins at `0`
     * and is gradually incremented to `n - 1`.
     *
     * @func
     * @memberOf R
     * @since v0.2.3
     * @category List
     * @sig (Number -> a) -> Number -> [a]
     * @param {Function} fn The function to invoke. Passed one argument, the current value of `n`.
     * @param {Number} n A value between `0` and `n - 1`. Increments after each function call.
     * @return {Array} An array containing the return values of all calls to `fn`.
     * @example
     *
     *      R.times(R.identity, 5); //=> [0, 1, 2, 3, 4]
     */
    var times = _curry2(function times(fn, n) {
        var len = Number(n);
        var idx = 0;
        var list;
        if (len < 0 || isNaN(len)) {
            throw new RangeError('n must be a non-negative number');
        }
        list = new Array(len);
        while (idx < len) {
            list[idx] = fn(idx);
            idx += 1;
        }
        return list;
    });

    /**
     * Converts an object into an array of key, value arrays. Only the object's
     * own properties are used.
     * Note that the order of the output array is not guaranteed to be consistent
     * across different JS platforms.
     *
     * @func
     * @memberOf R
     * @since v0.4.0
     * @category Object
     * @sig {String: *} -> [[String,*]]
     * @param {Object} obj The object to extract from
     * @return {Array} An array of key, value arrays from the object's own properties.
     * @see R.fromPairs
     * @example
     *
     *      R.toPairs({a: 1, b: 2, c: 3}); //=> [['a', 1], ['b', 2], ['c', 3]]
     */
    var toPairs = _curry1(function toPairs(obj) {
        var pairs = [];
        for (var prop in obj) {
            if (_has(prop, obj)) {
                pairs[pairs.length] = [
                    prop,
                    obj[prop]
                ];
            }
        }
        return pairs;
    });

    /**
     * Converts an object into an array of key, value arrays. The object's own
     * properties and prototype properties are used. Note that the order of the
     * output array is not guaranteed to be consistent across different JS
     * platforms.
     *
     * @func
     * @memberOf R
     * @since v0.4.0
     * @category Object
     * @sig {String: *} -> [[String,*]]
     * @param {Object} obj The object to extract from
     * @return {Array} An array of key, value arrays from the object's own
     *         and prototype properties.
     * @example
     *
     *      var F = function() { this.x = 'X'; };
     *      F.prototype.y = 'Y';
     *      var f = new F();
     *      R.toPairsIn(f); //=> [['x','X'], ['y','Y']]
     */
    var toPairsIn = _curry1(function toPairsIn(obj) {
        var pairs = [];
        for (var prop in obj) {
            pairs[pairs.length] = [
                prop,
                obj[prop]
            ];
        }
        return pairs;
    });

    /**
     * Transposes the rows and columns of a 2D list.
     * When passed a list of `n` lists of length `x`,
     * returns a list of `x` lists of length `n`.
     *
     *
     * @func
     * @memberOf R
     * @since 0.19.1
     * @since 0.19.0
     * @category List
     * @sig [[a]] -> [[a]]
     * @param {Array} list A 2D list
     * @return {Array} A 2D list
     * @example
     *
     *      R.transpose([[1, 'a'], [2, 'b'], [3, 'c']]) //=> [[1, 2, 3], ['a', 'b', 'c']]
     *      R.transpose([[1, 2, 3], ['a', 'b', 'c']]) //=> [[1, 'a'], [2, 'b'], [3, 'c']]
     *
     * If some of the rows are shorter than the following rows, their elements are skipped:
     *
     *      R.transpose([[10, 11], [20], [], [30, 31, 32]]) //=> [[10, 20, 30], [11, 31], [32]]
     */
    var transpose = _curry1(function transpose(outerlist) {
        var i = 0;
        var result = [];
        while (i < outerlist.length) {
            var innerlist = outerlist[i];
            var j = 0;
            while (j < innerlist.length) {
                if (typeof result[j] === 'undefined') {
                    result[j] = [];
                }
                result[j].push(innerlist[j]);
                j += 1;
            }
            i += 1;
        }
        return result;
    });

    /**
     * Removes (strips) whitespace from both ends of the string.
     *
     * @func
     * @memberOf R
     * @since v0.6.0
     * @category String
     * @sig String -> String
     * @param {String} str The string to trim.
     * @return {String} Trimmed version of `str`.
     * @example
     *
     *      R.trim('   xyz  '); //=> 'xyz'
     *      R.map(R.trim, R.split(',', 'x, y, z')); //=> ['x', 'y', 'z']
     */
    var trim = function () {
        var ws = '\t\n\x0B\f\r \xA0\u1680\u180E\u2000\u2001\u2002\u2003' + '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028' + '\u2029\uFEFF';
        var zeroWidth = '\u200B';
        var hasProtoTrim = typeof String.prototype.trim === 'function';
        if (!hasProtoTrim || (ws.trim() || !zeroWidth.trim())) {
            return _curry1(function trim(str) {
                var beginRx = new RegExp('^[' + ws + '][' + ws + ']*');
                var endRx = new RegExp('[' + ws + '][' + ws + ']*$');
                return str.replace(beginRx, '').replace(endRx, '');
            });
        } else {
            return _curry1(function trim(str) {
                return str.trim();
            });
        }
    }();

    /**
     * Gives a single-word string description of the (native) type of a value,
     * returning such answers as 'Object', 'Number', 'Array', or 'Null'. Does not
     * attempt to distinguish user Object types any further, reporting them all as
     * 'Object'.
     *
     * @func
     * @memberOf R
     * @since v0.8.0
     * @category Type
     * @sig (* -> {*}) -> String
     * @param {*} val The value to test
     * @return {String}
     * @example
     *
     *      R.type({}); //=> "Object"
     *      R.type(1); //=> "Number"
     *      R.type(false); //=> "Boolean"
     *      R.type('s'); //=> "String"
     *      R.type(null); //=> "Null"
     *      R.type([]); //=> "Array"
     *      R.type(/[A-z]/); //=> "RegExp"
     */
    var type = _curry1(function type(val) {
        return val === null ? 'Null' : val === undefined ? 'Undefined' : Object.prototype.toString.call(val).slice(8, -1);
    });

    /**
     * Takes a function `fn`, which takes a single array argument, and returns a
     * function which:
     *
     *   - takes any number of positional arguments;
     *   - passes these arguments to `fn` as an array; and
     *   - returns the result.
     *
     * In other words, R.unapply derives a variadic function from a function which
     * takes an array. R.unapply is the inverse of R.apply.
     *
     * @func
     * @memberOf R
     * @since v0.8.0
     * @category Function
     * @sig ([*...] -> a) -> (*... -> a)
     * @param {Function} fn
     * @return {Function}
     * @see R.apply
     * @example
     *
     *      R.unapply(JSON.stringify)(1, 2, 3); //=> '[1,2,3]'
     */
    var unapply = _curry1(function unapply(fn) {
        return function () {
            return fn(_slice(arguments));
        };
    });

    /**
     * Wraps a function of any arity (including nullary) in a function that accepts
     * exactly 1 parameter. Any extraneous parameters will not be passed to the
     * supplied function.
     *
     * @func
     * @memberOf R
     * @since v0.2.0
     * @category Function
     * @sig (* -> b) -> (a -> b)
     * @param {Function} fn The function to wrap.
     * @return {Function} A new function wrapping `fn`. The new function is guaranteed to be of
     *         arity 1.
     * @example
     *
     *      var takesTwoArgs = function(a, b) {
     *        return [a, b];
     *      };
     *      takesTwoArgs.length; //=> 2
     *      takesTwoArgs(1, 2); //=> [1, 2]
     *
     *      var takesOneArg = R.unary(takesTwoArgs);
     *      takesOneArg.length; //=> 1
     *      // Only 1 argument is passed to the wrapped function
     *      takesOneArg(1, 2); //=> [1, undefined]
     */
    var unary = _curry1(function unary(fn) {
        return nAry(1, fn);
    });

    /**
     * Returns a function of arity `n` from a (manually) curried function.
     *
     * @func
     * @memberOf R
     * @since v0.14.0
     * @category Function
     * @sig Number -> (a -> b) -> (a -> c)
     * @param {Number} length The arity for the returned function.
     * @param {Function} fn The function to uncurry.
     * @return {Function} A new function.
     * @see R.curry
     * @example
     *
     *      var addFour = a => b => c => d => a + b + c + d;
     *
     *      var uncurriedAddFour = R.uncurryN(4, addFour);
     *      uncurriedAddFour(1, 2, 3, 4); //=> 10
     */
    var uncurryN = _curry2(function uncurryN(depth, fn) {
        return curryN(depth, function () {
            var currentDepth = 1;
            var value = fn;
            var idx = 0;
            var endIdx;
            while (currentDepth <= depth && typeof value === 'function') {
                endIdx = currentDepth === depth ? arguments.length : idx + value.length;
                value = value.apply(this, _slice(arguments, idx, endIdx));
                currentDepth += 1;
                idx = endIdx;
            }
            return value;
        });
    });

    /**
     * Builds a list from a seed value. Accepts an iterator function, which returns
     * either false to stop iteration or an array of length 2 containing the value
     * to add to the resulting list and the seed to be used in the next call to the
     * iterator function.
     *
     * The iterator function receives one argument: *(seed)*.
     *
     * @func
     * @memberOf R
     * @since v0.10.0
     * @category List
     * @sig (a -> [b]) -> * -> [b]
     * @param {Function} fn The iterator function. receives one argument, `seed`, and returns
     *        either false to quit iteration or an array of length two to proceed. The element
     *        at index 0 of this array will be added to the resulting array, and the element
     *        at index 1 will be passed to the next call to `fn`.
     * @param {*} seed The seed value.
     * @return {Array} The final list.
     * @example
     *
     *      var f = n => n > 50 ? false : [-n, n + 10];
     *      R.unfold(f, 10); //=> [-10, -20, -30, -40, -50]
     */
    var unfold = _curry2(function unfold(fn, seed) {
        var pair = fn(seed);
        var result = [];
        while (pair && pair.length) {
            result[result.length] = pair[0];
            pair = fn(pair[1]);
        }
        return result;
    });

    /**
     * Returns a new list containing only one copy of each element in the original
     * list, based upon the value returned by applying the supplied predicate to
     * two list elements. Prefers the first item if two items compare equal based
     * on the predicate.
     *
     * @func
     * @memberOf R
     * @since v0.2.0
     * @category List
     * @sig (a, a -> Boolean) -> [a] -> [a]
     * @param {Function} pred A predicate used to test whether two items are equal.
     * @param {Array} list The array to consider.
     * @return {Array} The list of unique items.
     * @example
     *
     *      var strEq = R.eqBy(String);
     *      R.uniqWith(strEq)([1, '1', 2, 1]); //=> [1, 2]
     *      R.uniqWith(strEq)([{}, {}]);       //=> [{}]
     *      R.uniqWith(strEq)([1, '1', 1]);    //=> [1]
     *      R.uniqWith(strEq)(['1', 1, 1]);    //=> ['1']
     */
    var uniqWith = _curry2(function uniqWith(pred, list) {
        var idx = 0;
        var len = list.length;
        var result = [];
        var item;
        while (idx < len) {
            item = list[idx];
            if (!_containsWith(pred, item, result)) {
                result[result.length] = item;
            }
            idx += 1;
        }
        return result;
    });

    /**
     * Tests the final argument by passing it to the given predicate function. If
     * the predicate is not satisfied, the function will return the result of
     * calling the `whenFalseFn` function with the same argument. If the predicate
     * is satisfied, the argument is returned as is.
     *
     * @func
     * @memberOf R
     * @since v0.18.0
     * @category Logic
     * @sig (a -> Boolean) -> (a -> a) -> a -> a
     * @param {Function} pred        A predicate function
     * @param {Function} whenFalseFn A function to invoke when the `pred` evaluates
     *                               to a falsy value.
     * @param {*}        x           An object to test with the `pred` function and
     *                               pass to `whenFalseFn` if necessary.
     * @return {*} Either `x` or the result of applying `x` to `whenFalseFn`.
     * @see R.ifElse, R.when
     * @example
     *
     *      // coerceArray :: (a|[a]) -> [a]
     *      var coerceArray = R.unless(R.isArrayLike, R.of);
     *      coerceArray([1, 2, 3]); //=> [1, 2, 3]
     *      coerceArray(1);         //=> [1]
     */
    var unless = _curry3(function unless(pred, whenFalseFn, x) {
        return pred(x) ? x : whenFalseFn(x);
    });

    /**
     * Returns a new copy of the array with the element at the provided index
     * replaced with the given value.
     *
     * @func
     * @memberOf R
     * @since v0.14.0
     * @category List
     * @sig Number -> a -> [a] -> [a]
     * @param {Number} idx The index to update.
     * @param {*} x The value to exist at the given index of the returned array.
     * @param {Array|Arguments} list The source array-like object to be updated.
     * @return {Array} A copy of `list` with the value at index `idx` replaced with `x`.
     * @see R.adjust
     * @example
     *
     *      R.update(1, 11, [0, 1, 2]);     //=> [0, 11, 2]
     *      R.update(1)(11)([0, 1, 2]);     //=> [0, 11, 2]
     */
    var update = _curry3(function update(idx, x, list) {
        return adjust(always(x), idx, list);
    });

    /**
     * Accepts a function `fn` and a list of transformer functions and returns a
     * new curried function. When the new function is invoked, it calls the
     * function `fn` with parameters consisting of the result of calling each
     * supplied handler on successive arguments to the new function.
     *
     * If more arguments are passed to the returned function than transformer
     * functions, those arguments are passed directly to `fn` as additional
     * parameters. If you expect additional arguments that don't need to be
     * transformed, although you can ignore them, it's best to pass an identity
     * function so that the new function reports the correct arity.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Function
     * @sig (x1 -> x2 -> ... -> z) -> [(a -> x1), (b -> x2), ...] -> (a -> b -> ... -> z)
     * @param {Function} fn The function to wrap.
     * @param {Array} transformers A list of transformer functions
     * @return {Function} The wrapped function.
     * @example
     *
     *      R.useWith(Math.pow, [R.identity, R.identity])(3, 4); //=> 81
     *      R.useWith(Math.pow, [R.identity, R.identity])(3)(4); //=> 81
     *      R.useWith(Math.pow, [R.dec, R.inc])(3, 4); //=> 32
     *      R.useWith(Math.pow, [R.dec, R.inc])(3)(4); //=> 32
     */
    var useWith = _curry2(function useWith(fn, transformers) {
        return curryN(transformers.length, function () {
            var args = [];
            var idx = 0;
            while (idx < transformers.length) {
                args.push(transformers[idx].call(this, arguments[idx]));
                idx += 1;
            }
            return fn.apply(this, args.concat(_slice(arguments, transformers.length)));
        });
    });

    /**
     * Returns a list of all the enumerable own properties of the supplied object.
     * Note that the order of the output array is not guaranteed across different
     * JS platforms.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Object
     * @sig {k: v} -> [v]
     * @param {Object} obj The object to extract values from
     * @return {Array} An array of the values of the object's own properties.
     * @example
     *
     *      R.values({a: 1, b: 2, c: 3}); //=> [1, 2, 3]
     */
    var values = _curry1(function values(obj) {
        var props = keys(obj);
        var len = props.length;
        var vals = [];
        var idx = 0;
        while (idx < len) {
            vals[idx] = obj[props[idx]];
            idx += 1;
        }
        return vals;
    });

    /**
     * Returns a list of all the properties, including prototype properties, of the
     * supplied object.
     * Note that the order of the output array is not guaranteed to be consistent
     * across different JS platforms.
     *
     * @func
     * @memberOf R
     * @since v0.2.0
     * @category Object
     * @sig {k: v} -> [v]
     * @param {Object} obj The object to extract values from
     * @return {Array} An array of the values of the object's own and prototype properties.
     * @example
     *
     *      var F = function() { this.x = 'X'; };
     *      F.prototype.y = 'Y';
     *      var f = new F();
     *      R.valuesIn(f); //=> ['X', 'Y']
     */
    var valuesIn = _curry1(function valuesIn(obj) {
        var prop;
        var vs = [];
        for (prop in obj) {
            vs[vs.length] = obj[prop];
        }
        return vs;
    });

    /**
     * Returns a "view" of the given data structure, determined by the given lens.
     * The lens's focus determines which portion of the data structure is visible.
     *
     * @func
     * @memberOf R
     * @since v0.16.0
     * @category Object
     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
     * @sig Lens s a -> s -> a
     * @param {Lens} lens
     * @param {*} x
     * @return {*}
     * @see R.prop, R.lensIndex, R.lensProp
     * @example
     *
     *      var xLens = R.lensProp('x');
     *
     *      R.view(xLens, {x: 1, y: 2});  //=> 1
     *      R.view(xLens, {x: 4, y: 2});  //=> 4
     */
    var view = function () {
        var Const = function (x) {
            return {
                value: x,
                map: function () {
                    return this;
                }
            };
        };
        return _curry2(function view(lens, x) {
            return lens(Const)(x).value;
        });
    }();

    /**
     * Tests the final argument by passing it to the given predicate function. If
     * the predicate is satisfied, the function will return the result of calling
     * the `whenTrueFn` function with the same argument. If the predicate is not
     * satisfied, the argument is returned as is.
     *
     * @func
     * @memberOf R
     * @since v0.18.0
     * @category Logic
     * @sig (a -> Boolean) -> (a -> a) -> a -> a
     * @param {Function} pred       A predicate function
     * @param {Function} whenTrueFn A function to invoke when the `condition`
     *                              evaluates to a truthy value.
     * @param {*}        x          An object to test with the `pred` function and
     *                              pass to `whenTrueFn` if necessary.
     * @return {*} Either `x` or the result of applying `x` to `whenTrueFn`.
     * @see R.ifElse, R.unless
     * @example
     *
     *      // truncate :: String -> String
     *      var truncate = R.when(
     *        R.propSatisfies(R.gt(R.__, 10), 'length'),
     *        R.pipe(R.take(10), R.append('…'), R.join(''))
     *      );
     *      truncate('12345');         //=> '12345'
     *      truncate('0123456789ABC'); //=> '0123456789…'
     */
    var when = _curry3(function when(pred, whenTrueFn, x) {
        return pred(x) ? whenTrueFn(x) : x;
    });

    /**
     * Takes a spec object and a test object; returns true if the test satisfies
     * the spec. Each of the spec's own properties must be a predicate function.
     * Each predicate is applied to the value of the corresponding property of the
     * test object. `where` returns true if all the predicates return true, false
     * otherwise.
     *
     * `where` is well suited to declaratively expressing constraints for other
     * functions such as `filter` and `find`.
     *
     * @func
     * @memberOf R
     * @since v0.1.1
     * @category Object
     * @sig {String: (* -> Boolean)} -> {String: *} -> Boolean
     * @param {Object} spec
     * @param {Object} testObj
     * @return {Boolean}
     * @example
     *
     *      // pred :: Object -> Boolean
     *      var pred = R.where({
     *        a: R.equals('foo'),
     *        b: R.complement(R.equals('bar')),
     *        x: R.gt(_, 10),
     *        y: R.lt(_, 20)
     *      });
     *
     *      pred({a: 'foo', b: 'xxx', x: 11, y: 19}); //=> true
     *      pred({a: 'xxx', b: 'xxx', x: 11, y: 19}); //=> false
     *      pred({a: 'foo', b: 'bar', x: 11, y: 19}); //=> false
     *      pred({a: 'foo', b: 'xxx', x: 10, y: 19}); //=> false
     *      pred({a: 'foo', b: 'xxx', x: 11, y: 20}); //=> false
     */
    var where = _curry2(function where(spec, testObj) {
        for (var prop in spec) {
            if (_has(prop, spec) && !spec[prop](testObj[prop])) {
                return false;
            }
        }
        return true;
    });

    /**
     * Wrap a function inside another to allow you to make adjustments to the
     * parameters, or do other processing either before the internal function is
     * called or with its results.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Function
     * @sig (a... -> b) -> ((a... -> b) -> a... -> c) -> (a... -> c)
     * @param {Function} fn The function to wrap.
     * @param {Function} wrapper The wrapper function.
     * @return {Function} The wrapped function.
     * @example
     *
     *      var greet = name => 'Hello ' + name;
     *
     *      var shoutedGreet = R.wrap(greet, (gr, name) => gr(name).toUpperCase());
     *
     *      shoutedGreet("Kathy"); //=> "HELLO KATHY"
     *
     *      var shortenedGreet = R.wrap(greet, function(gr, name) {
     *        return gr(name.substring(0, 3));
     *      });
     *      shortenedGreet("Robert"); //=> "Hello Rob"
     */
    var wrap = _curry2(function wrap(fn, wrapper) {
        return curryN(fn.length, function () {
            return wrapper.apply(this, _concat([fn], arguments));
        });
    });

    /**
     * Creates a new list out of the two supplied by creating each possible pair
     * from the lists.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig [a] -> [b] -> [[a,b]]
     * @param {Array} as The first list.
     * @param {Array} bs The second list.
     * @return {Array} The list made by combining each possible pair from
     *         `as` and `bs` into pairs (`[a, b]`).
     * @example
     *
     *      R.xprod([1, 2], ['a', 'b']); //=> [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']]
     */
    // = xprodWith(prepend); (takes about 3 times as long...)
    var xprod = _curry2(function xprod(a, b) {
        // = xprodWith(prepend); (takes about 3 times as long...)
        var idx = 0;
        var ilen = a.length;
        var j;
        var jlen = b.length;
        var result = [];
        while (idx < ilen) {
            j = 0;
            while (j < jlen) {
                result[result.length] = [
                    a[idx],
                    b[j]
                ];
                j += 1;
            }
            idx += 1;
        }
        return result;
    });

    /**
     * Creates a new list out of the two supplied by pairing up equally-positioned
     * items from both lists. The returned list is truncated to the length of the
     * shorter of the two input lists.
     * Note: `zip` is equivalent to `zipWith(function(a, b) { return [a, b] })`.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig [a] -> [b] -> [[a,b]]
     * @param {Array} list1 The first array to consider.
     * @param {Array} list2 The second array to consider.
     * @return {Array} The list made by pairing up same-indexed elements of `list1` and `list2`.
     * @example
     *
     *      R.zip([1, 2, 3], ['a', 'b', 'c']); //=> [[1, 'a'], [2, 'b'], [3, 'c']]
     */
    var zip = _curry2(function zip(a, b) {
        var rv = [];
        var idx = 0;
        var len = Math.min(a.length, b.length);
        while (idx < len) {
            rv[idx] = [
                a[idx],
                b[idx]
            ];
            idx += 1;
        }
        return rv;
    });

    /**
     * Creates a new object out of a list of keys and a list of values.
     *
     * @func
     * @memberOf R
     * @since v0.3.0
     * @category List
     * @sig [String] -> [*] -> {String: *}
     * @param {Array} keys The array that will be properties on the output object.
     * @param {Array} values The list of values on the output object.
     * @return {Object} The object made by pairing up same-indexed elements of `keys` and `values`.
     * @example
     *
     *      R.zipObj(['a', 'b', 'c'], [1, 2, 3]); //=> {a: 1, b: 2, c: 3}
     */
    var zipObj = _curry2(function zipObj(keys, values) {
        var idx = 0;
        var len = keys.length;
        var out = {};
        while (idx < len) {
            out[keys[idx]] = values[idx];
            idx += 1;
        }
        return out;
    });

    /**
     * Creates a new list out of the two supplied by applying the function to each
     * equally-positioned pair in the lists. The returned list is truncated to the
     * length of the shorter of the two input lists.
     *
     * @function
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig (a,b -> c) -> [a] -> [b] -> [c]
     * @param {Function} fn The function used to combine the two elements into one value.
     * @param {Array} list1 The first array to consider.
     * @param {Array} list2 The second array to consider.
     * @return {Array} The list made by combining same-indexed elements of `list1` and `list2`
     *         using `fn`.
     * @example
     *
     *      var f = (x, y) => {
     *        // ...
     *      };
     *      R.zipWith(f, [1, 2, 3], ['a', 'b', 'c']);
     *      //=> [f(1, 'a'), f(2, 'b'), f(3, 'c')]
     */
    var zipWith = _curry3(function zipWith(fn, a, b) {
        var rv = [];
        var idx = 0;
        var len = Math.min(a.length, b.length);
        while (idx < len) {
            rv[idx] = fn(a[idx], b[idx]);
            idx += 1;
        }
        return rv;
    });

    /**
     * A function that always returns `false`. Any passed in parameters are ignored.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category Function
     * @sig * -> Boolean
     * @param {*}
     * @return {Boolean}
     * @see R.always, R.T
     * @example
     *
     *      R.F(); //=> false
     */
    var F = always(false);

    /**
     * A function that always returns `true`. Any passed in parameters are ignored.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category Function
     * @sig * -> Boolean
     * @param {*}
     * @return {Boolean}
     * @see R.always, R.F
     * @example
     *
     *      R.T(); //=> true
     */
    var T = always(true);

    /**
     * Copies an object.
     *
     * @private
     * @param {*} value The value to be copied
     * @param {Array} refFrom Array containing the source references
     * @param {Array} refTo Array containing the copied source references
     * @return {*} The copied value.
     */
    var _clone = function _clone(value, refFrom, refTo) {
        var copy = function copy(copiedValue) {
            var len = refFrom.length;
            var idx = 0;
            while (idx < len) {
                if (value === refFrom[idx]) {
                    return refTo[idx];
                }
                idx += 1;
            }
            refFrom[idx + 1] = value;
            refTo[idx + 1] = copiedValue;
            for (var key in value) {
                copiedValue[key] = _clone(value[key], refFrom, refTo);
            }
            return copiedValue;
        };
        switch (type(value)) {
        case 'Object':
            return copy({});
        case 'Array':
            return copy([]);
        case 'Date':
            return new Date(value.valueOf());
        case 'RegExp':
            return _cloneRegExp(value);
        default:
            return value;
        }
    };

    var _createPartialApplicator = function _createPartialApplicator(concat) {
        return _curry2(function (fn, args) {
            return _arity(Math.max(0, fn.length - args.length), function () {
                return fn.apply(this, concat(args, arguments));
            });
        });
    };

    var _dropLast = function dropLast(n, xs) {
        return take(n < xs.length ? xs.length - n : 0, xs);
    };

    // Values of other types are only equal if identical.
    var _equals = function _equals(a, b, stackA, stackB) {
        if (identical(a, b)) {
            return true;
        }
        if (type(a) !== type(b)) {
            return false;
        }
        if (a == null || b == null) {
            return false;
        }
        if (typeof a.equals === 'function' || typeof b.equals === 'function') {
            return typeof a.equals === 'function' && a.equals(b) && typeof b.equals === 'function' && b.equals(a);
        }
        switch (type(a)) {
        case 'Arguments':
        case 'Array':
        case 'Object':
            break;
        case 'Boolean':
        case 'Number':
        case 'String':
            if (!(typeof a === typeof b && identical(a.valueOf(), b.valueOf()))) {
                return false;
            }
            break;
        case 'Date':
            if (!identical(a.valueOf(), b.valueOf())) {
                return false;
            }
            break;
        case 'Error':
            return a.name === b.name && a.message === b.message;
        case 'RegExp':
            if (!(a.source === b.source && a.global === b.global && a.ignoreCase === b.ignoreCase && a.multiline === b.multiline && a.sticky === b.sticky && a.unicode === b.unicode)) {
                return false;
            }
            break;
        case 'Map':
        case 'Set':
            if (!_equals(_arrayFromIterator(a.entries()), _arrayFromIterator(b.entries()), stackA, stackB)) {
                return false;
            }
            break;
        case 'Int8Array':
        case 'Uint8Array':
        case 'Uint8ClampedArray':
        case 'Int16Array':
        case 'Uint16Array':
        case 'Int32Array':
        case 'Uint32Array':
        case 'Float32Array':
        case 'Float64Array':
            break;
        case 'ArrayBuffer':
            break;
        default:
            // Values of other types are only equal if identical.
            return false;
        }
        var keysA = keys(a);
        if (keysA.length !== keys(b).length) {
            return false;
        }
        var idx = stackA.length - 1;
        while (idx >= 0) {
            if (stackA[idx] === a) {
                return stackB[idx] === b;
            }
            idx -= 1;
        }
        stackA.push(a);
        stackB.push(b);
        idx = keysA.length - 1;
        while (idx >= 0) {
            var key = keysA[idx];
            if (!(_has(key, b) && _equals(b[key], a[key], stackA, stackB))) {
                return false;
            }
            idx -= 1;
        }
        stackA.pop();
        stackB.pop();
        return true;
    };

    /**
     * `_makeFlat` is a helper function that returns a one-level or fully recursive
     * function based on the flag passed in.
     *
     * @private
     */
    var _makeFlat = function _makeFlat(recursive) {
        return function flatt(list) {
            var value, jlen, j;
            var result = [];
            var idx = 0;
            var ilen = list.length;
            while (idx < ilen) {
                if (isArrayLike(list[idx])) {
                    value = recursive ? flatt(list[idx]) : list[idx];
                    j = 0;
                    jlen = value.length;
                    while (j < jlen) {
                        result[result.length] = value[j];
                        j += 1;
                    }
                } else {
                    result[result.length] = list[idx];
                }
                idx += 1;
            }
            return result;
        };
    };

    var _reduce = function () {
        function _arrayReduce(xf, acc, list) {
            var idx = 0;
            var len = list.length;
            while (idx < len) {
                acc = xf['@@transducer/step'](acc, list[idx]);
                if (acc && acc['@@transducer/reduced']) {
                    acc = acc['@@transducer/value'];
                    break;
                }
                idx += 1;
            }
            return xf['@@transducer/result'](acc);
        }
        function _iterableReduce(xf, acc, iter) {
            var step = iter.next();
            while (!step.done) {
                acc = xf['@@transducer/step'](acc, step.value);
                if (acc && acc['@@transducer/reduced']) {
                    acc = acc['@@transducer/value'];
                    break;
                }
                step = iter.next();
            }
            return xf['@@transducer/result'](acc);
        }
        function _methodReduce(xf, acc, obj) {
            return xf['@@transducer/result'](obj.reduce(bind(xf['@@transducer/step'], xf), acc));
        }
        var symIterator = typeof Symbol !== 'undefined' ? Symbol.iterator : '@@iterator';
        return function _reduce(fn, acc, list) {
            if (typeof fn === 'function') {
                fn = _xwrap(fn);
            }
            if (isArrayLike(list)) {
                return _arrayReduce(fn, acc, list);
            }
            if (typeof list.reduce === 'function') {
                return _methodReduce(fn, acc, list);
            }
            if (list[symIterator] != null) {
                return _iterableReduce(fn, acc, list[symIterator]());
            }
            if (typeof list.next === 'function') {
                return _iterableReduce(fn, acc, list);
            }
            throw new TypeError('reduce: list must be array or iterable');
        };
    }();

    var _xdropLastWhile = function () {
        function XDropLastWhile(fn, xf) {
            this.f = fn;
            this.retained = [];
            this.xf = xf;
        }
        XDropLastWhile.prototype['@@transducer/init'] = _xfBase.init;
        XDropLastWhile.prototype['@@transducer/result'] = function (result) {
            this.retained = null;
            return this.xf['@@transducer/result'](result);
        };
        XDropLastWhile.prototype['@@transducer/step'] = function (result, input) {
            return this.f(input) ? this.retain(result, input) : this.flush(result, input);
        };
        XDropLastWhile.prototype.flush = function (result, input) {
            result = _reduce(this.xf['@@transducer/step'], result, this.retained);
            this.retained = [];
            return this.xf['@@transducer/step'](result, input);
        };
        XDropLastWhile.prototype.retain = function (result, input) {
            this.retained.push(input);
            return result;
        };
        return _curry2(function _xdropLastWhile(fn, xf) {
            return new XDropLastWhile(fn, xf);
        });
    }();

    var _xgroupBy = function () {
        function XGroupBy(f, xf) {
            this.xf = xf;
            this.f = f;
            this.inputs = {};
        }
        XGroupBy.prototype['@@transducer/init'] = _xfBase.init;
        XGroupBy.prototype['@@transducer/result'] = function (result) {
            var key;
            for (key in this.inputs) {
                if (_has(key, this.inputs)) {
                    result = this.xf['@@transducer/step'](result, this.inputs[key]);
                    if (result['@@transducer/reduced']) {
                        result = result['@@transducer/value'];
                        break;
                    }
                }
            }
            this.inputs = null;
            return this.xf['@@transducer/result'](result);
        };
        XGroupBy.prototype['@@transducer/step'] = function (result, input) {
            var key = this.f(input);
            this.inputs[key] = this.inputs[key] || [
                key,
                []
            ];
            this.inputs[key][1] = append(input, this.inputs[key][1]);
            return result;
        };
        return _curry2(function _xgroupBy(f, xf) {
            return new XGroupBy(f, xf);
        });
    }();

    /**
     * Creates a new list iteration function from an existing one by adding two new
     * parameters to its callback function: the current index, and the entire list.
     *
     * This would turn, for instance, Ramda's simple `map` function into one that
     * more closely resembles `Array.prototype.map`. Note that this will only work
     * for functions in which the iteration callback function is the first
     * parameter, and where the list is the last parameter. (This latter might be
     * unimportant if the list parameter is not used.)
     *
     * @func
     * @memberOf R
     * @since v0.15.0
     * @category Function
     * @category List
     * @sig ((a ... -> b) ... -> [a] -> *) -> (a ..., Int, [a] -> b) ... -> [a] -> *)
     * @param {Function} fn A list iteration function that does not pass index or list to its callback
     * @return {Function} An altered list iteration function that passes (item, index, list) to its callback
     * @example
     *
     *      var mapIndexed = R.addIndex(R.map);
     *      mapIndexed((val, idx) => idx + '-' + val, ['f', 'o', 'o', 'b', 'a', 'r']);
     *      //=> ['0-f', '1-o', '2-o', '3-b', '4-a', '5-r']
     */
    var addIndex = _curry1(function addIndex(fn) {
        return curryN(fn.length, function () {
            var idx = 0;
            var origFn = arguments[0];
            var list = arguments[arguments.length - 1];
            var args = _slice(arguments);
            args[0] = function () {
                var result = origFn.apply(this, _concat(arguments, [
                    idx,
                    list
                ]));
                idx += 1;
                return result;
            };
            return fn.apply(this, args);
        });
    });

    /**
     * Wraps a function of any arity (including nullary) in a function that accepts
     * exactly 2 parameters. Any extraneous parameters will not be passed to the
     * supplied function.
     *
     * @func
     * @memberOf R
     * @since v0.2.0
     * @category Function
     * @sig (* -> c) -> (a, b -> c)
     * @param {Function} fn The function to wrap.
     * @return {Function} A new function wrapping `fn`. The new function is guaranteed to be of
     *         arity 2.
     * @example
     *
     *      var takesThreeArgs = function(a, b, c) {
     *        return [a, b, c];
     *      };
     *      takesThreeArgs.length; //=> 3
     *      takesThreeArgs(1, 2, 3); //=> [1, 2, 3]
     *
     *      var takesTwoArgs = R.binary(takesThreeArgs);
     *      takesTwoArgs.length; //=> 2
     *      // Only 2 arguments are passed to the wrapped function
     *      takesTwoArgs(1, 2, 3); //=> [1, 2, undefined]
     */
    var binary = _curry1(function binary(fn) {
        return nAry(2, fn);
    });

    /**
     * Creates a deep copy of the value which may contain (nested) `Array`s and
     * `Object`s, `Number`s, `String`s, `Boolean`s and `Date`s. `Function`s are not
     * copied, but assigned by their reference.
     *
     * Dispatches to a `clone` method if present.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Object
     * @sig {*} -> {*}
     * @param {*} value The object or array to clone
     * @return {*} A new object or array.
     * @example
     *
     *      var objects = [{}, {}, {}];
     *      var objectsClone = R.clone(objects);
     *      objects[0] === objectsClone[0]; //=> false
     */
    var clone = _curry1(function clone(value) {
        return value != null && typeof value.clone === 'function' ? value.clone() : _clone(value, [], []);
    });

    /**
     * Returns a curried equivalent of the provided function. The curried function
     * has two unusual capabilities. First, its arguments needn't be provided one
     * at a time. If `f` is a ternary function and `g` is `R.curry(f)`, the
     * following are equivalent:
     *
     *   - `g(1)(2)(3)`
     *   - `g(1)(2, 3)`
     *   - `g(1, 2)(3)`
     *   - `g(1, 2, 3)`
     *
     * Secondly, the special placeholder value `R.__` may be used to specify
     * "gaps", allowing partial application of any combination of arguments,
     * regardless of their positions. If `g` is as above and `_` is `R.__`, the
     * following are equivalent:
     *
     *   - `g(1, 2, 3)`
     *   - `g(_, 2, 3)(1)`
     *   - `g(_, _, 3)(1)(2)`
     *   - `g(_, _, 3)(1, 2)`
     *   - `g(_, 2)(1)(3)`
     *   - `g(_, 2)(1, 3)`
     *   - `g(_, 2)(_, 3)(1)`
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Function
     * @sig (* -> a) -> (* -> a)
     * @param {Function} fn The function to curry.
     * @return {Function} A new, curried function.
     * @see R.curryN
     * @example
     *
     *      var addFourNumbers = (a, b, c, d) => a + b + c + d;
     *
     *      var curriedAddFourNumbers = R.curry(addFourNumbers);
     *      var f = curriedAddFourNumbers(1, 2);
     *      var g = f(3);
     *      g(4); //=> 10
     */
    var curry = _curry1(function curry(fn) {
        return curryN(fn.length, fn);
    });

    /**
     * Returns all but the first `n` elements of the given list, string, or
     * transducer/transformer (or object with a `drop` method).
     *
     * Dispatches to the `drop` method of the second argument, if present.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig Number -> [a] -> [a]
     * @sig Number -> String -> String
     * @param {Number} n
     * @param {*} list
     * @return {*}
     * @see R.take, R.transduce
     * @example
     *
     *      R.drop(1, ['foo', 'bar', 'baz']); //=> ['bar', 'baz']
     *      R.drop(2, ['foo', 'bar', 'baz']); //=> ['baz']
     *      R.drop(3, ['foo', 'bar', 'baz']); //=> []
     *      R.drop(4, ['foo', 'bar', 'baz']); //=> []
     *      R.drop(3, 'ramda');               //=> 'da'
     */
    var drop = _curry2(_dispatchable('drop', _xdrop, function drop(n, xs) {
        return slice(Math.max(0, n), Infinity, xs);
    }));

    /**
     * Returns a list containing all but the last `n` elements of the given `list`.
     *
     * @func
     * @memberOf R
     * @since v0.16.0
     * @category List
     * @sig Number -> [a] -> [a]
     * @sig Number -> String -> String
     * @param {Number} n The number of elements of `xs` to skip.
     * @param {Array} xs The collection to consider.
     * @return {Array}
     * @see R.takeLast
     * @example
     *
     *      R.dropLast(1, ['foo', 'bar', 'baz']); //=> ['foo', 'bar']
     *      R.dropLast(2, ['foo', 'bar', 'baz']); //=> ['foo']
     *      R.dropLast(3, ['foo', 'bar', 'baz']); //=> []
     *      R.dropLast(4, ['foo', 'bar', 'baz']); //=> []
     *      R.dropLast(3, 'ramda');               //=> 'ra'
     */
    var dropLast = _curry2(_dispatchable('dropLast', _xdropLast, _dropLast));

    /**
     * Returns a new list containing all but last the`n` elements of a given list,
     * passing each value from the right to the supplied predicate function,
     * skipping elements while the predicate function returns `true`. The predicate
     * function is passed one argument: (value)*.
     *
     * @func
     * @memberOf R
     * @since v0.16.0
     * @category List
     * @sig (a -> Boolean) -> [a] -> [a]
     * @param {Function} fn The function called per iteration.
     * @param {Array} list The collection to iterate over.
     * @return {Array} A new array.
     * @see R.takeLastWhile, R.addIndex
     * @example
     *
     *      var lteThree = x => x <= 3;
     *
     *      R.dropLastWhile(lteThree, [1, 2, 3, 4, 3, 2, 1]); //=> [1, 2, 3, 4]
     */
    var dropLastWhile = _curry2(_dispatchable('dropLastWhile', _xdropLastWhile, _dropLastWhile));

    /**
     * Returns `true` if its arguments are equivalent, `false` otherwise. Handles
     * cyclical data structures.
     *
     * Dispatches symmetrically to the `equals` methods of both arguments, if
     * present.
     *
     * @func
     * @memberOf R
     * @since v0.15.0
     * @category Relation
     * @sig a -> b -> Boolean
     * @param {*} a
     * @param {*} b
     * @return {Boolean}
     * @example
     *
     *      R.equals(1, 1); //=> true
     *      R.equals(1, '1'); //=> false
     *      R.equals([1, 2, 3], [1, 2, 3]); //=> true
     *
     *      var a = {}; a.v = a;
     *      var b = {}; b.v = b;
     *      R.equals(a, b); //=> true
     */
    var equals = _curry2(function equals(a, b) {
        return _equals(a, b, [], []);
    });

    /**
     * Takes a predicate and a "filterable", and returns a new filterable of the
     * same type containing the members of the given filterable which satisfy the
     * given predicate.
     *
     * Dispatches to the `filter` method of the second argument, if present.
     *
     * Acts as a transducer if a transformer is given in list position.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig Filterable f => (a -> Boolean) -> f a -> f a
     * @param {Function} pred
     * @param {Array} filterable
     * @return {Array}
     * @see R.reject, R.transduce, R.addIndex
     * @example
     *
     *      var isEven = n => n % 2 === 0;
     *
     *      R.filter(isEven, [1, 2, 3, 4]); //=> [2, 4]
     *
     *      R.filter(isEven, {a: 1, b: 2, c: 3, d: 4}); //=> {b: 2, d: 4}
     */
    // else
    var filter = _curry2(_dispatchable('filter', _xfilter, function (pred, filterable) {
        return _isObject(filterable) ? _reduce(function (acc, key) {
            if (pred(filterable[key])) {
                acc[key] = filterable[key];
            }
            return acc;
        }, {}, keys(filterable)) : // else
        _filter(pred, filterable);
    }));

    /**
     * Returns a new list by pulling every item out of it (and all its sub-arrays)
     * and putting them in a new array, depth-first.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig [a] -> [b]
     * @param {Array} list The array to consider.
     * @return {Array} The flattened list.
     * @see R.unnest
     * @example
     *
     *      R.flatten([1, 2, [3, 4], 5, [6, [7, 8, [9, [10, 11], 12]]]]);
     *      //=> [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
     */
    var flatten = _curry1(_makeFlat(true));

    /**
     * Returns a new function much like the supplied one, except that the first two
     * arguments' order is reversed.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Function
     * @sig (a -> b -> c -> ... -> z) -> (b -> a -> c -> ... -> z)
     * @param {Function} fn The function to invoke with its first two parameters reversed.
     * @return {*} The result of invoking `fn` with its first two parameters' order reversed.
     * @example
     *
     *      var mergeThree = (a, b, c) => [].concat(a, b, c);
     *
     *      mergeThree(1, 2, 3); //=> [1, 2, 3]
     *
     *      R.flip(mergeThree)(1, 2, 3); //=> [2, 1, 3]
     */
    var flip = _curry1(function flip(fn) {
        return curry(function (a, b) {
            var args = _slice(arguments);
            args[0] = b;
            args[1] = a;
            return fn.apply(this, args);
        });
    });

    /**
     * Splits a list into sub-lists stored in an object, based on the result of
     * calling a String-returning function on each element, and grouping the
     * results according to values returned.
     *
     * Dispatches to the `groupBy` method of the second argument, if present.
     *
     * Acts as a transducer if a transformer is given in list position.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig (a -> String) -> [a] -> {String: [a]}
     * @param {Function} fn Function :: a -> String
     * @param {Array} list The array to group
     * @return {Object} An object with the output of `fn` for keys, mapped to arrays of elements
     *         that produced that key when passed to `fn`.
     * @see R.transduce
     * @example
     *
     *      var byGrade = R.groupBy(function(student) {
     *        var score = student.score;
     *        return score < 65 ? 'F' :
     *               score < 70 ? 'D' :
     *               score < 80 ? 'C' :
     *               score < 90 ? 'B' : 'A';
     *      });
     *      var students = [{name: 'Abby', score: 84},
     *                      {name: 'Eddy', score: 58},
     *                      // ...
     *                      {name: 'Jack', score: 69}];
     *      byGrade(students);
     *      // {
     *      //   'A': [{name: 'Dianne', score: 99}],
     *      //   'B': [{name: 'Abby', score: 84}]
     *      //   // ...,
     *      //   'F': [{name: 'Eddy', score: 58}]
     *      // }
     */
    var groupBy = _curry2(_dispatchable('groupBy', _xgroupBy, function groupBy(fn, list) {
        return _reduce(function (acc, elt) {
            var key = fn(elt);
            acc[key] = append(elt, acc[key] || (acc[key] = []));
            return acc;
        }, {}, list);
    }));

    /**
     * Returns the first element of the given list or string. In some libraries
     * this function is named `first`.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig [a] -> a | Undefined
     * @sig String -> String
     * @param {Array|String} list
     * @return {*}
     * @see R.tail, R.init, R.last
     * @example
     *
     *      R.head(['fi', 'fo', 'fum']); //=> 'fi'
     *      R.head([]); //=> undefined
     *
     *      R.head('abc'); //=> 'a'
     *      R.head(''); //=> ''
     */
    var head = nth(0);

    /**
     * Given a function that generates a key, turns a list of objects into an
     * object indexing the objects by the given key. Note that if multiple
     * objects generate the same value for the indexing key only the last value
     * will be included in the generated object.
     *
     * @func
     * @memberOf R
     * @since 0.19.1
     * @since 0.19.0
     * @category List
     * @sig (a -> String) -> [{k: v}] -> {k: {k: v}}
     * @param {Function} fn Function :: a -> String
     * @param {Array} array The array of objects to index
     * @return {Object} An object indexing each array element by the given property.
     * @example
     *
     *      var list = [{id: 'xyz', title: 'A'}, {id: 'abc', title: 'B'}];
     *      R.indexBy(R.prop('id'), list);
     *      //=> {abc: {id: 'abc', title: 'B'}, xyz: {id: 'xyz', title: 'A'}}
     */
    var indexBy = _curry2(function indexBy(fn, list) {
        return _reduce(function (acc, elem) {
            var key = fn(elem);
            acc[key] = elem;
            return acc;
        }, {}, list);
    });

    /**
     * Returns all but the last element of the given list or string.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category List
     * @sig [a] -> [a]
     * @sig String -> String
     * @param {*} list
     * @return {*}
     * @see R.last, R.head, R.tail
     * @example
     *
     *      R.init([1, 2, 3]);  //=> [1, 2]
     *      R.init([1, 2]);     //=> [1]
     *      R.init([1]);        //=> []
     *      R.init([]);         //=> []
     *
     *      R.init('abc');  //=> 'ab'
     *      R.init('ab');   //=> 'a'
     *      R.init('a');    //=> ''
     *      R.init('');     //=> ''
     */
    var init = slice(0, -1);

    /**
     * Combines two lists into a set (i.e. no duplicates) composed of those
     * elements common to both lists. Duplication is determined according to the
     * value returned by applying the supplied predicate to two list elements.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Relation
     * @sig (a -> a -> Boolean) -> [*] -> [*] -> [*]
     * @param {Function} pred A predicate function that determines whether
     *        the two supplied elements are equal.
     * @param {Array} list1 One list of items to compare
     * @param {Array} list2 A second list of items to compare
     * @return {Array} A new list containing those elements common to both lists.
     * @see R.intersection
     * @example
     *
     *      var buffaloSpringfield = [
     *        {id: 824, name: 'Richie Furay'},
     *        {id: 956, name: 'Dewey Martin'},
     *        {id: 313, name: 'Bruce Palmer'},
     *        {id: 456, name: 'Stephen Stills'},
     *        {id: 177, name: 'Neil Young'}
     *      ];
     *      var csny = [
     *        {id: 204, name: 'David Crosby'},
     *        {id: 456, name: 'Stephen Stills'},
     *        {id: 539, name: 'Graham Nash'},
     *        {id: 177, name: 'Neil Young'}
     *      ];
     *
     *      R.intersectionWith(R.eqBy(R.prop('id')), buffaloSpringfield, csny);
     *      //=> [{id: 456, name: 'Stephen Stills'}, {id: 177, name: 'Neil Young'}]
     */
    var intersectionWith = _curry3(function intersectionWith(pred, list1, list2) {
        var results = [];
        var idx = 0;
        while (idx < list1.length) {
            if (_containsWith(pred, list1[idx], list2)) {
                results[results.length] = list1[idx];
            }
            idx += 1;
        }
        return uniqWith(pred, results);
    });

    /**
     * Same as R.invertObj, however this accounts for objects with duplicate values
     * by putting the values into an array.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category Object
     * @sig {s: x} -> {x: [ s, ... ]}
     * @param {Object} obj The object or array to invert
     * @return {Object} out A new object with keys
     * in an array.
     * @example
     *
     *      var raceResultsByFirstName = {
     *        first: 'alice',
     *        second: 'jake',
     *        third: 'alice',
     *      };
     *      R.invert(raceResultsByFirstName);
     *      //=> { 'alice': ['first', 'third'], 'jake':['second'] }
     */
    var invert = _curry1(function invert(obj) {
        var props = keys(obj);
        var len = props.length;
        var idx = 0;
        var out = {};
        while (idx < len) {
            var key = props[idx];
            var val = obj[key];
            var list = _has(val, out) ? out[val] : out[val] = [];
            list[list.length] = key;
            idx += 1;
        }
        return out;
    });

    /**
     * Returns a new object with the keys of the given object as values, and the
     * values of the given object, which are coerced to strings, as keys. Note
     * that the last key found is preferred when handling the same value.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category Object
     * @sig {s: x} -> {x: s}
     * @param {Object} obj The object or array to invert
     * @return {Object} out A new object
     * @example
     *
     *      var raceResults = {
     *        first: 'alice',
     *        second: 'jake'
     *      };
     *      R.invertObj(raceResults);
     *      //=> { 'alice': 'first', 'jake':'second' }
     *
     *      // Alternatively:
     *      var raceResults = ['alice', 'jake'];
     *      R.invertObj(raceResults);
     *      //=> { 'alice': '0', 'jake':'1' }
     */
    var invertObj = _curry1(function invertObj(obj) {
        var props = keys(obj);
        var len = props.length;
        var idx = 0;
        var out = {};
        while (idx < len) {
            var key = props[idx];
            out[obj[key]] = key;
            idx += 1;
        }
        return out;
    });

    /**
     * Returns `true` if the given value is its type's empty value; `false`
     * otherwise.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Logic
     * @sig a -> Boolean
     * @param {*} x
     * @return {Boolean}
     * @see R.empty
     * @example
     *
     *      R.isEmpty([1, 2, 3]);   //=> false
     *      R.isEmpty([]);          //=> true
     *      R.isEmpty('');          //=> true
     *      R.isEmpty(null);        //=> false
     *      R.isEmpty({});          //=> true
     *      R.isEmpty({length: 0}); //=> false
     */
    var isEmpty = _curry1(function isEmpty(x) {
        return x != null && equals(x, empty(x));
    });

    /**
     * Returns the last element of the given list or string.
     *
     * @func
     * @memberOf R
     * @since v0.1.4
     * @category List
     * @sig [a] -> a | Undefined
     * @sig String -> String
     * @param {*} list
     * @return {*}
     * @see R.init, R.head, R.tail
     * @example
     *
     *      R.last(['fi', 'fo', 'fum']); //=> 'fum'
     *      R.last([]); //=> undefined
     *
     *      R.last('abc'); //=> 'c'
     *      R.last(''); //=> ''
     */
    var last = nth(-1);

    /**
     * Returns the position of the last occurrence of an item in an array, or -1 if
     * the item is not included in the array. `R.equals` is used to determine
     * equality.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig a -> [a] -> Number
     * @param {*} target The item to find.
     * @param {Array} xs The array to search in.
     * @return {Number} the index of the target, or -1 if the target is not found.
     * @see R.indexOf
     * @example
     *
     *      R.lastIndexOf(3, [-1,3,3,0,1,2,3,4]); //=> 6
     *      R.lastIndexOf(10, [1,2,3,4]); //=> -1
     */
    var lastIndexOf = _curry2(function lastIndexOf(target, xs) {
        if (typeof xs.lastIndexOf === 'function' && !_isArray(xs)) {
            return xs.lastIndexOf(target);
        } else {
            var idx = xs.length - 1;
            while (idx >= 0) {
                if (equals(xs[idx], target)) {
                    return idx;
                }
                idx -= 1;
            }
            return -1;
        }
    });

    /**
     * Takes a function and
     * a [functor](https://github.com/fantasyland/fantasy-land#functor),
     * applies the function to each of the functor's values, and returns
     * a functor of the same shape.
     *
     * Ramda provides suitable `map` implementations for `Array` and `Object`,
     * so this function may be applied to `[1, 2, 3]` or `{x: 1, y: 2, z: 3}`.
     *
     * Dispatches to the `map` method of the second argument, if present.
     *
     * Acts as a transducer if a transformer is given in list position.
     *
     * Also treats functions as functors and will compose them together.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig Functor f => (a -> b) -> f a -> f b
     * @param {Function} fn The function to be called on every element of the input `list`.
     * @param {Array} list The list to be iterated over.
     * @return {Array} The new list.
     * @see R.transduce, R.addIndex
     * @example
     *
     *      var double = x => x * 2;
     *
     *      R.map(double, [1, 2, 3]); //=> [2, 4, 6]
     *
     *      R.map(double, {x: 1, y: 2, z: 3}); //=> {x: 2, y: 4, z: 6}
     */
    var map = _curry2(_dispatchable('map', _xmap, function map(fn, functor) {
        switch (Object.prototype.toString.call(functor)) {
        case '[object Function]':
            return curryN(functor.length, function () {
                return fn.call(this, functor.apply(this, arguments));
            });
        case '[object Object]':
            return _reduce(function (acc, key) {
                acc[key] = fn(functor[key]);
                return acc;
            }, {}, keys(functor));
        default:
            return _map(fn, functor);
        }
    }));

    /**
     * An Object-specific version of `map`. The function is applied to three
     * arguments: *(value, key, obj)*. If only the value is significant, use
     * `map` instead.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category Object
     * @sig ((*, String, Object) -> *) -> Object -> Object
     * @param {Function} fn
     * @param {Object} obj
     * @return {Object}
     * @see R.map
     * @example
     *
     *      var values = { x: 1, y: 2, z: 3 };
     *      var prependKeyAndDouble = (num, key, obj) => key + (num * 2);
     *
     *      R.mapObjIndexed(prependKeyAndDouble, values); //=> { x: 'x2', y: 'y4', z: 'z6' }
     */
    var mapObjIndexed = _curry2(function mapObjIndexed(fn, obj) {
        return _reduce(function (acc, key) {
            acc[key] = fn(obj[key], key, obj);
            return acc;
        }, {}, keys(obj));
    });

    /**
     * Creates a new object with the own properties of the two provided objects. If
     * a key exists in both objects, the provided function is applied to the values
     * associated with the key in each object, with the result being used as the
     * value associated with the key in the returned object. The key will be
     * excluded from the returned object if the resulting value is `undefined`.
     *
     * @func
     * @memberOf R
     * @since 0.19.1
     * @since 0.19.0
     * @category Object
     * @sig (a -> a -> a) -> {a} -> {a} -> {a}
     * @param {Function} fn
     * @param {Object} l
     * @param {Object} r
     * @return {Object}
     * @see R.merge, R.mergeWithKey
     * @example
     *
     *      R.mergeWith(R.concat,
     *                  { a: true, values: [10, 20] },
     *                  { b: true, values: [15, 35] });
     *      //=> { a: true, b: true, values: [10, 20, 15, 35] }
     */
    var mergeWith = _curry3(function mergeWith(fn, l, r) {
        return mergeWithKey(function (_, _l, _r) {
            return fn(_l, _r);
        }, l, r);
    });

    /**
     * Takes a function `f` and a list of arguments, and returns a function `g`.
     * When applied, `g` returns the result of applying `f` to the arguments
     * provided initially followed by the arguments provided to `g`.
     *
     * @func
     * @memberOf R
     * @since v0.10.0
     * @category Function
     * @sig ((a, b, c, ..., n) -> x) -> [a, b, c, ...] -> ((d, e, f, ..., n) -> x)
     * @param {Function} f
     * @param {Array} args
     * @return {Function}
     * @see R.partialRight
     * @example
     *
     *      var multiply = (a, b) => a * b;
     *      var double = R.partial(multiply, [2]);
     *      double(2); //=> 4
     *
     *      var greet = (salutation, title, firstName, lastName) =>
     *        salutation + ', ' + title + ' ' + firstName + ' ' + lastName + '!';
     *
     *      var sayHello = R.partial(greet, ['Hello']);
     *      var sayHelloToMs = R.partial(sayHello, ['Ms.']);
     *      sayHelloToMs('Jane', 'Jones'); //=> 'Hello, Ms. Jane Jones!'
     */
    var partial = _createPartialApplicator(_concat);

    /**
     * Takes a function `f` and a list of arguments, and returns a function `g`.
     * When applied, `g` returns the result of applying `f` to the arguments
     * provided to `g` followed by the arguments provided initially.
     *
     * @func
     * @memberOf R
     * @since v0.10.0
     * @category Function
     * @sig ((a, b, c, ..., n) -> x) -> [d, e, f, ..., n] -> ((a, b, c, ...) -> x)
     * @param {Function} f
     * @param {Array} args
     * @return {Function}
     * @see R.partial
     * @example
     *
     *      var greet = (salutation, title, firstName, lastName) =>
     *        salutation + ', ' + title + ' ' + firstName + ' ' + lastName + '!';
     *
     *      var greetMsJaneJones = R.partialRight(greet, ['Ms.', 'Jane', 'Jones']);
     *
     *      greetMsJaneJones('Hello'); //=> 'Hello, Ms. Jane Jones!'
     */
    var partialRight = _createPartialApplicator(flip(_concat));

    /**
     * Takes a predicate and a list and returns the pair of lists of elements which
     * do and do not satisfy the predicate, respectively.
     *
     * @func
     * @memberOf R
     * @since v0.1.4
     * @category List
     * @sig (a -> Boolean) -> [a] -> [[a],[a]]
     * @param {Function} pred A predicate to determine which array the element belongs to.
     * @param {Array} list The array to partition.
     * @return {Array} A nested array, containing first an array of elements that satisfied the predicate,
     *         and second an array of elements that did not satisfy.
     * @see R.filter, R.reject
     * @example
     *
     *      R.partition(R.contains('s'), ['sss', 'ttt', 'foo', 'bars']);
     *      //=> [ [ 'sss', 'bars' ],  [ 'ttt', 'foo' ] ]
     */
    var partition = _curry2(function partition(pred, list) {
        return _reduce(function (acc, elt) {
            var xs = acc[pred(elt) ? 0 : 1];
            xs[xs.length] = elt;
            return acc;
        }, [
            [],
            []
        ], list);
    });

    /**
     * Determines whether a nested path on an object has a specific value, in
     * `R.equals` terms. Most likely used to filter a list.
     *
     * @func
     * @memberOf R
     * @since v0.7.0
     * @category Relation
     * @sig [String] -> * -> {String: *} -> Boolean
     * @param {Array} path The path of the nested property to use
     * @param {*} val The value to compare the nested property with
     * @param {Object} obj The object to check the nested property in
     * @return {Boolean} `true` if the value equals the nested object property,
     *         `false` otherwise.
     * @example
     *
     *      var user1 = { address: { zipCode: 90210 } };
     *      var user2 = { address: { zipCode: 55555 } };
     *      var user3 = { name: 'Bob' };
     *      var users = [ user1, user2, user3 ];
     *      var isFamous = R.pathEq(['address', 'zipCode'], 90210);
     *      R.filter(isFamous, users); //=> [ user1 ]
     */
    var pathEq = _curry3(function pathEq(_path, val, obj) {
        return equals(path(_path, obj), val);
    });

    /**
     * Returns a new list by plucking the same named property off all objects in
     * the list supplied.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig k -> [{k: v}] -> [v]
     * @param {Number|String} key The key name to pluck off of each object.
     * @param {Array} list The array to consider.
     * @return {Array} The list of values for the given key.
     * @see R.props
     * @example
     *
     *      R.pluck('a')([{a: 1}, {a: 2}]); //=> [1, 2]
     *      R.pluck(0)([[1, 2], [3, 4]]);   //=> [1, 3]
     */
    var pluck = _curry2(function pluck(p, list) {
        return map(prop(p), list);
    });

    /**
     * Reasonable analog to SQL `select` statement.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Object
     * @category Relation
     * @sig [k] -> [{k: v}] -> [{k: v}]
     * @param {Array} props The property names to project
     * @param {Array} objs The objects to query
     * @return {Array} An array of objects with just the `props` properties.
     * @example
     *
     *      var abby = {name: 'Abby', age: 7, hair: 'blond', grade: 2};
     *      var fred = {name: 'Fred', age: 12, hair: 'brown', grade: 7};
     *      var kids = [abby, fred];
     *      R.project(['name', 'grade'], kids); //=> [{name: 'Abby', grade: 2}, {name: 'Fred', grade: 7}]
     */
    // passing `identity` gives correct arity
    var project = useWith(_map, [
        pickAll,
        identity
    ]);

    /**
     * Returns `true` if the specified object property is equal, in `R.equals`
     * terms, to the given value; `false` otherwise.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Relation
     * @sig String -> a -> Object -> Boolean
     * @param {String} name
     * @param {*} val
     * @param {*} obj
     * @return {Boolean}
     * @see R.equals, R.propSatisfies
     * @example
     *
     *      var abby = {name: 'Abby', age: 7, hair: 'blond'};
     *      var fred = {name: 'Fred', age: 12, hair: 'brown'};
     *      var rusty = {name: 'Rusty', age: 10, hair: 'brown'};
     *      var alois = {name: 'Alois', age: 15, disposition: 'surly'};
     *      var kids = [abby, fred, rusty, alois];
     *      var hasBrownHair = R.propEq('hair', 'brown');
     *      R.filter(hasBrownHair, kids); //=> [fred, rusty]
     */
    var propEq = _curry3(function propEq(name, val, obj) {
        return propSatisfies(equals(val), name, obj);
    });

    /**
     * Returns `true` if the specified object property is of the given type;
     * `false` otherwise.
     *
     * @func
     * @memberOf R
     * @since v0.16.0
     * @category Type
     * @sig Type -> String -> Object -> Boolean
     * @param {Function} type
     * @param {String} name
     * @param {*} obj
     * @return {Boolean}
     * @see R.is, R.propSatisfies
     * @example
     *
     *      R.propIs(Number, 'x', {x: 1, y: 2});  //=> true
     *      R.propIs(Number, 'x', {x: 'foo'});    //=> false
     *      R.propIs(Number, 'x', {});            //=> false
     */
    var propIs = _curry3(function propIs(type, name, obj) {
        return propSatisfies(is(type), name, obj);
    });

    /**
     * Returns a single item by iterating through the list, successively calling
     * the iterator function and passing it an accumulator value and the current
     * value from the array, and then passing the result to the next call.
     *
     * The iterator function receives two values: *(acc, value)*. It may use
     * `R.reduced` to shortcut the iteration.
     *
     * Note: `R.reduce` does not skip deleted or unassigned indices (sparse
     * arrays), unlike the native `Array.prototype.reduce` method. For more details
     * on this behavior, see:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce#Description
     *
     * Dispatches to the `reduce` method of the third argument, if present.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig ((a, b) -> a) -> a -> [b] -> a
     * @param {Function} fn The iterator function. Receives two values, the accumulator and the
     *        current element from the array.
     * @param {*} acc The accumulator value.
     * @param {Array} list The list to iterate over.
     * @return {*} The final, accumulated value.
     * @see R.reduced, R.addIndex
     * @example
     *
     *      var numbers = [1, 2, 3];
     *      var add = (a, b) => a + b;
     *
     *      R.reduce(add, 10, numbers); //=> 16
     */
    var reduce = _curry3(_reduce);

    /**
     * The complement of `filter`.
     *
     * Acts as a transducer if a transformer is given in list position.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig Filterable f => (a -> Boolean) -> f a -> f a
     * @param {Function} pred
     * @param {Array} filterable
     * @return {Array}
     * @see R.filter, R.transduce, R.addIndex
     * @example
     *
     *      var isOdd = (n) => n % 2 === 1;
     *
     *      R.reject(isOdd, [1, 2, 3, 4]); //=> [2, 4]
     *
     *      R.reject(isOdd, {a: 1, b: 2, c: 3, d: 4}); //=> {b: 2, d: 4}
     */
    var reject = _curry2(function reject(pred, filterable) {
        return filter(_complement(pred), filterable);
    });

    /**
     * Returns a fixed list of size `n` containing a specified identical value.
     *
     * @func
     * @memberOf R
     * @since v0.1.1
     * @category List
     * @sig a -> n -> [a]
     * @param {*} value The value to repeat.
     * @param {Number} n The desired size of the output list.
     * @return {Array} A new array containing `n` `value`s.
     * @example
     *
     *      R.repeat('hi', 5); //=> ['hi', 'hi', 'hi', 'hi', 'hi']
     *
     *      var obj = {};
     *      var repeatedObjs = R.repeat(obj, 5); //=> [{}, {}, {}, {}, {}]
     *      repeatedObjs[0] === repeatedObjs[1]; //=> true
     */
    var repeat = _curry2(function repeat(value, n) {
        return times(always(value), n);
    });

    /**
     * Adds together all the elements of a list.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Math
     * @sig [Number] -> Number
     * @param {Array} list An array of numbers
     * @return {Number} The sum of all the numbers in the list.
     * @see R.reduce
     * @example
     *
     *      R.sum([2,4,6,8,100,1]); //=> 121
     */
    var sum = reduce(add, 0);

    /**
     * Returns a new list containing the last `n` elements of the given list.
     * If `n > list.length`, returns a list of `list.length` elements.
     *
     * @func
     * @memberOf R
     * @since v0.16.0
     * @category List
     * @sig Number -> [a] -> [a]
     * @sig Number -> String -> String
     * @param {Number} n The number of elements to return.
     * @param {Array} xs The collection to consider.
     * @return {Array}
     * @see R.dropLast
     * @example
     *
     *      R.takeLast(1, ['foo', 'bar', 'baz']); //=> ['baz']
     *      R.takeLast(2, ['foo', 'bar', 'baz']); //=> ['bar', 'baz']
     *      R.takeLast(3, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
     *      R.takeLast(4, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
     *      R.takeLast(3, 'ramda');               //=> 'mda'
     */
    var takeLast = _curry2(function takeLast(n, xs) {
        return drop(n >= 0 ? xs.length - n : 0, xs);
    });

    /**
     * Initializes a transducer using supplied iterator function. Returns a single
     * item by iterating through the list, successively calling the transformed
     * iterator function and passing it an accumulator value and the current value
     * from the array, and then passing the result to the next call.
     *
     * The iterator function receives two values: *(acc, value)*. It will be
     * wrapped as a transformer to initialize the transducer. A transformer can be
     * passed directly in place of an iterator function. In both cases, iteration
     * may be stopped early with the `R.reduced` function.
     *
     * A transducer is a function that accepts a transformer and returns a
     * transformer and can be composed directly.
     *
     * A transformer is an an object that provides a 2-arity reducing iterator
     * function, step, 0-arity initial value function, init, and 1-arity result
     * extraction function, result. The step function is used as the iterator
     * function in reduce. The result function is used to convert the final
     * accumulator into the return type and in most cases is R.identity. The init
     * function can be used to provide an initial accumulator, but is ignored by
     * transduce.
     *
     * The iteration is performed with R.reduce after initializing the transducer.
     *
     * @func
     * @memberOf R
     * @since v0.12.0
     * @category List
     * @sig (c -> c) -> (a,b -> a) -> a -> [b] -> a
     * @param {Function} xf The transducer function. Receives a transformer and returns a transformer.
     * @param {Function} fn The iterator function. Receives two values, the accumulator and the
     *        current element from the array. Wrapped as transformer, if necessary, and used to
     *        initialize the transducer
     * @param {*} acc The initial accumulator value.
     * @param {Array} list The list to iterate over.
     * @return {*} The final, accumulated value.
     * @see R.reduce, R.reduced, R.into
     * @example
     *
     *      var numbers = [1, 2, 3, 4];
     *      var transducer = R.compose(R.map(R.add(1)), R.take(2));
     *
     *      R.transduce(transducer, R.flip(R.append), [], numbers); //=> [2, 3]
     */
    var transduce = curryN(4, function transduce(xf, fn, acc, list) {
        return _reduce(xf(typeof fn === 'function' ? _xwrap(fn) : fn), acc, list);
    });

    /**
     * Combines two lists into a set (i.e. no duplicates) composed of the elements
     * of each list. Duplication is determined according to the value returned by
     * applying the supplied predicate to two list elements.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Relation
     * @sig (a -> a -> Boolean) -> [*] -> [*] -> [*]
     * @param {Function} pred A predicate used to test whether two items are equal.
     * @param {Array} list1 The first list.
     * @param {Array} list2 The second list.
     * @return {Array} The first and second lists concatenated, with
     *         duplicates removed.
     * @see R.union
     * @example
     *
     *      var l1 = [{a: 1}, {a: 2}];
     *      var l2 = [{a: 1}, {a: 4}];
     *      R.unionWith(R.eqBy(R.prop('a')), l1, l2); //=> [{a: 1}, {a: 2}, {a: 4}]
     */
    var unionWith = _curry3(function unionWith(pred, list1, list2) {
        return uniqWith(pred, _concat(list1, list2));
    });

    /**
     * Takes a spec object and a test object; returns true if the test satisfies
     * the spec, false otherwise. An object satisfies the spec if, for each of the
     * spec's own properties, accessing that property of the object gives the same
     * value (in `R.equals` terms) as accessing that property of the spec.
     *
     * `whereEq` is a specialization of [`where`](#where).
     *
     * @func
     * @memberOf R
     * @since v0.14.0
     * @category Object
     * @sig {String: *} -> {String: *} -> Boolean
     * @param {Object} spec
     * @param {Object} testObj
     * @return {Boolean}
     * @see R.where
     * @example
     *
     *      // pred :: Object -> Boolean
     *      var pred = R.whereEq({a: 1, b: 2});
     *
     *      pred({a: 1});              //=> false
     *      pred({a: 1, b: 2});        //=> true
     *      pred({a: 1, b: 2, c: 3});  //=> true
     *      pred({a: 1, b: 1});        //=> false
     */
    var whereEq = _curry2(function whereEq(spec, testObj) {
        return where(map(equals, spec), testObj);
    });

    var _flatCat = function () {
        var preservingReduced = function (xf) {
            return {
                '@@transducer/init': _xfBase.init,
                '@@transducer/result': function (result) {
                    return xf['@@transducer/result'](result);
                },
                '@@transducer/step': function (result, input) {
                    var ret = xf['@@transducer/step'](result, input);
                    return ret['@@transducer/reduced'] ? _forceReduced(ret) : ret;
                }
            };
        };
        return function _xcat(xf) {
            var rxf = preservingReduced(xf);
            return {
                '@@transducer/init': _xfBase.init,
                '@@transducer/result': function (result) {
                    return rxf['@@transducer/result'](result);
                },
                '@@transducer/step': function (result, input) {
                    return !isArrayLike(input) ? _reduce(rxf, result, [input]) : _reduce(rxf, result, input);
                }
            };
        };
    }();

    // Array.prototype.indexOf doesn't exist below IE9
    // manually crawl the list to distinguish between +0 and -0
    // NaN
    // non-zero numbers can utilise Set
    // all these types can utilise Set
    // null can utilise Set
    // anything else not covered above, defer to R.equals
    var _indexOf = function _indexOf(list, a, idx) {
        var inf, item;
        // Array.prototype.indexOf doesn't exist below IE9
        if (typeof list.indexOf === 'function') {
            switch (typeof a) {
            case 'number':
                if (a === 0) {
                    // manually crawl the list to distinguish between +0 and -0
                    inf = 1 / a;
                    while (idx < list.length) {
                        item = list[idx];
                        if (item === 0 && 1 / item === inf) {
                            return idx;
                        }
                        idx += 1;
                    }
                    return -1;
                } else if (a !== a) {
                    // NaN
                    while (idx < list.length) {
                        item = list[idx];
                        if (typeof item === 'number' && item !== item) {
                            return idx;
                        }
                        idx += 1;
                    }
                    return -1;
                }
                // non-zero numbers can utilise Set
                return list.indexOf(a, idx);
            // all these types can utilise Set
            case 'string':
            case 'boolean':
            case 'function':
            case 'undefined':
                return list.indexOf(a, idx);
            case 'object':
                if (a === null) {
                    // null can utilise Set
                    return list.indexOf(a, idx);
                }
            }
        }
        // anything else not covered above, defer to R.equals
        while (idx < list.length) {
            if (equals(list[idx], a)) {
                return idx;
            }
            idx += 1;
        }
        return -1;
    };

    var _xchain = _curry2(function _xchain(f, xf) {
        return map(f, _flatCat(xf));
    });

    /**
     * Takes a list of predicates and returns a predicate that returns true for a
     * given list of arguments if every one of the provided predicates is satisfied
     * by those arguments.
     *
     * The function returned is a curried function whose arity matches that of the
     * highest-arity predicate.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category Logic
     * @sig [(*... -> Boolean)] -> (*... -> Boolean)
     * @param {Array} preds
     * @return {Function}
     * @see R.anyPass
     * @example
     *
     *      var isQueen = R.propEq('rank', 'Q');
     *      var isSpade = R.propEq('suit', '♠︎');
     *      var isQueenOfSpades = R.allPass([isQueen, isSpade]);
     *
     *      isQueenOfSpades({rank: 'Q', suit: '♣︎'}); //=> false
     *      isQueenOfSpades({rank: 'Q', suit: '♠︎'}); //=> true
     */
    var allPass = _curry1(function allPass(preds) {
        return curryN(reduce(max, 0, pluck('length', preds)), function () {
            var idx = 0;
            var len = preds.length;
            while (idx < len) {
                if (!preds[idx].apply(this, arguments)) {
                    return false;
                }
                idx += 1;
            }
            return true;
        });
    });

    /**
     * Returns `true` if all elements are unique, in `R.equals` terms, otherwise
     * `false`.
     *
     * @func
     * @memberOf R
     * @since v0.18.0
     * @category List
     * @sig [a] -> Boolean
     * @param {Array} list The array to consider.
     * @return {Boolean} `true` if all elements are unique, else `false`.
     * @example
     *
     *      R.allUniq(['1', 1]); //=> true
     *      R.allUniq([1, 1]);   //=> false
     *      R.allUniq([[42], [42]]); //=> false
     */
    var allUniq = _curry1(function allUniq(list) {
        var len = list.length;
        var idx = 0;
        while (idx < len) {
            if (_indexOf(list, list[idx], idx + 1) >= 0) {
                return false;
            }
            idx += 1;
        }
        return true;
    });

    /**
     * Takes a list of predicates and returns a predicate that returns true for a
     * given list of arguments if at least one of the provided predicates is
     * satisfied by those arguments.
     *
     * The function returned is a curried function whose arity matches that of the
     * highest-arity predicate.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category Logic
     * @sig [(*... -> Boolean)] -> (*... -> Boolean)
     * @param {Array} preds
     * @return {Function}
     * @see R.allPass
     * @example
     *
     *      var gte = R.anyPass([R.gt, R.equals]);
     *
     *      gte(3, 2); //=> true
     *      gte(2, 2); //=> true
     *      gte(2, 3); //=> false
     */
    var anyPass = _curry1(function anyPass(preds) {
        return curryN(reduce(max, 0, pluck('length', preds)), function () {
            var idx = 0;
            var len = preds.length;
            while (idx < len) {
                if (preds[idx].apply(this, arguments)) {
                    return true;
                }
                idx += 1;
            }
            return false;
        });
    });

    /**
     * ap applies a list of functions to a list of values.
     *
     * Dispatches to the `ap` method of the second argument, if present. Also
     * treats functions as applicatives.
     *
     * @func
     * @memberOf R
     * @since v0.3.0
     * @category Function
     * @sig [f] -> [a] -> [f a]
     * @param {Array} fns An array of functions
     * @param {Array} vs An array of values
     * @return {Array} An array of results of applying each of `fns` to all of `vs` in turn.
     * @example
     *
     *      R.ap([R.multiply(2), R.add(3)], [1,2,3]); //=> [2, 4, 6, 4, 5, 6]
     */
    // else
    var ap = _curry2(function ap(applicative, fn) {
        return typeof applicative.ap === 'function' ? applicative.ap(fn) : typeof applicative === 'function' ? curryN(Math.max(applicative.length, fn.length), function () {
            return applicative.apply(this, arguments)(fn.apply(this, arguments));
        }) : // else
        _reduce(function (acc, f) {
            return _concat(acc, map(f, fn));
        }, [], applicative);
    });

    /**
     * Returns the result of calling its first argument with the remaining
     * arguments. This is occasionally useful as a converging function for
     * `R.converge`: the left branch can produce a function while the right branch
     * produces a value to be passed to that function as an argument.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category Function
     * @sig (*... -> a),*... -> a
     * @param {Function} fn The function to apply to the remaining arguments.
     * @param {...*} args Any number of positional arguments.
     * @return {*}
     * @see R.apply
     * @example
     *
     *      var indentN = R.pipe(R.times(R.always(' ')),
     *                           R.join(''),
     *                           R.replace(/^(?!$)/gm));
     *
     *      var format = R.converge(R.call, [
     *                                  R.pipe(R.prop('indent'), indentN),
     *                                  R.prop('value')
     *                              ]);
     *
     *      format({indent: 2, value: 'foo\nbar\nbaz\n'}); //=> '  foo\n  bar\n  baz\n'
     */
    var call = curry(function call(fn) {
        return fn.apply(this, _slice(arguments, 1));
    });

    /**
     * `chain` maps a function over a list and concatenates the results. `chain`
     * is also known as `flatMap` in some libraries
     *
     * Dispatches to the `chain` method of the second argument, if present.
     *
     * @func
     * @memberOf R
     * @since v0.3.0
     * @category List
     * @sig (a -> [b]) -> [a] -> [b]
     * @param {Function} fn
     * @param {Array} list
     * @return {Array}
     * @example
     *
     *      var duplicate = n => [n, n];
     *      R.chain(duplicate, [1, 2, 3]); //=> [1, 1, 2, 2, 3, 3]
     */
    var chain = _curry2(_dispatchable('chain', _xchain, function chain(fn, monad) {
        if (typeof monad === 'function') {
            return function () {
                return monad.call(this, fn.apply(this, arguments)).apply(this, arguments);
            };
        }
        return _makeFlat(false)(map(fn, monad));
    }));

    /**
     * Turns a list of Functors into a Functor of a list, applying a mapping
     * function to the elements of the list along the way.
     *
     * @func
     * @memberOf R
     * @since v0.8.0
     * @category List
     * @sig Functor f => (a -> f b) -> (x -> f x) -> [a] -> f [b]
     * @param {Function} fn The transformation function
     * @param {Function} of A function that returns the data type to return
     * @param {Array} list An array of functors of the same type
     * @return {*}
     * @see R.traverse
     * @deprecated since v0.19.0
     * @example
     *
     *      var add10 = R.map(R.add(10));
     *      R.commuteMap(add10, R.of, [[1], [2, 3]]);   //=> [[11, 12], [11, 13]]
     *      R.commuteMap(add10, R.of, [[1, 2], [3]]);   //=> [[11, 13], [12, 13]]
     *      R.commuteMap(add10, R.of, [[1], [2], [3]]); //=> [[11, 12, 13]]
     *      R.commuteMap(add10, Maybe.of, [Just(1), Just(2), Just(3)]);   //=> Just([11, 12, 13])
     *      R.commuteMap(add10, Maybe.of, [Just(1), Just(2), Nothing()]); //=> Nothing()
     *
     *      var fetch = url => Future((rej, res) => http.get(url, res).on('error', rej));
     *      R.commuteMap(fetch, Future.of, [
     *        'http://ramdajs.com',
     *        'http://github.com/ramda'
     *      ]); //=> Future([IncomingMessage, IncomingMessage])
     */
    var commuteMap = _curry3(function commuteMap(fn, of, list) {
        function consF(acc, x) {
            return ap(map(prepend, fn(x)), acc);
        }
        return reduceRight(consF, of([]), list);
    });

    /**
     * Wraps a constructor function inside a curried function that can be called
     * with the same arguments and returns the same type. The arity of the function
     * returned is specified to allow using variadic constructor functions.
     *
     * @func
     * @memberOf R
     * @since v0.4.0
     * @category Function
     * @sig Number -> (* -> {*}) -> (* -> {*})
     * @param {Number} n The arity of the constructor function.
     * @param {Function} Fn The constructor function to wrap.
     * @return {Function} A wrapped, curried constructor function.
     * @example
     *
     *      // Variadic constructor function
     *      var Widget = () => {
     *        this.children = Array.prototype.slice.call(arguments);
     *        // ...
     *      };
     *      Widget.prototype = {
     *        // ...
     *      };
     *      var allConfigs = [
     *        // ...
     *      ];
     *      R.map(R.constructN(1, Widget), allConfigs); // a list of Widgets
     */
    var constructN = _curry2(function constructN(n, Fn) {
        if (n > 10) {
            throw new Error('Constructor with greater than ten arguments');
        }
        if (n === 0) {
            return function () {
                return new Fn();
            };
        }
        return curry(nAry(n, function ($0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
            switch (arguments.length) {
            case 1:
                return new Fn($0);
            case 2:
                return new Fn($0, $1);
            case 3:
                return new Fn($0, $1, $2);
            case 4:
                return new Fn($0, $1, $2, $3);
            case 5:
                return new Fn($0, $1, $2, $3, $4);
            case 6:
                return new Fn($0, $1, $2, $3, $4, $5);
            case 7:
                return new Fn($0, $1, $2, $3, $4, $5, $6);
            case 8:
                return new Fn($0, $1, $2, $3, $4, $5, $6, $7);
            case 9:
                return new Fn($0, $1, $2, $3, $4, $5, $6, $7, $8);
            case 10:
                return new Fn($0, $1, $2, $3, $4, $5, $6, $7, $8, $9);
            }
        }));
    });

    /**
     * Accepts a converging function and a list of branching functions and returns
     * a new function. When invoked, this new function is applied to some
     * arguments, each branching function is applied to those same arguments. The
     * results of each branching function are passed as arguments to the converging
     * function to produce the return value.
     *
     * @func
     * @memberOf R
     * @since v0.4.2
     * @category Function
     * @sig (x1 -> x2 -> ... -> z) -> [(a -> b -> ... -> x1), (a -> b -> ... -> x2), ...] -> (a -> b -> ... -> z)
     * @param {Function} after A function. `after` will be invoked with the return values of
     *        `fn1` and `fn2` as its arguments.
     * @param {Array} functions A list of functions.
     * @return {Function} A new function.
     * @example
     *
     *      var add = (a, b) => a + b;
     *      var multiply = (a, b) => a * b;
     *      var subtract = (a, b) => a - b;
     *
     *      //≅ multiply( add(1, 2), subtract(1, 2) );
     *      R.converge(multiply, [add, subtract])(1, 2); //=> -3
     *
     *      var add3 = (a, b, c) => a + b + c;
     *      R.converge(add3, [multiply, add, subtract])(1, 2); //=> 4
     */
    var converge = _curry2(function converge(after, fns) {
        return curryN(Math.max.apply(Math, pluck('length', fns)), function () {
            var args = arguments;
            var context = this;
            return after.apply(context, _map(function (fn) {
                return fn.apply(context, args);
            }, fns));
        });
    });

    /**
     * Returns a new list without any consecutively repeating elements. Equality is
     * determined by applying the supplied predicate two consecutive elements. The
     * first element in a series of equal element is the one being preserved.
     *
     * Dispatches to the `dropRepeatsWith` method of the second argument, if present.
     *
     * Acts as a transducer if a transformer is given in list position.
     *
     * @func
     * @memberOf R
     * @since v0.14.0
     * @category List
     * @sig (a, a -> Boolean) -> [a] -> [a]
     * @param {Function} pred A predicate used to test whether two items are equal.
     * @param {Array} list The array to consider.
     * @return {Array} `list` without repeating elements.
     * @see R.transduce
     * @example
     *
     *      var lengthEq = (x, y) => Math.abs(x) === Math.abs(y);
     *      var l = [1, -1, 1, 3, 4, -4, -4, -5, 5, 3, 3];
     *      R.dropRepeatsWith(R.eqBy(Math.abs), l); //=> [1, 3, 4, -5, 3]
     */
    var dropRepeatsWith = _curry2(_dispatchable('dropRepeatsWith', _xdropRepeatsWith, function dropRepeatsWith(pred, list) {
        var result = [];
        var idx = 1;
        var len = list.length;
        if (len !== 0) {
            result[0] = list[0];
            while (idx < len) {
                if (!pred(last(result), list[idx])) {
                    result[result.length] = list[idx];
                }
                idx += 1;
            }
        }
        return result;
    }));

    /**
     * Takes a function and two values in its domain and returns `true` if the
     * values map to the same value in the codomain; `false` otherwise.
     *
     * @func
     * @memberOf R
     * @since v0.18.0
     * @category Relation
     * @sig (a -> b) -> a -> a -> Boolean
     * @param {Function} f
     * @param {*} x
     * @param {*} y
     * @return {Boolean}
     * @example
     *
     *      R.eqBy(Math.abs, 5, -5); //=> true
     */
    var eqBy = _curry3(function eqBy(f, x, y) {
        return equals(f(x), f(y));
    });

    /**
     * Reports whether two objects have the same value, in `R.equals` terms, for
     * the specified property. Useful as a curried predicate.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Object
     * @sig k -> {k: v} -> {k: v} -> Boolean
     * @param {String} prop The name of the property to compare
     * @param {Object} obj1
     * @param {Object} obj2
     * @return {Boolean}
     *
     * @example
     *
     *      var o1 = { a: 1, b: 2, c: 3, d: 4 };
     *      var o2 = { a: 10, b: 20, c: 3, d: 40 };
     *      R.eqProps('a', o1, o2); //=> false
     *      R.eqProps('c', o1, o2); //=> true
     */
    var eqProps = _curry3(function eqProps(prop, obj1, obj2) {
        return equals(obj1[prop], obj2[prop]);
    });

    /**
     * Returns the position of the first occurrence of an item in an array, or -1
     * if the item is not included in the array. `R.equals` is used to determine
     * equality.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig a -> [a] -> Number
     * @param {*} target The item to find.
     * @param {Array} xs The array to search in.
     * @return {Number} the index of the target, or -1 if the target is not found.
     * @see R.lastIndexOf
     * @example
     *
     *      R.indexOf(3, [1,2,3,4]); //=> 2
     *      R.indexOf(10, [1,2,3,4]); //=> -1
     */
    var indexOf = _curry2(function indexOf(target, xs) {
        return typeof xs.indexOf === 'function' && !_isArray(xs) ? xs.indexOf(target) : _indexOf(xs, target, 0);
    });

    /**
     * juxt applies a list of functions to a list of values.
     *
     * @func
     * @memberOf R
     * @since 0.19.1
     * @since 0.19.0
     * @category Function
     * @sig [(a, b, ..., m) -> n] -> ((a, b, ..., m) -> [n])
     * @param {Array} fns An array of functions
     * @return {Function} A function that returns a list of values after applying each of the original `fns` to its parameters.
     * @example
     *
     *      var range = R.juxt([Math.min, Math.max]);
     *      range(3, 4, 9, -3); //=> [-3, 9]
     */
    var juxt = _curry1(function juxt(fns) {
        return function () {
            return map(apply(__, arguments), fns);
        };
    });

    /**
     * Returns a lens for the given getter and setter functions. The getter "gets"
     * the value of the focus; the setter "sets" the value of the focus. The setter
     * should not mutate the data structure.
     *
     * @func
     * @memberOf R
     * @since v0.8.0
     * @category Object
     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
     * @sig (s -> a) -> ((a, s) -> s) -> Lens s a
     * @param {Function} getter
     * @param {Function} setter
     * @return {Lens}
     * @see R.view, R.set, R.over, R.lensIndex, R.lensProp
     * @example
     *
     *      var xLens = R.lens(R.prop('x'), R.assoc('x'));
     *
     *      R.view(xLens, {x: 1, y: 2});            //=> 1
     *      R.set(xLens, 4, {x: 1, y: 2});          //=> {x: 4, y: 2}
     *      R.over(xLens, R.negate, {x: 1, y: 2});  //=> {x: -1, y: 2}
     */
    var lens = _curry2(function lens(getter, setter) {
        return function (f) {
            return function (s) {
                return map(function (v) {
                    return setter(v, s);
                }, f(getter(s)));
            };
        };
    });

    /**
     * Returns a lens whose focus is the specified index.
     *
     * @func
     * @memberOf R
     * @since v0.14.0
     * @category Object
     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
     * @sig Number -> Lens s a
     * @param {Number} n
     * @return {Lens}
     * @see R.view, R.set, R.over
     * @example
     *
     *      var headLens = R.lensIndex(0);
     *
     *      R.view(headLens, ['a', 'b', 'c']);            //=> 'a'
     *      R.set(headLens, 'x', ['a', 'b', 'c']);        //=> ['x', 'b', 'c']
     *      R.over(headLens, R.toUpper, ['a', 'b', 'c']); //=> ['A', 'b', 'c']
     */
    var lensIndex = _curry1(function lensIndex(n) {
        return lens(nth(n), update(n));
    });

    /**
     * Returns a lens whose focus is the specified path.
     *
     * @func
     * @memberOf R
     * @since 0.19.1
     * @since 0.19.0
     * @category Object
     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
     * @sig [String] -> Lens s a
     * @param {Array} path The path to use.
     * @return {Lens}
     * @see R.view, R.set, R.over
     * @example
     *
     *      var xyLens = R.lensPath(['x', 'y']);
     *
     *      R.view(xyLens, {x: {y: 2, z: 3}});            //=> 2
     *      R.set(xyLens, 4, {x: {y: 2, z: 3}});          //=> {x: {y: 4, z: 3}}
     *      R.over(xyLens, R.negate, {x: {y: 2, z: 3}});  //=> {x: {y: -2, z: 3}}
     */
    var lensPath = _curry1(function lensPath(p) {
        return lens(path(p), assocPath(p));
    });

    /**
     * Returns a lens whose focus is the specified property.
     *
     * @func
     * @memberOf R
     * @since v0.14.0
     * @category Object
     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
     * @sig String -> Lens s a
     * @param {String} k
     * @return {Lens}
     * @see R.view, R.set, R.over
     * @example
     *
     *      var xLens = R.lensProp('x');
     *
     *      R.view(xLens, {x: 1, y: 2});            //=> 1
     *      R.set(xLens, 4, {x: 1, y: 2});          //=> {x: 4, y: 2}
     *      R.over(xLens, R.negate, {x: 1, y: 2});  //=> {x: -1, y: 2}
     */
    var lensProp = _curry1(function lensProp(k) {
        return lens(prop(k), assoc(k));
    });

    /**
     * "lifts" a function to be the specified arity, so that it may "map over" that
     * many lists (or other objects that satisfies the [FantasyLand Apply spec](https://github.com/fantasyland/fantasy-land#apply)).
     *
     * @func
     * @memberOf R
     * @since v0.7.0
     * @category Function
     * @sig Number -> (*... -> *) -> ([*]... -> [*])
     * @param {Function} fn The function to lift into higher context
     * @return {Function} The lifted function.
     * @see R.lift
     * @example
     *
     *      var madd3 = R.liftN(3, R.curryN(3, (...args) => R.sum(args)));
     *      madd3([1,2,3], [1,2,3], [1]); //=> [3, 4, 5, 4, 5, 6, 5, 6, 7]
     */
    var liftN = _curry2(function liftN(arity, fn) {
        var lifted = curryN(arity, fn);
        return curryN(arity, function () {
            return _reduce(ap, map(lifted, arguments[0]), _slice(arguments, 1));
        });
    });

    /**
     * Returns the mean of the given list of numbers.
     *
     * @func
     * @memberOf R
     * @since v0.14.0
     * @category Math
     * @sig [Number] -> Number
     * @param {Array} list
     * @return {Number}
     * @example
     *
     *      R.mean([2, 7, 9]); //=> 6
     *      R.mean([]); //=> NaN
     */
    var mean = _curry1(function mean(list) {
        return sum(list) / list.length;
    });

    /**
     * Returns the median of the given list of numbers.
     *
     * @func
     * @memberOf R
     * @since v0.14.0
     * @category Math
     * @sig [Number] -> Number
     * @param {Array} list
     * @return {Number}
     * @example
     *
     *      R.median([2, 9, 7]); //=> 7
     *      R.median([7, 2, 10, 9]); //=> 8
     *      R.median([]); //=> NaN
     */
    var median = _curry1(function median(list) {
        var len = list.length;
        if (len === 0) {
            return NaN;
        }
        var width = 2 - len % 2;
        var idx = (len - width) / 2;
        return mean(_slice(list).sort(function (a, b) {
            return a < b ? -1 : a > b ? 1 : 0;
        }).slice(idx, idx + width));
    });

    /**
     * Create a new object with the own properties of the first object merged with
     * the own properties of the second object. If a key exists in both objects,
     * the value from the second object will be used.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Object
     * @sig {k: v} -> {k: v} -> {k: v}
     * @param {Object} l
     * @param {Object} r
     * @return {Object}
     * @see R.mergeWith, R.mergeWithKey
     * @example
     *
     *      R.merge({ 'name': 'fred', 'age': 10 }, { 'age': 40 });
     *      //=> { 'name': 'fred', 'age': 40 }
     *
     *      var resetToDefault = R.merge(R.__, {x: 0});
     *      resetToDefault({x: 5, y: 2}); //=> {x: 0, y: 2}
     */
    var merge = mergeWith(function (l, r) {
        return r;
    });

    /**
     * Merges a list of objects together into one object.
     *
     * @func
     * @memberOf R
     * @since v0.10.0
     * @category List
     * @sig [{k: v}] -> {k: v}
     * @param {Array} list An array of objects
     * @return {Object} A merged object.
     * @see R.reduce
     * @example
     *
     *      R.mergeAll([{foo:1},{bar:2},{baz:3}]); //=> {foo:1,bar:2,baz:3}
     *      R.mergeAll([{foo:1},{foo:2},{bar:2}]); //=> {foo:2,bar:2}
     */
    var mergeAll = _curry1(function mergeAll(list) {
        return reduce(merge, {}, list);
    });

    /**
     * Performs left-to-right function composition. The leftmost function may have
     * any arity; the remaining functions must be unary.
     *
     * In some libraries this function is named `sequence`.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Function
     * @sig (((a, b, ..., n) -> o), (o -> p), ..., (x -> y), (y -> z)) -> ((a, b, ..., n) -> z)
     * @param {...Function} functions
     * @return {Function}
     * @see R.compose
     * @example
     *
     *      var f = R.pipe(Math.pow, R.negate, R.inc);
     *
     *      f(3, 4); // -(3^4) + 1
     */
    var pipe = function pipe() {
        if (arguments.length === 0) {
            throw new Error('pipe requires at least one argument');
        }
        return _arity(arguments[0].length, reduce(_pipe, arguments[0], tail(arguments)));
    };

    /**
     * Performs left-to-right composition of one or more Promise-returning
     * functions. The leftmost function may have any arity; the remaining functions
     * must be unary.
     *
     * @func
     * @memberOf R
     * @since v0.10.0
     * @category Function
     * @sig ((a -> Promise b), (b -> Promise c), ..., (y -> Promise z)) -> (a -> Promise z)
     * @param {...Function} functions
     * @return {Function}
     * @see R.composeP
     * @example
     *
     *      //  followersForUser :: String -> Promise [User]
     *      var followersForUser = R.pipeP(db.getUserById, db.getFollowers);
     */
    var pipeP = function pipeP() {
        if (arguments.length === 0) {
            throw new Error('pipeP requires at least one argument');
        }
        return _arity(arguments[0].length, reduce(_pipeP, arguments[0], tail(arguments)));
    };

    /**
     * Multiplies together all the elements of a list.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Math
     * @sig [Number] -> Number
     * @param {Array} list An array of numbers
     * @return {Number} The product of all the numbers in the list.
     * @see R.reduce
     * @example
     *
     *      R.product([2,4,6,8,100,1]); //=> 38400
     */
    var product = reduce(multiply, 1);

    /**
     * Transforms a [Traversable](https://github.com/fantasyland/fantasy-land#traversable)
     * of [Applicative](https://github.com/fantasyland/fantasy-land#applicative) into an
     * Applicative of Traversable.
     *
     * Dispatches to the `sequence` method of the second argument, if present.
     *
     * @func
     * @memberOf R
     * @since 0.19.1
     * @since 0.19.0
     * @category List
     * @sig (Applicative f, Traversable t) => (a -> f a) -> t (f a) -> f (t a)
     * @param {Function} of
     * @param {*} traversable
     * @return {*}
     * @see R.traverse
     * @example
     *
     *      R.sequence(Maybe.of, [Just(1), Just(2), Just(3)]);   //=> Just([1, 2, 3])
     *      R.sequence(Maybe.of, [Just(1), Just(2), Nothing()]); //=> Nothing()
     *
     *      R.sequence(R.of, Just([1, 2, 3])); //=> [Just(1), Just(2), Just(3)]
     *      R.sequence(R.of, Nothing());       //=> [Nothing()]
     */
    var sequence = _curry2(function sequence(of, traversable) {
        return typeof traversable.sequence === 'function' ? traversable.sequence(of) : reduceRight(function (acc, x) {
            return ap(map(prepend, x), acc);
        }, of([]), traversable);
    });

    /**
     * Maps an [Applicative](https://github.com/fantasyland/fantasy-land#applicative)-returning
     * function over a [Traversable](https://github.com/fantasyland/fantasy-land#traversable),
     * then uses [`sequence`](#sequence) to transform the resulting Traversable of Applicative
     * into an Applicative of Traversable.
     *
     * Dispatches to the `sequence` method of the third argument, if present.
     *
     * @func
     * @memberOf R
     * @since 0.19.1
     * @since 0.19.0
     * @category List
     * @sig (Applicative f, Traversable t) => (a -> f a) -> (a -> f b) -> t a -> f (t b)
     * @param {Function} of
     * @param {Function} f
     * @param {*} traversable
     * @return {*}
     * @see R.sequence
     * @example
     *
     *      R.traverse(Maybe.of, R.negate, [Just(1), Just(2), Just(3)]);   //=> Just([-1, -2, -3])
     *      R.traverse(Maybe.of, R.negate, [Just(1), Just(2), Nothing()]); //=> Nothing()
     *
     *      R.traverse(R.of, R.negate, Just([1, 2, 3])); //=> [Just(-1), Just(-2), Just(-3)]
     *      R.traverse(R.of, R.negate, Nothing());       //=> [Nothing()]
     */
    var traverse = _curry3(function traverse(of, f, traversable) {
        return sequence(of, map(f, traversable));
    });

    /**
     * Shorthand for `R.chain(R.identity)`, which removes one level of nesting from
     * any [Chain](https://github.com/fantasyland/fantasy-land#chain).
     *
     * @func
     * @memberOf R
     * @since v0.3.0
     * @category List
     * @sig Chain c => c (c a) -> c a
     * @param {*} list
     * @return {*}
     * @see R.flatten, R.chain
     * @example
     *
     *      R.unnest([1, [2], [[3]]]); //=> [1, 2, [3]]
     *      R.unnest([[1, 2], [3, 4], [5, 6]]); //=> [1, 2, 3, 4, 5, 6]
     */
    var unnest = chain(_identity);

    var _contains = function _contains(a, list) {
        return _indexOf(list, a, 0) >= 0;
    };

    var _stepCat = function () {
        var _stepCatArray = {
            '@@transducer/init': Array,
            '@@transducer/step': function (xs, x) {
                return _concat(xs, [x]);
            },
            '@@transducer/result': _identity
        };
        var _stepCatString = {
            '@@transducer/init': String,
            '@@transducer/step': function (a, b) {
                return a + b;
            },
            '@@transducer/result': _identity
        };
        var _stepCatObject = {
            '@@transducer/init': Object,
            '@@transducer/step': function (result, input) {
                return merge(result, isArrayLike(input) ? objOf(input[0], input[1]) : input);
            },
            '@@transducer/result': _identity
        };
        return function _stepCat(obj) {
            if (_isTransformer(obj)) {
                return obj;
            }
            if (isArrayLike(obj)) {
                return _stepCatArray;
            }
            if (typeof obj === 'string') {
                return _stepCatString;
            }
            if (typeof obj === 'object') {
                return _stepCatObject;
            }
            throw new Error('Cannot create transformer for ' + obj);
        };
    }();

    //  mapPairs :: (Object, [String]) -> [String]
    var _toString = function _toString(x, seen) {
        var recur = function recur(y) {
            var xs = seen.concat([x]);
            return _contains(y, xs) ? '<Circular>' : _toString(y, xs);
        };
        //  mapPairs :: (Object, [String]) -> [String]
        var mapPairs = function (obj, keys) {
            return _map(function (k) {
                return _quote(k) + ': ' + recur(obj[k]);
            }, keys.slice().sort());
        };
        switch (Object.prototype.toString.call(x)) {
        case '[object Arguments]':
            return '(function() { return arguments; }(' + _map(recur, x).join(', ') + '))';
        case '[object Array]':
            return '[' + _map(recur, x).concat(mapPairs(x, reject(function (k) {
                return /^\d+$/.test(k);
            }, keys(x)))).join(', ') + ']';
        case '[object Boolean]':
            return typeof x === 'object' ? 'new Boolean(' + recur(x.valueOf()) + ')' : x.toString();
        case '[object Date]':
            return 'new Date(' + (isNaN(x.valueOf()) ? recur(NaN) : _quote(_toISOString(x))) + ')';
        case '[object Null]':
            return 'null';
        case '[object Number]':
            return typeof x === 'object' ? 'new Number(' + recur(x.valueOf()) + ')' : 1 / x === -Infinity ? '-0' : x.toString(10);
        case '[object String]':
            return typeof x === 'object' ? 'new String(' + recur(x.valueOf()) + ')' : _quote(x);
        case '[object Undefined]':
            return 'undefined';
        default:
            if (typeof x.toString === 'function') {
                var repr = x.toString();
                if (repr !== '[object Object]') {
                    return repr;
                }
            }
            return '{' + mapPairs(x, keys(x)).join(', ') + '}';
        }
    };

    /**
     * Turns a list of Functors into a Functor of a list.
     *
     * @func
     * @memberOf R
     * @since v0.8.0
     * @category List
     * @sig Functor f => (x -> f x) -> [f a] -> f [a]
     * @param {Function} of A function that returns the data type to return
     * @param {Array} list An array of functors of the same type
     * @return {*}
     * @see R.sequence
     * @deprecated since v0.19.0
     * @example
     *
     *      R.commute(R.of, [[1], [2, 3]]);   //=> [[1, 2], [1, 3]]
     *      R.commute(R.of, [[1, 2], [3]]);   //=> [[1, 3], [2, 3]]
     *      R.commute(R.of, [[1], [2], [3]]); //=> [[1, 2, 3]]
     *      R.commute(Maybe.of, [Just(1), Just(2), Just(3)]);   //=> Just([1, 2, 3])
     *      R.commute(Maybe.of, [Just(1), Just(2), Nothing()]); //=> Nothing()
     */
    var commute = commuteMap(identity);

    /**
     * Performs right-to-left function composition. The rightmost function may have
     * any arity; the remaining functions must be unary.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Function
     * @sig ((y -> z), (x -> y), ..., (o -> p), ((a, b, ..., n) -> o)) -> ((a, b, ..., n) -> z)
     * @param {...Function} functions
     * @return {Function}
     * @see R.pipe
     * @example
     *
     *      var f = R.compose(R.inc, R.negate, Math.pow);
     *
     *      f(3, 4); // -(3^4) + 1
     */
    var compose = function compose() {
        if (arguments.length === 0) {
            throw new Error('compose requires at least one argument');
        }
        return pipe.apply(this, reverse(arguments));
    };

    /**
     * Returns the right-to-left Kleisli composition of the provided functions,
     * each of which must return a value of a type supported by [`chain`](#chain).
     *
     * `R.composeK(h, g, f)` is equivalent to `R.compose(R.chain(h), R.chain(g), R.chain(f))`.
     *
     * @func
     * @memberOf R
     * @since v0.16.0
     * @category Function
     * @sig Chain m => ((y -> m z), (x -> m y), ..., (a -> m b)) -> (m a -> m z)
     * @param {...Function}
     * @return {Function}
     * @see R.pipeK
     * @example
     *
     *      //  parseJson :: String -> Maybe *
     *      //  get :: String -> Object -> Maybe *
     *
     *      //  getStateCode :: Maybe String -> Maybe String
     *      var getStateCode = R.composeK(
     *        R.compose(Maybe.of, R.toUpper),
     *        get('state'),
     *        get('address'),
     *        get('user'),
     *        parseJson
     *      );
     *
     *      getStateCode(Maybe.of('{"user":{"address":{"state":"ny"}}}'));
     *      //=> Just('NY')
     *      getStateCode(Maybe.of('[Invalid JSON]'));
     *      //=> Nothing()
     */
    var composeK = function composeK() {
        return compose.apply(this, prepend(identity, map(chain, arguments)));
    };

    /**
     * Performs right-to-left composition of one or more Promise-returning
     * functions. The rightmost function may have any arity; the remaining
     * functions must be unary.
     *
     * @func
     * @memberOf R
     * @since v0.10.0
     * @category Function
     * @sig ((y -> Promise z), (x -> Promise y), ..., (a -> Promise b)) -> (a -> Promise z)
     * @param {...Function} functions
     * @return {Function}
     * @see R.pipeP
     * @example
     *
     *      //  followersForUser :: String -> Promise [User]
     *      var followersForUser = R.composeP(db.getFollowers, db.getUserById);
     */
    var composeP = function composeP() {
        if (arguments.length === 0) {
            throw new Error('composeP requires at least one argument');
        }
        return pipeP.apply(this, reverse(arguments));
    };

    /**
     * Wraps a constructor function inside a curried function that can be called
     * with the same arguments and returns the same type.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Function
     * @sig (* -> {*}) -> (* -> {*})
     * @param {Function} Fn The constructor function to wrap.
     * @return {Function} A wrapped, curried constructor function.
     * @example
     *
     *      // Constructor function
     *      var Widget = config => {
     *        // ...
     *      };
     *      Widget.prototype = {
     *        // ...
     *      };
     *      var allConfigs = [
     *        // ...
     *      ];
     *      R.map(R.construct(Widget), allConfigs); // a list of Widgets
     */
    var construct = _curry1(function construct(Fn) {
        return constructN(Fn.length, Fn);
    });

    /**
     * Returns `true` if the specified value is equal, in `R.equals` terms, to at
     * least one element of the given list; `false` otherwise.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig a -> [a] -> Boolean
     * @param {Object} a The item to compare against.
     * @param {Array} list The array to consider.
     * @return {Boolean} `true` if the item is in the list, `false` otherwise.
     * @see R.any
     * @example
     *
     *      R.contains(3, [1, 2, 3]); //=> true
     *      R.contains(4, [1, 2, 3]); //=> false
     *      R.contains([42], [[42]]); //=> true
     */
    var contains = _curry2(_contains);

    /**
     * Finds the set (i.e. no duplicates) of all elements in the first list not
     * contained in the second list.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Relation
     * @sig [*] -> [*] -> [*]
     * @param {Array} list1 The first list.
     * @param {Array} list2 The second list.
     * @return {Array} The elements in `list1` that are not in `list2`.
     * @see R.differenceWith
     * @example
     *
     *      R.difference([1,2,3,4], [7,6,5,4,3]); //=> [1,2]
     *      R.difference([7,6,5,4,3], [1,2,3,4]); //=> [7,6,5]
     */
    var difference = _curry2(function difference(first, second) {
        var out = [];
        var idx = 0;
        var firstLen = first.length;
        while (idx < firstLen) {
            if (!_contains(first[idx], second) && !_contains(first[idx], out)) {
                out[out.length] = first[idx];
            }
            idx += 1;
        }
        return out;
    });

    /**
     * Returns a new list without any consecutively repeating elements. `R.equals`
     * is used to determine equality.
     *
     * Dispatches to the `dropRepeats` method of the first argument, if present.
     *
     * Acts as a transducer if a transformer is given in list position.
     *
     * @func
     * @memberOf R
     * @since v0.14.0
     * @category List
     * @sig [a] -> [a]
     * @param {Array} list The array to consider.
     * @return {Array} `list` without repeating elements.
     * @see R.transduce
     * @example
     *
     *     R.dropRepeats([1, 1, 1, 2, 3, 4, 4, 2, 2]); //=> [1, 2, 3, 4, 2]
     */
    var dropRepeats = _curry1(_dispatchable('dropRepeats', _xdropRepeatsWith(equals), dropRepeatsWith(equals)));

    /**
     * Transforms the items of the list with the transducer and appends the
     * transformed items to the accumulator using an appropriate iterator function
     * based on the accumulator type.
     *
     * The accumulator can be an array, string, object or a transformer. Iterated
     * items will be appended to arrays and concatenated to strings. Objects will
     * be merged directly or 2-item arrays will be merged as key, value pairs.
     *
     * The accumulator can also be a transformer object that provides a 2-arity
     * reducing iterator function, step, 0-arity initial value function, init, and
     * 1-arity result extraction function result. The step function is used as the
     * iterator function in reduce. The result function is used to convert the
     * final accumulator into the return type and in most cases is R.identity. The
     * init function is used to provide the initial accumulator.
     *
     * The iteration is performed with R.reduce after initializing the transducer.
     *
     * @func
     * @memberOf R
     * @since v0.12.0
     * @category List
     * @sig a -> (b -> b) -> [c] -> a
     * @param {*} acc The initial accumulator value.
     * @param {Function} xf The transducer function. Receives a transformer and returns a transformer.
     * @param {Array} list The list to iterate over.
     * @return {*} The final, accumulated value.
     * @example
     *
     *      var numbers = [1, 2, 3, 4];
     *      var transducer = R.compose(R.map(R.add(1)), R.take(2));
     *
     *      R.into([], transducer, numbers); //=> [2, 3]
     *
     *      var intoArray = R.into([]);
     *      intoArray(transducer, numbers); //=> [2, 3]
     */
    var into = _curry3(function into(acc, xf, list) {
        return _isTransformer(acc) ? _reduce(xf(acc), acc['@@transducer/init'](), list) : _reduce(xf(_stepCat(acc)), acc, list);
    });

    /**
     * "lifts" a function of arity > 1 so that it may "map over" an Array or other
     * object that satisfies the [FantasyLand Apply spec](https://github.com/fantasyland/fantasy-land#apply).
     *
     * @func
     * @memberOf R
     * @since v0.7.0
     * @category Function
     * @sig (*... -> *) -> ([*]... -> [*])
     * @param {Function} fn The function to lift into higher context
     * @return {Function} The lifted function.
     * @see R.liftN
     * @example
     *
     *      var madd3 = R.lift(R.curry((a, b, c) => a + b + c));
     *
     *      madd3([1,2,3], [1,2,3], [1]); //=> [3, 4, 5, 4, 5, 6, 5, 6, 7]
     *
     *      var madd5 = R.lift(R.curry((a, b, c, d, e) => a + b + c + d + e));
     *
     *      madd5([1,2], [3], [4, 5], [6], [7, 8]); //=> [21, 22, 22, 23, 22, 23, 23, 24]
     */
    var lift = _curry1(function lift(fn) {
        return liftN(fn.length, fn);
    });

    /**
     * Returns a partial copy of an object omitting the keys specified.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Object
     * @sig [String] -> {String: *} -> {String: *}
     * @param {Array} names an array of String property names to omit from the new object
     * @param {Object} obj The object to copy from
     * @return {Object} A new object with properties from `names` not on it.
     * @see R.pick
     * @example
     *
     *      R.omit(['a', 'd'], {a: 1, b: 2, c: 3, d: 4}); //=> {b: 2, c: 3}
     */
    var omit = _curry2(function omit(names, obj) {
        var result = {};
        for (var prop in obj) {
            if (!_contains(prop, names)) {
                result[prop] = obj[prop];
            }
        }
        return result;
    });

    /**
     * Returns the left-to-right Kleisli composition of the provided functions,
     * each of which must return a value of a type supported by [`chain`](#chain).
     *
     * `R.pipeK(f, g, h)` is equivalent to `R.pipe(R.chain(f), R.chain(g), R.chain(h))`.
     *
     * @func
     * @memberOf R
     * @since v0.16.0
     * @category Function
     * @sig Chain m => ((a -> m b), (b -> m c), ..., (y -> m z)) -> (m a -> m z)
     * @param {...Function}
     * @return {Function}
     * @see R.composeK
     * @example
     *
     *      //  parseJson :: String -> Maybe *
     *      //  get :: String -> Object -> Maybe *
     *
     *      //  getStateCode :: Maybe String -> Maybe String
     *      var getStateCode = R.pipeK(
     *        parseJson,
     *        get('user'),
     *        get('address'),
     *        get('state'),
     *        R.compose(Maybe.of, R.toUpper)
     *      );
     *
     *      getStateCode(Maybe.of('{"user":{"address":{"state":"ny"}}}'));
     *      //=> Just('NY')
     *      getStateCode(Maybe.of('[Invalid JSON]'));
     *      //=> Nothing()
     */
    var pipeK = function pipeK() {
        return composeK.apply(this, reverse(arguments));
    };

    /**
     * Returns the string representation of the given value. `eval`'ing the output
     * should result in a value equivalent to the input value. Many of the built-in
     * `toString` methods do not satisfy this requirement.
     *
     * If the given value is an `[object Object]` with a `toString` method other
     * than `Object.prototype.toString`, this method is invoked with no arguments
     * to produce the return value. This means user-defined constructor functions
     * can provide a suitable `toString` method. For example:
     *
     *     function Point(x, y) {
     *       this.x = x;
     *       this.y = y;
     *     }
     *
     *     Point.prototype.toString = function() {
     *       return 'new Point(' + this.x + ', ' + this.y + ')';
     *     };
     *
     *     R.toString(new Point(1, 2)); //=> 'new Point(1, 2)'
     *
     * @func
     * @memberOf R
     * @since v0.14.0
     * @category String
     * @sig * -> String
     * @param {*} val
     * @return {String}
     * @example
     *
     *      R.toString(42); //=> '42'
     *      R.toString('abc'); //=> '"abc"'
     *      R.toString([1, 2, 3]); //=> '[1, 2, 3]'
     *      R.toString({foo: 1, bar: 2, baz: 3}); //=> '{"bar": 2, "baz": 3, "foo": 1}'
     *      R.toString(new Date('2001-02-03T04:05:06Z')); //=> 'new Date("2001-02-03T04:05:06.000Z")'
     */
    var toString = _curry1(function toString(val) {
        return _toString(val, []);
    });

    /**
     * Returns a new list containing only one copy of each element in the original
     * list, based upon the value returned by applying the supplied function to
     * each list element. Prefers the first item if the supplied function produces
     * the same value on two items. `R.equals` is used for comparison.
     *
     * @func
     * @memberOf R
     * @since v0.16.0
     * @category List
     * @sig (a -> b) -> [a] -> [a]
     * @param {Function} fn A function used to produce a value to use during comparisons.
     * @param {Array} list The array to consider.
     * @return {Array} The list of unique items.
     * @example
     *
     *      R.uniqBy(Math.abs, [-1, -5, 2, 10, 1, 2]); //=> [-1, -5, 2, 10]
     */
    /* globals Set */
    // distinguishing between +0 and -0 is not supported by Set
    /* falls through */
    // these types can all utilise Set
    // prevent scan for null by tracking as a boolean
    /* falls through */
    // scan through all previously applied items
    var uniqBy = _curry2(/* globals Set */
    typeof Set === 'undefined' ? function uniqBy(fn, list) {
        var idx = 0;
        var applied = [];
        var result = [];
        var appliedItem, item;
        while (idx < list.length) {
            item = list[idx];
            appliedItem = fn(item);
            if (!_contains(appliedItem, applied)) {
                result.push(item);
                applied.push(appliedItem);
            }
            idx += 1;
        }
        return result;
    } : function uniqBySet(fn, list) {
        var set = new Set();
        var applied = [];
        var prevSetSize = 0;
        var result = [];
        var nullExists = false;
        var negZeroExists = false;
        var idx = 0;
        var appliedItem, item, newSetSize;
        while (idx < list.length) {
            item = list[idx];
            appliedItem = fn(item);
            switch (typeof appliedItem) {
            case 'number':
                // distinguishing between +0 and -0 is not supported by Set
                if (appliedItem === 0 && !negZeroExists && 1 / appliedItem === -Infinity) {
                    negZeroExists = true;
                    result.push(item);
                    break;
                }
            /* falls through */
            case 'string':
            case 'boolean':
            case 'function':
            case 'undefined':
                // these types can all utilise Set
                set.add(appliedItem);
                newSetSize = set.size;
                if (newSetSize > prevSetSize) {
                    result.push(item);
                    prevSetSize = newSetSize;
                }
                break;
            case 'object':
                if (appliedItem === null) {
                    if (!nullExists) {
                        // prevent scan for null by tracking as a boolean
                        nullExists = true;
                        result.push(null);
                    }
                    break;
                }
            /* falls through */
            default:
                // scan through all previously applied items
                if (!_contains(appliedItem, applied)) {
                    applied.push(appliedItem);
                    result.push(item);
                }
            }
            idx += 1;
        }
        return result;
    });

    /**
     * Returns a new list without values in the first argument.
     * `R.equals` is used to determine equality.
     *
     * Acts as a transducer if a transformer is given in list position.
     *
     * @func
     * @memberOf R
     * @since 0.19.1
     * @since 0.19.0
     * @category List
     * @sig [a] -> [a] -> [a]
     * @param {Array} list1 The values to be removed from `list2`.
     * @param {Array} list2 The array to remove values from.
     * @return {Array} The new array without values in `list1`.
     * @see R.transduce
     * @example
     *
     *      R.without([1, 2], [1, 2, 1, 3, 4]); //=> [3, 4]
     */
    var without = _curry2(function (xs, list) {
        return reject(flip(_contains)(xs), list);
    });

    /**
     * Takes a function `f` and returns a function `g` such that:
     *
     *   - applying `g` to zero or more arguments will give __true__ if applying
     *     the same arguments to `f` gives a logical __false__ value; and
     *
     *   - applying `g` to zero or more arguments will give __false__ if applying
     *     the same arguments to `f` gives a logical __true__ value.
     *
     * `R.complement` will work on all other functors as well.
     *
     * @func
     * @memberOf R
     * @since v0.12.0
     * @category Logic
     * @sig (*... -> *) -> (*... -> Boolean)
     * @param {Function} f
     * @return {Function}
     * @see R.not
     * @example
     *
     *      var isEven = n => n % 2 === 0;
     *      var isOdd = R.complement(isEven);
     *      isOdd(21); //=> true
     *      isOdd(42); //=> false
     */
    var complement = lift(not);

    /**
     * Turns a named method with a specified arity into a function that can be
     * called directly supplied with arguments and a target object.
     *
     * The returned function is curried and accepts `arity + 1` parameters where
     * the final parameter is the target object.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Function
     * @sig Number -> String -> (a -> b -> ... -> n -> Object -> *)
     * @param {Number} arity Number of arguments the returned function should take
     *        before the target object.
     * @param {String} method Name of the method to call.
     * @return {Function} A new curried function.
     * @example
     *
     *      var sliceFrom = R.invoker(1, 'slice');
     *      sliceFrom(6, 'abcdefghijklm'); //=> 'ghijklm'
     *      var sliceFrom6 = R.invoker(2, 'slice')(6);
     *      sliceFrom6(8, 'abcdefghijklm'); //=> 'gh'
     */
    var invoker = _curry2(function invoker(arity, method) {
        return curryN(arity + 1, function () {
            var target = arguments[arity];
            if (target != null && is(Function, target[method])) {
                return target[method].apply(target, _slice(arguments, 0, arity));
            }
            throw new TypeError(toString(target) + ' does not have a method named "' + method + '"');
        });
    });

    /**
     * Returns a string made by inserting the `separator` between each element and
     * concatenating all the elements into a single string.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig String -> [a] -> String
     * @param {Number|String} separator The string used to separate the elements.
     * @param {Array} xs The elements to join into a string.
     * @return {String} str The string made by concatenating `xs` with `separator`.
     * @see R.split
     * @example
     *
     *      var spacer = R.join(' ');
     *      spacer(['a', 2, 3.4]);   //=> 'a 2 3.4'
     *      R.join('|', [1, 2, 3]);    //=> '1|2|3'
     */
    var join = invoker(1, 'join');

    /**
     * Creates a new function that, when invoked, caches the result of calling `fn`
     * for a given argument set and returns the result. Subsequent calls to the
     * memoized `fn` with the same argument set will not result in an additional
     * call to `fn`; instead, the cached result for that set of arguments will be
     * returned.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Function
     * @sig (*... -> a) -> (*... -> a)
     * @param {Function} fn The function to memoize.
     * @return {Function} Memoized version of `fn`.
     * @example
     *
     *      var count = 0;
     *      var factorial = R.memoize(n => {
     *        count += 1;
     *        return R.product(R.range(1, n + 1));
     *      });
     *      factorial(5); //=> 120
     *      factorial(5); //=> 120
     *      factorial(5); //=> 120
     *      count; //=> 1
     */
    var memoize = _curry1(function memoize(fn) {
        var cache = {};
        return _arity(fn.length, function () {
            var key = toString(arguments);
            if (!_has(key, cache)) {
                cache[key] = fn.apply(this, arguments);
            }
            return cache[key];
        });
    });

    /**
     * Splits a string into an array of strings based on the given
     * separator.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category String
     * @sig (String | RegExp) -> String -> [String]
     * @param {String|RegExp} sep The pattern.
     * @param {String} str The string to separate into an array.
     * @return {Array} The array of strings from `str` separated by `str`.
     * @see R.join
     * @example
     *
     *      var pathComponents = R.split('/');
     *      R.tail(pathComponents('/usr/local/bin/node')); //=> ['usr', 'local', 'bin', 'node']
     *
     *      R.split('.', 'a.b.c.xyz.d'); //=> ['a', 'b', 'c', 'xyz', 'd']
     */
    var split = invoker(1, 'split');

    /**
     * Determines whether a given string matches a given regular expression.
     *
     * @func
     * @memberOf R
     * @since v0.12.0
     * @category String
     * @sig RegExp -> String -> Boolean
     * @param {RegExp} pattern
     * @param {String} str
     * @return {Boolean}
     * @see R.match
     * @example
     *
     *      R.test(/^x/, 'xyz'); //=> true
     *      R.test(/^y/, 'xyz'); //=> false
     */
    var test = _curry2(function test(pattern, str) {
        if (!_isRegExp(pattern)) {
            throw new TypeError('\u2018test\u2019 requires a value of type RegExp as its first argument; received ' + toString(pattern));
        }
        return _cloneRegExp(pattern).test(str);
    });

    /**
     * The lower case version of a string.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category String
     * @sig String -> String
     * @param {String} str The string to lower case.
     * @return {String} The lower case version of `str`.
     * @see R.toUpper
     * @example
     *
     *      R.toLower('XYZ'); //=> 'xyz'
     */
    var toLower = invoker(0, 'toLowerCase');

    /**
     * The upper case version of a string.
     *
     * @func
     * @memberOf R
     * @since v0.9.0
     * @category String
     * @sig String -> String
     * @param {String} str The string to upper case.
     * @return {String} The upper case version of `str`.
     * @see R.toLower
     * @example
     *
     *      R.toUpper('abc'); //=> 'ABC'
     */
    var toUpper = invoker(0, 'toUpperCase');

    /**
     * Returns a new list containing only one copy of each element in the original
     * list. `R.equals` is used to determine equality.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig [a] -> [a]
     * @param {Array} list The array to consider.
     * @return {Array} The list of unique items.
     * @example
     *
     *      R.uniq([1, 1, 2, 1]); //=> [1, 2]
     *      R.uniq([1, '1']);     //=> [1, '1']
     *      R.uniq([[42], [42]]); //=> [[42]]
     */
    var uniq = uniqBy(identity);

    /**
     * Returns the result of concatenating the given lists or strings.
     *
     * Dispatches to the `concat` method of the second argument, if present.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category List
     * @sig [a] -> [a] -> [a]
     * @sig String -> String -> String
     * @param {Array|String} a
     * @param {Array|String} b
     * @return {Array|String}
     *
     * @example
     *
     *      R.concat([], []); //=> []
     *      R.concat([4, 5, 6], [1, 2, 3]); //=> [4, 5, 6, 1, 2, 3]
     *      R.concat('ABC', 'DEF'); // 'ABCDEF'
     */
    var concat = flip(invoker(1, 'concat'));

    /**
     * Combines two lists into a set (i.e. no duplicates) composed of those
     * elements common to both lists.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Relation
     * @sig [*] -> [*] -> [*]
     * @param {Array} list1 The first list.
     * @param {Array} list2 The second list.
     * @return {Array} The list of elements found in both `list1` and `list2`.
     * @see R.intersectionWith
     * @example
     *
     *      R.intersection([1,2,3,4], [7,6,5,4,3]); //=> [4, 3]
     */
    var intersection = _curry2(function intersection(list1, list2) {
        return uniq(_filter(flip(_contains)(list1), list2));
    });

    /**
     * Finds the set (i.e. no duplicates) of all elements contained in the first or
     * second list, but not both.
     *
     * @func
     * @memberOf R
     * @since 0.19.1
     * @since 0.19.0
     * @category Relation
     * @sig [*] -> [*] -> [*]
     * @param {Array} list1 The first list.
     * @param {Array} list2 The second list.
     * @return {Array} The elements in `list1` or `list2`, but not both.
     * @see R.symmetricDifferenceWith
     * @example
     *
     *      R.symmetricDifference([1,2,3,4], [7,6,5,4,3]); //=> [1,2,7,6,5]
     *      R.symmetricDifference([7,6,5,4,3], [1,2,3,4]); //=> [7,6,5,1,2]
     */
    var symmetricDifference = _curry2(function symmetricDifference(list1, list2) {
        return concat(difference(list1, list2), difference(list2, list1));
    });

    /**
     * Finds the set (i.e. no duplicates) of all elements contained in the first or
     * second list, but not both. Duplication is determined according to the value
     * returned by applying the supplied predicate to two list elements.
     *
     * @func
     * @memberOf R
     * @since 0.19.1
     * @since 0.19.0
     * @category Relation
     * @sig (a -> a -> Boolean) -> [a] -> [a] -> [a]
     * @param {Function} pred A predicate used to test whether two items are equal.
     * @param {Array} list1 The first list.
     * @param {Array} list2 The second list.
     * @return {Array} The elements in `list1` or `list2`, but not both.
     * @see R.symmetricDifference
     * @example
     *
     *      var eqA = R.eqBy(R.prop('a'));
     *      var l1 = [{a: 1}, {a: 2}, {a: 3}, {a: 4}];
     *      var l2 = [{a: 3}, {a: 4}, {a: 5}, {a: 6}];
     *      R.symmetricDifferenceWith(eqA, l1, l2); //=> [{a: 1}, {a: 2}, {a: 5}, {a: 6}]
     */
    var symmetricDifferenceWith = _curry3(function symmetricDifferenceWith(pred, list1, list2) {
        return concat(differenceWith(pred, list1, list2), differenceWith(pred, list2, list1));
    });

    /**
     * Combines two lists into a set (i.e. no duplicates) composed of the elements
     * of each list.
     *
     * @func
     * @memberOf R
     * @since v0.1.0
     * @category Relation
     * @sig [*] -> [*] -> [*]
     * @param {Array} as The first list.
     * @param {Array} bs The second list.
     * @return {Array} The first and second lists concatenated, with
     *         duplicates removed.
     * @example
     *
     *      R.union([1, 2, 3], [2, 3, 4]); //=> [1, 2, 3, 4]
     */
    var union = _curry2(compose(uniq, _concat));

    var R = {
        F: F,
        T: T,
        __: __,
        add: add,
        addIndex: addIndex,
        adjust: adjust,
        all: all,
        allPass: allPass,
        allUniq: allUniq,
        always: always,
        and: and,
        any: any,
        anyPass: anyPass,
        ap: ap,
        aperture: aperture,
        append: append,
        apply: apply,
        assoc: assoc,
        assocPath: assocPath,
        binary: binary,
        bind: bind,
        both: both,
        call: call,
        chain: chain,
        clone: clone,
        commute: commute,
        commuteMap: commuteMap,
        comparator: comparator,
        complement: complement,
        compose: compose,
        composeK: composeK,
        composeP: composeP,
        concat: concat,
        cond: cond,
        construct: construct,
        constructN: constructN,
        contains: contains,
        converge: converge,
        countBy: countBy,
        curry: curry,
        curryN: curryN,
        dec: dec,
        defaultTo: defaultTo,
        difference: difference,
        differenceWith: differenceWith,
        dissoc: dissoc,
        dissocPath: dissocPath,
        divide: divide,
        drop: drop,
        dropLast: dropLast,
        dropLastWhile: dropLastWhile,
        dropRepeats: dropRepeats,
        dropRepeatsWith: dropRepeatsWith,
        dropWhile: dropWhile,
        either: either,
        empty: empty,
        eqBy: eqBy,
        eqProps: eqProps,
        equals: equals,
        evolve: evolve,
        filter: filter,
        find: find,
        findIndex: findIndex,
        findLast: findLast,
        findLastIndex: findLastIndex,
        flatten: flatten,
        flip: flip,
        forEach: forEach,
        fromPairs: fromPairs,
        groupBy: groupBy,
        gt: gt,
        gte: gte,
        has: has,
        hasIn: hasIn,
        head: head,
        identical: identical,
        identity: identity,
        ifElse: ifElse,
        inc: inc,
        indexBy: indexBy,
        indexOf: indexOf,
        init: init,
        insert: insert,
        insertAll: insertAll,
        intersection: intersection,
        intersectionWith: intersectionWith,
        intersperse: intersperse,
        into: into,
        invert: invert,
        invertObj: invertObj,
        invoker: invoker,
        is: is,
        isArrayLike: isArrayLike,
        isEmpty: isEmpty,
        isNil: isNil,
        join: join,
        juxt: juxt,
        keys: keys,
        keysIn: keysIn,
        last: last,
        lastIndexOf: lastIndexOf,
        length: length,
        lens: lens,
        lensIndex: lensIndex,
        lensPath: lensPath,
        lensProp: lensProp,
        lift: lift,
        liftN: liftN,
        lt: lt,
        lte: lte,
        map: map,
        mapAccum: mapAccum,
        mapAccumRight: mapAccumRight,
        mapObjIndexed: mapObjIndexed,
        match: match,
        mathMod: mathMod,
        max: max,
        maxBy: maxBy,
        mean: mean,
        median: median,
        memoize: memoize,
        merge: merge,
        mergeAll: mergeAll,
        mergeWith: mergeWith,
        mergeWithKey: mergeWithKey,
        min: min,
        minBy: minBy,
        modulo: modulo,
        multiply: multiply,
        nAry: nAry,
        negate: negate,
        none: none,
        not: not,
        nth: nth,
        nthArg: nthArg,
        objOf: objOf,
        of: of,
        omit: omit,
        once: once,
        or: or,
        over: over,
        pair: pair,
        partial: partial,
        partialRight: partialRight,
        partition: partition,
        path: path,
        pathEq: pathEq,
        pathOr: pathOr,
        pathSatisfies: pathSatisfies,
        pick: pick,
        pickAll: pickAll,
        pickBy: pickBy,
        pipe: pipe,
        pipeK: pipeK,
        pipeP: pipeP,
        pluck: pluck,
        prepend: prepend,
        product: product,
        project: project,
        prop: prop,
        propEq: propEq,
        propIs: propIs,
        propOr: propOr,
        propSatisfies: propSatisfies,
        props: props,
        range: range,
        reduce: reduce,
        reduceRight: reduceRight,
        reduced: reduced,
        reject: reject,
        remove: remove,
        repeat: repeat,
        replace: replace,
        reverse: reverse,
        scan: scan,
        sequence: sequence,
        set: set,
        slice: slice,
        sort: sort,
        sortBy: sortBy,
        split: split,
        splitAt: splitAt,
        splitEvery: splitEvery,
        splitWhen: splitWhen,
        subtract: subtract,
        sum: sum,
        symmetricDifference: symmetricDifference,
        symmetricDifferenceWith: symmetricDifferenceWith,
        tail: tail,
        take: take,
        takeLast: takeLast,
        takeLastWhile: takeLastWhile,
        takeWhile: takeWhile,
        tap: tap,
        test: test,
        times: times,
        toLower: toLower,
        toPairs: toPairs,
        toPairsIn: toPairsIn,
        toString: toString,
        toUpper: toUpper,
        transduce: transduce,
        transpose: transpose,
        traverse: traverse,
        trim: trim,
        type: type,
        unapply: unapply,
        unary: unary,
        uncurryN: uncurryN,
        unfold: unfold,
        union: union,
        unionWith: unionWith,
        uniq: uniq,
        uniqBy: uniqBy,
        uniqWith: uniqWith,
        unless: unless,
        unnest: unnest,
        update: update,
        useWith: useWith,
        values: values,
        valuesIn: valuesIn,
        view: view,
        when: when,
        where: where,
        whereEq: whereEq,
        without: without,
        wrap: wrap,
        xprod: xprod,
        zip: zip,
        zipObj: zipObj,
        zipWith: zipWith
    };
  /* eslint-env amd */

  /* TEST_ENTRY_POINT */

  if (typeof exports === 'object') {
    module.exports = R;
  } else if (typeof define === 'function' && define.amd) {
    define(function() { return R; });
  } else {
    this.R = R;
  }

}.call(this));

},{}],99:[function(require,module,exports){
/*
 * re-map
 * https://github.com/technicolorenvy/re-map
 *
 * Copyright (c) 2013 Joseph (Jos) Smith
 * Licensed under the GNU GENERAL PUBLIC license.
 */

// @param {Number} value 
// @param {Number} istart
// @param {Number} istop
// @param {Number} ostart
// @param {Number} ostop

module.exports = function reMap(value, istart, istop, ostart, ostop) {
  return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
};
},{}],100:[function(require,module,exports){
'use strict';
module.exports = function (red, green, blue) {
	if ((typeof red !== 'number' || typeof green !== 'number' || typeof blue !== 'number') &&
		(red > 255 || green > 255 || blue > 255)) {
		throw new TypeError('Expected three numbers below 256');
	}

	return ((blue | green << 8 | red << 16) | 1 << 24).toString(16).slice(1);
};

},{}],101:[function(require,module,exports){
// A library of seedable RNGs implemented in Javascript.
//
// Usage:
//
// var seedrandom = require('seedrandom');
// var random = seedrandom(1); // or any seed.
// var x = random();       // 0 <= x < 1.  Every bit is random.
// var x = random.quick(); // 0 <= x < 1.  32 bits of randomness.

// alea, a 53-bit multiply-with-carry generator by Johannes Baagøe.
// Period: ~2^116
// Reported to pass all BigCrush tests.
var alea = require('./lib/alea');

// xor128, a pure xor-shift generator by George Marsaglia.
// Period: 2^128-1.
// Reported to fail: MatrixRank and LinearComp.
var xor128 = require('./lib/xor128');

// xorwow, George Marsaglia's 160-bit xor-shift combined plus weyl.
// Period: 2^192-2^32
// Reported to fail: CollisionOver, SimpPoker, and LinearComp.
var xorwow = require('./lib/xorwow');

// xorshift7, by François Panneton and Pierre L'ecuyer, takes
// a different approach: it adds robustness by allowing more shifts
// than Marsaglia's original three.  It is a 7-shift generator
// with 256 bits, that passes BigCrush with no systmatic failures.
// Period 2^256-1.
// No systematic BigCrush failures reported.
var xorshift7 = require('./lib/xorshift7');

// xor4096, by Richard Brent, is a 4096-bit xor-shift with a
// very long period that also adds a Weyl generator. It also passes
// BigCrush with no systematic failures.  Its long period may
// be useful if you have many generators and need to avoid
// collisions.
// Period: 2^4128-2^32.
// No systematic BigCrush failures reported.
var xor4096 = require('./lib/xor4096');

// Tyche-i, by Samuel Neves and Filipe Araujo, is a bit-shifting random
// number generator derived from ChaCha, a modern stream cipher.
// https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf
// Period: ~2^127
// No systematic BigCrush failures reported.
var tychei = require('./lib/tychei');

// The original ARC4-based prng included in this library.
// Period: ~2^1600
var sr = require('./seedrandom');

sr.alea = alea;
sr.xor128 = xor128;
sr.xorwow = xorwow;
sr.xorshift7 = xorshift7;
sr.xor4096 = xor4096;
sr.tychei = tychei;

module.exports = sr;

},{"./lib/alea":102,"./lib/tychei":103,"./lib/xor128":104,"./lib/xor4096":105,"./lib/xorshift7":106,"./lib/xorwow":107,"./seedrandom":108}],102:[function(require,module,exports){
// A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
// http://baagoe.com/en/RandomMusings/javascript/
// https://github.com/nquinlan/better-random-numbers-for-javascript-mirror
// Original work is under MIT license -

// Copyright (C) 2010 by Johannes Baagøe <baagoe@baagoe.org>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.



(function(global, module, define) {

function Alea(seed) {
  var me = this, mash = Mash();

  me.next = function() {
    var t = 2091639 * me.s0 + me.c * 2.3283064365386963e-10; // 2^-32
    me.s0 = me.s1;
    me.s1 = me.s2;
    return me.s2 = t - (me.c = t | 0);
  };

  // Apply the seeding algorithm from Baagoe.
  me.c = 1;
  me.s0 = mash(' ');
  me.s1 = mash(' ');
  me.s2 = mash(' ');
  me.s0 -= mash(seed);
  if (me.s0 < 0) { me.s0 += 1; }
  me.s1 -= mash(seed);
  if (me.s1 < 0) { me.s1 += 1; }
  me.s2 -= mash(seed);
  if (me.s2 < 0) { me.s2 += 1; }
  mash = null;
}

function copy(f, t) {
  t.c = f.c;
  t.s0 = f.s0;
  t.s1 = f.s1;
  t.s2 = f.s2;
  return t;
}

function impl(seed, opts) {
  var xg = new Alea(seed),
      state = opts && opts.state,
      prng = xg.next;
  prng.int32 = function() { return (xg.next() * 0x100000000) | 0; }
  prng.double = function() {
    return prng() + (prng() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
  };
  prng.quick = prng;
  if (state) {
    if (typeof(state) == 'object') copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

function Mash() {
  var n = 0xefc8249d;

  var mash = function(data) {
    data = data.toString();
    for (var i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      var h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 0x100000000; // 2^32
    }
    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
  };

  return mash;
}


if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.alea = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);



},{}],103:[function(require,module,exports){
// A Javascript implementaion of the "Tyche-i" prng algorithm by
// Samuel Neves and Filipe Araujo.
// See https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf

(function(global, module, define) {

function XorGen(seed) {
  var me = this, strseed = '';

  // Set up generator function.
  me.next = function() {
    var b = me.b, c = me.c, d = me.d, a = me.a;
    b = (b << 25) ^ (b >>> 7) ^ c;
    c = (c - d) | 0;
    d = (d << 24) ^ (d >>> 8) ^ a;
    a = (a - b) | 0;
    me.b = b = (b << 20) ^ (b >>> 12) ^ c;
    me.c = c = (c - d) | 0;
    me.d = (d << 16) ^ (c >>> 16) ^ a;
    return me.a = (a - b) | 0;
  };

  /* The following is non-inverted tyche, which has better internal
   * bit diffusion, but which is about 25% slower than tyche-i in JS.
  me.next = function() {
    var a = me.a, b = me.b, c = me.c, d = me.d;
    a = (me.a + me.b | 0) >>> 0;
    d = me.d ^ a; d = d << 16 ^ d >>> 16;
    c = me.c + d | 0;
    b = me.b ^ c; b = b << 12 ^ d >>> 20;
    me.a = a = a + b | 0;
    d = d ^ a; me.d = d = d << 8 ^ d >>> 24;
    me.c = c = c + d | 0;
    b = b ^ c;
    return me.b = (b << 7 ^ b >>> 25);
  }
  */

  me.a = 0;
  me.b = 0;
  me.c = 2654435769 | 0;
  me.d = 1367130551;

  if (seed === Math.floor(seed)) {
    // Integer seed.
    me.a = (seed / 0x100000000) | 0;
    me.b = seed | 0;
  } else {
    // String seed.
    strseed += seed;
  }

  // Mix in string seed, then discard an initial batch of 64 values.
  for (var k = 0; k < strseed.length + 20; k++) {
    me.b ^= strseed.charCodeAt(k) | 0;
    me.next();
  }
}

function copy(f, t) {
  t.a = f.a;
  t.b = f.b;
  t.c = f.c;
  t.d = f.d;
  return t;
};

function impl(seed, opts) {
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (typeof(state) == 'object') copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.tychei = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);



},{}],104:[function(require,module,exports){
// A Javascript implementaion of the "xor128" prng algorithm by
// George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

(function(global, module, define) {

function XorGen(seed) {
  var me = this, strseed = '';

  me.x = 0;
  me.y = 0;
  me.z = 0;
  me.w = 0;

  // Set up generator function.
  me.next = function() {
    var t = me.x ^ (me.x << 11);
    me.x = me.y;
    me.y = me.z;
    me.z = me.w;
    return me.w ^= (me.w >>> 19) ^ t ^ (t >>> 8);
  };

  if (seed === (seed | 0)) {
    // Integer seed.
    me.x = seed;
  } else {
    // String seed.
    strseed += seed;
  }

  // Mix in string seed, then discard an initial batch of 64 values.
  for (var k = 0; k < strseed.length + 64; k++) {
    me.x ^= strseed.charCodeAt(k) | 0;
    me.next();
  }
}

function copy(f, t) {
  t.x = f.x;
  t.y = f.y;
  t.z = f.z;
  t.w = f.w;
  return t;
}

function impl(seed, opts) {
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (typeof(state) == 'object') copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.xor128 = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);



},{}],105:[function(require,module,exports){
// A Javascript implementaion of Richard Brent's Xorgens xor4096 algorithm.
//
// This fast non-cryptographic random number generator is designed for
// use in Monte-Carlo algorithms. It combines a long-period xorshift
// generator with a Weyl generator, and it passes all common batteries
// of stasticial tests for randomness while consuming only a few nanoseconds
// for each prng generated.  For background on the generator, see Brent's
// paper: "Some long-period random number generators using shifts and xors."
// http://arxiv.org/pdf/1004.3115v1.pdf
//
// Usage:
//
// var xor4096 = require('xor4096');
// random = xor4096(1);                        // Seed with int32 or string.
// assert.equal(random(), 0.1520436450538547); // (0, 1) range, 53 bits.
// assert.equal(random.int32(), 1806534897);   // signed int32, 32 bits.
//
// For nonzero numeric keys, this impelementation provides a sequence
// identical to that by Brent's xorgens 3 implementaion in C.  This
// implementation also provides for initalizing the generator with
// string seeds, or for saving and restoring the state of the generator.
//
// On Chrome, this prng benchmarks about 2.1 times slower than
// Javascript's built-in Math.random().

(function(global, module, define) {

function XorGen(seed) {
  var me = this;

  // Set up generator function.
  me.next = function() {
    var w = me.w,
        X = me.X, i = me.i, t, v;
    // Update Weyl generator.
    me.w = w = (w + 0x61c88647) | 0;
    // Update xor generator.
    v = X[(i + 34) & 127];
    t = X[i = ((i + 1) & 127)];
    v ^= v << 13;
    t ^= t << 17;
    v ^= v >>> 15;
    t ^= t >>> 12;
    // Update Xor generator array state.
    v = X[i] = v ^ t;
    me.i = i;
    // Result is the combination.
    return (v + (w ^ (w >>> 16))) | 0;
  };

  function init(me, seed) {
    var t, v, i, j, w, X = [], limit = 128;
    if (seed === (seed | 0)) {
      // Numeric seeds initialize v, which is used to generates X.
      v = seed;
      seed = null;
    } else {
      // String seeds are mixed into v and X one character at a time.
      seed = seed + '\0';
      v = 0;
      limit = Math.max(limit, seed.length);
    }
    // Initialize circular array and weyl value.
    for (i = 0, j = -32; j < limit; ++j) {
      // Put the unicode characters into the array, and shuffle them.
      if (seed) v ^= seed.charCodeAt((j + 32) % seed.length);
      // After 32 shuffles, take v as the starting w value.
      if (j === 0) w = v;
      v ^= v << 10;
      v ^= v >>> 15;
      v ^= v << 4;
      v ^= v >>> 13;
      if (j >= 0) {
        w = (w + 0x61c88647) | 0;     // Weyl.
        t = (X[j & 127] ^= (v + w));  // Combine xor and weyl to init array.
        i = (0 == t) ? i + 1 : 0;     // Count zeroes.
      }
    }
    // We have detected all zeroes; make the key nonzero.
    if (i >= 128) {
      X[(seed && seed.length || 0) & 127] = -1;
    }
    // Run the generator 512 times to further mix the state before using it.
    // Factoring this as a function slows the main generator, so it is just
    // unrolled here.  The weyl generator is not advanced while warming up.
    i = 127;
    for (j = 4 * 128; j > 0; --j) {
      v = X[(i + 34) & 127];
      t = X[i = ((i + 1) & 127)];
      v ^= v << 13;
      t ^= t << 17;
      v ^= v >>> 15;
      t ^= t >>> 12;
      X[i] = v ^ t;
    }
    // Storing state as object members is faster than using closure variables.
    me.w = w;
    me.X = X;
    me.i = i;
  }

  init(me, seed);
}

function copy(f, t) {
  t.i = f.i;
  t.w = f.w;
  t.X = f.X.slice();
  return t;
};

function impl(seed, opts) {
  if (seed == null) seed = +(new Date);
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (state.X) copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.xor4096 = impl;
}

})(
  this,                                     // window object or global
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);

},{}],106:[function(require,module,exports){
// A Javascript implementaion of the "xorshift7" algorithm by
// François Panneton and Pierre L'ecuyer:
// "On the Xorgshift Random Number Generators"
// http://saluc.engr.uconn.edu/refs/crypto/rng/panneton05onthexorshift.pdf

(function(global, module, define) {

function XorGen(seed) {
  var me = this;

  // Set up generator function.
  me.next = function() {
    // Update xor generator.
    var X = me.x, i = me.i, t, v, w;
    t = X[i]; t ^= (t >>> 7); v = t ^ (t << 24);
    t = X[(i + 1) & 7]; v ^= t ^ (t >>> 10);
    t = X[(i + 3) & 7]; v ^= t ^ (t >>> 3);
    t = X[(i + 4) & 7]; v ^= t ^ (t << 7);
    t = X[(i + 7) & 7]; t = t ^ (t << 13); v ^= t ^ (t << 9);
    X[i] = v;
    me.i = (i + 1) & 7;
    return v;
  };

  function init(me, seed) {
    var j, w, X = [];

    if (seed === (seed | 0)) {
      // Seed state array using a 32-bit integer.
      w = X[0] = seed;
    } else {
      // Seed state using a string.
      seed = '' + seed;
      for (j = 0; j < seed.length; ++j) {
        X[j & 7] = (X[j & 7] << 15) ^
            (seed.charCodeAt(j) + X[(j + 1) & 7] << 13);
      }
    }
    // Enforce an array length of 8, not all zeroes.
    while (X.length < 8) X.push(0);
    for (j = 0; j < 8 && X[j] === 0; ++j);
    if (j == 8) w = X[7] = -1; else w = X[j];

    me.x = X;
    me.i = 0;

    // Discard an initial 256 values.
    for (j = 256; j > 0; --j) {
      me.next();
    }
  }

  init(me, seed);
}

function copy(f, t) {
  t.x = f.x.slice();
  t.i = f.i;
  return t;
}

function impl(seed, opts) {
  if (seed == null) seed = +(new Date);
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (state.x) copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.xorshift7 = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);


},{}],107:[function(require,module,exports){
// A Javascript implementaion of the "xorwow" prng algorithm by
// George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

(function(global, module, define) {

function XorGen(seed) {
  var me = this, strseed = '';

  // Set up generator function.
  me.next = function() {
    var t = (me.x ^ (me.x >>> 2));
    me.x = me.y; me.y = me.z; me.z = me.w; me.w = me.v;
    return (me.d = (me.d + 362437 | 0)) +
       (me.v = (me.v ^ (me.v << 4)) ^ (t ^ (t << 1))) | 0;
  };

  me.x = 0;
  me.y = 0;
  me.z = 0;
  me.w = 0;
  me.v = 0;

  if (seed === (seed | 0)) {
    // Integer seed.
    me.x = seed;
  } else {
    // String seed.
    strseed += seed;
  }

  // Mix in string seed, then discard an initial batch of 64 values.
  for (var k = 0; k < strseed.length + 64; k++) {
    me.x ^= strseed.charCodeAt(k) | 0;
    if (k == strseed.length) {
      me.d = me.x << 10 ^ me.x >>> 4;
    }
    me.next();
  }
}

function copy(f, t) {
  t.x = f.x;
  t.y = f.y;
  t.z = f.z;
  t.w = f.w;
  t.v = f.v;
  t.d = f.d;
  return t;
}

function impl(seed, opts) {
  var xg = new XorGen(seed),
      state = opts && opts.state,
      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  prng.double = function() {
    do {
      var top = xg.next() >>> 11,
          bot = (xg.next() >>> 0) / 0x100000000,
          result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };
  prng.int32 = xg.next;
  prng.quick = prng;
  if (state) {
    if (typeof(state) == 'object') copy(state, xg);
    prng.state = function() { return copy(xg, {}); }
  }
  return prng;
}

if (module && module.exports) {
  module.exports = impl;
} else if (define && define.amd) {
  define(function() { return impl; });
} else {
  this.xorwow = impl;
}

})(
  this,
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define   // present with an AMD loader
);



},{}],108:[function(require,module,exports){
/*
Copyright 2014 David Bau.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

(function (pool, math) {
//
// The following constants are related to IEEE 754 limits.
//

// Detect the global object, even if operating in strict mode.
// http://stackoverflow.com/a/14387057/265298
var global = (0, eval)('this'),
    width = 256,        // each RC4 output is 0 <= x < 256
    chunks = 6,         // at least six RC4 outputs for each double
    digits = 52,        // there are 52 significant digits in a double
    rngname = 'random', // rngname: name for Math.random and Math.seedrandom
    startdenom = math.pow(width, chunks),
    significance = math.pow(2, digits),
    overflow = significance * 2,
    mask = width - 1,
    nodecrypto;         // node.js crypto module, initialized at the bottom.

//
// seedrandom()
// This is the seedrandom function described above.
//
function seedrandom(seed, options, callback) {
  var key = [];
  options = (options == true) ? { entropy: true } : (options || {});

  // Flatten the seed string or build one from local entropy if needed.
  var shortseed = mixkey(flatten(
    options.entropy ? [seed, tostring(pool)] :
    (seed == null) ? autoseed() : seed, 3), key);

  // Use the seed to initialize an ARC4 generator.
  var arc4 = new ARC4(key);

  // This function returns a random double in [0, 1) that contains
  // randomness in every bit of the mantissa of the IEEE 754 value.
  var prng = function() {
    var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
        d = startdenom,                 //   and denominator d = 2 ^ 48.
        x = 0;                          //   and no 'extra last byte'.
    while (n < significance) {          // Fill up all significant digits by
      n = (n + x) * width;              //   shifting numerator and
      d *= width;                       //   denominator and generating a
      x = arc4.g(1);                    //   new least-significant-byte.
    }
    while (n >= overflow) {             // To avoid rounding up, before adding
      n /= 2;                           //   last byte, shift everything
      d /= 2;                           //   right using integer math until
      x >>>= 1;                         //   we have exactly the desired bits.
    }
    return (n + x) / d;                 // Form the number within [0, 1).
  };

  prng.int32 = function() { return arc4.g(4) | 0; }
  prng.quick = function() { return arc4.g(4) / 0x100000000; }
  prng.double = prng;

  // Mix the randomness into accumulated entropy.
  mixkey(tostring(arc4.S), pool);

  // Calling convention: what to return as a function of prng, seed, is_math.
  return (options.pass || callback ||
      function(prng, seed, is_math_call, state) {
        if (state) {
          // Load the arc4 state from the given state if it has an S array.
          if (state.S) { copy(state, arc4); }
          // Only provide the .state method if requested via options.state.
          prng.state = function() { return copy(arc4, {}); }
        }

        // If called as a method of Math (Math.seedrandom()), mutate
        // Math.random because that is how seedrandom.js has worked since v1.0.
        if (is_math_call) { math[rngname] = prng; return seed; }

        // Otherwise, it is a newer calling convention, so return the
        // prng directly.
        else return prng;
      })(
  prng,
  shortseed,
  'global' in options ? options.global : (this == math),
  options.state);
}
math['seed' + rngname] = seedrandom;

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
function ARC4(key) {
  var t, keylen = key.length,
      me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

  // The empty key [] is treated as [0].
  if (!keylen) { key = [keylen++]; }

  // Set up S using the standard key scheduling algorithm.
  while (i < width) {
    s[i] = i++;
  }
  for (i = 0; i < width; i++) {
    s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
    s[j] = t;
  }

  // The "g" method returns the next (count) outputs as one number.
  (me.g = function(count) {
    // Using instance members instead of closure state nearly doubles speed.
    var t, r = 0,
        i = me.i, j = me.j, s = me.S;
    while (count--) {
      t = s[i = mask & (i + 1)];
      r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
    }
    me.i = i; me.j = j;
    return r;
    // For robust unpredictability, the function call below automatically
    // discards an initial batch of values.  This is called RC4-drop[256].
    // See http://google.com/search?q=rsa+fluhrer+response&btnI
  })(width);
}

//
// copy()
// Copies internal state of ARC4 to or from a plain object.
//
function copy(f, t) {
  t.i = f.i;
  t.j = f.j;
  t.S = f.S.slice();
  return t;
};

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
function flatten(obj, depth) {
  var result = [], typ = (typeof obj), prop;
  if (depth && typ == 'object') {
    for (prop in obj) {
      try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
    }
  }
  return (result.length ? result : typ == 'string' ? obj : obj + '\0');
}

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
function mixkey(seed, key) {
  var stringseed = seed + '', smear, j = 0;
  while (j < stringseed.length) {
    key[mask & j] =
      mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
  }
  return tostring(key);
}

//
// autoseed()
// Returns an object for autoseeding, using window.crypto and Node crypto
// module if available.
//
function autoseed() {
  try {
    var out;
    if (nodecrypto && (out = nodecrypto.randomBytes)) {
      // The use of 'out' to remember randomBytes makes tight minified code.
      out = out(width);
    } else {
      out = new Uint8Array(width);
      (global.crypto || global.msCrypto).getRandomValues(out);
    }
    return tostring(out);
  } catch (e) {
    var browser = global.navigator,
        plugins = browser && browser.plugins;
    return [+new Date, global, plugins, global.screen, tostring(pool)];
  }
}

//
// tostring()
// Converts an array of charcodes to a string
//
function tostring(a) {
  return String.fromCharCode.apply(0, a);
}

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to interfere with deterministic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
mixkey(math.random(), pool);

//
// Nodejs and AMD support: export the implementation as a module using
// either convention.
//
if ((typeof module) == 'object' && module.exports) {
  module.exports = seedrandom;
  // When in node.js, try using crypto package for autoseeding.
  try {
    nodecrypto = require('crypto');
  } catch (ex) {}
} else if ((typeof define) == 'function' && define.amd) {
  define(function() { return seedrandom; });
}

// End anonymous scope, and pass initial values.
})(
  [],     // pool: entropy pool starts empty
  Math    // math: package containing random, pow, and seedrandom
);

},{"crypto":7}],109:[function(require,module,exports){
/*
 * A fast javascript implementation of simplex noise by Jonas Wagner
 *
 * Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
 * Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 *
 *
 * Copyright (C) 2012 Jonas Wagner
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */
(function () {

var F2 = 0.5 * (Math.sqrt(3.0) - 1.0),
    G2 = (3.0 - Math.sqrt(3.0)) / 6.0,
    F3 = 1.0 / 3.0,
    G3 = 1.0 / 6.0,
    F4 = (Math.sqrt(5.0) - 1.0) / 4.0,
    G4 = (5.0 - Math.sqrt(5.0)) / 20.0;


function SimplexNoise(random) {
    if (!random) random = Math.random;
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (var i = 0; i < 256; i++) {
        this.p[i] = random() * 256;
    }
    for (i = 0; i < 512; i++) {
        this.perm[i] = this.p[i & 255];
        this.permMod12[i] = this.perm[i] % 12;
    }

}
SimplexNoise.prototype = {
    grad3: new Float32Array([1, 1, 0,
                            - 1, 1, 0,
                            1, - 1, 0,

                            - 1, - 1, 0,
                            1, 0, 1,
                            - 1, 0, 1,

                            1, 0, - 1,
                            - 1, 0, - 1,
                            0, 1, 1,

                            0, - 1, 1,
                            0, 1, - 1,
                            0, - 1, - 1]),
    grad4: new Float32Array([0, 1, 1, 1, 0, 1, 1, - 1, 0, 1, - 1, 1, 0, 1, - 1, - 1,
                            0, - 1, 1, 1, 0, - 1, 1, - 1, 0, - 1, - 1, 1, 0, - 1, - 1, - 1,
                            1, 0, 1, 1, 1, 0, 1, - 1, 1, 0, - 1, 1, 1, 0, - 1, - 1,
                            - 1, 0, 1, 1, - 1, 0, 1, - 1, - 1, 0, - 1, 1, - 1, 0, - 1, - 1,
                            1, 1, 0, 1, 1, 1, 0, - 1, 1, - 1, 0, 1, 1, - 1, 0, - 1,
                            - 1, 1, 0, 1, - 1, 1, 0, - 1, - 1, - 1, 0, 1, - 1, - 1, 0, - 1,
                            1, 1, 1, 0, 1, 1, - 1, 0, 1, - 1, 1, 0, 1, - 1, - 1, 0,
                            - 1, 1, 1, 0, - 1, 1, - 1, 0, - 1, - 1, 1, 0, - 1, - 1, - 1, 0]),
    noise2D: function (xin, yin) {
        var permMod12 = this.permMod12,
            perm = this.perm,
            grad3 = this.grad3;
        var n0, n1, n2; // Noise contributions from the three corners
        // Skew the input space to determine which simplex cell we're in
        var s = (xin + yin) * F2; // Hairy factor for 2D
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var t = (i + j) * G2;
        var X0 = i - t; // Unskew the cell origin back to (x,y) space
        var Y0 = j - t;
        var x0 = xin - X0; // The x,y distances from the cell origin
        var y0 = yin - Y0;
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else {
            i1 = 0;
            j1 = 1;
        } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        var y1 = y0 - j1 + G2;
        var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
        var y2 = y0 - 1.0 + 2.0 * G2;
        // Work out the hashed gradient indices of the three simplex corners
        var ii = i & 255;
        var jj = j & 255;
        // Calculate the contribution from the three corners
        var t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0.0;
        else {
            var gi0 = permMod12[ii + perm[jj]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
        }
        var t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0.0;
        else {
            var gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
        }
        var t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0.0;
        else {
            var gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2);
    },
    // 3D simplex noise
    noise3D: function (xin, yin, zin) {
        var permMod12 = this.permMod12,
            perm = this.perm,
            grad3 = this.grad3;
        var n0, n1, n2, n3; // Noise contributions from the four corners
        // Skew the input space to determine which simplex cell we're in
        var s = (xin + yin + zin) * F3; // Very nice and simple skew factor for 3D
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var k = Math.floor(zin + s);
        var t = (i + j + k) * G3;
        var X0 = i - t; // Unskew the cell origin back to (x,y,z) space
        var Y0 = j - t;
        var Z0 = k - t;
        var x0 = xin - X0; // The x,y,z distances from the cell origin
        var y0 = yin - Y0;
        var z0 = zin - Z0;
        // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
        // Determine which simplex we are in.
        var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
        var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
        if (x0 >= y0) {
            if (y0 >= z0) {
                i1 = 1;
                j1 = 0;
                k1 = 0;
                i2 = 1;
                j2 = 1;
                k2 = 0;
            } // X Y Z order
            else if (x0 >= z0) {
                i1 = 1;
                j1 = 0;
                k1 = 0;
                i2 = 1;
                j2 = 0;
                k2 = 1;
            } // X Z Y order
            else {
                i1 = 0;
                j1 = 0;
                k1 = 1;
                i2 = 1;
                j2 = 0;
                k2 = 1;
            } // Z X Y order
        }
        else { // x0<y0
            if (y0 < z0) {
                i1 = 0;
                j1 = 0;
                k1 = 1;
                i2 = 0;
                j2 = 1;
                k2 = 1;
            } // Z Y X order
            else if (x0 < z0) {
                i1 = 0;
                j1 = 1;
                k1 = 0;
                i2 = 0;
                j2 = 1;
                k2 = 1;
            } // Y Z X order
            else {
                i1 = 0;
                j1 = 1;
                k1 = 0;
                i2 = 1;
                j2 = 1;
                k2 = 0;
            } // Y X Z order
        }
        // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
        // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
        // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
        // c = 1/6.
        var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
        var y1 = y0 - j1 + G3;
        var z1 = z0 - k1 + G3;
        var x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
        var y2 = y0 - j2 + 2.0 * G3;
        var z2 = z0 - k2 + 2.0 * G3;
        var x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
        var y3 = y0 - 1.0 + 3.0 * G3;
        var z3 = z0 - 1.0 + 3.0 * G3;
        // Work out the hashed gradient indices of the four simplex corners
        var ii = i & 255;
        var jj = j & 255;
        var kk = k & 255;
        // Calculate the contribution from the four corners
        var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (t0 < 0) n0 = 0.0;
        else {
            var gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
        }
        var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (t1 < 0) n1 = 0.0;
        else {
            var gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
        }
        var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (t2 < 0) n2 = 0.0;
        else {
            var gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
        }
        var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (t3 < 0) n3 = 0.0;
        else {
            var gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
            t3 *= t3;
            n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to stay just inside [-1,1]
        return 32.0 * (n0 + n1 + n2 + n3);
    },
    // 4D simplex noise, better simplex rank ordering method 2012-03-09
    noise4D: function (x, y, z, w) {
        var permMod12 = this.permMod12,
            perm = this.perm,
            grad4 = this.grad4;

        var n0, n1, n2, n3, n4; // Noise contributions from the five corners
        // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
        var s = (x + y + z + w) * F4; // Factor for 4D skewing
        var i = Math.floor(x + s);
        var j = Math.floor(y + s);
        var k = Math.floor(z + s);
        var l = Math.floor(w + s);
        var t = (i + j + k + l) * G4; // Factor for 4D unskewing
        var X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
        var Y0 = j - t;
        var Z0 = k - t;
        var W0 = l - t;
        var x0 = x - X0; // The x,y,z,w distances from the cell origin
        var y0 = y - Y0;
        var z0 = z - Z0;
        var w0 = w - W0;
        // For the 4D case, the simplex is a 4D shape I won't even try to describe.
        // To find out which of the 24 possible simplices we're in, we need to
        // determine the magnitude ordering of x0, y0, z0 and w0.
        // Six pair-wise comparisons are performed between each possible pair
        // of the four coordinates, and the results are used to rank the numbers.
        var rankx = 0;
        var ranky = 0;
        var rankz = 0;
        var rankw = 0;
        if (x0 > y0) rankx++;
        else ranky++;
        if (x0 > z0) rankx++;
        else rankz++;
        if (x0 > w0) rankx++;
        else rankw++;
        if (y0 > z0) ranky++;
        else rankz++;
        if (y0 > w0) ranky++;
        else rankw++;
        if (z0 > w0) rankz++;
        else rankw++;
        var i1, j1, k1, l1; // The integer offsets for the second simplex corner
        var i2, j2, k2, l2; // The integer offsets for the third simplex corner
        var i3, j3, k3, l3; // The integer offsets for the fourth simplex corner
        // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
        // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
        // impossible. Only the 24 indices which have non-zero entries make any sense.
        // We use a thresholding to set the coordinates in turn from the largest magnitude.
        // Rank 3 denotes the largest coordinate.
        i1 = rankx >= 3 ? 1 : 0;
        j1 = ranky >= 3 ? 1 : 0;
        k1 = rankz >= 3 ? 1 : 0;
        l1 = rankw >= 3 ? 1 : 0;
        // Rank 2 denotes the second largest coordinate.
        i2 = rankx >= 2 ? 1 : 0;
        j2 = ranky >= 2 ? 1 : 0;
        k2 = rankz >= 2 ? 1 : 0;
        l2 = rankw >= 2 ? 1 : 0;
        // Rank 1 denotes the second smallest coordinate.
        i3 = rankx >= 1 ? 1 : 0;
        j3 = ranky >= 1 ? 1 : 0;
        k3 = rankz >= 1 ? 1 : 0;
        l3 = rankw >= 1 ? 1 : 0;
        // The fifth corner has all coordinate offsets = 1, so no need to compute that.
        var x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
        var y1 = y0 - j1 + G4;
        var z1 = z0 - k1 + G4;
        var w1 = w0 - l1 + G4;
        var x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
        var y2 = y0 - j2 + 2.0 * G4;
        var z2 = z0 - k2 + 2.0 * G4;
        var w2 = w0 - l2 + 2.0 * G4;
        var x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
        var y3 = y0 - j3 + 3.0 * G4;
        var z3 = z0 - k3 + 3.0 * G4;
        var w3 = w0 - l3 + 3.0 * G4;
        var x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
        var y4 = y0 - 1.0 + 4.0 * G4;
        var z4 = z0 - 1.0 + 4.0 * G4;
        var w4 = w0 - 1.0 + 4.0 * G4;
        // Work out the hashed gradient indices of the five simplex corners
        var ii = i & 255;
        var jj = j & 255;
        var kk = k & 255;
        var ll = l & 255;
        // Calculate the contribution from the five corners
        var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
        if (t0 < 0) n0 = 0.0;
        else {
            var gi0 = (perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32) * 4;
            t0 *= t0;
            n0 = t0 * t0 * (grad4[gi0] * x0 + grad4[gi0 + 1] * y0 + grad4[gi0 + 2] * z0 + grad4[gi0 + 3] * w0);
        }
        var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
        if (t1 < 0) n1 = 0.0;
        else {
            var gi1 = (perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32) * 4;
            t1 *= t1;
            n1 = t1 * t1 * (grad4[gi1] * x1 + grad4[gi1 + 1] * y1 + grad4[gi1 + 2] * z1 + grad4[gi1 + 3] * w1);
        }
        var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
        if (t2 < 0) n2 = 0.0;
        else {
            var gi2 = (perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32) * 4;
            t2 *= t2;
            n2 = t2 * t2 * (grad4[gi2] * x2 + grad4[gi2 + 1] * y2 + grad4[gi2 + 2] * z2 + grad4[gi2 + 3] * w2);
        }
        var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
        if (t3 < 0) n3 = 0.0;
        else {
            var gi3 = (perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32) * 4;
            t3 *= t3;
            n3 = t3 * t3 * (grad4[gi3] * x3 + grad4[gi3 + 1] * y3 + grad4[gi3 + 2] * z3 + grad4[gi3 + 3] * w3);
        }
        var t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
        if (t4 < 0) n4 = 0.0;
        else {
            var gi4 = (perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32) * 4;
            t4 *= t4;
            n4 = t4 * t4 * (grad4[gi4] * x4 + grad4[gi4 + 1] * y4 + grad4[gi4 + 2] * z4 + grad4[gi4 + 3] * w4);
        }
        // Sum up and scale the result to cover the range [-1,1]
        return 27.0 * (n0 + n1 + n2 + n3 + n4);
    }


};

// amd
if (typeof define !== 'undefined' && define.amd) define(function(){return SimplexNoise;});
// browser
else if (typeof window !== 'undefined') window.SimplexNoise = SimplexNoise;
//common js
if (typeof exports !== 'undefined') exports.SimplexNoise = SimplexNoise;
// nodejs
if (typeof module !== 'undefined') {
    module.exports = SimplexNoise;
}

})();

},{}],110:[function(require,module,exports){
(function (global){
/*
** Copyright (c) 2012 The Khronos Group Inc.
**
** Permission is hereby granted, free of charge, to any person obtaining a
** copy of this software and/or associated documentation files (the
** "Materials"), to deal in the Materials without restriction, including
** without limitation the rights to use, copy, modify, merge, publish,
** distribute, sublicense, and/or sell copies of the Materials, and to
** permit persons to whom the Materials are furnished to do so, subject to
** the following conditions:
**
** The above copyright notice and this permission notice shall be included
** in all copies or substantial portions of the Materials.
**
** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
*/

//Ported to node by Marcin Ignac on 2016-05-20

// Various functions for helping debug WebGL apps.

WebGLDebugUtils = function() {

//polyfill window in node
if (typeof(window) == 'undefined') {
    window = global;
}

/**
 * Wrapped logging function.
 * @param {string} msg Message to log.
 */
var log = function(msg) {
  if (window.console && window.console.log) {
    window.console.log(msg);
  }
};

/**
 * Wrapped error logging function.
 * @param {string} msg Message to log.
 */
var error = function(msg) {
  if (window.console && window.console.error) {
    window.console.error(msg);
  } else {
    log(msg);
  }
};


/**
 * Which arguments are enums based on the number of arguments to the function.
 * So
 *    'texImage2D': {
 *       9: { 0:true, 2:true, 6:true, 7:true },
 *       6: { 0:true, 2:true, 3:true, 4:true },
 *    },
 *
 * means if there are 9 arguments then 6 and 7 are enums, if there are 6
 * arguments 3 and 4 are enums
 *
 * @type {!Object.<number, !Object.<number, string>}
 */
var glValidEnumContexts = {
  // Generic setters and getters

  'enable': {1: { 0:true }},
  'disable': {1: { 0:true }},
  'getParameter': {1: { 0:true }},

  // Rendering

  'drawArrays': {3:{ 0:true }},
  'drawElements': {4:{ 0:true, 2:true }},

  // Shaders

  'createShader': {1: { 0:true }},
  'getShaderParameter': {2: { 1:true }},
  'getProgramParameter': {2: { 1:true }},
  'getShaderPrecisionFormat': {2: { 0: true, 1:true }},

  // Vertex attributes

  'getVertexAttrib': {2: { 1:true }},
  'vertexAttribPointer': {6: { 2:true }},

  // Textures

  'bindTexture': {2: { 0:true }},
  'activeTexture': {1: { 0:true }},
  'getTexParameter': {2: { 0:true, 1:true }},
  'texParameterf': {3: { 0:true, 1:true }},
  'texParameteri': {3: { 0:true, 1:true, 2:true }},
  'texImage2D': {
     9: { 0:true, 2:true, 6:true, 7:true },
     6: { 0:true, 2:true, 3:true, 4:true }
  },
  'texSubImage2D': {
    9: { 0:true, 6:true, 7:true },
    7: { 0:true, 4:true, 5:true }
  },
  'copyTexImage2D': {8: { 0:true, 2:true }},
  'copyTexSubImage2D': {8: { 0:true }},
  'generateMipmap': {1: { 0:true }},
  'compressedTexImage2D': {7: { 0: true, 2:true }},
  'compressedTexSubImage2D': {8: { 0: true, 6:true }},

  // Buffer objects

  'bindBuffer': {2: { 0:true }},
  'bufferData': {3: { 0:true, 2:true }},
  'bufferSubData': {3: { 0:true }},
  'getBufferParameter': {2: { 0:true, 1:true }},

  // Renderbuffers and framebuffers

  'pixelStorei': {2: { 0:true, 1:true }},
  'readPixels': {7: { 4:true, 5:true }},
  'bindRenderbuffer': {2: { 0:true }},
  'bindFramebuffer': {2: { 0:true }},
  'checkFramebufferStatus': {1: { 0:true }},
  'framebufferRenderbuffer': {4: { 0:true, 1:true, 2:true }},
  'framebufferTexture2D': {5: { 0:true, 1:true, 2:true }},
  'getFramebufferAttachmentParameter': {3: { 0:true, 1:true, 2:true }},
  'getRenderbufferParameter': {2: { 0:true, 1:true }},
  'renderbufferStorage': {4: { 0:true, 1:true }},

  // Frame buffer operations (clear, blend, depth test, stencil)

  'clear': {1: { 0: { 'enumBitwiseOr': ['COLOR_BUFFER_BIT', 'DEPTH_BUFFER_BIT', 'STENCIL_BUFFER_BIT'] }}},
  'depthFunc': {1: { 0:true }},
  'blendFunc': {2: { 0:true, 1:true }},
  'blendFuncSeparate': {4: { 0:true, 1:true, 2:true, 3:true }},
  'blendEquation': {1: { 0:true }},
  'blendEquationSeparate': {2: { 0:true, 1:true }},
  'stencilFunc': {3: { 0:true }},
  'stencilFuncSeparate': {4: { 0:true, 1:true }},
  'stencilMaskSeparate': {2: { 0:true }},
  'stencilOp': {3: { 0:true, 1:true, 2:true }},
  'stencilOpSeparate': {4: { 0:true, 1:true, 2:true, 3:true }},

  // Culling

  'cullFace': {1: { 0:true }},
  'frontFace': {1: { 0:true }},

  // ANGLE_instanced_arrays extension

  'drawArraysInstancedANGLE': {4: { 0:true }},
  'drawElementsInstancedANGLE': {5: { 0:true, 2:true }},

  // EXT_blend_minmax extension

  'blendEquationEXT': {1: { 0:true }}
};

/**
 * Map of numbers to names.
 * @type {Object}
 */
var glEnums = null;

/**
 * Map of names to numbers.
 * @type {Object}
 */
var enumStringToValue = null;

/**
 * Initializes this module. Safe to call more than once.
 * @param {!WebGLRenderingContext} ctx A WebGL context. If
 *    you have more than one context it doesn't matter which one
 *    you pass in, it is only used to pull out constants.
 */
function init(ctx) {
  if (glEnums == null) {
    glEnums = { };
    enumStringToValue = { };
    for (var propertyName in ctx) {
      if (typeof ctx[propertyName] == 'number') {
        glEnums[ctx[propertyName]] = propertyName;
        enumStringToValue[propertyName] = ctx[propertyName];
      }
    }
  }
}

/**
 * Checks the utils have been initialized.
 */
function checkInit() {
  if (glEnums == null) {
    throw 'WebGLDebugUtils.init(ctx) not called';
  }
}

/**
 * Returns true or false if value matches any WebGL enum
 * @param {*} value Value to check if it might be an enum.
 * @return {boolean} True if value matches one of the WebGL defined enums
 */
function mightBeEnum(value) {
  checkInit();
  return (glEnums[value] !== undefined);
}

/**
 * Gets an string version of an WebGL enum.
 *
 * Example:
 *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
 *
 * @param {number} value Value to return an enum for
 * @return {string} The string version of the enum.
 */
function glEnumToString(value) {
  checkInit();
  var name = glEnums[value];
  return (name !== undefined) ? ("gl." + name) :
      ("/*UNKNOWN WebGL ENUM*/ 0x" + value.toString(16) + "");
}

/**
 * Returns the string version of a WebGL argument.
 * Attempts to convert enum arguments to strings.
 * @param {string} functionName the name of the WebGL function.
 * @param {number} numArgs the number of arguments passed to the function.
 * @param {number} argumentIndx the index of the argument.
 * @param {*} value The value of the argument.
 * @return {string} The value as a string.
 */
function glFunctionArgToString(functionName, numArgs, argumentIndex, value) {
  var funcInfo = glValidEnumContexts[functionName];
  if (funcInfo !== undefined) {
    var funcInfo = funcInfo[numArgs];
    if (funcInfo !== undefined) {
      if (funcInfo[argumentIndex]) {
        if (typeof funcInfo[argumentIndex] === 'object' &&
            funcInfo[argumentIndex]['enumBitwiseOr'] !== undefined) {
          var enums = funcInfo[argumentIndex]['enumBitwiseOr'];
          var orResult = 0;
          var orEnums = [];
          for (var i = 0; i < enums.length; ++i) {
            var enumValue = enumStringToValue[enums[i]];
            if ((value & enumValue) !== 0) {
              orResult |= enumValue;
              orEnums.push(glEnumToString(enumValue));
            }
          }
          if (orResult === value) {
            return orEnums.join(' | ');
          } else {
            return glEnumToString(value);
          }
        } else {
          return glEnumToString(value);
        }
      }
    }
  }
  if (value === null) {
    return "null";
  } else if (value === undefined) {
    return "undefined";
  } else {
    return value.toString();
  }
}

/**
 * Converts the arguments of a WebGL function to a string.
 * Attempts to convert enum arguments to strings.
 *
 * @param {string} functionName the name of the WebGL function.
 * @param {number} args The arguments.
 * @return {string} The arguments as a string.
 */
function glFunctionArgsToString(functionName, args) {
  // apparently we can't do args.join(",");
  var argStr = "";
  var numArgs = args.length;
  for (var ii = 0; ii < numArgs; ++ii) {
    argStr += ((ii == 0) ? '' : ', ') +
        glFunctionArgToString(functionName, numArgs, ii, args[ii]);
  }
  return argStr;
};


function makePropertyWrapper(wrapper, original, propertyName) {
  //log("wrap prop: " + propertyName);
  wrapper.__defineGetter__(propertyName, function() {
    return original[propertyName];
  });
  // TODO(gmane): this needs to handle properties that take more than
  // one value?
  wrapper.__defineSetter__(propertyName, function(value) {
    //log("set: " + propertyName);
    original[propertyName] = value;
  });
}

// Makes a function that calls a function on another object.
function makeFunctionWrapper(original, functionName) {
  //log("wrap fn: " + functionName);
  var f = original[functionName];
  return function() {
    //log("call: " + functionName);
    var result = f.apply(original, arguments);
    return result;
  };
}

/**
 * Given a WebGL context returns a wrapped context that calls
 * gl.getError after every command and calls a function if the
 * result is not gl.NO_ERROR.
 *
 * @param {!WebGLRenderingContext} ctx The webgl context to
 *        wrap.
 * @param {!function(err, funcName, args): void} opt_onErrorFunc
 *        The function to call when gl.getError returns an
 *        error. If not specified the default function calls
 *        console.log with a message.
 * @param {!function(funcName, args): void} opt_onFunc The
 *        function to call when each webgl function is called.
 *        You can use this to log all calls for example.
 * @param {!WebGLRenderingContext} opt_err_ctx The webgl context
 *        to call getError on if different than ctx.
 */
function makeDebugContext(ctx, opt_onErrorFunc, opt_onFunc, opt_err_ctx) {
  opt_err_ctx = opt_err_ctx || ctx;
  init(ctx);
  opt_onErrorFunc = opt_onErrorFunc || function(err, functionName, args) {
        // apparently we can't do args.join(",");
        var argStr = "";
        var numArgs = args.length;
        for (var ii = 0; ii < numArgs; ++ii) {
          argStr += ((ii == 0) ? '' : ', ') +
              glFunctionArgToString(functionName, numArgs, ii, args[ii]);
        }
        error("WebGL error "+ glEnumToString(err) + " in "+ functionName +
              "(" + argStr + ")");
      };

  // Holds booleans for each GL error so after we get the error ourselves
  // we can still return it to the client app.
  var glErrorShadow = { };

  // Makes a function that calls a WebGL function and then calls getError.
  function makeErrorWrapper(ctx, functionName) {
    return function() {
      if (opt_onFunc) {
        opt_onFunc(functionName, arguments);
      }
      var result = ctx[functionName].apply(ctx, arguments);
      var err = opt_err_ctx.getError();
      if (err != 0) {
        glErrorShadow[err] = true;
        opt_onErrorFunc(err, functionName, arguments);
      }
      return result;
    };
  }

  // Make a an object that has a copy of every property of the WebGL context
  // but wraps all functions.
  var wrapper = {};
  for (var propertyName in ctx) {
    if (typeof ctx[propertyName] == 'function') {
      if (propertyName != 'getExtension') {
        wrapper[propertyName] = makeErrorWrapper(ctx, propertyName);
      } else {
        var wrapped = makeErrorWrapper(ctx, propertyName);
        wrapper[propertyName] = function () {
          var result = wrapped.apply(ctx, arguments);
          return makeDebugContext(result, opt_onErrorFunc, opt_onFunc, opt_err_ctx);
        };
      }
    } else {
      makePropertyWrapper(wrapper, ctx, propertyName);
    }
  }

  // Override the getError function with one that returns our saved results.
  wrapper.getError = function() {
    for (var err in glErrorShadow) {
      if (glErrorShadow.hasOwnProperty(err)) {
        if (glErrorShadow[err]) {
          glErrorShadow[err] = false;
          return err;
        }
      }
    }
    return ctx.NO_ERROR;
  };

  return wrapper;
}

function resetToInitialState(ctx) {
  var numAttribs = ctx.getParameter(ctx.MAX_VERTEX_ATTRIBS);
  var tmp = ctx.createBuffer();
  ctx.bindBuffer(ctx.ARRAY_BUFFER, tmp);
  for (var ii = 0; ii < numAttribs; ++ii) {
    ctx.disableVertexAttribArray(ii);
    ctx.vertexAttribPointer(ii, 4, ctx.FLOAT, false, 0, 0);
    ctx.vertexAttrib1f(ii, 0);
  }
  ctx.deleteBuffer(tmp);

  var numTextureUnits = ctx.getParameter(ctx.MAX_TEXTURE_IMAGE_UNITS);
  for (var ii = 0; ii < numTextureUnits; ++ii) {
    ctx.activeTexture(ctx.TEXTURE0 + ii);
    ctx.bindTexture(ctx.TEXTURE_CUBE_MAP, null);
    ctx.bindTexture(ctx.TEXTURE_2D, null);
  }

  ctx.activeTexture(ctx.TEXTURE0);
  ctx.useProgram(null);
  ctx.bindBuffer(ctx.ARRAY_BUFFER, null);
  ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, null);
  ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
  ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
  ctx.disable(ctx.BLEND);
  ctx.disable(ctx.CULL_FACE);
  ctx.disable(ctx.DEPTH_TEST);
  ctx.disable(ctx.DITHER);
  ctx.disable(ctx.SCISSOR_TEST);
  ctx.blendColor(0, 0, 0, 0);
  ctx.blendEquation(ctx.FUNC_ADD);
  ctx.blendFunc(ctx.ONE, ctx.ZERO);
  ctx.clearColor(0, 0, 0, 0);
  ctx.clearDepth(1);
  ctx.clearStencil(-1);
  ctx.colorMask(true, true, true, true);
  ctx.cullFace(ctx.BACK);
  ctx.depthFunc(ctx.LESS);
  ctx.depthMask(true);
  ctx.depthRange(0, 1);
  ctx.frontFace(ctx.CCW);
  ctx.hint(ctx.GENERATE_MIPMAP_HINT, ctx.DONT_CARE);
  ctx.lineWidth(1);
  ctx.pixelStorei(ctx.PACK_ALIGNMENT, 4);
  ctx.pixelStorei(ctx.UNPACK_ALIGNMENT, 4);
  ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
  ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  // TODO: Delete this IF.
  if (ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL) {
    ctx.pixelStorei(ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL, ctx.BROWSER_DEFAULT_WEBGL);
  }
  ctx.polygonOffset(0, 0);
  ctx.sampleCoverage(1, false);
  ctx.scissor(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.stencilFunc(ctx.ALWAYS, 0, 0xFFFFFFFF);
  ctx.stencilMask(0xFFFFFFFF);
  ctx.stencilOp(ctx.KEEP, ctx.KEEP, ctx.KEEP);
  ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT | ctx.STENCIL_BUFFER_BIT);

  // TODO: This should NOT be needed but Firefox fails with 'hint'
  while(ctx.getError());
}

function makeLostContextSimulatingCanvas(canvas) {
  var unwrappedContext_;
  var wrappedContext_;
  var onLost_ = [];
  var onRestored_ = [];
  var wrappedContext_ = {};
  var contextId_ = 1;
  var contextLost_ = false;
  var resourceId_ = 0;
  var resourceDb_ = [];
  var numCallsToLoseContext_ = 0;
  var numCalls_ = 0;
  var canRestore_ = false;
  var restoreTimeout_ = 0;

  // Holds booleans for each GL error so can simulate errors.
  var glErrorShadow_ = { };

  canvas.getContext = function(f) {
    return function() {
      var ctx = f.apply(canvas, arguments);
      // Did we get a context and is it a WebGL context?
      if (ctx instanceof WebGLRenderingContext) {
        if (ctx != unwrappedContext_) {
          if (unwrappedContext_) {
            throw "got different context"
          }
          unwrappedContext_ = ctx;
          wrappedContext_ = makeLostContextSimulatingContext(unwrappedContext_);
        }
        return wrappedContext_;
      }
      return ctx;
    }
  }(canvas.getContext);

  function wrapEvent(listener) {
    if (typeof(listener) == "function") {
      return listener;
    } else {
      return function(info) {
        listener.handleEvent(info);
      }
    }
  }

  var addOnContextLostListener = function(listener) {
    onLost_.push(wrapEvent(listener));
  };

  var addOnContextRestoredListener = function(listener) {
    onRestored_.push(wrapEvent(listener));
  };


  function wrapAddEventListener(canvas) {
    var f = canvas.addEventListener;
    canvas.addEventListener = function(type, listener, bubble) {
      switch (type) {
        case 'webglcontextlost':
          addOnContextLostListener(listener);
          break;
        case 'webglcontextrestored':
          addOnContextRestoredListener(listener);
          break;
        default:
          f.apply(canvas, arguments);
      }
    };
  }

  wrapAddEventListener(canvas);

  canvas.loseContext = function() {
    if (!contextLost_) {
      contextLost_ = true;
      numCallsToLoseContext_ = 0;
      ++contextId_;
      while (unwrappedContext_.getError());
      clearErrors();
      glErrorShadow_[unwrappedContext_.CONTEXT_LOST_WEBGL] = true;
      var event = makeWebGLContextEvent("context lost");
      var callbacks = onLost_.slice();
      setTimeout(function() {
          //log("numCallbacks:" + callbacks.length);
          for (var ii = 0; ii < callbacks.length; ++ii) {
            //log("calling callback:" + ii);
            callbacks[ii](event);
          }
          if (restoreTimeout_ >= 0) {
            setTimeout(function() {
                canvas.restoreContext();
              }, restoreTimeout_);
          }
        }, 0);
    }
  };

  canvas.restoreContext = function() {
    if (contextLost_) {
      if (onRestored_.length) {
        setTimeout(function() {
            if (!canRestore_) {
              throw "can not restore. webglcontestlost listener did not call event.preventDefault";
            }
            freeResources();
            resetToInitialState(unwrappedContext_);
            contextLost_ = false;
            numCalls_ = 0;
            canRestore_ = false;
            var callbacks = onRestored_.slice();
            var event = makeWebGLContextEvent("context restored");
            for (var ii = 0; ii < callbacks.length; ++ii) {
              callbacks[ii](event);
            }
          }, 0);
      }
    }
  };

  canvas.loseContextInNCalls = function(numCalls) {
    if (contextLost_) {
      throw "You can not ask a lost contet to be lost";
    }
    numCallsToLoseContext_ = numCalls_ + numCalls;
  };

  canvas.getNumCalls = function() {
    return numCalls_;
  };

  canvas.setRestoreTimeout = function(timeout) {
    restoreTimeout_ = timeout;
  };

  function isWebGLObject(obj) {
    //return false;
    return (obj instanceof WebGLBuffer ||
            obj instanceof WebGLFramebuffer ||
            obj instanceof WebGLProgram ||
            obj instanceof WebGLRenderbuffer ||
            obj instanceof WebGLShader ||
            obj instanceof WebGLTexture);
  }

  function checkResources(args) {
    for (var ii = 0; ii < args.length; ++ii) {
      var arg = args[ii];
      if (isWebGLObject(arg)) {
        return arg.__webglDebugContextLostId__ == contextId_;
      }
    }
    return true;
  }

  function clearErrors() {
    var k = Object.keys(glErrorShadow_);
    for (var ii = 0; ii < k.length; ++ii) {
      delete glErrorShadow_[k];
    }
  }

  function loseContextIfTime() {
    ++numCalls_;
    if (!contextLost_) {
      if (numCallsToLoseContext_ == numCalls_) {
        canvas.loseContext();
      }
    }
  }

  // Makes a function that simulates WebGL when out of context.
  function makeLostContextFunctionWrapper(ctx, functionName) {
    var f = ctx[functionName];
    return function() {
      // log("calling:" + functionName);
      // Only call the functions if the context is not lost.
      loseContextIfTime();
      if (!contextLost_) {
        //if (!checkResources(arguments)) {
        //  glErrorShadow_[wrappedContext_.INVALID_OPERATION] = true;
        //  return;
        //}
        var result = f.apply(ctx, arguments);
        return result;
      }
    };
  }

  function freeResources() {
    for (var ii = 0; ii < resourceDb_.length; ++ii) {
      var resource = resourceDb_[ii];
      if (resource instanceof WebGLBuffer) {
        unwrappedContext_.deleteBuffer(resource);
      } else if (resource instanceof WebGLFramebuffer) {
        unwrappedContext_.deleteFramebuffer(resource);
      } else if (resource instanceof WebGLProgram) {
        unwrappedContext_.deleteProgram(resource);
      } else if (resource instanceof WebGLRenderbuffer) {
        unwrappedContext_.deleteRenderbuffer(resource);
      } else if (resource instanceof WebGLShader) {
        unwrappedContext_.deleteShader(resource);
      } else if (resource instanceof WebGLTexture) {
        unwrappedContext_.deleteTexture(resource);
      }
    }
  }

  function makeWebGLContextEvent(statusMessage) {
    return {
      statusMessage: statusMessage,
      preventDefault: function() {
          canRestore_ = true;
        }
    };
  }

  return canvas;

  function makeLostContextSimulatingContext(ctx) {
    // copy all functions and properties to wrapper
    for (var propertyName in ctx) {
      if (typeof ctx[propertyName] == 'function') {
         wrappedContext_[propertyName] = makeLostContextFunctionWrapper(
             ctx, propertyName);
       } else {
         makePropertyWrapper(wrappedContext_, ctx, propertyName);
       }
    }

    // Wrap a few functions specially.
    wrappedContext_.getError = function() {
      loseContextIfTime();
      if (!contextLost_) {
        var err;
        while (err = unwrappedContext_.getError()) {
          glErrorShadow_[err] = true;
        }
      }
      for (var err in glErrorShadow_) {
        if (glErrorShadow_[err]) {
          delete glErrorShadow_[err];
          return err;
        }
      }
      return wrappedContext_.NO_ERROR;
    };

    var creationFunctions = [
      "createBuffer",
      "createFramebuffer",
      "createProgram",
      "createRenderbuffer",
      "createShader",
      "createTexture"
    ];
    for (var ii = 0; ii < creationFunctions.length; ++ii) {
      var functionName = creationFunctions[ii];
      wrappedContext_[functionName] = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return null;
          }
          var obj = f.apply(ctx, arguments);
          obj.__webglDebugContextLostId__ = contextId_;
          resourceDb_.push(obj);
          return obj;
        };
      }(ctx[functionName]);
    }

    var functionsThatShouldReturnNull = [
      "getActiveAttrib",
      "getActiveUniform",
      "getBufferParameter",
      "getContextAttributes",
      "getAttachedShaders",
      "getFramebufferAttachmentParameter",
      "getParameter",
      "getProgramParameter",
      "getProgramInfoLog",
      "getRenderbufferParameter",
      "getShaderParameter",
      "getShaderInfoLog",
      "getShaderSource",
      "getTexParameter",
      "getUniform",
      "getUniformLocation",
      "getVertexAttrib"
    ];
    for (var ii = 0; ii < functionsThatShouldReturnNull.length; ++ii) {
      var functionName = functionsThatShouldReturnNull[ii];
      wrappedContext_[functionName] = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return null;
          }
          return f.apply(ctx, arguments);
        }
      }(wrappedContext_[functionName]);
    }

    var isFunctions = [
      "isBuffer",
      "isEnabled",
      "isFramebuffer",
      "isProgram",
      "isRenderbuffer",
      "isShader",
      "isTexture"
    ];
    for (var ii = 0; ii < isFunctions.length; ++ii) {
      var functionName = isFunctions[ii];
      wrappedContext_[functionName] = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return false;
          }
          return f.apply(ctx, arguments);
        }
      }(wrappedContext_[functionName]);
    }

    wrappedContext_.checkFramebufferStatus = function(f) {
      return function() {
        loseContextIfTime();
        if (contextLost_) {
          return wrappedContext_.FRAMEBUFFER_UNSUPPORTED;
        }
        return f.apply(ctx, arguments);
      };
    }(wrappedContext_.checkFramebufferStatus);

    wrappedContext_.getAttribLocation = function(f) {
      return function() {
        loseContextIfTime();
        if (contextLost_) {
          return -1;
        }
        return f.apply(ctx, arguments);
      };
    }(wrappedContext_.getAttribLocation);

    wrappedContext_.getVertexAttribOffset = function(f) {
      return function() {
        loseContextIfTime();
        if (contextLost_) {
          return 0;
        }
        return f.apply(ctx, arguments);
      };
    }(wrappedContext_.getVertexAttribOffset);

    wrappedContext_.isContextLost = function() {
      return contextLost_;
    };

    return wrappedContext_;
  }
}

return {
  /**
   * Initializes this module. Safe to call more than once.
   * @param {!WebGLRenderingContext} ctx A WebGL context. If
   *    you have more than one context it doesn't matter which one
   *    you pass in, it is only used to pull out constants.
   */
  'init': init,

  /**
   * Returns true or false if value matches any WebGL enum
   * @param {*} value Value to check if it might be an enum.
   * @return {boolean} True if value matches one of the WebGL defined enums
   */
  'mightBeEnum': mightBeEnum,

  /**
   * Gets an string version of an WebGL enum.
   *
   * Example:
   *   WebGLDebugUtil.init(ctx);
   *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
   *
   * @param {number} value Value to return an enum for
   * @return {string} The string version of the enum.
   */
  'glEnumToString': glEnumToString,

  /**
   * Converts the argument of a WebGL function to a string.
   * Attempts to convert enum arguments to strings.
   *
   * Example:
   *   WebGLDebugUtil.init(ctx);
   *   var str = WebGLDebugUtil.glFunctionArgToString('bindTexture', 2, 0, gl.TEXTURE_2D);
   *
   * would return 'TEXTURE_2D'
   *
   * @param {string} functionName the name of the WebGL function.
   * @param {number} numArgs The number of arguments
   * @param {number} argumentIndx the index of the argument.
   * @param {*} value The value of the argument.
   * @return {string} The value as a string.
   */
  'glFunctionArgToString': glFunctionArgToString,

  /**
   * Converts the arguments of a WebGL function to a string.
   * Attempts to convert enum arguments to strings.
   *
   * @param {string} functionName the name of the WebGL function.
   * @param {number} args The arguments.
   * @return {string} The arguments as a string.
   */
  'glFunctionArgsToString': glFunctionArgsToString,

  /**
   * Given a WebGL context returns a wrapped context that calls
   * gl.getError after every command and calls a function if the
   * result is not NO_ERROR.
   *
   * You can supply your own function if you want. For example, if you'd like
   * an exception thrown on any GL error you could do this
   *
   *    function throwOnGLError(err, funcName, args) {
   *      throw WebGLDebugUtils.glEnumToString(err) +
   *            " was caused by call to " + funcName;
   *    };
   *
   *    ctx = WebGLDebugUtils.makeDebugContext(
   *        canvas.getContext("webgl"), throwOnGLError);
   *
   * @param {!WebGLRenderingContext} ctx The webgl context to wrap.
   * @param {!function(err, funcName, args): void} opt_onErrorFunc The function
   *     to call when gl.getError returns an error. If not specified the default
   *     function calls console.log with a message.
   * @param {!function(funcName, args): void} opt_onFunc The
   *     function to call when each webgl function is called. You
   *     can use this to log all calls for example.
   */
  'makeDebugContext': makeDebugContext,

  /**
   * Given a canvas element returns a wrapped canvas element that will
   * simulate lost context. The canvas returned adds the following functions.
   *
   * loseContext:
   *   simulates a lost context event.
   *
   * restoreContext:
   *   simulates the context being restored.
   *
   * lostContextInNCalls:
   *   loses the context after N gl calls.
   *
   * getNumCalls:
   *   tells you how many gl calls there have been so far.
   *
   * setRestoreTimeout:
   *   sets the number of milliseconds until the context is restored
   *   after it has been lost. Defaults to 0. Pass -1 to prevent
   *   automatic restoring.
   *
   * @param {!Canvas} canvas The canvas element to wrap.
   */
  'makeLostContextSimulatingCanvas': makeLostContextSimulatingCanvas,

  /**
   * Resets a context to the initial state.
   * @param {!WebGLRenderingContext} ctx The webgl context to
   *     reset.
   */
  'resetToInitialState': resetToInitialState
};

}();

module.exports = WebGLDebugUtils;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
