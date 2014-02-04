var api={
	url:"db.php?",
	
	request:function(argument,completionfunc){
		ajax.asyncGet(api.url+argument,function(request){
			if(request.status==200){
				try{
					var data=JSON.parse(request.responseText);
					completionfunc(data);
				}
				catch(e){
					//todo display parse errors
				}
			}
			else{
				//todo display server error
			}
		},
		function(exc){
			//todo display api errors
		});
	}
}

var gui={
	elem:function(id){
		return document.getElementById(id);
	},
	
	build:function(tag, text, classname){
		var elem=document.createElement(tag);
		
		if(text){
			elem.textContent=text;
		}
		
		if(classname){
			elem.className=classname;
		}
		
		return elem;
	},
	
	table:{
		elem:undefined,
		
		kill:function(){
			gui.table.elem.innerHTML="";
		},
		
		insertHeaders:function(){
			var headRow=gui.build("tr");
			headRow.appendChild(gui.build("th","Name","name-column"));
			headRow.appendChild(gui.build("th","Downloads","dlcount-column"));
			headRow.appendChild(gui.build("th","Options","options-column"));
			gui.table.elem.appendChild(headRow);
		},

		insertRow:function(torrent){
			var row=gui.build("tr");
			row.appendChild(gui.build("td",torrent.name,"name-column"));
			row.appendChild(gui.build("td",torrent.count,"dlcount-column"));
			row.appendChild(gui.build("td","[Download] [Details]","options-column"));
			gui.table.elem.appendChild(row);
		},
		
		init:function(){
			gui.table.elem=gui.elem("torrent-table");
			gui.table.kill();
			gui.table.insertHeaders();
			tracker.torrents.forEach(function(torrent){
				gui.table.insertRow(torrent);
			});
		}
	},
	
	updateTrackedCount:function(){
		gui.elem("torrent-count").textContent=tracker.torrents.length;
	}
}

var tracker={
	torrents:[],
	views:{},
	
	init:function(){
		tracker.views["list"]=document.getElementById("view-torrents");
		tracker.views["details"]=document.getElementById("view-details");
		
		tracker.showView("list");
		tracker.loadTorrents();
		gui.table.init();
	},
	
	showView:function(tag){
		for(var key in tracker.views){
			tracker.views[key].style.display="none";
		}
		tracker.views[tag].style.display="block";
	},
	
	loadTorrents:function(){
		api.request("torrents",function(data){
			tracker.torrents=[];
			data.torrents.forEach(function(elem){
				tracker.torrents.push(new Torrent(elem.id, elem.hash, elem.name, elem.description, elem.downloaded, elem.file));
			});
			gui.table.init();
			gui.updateTrackedCount();
		});
	}
}

function Torrent(dbid, hash, name, desc, completioncount, file){
	if(!hash||!name||!dbid){
		return undefined;
	}
	this.dbid=dbid;
	this.hash=hash;
	this.name=name;
	this.desc=desc;
	this.count=completioncount;
	this.file=file;
}