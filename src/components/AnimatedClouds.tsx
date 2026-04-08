"use client";

// =============================================================================
// NaKmetiji.si — AnimatedClouds
// Bogato slojeviti ilustrirani oblaki s sencami, gradienti in globino
// + živa megla ki počasi drsi
// =============================================================================

/**
 * Illustrated cloud with depth: shadow layer + main body with gradient + highlight
 */
function CloudIllustrated1({ scale = 1 }: { scale?: number }) {
  const id = "cloud-grad-1";
  return (
    <svg
      viewBox="0 0 800 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ transform: `scale(${scale})` }}
    >
      <defs>
        <radialGradient id={id} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#f0f4f8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#dce4ec" stopOpacity="0.6" />
        </radialGradient>
        <filter id="cloud-shadow-1" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#8aaa9a" floodOpacity="0.15" />
        </filter>
      </defs>
      {/* Shadow/depth layer */}
      <path
        d="M680 215 C680 215 720 205 740 190 C770 170 760 135 730 125 C720 90 690 70 650 75 C635 50 600 35 565 40 C540 15 500 5 465 20 C440 5 405 10 385 30 C355 10 315 15 295 40 C265 25 230 35 215 60 C185 50 150 60 140 85 C105 80 75 100 75 130 C50 135 35 160 45 185 C35 200 45 220 70 225 C65 240 80 255 105 250 L680 250 C705 250 715 235 710 220 Z"
        fill="#c8d6df"
        fillOpacity="0.25"
        transform="translate(5, 10)"
      />
      {/* Main cloud body */}
      <path
        d="M680 215 C680 215 720 205 740 190 C770 170 760 135 730 125 C720 90 690 70 650 75 C635 50 600 35 565 40 C540 15 500 5 465 20 C440 5 405 10 385 30 C355 10 315 15 295 40 C265 25 230 35 215 60 C185 50 150 60 140 85 C105 80 75 100 75 130 C50 135 35 160 45 185 C35 200 45 220 70 225 C65 240 80 255 105 250 L680 250 C705 250 715 235 710 220 Z"
        fill={`url(#${id})`}
        filter="url(#cloud-shadow-1)"
      />
      {/* Highlight - top lit area */}
      <path
        d="M640 95 C625 65 590 52 560 58 C542 35 510 28 480 38 C458 22 428 26 412 42 C392 30 365 34 350 52 C332 42 310 48 300 65 C285 58 265 65 258 82 C248 78 235 88 238 105 C260 100 290 92 330 85 C380 78 430 72 480 68 C530 64 575 66 610 74 C630 78 645 84 650 92 Z"
        fill="white"
        fillOpacity="0.5"
      />
      {/* Inner volume details */}
      <ellipse cx="400" cy="160" rx="180" ry="40" fill="#e8eef4" fillOpacity="0.15" />
      <ellipse cx="550" cy="180" rx="100" ry="30" fill="#dce4ec" fillOpacity="0.12" />
    </svg>
  );
}

