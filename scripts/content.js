
const MAIN_VIDEO_PLAYER_SELECTOR = 'div#container.style-scope.ytd-player';
const MINI_PLAYER_ID = 'scroll-mini-player'

/**
 * @type{IntersectionObserver}
 */
let INTERSECTION_OBSERVER;

function logger(message, level = 'log') {
    switch (level) {
        case 'log':
            console.log(`[MINI PLAYER] : ${message}`)
            break;
        default:
            console.error(`[MINI PLAYER] : ${message}`)
    }
}

function createContainerElement(width, height) {
    let container = document.getElementById(MINI_PLAYER_ID);
    if (container) {
        return container;
    }
    container = document.createElement('div');
    container.style.position = "fixed";
    container.style.bottom = "0";
    container.style.right = "0"
    container.style.width = width + 'px';
    container.style.height = height + 'px';
    container.style.zIndex = "11111"
    container.style.display = "none";
    container.id = MINI_PLAYER_ID;
    return container;
}

/**
 * 
 * @param {HTMLElement} miniPlayerContainerElement 
 * @param {HTMLElement} defaultMainVideoParentElement
 * @param {HTMLElement} mainVideoPlayer
 * @returns 
 */
function intersectionCallback(miniPlayerContainerElement, defaultMainVideoParentElement, mainVideoPlayer) {
    return function (entries, observer) {
        entries.forEach(entry => {
            try {
                const videoElement = mainVideoPlayer.querySelector('video');
                const playerControls = mainVideoPlayer.querySelector('.ytp-chrome-bottom');
                videoElement.style.left = "0px";
                if (entry.isIntersecting) {
                    logger('intersecting window')
                    const { width, height } = defaultMainVideoParentElement.getBoundingClientRect();
                    videoElement.style.width = width + 'px';
                    playerControls.style.width = width + 'px';
                    videoElement.style.height = height + 'px';
                    defaultMainVideoParentElement.appendChild(mainVideoPlayer);
                    miniPlayerContainerElement.style.display = "none";
                } else {
                    logger('out of window')
                    miniPlayerContainerElement.style.display = "block";
                    const { width, height } = miniPlayerContainerElement.getBoundingClientRect();
                    videoElement.style.width = width + 'px';
                    videoElement.style.height = height + 'px';
                    playerControls.style.width = width + 'px';
                    miniPlayerContainerElement.appendChild(mainVideoPlayer);
                }
            } catch (err) {
                console.log('Intersection observer error ', err)
            }

        });
    }
}

function waitForNode(selector, callback) {
    const targetNode = document.body;
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            const nodes = Array.from(mutation.addedNodes);
            for (const node of nodes) {
                if (node.nodeType === 1 && node.matches(selector)) {
                    observer.disconnect();
                    callback();
                    return;
                }
            }
        });
    });
    const config = { childList: true, subtree: true };
    observer.observe(targetNode, config);
}

function mountMiniPlayer() {
    const mainVideoPlayer = document.querySelector(MAIN_VIDEO_PLAYER_SELECTOR);
    if (mainVideoPlayer) {
        logger('mounting mini player')
        const mainVideoPlayerParent = mainVideoPlayer.parentNode;        
        const mainVideoPlayerVideoElement = mainVideoPlayer.querySelector('video')?.getBoundingClientRect();

        const { width, height } = mainVideoPlayerParent.getBoundingClientRect();
        const miniPlayerContainer = createContainerElement(width * 0.3, height * 0.4);
        if (!INTERSECTION_OBSERVER) {
            INTERSECTION_OBSERVER = new IntersectionObserver(intersectionCallback(miniPlayerContainer, mainVideoPlayerParent, mainVideoPlayer));
        }
        INTERSECTION_OBSERVER.observe(mainVideoPlayerParent);
        if (!document.querySelector(`#${MINI_PLAYER_ID}`)) {
            document.querySelector('body').appendChild(miniPlayerContainer);
        }
    }
}

function handleMiniPlayerRemoval() {
    const miniplayer = document.querySelector(`#${MINI_PLAYER_ID}`);
    if (INTERSECTION_OBSERVER) {
        INTERSECTION_OBSERVER.disconnect()
    }
    if (miniplayer) {
        miniplayer.style.display = 'none';
    }
}

function getVideoId() {
    const urlObject = new URL(window.location.href);
    return urlObject.searchParams.get('v');
}

function isVideoLoaded() {
    const videoId = getVideoId();
    return (
        document.querySelector(`ytd-watch-flexy[video-id='${videoId}']`) !== null
    );
}

function watchPageHandler() {
    if (!window.location.href.includes('watch')) {
        logger('not the watch page');
        handleMiniPlayerRemoval();
        return;
    }

    function waitForWindow() {
        if (isVideoLoaded()) {
            logger('video loaded detected');
            setTimeout(mountMiniPlayer, 1000);
            clearInterval(checkVideoTimer);
        }
    }

    let checkVideoTimer;
    logger('setting up check video timer')
    checkVideoTimer = setInterval(waitForWindow, 111);
}



// setTimeout(main, 1500);
// waitForNode(MAIN_VIDEO_PLAYER_SELECTOR, main);
window.addEventListener('yt-navigate-finish', () => {
    watchPageHandler();
}, true)