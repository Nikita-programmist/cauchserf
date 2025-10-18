const pageStyles = {
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  backgroundColor: "#f6f7f8",
  color: "#1f2933",
  minHeight: "100vh",
  margin: 0,
};

const containerStyles = {
  maxWidth: "960px",
  margin: "0 auto",
  padding: "64px 24px",
  display: "flex",
  flexDirection: "column",
  gap: "56px",
};

const heroStyles = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  padding: "48px",
  boxShadow: "0 10px 40px rgba(31, 41, 51, 0.12)",
};

const buttonRowStyles = {
  display: "flex",
  flexWrap: "wrap",
  gap: "16px",
};

const buttonStyles = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px 28px",
  borderRadius: "999px",
  fontWeight: 600,
  textDecoration: "none",
  fontSize: "16px",
};

const primaryButtonStyles = {
  ...buttonStyles,
  backgroundColor: "#2563eb",
  color: "#ffffff",
};

const secondaryButtonStyles = {
  ...buttonStyles,
  backgroundColor: "#e5e7eb",
  color: "#1f2933",
};

const sectionGridStyles = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "32px",
};

const cardStyles = {
  backgroundColor: "#ffffff",
  borderRadius: "20px",
  padding: "32px",
  boxShadow: "0 8px 30px rgba(31, 41, 51, 0.1)",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

export default function Home() {
  return (
    <div style={pageStyles}>
      <main style={containerStyles}>
        <section style={heroStyles}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "12px", color: "#64748b" }}>
              Добро пожаловать в Домик
            </p>
            <h1 style={{ fontSize: "48px", lineHeight: 1.1, margin: 0 }}>
              Находим хозяев и уютные комнаты по всему миру
            </h1>
            <p style={{ fontSize: "18px", lineHeight: 1.6, margin: 0 }}>
              Домик помогает путешественникам знакомиться с проверенными хозяевами, договариваться о проживании и чувствовать себя в безопасности в любой поездке.
            </p>
          </div>
          <div style={buttonRowStyles}>
            <a href="/search" style={primaryButtonStyles}>
              Начать поиск
            </a>
            <a href="/signup" style={secondaryButtonStyles}>
              Зарегистрироваться
            </a>
          </div>
        </section>

        <section style={sectionGridStyles}>
          <article style={cardStyles}>
            <h2 style={{ fontSize: "24px", margin: 0 }}>Подбор хозяев</h2>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Найдите хозяина, который разделяет ваши интересы и готов поделиться своим домом. Домик подскажет, кто рядом и готов принять гостей.
            </p>
          </article>
          <article style={cardStyles}>
            <h2 style={{ fontSize: "24px", margin: 0 }}>Безопасные поездки</h2>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Проверенные профили, отзывы и подтверждённые контакты помогают оставаться спокойным во время путешествий и заранее знать, чего ожидать.
            </p>
          </article>
          <article style={cardStyles}>
            <h2 style={{ fontSize: "24px", margin: 0 }}>Простая регистрация</h2>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Заполните профиль за несколько минут, расскажите о себе и начните общаться с хозяевами. Чем подробнее профиль, тем быстрее найдёте идеальное место.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
