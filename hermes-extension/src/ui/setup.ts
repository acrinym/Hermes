let container: HTMLDivElement | null = null;
let minimized: HTMLDivElement | null = null;
let isMinimized = false;
let isBunched = false;
let dragHandle: HTMLDivElement | null = null;
const position = { top: 10, left: 10 };

export function setupUI(root: HTMLElement = document.body) {
    if (container) return container;

    container = document.createElement('div');
    container.id = 'hermes-ui-container';
    container.style.cssText = 'position:fixed;top:10px;left:10px;display:flex;gap:4px;background:var(--hermes-bg);color:var(--hermes-text);padding:4px;border:1px solid var(--hermes-border);z-index:2147483647;';
    root.appendChild(container);

    minimized = document.createElement('div');
    minimized.id = 'hermes-minimized-container';
    minimized.textContent = '🛠️';
    minimized.style.cssText = 'display:none;position:fixed;top:10px;left:10px;cursor:pointer;padding:2px;z-index:2147483647;background:var(--hermes-bg);border:1px solid var(--hermes-border);color:var(--hermes-text);';
    minimized.onclick = () => toggleMinimizedUI(false);
    root.appendChild(minimized);

    dragHandle = document.createElement('div');
    dragHandle.id = 'hermes-drag-handle';
    dragHandle.textContent = '☰';
    dragHandle.style.cssText = 'cursor:move;user-select:none;padding:0 4px;';
    container.appendChild(dragHandle);
    setupDragging(dragHandle);

    const bunchBtn = document.createElement('button');
    bunchBtn.className = 'hermes-button';
    bunchBtn.id = 'hermes-bunch-button';
    bunchBtn.textContent = 'Bunch';
    bunchBtn.onclick = () => {
        isBunched = !isBunched;
        if (container) container.classList.toggle('hermes-bunched', isBunched);
    };
    container.appendChild(bunchBtn);

    const minBtn = document.createElement('button');
    minBtn.className = 'hermes-button';
    minBtn.id = 'hermes-minimize-button';
    minBtn.textContent = '_';
    minBtn.onclick = () => toggleMinimizedUI(true);
    container.appendChild(minBtn);

    const snapContainer = document.createElement('div');
    snapContainer.id = 'hermes-snap-buttons';
    snapContainer.style.display = 'flex';
    snapContainer.style.gap = '2px';
    const snapData = [
        { edge: 'left', label: '\u2190' },
        { edge: 'right', label: '\u2192' },
        { edge: 'top', label: '\u2191' },
        { edge: 'bottom', label: '\u2193' },
        { edge: 'top-left', label: '\u2196' },
        { edge: 'top-right', label: '\u2197' },
        { edge: 'bottom-left', label: '\u2199' },
        { edge: 'bottom-right', label: '\u2198' }
    ];
    snapData.forEach(d => {
        const b = document.createElement('button');
        b.className = 'hermes-button';
        b.textContent = d.label;
        b.onclick = () => snapToEdge(d.edge);
        snapContainer.appendChild(b);
    });
    container.appendChild(snapContainer);

    return container;
}

export function toggleMinimizedUI(minimize: boolean) {
    if (!container || !minimized) return;
    isMinimized = minimize;
    container.style.display = minimize ? 'none' : 'flex';
    minimized.style.display = minimize ? 'flex' : 'none';
    if (!minimize) {
        container.style.left = `${position.left}px`;
        container.style.top = `${position.top}px`;
    }
}

function setupDragging(handle: HTMLElement) {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;
    handle.addEventListener('mousedown', (e) => {
        dragging = true;
        offsetX = e.clientX - position.left;
        offsetY = e.clientY - position.top;
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const newLeft = Math.max(0, Math.min(e.clientX - offsetX, window.innerWidth - (container?.offsetWidth || 0)));
        const newTop = Math.max(0, Math.min(e.clientY - offsetY, window.innerHeight - (container?.offsetHeight || 0)));
        position.left = newLeft;
        position.top = newTop;
        if (container) {
            container.style.left = `${newLeft}px`;
            container.style.top = `${newTop}px`;
        }
        if (minimized) {
            minimized.style.left = `${newLeft}px`;
            minimized.style.top = `${newTop}px`;
        }
    });
    document.addEventListener('mouseup', () => {
        dragging = false;
    });
}

function snapToEdge(edge: string) {
    if (!container || !minimized) return;
    const rect = (isMinimized ? minimized : container).getBoundingClientRect();
    const margin = 10;
    let newLeft = position.left;
    let newTop = position.top;
    switch (edge) {
        case 'left':
            newLeft = margin;
            break;
        case 'right':
            newLeft = window.innerWidth - rect.width - margin;
            break;
        case 'top':
            newTop = margin;
            break;
        case 'bottom':
            newTop = window.innerHeight - rect.height - margin;
            break;
        case 'top-left':
            newTop = margin;
            newLeft = margin;
            break;
        case 'top-right':
            newTop = margin;
            newLeft = window.innerWidth - rect.width - margin;
            break;
        case 'bottom-left':
            newTop = window.innerHeight - rect.height - margin;
            newLeft = margin;
            break;
        case 'bottom-right':
            newTop = window.innerHeight - rect.height - margin;
            newLeft = window.innerWidth - rect.width - margin;
            break;
    }
    newLeft = Math.max(margin, Math.min(newLeft, window.innerWidth - rect.width - margin));
    newTop = Math.max(margin, Math.min(newTop, window.innerHeight - rect.height - margin));
    position.left = newLeft;
    position.top = newTop;
    container.style.left = `${newLeft}px`;
    container.style.top = `${newTop}px`;
    minimized.style.left = `${newLeft}px`;
    minimized.style.top = `${newTop}px`;
}
