/**
 * @param player {Player}
 * @author Sven Nobis
 */
function PlayList(player) {
  const START_ON_FIRST_ADD = true;
  const MAX_TRACKS = 12;
  
  const MSG_PLAYLIST_FULL = "Can't add file \"{0}\" to playlist because the playlist is full.<br/> Please remove some tracks.";
  
  var self = this;
  var tracks = new Array();
  var shuffleOn = false;
  
  /***** Events Methods *****/
  this.onAdd = null;
  this.onRemove = null;
  
  /***** Public Methods *****/ 
  this.add = add;
  this.remove = remove;
  this.count = count;
  this.getPlayer = function() { return self.player; };
  this.shuffle = function(shuffleOn) { self.shuffleOn = shuffleOn; }
  this.repeat = null; // TODO:
  
  /***** Private Methods *****/
  
  /**
   * @param file {File} 
   */
  function add(file) {
    var track = newTrack(file);
    tracks.push(track);
    
    raiseEvent(onAdd, { track: track });
    
    return track;
  }
  
  function remove(id) {
    
  }
  
  /**
   * Number of tracks in playlist
   * @returns {Number}
   */
  function count() {
    return tracks.length;
  }
}

/**
 * 
 * @param file {File}
 * @param player {Player}
 */
function Track(file, player) {
  this.prototype = EventSystem;
  
  const MSG_NOTSUPPORTED = "The file format of \"{0}\" isn't support by your browser. Please add only audio files.";
  const TXT_UNKOWNARTIST = "Unkown Artist";
  
  self = this;
  var url = file.urn ||file.name;
  var title = fileNameWithoutExtension(url);
  
  init();
  
  /***** Events Methods *****/
  this.onPlay = new EventSource();
  this.onPause = new EventSource();
  this.onStop = new EventSource();
  this.onRemove = new EventSource(); // TODO: ?
  this.onPlayed = new EventSource();
  this.onTagsLoaded = new EventSource();
  
  /***** Public Methods *****/ 

  this.play = play;
  this.areTagsLoaded = function() { return self.getTags() != null; };
  this.getTags = function() { return ID3.getAllTags(url); };
  this.getTitle = function() { return title; };
  
  /***** Private Methods *****/
  
  function play() {
    player.play(file);
    player.onPlay.register(startedPlaying);
    onPlay.raise({ started: false, track: self });
  }
  
  function startedPlaying(args) {
    onPlay.raise({ started: true, track: self, duration: args.duration });
  }
  
  function stopped(args) {
    onStop.raise({ endOfTrack: args.endOfTrack, track: self });
  }
  
  function init() {
    if(!canPlayType(file)) {
      throw(MSG_NOTSUPPORTED.format(title));
    }
    
    loadTags();
  }
  
  function canPlayType(file) {
    var audioTag = document.createElement('audio');
    return audioTag.canPlayType(file.type);
  }
  
  function loadTags() {
    var reader = FileAPIReader(file);
      ID3.loadTags(url, setTags,
      {tags: ["artist", "title", "album", "year", "comment", "track", "genre", "lyrics", "picture"],
       dataReader: reader});
  }
  
  function tagsLoaded() {
    var tags = self.getTags();
    title = (tags.artist || TXT_UNKOWNARTIST) + " - " + tags.title;
    onTagsLoaded.raiseEvent({ sender: self, tags: tags });
  }
}