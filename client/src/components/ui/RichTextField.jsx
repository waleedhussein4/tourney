import { useId } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { toPlainText } from '/src/lib/richText.js'
import './RichTextField.css'

/**
 * A rich text editor for fields the server stores and renders as HTML.
 *
 * Rules are stored as HTML, so a plain textarea would show the host their own
 * markup — `<p>Best of three.</p>` — and make them edit around it. The toolbar
 * is deliberately small: the tournament page's sanitiser drops anything not on
 * its allowlist, so offering more would only let a host lose work.
 *
 * The character limit counts the text a reader sees, not the markup, which is
 * how the server measures it too.
 *
 * @param {object} props
 * @param {string} props.value HTML.
 * @param {(html: string) => void} props.onChange
 * @param {number} props.limit Plain-text character limit.
 */
export function RichTextField({ label, value, onChange, limit, hint, error }) {
  const id = useId()
  const errorId = `${id}-error`
  const countId = `${id}-count`

  const used = toPlainText(value).length
  const over = used > limit

  return (
    <div className={`field ${error || over ? 'field--invalid' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>

      <div className="richtext">
        <ReactQuill
          id={id}
          theme="snow"
          value={value ?? ''}
          onChange={onChange}
          modules={{
            toolbar: [
              ['bold', 'italic'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['link', 'clean'],
            ],
          }}
          formats={['bold', 'italic', 'list', 'link']}
        />
      </div>

      <p className={`field__hint ${over ? 'field__error' : ''}`} id={countId}>
        {hint ? `${hint} ` : ''}
        {used} of {limit} characters{over ? ' — too long' : ''}
      </p>

      {error && (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
