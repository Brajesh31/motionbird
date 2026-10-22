# MotionBird Technical Architecture Specification

MotionBird is an on-device computer-vision fitness movement intelligence platform. This document outlines the engineering architecture, data pipelines, signal processing models, state machines, and design principles implemented in the system.

---

## 1. High-Level System Architecture

The pipeline processes webcam frames at 60 Hz entirely on the client, transforming raw pixels into structured biomechanical feedback with zero cloud dependency:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Webcam Input Stream                             │
│                  navigator.mediaDevices.getUserMedia (60 FPS)               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTMLVideoElement (1280x720)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    MediaPipe Pose Engine (WASM / WebGL)                     │
│                  33 Normalized 3D Anatomical Landmarks                     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Raw Landmarks {x, y, z, visibility}
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                   Landmark Processor & Signal Filter                        │
│   • Confidence Gating (Presence & Visibility ≥ 0.6)                         │
│   • Jump-Rejection Filter (Max delta threshold ≤ 0.25 screen units)          │
│   • Exponential Moving Average (EMA: α = 0.65)                              │
│   • Tracking Quality State (TRACKING | LOW_CONFIDENCE | TRACKING_LOST)       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Clean, Smoothed Landmarks
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                      Kinematic Biomechanical Modeling                       │
│   • Pure scale-invariant 2D/3D Vector Dot-Product Angles                     │
│   • Joint Angle Computations: Elbows, Knees, Hips, Shoulders, Spine         │
│   • Relative vertical displacements & velocity derivatives                  │
└──────────────────┬───────────────────────────────────┬──────────────────────┘
                   │ Primary & Secondary Angles        │ Spatial Checks
┌──────────────────▼───────────────────┐ ┌─────────────▼──────────────────────┐
│   Exercise Rep Finite State Machine   │ │     Real-Time Form Evaluator       │
│ • READY                              │ │ • Range of Motion (ROM) Score      │
│ • CONCENTRIC (Initiation & Drive)    │ │ • Torso Inclination / Stability    │
│ • PEAK (Inflection & Lockout)        │ │ • Elbow Flare / Joint Drift        │
│ • ECCENTRIC (Controlled Return)      │ │ • Press Asymmetry                  │
│ • VALID_REP (Debounced Acceptance)   │ │ • Priority & Severity Cues         │
└──────────────────┬───────────────────┘ └─────────────┬──────────────────────┘
                   │ Rep Count & Tempo                 │ Actionable Audio/UI
┌──────────────────▼───────────────────────────────────▼──────────────────────┐
│                       Workout Session Orchestrator                          │
│   • Sets, Reps, Pacing Clocks, and Rest Timers                              │
│   • Calibration Engine (3-second stability countdown)                       │
│   • Recovery State Handler (Freezes rep counter upon tracking drop)         │
└──────────────────┬──────────────────────────────────────────────────────────┘
                   │ Completed Sets & Rep Records
┌──────────────────▼──────────────────────────────────────────────────────────┐
│                     Storage, Intelligence & Analytics                       │
│   • Offline-First localStorage Persistence                                  │
│   • Session Comparison Engine (Volume, Form delta, Duration delta)          │
│   • Deterministic Achievements & Streak Evaluator                           │
│   • Data Portability (CSV / JSON Backup & Restore)                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Modules & Responsibilities

### 2.1 Camera Engine (`lib/vision/camera-engine.ts`)
- Manages the browser `MediaStream` lifecycle via `navigator.mediaDevices.getUserMedia`.
- Implements strict teardown routines to avoid video track memory leaks.
- Handles browser device unplug/disconnect events via `devicechange` listeners.
- Designed with mount-cancellation guards to remain completely immune to React 18 Strict Mode double-invocation anomalies.

### 2.2 Pose Engine (`lib/vision/pose-engine.ts`)
- Wraps `@mediapipe/pose` (v0.5) running through client-side WebAssembly and GPU-accelerated WebGL.
- Enforces a singleton model initialization with safe frame dispatching.
- Decouples continuous inference from React DOM rendering loops via `requestAnimationFrame`.

### 2.3 Landmark Validation & Signal Processing (`lib/vision/`)
- **Confidence Validation**: Validates the detection confidence of key exercise-specific joints. If landmarks drop below `minimumConfidence` (default `0.60`), the system transitions to `LOW_CONFIDENCE` or `TRACKING_LOST`.
- **Jump Rejection Filter**: Computes the Euclidean distance between consecutive frames. If a landmark abruptly moves by more than 0.25 normalized screen units in a single frame (optical occlusion or multi-person confusion), the erroneous jump is rejected.
- **Exponential Moving Average (EMA)**:
  $$\hat{p}_t = \alpha \cdot p_t + (1 - \alpha) \cdot \hat{p}_{t-1}$$
  With $\alpha = 0.65$, this removes high-frequency webcam sensor jitter while maintaining zero perceptual latency during dynamic movement.

