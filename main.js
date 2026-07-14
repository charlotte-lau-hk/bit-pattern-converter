document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.decimal-input');
    const bitRows = document.querySelectorAll('.bit-row');
    const toggleViewBtn = document.getElementById('toggle-view');

    let showBits = false;

    // --- Bilingual UI (English / Traditional Chinese) ---
    const I18N = {
        en: {
            title: 'Bit Pattern Converter',
            subtitle: 'Visualize 8-bit integers as binary patterns',
            by: 'By',
            previewLabel: 'Preview Pixel Art',
            previewAria: 'Combined 8 by 8 pixel-art preview of all rows',
            toggleInputsAria: 'Toggle inputs',
            closeAria: 'Close',
            inputs: 'Inputs',
            patterns: 'Patterns',
            rowLabel: 'Row {n}',
            bitAria: 'Row {row}, bit value {weight}',
            showBits: 'Show Bits',
            showPattern: 'Show Pattern',
            clearAll: 'Clear All',
            save: 'Save',
            shareClassroom: 'Share to Classroom',
            savedTitle: 'Saved sprites',
            savedHint: '— up to 6 most recent sprites',
            savedEmpty: 'Click Save to keep a sprite here (up to 6).',
            loadSprite: 'Load this sprite',
            confirmLoad: 'Load this saved sprite? Your current drawing will be replaced.'
        },
        zh: {
            title: '位元樣式轉換器',
            subtitle: '以二進制樣式呈現 8 位元整數',
            by: '作者',
            previewLabel: '像素藝術預覽',
            previewAria: '由所有行合併而成的 8×8 像素藝術預覽',
            toggleInputsAria: '開關輸入面板',
            closeAria: '關閉',
            inputs: '輸入',
            patterns: '樣式',
            rowLabel: '第 {n} 行',
            bitAria: '第 {row} 行，位元值 {weight}',
            showBits: '顯示位元',
            showPattern: '顯示樣式',
            clearAll: '全部清除',
            save: '儲存',
            shareClassroom: '分享至 Classroom',
            savedTitle: '已儲存的精靈圖 (sprite)',
            savedHint: '— 最多保留最近 6 個精靈圖',
            savedEmpty: '按「儲存」即可把精靈圖保留在這裡（最多 6 個）。',
            loadSprite: '載入此精靈圖',
            confirmLoad: '要載入這個已儲存的精靈圖嗎？目前的圖案將會被取代。'
        }
    };

    const LANG_KEY = 'bpc-lang';
    let lang = 'en';
    try { if (localStorage.getItem(LANG_KEY) === 'zh') lang = 'zh'; } catch (e) { /* default English */ }

    const t = (key) => I18N[lang][key];

    // Parse and clamp any raw value to a valid 8-bit integer (0-255)
    const clamp255 = (value) => {
        let n = parseInt(value);
        if (isNaN(n) || n < 0) n = 0;
        if (n > 255) n = 255;
        return n;
    };

    // --- Pixel Art Preview (all 8 rows combined into an 8x8 sprite) ---
    const previewCanvas = document.getElementById('preview-canvas');
    const pctx = previewCanvas ? previewCanvas.getContext('2d') : null;

    // Paint an 8x8 sprite (from 8 row values) onto a 64x64 canvas context
    const paintSprite = (ctx, values) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 64, 64);
        values.forEach((val, row) => {
            const binary = clamp255(val).toString(2).padStart(8, '0');
            for (let col = 0; col < 8; col++) {
                if (binary[col] === '1') {
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(col * 8, row * 8, 8, 8);
                }
            }
        });
    };

    const currentValues = () => Array.from(inputs).map(input => clamp255(input.value));

    const drawPreview = () => {
        if (!pctx) return;
        paintSprite(pctx, currentValues());
    };

    // --- Core Logic: Map Input Index to Bit Row ---

    const updateBitDisplay = (index, value) => {
        const intVal = clamp255(value);

        // Binary string
        const binaryString = intVal.toString(2).padStart(8, '0');

        // Find corresponding bit row
        const targetRow = bitRows[index];
        if (!targetRow) return;

        const bits = targetRow.querySelectorAll('.bit');
        bits.forEach((bit, bitIndex) => {
            const bitValue = binaryString[bitIndex];

            // Update Visual Pattern
            if (bitValue === '1') {
                bit.classList.add('active');
            } else {
                bit.classList.remove('active');
            }
            bit.setAttribute('aria-pressed', bitValue === '1' ? 'true' : 'false');

            // Update Text Content (0 or 1)
            if (showBits) {
                bit.textContent = bitValue;
            } else {
                bit.textContent = '';
            }
        });

        // Keep the combined pixel-art preview in sync
        drawPreview();
    };

    const refreshAllDisplays = () => {
        inputs.forEach((input, index) => {
            updateBitDisplay(index, input.value || 0);
        });
    };

    // --- Event Listeners for Inputs ---

    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const raw = e.target.value;

            // Validate limits in real-time (leave empty string alone so typing isn't interrupted)
            if (raw !== '') {
                const clamped = clamp255(raw);
                if (String(clamped) !== raw) e.target.value = clamped;
            }

            updateBitDisplay(index, e.target.value);
            updateHash();
        });

        // Initialize display
        updateBitDisplay(index, input.value || 0);
    });

    // --- Interactive Bits Logic ---

    bitRows.forEach((row, rowIndex) => {
        const bits = row.querySelectorAll('.bit');
        bits.forEach((bit, bitIndex) => {
            // Bits are index 0 (MSB, 128) to 7 (LSB, 1)
            const weight = Math.pow(2, 7 - bitIndex);

            // Make each bit keyboard-operable, not just clickable
            bit.setAttribute('role', 'button');
            bit.tabIndex = 0;
            bit.dataset.row = rowIndex + 1;
            bit.dataset.weight = weight;
            bit.setAttribute('aria-label',
                t('bitAria').replace('{row}', rowIndex + 1).replace('{weight}', weight));

            const toggleBit = () => {
                const input = inputs[rowIndex];
                const currentValue = parseInt(input.value) || 0;

                // XOR to toggle the bit in the integer
                const newValue = currentValue ^ weight;

                // Update State
                input.value = newValue;
                updateBitDisplay(rowIndex, newValue);
                updateHash();
            };

            bit.addEventListener('click', toggleBit);
            bit.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleBit();
                }
            });
        });
    });


    // --- Toggle View Logic ---
    const toggleViewLabel = toggleViewBtn ? toggleViewBtn.querySelector('.btn-label') : null;
    const updateToggleViewLabel = () => {
        if (toggleViewLabel) toggleViewLabel.textContent = showBits ? t('showPattern') : t('showBits');
    };
    if (toggleViewBtn) {
        toggleViewBtn.addEventListener('click', () => {
            showBits = !showBits;
            toggleViewBtn.classList.toggle('active', showBits);
            updateToggleViewLabel();
            refreshAllDisplays();
        });
    }


    // --- Clear All Logic ---
    const clearAllBtn = document.getElementById('clear-all');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            inputs.forEach((input, index) => {
                input.value = '';
                updateBitDisplay(index, 0);
            });
            updateHash();
        });
    }


    // --- Save / Gallery (persisted in this browser) ---
    const SAVE_KEY = 'bpc-saved-sprites';
    const MAX_SAVED = 6;
    const savedList = document.getElementById('saved-list');

    const readSaved = () => {
        try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || []; }
        catch (e) { return []; }
    };
    const writeSaved = (arr) => {
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(arr)); }
        catch (e) { /* storage unavailable (e.g. private mode) */ }
    };

    const renderSaved = () => {
        if (!savedList) return;
        const saved = readSaved();
        savedList.innerHTML = '';
        if (saved.length === 0) {
            const hint = document.createElement('span');
            hint.className = 'saved-empty';
            hint.textContent = t('savedEmpty');
            savedList.appendChild(hint);
            return;
        }
        saved.forEach((values) => {
            const item = document.createElement('button');
            item.className = 'saved-item';
            item.title = t('loadSprite');
            item.setAttribute('aria-label', t('loadSprite'));
            const cv = document.createElement('canvas');
            cv.width = 64;
            cv.height = 64;
            cv.className = 'saved-thumb';
            paintSprite(cv.getContext('2d'), values);
            item.appendChild(cv);
            item.addEventListener('click', () => {
                const hasDrawing = currentValues().some(v => v !== 0);
                if (hasDrawing && !confirm(t('confirmLoad'))) return;
                inputs.forEach((input, idx) => { input.value = values[idx]; });
                refreshAllDisplays();
                updateHash();
            });
            savedList.appendChild(item);
        });
    };

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const values = currentValues();
            if (values.every(v => v === 0)) return; // nothing drawn yet
            const saved = readSaved();
            saved.unshift(values);
            writeSaved(saved.slice(0, MAX_SAVED));
            renderSaved();
        });
    }

    // --- Share to Google Classroom ---
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            updateHash(); // make sure the URL reflects the current drawing
            const shareUrl = 'https://classroom.google.com/share?url=' +
                encodeURIComponent(window.location.href);
            window.open(shareUrl, '_blank', 'noopener,width=600,height=650');
        });
    }

    // --- Language Switch ---
    const langButtons = document.querySelectorAll('.lang-btn');

    const applyI18n = () => {
        document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
        document.title = t('title');

        document.querySelectorAll('[data-i18n]').forEach((el) => {
            let text = t(el.dataset.i18n);
            if (el.dataset.row) text = text.replace('{n}', el.dataset.row);
            el.textContent = text;
        });
        document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
            el.setAttribute('aria-label', t(el.dataset.i18nAria));
        });
        document.querySelectorAll('.bit').forEach((bit) => {
            bit.setAttribute('aria-label',
                t('bitAria').replace('{row}', bit.dataset.row).replace('{weight}', bit.dataset.weight));
        });

        langButtons.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        updateToggleViewLabel();
        renderSaved();
    };

    langButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            if (btn.dataset.lang === lang) return;
            lang = btn.dataset.lang;
            try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* storage unavailable */ }
            applyI18n();
        });
    });

    applyI18n();


    // --- URL Hash State Management ---

    const updateHash = () => {
        const values = Array.from(inputs).map(input => input.value || '0');
        window.location.hash = values.join(',');
    };

    const loadFromHash = () => {
        const hash = window.location.hash.slice(1);
        if (!hash) return;

        const values = hash.split(',');
        inputs.forEach((input, index) => {
            if (values[index] === undefined) return;
            // Clamp so the input field always matches what the bits/preview show
            const clamped = String(clamp255(values[index]));
            if (input.value !== clamped) {
                input.value = clamped;
                updateBitDisplay(index, clamped);
            }
        });
    };

    window.addEventListener('hashchange', loadFromHash);

    // Initial Load
    if (window.location.hash) {
        loadFromHash();
    }


    // --- Mobile Interface Logic ---

    const toggleBtn = document.getElementById('toggle-inputs');
    const closeBtn = document.getElementById('close-inputs');
    const inputPanel = document.getElementById('input-panel');

    const toggleMenu = () => {
        inputPanel.classList.toggle('active');
    };

    if (toggleBtn) toggleBtn.addEventListener('click', toggleMenu);
    if (closeBtn) closeBtn.addEventListener('click', toggleMenu);

});
