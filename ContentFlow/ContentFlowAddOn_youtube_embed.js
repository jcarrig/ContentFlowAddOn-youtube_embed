/*  ContentFlowAddOn_youtube, version 1.0 
 *  (c) 2010 Jack Carrig
 *
 *  This file is distributed under the terms of the MIT license.
 *  (see http://www.jacksasylum.eu/ContentFlow/LICENSE)
 */


new ContentFlowAddOn ('youtube_embed', {
	
    init: function () {
		var youtube_embedBaseDir = this.scriptpath+"youtube_embed/";
        this.addScript(youtube_embedBaseDir+"youtube_embed.js");
		this.addScript("http://code.jquery.com/jquery-1.7.1.min.js");
		this.addScript(youtube_embedBaseDir+"swfobject/swfobject.js");
		this.addScript(youtube_embedBaseDir+"youtube_embed_provider.js");
		this.addStylesheet(youtube_embedBaseDir+"youtube_embed.css");
	},
	
	/* 
     * This method will be executed for each ContentFlow on the page after the
     * HTML document is loaded (when the whole DOM exists). You can use it to
     * add elements automatically to the flow.
     *
     * flow:                the DOM object of the ContentFlow
     * flow.Flow:           the DOM object of the 'flow' element
     * flow.Scrollbar:      the DOM object of the 'scrollbar' element
     * flow.Slider:         the DOM object of the 'slider' element
     * flow.globalCaption:  the DOM object of the 'globalCaption' element
     *
     * You can access also all public methods of the flow by 'flow.METHOD' (see documentation).
     */
    onloadInit: function (flow) {
    },

    /* 
     * This method will be executed _after_ the initialization of each ContentFlow.
     */    
    afterContentFlowInit: function (flow) {
		
		//check if params from url
		var params = (function getQueryParams(url){
			var urlQ = url.split('?');
			if (urlQ.length < 2)
				return {};
			var query = urlQ[1]
			var pairs = query.split('&');
			var retval = {};
			var check = [];
			for( var i = 0; i < pairs.length; i++ ){
				check = pairs[i].split('=');
				retval[decodeURIComponent(check[0])] = decodeURIComponent(check[1]);
			}
			if (retval.size)
				retval.size = parseInt(retval.size);
			return retval;
		})(window.location.search);
		
		//load video player
		var loadvideos = function(youtubeProvider){
			if(youtubeProvider.sortVideos('desc','uploaded')){
				if(youtubeProvider.addItems('itemContainer')){
					$('#itemContainer .item').each(function(){flow.addItem(this,'last');});
					$('#loadPlaceholder').fadeOut('fast');
					$(flow.Container).fadeIn('normal',function(){
						flow.resize();
					});
					//load video from params if exist
					if (params.vid){
						var el = $('#' + params.vid);
						if (el.length > 0)
							flow.moveTo(el.parent()[0]);
					}
				}
			}
		}(youtubeProvider);
    },
	
	
	ContentFlowConf: {
		ytvid: null,
		ytembed: function (item){
			var ytvid = this.conf.ytvid;
			$('.item.active')
				.addClass('item-'+this.conf.ytvid);
			$('#ytContainer').append('<div id="embed-'+this.conf.ytvid+'"></div>');
			if(!this.Browser.IE){
				$('.item.active canvas').fadeOut('normal',function(){
					loadPlayer(ytvid);
				});
			}else{
				$('.item.active img').fadeOut('normal',function(){
					loadPlayer(ytvid);
				});
				if(this.Browser.IE7)
					$('.item img').css('visibility','hidden');
			}
			$(this.Scrollbar).addClass('off');
			$(this.Slider).addClass('off');
		},
		
		ytclear: function(item){
			unLoadVideo();
			if(!this.Browser.IE)
				$('canvas#'+item.content.id).fadeIn();//.offsetParent().removeClass('item-'+item.content.id);
			else{
				$('.item-'+item.content.id+' img').fadeIn();
				if(this.Browser.IE7)
						$('.item img').css('visibility','visible');
			}
			$('.item-'+item.content.id).removeClass('item-'+item.content.id);
			this.setConfig( { ytvid : null } );	
			$(this.Scrollbar).removeClass('off');
			$(this.Slider).removeClass('off');
		},
		
		alreadyActive: function(item){
			if(this.conf.ytvid != null){
				var activeCheck = this.getActiveItem();
				if(this.conf.ytvid == activeCheck.content.id);
					return true;
			}
			return false;	
		},
		
		stopflow: function(item){
			this.setConfig({
				flowSpeedFactor: 0,           // how fast should it scroll?
        		flowDragFriction: 0,          // how hard should it be be drag the floe (0 := no dragging)
        		scrollWheelSpeed: 0,          // how fast should the mouse wheel scroll. nagive values will revers the scroll direction (0:= deactivate mouse wheel)
        		keys: {}
			});
		},
		
		startflow: function(item){
			this.setConfig({
				flowSpeedFactor: 1.0,           // how fast should it scroll?
        		flowDragFriction: 1.0,          // how hard should it be be drag the floe (0 := no dragging)
        		scrollWheelSpeed: 0,          // how fast should the mouse wheel scroll. nagive values will revers the scroll direction (0:= deactivate mouse wheel)
        		keys: {                         // key => function definition, if set to {} keys ar deactivated
            		13: function () { this.conf.onclickActiveItem(this._activeItem) },
            		37: function () { this.moveTo('pre') }, 
            		38: function () { this.moveTo('visibleNext') },
            		39: function () { this.moveTo('next') },
            		40: function () { this.moveTo('visiblePre') }
        		}
			});
		},
		
		onMakeActive: function (item) {
			$('.video-bottom a.video-link').attr({'href':'http://www.youtube.com/watch?v='+$(this._activeItem.item).data('vid'),'target':'_blank'});
			$('.video-bottom h3').html($(this._activeItem.item).data('title'));
			$('.video-bottom p').html($(this._activeItem.item).data('description'));
		},
		
		onMakeInactive: function (item) {
			if(this.conf.ytvid == item.content.id)
				this.conf.ytclear(item);
		},
		
        onclickInactiveItem: function (item) {
			this.conf.startflow();
        },

        onclickActiveItem: function (item) {
			if(!this.conf.alreadyActive()){
				this.conf.stopflow();
				this.setConfig( { ytvid : item.content.id } );
				this.conf.ytembed();
			}
        },
		
        onclickPreButton: function (event) {
            this.conf.startflow();
			this.moveToIndex('pre');
            Event.stop(event);
        },
        
        onclickNextButton: function (event) {
            this.conf.startflow();
			this.moveToIndex('next');
            Event.stop(event);
        },
		
		//startItem:  "center",           // which item should be shown on startup?
	    //scrollInFrom: "pre",
		flowSpeedFactor: 1.0,           // how fast should it scroll?
		flowDragFriction: 1.0,          // how hard should it be be drag the floe (0 := no dragging)
		scrollWheelSpeed: 0,          // how fast should the mouse wheel scroll. nagive values will revers the scroll direction (0:= deactivate mouse wheel)
		keys: {                         // key => function definition, if set to {} keys ar deactivated
    		13: function () { this.conf.onclickActiveItem(this._activeItem) },
    		37: function () { this.moveTo('pre') }, 
    		38: function () { this.moveTo('visibleNext') },
    		39: function () { this.moveTo('next') },
    		40: function () { this.moveTo('visiblePre') }
		}
    }

});
