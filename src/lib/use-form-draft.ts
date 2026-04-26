'use client'

import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'

type Setter<T> = T | ((prev: T) => T)

const PREFIX = 'bodyrecode-draft:'

export function clearDraftsByPrefix(prefix: string) {
  try {
    const fullPrefix = `${PREFIX}${prefix}`
    const toDelete: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(fullPrefix)) toDelete.push(key)
    }
    toDelete.forEach(k => localStorage.removeItem(k))
  } catch {}
}

export function useDraftState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const storageKey = `${PREFIX}${key}`
  const [state, setState] = useState<T>(initial)
  const hydratedRef = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw !== null) setState(JSON.parse(raw))
    } catch {}
    hydratedRef.current = true
  }, [storageKey])

  useEffect(() => {
    if (!hydratedRef.current) return
    try { localStorage.setItem(storageKey, JSON.stringify(state)) } catch {}
  }, [storageKey, state])

  return [state, setState]
}

export function useFormDraft<T>(key: string, initial: T): [T, (next: Setter<T>) => void, () => void, boolean] {
  const storageKey = `bodyrecode-draft:${key}`
  const [state, setStateInternal] = useState<T>(initial)
  const [hydrated, setHydrated] = useState(false)
  const lastSavedRef = useRef<string>('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        setStateInternal(parsed)
        lastSavedRef.current = raw
      }
    } catch {}
    setHydrated(true)
  }, [storageKey])

  function setState(next: Setter<T>) {
    setStateInternal(prev => {
      const value = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      try {
        const serialised = JSON.stringify(value)
        if (serialised !== lastSavedRef.current) {
          localStorage.setItem(storageKey, serialised)
          lastSavedRef.current = serialised
        }
      } catch {}
      return value
    })
  }

  function clearDraft() {
    try { localStorage.removeItem(storageKey) } catch {}
    lastSavedRef.current = ''
  }

  return [state, setState, clearDraft, hydrated]
}
