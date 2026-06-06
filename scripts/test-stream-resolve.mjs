import { Innertube, ClientType } from "youtubei.js";

const videoId = process.argv[2] ?? "X7L4wvljHhM";

const clients = ["TV_EMBEDDED", "IOS", "ANDROID", "WEB"];

for (const client of clients) {
  try {
    const yt = await Innertube.create({
      client_type: ClientType[client] ?? client,
      generate_session_locally: true,
      retrieve_player: true,
    });

    const info = await yt.getBasicInfo(videoId);
    const format = info.chooseFormat({
      type: "audio",
      quality: "best",
      client,
    });

    if (!format) {
      console.log(client, "-> no format");
      continue;
    }

    const url = await format.decipher(yt.session.player);
    const href = typeof url === "string" ? url : url?.toString?.() ?? String(url);
    console.log(client, "-> OK", href.slice(0, 120));
  } catch (error) {
    console.log(client, "-> FAIL", error?.message ?? error);
  }
}
