import { useEffect, useState } from 'react'

export function Column({ title, onTitleChange, children }) {
  const [value, setValue] = useState(title)

  useEffect(() => {
    setValue(title)
  }, [title])

  function commit() {
    const t = value.trim()
    if (t && t !== title) onTitleChange(t)
    else setValue(title)
  }

  return (
    <article className="board-column">
      <input
        className="column-title column-title-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
        aria-label="Column title"
        spellCheck={false}
      />
      {children}
    </article>
  )
}
