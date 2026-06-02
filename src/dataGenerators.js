// dataGenerators.js
// utility constants and random data generators used by the emotion dashboard

export const EMOTIONS = ["Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust", "Neutral"];

export const EMOTION_COLORS = {
  Happy:    "#FFD166",
  Sad:      "#5E9AFF",
  Angry:    "#FF5757",
  Fear:     "#C77DFF",
  Surprise: "#06D6A0",
  Disgust:  "#FF9500",
  Neutral:  "#8B9BAF",
};

export const EMOTION_ICONS = {
  Happy: "😊", Sad: "😢", Angry: "😠", Fear: "😨", Surprise: "😲", Disgust: "🤢", Neutral: "😐"
};

// allow a custom random number generator (rnd) for deterministic testing
export const randBetween = (a, b, rnd = Math.random) => rnd() * (b - a) + a;

export const generateEmotionSnapshot = (rnd = Math.random) => {
  const vals = EMOTIONS.map(() => rnd());
  const sum = vals.reduce((a, b) => a + b, 0);
  const result = {};
  EMOTIONS.forEach((e, i) => (result[e] = parseFloat(((vals[i] / sum) * 100).toFixed(1))));
  return result;
};

export const generateTimeline = (points = 30, rnd = Math.random) => {
  return Array.from({ length: points }, (_, i) => {
    const snap = generateEmotionSnapshot(rnd);
    return { time: `${String(Math.floor((30 - i) * 2)).padStart(2, "0")}s`, ...snap };
  }).reverse();
};

export const generateConfusionMatrix = (rnd = Math.random) => {
  const n = EMOTIONS.length;
  const mat = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return Math.floor(randBetween(70, 99, rnd));
      return Math.floor(randBetween(0, 10, rnd));
    })
  );
  return mat;
};

export const generateModelMetrics = (rnd = Math.random) => ({
  accuracy: parseFloat(randBetween(87, 96, rnd).toFixed(2)),
  precision: parseFloat(randBetween(84, 95, rnd).toFixed(2)),
  recall: parseFloat(randBetween(83, 94, rnd).toFixed(2)),
  f1: parseFloat(randBetween(85, 95, rnd).toFixed(2)),
  latency: parseFloat(randBetween(12, 28, rnd).toFixed(1)),
  fps: parseFloat(randBetween(28, 62, rnd).toFixed(1)),
  faces: Math.floor(randBetween(1, 5, rnd)),
});

export const generateTrainingHistory = (rnd = Math.random) =>
  Array.from({ length: 50 }, (_, i) => ({
    epoch: i + 1,
    trainLoss: parseFloat((2.2 * Math.exp(-0.09 * i) + randBetween(0, 0.05, rnd)).toFixed(3)),
    valLoss: parseFloat((2.4 * Math.exp(-0.08 * i) + randBetween(0, 0.08, rnd)).toFixed(3)),
    trainAcc: parseFloat((100 - 90 * Math.exp(-0.1 * i) + randBetween(-1, 1, rnd)).toFixed(2)),
    valAcc: parseFloat((100 - 92 * Math.exp(-0.095 * i) + randBetween(-2, 2, rnd)).toFixed(2)),
  }));

export const generateAlerts = (rnd = Math.random) => [
  { id: 1, time: "12:45:02", type: "warning", msg: "Anger spike detected — confidence 94.2%" },
  { id: 2, time: "12:44:38", type: "info",    msg: "New face detected in frame #3" },
  { id: 3, time: "12:43:55", type: "success", msg: "Model recalibrated — +1.2% accuracy" },
  { id: 4, time: "12:43:10", type: "warning", msg: "Low lighting detected — reducing FPS" },
  { id: 5, time: "12:42:01", type: "error",   msg: "Face occlusion in region B — skipped frame" },
];

export const generatePerEmotionMetrics = (rnd = Math.random) =>
  EMOTIONS.map(e => ({
    emotion: e,
    precision: parseFloat(randBetween(78, 97, rnd).toFixed(1)),
    recall: parseFloat(randBetween(76, 96, rnd).toFixed(1)),
    f1: parseFloat(randBetween(77, 96, rnd).toFixed(1)),
    support: Math.floor(randBetween(80, 300, rnd)),
  }));
