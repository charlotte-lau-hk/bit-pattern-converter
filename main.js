document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.decimal-input');
    const bitRows = document.querySelectorAll('.bit-row');
    const toggleViewBtn = document.getElementById('toggle-view');

    let showBits = false;

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
