// reactions.js
export class Reactions {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.reactionsMap = new Map();
    this.emojis = [];
    this.categories = {};
    this.lazySize = 50; // number of emojis to show per lazy load batch
    this.init();
  }

  async init() {
    try {
      // fetch emoji list externally
      const res = await fetch('https://unpkg.com/emoji.json@13.1.0/emoji.json');
      if (!res.ok) throw new Error('Failed to fetch emojis');
      const all = await res.json();
      this.emojis = all.map(e => e.emoji);

      // simple categories for demo
      this.categories = {
        "Smileys": this.emojis.slice(0, 60),
        "Animals": this.emojis.slice(60, 120),
        "Food": this.emojis.slice(120, 180),
        "Activities": this.emojis.slice(180, 240),
        "Travel": this.emojis.slice(240, 300),
        "Objects": this.emojis.slice(300, 360),
        "Symbols": this.emojis.slice(360, 420),
        "Flags": this.emojis.slice(420, 480)
      };

      this.renderUI();
    } catch (err) {
      console.error('Reactions init error:', err);
    }
  }

  renderUI() {
    // main reactions container
    this.reactionsDiv = document.createElement('div');
    this.reactionsDiv.className = 'reactions';
    this.reactionsDiv.style.display = 'flex';
    this.reactionsDiv.style.gap = '6px';
    this.reactionsDiv.style.padding = '6px 10px';
    this.reactionsDiv.style.background = '#202225';
    this.reactionsDiv.style.borderRadius = '20px';
    this.reactionsDiv.style.marginTop = '6px';

    // top default emojis
    const defaultEmojis = this.emojis.slice(0, 6);
    defaultEmojis.forEach(emoji => this.addReactionButton(emoji));

    // picker button
    this.pickerButton = document.createElement('button');
    this.pickerButton.textContent = '😊';
    this.pickerButton.style.marginLeft = '8px';
    this.pickerButton.style.cursor = 'pointer';
    this.pickerButton.addEventListener('click', () => this.togglePicker());
    this.reactionsDiv.appendChild(this.pickerButton);

    // picker panel
    this.pickerDiv = document.createElement('div');
    this.pickerDiv.style.position = 'absolute';
    this.pickerDiv.style.display = 'none';
    this.pickerDiv.style.flexDirection = 'column';
    this.pickerDiv.style.width = '320px';
    this.pickerDiv.style.maxHeight = '400px';
    this.pickerDiv.style.background = '#202225';
    this.pickerDiv.style.borderRadius = '10px';
    this.pickerDiv.style.padding = '5px';
    this.pickerDiv.style.boxShadow = '0 2px 15px rgba(0,0,0,0.5)';
    this.pickerDiv.style.zIndex = '1000';

    // search bar
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Search emojis...';
    this.searchInput.style.width = 'calc(100% - 10px)';
    this.searchInput.style.marginBottom = '5px';
    this.searchInput.style.padding = '4px 6px';
    this.searchInput.style.borderRadius = '5px';
    this.searchInput.style.border = 'none';
    this.searchInput.addEventListener('input', () => this.filterEmojis());
    this.pickerDiv.appendChild(this.searchInput);

    // category tabs
    this.tabsDiv = document.createElement('div');
    this.tabsDiv.style.display = 'flex';
    this.tabsDiv.style.gap = '4px';
    this.tabsDiv.style.marginBottom = '4px';
    this.pickerDiv.appendChild(this.tabsDiv);

    Object.keys(this.categories).forEach(cat => {
      const tab = document.createElement('button');
      tab.textContent = cat;
      tab.style.flex = '1';
      tab.style.background = '#2f3136';
      tab.style.color = '#fff';
      tab.style.border = 'none';
      tab.style.cursor = 'pointer';
      tab.style.padding = '4px';
      tab.style.borderRadius = '4px';
      tab.addEventListener('click', () => this.loadCategory(cat));
      this.tabsDiv.appendChild(tab);
    });

    // emoji grid
    this.gridDiv = document.createElement('div');
    this.gridDiv.style.display = 'flex';
    this.gridDiv.style.flexWrap = 'wrap';
    this.gridDiv.style.maxHeight = '320px';
    this.gridDiv.style.overflowY = 'scroll';
    this.pickerDiv.appendChild(this.gridDiv);

    document.body.appendChild(this.pickerDiv);
    this.container.appendChild(this.reactionsDiv);

    // initial lazy load
    this.loadCategory(Object.keys(this.categories)[0]);
  }

  loadCategory(category) {
    this.currentCategory = this.categories[category] || [];
    this.currentIndex = 0;
    this.gridDiv.innerHTML = '';
    this.lazyLoadEmojis();
  }

  lazyLoadEmojis() {
    if (!this.currentCategory) return;
    const batch = this.currentCategory.slice(this.currentIndex, this.currentIndex + this.lazySize);
    batch.forEach(e => this.createEmojiButton(e));
    this.currentIndex += this.lazySize;

    if (this.currentIndex < this.currentCategory.length) {
      const sentinel = document.createElement('div');
      sentinel.style.height = '1px';
      this.gridDiv.appendChild(sentinel);
      const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          this.lazyLoadEmojis();
        }
      });
      observer.observe(sentinel);
    }
  }

  createEmojiButton(emoji) {
    const btn = document.createElement('button');
    btn.textContent = emoji;
    btn.style.fontSize = '22px';
    btn.style.margin = '2px';
    btn.style.padding = '2px 4px';
    btn.style.border = 'none';
    btn.style.background = 'none';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'transform 0.1s ease';

    // hover effect
    btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.3)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');

    btn.addEventListener('click', () => {
      this.addReactionButton(emoji);
      this.hidePicker();
    });

    this.gridDiv.appendChild(btn);
  }

  filterEmojis() {
    const query = this.searchInput.value.trim();
    const filtered = query
      ? this.emojis.filter(e => e.includes(query))
      : this.currentCategory.slice(0, this.lazySize);
    this.gridDiv.innerHTML = '';
    filtered.forEach(e => this.createEmojiButton(e));
  }

  addReactionButton(emoji) {
    const reaction = document.createElement('div');
    reaction.className = 'reaction';
    reaction.innerHTML = `${emoji} <span>0</span>`;
    reaction.dataset.count = 0;
    reaction.style.display = 'flex';
    reaction.style.alignItems = 'center';
    reaction.style.gap = '4px';
    reaction.style.padding = '2px 6px';
    reaction.style.background = '#2f3136';
    reaction.style.borderRadius = '16px';
    reaction.style.cursor = 'pointer';
    reaction.style.transition = 'transform 0.1s ease';

    // hover effect on reaction buttons
    reaction.addEventListener('mouseenter', () => reaction.style.transform = 'scale(1.2)');
    reaction.addEventListener('mouseleave', () => reaction.style.transform = 'scale(1)');

    reaction.addEventListener('click', () => {
      let count = parseInt(reaction.dataset.count);
      count++;
      reaction.dataset.count = count;
      reaction.querySelector('span').textContent = count;
      this.reactionsMap.set(emoji, count);
    });

    this.reactionsDiv.insertBefore(reaction, this.pickerButton);
  }

  togglePicker() {
    this.pickerDiv.style.display === 'flex' ? this.hidePicker() : this.showPicker();
  }

  showPicker() {
    const rect = this.pickerButton.getBoundingClientRect();
    this.pickerDiv.style.left = rect.left + 'px';
    this.pickerDiv.style.top = rect.bottom + 'px';
    this.pickerDiv.style.display = 'flex';
  }

  hidePicker() {
    this.pickerDiv.style.display = 'none';
  }

  getCounts() {
    return Object.fromEntries(this.reactionsMap);
  }
}
