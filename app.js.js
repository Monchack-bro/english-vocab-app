// 単語帳のデータを管理するクラス
class VocabularyApp {
  constructor() {
    this.cards = JSON.parse(localStorage.getItem('vocabCards')) || [];
    this.currentCardIndex = 0;
    this.isFlipped = false;
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.selectedVoice = null;
    
    // DOM要素の取得
    this.cardContainer = document.getElementById('card-container');
    this.prevBtn = document.getElementById('prev-btn');
    this.nextBtn = document.getElementById('next-btn');
    this.addBtn = document.getElementById('add-btn');
    this.englishInput = document.getElementById('english');
    this.japaneseInput = document.getElementById('japanese');
    this.cardCounter = document.getElementById('card-counter');
    
    // イベントリスナーの設定
    this.setupEventListeners();
    
    // 音声合成の準備
    this.setupSpeechSynthesis();
    
    // 初期カードの表示
    this.updateCard();
  }
  
  setupEventListeners() {
    // 前のカードに移動
    this.prevBtn.addEventListener('click', () => this.prevCard());
    
    // 次のカードに移動
    this.nextBtn.addEventListener('click', () => this.nextCard());
    
    // 新しいカードを追加
    this.addBtn.addEventListener('click', () => this.addCard());
    
    // 音声再生ボタン
    this.speakBtn = document.getElementById('speak-btn');
    this.speakBtn.addEventListener('click', () => this.speakText());
    
    // カードをクリックして裏返す
    this.cardContainer.addEventListener('click', () => this.flipCard());
    
    // キーボードナビゲーション
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.prevCard();
      if (e.key === 'ArrowRight') this.nextCard();
      if (e.key === ' ' || e.key === 'Enter') this.flipCard();
    });
  }
  
  // カードを追加するメソッド
  addCard() {
    const english = this.englishInput.value.trim();
    const japanese = this.japaneseInput.value.trim();
    
    if (english && japanese) {
      const newCard = { english, japanese };
      this.cards.push(newCard);
      this.saveCards();
      
      // 入力フィールドをクリア
      this.englishInput.value = '';
      this.japaneseInput.value = '';
      
      // 新しいカードを表示
      this.currentCardIndex = this.cards.length - 1;
      this.updateCard();
      
      // 入力フィールドにフォーカスを戻す
      this.englishInput.focus();
    }
  }
  
  // 前のカードに移動
  prevCard() {
    if (this.cards.length === 0) return;
    
    this.currentCardIndex = (this.currentCardIndex - 1 + this.cards.length) % this.cards.length;
    this.isFlipped = false;
    this.updateCard();
  }
  
  // 次のカードに移動
  nextCard() {
    if (this.cards.length === 0) return;
    
    this.currentCardIndex = (this.currentCardIndex + 1) % this.cards.length;
    this.isFlipped = false;
    this.updateCard();
  }
  
  // カードを裏返す
  flipCard() {
    if (this.cards.length === 0) return;
    
    const card = this.cardContainer.querySelector('.card');
    if (card) {
      this.isFlipped = !this.isFlipped;
      this.updateCard();
    }
  }
  
  // カードを更新して表示
  updateCard() {
    if (this.cards.length === 0) {
      this.cardContainer.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          カードがありません。下のフォームから追加してください。
        </div>
      `;
      this.cardCounter.textContent = '0 / 0';
      return;
    }
    
    const card = this.cards[this.currentCardIndex];
    
    this.cardContainer.innerHTML = `
      <div class="card relative h-48 cursor-pointer" style="perspective: 1000px; transform-style: preserve-3d; transition: transform 0.6s;">
        <div class="card-face card-front absolute w-full h-full flex items-center justify-center bg-white rounded-lg shadow-md p-6" style="backface-visibility: hidden; transform: ${this.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'};">
          <div>
            <div class="text-2xl font-bold text-center">${card.english}</div>
            <div class="mt-2 text-sm text-gray-500 text-center">クリックして反転</div>
          </div>
        </div>
        <div class="card-face card-back absolute w-full h-full flex items-center justify-center bg-gray-100 rounded-lg shadow-md p-6" style="backface-visibility: hidden; transform: rotateY(180deg) ${this.isFlipped ? 'rotateY(180deg)' : ''};">
          <div>
            <div class="text-2xl font-bold text-center">${card.japanese}</div>
            <div class="mt-2 text-sm text-gray-500 text-center">クリックして戻す</div>
          </div>
        </div>
      </div>
    `;
    
    // カードクリック時のイベントを再設定
    const cardElement = this.cardContainer.querySelector('.card');
    if (cardElement) {
      cardElement.addEventListener('click', () => this.flipCard());
    }
    
    // カウンターを更新
    this.cardCounter.textContent = `${this.currentCardIndex + 1} / ${this.cards.length}`;
  }
  
  // カードをローカルストレージに保存
  saveCards() {
    localStorage.setItem('vocabCards', JSON.stringify(this.cards));
  }
  
  // 音声合成の設定
  setupSpeechSynthesis() {
    // 音声の読み込みを待つ
    const loadVoices = () => {
      this.voices = this.synth.getVoices();
      // 英語の音声を優先的に選択
      const enVoices = this.voices.filter(voice => voice.lang.startsWith('en'));
      this.selectedVoice = enVoices.length > 0 
        ? enVoices[0] 
        : this.voices[0];
    };
    
    // 音声が利用可能になったら実行
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
    
    // 既に読み込まれている場合
    loadVoices();
  }
  
  // テキストを読み上げる
  speakText() {
    if (this.cards.length === 0) return;
    
    // 現在のカードのテキストを取得（英語側を読み上げ）
    const currentCard = this.cards[this.currentCardIndex];
    const textToSpeak = currentCard.english;
    
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    
    if (textToSpeak) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // 音声の設定
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      
      // 速度・ピッチの設定
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      // 読み上げを開始
      this.synth.speak(utterance);
      
      // ボタンのスタイルを変更して再生中を表現
      this.speakBtn.classList.add('animate-pulse');
      
      // 読み上げ終了時の処理
      utterance.onend = () => {
        this.speakBtn.classList.remove('animate-pulse');
      };
    }
  }
}

// アプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
  new VocabularyApp();
});
