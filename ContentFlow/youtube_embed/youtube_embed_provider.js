/*  youtube_embed_provider.js
 */


Date.prototype.setISO8601 = function(dString){
	var regexp = /(\d\d\d\d)(-)?(\d\d)(-)?(\d\d)(T)?(\d\d)(:)?(\d\d)(:)?(\d\d)(\.\d+)?(Z|([+-])(\d\d)(:)?(\d\d))/;
	if (dString.toString().match(new RegExp(regexp))) {
		var d = dString.match(new RegExp(regexp));
		var offset = 0;
		this.setUTCDate(1);
		this.setUTCFullYear(parseInt(d[1],10));
		this.setUTCMonth(parseInt(d[3],10) - 1);
		this.setUTCDate(parseInt(d[5],10));
		this.setUTCHours(parseInt(d[7],10));
		this.setUTCMinutes(parseInt(d[9],10));
		this.setUTCSeconds(parseInt(d[11],10));
		if (d[12])
			this.setUTCMilliseconds(parseFloat(d[12]) * 1000);
		else
			this.setUTCMilliseconds(0);
		if (d[13] != 'Z') {
			offset = (d[15] * 60) + parseInt(d[17],10);
			offset *= ((d[14] == '-') ? -1 : 1);
			this.setTime(this.getTime() - offset * 60 * 1000);
		}
	}
	else {
		this.setTime(Date.parse(dString));
	}
	return this;
};

var youtubeProvider = {
	container: null,
	user: null,
	playlist: new Array,
	video: new Array,

	init : function(username) {
		if(username == null) return false;
		this.user = username;
		var self = this;
		//Build Feed URL
		var purl = 'http://gdata.youtube.com/feeds/api/users/'+self.user+'/playlists?v=2&alt=json&format=5&callback=?';
		// AJAX request the API
		$.getJSON(purl, function(data){
			var feed = data.feed, entries = feed.entry || [];
			while(entries.length){
				var entry = entries.shift();
				self.playlist.push({
					'pid': entry.yt$playlistId.$t,
					'src': entry.content.src,
					'title': entry.title.$t,
					'summary': entry.summary.$t,
					'vidcount': entry.yt$countHint.$t
				});
			}
			for(var i in self.playlist){
				var pl = self.playlist[i];
				var vurl = pl.src+'&alt=json&format=5&callback=?';
				$.getJSON(vurl, function(data){
					var feed = data.feed, entries = feed.entry || [];
					while(entries.length){
						var entry = entries.shift();
						var preload = new Image();
						preload.src = entry.media$group.media$thumbnail[4].url;
						self.video.push({
							'pid': feed.yt$playlistId.$t,
							'vid': entry.media$group.yt$videoid.$t,
							'img': preload,
							'title': entry.media$group.media$title.$t,
							'description': entry.media$group.media$description.$t,
							'uploaded': self.getUnixUploaded(entry.media$group.yt$uploaded.$t),
							'viewcount': parseInt(entry.yt$statistics.viewCount)
						});
					}
				});
			}
		});
	},
	
	addItems: function(element, max){
		var self = this;
		if((element == null) || (document.getElementById(element) == null)) return false;
		self.container = document.getElementById(element);
		if(max == null)
			max = self.video.length;
		if(self.container != null){
			for(var i = 0; i < max; i++){
				var ve = self.video[i];
				var itemToAdd = $(document.createElement("div")).attr({'class':'item'}).data({'title':ve.title,'description':ve.description,'vid':ve.vid})
					.append($(ve.img).attr({'id':ve.vid,'class':'content'})).appendTo(self.container);
			}
			return true;
		}
		return false;
	}, 
	
	getUnixUploaded: function($t){
		return Math.round(new Date().setISO8601($t).getTime() / 1000);
	},
	
	sortVideos: function(order,attr){
		var self = this;
		var delta = 1;
		if(order == 'desc')
			delta = -1;
		self.video.sort(function(a,b){
			if(a[attr] < b[attr])
				return (-1 * delta);
			if(a[attr] > b[attr])
				return (1 * delta);
			return 0;	
		});
		return true;
	}
	
};

youtubeProvider.init(youtube_embed_config.user);