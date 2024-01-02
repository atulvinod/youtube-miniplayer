
const MAIN_VIDEO_PLAYER_SELECTOR = 'div#container.style-scope.ytd-player';
const MINI_PLAYER_ID = 'scroll-mini-player'
const PLAYER_CONTROL_SELECTOR = '.ytp-chrome-bottom';
const DEFAULT_MAIN_VIDEO_PLAYER_PARENT_SELECTOR = 'ytd-player'

let CURRENT_ORIGINAL_PLAYER_DIMENSIONS = null;

/**
 * @type{IntersectionObserver}
 */
let INTERSECTION_OBSERVER = null;

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

function shiftVideoToMiniPlayer(mainVideoPlayer, miniPlayerContainerElement) {
    const videoElement = mainVideoPlayer.querySelector('video');
    const playerControls = mainVideoPlayer.querySelector(PLAYER_CONTROL_SELECTOR);
    miniPlayerContainerElement.style.display = "block";
    const { width, height } = miniPlayerContainerElement.getBoundingClientRect();
    videoElement.style.left = '0px';
    videoElement.style.width = width + 'px';
    videoElement.style.height = height + 'px';
    playerControls.style.width = width + 'px';
    miniPlayerContainerElement.appendChild(mainVideoPlayer);
}

function shiftVideoToOriginalParent(mainVideoPlayer, miniPlayerContainerElement, defaultMainVideoParentElement, originalVideoDimensions, originalPlayerControlDimensions) {
    const videoElement = mainVideoPlayer.querySelector('video');
    const playerControls = mainVideoPlayer.querySelector(PLAYER_CONTROL_SELECTOR);
    const { width, height, left } = originalVideoDimensions;
    videoElement.style.width = width + 'px';
    videoElement.style.height = height + 'px';
    videoElement.style.left = left;
    playerControls.style.width = originalPlayerControlDimensions.width + 'px';
    defaultMainVideoParentElement.appendChild(mainVideoPlayer);
    miniPlayerContainerElement.style.display = "none";
}

/**
 * 
 * @param {HTMLElement} miniPlayerContainerElement 
 * @param {HTMLElement} defaultMainVideoParentElement
 * @param {HTMLElement} mainVideoPlayer
 * @returns 
 */
function intersectionCallback(miniPlayerContainerElement, defaultMainVideoParentElement, mainVideoPlayer, originalVideoDimensions, originalPlayerControlDimensions) {

    return function (entries, observer) {
        entries.forEach(entry => {
            try {
                if (entry.isIntersecting) {
                    logger('intersecting window')
                    shiftVideoToOriginalParent(mainVideoPlayer, miniPlayerContainerElement, defaultMainVideoParentElement, originalVideoDimensions, originalPlayerControlDimensions);
                } else {
                    logger('out of window')
                    shiftVideoToMiniPlayer(mainVideoPlayer, miniPlayerContainerElement);
                }
            } catch (err) {
                console.log('Intersection observer error ', err)
            }

        });
    }
}

function getOriginalVideoDimensions(mainVideoPlayer, override = false) {
    if (CURRENT_ORIGINAL_PLAYER_DIMENSIONS && !override) {
        return CURRENT_ORIGINAL_PLAYER_DIMENSIONS;
    }
    if (!mainVideoPlayer) {
        throw new Error('Main Video player element required to get original player video dimensions');
    }

    let originalVideoElementDimensions = {}
    const originalVideoPlayer = mainVideoPlayer.querySelector('video')
    if (originalVideoPlayer) {
        const { width, height } = originalVideoPlayer.getBoundingClientRect();
        const left = originalVideoPlayer.style.left;
        originalVideoElementDimensions = { width, height, left }
        logger('original video dimensions ' + JSON.stringify(originalVideoElementDimensions));
    }
    const originalPlayerControlDimensions = document.querySelector(PLAYER_CONTROL_SELECTOR)?.getBoundingClientRect();

    CURRENT_ORIGINAL_PLAYER_DIMENSIONS = { originalPlayerControlDimensions, originalVideoElementDimensions }
    return CURRENT_ORIGINAL_PLAYER_DIMENSIONS;

}

function mountMiniPlayer() {
    const mainVideoPlayer = document.querySelector(MAIN_VIDEO_PLAYER_SELECTOR);
    if (mainVideoPlayer) {
        logger('mounting mini player')
        const { originalPlayerControlDimensions, originalVideoElementDimensions } = getOriginalVideoDimensions(mainVideoPlayer, true);
        const mainVideoPlayerParent = document.querySelector(DEFAULT_MAIN_VIDEO_PLAYER_PARENT_SELECTOR);
        const { width, height } = mainVideoPlayerParent.getBoundingClientRect();
        const miniPlayerContainer = createContainerElement(width * 0.3, height * 0.4);

        if (INTERSECTION_OBSERVER) {
            INTERSECTION_OBSERVER.disconnect();
        }

        INTERSECTION_OBSERVER = new IntersectionObserver(intersectionCallback(miniPlayerContainer, mainVideoPlayerParent, mainVideoPlayer, originalVideoElementDimensions, originalPlayerControlDimensions));

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
        INTERSECTION_OBSERVER = null;
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

function pageNavigateStartHandler() {
    /**
     * To readd the original player back to initial state in order to
     * prevent the breaking of the player when navigating to the watch page again
     */
    document.documentElement.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

window.addEventListener('yt-navigate-start', () => {
    logger('start navigation ' + window.location.href);
    pageNavigateStartHandler();
})

window.addEventListener('yt-navigate-finish', () => {
    logger('end navigation')
    watchPageHandler();
}, true)

watchPageHandler();