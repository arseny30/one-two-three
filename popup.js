function executeCodeOnPage(code) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript(
        tabs[0].id,
        {code: code});
  });
}

function executeFuncOnPage(func, ...args) {
  executeCodeOnPage('(' + func + ')(' + args.map(JSON.stringify).join(", ") + ')');
}

function dispatchEvent(type, data) {
  executeFuncOnPage(
     function(type, data) { 
       document.dispatchEvent(new CustomEvent(type,  {detail : data })); 
     }, type, data 
   );
}

// inject script.js
executeFuncOnPage(()=>{
  var s = document.createElement('script');
  s.src = chrome.runtime.getURL('script.js');
  s.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(s);
});

let play = document.getElementById('play');
let setTimeButton = document.getElementById('setTime');

play.onclick = function(element) {
  dispatchEvent('rdt.play');
};

setTimeButton.onclick = function(element) {
  dispatchEvent('rdt.setTime', {time: 20});
};

// ---- experimental ---- 
executeFuncOnPage(()=>{
  window.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != window)
      return;
  
    if (event.data.type && (event.data.type == "FROM_PAGE")) {
      console.log("Content script received: " + event.data.text);
      chrome.runtime.sendMessage({type: "FROM_PAGE", text: event.data.text}, function(response) {
        console.log(response);
      });
    }
  }, false);
});
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.type == "FROM_PAGE")
      sendResponse({farewell: "goodbye"});
  });
