import { useEffect, useState } from 'react'
import App from './App'
import Auth from './components/Auth'
import { supabase } from './lib/supabaseClient'
import './components/Auth.css'

function AuthGate() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        console.error('Не удалось проверить сессию:', error)
      }

      setSession(data?.session ?? null)
      setLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Не удалось выйти из аккаунта:', error)
    }
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
        <p>Проверяем сессию...</p>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <>
      <div className="account-strip">
        <span>
          Вход выполнен: <strong>{session.user.email}</strong>
        </span>

        <button type="button" onClick={handleSignOut}>
          Выйти
        </button>
      </div>

      <App />
    </>
  )
}

export default AuthGate