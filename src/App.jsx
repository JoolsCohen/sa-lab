import { useCallback, useEffect, useState } from 'react'
import Quiz from './components/Quiz'
import Review from './components/Review'
import { questions } from './data/questions'
import { teamQuestions } from './data/teamQuestions'
import { supabase } from './lib/supabaseClient'
import './App.css'

const quizQuestionSets = {
  models: questions,
  team: teamQuestions,
}

const topics = [
  {
    id: 'models',
    icon: '↻',
    category: 'ЖИЗНЕННЫЙ ЦИКЛ',
    title: 'Модели разработки ПО',
    description:
      'Waterfall, V-модель, итерационная и инкрементальная модели, Agile, Scrum и Kanban.',
    color: 'violet',
    status: 'Тест доступен',
  },
  {
    id: 'team',
    icon: '◉',
    category: 'РОЛИ И ПРОЦЕССЫ',
    title: 'Команда разработки',
    description:
      'Роли специалистов, зоны ответственности и взаимодействие внутри команды.',
    color: 'blue',
    status: 'Тест доступен',
  },
  {
    id: 'requirements',
    icon: '≋',
    category: 'АНАЛИЗ',
    title: 'Требования',
    description:
      'Выявление потребностей, анализ, описание и проверка требований.',
    color: 'mint',
    status: 'В плане',
  },
  {
    id: 'bpmn',
    icon: '⌘',
    category: 'МОДЕЛИРОВАНИЕ',
    title: 'Бизнес-процессы',
    description:
      'Логика процессов, сценарии работы и моделирование в BPMN.',
    color: 'orange',
    status: 'В плане',
  },
]

const navigation = [
  { id: 'overview', icon: '⌂', label: 'Главная' },
  { id: 'topics', icon: '▦', label: 'Все темы' },
  { id: 'repeat', icon: '↻', label: 'На повторение' },
  { id: 'progress', icon: '▥', label: 'Мой прогресс' },
]

