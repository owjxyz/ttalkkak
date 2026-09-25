import { useCallback, useRef, useState } from 'react'
import { useEffect } from 'react';
import './App.css'
import { analyzeTyping, getActiveIndex, getCharacterAccuracy, stripAdvanceSpace } from './typing.js'
import { loadPhrases, randomOtherIndex } from './phrases.js'

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

function changeTabColor(theme) {
  const tabColor = document.querySelector("meta[name=theme-color]");
  if (theme === 'dark') {
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

const savedFont = localStorage.getItem('Font');
const savedTheme = localStorage.getItem('Theme');
const savedBest = localStorage.getItem('Best');

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

  const [font, setFont] = useState((savedFont !== null) ? savedFont : 'GowunDodum');
  const [theme, setTheme] = useState((savedTheme !== null) ? savedTheme : 'dark');
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [nextPhrase, setNextPhrase] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loadingPhrases, setLoadingPhrases] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isComposing, setIsComposing] = useState(false);

  const [best, setBest] = useState((savedBest !== null) ? savedBest : '0');
  const [cCPM, setCCPM] = useState('0');
  const [accuracy, setAccuracy] = useState('100');
  const [bestMenu, setBestMenu] = useState({ visible: false, x: 0, y: 0 });
  const [openedSelector, setOpenedSelector] = useState('');

  const [isPixel, setIsPixel] = useState(((font === 'GalmuriMono11') || (font === 'NeoDunggeunmo')) ? true : false);
  const [showFontScrollTopIndicator, setShowFontScrollTopIndicator] = useState(false);
  const [showFontScrollBottomIndicator, setShowFontScrollBottomIndicator] = useState(false);
  const [focusedFontIndex, setFocusedFontIndex] = useState(-1);
  const [focusedThemeIndex, setFocusedThemeIndex] = useState(-1);
  const textInputRef = useRef(null);
  const phraseRef = useRef(null);
  const fontMenuRef = useRef(null);
  const themeMenuRef = useRef(null);
  const blockHoverFocusRef = useRef(false);
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
    const elapsedSeconds = Math.max((Date.now() - phraseStartTimeRef.current) / 1000, 1);
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
    if ((nextFont === 'GalmuriMono11') || (nextFont === 'NeoDunggeunmo')) {
      setIsPixel(true);
    } else {
      setIsPixel(false);
    }
    setFont(nextFont);
    localStorage.setItem('Font', nextFont);
    setOpenedSelector('');
  }, []);

  const applyThemeSelection = useCallback((nextTheme) => {
    setTheme(nextTheme);
    localStorage.setItem('Theme', nextTheme);
    setOpenedSelector('');
  }, []);

  function getFontLabel(fontValue) {
    const matchedFont = fontOptions.find(option => option.value === fontValue);
    return matchedFont ? matchedFont.label : fontValue;
  }

  function getThemeLabel(themeValue) {
    const matchedTheme = themeOptions.find(option => option.value === themeValue);
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

  function handleFontMenuScroll(e) {
    const menu = e.target;
    updateFontScrollIndicators(menu);
  }

  function updateFontScrollIndicators(menu) {
    const isAtTop = menu.scrollTop <= 1;
    const isAtBottom = menu.scrollHeight - menu.scrollTop <= menu.clientHeight + 1;
    setShowFontScrollTopIndicator(!isAtTop);
    setShowFontScrollBottomIndicator(!isAtBottom);
  }

  function handleFontMenuWheel(e) {
    if (!fontMenuRef.current) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Ignore horizontal gestures and allow vertical-only scrolling.
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      return;
    }

    const verticalDelta = e.deltaY;
    if (verticalDelta === 0) {
      return;
    }

    const menu = fontMenuRef.current;
    menu.scrollLeft = 0;
    const maxScroll = Math.max(0, menu.scrollHeight - menu.clientHeight);
    const nextScroll = Math.min(maxScroll, Math.max(0, menu.scrollTop + verticalDelta));
    menu.scrollTop = nextScroll;
  }

  function handleThemeMenuWheel(e) {
    // Theme menu should not trigger scroll interactions.
    e.preventDefault();
    e.stopPropagation();
  }

  function scrollFocusedSelectorItemIntoView(menuRef, focusedIndex, options = {}) {
    if (!menuRef?.current || focusedIndex < 0) {
      return;
    }

    const menu = menuRef.current;
    const items = menu.querySelectorAll('.selector-item');
    const targetItem = items[focusedIndex];
    if (!targetItem) {
      return;
    }

    if (options.accountForIndicators) {
      const topIndicator = menu.querySelector('.scroll-indicator-top');
      const bottomIndicator = menu.querySelector('.scroll-indicator-bottom');
      const topInset = topIndicator && !topIndicator.classList.contains('hidden') ? topIndicator.offsetHeight : 0;
      const bottomInset = bottomIndicator && !bottomIndicator.classList.contains('hidden') ? bottomIndicator.offsetHeight : 0;

      // If focus wraps back to first item, pin to top so top indicator disappears.
      if (focusedIndex === 0) {
        menu.scrollTop = 0;
        options.onAdjustedScroll?.(menu);
        return;
      }

      const itemTop = targetItem.offsetTop;
      const itemBottom = itemTop + targetItem.offsetHeight;
      const viewportTop = menu.scrollTop + topInset;
      const viewportBottom = menu.scrollTop + menu.clientHeight - bottomInset;

      let nextScrollTop = menu.scrollTop;
      if (itemTop < viewportTop) {
        nextScrollTop = itemTop - topInset;
      } else if (itemBottom > viewportBottom) {
        nextScrollTop = itemBottom - menu.clientHeight + bottomInset;
      }

      const maxScrollTop = Math.max(0, menu.scrollHeight - menu.clientHeight);
      menu.scrollTop = Math.max(0, Math.min(maxScrollTop, nextScrollTop));
      options.onAdjustedScroll?.(menu);
      return;
    }

    targetItem.scrollIntoView({ block: 'nearest' });
  }

  function scrollFontMenuDown(e) {
    e.preventDefault();
    e.stopPropagation();

    blockHoverFocusRef.current = true;
    setFocusedFontIndex(prev => (prev + 1) % fontOptions.length);
  }

  function scrollFontMenuUp(e) {
    e.preventDefault();
    e.stopPropagation();

    blockHoverFocusRef.current = true;
    setFocusedFontIndex(prev => (prev - 1 + fontOptions.length) % fontOptions.length);
  }

  const handleSelectorKeyDown = useCallback((e) => {
    if (openedSelector === 'font') {
      if (e.target !== document.getElementById('fontSelector') && !fontMenuRef.current?.contains(e.target)) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        blockHoverFocusRef.current = true;
        const next = (focusedFontIndex + 1) % fontOptions.length;
        setFocusedFontIndex(next);
        fontMenuRef.current?.querySelectorAll('.selector-item')[next]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        blockHoverFocusRef.current = true;
        const next = (focusedFontIndex - 1 + fontOptions.length) % fontOptions.length;
        setFocusedFontIndex(next);
        fontMenuRef.current?.querySelectorAll('.selector-item')[next]?.focus();
      } else if (e.key === 'Enter' && e.target.id === 'fontSelector' && focusedFontIndex >= 0) {
        e.preventDefault();
        applyFontSelection(fontOptions[focusedFontIndex].value);
      }
    } else if (openedSelector === 'theme') {
      if (e.target !== document.getElementById('themeSelector') && !themeMenuRef.current?.contains(e.target)) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (focusedThemeIndex + 1) % themeOptions.length;
        setFocusedThemeIndex(next);
        themeMenuRef.current?.querySelectorAll('.selector-item')[next]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = (focusedThemeIndex - 1 + themeOptions.length) % themeOptions.length;
        setFocusedThemeIndex(next);
        themeMenuRef.current?.querySelectorAll('.selector-item')[next]?.focus();
      } else if (e.key === 'Enter' && e.target.id === 'themeSelector' && focusedThemeIndex >= 0) {
        e.preventDefault();
        applyThemeSelection(themeOptions[focusedThemeIndex].value);
      }
    }
  }, [openedSelector, focusedFontIndex, focusedThemeIndex, applyFontSelection, applyThemeSelection]);

  function handleFontItemMouseEnter(index) {
    if (blockHoverFocusRef.current) {
      return;
    }
    setFocusedFontIndex(index);
  }

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
    document.body.className = theme;
    changeTabColor(theme);
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => changeTabColor('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  useEffect(() => {
    if (currentPhrase) textInputRef.current?.focus();
  }, [currentPhrase]);

  useEffect(() => {
    const intervalId = setInterval(() => {
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
        closeBestMenu();
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
  }, [openedSelector, handleSelectorKeyDown]);

  useEffect(() => {
    if (openedSelector === 'font' && fontMenuRef.current) {
      const menu = fontMenuRef.current;
      const hasScroll = menu.scrollHeight > menu.clientHeight;
      setShowFontScrollTopIndicator(false);
      setShowFontScrollBottomIndicator(hasScroll);
      // Set initial focus to current font
      const currentIndex = fontOptions.findIndex(opt => opt.value === font);
      setFocusedFontIndex(currentIndex);
    } else if (openedSelector === 'theme' && themeMenuRef.current) {
      // Set initial focus to current theme
      const currentIndex = themeOptions.findIndex(opt => opt.value === theme);
      setFocusedThemeIndex(currentIndex);
    } else {
      setFocusedFontIndex(-1);
      setFocusedThemeIndex(-1);
    }
  }, [openedSelector, font, theme]);

  useEffect(() => {
    if (openedSelector === 'font') {
      requestAnimationFrame(() => {
        scrollFocusedSelectorItemIntoView(fontMenuRef, focusedFontIndex, {
          accountForIndicators: true,
          onAdjustedScroll: updateFontScrollIndicators,
        });
      });
    } else if (openedSelector === 'theme') {
      requestAnimationFrame(() => {
        scrollFocusedSelectorItemIntoView(themeMenuRef, focusedThemeIndex);
      });
    }
  }, [openedSelector, focusedFontIndex, focusedThemeIndex]);

  useEffect(() => {
    if (openedSelector !== 'font') {
      blockHoverFocusRef.current = false;
      return;
    }

    const onMouseMove = () => {
      if (blockHoverFocusRef.current) {
        blockHoverFocusRef.current = false;
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [openedSelector]);

  return (
    <>
      <div id="boxes" style={{ fontFamily: font }} className={isPixel ? 'pixel' : ''}>
        <div id="header-box">
          <div id="info">
            <h1 id="logo">
              <a href="" onClick={(e) => {
                e.preventDefault();
                phraseInit();
                document.getElementById('textInput').focus();
              }}>ttalkkak</a>
            </h1>
            <div id="date">{todayDateText}</div>
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
                aria-controls="fontMenu"
                aria-label={`글꼴 선택, 현재 ${getFontLabel(font)}`}
                onClick={() => setOpenedSelector(prev => (prev === 'font' ? '' : 'font'))}
              >
                {getFontLabel(font)}
              </button>
              {openedSelector === 'font' && (
                <div
                  ref={fontMenuRef}
                  id="fontMenu"
                  className="selector-menu font-menu"
                  onClick={(e) => e.stopPropagation()}
                  onScroll={handleFontMenuScroll}
                  onWheel={handleFontMenuWheel}
                >
                  <button
                    type="button"
                    className={`scroll-indicator scroll-indicator-top ${showFontScrollTopIndicator ? '' : 'hidden'}`}
                    onClick={scrollFontMenuUp}
                    aria-label="Scroll font menu up"
                  >
                    ▲
                  </button>
                  {fontOptions.map((option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`selector-item ${option.value === font ? 'selected' : ''} ${index === focusedFontIndex ? 'focused' : ''}`}
                      aria-pressed={option.value === font}
                      style={{ fontFamily: option.previewFamily }}
                      onClick={() => applyFontSelection(option.value)}
                      onFocus={() => setFocusedFontIndex(index)}
                      onMouseEnter={() => handleFontItemMouseEnter(index)}
                    >
                      <span className="selector-check" aria-hidden="true">{option.value === font ? '✓' : ''}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`scroll-indicator scroll-indicator-bottom ${showFontScrollBottomIndicator ? '' : 'hidden'}`}
                    onClick={scrollFontMenuDown}
                    aria-label="Scroll font menu down"
                  >
                    ▼
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
                  onWheel={handleThemeMenuWheel}
                >
                  {themeOptions.map((option, index) => (
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
            <textarea ref={textInputRef} id="textInput" value={text} spellCheck="false" autoComplete="off" autoCapitalize="off" autoFocus={true} rows={1} style={{ fontFamily: font }} aria-label="위 문장 따라 입력하기" disabled={!currentPhrase || Boolean(loadError)}
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
