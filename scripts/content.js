
const MAIN_VIDEO_PLAYER_SELECTOR = 'div#container.style-scope.ytd-player';

function createContainerElement(children) {
    const customDiv = document.createElement('div');
    customDiv.style.position = "fixed";
    customDiv.style.bottom = "0";
    customDiv.style.right = "0"
    // customDiv.style.backgroundColor = "red";
    customDiv.style.width = "40rem";
    customDiv.style.height = "25rem";
    customDiv.style.zIndex = "11111"
    customDiv.appendChild(children);
    return customDiv;
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
                console.log(mainVideoPlayer);
                console.log(videoElement);
                if (entry.isIntersecting) {
                    const { width, height } = defaultMainVideoParentElement.getBoundingClientRect();
                    videoElement.style.width = width + 'px';
                    videoElement.style.height = height + 'px';
                    defaultMainVideoParentElement.appendChild(mainVideoPlayer);
                } else {
                    const { width, height } = miniPlayerContainerElement.getBoundingClientRect();
                    videoElement.style.width = width + 'px';
                    videoElement.style.height = height + 'px';
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

function main() {
    const mainVideoPlayer = document.querySelector(MAIN_VIDEO_PLAYER_SELECTOR);
    if (mainVideoPlayer) {
        const mainVideoPlayerParent = mainVideoPlayer.parentNode;
        console.log('detected element ', mainVideoPlayer)
        console.log('detected parent ', mainVideoPlayerParent);
        const miniPlayerContainer = createContainerElement(mainVideoPlayer);
        const observer = new IntersectionObserver(intersectionCallback(miniPlayerContainer, mainVideoPlayerParent, mainVideoPlayer));
        observer.observe(mainVideoPlayerParent);
        document.querySelector('body').appendChild(miniPlayerContainer);
    }
}
setTimeout(main, 1500);
// waitForNode(MAIN_VIDEO_PLAYER_SELECTOR, main);