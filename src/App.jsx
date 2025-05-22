import { useState } from 'react'
import { useEffect } from 'react';
import './App.css'
import Hangul from 'hangul-js'

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

  const [font, setFont] = useState((savedFont !== null) ? savedFont : 'GowunDodum');
  const [theme, setTheme] = useState((savedTheme !== null) ? savedTheme : 'dark');
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [nextPhrase, setNextPhrase] = useState('');
  const [currentPhraseParsed, setCurrentPhraseParsed] = useState([]);
  let inputParsed = [];

  const [best, setBest] = useState((savedBest !== null) ? savedBest : '0');
  const [cCPM, setCCPM] = useState('0');
  const [accuracy, setAccuracy] = useState('100');

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
    });
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
    });
    setCCPM('0');
    setAccuracy('100');
  }

  function stats() {
    let correct = 0;
    let total = 0;

    for (let i = 0; i < inputParsed.length; i++) {

      if (currentPhraseParsed && currentPhraseParsed[i]) {
        for (let j = 0; j < inputParsed[i].length && j < currentPhraseParsed[i].length; j++) {
          total++;
          if (currentPhraseParsed[i] && inputParsed[i][j] === currentPhraseParsed[i][j]) {
            correct++;
          }
        }
        // 현재 입력 중인 글자 제외
        if (i < inputParsed.length - 1) {
          // 받침이 추가로 입력되었을 때
          if (inputParsed[i].length > currentPhraseParsed[i].length) {
            total += inputParsed[i].length - currentPhraseParsed[i].length;
          }
          // 받침이 빠졌을 때
          if (inputParsed[i].length < currentPhraseParsed[i].length) {
            total += currentPhraseParsed[i].length - inputParsed[i].length
          }
        }
      }
      else {
        if (inputParsed.length > currentPhraseParsed.length) {
          total += inputParsed[i].length;
        } // overflow
      }
    }

    if (total === 0 || inputParsed.length === 0) {
      setCCPM('0');
      setAccuracy('100');
    }
    else {
      //setCCPM((correct / 5).toFixed(2));
      setAccuracy(Math.floor(((correct / total)) * 100));
    }
  }

  useEffect(() => {
    fetch(jsonPath).then(response => response.json()).then(data => {
      setCurrentPhrase(data.quotes[currentIndex]);
      setCurrentPhraseParsed(parseText(data.quotes[currentIndex]));
      setNextPhrase(data.quotes[nextIndex]);
    });
    setToNext(true);
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
                setText('');
                setCCPM('0');
                setAccuracy('100');
                document.getElementById('textInput').focus();
              }}>ttalkkak</a>
            </h1>
            <div id="date">V. Dev</div>
          </div>

          <div id="stats" className="box">
            <div>
              <div className="element">
                <span>Best</span>
                <span className="cpm"> CPM</span>
              </div>
              <div id="best" className="element">{best}</div>
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
            <select id="fontSelector" onChange={(e) => {
              if ((e.target.value === 'GalmuriMono11') || (e.target.value === 'NeoDunggeunmo')) {
                setIsPixel(true);
              } else {
                setIsPixel(false);
              }
              setFont(e.target.value);
              localStorage.setItem('Font', e.target.value);
            }} value={font}>
              <option value="GowunDodum">고운돋움</option>
              <option value="GowunBatang">고운바탕</option>
              <option value="Pretendard">프리텐다드</option>
              <option value="NanumBarunpen">나눔바른펜</option>
              <option value="D2Coding">D2Coding</option>
              <option value="GalmuriMono11">갈무리</option>
              <option value="NeoDunggeunmo">Neo둥근모</option>
            </select>
            <span id="theme" className="element">Theme</span>
            <select id="themeSelector" onChange={(e) => {
              setTheme(e.target.value)
              localStorage.setItem('Theme', e.target.value);
            }} value={theme}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System(Auto)</option>
              <option value="terminal">Terminal</option>
              <option value="telnet">Telnet</option>
            </select>
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
                if (toNext) {
                  setText(e.target.value);
                  inputParsed = parseText(e.target.value);
                }
                else { // Accuracy Error fix
                  inputParsed = parseText(text);
                }
                stats();
              }}

              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                  if (currentPhraseParsed && inputParsed && text.toString().length >= currentPhrase.toString().length) {
                    setToNext(false);
                  }
                }
              }}

              onKeyUp={(e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                  setToNext(true);
                  if (currentPhraseParsed && inputParsed && text.toString().length >= currentPhrase.toString().length) {
                    toNextPhrase();
                    setBest(cCPM);
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
