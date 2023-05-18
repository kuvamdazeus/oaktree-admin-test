import simpleGit from "simple-git";
import fs from "fs-extra";
import fetch from "node-fetch";
import { adminKitPath, spinner } from "src/index";
import performCleanupWebapp from "src/helpers/webapp/performCleanupWebapp";
import { config } from "src/config";
import { runInFolderSync } from "src/helpers/folders";
import performCleanupServer from "src/helpers/server/performCleanupServer";

export default async function scaffold(argProjectName: string) {
  const projectName = argProjectName.toLowerCase();

  spinner.start("Scaffolding project...");

  fs.ensureDirSync(projectName);
  process.chdir(projectName);

  const [, , kitConfigFile, nodeStarterKitEnv] = await Promise.all([
    simpleGit().clone("https://github.com/kuvamdazeus/admin-starter-react", "webapp"),
    simpleGit().clone("https://github.com/kuvamdazeus/node-starter-kit", "server"),
    fetch(
      "https://gist.githubusercontent.com/kuvamdazeus/89117514d4ef61f9a09e1cd9bf0cba4f/raw/f1b60f6fc25cb111424f824bc455358abbfacc38/kit.config.json"
    ).then((res) => res.text()),
    fetch(
      "https://gist.githubusercontent.com/kuvamdazeus/08e407c3188c08c0d29012f85dd3c9d9/raw/f4d6b2e429063bf454e5d2d805f3a7806b56d491/node-starter-kit-env.txt"
    ).then((res) => res.text()),
  ]);

  fs.writeFileSync("./kit.config.json", kitConfigFile);

  fs.ensureDirSync(`${adminKitPath}`);
  fs.ensureDirSync(`${adminKitPath}/webapp`);
  fs.ensureDirSync(`${adminKitPath}/server`);

  runInFolderSync("webapp", () => {
    fs.copyFileSync(`./src/screens/XXXXX/XXXXX.tsx`, `${adminKitPath}/webapp/XXXXX.tsx`);
    fs.copyFileSync(`./src/screens/XXXXX/CreateXXXXX.tsx`, `${adminKitPath}/webapp/CreateXXXXX.tsx`);
    fs.copyFileSync(`./src/screens/XXXXX/EditXXXXX.tsx`, `${adminKitPath}/webapp/EditXXXXX.tsx`);
    fs.copyFileSync(`./src/types/xxxxx.d.ts`, `${adminKitPath}/webapp/xxxxx.d.ts`);
    fs.writeFileSync("./.env", `VITE_BASE_URL = "${config()?.backendUrl}"`);
    performCleanupWebapp();
  });

  runInFolderSync("server", () => {
    fs.copyFileSync(`./src/Microservices/XXXXX/XXXXXRouter.ts`, `${adminKitPath}/server/XXXXXRouter.ts`);
    fs.copyFileSync(
      `./src/Microservices/XXXXX/XXXXXController.ts`,
      `${adminKitPath}/server/XXXXXController.ts`
    );
    fs.copyFileSync(`./src/Microservices/XXXXX/XXXXX.dto.ts`, `${adminKitPath}/server/XXXXX.dto.ts`);
    fs.copyFileSync(`./src/Database/Entities/XXXXXEntity.ts`, `${adminKitPath}/server/XXXXXEntity.ts`);

    fs.writeFileSync("./.env", nodeStarterKitEnv);
    performCleanupServer();
  });

  spinner.succeed(`Created "${projectName}" successfully!`);
}
