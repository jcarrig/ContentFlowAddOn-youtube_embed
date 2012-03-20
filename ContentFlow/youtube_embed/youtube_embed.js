/* embed code starts here 
-------------------------------*/
function unLoadVideo() {
	if(ytplayer) {
		ytplayer.stopVideo();
		ytplayer.clearVideo();
		$(ytplayer).remove();
	}
}

function onPlayerError(errorCode) {
  alert("An error occured of type:" + errorCode);
}

function onYouTubePlayerReady(playerId) {	
  ytplayer = document.getElementById("ytPlayer");
  ytplayer.addEventListener("onError", "onPlayerError");
}

function loadPlayer(myvideo_id) {
	var params = { wmode: "transparent", allowScriptAccess: "always" };
	var atts = { 'id': 'ytPlayer','class': myvideo_id };
	swfobject.embedSWF("http://www.youtube.com/v/" + myvideo_id +"?enablejsapi=1&playerapiid=player1&version=3&autoplay=1&showinfo=0&rel=0","embed-"+myvideo_id, "480", "295", "8", null, null, params, atts);	
}







