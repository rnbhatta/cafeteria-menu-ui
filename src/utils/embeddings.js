let _pipe = null

// Load from CDN so the browser gets a pre-built bundle with WASM paths
// already resolved — importing the npm package via Vite breaks in production
// because ort-wasm-simd.wasm is never copied to dist, causing Vercel's SPA
// catch-all to return index.html, which then fails JSON.parse.
const TRANSFORMERS_CDN =
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js'

async function getPipeline(onProgress) {
  if (_pipe) return _pipe
  const { pipeline, env } = await import(/* @vite-ignore */ TRANSFORMERS_CDN)
  env.allowLocalModels = false
  env.useBrowserCache = true
  _pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    progress_callback: ({ status, progress }) => {
      if (status === 'progress') onProgress?.(Math.round(progress ?? 0))
      if (status === 'ready') onProgress?.(100)
    },
  })
  return _pipe
}

async function embed(pipe, text) {
  const out = await pipe(text, { pooling: 'mean', normalize: true })
  return Array.from(out.data)
}

export function itemToText(item) {
  const tags = item.tags.length ? item.tags.join(', ') : 'no dietary tags'
  return `${item.name}: ${item.description}. Category: ${item.category}. Diet: ${tags}. Price: $${item.price}. Calories: ${item.calories}.`
}

export async function buildIndex(items, onProgress) {
  const pipe = await getPipeline(onProgress)
  const vectors = []
  for (const item of items) {
    vectors.push(await embed(pipe, itemToText(item)))
  }
  return vectors
}

export async function semanticSearch(query, index, items, topK = 5) {
  const pipe = await getPipeline()
  const qVec = await embed(pipe, query)
  return items
    .map((item, i) => ({
      item,
      score: qVec.reduce((sum, v, j) => sum + v * index[i][j], 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}
