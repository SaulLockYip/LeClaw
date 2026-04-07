import { createApp } from "./app.js";

const PORT = parseInt(process.env.PORT ?? "4396", 10);
const HOST = process.env.HOST ?? "0.0.0.0";

const app = createApp();

app.listen(PORT, HOST, () => {
  console.log(
    JSON.stringify({
      success: true,
      server: { port: PORT, host: HOST },
    })
  );
});