function App() {
  const [activePage, setActivePage] = useState('overview')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [attemptsLoading, setAttemptsLoading] = useState(true)
  const [attemptsError, setAttemptsError] = useState('')

  const refreshAttempts = useCallback(async () => {
    setAttemptsLoading(true)

    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(
          'id, topic_id, topic_title, score, total, percentage, answers, created_at',
        )
        .order('created_at', { ascending: false })

      if (error) throw error

      setAttempts(data ?? [])
      setAttemptsError('')
    } catch (error) {
      console.error('Не удалось загрузить результаты:', error)
      setAttemptsError(
        'Не удалось загрузить историю. Проверь подключение и права доступа к базе.',
      )
    } finally {
      setAttemptsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshAttempts()
  }, [refreshAttempts])

  function openPage(page) {
    setActivePage(page)
    setSelectedTopic(null)
  }

  function openTopics() {
    openPage('topics')
  }

  function renderTopicCards() {
    return (
      <div className="topic-grid">
        {topics.map((topic) => (
          <button
            className={`topic-card ${topic.color}`}
            key={topic.id}
            onClick={() => setSelectedTopic(topic)}
          >
            <div className="topic-card-top">
              <span className="topic-icon">{topic.icon}</span>
              <span className="topic-status">{topic.status}</span>
            </div>

            <span className="topic-category">{topic.category}</span>

            <h3>{topic.title}</h3>

            <p>{topic.description}</p>

            <span className="topic-link">
              Открыть тему <span>↗</span>
            </span>
          </button>
        ))}
      </div>
    )
  }

  function renderContent() {
    if (selectedTopic && quizQuestionSets[selectedTopic.id]) {
      return (
        <Quiz
          key={selectedTopic.id}
          topicId={selectedTopic.id}
          topicTitle={selectedTopic.title}
          questions={quizQuestionSets[selectedTopic.id]}
          onBack={() => setSelectedTopic(null)}
          onResultSaved={refreshAttempts}
        />
      )
    }

    if (selectedTopic) {
      return (
        <section className="detail-card">
          <button
            className="back-button"
            onClick={() => setSelectedTopic(null)}
          >
            ← Назад к темам
          </button>

          <div className={`detail-icon ${selectedTopic.color}`}>
            {selectedTopic.icon}
          </div>

          <span className="eyebrow">{selectedTopic.category}</span>
          <h2>{selectedTopic.title}</h2>

          <p className="detail-description">
            {selectedTopic.description}
          </p>

          <div className="coming-soon">
            <span>✳</span>

            <div>
              <strong>Раздел готовим к запуску</strong>
              <p>
                Здесь появятся вопросы, практические задания и
                объяснения ответов.
              </p>
            </div>
          </div>

          <button className="primary-button" onClick={openTopics}>
            Вернуться к темам <span>→</span>
          </button>
        </section>
      )
    }

    if (activePage === 'topics') {
      return (
        <>
          <div className="section-heading">
            <div>
              <span className="eyebrow">БИБЛИОТЕКА ЗНАНИЙ</span>
              <h2>Все темы</h2>
              <p>Выбирай тему, которую хочешь изучить.</p>
            </div>

            <span className="section-count">
              {String(topics.length).padStart(2, '0')} раздела
            </span>
          </div>

          {renderTopicCards()}
        </>
      )
    }

    if (activePage === 'repeat') {
      return (
        <Review
          attempts={attempts}
          loading={attemptsLoading}
          error={attemptsError}
          onBack={openTopics}
        />
      )
    }

    if (activePage === 'progress') {
      const totalQuestions = attempts.reduce(
        (total, attempt) => total + attempt.total,
        0,
      )

      const totalCorrect = attempts.reduce(
        (total, attempt) => total + attempt.score,
        0,
      )

      const averageScore =
        totalQuestions > 0
          ? Math.round((totalCorrect / totalQuestions) * 100)
          : 0

      return (
        <>
          <div className="section-heading">
            <div>
              <span className="eyebrow">СТАТИСТИКА</span>
              <h2>Мой прогресс</h2>
              <p>История сохранённых попыток прохождения тестов.</p>
            </div>
          </div>

          {attemptsError && (
            <p style={{ color: '#ff9ca5', fontSize: '12px' }}>
              {attemptsError}
            </p>
          )}

          <section className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">◎</span>

              <div>
                <span className="stat-label">Пройдено тестов</span>
                <strong>
                  {attemptsLoading ? '…' : attempts.length}
                </strong>
                <span className="stat-note">Все попытки</span>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">✓</span>

              <div>
                <span className="stat-label">Правильных ответов</span>
                <strong>{attemptsLoading ? '…' : totalCorrect}</strong>
                <span className="stat-note">
                  Из {attemptsLoading ? '…' : totalQuestions} вопросов
                </span>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">↗</span>

              <div>
                <span className="stat-label">Точность ответов</span>
                <strong>
                  {attemptsLoading ? '…' : `${averageScore}%`}
                </strong>
                <span className="stat-note">За все попытки</span>
              </div>
            </div>
          </section>

          <div className="review-section">
            <h2>История прохождений</h2>

            {attemptsLoading ? (
              <p>Загружаем историю…</p>
            ) : attemptsError ? (
              <p style={{ color: '#ff9ca5', fontSize: '12px' }}>
                Историю загрузить не удалось.
              </p>
            ) : attempts.length === 0 ? (
              <section className="empty-state">
                <span className="empty-icon">▥</span>
                <h2>Пока нет результатов</h2>

                <p>
                  Пройди первый тест, и здесь появятся твои результаты.
                </p>

                <button className="primary-button" onClick={openTopics}>
                  Выбрать тему <span>→</span>
                </button>
              </section>
            ) : (
              attempts.map((attempt) => (
                <div className="review-item" key={attempt.id}>
                  <div className="review-heading">
                    <span>●</span>
                    <strong>{attempt.topic_title}</strong>
                  </div>

                  <p>
                    Результат: {attempt.score} из {attempt.total} (
                    {attempt.percentage}%)
                  </p>

                  <p>
                    Дата:{' '}
                    {new Date(attempt.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )
    }

    return (
      <>
        <section className="hero">
          <div className="hero-content">
            <span className="hero-label">
              <span className="status-dot" />
              ТВОЯ УЧЕБНАЯ СРЕДА
            </span>

            <h2>
              Понимай.
              <br />
              Проверяй.
              <br />
              <span>Запоминай.</span>
            </h2>

            <p>
              Тренажёр системного аналитика.
              Теория, вопросы и практика в одном месте.
            </p>

            <button className="primary-button" onClick={openTopics}>
              Открыть темы <span>→</span>
            </button>
          </div>

          <div className="hero-decoration" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <div className="orbit-core">SA</div>
            <span className="orbit-label orbit-label-one">LOGIC</span>
            <span className="orbit-label orbit-label-two">SYSTEM</span>
          </div>

          <div className="hero-number">01 / LEARN</div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">▦</span>

            <div>
              <span className="stat-label">Учебные разделы</span>
              <strong>{String(topics.length).padStart(2, '0')}</strong>
              <span className="stat-note">В стартовом каталоге</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">◎</span>

            <div>
              <span className="stat-label">Пройдено тестов</span>
              <strong>
                {attemptsLoading ? '…' : String(attempts.length).padStart(2, '0')}
              </strong>
              <span className="stat-note">Облачная история</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">↗</span>

            <div>
              <span className="stat-label">Текущий этап</span>

              <strong className="stat-text">
                {attemptsLoading
                  ? 'Загрузка'
                  : attempts.length > 0
                    ? 'В процессе'
                    : 'Старт'}
              </strong>

              <span className="stat-note">
                {attemptsError
                  ? 'Не удалось загрузить прогресс'
                  : attempts.length > 0
                    ? 'Продолжай обучение'
                    : 'Собираем базу знаний'}
              </span>
            </div>
          </div>
        </section>

        {attemptsError && (
          <p style={{ color: '#ff9ca5', fontSize: '12px' }}>
            {attemptsError}
          </p>
        )}

        <section className="topics-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ТВОЙ МАРШРУТ</span>
              <h2>С чего начнём?</h2>
              <p>Выбери раздел и переходи к материалу.</p>
            </div>

            <button className="text-button" onClick={openTopics}>
              Все темы <span>→</span>
            </button>
          </div>

          {renderTopicCards()}
        </section>

        <footer className="footer">
          <span>SA LAB</span>
          <span>Маленькие шаги. Понятная логика.</span>
        </footer>
      </>
    )
  }

  const pageNames = {
    overview: 'Главная',
    topics: 'Все темы',
    repeat: 'На повторение',
    progress: 'Мой прогресс',
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>

          <div>
            <strong>SA LAB</strong>
            <span>LEARNING SPACE</span>
          </div>
        </div>

        <div className="sidebar-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>

        <nav className="navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                activePage === item.id && !selectedTopic ? 'active' : ''
              }`}
              onClick={() => openPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>

              {activePage === item.id && !selectedTopic && (
                <span className="nav-indicator" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-illustration">✳</div>
          <strong>Учись в своём темпе</strong>

          <p>
            Возвращайся к сложным темам и закрепляй знания на практике.
          </p>

          <span className="version-label">PERSONAL EDITION · 01</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>SA LAB</span>
            <span className="breadcrumb-divider">/</span>

            <strong>
              {selectedTopic
                ? selectedTopic.title
                : pageNames[activePage]}
            </strong>
          </div>

          <div className="topbar-right">
            <span className="local-badge">
              <span className="status-dot" />
              ЛИЧНЫЙ ТРЕНАЖЁР
            </span>

            <div className="profile-avatar">SA</div>
          </div>
        </header>

        <div className="page-content">
          {activePage === 'overview' && !selectedTopic && (
            <div className="welcome-row">
              <div>
                <span className="eyebrow">ПАНЕЛЬ ОБУЧЕНИЯ</span>
                <h1>Твоя база знаний</h1>
              </div>

              <span className="welcome-date">
                SYSTEM ANALYSIS / 001
              </span>
            </div>
          )}

          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default App