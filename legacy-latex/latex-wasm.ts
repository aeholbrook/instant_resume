/**
 * Client-side LaTeX → PDF compilation using SwiftLaTeX PdfTeX WASM engine.
 *
 * WASM files served from /wasm/:
 *   - swiftlatexpdftex.js   (web worker)
 *   - swiftlatexpdftex.wasm (PdfTeX engine)
 *
 * Packages fetched on-demand from texlive.swiftlatex.com.
 */

const WORKER_URL = '/wasm/swiftlatexpdftex.js';

export type CompileResult = {
  pdf?: Uint8Array;
  status: number;
  log: string;
};

type WorkerMessage = {
  cmd?: string;
  result?: string;
  log?: string;
  status?: number;
  pdf?: ArrayBuffer;
};

export class PdfTeXEngine {
  private worker: Worker | null = null;
  private ready = false;

  async loadEngine(): Promise<void> {
    if (this.worker) return; // already loaded

    return new Promise((resolve, reject) => {
      this.worker = new Worker(WORKER_URL);
      this.worker.onmessage = (ev: MessageEvent<WorkerMessage>) => {
        if (ev.data.result === 'ok') {
          this.ready = true;
          this.worker!.onmessage = null;
          resolve();
        } else {
          this.ready = false;
          reject(new Error('Failed to initialize PdfTeX WASM engine'));
        }
      };
      this.worker.onerror = (err) => {
        reject(new Error(`Worker error: ${err.message}`));
      };
    });
  }

  isReady(): boolean {
    return this.ready;
  }

  writeFile(filename: string, content: string | Uint8Array): void {
    if (!this.worker || !this.ready) throw new Error('Engine not ready');
    this.worker.postMessage({ cmd: 'writefile', url: filename, src: content });
  }

  mkdir(folder: string): void {
    if (!this.worker || !this.ready) throw new Error('Engine not ready');
    if (!folder || folder === '/') return;
    this.worker.postMessage({ cmd: 'mkdir', url: folder });
  }

  setMainFile(filename: string): void {
    if (!this.worker || !this.ready) throw new Error('Engine not ready');
    this.worker.postMessage({ cmd: 'setmainfile', url: filename });
  }

  async compile(): Promise<CompileResult> {
    if (!this.worker || !this.ready) throw new Error('Engine not ready');

    this.ready = false;
    const start = performance.now();

    return new Promise((resolve) => {
      this.worker!.onmessage = (ev: MessageEvent<WorkerMessage>) => {
        const data = ev.data;
        if (data.cmd !== 'compile') return;

        this.ready = true;
        this.worker!.onmessage = null;

        const elapsed = Math.round(performance.now() - start);
        console.log(`PdfTeX compilation: ${elapsed}ms`);

        resolve({
          pdf: data.result === 'ok' && data.pdf ? new Uint8Array(data.pdf) : undefined,
          status: data.status ?? -1,
          log: data.log ?? 'No log',
        });
      };

      this.worker!.postMessage({ cmd: 'compilelatex' });
    });
  }

  flushCache(): void {
    if (!this.worker || !this.ready) throw new Error('Engine not ready');
    this.worker.postMessage({ cmd: 'flushcache' });
  }

  destroy(): void {
    if (this.worker) {
      this.worker.postMessage({ cmd: 'grace' });
      this.worker = null;
      this.ready = false;
    }
  }
}

// Singleton engine instance
let engineInstance: PdfTeXEngine | null = null;

export async function getEngine(): Promise<PdfTeXEngine> {
  if (!engineInstance) {
    engineInstance = new PdfTeXEngine();
    await engineInstance.loadEngine();
  }
  return engineInstance;
}

/**
 * Compile a set of LaTeX project files to PDF.
 *
 * @param files - Map of filename → content (string for .tex/.sty, Uint8Array for binary)
 * @param mainFile - The main .tex file to compile (default: 'cv-llt.tex')
 * @returns CompileResult with pdf bytes and log
 */
export async function compileProject(
  files: Record<string, string | Uint8Array>,
  mainFile = 'cv-llt.tex'
): Promise<CompileResult> {
  const engine = await getEngine();

  // Write all files to the in-memory filesystem
  for (const [name, content] of Object.entries(files)) {
    engine.writeFile(name, content);
  }

  engine.setMainFile(mainFile);
  return engine.compile();
}
