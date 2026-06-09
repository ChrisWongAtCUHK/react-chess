import { useState } from 'react'
import './ChessBoard.css'

const SIZE = 8

const initialBoardState = () => {
  return Array(SIZE)
    .fill(null)
    .map(() => Array(SIZE).fill(null))
}

function ChessBoard() {
  const [board] = useState(initialBoardState())

  const boxClass = () => {
    let className = 'box'
    return className
  }
  return (
    <div className='chess-board'>
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className='chess-row'>
          {row.map((col, colIndex) => (
            <div key={colIndex} className='chess-col'>
              <div className={boxClass()}></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default ChessBoard
