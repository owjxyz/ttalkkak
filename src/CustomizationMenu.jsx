import { useEffect, useRef, useState } from 'react'
import { colorFields, fontURL, loadWebFont, themeVariables } from './customization.js'

/** @param {{ settings: object, onSave: Function, onDelete: Function, onClose: Function, pixel: boolean, fontFamily: string }} props */
/* eslint-disable react/prop-types -- Small internal component contract documented above. */
export default function CustomizationMenu({ settings, onSave, onDelete, onClose, pixel, fontFamily }) {
  const [page, setPage] = useState('menu')
  const [editing, setEditing] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [deleteId, setDeleteId] = useState('')
  const [name, setName] = useState('')
  const [url, setURL] = useState('')
  const [colors, setColors] = useState({})
  const [loadedFont, setLoadedFont] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const dialogRef = useRef(null)
  const previewFontRef = useRef(null)
  const attemptRef = useRef(null)
  const previousDeleteRef = useRef('')

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => {
      attemptRef.current = null
      if (previewFontRef.current) document.fonts.delete(previewFontRef.current)
      dialog.close()
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    const target = page === 'menu' ? '#resume-practice' : editing ? 'input' : editingId ? `[data-edit-preset="${editingId}"]` : `#new-custom-${page}`
    ;(dialog.querySelector(target) || dialog.querySelector(`#new-custom-${page}`))?.focus()
    dialog.scrollTop = 0
  }, [page, editing, editingId])

  useEffect(() => {
    const id = deleteId || previousDeleteRef.current
    if (id) dialogRef.current.querySelector(`[data-${deleteId ? 'confirm-delete' : 'delete-preset'}="${id}"]`)?.focus()
    previousDeleteRef.current = deleteId
  }, [deleteId])

  function clearPreview() {
    attemptRef.current = Symbol()
    if (previewFontRef.current) document.fonts.delete(previewFontRef.current)
    previewFontRef.current = null
    setLoadedFont(null)
    setLoading(false)
    setError('')
  }

  function back() {
    clearPreview()
    setDeleteId('')
    if (editing) setEditing(false)
    else setPage('menu')
  }

  function openList(nextPage) {
    clearPreview()
    setDeleteId('')
    setEditingId('')
    setEditing(false)
    setPage(nextPage)
  }

  function openEditor(nextPage, saved) {
    clearPreview()
    setEditingId(saved?.id || '')
    setDeleteId('')
    if (nextPage === 'font') {
      setName(saved?.name || '')
      setURL(saved?.url || '')
    } else {
      const body = getComputedStyle(document.body)
      const panel = getComputedStyle(document.getElementById('main-box'))
      const input = getComputedStyle(document.getElementById('textInput'))
      const rgbToHex = value => `#${value.match(/\d+/g).slice(0, 3).map(n => Number(n).toString(16).padStart(2, '0')).join('')}`
      setName(saved?.name || '')
      setColors(saved ? Object.fromEntries(colorFields.map(([key]) => [key, saved[key]])) : {
        background: rgbToHex(body.backgroundColor), panel: rgbToHex(panel.backgroundColor === 'rgba(0, 0, 0, 0)' ? body.backgroundColor : panel.backgroundColor),
        input: rgbToHex(input.backgroundColor), text: rgbToHex(body.color), border: rgbToHex(input.borderBottomColor),
        accent: rgbToHex(getComputedStyle(document.querySelector('#logo a')).color),
        error: document.body.classList.contains('terminal') ? '#ff0080' : document.body.classList.contains('light') ? '#cc0000' : '#ff3333',
      })
    }
    setPage(nextPage)
    setEditing(true)
  }

  async function loadFont() {
    clearPreview()
    const attempt = attemptRef.current
    setLoading(true)
    try {
      const face = await loadWebFont(url)
      if (attempt !== attemptRef.current) return
      document.fonts.add(face)
      previewFontRef.current = face
      setLoadedFont(face)
    } catch (failure) {
      if (attempt === attemptRef.current) setError(failure.message)
    } finally {
      if (attempt === attemptRef.current) setLoading(false)
    }
  }

  function save() {
    try {
      if (!name.trim() || name.length > 60) throw new Error('이름을 1~60자로 입력해 주세요.')
      if (page === 'font') {
        if (!loadedFont || !name.trim()) throw new Error('글꼴 이름을 입력하고 폰트를 먼저 불러와 주세요.')
        onSave('font', { id: editingId || undefined, name: name.trim(), url: fontURL(url) }, loadedFont)
        // Ownership of the loaded face moves to App after a successful save.
        previewFontRef.current = null
      } else {
        if (!colorFields.every(([key]) => /^#[\da-f]{6}$/i.test(colors[key]))) throw new Error('색상은 #RRGGBB 형식으로 입력해 주세요.')
        onSave('theme', { id: editingId || undefined, name: name.trim(), ...colors })
      }
      back()
    } catch (failure) { setError(failure.message) }
  }

  function escape(e) {
    e.preventDefault()
    if (deleteId) setDeleteId('')
    else if (page === 'menu') onClose()
    else back()
  }

  return <dialog
    ref={dialogRef}
    id="practice-menu"
    className={`practice-menu${pixel ? ' pixel' : ''}${editing && page === 'theme' ? ' theme-editor' : ''}`}
    style={{ fontFamily }}
    aria-labelledby="practice-menu-title"
    onCancel={escape}
    onKeyDown={e => {
      if (e.key !== 'Escape' || e.isComposing || e.nativeEvent.isComposing || e.keyCode === 229) return
      e.stopPropagation()
      if (!e.repeat) escape(e)
      else e.preventDefault()
    }}
    onClick={e => {
      if (e.target !== e.currentTarget) return
      const bounds = e.currentTarget.getBoundingClientRect()
      if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) onClose()
    }}
  >
    <h2 id="practice-menu-title">{page === 'menu' ? 'ttalkkak' : page === 'font' ? '사용자 지정 글꼴' : '사용자 지정 테마'}</h2>
    {page === 'menu' ? <>
      <div className="practice-menu-actions">
        <button id="edit-custom-font" type="button" onClick={() => openList('font')}>사용자 지정 글꼴</button>
        <button id="edit-custom-theme" type="button" onClick={() => openList('theme')}>사용자 지정 테마</button>
      </div>
      <div className="editor-actions">
        <button id="resume-practice" type="button" onClick={onClose}>연습 계속하기</button>
        <a id="github-repository" href="https://github.com/owjxyz/ttalkkak" target="_blank" rel="noopener noreferrer"><span className="repository-label"><svg className="github-logo" viewBox="0 0 16 16" aria-hidden="true"><use href={`${import.meta.env.BASE_URL}assets/github.svg#github-mark`} /></svg>GitHub Repo</span><span className="sr-only"> (새 탭)</span></a>
      </div>
    </> : <>
      {!editing ? <div className="saved-presets">
        <h3>저장한 {page === 'font' ? '글꼴' : '테마'}</h3>
        {settings[page === 'font' ? 'fonts' : 'themes'].length === 0 ? <p className="menu-hint">아직 저장한 항목이 없어요.</p> : <ul>
          {settings[page === 'font' ? 'fonts' : 'themes'].map(item => <li key={item.id}>
            <span className="preset-name">{item.name}</span>
            {deleteId === item.id ? <div className="preset-row-actions">
              <button type="button" data-confirm-delete={item.id} aria-label={`${item.name} 삭제 확인`} onClick={() => {
                try {
                  onDelete(page, item.id)
                  setDeleteId('')
                  setError('')
                  dialogRef.current.querySelector(`#new-custom-${page}`)?.focus()
                } catch (failure) { setError(failure.message) }
              }}>삭제 확인</button>
              <button type="button" onClick={() => setDeleteId('')}>취소</button>
            </div> : <div className="preset-row-actions">
              <button type="button" data-edit-preset={item.id} aria-label={`${item.name} 편집`} onClick={() => openEditor(page, item)}>편집</button>
              <button type="button" data-delete-preset={item.id} aria-label={`${item.name} 삭제`} onClick={() => setDeleteId(item.id)}>삭제</button>
            </div>}
          </li>)}
        </ul>}
      </div> : <>
      <h3>{editingId ? '편집' : '새 항목'}</h3>
      {page === 'font' ? <>
        <label htmlFor="custom-font-name">글꼴 이름</label>
        <input id="custom-font-name" value={name} maxLength={60} onChange={e => setName(e.target.value)} placeholder="나의 글꼴" />
        <label htmlFor="custom-font-url">웹폰트 파일 URL</label>
        <input id="custom-font-url" type="url" value={url} maxLength={2048} onChange={e => { clearPreview(); setURL(e.target.value) }} placeholder="https://…/font.woff2" />
        <div className="font-load-actions">
          {(error || loadedFont) && <p role={error ? 'alert' : 'status'} className="font-load-message">{error || '불러오기 완료'}</p>}
          <button id="load-custom-font" type="button" disabled={loading || !url.trim()} onClick={loadFont}>{loading ? '불러오는 중…' : '불러오기'}</button>
        </div>
        <div className="font-preview" style={{ fontFamily: loadedFont?.family || 'inherit' }}>
          다람쥐 헌 쳇바퀴에 타고파<br />The quick brown fox. 0123456789
        </div>
      </> : <>
        <label htmlFor="custom-theme-name">테마 이름</label>
        <input id="custom-theme-name" value={name} maxLength={60} onChange={e => setName(e.target.value)} placeholder="나의 테마" />
        <div className="custom-color-fields">
          {colorFields.map(([key, label]) => <div className="custom-color-row" key={key}>
            <label htmlFor={`custom-${key}`}>{label}</label>
            <input type="color" aria-label={`${label} 색상 선택`} value={/^#[\da-f]{6}$/i.test(colors[key]) ? colors[key] : '#000000'} onChange={e => setColors(prev => ({ ...prev, [key]: e.target.value }))} />
            <input id={`custom-${key}`} value={colors[key]} maxLength={7} spellCheck={false} onChange={e => setColors(prev => ({ ...prev, [key]: e.target.value }))} />
          </div>)}
        </div>
        <div className="custom-theme-preview" style={themeVariables(Object.fromEntries(colorFields.map(([key]) => [key, /^#[\da-f]{6}$/i.test(colors[key]) ? colors[key] : '#000000'])))}>
          <span className="custom-preview-logo">ttalkkak</span>
          <div className="custom-preview-panel">작은 <span className="custom-preview-error">리듬</span>으로 이어지는 하루.<div className="custom-preview-input">작은 리듬<span aria-hidden="true">│</span></div><div className="custom-preview-progress" /></div>
        </div>
      </>}
      </>}
      {error && !(editing && page === 'font') && <p role="alert" className="menu-error">{error}</p>}
      <div className="editor-actions">
        <button type="button" onClick={back}>{editing ? '취소' : '뒤로'}</button>
        {!editing && <button id={`new-custom-${page}`} type="button" onClick={() => openEditor(page)}>새 {page === 'font' ? '글꼴' : '테마'} 추가하기</button>}
        {editing && <button id={`save-custom-${page}`} type="button" disabled={!name.trim() || (page === 'font' && !loadedFont)} onClick={save}>저장하고 적용</button>}
      </div>
    </>}
  </dialog>
}
