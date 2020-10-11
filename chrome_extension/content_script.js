function injectScriptJs() {
    let s = document.createElement('script');
    s.src = chrome.runtime.getURL('script.js');
    s.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}

function experimental() {
    window.addEventListener("message", event => {
        // We only accept messages from ourselves
        if (event.source != window)
            return;

        if (event.data.type && (event.data.type == "FROM_PAGE")) {
            console.log("Content script received: " + event.data.text);
            chrome.runtime.sendMessage({type: "FROM_PAGE", text: event.data.text}, (response) => {
                console.log(response);
            });
        }
    }, false);
}

let socket;
let immunityTill = 0;
const myID = Math.random();

function initSocketIO() {
    console.log("init socket io");
	//socket = io('https://127.0.0.1:3000/', {transports: ['websocket']});
	socket = io('https://52.200.6.77:3000', {transports: ['websocket']});
    console.log('client connected')
    socket.on('my_pong', msg => {
        console.log(msg)
    });

    socket.on('rdt.play.onclick', msg => {
        console.log(`received play command from server on client`, msg)
		if (msg.id === myID) {
			console.log(`ignore command from myself`)
			return;
		}
		immunityTill = Date.now() + 550;
        document.dispatchEvent(new CustomEvent('rdt.play', {detail: msg}))
    })
}

const storageGet =
    keys => new Promise(resolve => chrome.storage.sync.get(keys, resolve));
const sleep = async ms => await new Promise(r => setTimeout(r, ms));

const url = new URL(document.URL);
const room_id_str = 'one_two_three_room_id';

async function loadRoomId() {
	let roomId = url.searchParams.get(room_id_str);
	if (!roomId) {
		roomId = (await storageGet(["roomId"])).roomId;
		roomId = roomId + "_" + url.toString().hashCode().toString(36);
	}
    console.log("Got roomId=" + roomId, socket);
    socket.emit("setRoomId", roomId);
}

async function doInit() {
    if (window.hasOneTwoThree) {
        console.log("Skip content_script.js (already initialized)");
        return;
    }
    window.hasOneTwoThree = true;

    console.log("start init OneTwoThree");
    injectScriptJs();
    experimental();
    initSocketIO();
    await loadRoomId();

    document.addEventListener('rdt.setRoomId', e => {
        console.log(e);
        console.log("set roomId=" + e.detail.roomId);
        socket.emit("setRoomId", e.detail.roomId);
    });

    let video = null;
	while (true) {
		video = document.getElementsByTagName('video')[0];
		console.log("Got", video);
		if (video) {
			break;
		}
		console.log("sleep..");
		await sleep(500);
		console.log("wake up..");
	}
	console.log("Got video DOM element");

	video.addEventListener('play', e => {
		console.log(`got event 'play' currentTime=${video.currentTime}`);
		if (immunityTill > Date.now()) {
			console.log("skip play event because of immunity");
			return;
		}
        socket.emit('rdt.play.onclick', {id: myID, state: 'play', time: video.currentTime})

	});
	video.addEventListener('seeked', e => {
		console.log(`got event 'seeked' currentTime=${video.currentTime}`);
		if (immunityTill > Date.now()) {
			console.log("skip seeked event because of immunity");
			return;
		} else {
			console.log(`No immunity ${immunityTill} ${Date.now()}`);
		}
        socket.emit('rdt.play.onclick', {id: myID, time: video.currentTime})

	});
	video.addEventListener('pause', e => {
		console.log(`got event 'pause' currentTime=${video.currentTime}`);
		if (immunityTill > Date.now()) {
			console.log("skip pause event because of immunity");
			return;
		}
        socket.emit('rdt.play.onclick', {id: myID, state: 'pause', time: video.currentTime})
	});

    document.addEventListener('rdt.play.onclick', e => {
	    e.detail.time = video.currentTime;  
	    e.detail.id = myID;
        socket.emit('rdt.play.onclick', e.detail)
    });

    console.log("finish init OneTwoThree");
}

function init() {
    var initPromise = doInit();
}


init();
