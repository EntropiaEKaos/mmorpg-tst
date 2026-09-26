import { useEffect, useRef } from 'react';
import { ELDORIA_ISO_FIXTURE } from './eldoriaFixture';
import { EuphoriaPresentationRuntime } from './euphoriaRuntime';
import { PixiIsoRenderer } from './PixiIsoRenderer';

export function IsoNextPrototype() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const runtime = new EuphoriaPresentationRuntime();
    const renderer = new PixiIsoRenderer();
    let alive = true;

    void runtime.mount(renderer, host, {
      width: host.clientWidth || 1280,
      height: host.clientHeight || 720,
      devicePixelRatio: window.devicePixelRatio,
    }).then(() => {
      if (!alive) return;
      runtime.updateAuthoritativeEntities(ELDORIA_ISO_FIXTURE);
      runtime.followEntity('preview-player');
      runtime.zoom(1.1);
    });

    const onResize = () => runtime.resize({
      width: host.clientWidth || window.innerWidth,
      height: host.clientHeight || window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    });
    window.addEventListener('resize', onResize);
    return () => {
      alive = false;
      window.removeEventListener('resize', onResize);
      runtime.destroy();
    };
  }, []);

  return (
    <section style={{ position: 'relative', width: '100%', minHeight: '720px', overflow: 'hidden', background: '#10151d' }}>
      <div ref={hostRef} data-testid="iso-next-canvas" style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'absolute', left: 20, top: 20, padding: '10px 14px', borderRadius: 12, background: 'rgba(8,12,18,.72)', color: '#f4e8c8', fontFamily: 'system-ui', pointerEvents: 'none' }}>
        <strong>Mor'ia ISO Next</strong><br />
        <small>Eldoria • Euphoria vertical slice</small>
      </div>
    </section>
  );
}
