#!/usr/bin/env node

/**
 * DEMO: Data Generator Tests - Shows testability & accuracy without npm
 * Run with: node demo.js
 */

// Import data generators
const {
  EMOTIONS,
  EMOTION_COLORS,
  EMOTION_ICONS,
  randBetween,
  generateEmotionSnapshot,
  generateTimeline,
  generateConfusionMatrix,
  generateModelMetrics,
  generateTrainingHistory,
  generatePerEmotionMetrics,
} = require('./src/dataGenerators.js');

// Simple test reporter
let passed = 0, failed = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${e.message}`);
    failed++;
  }
};

const assert = (condition, msg) => {
  if (!condition) throw new Error(msg);
};

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║  EMOTION DASHBOARD - TESTABILITY & ACCURACY DEMO              ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// ━━━━━━━━━━━ CONSTANTS TESTS ━━━━━━━━━━━
console.log('📦 Testing Constants...\n');

test('EMOTIONS array has 7 emotions', () => {
  assert(EMOTIONS.length === 7, 'Expected 7 emotions');
  assert(EMOTIONS.includes('Happy'), 'Missing Happy');
  assert(EMOTIONS.includes('Sad'), 'Missing Sad');
});

test('EMOTION_COLORS defined for all emotions', () => {
  EMOTIONS.forEach(e => {
    assert(EMOTION_COLORS[e], `Missing color for ${e}`);
    assert(/^#[0-9A-F]{6}$/i.test(EMOTION_COLORS[e]), `Invalid hex color for ${e}`);
  });
});

test('EMOTION_ICONS defined for all emotions', () => {
  EMOTIONS.forEach(e => {
    assert(EMOTION_ICONS[e], `Missing icon for ${e}`);
  });
});

// ━━━━━━━━━━━ RNG INJECTION TESTS ━━━━━━━━━━━
console.log('\n🎲 Testing RNG Injection (Deterministic Testing)...\n');

test('randBetween works with default RNG', () => {
  const val = randBetween(10, 20);
  assert(val >= 10 && val < 20, `Value ${val} out of range [10,20)`);
});

test('randBetween works with custom fixed RNG', () => {
  const fixedRNG = () => 0.5;
  const result = randBetween(0, 100, fixedRNG);
  assert(result === 50, `Expected 50, got ${result}`);
});

test('generateEmotionSnapshot is deterministic with fixed RNG', () => {
  const fixedRNG = () => 1/7; // equal probability for all emotions
  const snap1 = generateEmotionSnapshot(fixedRNG);
  const snap2 = generateEmotionSnapshot(fixedRNG);
  
  EMOTIONS.forEach(e => {
    assert(snap1[e] === snap2[e], `Snapshots differ for ${e}`);
  });
});

// ━━━━━━━━━━━ EMOTION SNAPSHOT TESTS ━━━━━━━━━━━
console.log('\n😊 Testing Emotion Snapshots (Accuracy)...\n');

test('generateEmotionSnapshot returns all emotions', () => {
  const snap = generateEmotionSnapshot();
  EMOTIONS.forEach(e => {
    assert(snap[e] !== undefined, `Missing emotion: ${e}`);
    assert(typeof snap[e] === 'number', `${e} is not a number`);
  });
});

test('emotion values are valid percentages (0-100)', () => {
  const snap = generateEmotionSnapshot();
  EMOTIONS.forEach(e => {
    assert(snap[e] >= 0 && snap[e] <= 100, `${e}=${snap[e]} out of range`);
  });
});

test('emotion percentages sum to 100 (within rounding)', () => {
  const snap = generateEmotionSnapshot();
  const sum = Object.values(snap).reduce((a, b) => a + b, 0);
  assert(Math.abs(sum - 100) < 0.2, `Sum ${sum} not close to 100`);
});

// Show example snapshot
const exampleSnap = generateEmotionSnapshot();
console.log('\n   📊 Example Emotion Snapshot:');
Object.entries(exampleSnap).forEach(([emotion, percent]) => {
  const bar = '█'.repeat(Math.round(percent / 2));
  console.log(`   ${EMOTION_ICONS[emotion]} ${emotion.padEnd(10)} ${percent.toFixed(1)}% ${bar}`);
});

// ━━━━━━━━━━━ CONFUSION MATRIX TESTS ━━━━━━━━━━━
console.log('\n\n🎯 Testing Confusion Matrix (ML Accuracy)...\n');

test('confusion matrix is 7x7', () => {
  const matrix = generateConfusionMatrix();
  assert(matrix.length === 7, `Expected 7 rows, got ${matrix.length}`);
  matrix.forEach((row, i) => {
    assert(row.length === 7, `Row ${i} has ${row.length} columns, expected 7`);
  });
});

test('diagonal elements (correct) are 70-99%', () => {
  const matrix = generateConfusionMatrix();
  matrix.forEach((row, i) => {
    const diag = row[i];
    assert(diag >= 70 && diag <= 99, `Diagonal [${i},${i}]=${diag} out of range [70,99]`);
  });
});

test('off-diagonal elements (errors) are 0-10%', () => {
  const matrix = generateConfusionMatrix();
  matrix.forEach((row, i) => {
    row.forEach((val, j) => {
      if (i !== j) {
        assert(val >= 0 && val <= 10, `Off-diagonal [${i},${j}]=${val} out of range [0,10]`);
      }
    });
  });
});

// Show example confusion matrix
const exampleMatrix = generateConfusionMatrix();
console.log('\n   📈 Example Confusion Matrix (diagonal elements):');
exampleMatrix.forEach((row, i) => {
  console.log(`   ${EMOTIONS[i].padEnd(10)} → ${row[i]}% correct`);
});

// ━━━━━━━━━━━ MODEL METRICS TESTS ━━━━━━━━━━━
console.log('\n\n⚙️  Testing Model Metrics (Realistic Ranges)...\n');

test('model metrics has all required fields', () => {
  const m = generateModelMetrics();
  assert(m.accuracy !== undefined, 'Missing accuracy');
  assert(m.precision !== undefined, 'Missing precision');
  assert(m.recall !== undefined, 'Missing recall');
  assert(m.f1 !== undefined, 'Missing f1');
  assert(m.latency !== undefined, 'Missing latency');
  assert(m.fps !== undefined, 'Missing fps');
  assert(m.faces !== undefined, 'Missing faces');
});

test('accuracy is realistic (87-96%)', () => {
  for (let i = 0; i < 10; i++) {
    const m = generateModelMetrics();
    assert(m.accuracy >= 87 && m.accuracy <= 96, `Accuracy ${m.accuracy} out of range`);
  }
});

test('latency is real-time capable (12-28ms)', () => {
  for (let i = 0; i < 10; i++) {
    const m = generateModelMetrics();
    assert(m.latency >= 12 && m.latency <= 28, `Latency ${m.latency}ms out of range`);
  }
});

test('fps is video-suitable (28-62 fps)', () => {
  for (let i = 0; i < 10; i++) {
    const m = generateModelMetrics();
    assert(m.fps >= 28 && m.fps <= 62, `FPS ${m.fps} out of range`);
  }
});

// Show example metrics
const exampleMetrics = generateModelMetrics();
console.log('\n   📊 Example Model Metrics:');
console.log(`   ✅ Accuracy:  ${exampleMetrics.accuracy.toFixed(2)}%`);
console.log(`   📏 Precision: ${exampleMetrics.precision.toFixed(2)}%`);
console.log(`   🎯 Recall:    ${exampleMetrics.recall.toFixed(2)}%`);
console.log(`   ⚡ F1 Score:   ${exampleMetrics.f1.toFixed(2)}%`);
console.log(`   ⏱️  Latency:   ${exampleMetrics.latency.toFixed(1)}ms`);
console.log(`   🎬 FPS:       ${exampleMetrics.fps.toFixed(1)} fps`);
console.log(`   👤 Faces:     ${exampleMetrics.faces}`);

// ━━━━━━━━━━━ TRAINING HISTORY TESTS ━━━━━━━━━━━
console.log('\n\n📚 Testing Training History (Convergence)...\n');

test('training history has 50 epochs', () => {
  const h = generateTrainingHistory();
  assert(h.length === 50, `Expected 50 epochs, got ${h.length}`);
});

test('loss decreases over epochs', () => {
  const h = generateTrainingHistory();
  const earlyAvg = h.slice(0, 5).reduce((sum, e) => sum + e.trainLoss, 0) / 5;
  const lateAvg = h.slice(-5).reduce((sum, e) => sum + e.trainLoss, 0) / 5;
  assert(lateAvg < earlyAvg, `Loss not decreasing: early=${earlyAvg.toFixed(3)}, late=${lateAvg.toFixed(3)}`);
});

test('accuracy increases over epochs', () => {
  const h = generateTrainingHistory();
  const earlyAvg = h.slice(0, 5).reduce((sum, e) => sum + e.trainAcc, 0) / 5;
  const lateAvg = h.slice(-5).reduce((sum, e) => sum + e.trainAcc, 0) / 5;
  assert(lateAvg > earlyAvg, `Accuracy not increasing: early=${earlyAvg.toFixed(1)}, late=${lateAvg.toFixed(1)}`);
});

// Show training progress
const exampleHistory = generateTrainingHistory();
console.log('\n   📈 Training Progress (first 5 and last 5 epochs):');
console.log('   Epoch | Train Loss | Train Acc | Val Loss | Val Acc');
console.log('   ------|------------|-----------|----------|--------');
[...exampleHistory.slice(0, 5), '...', ...exampleHistory.slice(-5)].forEach(e => {
  if (e === '...') {
    console.log('   ...   |    ...     |    ...    |   ...    |   ...');
  } else {
    console.log(`   ${String(e.epoch).padStart(5)} | ${e.trainLoss.toFixed(3).padEnd(10)} | ${e.trainAcc.toFixed(1).padEnd(8)}% | ${e.valLoss.toFixed(3).padEnd(8)} | ${e.valAcc.toFixed(1).padEnd(5)}%`);
  }
});

// ━━━━━━━━━━━ PER-EMOTION METRICS TESTS ━━━━━━━━━━━
console.log('\n\n📊 Testing Per-Emotion Metrics...\n');

test('per-emotion metrics covers all emotions', () => {
  const m = generatePerEmotionMetrics();
  assert(m.length === 7, `Expected 7 emotions, got ${m.length}`);
  m.forEach(metric => {
    assert(EMOTIONS.includes(metric.emotion), `Unknown emotion: ${metric.emotion}`);
  });
});

test('per-emotion support is realistic (80-300)', () => {
  const m = generatePerEmotionMetrics();
  m.forEach(metric => {
    assert(metric.support >= 80 && metric.support <= 300, 
      `Support for ${metric.emotion} = ${metric.support} out of range`);
  });
});

// Show per-class performance
const examplePerClass = generatePerEmotionMetrics();
console.log('\n   Per-Class Performance:');
console.log('   Emotion    | Precision | Recall | F1   | Samples');
console.log('   -----------|-----------|--------|------|--------');
examplePerClass.forEach(m => {
  console.log(`   ${m.emotion.padEnd(10)} | ${m.precision.toFixed(1).padStart(8)}% | ${m.recall.toFixed(1).padStart(5)}% | ${m.f1.toFixed(1).padStart(4)}% | ${String(m.support).padStart(6)}`);
});

// ━━━━━━━━━━━ FINAL SUMMARY ━━━━━━━━━━━
console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
console.log(`║ TEST RESULTS: ${String(passed).padEnd(4)} passed  ${String(failed).padEnd(4)} failed`.padEnd(63) + '║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

if (failed === 0) {
  console.log('🎉 All tests passed! Your code is:\n');
  console.log('   ✅ TESTABLE      - Modular, injectable dependencies');
  console.log('   ✅ ACCURATE      - Realistic metrics and ranges');
  console.log('   ✅ INTERVIEW-READY - Well-structured, documented\n');
} else {
  console.log(`⚠️  ${failed} test(s) failed. Review the errors above.\n`);
  process.exit(1);
}

process.exit(0);
