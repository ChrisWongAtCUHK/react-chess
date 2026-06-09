import { useState } from 'react'
import './App.css'
import ChessBoard from './components/ChessBoard.jsx'

function App() {
  const [isGameStarted, setIsGameStarted] = useState(false)

  const startGame = () => {
    setIsGameStarted(true)
  }

  const cancelSelect = (e) => {
    // 點擊棋盤空白處取消選擇棋子
    if (!e.target.classList.contains('wrap')) {
      // TODO: 取消選擇棋子
    }
  }

  return (
    <div className='app-container'>
      {isGameStarted == false ? (
        // 開始介面
        <div className='start-screen'>
          <h1>西洋棋對戰</h1>
          <button className='start-button' onClick={startGame}>
            開始遊戲
          </button>
        </div>
      ) : (
        // 遊戲介面
        <div>
          <h1>React Chess</h1>
          <div className='wrap' onClick={cancelSelect}>
            <div className='main'>
              <ChessBoard />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
