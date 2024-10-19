import workerpool, { Pool } from 'workerpool';
import { WorkerUrl } from 'worker-url';
import { RunDodInterface, RunDodResponse } from './func';
// import { BuildCommitTxOptions, BuildCommitTxResult, BuildRevealTxOptions, BuildRevealTxResult } from './index';

// const WorkerURL = new WorkerUrl(new URL('./worker.ts', import.meta.url)).toString();

// import WorkerURL from './worker';

export function newPool(parallel: number) {
  return workerpool.pool(__dirname + '/worker.js', {
    maxWorkers: parallel,
    workerOpts: {
      // By default, Vite uses a module worker in dev mode, which can cause your application to fail. Therefore, we need to use a module worker in dev mode and a classic worker in prod mode.
      type: 'module',
    },
  });
}

export function runDodTasks(pool: Pool, options: RunDodInterface): Promise<RunDodResponse> {
  let resolved = false;
  return new Promise<RunDodResponse>(resolve => {
    const threads = pool.maxWorkers!;
    for (let i = 0; i < threads; i++) {
      pool
        .exec('runDod', [{ ...options, threadId: i }])
        .then((res: RunDodResponse) => {
          if (res && !resolved) {
            resolved = true;
            resolve(res);
            return pool.terminate(true);
          }
        })
        .catch(err => {
          if (err.toString().includes('terminated')) {
            throw err;
          }
        });
    }
  });
}
