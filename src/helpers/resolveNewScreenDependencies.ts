import fs from "fs-extra";
import chalk from "chalk";
import { spinner } from "../index";
import { config } from "./config";
import { InputNumber, InputText, InputTextarea } from "../templateStrings/formFields";
import { TextColumn } from "src/templateStrings/mainFileColumns";

export default async function resolveNewScreenDependencies(capitalizedScreenName: string) {
  let screenTypeInterface = "";
  const jsxFields: string[] = [];
  const tableColumns: string[] = [];

  const screen = config?.screens?.find(
    (screen) => screen.name.toLowerCase() === capitalizedScreenName.toLowerCase()
  );
  if (screen) {
    screen.crudFields.forEach((field, index) => {
      let interfacePropertyType = "";

      switch (field.type) {
        case "InputText":
          jsxFields.push(InputText(field.name));
          tableColumns.push(TextColumn(field.name));
          interfacePropertyType = "string";
          break;

        case "InputTextarea":
          jsxFields.push(InputTextarea(field.name));
          tableColumns.push(TextColumn(field.name));
          interfacePropertyType = "string";
          break;

        case "InputNumber":
          jsxFields.push(InputNumber(field.name));
          tableColumns.push(TextColumn(field.name));
          interfacePropertyType = "number";
          break;
      }

      if (index === 0) screenTypeInterface += `  id?: string;\n`;
      screenTypeInterface += `  ${field.name}: ${interfacePropertyType};\n`;
      if (index === screen.crudFields.length - 1) screenTypeInterface += "}\n";
    });
  }

  const folderPath = `./src/screens/${capitalizedScreenName}`;
  const mainFilePath = `${folderPath}/${capitalizedScreenName}.tsx`;
  const createFilePath = `${folderPath}/Create${capitalizedScreenName}.tsx`;
  const editFilePath = `${folderPath}/Edit${capitalizedScreenName}.tsx`;

  const mainScreenTemplateFile = await fetch(
    "https://raw.githubusercontent.com/kuvamdazeus/admin-starter-react/main/src/screens/XXXXX/XXXXX.tsx"
  ).then((res) => res.text());
  const createScreenTemplateFile = await fetch(
    "https://raw.githubusercontent.com/kuvamdazeus/admin-starter-react/main/src/screens/XXXXX/CreateXXXXX.tsx"
  ).then((res) => res.text());
  const editScreenTemplateFile = await fetch(
    "https://raw.githubusercontent.com/kuvamdazeus/admin-starter-react/main/src/screens/XXXXX/EditXXXXX.tsx"
  ).then((res) => res.text());

  const parsedMainScreenTemplateFile = mainScreenTemplateFile
    .replace(/XXXXX/g, capitalizedScreenName)
    .replace(/xxxxx/g, capitalizedScreenName.toLowerCase());

  let mainScreenTemplateFileLines: string[] = [];
  parsedMainScreenTemplateFile.split("\n").forEach((line) => {
    if (line.includes(`<Column body={actionBodyTemplate} headerStyle={{ minWidth: "10rem" }}></Column>`)) {
      mainScreenTemplateFileLines.push(...tableColumns);
    }
    mainScreenTemplateFileLines.push(line);
  });

  fs.writeFileSync(mainFilePath, mainScreenTemplateFileLines.join("\n"));

  const parsedCreateScreenTemplateFile = createScreenTemplateFile
    .replace(/XXXXX/g, capitalizedScreenName)
    .replace(/xxxxx/g, capitalizedScreenName.toLowerCase())
    .replace(/INPUT\-FIELDS/g, jsxFields.join("\n"));
  fs.writeFileSync(createFilePath, parsedCreateScreenTemplateFile);

  const parsedEditScreenTemplateFile = editScreenTemplateFile
    .replace(/XXXXX/g, capitalizedScreenName)
    .replace(/xxxxx/g, capitalizedScreenName.toLowerCase())
    .replace(/INPUT\-FIELDS/g, jsxFields.join("\n"));
  fs.writeFileSync(editFilePath, parsedEditScreenTemplateFile);

  spinner.start(`Creating service/${capitalizedScreenName}Service.tsx`);
  fs.createFile(`./src/service/${capitalizedScreenName}Service.tsx`);

  const serviceTemplateFile = await fetch(
    "https://raw.githubusercontent.com/kuvamdazeus/admin-starter-react/main/src/service/XXXXXService.tsx"
  ).then((res) => res.text());

  const parsedServiceTemplateFile = serviceTemplateFile
    .replace(/XXXXX/g, capitalizedScreenName)
    .replace(/xxxxx/g, capitalizedScreenName.toLowerCase());

  fs.writeFileSync(`./src/service/${capitalizedScreenName}Service.tsx`, parsedServiceTemplateFile);
  spinner.succeed(`Created ${chalk.cyan(`service/${capitalizedScreenName}Service.tsx`)}`);

  spinner.start(`Creating types/${capitalizedScreenName.toLowerCase()}.d.ts`);
  fs.createFile(`./src/types/${capitalizedScreenName.toLowerCase()}.d.ts`);

  const typesTemplateFile = await fetch(
    "https://raw.githubusercontent.com/kuvamdazeus/admin-starter-react/main/src/types/xxxxx.d.ts"
  ).then((res) => res.text());

  const parsedTypesTemplateFile =
    typesTemplateFile.replace(/XXXXX/g, capitalizedScreenName).split("\n")[0] + "\n" + screenTypeInterface;

  fs.writeFileSync(`./src/types/${capitalizedScreenName.toLowerCase()}.d.ts`, parsedTypesTemplateFile);
  spinner.succeed(`Created ${chalk.cyan(`types/${capitalizedScreenName}.d.ts`)}`);

  spinner.start(`Creating route for ${capitalizedScreenName}`);
  const mainTsx = fs.readFileSync("./src/main.tsx").toString();
  const mainTsxLines = mainTsx.split("\n");

  const newRoutes = [
    `      <Route path="${capitalizedScreenName.toLowerCase()}" element={<${capitalizedScreenName}Page />} />`,
    `      <Route path="${capitalizedScreenName.toLowerCase()}/create" element={<Create${capitalizedScreenName}Page />} />`,
    `      <Route path="${capitalizedScreenName.toLowerCase()}/edit/:id" element={<Edit${capitalizedScreenName}Page />} />`,
  ];

  const newImports = [
    `import ${capitalizedScreenName}Page from "./screens/${capitalizedScreenName}/${capitalizedScreenName}"`,
    `import Edit${capitalizedScreenName}Page from "./screens/${capitalizedScreenName}/Edit${capitalizedScreenName}"`,
    `import Create${capitalizedScreenName}Page from "./screens/${capitalizedScreenName}/Create${capitalizedScreenName}"`,
  ];

  const newMainTsxLines: string[] = [];

  newMainTsxLines.push(...newImports);

  mainTsxLines.forEach((line) => {
    if (line.includes("</Route>")) {
      newRoutes.forEach((newRoute) => {
        newMainTsxLines.push(newRoute);
      });
    }

    newMainTsxLines.push(line);
  });

  fs.writeFileSync("./src/main.tsx", newMainTsxLines.join("\n"));
  spinner.succeed(`Created route: ${chalk.cyan(`/${capitalizedScreenName.toLowerCase()}`)}`);
}
