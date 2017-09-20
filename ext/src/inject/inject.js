

chrome.extension.sendMessage({}, function (response) {
	var readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);

			// ----------------------------------------------------------
			// Initial Setup
			const OUNCES_PER_POUND = 16;
			const INJECT_TARGET_DIV_ID = "detail-ilm_div";
			const ASIN_REGEX = RegExp("(https\:\/\/www.amazon.com\/)(gp|dp)\/product\/(\w){10}"); // REGEX By https://stackoverflow.com/users/205934/jpsimons

			var shippingWeight = 0.01;
			var numOfStatItems = 0;
			var currentCol = "";
			var numOfStatRows = 0;
			var regexPattern = "";
			var productDimensions = [0, 0, 0];
			var isWeightFound = false;
			var asinMergeCheck;
			var productAsins = [];
			var dataQueue = [];
			var divList = ["detail-bullets", "prodDetails", "descriptionAndDetails"];

			if (!idExists(INJECT_TARGET_DIV_ID)) {
				console.log("Exiting, couldn't find target div to replace!");
				die();
			} else {
				var targetDiv = document.getElementById(INJECT_TARGET_DIV_ID);
				main();
			}

			// ----------------------------------------------------------
			// Functions for scraping and presenting data

			function updateQueue() {
				for (i = 0; i < divList.length; i++) {
					if (idExists(divList[i])) {
						dataQueue.push(divList[i]);
					}
				}
				console.log(dataQueue);
				console.log(dataQueue.length);
			}

			function parseQueue() {
					for (i = 0; i < dataQueue.length + 1; i++) {
						getProductDetails(dataQueue.shift());
					}
			}

			//Adds html content to the first empty table column, or adds a table row if none are free
			function addStatItem(htmlToAdd) {
				if (numOfStatItems % 2 == 0) {
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

			function convertOuncesToPounds() {
				console.log("converting");
				var ounces = document.getElementById("ouncesInput").value;
				if (!isNaN(ounces)) {
					document.getElementById("poundsOutput").value = roundTo(ounces / 16, 2);
				}
			}

			function roundTo(n, digits) { // Written by https://stackoverflow.com/users/1634137/shura
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
                        <b style="color:red;">`+ errorMessage + `</b>
						`);
			}

			function extractProductData(item) {

				// Check for Product Dimensions
				if (item.innerText.includes("Product Dimensions") || item.innerText.includes("Package Dimensions")) {
					console.log("Found Product Dimensions");
					//Todo autodetect dimension irregular
					var matches;
					matches = /\d{1,3}(\.\d{1,3})?/g.exec(item.innerText);
					contentToAdd = "<p>" + item.innerText + "</p>";
					addStatItem(contentToAdd);
				}

				// Check for Shipping Weight
				if (item.innerText.includes("Shipping Weight")) {
					console.log("Found Shipping Weight");
					isWeightFound = true;
					if (item.innerText.includes("pounds")) {
						var match = /\d{1,4}\.?\d{0,4}/.exec(item.innerText);
						document.getElementById("ouncesInput").value = match * OUNCES_PER_POUND;
					} else if (item.innerText.includes("ounces")) {
						var match = /\d{1,4}\.?\d{0,4}/.exec(item.innerText);
						document.getElementById("ouncesInput").value = match;
					}

					convertOuncesToPounds();
					contentToAdd = "<p>" + item.innerText + "</p>";
					addStatItem(contentToAdd);
				}

				// Check for Item Weight
				if (item.innerText.includes("Item Weight")) {
					console.log("Found Item Weight");
					var match = /\d{1,4}\.?\d{0,4}/.exec(item.innerText);
					contentToAdd = "<p>" + item.innerText + "</p>";
					// Prioritize using Shipping Weight over item weight (if available)
					if (!isWeightFound) {
						document.getElementById("ouncesInput").value = match;
					}
					addStatItem(contentToAdd);
				}

			}

			function getProductDetails() {

				if (idExists("detail-bullets")) {
					console.log("Found detail-bullets");
					var detailsDiv = document.getElementById("detail-bullets");
					var contentToAdd = "";
					var contentItems = detailsDiv.getElementsByTagName("li");
					for (i = 0; i < contentItems.length; i++) {
						// TODO
						extractProductData(contentItems[i]);
					}
				} else if (idExists("prodDetails")) {
					console.log("Found prodDetails div");
					var detailsDiv = document.getElementById("prodDetails");
					var contentToAdd = "";
					var contentItems = detailsDiv.getElementsByTagName("tr");
					for (i = 0; i < contentItems.length; i++) {
						extractProductData(contentItems[i]);
					}
				} else {
					displayError("No Product information found!");
				}
			}

			function main() {
				console.log("Amazon product analyzer initialized");
				targetDiv.innerHTML = `
				<div id = "statsDiv">
					<table id = "simpleStatsTable"> 
						<h3>Simplified Amazon Stats</h3>
						<form id="weightConverter">
							Weight in OZ: <input type="number" id="ouncesInput" placeholder="oz"></input> Weight in Pounds: <input type="number" id="poundsOutput" placeholder="lbs" readonly></input>
						</form>
					</table> 
				</div>
				<hr>`;

				var simpleStatsTable = document.getElementById("simpleStatsTable");
				// Add key listener for automatic weight conversions
				document.getElementById("ouncesInput").addEventListener("keyup", convertOuncesToPounds);
				updateQueue();
				parseQueue();
				/**
				 * TODO, ASIN MERGE CHECK
				 */
				// asinMergeCheck = setInterval(checkAsinMerge, 100);
			}

			function checkAsinMerge() {

				currentUrlAsin = getAsinFromUrl();

				if (productAsins.length == 0) {
					if (currentUrlAsin) {
						productAsins += currentUrlAsin;
						console.log(currentUrlAsin);
					}
				} else if (currentUrlAsin != productAsins[0]) {
					productAsins += currentUrlAsin;
					console.log(currentUrlAsin);
					clearInterval(asinMergeCheck);
				}

			}

			/**
			 * Attempts to find an asin in the product page URL
			 */
			function getAsinFromUrl () {
				m = window.location.href.match("([a-zA-Z0-9]{10})(?:[/?]|$)");
				if (m) {
					console.log("ASIN = " + m[0]);
					return m[0];
				} else {
					console.log("Unable to detect asin. Bad REGEX?");
				}
			}

		}
	}, 10);
});