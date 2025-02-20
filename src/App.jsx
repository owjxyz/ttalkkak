import { useState } from 'react'
import './App.css'


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
  for (let i = 0; i < props.phrase.length; i++) {
    spans.push(<span key={i} className='word'>{props.phrase[i]}</span>);
  }
  return <div id={props.id} className='phrase'>{spans}</div>;
}

const savedFont = localStorage.getItem('Font');
const savedTheme = localStorage.getItem('Theme');

function App() {
  const [font, setFont] = useState((savedFont !== null) ? savedFont : 'GowunDodum');
  const [theme, setTheme] = useState((savedTheme !== null) ? savedTheme : 'dark');
  const [currentPhrase, setCurrentPhrase] = useState('다람쥐 헌 쳇바퀴에 타고파');
  const [nextPhrase, setNextPhrase] = useState('추운 겨울에는 따뜻한 옷을 입어야지');

  const [isPixel, setIsPixel] = useState(((font === 'GalmuriMono11') || (font === 'NeoDunggeunmo')) ? true : false);
  document.body.className = theme;
  changeTabColor(theme);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    changeTabColor(theme);
  });



  return (
    <>
      <div id="boxes" style={{ fontFamily: font }} className={isPixel ? 'pixel' : ''}>
        <div id="header-box">
          <div id="info">
            <h1 id="logo">
              <a href="">ttalkkak</a>
            </h1>
            <div id="date">V. Canary</div>
          </div>

          <div id="stats" className="box">
            <div>
              <div className="element">
                <span>Best</span>
                <span className="cpm"> CPM</span>
              </div>
              <div id="best" className="element">0</div>
            </div>
            <div>
              <div className="element">
                <span>Current</span>
                <span className="cpm"> CPM</span>
              </div>
              <div id="current" className="element">0</div>
            </div>
            <div>
              <div className="element">Accuracy</div>
              <div className="element">
                <span id="accuracy">100</span>
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

        <div id="main-box" className="box">
          <div id="current-box">
            <Phrase id="currentPhrase" phrase={currentPhrase} />
            <input type="text" className="textInput" spellCheck="false" autoComplete="off" autoCapitalize="off" autoFocus={true} style={{ fontFamily: font }} />
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
