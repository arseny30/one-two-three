function injectScriptJs() {
  let s = document.createElement("script");
  s.src = chrome.runtime.getURL("script.js");
  s.onload = function () {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(s);
}

let socket;
const myID = Math.random();

function initSocketIO() {
  console.log("init socket io");
  //socket = io('https://127.0.0.1:3000/', {transports: ['websocket']});
  socket = io("https://52.200.6.77:3000", { transports: ["websocket"] });
  console.log("client connected");
  socket.on("my_pong", (msg) => {
    console.log(msg);
  });

  socket.on("rdt.play.onclick", (msg) => {
    console.log(`received new state from server on client`, msg);
    if (msg.id === myID) {
      console.log(`ignore command from myself`);
      return;
    }
    document.dispatchEvent(
      new CustomEvent("rdt.receiveState", { detail: msg })
    );
  });
}

const storageGet = (keys) =>
  new Promise((resolve) => chrome.storage.sync.get(keys, resolve));
const sleep = async (ms) => await new Promise((r) => setTimeout(r, ms));

const url = new URL(document.URL);
const room_id_str = "one_two_three_room_id";

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
  initSocketIO();
  await loadRoomId();

  document.addEventListener("rdt.emitState", (e) => {
    let state = e.detail;
    state.id = myID;
    socket.emit("rdt.play.onclick", state);
  });

  console.log("finish init OneTwoThree");
}

function init() {
  var initPromise = doInit();
}

init();
