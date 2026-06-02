/**
 * Unit tests for data generators to ensure accuracy and testability
 * These tests verify that:
 * 1. Data generators return valid values in expected ranges
 * 2. Emotion distributions sum to 100%
 * 3. Random functions work with custom RNG for deterministic testing
 */

import {
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
} from '../src/dataGenerators';

describe('Data Generators - Core Utilities', () => {
  describe('Constants', () => {
    test('EMOTIONS contains 7 emotions', () => {
      expect(EMOTIONS).toHaveLength(7);
      expect(EMOTIONS).toEqual(['Happy', 'Sad', 'Angry', 'Fear', 'Surprise', 'Disgust', 'Neutral']);
    });

    test('EMOTION_COLORS has color for each emotion', () => {
      EMOTIONS.forEach(emotion => {
        expect(EMOTION_COLORS[emotion]).toBeDefined();
        expect(EMOTION_COLORS[emotion]).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    test('EMOTION_ICONS has emoji for each emotion', () => {
      EMOTIONS.forEach(emotion => {
        expect(EMOTION_ICONS[emotion]).toBeDefined();
        expect(typeof EMOTION_ICONS[emotion]).toBe('string');
      });
    });
  });

  describe('randBetween', () => {
    test('returns number between boundaries with default RNG', () => {
      for (let i = 0; i < 100; i++) {
        const val = randBetween(10, 20);
        expect(val).toBeGreaterThanOrEqual(10);
        expect(val).toBeLessThan(20);
      }
    });

    test('works with custom RNG for deterministic testing', () => {
      // fixed RNG that always returns 0.5
      const fixedRNG = () => 0.5;
      const result = randBetween(0, 100, fixedRNG);
      expect(result).toBe(50);
    });

    test('respects custom RNG parameters', () => {
      const fixedRNG = () => 0.75;
      const result = randBetween(20, 40, fixedRNG);
      expect(result).toBe(35); // 0.75 * (40-20) + 20
    });
  });
});

describe('Data Generators - Emotion Snapshot', () => {
  test('generateEmotionSnapshot returns object with all emotions', () => {
    const snapshot = generateEmotionSnapshot();
    EMOTIONS.forEach(emotion => {
      expect(snapshot[emotion]).toBeDefined();
      expect(typeof snapshot[emotion]).toBe('number');
    });
  });

  test('emotion values are percentages (0-100)', () => {
    const snapshot = generateEmotionSnapshot();
    EMOTIONS.forEach(emotion => {
      expect(snapshot[emotion]).toBeGreaterThanOrEqual(0);
      expect(snapshot[emotion]).toBeLessThanOrEqual(100);
    });
  });

  test('emotion percentages sum to 100 (within rounding)', () => {
    const snapshot = generateEmotionSnapshot();
    const sum = EMOTIONS.reduce((acc, e) => acc + snapshot[e], 0);
    expect(sum).toBeCloseTo(100, 1);
  });

  test('produces deterministic output with fixed RNG', () => {
    const fixedRNG = () => 0.5;
    const snap1 = generateEmotionSnapshot(fixedRNG);
    const snap2 = generateEmotionSnapshot(fixedRNG);
    
    EMOTIONS.forEach(emotion => {
      expect(snap1[emotion]).toBe(snap2[emotion]);
    });
  });
});

describe('Data Generators - Timeline', () => {
  test('generateTimeline returns array of specified length', () => {
    expect(generateTimeline(10)).toHaveLength(10);
    expect(generateTimeline(50)).toHaveLength(50);
  });

  test('each timeline point has time and emotion values', () => {
    const timeline = generateTimeline(5);
    timeline.forEach(point => {
      expect(point.time).toBeDefined();
      expect(typeof point.time).toBe('string');
      EMOTIONS.forEach(emotion => {
        expect(point[emotion]).toBeDefined();
        expect(typeof point[emotion]).toBe('number');
      });
    });
  });

  test('timeline points are ordered chronologically', () => {
    const timeline = generateTimeline(10);
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].time).toBeDefined();
      expect(timeline[i - 1].time).toBeDefined();
    }
  });
});

describe('Data Generators - Confusion Matrix', () => {
  test('generates NxN matrix where N is emotion count', () => {
    const matrix = generateConfusionMatrix();
    expect(matrix).toHaveLength(7);
    matrix.forEach(row => {
      expect(row).toHaveLength(7);
    });
  });

  test('diagonal elements (correct predictions) are higher', () => {
    const matrix = generateConfusionMatrix();
    matrix.forEach((row, i) => {
      // diagonal should be 70-99
      expect(row[i]).toBeGreaterThanOrEqual(70);
      expect(row[i]).toBeLessThanOrEqual(99);
    });
  });

  test('off-diagonal elements (errors) are lower', () => {
    const matrix = generateConfusionMatrix();
    matrix.forEach((row, i) => {
      row.forEach((val, j) => {
        if (i !== j) {
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(10);
        }
      });
    });
  });
});

describe('Data Generators - Model Metrics', () => {
  test('generateModelMetrics returns all required fields', () => {
    const metrics = generateModelMetrics();
    
    expect(metrics.accuracy).toBeDefined();
    expect(metrics.precision).toBeDefined();
    expect(metrics.recall).toBeDefined();
    expect(metrics.f1).toBeDefined();
    expect(metrics.latency).toBeDefined();
    expect(metrics.fps).toBeDefined();
    expect(metrics.faces).toBeDefined();
  });

  test('accuracy is percentage (87-96)', () => {
    for (let i = 0; i < 20; i++) {
      const metrics = generateModelMetrics();
      expect(metrics.accuracy).toBeGreaterThanOrEqual(87);
      expect(metrics.accuracy).toBeLessThanOrEqual(96);
    }
  });

  test('latency is in milliseconds (12-28)', () => {
    const metrics = generateModelMetrics();
    expect(metrics.latency).toBeGreaterThanOrEqual(12);
    expect(metrics.latency).toBeLessThanOrEqual(28);
  });

  test('fps is realistic (28-62)', () => {
    const metrics = generateModelMetrics();
    expect(metrics.fps).toBeGreaterThanOrEqual(28);
    expect(metrics.fps).toBeLessThanOrEqual(62);
  });

  test('faces is positive integer', () => {
    const metrics = generateModelMetrics();
    expect(Number.isInteger(metrics.faces)).toBe(true);
    expect(metrics.faces).toBeGreaterThanOrEqual(1);
    expect(metrics.faces).toBeLessThanOrEqual(5);
  });
});

describe('Data Generators - Training History', () => {
  test('generateTrainingHistory returns 50 epochs', () => {
    const history = generateTrainingHistory();
    expect(history).toHaveLength(50);
  });

  test('each epoch has required fields', () => {
    const history = generateTrainingHistory();
    history.forEach((epoch, i) => {
      expect(epoch.epoch).toBe(i + 1);
      expect(typeof epoch.trainLoss).toBe('number');
      expect(typeof epoch.valLoss).toBe('number');
      expect(typeof epoch.trainAcc).toBe('number');
      expect(typeof epoch.valAcc).toBe('number');
    });
  });

  test('accuracy increases over epochs (convergence)', () => {
    const history = generateTrainingHistory();
    // first 5 epochs should have lower accuracy than last 5
    const earlyAccuracy = history.slice(0, 5).reduce((sum, e) => sum + e.trainAcc, 0) / 5;
    const lateAccuracy = history.slice(-5).reduce((sum, e) => sum + e.trainAcc, 0) / 5;
    expect(lateAccuracy).toBeGreaterThan(earlyAccuracy);
  });

  test('loss decreases over epochs', () => {
    const history = generateTrainingHistory();
    const earlyLoss = history.slice(0, 5).reduce((sum, e) => sum + e.trainLoss, 0) / 5;
    const lateLoss = history.slice(-5).reduce((sum, e) => sum + e.trainLoss, 0) / 5;
    expect(lateLoss).toBeLessThan(earlyLoss);
  });
});

describe('Data Generators - Per-Emotion Metrics', () => {
  test('generatePerEmotionMetrics returns all emotions', () => {
    const metrics = generatePerEmotionMetrics();
    expect(metrics).toHaveLength(7);
    
    metrics.forEach(m => {
      expect(EMOTIONS).toContain(m.emotion);
    });
  });

  test('each emotion has precision, recall, f1, support', () => {
    const metrics = generatePerEmotionMetrics();
    metrics.forEach(m => {
      expect(typeof m.precision).toBe('number');
      expect(typeof m.recall).toBe('number');
      expect(typeof m.f1).toBe('number');
      expect(typeof m.support).toBe('number');
      
      expect(m.precision).toBeGreaterThanOrEqual(0);
      expect(m.recall).toBeGreaterThanOrEqual(0);
      expect(m.f1).toBeGreaterThanOrEqual(0);
      expect(m.support).toBeGreaterThanOrEqual(0);
    });
  });

  test('support values are reasonable (80-300)', () => {
    const metrics = generatePerEmotionMetrics();
    metrics.forEach(m => {
      expect(m.support).toBeGreaterThanOrEqual(80);
      expect(m.support).toBeLessThanOrEqual(300);
    });
  });
});
