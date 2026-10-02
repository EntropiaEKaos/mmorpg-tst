export type IsoCameraState = {
  x: number;
  y: number;
  zoom: number;
};

export class IsoCamera {
  private state: IsoCameraState = { x: 0, y: 0, zoom: 1 };

  snapshot(): Readonly<IsoCameraState> {
    return { ...this.state };
  }

  follow(screenX: number, screenY: number): void {
    this.state.x = screenX;
    this.state.y = screenY;
  }

  pan(deltaX: number, deltaY: number): void {
    this.state.x += deltaX;
    this.state.y += deltaY;
  }

  setZoom(nextZoom: number): void {
    this.state.zoom = Math.min(1.8, Math.max(0.6, nextZoom));
  }
}
