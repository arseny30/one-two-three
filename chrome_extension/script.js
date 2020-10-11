function setTimeNetflix(time) {
    const videoPlayer = netflix
        .appContext
        .state
        .playerApp
        .getAPI()
        .videoPlayer;

    // Getting player id
    const playerSessionId = videoPlayer
        .getAllPlayerSessionIds()[0]

    const player = videoPlayer
        .getVideoPlayerBySessionId(playerSessionId)
    player.seek(time * 1000);
}

const video = () => document.getElementsByTagName('video')[0];

function setTime(time) {
	if (time === video().currentTime) {
		console.log("Ignore redundant setTime", time);
		return;
	}
    console.log("Set Time to ", time);
    if (typeof netflix !== "undefined") {
        setTimeNetflix(time);
    } else {
        video().currentTime = time;
    }
}

document.addEventListener('rdt.play', function (e) {
    console.log("Play Video", e.detail);
    //document.getElementsByClassName("html5-main-video")[0].play();
	if ('state' in e.detail) {
        let state = e.detail.state
        if (state === 'pause') {
            video().pause();
        }
	}

    if ('time' in e.detail) {
        setTime(e.detail.time);
    }

	if ('state' in e.detail) {
        let state = e.detail.state
        if (state === 'play') {
            video().play();
        }
	}

    window.postMessage({type: "FROM_PAGE", text: "Hello from the webpage!"}, "*");
});

document.addEventListener('rdt.setTime', function (e) {
    console.log('received', e.detail);
    setTime(e.detail.time);
});

console.log("Script was injected");

