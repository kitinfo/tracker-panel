var api={
	url:"db.php?",
	
	request:function(argument, completionfunc){
		ajax.asyncGet(api.url+argument,function(request){
			if(request.status==200){
				try{
					var data=JSON.parse(request.responseText);
					completionfunc(data);
				}
				catch(e){
					tracker.pushStatus("Failed to parse server response ("+e+")");
				}
			}
			else{
				tracker.pushStatus("Server replied with failure code ("+request.status+")");
			}
		},
		function(exc){
			tracker.pushStatus("Failed to connect API ("+exc+")");
		});
	},
	
	syncpost:function(argument, payload){
		return ajax.syncPost(api.url+argument,payload,"application/json");
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
			var magnetlink=gui.build("a","[Magnet]");
			var detlink=gui.build("a","[Details]");
			
			magnetlink.href=tracker.magnetlink(torrent);
			detlink.href="#";
			
			detlink.onclick=function(event){
				gui.updateDetailScreen(torrent);
				tracker.showView("details");
			}
			
			options.appendChild(magnetlink);
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
		gui.elem("details-torrent-link").href=torrent.file;
		if(torrent.file){
			gui.elem("details-torrent-link").style.display="inline-block";
		}
		else{
			gui.elem("details-torrent-link").style.display="none";
		}

		gui.elem("details-magnet-link").href=tracker.magnetlink(torrent);
		
		gui.elem("torrent-name").style.display="inline-block";
		gui.elem("torrent-title-edit-link").style.display="inline-block";
		gui.elem("torrent-name-input").style.display="none";
		
		//clear elements
		var listnode=gui.elem("category-list");
		var buttons=listnode.getElementsByClassName("cat-button");
		
		while(buttons.length>0){
			listnode.removeChild(buttons[0]);
		}
		
		//fetch active categories
		api.request("catfor="+torrent.dbid,function(data){
			if(data.categories){
				data.categories.forEach(function(entry){
					var catid=tracker.categoryDBIDtoIndex(entry.category);
					if(catid>=0){
						var button=gui.details.createCategoryButton(tracker.categories[catid]);
						var adder=gui.elem("add-cat-selector");
						adder.parentNode.insertBefore(button,adder);
					}
					else{
						tracker.pushStatus("Invalid category "+entry.category+" in setup ");
					}
				});
			}
		});
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
			if(tracker.modifyTorrentCategory("del", torrent, category)){
				event.target.parentNode.parentNode.removeChild(event.target.parentNode);
			}
			else{
				tracker.pushStatus("Failed to delete category mapping!");
			}
		},
		
		categoryAddHandler:function(event){
			var drop=gui.elem("add-cat-selector");
			if(drop.selectedIndex!=0){
				var cat=tracker.categoryDBIDtoIndex(drop.options[drop.selectedIndex].value);
				if(cat<0){
					tracker.pushStatus("Category not in local dataset, this should not happen");
					return;
				}
				
				if(tracker.modifyTorrentCategory("add", gui.elem("torrent-name-input").getAttribute("data-dbid"), tracker.categories[cat].dbid)){
					var button=gui.details.createCategoryButton(tracker.categories[cat]);
					event.target.parentNode.insertBefore(button,event.target);
				}
				else{
					tracker.pushStatus("Failed to add category mapping!");
				}
			}
			else{
				tracker.pushStatus("Invalid category selection ("+drop.selectedIndex+").");
			}
			drop.selectedIndex=0;
		}
	},

	upload:{
		handleFormUpload:function(event){
			tracker.handleFilesForUpload(event.target.files);
			event.target.value=null;
		},

		handleDrop:function(event){
			gui.upload.stopPropagation(event);
			if(event.dataTransfer&&event.dataTransfer.files){
				tracker.handleFilesForUpload(event.dataTransfer.files);
			}
		},

		stopPropagation:function(event){
			event.stopPropagation();
			event.preventDefault();
		},

		hideFunctionality:function(){
			gui.elem("upload-form").style.display="none";
			gui.elem("head-info").ondrop=function(event){return;};
			gui.elem("file-upload-btn").onchange=function(event){return;};
		},
		
		createDisplay:function(file){
			var wrap=gui.build("div","Upload: ","upload-file");
			var progressbar=gui.build("span",file.name+" ","upload-file-progress");
			var progressindicator=gui.build("span","(0%)","upload-file-percentage");
			var cancelbtn=gui.build("span","Cancel","fancybutton");
			
			wrap.appendChild(progressbar);
			progressbar.appendChild(progressindicator);
			wrap.appendChild(cancelbtn);
			
			return wrap;
		}
	}
}

