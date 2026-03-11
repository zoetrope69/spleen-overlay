function betweenMinAndMax(min, max) {
  return min + ((max - min) * Math.random());
}

function angleBetweenPoints(isFacingRight, originX, originY, targetX, targetY) {
  const dx = originX - targetX;
  const dy = originY - targetY;

  let theta;
  if (isFacingRight) {
    theta = Math.atan2(-dy, -dx);
  } else {
    theta = Math.atan2(dy, dx);
  }

  theta *= 180 / Math.PI;    
  if (theta < 0) theta += 360;

  return theta;
}

function coinFlip() {
  return Math.random() > 0.5;
}

async function wait(delayMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function initImage(filePath) {
  return new Promise((resolve) => {
    const image = new Image();
    const src =  `./images/${filePath}`;
    image.src = src
    image.addEventListener('load', () => {
      resolve(src);
    });
  })
}

async function initImages() {
  const [
    imageSpleenFacingLeft,
    imageSpleenFacingRight,
    imageSpleenChompStill
  ] = await Promise.all([
    initImage('spleen--facing-left.gif'),
    initImage('spleen--facing-right.gif'),
    initImage('spleen--chomp-still.gif'),
  ]);

  return {
    imageSpleenFacingLeft,
    imageSpleenFacingRight,
    imageSpleenChompStill
  }
}

async function initAudio(filePath) {
  return new Promise((resolve) => {
    const src =  `./sounds/${filePath}`;
    const audio = new Audio(src);
    audio.addEventListener("canplaythrough", () => {
      resolve(audio);
    });
  })
}

async function initSounds() {
  const [
    soundPop,
    soundWalking,
    soundHeart,
  ] = await Promise.all([
    initAudio('pop.mp3'),
    initAudio('mr-krabs-walking.mp3'),
    initAudio('sims-2-wish-fulfilled.mp3'),
  ]);

  return {
    soundPop,
    soundWalking,
    soundHeart,
  }
}

function connectToFireBotWebsocket() {
  // Create WebSocket connection.
  const socket = new WebSocket("ws://localhost:7472");

  // Connection opened
  socket.addEventListener("open", () => {
    console.log('connected');

    // subscribe to events in firebot
    socket.send(JSON.stringify({
      "type": "invoke",
      "id": 0,
      "name": "subscribe-events",
      "data": []
    }));
  });

  socket.addEventListener("error", (event) => {
    console.log('error', event)
  });

  socket.addEventListener("close", (event) => {
    console.log("closed", event);
  });

  return socket;
}

function feedSpleenChannelPointRedemptionEvents(callback) {
  if (!callback) {
    console.log('no callback sent to function');
    return;
  }

  const fireBotWebsocket = connectToFireBotWebsocket();

  fireBotWebsocket.addEventListener("message", (event) => {
    console.log("Message from server ", event.data);

    let json;
    try {
      json = JSON.parse(event.data);
    } catch (e) {
      // .. json didnt work
    }

    if (!json) {
      console.log('missing data');
      return;
    }

    if (json?.name !== "custom-event:spleen-overlay") {
      return;
    }

    const { data } = json;
    callback(data);
  });
}

function getEmojisFromMessage(text) {
  const SUPPORTED_EMOJI_REGEX_PATTERN_STRING = String.raw`(?:🐞|🐛|🦟|🪳|🕷️|🪲|🐜|🪰|🪱)`
  const emojiRegex = new RegExp(SUPPORTED_EMOJI_REGEX_PATTERN_STRING, "g");

  return [...text.matchAll(emojiRegex)];
}

function playSound(audio) {
  if (audio.paused) {
    audio.play();
  } else {
    audio.currentTime = 0
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const EMOJI_WIDTH = 64;
  const EMOJI_HEIGHT = 64;
  const SPLEEN_WIDTH = 224;
  const SPLEEN_HEIGHT = 91;
  const PADDING = 200;

  const emojiContainerElement = document.querySelector('.emoji-container');
  const emojiElement = emojiContainerElement.querySelector('.emoji');
  const spleenContainerElement = document.querySelector('.spleen-container');
  const spleenElement = spleenContainerElement.querySelector('.spleen');
  const chompContainerElement = document.querySelector('.chomp-container');
  const chompEmojiElement = chompContainerElement.querySelector('.chomp__emoji');
  const chompSpleenElement = chompContainerElement.querySelector('.chomp__spleen');
  const chompReactionElement = chompContainerElement.querySelector('.chomp__reaction');

  const {
    imageSpleenFacingLeft,
    imageSpleenFacingRight,
    imageSpleenChompStill,
  } = await initImages();

  const {
    soundPop,
    soundWalking,
    soundHeart,
  } = await initSounds();

  async function runSpleenAnimation({ emoji }) {
    if (!emoji) {
      console.log('no emoji sent')
      return;
    }

    emojiElement.innerText = emoji;
    chompEmojiElement.innerText = emoji;

    document.body.style.opacity = '1';

    const emojiPosX = betweenMinAndMax(PADDING, window.innerWidth - EMOJI_WIDTH - PADDING);
    const emojiPosY = betweenMinAndMax(PADDING, window.innerHeight - EMOJI_HEIGHT - PADDING);
    const emojiCenterPosX = emojiPosX + (EMOJI_WIDTH / 2);
    const emojiCenterPosY = emojiPosY + (EMOJI_HEIGHT / 2);

    const isSpleenEnteringFromLeft = coinFlip();

    spleenElement.style.width = `${SPLEEN_WIDTH}px`;
    spleenElement.style.height = `${SPLEEN_HEIGHT}px`;
    spleenElement.src = isSpleenEnteringFromLeft ?
      imageSpleenFacingRight :  
      imageSpleenFacingLeft
    ;

    const spleenPosX = isSpleenEnteringFromLeft ?
      -SPLEEN_WIDTH :
      window.innerWidth + SPLEEN_WIDTH
    ;
    const spleenPosY = betweenMinAndMax(PADDING, window.innerHeight - SPLEEN_HEIGHT - PADDING);
    const spleenCenterPosX = spleenPosX + (SPLEEN_WIDTH / 2);
    const spleenCenterPosY = spleenPosY + (SPLEEN_HEIGHT / 2);
    
    const spleenAngle = angleBetweenPoints(
      isSpleenEnteringFromLeft,
      spleenCenterPosX, spleenCenterPosY,
      emojiCenterPosX, emojiCenterPosY
    );

    spleenElement.style.transform = `rotate(${spleenAngle}deg)`;
    spleenContainerElement.style.transform = `translate(${spleenPosX}px, ${spleenPosY}px)`;

    playSound(soundPop);

    const emojiAnimateInDurationMs = 1000;
    emojiElement.style.animationDuration = `${emojiAnimateInDurationMs}ms`;
    emojiContainerElement.style.transform = `translate(${emojiPosX}px, ${emojiPosY}px)`;
    emojiElement.classList.add('emoji--animate-in');

    await wait(emojiAnimateInDurationMs);

    playSound(soundWalking);
    spleenContainerElement.classList.add('spleen-container--transition-movement');
    spleenContainerElement.style.transform = `translate(${isSpleenEnteringFromLeft ? emojiPosX - SPLEEN_WIDTH : emojiPosX}px, ${emojiPosY}px)`;
    
    const travelDurationMs = 2000;
    spleenContainerElement.style.transitionDuration = `${travelDurationMs}ms`;

    await wait(travelDurationMs);

    // temporary make it so spleen is always coming from right
    // const isSpleenKidnappingToRight = emojiPosX > (window.innerWidth / 2);
    const isSpleenKidnappingToRight = true;

    spleenElement.src = isSpleenKidnappingToRight ?
      imageSpleenFacingRight :  
      imageSpleenFacingLeft
    ;

    const endSpleenPosX = isSpleenKidnappingToRight ? 
      window.innerWidth + SPLEEN_WIDTH :
      -SPLEEN_WIDTH
    ;
    const kidnapAngle = angleBetweenPoints(
      isSpleenKidnappingToRight,
      emojiCenterPosX, emojiCenterPosY,
      endSpleenPosX, emojiPosY
    );

    let kidnappedEmojiPosX;
    if (isSpleenEnteringFromLeft) {
      if (isSpleenKidnappingToRight) {
        kidnappedEmojiPosX = emojiPosX - (EMOJI_WIDTH / 2);
      } else {
        kidnappedEmojiPosX = emojiPosX - SPLEEN_WIDTH - (EMOJI_WIDTH / 2);
      }
    } else {
      if (isSpleenKidnappingToRight) {
        kidnappedEmojiPosX = emojiPosX + SPLEEN_WIDTH - (EMOJI_WIDTH / 2);
      } else {
        kidnappedEmojiPosX = emojiPosX - (EMOJI_WIDTH / 2);
      }
    }

    let endEmojiPosX;
    if (isSpleenEnteringFromLeft) {
      if (isSpleenKidnappingToRight) {
        endEmojiPosX = endSpleenPosX - (EMOJI_WIDTH / 2);
      } else {
        endEmojiPosX = endSpleenPosX - SPLEEN_WIDTH - (EMOJI_WIDTH / 2);
      }
    } else {
      if (isSpleenKidnappingToRight) {
        endEmojiPosX = endSpleenPosX + SPLEEN_WIDTH - (EMOJI_WIDTH / 2);
      } else {
        endEmojiPosX = endSpleenPosX - (EMOJI_WIDTH / 2);
      }
    }

    const emojiInMouthDurationsMs = 50;
      
    emojiContainerElement.classList.add('emoji-container--transition-movement');
    emojiContainerElement.style.transform = `translate(${kidnappedEmojiPosX}px, ${emojiPosY}px)`;
    emojiContainerElement.style.transitionTimingFunction = 'ease-out';
    emojiContainerElement.style.transitionDuration = `${emojiInMouthDurationsMs}ms`;
    
    spleenElement.style.transform = `rotate(${kidnapAngle}deg)`;

    await wait(emojiInMouthDurationsMs);

    const kidnapTravelDurationMs = 500;

    emojiContainerElement.style.transitionDuration = `${kidnapTravelDurationMs}ms`;
    emojiContainerElement.style.transform = `translate(${endEmojiPosX}px, ${emojiPosY}px)`;
    spleenContainerElement.style.transform = `translate(${endSpleenPosX}px, ${emojiPosY}px)`;
    spleenContainerElement.style.transitionDuration = `${kidnapTravelDurationMs}ms`;
    spleenContainerElement.style.transitionTimingFunction = 'ease-out';

    await wait(kidnapTravelDurationMs);

    soundWalking.pause();
    
    const slideInOutChompDurationMs = 1000;

    chompContainerElement.classList.add(
      `chomp-container--from-${isSpleenKidnappingToRight ? 'right' : 'left'}`
    );
    chompContainerElement.style.animationDuration = `${slideInOutChompDurationMs}ms`;
    chompSpleenElement.src = imageSpleenChompStill;

    await wait(slideInOutChompDurationMs);

    playSound(soundHeart);

    const reactionDurationMs = 3000;

    chompReactionElement.classList.add('chomp__reaction--fade-in-out');
    chompReactionElement.style.animationDuration = `${reactionDurationMs}ms`;

    await wait(reactionDurationMs);

    chompContainerElement.classList.add(
      `chomp-container--to-${isSpleenKidnappingToRight ? 'right' : 'left'}`
    );

    await wait(slideInOutChompDurationMs);

    document.body.style.opacity = '0';

    // reset everything isnt it
    emojiElement.classList.remove('emoji--animate-in');
    spleenContainerElement.classList.remove('spleen-container--transition-movement');
    emojiContainerElement.classList.remove('emoji-container--transition-movement');
    chompContainerElement.classList.remove('chomp-container--from-left');
    chompContainerElement.classList.remove('chomp-container--from-right');
    chompContainerElement.classList.remove('chomp-container--to-left');
    chompContainerElement.classList.remove('chomp-container--to-right');
    chompReactionElement.classList.remove('chomp__reaction--fade-in-out');

    emojiContainerElement.style = '';
    emojiElement.style = '';
    spleenContainerElement.style = '';
    spleenElement.style = '';
    chompContainerElement.style = '';
    chompEmojiElement.style = '';
    chompSpleenElement.style = '';
    chompReactionElement.style = '';
  }

  feedSpleenChannelPointRedemptionEvents((data) => {
    const emojis = getEmojisFromMessage(data.channelPointRewardMessage);

    if (emojis.length === 0) {
      return;
    }

    const [emoji] = emojis;

    runSpleenAnimation({ emoji });
  });
});
