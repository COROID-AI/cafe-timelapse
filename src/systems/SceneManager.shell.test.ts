/**
 * SceneManager.shell.test.ts — verifies the persistent (non-era) café
 * ArchitectureShell is integrated as a base layer that survives era switches.
 *
 * This is the acceptance criterion: "Shell renders as a persistent layer in
 * SceneManager independent of the active era." We assert presence in the scene
 * graph before/after era transitions rather than doing a pixel-level render.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  SceneManager,
  resetSceneManager,
  getSceneManager,
} from './SceneManager';
import { ERAS } from '../data/eras';

describe('SceneManager persistent architecture shell', () => {
  afterEach(() => {
    resetSceneManager();
  });

  it('mounts the café shell once into the root scene on construction', () => {
    const manager = new SceneManager();
    const shellRoot = manager.rootScene.getObjectByName('cafe-shell');
    expect(shellRoot).not.toBeNull();
    expect(shellRoot?.parent).toBe(manager.rootScene);
    manager.dispose();
  });

  it('exposes the shell via the architectureShell accessor', () => {
    const manager = new SceneManager();
    expect(manager.architectureShell.root.name).toBe('cafe-shell');
    manager.dispose();
  });

  it('keeps the shell mounted across an era switch (persistent layer)', () => {
    const manager = new SceneManager();
    manager.setActiveEra(ERAS[0].year);

    const shellBefore = manager.rootScene.getObjectByName('cafe-shell');
    expect(shellBefore).not.toBeNull();

    // Switch to a later era and confirm the shell is still in the scene graph.
    manager.setActiveEra(ERAS[1].year);
    const shellAfter = manager.rootScene.getObjectByName('cafe-shell');
    expect(shellAfter).toBe(shellBefore); // same instance, never rebuilt
    expect(shellAfter?.parent).toBe(manager.rootScene);
    manager.dispose();
  });

  it('the shell and the era group are siblings (shell is a separate layer)', () => {
    const manager = new SceneManager();
    manager.setActiveEra(ERAS[0].year);
    const shellRoot = manager.rootScene.getObjectByName('cafe-shell');
    const eraGroup = manager.rootScene.getObjectByName(`era:${ERAS[0].year}`);
    // Both are direct children of the root scene, so the shell persists
    // independently of the per-era group beneath it.
    expect(shellRoot?.parent).toBe(manager.rootScene);
    expect(eraGroup?.parent).toBe(manager.rootScene);
    manager.dispose();
  });

  it('disposes the shell on dispose()', () => {
    const manager = new SceneManager();
    const shellRoot = manager.architectureShell.root;
    manager.dispose();
    // The shell root is detached after disposal.
    expect(shellRoot.parent).toBeNull();
  });

  it('the shared manager instance also mounts the shell', () => {
    const shared = getSceneManager();
    expect(shared.rootScene.getObjectByName('cafe-shell')).not.toBeNull();
    resetSceneManager();
  });
});
