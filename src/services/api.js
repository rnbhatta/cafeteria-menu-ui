// In dev: empty string → Vite proxy handles /api → localhost:8000
// In prod: VITE_API_URL = https://cafeteria-menu-api.fly.dev
const BASE = (import.meta.env.VITE_API_URL || '') + '/api'

async function request(path, options = {}) {
  const res = await fetch(BASE + path, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }
  return res.json()
}

export function fetchMenu() {
  return request('/menu/')
}

export function placeOrder(orderData) {
  return request('/orders/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  })
}

export function fetchOrders() {
  return request('/orders/')
}

export function agentChat(messages) {
  return request('/agent/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
}

export function fetchAnalyticsOverview() {
  return request('/analytics/overview')
}

export function fetchOrderAnalytics() {
  return request('/analytics/orders')
}

export function fetchInferenceAnalytics() {
  return request('/analytics/inference')
}
