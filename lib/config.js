
/**
 * `Config` base class for the Encoder and Decoder classes.
 *
 * @api private
 */

var bindings = require('./bindings')
  , inherits = require('util').inherits
  , Stream = require('stream').Stream


/**
 * Takes care of the PCM data initial frame calculation, and offers an
 * interface for creating and using a `lame_global_config` struct.
 * Not meant for public use.
 */

function Config (opts) {
  Stream.call(this);
  this._opts = opts = opts || {};
  this._gfp = bindings.lame_init();
  this._queue = [];
  this._processing = false;

  this._chunkSize = opts.chunkSize || (64 * 1024);
  this._buffer = new Buffer(this._chunkSize);
  this._offset = 0;

  this.readable = true;
  this.writable = true;

  this.channels = 2;
  this.sampleSize = 16;
  this.sampleRate = 44100;

  // constant: number of 'bytes per sample'
  this.BLOCK_ALIGN = this.sampleSize / 8 * this.channels;

  if (opts) {
    this._initParams(opts);
  }
}
inherits(Config, Stream);
exports.Config = Config;

Config.prototype.pause = function pause () {
  this._paused = true;
  this.emit('pause');
}

Config.prototype.resume = function resume () {
  this._paused = false;
  this._process();
}

Config.prototype._free = function _free (callback) {
  return bindings.lame_close(this._gfp, callback);
}

Config.prototype.getID3v1 = function getID3v1 (buffer, callback) {
  return bindings.lame_get_id3v1_tag(this._gfp, buffer, callback);
}

Config.prototype._initParams = function _initParams () {
  this._init = true;
  return bindings.lame_init_params(this._gfp);
}


Config.prototype.printConfig = function printConfig () {
  return bindings.lame_print_config(this._gfp);
}

Config.prototype.printInternals = function printInternals () {
  return bindings.lame_print_internals(this._gfp);
}

Object.defineProperty(Config.prototype, 'mpegVersion', {
    get: function () {
      if (!this._init) this.initParams();
      return bindings.lame_get_framesize(this._gfp);
    }
});

Object.defineProperty(Config.prototype, 'framesize', {
    get: function () {
      if (!this._init) this.initParams();
      return bindings.lame_get_framesize(this._gfp);
    }
});

Object.defineProperty(Config.prototype, 'bitReservoir', {
    get: function () {
      return bindings.lame_get_bidable_reservoir(this._gfp);
    }
  , set: function (v) {
      var rtn = bindings.lame_set_disable_reservoir(this._gfp, v ? 0 : 1)
    }
});