var tracker={
	torrents:[],
	categories:[],
	views:{},
	settings:{
		uploadEnabled:true
	},

	magnetlink:function(torrent){
		//FIXME use configurable tracker here
		return "magnet:?xt=urn:btih:"+torrent.hash+"&dn="+encodeURI(torrent.name)+"&tr="+encodeURI("http://10.42.23.1:6969/announce");
	},
	
	torrentDBIDtoIndex:function(dbid){
		for(var i=0;i<tracker.torrents.length;i++){
			if(tracker.torrents[i].dbid==dbid){
				return i;
			}
		}
		return -1;
	},
	
	categoryDBIDtoIndex:function(dbid){
		for(var i=0;i<tracker.categories.length;i++){
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

		if(!window.File||!window.FileList||!window.FileReader||!tracker.settings.uploadEnabled){
			gui.upload.hideFunctionality();
			if(tracker.settings.uploadEnabled){
				tracker.pushStatus("Upload not supported, functionality disabled");
			}
		}
	},
	
	showView:function(tag){
		for(var key in tracker.views){
			tracker.views[key].style.display="none";
		}
		tracker.views[tag].style.display="block";
	},
	
	loadTorrents:function(){
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
		
		var req=api.syncpost("torrent-rename",JSON.stringify({"id":torrent,"name":input.value}));
		try{
			var reply=JSON.parse(req.responseText);
			if(reply.status[0]!=0){
				tracker.pushStatus("Failed to rename: "+reply.status[2]);
			}
			else{
				tracker.torrents[index].name=input.value;
			}
		}
		catch(e){
			tracker.pushStatus("Failed to rename: "+e);
		}
		
		gui.table.init();
		gui.updateDetailScreen(tracker.torrents[index]);
	},
	
	modifyTorrentCategory:function(action, torrent, category){
		var req=api.syncpost("category-"+action,JSON.stringify({"torrent":torrent,"category":category}));
		try{
			var reply=JSON.parse(req.responseText);
			if(reply.status[0]==0){
				return true;
			}
			else{
				tracker.pushStatus("Action failed: "+reply.status[2]);
			}
			return false;
		}
		catch(e){
			return false;
		}
	},
	
	deleteDisplayedTorrent:function(){
		var req=api.syncpost("torrent-del",JSON.stringify({"id":gui.elem("torrent-name-input").getAttribute("data-dbid")}),"x-www-formencoded");
		try{
			var data=JSON.parse(req.responseText);
			if(data.status[0]!=0){
				tracker.pushStatus("Failed to delete: "+data.status[2]);
			}
		}
		catch(e){
			tracker.pushStatus("Failed to delete: "+e);
		}
		tracker.loadTorrents();
		tracker.showView("list");
	},

	handleFilesForUpload:function(files){
		gui.elem("view-uploads").style.display="block";
		for(var i=0;i<files.length;i++){
			var elem=gui.upload.createDisplay(files[i]);
			gui.elem("upload-file-wrapper").appendChild(elem);
			tracker.uploadSingleFile(files[i], elem);
		}
	},
	
	uploadSingleFile:function(file, elem){
		//TODO size limit
		var req=new ajax.ajaxRequest();
		var data=new FormData();
		data.append("file", file);
		
		var percentage=elem.getElementsByClassName("upload-file-percentage")[0];
		var progress=elem.getElementsByClassName("upload-file-progress")[0];
		
		req.upload.onprogress=function(event){
			if(event.lengthComputable){
				var complete=(event.loaded/event.total*100 | 0);
				percentage.textContent="("+complete+"%)";
				progress.style.backgroundImage="linear-gradient(to left, #666 0%, #eee "+(100-complete)+"%)";
			}
		};
		
		req.onload=function(event){
			var uploadview=gui.elem("view-uploads");
			var uploadlist=gui.elem("upload-file-wrapper");
			uploadlist.removeChild(elem);
			
			if(uploadlist.childElementCount==0){
				uploadview.style.display="none";
				tracker.loadTorrents();
			}
		};
		
		req.open("POST","upload.php");
		
		req.send(data);
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
