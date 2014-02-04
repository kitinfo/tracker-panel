var tracker={
	views:{},
	
	init:function(){
		tracker.views["list"]=document.getElementById("view-torrents");
		tracker.views["details"]=document.getElementById("view-details");
		
		tracker.showView("list");
	},
	
	showView:function(tag){
		for(var key in tracker.views){
			tracker.views[key].style.display="none";
		}
		tracker.views[tag].style.display="block";
	}
}