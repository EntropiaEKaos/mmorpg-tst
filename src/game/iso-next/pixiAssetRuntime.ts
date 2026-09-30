import { Assets, AnimatedSprite, Container, Graphics, Texture } from 'pixi.js';
import { frameName, type IsoAssetDefinition } from './assetPipeline';
import { assetFrameIndex, assetPhaseForNode, resolveIsoAsset } from './assetRuntime';
import type { IsoSceneNode } from './sceneModel';

type AtlasState = 'unknown' | 'loading' | 'ready' | 'missing';

/**
 * Presentation-only Pixi asset bridge. Missing production art never breaks LAB:
 * callers receive null and keep the procedural renderer as a deterministic fallback.
 */
export class PixiIsoAssetRuntime {
  private atlasState = new Map<string, AtlasState>();
  private atlasTextures = new Map<string, Record<string, Texture>>();

  warmManifest(assets: readonly IsoAssetDefinition[]): void {
    for (const asset of assets) void this.ensureAtlas(asset.frames.atlas);
  }

  async ensureAtlas(url: string): Promise<boolean> {
    const state = this.atlasState.get(url);
    if (state === 'ready') return true;
    if (state === 'missing') return false;
    if (state === 'loading') return false;
    this.atlasState.set(url, 'loading');
    try {
      const loaded = await Assets.load(url) as unknown;
      const textures = this.extractTextures(loaded);
      if (!textures || Object.keys(textures).length === 0) {
        this.atlasState.set(url, 'missing');
        return false;
      }
      this.atlasTextures.set(url, textures);
      this.atlasState.set(url, 'ready');
      return true;
    } catch {
      this.atlasState.set(url, 'missing');
      return false;
    }
  }

  createEntitySprite(node: Readonly<IsoSceneNode>): Container | null {
    const resolved = resolveIsoAsset(node);
    const asset = resolved.asset;
    if (!asset || this.atlasState.get(asset.frames.atlas) !== 'ready') {
      if (asset && this.atlasState.get(asset.frames.atlas) === 'unknown') void this.ensureAtlas(asset.frames.atlas);
      return null;
    }
    const textures = this.atlasTextures.get(asset.frames.atlas);
    if (!textures) return null;
    const sequence: Texture[] = [];
    for (let index = 0; index < asset.frames.frames; index += 1) {
      const texture = textures[frameName(asset, index)];
      if (!texture) return null;
      sequence.push(texture);
    }
    const root = new Container();
    if (asset.shadow) {
      const shadow = new Graphics().ellipse(0, 0, asset.shadow.width / 2, asset.shadow.height / 2).fill({ color: 0x000000, alpha: asset.shadow.alpha });
      root.addChild(shadow);
    }
    const sprite = new AnimatedSprite(sequence);
    sprite.anchor.set(asset.anchor.x, asset.anchor.y);
    sprite.scale.set(asset.scale);
    sprite.animationSpeed = asset.frames.fps / 60;
    sprite.loop = asset.frames.loop;
    sprite.gotoAndStop(assetFrameIndex(asset, assetPhaseForNode(node)));
    root.addChild(sprite);
    return root;
  }

  status(url: string): AtlasState { return this.atlasState.get(url) ?? 'unknown'; }

  destroy(): void {
    this.atlasState.clear();
    this.atlasTextures.clear();
  }

  private extractTextures(loaded: unknown): Record<string, Texture> | null {
    if (!loaded || typeof loaded !== 'object') return null;
    const candidate = loaded as { textures?: Record<string, Texture> };
    return candidate.textures ?? null;
  }
}
