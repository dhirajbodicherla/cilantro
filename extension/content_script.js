chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "refresh"){
        document.body.style.cssText = "background: url('"+request.url+"') no-repeat center center fixed;-webkit-background-size: cover; -moz-background-size: cover; -o-background-size: cover;background-size: cover;";
    }
    if (request.method == "clear"){
    	document.body.style.cssText = "";
    }
});

chrome.runtime.sendMessage({method: "getLocalStorage", key: "imageSelected"}, function(response) {
  var url = response.data;
  if(url){
    document.body.style.cssText = "background: url('"+url+"') no-repeat center center fixed;-webkit-background-size: cover; -moz-background-size: cover; -o-background-size: cover;background-size: cover;";
  }
});