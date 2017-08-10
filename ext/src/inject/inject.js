

chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);
        
        // ----------------------------------------------------------
        // Initial Setup
		console.log("Amazon Data Simplifier Loaded!");

		var targetDivName = "detail-ilm_div";

		if (!idExists(targetDivName)) {
			console.log("Exiting, couldn't find div to replace!");
			die();
		} else {
            		var targetDiv = document.getElementById(targetDivName);
        }

		var shippingWeight = 0.01;
		var shippingWeightSource = "product-details";
		var numOfStatItems = 0;
		var currentCol = "";
		var numOfStatRows = 0;
		var regexPattern = "";

		targetDiv.innerHTML = `
			<table id = "simpleStatsTable"> 
				<h3>Simplified Amazon Stats</h3>
			</table> 
			<hr>`;



		var simpleStatsTable = document.getElementById("simpleStatsTable");
        addWeightConverter();
        
        // ----------------------------------------------------------
        // Scrape Data
        getProductDimensions();

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
        
        function addWeightConverter() {
            addStatItem(`
                <form id="weightConverter">
                    Weight in OZ: <input type="number" id="ouncesInput" placeholder="oz"></input> Weight in Pounds: <input type="number" id="poundsOutput" placeholder="lbs" readonly></input>
				</form>
            `);
            document.getElementById("ouncesInput").addEventListener("keyup", convertOuncesToPounds);
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
        
        function getProductDimensions() {
            if (idExists("detail-bullets")) {
                var detailsDiv = document.getElementById("detail-bullets");
//                window.console.log(detailsDiv);
                var contentItems = detailsDiv.getElementsByTagName("li");
                var contentToAdd = "<p>"+contentItems[0].innerText+"</p";
                addStatItem(contentToAdd);
            }
        }

	}
	}, 10);
});