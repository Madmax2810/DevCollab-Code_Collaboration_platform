import React, { useEffect, useState } from "react";
import AceEditor from "react-ace";
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate, useParams } from "react-router-dom";
import { generateColor } from "../../utils";
import './Room.css'

// Import Ace Editor themes
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/theme-twilight";
import "ace-builds/src-noconflict/theme-solarized_dark";
import "ace-builds/src-noconflict/theme-solarized_light";

// Import Ace Editor language modes
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/mode-c_cpp";    
import "ace-builds/src-noconflict/mode-csharp"; 
import "ace-builds/src-noconflict/mode-php"; 
import "ace-builds/src-noconflict/mode-kotlin"; 
import "ace-builds/src-noconflict/mode-rust"; 

export default function Room({ socket }) {
  const navigate = useNavigate()
  const { roomId } = useParams()
  const [fetchedUsers, setFetchedUsers] = useState(() => [])
  const [fetchedCode, setFetchedCode] = useState(() => "")
  const [language, setLanguage] = useState(() => "javascript")
  const [codeKeybinding, setCodeKeybinding] = useState(() => undefined)
  const [theme, setTheme] = useState(() => "monokai"); // Default theme

  const languagesAvailable = ["javascript", "java", "python", "html", "c", "c++", "c#", "php", "kotlin", "rust"];

  function onChange(newValue) {
    setFetchedCode(newValue)
    socket.emit("update code", { roomId, code: newValue })
    socket.emit("syncing the code", { roomId: roomId })
  }

  function handleLanguageChange(e) {
    setLanguage(e.target.value)
    socket.emit("update language", { roomId, languageUsed: e.target.value })
    socket.emit("syncing the language", { roomId: roomId })
  }

  function handleCodeKeybindingChange(e) {
    setCodeKeybinding(e.target.value === "default" ? undefined : e.target.value)
  }

  function handleLeave() {
    socket.disconnect()
    !socket.connected && navigate('/', { replace: true, state: {} })
  }

  //Function to Copy Code
  function copyCodeToClipboard(text) {
    try {
      navigator.clipboard.writeText(text);
      toast.success('Code Copied')
    } catch (exp) {
      console.error(exp)
    }
  }

  //Function to Copy RoomID
  function copyRoomIdToClipboard(text) {
    try {
      navigator.clipboard.writeText(text);
      toast.success('Room ID copied')
    } catch (exp) {
      console.error(exp)
    }
  }

  // Function to handle theme change
  function handleThemeChange(selectedTheme) {
    setTheme(selectedTheme);
  }

  // Function to download code as .txt file
  function downloadCodeAsTxt() {
    const element = document.createElement("a");
    const file = new Blob([fetchedCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "code.txt";
    document.body.appendChild(element); 
    element.click();
  }

  useEffect(() => {
    socket.on("updating client list", ({ userslist }) => {
      setFetchedUsers(userslist)
    })

    socket.on("on language change", ({ languageUsed }) => {
      setLanguage(languageUsed)
    })

    socket.on("on code change", ({ code }) => {
      setFetchedCode(code)
    })

    socket.on("new member joined", ({ username }) => {
      toast(`${username} joined`)
    })

    socket.on("member left", ({ username }) => {
      toast(`${username} left`)
    })

    const backButtonEventListner = window.addEventListener("popstate", function (e) {
      const eventStateObj = e.state
      if (!('usr' in eventStateObj) || !('username' in eventStateObj.usr)) {
        socket.disconnect()
      }
    });

    return () => {
      window.removeEventListener("popstate", backButtonEventListner)
    }
  }, [socket])

  return (
    <div>
      <header className="header">
        <div className="Navleft">
          <div>DevCollab</div>
        </div>
        <div className="Navright">
          <ul className="navbar">
            <li><a href="Homepage.html" className="Active">Home</a></li>
            <li><a href="Aboutus.html">About Us</a></li>
          </ul>
        </div>
      </header>
  
      <div className="room">
        <div className="roomSidebar">
          <div className="roomSidebarUsersWrapper">
            <div className="languageFieldWrapper">
              <span>Programming Language:</span>
              <select className="languageField" name="language" id="language" value={language} onChange={handleLanguageChange}>
                {languagesAvailable.map(eachLanguage => (
                  <option key={eachLanguage} value={eachLanguage}>{eachLanguage}</option>
                ))}
              </select>
            </div>

            <div className="languageFieldWrapper">
              <span>Theme:</span>
              <select className="languageField" name="theme" id="theme" value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
                <option value="monokai">Default</option>
                <option value="twilight">Black</option>
                <option value="solarized_dark">Blue</option>
                <option value="solarized_light">Beige</option>
              </select>
            </div>
  
            <p id="C_users">Connected Users:</p>
            <div className="roomSidebarUsers">
              {fetchedUsers.map((each) => (
                <div key={each} className="roomSidebarUsersEach">
                  <div className="roomSidebarUsersEachAvatar" style={{ backgroundColor: `${generateColor(each)}` }}>{each.slice(0, 2).toUpperCase()}</div>
                  <div className="roomSidebarUsersEachName">{each}</div>
                </div>
              ))}
            </div>
          </div>
  
          <button className="roomSidebarCopyBtn" onClick={() => window.open("https://www.onlinegdb.com/", "_blank")}>Open Compiler</button>
          <button className="roomSidebarCopyBtn" onClick={() => { copyCodeToClipboard(fetchedCode) }}>Copy Code</button>
          <button className="roomSidebarCopyBtn" onClick={() => { copyRoomIdToClipboard(roomId) }}>Copy Room id</button>
          <button className="roomSidebarCopyBtn" onClick={() => { downloadCodeAsTxt() }}>Download Code</button>
          <button className="roomSidebarBtn" onClick={() => { handleLeave() }}>Leave</button>
        </div>
  
        <AceEditor
          placeholder="Write your code here."
          className="roomCodeEditor"
          mode={language}
          keyboardHandler={codeKeybinding}
          theme={theme}
          name="collabEditor"
          width="auto"
          height="auto"
          value={fetchedCode}
          onChange={onChange}
          fontSize={16}
          showPrintMargin={true}
          showGutter={true}
          highlightActiveLine={true}
          enableLiveAutocompletion={true}
          enableBasicAutocompletion={false}
          enableSnippets={false}
          wrapEnabled={true}
          tabSize={2}
          editorProps={{ $blockScrolling: true }}
        />
      </div>
      <Toaster />
    </div>
  )
}
