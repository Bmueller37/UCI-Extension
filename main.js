/*
This content script injects into the UCI Schedule of class site, and sorts though the data, appending the correct GPA's with each
course.
*/

/*

{
	CourseTitle: "ABC"
	ProfName: "Prof123"
	DOMelement: element
}

{
	CourseTitle: [{1data, 2data}],
	CourseTitle: 

}

*/



const url = chrome.runtime.getURL('data_new.json');
fetch(url)
  .then(
    function(response) {
      response.json().then(function(data) {
		var list = parseTable();
		
		addData(list, data);
      });
    }
  );

function isTable(element) {
	if(typeof(element) == 'undefined') {
		return false;
	}
	else {
		return true;
	}
}

function isCourseTitle(element) {
	if (element.bgColor == "#fff0ff" && element.firstChild.classList != 'undefined' &&   element.firstChild.classList != null && 
	element.firstChild.classList[0] == 'CourseTitle') {
		return true;
	}
	return false;
}

function isCourseListing(element) {
	if ((element.firstChild.bgColor = "#DDEEFF" || element.bgColor == "#FFFFCC") && element.childNodes.length > 12 && element.childNodes[1].textContent != "Code")  {
		return true;
	}
	return false;
}

function createCourseObj(title, name, element) {
	obj = {
		CourseTitle: title,
		ProfName: name,
		DOMelement: element,
	};
	return(obj);
}
function getCourseTitle(element) {
	return(element.firstChild.childNodes[1].firstChild.textContent);
}
function getName(element) {
	var name = element.childNodes[4].textContent;
	
	name = name.replace('STAFF', '');
	return(name.split('.')[0].replace(',', '') + '.');
}

function styleHeader(element) {
	element.style.whiteSpace = "nowrap";
	element.style.fontSize = "small";
}


//Parses Table and extracts names, titles, and the DOM element to add to
function parseTable() {
	var courseObjList = [];
  const table_div = document.getElementsByClassName("course-list")[0];
  for (var i =1; i < table_div.childNodes.length; i++) { // loop through div containing tables and junk
    if ( isTable(table_div.childNodes[i].rows) ) {  // filter out non-tables in div (text)
		var currentCourse;
		for (let row of table_div.childNodes[i].rows) { // loop through rows in a table
			
			if (isCourseTitle(row)) { 
				currentCourse = getCourseTitle(row);
				
			}
			
			else if (isCourseListing(row)) {
				var profName = getName(row);	
				var DOMelement = row;
				courseObjList.push(createCourseObj(currentCourse, profName, DOMelement));
			}
		}
    }
  }
  return(courseObjList);
}


// Adds and styles new headers
function addNewHeaders() {
	nodeList = document.querySelectorAll('[title="Code = Course code"]');
	for (let i =0; i < nodeList.length; i++) {

		var withProfessor = document.createElement("th");
		withProfessor.textContent = "Course w/ Prof GPA";

		var overallCourse = document.createElement("th");
		overallCourse.textContent = "Course GPA Overall";

		var rmpRating = document.createElement("th");
		rmpRating.textContent = "RateMyProfessor Rating";

		var rmpLink = document.createElement("th");
		rmpLink.textContent = "RateMyProfessor Link";

		styleHeader(withProfessor);
		styleHeader(overallCourse);
		styleHeader(rmpRating);
		styleHeader(rmpLink);
		
		nodeList[i].parentNode.append(withProfessor);
		nodeList[i].parentNode.append(overallCourse);
		nodeList[i].parentNode.append(rmpRating);
		nodeList[i].parentNode.append(rmpLink);
	}
	
}


addNewHeaders();

function createDataElement(color) {
	var element = document.createElement("td");
	element.style.fontSize = "medium";
	element.style.backgroundColor = color;

	return(element);
}

function findGPA(dataset, course, professor) {
	var course_arr = dataset[course];
	if (course_arr == undefined) {
		return({professorGPA: "N/A", ovGPA: "N/A"});
	}
	var overallGPA = 0;
	var overallGPAcounter = 0;
	var profGPA = 0;
	var profGPAcounter = 0;

	for (let i = 0; i < course_arr.length; i++) {
		
		if (course_arr[i].AvgGPA != "") {
			overallGPA += parseFloat(course_arr[i].AvgGPA);
			overallGPAcounter++;
			if (course_arr[i].Instructor1Name == professor) {
				profGPA += parseFloat(course_arr[i].AvgGPA);
				profGPAcounter++;
			}
		}
	}
	if (overallGPAcounter != 0) {
		overallGPA = (overallGPA/overallGPAcounter).toFixed(2);
	}
	else {
		overallGPA = "N/A";
	}
	if (profGPAcounter != 0) {
		profGPA = (profGPA/profGPAcounter).toFixed(2);
	}
	else {
		profGPA = "N/A";
	}
	var ret = {
		professorGPA: profGPA,
		ovGPA: overallGPA
	}
	return(ret);

}
function addData(objList, dataset) {
	for (let i = 0; i < objList.length; i++) 
	{
		var pGPA = createDataElement("#FFFFCC"); 
		var oGPA = createDataElement("#D5E5FF");

		var GPAdata = findGPA(dataset, objList[i].CourseTitle, objList[i].ProfName);
		pGPA.textContent = GPAdata.professorGPA;
		oGPA.textContent = GPAdata.ovGPA;

		objList[i].DOMelement.append(pGPA);
		objList[i].DOMelement.append(oGPA);

		getRMPData(objList[i].ProfName, objList[i].DOMelement);

	}
}
function getRMPData(professorName, DOMelem) 
{
	var rating = createDataElement("#FFFFCC");
	var link = document.createElement("a");
	link.textContent = "Link";
	var professor_name = professorName.split(" ")[0];
	var msg = {profName: professor_name, profFName: professor_name};
	chrome.runtime.sendMessage(msg, function(response) {
		console.log(response);
		rating.textContent = response.rating;
		link.setAttribute('href', response.URL);
		link.setAttribute('target', '_blank');

		DOMelem.append(rating);
		DOMelem.append(link);
	});
}


