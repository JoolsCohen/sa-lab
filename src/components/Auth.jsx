import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

function Auth() {
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  function switchMode(nextMode) {
    setMode(nextMode)
    setMessage('')
    setErrorMessage('')
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setMessage('')
    setErrorMessage('')

    const normalizedEmail = email.trim()

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMessage('Введи своё имя.')
        return
      }

      if (password.length < 8) {
        setErrorMessage(
          'Пароль должен содержать не менее 8 символов.',
        )
        return
      }

      if (password !== confirmPassword) {
        setErrorMessage('Пароли не совпадают.')
        return
      }
    }

    if (!normalizedEmail || !password) {
      setErrorMessage('Заполни все обязательные поля.')
      return
    }

    setLoading(true)

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName.trim(),
            },
          },
        })

        if (error) throw error

        if (data.session) {
          setMessage('Аккаунт создан. Выполняется вход...')
        } else {
          setMessage(
            'Аккаунт создан. Проверь почту и перейди по ссылке подтверждения.',
          )
          setPassword('')
          setConfirmPassword('')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        })

        if (error) throw error
      }
    } catch (error) {
      console.error('Ошибка авторизации:', error)

      setErrorMessage(
        getFriendlyError(error.message),
      )
    } finally {
      setLoading(false)
    }
  }

  function getFriendlyError(error) {
    const text = error.toLowerCase()

    if (
      text.includes('email address not authorized') ||
      text.includes('email rate limit exceeded')
    ) {
      return (
        'Supabase не отправил письмо. Проверь настройки почты ' +
        'и лимиты отправки. Для коллег понадобится настроить SMTP.'
      )
    }

    if (
      text.includes('invalid login credentials')
    ) {
      return 'Неверный email или пароль.'
    }

    if (text.includes('email not confirmed')) {
      return 'Сначала подтверди email по ссылке из письма.'
    }

    if (text.includes('user already registered')) {
      return 'Этот email уже зарегистрирован. Попробуй войти.'
    }

    if (text.includes('password should be at least')) {
      return 'Пароль слишком короткий.'
    }

    if (
      text.includes('failed to fetch') ||
      text.includes('network')
    ) {
      return 'Не удалось подключиться к серверу. Проверь интернет.'
    }

    return error
  }

  return (
    <main className="auth-screen">
      <div className="auth-decoration auth-decoration-one" />
      <div className="auth-decoration auth-decoration-two" />

      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">S</div>

          <div>
            <strong>SA LAB</strong>
            <span>LEARNING SPACE</span>
          </div>
        </div>

        <div className="auth-heading">
          <span className="eyebrow">ТВОЯ УЧЕБНАЯ СРЕДА</span>

          <h1>
            {mode === 'signup'
              ? 'Создать аккаунт'
              : 'С возвращением'}
          </h1>

          <p>
            {mode === 'signup'
              ? 'Зарегистрируйся, чтобы сохранять результаты и отслеживать прогресс.'
              : 'Войди, чтобы продолжить обучение и открыть свои результаты.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => switchMode('login')}
          >
            Вход
          </button>

          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => switchMode('signup')}
          >
            Регистрация
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label className="auth-field">
              <span>Имя</span>

              <input
                type="text"
                autoComplete="name"
                placeholder="Как к тебе обращаться"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email</span>

            <input
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            <span>Пароль</span>

            <input
              type="password"
              autoComplete={
                mode === 'signup'
                  ? 'new-password'
                  : 'current-password'
              }
              placeholder={
                mode === 'signup'
                  ? 'Не менее 8 символов'
                  : 'Введи пароль'
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={mode === 'signup' ? 8 : undefined}
              required
            />
          </label>

          {mode === 'signup' && (
            <label className="auth-field">
              <span>Повтори пароль</span>

              <input
                type="password"
                autoComplete="new-password"
                placeholder="Повтори пароль"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                required
              />
            </label>
          )}

          {errorMessage && (
            <div className="auth-message auth-error" role="alert">
              {errorMessage}
            </div>
          )}

          {message && (
            <div
              className="auth-message auth-success"
              role="status"
            >
              {message}
            </div>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Подожди...'
              : mode === 'signup'
                ? 'Создать аккаунт →'
                : 'Войти →'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'signup'
            ? 'Уже есть аккаунт?'
            : 'Впервые здесь?'}

          <button
            type="button"
            onClick={() =>
              switchMode(
                mode === 'signup' ? 'login' : 'signup',
              )
            }
          >
            {mode === 'signup' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </p>

        <div className="auth-footer">
          Личный учебный кабинет · SA LAB
        </div>
      </section>
    </main>
  )
}

export default Auth