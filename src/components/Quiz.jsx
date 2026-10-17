import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

async function saveAttempt(answers, questions, topicId, topicTitle) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError

  if (!user) {
    throw new Error('Для сохранения результата нужно войти в аккаунт.')
  }

  const score = questions.reduce((total, question, index) => {
    return total + (answers[index] === question.correctAnswer ? 1 : 0)
  }, 0)

  const attempt = {
    user_id: user.id,
    topic_id: topicId,
    topic_title: topicTitle,
    score,
    total: questions.length,
    percentage: Math.round((score / questions.length) * 100),

    answers: questions.map((question, index) => ({
      questionId: question.id,
      question: question.question,
      selectedAnswer: answers[index] ?? null,
      selectedText:
        answers[index] === undefined
          ? null
          : question.options[answers[index]],
      correctAnswer: question.correctAnswer,
      correctText: question.options[question.correctAnswer],
      isCorrect: answers[index] === question.correctAnswer,
      explanation: question.explanation,
    })),
  }

  const { error } = await supabase
    .from('quiz_attempts')
    .insert(attempt)

  if (error) throw error

  return true
}

function Quiz({
  onBack,
  onResultSaved,
  questions,
  topicId,
  topicTitle,
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [checked, setChecked] = useState(false)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)
  const [resultSaved, setResultSaved] = useState(null)
  const [saving, setSaving] = useState(false)

  const currentQuestion = questions[currentIndex]

  const score = questions.reduce((total, question, index) => {
    return total + (answers[index] === question.correctAnswer ? 1 : 0)
  }, 0)

  async function checkAnswer() {
    if (selectedOption === null || checked) return

    const updatedAnswers = [...answers]
    updatedAnswers[currentIndex] = selectedOption

    setAnswers(updatedAnswers)
    setChecked(true)
  }

  async function nextQuestion() {
    if (!checked || saving) return

    if (currentIndex === questions.length - 1) {
      setSaving(true)

      try {
        await saveAttempt(
          answers,
          questions,
          topicId,
          topicTitle,
        )

        setResultSaved(true)

        if (onResultSaved) {
          await onResultSaved()
        }
      } catch (error) {
        console.error('Не удалось сохранить результат:', error)
        setResultSaved(false)
      } finally {
        setSaving(false)
        setFinished(true)
      }

      return
    }

    setCurrentIndex((previous) => previous + 1)
    setSelectedOption(null)
    setChecked(false)
  }

  function restartQuiz() {
    setCurrentIndex(0)
    setSelectedOption(null)
    setChecked(false)
    setAnswers([])
    setFinished(false)
    setResultSaved(null)
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100)

    return (
      <section className="quiz-page">
        <button className="back-button" onClick={onBack}>
          ← К темам
        </button>

        <div className="quiz-result">
          <span className="eyebrow">ТЕСТ ЗАВЕРШЁН</span>

          <div className="result-circle">
            <strong>{percentage}%</strong>
          </div>

          <h2>
            {percentage >= 80
              ? 'Отличная работа!'
              : percentage >= 60
                ? 'Хорошая основа!'
                : 'Время повторить материал'}
          </h2>

          <p>
            Правильных ответов: {score} из {questions.length}
          </p>

          <p
            style={{
              color: resultSaved ? '#83e0b9' : '#ff9ca5',
              fontSize: '12px',
              lineHeight: 1.7,
              textAlign: 'center',
            }}
          >
            {resultSaved === true
              ? '✓ Результат сохранён в облаке'
              : 'Не удалось сохранить результат. Попробуй ещё раз после проверки соединения.'}
          </p>

          <div className="result-actions">
            <button className="primary-button" onClick={restartQuiz}>
              Пройти ещё раз ↻
            </button>

            <button className="secondary-button" onClick={onBack}>
              К другим темам
            </button>
          </div>
        </div>

        <div className="review-section">
          <span className="eyebrow">РАЗБОР РЕЗУЛЬТАТОВ</span>
          <h2>Разберём ошибки</h2>

          {questions.map((question, index) => {
            const isCorrect =
              answers[index] === question.correctAnswer

            return (
              <div
                key={question.id}
                className={`review-item ${
                  isCorrect ? 'correct' : 'incorrect'
                }`}
              >
                <div className="review-heading">
                  <span>{isCorrect ? '✓' : '×'}</span>

                  <strong>
                    {index + 1}. {question.question}
                  </strong>
                </div>

                <p>
                  Твой ответ:{' '}
                  {answers[index] === undefined
                    ? 'Нет ответа'
                    : question.options[answers[index]]}
                </p>

                {!isCorrect && (
                  <p>
                    Правильный ответ:{' '}
                    {question.options[question.correctAnswer]}
                  </p>
                )}

                <p className="review-explanation">
                  {question.explanation}
                </p>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <section className="quiz-page">
      <button className="back-button" onClick={onBack}>
        ← К темам
      </button>

      <div className="quiz-header">
        <span className="eyebrow">{topicTitle.toUpperCase()}</span>
        <h2>Проверка знаний</h2>
        <p>Выбери один правильный ответ.</p>
      </div>

      <div className="quiz-progress-info">
        <span>
          Вопрос {currentIndex + 1} из {questions.length}
        </span>

        <span>{Math.round(progress)}%</span>
      </div>

      <div className="quiz-progress-track">
        <div
          className="quiz-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="quiz-card">
        <span className="eyebrow">
          ВОПРОС {String(currentIndex + 1).padStart(2, '0')}
        </span>

        <h3 className="quiz-question">
          {currentQuestion.question}
        </h3>

        <div className="quiz-options">
          {currentQuestion.options.map((option, index) => {
            const isCorrect =
              checked && index === currentQuestion.correctAnswer

            const isIncorrect =
              checked &&
              index === selectedOption &&
              selectedOption !== currentQuestion.correctAnswer

            const classes = [
              'quiz-option',
              selectedOption === index ? 'selected' : '',
              isCorrect ? 'correct' : '',
              isIncorrect ? 'incorrect' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                type="button"
                key={option}
                className={classes}
                disabled={checked}
                onClick={() => setSelectedOption(index)}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>

                <span className="option-text">{option}</span>

                <span className="option-mark">
                  {isCorrect ? '✓' : isIncorrect ? '×' : ''}
                </span>
              </button>
            )
          })}
        </div>

        {checked && (
          <div
            className={`quiz-feedback ${
              selectedOption === currentQuestion.correctAnswer
                ? 'feedback-correct'
                : 'feedback-incorrect'
            }`}
          >
            <strong>
              {selectedOption === currentQuestion.correctAnswer
                ? '✓ Верно!'
                : '× Не совсем'}
            </strong>

            <p>{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="quiz-footer">
          <span>
            {saving
              ? 'Сохраняем результат...'
              : checked
                ? 'Ответ проверен'
                : 'Выбери вариант ответа'}
          </span>

          {!checked ? (
            <button
              className="primary-button"
              disabled={selectedOption === null}
              onClick={checkAnswer}
            >
              Проверить →
            </button>
          ) : (
            <button
              className="primary-button"
              disabled={saving}
              onClick={nextQuestion}
            >
              {saving
                ? 'Сохраняем...'
                : currentIndex === questions.length - 1
                  ? 'Результаты →'
                  : 'Далее →'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default Quiz