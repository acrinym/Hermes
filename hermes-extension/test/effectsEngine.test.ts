import { startCube, getEffect, stopEffects } from '../src/localCore';
import { setRoot } from '../src/root.ts';

jest.mock('three', () => {
  return {
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      setSize: jest.fn(),
      domElement: document.createElement('canvas'),
      render: jest.fn(),
      dispose: jest.fn()
    })),
    Scene: jest.fn().mockImplementation(() => ({ add: jest.fn() })),
    PerspectiveCamera: jest.fn().mockImplementation(() => ({
      position: { z: 0 },
      aspect: 1,
      updateProjectionMatrix: jest.fn()
    })),
    BoxGeometry: jest.fn(),
    MeshBasicMaterial: jest.fn(),
    Mesh: jest.fn().mockImplementation(() => ({ rotation: { x: 0, y: 0 } }))
  };
});

describe('startCube', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    setRoot(document);
    (global as any).requestAnimationFrame = jest.fn();
  });

  afterEach(() => {
    stopEffects();
    jest.clearAllMocks();
  });

  test('creates renderer and starts animation', () => {
    startCube();
    expect(getEffect()).toBe('cube');
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect((global as any).requestAnimationFrame).toHaveBeenCalled();
  });
});
