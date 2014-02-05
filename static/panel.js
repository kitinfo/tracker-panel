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
	
	updateCategoryDropdowns:function(){
		var drop=gui.elem("cat-selector");
		var adder=gui.elem("add-cat-selector");
		drop.innerHTML="";
		adder.innerHTML="";
		
		var option=gui.build("option","All");
		option.value="all";
		drop.appendChild(option);
		
		option=gui.build("option","New");
		option.value="new";
		drop.appendChild(option);
		
		option=gui.build("option","--add--");
		option.value=0;
		adder.appendChild(option);
		
		tracker.categories.forEach(function(cat){
			option=gui.build("option",cat.name);
			option.value=cat.dbid;
			drop.appendChild(option);
			option=gui.build("option",cat.name);
			option.value=cat.dbid;
			adder.appendChild(option);
		});
	},
	
	updateDetailScreen:function(torrent){
		gui.elem("torrent-name").textContent=torrent.name;
		gui.elem("torrent-name-input").value=torrent.name;
		gui.elem("torrent-name-input").setAttribute("data-dbid",torrent.dbid);
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
		},
		
		createCategoryButton:function(cat){
			var elem=gui.build("span",cat.name+" ","cat-button");
			var link=gui.build("a","[X]");
			link.href="#";
			link.onclick=gui.details.categoryRemoveHandler;
			elem.appendChild(link);
			elem.setAttribute("data-dbid",cat.dbid);
			return elem;
		},
		
		categoryRemoveHandler:function(event){
			//find torrent & category
			torrent=gui.elem("torrent-name-input").getAttribute("data-dbid");
			category=event.target.parentNode.getAttribute("data-dbid");
			//TODO issue remove request
			window.alert("Removing mapping ("+torrent+","+category+")");
			//upon success, kill button
			event.target.parentNode.parentNode.removeChild(event.target.parentNode);
		},
		
		handleCategoryAdd:function(event){
			var drop=gui.elem("add-cat-selector");
			if(drop.selectedIndex!=0){
				var cat=tracker.categoryDBIDtoIndex(drop.selectedIndex);
				if(cat<0){
					tracker.pushStatus("Invalid category selection.");
					return;
				}
				
				//TODO push to db
				
				var button=gui.details.createCategoryButton(tracker.categories[cat]);
				event.target.parentNode.insertBefore(button,event.target);
			}
			else{
				tracker.pushStatus("Invalid category selection.");
			}
			drop.selectedIndex=0;
		}
	}
}

var tracker={
	torrents:[],
	categories:[],
	views:{},
	
	torrentDBIDtoIndex:function(dbid){
		for(var i=0;i<tracker.torrents.length;i++){
			//window.alert(" vs ");
			if(tracker.torrents[i].dbid==dbid){
				return i;
			}
		}
		return -1;
	},
	
	categoryDBIDtoIndex:function(dbid){
		for(var i=0;i<tracker.categories.length;i++){
			//window.alert(" vs ");
			if(tracker.categories[i].dbid==dbid){
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
		var drop=gui.elem("cat-selector");
		var api_arg=(drop.value=="all"||!drop.value)?"":"&cat="+drop.value;
		api.request("torrents"+api_arg,function(data){
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
			gui.updateCategoryDropdowns();
		});
	},
	
	pushStatus:function(text){
		gui.elem("status-text").textContent=text;
	},
	
	modifyTorrentName:function(){
		var input=gui.elem("torrent-name-input");
		var torrent=input.getAttribute("data-dbid");
		var index=tracker.torrentDBIDtoIndex(torrent);
		window.alert("TODO: Change torrent "+torrent+" (index "+index+") name to "+input.value);
		gui.updateDetailScreen(tracker.torrents[index]);
	},
	
	modifyTorrentCategory:function(action, torrent, category){
		//TODO
	},
	
	deleteDisplayedTorrent:function(){
		//TODO issue delete request
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