(function (root) {
  'use strict';
  const clamp = value => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const round = value => Math.round(clamp(value));

  function scoreCircle(points) {
    if (!Array.isArray(points) || points.length < 15) return { invalid: true, score: 0 };
    const cx = points.reduce((sum, point) => sum + point[0], 0) / points.length;
    const cy = points.reduce((sum, point) => sum + point[1], 0) / points.length;
    const radii = points.map(point => Math.hypot(point[0] - cx, point[1] - cy));
    const meanRadius = radii.reduce((sum, radius) => sum + radius, 0) / radii.length;
    if (!Number.isFinite(meanRadius) || meanRadius < 1) return { invalid: true, score: 0 };
    const deviation = Math.sqrt(radii.reduce((sum, radius) => sum + (radius - meanRadius) ** 2, 0) / radii.length) / meanRadius;
    const first = points[0], last = points[points.length - 1];
    const closure = Math.hypot(first[0] - last[0], first[1] - last[1]) / meanRadius;
    const length = points.slice(1).reduce((sum, point, i) => sum + Math.hypot(point[0] - points[i][0], point[1] - points[i][1]), 0);
    const coverage = length / (2 * Math.PI * meanRadius);
    return {
      invalid: false,
      deviation: round((1 - deviation) * 100),
      closure: round((1 - closure) * 100),
      coverage: round(Math.min(1, coverage) * 100),
      score: round(100 - deviation * 140 - Math.max(0, closure - 0.25) * 55 - Math.max(0, 0.9 - coverage) * 40)
    };
  }

  function scoreEstimate(actual, guess) {
    actual = Number(actual); guess = Number(guess);
    if (!Number.isFinite(actual) || actual <= 0 || !Number.isFinite(guess)) return 0;
    return round(100 - Math.abs(guess - actual) / actual * 100);
  }

  function scoreAngle(actual, guess) {
    actual = Number(actual); guess = Number(guess);
    if (!Number.isFinite(actual) || !Number.isFinite(guess)) return 0;
    return round(100 - Math.abs(guess - actual) / 180 * 100);
  }

  function scoreFraction(actual, guess) {
    actual = Number(actual); guess = Number(guess);
    if (!Number.isFinite(actual) || !Number.isFinite(guess)) return 0;
    return round(100 - Math.abs(guess - actual));
  }

  function scoreKrillion(correct, total) {
    correct = Number(correct); total = Number(total);
    if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) return 0;
    return round(correct / total * 100);
  }

  function scoreTempo(expectedIntervals, taps) {
    if (!Array.isArray(expectedIntervals) || !Array.isArray(taps) || taps.length < 2) return 0;
    const count = Math.min(expectedIntervals.length, taps.length - 1);
    if (!count) return 0;
    let error = 0;
    for (let i = 0; i < count; i++) {
      const expected = Number(expectedIntervals[i]);
      const actual = Number(taps[i + 1]) - Number(taps[i]);
      if (!Number.isFinite(expected) || !Number.isFinite(actual)) return 0;
      error += Math.abs(actual - expected);
    }
    return round(100 - (error / count) / 8);
  }

  function scoreTraceMatch(reference, drawing, tolerance = 2) {
    if (!reference || !drawing || reference.length !== drawing.length || reference.length === 0) return 0;
    const width = Math.max(1, Math.floor(Math.sqrt(reference.length)));
    const height = Math.ceil(reference.length / width);
    tolerance = Math.max(0, Math.floor(tolerance));
    let referenceCount = 0, drawingCount = 0, matchedReference = 0, matchedDrawing = 0;
    const within = (mask, x, y) => {
      for (let dy = -tolerance; dy <= tolerance; dy++) {
        for (let dx = -tolerance; dx <= tolerance; dx++) {
          if (dx * dx + dy * dy > tolerance * tolerance) continue;
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && mask[ny * width + nx]) return true;
        }
      }
      return false;
    };
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (index >= reference.length) continue;
      if (reference[index]) { referenceCount++; if (within(drawing, x, y)) matchedReference++; }
      if (drawing[index]) { drawingCount++; if (within(reference, x, y)) matchedDrawing++; }
    }
    if (!referenceCount || !drawingCount) return 0;
    const recall = matchedReference / referenceCount;
    const precision = matchedDrawing / drawingCount;
    return round(200 * recall * precision / (recall + precision || 1));
  }

  function gamerPercentage(bestScores, gameIds) {
    if (!bestScores || !Array.isArray(gameIds) || gameIds.length !== 6) return null;
    const scores = gameIds.map(id => Number(bestScores[id]));
    if (scores.some(score => !Number.isFinite(score) || score < 0 || score > 100)) return null;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / 6);
  }

  function scoreContexto(guessCount) {
    guessCount = Number(guessCount);
    if (!Number.isFinite(guessCount) || guessCount < 1) return 0;
    return round(100 - (guessCount - 1) * 10);
  }

  const api = Object.freeze({
    scoreCircle, scoreEstimate, scoreAngle, scoreFraction, scoreKrillion,
    scoreTempo, scoreTraceMatch, gamerPercentage, scoreContexto
  });
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfterglowCore = api;
})(typeof globalThis === 'object' ? globalThis : this);
