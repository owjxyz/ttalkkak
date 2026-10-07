import { useCallback, useRef, useState } from 'react'
import { useEffect } from 'react';
import './App.css'
import { analyzeTyping, getActiveIndex, getCharacterAccuracy, stripAdvanceSpace } from './typing.js'
import { loadPhrases, randomOtherIndex } from './phrases.js'
import CustomizationMenu from './CustomizationMenu.jsx'
import { loadWebFont, readCustomization, readPreference, themeVariables } from './customization.js'

const fontOptions = [
  { value: 'GowunDodum', label: '고운돋움', previewFamily: 'GowunDodum' },
  { value: 'GowunBatang', label: '고운바탕', previewFamily: 'GowunBatang' },
  { value: 'Pretendard', label: '프리텐다드', previewFamily: 'Pretendard' },
  { value: 'NanumBarunpen', label: '나눔바른펜', previewFamily: 'NanumBarunpen' },
  { value: 'D2Coding', label: 'D2Coding', previewFamily: 'D2Coding' },
  { value: 'GalmuriMono11', label: '갈무리', previewFamily: 'GalmuriMono11' },
  { value: 'NeoDunggeunmo', label: 'Neo둥근모', previewFamily: 'NeoDunggeunmo' },
];

const themeOptions = [
  { value: 'dark', label: 'Dark', previewText: '#f3f3f3', previewBg: '#343434', previewShadow: '0.05em 0.05em 0.1em rgba(0, 0, 0, 1)' },
  { value: 'light', label: 'Light', previewText: '#343434', previewBg: '#f3f3f3', previewShadow: '0.05em 0.05em 0.1em rgba(0, 0, 0, 0.2)' },
  { value: 'system', label: 'System(Auto)', previewText: '#f3f3f3', previewBg: 'linear-gradient(90deg, #343434 0%, #343434 48%, #8f8f8f 50%, #f3f3f3 52%, #f3f3f3 100%)', previewShadow: '0.05em 0.05em 0.1em rgba(0, 0, 0, 0.55)' },
  { value: 'terminal', label: 'Terminal', previewText: '#00f900', previewBg: '#000000', previewShadow: 'none' },
  { value: 'telnet', label: 'Telnet', previewText: '#ffffff', previewBg: '#00007d', previewShadow: 'none' },
];

function changeTabColor(theme, customBackground) {
  const tabColor = document.querySelector("meta[name=theme-color]");
  if (theme === 'custom') {
    tabColor.setAttribute('content', customBackground);
  } else if (theme === 'dark') {
    tabColor.setAttribute('content', '#343434');
  } else if (theme === 'light') {
    tabColor.setAttribute('content', '#f3f3f3');
  } else if (theme === 'system') {
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      tabColor.setAttribute('content', '#f3f3f3');
    } else {
      tabColor.setAttribute('content', '#343434');
    }
  } else if (theme === 'terminal') {
    tabColor.setAttribute('content', '#000000');
  }
  else if (theme == 'telnet') {
    tabColor.setAttribute('content', '#00007d');
  }
}

/**
 * @param {{ id: string, phrase?: string, inputLength?: number, wrongIndices?: number[], activeIndex?: number, phraseRef?: import('react').RefObject<HTMLDivElement> }} props
 */
/* eslint-disable react/prop-types -- Phrase's small internal props contract is documented above without a runtime dependency. */
function Phrase(props) {
  const wrongIndices = props.wrongIndices || [];
  return <div ref={props.phraseRef} id={props.id} className='phrase'>
    {(props.phrase || '').split('').map((character, index) => (
      <span
        key={index}
        className={[
          'word',
          index < props.inputLength ? 'typed' : '',
          wrongIndices.includes(index) ? 'wrong' : '',
          index === props.activeIndex ? 'active' : '',
        ].filter(Boolean).join(' ')}
      >{character}</span>
    ))}
  </div>;
}
/* eslint-enable react/prop-types */

