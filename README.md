# MotionBird

> Real-Time Computer-Vision Fitness Movement Intelligence Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13.2-black.svg)](https://nextjs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose%200.5-teal.svg)](https://developers.google.com/mediapipe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**MotionBird** is a real-time computer-vision fitness movement coach that runs entirely on-device in the browser using the user's webcam. It tracks 33 skeletal landmarks, performs continuous kinematic angle analysis, evaluates exercise movement phases via finite state machines, counts authentic repetitions, detects form faults, and turns workouts into measurable progress—with **100% on-device client privacy**.

---

## Technical Positioning

> **MotionBird is not a webcam demo, an AI wrapper, or a generic fitness logger.**
> 
> It is an engineered movement intelligence platform that brings client-side computer vision directly into the browser to measure physical biomechanics with zero video frames ever leaving your machine.

---

## Core Capabilities

- **100% Client-Side Privacy**: Video streams are processed strictly in memory on the client device via WebAssembly and WebGL shaders. Zero frames or facial data are ever sent over a network.
- **Robust Camera & Lifecycle Management**: Strict stream teardown, device unplug/disconnect detection, and React 18 Strict Mode double-invocation safety.
- **Landmark Validation & Quality Engine**: Real-time confidence scoring (`TRACKING`, `LOW_CONFIDENCE`, `TRACKING_LOST`). Rep counts are protected and paused automatically upon tracking interruption.
- **Signal Processing & Smoothing**: Exponential moving average (EMA $\alpha=0.65$) paired with a single-frame jump-rejection guard ($\Delta > 0.25$ units) to eliminate sensor jitter without inducing phase lag.
- **Biomechanical Exercise Engine**:
  - **Bicep Curl**: Dual-arm independent and composite tracking with shoulder-elbow-wrist kinematics, peak flexion ($60^\circ$), and elbow flare/drift alerts.
  - **Bodyweight Squat**: Hip-knee-ankle kinematics, parallel depth detection ($\le 95^\circ$), and torso forward-collapse checks ($<65^\circ$).
  - **Overhead Press**: Bilateral vertical displacement, elbow extension lockout ($\ge 155^\circ$), and press asymmetry detection ($>18^\circ$).
  - **Push-Up**: Horizontal plank orientation gate ($|\Delta x| > 0.22, |\Delta y| < 0.45$), hip sagging checks ($<145^\circ$), and chest depth ($\le 90^\circ$).
- **Multi-Phase Rep State Machine**: Finite state machine (`READY` &rarr; `CONCENTRIC` &rarr; `PEAK` &rarr; `ECCENTRIC` &rarr; `VALID_REP`) with inflection-point detection, partial repetition rejection, and a $\ge 400\text{ ms}$ debounce cooldown.
- **Real-Time Auditory & Voice Coaching**: Zero-dependency Web Audio API synthetic tones alongside optional Web Speech API voice announcements for reps and critical form cues.
- **Pre-Workout Calibration**: Explicit 3-second stable countdown establishing baseline joint configurations and tracking stability before starting a set.
- **Developer Telemetry HUD**: Accessible via **`Shift + D`** to monitor real-time FPS, inference latency, landmark presence, canvas resolution, and active joint angles.
- **Progress & Intelligence**: Deterministic session comparison (volume delta, form delta, duration delta), 8 kinematic achievements, personal records, and data portability (CSV export & JSON backup/restore).

---

## Computer Vision Pipeline

```text
Camera (Local 60 FPS)
       ↓
MediaPipe Pose (WASM / WebGL)
       ↓
Landmark Processor (Presence & Visibility Gating)
       ↓
Signal Smoothing (EMA α = 0.65 + Jump-Rejection Filter)
       ↓
Kinematic Geometry (Pure Vector Dot-Product Angles)
       ↓
Exercise State Machine (READY → CONCENTRIC → PEAK → ECCENTRIC → VALID_REP)
       ↓
Form Analysis (Threshold Severity & Real-Time Cues)
       ↓
Workout Session (Sets, Reps, Rest Timers, Persistence)
```

For complete technical specifications, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Project Structure

```text
├── components/
│   ├── debug/
│   │   └── DebugOverlay.tsx        # Developer telemetry HUD (Shift + D)
│   ├── exercises/
│   │   ├── ExerciseLibraryView.tsx # Biomechanics library & category filters
│   │   └── ExerciseDetailModal.tsx # Exercise anatomy & instruction modal
│   ├── history/
│   │   └── SessionHistoryView.tsx  # Completed workout logs & metrics
│   ├── landing/
│   │   └── LandingHero.tsx         # Hero section & vision pipeline demo
│   ├── layout/
│   │   └── Header.tsx              # Navigation bar & audio/profile controls
│   ├── onboarding/
│   │   └── OnboardingModal.tsx     # First-time user preference setup
│   ├── profile/
│   │   └── UserProfileModal.tsx    # Athlete profile & personal records
│   ├── progress/
│   │   └── ProgressDashboard.tsx   # Trends, achievements, and data export
│   ├── ui/
│   │   ├── FormFeedbackAlert.tsx   # Real-time kinematic form cues
│   │   ├── RepCounterCard.tsx      # Active rep, set, and phase HUD
│   │   └── TrackingStatusBadge.tsx # Camera tracking health indicator
│   ├── vision/
│   │   └── MotionTracker.tsx       # Core orchestrator: camera, pose, and UI
│   └── workout/
│       ├── CalibrationScreen.tsx   # 3-second movement baseline calibration
│       ├── RestTimerCard.tsx       # Between-set rest countdown
│       ├── SetupCheckScreen.tsx    # 4-point camera readiness checklist
│       ├── WorkoutBuilderModal.tsx # Routine planner & exercise selector
│       └── WorkoutSummaryCard.tsx  # Post-workout metrics & session comparison
├── lib/
│   ├── exercises/
│   │   ├── bicep-curl.ts           # Bicep curl kinematics & rules
│   │   ├── overhead-press.ts       # Overhead press kinematics & rules
│   │   ├── pushup.ts               # Push-up kinematics & plank orientation gate
│   │   ├── registry.ts             # Exercise registry
│   │   └── squat.ts                # Squat kinematics & parallel depth rules
│   ├── feedback/
│   │   ├── audio-cue.ts            # Web Audio API synthetic oscillator tones
│   │   └── voice-coach.ts          # Web Speech API voice cues
│   ├── state/
│   │   └── rep-state-machine.ts    # Biomechanical repetition finite state machine
│   ├── storage/
│   │   ├── achievements.ts         # Milestone & consistency achievement evaluator
│   │   └── workout-storage.ts      # Offline-first storage with CSV/JSON export
│   ├── types/                      # Comprehensive TypeScript definitions
│   └── vision/
│       ├── camera-engine.ts        # Robust getUserMedia manager
│       ├── canvas-renderer.ts      # 60 FPS skeleton overlay renderer
│       ├── geometry.ts             # Vector dot-product angles & spatial math
│       ├── landmark-processor.ts   # Landmark validation & tracking quality
│       ├── pose-engine.ts          # MediaPipe Pose WASM wrapper
│       ├── readiness-evaluator.ts  # Pre-flight camera checklist
│       └── smoothing.ts            # EMA filter & jump rejection
├── pages/
│   ├── _app.tsx                    # Chakra UI provider & dark theme
│   ├── _document.tsx               # HTML head, OpenGraph, and Twitter tags
│   └── index.tsx                   # Main application controller
├── public/
│   ├── favicon.svg                 # Branded vector favicon
│   ├── og-image.svg                # 1200x630 vector social preview
│   ├── robots.txt                  # Search crawler directives
│   └── sitemap.xml                 # Sitemap index
├── scripts/
│   └── verify-engine.js            # Automated verification test suite
└── ARCHITECTURE.md                 # In-depth architectural design specification
```

---

## Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on Node v20/v22)
- [Yarn](https://yarnpkg.com/) v1.22+ or [npm](https://www.npmjs.com/) v9+
- A modern webcam

### Installation
```bash
# Clone the repository
git clone https://github.com/Brajesh31/motionbird.git
cd motionbird

# Install dependencies
yarn install
# or
npm install
```

### Verification & Automated Tests
```bash
# Run unit and integration tests (geometry, state machine, exercises, achievements)
yarn test

# Validate TypeScript type safety
yarn run type-check

# Run Next.js linter
yarn run lint
```

### Development Server
```bash
yarn dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome, Edge, or Safari with webcam permissions enabled.

### Production Build
```bash
yarn build
yarn start
```

---

## Technical Interview Deep-Dive (Why MotionBird is Interesting)

1. **Pure On-Device Inference Without Cloud Latency**:
   Running MediaPipe Pose in-browser via WebAssembly and WebGL shaders guarantees zero frame transmission over the network, achieving 60 FPS while keeping personal video strictly private.
2. **Debounced Finite State Machines vs. Heuristic Peaks**:
   Instead of naively checking if an angle crosses a threshold, MotionBird models movement through distinct biomechanical phases (`READY` &rarr; `CONCENTRIC` &rarr; `PEAK` &rarr; `ECCENTRIC` &rarr; `VALID_REP`). This eliminates double-counting, rejects partial reps, and computes eccentric tempo accurately.
3. **Signal Processing & Sensor Stabilization**:
   Raw webcam pose estimation contains high-frequency optical jitter and sudden landmark jumps when limbs cross. MotionBird implements an Exponential Moving Average (EMA $\alpha=0.65$) alongside a single-frame Euclidean jump-rejection guard ($\Delta > 0.25$ screen units) to stabilize angles without introducing perceptual delay.
4. **Orientation Gating**:
   Exercises with distinct spatial orientations (e.g. push-ups in horizontal plank position vs. squats in vertical stance) are verified using spatial orientation gates before tracking activates, preventing false reps from unintended body postures.
5. **Decoupled Architecture**:
   High-frequency computer-vision execution (60 FPS canvas rendering and frame evaluation) runs completely decoupled from low-frequency React state updates (120ms throttled UI state), avoiding React render thrashing.

---

## Privacy & Security

- **No Video Storage or Transmission**: The browser webcam stream is ingested into an in-memory `<video>` element, processed by WebAssembly memory buffers, and discarded frame by frame.
- **No Third-Party Trackers**: No external tracking scripts, advertising trackers, or hidden analytics.
- **Offline Data Sovereignty**: All workouts, PRs, and preferences are stored locally in the browser's `localStorage` and can be exported as CSV or JSON at any time.

---

## License

MIT License &copy; 2026 Brajesh Kumar. See [LICENSE](LICENSE) for details.
