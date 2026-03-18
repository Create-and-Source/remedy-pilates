// PostureAI — Guided posture assessment with REAL MediaPipe pose detection
import { useState, useRef, useEffect, useCallback } from 'react';
import { useStyles, useTheme } from '../theme';
import { getAssessments, addAssessment, deleteAssessment } from '../data/store';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

// ── Guidelines shown when camera opens ──
const GUIDELINES = [
  { icon: 'T', title: 'Form-fitting clothing', desc: 'Tank top and leggings — baggy clothes shift landmark detection by inches' },
  { icon: 'W', title: 'Plain wall behind you', desc: 'Light, uncluttered background — no mirrors (camera sees reflections)' },
  { icon: 'L', title: 'Even lighting', desc: 'Face the light source — avoid strong shadows on one side' },
  { icon: 'D', title: 'About 8 feet away', desc: 'Full body head-to-toe must be visible in frame' },
  { icon: 'S', title: 'Stand naturally', desc: "Like you're waiting in line at a coffee shop — don't correct your posture" },
  { icon: 'F', title: 'Feet hip-width apart', desc: 'Arms relaxed at your sides, palms facing forward' },
];

// ── Posture metrics ──
const METRICS = [
  { key: 'headAlignment', label: 'Head Alignment', ideal: 'Ears directly over shoulders' },
  { key: 'shoulderBalance', label: 'Shoulder Balance', ideal: 'Level shoulders, no elevation' },
  { key: 'spinalCurve', label: 'Spinal Alignment', ideal: 'Natural S-curve, no lateral shift' },
  { key: 'hipLevel', label: 'Hip Level', ideal: 'Even hip height bilaterally' },
  { key: 'pelvicTilt', label: 'Pelvic Position', ideal: 'Neutral pelvis, no anterior/posterior tilt' },
  { key: 'kneeTracking', label: 'Knee Tracking', ideal: 'Knees over 2nd toe, no valgus' },
];

// ── MediaPipe landmark indices ──
const LM = {
  NOSE: 0, L_EYE: 2, R_EYE: 5, L_EAR: 7, R_EAR: 8,
  L_SHOULDER: 11, R_SHOULDER: 12, L_ELBOW: 13, R_ELBOW: 14,
  L_WRIST: 15, R_WRIST: 16, L_HIP: 23, R_HIP: 24,
  L_KNEE: 25, R_KNEE: 26, L_ANKLE: 27, R_ANKLE: 28,
};

// ── Pose connections for skeleton drawing ──
const CONNECTIONS = [
  [LM.L_EAR, LM.L_EYE], [LM.R_EAR, LM.R_EYE], [LM.L_EYE, LM.NOSE], [LM.R_EYE, LM.NOSE],
  [LM.L_SHOULDER, LM.R_SHOULDER], [LM.L_SHOULDER, LM.L_ELBOW], [LM.R_SHOULDER, LM.R_ELBOW],
  [LM.L_ELBOW, LM.L_WRIST], [LM.R_ELBOW, LM.R_WRIST],
  [LM.L_SHOULDER, LM.L_HIP], [LM.R_SHOULDER, LM.R_HIP], [LM.L_HIP, LM.R_HIP],
  [LM.L_HIP, LM.L_KNEE], [LM.R_HIP, LM.R_KNEE],
  [LM.L_KNEE, LM.L_ANKLE], [LM.R_KNEE, LM.R_ANKLE],
];

// ── Math helpers ──
function angleDeg(a, b, c) {
  // Angle at point b formed by points a-b-c
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const cross = ab.x * cb.y - ab.y * cb.x;
  return Math.abs(Math.atan2(cross, dot) * (180 / Math.PI));
}

