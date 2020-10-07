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

let playButton = document.getElementById('play');
let setTimeButton = document.getElementById('setTime');
let pauseButton = document.getElementById('pause');

let myRoomIdText = document.getElementById('myRoomId');
let roomIdText = document.getElementById('roomId');
let roomIdButton = document.getElementById('roomIdSubmit');

let sharedLinkText = document.getElementById('sharedLink');

function loadUrl() {
	return new Promise((ok, err) => {
		chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
			ok(tabs[0].url);
		})
	});
}

let urlPromise = loadUrl();

function loadStoredRoomId() {
	return new Promise( (ok, err) => {
		chrome.storage.sync.get(['roomId'], result => ok(result.roomId));
	});
}

let storedRoomIdPromise = loadStoredRoomId();

const room_id_str = 'one_two_three_room_id';
async function loadUrlAndRoomId() {
	let url = new URL(await urlPromise);
	let roomId = await storedRoomIdPromise;

	let urlRoomId = url.searchParams.get(room_id_str);
	if (urlRoomId) {
		return [url.toString(), urlRoomId, roomId];
	} else {
		// TODO: searchParams is read-only...
		urlRoomId = roomId + "_" + url.toString().hashCode().toString(36);
		url.searchParams.set(room_id_str, urlRoomId);
		return [url.toString(), urlRoomId, roomId];
	}
}

async function init() {
	let [url, roomId, myRoomId] = await loadUrlAndRoomId();
    myRoomIdText.value = myRoomId;
    roomIdText.value = roomId;
	sharedLinkText.value = url;

    console.log("Loaded RoomId =", roomId);
    console.log("Shared link =", url);
}


roomIdButton.onclick = (element) => {
    let newRoomId = roomIdText.value;
    if (newRoomId == roomId) {
        return;
    }
    console.log("Set new roomId=", newRoomId);
    roomId = newRoomId;
    dispatchEvent('rdt.setRoomId', {roomId: roomId});
}

playButton.onclick = (element) => {
    dispatchEvent('rdt.play.onclick', {state: 'play'});
};

init();

// setTimeButton.onclick = (element) => {
//     dispatchEvent('rdt.setTime', {time: 20});
// };

pauseButton.onclick = (element) => {
    dispatchEvent('rdt.play.onclick', {state: 'pause'});
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
