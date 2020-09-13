function executeCodeOnPage(code) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
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
        function (type, data) {
            document.dispatchEvent(new CustomEvent(type, {detail: data}));
        }, type, data
    );
}

let play = document.getElementById('play');
let setTimeButton = document.getElementById('setTime');
let myRoomIdText = document.getElementById('myRoomId');
let roomIdText = document.getElementById('roomId');
let roomIdButton = document.getElementById('roomIdSubmit');

let roomId = '';

chrome.storage.sync.get(['roomId'], function (result) {
    roomId = result.roomId;
    roomIdText.value = roomId;
    myRoomIdText.value = roomId;

    console.log("Loaded RoomId =", roomId);
});

roomIdButton.onclick = (element) => {
    let newRoomId = roomIdText.value;
    if (newRoomId == roomId) {
        return;
    }
    console.log("Set new roomId=", newRoomId);
    roomId = newRoomId;
    dispatchEvent('rdt.setRoomId', {roomId: roomId});
}

play.onclick = (element) => {
    dispatchEvent('rdt.play.onclick');
};

setTimeButton.onclick = (element) => {
    dispatchEvent('rdt.setTime', {time: 20});
};

// ---- experimental ---- 
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.type == "FROM_PAGE")
            sendResponse({farewell: "goodbye"});
    });
