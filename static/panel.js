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
					tracker.pushStatus("Failed to parse server response");
				}
			}
			else{
				tracker.pushStatus("Server replied with error code");
			}
		},
		function(exc){
			tracker.pushStatus("Failed to connect API ("+exc+")");
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
			
			var options=gui.build("td","","options-column");
			var dllink=gui.build("a","[Download]");
			var detlink=gui.build("a","[Details]");
			
			dllink.href=torrent.file;
			detlink.href="#";
			
			detlink.onclick=function(event){
				gui.updateDetailScreen(torrent);
				tracker.showView("details");
			}
			
			options.appendChild(dllink);
			options.appendChild(detlink);
			row.appendChild(options);
			
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
	},
	
	updateCategoryDropdown:function(){
		var drop=gui.elem("cat-selector");
		drop.innerHTML="";
		
		var option=gui.build("option","All");
		option.value=-2;
		drop.appendChild(option);
		
		var option=gui.build("option","New");
		option.value=-1;
		drop.appendChild(option);
		
		tracker.categories.forEach(function(cat){
			option=gui.build("option",cat.name);
			option.value=cat.dbid;
			drop.appendChild(option);
		});
	},
	
	updateDetailScreen:function(torrent){
		gui.elem("torrent-name").textContent=torrent.name;
		gui.elem("torrent-name-input").value=torrent.name;
		gui.elem("torrent-name").setAttribute("data-dbid",torrent.dbid);
		gui.elem("detail-torrent-hash").textContent=torrent.hash;
		gui.elem("detail-torrent-count").textContent=torrent.count;
		gui.elem("detail-torrent-size").textContent=torrent.size;
		gui.elem("details-download-link").href=torrent.file;
		
		gui.elem("torrent-name").style.display="inline-block";
		gui.elem("torrent-title-edit-link").style.display="inline-block";
		gui.elem("torrent-name-input").style.display="none";
	},
	
	details:{
		editTitle:function(){
			gui.elem("torrent-name").style.display="none";
			gui.elem("torrent-title-edit-link").style.display="none";
			gui.elem("torrent-name-input").style.display="inline-block";
		}
	}
}

var tracker={
	torrents:[],
	categories:[],
	views:{},
	
	torrentDBIDtoIndex:function(dbid){
		for(var i=0;i<tracker.torrents.length;i++){
			if(tracker.torrents.dbid==dbid){
				return i;
			}
		}
		return -1;
	},
	
	init:function(){
		tracker.views["list"]=document.getElementById("view-torrents");
		tracker.views["details"]=document.getElementById("view-details");
		
		tracker.showView("list");
		tracker.loadCategories();
		tracker.loadTorrents();
	},
	
	showView:function(tag){
		for(var key in tracker.views){
			tracker.views[key].style.display="none";
		}
		tracker.views[tag].style.display="block";
	},
	
	loadTorrents:function(){
		//TODO respect filters (default: all)
		//TODO force single instance
		api.request("torrents",function(data){
			tracker.torrents=[];
			data.torrents.forEach(function(elem){
				tracker.torrents.push(new Torrent(elem.id, elem.hash, elem.name, elem.downloaded, elem.file, elem.size));
			});
			gui.table.init();
			gui.updateTrackedCount();
			tracker.pushStatus("OK");
		});
	},
	
	loadCategories:function(){
		api.request("categories",function(data){
			tracker.categories=[];
			data.categories.forEach(function(elem){
				tracker.categories.push(new Category(elem.id, elem.name));
			});
			gui.updateCategoryDropdown();
		});
	},
	
	pushStatus:function(text){
		gui.elem("status-text").textContent=text;
	}
}

function Torrent(dbid, hash, name, completioncount, file, size){
	if(!hash||!name||!dbid){
		return undefined;
	}
	this.dbid=dbid;
	this.hash=hash;
	this.name=name;
	this.count=completioncount;
	this.file=file;
	this.size=size;
}

function Category(dbid, name){
	if(!dbid||!name){
		return undefined;
	}
	this.dbid=dbid;
	this.name=name;
}