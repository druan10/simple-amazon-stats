

chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);
        
        // ----------------------------------------------------------
		// Initial Setup
		var shippingWeight = 0.01;
		var numOfStatItems = 0;
		var currentCol = "";
		var numOfStatRows = 0;
		var regexPattern = "";
		var productDimensions = [0,0,0];
		var isWeightFound = false;
		var OUNCES_PER_POUND = 16;
		
		console.log("Amazon product analyzer initialized");
		
		// Default ad div to replace.
		var targetDivName = "detail-ilm_div";

		if (!idExists(targetDivName)) {
			console.log("Exiting, couldn't find target div to replace!");
			die();
		} else {
					var targetDiv = document.getElementById(targetDivName);
					main();
		}
		
		// ----------------------------------------------------------
		// Functions for scraping and presenting data

		//Adds html content to the first empty table column, or adds a table row if none are free
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
		}

		//Adds placeholder row with two table columns
		function addEmtpyRowToStatsTable() {
			numOfStatRows++;
			simpleStatsTable.innerHTML += `
					<tr id="tableRow_` + (numOfStatRows) + `">
						<td id="row_` + (numOfStatRows) + `_LeftCol" style="width:50%;"></td>
						<td id="row_` + (numOfStatRows) + `_RightCol" style="width:50%;"></td>
					</tr>
					`;
		}
        
		//TODO check if found regex match
		function getWeightInPounds() { //https://www.amazon.com/gp/product/B00KR0202E
			var relevantDiv = "";
			var possibleWeights = [];
			
			if (idExists("detail-bullets")) {
				relevantDiv = document.getElementById("detail-bullets");
				console.log("found details");
				regexPattern = "(\d{1,}\.\d{,2})(?:\spounds)";
				if (RegExp.test(String(relevantDiv))) {
					console.log("found weight in pounds");
				}

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
        
        function displayError(errorMessage) {
            addStatItem(`
                        <b style="color:red;">`+errorMessage+`</b>
                        `);
		}
		
		function extractProductData(item) {

			// Check for Product Dimensions
			if (item.innerText.includes("Product Dimensions")) {
				
				//Todo autodetect dimension irregular
				var matches;
				matches = /\d{1,3}(\.\d{1,3})?/g.exec(item.innerText);
				contentToAdd = "<p>"+item.innerText+"</p>";
				addStatItem(contentToAdd);
			}
			
			// Check for Shipping Weight
			if (item.innerText.includes("Shipping Weight")) {
				isWeightFound = true;
				if (item.innerText.includes("pounds")) {
					var match = /\d{1,4}\.\d{1,4}/.exec(item.innerText);
					document.getElementById("ouncesInput").value = match * OUNCES_PER_POUND;
					isWeightFound = true;
				} else if (item.innerText.includes("ounces")) {
					var match = /\d{1,4}\.\d{1,4}/.exec(item.innerText);
					document.getElementById("ouncesInput").value = match;
					console.log(match[0]);
					isWeightFound = true;
				}

				convertOuncesToPounds();
				contentToAdd = "<p>"+item.innerText+"</p>";
				addStatItem(contentToAdd);
			}

			// Check for Item Weight
			if (item.innerText.includes("Item Weight")) {
				var match = /\d{1,4}\.\d{1,4}/.exec(item.innerText);
				contentToAdd = "<p>"+item.innerText+"</p>";

				// If the shipping weight isn't listed, we use the item weight
				if (!isWeightFound) {
					document.getElementById("ouncesInput").value = match;
				}
				addStatItem(contentToAdd);
			}
			
		}
        
        function getProductDetails() {
            if (idExists("detail-bullets")) {
                var detailsDiv = document.getElementById("detail-bullets");
                var contentToAdd = "";
                var contentItems = detailsDiv.getElementsByTagName("li");
                for (i=0; i < contentItems.length; i++) {
					// TODO
					extractProductData(contentItems[i]);
                }
			} else if (idExists("prodDetails")) {

				console.log("Found prodDetails div");
				var detailsDiv = document.getElementById("prodDetails");
				var contentToAdd = "";
				var contentItems = detailsDiv.getElementsByTagName("tr");
				for (i=0; i < contentItems.length; i++) {
					extractProductData(contentItems[i]);
				}
				
			} else {
                displayError("No Product information found!");
            }
        }
		
		function main() {
			// Inject statistics into the page
			targetDiv.innerHTML = `
				<table id = "simpleStatsTable"> 
					<h3>Simplified Amazon Stats</h3>
					<form id="weightConverter">
						Weight in OZ: <input type="number" id="ouncesInput" placeholder="oz"></input> Weight in Pounds: <input type="number" id="poundsOutput" placeholder="lbs" readonly></input>
					</form>
				</table> 
				<hr>`;
			
			var simpleStatsTable = document.getElementById("simpleStatsTable");
			
			// Add key listener for automatic weight conversions
			document.getElementById("ouncesInput").addEventListener("keyup", convertOuncesToPounds);

			getProductDetails();
			
			}

        }
	}, 10);
});