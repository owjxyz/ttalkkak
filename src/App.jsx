import { useRef, useState } from 'react'
import { useEffect } from 'react';
import './App.css'
import Hangul from 'hangul-js'

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

function parseText(text) {
  const textArray = [];
  if (text === undefined) {
    return;
  }
  for (let i = 0; i < text.length; i++) {
    textArray.push(Hangul.disassemble(text[i]));
  }
  return textArray;
}

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

function Phrase(props) {
  const spans = [];

  if (props.phrase === undefined) {
    return <div id={props.id} className='phrase'></div>;
  }
  for (let i = 0; i < props.phrase.length; i++) {
    spans.push(<span key={i} className='word'>{props.phrase[i]}</span>);
  }
  return <div id={props.id} className='phrase'>{spans}</div>;
}

const savedFont = localStorage.getItem('Font');
const savedTheme = localStorage.getItem('Theme');
const savedBest = localStorage.getItem('Best');

let currentIndex = 0;
let nextIndex = 0;
const indexList = [];

const jsonPath = 'phrase.json';
let dataLength = 0;
fetch(jsonPath)
  .then(response => response.json())
  .then(data => {
    dataLength = data.quotes.length;
    currentIndex = Math.floor(Math.random() * data.quotes.length);
    nextIndex = Math.floor(Math.random() * (data.quotes.length - 1));
    if (nextIndex >= currentIndex) {
      nextIndex++;
    }
    indexList.push(currentIndex);
    indexList.push(nextIndex);
  });

//initialize currentIndex and nextIndex
function setInitIndex() {
  currentIndex = Math.floor(Math.random() * dataLength);
  nextIndex = Math.floor(Math.random() * (dataLength - 1));
  if (nextIndex >= currentIndex) {
    nextIndex++;
  }
  indexList.push(currentIndex);
  indexList.push(nextIndex);
}

