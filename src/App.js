import Waves from "./Waves";
import "./App.css";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import colorPalette from "./colorPalette.json";

import press from "./audio/press.wav"
import alarm from "./audio/alarm.wav"
import TimeInput from "./TimeInput";

function formatTimeDisplay(time) {
  const minutes = Math.floor(time / 60).toString();
  const seconds = (time % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

//cookie storage functions
function getCookieValue(cookieName) {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(cookieName + '=')) {
      return cookie.substring(cookieName.length + 1);
    }
  }
  return null;
}

function setCookie(cookieName, value) {
  var date = new Date();
  date.setTime(date.getTime() + (100 * 365 * 24 * 60 * 60 * 1000)); // Set expiration to 100 years from now
  var expires = date.toUTCString();
  document.cookie = `${cookieName}=${value}; expires=${expires};`;
}

const sessionNames = ["Working", "Break", "Long Break"]

function App() {
  const [paletteIndex, setPaletteIndex] = useState(getCookieValue('paletteIndex') || 0);
  const [workTime, setWorkTime] = useState(getCookieValue('workTime') || 1500);
  const [shortBreakTime, setShortBreakTime] = useState(getCookieValue('shortBreakTime') || 300);
  const [longBreakTime, setLongBreakTime] = useState(getCookieValue('longBreakTime') || 900);

  const palette = colorPalette[paletteIndex].colors;
  const [theme, setTheme] = useState(getCookieValue('theme') || "dark");

  const [onBreak, setOnBreak] = useState(false);
  const [timeDisplay, setTimeDisplay] = useState(formatTimeDisplay(workTime));
  const [workCount, setWorkCount] = useState(1);                                // how many work sessions you did, you get a 15 min break on the 4th
  const [sessionTitle, setSessionTitle] = useState(sessionNames[0])

  const [timerRunning, setTimerRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(workTime);
  const [currentSessionTime, setCurrentSessionTime] = useState(workTime)      // used to determine the percentage of completeness 

  const pressAudioRef = useRef(null);
  const alarmAudioRef = useRef(null);

  const playPressSound = () => {
    pressAudioRef.current.volume = getCookieValue("sfxVolume") || 1;

    pressAudioRef.current.play();
  };

  const playAlarm = () => {
    alarmAudioRef.current.volume = getCookieValue("alarmVolume") || .5;

    alarmAudioRef.current.play();
  };


  

  const skip = () => {
    resetCurrentTime(false);
    setTimerRunning(false);
  };

  const resetSession = () => {
    setTimerRunning(false);
    setOnBreak(false);
    setCurrentTime(workTime);
    setCurrentSessionTime(workTime);
    setSessionTitle(sessionNames[0]);
  }

  const setTimeChanges = (arr) => {
    setWorkTime(arr[0]);
    setCurrentTime(arr[0]);
    setCurrentSessionTime(arr[0])
    setShortBreakTime(arr[1]);
    setLongBreakTime(arr[2]);
    setWorkCount(1);
    setTimerRunning(false);
    setOnBreak(false);
    setSessionTitle(sessionNames[0]);
    setTimeDisplay(formatTimeDisplay(arr[0]));
  }

  const resetCurrentTime = useCallback((shouldPlayAlarm = true) => {
    let tempTime;

    if (onBreak) {
      tempTime = workTime;
      setWorkCount(prev => prev + 1);
      setSessionTitle(sessionNames[0]);
    }
    else {
      tempTime = workCount % 4 === 0 ? longBreakTime : shortBreakTime;
      setSessionTitle(workCount % 4 === 0 ? sessionNames[2] : sessionNames[1]);

    }

    if (shouldPlayAlarm)
      playAlarm();

    setCurrentTime(tempTime);
    setTimeDisplay(formatTimeDisplay(tempTime));
    setCurrentSessionTime(tempTime);
    setOnBreak(prev => !prev);
  }, [workTime, longBreakTime, shortBreakTime, onBreak, workCount]);

  useEffect(() => {
    let intervalId;
    if (timerRunning) {
      intervalId = setInterval(() => {
        setCurrentTime(prevTime => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(intervalId); // Cleanup the interval on component unmount or timer reset
  }, [timerRunning]);

  useEffect(() => {
    if (currentTime < 0 && timerRunning) {
      setTimerRunning(false);
      resetCurrentTime();
    }
    setTimeDisplay(formatTimeDisplay(currentTime));
  }, [currentTime, resetCurrentTime, timerRunning]);

  const handleTimerButtonClick = () => {
    setTimerRunning((prevState) => !prevState);
  };

  useEffect(() => {
    setCookie('paletteIndex', paletteIndex);
  }, [paletteIndex]);

  useEffect(() => {
    setCookie('workTime', workTime);
  }, [workTime]);

  useEffect(() => {
    setCookie('shortBreakTime', shortBreakTime);
  }, [shortBreakTime]);

  useEffect(() => {
    setCookie('longBreakTime', longBreakTime);
  }, [longBreakTime]);

  useEffect(() => {
    setCookie('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (timerRunning) {
      const doing = onBreak ? "Break" : "Working"

      document.title = `${timeDisplay} - ${doing}`
    }
    else {
      document.title = "Focus Flow"
    }
  }, [timerRunning, timeDisplay, onBreak])


  return (
    <div className={"App overflow-hidden w-100 h-100 " + theme} style={{
      "--color1": palette[0],
      "--color2": palette[1],
      "--color3": palette[2],
    }}>

      <Waves palette={palette} />

      <section className={"container billboard " + theme}>
        <CircularBar percentage={-(currentTime / currentSessionTime)} time={timeDisplay} onClick={() => { playPressSound(); handleTimerButtonClick() }}>{timerRunning ? 'Pause' : 'Start'}</CircularBar>
        <h3 id="count" className="fw-bold text-center my-4">{sessionTitle} - #{workCount}</h3>

        <OptionsMenu changeTime={setTimeChanges} />
        <ColorMenu setPalette={setPaletteIndex} changeTheme={setTheme} />

        <SkipButtons skip={skip} reset={resetSession} visible={timerRunning} />

        <audio ref={pressAudioRef} src={press} />
        <audio ref={alarmAudioRef} src={alarm} />

      </section>
    </div>
  );
}


const SkipButtons = ({ skip, reset, visible }) => {
  return (
    <div className="position-absolute w-75 h-50 mx-auto my-5 start-0 end-0 top-25" style={{ visibility: visible ? "visible" : "hidden", opacity: visible ? 1 : 0, transition: "all .25s ease-in-out", fill: "var(--color" }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" className="bi bi-skip-end-btn-fill clickable rounded-circle position-absolute translate-middle-y end-0 top-50 mx-5 my-3" viewBox="0 0 16 16" style={{ zIndex: 200 }} onClick={skip}>
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
        <path d="M6.271 5.055a.5.5 0 0 1 .52.038L9.5 7.028V5.5a.5.5 0 0 1 1 0v5a.5.5 0 0 1-1 0V8.972l-2.71 1.935A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z" />
      </svg>

      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" className="bi bi-skip-end-btn-fill clickable rounded-circle position-absolute translate-middle-y start-0 top-50 mx-5 my-3" viewBox="0 0 16 16" style={{ zIndex: 200 }} onClick={reset}>
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
        <path d="M10.229 5.055a.5.5 0 0 0-.52.038L7 7.028V5.5a.5.5 0 0 0-1 0v5a.5.5 0 0 0 1 0V8.972l2.71 1.935a.5.5 0 0 0 .79-.407v-5a.5.5 0 0 0-.271-.445z" />
      </svg>
    </div>

  );
}


const CircularBar = ({ percentage, time, onClick, children }) => {
  // Circle size
  const radius = 140;
  const strokeWidth = 10;

  // Calculate the dimensions of the SVG element
  const svgSize = (radius + strokeWidth) * 2;

  // Calculate the circumference based on the radius
  const circumference = 2 * Math.PI * radius;

  // Calculate the dash offset to determine the progress
  const dashOffset = circumference - (percentage * circumference);

  return (

    <div className="circular-progress-bar" >
      <svg className="progress-ring overflow-hidden rounded-circle clickable" width={svgSize} height={svgSize} onClick={onClick}>
        <circle
          className="progress-ring-circle background"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
        />

        <circle
          className="progress-ring-circle progress"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: dashOffset,
            transformOrigin: 'center',

          }}
        />
        <text
          x="50%"
          y="48%"
          style={{ fill: "var(--color" }}
          className="progress-text display-3 fw-bold"
          id="timer"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {time}
        </text>
        <text
          x="50%"
          y="77.5%"
          style={{ fill: "var(--color" }}
          className="progress-text h3 fw-bold"
          id="timer"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {children}
        </text>
      </svg>
    </div>
  );
};

const ColorMenu = ({ setPalette, changeTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentTheme = getCookieValue("theme") || "dark";


  const handleMenuClick = () => {
    setIsMenuOpen(true);

  };

  const handleCloseClick = () => {
    setIsMenuOpen(false);

  };

  const handleThemeChange = (e) => {
    changeTheme(e.target.value);
  }



  return (
    <div>
      <div id="colors" className="position-absolute top-0 end-0  m-4 p-2 clickable rounded-circle" onClick={handleMenuClick}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" className="bi bi-palette-fill" viewBox="0 0 16 16" style={{ fill: "var(--color" }}>
          <path d="M12.433 10.07C14.133 10.585 16 11.15 16 8a8 8 0 1 0-8 8c1.996 0 1.826-1.504 1.649-3.08-.124-1.101-.252-2.237.351-2.92.465-.527 1.42-.237 2.433.07zM8 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
        </svg>
      </div>
      {isMenuOpen && (
        <div className="billboard slim">
          <section className="my-1">
            <h3 className="text-center fw-bold">Theme</h3>
            <hr className="mb-4" />
            <div className="d-flex justify-content-center p-3" onChange={handleThemeChange}>
              <label htmlFor="darkMode" className="mx-4 h5 fw-bold">
                <input
                  type="radio"
                  id="darkMode"
                  name="theme"
                  className="mx-2"
                  value="dark"
                  defaultChecked={currentTheme === "dark"}

                />
                Dark Mode
              </label>

              <br />

              <label htmlFor="lightMode" className="mx-4  h5 fw-bold">
                <input
                  type="radio"
                  id="lightMode"
                  name="theme"
                  className="mx-2"
                  value="light"
                  defaultChecked={currentTheme !== "dark"}

                />
                Light Mode
              </label>
            </div>
          </section>
          <div className="color-palette-container mt-2 pb-5">
            {colorPalette.map((palette, index) => (
              <div key={index} className="color-palette clickable noscale pb-2" onClick={() => { setPalette(index) }}>
                <hr className="mb-4 mt-0" />
                <p className="text-center mb-4 text-lg h5 fw-bold">{palette.name}</p>
                <div className="color-boxes mb-2">
                  {palette.colors.map((color, colorIndex) => (
                    <div key={colorIndex} className="color-box p-2 mx-auto w-75" style={{ backgroundColor: color }}></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="d-flex justify-content-around">
            <span className="button clickable h6 fw-bold my-4 px-5 py-2" onClick={handleCloseClick}>
              Close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const OptionsMenu = ({ changeTime, setVolume }) => {
  const currentWorkTime = parseInt(getCookieValue("workTime"))
  const currentShortBreakTime = parseInt(getCookieValue("shortBreakTime"))
  const currentLongBreakTime = parseInt(getCookieValue("longBreakTime"))

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [workTime, setWorkTime] = useState([Math.floor(currentWorkTime / 60), currentWorkTime % 60]);
  const [shortBreakTime, setShortBreakTime] = useState([Math.floor(currentShortBreakTime / 60), currentShortBreakTime % 60]);
  const [longBreakTime, setLongBreakTime] = useState([Math.floor(currentLongBreakTime / 60), currentLongBreakTime % 60]);

  const [alarmVol, setAlarmVolume] = useState(getCookieValue("alarmVolume") || 0.5);
  const [sfxVol, setSFXVolume] = useState(getCookieValue("sfxVolume") || 0.5);


  const handleMenuClick = () => {
    setIsMenuOpen(true);
  };

  //send time changes to update times on timer, updates the cookies automatically
  const handleSave = () => {
    changeTime([workTime[0] * 60 + workTime[1], shortBreakTime[0] * 60 + shortBreakTime[1], longBreakTime[0] * 60 + longBreakTime[1]]);
    setCookie("sfxVolume", sfxVol);
    setCookie("alarmVolume", alarmVol);
    setIsMenuOpen(false);
  };

  const handleClose = () => {
    setIsMenuOpen(false);
  };


  return (
    <div>
      <div
        id="options"
        className="position-absolute top-0 start-0 m-4 p-2 clickable rounded-circle"
        onClick={handleMenuClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          style={{ fill: "var(--color" }}
          className="bi bi-gear-fill"
          viewBox="0 0 16 16"
        >
          <path
            d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"
          />
        </svg>
      </div>

      {isMenuOpen && (
        <div className="billboard slim p-5">

          <section>
            <h3 className="text-center fw-bold">Volume</h3>
            <hr />
            <label for="alarmvol" class="form-label">Alarm</label>
            <input type="range" class="form-range" min="0" step={0.05} max="1" id="alarmvol" value={alarmVol} onChange={(e)=>{setAlarmVolume(e.target.value)}}/>
            <label for="sfxvol" class="form-label">Sound Effects</label>
            <input type="range" class="form-range" min="0" step={0.05} max="1" id="sfxvol" value={sfxVol} onChange={(e)=>{setSFXVolume(e.target.value)}}/>

          </section>

          <section>
            <h3 className="text-center fw-bold">Time Settings</h3>
            <hr />


            <h5 className="position-relative w-100 mx-2 p-3">Work Time <TimeInput prevMin={workTime[0]} prevSec={workTime[1]} onChange={setWorkTime} /></h5>

            <h5 className="position-relative w-100 mx-2 p-3">Short Break Time: <TimeInput prevMin={shortBreakTime[0]} prevSec={shortBreakTime[1]} onChange={setShortBreakTime} /></h5>

            <h5 className="position-relative w-100 mx-2 p-3">Long Break Time: <TimeInput prevMin={longBreakTime[0]} prevSec={longBreakTime[1]} onChange={setLongBreakTime} /></h5>

          </section>

          <div className="d-flex justify-content-around">
            <span className="button clickable h6 fw-bold my-4 px-5 py-2" onClick={handleSave}>
              Save
            </span>
            <span className="button clickable h6 fw-bold my-4 px-5 py-2" onClick={handleClose}>
              Close
            </span>
          </div>
        </div>
      )}
    </div>
  );
};





export default App;
