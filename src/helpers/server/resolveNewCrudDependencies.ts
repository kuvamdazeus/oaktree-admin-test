import fs from "fs-extra";
import { adminKitPath } from "src";
import { KitConfig } from "src/schemas";

export default async function resolveNewCrudDependencies(
  capitalizedScreenName: string,
  screen: KitConfig["screens"][number]
) {
  const folderPath = `./src/Microservices/${capitalizedScreenName}`;

  const adminKitControllerFileContent = fs
    .readFileSync(`${adminKitPath}/server/XXXXXController.ts`)
    .toString()
    .replace(/XXXXX/g, capitalizedScreenName)
    .replace(/xxxxx/g, capitalizedScreenName.toLowerCase());

  const adminKitRouterFileContent = fs
    .readFileSync(`${adminKitPath}/server/XXXXXRouter.ts`)
    .toString()
    .replace(/XXXXX/g, capitalizedScreenName)
    .replace(/xxxxx/g, capitalizedScreenName.toLowerCase());

  const adminKitDtoFileContent = fs
    .readFileSync(`${adminKitPath}/server/XXXXX.dto.ts`)
    .toString()
    .replace(/XXXXX/g, capitalizedScreenName)
    .replace(/xxxxx/g, capitalizedScreenName.toLowerCase());

  const adminKitEntityFileContent = fs
    .readFileSync(`${adminKitPath}/server/XXXXXEntity.ts`)
    .toString()
    .replace(/XXXXX/g, capitalizedScreenName)
    .replace(/xxxxx/g, capitalizedScreenName.toLowerCase());

  const controllerFilePath = `${folderPath}/${capitalizedScreenName}Controller.ts`;
  const routerFilePath = `${folderPath}/${capitalizedScreenName}Router.ts`;
  const dtoFilePath = `${folderPath}/${capitalizedScreenName}.dto.ts`;
  const entityFilePath = `./src/Database/Entities/${capitalizedScreenName}Entity.ts`;

  fs.writeFileSync(controllerFilePath, adminKitControllerFileContent);
  fs.writeFileSync(routerFilePath, adminKitRouterFileContent);
  fs.writeFileSync(dtoFilePath, adminKitDtoFileContent);
  fs.writeFileSync(entityFilePath, adminKitEntityFileContent);

  const collectionNamesFile = fs
    .readFileSync("./src/Database/CollectionNames.ts")
    .toString()
    .split("\n")
    .map((line) => {
      if (line.includes("export const ")) {
        return line + "\n" + `${capitalizedScreenName}Collection: "${screen.collectionName}",`;
      }

      return line;
    })
    .join("\n");

  fs.writeFileSync("./src/Database/CollectionNames.ts", collectionNamesFile);

  const apiRouterFile = fs
    .readFileSync("./src/Microservices/ApiRouter.ts")
    .toString()
    .split("\n")
    .map((line) => {
      if (line.includes("const ApiRouter =")) {
        return (
          line +
          "\n" +
          `ApiRouter.use("/${capitalizedScreenName.toLowerCase()}", ${capitalizedScreenName}Router);`
        );
      }

      if (line.includes('import * as express from "express";')) {
        return (
          line +
          "\n" +
          `import { ${capitalizedScreenName}Router } from "./${capitalizedScreenName}/${capitalizedScreenName}Router";`
        );
      }

      return line;
    })
    .join("\n");

  fs.writeFileSync("./src/Microservices/ApiRouter.ts", apiRouterFile);
}