function setPhraseIndex() {
  currentIndex = nextIndex;
  nextIndex = Math.floor(Math.random() * (dataLength - 1));
  if (nextIndex >= currentIndex) {
    nextIndex++;
  }
  indexList.push(nextIndex);
  console.log(currentIndex, nextIndex);
}



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

  const [font, setFont] = useState((savedFont !== null) ? savedFont : 'GowunDodum');
  const [theme, setTheme] = useState((savedTheme !== null) ? savedTheme : 'dark');
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [nextPhrase, setNextPhrase] = useState('');
  const [currentPhraseParsed, setCurrentPhraseParsed] = useState([]);

  const [best, setBest] = useState((savedBest !== null) ? savedBest : '0');
  const [cCPM, setCCPM] = useState('0');
  const [accuracy, setAccuracy] = useState('100');
  const [bestMenu, setBestMenu] = useState({ visible: false, x: 0, y: 0 });
  const [openedSelector, setOpenedSelector] = useState('');

  const [toNext, setToNext] = useState(true);

  const [isPixel, setIsPixel] = useState(((font === 'GalmuriMono11') || (font === 'NeoDunggeunmo')) ? true : false);
  document.body.className = theme;
  changeTabColor(theme);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    changeTabColor(theme);
  });

  function phraseInit() {
    setInitIndex();
    fetch(jsonPath).then(response => response.json()).then(data => {
      setCurrentPhrase(data.quotes[currentIndex]);
      setCurrentPhraseParsed(parseText(data.quotes[currentIndex]));
      setNextPhrase(data.quotes[nextIndex]);
      phraseStartTimeRef.current = Date.now();
      latestCorrectRef.current = 0;
      hasTypingStartedRef.current = false;
    });
    setText('');
    setCCPM('0');
    setAccuracy('100');
    setToNext(true);
  }

  function toPrevPhrase() {
    setText('');
    indexList.pop();
    nextIndex = indexList[indexList.length - 1];
    currentIndex = indexList[indexList.length - 2];
    fetch(jsonPath).then(response => response.json()).then(data => {
      setCurrentPhrase(data.quotes[currentIndex]);
      setCurrentPhraseParsed(parseText(data.quotes[currentIndex]));
      setNextPhrase(data.quotes[nextIndex]);
      phraseStartTimeRef.current = Date.now();
      latestCorrectRef.current = 0;
      hasTypingStartedRef.current = false;
    });
    setCCPM('0');
    setAccuracy('100');
  }

  function toNextPhrase() {
    setText('');
    setPhraseIndex();
    fetch(jsonPath).then(response => response.json()).then(data => {
      setCurrentPhrase(data.quotes[currentIndex]);
      setCurrentPhraseParsed(parseText(data.quotes[currentIndex]));
      setNextPhrase(data.quotes[nextIndex]);
      phraseStartTimeRef.current = Date.now();
      latestCorrectRef.current = 0;
      hasTypingStartedRef.current = false;
    });
    setCCPM('0');
    setAccuracy('100');
  }

  function getCurrentCPM() {
    if (!hasTypingStartedRef.current) {
      return 0;
    }
    const elapsedSeconds = Math.max((Date.now() - phraseStartTimeRef.current) / 1000, 1);
    return Math.floor((latestCorrectRef.current * 60) / elapsedSeconds);
  }

  function updateBestScore(score) {
    const currentBest = Number(best) || 0;
    if (score > currentBest) {
      const bestText = String(score);
      setBest(bestText);
      localStorage.setItem('Best', bestText);
    }
  }

  function applyFontSelection(nextFont) {
    if ((nextFont === 'GalmuriMono11') || (nextFont === 'NeoDunggeunmo')) {
      setIsPixel(true);
    } else {
      setIsPixel(false);
    }
    setFont(nextFont);
    localStorage.setItem('Font', nextFont);
    setOpenedSelector('');
  }

  function applyThemeSelection(nextTheme) {
    setTheme(nextTheme);
    localStorage.setItem('Theme', nextTheme);
    setOpenedSelector('');
  }

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
    const menuWidth = 170;
    const menuHeight = 44;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 8);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 8);
    setBestMenu({ visible: true, x, y });
  }

  function stats(parsedInput) {
    let correct = 0;
    let total = 0;

    for (let i = 0; i < parsedInput.length; i++) {

      if (currentPhraseParsed && currentPhraseParsed[i]) {
        for (let j = 0; j < parsedInput[i].length && j < currentPhraseParsed[i].length; j++) {
          total++;
          if (currentPhraseParsed[i] && parsedInput[i][j] === currentPhraseParsed[i][j]) {
            correct++;
          }
        }
        // 현재 입력 중인 글자 제외
        if (i < parsedInput.length - 1) {
          // 받침이 추가로 입력되었을 때
          if (parsedInput[i].length > currentPhraseParsed[i].length) {
            total += parsedInput[i].length - currentPhraseParsed[i].length;
          }
          // 받침이 빠졌을 때
          if (parsedInput[i].length < currentPhraseParsed[i].length) {
            total += currentPhraseParsed[i].length - parsedInput[i].length
          }
        }
      }
      else {
        if (parsedInput.length > currentPhraseParsed.length) {
          total += parsedInput[i].length;
        } // overflow
      }
    }

    if (total === 0 || parsedInput.length === 0) {
      latestCorrectRef.current = 0;
      latestAccuracyRef.current = 100;
      hasTypingStartedRef.current = false;
      setCCPM('0');
      setAccuracy('100');
    }
    else {
      latestCorrectRef.current = correct;
      const accuracyValue = Math.floor(((correct / total)) * 100);
      latestAccuracyRef.current = accuracyValue;
      setAccuracy(accuracyValue);
    }
  }

  useEffect(() => {
    fetch(jsonPath).then(response => response.json()).then(data => {
      setCurrentPhrase(data.quotes[currentIndex]);
      setCurrentPhraseParsed(parseText(data.quotes[currentIndex]));
      setNextPhrase(data.quotes[nextIndex]);
      phraseStartTimeRef.current = Date.now();
      latestCorrectRef.current = 0;
      hasTypingStartedRef.current = false;
    });
    setToNext(true);
  }, []);

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

    const onEscape = (e) => {
      if (e.key === 'Escape') {
        closeBestMenu();
      }
    };

    window.addEventListener('click', closeBestMenu);
    window.addEventListener('keydown', onEscape);
    window.addEventListener('scroll', closeBestMenu, true);

    return () => {
      window.removeEventListener('click', closeBestMenu);
      window.removeEventListener('keydown', onEscape);
      window.removeEventListener('scroll', closeBestMenu, true);
    };
  }, []);

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
              <div id="best" className="element" onContextMenu={openBestContextMenu} title="우클릭으로 초기화 메뉴 열기">{best}</div>
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
                onClick={() => setOpenedSelector(prev => (prev === 'font' ? '' : 'font'))}
              >
                {getFontLabel(font)}
              </button>
              {openedSelector === 'font' && (
                <div className="selector-menu font-menu">
                  {fontOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`selector-item ${option.value === font ? 'selected' : ''}`}
                      style={{ fontFamily: option.previewFamily }}
                      onClick={() => applyFontSelection(option.value)}
                    >
                      <span className="selector-check" aria-hidden="true">{option.value === font ? '✓' : ''}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span id="theme" className="element">Theme</span>
            <div className="selector-wrap" onClick={(e) => e.stopPropagation()}>
              <button
                id="themeSelector"
                className="selector-trigger"
                type="button"
                onClick={() => setOpenedSelector(prev => (prev === 'theme' ? '' : 'theme'))}
              >
                {getThemeLabel(theme)}
              </button>
              {openedSelector === 'theme' && (
                <div className="selector-menu theme-menu">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`selector-item ${option.value === theme ? 'selected' : ''}`}
                      style={{
                        color: option.previewText,
                        background: option.previewBg,
                        textShadow: option.previewShadow,
                      }}
                      onClick={() => applyThemeSelection(option.value)}
                    >
                      <span className="selector-check" aria-hidden="true">{option.value === theme ? '✓' : ''}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div id="main-box" className="box"
          onKeyDown={(e) => {
            if (e.key === 'PageUp') {
              if (indexList.length > 2) {
                toPrevPhrase();
                setToNext(true);
              }
            }
            if (e.key === 'PageDown') {
              toNextPhrase();
              setToNext(true);
            }
          }} >
          <div id="current-box">
            <Phrase id="currentPhrase" phrase={currentPhrase} />
            <input type="text" id="textInput" value={text} spellCheck="false" autoComplete="off" autoCapitalize="off" autoFocus={true} style={{ fontFamily: font }}
              onInput={(e) => {
                //console.log(e.target.value, toNext);
                let parsedInput = [];
                if (toNext) {
                  setText(e.target.value);
                  if (!hasTypingStartedRef.current && e.target.value.length > 0) {
                    phraseStartTimeRef.current = Date.now();
                    hasTypingStartedRef.current = true;
                  }
                  parsedInput = parseText(e.target.value);
                }
                else { // Accuracy Error fix
                  parsedInput = parseText(text);
                }
                stats(parsedInput);
              }}

              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                  if (currentPhraseParsed && text.toString().length >= currentPhrase.toString().length) {
                    setToNext(false);
                  }
                }
              }}

              onKeyUp={(e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                  setToNext(true);
                  if (currentPhraseParsed && text.toString().length >= currentPhrase.toString().length) {
                    if (latestAccuracyRef.current === 100) {
                      updateBestScore(getCurrentCPM());
                    }
                    toNextPhrase();
                  }
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
              }} />
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