function CloudIllustrated2({ scale = 1 }: { scale?: number }) {
  const id = "cloud-grad-2";
  return (
    <svg
      viewBox="0 0 700 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ transform: `scale(${scale})` }}
    >
      <defs>
        <radialGradient id={id} cx="45%" cy="25%" r="75%">
          <stop offset="0%" stopColor="white" stopOpacity="0.92" />
          <stop offset="55%" stopColor="#eef3f7" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#d5dee6" stopOpacity="0.55" />
        </radialGradient>
        <filter id="cloud-shadow-2" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#8aaa9a" floodOpacity="0.12" />
        </filter>
      </defs>
      {/* Shadow layer */}
      <path
        d="M600 175 C620 170 635 155 630 138 C650 128 650 105 630 95 C630 72 610 55 580 58 C565 40 535 30 510 40 C490 22 455 20 435 35 C410 24 380 28 365 48 C340 35 310 42 300 60 C275 52 248 62 240 80 C215 75 190 88 190 112 C168 115 155 133 162 152 C150 162 155 180 175 185 L600 185 C618 188 628 180 625 170 Z"
        fill="#c0d0da"
        fillOpacity="0.2"
        transform="translate(4, 8)"
      />
      {/* Main body */}
      <path
        d="M600 175 C620 170 635 155 630 138 C650 128 650 105 630 95 C630 72 610 55 580 58 C565 40 535 30 510 40 C490 22 455 20 435 35 C410 24 380 28 365 48 C340 35 310 42 300 60 C275 52 248 62 240 80 C215 75 190 88 190 112 C168 115 155 133 162 152 C150 162 155 180 175 185 L600 185 C618 188 628 180 625 170 Z"
        fill={`url(#${id})`}
        filter="url(#cloud-shadow-2)"
      />
      {/* Highlight */}
      <path
        d="M570 72 C555 48 530 40 508 48 C492 32 465 30 448 42 C430 32 408 36 395 52 C378 42 358 48 350 64 C340 60 328 68 330 82 C360 76 400 68 445 62 C490 58 530 60 560 68 Z"
        fill="white"
        fillOpacity="0.45"
      />
      <ellipse cx="420" cy="130" rx="140" ry="28" fill="#e4ecf2" fillOpacity="0.12" />
    </svg>
  );
}

function CloudIllustrated3({ scale = 1 }: { scale?: number }) {
  const id = "cloud-grad-3";
  return (
    <svg
      viewBox="0 0 550 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ transform: `scale(${scale})` }}
    >
      <defs>
        <radialGradient id={id} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#f2f6f9" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#dae3eb" stopOpacity="0.5" />
        </radialGradient>
        <filter id="cloud-shadow-3" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#8aaa9a" floodOpacity="0.1" />
        </filter>
      </defs>
      {/* Shadow */}
      <path
        d="M470 142 C485 138 498 125 495 112 C508 105 505 88 492 82 C495 65 480 54 460 57 C452 44 434 38 418 44 C406 30 385 28 374 38 C360 30 342 34 335 48 C322 40 305 46 300 60 C288 56 272 64 270 78 C258 76 248 88 252 102 C246 108 250 122 262 126 L470 132 C482 135 490 130 488 122 Z"
        fill="#bccdd8"
        fillOpacity="0.18"
        transform="translate(3, 7)"
      />
      {/* Main body */}
      <path
        d="M470 142 C485 138 498 125 495 112 C508 105 505 88 492 82 C495 65 480 54 460 57 C452 44 434 38 418 44 C406 30 385 28 374 38 C360 30 342 34 335 48 C322 40 305 46 300 60 C288 56 272 64 270 78 C258 76 248 88 252 102 C246 108 250 122 262 126 L470 132 C482 135 490 130 488 122 Z"
        fill={`url(#${id})`}
        filter="url(#cloud-shadow-3)"
      />
      {/* Highlight */}
      <path
        d="M450 65 C440 50 425 44 412 48 C402 36 385 34 375 42 C365 36 350 38 344 50 C336 46 325 50 325 60 C345 56 372 50 405 48 C435 48 450 52 455 58 Z"
        fill="white"
        fillOpacity="0.4"
      />
    </svg>
  );
}

export function AnimatedClouds() {
  return (
    <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
      {/* ═══════ OBLAKI ═══════ */}
      <div className="cloud cloud-1">
        <CloudIllustrated1 />
      </div>
      <div className="cloud cloud-2">
        <CloudIllustrated2 />
      </div>
      <div className="cloud cloud-3">
        <CloudIllustrated3 />
      </div>
      <div className="cloud cloud-4">
        <CloudIllustrated2 scale={0.85} />
      </div>
      <div className="cloud cloud-5">
        <CloudIllustrated1 scale={0.7} />
      </div>

      {/* ═══════ MEGLA ═══════ */}
      <div className="fog fog-layer-1" />
      <div className="fog fog-layer-2" />
      <div className="fog fog-layer-3" />
      <div className="fog fog-layer-4" />
    </div>
  );
}
