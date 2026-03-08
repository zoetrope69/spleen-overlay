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
    imageSpleenFacingRight
  ] = await Promise.all([
    initImage('spleen--facing-left.png'),
    initImage('spleen--facing-right.png'),
  ]);

  return {
    imageSpleenFacingLeft,
    imageSpleenFacingRight
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const BUG_WIDTH = 69;
  const BUG_HEIGHT = 47;
  const SPLEEN_WIDTH = 100;
  const SPLEEN_HEIGHT = 50;
  const PADDING = 200;

  const bugContainerElement = document.querySelector('.bug-container');
  const bugElement = bugContainerElement.querySelector('.bug');
  const spleenContainerElement = document.querySelector('.spleen-container');
  const spleenElement = spleenContainerElement.querySelector('.spleen');
  const chompContainerElement = document.querySelector('.chomp-container');
  const chompSpleenElement = chompContainerElement.querySelector('.chomp__spleen');

  const {
    imageSpleenFacingLeft,
    imageSpleenFacingRight
  } = await initImages();

  document.body.style.opacity = '1';

  const bugPosX = betweenMinAndMax(PADDING, window.innerWidth - BUG_WIDTH - PADDING);
  const bugPosY = betweenMinAndMax(PADDING, window.innerHeight - BUG_HEIGHT - PADDING);
  const bugCenterPosX = bugPosX + (BUG_WIDTH / 2);
  const bugCenterPosY = bugPosY + (BUG_HEIGHT / 2);

  const isSpleenEnteringFromLeft = coinFlip();

  spleenElement.src = isSpleenEnteringFromLeft ?
    imageSpleenFacingRight :
    imageSpleenFacingLeft
  ;

  const spleenPosX = isSpleenEnteringFromLeft ?
    -(SPLEEN_WIDTH / 2) :
    window.innerWidth - (SPLEEN_WIDTH / 2)
  ;
  const spleenPosY = betweenMinAndMax(PADDING, window.innerHeight - SPLEEN_HEIGHT - PADDING);
  const spleenCenterPosX = spleenPosX + (SPLEEN_WIDTH / 2);
  const spleenCenterPosY = spleenPosY + (SPLEEN_HEIGHT / 2);
  
  const spleenAngle = angleBetweenPoints(
    isSpleenEnteringFromLeft,
    spleenCenterPosX, spleenCenterPosY,
    bugCenterPosX, bugCenterPosY
  );

  spleenElement.style.transform = `rotate(${spleenAngle}deg)`;
  spleenContainerElement.style.transform = `translate(${spleenPosX}px, ${spleenPosY}px)`;

  const bugAnimateInDurationMs = 1000;
  bugElement.style.animationDuration = `${bugAnimateInDurationMs}ms`;
  bugContainerElement.style.transform = `translate(${bugPosX}px, ${bugPosY}px)`;
  bugElement.classList.add('bug--animate-in');

  await wait(bugAnimateInDurationMs);

  spleenContainerElement.classList.add('spleen-container--transition-movement');
  spleenContainerElement.style.transform = `translate(${bugPosX}px, ${bugPosY}px)`;
  
  const travelDurationMs = 2000;
  spleenContainerElement.style.transitionDuration = `${travelDurationMs}ms`;

  await wait(travelDurationMs);

  const isSpleenKidnappingToRight = bugPosX > (window.innerWidth / 2);

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
    bugCenterPosX, bugCenterPosY,
    endSpleenPosX, bugPosY
  );

  const kidnappedBugPosX = isSpleenKidnappingToRight ?
    bugPosX + SPLEEN_WIDTH - (BUG_WIDTH / 2):
    bugPosX - (BUG_WIDTH / 2)
  ;

  const endBugPosX = isSpleenKidnappingToRight ?
    endSpleenPosX + SPLEEN_WIDTH - (BUG_WIDTH / 2):
    endSpleenPosX - (BUG_WIDTH / 2)
  ;

  const bugInMouthDurationsMs = 100;
    
  bugContainerElement.classList.add('bug-container--transition-movement');
  bugContainerElement.style.transform = `translate(${kidnappedBugPosX}px, ${bugPosY}px)`;
  bugContainerElement.style.transitionTimingFunction = 'ease-out';
  bugContainerElement.style.transitionDuration = `${bugInMouthDurationsMs}ms`;
  
  spleenElement.style.transform = `rotate(${kidnapAngle}deg)`;

  await wait(bugInMouthDurationsMs);

  const kidnapTravelDurationMs = 500;

  bugContainerElement.style.transitionDuration = `${kidnapTravelDurationMs}ms`;
  bugContainerElement.style.transform = `translate(${endBugPosX}px, ${bugPosY}px)`;
  spleenContainerElement.style.transform = `translate(${endSpleenPosX}px, ${bugPosY}px)`;
  spleenContainerElement.style.transitionDuration = `${kidnapTravelDurationMs}ms`;
  spleenContainerElement.style.transitionTimingFunction = 'ease-out';

  await wait(kidnapTravelDurationMs);

  const slideInChompDurationMs = 1000;
  chompContainerElement.classList.add(
    `chomp-container--from-${isSpleenKidnappingToRight ? 'right' : 'left'}`
  );
  chompContainerElement.style.animationDuration = `${slideInChompDurationMs}ms`;
  chompSpleenElement.src = isSpleenKidnappingToRight ?
    imageSpleenFacingLeft :
    imageSpleenFacingRight    
  ;
  
  const chompAnimationDurationMs = slideInChompDurationMs + 1000;

  await wait(chompAnimationDurationMs);

  const slideOutChompDurationMs = 1000;
  chompContainerElement.classList.add(
    `chomp-container--to-${isSpleenKidnappingToRight ? 'right' : 'left'}`
  );
  chompContainerElement.style.animationDuration = `${slideOutChompDurationMs}ms`;
  await wait(slideOutChompDurationMs);

  document.body.style.opacity = '0';
});