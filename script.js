const API_URL = "http://localhost:8000";
let allGifts = [];
let currentPage = 1;
const itemsPerPage = 60;

async function init() {
    try {
        const response = await fetch(`${API_URL}/gifts`);
        if (!response.ok) throw new Error("Помилка мережі");
        allGifts = await response.json();
        
        if (allGifts.length === 0) {
            document.getElementById('gift-grid').innerHTML = "<p style='grid-column: 1/4'>База порожня.</p>";
        } else {
            render();
        }
    } catch (err) {
        console.error("Init error:", err);
        document.getElementById('gift-grid').innerHTML = "<p style='grid-column: 1/4; color:red;'>Сервер недоступний</p>";
    }
}

function render() {
    const grid = document.getElementById('gift-grid');
    if (!grid) return;
    grid.innerHTML = "";

    const start = (currentPage - 1) * itemsPerPage;
    const pageData = allGifts.slice(start, start + itemsPerPage);

    pageData.forEach(gift => {
        const card = document.createElement('div');
        card.className = 'gift-card';
        
        let colors = ["#2c2c2e"];
        try {
            colors = typeof gift.backdrop_colors === 'string' ? JSON.parse(gift.backdrop_colors) : gift.backdrop_colors;
        } catch (e) { console.error("Color parse error"); }
        
        card.style.background = colors[0];

        // Фільтр для заміни неробочих посилань на тестові, які підтримують CORS
        const modelUrl = (gift.model_url && gift.model_url.includes('marketapp.ws')) 
            ? "https://assets3.lottiefiles.com/packages/lf20_myejig9o.json" 
            : gift.model_url;

        card.innerHTML = `
            <lottie-player 
                src="${modelUrl}" 
                background="transparent" 
                speed="1" 
                style="width: 100%; height: 100%;" 
                loop 
                autoplay>
            </lottie-player>
        `;
        
        card.onclick = () => selectGift(gift);
        grid.appendChild(card);
    });

    document.getElementById('page-info').innerText = `${currentPage} / ${Math.ceil(allGifts.length / itemsPerPage)}`;
}

async function setTab(type) {
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(b => b.classList.remove('active'));
    
    // Знаходимо кнопку через event або текст
    if (event) event.target.classList.add('active');

    const grid = document.getElementById('gift-grid');
    grid.innerHTML = "Завантаження...";

    if (type === 'gifts') {
        render();
    } else {
        try {
            const response = await fetch(`${API_URL}/attributes`);
            const allAttrs = await response.json();
            
            const filtered = allAttrs.filter(a => 
                type === 'bg' ? a.trait_type === 'Background' : a.trait_type === 'Symbol'
            );

            grid.innerHTML = "";
            filtered.forEach(attr => {
                const card = document.createElement('div');
                card.className = 'gift-card';
                if (type === 'bg') {
                    card.style.background = attr.value;
                } else {
                    card.style.display = "flex";
                    card.style.alignItems = "center";
                    card.style.justifyContent = "center";
                    card.innerText = attr.value;
                }
                grid.appendChild(card);
            });
        } catch (e) {
            grid.innerHTML = "Помилка завантаження атрибутів";
        }
    }
}

function selectGift(gift) {
    const bg = document.getElementById('main-bg');
    const pattern = document.getElementById('main-pattern');
    const player = document.getElementById('main-player');

    let colors = typeof gift.backdrop_colors === 'string' ? JSON.parse(gift.backdrop_colors) : gift.backdrop_colors;

    bg.style.background = colors.length > 1 
        ? `linear-gradient(45deg, ${colors.join(',')})`
        : colors[0];
    
    pattern.style.backgroundImage = `url(${gift.pattern_url})`;
    player.setAttribute('src', gift.model_url);
}

function changePage(step) {
    const maxPage = Math.ceil(allGifts.length / itemsPerPage);
    if (currentPage + step < 1 || currentPage + step > maxPage) return;
    
    currentPage += step;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Запуск
init();
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
}