### 2.4 Biomechanical Geometry (`lib/vision/geometry.ts`)
- Calculates planar joint angles using pure vector dot-product geometry:
  $$\theta = \arccos\left(\frac{\vec{BA} \cdot \vec{BC}}{\|\vec{BA}\| \|\vec{BC}\|}\right) \times \frac{180^\circ}{\pi}$$
- Scale-invariant and translation-invariant across all camera distances and screen aspect ratios.

---

## 3. Repetition Finite State Machine (`lib/state/rep-state-machine.ts`)

Repetition detection is strictly deterministic and based on biomechanical inflection points:

```text
       ┌───────────┐
       │   READY   │ ◄────────────────────────────────────────┐
       └─────┬─────┘                                          │
             │ Angle breaks starting threshold               │
             ▼                                                │
       ┌───────────┐                                          │
       │CONCENTRIC │                                          │
       └─────┬─────┘                                          │
             │ Enters peak inflection zone (≤ minAngle)       │
             ▼                                                │
       ┌───────────┐                                          │ Rep Cooldown
       │   PEAK    │                                          │ (≥ 400ms debounce)
       └─────┬─────┘                                          │
             │ Reverses direction & returns toward start      │
             ▼                                                │
       ┌───────────┐                                          │
       │ ECCENTRIC │                                          │
       └─────┬─────┘                                          │
             │ Re-crosses return threshold (≥ returnAngle)    │
             ▼                                                │
       ┌───────────┐                                          │
       │ VALID_REP │ ─────────────────────────────────────────┘
       └───────────┘
```

### Partial Rep Rejection & Debounce Safeguards
1. **Partial Rep Invalidation**: If the user begins a repetition but reverses direction before reaching the `peak` contraction threshold, the movement is flagged as a `Partial` rep or reset without incrementing the official repetition count.
2. **Temporal Cooldown**: A mandatory cooldown period ($\ge 400\text{ ms}$) prevents optical chatter or double-counting at movement boundaries.
3. **Pacing Clocks**: Tracks concentric and eccentric durations individually to quantify repetition tempo and muscular control under tension.

---

## 4. Supported Exercises & Biomechanical Cues

| Exercise | Primary Joint Kinematics | Peak Criteria | Key Form Guardrails | Camera Orientation |
| :--- | :--- | :--- | :--- | :--- |
| **Bicep Curl** | Shoulder-Elbow-Wrist angle | Elbow $\le 60^\circ$ | Elbow flare/drift check, eccentric tempo | Front Facing or $45^\circ$ |
| **Bodyweight Squat** | Hip-Knee-Ankle angle | Knee $\le 95^\circ$ (Parallel) | Torso forward collapse check ($<65^\circ$) | $45^\circ$ Angle / Side Profile |
| **Overhead Press** | Bilateral Elbow Extension & Vertical Lockout | Elbow $\ge 155^\circ$, Wrists above eyes | Asymmetric press delta ($>18^\circ$) | Front Facing |
| **Push-Up** | Elbow Angle + Horizontal Trunk Orientation Gate | Elbow $\le 90^\circ$ (Chest depth) | Horizontal orientation gate ($|\Delta x| > 0.22, |\Delta y| < 0.45$), Hip sag | Side Profile |

---

## 5. Privacy & Security Model

MotionBird is built on an absolute **Client-Side Data Sovereignty** paradigm:

1. **Zero Video Ingestion**: Webcam streams are connected directly from browser device drivers to an in-memory `<video>` element, sampled by WebAssembly memory buffers, and discarded immediately after landmark extraction.
2. **Zero Telemetry Leaks**: No video frames, landmark coordinates, or facial images are ever transmitted to any remote server or third-party API.
3. **Local-Only Storage**: All workout histories, personal records, and user goals reside solely in browser `localStorage`.
4. **Data Portability**: Users can export their complete training history as raw CSV or portable JSON backups at any time, with full offline restoration capability.

---

## 6. Developer Telemetry HUD (`components/debug/DebugOverlay.tsx`)

To facilitate engineering verification and biomechanical benchmarking:
- Activated via keyboard shortcut: **`Shift + D`** or the HUD terminal icon.
- Displays real-time **FPS**, **inference latency (ms)**, **landmark presence confidence**, **canvas resolution**, and **raw active joint angles**.
- Allows rapid validation of joint kinematics across varying lighting conditions and user physiques.
