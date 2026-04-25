import { useState, useMemo, useEffect } from 'react'
import { fetchMenu } from '../services/api'

export function useMenuFilter() {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [dietFilter, setDietFilter] = useState('')

  useEffect(() => {
    fetchMenu()
      .then(data => { setMenuItems(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    return menuItems.filter(item => {
      const matchCategory = activeCategory === 'all' || item.category === activeCategory
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
      const matchDiet = !dietFilter || item.tags.includes(dietFilter)
      return matchCategory && matchSearch && matchDiet
    })
  }, [menuItems, activeCategory, search, dietFilter])

  return {
    filtered,
    loading,
    error,
    activeCategory,
    setActiveCategory,
    search,
    setSearch,
    dietFilter,
    setDietFilter,
  }
}
