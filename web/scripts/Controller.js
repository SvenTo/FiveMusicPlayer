function TrackController(track) {
  var self = this;
  var divSelector = '#musicTracks > .trackBase';
  var div = document.querySelectorAll(divSelector)[index+1];
  var divText = document.querySelectorAll(divSelector + ' > .text')[index+1];
  var divPlaybackControl = document.querySelectorAll(divSelector + ' > .playbackControl')[index+1];
  var divRemoveControl = document.querySelectorAll(divSelector + ' > .remove')[index+1];
  var divCanvas = document.querySelectorAll(divSelector + ' > canvas')[index+1];
  var url = file.urn ||file.name;
  var title = fileNameWithoutExtension(file.fileName);
  var stoppedTimeout = null;
  var startedTime = null;
  var playlistIndex = index;
  
  init();
  
  /***** Public Methods *****/

  this.play = play;
  
  this.stopped = stopped;
  
  this.getPlaylistIndex = function() { return playlistIndex; }
  
  /***** Private Methods *****/
  
  function init() {
    divText.innerText = title;
    div.classList.add('track');
    div.classList.remove('placeholder');
    divPlaybackControl.onclick = play;
    divRemoveControl.onclick = remove;
    
    loadTags(file);
    clearCanvas();
  }
  
  function play() {
    playlist.setCurrentTrack(self);
    divPlaybackControl.onclick = playPause;
    divPlaybackControl.title = "Pause";
    player.onPlay = playerStartPlaying;
    player.onEndOfTrack = endOfTrack;
    player.onPause = playerSetPause;
    player.onResume = playerSetResume;
    player.setCanvas(divCanvas);
    player.play(file);
    toast.show("Now Playing: "+title);
  }
  
  /**
   * Track was stopped (on end or because a other track should played)
   */
  function stopped() {
    divPlaybackControl.onclick = play;
    divPlaybackControl.title = "Play";
    divText.classList.remove("progressBar");
    divText.setAttribute("style", "");
    clearCanvas();
  }
  
  /**
   * Track has ended, play next song
   */
  function endOfTrack() {
    stopped();
    playlist.nextTrack();
  }
  
  function playerStartPlaying(duration) {
    var keyFrames = findKeyFramesRule("progressBar");
    replaceKeyFramesRule(keyFrames, "0%", "background-size: auto 0px;");
    
    duration = Math.round(duration);
    divText.classList.add('progressBar');
    divText.setAttribute("style","-webkit-animation: progressBar "+duration+"s 1 linear;");
  }
  
  function playerSetPause(duration, playedDuration) {
    var progressWidth = Math.round(playedDuration/duration*300);
    divText.setAttribute("style","background-size: auto "+progressWidth+"px;");
  }
  
  function playerSetResume(duration, playedDuration) {
    var progressWidth = Math.round(playedDuration/duration*300);
    var keyFrames = findKeyFramesRule("progressBar");
    replaceKeyFramesRule(keyFrames, "0%", "background-size: auto "+progressWidth+"px;");
    
    var toPlay = Math.round(duration-playedDuration);
    divText.setAttribute("style","-webkit-animation: progressBar "+toPlay+"s 1 linear;");
  }
  
  function playPause() {
    if(player.isPlaying()) {
      player.pause();
      divPlaybackControl.title = "Play";
    } else {
      player.play();
      divPlaybackControl.title = "Pause";
    }
  }
  
  function remove() {
    playlist.removeTrack(self);

    divText.innerText = "";
    div.classList.add('placeholder');
    div.classList.remove('track');
    divText.classList.remove('progressBar');
    divPlaybackControl.onclick = null;
    divRemoveControl.onclick = null;
    div.style.backgroundImage = null;
    clearCanvas();
  }
  
  function clearCanvas() {
    try {
      divCanvas.getContext('2d').clearRect(0, 0, divCanvas.width, divCanvas.height);
    } catch(e) {
    }
  }
  
  function setTags() {
    var tags = ID3.getAllTags(url);
    
    if(tags.title != undefined) {
      divText.innerHTML = tags.title+"<br />"+(tags.artist || "");
      title = (tags.artist || "Unkown Artist") + " - " + tags.title;
    }
    if( "picture" in tags ) {
    var image = tags.picture;
    div.style.backgroundImage = 
      "url('data:" + image.format + ";base64," + Base64.encodeBytes(image.data)+"')";
    } else {
        // Do nothing because default picture is shown?
    }
  }
}