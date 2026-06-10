class StockfishService {
  constructor() {
    this.engine = null
    this.isReady = false
  }

  // 初始化引擎
  async init() {
    return new Promise((resolve, reject) => {
      try {
        // console.log('Initializing Stockfish engine...');
        // 使用動態導入並直接創建 Worker
        const wasmSupported = typeof WebAssembly === 'object'
        if (!wasmSupported) {
          throw new Error('WebAssembly not supported in this browser')
        }

        this.engine = new Worker(
          new URL('stockfish.js/stockfish.js', import.meta.url),
          {
            type: 'module',
          },
        )
        this.engine.onmessage = (event) => {
          const message = event.data
          // console.log('Stockfish message:', message);
          if (message.includes('uciok')) {
            // console.log('Stockfish UCI mode ready');
            this.engine.postMessage('isready')
          } else if (message.includes('readyok')) {
            // console.log('Stockfish engine ready');
            this.isReady = true
            resolve(true)
          }
        }

        this.engine.onerror = (error) => {
          console.error('Stockfish engine error:', error)
          reject(error)
        }

        // 初始化UCI模式
        // console.log('Setting UCI mode...');
        this.engine.postMessage('uci')
      } catch (error) {
        console.error('Failed to initialize Stockfish:', error)
        reject(error)
      }
    })
  }

  // 設置新局面
  setPosition(fen) {
    if (!this.isReady) {
      console.error('Engine not ready')
      return
    }
    // console.log('Setting position:', fen);
    this.engine.postMessage(`position fen ${fen}`)
  }

  // 獲取最佳走法
  getBestMove(depth = 15) {
    return new Promise((resolve, reject) => {
      if (!this.isReady) {
        reject(new Error('Engine not ready'))
        return
      }

      const onMessage = (event) => {
        const message = event.data
        // console.log('Stockfish response:', message);
        if (message.includes('bestmove')) {
          const bestMove = message.split(' ')[1]
          this.engine.removeEventListener('message', onMessage)
          resolve(bestMove)
        }
      }

      this.engine.addEventListener('message', onMessage)
      // console.log('Requesting best move with depth:', depth);
      this.engine.postMessage(`go depth ${depth}`)
    })
  }

  // 評估當前局面
  evaluatePosition(depth = 15) {
    return new Promise((resolve, reject) => {
      if (!this.isReady) {
        reject(new Error('Engine not ready'))
        return
      }

      const onMessage = (event) => {
        const message = event.data
        // console.log('Stockfish evaluation:', message);
        if (message.includes('score cp')) {
          const score = parseInt(
            message.split('score cp ')[1].split(' ')[0],
            10,
          )
          this.engine.removeEventListener('message', onMessage)
          resolve(score / 100) // 轉換為標準分數格式
        }
      }

      this.engine.addEventListener('message', onMessage)
      this.engine.postMessage(`go depth ${depth}`)
    })
  }

  // 清理資源
  destroy() {
    if (this.engine) {
      // console.log('Destroying Stockfish engine...');
      this.engine.postMessage('quit')
      this.engine.terminate()
      this.engine = null
      this.isReady = false
    }
  }
}

export default new StockfishService()
