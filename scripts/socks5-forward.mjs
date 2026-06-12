/**
 * 无依赖 SOCKS5 本地端口转发：listen 127.0.0.1:<listenPort> → SOCKS5 代理 → <destHost>:<destPort>。
 * 域名由 SOCKS 远端解析（ATYP=domain），可绕过本机 IPv6/DNS 干扰。
 * 用法：node scripts/socks5-forward.mjs <listenPort> <destHost> <destPort> [socksHost=127.0.0.1] [socksPort=10808]
 */
import net from "node:net";

const [listenPortArg, destHost, destPortArg, socksHost = "127.0.0.1", socksPortArg = "10808"] =
  process.argv.slice(2);

if (!listenPortArg || !destHost || !destPortArg) {
  console.error("用法: node socks5-forward.mjs <listenPort> <destHost> <destPort> [socksHost] [socksPort]");
  process.exit(1);
}
const listenPort = Number(listenPortArg);
const destPort = Number(destPortArg);
const socksPort = Number(socksPortArg);

const server = net.createServer((client) => {
  const peer = `${client.remoteAddress}:${client.remotePort}`;
  const socks = net.connect(socksPort, socksHost);
  let buf = Buffer.alloc(0);
  let stage = 0; // 0=等方法协商回复 1=等 CONNECT 回复 2=已建立

  const abort = (why) => {
    if (stage !== 2) console.error(`[${peer}] 隧道建立失败: ${why}`);
    client.destroy();
    socks.destroy();
  };

  socks.on("connect", () => {
    console.error(`[${peer}] 已连上 SOCKS ${socksHost}:${socksPort}，发送方法协商`);
    socks.write(Buffer.from([0x05, 0x01, 0x00])); // VER=5, 1 method, NO-AUTH
  });

  socks.on("data", (d) => {
    if (stage !== 2) console.error(`[${peer}] stage=${stage} 收到 ${d.length}B: ${d.toString("hex").slice(0, 60)}`);
    buf = Buffer.concat([buf, d]);
    if (stage === 0) {
      if (buf.length < 2) return;
      if (buf[0] !== 0x05 || buf[1] !== 0x00) return abort(`方法协商被拒 ${buf[0]},${buf[1]}`);
      buf = buf.subarray(2);
      const host = Buffer.from(destHost, "ascii");
      socks.write(
        Buffer.concat([
          Buffer.from([0x05, 0x01, 0x00, 0x03, host.length]),
          host,
          Buffer.from([(destPort >> 8) & 0xff, destPort & 0xff]),
        ]),
      );
      stage = 1;
    }
    if (stage === 1) {
      if (buf.length < 5) return;
      if (buf[1] !== 0x00) return abort(`CONNECT 被拒 REP=${buf[1]}`);
      const atyp = buf[3];
      const addrLen = atyp === 0x01 ? 4 : atyp === 0x04 ? 16 : atyp === 0x03 ? 1 + buf[4] : -1;
      if (addrLen < 0) return abort(`未知 ATYP=${atyp}`);
      const total = 4 + addrLen + 2;
      if (buf.length < total) return;
      const rest = buf.subarray(total);
      stage = 2;
      socks.removeAllListeners("data");
      if (rest.length) client.write(rest);
      client.pipe(socks);
      socks.pipe(client);
      console.error(`[${peer}] 隧道已建立 → ${destHost}:${destPort}`);
    }
  });

  socks.on("error", (e) => abort(`SOCKS 连接错误: ${e.message}`));
  client.on("error", () => socks.destroy());
  client.on("close", () => socks.destroy());
  socks.on("close", () => client.destroy());
});

server.listen(listenPort, "127.0.0.1", () => {
  console.error(
    `SOCKS5 转发已启动: 127.0.0.1:${listenPort} → socks5h://${socksHost}:${socksPort} → ${destHost}:${destPort}`,
  );
});
server.on("error", (e) => {
  console.error(`监听失败: ${e.message}`);
  process.exit(1);
});
