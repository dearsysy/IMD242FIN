const aspectW = 4;
const aspectH = 3;

const container = document.body.querySelector('.container-canvas');

//생성되는 문자 개수
let maxRects = 35;
let rects = [];
let alphabet = 'abcdefghijklmnopqrstuvwxyz!*-:?';
let video;
let handPose;
let hands = [];
let fontSize = 35;
let defaultStartX = 0;
let defaultStartY = 0;
let font;

function preload() {
  handPose = ml5.handPose({ flipped: true });
  font = loadFont(
    'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxM.woff'
  );
}

function setup() {
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();
  if (aspectW === 0 || aspectH === 0) {
    createCanvas(containerW, containerH).parent(container);
  } else if (containerW / containerH > aspectW / aspectH) {
    createCanvas((containerH * aspectW) / aspectH, containerH).parent(
      container
    );
  } else {
    createCanvas(containerW, (containerW * aspectH) / aspectW).parent(
      container
    );
  }

  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  noStroke();

  video = createCapture(VIDEO, { flipped: true });
  video.hide();
  handPose.detectStart(video, gotHands);

  //초기 문자 배열
  for (let i = 0; i < maxRects; i++) {
    rects.push({
      x: random(width),
      y: random(height),
      w: fontSize,
      h: fontSize,
      letter: alphabet.charAt(floor(random(alphabet.length))),

      //안 붙은 상태
      isAttached: false,
    });
  }
}

function resetRects() {
  rects = [];
  for (let i = 0; i < maxRects; i++) {
    rects.push({
      x: random(width),
      y: random(height),
      w: fontSize,
      h: fontSize,
      letter: alphabet.charAt(floor(random(alphabet.length))),
    });
  }
}

function draw() {
  background(100, 100, 100);
  image(video, 0, 0, width, height);

  //손가락 위치 감지
  let thumbX, thumbY, indexX, indexY, distance;
  if (hands.length > 0) {
    let thumb = hands[0].keypoints[8];
    let index = hands[0].keypoints[4];
    thumbX = map(thumb.x, 0, video.width, 0, width);
    thumbY = map(thumb.y, 0, video.height, 0, height);
    indexX = map(index.x, 0, video.width, 0, width);
    indexY = map(index.y, 0, video.height, 0, height);

    //엄지 검지 맞닿았을 때 화면 초기화
    distance = dist(thumbX, thumbY, indexX, indexY);

    if (distance <= 50) {
      resetRects();
    }

    fill(0, 255, 0);
    noStroke();
    ellipse(thumbX, thumbY, 10, 10);
    fill(50, 106, 217);
    ellipse(indexX, indexY, 10, 10);
  }

  let attachedRects = [];
  let unattachedRects = [];

  //붙은 문자와 안 붙은 문자 분리
  for (let i = 0; i < rects.length; i++) {
    let rectObj = rects[i];
    if (
      !rectObj.isAttached &&
      dist(thumbX, thumbY, rectObj.x, rectObj.y) < 50
    ) {
      rectObj.isAttached = true;
      attachedRects.push(rectObj);
    } else if (rectObj.isAttached) {
      attachedRects.push(rectObj);
    } else {
      unattachedRects.push(rectObj);
    }
  }

  //붙은 문자의 간격과 위치 조정
  let spacing = -25;
  let startX =
    attachedRects.length > 0
      ? thumbX - ((attachedRects.length - 1) * spacing) / 2
      : defaultStartX;
  let startY = attachedRects.length > 0 ? thumbY : defaultStartY;

  //손이 화면 밖으로 나가면 붙었던 문자가 떨어지도록 함
  if (thumbX < 0 || thumbX > width || thumbY < 0 || thumbY > height) {
    attachedRects.forEach((rect) => (rect.isAttached = false));
    startX = thumbX - ((attachedRects.length - 1) * spacing) / 2;
  }

  //붙은 문자들이 손을 부드럽게 따라다니도록 함
  for (let i = 0; i < attachedRects.length; i++) {
    let rectObj = attachedRects[i];
    rectObj.x = lerp(rectObj.x, startX + i * spacing, 0.5);
    rectObj.y = lerp(rectObj.y, startY, 0.5) + 10;
  }

  rects = unattachedRects.concat(attachedRects);

  //각 문자 위치에 픽셀로 그리기
  for (let i = 0; i < rects.length; i++) {
    let rectObj = rects[i];

    let points = font.textToPoints(
      rectObj.letter,
      rectObj.x - rectObj.w / 2,
      rectObj.y + rectObj.h / 2,
      fontSize,
      { sampleFactor: 0.25, simplifyThreshold: 0 }
    );

    for (let j = 0; j < points.length; j++) {
      let pt = points[j];
      if (rectObj.isAttached) {
        noStroke();
        fill(243, 251, 113);
        let outerSize2 = 6;
        rect(pt.x, pt.y, outerSize2, outerSize2);
        fill(50, 106, 217);
        stroke(50, 106, 217);
        strokeWeight(2.1);
      } else {
        fill(255, 50);
      }

      rect(pt.x, pt.y, 3.2, 3.2);

      stroke(24, 166, 56);
      strokeWeight(0.2);
      noFill();
      let outerSize1 = 7;
      rect(pt.x, pt.y, outerSize1, outerSize1);
    }
  }
}

function gotHands(results) {
  hands = results;
}

function windowResized() {
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();
  if (aspectW === 0 || aspectH === 0) {
    resizeCanvas(containerW, containerH);
  } else if (containerW / containerH > aspectW / aspectH) {
    resizeCanvas((containerH * aspectW) / aspectH, containerH);
  } else {
    resizeCanvas(containerW, (containerW * aspectH) / aspectW);
  }
}
