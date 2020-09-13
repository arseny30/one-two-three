function injectScriptJs() {
    let s = document.createElement('script');
    s.src = chrome.runtime.getURL('script.js');
    s.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}

function experimental() {
    window.addEventListener("message", function (event) {
        // We only accept messages from ourselves
        if (event.source != window)
            return;

        if (event.data.type && (event.data.type == "FROM_PAGE")) {
            console.log("Content script received: " + event.data.text);
            chrome.runtime.sendMessage({type: "FROM_PAGE", text: event.data.text}, function (response) {
                console.log(response);
            });
        }
    }, false);
}

let socket;

function initSocketIO() {
    console.log("init socket io");
    // socket = io('http://localhost:3000', {transports: ['polling']});
    // socket = io('https://127.0.0.1/', {transports: ['websocket']});
    socket = io('https://52.200.6.77:3000', {transports: ['websocket']});
    console.log('client connected')
    socket.on('my_pong', function (msg) {
        console.log(msg)
    });

    socket.on('rdt.play.onclick', function (msg) {
        console.log(`received play command on server on client`)
        document.dispatchEvent(new CustomEvent('rdt.play', {detail: msg}))
    })
}

const storageGet =
    keys => new Promise(resolve => chrome.storage.sync.get(keys, resolve));

async function loadRoomId() {
    let roomId = (await storageGet(["roomId"])).roomId;
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

    document.addEventListener('rdt.setRoomId', function (e) {
        console.log(e);
        console.log("set roomId=" + e.detail.roomId);
    });

    document.addEventListener('rdt.play.onclick', function (e) {
        socket.emit('rdt.play.onclick', e.detail)
    });

    console.log("finish init OneTwoThree");
}

function init() {
    var initPromise = doInit();
}


init();
