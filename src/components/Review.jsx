import { useState } from 'react'
import { questions } from '../data/questions'
import { teamQuestions } from '../data/teamQuestions'

const questionsByTopic = {
  models: questions,
  team: teamQuestions,
}

function getQuestionsToReview(attempts) {
  const latestByQuestion = new Map()

  // Предполагаем, что попытки идут от новых к старым.
  for (const attempt of attempts) {
    const topicQuestions = questionsByTopic[attempt.topic_id]

    if (!topicQuestions || !Array.isArray(attempt.answers)) {
      continue
    }

    for (const answer of attempt.answers) {
      const key = `${attempt.topic_id}:${answer.questionId}`

      if (latestByQuestion.has(key)) continue

      const question = topicQuestions.find(
        (item) => item.id === answer.questionId,
      )

      if (!question) continue

      latestByQuestion.set(key, {
        answer,
        question,
        date: attempt.created_at,
        topicId: attempt.topic_id,
        topicTitle: attempt.topic_title,
      })
    }
  }

  return Array.from(latestByQuestion.values()).filter(
    (item) => item.answer.isCorrect === false,
  )
}

function Review({ attempts, loading, error, onBack }) {
  const [shownAnswers, setShownAnswers] = useState([])

  const reviewItems = getQuestionsToReview(attempts)

  function toggleAnswer(key) {
    setShownAnswers((previous) =>
      previous.includes(key)
        ? previous.filter((item) => item !== key)
        : [...previous, key],
    )
  }

  return (
    <section className="quiz-page">
      <button className="back-button" onClick={onBack}>
        ← К темам
      </button>

      <div className="quiz-header">
        <span className="eyebrow">ПОВТОРЕНИЕ МАТЕРИАЛА</span>
        <h2>Разберём ошибки</h2>
        <p>
          Здесь находятся вопросы, на которые ты неправильно ответила
          в последней попытке по каждой теме.
        </p>
      </div>

      {loading ? (
        <section className="empty-state">
          <h2>Загружаем результаты...</h2>
        </section>
      ) : error ? (
        <section className="empty-state">
          <h2>Не удалось загрузить результаты</h2>
          <p>{error}</p>
        </section>
      ) : reviewItems.length === 0 ? (
        <section className="empty-state">
          <span className="empty-icon">✓</span>

          <h2>Ошибок для повторения нет</h2>

          <p>
            Пройди тест и проверь ответы. Вопросы с ошибками появятся
            здесь автоматически.
          </p>

          <button className="primary-button" onClick={onBack}>
            Перейти к темам <span>→</span>
          </button>
        </section>
      ) : (
        <>
          <div className="quiz-progress-info">
            <span>Вопросов для повторения</span>
            <span>{reviewItems.length}</span>
          </div>

          <div>
            {reviewItems.map((item, index) => {
              const { answer, question, date, topicTitle, topicId } = item
              const key = `${topicId}:${question.id}`
              const isShown = shownAnswers.includes(key)

              const previousAnswer =
                answer.selectedText ??
                (answer.selectedAnswer !== null &&
                answer.selectedAnswer !== undefined
                  ? question.options[answer.selectedAnswer]
                  : 'Нет ответа')

              return (
                <article
                  className="review-item incorrect"
                  key={key}
                >
                  <div className="review-heading">
                    <span>{index + 1}.</span>
                    <strong>{question.question}</strong>
                  </div>

                  <p>
                    <strong>Тема:</strong> {topicTitle}
                  </p>

                  <p>
                    <strong>Твой прошлый ответ:</strong> {previousAnswer}
                  </p>

                  <p>
                    <strong>Последняя попытка:</strong>{' '}
                    {new Date(date).toLocaleString()}
                  </p>

                  {!isShown ? (
                    <button
                      className="secondary-button"
                      onClick={() => toggleAnswer(key)}
                    >
                      Показать правильный ответ ↓
                    </button>
                  ) : (
                    <div>
                      <p>
                        <strong>Правильный ответ:</strong>{' '}
                        {question.options[question.correctAnswer]}
                      </p>

                      <p className="review-explanation">
                        <strong>Почему:</strong> {question.explanation}
                      </p>

                      <button
                        className="secondary-button"
                        onClick={() => toggleAnswer(key)}
                      >
                        Скрыть ответ ↑
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

export default Review