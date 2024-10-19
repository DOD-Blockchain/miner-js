// /* eslint-disable prefer-const */
// import { bitwork_match_hash, CommitResolver } from '@/ui/miner/dmt';
// import * as secp from '@noble/secp256k1';
// import { reverseBuffer } from 'bitcoinjs-lib/src/bufferutils';
// import * as bitcoin from 'bitcoinjs-lib';

// import { toHexString } from '@dfinity/candid';

// import { Bitwork } from '@/idls/dod';
import workerpool from 'workerpool';
import { runDod } from './func';

// create a worker and register public functions
workerpool.worker({
  runDod,
});