function App() {
  const [text, setText] = useState('');
  const todayDateText = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const phraseStartTimeRef = useRef(Date.now());
  const latestCorrectRef = useRef(0);
  const latestAccuracyRef = useRef(100);
  const hasTypingStartedRef = useRef(false);
  const phrasesRef = useRef([]);
  const indexListRef = useRef([]);
  const composingRef = useRef(false);
  const pendingSpaceRef = useRef(null);

  const [customization, setCustomization] = useState(readCustomization);
  const [font, setFont] = useState(() => {
    const saved = readPreference('Font', 'GowunDodum');
    return fontOptions.some(option => option.value === saved) || customization.fonts.some(item => item.id === saved) ? saved : 'GowunDodum';
  });
  const [theme, setTheme] = useState(() => {
    const saved = readPreference('Theme', 'dark');
    return themeOptions.some(option => option.value === saved) || customization.themes.some(item => item.id === saved) ? saved : 'dark';
  });
  const [webFont, setWebFont] = useState(null);
  const [settingsError, setSettingsError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const pausedAtRef = useRef(null);
  const returnFocusRef = useRef(null);
  const inputSelectionRef = useRef(null);
  const customFont = customization.fonts.find(item => item.id === font);
  const customTheme = customization.themes.find(item => item.id === theme);
  const fontFamily = customFont ? (webFont?.url === customFont.url ? webFont.face.family : 'GowunDodum') : font;
  const availableFonts = [...fontOptions, ...customization.fonts.map(item => ({ value: item.id, label: item.name, previewFamily: webFont?.url === item.url ? webFont.face.family : 'GowunDodum' }))];
  const availableThemes = [...themeOptions, ...customization.themes.map(item => ({ value: item.id, label: item.name, previewText: item.text, previewBg: item.panel, previewShadow: 'none' }))];
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [nextPhrase, setNextPhrase] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loadingPhrases, setLoadingPhrases] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isComposing, setIsComposing] = useState(false);

  const [best, setBest] = useState(() => readPreference('Best', '0'));
  const [cCPM, setCCPM] = useState('0');
  const [accuracy, setAccuracy] = useState('100');
  const [bestMenu, setBestMenu] = useState({ visible: false, x: 0, y: 0 });
  const [openedSelector, setOpenedSelector] = useState('');

  const [isPixel, setIsPixel] = useState(((font === 'GalmuriMono11') || (font === 'NeoDunggeunmo')) ? true : false);
  const [showFontScrollTopIndicator, setShowFontScrollTopIndicator] = useState(false);
  const [showFontScrollBottomIndicator, setShowFontScrollBottomIndicator] = useState(false);
  const [focusedThemeIndex, setFocusedThemeIndex] = useState(-1);
  const textInputRef = useRef(null);
  const phraseRef = useRef(null);
  const fontMenuRef = useRef(null);
  const themeMenuRef = useRef(null);
  const fontListRef = useRef(null);
  const openMenu = useCallback(() => {
    if (pausedAtRef.current !== null) return;
    returnFocusRef.current = document.activeElement;
    const input = textInputRef.current;
    inputSelectionRef.current = input ? [input.selectionStart, input.selectionEnd, input.selectionDirection] : null;
    pausedAtRef.current = Date.now();
    pendingSpaceRef.current = null;
    setOpenedSelector('');
    setBestMenu(prev => ({ ...prev, visible: false }));
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    if (pausedAtRef.current === null) return;
    if (hasTypingStartedRef.current) phraseStartTimeRef.current += Date.now() - pausedAtRef.current;
    pausedAtRef.current = null;
    document.getElementById('practice-menu')?.close();
    setMenuOpen(false);
    const target = returnFocusRef.current?.id === 'date' ? textInputRef.current : returnFocusRef.current;
    target?.focus({ preventScroll: true });
    if (target === textInputRef.current && inputSelectionRef.current) target.setSelectionRange(...inputSelectionRef.current);
  }, []);

  function persistCustomization(next, preferenceKey, selection) {
    const previous = readPreference(preferenceKey, null);
    try {
      localStorage.setItem(preferenceKey, selection);
      localStorage.setItem('Customization', JSON.stringify(next));
    } catch {
      try {
        if (previous === null) localStorage.removeItem(preferenceKey);
        else localStorage.setItem(preferenceKey, previous);
      } catch { /* Storage may be entirely unavailable. Keep the active settings. */ }
      throw new Error('설정을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.');
    }
    setCustomization(next);
    setFont(current => current.startsWith('custom-font:') && !next.fonts.some(item => item.id === current) ? 'GowunDodum' : current);
    setTheme(current => current.startsWith('custom-theme:') && !next.themes.some(item => item.id === current) ? 'dark' : current);
    setSettingsError('');
  }

  function saveCustomization(kind, value, face) {
    const latest = readCustomization();
    const listKey = kind === 'font' ? 'fonts' : 'themes';
    const existing = latest[listKey].find(item => value.id ? item.id === value.id : item.name === value.name);
    if (value.id && !existing) throw new Error('다른 창에서 삭제된 항목입니다. 새 항목으로 저장해 주세요.');
    if (latest[listKey].some(item => item.name === value.name && item.id !== existing?.id)) throw new Error('이미 사용 중인 이름입니다. 다른 이름을 입력해 주세요.');
    const item = { ...value, id: existing?.id || `custom-${kind}:${crypto.randomUUID()}` };
    const next = { ...latest, [listKey]: existing ? latest[listKey].map(saved => saved.id === existing.id ? item : saved) : [...latest[listKey], item] };
    persistCustomization(next, kind === 'font' ? 'Font' : 'Theme', item.id);
    if (kind === 'font') {
      setWebFont({ url: value.url, face });
      setFont(item.id);
      setIsPixel(false);
    } else setTheme(item.id);
  }

  function deleteCustomization(kind, id) {
    const latest = readCustomization();
    const listKey = kind === 'font' ? 'fonts' : 'themes';
    const next = { ...latest, [listKey]: latest[listKey].filter(item => item.id !== id) };
    const selection = kind === 'font'
      ? (fontOptions.some(item => item.value === font) || next.fonts.some(item => item.id === font) ? font : 'GowunDodum')
      : (themeOptions.some(item => item.value === theme) || next.themes.some(item => item.id === theme) ? theme : 'dark');
    persistCustomization(next, kind === 'font' ? 'Font' : 'Theme', selection);
    if (kind === 'font') {
      setFont(selection);
      if (font === id) { setWebFont(null); setIsPixel(false); }
    } else setTheme(selection);
  }

  useEffect(() => {
    if (!customFont || webFont?.url === customFont.url) return;
    let cancelled = false;
    loadWebFont(customFont.url).then(face => {
      if (!cancelled) setWebFont({ url: customFont.url, face });
    }).catch(error => {
      if (cancelled) return;
      setSettingsError(error.message);
      setFont('GowunDodum');
    });
    return () => { cancelled = true; };
  }, [customFont, webFont]);

  useEffect(() => {
    if (!webFont) return;
    document.fonts.add(webFont.face);
    return () => { document.fonts.delete(webFont.face); };
  }, [webFont]);

  const showPhrasePair = useCallback(() => {
    const indices = indexListRef.current;
    const phrases = phrasesRef.current;
    setCurrentPhrase(phrases[indices[indices.length - 2]]);
    setNextPhrase(phrases[indices[indices.length - 1]]);
    phraseStartTimeRef.current = Date.now();
    latestCorrectRef.current = 0;
    latestAccuracyRef.current = 100;
    hasTypingStartedRef.current = false;
    composingRef.current = false;
    pendingSpaceRef.current = null;
    setIsComposing(false);
    setActiveIndex(0);
    setText('');
    setCCPM('0');
    setAccuracy('100');
    if (textInputRef.current) {
      textInputRef.current.style.height = '35px';
    }
  }, []);

  function phraseInit() {
    const count = phrasesRef.current.length;
    if (!count) return;
    const first = Math.floor(Math.random() * count);
    indexListRef.current = [first, randomOtherIndex(count, first)];
    showPhrasePair();
  }

  function toPrevPhrase() {
    if (indexListRef.current.length <= 2) return;
    indexListRef.current.pop();
    showPhrasePair();
  }

  function toNextPhrase() {
    const indices = indexListRef.current;
    if (indices.length < 2) return;
    const current = indices[indices.length - 1];
    indices.push(randomOtherIndex(phrasesRef.current.length, current));
    showPhrasePair();
  }

  function advancePhrase(input) {
    if (input.length < currentPhrase.length) return;
    const { correct, total } = analyzeTyping(currentPhrase, input);
    if (input.length === currentPhrase.length && total > 0 && correct === total) {
      updateBestScore(getCurrentCPM(correct));
    }
    toNextPhrase();
  }

  function getCurrentCPM(correct = latestCorrectRef.current) {
    if (!hasTypingStartedRef.current) {
      return 0;
    }
    const elapsedSeconds = Math.max(((pausedAtRef.current ?? Date.now()) - phraseStartTimeRef.current) / 1000, 1);
    return Math.floor((correct * 60) / elapsedSeconds);
  }

  function updateBestScore(score) {
    const currentBest = Number(best) || 0;
    if (score > currentBest) {
      const bestText = String(score);
      setBest(bestText);
      localStorage.setItem('Best', bestText);
    }
  }

  const applyFontSelection = useCallback((nextFont) => {
    try { localStorage.setItem('Font', nextFont); }
    catch { setSettingsError('글꼴 선택을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.'); return; }
    if ((nextFont === 'GalmuriMono11') || (nextFont === 'NeoDunggeunmo')) {
      setIsPixel(true);
    } else {
      setIsPixel(false);
    }
    setFont(nextFont);
    setOpenedSelector('');
    document.getElementById('fontSelector')?.focus();
  }, []);

  const applyThemeSelection = useCallback((nextTheme) => {
    try { localStorage.setItem('Theme', nextTheme); }
    catch { setSettingsError('테마 선택을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.'); return; }
    setTheme(nextTheme);
    setOpenedSelector('');
  }, []);

  function getFontLabel(fontValue) {
    const matchedFont = availableFonts.find(option => option.value === fontValue);
    return matchedFont ? matchedFont.label : fontValue;
  }

  function getThemeLabel(themeValue) {
    const matchedTheme = availableThemes.find(option => option.value === themeValue);
    return matchedTheme ? matchedTheme.label : themeValue;
  }

  function resetBestScore() {
    setBest('0');
    localStorage.setItem('Best', '0');
    setBestMenu(prev => ({ ...prev, visible: false }));
  }

  function openBestContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    const menuWidth = 170;
    const menuHeight = 44;
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = Math.min(e.detail === 0 ? bounds.left : e.clientX, window.innerWidth - menuWidth - 8);
    const y = Math.min(e.detail === 0 ? bounds.bottom : e.clientY, window.innerHeight - menuHeight - 8);
    setBestMenu({ visible: true, x, y });
  }

  function updateFontScrollIndicators(menu) {
    setShowFontScrollTopIndicator(menu.scrollTop > 1);
    setShowFontScrollBottomIndicator(menu.scrollHeight - menu.scrollTop > menu.clientHeight + 1);
  }

  function scrollFontMenu(direction) {
    const list = fontListRef.current;
    const row = list?.querySelector('.selector-item');
    if (row) list.scrollTop += direction * row.offsetHeight;
  }

  const focusFontItem = useCallback((index) => {
    const item = fontListRef.current?.querySelectorAll('.selector-item')[index];
    item?.focus({ preventScroll: true });
    item?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, []);

  function handleFontMenuKeyDown(e) {
    const items = [...fontListRef.current.querySelectorAll('.selector-item')];
    const index = items.indexOf(document.activeElement);
    let next;
    if (e.key === 'ArrowDown') next = Math.min(index + 1, items.length - 1);
    else if (e.key === 'ArrowUp') next = Math.max(index - 1, 0);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else if (e.key === 'Tab') {
      setOpenedSelector('');
      document.getElementById('fontSelector')?.focus();
    }
    if (next !== undefined) {
      e.preventDefault();
      e.stopPropagation();
      focusFontItem(next);
    }
  }

  function scrollFocusedSelectorItemIntoView(menuRef, focusedIndex) {
    menuRef.current?.querySelectorAll('.selector-item')[focusedIndex]?.scrollIntoView({ block: 'nearest' });
  }

  const handleSelectorKeyDown = useCallback((e) => {
    const availableThemes = [...themeOptions, ...customization.themes.map(item => ({ value: item.id }))];
    if (openedSelector === 'theme') {
      if (e.target !== document.getElementById('themeSelector') && !themeMenuRef.current?.contains(e.target)) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (focusedThemeIndex + 1) % availableThemes.length;
        setFocusedThemeIndex(next);
        themeMenuRef.current?.querySelectorAll('.selector-item')[next]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = (focusedThemeIndex - 1 + availableThemes.length) % availableThemes.length;
        setFocusedThemeIndex(next);
        themeMenuRef.current?.querySelectorAll('.selector-item')[next]?.focus();
      } else if (e.key === 'Enter' && e.target.id === 'themeSelector' && focusedThemeIndex >= 0) {
        e.preventDefault();
        applyThemeSelection(availableThemes[focusedThemeIndex].value);
      }
    }
  }, [openedSelector, focusedThemeIndex, applyThemeSelection, customization.themes]);

  function stats(input, composingIndex = -1) {
    const { correct, total, wrongIndices } = analyzeTyping(currentPhrase, input, composingIndex);
    if (total === 0) {
      latestCorrectRef.current = 0;
      latestAccuracyRef.current = 100;
      hasTypingStartedRef.current = false;
      setCCPM('0');
      setAccuracy('100');
    }
    else {
      latestCorrectRef.current = correct;
      const accuracyValue = getCharacterAccuracy(input, wrongIndices);
      latestAccuracyRef.current = accuracyValue;
      setAccuracy(accuracyValue);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadPhrases(`${import.meta.env.BASE_URL}phrase.json`, controller.signal)
      .then(phrases => {
        phrasesRef.current = phrases;
        const first = Math.floor(Math.random() * phrases.length);
        indexListRef.current = [first, randomOtherIndex(phrases.length, first)];
        showPhrasePair();
      })
      .catch(error => {
        if (error.name !== 'AbortError') setLoadError(error.message);
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingPhrases(false); });
    return () => controller.abort();
  }, [showPhrasePair, loadAttempt]);

  useEffect(() => {
    document.body.className = customTheme ? 'custom' : theme;
    if (customTheme) {
      for (const [key, value] of Object.entries(themeVariables(customTheme))) document.body.style.setProperty(key, value);
    }
    changeTabColor(customTheme ? 'custom' : theme, customTheme?.background);
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => changeTabColor('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme, customTheme]);

  useEffect(() => {
    if (currentPhrase && pausedAtRef.current === null) textInputRef.current?.focus();
  }, [currentPhrase]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (pausedAtRef.current !== null) return;
      if (latestCorrectRef.current === 0) {
        setCCPM('0');
        return;
      }
      setCCPM(String(getCurrentCPM()));
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const closeBestMenu = () => {
      setBestMenu(prev => (prev.visible ? { ...prev, visible: false } : prev));
      setOpenedSelector('');
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (e.defaultPrevented || e.repeat || e.isComposing || composingRef.current || e.keyCode === 229 || menuOpen) return;
        e.preventDefault();
        if (openedSelector || bestMenu.visible) {
          if (openedSelector) document.getElementById(`${openedSelector}Selector`)?.focus();
          else document.getElementById('best')?.focus();
          closeBestMenu();
        } else openMenu();
      } else if (openedSelector === 'font' || openedSelector === 'theme') {
        handleSelectorKeyDown(e);
      }
    };

    const onScroll = (e) => {
      // Font/Theme 메뉴 내부의 스크롤은 무시
      if (fontMenuRef.current && fontMenuRef.current.contains(e.target)) {
        return;
      }
      if (themeMenuRef.current && themeMenuRef.current.contains(e.target)) {
        return;
      }
      // 외부 스크롤이면 메뉴 닫기
      closeBestMenu();
    };

    window.addEventListener('click', closeBestMenu);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);

    return () => {
      window.removeEventListener('click', closeBestMenu);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [openedSelector, handleSelectorKeyDown, bestMenu.visible, menuOpen, openMenu]);

  useEffect(() => {
    if (openedSelector !== 'font') return;
    const list = fontListRef.current;
    focusFontItem(Math.max(0, [...fontOptions.map(option => option.value), ...customization.fonts.map(item => item.id)].indexOf(font)));
    updateFontScrollIndicators(list);
    const observer = new ResizeObserver(() => updateFontScrollIndicators(list));
    observer.observe(list);
    return () => observer.disconnect();
  }, [openedSelector, font, focusFontItem, customization.fonts]);

  useEffect(() => {
    if (openedSelector === 'theme') {
      setFocusedThemeIndex([...themeOptions.map(option => option.value), ...customization.themes.map(item => item.id)].indexOf(theme));
    } else {
      setFocusedThemeIndex(-1);
    }
  }, [openedSelector, theme, customization.themes]);

  useEffect(() => {
    if (openedSelector !== 'theme') return;
    const frame = requestAnimationFrame(() => {
      scrollFocusedSelectorItemIntoView(themeMenuRef, focusedThemeIndex);
    });
    return () => cancelAnimationFrame(frame);
  }, [openedSelector, focusedThemeIndex]);

  return (
    <>
      <div id="boxes" style={{ fontFamily: fontFamily }} className={isPixel ? 'pixel' : ''}>
        <div id="header-box">
          <div id="info">
            <h1 id="logo">
              <a href="" onClick={(e) => {
                e.preventDefault();
                phraseInit();
                document.getElementById('textInput').focus();
              }}>ttalkkak</a>
            </h1>
            <button id="date" type="button" onClick={openMenu} aria-label={`설정 메뉴 열기, ${todayDateText}`} aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="practice-menu">
              <span className="date-value" aria-hidden="true">{todayDateText}</span>
              <span className="date-settings" aria-hidden="true">Settings</span>
            </button>
          </div>

          <div id="stats" className="box">
            <div>
              <div className="element">
                <span>Best</span>
                <span className="cpm"> CPM</span>
              </div>
              <button id="best" className="element" type="button" onClick={openBestContextMenu} onContextMenu={openBestContextMenu} aria-label={`최고 기록 ${best} CPM, 초기화 메뉴 열기`} aria-expanded={bestMenu.visible} aria-controls="best-context-menu">{best}</button>
            </div>
            <div>
              <div className="element">
                <span>Current</span>
                <span className="cpm"> CPM</span>
              </div>
              <div id="current" className="element">{cCPM}</div>
            </div>
            <div>
              <div className="element">Accuracy</div>
              <div className="element">
                <span id="accuracy">{accuracy}</span>
                <span> %</span>
              </div>
            </div>
          </div>

          <div id="option" className="box">
            <span id="font" className="element">Font</span>
            <div className="selector-wrap" onClick={(e) => e.stopPropagation()}>
              <button
                id="fontSelector"
                className="selector-trigger"
                type="button"
                aria-expanded={openedSelector === 'font'}
                aria-controls="fontList"
                aria-haspopup="listbox"
                aria-label={`글꼴 선택, 현재 ${getFontLabel(font)}`}
                onClick={() => setOpenedSelector(prev => (prev === 'font' ? '' : 'font'))}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    setOpenedSelector('font');
                  }
                }}
              >
                {getFontLabel(font)}
              </button>
              {openedSelector === 'font' && (
                <div
                  ref={fontMenuRef}
                  id="fontMenu"
                  className="selector-menu font-menu"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={handleFontMenuKeyDown}
                >
                  <button
                    type="button"
                    className="scroll-indicator scroll-indicator-top"
                    disabled={!showFontScrollTopIndicator}
                    onClick={() => scrollFontMenu(-1)}
                    aria-label="글꼴 목록 한 줄 위로"
                    aria-controls="fontList"
                  >
                    <span aria-hidden="true">▲</span>
                  </button>
                  <div
                    ref={fontListRef}
                    id="fontList"
                    className="font-menu-list"
                    role="listbox"
                    aria-label="글꼴"
                    onScroll={(e) => updateFontScrollIndicators(e.currentTarget)}
                  >
                    {availableFonts.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        tabIndex={-1}
                        className={`selector-item ${option.value === font ? 'selected' : ''}`}
                        aria-selected={option.value === font}
                        style={{ fontFamily: option.previewFamily }}
                        onClick={() => applyFontSelection(option.value)}
                      >
                        <span className="selector-check" aria-hidden="true">{option.value === font ? '✓' : ''}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="scroll-indicator scroll-indicator-bottom"
                    disabled={!showFontScrollBottomIndicator}
                    onClick={() => scrollFontMenu(1)}
                    aria-label="글꼴 목록 한 줄 아래로"
                    aria-controls="fontList"
                  >
                    <span aria-hidden="true">▼</span>
                  </button>
                </div>
              )}
            </div>
            <span id="theme" className="element">Theme</span>
            <div className="selector-wrap" onClick={(e) => e.stopPropagation()}>
              <button
                id="themeSelector"
                className="selector-trigger"
                type="button"
                aria-expanded={openedSelector === 'theme'}
                aria-controls="themeMenu"
                aria-label={`테마 선택, 현재 ${getThemeLabel(theme)}`}
                onClick={() => setOpenedSelector(prev => (prev === 'theme' ? '' : 'theme'))}
              >
                {getThemeLabel(theme)}
              </button>
              {openedSelector === 'theme' && (
                <div
                  ref={themeMenuRef}
                  id="themeMenu"
                  className="selector-menu theme-menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  {availableThemes.map((option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`selector-item ${option.value === theme ? 'selected' : ''} ${index === focusedThemeIndex ? 'focused' : ''}`}
                      aria-pressed={option.value === theme}
                      data-theme={option.value}
                      style={{
                        color: option.previewText,
                        background: option.previewBg,
                        textShadow: option.previewShadow,
                      }}
                      onClick={() => applyThemeSelection(option.value)}
                      onFocus={() => setFocusedThemeIndex(index)}
                      onMouseEnter={() => setFocusedThemeIndex(index)}
                    >
                      <span className="selector-check" aria-hidden="true">{option.value === theme ? '✓' : ''}</span>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div id="main-box" className="box"
          onKeyDown={(e) => {
            if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
            if (e.key === 'PageUp') {
              if (indexListRef.current.length > 2) {
                toPrevPhrase();
              }
            }
            if (e.key === 'PageDown') {
              toNextPhrase();
            }
          }} >
          <div id="current-box">
            {loadingPhrases && <p role="status">문장을 불러오는 중...</p>}
            {loadError && <p role="alert">{loadError} <button type="button" onClick={() => { setLoadError(''); setLoadingPhrases(true); setLoadAttempt(attempt => attempt + 1); }}>다시 시도</button></p>}
            <Phrase
              id="currentPhrase"
              phrase={currentPhrase}
              inputLength={text.length}
              wrongIndices={analyzeTyping(currentPhrase, text, isComposing ? activeIndex : -1).wrongIndices}
              activeIndex={activeIndex}
              phraseRef={phraseRef}
            />
            <textarea ref={textInputRef} id="textInput" value={text} spellCheck="false" autoComplete="off" autoCapitalize="off" autoFocus={true} rows={1} style={{ fontFamily: fontFamily }} aria-label="위 문장 따라 입력하기" disabled={!currentPhrase || Boolean(loadError)}
              onInput={(e) => {
                const input = pendingSpaceRef.current
                  ? stripAdvanceSpace(currentPhrase, e.target.value)
                  : e.target.value;
                if (textInputRef.current) {
                  textInputRef.current.style.height = '35px';
                  const newHeight = Math.max(35, textInputRef.current.scrollHeight);
                  textInputRef.current.style.height = newHeight + 'px';
                }
                setText(input);
                setActiveIndex(getActiveIndex(currentPhrase.length, input.length, e.target.selectionStart));
                if (!hasTypingStartedRef.current && input.length > 0) {
                  phraseStartTimeRef.current = Date.now();
                  hasTypingStartedRef.current = true;
                }
                stats(input, composingRef.current || e.nativeEvent.isComposing
                  ? getActiveIndex(currentPhrase.length, input.length, e.target.selectionStart)
                  : -1);
              }}
              onSelect={(e) => setActiveIndex(getActiveIndex(currentPhrase.length, text.length, e.target.selectionStart))}
              onCompositionStart={() => { composingRef.current = true; setIsComposing(true); }}
              onCompositionEnd={(e) => {
                composingRef.current = false;
                setIsComposing(false);
                const input = pendingSpaceRef.current
                  ? stripAdvanceSpace(currentPhrase, e.target.value)
                  : e.target.value;
                setText(input);
                stats(input);
                if (pendingSpaceRef.current?.released) {
                  pendingSpaceRef.current = null;
                  advancePhrase(input);
                }
              }}
              onKeyDown={(e) => {
                const isSpace = e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar';
                const composing = composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229;
                if (isSpace) {
                  if (e.currentTarget.value.length >= currentPhrase.length) {
                    pendingSpaceRef.current ||= { released: false };
                    if (!composing) e.preventDefault();
                  } else {
                    pendingSpaceRef.current = null;
                  }
                  return;
                }
                if (composing) return;
                if (e.key === 'Enter') {
                  e.preventDefault();
                  advancePhrase(e.currentTarget.value);
                }
              }}
              onKeyUp={(e) => {
                if ((e.code !== 'Space' && e.key !== ' ' && e.key !== 'Spacebar') || !pendingSpaceRef.current) return;
                if (composingRef.current || e.nativeEvent.isComposing) {
                  pendingSpaceRef.current.released = true;
                  return;
                }
                const input = stripAdvanceSpace(currentPhrase, e.currentTarget.value);
                pendingSpaceRef.current = null;
                advancePhrase(input);
              }}
              onBlur={() => { pendingSpaceRef.current = null; }}
              onPaste={(e) => {
                e.preventDefault();
              }} />
            <div className="phrase-progress" role="progressbar" aria-label="문장 진행도" aria-valuemin="0" aria-valuemax="100" aria-valuenow={currentPhrase ? Math.min(100, Math.floor(text.length / currentPhrase.length * 100)) : 0}>
              <div style={{ width: `${currentPhrase ? Math.min(100, text.length / currentPhrase.length * 100) : 0}%` }} />
            </div>
          </div>
        </div>

        <div id="footer-box" className='box'>
          <div id="next-box">
            <Phrase id="nextPhrase" phrase={nextPhrase} />
          </div>
        </div>

        {bestMenu.visible && (
          <div
            id="best-context-menu"
            style={{ left: `${bestMenu.x}px`, top: `${bestMenu.y}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={resetBestScore}>Best CPM 초기화</button>
          </div>
        )}
      </div>

      {settingsError && <p role="alert" className="settings-notice">{settingsError} <button type="button" onClick={() => setSettingsError('')}>닫기</button></p>}
      {menuOpen && <CustomizationMenu settings={customization} onSave={saveCustomization} onDelete={deleteCustomization} onClose={closeMenu} pixel={isPixel} fontFamily={fontFamily} />}

      <div id="preloader">
        <span style={{ fontFamily: "GowunDodum" }}>고운돋움</span>
        <span style={{ fontFamily: "GowunBatang" }}>고운바탕</span>
        <span style={{ fontFamily: "Pretendard" }}>프리텐다드</span>
        <span style={{ fontFamily: "NanumBarunpen" }}>나눔바른펜</span>
        <span style={{ fontFamily: "D2Coding" }}>D2Coding</span>
        <span style={{ fontFamily: "GalmuriMono11" }}>갈무리</span>
        <span style={{ fontFamily: "GalmuriMono7" }}>갈무리</span>
        <span style={{ fontFamily: "Galmuri7" }}>갈무리</span>
        <span style={{ fontFamily: "NeoDunggeunmo" }}>Neo둥근모</span>
      </div>
    </>
  )
}

export default App
