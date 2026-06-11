import { useState, useEffect } from 'react'
import ChessPiece from './ChessPiece.jsx'
import './ChessBoard.css'
import stockfishService from '../services/stockfish.service'

const SIZE = 8

// 初始化棋盤
const initialBoardState = () => {
  const newBoard = Array(SIZE)
    .fill(null)
    .map(() => Array(SIZE).fill(null))
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
}

function ChessBoard() {
  const [board, setBoard] = useState(() => initialBoardState())
  const [whoseTurn, setWhoseTurn] = useState('white')
  const [selectedStatus, setSelectedStatus] = useState({
    piece: {},
    position: {},
  })
  const [validMoves, setValidMoves] = useState([])

  const [stockfishReady, setStockfishReady] = useState(false)

  const boxClass = (row, col) => {
    let className = 'box'
    if (
      selectedStatus.position &&
      selectedStatus.position.row === row &&
      selectedStatus.position.col === col
    ) {
      className += ' selected'
    }
    return className
  }

  const isSelected = () => {
    return Object.keys(selectedStatus.piece).length > 0
  }

  const canMove = () => {
    return validMoves.length > 0
  }

  // 檢查位置是否在棋盤內
  const isValidPosition = (row, col) => {
    if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
      return true
    }

    return false
  }

  // 定義士兵可以移動的範圍
  const getAvailableMovesForPawn = (row, col) => {
    const { color } = board[row][col]
    let directions = null

    const blackDirections = [
      { dx: 0, dy: 1 },
      { dx: 0, dy: 2 },
      { dx: 1, dy: 1 },
      { dx: -1, dy: 1 },
    ]

    const whiteDirections = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: -2 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: -1 },
    ]

    const moves = []

    // 檢查顏色
    if (color === 'black') {
      directions = blackDirections
    } else if (color === 'white') {
      directions = whiteDirections
    }

    // 檢查每個方向
    directions.forEach(({ dx, dy }) => {
      // 計算座標
      const newCol = col + dx
      const newRow = row + dy

      // 檢查是否在棋盤範圍內
      if (isValidPosition(newCol, newRow)) {
        // 獲取目標棋子
        const targetPiece = board[newRow][newCol]

        // 步數為2時，檢查是否第一次移動
        if (Math.abs(dy) === 2) {
          if (color === 'white' && row !== 6) {
            return
          }
          if (color === 'black' && row !== 1) {
            return
          }
        }

        // 檢查是否為吃子
        if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
          if (targetPiece === null || targetPiece.color === color) {
            return
          }
        } else if (
          Math.abs(dx) === 0 &&
          Math.abs(dy) === 1 &&
          targetPiece != null
        ) {
          // 檢查前方有異色棋子時，不能移動
          return
        } else if (Math.abs(dx) === 0 && Math.abs(dy) === 2) {
          // 移動兩步時，先檢查目標位置是否有棋子
          if (targetPiece != null) {
            if (color === 'white' && board[newRow + 1][newCol] != null) {
              return
            }

            if (color === 'black' && board[newRow - 1][newCol] != null) {
              return
            }
          }
        }

        // 加入可以移動的座標
        moves.push({ row: newRow, col: newCol })
      }
    })

    return moves
  }

  // 定義王可以移動的範圍
  const getAvailableMovesForKing = (row, col, currentBoard = board) => {
    const { color } = currentBoard[row][col]
    const moves = []

    // 王的移動方向
    const kingDirections = [
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
      { dx: -1, dy: -1 },
    ]

    kingDirections.forEach(({ dx, dy }) => {
      const newCol = col + dx
      const newRow = row + dy

      // 檢查是否在棋盤範圍內
      if (isValidPosition(newRow, newCol)) {
        // 獲取目標棋子
        const targetPiece = currentBoard[newRow][newCol]
        // 檢查目標位置是否為空或者是敵方棋子
        if (targetPiece === null || targetPiece.color !== color) {
          // 檢查目標位置是否安全（不在對方的攻擊範圍內）
          if (!isSquareUnderAttack(newRow, newCol, color)) {
            moves.push({ row: newRow, col: newCol })
          }
        }
      }
    })

    return moves
  }

  // 定義皇后可以移動的範圍
  const getAvailableMovesForQueen = (row, col, currentBoard = board) => {
    const { color } = currentBoard[row][col]
    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: 1 },
      { dx: -1, dy: 1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: -1 },
    ]
    const moves = []

    // 檢查每個方向
    directions.forEach(({ dx, dy }) => {
      let newCol = col
      let newRow = row
      let canMove = true

      while (canMove) {
        newCol += dx
        newRow += dy

        if (isValidPosition(newRow, newCol)) {
          // 獲取目標棋子
          const targetPiece = currentBoard[newRow][newCol]

          // 檢查目標方格是否為空或異色
          if (targetPiece === null || targetPiece.color !== color) {
            moves.push({ row: newRow, col: newCol })
          }

          // 檢查目標方格是否為空
          if (targetPiece !== null) {
            canMove = false
          }
        } else {
          canMove = false
        }
      }
    })

    return moves
  }

  // 定義車可以移動的範圍
  const getAvailableMovesForRook = (row, col, currentBoard = board) => {
    const { color } = currentBoard[row][col]
    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ]
    const moves = []

    // 檢查每個方向
    directions.forEach(({ dx, dy }) => {
      let newCol = col
      let newRow = row
      let canMove = true

      while (canMove) {
        newCol += dx
        newRow += dy

        if (isValidPosition(newRow, newCol)) {
          // 獲取目標棋子
          const targetPiece = currentBoard[newRow][newCol]

          // 檢查目標方格是否為空或異色
          if (targetPiece === null || targetPiece.color !== color) {
            moves.push({ row: newRow, col: newCol })
          }

          // 檢查目標方格是否為空
          if (targetPiece != null) {
            canMove = false
          }
        } else {
          canMove = false
        }
      }
    })

    return moves
  }

  // 定義騎士可以移動的範圍
  const getAvailableMovesForKnight = (row, col, currentBoard = board) => {
    const { color } = currentBoard[row][col]
    const directions = [
      { dx: 1, dy: 2 },
      { dx: -1, dy: 2 },
      { dx: 1, dy: -2 },
      { dx: -1, dy: -2 },
      { dx: 2, dy: 1 },
      { dx: -2, dy: 1 },
      { dx: 2, dy: -1 },
      { dx: -2, dy: -1 },
    ]
    const moves = []

    // 檢查每個方向
    directions.forEach(({ dx, dy }) => {
      // 計算座標
      const newCol = col + dx
      const newRow = row + dy

      // 檢查是否在棋盤範圍內
      if (isValidPosition(newRow, newCol)) {
        // 獲取目標棋子
        const targetPiece = currentBoard[newRow][newCol]

        // 檢查目標方格是否為空或異色
        if (targetPiece === null || targetPiece.color !== color) {
          moves.push({ row: newRow, col: newCol })
        }
      }
    })

    return moves
  }

  // 定義主教可以移動的範圍
  const getAvailableMovesForBishop = (row, col, currentBoard = board) => {
    const { color } = currentBoard[row][col]
    const directions = [
      { dx: 1, dy: 1 },
      { dx: -1, dy: 1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: -1 },
    ]
    const moves = []

    // 檢查每個方向
    directions.forEach(({ dx, dy }) => {
      let newCol = col
      let newRow = row
      let canMove = true

      while (canMove) {
        newCol += dx
        newRow += dy

        if (isValidPosition(newRow, newCol)) {
          // 獲取目標棋子
          const targetPiece = currentBoard[newRow][newCol]

          // 檢查目標方格是否為空或異色
          if (targetPiece === null || targetPiece.color !== color) {
            moves.push({ row: newRow, col: newCol })
          }

          // 檢查目標方格是否為空
          if (targetPiece != null) {
            canMove = false
          }
        } else {
          canMove = false
        }
      }
    })

    return moves
  }

  // 定義棋子可以移動的範圍
  const getAvailableMoves = (row, col, currentBoard = board) => {
    const piece = currentBoard[row][col]
    const { type } = piece

    switch (type) {
      case 'king':
        return getAvailableMovesForKing(row, col, currentBoard)
      case 'queen':
        return getAvailableMovesForQueen(row, col, currentBoard)
      case 'rook':
        return getAvailableMovesForRook(row, col, currentBoard)
      case 'knight':
        return getAvailableMovesForKnight(row, col, currentBoard)
      case 'bishop':
        return getAvailableMovesForBishop(row, col, currentBoard)
      case 'pawn':
        return getAvailableMovesForPawn(row, col, currentBoard)
      default:
        return []
    }
  }

  // 獲取王的位置
  const findKing = (color, currentBoard = board) => {
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const piece = currentBoard[row][col]
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col }
        }
      }
    }
    return null
  }

  // 輔助函式：檢查車、象、后 的射線是否能射到目標格
  const isRayAttacking = (
    fromR,
    fromC,
    toR,
    toC,
    type,
    currentBoard = board,
  ) => {
    const dr = toR - fromR
    const dc = toC - fromC
    const absDr = Math.abs(dr)
    const absDc = Math.abs(dc)

    // 檢查類型限制
    if (type === 'rook' && dr !== 0 && dc !== 0) return false
    if (type === 'bishop' && absDr !== absDc) return false
    if (type === 'queen' && dr !== 0 && dc !== 0 && absDr !== absDc)
      return false

    // 計算步進方向
    const stepR = dr === 0 ? 0 : dr / absDr
    const stepC = dc === 0 ? 0 : dc / absDc

    let currentR = fromR + stepR
    let currentC = fromC + stepC

    // 延著射線前進，檢查中間有沒有棋子阻擋
    while (currentR !== toR || currentC !== toC) {
      if (currentBoard[currentR][currentC] !== null) {
        return false // 被別的棋子擋住了
      }
      currentR += stepR
      currentC += stepC
    }
    return true
  }

  // 檢查某個格子是否在對方的攻擊範圍內
  const isSquareUnderAttack = (row, col, kingColor, currentBoard = board) => {
    const opponentColor = kingColor === 'white' ? 'black' : 'white'

    // 檢查每個格子
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const piece = currentBoard[r][c]
        if (!piece || piece.color !== opponentColor) continue
        // 根據棋子類型，單純檢查其物理攻擊路徑是否能到達目標格 (row, col)
        switch (piece.type) {
          case 'pawn': {
            const dy = piece.color === 'black' ? 1 : -1
            // 兵只能斜吃
            if (r + dy === row && (c + 1 === col || c - 1 === col)) {
              return true
            }
            break
          }
          case 'knight': {
            const knightMoves = [
              { dr: 1, dc: 2 },
              { dr: -1, dc: 2 },
              { dr: 1, dc: -2 },
              { dr: -1, dc: -2 },
              { dr: 2, dc: 1 },
              { dr: -2, dc: 1 },
              { dr: 2, dc: -1 },
              { dr: -2, dc: -1 },
            ]
            if (
              knightMoves.some(({ dr, dc }) => r + dr === row && c + dc === col)
            ) {
              return true
            }
            break
          }
          case 'king': {
            // 敵方國王一步之遙的格子也算受攻擊
            if (Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1) {
              return true
            }
            break
          }
          case 'rook':
          case 'bishop':
          case 'queen': {
            // 直線與斜線棋子：檢查是否有障礙物擋住射線
            if (isRayAttacking(r, c, row, col, piece.type, currentBoard)) {
              return true
            }
            break
          }
          default:
            break
        }
      }
    }

    return false
  }

  const checkWin = (currentBoard = board) => {
    const color = whoseTurn === 'white' ? 'black' : 'white'
    const kingPosition = findKing(color, currentBoard)

    if (!kingPosition) return true // 國王不見了，直接判輸

    // 1. 檢查國王目前是否被將軍
    const isKingInCheck = isSquareUnderAttack(
      kingPosition.row,
      kingPosition.col,
      color,
      currentBoard,
    )

    // 2. 蒐集防守方所有棋子的所有合法走法，看看能不能解圍
    let hasValidMove = false

    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const piece = currentBoard[row][col]
        if (!piece || piece.color !== color) continue

        // 取得該棋子的基本移動範圍
        const moves = getAvailableMoves(row, col, currentBoard)

        for (const move of moves) {
          // 建立一個純粹用來模擬的虛擬棋盤，不影響 React State
          const tmpBoard = currentBoard.map((r) => [...r])

          // 模擬移動棋子
          tmpBoard[move.row][move.col] = piece
          tmpBoard[row][col] = null

          // 如果移動的是王，要更新王的位置來做檢查
          const nextKingPos =
            piece.type === 'king'
              ? { row: move.row, col: move.col }
              : kingPosition

          // 檢查這個模擬移動後，自己的國王安全了嗎？
          const stillInCheck = isSquareUnderAttack(
            nextKingPos.row,
            nextKingPos.col,
            color,
            tmpBoard,
          )

          if (!stillInCheck) {
            hasValidMove = true // 找到至少一種解法 (走位避開、墊子、或把將軍的棋子吃掉)
            break
          }
        }
        if (hasValidMove) break
      }
      if (hasValidMove) break
    }

    // 如果被將軍，且沒有任何可以解圍的走法 ＝ 將死 (Checkmate)
    if (isKingInCheck && !hasValidMove) {
      return true
    }

    // 註：如果沒被將軍但完全不能動，國際棋局上叫「逼和 (Stalemate)」，此處先視為一般繼續
    return false
  }

  // 清除選中狀態
  const cleanSelected = () => {
    setSelectedStatus({
      piece: {},
      position: {},
    })
    setValidMoves([])
  }

  // 生成FEN格式棋盤狀態（用於Stockfish）
  const generateFEN = (currentBoard = board, currentTurn = whoseTurn) => {
    let fen = ''
    let emptyCount = 0

    // 遍歷棋盤
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const piece = currentBoard[row][col]
        if (piece === null) {
          emptyCount += 1
        } else {
          // 如果之前有空格，先加入數字
          if (emptyCount > 0) {
            fen += emptyCount
            emptyCount = 0
          }
          // 添加棋子符號
          let pieceSymbol = ''
          switch (piece.type) {
            case 'pawn':
              pieceSymbol = 'p'
              break
            case 'rook':
              pieceSymbol = 'r'
              break
            case 'knight':
              pieceSymbol = 'n'
              break
            case 'bishop':
              pieceSymbol = 'b'
              break
            case 'queen':
              pieceSymbol = 'q'
              break
            case 'king':
              pieceSymbol = 'k'
              break
            default:
              // 處理未知的棋子類型
              console.warn(`未知的棋子類型: ${piece.type}`)
              break
          }
          // 白方用大寫
          if (piece.color === 'white') {
            pieceSymbol = pieceSymbol.toUpperCase()
          }
          fen += pieceSymbol
        }
      }
      // 處理行尾的空格
      if (emptyCount > 0) {
        fen += emptyCount
        emptyCount = 0
      }
      // 除了最後一行，每行加上'/'
      if (row < SIZE - 1) {
        fen += '/'
      }
    }

    // 添加當前回合方
    fen += ` ${currentTurn === 'white' ? 'w' : 'b'}`

    // 添加王車易位權限（這裡簡化處理）
    fen += ' KQkq'

    // 添加過路兵位置（這裡簡化處理）
    fen += ' -'

    // 添加半回合計數和全回合數
    fen += ' 0 1'

    return fen
  }

  // 解析棋盤座標
  const parseSquare = (algebraic) => {
    const col = algebraic.charCodeAt(0) - 'a'.charCodeAt(0)
    const row = 8 - parseInt(algebraic[1], 10)
    return { row, col }
  }

  // AI走棋
  const makeAIMove = async (currentBoard = board, currentTurn = whoseTurn) => {
    if (!stockfishReady) {
      console.error('Stockfish引擎未就緒')
      return
    }

    try {
      // 生成當前局面的FEN
      const fen = generateFEN(currentBoard, currentTurn)

      // 設置當前局面
      await stockfishService.setPosition(fen)

      // 獲取最佳走法
      const bestMove = await stockfishService.getBestMove(15) // 搜索深度15

      if (bestMove && bestMove.length >= 4) {
        // 解析走法
        const fromSquare = parseSquare(bestMove.substring(0, 2))
        const toSquare = parseSquare(bestMove.substring(2, 4))

        // 為AI移動設置選中狀態
        const currentSelectedStatus = {
          piece: currentBoard[fromSquare.row][fromSquare.col],
          position: { row: fromSquare.row, col: fromSquare.col },
        }
        setSelectedStatus(currentSelectedStatus)

        // 設置有效移動
        const moves = [
          {
            row: toSquare.row,
            col: toSquare.col,
          },
        ]
        setValidMoves(moves)

        movePiece(
          toSquare.row,
          toSquare.col,
          moves,
          currentTurn,
          currentSelectedStatus,
          currentBoard,
        )
      }
    } catch (error) {
      console.error('AI走子時發生錯誤:', error)
    }
  }

  const movePiece = (
    row,
    col,
    moves = validMoves,
    currentTurn = whoseTurn,
    currentSelectedStatus = selectedStatus,
    currentBoard = board,
  ) => {
    const originalRow = currentSelectedStatus.position.row
    const originalCol = currentSelectedStatus.position.col
    const originPiece = currentBoard[originalRow][originalCol]

    // 判斷移動是否合法
    moves.forEach((validDir) => {
      if (validDir.row === row && validDir.col === col) {
        // 移動棋子
        const tempBoard = currentBoard.map((r) => [...r])
        tempBoard[row][col] = originPiece
        tempBoard[originalRow][originalCol] = null

        setBoard(tempBoard)

        setSelectedStatus({
          piece: currentSelectedStatus.piece,
          position: { row, col },
        })

        //
        if (checkWin(tempBoard)) {
          alert(
            `${originPiece.color === 'white' ? '白方' : '黑方'}勝利！，請刷新頁面重玩。`,
          )

          return
        }

        if (currentTurn === 'white') {
          const myTurn = 'black'
          // AI 走子
          setWhoseTurn(myTurn)
          // 在玩家（白方）移動後，觸發 AI（黑方）走子
          queueMicrotask(() => {
            makeAIMove(tempBoard, myTurn)
          })
        } else if (currentTurn === 'black') {
          setWhoseTurn('white')
        }

        cleanSelected()
      }
    })
  }

  const clickPiece = (row, col) => {
    // 如果是 AI 的回合（黑色方），不允許玩家操作
    if (whoseTurn === 'black' && board[row][col]?.color !== 'black') {
      return
    }

    // 選擇旗子
    if (
      // 有點到棋子，無選擇棋子狀態
      (board[row][col] !== null && !isSelected()) ||
      // 有點到棋子，有選擇棋子狀態，且點到同色棋子
      (board[row][col] !== null &&
        isSelected() &&
        board[row][col].color === selectedStatus.piece.color)
    ) {
      // 只允許移動當前回合方的棋子
      if (board[row][col].color !== whoseTurn) {
        return
      }

      // 加入選中狀態
      setSelectedStatus({
        piece: board[row][col],
        position: { row, col },
      })

      setValidMoves(getAvailableMoves(row, col))
    } else if (isSelected() && canMove()) {
      // 移動棋子
      movePiece(row, col)
    } else if (isSelected() && !canMove()) {
      // 沒有合法移動，清除選中狀態
      cleanSelected()
    }
  }

  const classMove = (col, rowIndex, colIndex) => {
    if (col !== null) {
      return null
    }

    let canMove = false
    // 檢查是否有選中的棋子
    if (!isSelected()) {
      return null
    }

    // 檢查目標位置的棋子
    const targetPiece = board[rowIndex][colIndex]

    // 如果目標位置有棋子且顏色相同，則不顯示移動樣式
    if (targetPiece && targetPiece.color === selectedStatus.piece.color) {
      return null
    }

    validMoves.forEach((dir) => {
      if (dir.row === rowIndex && dir.col === colIndex) {
        // 如果是國王，需要額外檢查目標位置是否安全
        if (selectedStatus.piece.type === 'king') {
          canMove = !isSquareUnderAttack(
            rowIndex,
            colIndex,
            selectedStatus.piece.color,
          )
        } else {
          canMove = true
        }
      }
    })
    return canMove ? 'canMove' : null
  }

  useEffect(() => {
    const mounted = async () => {
      try {
        await stockfishService.init()
        setStockfishReady(true)
      } catch (error) {
        console.error('Stockfish引擎初始化失敗:', error)
      }
    }
    mounted()
  }, [])

  return (
    <div className='chess-board'>
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className='chess-row'>
          {row.map((col, colIndex) => (
            <div key={colIndex} className='chess-col'>
              <div
                className={boxClass(rowIndex, colIndex)}
                onClick={() => clickPiece(rowIndex, colIndex)}
              >
                {col && <ChessPiece type={col?.type} color={col?.color} />}
                <div className={classMove(col, rowIndex, colIndex)}></div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default ChessBoard
