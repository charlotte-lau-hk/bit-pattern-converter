document.addEventListener('DOMContentLoaded', () => {
    const rows = document.querySelectorAll('.row');

    rows.forEach((row) => {
        const input = row.querySelector('.decimal-input');
        const bits = Array.from(row.querySelectorAll('.bit'));

        // Reverse bits array so index 0 corresponds to MSB (leftmost visually? actually user req: on the right... 
        // Requirement says: "on the right, there are 8 boxes, showing red for 1 and white for 0, according to the binary equivalent of the integer"
        // Usually, binary is read Left to Right as MSB to LSB (e.g. 128 64 32 ... 1).
        // Let's assume standard binary representation: [Box 7 (128)] ... [Box 0 (1)]
        // If the requirement means the boxes are physically on the right side of the screen, that's layout.
        // I will implement standard binary representation: Leftmost box is MSB (128), Rightmost box is LSB (1).

        const updateBits = (value) => {
            // Clamp and parse
            let intVal = parseInt(value);
            if (isNaN(intVal)) {
                intVal = 0; // Default to 0 or valid empty state? Let's use 0 for visualization
            }

            // Strict 0-255 enforcement for display
            if (intVal > 255) intVal = 255;
            if (intVal < 0) intVal = 0;

            // Create binary string, padded to 8 chars
            // e.g. 5 -> "00000101"
            const binaryString = intVal.toString(2).padStart(8, '0');

            // Update boxes
            bits.forEach((bit, index) => {
                // binaryString[0] is MSB, which should match bits[0]
                if (binaryString[index] === '1') {
                    bit.classList.add('active');
                } else {
                    bit.classList.remove('active');
                }
            });
        };

        // URL Hash Management
        const updateHash = () => {
            const values = Array.from(document.querySelectorAll('.decimal-input'))
                .map(input => input.value || '0');
            window.location.hash = values.join(',');
        };

        const loadFromHash = () => {
            const hash = window.location.hash.slice(1);
            if (!hash) return;

            const values = hash.split(',');
            const inputs = document.querySelectorAll('.decimal-input');

            inputs.forEach((input, index) => {
                if (values[index] !== undefined) {
                    // Validate and set value
                    let val = parseInt(values[index]);
                    if (isNaN(val)) val = 0;
                    if (val > 255) val = 255;
                    if (val < 0) val = 0;

                    input.value = val;
                    // Trigger update
                    updateBits(val, index);
                }
            });
        };

        // Modified updateBits to accept direct value and index (helper)
        // Actually, we can just trigger the input event or call the logic directly.
        // Let's refactor the existing per-row logic to be accessible or just fire events.

        // Better approach: Keep the per-row closures but expose a way to set them?
        // Or just fire 'input' event on the elements after setting values.

        // Let's use the event firing approach for simplicity with existing code structure.

        const applyHashValues = () => {
            const hash = window.location.hash.slice(1);
            if (!hash) return;
            const values = hash.split(',');
            const inputs = document.querySelectorAll('.decimal-input');
            inputs.forEach((input, index) => {
                if (values[index]) {
                    input.value = values[index];
                    input.dispatchEvent(new Event('input'));
                }
            });
        };

        input.addEventListener('input', (e) => {
            let value = e.target.value;

            // Optional: Enforce input limit in the field itself
            if (value > 255) {
                e.target.value = 255;
                value = 255;
            }
            if (value < 0) {
                e.target.value = 0;
                value = 0;
            }

            updateBits(value);
            updateHash(); // Sync to URL
        });

        // Initialize with 0 or placeholder
        updateBits(input.value || 0);
    });

    // Global Hash Listener
    window.addEventListener('hashchange', () => {
        // We need to parse and update inputs
        // This is slightly tricky because the inputs are scoped in the loop above.
        // Let's handle initial load in the loop (it will default to 0),
        // BUT for hash changes we need access to the inputs.

        const hash = window.location.hash.slice(1);
        if (!hash) return;

        const values = hash.split(',');
        const inputs = document.querySelectorAll('.decimal-input');

        inputs.forEach((input, index) => {
            if (values[index] !== undefined && input.value !== values[index]) {
                input.value = values[index];
                // We need to trigger the bit update.
                // Since the 'input' listener updates the hash, we might get a loop 
                // if we just fire 'input' event.
                // However, since we check `input.value !== values[index]`, it should be stable.
                input.dispatchEvent(new Event('input'));
            }
        });
    });

    // Initial load from hash
    if (window.location.hash) {
        setTimeout(() => {
            window.dispatchEvent(new Event('hashchange'));
        }, 0);
    }
});
