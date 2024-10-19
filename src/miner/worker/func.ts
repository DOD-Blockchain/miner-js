import * as wasm from 'dod_runner_wasm';
import * as cbor from 'borc';
import { CborPayload, resolver_v3 } from '../dmt';

const { dod_runner } = wasm;
// import * as ecc from 'tiny-secp256k1';

// bitcoin.initEccLib(ecc);

// const interval = () => {
//   timer = setInterval(() => {
//     count++;
//     const now2 = performance.now();
//     postMessage(count);
//     console.log('误差值：', now2 - now1 - 1000 * count);
//   }, 1000);
// };

// onmessage = function (event) {
//   // const { data } = event;
//   // if (data === 'start') {
//   //   interval();
//   // }
//   // if (data === 'stop') {
//   //   clearInterval(timer);
//   //   this.postMessage('ended');
//   // }
//   // console.log(event.data);
//   console.log({ event: event.data });

//   const {
//     data: { s, remote_hash, bitwork },
//   } = event as {
//     data: { s: CommitResolver; remote_hash: string; bitwork: Bitwork };
//   };
//   let isMined = false;
//   let hex2;
//   let hashes = BigInt(0);
//   // while (!isMined) {
//   //   // hex = secp.etc.randomBytes(8);

//   //   // // const hex = randomBytes(16);
//   //   // let b = Buffer.from(s.tx.buffer, 'hex');
//   //   // b.set(hex, s.tx.opReturn.start + s.tx.opReturn.start_offset);
//   //   // hex2 = reverseBuffer(bitcoin.crypto.hash256(b)).toString('hex');
//   //   // this.postMessage({ miningHash: hex2 });
//   //   // // setMiningHash(hex2);
//   //   // if (bitwork_match_hash(hex2, remote_hash!, bitwork!, false)) {
//   //   //   console.log('found and wait');
//   //   //   console.log({ hex2, remote_hash });
//   //   //   isMined = true;
//   //   //   // setButtonState('waitSign');
//   //   // }

//   // }

//   let actualPre = remote_hash.substring(0, Number.parseInt(bitwork.pre.toString()));
//   console.log(s.tx.buffer);
//   console.log(s.tx.opReturn.start + s.tx.opReturn.start_offset);
//   console.log(actualPre);

//   try {
//     hashes = dod_mine(
//       0,
//       0,
//       hashes,
//       Buffer.from(s.tx.buffer, 'hex'),
//       s.tx.opReturn.start + s.tx.opReturn.start_offset,
//       actualPre,
//       bitwork.post_hex,
//     );
//     if (hashes > 0n) {
//       console.log('hashes');
//       // isMined = true;
//     }
//     console.log({ hashes });
//   } catch (e) {
//     console.log(e);
//     // hashes += BigInt(1);
//     // continue;
//   }

//   let hex;

//   hex = hashes > 0n ? bn_to_u8_8_buffer(hashes).toString('hex') : undefined;
//   console.log({ hex });

//   // this.postMessage({ miningHash: hex2, isMined: isMined, hex });
// };

export function bn_to_u8_8_buffer(bn: bigint) {
  // bigint to buffer with fix length 8
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(bn);
  return b;
}

export interface RunDodInterface {
  opType: 'init' | 'mint' | 'tele' | 'burn' | 'call' | 'send' | 'dele' | 'stak' | 'mine';
  keypair: { childNodeXOnlyPubkey: string };
  totalFee: number;
  fundingUtxo: {
    txid: string;
    value: number;
    vout: number;
  };
  network: string;
  serviceOutput?: {
    script: string;
    value: number;
  };
  test_return_hex?: string;
  remote_hash: string;
  bitwork: { pre: string; post_hex: string };
  threadId?: number;
}

export interface RunDodResponse {
  hex: string;
  minePayload: string;
}

export function runDod(params: RunDodInterface): RunDodResponse {
  const nonce = params.threadId || 0;
  const time = Date.now();

  const payload = {
    t: 'DMT',
    dmt: {
      nonce,
      time,
    },
  };

  const minePayload = cbor.encode(payload) as unknown as Buffer;

  const cb = CborPayload.fromCbor(minePayload);

  const { opType, keypair, totalFee, fundingUtxo, network, serviceOutput } = params as RunDodInterface;

  const resolver = resolver_v3(
    opType,
    { childNodeXOnlyPubkey: Buffer.from(keypair.childNodeXOnlyPubkey, 'hex') },
    cb,
    totalFee,
    fundingUtxo,
    network,
    undefined, //{ script: Buffer.from(serviceOutput!.script, 'hex'), value: serviceOutput!.value },
  );

  const { remote_hash, bitwork } = params;

  const actualPre = remote_hash.substring(0, Number.parseInt(bitwork.pre.toString()));

  let mined = false;
  let hashes = BigInt(1);
  while (mined == false) {
    try {
      const result = dod_runner(
        0,
        0,
        hashes,
        Buffer.from(resolver.tx.buffer, 'hex'),
        resolver.tx.opReturn.start + resolver.tx.opReturn.start_offset,
        actualPre,
        bitwork.post_hex,
      );
      if (result) {
        hashes = result;
        mined = true;
      }
    } catch (e) {
      console.log(`error ${(e as Error).message}`);
      hashes += BigInt(1);
      continue;
    }
  }
  return { hex: bn_to_u8_8_buffer(hashes).toString('hex'), minePayload: minePayload.toString('hex') };
  // return { rnd: bn_to_u8_8_buffer(hashes).toString('hex'), nonce, time };
}
