chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		// ----------------------------------------------------------
		// This part of the script triggers when page is done loading
		console.log("Amazon Data Simplifier Loaded!");

		// This script will replace the div with the following id, if it doesn't exist, the program will quit
		var targetDivName = "detail-ilm_div";

		if (!idExists(targetDivName)) {
			console.log("Exiting, couldn't find div to replace!");
			die();
		}

		var targetDiv = document.getElementById(targetDivName);
		
		// Default Values
		var shippingWeight = 0.01;
		var shippingWeightSource = "product-details";
		var numOfStatItems = 0;
		var currentCol = "";
		var numOfStatRows = 0;

		targetDiv.innerHTML = `
			<table id = "simpleStatsTable"> 
				<h3>Simplified Amazon Stats</h3>
				<form id="weightConverter">
					Weight in OZ: <input type="number" id="ouncesInput" placeholder="oz"></input> Weight in Pounds: <input type="number" id="poundsOutput" placeholder="lbs" readonly></input>
				</form>
			</table> 
			<hr>`;

		// Allows real time updates to the weight converter
		document.getElementById("ouncesInput").addEventListener("keyup", convertOuncesToPounds);

		var simpleStatsTable = document.getElementById("simpleStatsTable");

		addStatItem("<b>HEY</b>");

		//TODO, create get weight function
		getWeightInPounds();

		// ----------------------------------------------------------
		// Functions for scraping and presenting data

		function addStatItem(htmlToAdd) {

			// If we have an even number of items, then we have to add a new empty row and append item to first col, if not, add to second column
			if (numOfStatItems%2==0) {
				addEmtpyRowToStatsTable();
				currentCol = document.getElementById("row_" + (numOfStatRows) + "_LeftCol");
				currentCol.innerHTML = htmlToAdd;
			} else {
				currentCol = document.getElementById("row_" + (numOfStatRows) + "_RightCol"); 
				currentCol.innerHTML = htmlToAdd;
			}
			numOfStatItems++;
			console.log(numOfStatItems);
		}

		function addEmtpyRowToStatsTable() {
			numOfStatRows++;
			simpleStatsTable.innerHTML += `
					<tr id="tableRow_` + (numOfStatRows) + `">
						<td id="row_` + (numOfStatRows) + `_LeftCol" style="width:50%;"></td>
						<td id="row_` + (numOfStatRows) + `_RightCol" style="width:50%;"></td>
					</tr>
					`;
		}

		//TODO
		function getWeightInPounds() { //https://www.amazon.com/gp/product/B00KR0202E
			var relevantDiv = "";
			var possibleWeights = [];
			
			if (idExists("detail-bullets")) {
				console.log("found details");
			}
		}

		function convertOuncesToPounds () {
			console.log("converting");
			var ounces = document.getElementById("ouncesInput").value;
			if (!isNaN(ounces)) {
				document.getElementById("poundsOutput").value = roundTo(ounces / 16, 2);
			} 
		}

		// Written by https://stackoverflow.com/users/1634137/shura
		function roundTo(n, digits) {
		    if (digits === undefined) {
		        digits = 0;
		    }

		    var multiplicator = Math.pow(10, digits);
		    n = parseFloat((n * multiplicator).toFixed(11));
		    return Math.round(n) / multiplicator;
		}

		function idExists(id) {
			return (document.getElementById(id) != null);
		}

	}
	}, 10);
});