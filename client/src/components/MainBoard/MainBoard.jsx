export function MainBoard({ title, children }) {
  return (
    <>
      <header className="app-header">
        <h1 className="title">{title}</h1>
      </header>
      <section className="main-board">{children}</section>
    </>
  )
}
