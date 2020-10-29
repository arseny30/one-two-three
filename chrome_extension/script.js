function setTimeNetflix(time) {
  const videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;

  // Getting player id
  const playerSessionId = videoPlayer.getAllPlayerSessionIds()[0];

  const player = videoPlayer.getVideoPlayerBySessionId(playerSessionId);
  player.seek(time * 1000);
}

function getVideo() {
  return document.getElementsByTagName("video")[0];
}

function setTime(video, time) {
  console.log("Set Time to ", time);
  if (typeof netflix !== "undefined") {
    setTimeNetflix(time);
  } else {
    video.currentTime = time;
  }
}

function stateToString(state) {
  return `paused=${state.paused} time=${state.currentTime}`;
}

class OneTwoThree {
  // called when new State should be send to everybody in the room
  onEmitState = undefined;
  // called when state should be applied to the video
  onApplyState = undefined;

  // got state update from HTML events
  updateState(state, now) {
    state.createdAt = now;
    this.#newState = state;
    if (this.#newStateTimer) {
      return;
    }
    this.#newStateTimer = setTimeout(() => {
      this.#doUpdateVideoState();
    }, 3);
  }

  // got update from server
  receiveState(newState, now) {
    this.#doUpdateVideoState();

    // esmitate changes to ignore them later
    let statesToIgnore = this.#genStatesToIgnore(this.#state, newState);
    statesToIgnore.reverse();
    this.#statesToIgnore.unshift(...statesToIgnore);

    this.onApplyState(newState);
  }

  #sourceId = "TODO";
  #state = { paused: true, position: 0 };
  #newState = undefined;
  #newStateTimer = undefined;
  #statesToIgnore = [];

  #similarPosition(a, b) {
    return Math.abs(a - b) < 0.01;
  }

  #isSimilar(a, b) {
    return (
      a.paused === b.paused && Math.abs(a.currentTime - b.currentTime) < 200
    );
  }

  #shouldIgnore(newState, oldState) {
    let newStatesToIgnore = [];
    let now = Date.now();
    let shouldIgnore = false && this.#isSimilar(newState, oldState);
    for (let state of this.#statesToIgnore) {
      if (state.createdAt + 2000 < now) {
        break;
      }
      if (this.#isSimilar(state, newState)) {
        shouldIgnore = true;
        //break;
      }
      newStatesToIgnore.push(state);
    }
    this.#statesToIgnore = newStatesToIgnore;
    return shouldIgnore;
  }

  #genStatesToIgnore(from, to) {
    let res = [];
    let add = (x) => res.push(x);

    from.createdAt = to.createdAt;
    if (from.paused === to.paused) {
      if (from.paused) {
        add(to);
        return res;
      }
      from.paused = false;
      add(from);
    }
    if (!this.#similarPosition(from.currentTime, to.currentTime)) {
      from.currentTime = to.currentTime;
      add(from);
    }
    if (from.pause != to.paused) {
      from.paused = to.paused;
      add(from);
    }
    return res;
  }

  #doUpdateVideoState() {
    if (!this.#newStateTimer) {
      return;
    }
    let oldState = this.#state;
    let newState = this.#newState;
    console.log("state DO UPDATE", stateToString(newState));
    this.#state = newState;
    this.#newStateTimer = undefined;

    if (this.#shouldIgnore(newState, oldState)) {
      console.log("state IGNORE", stateToString(newState));
      return;
    }

    this.onEmitState?.(newState);
  }
}

var ott = new OneTwoThree();

function onStateChanged() {
  let video = getVideo();
  let state = { paused: video.paused, currentTime: video.currentTime };
  console.log("state CHANGED", stateToString(state));

  ott.updateState(state, Date.now());
}

function onReceiveState(state) {
  console.log("state RECEIVE", stateToString(state));
  ott.receiveState(state, Date.now());
}

function emitState(state) {
  console.log("state EMIT", stateToString(state));
  document.dispatchEvent(new CustomEvent("rdt.emitState", { detail: state }));
}

function applyState(state) {
  console.log("state APPLY", stateToString(state));
  let video = getVideo();
  if (!video) {
    return;
  }
  if (state.paused != video.paused && state.paused) {
    video.pause();
  }
  if (Math.abs(state.currentTime - video.currentTime) > 0.01) {
    setTime(video, state.currentTime);
  }
  if (state.paused != video.paused && !state.paused) {
    video.play();
  }
}

function initOneTwoThree() {
  let video = getVideo();
  if (video.onplay === onStateChanged) {
    return;
  }
  video.onplay = onStateChanged;
  video.onseeking = onStateChanged;
  video.onpause = onStateChanged;

  ott.onEmitState = emitState;
  ott.onApplyState = applyState;
  onStateChanged();
}
document.addEventListener("rdt.receiveState", (e) => {
  onReceiveState(e.detail);
});
setInterval(initOneTwoThree, 1000);
console.log("Script was injected");
