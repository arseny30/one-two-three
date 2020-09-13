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

let video = document.getElementsByTagName('video')[0];

document.addEventListener('rdt.play', function (e) {
    console.log("Play Video");
    //document.getElementsByClassName("html5-main-video")[0].play();
    let state = e.detail.state
    if (state === 'play') {
        video.play();
    } else if (state === 'pause') {
        video.pause();
    }


    window.postMessage({type: "FROM_PAGE", text: "Hello from the webpage!"}, "*");
});

document.addEventListener('rdt.setTime', function (e) {
    console.log('received', e.detail);
    let time = e.detail.time;
    console.log("Set Time to ", time);
    if (typeof netflix !== "undefined") {
        setTimeNetflix(time);
    } else {
        video.currentTime = e.detail.time;
    }
});

console.log("Script was injected");

