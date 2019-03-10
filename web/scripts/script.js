
function init() {  
  try {
    setMail();
    toast = new Toast();
    
    player = new Player();
    player.onError = toast.show;
    
    var holder = document.querySelector('html');
    holder.ondragover = dragover;
    holder.ondrop = drop;
    holder = document.querySelector('#add');
    holder.ondragend = dragend;
    holder.ondragleave = dragend;
    
    var leftRotateBtn = document.querySelector('#rightRotateButton');
    var rightRotateBtn = document.querySelector('#leftRotateButton');
    leftRotateBtn.onmouseover = rotateLeft;
    leftRotateBtn.onmouseout = rotateLeftOver;
    rightRotateBtn.onmouseover = rotateRight;
    rightRotateBtn.onmouseout = rotateRightOver;

    volumeControl = new VolumeControl();
    playlist = new Playlist();
  } catch(e) {
    fallback();
  }
}

function fallback() {
  document.getElementsByTagName("body")[0].className = "bodyFallback";
  document.getElementById("container").className = "containerFallback";
  document.getElementById("fallbackMessage").className = "";
  document.getElementById("howto").className = "fallbackInvisible";
}

function setMail() {
  var one = "mail";
  var two = "sven.to";
  var m = one + "@" + two;
  document.querySelector('#mail').innerHTML = "(<a href=\"mailto:"+m+"\">"+m+"</a>)";
}

window.onload = init;

/***** Rotation *****/

var rotateTimeout;

function rotateRight() {
  playlist.rotate(-1);
  rotateTimeout = window.setTimeout(rotateRight, 1000);
}

function rotateRightOver() {
  window.clearTimeout(rotateTimeout);
}

function rotateLeft() {
  playlist.rotate(+1);
  rotateTimeout = window.setTimeout(rotateLeft, 1000);
}

function rotateLeftOver() {
  window.clearTimeout(rotateTimeout);
}

/***** Dragging *****/ 

function dragover() {
  document.querySelector('#add').classList.add('addVisible');
  return false;
}

function dragend() {
  document.querySelector('#add').classList.remove('addVisible');
  document.querySelector('#add').classList.remove('addFinish');
  return false;
}

function drop(e) {
  document.querySelector('#add').classList.add('addFinish');
  window.setTimeout(dragend, 1000);
  e.preventDefault();

  playlist.addFiles(e.dataTransfer.files);

  return false;
}
 
/**
 * 
 */
function VolumeControl() {
  var startX;
  var startLeft;
  const MAX = 80;
  var sliderDiv = document.querySelector('#frontControls > #bar > #slider');
  
  init();
  
  function init() {
    sliderDiv.onmousedown = startVolumeControl;
    sliderDiv.onmouseup = stopVolumeControl;
    sliderDiv.style.left = MAX;
  }

  function startVolumeControl(event) {
    startPos = event.x;
    startLeft = parseInt(sliderDiv.style.left.replace("px",""));
    sliderDiv.onmousemove = volumeControlMouseMove;
  }

  function stopVolumeControl() {
    sliderDiv.onmousemove = null;
  }

  function volumeControlMouseMove(event) {
    
    var newLeft = startLeft + event.x - startPos;
    if(newLeft > MAX) {
      newLeft = MAX;
    } else if(newLeft < 0) {
      newLeft = 0;
    }
    sliderDiv.style.left = newLeft;
    player.setVolume(newLeft/MAX);
  }
}



/**
 * 
 * @returns {Playlist}
 */
