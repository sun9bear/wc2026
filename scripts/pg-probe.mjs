/**
 * 诊断探针：经 SOCKS5 代理向目标发 Postgres SSLRequest，报告回复（S/N=可达，closed/timeout=被断/黑洞）。
 * 用法：node scripts/pg-probe.mjs <socksPort> <destHost> <destPort> [socksHost=127.0.0.1]
 */
import net from "node:net";

const [socksPortArg, destHost, destPortArg, socksHost = "127.0.0.1"] = process.argv.slice(2);
const socksPort = Number(socksPortArg);
const destPort = Number(destPortArg);
const tag = `socks:${socksPort} → ${destHost}:${destPort}`;

const s = net.connect(socksPort, socksHost);
const hostBuf = Buffer.from(destHost, "ascii");
let stage = 0;
let buf = Buffer.alloc(0);

s.on("connect", () => s.write(Buffer.from([0x05, 0x01, 0x00])));
s.on("data", (d) => {
  buf = Buffer.concat([buf, d]);
  if (stage === 0) {
    if (buf.length < 2) return;
    if (buf[0] !== 5 || buf[1] !== 0) {
      console.log(`[${tag}] 方法协商被拒: ${buf.toString("hex")}`);
      process.exit(1);
    }
    buf = buf.subarray(2);
    s.write(
      Buffer.concat([
        Buffer.from([0x05, 0x01, 0x00, 0x03, hostBuf.length]),
        hostBuf,
        Buffer.from([(destPort >> 8) & 0xff, destPort & 0xff]),
      ]),
    );
    stage = 1;
    return;
  }
  if (stage === 1) {
    if (buf.length < 5) return;
    if (buf[1] !== 0) {
      console.log(`[${tag}] CONNECT 被拒 REP=${buf[1]}`);
      process.exit(1);
    }
    const atyp = buf[3];
    const alen = atyp === 1 ? 4 : atyp === 4 ? 16 : 1 + buf[4];
    const total = 4 + alen + 2;
    if (buf.length < total) return;
    buf = buf.subarray(total);
    console.log(`[${tag}] CONNECT ok，发送 SSLRequest`);
    s.write(Buffer.from([0, 0, 0, 8, 4, 0xd2, 0x16, 0x2f]));
    stage = 2;
    if (buf.length === 0) return;
  }
  if (stage === 2 && buf.length > 0) {
    console.log(`[${tag}] PG 回复: hex=${buf.toString("hex")} ascii=${JSON.stringify(buf.toString())}`);
    process.exit(0);
  }
});
s.on("close", () => {
  console.log(`[${tag}] 连接关闭于 stage=${stage}`);
  process.exit(3);
});
s.on("error", (e) => console.log(`[${tag}] 错误: ${e.message}`));
setTimeout(() => {
  console.log(`[${tag}] 超时于 stage=${stage}`);
  process.exit(2);
}, 20000);
