// Reduces high-dimensional vectors to 2D via PCA (power iteration).
// Returns the projected points AND a project() fn so new vectors (e.g. a
// query embedding) can be placed in the same 2D coordinate space.
export function pca2d(vectors) {
  const n = vectors.length
  const d = vectors[0].length

  // 1. Centre: subtract per-dimension mean
  const mean = new Array(d).fill(0)
  for (const v of vectors) for (let j = 0; j < d; j++) mean[j] += v[j] / n
  const X = vectors.map(v => v.map((x, j) => x - mean[j]))

  // 2. Power iteration to find one eigenvector of X^T X
  function topEigenvec(matrix, iters = 120) {
    // Seeded "random" init so the result is deterministic across calls
    let q = Array.from({ length: d }, (_, i) => Math.sin(i) * 0.5)
    for (let it = 0; it < iters; it++) {
      // z = X^T (X q)
      const Xq = matrix.map(row => row.reduce((s, v, j) => s + v * q[j], 0))
      const z  = new Array(d).fill(0)
      for (let i = 0; i < n; i++)
        for (let j = 0; j < d; j++) z[j] += Xq[i] * matrix[i][j]
      const norm = Math.sqrt(z.reduce((s, v) => s + v * v, 0))
      q = z.map(v => v / norm)
    }
    return q
  }

  // 3. First principal component
  const pc1 = topEigenvec(X)

  // 4. Deflate X along pc1, then find second component
  const scores1 = X.map(row => row.reduce((s, v, j) => s + v * pc1[j], 0))
  const X2 = X.map((row, i) => row.map((v, j) => v - scores1[i] * pc1[j]))
  const pc2 = topEigenvec(X2)

  // 5. Project any vector into this 2D basis
  function project(vec) {
    const c = vec.map((x, j) => x - mean[j])
    return [
      c.reduce((s, v, j) => s + v * pc1[j], 0),
      c.reduce((s, v, j) => s + v * pc2[j], 0),
    ]
  }

  return { points: vectors.map(project), project }
}
