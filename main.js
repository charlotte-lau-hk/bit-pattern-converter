document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.decimal-input');
    const bitRows = document.querySelectorAll('.bit-row');
    const toggleViewBtn = document.getElementById('toggle-view');

    let showBits = false;

    // --- Pixel Art Preview (all 8 rows combined into an 8x8 sprite) ---
    const previewCanvas = document.getElementById('preview-canvas');
    const pctx = previewCanvas ? previewCanvas.getContext('2d') : null;

    // Paint an 8x8 sprite (from 8 row values) onto a 64x64 canvas context
    const paintSprite = (ctx, values) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 64, 64);
        values.forEach((val, row) => {
            let n = parseInt(val);
            if (isNaN(n) || n < 0) n = 0;
            if (n > 255) n = 255;
            const binary = n.toString(2).padStart(8, '0');
            for (let col = 0; col < 8; col++) {
                if (binary[col] === '1') {
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(col * 8, row * 8, 8, 8);
                }
            }
        });
    };

    const currentValues = () => Array.from(inputs).map(input => {
        let n = parseInt(input.value);
        if (isNaN(n) || n < 0) n = 0;
        if (n > 255) n = 255;
        return n;
    });

    const drawPreview = () => {
        if (!pctx) return;
        paintSprite(pctx, currentValues());
    };

    // --- Core Logic: Map Input Index to Bit Row ---

    const updateBitDisplay = (index, value) => {
        // Clamp and parse
        let intVal = parseInt(value);
        if (isNaN(intVal)) intVal = 0;
        if (intVal > 255) intVal = 255;
        if (intVal < 0) intVal = 0;

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
            let value = e.target.value;

            // Validate limits in real-time
            if (value > 255) {
                value = 255;
                e.target.value = 255;
            }
            if (value < 0) {
                value = 0;
                e.target.value = 0;
            }

            updateBitDisplay(index, value);
            updateHash();
        });

        // Initialize display
        updateBitDisplay(index, input.value || 0);
    });

    // --- Interactive Bits Logic ---

    bitRows.forEach((row, rowIndex) => {
        const bits = row.querySelectorAll('.bit');
        bits.forEach((bit, bitIndex) => {
            bit.addEventListener('click', () => {
                const input = inputs[rowIndex];
                let currentValue = parseInt(input.value) || 0;

                // Calculate weight of the clicked bit
                // Bits are index 0 (MSB, 128) to 7 (LSB, 1)
                const weight = Math.pow(2, 7 - bitIndex);

                // XOR to toggle the bit in the integer
                const newValue = currentValue ^ weight;

                // Update State
                input.value = newValue;
                updateBitDisplay(rowIndex, newValue);
                updateHash();
            });
        });
    });


    // --- Toggle View Logic ---
    if (toggleViewBtn) {
        toggleViewBtn.addEventListener('click', () => {
            showBits = !showBits;
            toggleViewBtn.classList.toggle('active', showBits);
            toggleViewBtn.textContent = showBits ? 'Show Pattern' : 'Show Bits';
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


    // --- Save / Gallery (this browser session only) ---
    const SAVE_KEY = 'bpc-saved-sprites';
    const MAX_SAVED = 5;
    const savedList = document.getElementById('saved-list');

    const readSaved = () => {
        try { return JSON.parse(sessionStorage.getItem(SAVE_KEY)) || []; }
        catch (e) { return []; }
    };
    const writeSaved = (arr) => {
        try { sessionStorage.setItem(SAVE_KEY, JSON.stringify(arr)); }
        catch (e) { /* storage unavailable (e.g. private mode) */ }
    };

    const renderSaved = () => {
        if (!savedList) return;
        const saved = readSaved();
        savedList.innerHTML = '';
        if (saved.length === 0) {
            const hint = document.createElement('span');
            hint.className = 'saved-empty';
            hint.textContent = 'Click Save to keep a sprite here (up to 5).';
            savedList.appendChild(hint);
            return;
        }
        saved.forEach((values) => {
            const item = document.createElement('button');
            item.className = 'saved-item';
            item.title = 'Load this sprite';
            const cv = document.createElement('canvas');
            cv.width = 64;
            cv.height = 64;
            cv.className = 'saved-thumb';
            paintSprite(cv.getContext('2d'), values);
            item.appendChild(cv);
            item.addEventListener('click', () => {
                const hasDrawing = currentValues().some(v => v !== 0);
                if (hasDrawing && !confirm('Load this saved sprite? Your current drawing will be replaced.')) return;
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

    renderSaved();


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
            if (values[index] !== undefined && input.value !== values[index]) {
                input.value = values[index];
                updateBitDisplay(index, values[index]);
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
