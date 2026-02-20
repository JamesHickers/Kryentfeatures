// reactions.js (Optimized)
export class Reactions {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.reactionsMap = new Map();
    this.emojis = [];
    this.categories = {};
    this.lazySize = 50; // batch load
    this.currentCategory = [];
    this.currentIndex = 0;
    this.init();
  }

  async init() {
    try {
      const res = await fetch('https://unpkg.com/emoji.json@13.1.0/emoji.json');
      if (!res.ok) throw new Error('Failed to fetch emojis');
      const all = await res.json();
      this.emojis = all.map(e => e.emoji);

      // simple categories for demo
      const sliceSize = 60;
      const catNames = ["Smileys","Animals","Food","Activities","Travel","Objects","Symbols","Flags"];
      catNames.forEach((name,i)=>this.categories[name]=this.emojis.slice(i*sliceSize,(i+1)*sliceSize));

      this.renderUI();
    } catch (err) {
      console.error('Reactions init error:', err);
    }
  }

  renderUI() {
    // main container
    this.reactionsDiv = Object.assign(document.createElement('div'), {
      className: 'reactions'
    });
    Object.assign(this.reactionsDiv.style, {
      display: 'flex', gap: '6px', padding: '6px 10px', background: '#202225',
      borderRadius: '20px', marginTop: '6px'
    });

    // initial default emojis
    this.emojis.slice(0,6).forEach(e=>this.addReactionButton(e));

    // picker button
    this.pickerButton = Object.assign(document.createElement('button'), { textContent: '😊' });
    Object.assign(this.pickerButton.style, { marginLeft:'8px', cursor:'pointer' });
    this.pickerButton.addEventListener('click',()=>this.togglePicker());
    this.reactionsDiv.appendChild(this.pickerButton);

    // picker panel
    this.pickerDiv = Object.assign(document.createElement('div'), { style:{ display:'none' } });
    Object.assign(this.pickerDiv.style, {
      position:'absolute', flexDirection:'column', width:'320px', maxHeight:'400px',
      background:'#202225', borderRadius:'10px', padding:'5px', boxShadow:'0 2px 15px rgba(0,0,0,0.5)',
      zIndex:'1000', overflow:'hidden'
    });

    // search
    this.searchInput = Object.assign(document.createElement('input'), {
      type:'text', placeholder:'Search emojis...'
    });
    Object.assign(this.searchInput.style, { width:'calc(100% - 10px)', marginBottom:'5px', padding:'4px 6px', borderRadius:'5px', border:'none' });
    this.searchInput.addEventListener('input', ()=>this.filterEmojis());
    this.pickerDiv.appendChild(this.searchInput);

    // tabs
    this.tabsDiv = document.createElement('div');
    Object.assign(this.tabsDiv.style, { display:'flex', gap:'4px', marginBottom:'4px' });
    Object.keys(this.categories).forEach(cat=>{
      const tab = Object.assign(document.createElement('button'), { textContent: cat });
      Object.assign(tab.style, { flex:'1', background:'#2f3136', color:'#fff', border:'none', cursor:'pointer', padding:'4px', borderRadius:'4px' });
      tab.addEventListener('click',()=>this.loadCategory(cat));
      this.tabsDiv.appendChild(tab);
    });
    this.pickerDiv.appendChild(this.tabsDiv);

    // emoji grid
    this.gridDiv = document.createElement('div');
    Object.assign(this.gridDiv.style, { display:'flex', flexWrap:'wrap', maxHeight:'320px', overflowY:'auto' });
    this.pickerDiv.appendChild(this.gridDiv);

    document.body.appendChild(this.pickerDiv);
    this.container.appendChild(this.reactionsDiv);

    this.loadCategory(Object.keys(this.categories)[0]);
  }

  loadCategory(category) {
    this.currentCategory = this.categories[category] || [];
    this.currentIndex = 0;
    this.gridDiv.innerHTML = '';
    this.lazyLoadEmojis();
  }

  lazyLoadEmojis() {
    if (!this.currentCategory.length) return;
    const batch = this.currentCategory.slice(this.currentIndex, this.currentIndex + this.lazySize);
    batch.forEach(e=>this.createEmojiButton(e));
    this.currentIndex += this.lazySize;
    if(this.currentIndex < this.currentCategory.length){
      const sentinel = document.createElement('div'); sentinel.style.height='1px';
      this.gridDiv.appendChild(sentinel);
      const observer = new IntersectionObserver(entries=>{
        if(entries[0].isIntersecting){ observer.disconnect(); this.lazyLoadEmojis(); }
      });
      observer.observe(sentinel);
    }
  }

  createEmojiButton(emoji){
    const btn = document.createElement('button');
    btn.textContent = emoji;
    Object.assign(btn.style,{fontSize:'22px',margin:'2px',padding:'2px 4px',border:'none',background:'none',cursor:'pointer',transition:'transform 0.1s'});
    btn.addEventListener('mouseenter',()=>btn.style.transform='scale(1.3)');
    btn.addEventListener('mouseleave',()=>btn.style.transform='scale(1)');
    btn.addEventListener('click',()=>{ this.addReactionButton(emoji); this.hidePicker(); });
    this.gridDiv.appendChild(btn);
  }

  filterEmojis(){
    const q = this.searchInput.value.trim();
    const filtered = q ? this.emojis.filter(e=>e.includes(q)) : this.currentCategory.slice(0,this.lazySize);
    this.gridDiv.innerHTML=''; filtered.forEach(e=>this.createEmojiButton(e));
  }

  addReactionButton(emoji){
    if(this.reactionsMap.has(emoji)) return;
    const reaction = document.createElement('div');
    reaction.className='reaction';
    reaction.innerHTML=`${emoji} <span>0</span>`;
    reaction.dataset.count=0;
    Object.assign(reaction.style,{display:'flex',alignItems:'center',gap:'4px',padding:'2px 6px',background:'#2f3136',borderRadius:'16px',cursor:'pointer',transition:'transform 0.1s'});
    reaction.addEventListener('mouseenter',()=>reaction.style.transform='scale(1.2)');
    reaction.addEventListener('mouseleave',()=>reaction.style.transform='scale(1)');
    reaction.addEventListener('click',()=>{
      let c = parseInt(reaction.dataset.count); c++; reaction.dataset.count=c;
      reaction.querySelector('span').textContent=c; this.reactionsMap.set(emoji,c);
    });
    this.reactionsDiv.insertBefore(reaction,this.pickerButton);
  }

  togglePicker(){
    this.pickerDiv.style.display==='flex'?this.hidePicker():this.showPicker();
  }

  showPicker(){
    const rect=this.pickerButton.getBoundingClientRect();
    Object.assign(this.pickerDiv.style,{left:rect.left+'px',top:rect.bottom+'px',display:'flex'});
  }

  hidePicker(){ this.pickerDiv.style.display='none'; }

  getCounts(){ return Object.fromEntries(this.reactionsMap); }
}
