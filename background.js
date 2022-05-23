

// This script gets triggered when messaged by main content script, sends rmp data either from local storage or from http request

chrome.runtime.onMessage.addListener(

  function(request, sender, sendResponse) {
		var stored = false;
		chrome.storage.local.get([request.profFName], function(obj) {
			var wasPopped = false;
			if (Object.keys(obj).length !== 0) {
			
			if(Date.now() - obj[request.profFName].time >= 86400000) {
				
				chrome.storage.local.remove([request.profFName]);
				wasPopped = true;
				
			}
			
			if (wasPopped == false) {
		
			sendResponse(obj[request.profFName]);
			stored = true;
			}
			}
		});
		
		
		var profData;
		var profName = request.profName;
		var profURL = 'https://www.ratemyprofessors.com/search/teachers?query=' + profName + "&sid=U2Nob29sLTEwNzQ=";
		//console.log(profURL);
		fetch(profURL).then(r => r.text()).then(result => { 
		
		
		var parser = new DOMParser();
		var doc = parser.parseFromString(result, 'text/html');
		var root = doc.getElementById("root");
		var RMPList = root.firstChild.firstChild.childNodes[3].childNodes;
		console.log(profURL);
		console.info(doc);
		if (RMPList.length == 0) {
			 throw new Error('error');
		}
		
		var profID;
		
		for (var i = 0; i < RMPList.length; i++) {
			//console.log(RMPList[i].innerText.replace(/\s/g, '').toLowerCase());
			//console.log(request.profFName.replace(/\s/g, '').toLowerCase());
			if (RMPList[i].innerText.toLowerCase().replace(/\s/g, '').startsWith(request.profFName.replace(/\s/g, '').toLowerCase())) {
				profID = RMPList[i].parentElement.parentElement.parentElement.href;
				profID = String(profID);
				//console.log(request.profName);
			}
			
			
		}
		//profID = profID.split("=")[1];
		console.log(profID);
	
		var rmpURL = "https://www.ratemyprofessors.com/ShowRatings.jsp?tid=" + profID;
		fetch(rmpURL).then(x => x.text()).then(output => {
			
			var parser2 = new DOMParser();
			var docu = parser2.parseFromString(output, 'text/html');
			var rating = docu.getElementsByClassName("RatingValue__Numerator-qw8sqy-2 liyUjw")[0].innerText;
			var takeAgain;
			var diff;
			
			var metrics = docu.getElementsByClassName("FeedbackItem__FeedbackNumber-uof32n-1 kkESWs");
			for (var i = 0; i < metrics.length; i++) {
				if (metrics[i].innerText.includes("%")) {
					takeAgain = metrics[i].innerText;
					
				}
				if (metrics[i].innerText.includes(".")) {
					
					diff = metrics[i].innerText;
				}
			}
			
			profData = {"rating": rating, "takeAgain": takeAgain, "diff": diff, "URL": rmpURL, "profName": request.profFName, 'time': Date.now() };
			profStorage = {};
			key = request.profFName;
			profStorage[key] = profData;
			chrome.storage.local.set(profStorage, function() {});
			sendResponse(profData);	






		})
		
		
		 
		
		
		
		
		
		
		
		
		
		
		
		
		}).catch(error => {
		sendResponse({"rating": "None", "takeAgain": "None", "diff": "None", "profName": request.profFName, "URL": profURL });	 })
		profStorage = {};
		key = request.profFName;
		profStorage[key] = {"rating": "None", "takeAgain": "None", "diff": "None", "profName": request.profFName, "URL": profURL };
		//chrome.storage.local.set(profStorage, function() {});
		return true;
      
  
	}
);