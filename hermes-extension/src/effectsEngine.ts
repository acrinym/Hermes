import { getRoot } from './root.ts';
import * as THREE from 'three';

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let flakes: { x: number; y: number; r: number; s: number }[] = [];
let lasers: { x: number; y: number; len: number; s: number }[] = [];
let running = false;
let mode: 'none' | 'snow' | 'lasers' | 'cube' = 'none';

// three.js objects for cube effect
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let cube: THREE.Mesh | null = null;

function initCanvas() {
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483640';
        
        const root = getRoot();
        if (root instanceof ShadowRoot) {
            root.appendChild(canvas);
        } else {
            document.body.appendChild(canvas);
        }

        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
    }
}

function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

export function startSnowflakes() {
    initCanvas();
    flakes = [];
    for (let i = 0; i < 50; i++) {
        flakes.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: 2 + Math.random() * 3,
            s: 1 + Math.random()
        });
    }
    if (!running) {
        running = true;
        loop();
    }
    mode = 'snow';
}

export function startLasers() {
    initCanvas();
    lasers = [];

    if (!running) { running = true; loop(); }
    mode = 'lasers';
}

function initCube() {
    if (!renderer) {
        const root = getRoot();
        renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:2147483640;';
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        if (root instanceof ShadowRoot) {
            root.appendChild(renderer.domElement);
        } else {
            document.body.appendChild(renderer.domElement);
        }
        window.addEventListener('resize', () => {
            if (!renderer || !camera) return;
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        });
    }
}

export function startCube() {
    initCube();
    mode = 'cube';
    if (!running) {
        running = true;
        cubeLoop();
    }
}

export function stopEffects() {
    running = false;
    lasers = [];
    flakes = [];
    if (renderer) {
        renderer.domElement.remove();
        renderer.dispose();
        renderer = null;
        scene = null;
        camera = null;
        cube = null;
    }
    if (canvas) canvas.style.display = 'none';
    mode = 'none';
}

export function setEffect(newMode: 'none' | 'snow' | 'lasers' | 'cube') {
    if (newMode === 'none') { stopEffects(); return; }
    if (newMode === 'snow') { startSnowflakes(); return; }
    if (newMode === 'lasers') { startLasers(); return; }
    if (newMode === 'cube') { startCube(); return; }
}

export function getEffect() {
    return mode;
}

function loop() {
    if (!ctx || !canvas) return;
    canvas.style.display = 'block';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    flakes.forEach(f => {
        f.y += f.s;
        if (f.y > canvas!.height) f.y = -f.r;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
    });

    if (Math.random() < 0.05) {
        lasers.push({
            x: Math.random() * canvas.width,
            y: 0,
            len: 20 + Math.random() * 60,
            s: 5 + Math.random() * 10
        });
    }

    lasers.forEach(l => {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,0,0,0.7)';
        ctx.lineWidth = 2;
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x, l.y + l.len);
        ctx.stroke();
        l.y += l.s;
    });

    lasers = lasers.filter(l => l.y < canvas!.height);

    if (running) requestAnimationFrame(loop);
}

function cubeLoop() {
    if (!renderer || !scene || !camera || !cube) return;
    renderer.domElement.style.display = 'block';
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
    if (running && mode === 'cube') requestAnimationFrame(cubeLoop);
}
