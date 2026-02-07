// Firebase Config
        const firebaseConfig = {
            apiKey: "AIzaSyBiIITaYLK6P4soMF0ThGcGRY3LQ9dQDY4",
            authDomain: "million-logo-page.firebaseapp.com",
            projectId: "million-logo-page",
            storageBucket: "million-logo-page.firebasestorage.app",
            messagingSenderId: "224485393689",
            appId: "1:224485393689:web:85fa9f811071995cbef188",
            measurementId: "G-TR1VSBG8LT"
        };

        let db;
        try {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
        } catch (e) {
            console.log("Firebase init:", e);
        }

        // Language System
        let currentLang = 'en';

        function toggleLanguage() {
            currentLang = currentLang === 'en' ? 'ar' : 'en';
            document.documentElement.lang = currentLang;
            document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
            document.body.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
            
            // Update language button with flag
            document.getElementById('langIcon').textContent = currentLang === 'ar' ? '🇯🇴' : '🇺🇸';
            document.getElementById('langText').textContent = currentLang === 'ar' ? 'العربية' : 'English';
            
            document.querySelectorAll('[data-en]').forEach(el => {
                el.textContent = el.getAttribute(`data-${currentLang}`);
            });
            
            // Update search placeholder
            const searchInput = document.getElementById('searchInput');
            searchInput.placeholder = searchInput.getAttribute(`data-placeholder-${currentLang}`);
        }

        // Welcome Banner
        function showWelcome() {
            if (!localStorage.getItem('welcomeShown')) {
                setTimeout(() => {
                    document.getElementById('welcomeBanner').classList.remove('hidden');
                }, 2000);
            }
        }
        
        function closeWelcome() {
            document.getElementById('welcomeBanner').classList.add('hidden');
            localStorage.setItem('welcomeShown', 'true');
        }

        // FAQ Toggle
        function toggleFaq(element) {
            const item = element.parentElement;
            item.classList.toggle('open');
        }

        // Canvas Grid System
        let cellsData = {};
        let selectedCellId = null;
        let uploadedImageBase64 = null;
        
        // Canvas variables
        const GRID_COLS = 1000;
        const GRID_ROWS = 1000;
        const TOTAL_CELLS = GRID_COLS * GRID_ROWS; // 1,000,000 cells!
        const BASE_CELL_SIZE = 10;
        
        let canvas, ctx, miniCanvas, miniCtx;
        let zoom = 1;
        let offsetX = 0, offsetY = 0;
        let isDragging = false;
        let dragStartX, dragStartY;
        let loadedImages = {};
        let hoveredCell = null;
        
        async function loadCells() {
            if (!db) return;
            
            try {
                const snapshot = await db.collection('cells').get();
                snapshot.forEach(doc => {
                    cellsData[doc.id] = doc.data();
                });
                initCanvas();
            } catch (error) {
                console.error('Error loading cells:', error);
                initCanvas();
            }
        }
        
        function initCanvas() {
            canvas = document.getElementById('gridCanvas');
            ctx = canvas.getContext('2d');
            miniCanvas = document.getElementById('miniMapCanvas');
            miniCtx = miniCanvas.getContext('2d');
            
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            
            // Mouse events
            canvas.addEventListener('mousedown', handleMouseDown);
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('mouseup', handleMouseUp);
            canvas.addEventListener('mouseleave', handleMouseLeave);
            canvas.addEventListener('wheel', handleWheel);
            canvas.addEventListener('click', handleClick);
            
            // Touch events for mobile
            canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
            canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
            canvas.addEventListener('touchend', handleTouchEnd);
            
            // Load sold cell images
            preloadImages();
            
            // Initial render
            renderGrid();
            renderMiniMap();
            updateStats();
        }
        
        function resizeCanvas() {
            const container = document.getElementById('canvasContainer');
            const width = container.clientWidth;
            const height = Math.min(600, window.innerHeight * 0.6);
            
            canvas.width = width;
            canvas.height = height;
            
            miniCanvas.width = 120;
            miniCanvas.height = 120;
            
            renderGrid();
            renderMiniMap();
        }
        
        function preloadImages() {
            Object.entries(cellsData).forEach(([id, data]) => {
                if (data.imageBase64 && data.status === 'active') {
                    const img = new Image();
                    img.onload = () => {
                        loadedImages[id] = img;
                        renderGrid();
                    };
                    img.src = data.imageBase64;
                }
            });
        }
        
        function renderGrid() {
            if (!ctx) return;
            
            // أعلى جودة للصور - وضوح ممتاز
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // تحسين إضافي للوضوح
            ctx.globalCompositeOperation = 'source-over';
            
            const cellSize = BASE_CELL_SIZE * zoom;
            
            // تحميل الصور المرئية فقط (Lazy Loading)
            loadVisibleImages();
            
            // Clear canvas
            ctx.fillStyle = '#0f0f1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Calculate visible area
            const startCol = Math.max(0, Math.floor(-offsetX / cellSize));
            const startRow = Math.max(0, Math.floor(-offsetY / cellSize));
            const endCol = Math.min(GRID_COLS, Math.ceil((canvas.width - offsetX) / cellSize));
            const endRow = Math.min(GRID_ROWS, Math.ceil((canvas.height - offsetY) / cellSize));
            
            // Draw cells
            for (let row = startRow; row < endRow; row++) {
                for (let col = startCol; col < endCol; col++) {
                    const cellId = row * GRID_COLS + col;
                    const x = col * cellSize + offsetX;
                    const y = row * cellSize + offsetY;
                    
                    const cellData = cellsData[cellId.toString()];
                    
                    if (cellData && cellData.status === 'active') {
                        // Sold cell
                        if (loadedImages[cellId.toString()]) {
                            ctx.drawImage(loadedImages[cellId.toString()], x, y, cellSize - 1, cellSize - 1);
                        } else {
                            // Gradient for cells without loaded images
                            const gradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                            gradient.addColorStop(0, '#8b5cf6');
                            gradient.addColorStop(1, '#ec4899');
                            ctx.fillStyle = gradient;
                            ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
                        }
                    } else {
                        // Available cell
                        ctx.fillStyle = '#1e1e3f';
                        ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
                        
                        // Subtle border
                        ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
                        ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
                    }
                    
                    // Highlight hovered cell - رسم مكبّر للوضوح
                    if (hoveredCell === cellId) {
                        // رسم إطار مميز
                        ctx.strokeStyle = '#8b5cf6';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, cellSize - 1, cellSize - 1);
                        ctx.lineWidth = 1;
                        
                        // إذا كانت الخانة مباعة، نرسم صورة مكبّرة فوقها
                        if (cellData && cellData.status === 'active' && loadedImages[cellId.toString()] && zoom < 3) {
                            const enlargedSize = cellSize * 3;
                            const enlargedX = x - cellSize;
                            const enlargedY = y - cellSize;
                            
                            // خلفية
                            ctx.fillStyle = 'rgba(22, 22, 42, 0.95)';
                            ctx.fillRect(enlargedX - 2, enlargedY - 2, enlargedSize + 4, enlargedSize + 4);
                            
                            // إطار
                            ctx.strokeStyle = '#8b5cf6';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(enlargedX - 2, enlargedY - 2, enlargedSize + 4, enlargedSize + 4);
                            ctx.lineWidth = 1;
                            
                            // الصورة المكبّرة
                            ctx.drawImage(loadedImages[cellId.toString()], enlargedX, enlargedY, enlargedSize, enlargedSize);
                        }
                    }
                }
            }
            
            // Update zoom display
            document.getElementById('zoomLevel').textContent = Math.round(zoom * 100) + '%';
            
            // Update viewport indicator on mini map
            updateViewportIndicator();
        }
        
        function renderMiniMap() {
            if (!miniCtx) return;
            
            const miniCellSize = 120 / GRID_COLS;
            
            // Clear
            miniCtx.fillStyle = '#0f0f1a';
            miniCtx.fillRect(0, 0, 120, 120);
            
            // Draw sold cells as dots
            Object.entries(cellsData).forEach(([id, data]) => {
                if (data.status === 'active') {
                    const cellId = parseInt(id);
                    const col = cellId % GRID_COLS;
                    const row = Math.floor(cellId / GRID_COLS);
                    
                    miniCtx.fillStyle = '#8b5cf6';
                    miniCtx.fillRect(col * miniCellSize, row * miniCellSize, Math.max(1, miniCellSize), Math.max(1, miniCellSize));
                }
            });
        }
        
        function updateViewportIndicator() {
            const indicator = document.getElementById('viewportIndicator');
            const cellSize = BASE_CELL_SIZE * zoom;
            const gridPixelSize = GRID_COLS * cellSize;
            
            const viewWidth = (canvas.width / gridPixelSize) * 120;
            const viewHeight = (canvas.height / gridPixelSize) * 120;
            const viewX = (-offsetX / gridPixelSize) * 120;
            const viewY = (-offsetY / gridPixelSize) * 120;
            
            indicator.style.width = Math.min(120, viewWidth) + 'px';
            indicator.style.height = Math.min(120, viewHeight) + 'px';
            indicator.style.left = Math.max(0, Math.min(120 - viewWidth, viewX)) + 'px';
            indicator.style.top = Math.max(0, Math.min(120 - viewHeight, viewY)) + 'px';
        }
        
        function updateStats() {
            const soldCount = Object.values(cellsData).filter(c => c.status === 'active').length;
            document.getElementById('soldCount').textContent = soldCount.toLocaleString();
            document.getElementById('availableCount').textContent = (TOTAL_CELLS - soldCount).toLocaleString();
            
            // Update progress bar
            const percent = (soldCount / TOTAL_CELLS) * 100;
            const progressBar = document.getElementById('progressBar');
            const progressPercent = document.getElementById('progressPercent');
            const soldCountSmall = document.getElementById('soldCountSmall');
            
            if (progressBar) {
                progressBar.style.width = Math.max(percent, 0.01) + '%';
            }
            if (progressPercent) {
                progressPercent.textContent = percent.toFixed(4) + '%';
            }
            if (soldCountSmall) {
                soldCountSmall.textContent = soldCount.toLocaleString();
            }
        }
        
        // Mouse handlers
        function handleMouseDown(e) {
            isDragging = true;
            dragStartX = e.clientX - offsetX;
            dragStartY = e.clientY - offsetY;
            canvas.style.cursor = 'grabbing';
        }
        
        function handleMouseMove(e) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const cellSize = BASE_CELL_SIZE * zoom;
            const col = Math.floor((mouseX - offsetX) / cellSize);
            const row = Math.floor((mouseY - offsetY) / cellSize);
            const cellId = row * GRID_COLS + col;
            
            // Update coordinates display
            if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
                document.getElementById('coordsDisplay').textContent = `X: ${col}, Y: ${row} | Cell: #${cellId.toLocaleString()}`;
                
                // Update hovered cell
                if (hoveredCell !== cellId) {
                    hoveredCell = cellId;
                    renderGrid();
                    
                    // Show tooltip for sold cells
                    const cellData = cellsData[cellId.toString()];
                    if (cellData && cellData.status === 'active') {
                        showTooltip(e.clientX, e.clientY, cellData, cellId);
                    } else {
                        hideTooltip();
                    }
                }
            }
            
            if (isDragging) {
                offsetX = e.clientX - dragStartX;
                offsetY = e.clientY - dragStartY;
                constrainOffset();
                renderGrid();
                hideTooltip();
            }
        }
        
        function handleMouseUp() {
            isDragging = false;
            canvas.style.cursor = 'crosshair';
        }
        
        function handleMouseLeave() {
            isDragging = false;
            hoveredCell = null;
            hideTooltip();
            renderGrid();
        }
        
        function handleWheel(e) {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.max(0.5, Math.min(10, zoom * zoomFactor));
            
            // Zoom toward mouse position
            const worldX = (mouseX - offsetX) / zoom;
            const worldY = (mouseY - offsetY) / zoom;
            
            zoom = newZoom;
            
            offsetX = mouseX - worldX * zoom;
            offsetY = mouseY - worldY * zoom;
            
            constrainOffset();
            renderGrid();
            hideTooltip();
        }
        
        function handleClick(e) {
            if (isDragging) return;
            
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const cellSize = BASE_CELL_SIZE * zoom;
            const col = Math.floor((mouseX - offsetX) / cellSize);
            const row = Math.floor((mouseY - offsetY) / cellSize);
            const cellId = row * GRID_COLS + col;
            
            if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
                const cellData = cellsData[cellId.toString()];
                if (cellData && cellData.status === 'active') {
                    showCellDetails(cellData, cellId);
                } else {
                    openClaimModal(cellId);
                }
            }
        }
        
        // Touch handlers
        let lastTouchDistance = 0;
        let selectMode = false;
        let touchStartTime = 0;
        let touchStartX = 0;
        let touchStartY = 0;
        
        function toggleSelectMode() {
            selectMode = !selectMode;
            const btn = document.getElementById('selectModeBtn');
            const hint = document.getElementById('mobileHint');
            
            if (selectMode) {
                btn.classList.add('active');
                btn.innerHTML = '✓ <span data-en="Selecting..." data-ar="جاري الاختيار...">Selecting...</span>';
                if (hint) hint.textContent = currentLang === 'ar' ? '👆 الآن انقر على أي خانة' : '👆 Now tap any cell';
                // Auto zoom for easier selection
                if (zoom < 3) {
                    zoom = 4;
                    constrainOffset();
                    renderGrid();
                }
                showToast(currentLang === 'ar' ? 'انقر على الخانة المطلوبة' : 'Tap on the cell you want');
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '🎯 <span data-en="Select" data-ar="اختيار">Select</span>';
                if (hint) hint.textContent = currentLang === 'ar' ? '👆 اضغط "اختيار" ثم اختر خانة' : '👆 Tap "Select" then tap a cell';
            }
        }
        
        function selectRandomCell() {
            // Find a random available cell
            let attempts = 0;
            let randomId;
            
            do {
                randomId = Math.floor(Math.random() * TOTAL_CELLS);
                attempts++;
            } while (cellsData[randomId.toString()]?.status === 'active' && attempts < 100);
            
            // Navigate to the cell
            const col = randomId % GRID_COLS;
            const row = Math.floor(randomId / GRID_COLS);
            
            zoom = 5;
            const cellSize = BASE_CELL_SIZE * zoom;
            offsetX = canvas.width / 2 - col * cellSize;
            offsetY = canvas.height / 2 - row * cellSize;
            constrainOffset();
            renderGrid();
            
            // Open claim modal
            setTimeout(() => {
                openClaimModal(randomId);
            }, 300);
        }
        
        // Browse Random Story - عرض قصة عشوائية من الخانات المباعة
        function browseRandomStory() {
            const soldCells = Object.entries(cellsData).filter(([id, data]) => data.status === 'active');
            
            if (soldCells.length === 0) {
                showToast(currentLang === 'ar' ? 'لا توجد قصص بعد! كن الأول 🚀' : 'No stories yet! Be the first 🚀');
                return;
            }
            
            // اختر قصة عشوائية
            const randomIndex = Math.floor(Math.random() * soldCells.length);
            const [cellId, cellData] = soldCells[randomIndex];
            
            // انتقل للخانة على الشبكة
            const col = parseInt(cellId) % GRID_COLS;
            const row = Math.floor(parseInt(cellId) / GRID_COLS);
            
            zoom = 5;
            const cellSize = BASE_CELL_SIZE * zoom;
            offsetX = canvas.width / 2 - col * cellSize;
            offsetY = canvas.height / 2 - row * cellSize;
            constrainOffset();
            renderGrid();
            
            // اعرض تفاصيل القصة
            setTimeout(() => {
                showCellDetails(cellData, cellId);
            }, 300);
        }
        
        function handleTouchStart(e) {
            e.preventDefault();
            touchStartTime = Date.now();
            
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                isDragging = true;
                dragStartX = e.touches[0].clientX - offsetX;
                dragStartY = e.touches[0].clientY - offsetY;
            } else if (e.touches.length === 2) {
                isDragging = false;
                lastTouchDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        }
        
        function handleTouchMove(e) {
            e.preventDefault();
            if (e.touches.length === 1 && isDragging) {
                const moveX = Math.abs(e.touches[0].clientX - touchStartX);
                const moveY = Math.abs(e.touches[0].clientY - touchStartY);
                
                // Only pan if moved more than 10px (not a tap)
                if (moveX > 10 || moveY > 10) {
                    offsetX = e.touches[0].clientX - dragStartX;
                    offsetY = e.touches[0].clientY - dragStartY;
                    constrainOffset();
                    renderGrid();
                }
            } else if (e.touches.length === 2) {
                const distance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const zoomFactor = distance / lastTouchDistance;
                zoom = Math.max(0.5, Math.min(10, zoom * zoomFactor));
                lastTouchDistance = distance;
                constrainOffset();
                renderGrid();
            }
        }
        
        function handleTouchEnd(e) {
            const touchDuration = Date.now() - touchStartTime;
            const touch = e.changedTouches[0];
            const moveX = Math.abs(touch.clientX - touchStartX);
            const moveY = Math.abs(touch.clientY - touchStartY);
            
            // Detect tap (short touch, minimal movement)
            if (touchDuration < 300 && moveX < 15 && moveY < 15) {
                const rect = canvas.getBoundingClientRect();
                const touchX = touch.clientX - rect.left;
                const touchY = touch.clientY - rect.top;
                
                const cellSize = BASE_CELL_SIZE * zoom;
                const col = Math.floor((touchX - offsetX) / cellSize);
                const row = Math.floor((touchY - offsetY) / cellSize);
                const cellId = row * GRID_COLS + col;
                
                if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
                    const cellData = cellsData[cellId.toString()];
                    
                    if (cellData && cellData.status === 'active') {
                        // If in select mode or second tap, show details
                        if (selectMode || lastTappedCell === cellId) {
                            showCellDetails(cellData, cellId);
                            lastTappedCell = null;
                        } else {
                            // First tap - show tooltip
                            showMobileTooltip(touch.clientX, touch.clientY, cellData, cellId);
                            lastTappedCell = cellId;
                            
                            // Auto-hide tooltip after 3 seconds
                            setTimeout(() => {
                                hideTooltip();
                                if (lastTappedCell === cellId) lastTappedCell = null;
                            }, 3000);
                        }
                    } else {
                        // Available cell - open claim modal
                        if (selectMode || window.innerWidth < 768) {
                            openClaimModal(cellId);
                        }
                    }
                    
                    // Turn off select mode after selection
                    if (selectMode) {
                        toggleSelectMode();
                    }
                }
            }
            
            isDragging = false;
        }
        
        let lastTappedCell = null;
        
        function showMobileTooltip(x, y, data, cellId) {
            const tooltip = document.getElementById('cellTooltip');
            const likes = data.likes || 0;
            const comments = data.comments || [];
            const dateStr = data.specialDate ? new Date(data.specialDate).toLocaleDateString() : '';
            const storyPreview = data.story ? (data.story.length > 50 ? data.story.substring(0, 50) + '...' : data.story) : '';
            
            tooltip.innerHTML = `
                ${data.imageBase64 ? `<img src="${data.imageBase64}" alt="${data.name}">` : '<div style="width:80px;height:80px;margin:0 auto 0.75rem;border-radius:0.75rem;background:linear-gradient(135deg,#8b5cf6,#ec4899);display:flex;align-items:center;justify-content:center;font-size:2rem;">🎯</div>'}
                <div class="tooltip-name">${data.name || 'Anonymous'}</div>
                <div class="tooltip-cell-id">Cell #${cellId.toLocaleString()}</div>
                ${dateStr ? `<div class="tooltip-date">📅 ${dateStr}</div>` : ''}
                ${storyPreview ? `<div class="tooltip-story">"${storyPreview}"</div>` : ''}
                <div class="tooltip-stats">
                    <div class="tooltip-stat likes">❤️ ${likes}</div>
                    <div class="tooltip-stat comments">💬 ${comments.length}</div>
                </div>
                <div class="tooltip-hint" style="color:#a78bfa;font-weight:600;">${currentLang === 'ar' ? '👆 اضغط مرة ثانية للتفاصيل' : '👆 Tap again for details'}</div>
            `;
            
            // Center tooltip on mobile
            const tooltipWidth = 240;
            let left = x - tooltipWidth / 2;
            let top = y - 220;
            
            // Keep on screen
            if (left < 10) left = 10;
            if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;
            if (top < 10) top = y + 30;
            
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
            tooltip.classList.remove('hidden');
        }
        
        function constrainOffset() {
            const cellSize = BASE_CELL_SIZE * zoom;
            const gridWidth = GRID_COLS * cellSize;
            const gridHeight = GRID_ROWS * cellSize;
            
            offsetX = Math.max(canvas.width - gridWidth, Math.min(0, offsetX));
            offsetY = Math.max(canvas.height - gridHeight, Math.min(0, offsetY));
        }
        
        // Zoom controls
        function zoomIn() {
            zoom = Math.min(10, zoom * 1.3);
            constrainOffset();
            renderGrid();
        }
        
        function zoomOut() {
            zoom = Math.max(0.5, zoom * 0.7);
            constrainOffset();
            renderGrid();
        }
        
        function resetView() {
            zoom = 1;
            offsetX = 0;
            offsetY = 0;
            renderGrid();
        }
        
        // Tooltip
        function showTooltip(x, y, data, cellId) {
            const tooltip = document.getElementById('cellTooltip');
            const likes = data.likes || 0;
            const comments = data.comments || [];
            const dateStr = data.specialDate ? new Date(data.specialDate).toLocaleDateString() : '';
            const storyPreview = data.story ? (data.story.length > 60 ? data.story.substring(0, 60) + '...' : data.story) : '';
            
            tooltip.innerHTML = `
                ${data.imageBase64 ? `<img src="${data.imageBase64}" alt="${data.name}">` : '<div style="width:80px;height:80px;margin:0 auto 0.75rem;border-radius:0.75rem;background:linear-gradient(135deg,#8b5cf6,#ec4899);display:flex;align-items:center;justify-content:center;font-size:2rem;">🎯</div>'}
                <div class="tooltip-name">${data.name || 'Anonymous'}</div>
                <div class="tooltip-cell-id">Cell #${cellId.toLocaleString()}</div>
                ${dateStr ? `<div class="tooltip-date">📅 ${dateStr}</div>` : ''}
                ${storyPreview ? `<div class="tooltip-story">"${storyPreview}"</div>` : ''}
                <div class="tooltip-stats">
                    <div class="tooltip-stat likes">❤️ ${likes}</div>
                    <div class="tooltip-stat comments">💬 ${comments.length}</div>
                </div>
                <div class="tooltip-hint">${currentLang === 'ar' ? 'اضغط لمشاهدة التفاصيل' : 'Click to view details'}</div>
            `;
            
            // Position tooltip smartly
            const rect = document.getElementById('canvasContainer').getBoundingClientRect();
            let left = x + 15;
            let top = y + 15;
            
            // Adjust if tooltip goes off screen
            if (left + 260 > window.innerWidth) {
                left = x - 270;
            }
            if (top + 300 > window.innerHeight) {
                top = y - 200;
            }
            
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
            tooltip.classList.remove('hidden');
        }
        
        function hideTooltip() {
            document.getElementById('cellTooltip').classList.add('hidden');
        }

        // Search Functionality
        function searchCells(query) {
            const searchResults = document.getElementById('searchResults');
            const resultsList = document.getElementById('searchResultsList');
            const clearBtn = document.getElementById('clearSearchBtn');
            
            if (!query.trim()) {
                searchResults.classList.add('hidden');
                clearBtn.classList.add('hidden');
                return;
            }
            
            clearBtn.classList.remove('hidden');
            
            const results = Object.entries(cellsData)
                .filter(([id, data]) => 
                    data.name && data.name.toLowerCase().includes(query.toLowerCase()) && data.status === 'active'
                )
                .slice(0, 8);
            
            if (results.length === 0) {
                searchResults.classList.add('hidden');
                return;
            }
            
            searchResults.classList.remove('hidden');
            resultsList.innerHTML = results.map(([id, data]) => `
                <div class="bg-white/5 p-3 rounded-lg cursor-pointer hover:bg-white/10 transition" onclick="showCellDetails(cellsData['${id}'], ${id}); clearSearch();">
                    <div class="flex items-center gap-3">
                        ${data.imageBase64 
                            ? `<img src="${data.imageBase64}" class="w-10 h-10 rounded-lg object-cover">`
                            : `<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500"></div>`
                        }
                        <div class="overflow-hidden">
                            <div class="font-semibold text-white text-sm truncate">${data.name}</div>
                            <div class="text-gray-500 text-xs">Cell #${id}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        function clearSearch() {
            document.getElementById('searchInput').value = '';
            document.getElementById('searchResults').classList.add('hidden');
            document.getElementById('clearSearchBtn').classList.add('hidden');
        }

        // Modal Functions
        function openClaimModal(cellId) {
            selectedCellId = cellId;
            document.getElementById('selectedCellId').textContent = cellId;
            document.getElementById('claimModal').classList.remove('hidden');
            document.getElementById('claimModal').classList.add('flex');
            document.body.style.overflow = 'hidden';
            showStep(1);
            resetForm();
        }

        function closeClaimModal() {
            document.getElementById('claimModal').classList.add('hidden');
            document.getElementById('claimModal').classList.remove('flex');
            document.body.style.overflow = '';
        }

        function showStep(step) {
            document.querySelectorAll('.step-content').forEach(s => s.classList.add('hidden'));
            document.getElementById(`step${step}`).classList.remove('hidden');
            
            for (let i = 1; i <= 3; i++) {
                const dot = document.getElementById(`stepDot${i}`);
                dot.className = `w-2.5 h-2.5 rounded-full ${i <= step ? 'bg-purple-500' : 'bg-gray-600'}`;
            }
            
            const icons = { 1: '✨', 2: '💳', 3: '🎉' };
            const titlesEn = { 1: 'Share Your Story', 2: 'Complete Payment', 3: 'Success!' };
            const titlesAr = { 1: 'شارك قصتك', 2: 'أكمل الدفع', 3: 'تم بنجاح!' };
            
            document.getElementById('stepIcon').textContent = icons[step];
            const titleEl = document.getElementById('stepTitle');
            titleEl.setAttribute('data-en', titlesEn[step]);
            titleEl.setAttribute('data-ar', titlesAr[step]);
            titleEl.textContent = currentLang === 'ar' ? titlesAr[step] : titlesEn[step];
        }

        function resetForm() {
            document.getElementById('userName').value = '';
            document.getElementById('specialDate').value = '';
            document.getElementById('userStory').value = '';
            document.getElementById('uploadPlaceholder').classList.remove('hidden');
            document.getElementById('uploadPreview').classList.add('hidden');
            document.getElementById('uploadZone').classList.remove('has-image');
            uploadedImageBase64 = null;
        }

        function goToPayment() {
            const name = document.getElementById('userName').value.trim();
            const story = document.getElementById('userStory').value.trim();

            if (!name) { showToast(currentLang === 'ar' ? 'أدخل اسمك' : 'Please enter your name'); return; }
            if (!story) { showToast(currentLang === 'ar' ? 'شارك قصتك' : 'Please share your story'); return; }
            if (!uploadedImageBase64) { showToast(currentLang === 'ar' ? 'ارفع صورة' : 'Please upload an image'); return; }

            showStep(2);
        }

        function goBack() { showStep(1); }

        // Image Upload
        function handleImageUpload(input) {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                
                if (file.size > 500 * 1024) {
                    compressImage(file);
                } else {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        uploadedImageBase64 = e.target.result;
                        showImagePreview(uploadedImageBase64);
                    };
                    reader.readAsDataURL(file);
                }
            }
        }

        function compressImage(file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // حجم كبير لوضوح ممتاز (لكن ليس كبير جداً للحفاظ على السرعة)
                    const maxDim = 800;
                    if (width > height && width > maxDim) {
                        height = (height * maxDim) / width;
                        width = maxDim;
                    } else if (height > maxDim) {
                        width = (width * maxDim) / height;
                        height = maxDim;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    
                    // أعلى جودة رسم
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // جودة عالية جداً 95%
                    uploadedImageBase64 = canvas.toDataURL('image/jpeg', 0.95);
                    showImagePreview(uploadedImageBase64);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
        
        // ═══════════════════════════════════════════════════════════
        // نظام تحميل الصور الذكي - Lazy Loading مع أعلى جودة
        // ═══════════════════════════════════════════════════════════
        
        const MAX_CACHED_IMAGES = 200; // حد أقصى للصور المحملة
        const imageLoadQueue = []; // قائمة انتظار التحميل
        let isLoadingImages = false;
        
        // تحميل الصور المرئية فقط
        function loadVisibleImages() {
            if (!ctx) return;
            
            const cellSize = BASE_CELL_SIZE * zoom;
            const startCol = Math.max(0, Math.floor(-offsetX / cellSize));
            const startRow = Math.max(0, Math.floor(-offsetY / cellSize));
            const endCol = Math.min(GRID_COLS, Math.ceil((canvas.width - offsetX) / cellSize));
            const endRow = Math.min(GRID_ROWS, Math.ceil((canvas.height - offsetY) / cellSize));
            
            // جمع الخانات المرئية التي تحتاج تحميل
            const visibleCells = [];
            for (let row = startRow; row < endRow; row++) {
                for (let col = startCol; col < endCol; col++) {
                    const cellId = row * GRID_COLS + col;
                    const cellData = cellsData[cellId.toString()];
                    
                    if (cellData && cellData.status === 'active' && cellData.imageBase64 && !loadedImages[cellId.toString()]) {
                        visibleCells.push({ id: cellId.toString(), data: cellData });
                    }
                }
            }
            
            // تحميل الصور المرئية
            visibleCells.forEach(cell => {
                if (!loadedImages[cell.id]) {
                    loadImageAsync(cell.id, cell.data.imageBase64);
                }
            });
            
            // تنظيف الصور غير المرئية إذا تجاوزنا الحد
            cleanupOldImages(startCol, startRow, endCol, endRow);
        }
        
        function loadImageAsync(id, base64) {
            const img = new Image();
            img.onload = () => {
                loadedImages[id] = img;
                renderGrid(); // إعادة الرسم لإظهار الصورة
            };
            img.src = base64;
        }
        
        function cleanupOldImages(startCol, startRow, endCol, endRow) {
            const keys = Object.keys(loadedImages);
            if (keys.length <= MAX_CACHED_IMAGES) return;
            
            // حذف الصور البعيدة عن المنطقة المرئية
            const toRemove = [];
            keys.forEach(id => {
                const cellId = parseInt(id);
                const col = cellId % GRID_COLS;
                const row = Math.floor(cellId / GRID_COLS);
                
                // إذا كانت الصورة بعيدة جداً
                if (col < startCol - 50 || col > endCol + 50 || row < startRow - 50 || row > endRow + 50) {
                    toRemove.push(id);
                }
            });
            
            // حذف أقدم الصور
            toRemove.slice(0, toRemove.length - MAX_CACHED_IMAGES + 50).forEach(id => {
                delete loadedImages[id];
            });
        }

        function showImagePreview(src) {
            document.getElementById('previewImage').src = src;
            document.getElementById('uploadPlaceholder').classList.add('hidden');
            document.getElementById('uploadPreview').classList.remove('hidden');
            document.getElementById('uploadZone').classList.add('has-image');
            showToast(currentLang === 'ar' ? 'تم رفع الصورة ✓' : 'Image uploaded! ✓');
        }

        // Submit Cell
        async function submitCell() {
            const btn = document.getElementById('submitBtn');
            btn.innerHTML = '<div class="loading-spinner"></div>';
            btn.disabled = true;

            const cellData = {
                cellId: selectedCellId,
                name: document.getElementById('userName').value.trim(),
                specialDate: document.getElementById('specialDate').value,
                story: document.getElementById('userStory').value.trim(),
                imageBase64: uploadedImageBase64,
                status: 'active',
                paid: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
            };

            try {
                if (db) {
                    await db.collection('cells').doc(selectedCellId.toString()).set(cellData);
                }
                
                document.getElementById('confirmedCellId').textContent = selectedCellId;
                showStep(3);
                
                cellsData[selectedCellId.toString()] = cellData;
                generateGrid();
                loadFoundingWall();
                
            } catch (error) {
                console.error('Error:', error);
                showToast(currentLang === 'ar' ? 'خطأ، حاول مرة أخرى' : 'Error. Please try again.');
            }

            btn.innerHTML = '<span data-en="Confirm ⚡" data-ar="تأكيد ⚡">Confirm ⚡</span>';
            btn.disabled = false;
        }

        // View Cell Details with Likes & Comments
        function showCellDetails(data, cellId) {
            const content = document.getElementById('viewContent');
            const dateStr = data.specialDate ? new Date(data.specialDate).toLocaleDateString() : '';
            const shareUrl = `${window.location.origin}${window.location.pathname}?cell=${cellId}`;
            const shareText = currentLang === 'ar' 
                ? `شاهد خانتي في الصفحة المليون شعار! 🎯` 
                : `Check out my cell on The Million Logo Page! 🎯`;
            
            // Get likes and comments from data or initialize
            const likes = data.likes || 0;
            const comments = data.comments || [];
            const hasLiked = localStorage.getItem(`liked_${cellId}`) === 'true';
            
            content.innerHTML = `
                <div class="text-center">
                    ${data.imageBase64 
                        ? `<img src="${data.imageBase64}" class="w-28 h-28 rounded-2xl mx-auto object-cover border-2 border-purple-500/30 shadow-lg">`
                        : `<div class="w-28 h-28 rounded-2xl mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-4xl">🎯</div>`
                    }
                    
                    <h3 class="text-xl font-bold mt-4 text-white">${data.name || 'Anonymous'}</h3>
                    <p class="text-gray-500 text-xs mt-1">Cell #${cellId.toLocaleString()}</p>
                </div>
                
                <div class="mt-5 space-y-3">
                    ${dateStr ? `
                    <div class="bg-white/5 p-3 rounded-xl">
                        <div class="text-xs text-gray-500 mb-1">📅 ${currentLang === 'ar' ? 'تاريخ مهم' : 'Special Date'}</div>
                        <div class="text-white text-sm">${dateStr}</div>
                    </div>
                    ` : ''}
                    
                    ${data.story ? `
                    <div class="bg-white/5 p-3 rounded-xl">
                        <div class="text-xs text-gray-500 mb-1">📖 ${currentLang === 'ar' ? 'القصة' : 'Story'}</div>
                        <div class="text-gray-300 text-sm leading-relaxed">${data.story}</div>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Likes & Comments Section -->
                <div class="mt-5 pt-4 border-t border-white/10">
                    <!-- Like Button & Stats -->
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-4">
                            <button onclick="toggleLike('${cellId}')" id="likeBtn_${cellId}" 
                                class="flex items-center gap-2 ${hasLiked ? 'bg-pink-500/30 text-pink-400' : 'bg-white/5 text-gray-400 hover:text-pink-400 hover:bg-pink-500/20'} px-4 py-2 rounded-full transition-all transform hover:scale-105 active:scale-95">
                                <span class="text-lg">${hasLiked ? '❤️' : '🤍'}</span>
                                <span id="likeCount_${cellId}" class="font-semibold">${likes}</span>
                            </button>
                            <div class="flex items-center gap-2 text-gray-400">
                                <span>💬</span>
                                <span id="commentCount_${cellId}">${comments.length}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Comments List -->
                    <div class="bg-white/5 rounded-xl p-3 mb-3 max-h-32 overflow-y-auto" id="commentsList_${cellId}">
                        ${comments.length > 0 ? comments.map(c => `
                            <div class="flex items-start gap-2 mb-2 last:mb-0">
                                <div class="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs flex-shrink-0">${c.name ? c.name.charAt(0).toUpperCase() : '👤'}</div>
                                <div class="flex-1 min-w-0">
                                    <span class="text-purple-400 text-xs font-semibold">${c.name || 'زائر'}</span>
                                    <p class="text-gray-300 text-sm break-words">${c.text}</p>
                                </div>
                            </div>
                        `).join('') : `
                            <p class="text-gray-500 text-xs text-center py-2">${currentLang === 'ar' ? 'لا توجد تعليقات بعد. كن أول من يعلّق!' : 'No comments yet. Be the first!'}</p>
                        `}
                    </div>
                    
                    <!-- Add Comment -->
                    <div class="flex gap-2">
                        <input type="text" id="commentName_${cellId}" 
                            class="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-purple-500 outline-none"
                            placeholder="${currentLang === 'ar' ? 'اسمك' : 'Name'}">
                        <input type="text" id="commentText_${cellId}" 
                            class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 outline-none"
                            placeholder="${currentLang === 'ar' ? 'اكتب تعليقاً...' : 'Write a comment...'}"
                            onkeypress="if(event.key==='Enter')addComment('${cellId}')">
                        <button onclick="addComment('${cellId}')" 
                            class="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 px-4 py-2 rounded-lg text-sm font-semibold transition transform hover:scale-105 active:scale-95">
                            ${currentLang === 'ar' ? '↵' : '↵'}
                        </button>
                    </div>
                </div>
                
                <!-- Share Buttons -->
                <div class="mt-4 pt-4 border-t border-white/10">
                    <p class="text-xs text-gray-500 text-center mb-3">${currentLang === 'ar' ? 'شارك هذه الخانة' : 'Share this cell'}</p>
                    <div class="flex justify-center gap-2">
                        <a href="https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}" target="_blank" 
                           class="flex items-center gap-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg transition text-xs">
                            📱 WhatsApp
                        </a>
                        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}" target="_blank"
                           class="flex items-center gap-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg transition text-xs">
                            🐦 Twitter
                        </a>
                        <button onclick="copyText('${shareUrl}')" 
                           class="flex items-center gap-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-2 rounded-lg transition text-xs">
                            🔗 ${currentLang === 'ar' ? 'نسخ' : 'Copy'}
                        </button>
                    </div>
                </div>
            `;
            
            document.getElementById('viewModal').classList.remove('hidden');
            document.getElementById('viewModal').classList.add('flex');
        }
        
        // Toggle Like
        async function toggleLike(cellId) {
            const hasLiked = localStorage.getItem(`liked_${cellId}`) === 'true';
            const likeBtn = document.getElementById(`likeBtn_${cellId}`);
            const likeCount = document.getElementById(`likeCount_${cellId}`);
            
            let currentLikes = parseInt(likeCount.textContent) || 0;
            
            if (hasLiked) {
                // Unlike
                currentLikes = Math.max(0, currentLikes - 1);
                localStorage.removeItem(`liked_${cellId}`);
                likeBtn.classList.remove('bg-pink-500/30', 'text-pink-400');
                likeBtn.classList.add('bg-white/5', 'text-gray-400');
                likeBtn.querySelector('span').textContent = '🤍';
            } else {
                // Like
                currentLikes += 1;
                localStorage.setItem(`liked_${cellId}`, 'true');
                likeBtn.classList.add('bg-pink-500/30', 'text-pink-400');
                likeBtn.classList.remove('bg-white/5', 'text-gray-400');
                likeBtn.querySelector('span').textContent = '❤️';
                
                // Animation
                likeBtn.style.transform = 'scale(1.2)';
                setTimeout(() => likeBtn.style.transform = 'scale(1)', 150);
            }
            
            likeCount.textContent = currentLikes;
            
            // Update in Firebase
            if (db && cellsData[cellId]) {
                try {
                    await db.collection('cells').doc(cellId).update({ likes: currentLikes });
                    cellsData[cellId].likes = currentLikes;
                } catch (e) { console.log('Like update:', e); }
            }
        }
        
        // Add Comment
        async function addComment(cellId) {
            const nameInput = document.getElementById(`commentName_${cellId}`);
            const textInput = document.getElementById(`commentText_${cellId}`);
            const commentsList = document.getElementById(`commentsList_${cellId}`);
            const commentCount = document.getElementById(`commentCount_${cellId}`);
            
            const name = nameInput.value.trim() || (currentLang === 'ar' ? 'زائر' : 'Guest');
            const text = textInput.value.trim();
            
            if (!text) {
                showToast(currentLang === 'ar' ? 'اكتب تعليقاً' : 'Write a comment');
                return;
            }
            
            // Create comment
            const comment = { name, text, date: new Date().toISOString() };
            
            // Update UI
            const commentHtml = `
                <div class="flex items-start gap-2 mb-2">
                    <div class="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs flex-shrink-0">${name.charAt(0).toUpperCase()}</div>
                    <div class="flex-1 min-w-0">
                        <span class="text-purple-400 text-xs font-semibold">${name}</span>
                        <p class="text-gray-300 text-sm break-words">${text}</p>
                    </div>
                </div>
            `;
            
            // Remove "no comments" message if exists
            if (commentsList.querySelector('.text-center')) {
                commentsList.innerHTML = '';
            }
            
            commentsList.insertAdjacentHTML('beforeend', commentHtml);
            commentsList.scrollTop = commentsList.scrollHeight;
            
            // Update count
            const currentCount = parseInt(commentCount.textContent) || 0;
            commentCount.textContent = currentCount + 1;
            
            // Clear input
            textInput.value = '';
            
            // Update in Firebase
            if (db && cellsData[cellId]) {
                try {
                    const comments = cellsData[cellId].comments || [];
                    comments.push(comment);
                    await db.collection('cells').doc(cellId).update({ comments });
                    cellsData[cellId].comments = comments;
                } catch (e) { console.log('Comment update:', e); }
            }
            
            showToast(currentLang === 'ar' ? 'تم إضافة تعليقك ❤️' : 'Comment added ❤️');
        }

        function closeViewModal() {
            document.getElementById('viewModal').classList.add('hidden');
            document.getElementById('viewModal').classList.remove('flex');
        }

        // Utilities
        function copyText(text) {
            navigator.clipboard.writeText(text);
            showToast(currentLang === 'ar' ? 'تم النسخ ✓' : 'Copied! ✓');
        }

        function showToast(message) {
            const toast = document.getElementById('toast');
            document.getElementById('toastMessage').textContent = message;
            toast.classList.remove('translate-y-20', 'opacity-0');
            setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
        }

        // Close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { closeClaimModal(); closeViewModal(); }
        });

        document.getElementById('claimModal').addEventListener('click', (e) => {
            if (e.target.id === 'claimModal') closeClaimModal();
        });
        
        document.getElementById('viewModal').addEventListener('click', (e) => {
            if (e.target.id === 'viewModal') closeViewModal();
        });

        // Load Founding Wall
        async function loadFoundingWall() {
            if (!db) return;
            
            try {
                const snapshot = await db.collection('cells')
                    .where('status', '==', 'active')
                    .orderBy('createdAt', 'asc')
                    .limit(3)
                    .get();
                
                const founders = [];
                snapshot.forEach(doc => founders.push({ id: doc.id, ...doc.data() }));
                
                updateFoundingWall(founders);
            } catch (error) {
                console.log('Founding wall will update when first cells are added');
            }
        }
        
        function updateFoundingWall(founders) {
            for (let i = 0; i < 3; i++) {
                const founder = founders[i];
                const num = i + 1;
                
                if (founder) {
                    const imgEl = document.getElementById(`founder${num}Image`);
                    if (founder.imageBase64) {
                        imgEl.innerHTML = `<img src="${founder.imageBase64}" class="w-full h-full rounded-full object-cover">`;
                    } else {
                        imgEl.textContent = founder.name.charAt(0).toUpperCase();
                    }
                    
                    document.getElementById(`founder${num}Name`).textContent = founder.name;
                    document.getElementById(`founder${num}Story`).textContent = founder.story || '';
                }
            }
        }

        // Initialize
        loadCells();
        loadFoundingWall();
        showWelcome();

// Onboarding logic
function closeOnboarding() {
  localStorage.setItem("visited", "1");
  document.getElementById("onboarding").remove();
}

window.addEventListener("load", () => {
  if (localStorage.getItem("visited")) {
    const ob = document.getElementById("onboarding");
    if (ob) ob.remove();
  }
});
