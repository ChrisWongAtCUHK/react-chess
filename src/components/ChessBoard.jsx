import { useState } from 'react'
import ChessPiece from './ChessPiece.jsx'
import './ChessBoard.css'

const SIZE = 8

// 初始化棋盤
const initialBoardState = () => {
  return Array(SIZE)
    .fill(null)
    .map(() => Array(SIZE).fill(null))
}

function ChessBoard() {
  const [board] = useState(() => {
    const newBoard = initialBoardState()
    // 初始化黑方棋子
    for (let col = 0; col < SIZE; col += 1) {
      newBoard[1][col] = { type: 'pawn', color: 'black' }
    }

    // 初始化白方棋子
    for (let col = 0; col < SIZE; col += 1) {
      newBoard[6][col] = { type: 'pawn', color: 'white' }
    }

    return newBoard
  })

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
              <div className={boxClass()}>
                <ChessPiece type={col?.type} color={col?.color} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default ChessBoard
