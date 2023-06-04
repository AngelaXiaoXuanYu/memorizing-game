// 定義各種遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

const view = {
  // getCardElement：負責生成卡片容器(呈現牌背圖案)
  getCardElement(index) {
    return `<div data-index="${index}" class="card back"></div>`
    // 加上 data-index 是為了知道並記錄這張牌的 index，以利後續運用
  },

  // getCardContent：負責產生牌面元件（數字和花色）
  getCardContent(index) {
    // 0-51 作為每一張牌的 index，即 0-12：黑桃 1-13；13-25：愛心 1-13；26-38：方塊 1-13；39-51：梅花 1-13
    // 例如：梅花 12，index = 50，number = 12，經過transformNumber(12) 的轉換，會變成 Q，symbol = Symbols[3]，會找出梅花的圖案
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
        <p>${number}</p>
        <img src="${symbol}" />
        <p>${number}</p>
        `
  },
  
  // transformNumber：負責處理數字轉換 J Q K A
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },

  // displayCards：負責選出 #cards 並抽換其內容
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
    
    // rootElement.innerHTML = Array.from(Array(52).keys()).map(index => this.getCardElement(index),this).join('')

    // Array.from 可以從「類似陣列」的物件來建立新陣列
    // Array(52) 會產生一個有 52 個元素的空陣列
    // Array(52).keys() 是一個「0～51 的迭代器」
    // Array.from(Array(52).keys()) 即是「利用『0～51 的迭代器』生成一個[0, 1, 2, ... ,51]的陣列」
    // map() 會將原陣列(即[0, ... ,51])的每一個元素，經由 callback 回呼函式運算後回傳的結果，建立新的陣列。
    // join(" ") 是把 map() 建立的新陣列中的所有元素合併成一個大字串，才能當成 HTML template 來使用
  },

  // flipCards：負責卡片翻面
  // 「...」是「其餘參數 (rest parameters)」，可以把值蒐集起來變成陣列，這樣就可以一次把多個值傳入給 function 去執行
  flipCards(...cards) {
    cards.map(card => {
      if (card.classList.contains('back')) {
        // 若牌是背面，回傳正面：去掉 back 標記，並加入數字和花色
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      // 若牌是正面，回傳背面：加回 back 標記，並把數字和花色去掉(即 innerHtml = null)
      card.classList.add('back')
      card.innerHTML = null
    })
  },
  
  // pairCards：負責改變配對成功牌組的樣式
  pairCards(... cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },

  // renderScore：負責渲染分數
  renderScore(score) {
    document.querySelector(".score").textContent = `Score: ${score}`;
  },

  // renderTriedTimes：負責渲染嘗試次數
  renderTriedTimes(times) {
    document.querySelector(".tried").textContent = `You've tried: ${times} times`;
  },

  // appendWrongAnimation：負責讓錯誤配對的卡片出現動畫
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      // 等動畫跑完，要去掉 wrong 標籤
      // {once: true} 是要求在事件執行一次之後，就要卸載這個監聽器
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },

  // showGameFinished：負責在遊戲結束時出現動畫
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    // before 是把 div 加在 header 前面，但都在同一個父容器裡
    header.before(div)
  }

}

const utility = {
  // getRandomNumberArray：負責產生亂數排序的陣列
  // 例：ount = 5 時，[2,4,3,1,0]
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
        // ES6 的解構賦值語法，目的是「交換陣列元素」
    }
    return number
  }
}

const model = {
  // revealedCards 是一個暫存牌組，使用者每次翻牌時，就先把卡片丟進這個牌組，集滿兩張牌時就要檢查配對有沒有成功，檢查完以後，這個暫存牌組就需要清空。
  revealedCards: [],

  // isRevealedCardsMatched：負責檢查 revealedCards 裡面的兩張牌(即翻到的兩張牌)是否數字相同
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  score: 0,
  triedTimes: 0
}


const controller = {
  // 初始狀態 ＝ 等待玩家翻第一張牌
  currentState: GAME_STATE.FirstCardAwaits,
  
  // generateCards：負責產生所有卡片
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },

  // dispatchCardAction：負責依照當下的遊戲狀態，發派工作給 view 和 controller
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      return
    }
    switch (this.currentState) {
      // 若現在的狀態是 FirstCardAwaits
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break

      // 若現在的狀態是 SecondCardAwaits
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)
        // 判斷配對是否成功
        if (model.isRevealedCardsMatched()) {
          // 配對成功，翻過的牌組應該繼續翻開，且須改變樣式
          view.renderScore(model.score += 10)  
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(... model.revealedCards)
          model.revealedCards = []

          // 若分數達 260，則遊戲結束
          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          // 配對失敗，翻過的牌組應該蓋起來
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)  
          // setTimeout 是瀏覽器提供給 JavaScript 使用的 API，可以呼叫瀏覽器內建的計時器，第一個參數是想要執行的函式內容，第二個參數是停留的毫秒 (1000 毫秒為 1 秒)，在計時器跑完以後，就會執行函式內容。
          setTimeout(this.resetCards, 1000)
        }
        break
    }
    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },

  // resetCards:負責
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}

controller.generateCards()

// 翻牌監聽器：使用 querySelectorAll 抓到所有 card，此時會回傳一個 NodeList，再使用 forEach 來迭代回傳值，為每張卡牌加上事件監聽器
document.querySelectorAll(".card").forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})
