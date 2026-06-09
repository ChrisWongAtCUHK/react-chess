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
    newBoard[0][0] = { type: 'rook', color: 'black' }
    newBoard[0][1] = { type: 'knight', color: 'black' }
    newBoard[0][2] = { type: 'bishop', color: 'black' }
    newBoard[0][3] = { type: 'queen', color: 'black' }
    newBoard[0][4] = { type: 'king', color: 'black' }
    newBoard[0][5] = { type: 'bishop', color: 'black' }
    newBoard[0][6] = { type: 'knight', color: 'black' }
    newBoard[0][7] = { type: 'rook', color: 'black' }
    for (let col = 0; col < SIZE; col += 1) {
      newBoard[1][col] = { type: 'pawn', color: 'black' }
    }

    // 初始化白方棋子
    newBoard[7][0] = { type: 'rook', color: 'white' }
    newBoard[7][1] = { type: 'knight', color: 'white' }
    newBoard[7][2] = { type: 'bishop', color: 'white' }
    newBoard[7][3] = { type: 'queen', color: 'white' }
    newBoard[7][4] = { type: 'king', color: 'white' }
    newBoard[7][5] = { type: 'bishop', color: 'white' }
    newBoard[7][6] = { type: 'knight', color: 'white' }
    newBoard[7][7] = { type: 'rook', color: 'white' }
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
