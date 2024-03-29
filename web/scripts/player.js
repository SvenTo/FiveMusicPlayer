/**
 * 
 * @author Sven Nobis
 * @returns {Player}
 */
function Player() {
  const fadeTime = 1;
  
  var self = this;
  var context;
  var source = null;
  var volumeGainNode = null;
  /**
   * Fading in and out 
   */
  var fadeGainNode = null;
  var analyser = null;
  var playing = false;
  var startTime;
  var pausedTime;
  var endOfTrackTimeout = null;
  /**
   * If the music player should stop before start playing
   */
  var canStart = false;
  var canvas = null;
  var canvasCtx = null;
  var frameRequest = null;
  init();
  
  /***** Events *****/
  this.onError = null;
  this.onPlay = null;
  this.onPause = null;
  this.onResume = null;
  this.onEndOfTrack = null;
  
  /***** Public Methods *****/
  this.play = play;
  this.isPlaying = isPlaying;
  this.isLoaded = isLoaded;
  this.stop = stop;
  this.pause = pause;
  this.setCanvas = setCanvas;
  this.setVolume = setVolume;
  
  /***** Private Methods *****/
  
  function play(file) {
    if(file instanceof File) {
      stop();
      canStart = true;
      var reader = new FileReader();
      reader.onload = decodeAndPlay;
      reader.readAsArrayBuffer(file); 
    } else {
      if(isLoaded()) {
        var currTime = context.currentTime;
        // Cancel possible fade out
        source.playbackRate.cancelScheduledValues(currTime);
        fadeGainNode.gain.cancelScheduledValues(currTime);
        
        source.playbackRate.setValueAtTime(1, currTime);
        // Fade in
        fadeGainNode.gain.linearRampToValueAtTime(fadeGainNode.gain.value, currTime);
        fadeGainNode.gain.linearRampToValueAtTime(1, currTime + fadeTime);
        
        var pauseDuration = currTime - pausedTime;
        var backset = 0;
        if(pauseDuration < 0) { // if play is pressed directly after pause
          backset = pauseDuration;
          pauseDuration = 0;
        }
        var playedDuration = pausedTime - startTime + backset;
        startTime = startTime+pauseDuration; // Adjust StartTime
        endOfTrackTimeout = window.setTimeout(endOfTrack,
            (source.buffer.duration - playedDuration) * 1000);
        playing = true;
        raiseEvent(self.onResume, source.buffer.duration, playedDuration);
      }
    }
  };
  
  function isPlaying() {
    return isLoaded() && playing;
  };
  
  function isLoaded() {
    return source != null;
  };
  
  
  function stop()
  {
    canStart = false;
    
    if(isLoaded()) {
      pause();
      oldSource = source;
      oldFadeGainNode = fadeGainNode;
      oldAnalyser = analyser;
      window.setTimeout(function() { 
        oldFadeGainNode.disconnect(0);
        oldSource.disconnect(0);
        oldAnalyser.disconnect(0);
        window.cancelAnimationFrame(frameRequest); // TODO: onPause?
      }, fadeTime * 1000);
      source = null;
      fadeGainNode = null;
      analyser = null;
      endOfTrackTimeout = null;
    }
  };
  
  function pause() {
    var currTime = context.currentTime;
    // Cancel possible fade in
    source.playbackRate.cancelScheduledValues(currTime);
    fadeGainNode.gain.cancelScheduledValues(currTime);
    // Fade out
    fadeGainNode.gain.linearRampToValueAtTime(fadeGainNode.gain.value, currTime);
    fadeGainNode.gain.linearRampToValueAtTime(0, currTime + fadeTime);
    source.playbackRate.setValueAtTime(0, currTime + fadeTime);
    playing = false;
    pausedTime = currTime +2;
    window.clearTimeout(endOfTrackTimeout);
    var playedDuration = currTime - startTime;
    raiseEvent(self.onPause, source.buffer.duration, playedDuration);
  };
  
  function decodeAndPlay(e) {
    context.decodeAudioData(e.target.result, playBuffer, error);
  };
  
  function playBuffer(buffer) {
    _canStart = canStart; // stop set canStart to false
    stop();
    if(!_canStart) return;
    source = context.createBufferSource();
    source.buffer = buffer;
    fadeGainNode = context.createGain();
    analyser = context.createAnalyser();
    analyser.connect(volumeGainNode);
    fadeGainNode.connect(analyser);
    source.connect(fadeGainNode);
    source.start();
    playing = true;
    startTime = context.currentTime;
    endOfTrackTimeout = window.setTimeout(endOfTrack, buffer.duration * 1000);
    raiseEvent(self.onPlay, buffer.duration);
    processFDRendering();
  }
  
  function setVolume(volume) {
    volumeGainNode.gain.setValueAtTime(volume, context.currentTime);
  }
  
  function error(e) {
    if(self.onError instanceof Function) {
      self.onError(e);
    }
  }
  
  function endOfTrack()
  {
    raiseEvent(self.onEndOfTrack);
  }
  
  function raiseEvent(event, args1, args2, args3) {
    if(event instanceof Function) {
      event(args1, args2, args3);
    }
  }
  
  function setCanvas(canvasElement) {
    canvas = canvasElement;
    canvasCtx = canvas.getContext('2d');
  }
  
  function initProcessFDRendering() {
    processFDRendering();
  }
  
  function processFDRendering() {
    renderFrequencyData();
    frameRequest = window.requestAnimationFrame(processFDRendering);
  }
  
  function renderFrequencyData(time) {
    if(canvas != null && canvasCtx != null && analyser != null) {
      var freqByteData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqByteData);
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.fillStyle = "rgba(0, 0, 0, 0.4)";
      const add = Math.floor(analyser.frequencyBinCount/(300/6));
      const height = canvas.height;
      
      canvasCtx.beginPath();
      canvasCtx.moveTo(0,256);
      x = 0;
      for (var i = 0; i < canvas.width+8; i+=8) {
        canvasCtx.lineTo(i, height-freqByteData[x]);
        x += add;
      }
      canvasCtx.lineTo(canvas.width,height);
      canvasCtx.lineTo(0,height);
      
      canvasCtx.fill();
    }
  }
  
  function init() {
    try {
      context = new (window.AudioContext || window.webkitAudioContext)();
      volumeGainNode = context.createGain();
      volumeGainNode.connect(context.destination);
    }
    catch(e) {
      throw('Web Audio API is not supported in this browser.');
    }
  }
}