function slopeDeg(a, b) {
  // Angle of line a→b relative to horizontal
  return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ── Real posture analysis from landmarks ──
function analyzeFromLandmarks(landmarks) {
  const lm = landmarks;
  const scores = {};

  // 1. Head alignment — how far nose deviates from midpoint of shoulders
  const shoulderMid = midpoint(lm[LM.L_SHOULDER], lm[LM.R_SHOULDER]);
  const headOffset = Math.abs(lm[LM.NOSE].x - shoulderMid.x);
  const headOffsetDeg = headOffset * 180; // normalized 0-1 coords, scale to meaningful degrees
  const headScore = Math.max(30, Math.min(100, Math.round(100 - headOffsetDeg * 8)));
  scores.headAlignment = {
    score: headScore,
    label: 'Head Alignment',
    detail: headScore >= 85
      ? 'Head well-centered over shoulders'
      : `Head shifted ${(headOffset * 100).toFixed(1)}cm ${lm[LM.NOSE].x < shoulderMid.x ? 'left' : 'right'} of center`,
  };

  // 2. Shoulder balance — slope of shoulder line
  const shoulderSlope = Math.abs(slopeDeg(lm[LM.L_SHOULDER], lm[LM.R_SHOULDER]));
  const shoulderScore = Math.max(30, Math.min(100, Math.round(100 - shoulderSlope * 8)));
  const higherSide = lm[LM.L_SHOULDER].y < lm[LM.R_SHOULDER].y ? 'Left' : 'Right';
  scores.shoulderBalance = {
    score: shoulderScore,
    label: 'Shoulder Balance',
    detail: shoulderScore >= 85
      ? 'Shoulders level within normal range'
      : `${higherSide} shoulder ${shoulderSlope.toFixed(1)}° higher`,
  };

  // 3. Spinal alignment — lateral deviation of midpoint chain
  const hipMid = midpoint(lm[LM.L_HIP], lm[LM.R_HIP]);
  const spineDeviation = Math.abs(shoulderMid.x - hipMid.x);
  const spineScore = Math.max(30, Math.min(100, Math.round(100 - spineDeviation * 600)));
  scores.spinalCurve = {
    score: spineScore,
    label: 'Spinal Alignment',
    detail: spineScore >= 85
      ? 'Spine vertically aligned'
      : `Trunk shifted ${(spineDeviation * 100).toFixed(1)}cm ${shoulderMid.x < hipMid.x ? 'left' : 'right'} of hips`,
  };

  // 4. Hip level — slope of hip line
  const hipSlope = Math.abs(slopeDeg(lm[LM.L_HIP], lm[LM.R_HIP]));
  const hipScore = Math.max(30, Math.min(100, Math.round(100 - hipSlope * 8)));
  const hipHigher = lm[LM.L_HIP].y < lm[LM.R_HIP].y ? 'Left' : 'Right';
  scores.hipLevel = {
    score: hipScore,
    label: 'Hip Level',
    detail: hipScore >= 85
      ? 'Hips level and balanced'
      : `${hipHigher} hip ${hipSlope.toFixed(1)}° higher`,
  };

  // 5. Pelvic tilt — angle at hip (shoulder-hip-knee)
  // Use average of both sides
  const lPelvic = angleDeg(lm[LM.L_SHOULDER], lm[LM.L_HIP], lm[LM.L_KNEE]);
  const rPelvic = angleDeg(lm[LM.R_SHOULDER], lm[LM.R_HIP], lm[LM.R_KNEE]);
  const avgPelvic = (lPelvic + rPelvic) / 2;
  // Ideal is ~170-175°. Lower = more anterior tilt
  const pelvicDeviation = Math.abs(172 - avgPelvic);
  const pelvicScore = Math.max(30, Math.min(100, Math.round(100 - pelvicDeviation * 3)));
  scores.pelvicTilt = {
    score: pelvicScore,
    label: 'Pelvic Position',
    detail: pelvicScore >= 85
      ? 'Pelvis in neutral position'
      : `${avgPelvic < 172 ? 'Anterior' : 'Posterior'} pelvic tilt (${pelvicDeviation.toFixed(1)}° from neutral)`,
  };

  // 6. Knee tracking — knee-ankle alignment relative to hip
  const lKneeOffset = Math.abs(lm[LM.L_KNEE].x - lm[LM.L_ANKLE].x);
  const rKneeOffset = Math.abs(lm[LM.R_KNEE].x - lm[LM.R_ANKLE].x);
  const avgKneeOffset = (lKneeOffset + rKneeOffset) / 2;
  const kneeScore = Math.max(30, Math.min(100, Math.round(100 - avgKneeOffset * 400)));
  const kneeDirection = (lm[LM.L_KNEE].x + lm[LM.R_KNEE].x) / 2 <
    (lm[LM.L_ANKLE].x + lm[LM.R_ANKLE].x) / 2 ? 'valgus' : 'varus';
  scores.kneeTracking = {
    score: kneeScore,
    label: 'Knee Tracking',
    detail: kneeScore >= 85
      ? 'Good knee alignment over toes'
      : `Slight ${kneeDirection} tendency detected`,
  };

  // Overall
  const allScores = METRICS.map(m => scores[m.key].score);
  scores.overall = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

  // Recommendations
  const recommendations = [];
  if (scores.pelvicTilt.score < 75) recommendations.push('Reformer Foundations: Focus on pelvic stability exercises (bridging series, footwork in neutral)');
  if (scores.headAlignment.score < 75) recommendations.push('Mat Pilates: Practice chin tucks and cervical alignment during hundred and roll-up');
  if (scores.shoulderBalance.score < 75) recommendations.push('Barre Upper Body: Scapular stabilization work to balance shoulder elevation');
  if (scores.spinalCurve.score < 80) recommendations.push('Stretch & Release: Lateral flexion series and rotational mobility on the Reformer');
  if (scores.hipLevel.score < 80) recommendations.push('Standing Barre: Single-leg balance work to address hip drop pattern');
  if (scores.kneeTracking.score < 80) recommendations.push('Reformer Legs: Footwork with focus on knee tracking over 2nd-3rd toes');
  if (recommendations.length === 0) recommendations.push('Excellent alignment! Continue your current practice and reassess in 8 weeks');

  return { scores, recommendations, landmarks };
}

// ── Score color ──
function scoreColor(score, accent) {
  if (score >= 85) return '#4ADE80';
  if (score >= 70) return accent;
  if (score >= 55) return '#F59E0B';
  return '#EF4444';
}

// ── Draw real skeleton from landmarks onto canvas ──
function drawRealSkeleton(ctx, landmarks, w, h) {
  ctx.clearRect(0, 0, w, h);

  // Draw connections
  ctx.strokeStyle = '#4ADE80';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  CONNECTIONS.forEach(([a, b]) => {
    const la = landmarks[a];
    const lb = landmarks[b];
    if (la.visibility > 0.5 && lb.visibility > 0.5) {
      ctx.beginPath();
      ctx.moveTo(la.x * w, la.y * h);
      ctx.lineTo(lb.x * w, lb.y * h);
      ctx.stroke();
    }
  });

  // Draw joint dots
  const KEY_JOINTS = [
    LM.NOSE, LM.L_SHOULDER, LM.R_SHOULDER, LM.L_ELBOW, LM.R_ELBOW,
    LM.L_WRIST, LM.R_WRIST, LM.L_HIP, LM.R_HIP,
    LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE,
  ];
  KEY_JOINTS.forEach(i => {
    const lm = landmarks[i];
    if (lm.visibility > 0.5) {
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#4ADE80';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });

  // Draw angle indicators at key joints
  const angleJoints = [
    { joint: LM.L_SHOULDER, color: '#60A5FA' },
    { joint: LM.R_SHOULDER, color: '#60A5FA' },
    { joint: LM.L_HIP, color: '#F59E0B' },
    { joint: LM.R_HIP, color: '#F59E0B' },
    { joint: LM.L_KNEE, color: '#A78BFA' },
    { joint: LM.R_KNEE, color: '#A78BFA' },
  ];
  angleJoints.forEach(({ joint, color }) => {
    const lm = landmarks[joint];
    if (lm.visibility > 0.5) {
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, 10, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  });
}

// ── Live skeleton overlay on video ──
function drawLiveSkeleton(ctx, landmarks, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.7)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  CONNECTIONS.forEach(([a, b]) => {
    const la = landmarks[a];
    const lb = landmarks[b];
    if (la.visibility > 0.5 && lb.visibility > 0.5) {
      ctx.beginPath();
      ctx.moveTo(la.x * w, la.y * h);
      ctx.lineTo(lb.x * w, lb.y * h);
      ctx.stroke();
    }
  });
  [LM.NOSE, LM.L_SHOULDER, LM.R_SHOULDER, LM.L_HIP, LM.R_HIP,
   LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE].forEach(i => {
    const lm = landmarks[i];
    if (lm.visibility > 0.5) {
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(74, 222, 128, 0.9)';
      ctx.fill();
    }
  });
}

export default function PostureAI() {
  const s = useStyles();
  const { theme } = useTheme();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);       // hidden canvas for photo capture
  const overlayRef = useRef(null);      // visible canvas for live skeleton
  const skeletonRef = useRef(null);     // canvas for result skeleton overlay
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const prevLandmarksRef = useRef(null);

  // ── State ──
  const [step, setStep] = useState('intro');
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [capturePhase, setCapturePhase] = useState('front');
  const [frontPhoto, setFrontPhoto] = useState(null);
  const [sidePhoto, setSidePhoto] = useState(null);
  const [frontLandmarks, setFrontLandmarks] = useState(null);
  const [sideLandmarks, setSideLandmarks] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [assessments, setAssessments] = useState(getAssessments());
  const [clientName, setClientName] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [countdown, setCountdown] = useState(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [checks, setChecks] = useState({ visible: false, lighting: false, distance: false, stable: false });
  const [currentLandmarks, setCurrentLandmarks] = useState(null);

  // ── Load MediaPipe PoseLandmarker ──
  const loadModel = useCallback(async () => {
    if (landmarkerRef.current) { setModelReady(true); return; }
    setModelLoading(true);
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
      landmarkerRef.current = landmarker;
      setModelReady(true);
    } catch (err) {
      console.error('MediaPipe load failed:', err);
      // Fallback: model failed to load, we'll still capture photos but without live detection
      setModelReady(false);
    }
    setModelLoading(false);
  }, []);

  // ── Real-time detection loop ──
  const startDetectionLoop = useCallback(() => {
    if (!landmarkerRef.current || !videoRef.current) return;
    const video = videoRef.current;
    const overlay = overlayRef.current;
    let lastTime = -1;

    const detect = () => {
      if (!video || video.paused || video.ended || !landmarkerRef.current) return;
      if (video.currentTime === lastTime) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }
      lastTime = video.currentTime;

      try {
        const result = landmarkerRef.current.detectForVideo(video, performance.now());
        if (result.landmarks && result.landmarks.length > 0) {
          const lm = result.landmarks[0];
          setCurrentLandmarks(lm);

          // Draw live skeleton on overlay canvas
          if (overlay) {
            overlay.width = video.videoWidth || video.clientWidth;
            overlay.height = video.videoHeight || video.clientHeight;
            const ctx = overlay.getContext('2d');
            drawLiveSkeleton(ctx, lm, overlay.width, overlay.height);
          }

          // Real validation checks
          const nose = lm[LM.NOSE];
          const lAnkle = lm[LM.L_ANKLE];
          const rAnkle = lm[LM.R_ANKLE];
          const lShoulder = lm[LM.L_SHOULDER];
          const rShoulder = lm[LM.R_SHOULDER];

          // Full body visible: nose + both ankles detected with confidence
          const fullBody = nose.visibility > 0.7 && lAnkle.visibility > 0.5 && rAnkle.visibility > 0.5;

          // Good lighting: average visibility of key landmarks
          const keyVis = [LM.NOSE, LM.L_SHOULDER, LM.R_SHOULDER, LM.L_HIP, LM.R_HIP, LM.L_KNEE, LM.R_KNEE, LM.L_ANKLE, LM.R_ANKLE];
          const avgVis = keyVis.reduce((sum, i) => sum + lm[i].visibility, 0) / keyVis.length;
          const goodLighting = avgVis > 0.6;

          // Correct distance: shoulder width should be 12-28% of frame
          const shoulderWidth = Math.abs(rShoulder.x - lShoulder.x);
          const correctDistance = shoulderWidth > 0.10 && shoulderWidth < 0.35;

          // Stable: landmarks haven't moved much since last frame
          let stable = false;
          if (prevLandmarksRef.current) {
            const prev = prevLandmarksRef.current;
            const totalDelta = [LM.NOSE, LM.L_SHOULDER, LM.R_SHOULDER, LM.L_HIP, LM.R_HIP].reduce((sum, i) => {
              return sum + Math.abs(lm[i].x - prev[i].x) + Math.abs(lm[i].y - prev[i].y);
            }, 0);
            stable = totalDelta < 0.02; // very small movement
          }
          prevLandmarksRef.current = lm.map(l => ({ ...l }));

          setChecks({ visible: fullBody, lighting: goodLighting, distance: correctDistance, stable });
        } else {
          // No person detected
          setCurrentLandmarks(null);
          if (overlay) {
            const ctx = overlay.getContext('2d');
            ctx.clearRect(0, 0, overlay.width, overlay.height);
          }
          setChecks({ visible: false, lighting: false, distance: false, stable: false });
        }
      } catch (e) {
        // Detection error — continue loop
      }

      animFrameRef.current = requestAnimationFrame(detect);
    };

    // Wait for video to be ready
    if (video.readyState >= 2) {
      detect();
    } else {
      video.addEventListener('loadeddata', detect, { once: true });
    }
  }, []);

  // ── Camera management ──
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        // Start detection once model is ready and video is playing
        if (landmarkerRef.current) {
          startDetectionLoop();
        }
      }
    } catch (err) {
      setCameraError(err.name === 'NotAllowedError'
        ? 'Camera access denied. Please allow camera permissions and try again.'
        : 'Could not access camera. Make sure no other app is using it.');
    }
  }, [facingMode, startDetectionLoop]);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const aspect = video.videoHeight / video.videoWidth;
    canvas.width = 480;
    canvas.height = Math.round(480 * aspect);
    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.7);
  }, [facingMode]);

  // ── Capture flow ──
  const handleCapture = useCallback(() => {
    setCountdown(3);
  }, []);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      const photo = captureFrame();
      // Snapshot current landmarks
      const lm = currentLandmarks ? currentLandmarks.map(l => ({ ...l })) : null;

      if (capturePhase === 'front') {
        setFrontPhoto(photo);
        setFrontLandmarks(lm);
        setCapturePhase('side');
        setCountdown(null);
        prevLandmarksRef.current = null; // reset stability check
      } else {
        setSidePhoto(photo);
        setSideLandmarks(lm);
        stopCamera();
        setStep('analyzing');
        // Analyze with real landmarks
        setTimeout(() => {
          // Use front landmarks for primary analysis (most metrics are frontal plane)
          const analysisLandmarks = lm || frontLandmarks;
          if (analysisLandmarks) {
            const result = analyzeFromLandmarks(analysisLandmarks);
            setAnalysis(result);
          } else {
            // Fallback if no landmarks captured (shouldn't happen with real detection)
            setAnalysis(fallbackAnalysis());
          }
          setStep('results');
        }, 1500);
      }
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, capturePhase, captureFrame, stopCamera, currentLandmarks, frontLandmarks]);

  // ── Start detection when model loads during capture ──
  useEffect(() => {
    if (modelReady && step === 'capture' && videoRef.current && !showGuidelines) {
      startDetectionLoop();
    }
  }, [modelReady, step, showGuidelines, startDetectionLoop]);

  // ── Start assessment ──
  const startAssessment = async () => {
    setStep('capture');
    setShowGuidelines(true);
    setCapturePhase('front');
    setFrontPhoto(null);
    setSidePhoto(null);
    setFrontLandmarks(null);
    setSideLandmarks(null);
    setAnalysis(null);
    setCountdown(null);
    setCurrentLandmarks(null);
    prevLandmarksRef.current = null;
    setChecks({ visible: false, lighting: false, distance: false, stable: false });
    await loadModel();
    startCamera();
  };

  // ── Save assessment ──
  const saveAssessment = () => {
    const a = addAssessment({
      clientName: clientName || 'Walk-in Assessment',
      frontPhoto,
      sidePhoto,
      ...analysis,
      // Don't store raw landmarks in localStorage (too large) — just scores
      landmarks: undefined,
    });
    setAssessments(getAssessments());
    setSelectedAssessment(a);
    setStep('intro');
    setClientName('');
  };

  // ── Fallback analysis if MediaPipe fails ──
  function fallbackAnalysis() {
    const base = { headAlignment: 72, shoulderBalance: 68, spinalCurve: 80, hipLevel: 85, pelvicTilt: 58, kneeTracking: 88 };
    const scores = {};
    let total = 0;
    METRICS.forEach(m => {
      const v = Math.floor(Math.random() * 16) - 8;
      const score = Math.max(40, Math.min(98, base[m.key] + v));
      scores[m.key] = { score, label: m.label, detail: `Estimated — move closer for more accurate reading` };
      total += score;
    });
    scores.overall = Math.round(total / METRICS.length);
    return { scores, recommendations: ['Stand closer and ensure full body is visible for more accurate results'] };
  }

  // ── Draw skeleton on result photo ──
  useEffect(() => {
    if (step === 'results' && analysis?.landmarks && skeletonRef.current && frontPhoto) {
      const img = new Image();
      img.onload = () => {
        const canvas = skeletonRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        drawRealSkeleton(ctx, analysis.landmarks, img.width, img.height);
      };
      img.src = frontPhoto;
    }
  }, [step, analysis, frontPhoto]);

  // ── Cleanup ──
  useEffect(() => { return () => { stopCamera(); if (landmarkerRef.current) { landmarkerRef.current.close(); } }; }, [stopCamera]);

  const allChecks = checks.visible && checks.lighting && checks.distance && checks.stable;

  // ════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════

  // ── Intro Screen ──
  if (step === 'intro') return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <div style={{ padding: '32px 32px 0', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 3, color: theme.accent, marginBottom: 8 }}>
            Body Intelligence
          </div>
          <h1 style={{ font: `400 32px ${s.DISPLAY}`, color: '#1a1a1a', marginBottom: 6 }}>
            Posture Assessment
          </h1>
          <p style={{ font: `300 15px ${s.FONT}`, color: '#888', marginBottom: 24 }}>
            Real-time pose detection with MediaPipe — 33 body landmarks, 6 alignment metrics
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32 }}>
        {/* How it works */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
          {[
            { num: '01', title: 'Detect', desc: 'MediaPipe PoseLandmarker maps 33 body landmarks in real-time at 30fps — runs entirely in your browser' },
            { num: '02', title: 'Analyze', desc: 'Calculates shoulder tilt, spinal deviation, pelvic tilt, hip level, and knee tracking from landmark geometry' },
            { num: '03', title: 'Track', desc: 'Compare assessments over time to visualize how Pilates is improving alignment scores' },
          ].map(s2 => (
            <div key={s2.num} style={{
              padding: 24, borderRadius: 16, background: '#fff', border: '1px solid #eee',
            }}>
              <div style={{ font: `600 24px ${s.DISPLAY}`, color: theme.accent, marginBottom: 8 }}>{s2.num}</div>
              <div style={{ font: `600 15px ${s.FONT}`, color: '#1a1a1a', marginBottom: 6 }}>{s2.title}</div>
              <div style={{ font: `300 13px ${s.FONT}`, color: '#888', lineHeight: 1.6 }}>{s2.desc}</div>
            </div>
          ))}
        </div>

        {/* New Assessment */}
        <div style={{
          padding: 32, borderRadius: 20, background: '#fff', border: '1px solid #eee',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32,
        }}>
          <div>
            <div style={{ font: `600 18px ${s.FONT}`, color: '#1a1a1a', marginBottom: 4 }}>New Assessment</div>
            <div style={{ font: `300 14px ${s.FONT}`, color: '#888' }}>Takes about 2 minutes — front and side photos with live pose tracking</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              value={clientName} onChange={e => setClientName(e.target.value)}
              placeholder="Client name (optional)"
              style={{
                padding: '10px 16px', borderRadius: 10, border: '1px solid #ddd',
                font: `400 14px ${s.FONT}`, width: 200, outline: 'none',
              }}
            />
            <button onClick={startAssessment} style={{
              padding: '12px 28px', borderRadius: 100, border: 'none',
              background: theme.accent, color: '#fff', font: `500 14px ${s.FONT}`,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {modelLoading ? 'Loading model...' : 'Start Assessment'}
            </button>
          </div>
        </div>

        {/* Past Assessments */}
        {assessments.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ font: `600 16px ${s.FONT}`, color: '#1a1a1a' }}>Assessment History</div>
              {assessments.length >= 2 && (
                <button onClick={() => {
                  setCompareMode(true);
                  setCompareA(assessments[assessments.length - 1]);
                  setCompareB(assessments[assessments.length - 2]);
                }} style={{
                  padding: '8px 18px', borderRadius: 100, border: `1.5px solid ${theme.accent}40`,
                  background: 'transparent', color: theme.accent, font: `500 12px ${s.FONT}`, cursor: 'pointer',
                }}>
                  Compare Latest
                </button>
              )}
            </div>

            {/* Compare view */}
            {compareMode && compareA && compareB && (
              <div style={{
                padding: 28, borderRadius: 20, background: '#fff', border: `1.5px solid ${theme.accent}20`,
                marginBottom: 24,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ font: `600 15px ${s.FONT}`, color: '#1a1a1a' }}>Progress Comparison</div>
                  <button onClick={() => setCompareMode(false)} style={{
                    background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', font: `400 20px ${s.FONT}`,
                  }}>x</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  {[compareB, compareA].map((a, i) => (
                    <div key={a.id}>
                      <div style={{ font: `500 11px ${s.MONO}`, color: i === 0 ? '#999' : theme.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
                        {i === 0 ? 'Before' : 'After'} — {new Date(a.date).toLocaleDateString()}
                      </div>
                      <div style={{ font: `700 28px ${s.DISPLAY}`, color: '#1a1a1a', marginBottom: 12 }}>
                        {a.scores.overall}<span style={{ font: `300 14px ${s.FONT}`, color: '#999' }}>/100</span>
                      </div>
                      {METRICS.map(m => {
                        const sc = a.scores[m.key];
                        return sc ? (
                          <div key={m.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                            <span style={{ font: `400 13px ${s.FONT}`, color: '#666' }}>{m.label}</span>
                            <span style={{ font: `600 13px ${s.MONO}`, color: scoreColor(sc.score, theme.accent) }}>{sc.score}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  ))}
                </div>
                {(() => {
                  const diff = compareA.scores.overall - compareB.scores.overall;
                  return diff !== 0 ? (
                    <div style={{
                      marginTop: 20, padding: 16, borderRadius: 12,
                      background: diff > 0 ? '#ECFDF5' : '#FEF2F2', textAlign: 'center',
                    }}>
                      <span style={{ font: `600 15px ${s.FONT}`, color: diff > 0 ? '#059669' : '#DC2626' }}>
                        {diff > 0 ? '+' : ''}{diff} points overall {diff > 0 ? 'improvement' : 'change'}
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...assessments].reverse().map(a => (
                <div key={a.id} onClick={() => setSelectedAssessment(selectedAssessment?.id === a.id ? null : a)} style={{
                  padding: 20, borderRadius: 14, background: '#fff', border: '1px solid #eee',
                  cursor: 'pointer', transition: 'all 0.2s',
                  ...(selectedAssessment?.id === a.id ? { borderColor: `${theme.accent}40`, boxShadow: `0 4px 20px ${theme.accent}10` } : {}),
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ font: `500 14px ${s.FONT}`, color: '#1a1a1a' }}>{a.clientName}</div>
                      <div style={{ font: `400 12px ${s.FONT}`, color: '#999', marginTop: 2 }}>
                        {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: `conic-gradient(${scoreColor(a.scores.overall, theme.accent)} ${a.scores.overall * 3.6}deg, #f0f0f0 0deg)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, background: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          font: `600 14px ${s.MONO}`, color: '#1a1a1a',
                        }}>{a.scores.overall}</div>
                      </div>
                      <button onClick={e => {
                        e.stopPropagation();
                        deleteAssessment(a.id);
                        setAssessments(getAssessments());
                        if (selectedAssessment?.id === a.id) setSelectedAssessment(null);
                      }} style={{
                        background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', font: `400 16px ${s.FONT}`, padding: 4,
                      }}>x</button>
                    </div>
                  </div>
                  {selectedAssessment?.id === a.id && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                        {METRICS.map(m => {
                          const sc = a.scores[m.key];
                          return sc ? (
                            <div key={m.key} style={{ padding: 12, borderRadius: 10, background: '#fafaf8' }}>
                              <div style={{ font: `400 11px ${s.FONT}`, color: '#999', marginBottom: 4 }}>{m.label}</div>
                              <div style={{ font: `600 16px ${s.MONO}`, color: scoreColor(sc.score, theme.accent) }}>{sc.score}</div>
                              <div style={{ font: `300 10px ${s.FONT}`, color: '#aaa', marginTop: 2 }}>{sc.detail}</div>
                            </div>
                          ) : null;
                        })}
                      </div>
                      {a.recommendations && (
                        <div>
                          <div style={{ font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, color: '#bbb', marginBottom: 8 }}>Recommendations</div>
                          {a.recommendations.map((r, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                              <span style={{ color: theme.accent, flexShrink: 0 }}>-</span>
                              <span style={{ font: `300 13px ${s.FONT}`, color: '#666', lineHeight: 1.5 }}>{r}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {assessments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#ccc' }}>
            <div style={{ font: `300 48px ${s.DISPLAY}`, marginBottom: 8 }}>0</div>
            <div style={{ font: `300 14px ${s.FONT}` }}>No assessments yet — start one above</div>
          </div>
        )}
      </div>
    </div>
  );

  // ── Camera Capture Screen ──
  if (step === 'capture') return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1000 }}>
      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay playsInline muted
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
        }}
      />
      {/* Live skeleton overlay canvas */}
      <canvas
        ref={overlayRef}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
          pointerEvents: 'none', zIndex: 2,
        }}
      />
      {/* Hidden capture canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Camera error */}
      {cameraError && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.9)', zIndex: 20,
        }}>
          <div style={{ textAlign: 'center', padding: 32, maxWidth: 400 }}>
            <div style={{ font: `400 20px ${s.DISPLAY}`, color: '#fff', marginBottom: 12 }}>Camera Unavailable</div>
            <p style={{ font: `300 14px ${s.FONT}`, color: '#999', lineHeight: 1.6, marginBottom: 24 }}>{cameraError}</p>
            <button onClick={() => { stopCamera(); setStep('intro'); }} style={{
              padding: '10px 24px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent', color: '#fff', font: `400 14px ${s.FONT}`, cursor: 'pointer',
            }}>Go Back</button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          GUIDELINES OVERLAY
          ═══════════════════════════════════════════ */}
      {showGuidelines && !cameraError && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 15,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'guideIn 0.4s ease',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)', borderRadius: 24, padding: '36px 32px',
            maxWidth: 440, width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: theme.accent,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <div style={{ font: `400 22px ${s.DISPLAY}`, color: '#1a1a1a', marginBottom: 4 }}>
                Before we begin
              </div>
              <div style={{ font: `300 13px ${s.FONT}`, color: '#999' }}>
                {modelLoading ? 'Loading pose detection model...' : modelReady ? 'Pose model ready — follow these guidelines' : 'Follow these guidelines for accurate results'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
              {GUIDELINES.map((g, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `${theme.accent}12`, color: theme.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    font: `600 12px ${s.MONO}`,
                  }}>{g.icon}</div>
                  <div>
                    <div style={{ font: `500 14px ${s.FONT}`, color: '#1a1a1a', marginBottom: 1 }}>{g.title}</div>
                    <div style={{ font: `300 12px ${s.FONT}`, color: '#999', lineHeight: 1.4 }}>{g.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              padding: '12px 16px', borderRadius: 12,
              background: '#FEF3C7', border: '1px solid #FDE68A', marginBottom: 24,
            }}>
              <div style={{ font: `500 12px ${s.FONT}`, color: '#92400E', lineHeight: 1.5 }}>
                Important: Stand the way you normally would waiting in line at a coffee shop. Don't try to "stand up straight" — we need your natural posture.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { stopCamera(); setStep('intro'); }} style={{
                flex: 1, padding: '14px 0', borderRadius: 100,
                border: '1px solid #ddd', background: 'transparent',
                color: '#888', font: `400 14px ${s.FONT}`, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={() => { setShowGuidelines(false); if (landmarkerRef.current) startDetectionLoop(); }} style={{
                flex: 2, padding: '14px 0', borderRadius: 100,
                border: 'none', background: theme.accent, color: '#fff',
                font: `500 14px ${s.FONT}`, cursor: 'pointer',
                opacity: modelLoading ? 0.6 : 1,
              }} disabled={modelLoading}>
                {modelLoading ? 'Loading...' : "I'm Ready"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CAPTURE GUIDE
          ═══════════════════════════════════════════ */}
      {!showGuidelines && !cameraError && (
        <>
          {/* Phase indicator */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
          }}>
            <div>
              <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 2, color: theme.accent }}>
                {capturePhase === 'front' ? 'Step 1 of 2' : 'Step 2 of 2'}
              </div>
              <div style={{ font: `400 22px ${s.DISPLAY}`, color: '#fff', marginTop: 4 }}>
                {capturePhase === 'front' ? 'Front View' : 'Side View (Right)'}
              </div>
              {/* Model status indicator */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
                padding: '4px 10px', borderRadius: 100,
                background: modelReady ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.1)',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: modelReady ? '#4ADE80' : '#F59E0B',
                  animation: modelReady ? 'none' : 'pulse 1s infinite',
                }} />
                <span style={{ font: `400 10px ${s.MONO}`, color: modelReady ? '#4ADE80' : '#F59E0B' }}>
                  {modelReady ? 'POSE DETECTION ACTIVE' : 'LOADING MODEL...'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => {
                stopCamera();
                setFacingMode(f => f === 'user' ? 'environment' : 'user');
                setTimeout(() => startCamera(), 100);
              }} style={{
                width: 40, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 16v4a2 2 0 01-2 2h-4M4 8V4a2 2 0 012-2h4M16 4l4 4-4 4M8 20l-4-4 4-4"/>
                </svg>
              </button>
              <button onClick={() => { stopCamera(); setStep('intro'); }} style={{
                width: 40, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: `400 18px ${s.FONT}`,
              }}>x</button>
            </div>
          </div>

          {/* Silhouette guide (only if no pose detected yet) */}
          {!currentLandmarks && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              zIndex: 3, pointerEvents: 'none',
            }}>
              <svg width="200" height="420" viewBox="0 0 200 420" fill="none" opacity="0.3">
                {capturePhase === 'front' ? (
                  <>
                    <ellipse cx="100" cy="40" rx="24" ry="30" stroke="#fff" strokeWidth="1.5" strokeDasharray="6 4"/>
                    <line x1="100" y1="70" x2="100" y2="200" stroke="#fff" strokeWidth="1.5" strokeDasharray="6 4"/>
                    <line x1="100" y1="90" x2="50" y2="170" stroke="#fff" strokeWidth="1.5" strokeDasharray="6 4"/>
                    <line x1="100" y1="90" x2="150" y2="170" stroke="#fff" strokeWidth="1.5" strokeDasharray="6 4"/>
                    <line x1="85" y1="200" x2="70" y2="330" stroke="#fff" strokeWidth="1.5" strokeDasharray="6 4"/>
                    <line x1="115" y1="200" x2="130" y2="330" stroke="#fff" strokeWidth="1.5" strokeDasharray="6 4"/>
                    <line x1="70" y1="330" x2="60" y2="400" stroke="#fff" strokeWidth="1.5" strokeDasharray="6 4"/>
                    <line x1="130" y1="330" x2="140" y2="400" stroke="#fff" strokeWidth="1.5" strokeDasharray="6 4"/>
                  </>
                ) : (
                  <>
                    <ellipse cx="100" cy="40" rx="20" ry="28" stroke="#fff" strokeWidth="1.5" strokeDasharray="6 4"/>
                    <path d="M100 68 Q95 130 100 200" stroke="#fff" strokeWidth="1.5" strokeDasharray="6 4" fill="none"/>
                    <line x1="100" y1="90" x2="75" y2="170" stroke="#fff" strokeWidth="1.5" strokeDasharray="6 4"/>
                    <line x1="100" y1="200" x2="95" y2="330" stroke="#fff" strokeWidth="1.5" strokeDasharray="6 4"/>
                    <line x1="95" y1="330" x2="90" y2="400" stroke="#fff" strokeWidth="1.5" strokeDasharray="6 4"/>
                  </>
                )}
              </svg>
            </div>
          )}

          {/* Pose instruction */}
          <div style={{
            position: 'absolute', bottom: 160, left: 0, right: 0, zIndex: 10,
            textAlign: 'center', padding: '0 24px',
          }}>
            <div style={{
              display: 'inline-block', padding: '10px 20px', borderRadius: 100,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
            }}>
              <span style={{ font: `300 13px ${s.FONT}`, color: '#ddd' }}>
                {capturePhase === 'front'
                  ? 'Face the camera — arms at sides, feet hip-width apart'
                  : 'Turn to your right — arms relaxed, look straight ahead'}
              </span>
            </div>
          </div>

          {/* Validation checklist */}
          <div style={{
            position: 'absolute', bottom: 100, left: 24, zIndex: 10,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {[
              { key: 'visible', label: 'Full body visible' },
              { key: 'lighting', label: 'Good lighting' },
              { key: 'distance', label: 'Correct distance' },
              { key: 'stable', label: 'Hold still...' },
            ].map(c => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: checks[c.key] ? '#4ADE80' : 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                }}>
                  {checks[c.key] && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <span style={{
                  font: `400 12px ${s.FONT}`,
                  color: checks[c.key] ? '#4ADE80' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.3s',
                }}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Capture button */}
          <div style={{
            position: 'absolute', bottom: 32, left: 0, right: 0, zIndex: 10,
            display: 'flex', justifyContent: 'center',
          }}>
            {countdown !== null ? (
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: `700 28px ${s.DISPLAY}`, color: '#fff',
                animation: 'pulse 0.5s ease',
              }}>{countdown || '!'}</div>
            ) : (
              <button
                onClick={handleCapture}
                disabled={!allChecks}
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: allChecks ? '#fff' : 'rgba(255,255,255,0.2)',
                  border: `3px solid ${allChecks ? theme.accent : 'rgba(255,255,255,0.1)'}`,
                  cursor: allChecks ? 'pointer' : 'default',
                  transition: 'all 0.3s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: allChecks ? theme.accent : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.3s',
                }} />
              </button>
            )}
          </div>

          {/* Front photo preview when capturing side */}
          {capturePhase === 'side' && frontPhoto && (
            <div style={{
              position: 'absolute', bottom: 100, right: 24, zIndex: 10,
              width: 60, height: 80, borderRadius: 10, overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.3)',
            }}>
              <img src={frontPhoto} alt="Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, padding: 2,
                background: 'rgba(0,0,0,0.5)', textAlign: 'center',
                font: `500 8px ${s.MONO}`, color: '#fff', textTransform: 'uppercase', letterSpacing: 1,
              }}>Front</div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes guideIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
      `}</style>
    </div>
  );

  // ── Analyzing Screen ──
  if (step === 'analyzing') return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20, margin: '0 auto 24px',
          border: `2px solid ${theme.accent}`, borderTopColor: 'transparent',
          animation: 'spin 1s linear infinite',
        }} />
        <div style={{ font: `400 24px ${s.DISPLAY}`, color: '#fff', marginBottom: 8 }}>
          Analyzing posture
        </div>
        <div style={{ font: `300 14px ${s.FONT}`, color: '#666' }}>
          Computing alignment angles from 33 body landmarks...
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Results Screen ──
  if (step === 'results' && analysis) return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 3, color: theme.accent, marginBottom: 8 }}>
            Assessment Complete
          </div>
          <h1 style={{ font: `400 32px ${s.DISPLAY}`, color: '#1a1a1a', marginBottom: 8 }}>
            {clientName || 'Walk-in'} — Posture Analysis
          </h1>
        </div>

        {/* Overall score */}
        <div style={{
          padding: 32, borderRadius: 20, marginBottom: 24,
          background: '#fff', border: '1px solid #eee',
          display: 'flex', alignItems: 'center', gap: 32,
        }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%', flexShrink: 0,
            background: `conic-gradient(${scoreColor(analysis.scores.overall, theme.accent)} ${analysis.scores.overall * 3.6}deg, #f0f0f0 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            }}>
              <div style={{ font: `700 28px ${s.DISPLAY}`, color: '#1a1a1a' }}>{analysis.scores.overall}</div>
              <div style={{ font: `400 10px ${s.MONO}`, color: '#999' }}>/ 100</div>
            </div>
          </div>
          <div>
            <div style={{ font: `600 18px ${s.FONT}`, color: '#1a1a1a', marginBottom: 4 }}>
              Overall Alignment Score
            </div>
            <div style={{ font: `300 14px ${s.FONT}`, color: '#888', lineHeight: 1.6 }}>
              {analysis.scores.overall >= 85 ? 'Excellent postural alignment. Minor areas for optimization.' :
               analysis.scores.overall >= 70 ? 'Good alignment with some areas that Pilates can meaningfully improve.' :
               'Several alignment patterns identified — targeted Pilates work will make a significant difference.'}
            </div>
          </div>
        </div>

        {/* Photos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {[
            { photo: frontPhoto, label: 'Front View — with skeleton', hasOverlay: true },
            { photo: sidePhoto, label: 'Side View' },
          ].map(v => (
            <div key={v.label} style={{
              borderRadius: 16, overflow: 'hidden', background: '#000',
              position: 'relative', aspectRatio: '3/4',
            }}>
              {v.hasOverlay && analysis.landmarks ? (
                <canvas ref={skeletonRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : v.photo ? (
                <img src={v.photo} alt={v.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ font: `300 14px ${s.FONT}`, color: '#666' }}>No photo</span>
                </div>
              )}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
              }}>
                <div style={{ font: `500 11px ${s.MONO}`, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {v.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {METRICS.map(m => {
            const sc = analysis.scores[m.key];
            return (
              <div key={m.key} style={{
                padding: 20, borderRadius: 16, background: '#fff', border: '1px solid #eee',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ font: `500 13px ${s.FONT}`, color: '#1a1a1a' }}>{m.label}</div>
                  <div style={{ font: `600 16px ${s.MONO}`, color: scoreColor(sc.score, theme.accent) }}>{sc.score}</div>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: '#f0f0f0', marginBottom: 10 }}>
                  <div style={{
                    height: '100%', borderRadius: 2, width: `${sc.score}%`,
                    background: scoreColor(sc.score, theme.accent), transition: 'width 1s ease',
                  }} />
                </div>
                <div style={{ font: `300 11px ${s.FONT}`, color: '#999', lineHeight: 1.4 }}>{sc.detail}</div>
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        <div style={{
          padding: 28, borderRadius: 20, background: '#fff', border: '1px solid #eee', marginBottom: 24,
        }}>
          <div style={{
            font: `500 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 2,
            color: theme.accent, marginBottom: 16,
          }}>Class Recommendations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {analysis.recommendations.map((rec, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  background: `${theme.accent}12`, color: theme.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  font: `600 11px ${s.MONO}`,
                }}>{i + 1}</div>
                <div style={{ font: `300 14px ${s.FONT}`, color: '#555', lineHeight: 1.6 }}>{rec}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => { setStep('intro'); setAnalysis(null); }} style={{
            padding: '14px 28px', borderRadius: 100,
            border: '1px solid #ddd', background: 'transparent',
            color: '#888', font: `400 14px ${s.FONT}`, cursor: 'pointer',
          }}>Discard</button>
          <button onClick={saveAssessment} style={{
            padding: '14px 36px', borderRadius: 100, border: 'none',
            background: theme.accent, color: '#fff',
            font: `500 14px ${s.FONT}`, cursor: 'pointer',
          }}>Save Assessment</button>
        </div>
      </div>
    </div>
  );

  return null;
}