function Playlist() {
  const MAX_TRACKS = 12;
  var degreePerTrack = 30;
  var tracks = new Array(MAX_TRACKS);
  var currentTrack = null;
  var frontTrackNumber = 0; 
  var onRotation = false;
  
  var musicTracksDivName = '#musicTracks';
  var musicTracksDiv = document.querySelector(musicTracksDivName);
  
  initTracks();
  
  this.addFiles = function(files) {
    for(var i = 0; i < files.length; i++)
    {
      var file = files[i];
      var addMore = this.addFile(file);
      if(!addMore) break;
    }
  };
  
  /**
   * Adds a File to the Playlist
   * @returns {Boolean} Can add more?
   */
  this.addFile = function(file) {
    var i = -1;
    while(tracks[++i] != undefined)
    {
      if(i+1 == MAX_TRACKS) {
        toast.show("Can't add file \""+file.name+"\" to playlist because the playlist is full.<br/> Please remove some tracks.");
        return false;
      }
    }
    
    if(canPlayType(file))
    {
      tracks[i] = new MusicFile(file, i);  
      if(currentTrack == null) {
        tracks[i].play();
      }
    } else {
      toast.show("This file format isn't support by your browser. Please add only audio files.");
    }
    
    return true;
  };
  
  this.setCurrentTrack = function(newTrack) {
    if(currentTrack != null) {
      currentTrack.stopped();
    }
    currentTrack = newTrack;
  };
  
  
  this.rotate = rotate;
  
  this.nextTrack = nextTrack;
  
  this.removeTrack = function(track) {
    tracks[track.getPlaylistIndex()] = undefined;
    if(currentTrack ==  track) {
      player.stop();
      player.onStop = null;
      nextTrack();
    }
  };
  
  /***** Private Methods *****/
  
  function nextTrack() {
    var last = currentTrack.getPlaylistIndex();
    
    for(i = 1; i <= MAX_TRACKS; i++) {
      var next = (last+i)%MAX_TRACKS;
      var nextTrack = tracks[next];
      
      if(nextTrack != undefined) {
        if(last == frontTrackNumber) {
          // Rotate to next track
          rotate(i);
        }
        
        nextTrack.play();
        return;
      }
    }
    currentTrack = null;
    toast.show("Nothing to play, please add some songs. ;-)");
  }
  
  function rotate(relativeNumber) {
    newFrontTrackNumber = frontTrackNumber+relativeNumber;

    // Stay in 0 < x < 360 deg
    // But the playlist should only rotate +/-30deg, 
    // so the old frontTrackNumber must change before
    if(newFrontTrackNumber < 0) {
      newFrontTrackNumber += 12;
      frontTrackNumber = newFrontTrackNumber - relativeNumber;
    } else if(newFrontTrackNumber >= MAX_TRACKS) {
      newFrontTrackNumber = newFrontTrackNumber%12;
      frontTrackNumber = newFrontTrackNumber - relativeNumber;
    }
    
    setFrontTrack(newFrontTrackNumber);
  }
  
  function initTracks()
  {
    var base = document.querySelector(musicTracksDivName + ' > .trackBase');
    for(var i = 0; i < MAX_TRACKS; i++) {
      var newTrack = base.cloneNode(true);
      newTrack.setAttribute("style", "transform: rotateY("+i*degreePerTrack+"deg) translateZ(600px);");
      newTrack.setAttribute("data-tracknumber", i);
      //newTrack.onclick = rotateToTrack; // onmouseover <- TODO: implement?
      musicTracksDiv.appendChild(newTrack);
    }
  }
  
  function rotateToTrack(event) {
    // TODO: Implement correctly
    var trackNumber = parseInt(event.target.getAttribute("data-tracknumber"));
    setFrontTrack(trackNumber);
  }
  
  function canPlayType(file) {
    var audioTag = document.createElement('audio');
    return audioTag.canPlayType(file.type);
  }
  
  function setFrontTrack(newFrontTrackNumber) {
    // If rotating, simply do nothing.
    if(onRotation) return false;
    onRotation = true;
    var keyFrames = findKeyFramesRule("rotateMusicTracks");
    var startPos = -1 * frontTrackNumber * degreePerTrack;
    var endPos = -1 * newFrontTrackNumber * degreePerTrack;
    replaceKeyFramesRule(keyFrames, "0%", "transform: rotateY("+startPos+"deg);");
    replaceKeyFramesRule(keyFrames, "100%", "transform: rotateY("+endPos+"deg);");
    
    musicTracksDiv.classList.add("rotateMusicTracks");
    musicTracksDiv.setAttribute("style", "transform: rotateY("+endPos+"deg)");
    // Remove class before animation next animation starts
    window.setTimeout(removeAnimationClass, 999);
    
    frontTrackNumber = newFrontTrackNumber;
  }
  
  function removeAnimationClass(event) {
    musicTracksDiv.classList.remove("rotateMusicTracks");
    onRotation = false;
  }  
}




function MusicFile(file, index) {
  var self = this;
  var divSelector = '#musicTracks > .trackBase';
	var div = document.querySelectorAll(divSelector)[index+1];
	var divText = document.querySelectorAll(divSelector + ' > .text')[index+1];
	var divPlaybackControl = document.querySelectorAll(divSelector + ' > .playbackControl')[index+1];
	var divRemoveControl = document.querySelectorAll(divSelector + ' > .remove')[index+1];
	var divCanvas = document.querySelectorAll(divSelector + ' > canvas')[index+1];
	var url = file.urn ||file.name;
	var title = fileNameWithoutExtension(file.name || file.fileName);
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
    divText.setAttribute("style","animation: progressBar "+duration+"s 1 linear;");
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
    divText.setAttribute("style","animation: progressBar "+toPlay+"s 1 linear;");
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
	
	function loadTags() {
		var reader = FileAPIReader(file);
	    ID3.loadTags(url, setTags,
	    {tags: ["artist", "title", "album", "year", "comment", "track", "genre", "lyrics", "picture"],
	     dataReader: reader});
	}
}
