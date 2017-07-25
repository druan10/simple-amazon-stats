chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);


		// ----------------------------------------------------------
		// This part of the script triggers when page is done loading
		console.log("Hello. This message was sent from scripts/inject.js");
		var simpleStatsDiv = document.getElementById("detail-ilm_div");
		var shippingWeight = 0.01;
		var shippingWeightSource = "product-details";

		simpleStatsDiv.innerHTML = '<table style="width:80%;margin-left:auto;margin-right:auto;padding-top:5px;padding-bottom:5px" id="simpleStatsTable"></table>';
		
		var simpleStatsTable = getElementById("simpleStatsTable");

		simpleStatsTable.innerHTML += '<tr><td><h3> isAsinMerge: No </h3></td><td><h3> isRefrigerated: No </h3></td></tr>';

		simpleStatsTable.innerHTML += '<tr><td><h3> Estimated Weight: __ </h3></td><td><h3> <form> <input type="text" name="oz" id="oz_input" value="'+shippingWeight+'"> </form> </h3></td></tr>';
		// myNode.innerHTML = '<h3> isAsinMerge: No </h3>'
		// myNode.innerHTML = '<h3> Estimated weight: ' + shippingWeight + ' pounds </h3> (Scraped from ' + shippingWeightSource + '.)';
		// myNode.innerHTML += '<h3> Convert weight to pounds: <form> <input type="text" name="oz" id="oz_input" value="'+shippingWeight+'"> </form> <h3>'
		// myNode.innerHTML += "more features and stuff...";
		// // ----------------------------------------------------------

	}
	}, 10);
});