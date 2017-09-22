

chrome.extension.sendMessage({}, function (response) {
	var readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);

			// ----------------------------------------------------------
			// Initial Setup
			const OUNCES_PER_POUND = 16;
			const INJECT_TARGET_DIV_ID = "detail-ilm_div";
			const ASIN_REGEX = RegExp("(https\:\/\/www.amazon.com\/)(gp|dp)\/product\/(\w){10}"); // REGEX By https://stackoverflow.com/users/205934/jpsimons
			const NUM_TEST = RegExp(/\d{1,}((\.)\d{1,})?\s/mg);

			// Product information variables
			var shippingWeight = 0.01;
			var productDimensions = [0, 0, 0];
			// Program variables
			var numOfStatItems = 0;
			var currentCol = "";
			var numOfStatRows = 0;
			var regexPattern = "";
			var dataQueue = [];
			
			// Divs known to contain product information
			var divList = ["detail-bullets", "prodDetails", "descriptionAndDetails"];
			// Flags
			var areDimensionsFound = false;
			var isWeightFound = false;
			/**
			 * These variables aren't used yet
			
			var asinMergeCheck;
			var productAsins = [];
			*/
			
			
			if (!idExists(INJECT_TARGET_DIV_ID)) {
				console.log("Exiting, couldn't find target div to replace!");
				die();
			} else {
				var targetDiv = document.getElementById(INJECT_TARGET_DIV_ID);
				main();
			}

			// ----------------------------------------------------------
			// Functions for scraping and presenting data

			/**
			 * Checks whether the data divs in the divList exist on the current page
			 * If they do, pushes them to the dataQueue
			 */
			function initializeScrapeQueue() {
				for (i = 0; i < divList.length; i++) {
					if (idExists(divList[i])) {
						dataQueue.push(divList[i]);
					}
				}
			}
			
			/**
			 * Checks for useful data in the divs found during initialization
			 * If they contain important info, these data points are added to our table
			 */
			function evaluateScrapeQueueItems() {
				for (i = 0; i < dataQueue.length + 1; i++) {
						var dataDiv = document.getElementById(dataQueue.shift());
						searchTag = "";
						if (dataDiv.getElementsByTagName("li").length > 0) {
							searchTag = "li";
						} else if (dataDiv.getElementsByTagName("tr").length > 0) {
							searchTag = "tr";
						}
						var contentItems = dataDiv.getElementsByTagName(searchTag);
						for (i = 0; i < contentItems.length; i++) {
							extractProductData(contentItems[i]);
					}
				}
			}

			/**
			 * @function
			 * Adds html content to the first empty table column, or adds a table row if none are free
			 */
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

			/**
			 * Written by https://stackoverflow.com/users/1634137/shura
			 */
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
                        <b style="color:red;">`+ errorMessage + `</b>
						`);
			}

			/**
			 * Detects data points and adds them to our data table
			 * @param {String} item - HTML innerText string taken from dataQueue div 
			 */
			function extractProductData(item) {
				console.log("item: " + item.innerText);
				
				// Check for Product Dimensions
				if (item.innerText.includes("Product Dimensions") || item.innerText.includes("Package Dimensions")) {
					console.log("Found Product Dimensions");
					areDimensionsFound = true;
					var matches;
					matches = getRegexMatches(NUM_TEST, item.innerText);

					// Only first 3 items will be product dimensions, 4th is a measurement of weight, if it exists.
					if (Math.max(matches.slice(0,3) >= 18)) {
						var contentToAdd = "<span class='notice_warning'>"+item.innerText+"</span>";
					} else {
						var contentToAdd = item.innerText;
					}
					
					addStatItem(contentToAdd.trim());
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
					var contentToAdd = "<p>" + item.innerText + "</p>";
					addStatItem(contentToAdd);
				}

				// Check for Item Weight
				if (item.innerText.includes("Item Weight")) {
					console.log("Found Item Weight");
					var match = /\d{1,4}\.?\d{0,4}/.exec(item.innerText);
					var contentToAdd = "<p>" + item.innerText + "</p>";
					// Prioritize using Shipping Weight over item weight (if available)
					if (!isWeightFound) {
						document.getElementById("ouncesInput").value = match;
					}
					addStatItem(contentToAdd);
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
				initializeScrapeQueue();
				evaluateScrapeQueueItems();
				/**
				 * TODO, ASIN MERGE CHECK
				 */
			}

			/**
			 * @function
			 * @param {RegExp} regex - regular expression used for testing. Must include global flag!
			 * @param {String} testString - string to test regex against
			 * @returns array of matches
			 */
			function getRegexMatches(regex, testString) {
				var m;
				var matches = [];
				while ((m = regex.exec(testString)) != null) {
					matches.push(m[0]);
				}
				return matches;				
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
			 * @todo
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