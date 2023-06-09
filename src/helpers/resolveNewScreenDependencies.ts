import fs from "fs-extra";
import chalk from "chalk";
import { spinner } from "../index";
import {
  Dropdown,
  InputNumber,
  InputSwitch,
  InputText,
  InputTextarea,
  RadioButtonField,
} from "../templateStrings/formFields";
import { TextColumn } from "src/templateStrings/mainFileColumns";
import addInitialState from "./addInitialState";
import { KitConfig } from "src/schemas";

export default async function resolveNewScreenDependencies(
  capitalizedScreenName: string,
  screen: KitConfig["screens"][number]
) {
  let screenTypeInterface = "";
  let initialState = "";
  const requiredFields: string[] = [];
  const jsxFields: string[] = [];
  const tableColumns: string[] = [];
  const dropdownOptions: { fieldName: string; options: any[] }[] = [];

  const neverRequiredInputTypes = ["InputSwitch"];

  screen.crudFields.forEach((field, index) => {
    let interfacePropertyType = "";
    let initialValue = "";

    if (field.required && !neverRequiredInputTypes.includes(field.type)) requiredFields.push(field.name);

    switch (field.type) {
      case "InputText":
        if (field.tableDisplay) tableColumns.push(TextColumn(field.name));
        jsxFields.push(InputText(field.name, field.required));
        interfacePropertyType = "string";
        initialValue = `""`;
        break;

      case "InputTextarea":
        if (field.tableDisplay) tableColumns.push(TextColumn(field.name));
        jsxFields.push(InputTextarea(field.name, field.required));
        interfacePropertyType = "string";
        initialValue = `""`;
        break;

      case "InputNumber":
        if (field.tableDisplay) tableColumns.push(TextColumn(field.name));
        jsxFields.push(InputNumber(field.name, field.required));
        interfacePropertyType = "number";
        initialValue = `0`;
        break;

      case "Dropdown":
        if (field.tableDisplay) tableColumns.push(TextColumn(field.name));
        jsxFields.push(Dropdown(field.name, field.required));
        dropdownOptions.push({ fieldName: field.name, options: field.options || [] });
        interfacePropertyType = "string";
        initialValue = `""`;
        break;

      case "RadioButton":
        if (field.tableDisplay) tableColumns.push(TextColumn(field.name));
        jsxFields.push(RadioButtonField(field.name, field.options || [], field.required));
        interfacePropertyType = "string";
        initialValue = `""`;
        break;

      case "InputSwitch":
        if (field.tableDisplay) tableColumns.push(TextColumn(field.name));
        jsxFields.push(InputSwitch(field.name));
        interfacePropertyType = "boolean";
        initialValue = `false`;
        break;
    }

    if (index === 0) {
      screenTypeInterface += `  id?: string;\n`;
      initialState += `  id: "",\n`;
    }
    screenTypeInterface += `  ${field.name}: ${interfacePropertyType};\n`;
    initialState += `  ${field.name}: ${initialValue},\n`;
    if (index === screen.crudFields.length - 1) {
      screenTypeInterface += "}\n";
      initialState += "};\n";
    }
  });

  const adminKitPath = "./.adminkit";
  const folderPath = `./src/screens/${capitalizedScreenName}`;
  const mainFilePath = `${folderPath}/${capitalizedScreenName}.tsx`;
  const createFilePath = `${folderPath}/Create${capitalizedScreenName}.tsx`;
  const editFilePath = `${folderPath}/Edit${capitalizedScreenName}.tsx`;
  const appMenuItemsFilePath = `./src/layout/items.json`;

  const mainScreenTemplateFile = fs.readFileSync(`${adminKitPath}/XXXXX.tsx`).toString();
  const createScreenTemplateFile = fs.readFileSync(`${adminKitPath}/CreateXXXXX.tsx`).toString();
  const editScreenTemplateFile = fs.readFileSync(`${adminKitPath}/EditXXXXX.tsx`).toString();

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

  const newMainScreenTemplateFile = addInitialState(mainScreenTemplateFileLines, initialState);
  fs.writeFileSync(mainFilePath, newMainScreenTemplateFile);

  const parsedCreateScreenTemplateFile = createScreenTemplateFile
    .replace(/XXXXX/g, capitalizedScreenName)
    .replace(/xxxxx/g, capitalizedScreenName.toLowerCase())
    .replace(/INPUT\-FIELDS/g, jsxFields.join("\n"))
    .replace(
      /if \(entity.name.trim\(\)\) \{/,
      `if (${requiredFields.map((name) => `entity.${name}`).join(" && ")}) {`
    );
  const newCreateScreenTemplateFile = addInitialState(
    parsedCreateScreenTemplateFile.split("\n"),
    initialState
  );
  const finalCreateScreenTemplateFileLines: string[] = [];
  newCreateScreenTemplateFile.split("\n").forEach((line) => {
    if (line.includes("const saveEntity = async () => {")) {
      dropdownOptions.forEach(({ fieldName, options }) => {
        finalCreateScreenTemplateFileLines.push(
          `const ${fieldName}Options = ${JSON.stringify(options, null, 2)};\n`
        );
      });
    }

    finalCreateScreenTemplateFileLines.push(line);
  });
  fs.writeFileSync(createFilePath, finalCreateScreenTemplateFileLines.join("\n"));

  const parsedEditScreenTemplateFile = editScreenTemplateFile
    .replace(/XXXXX/g, capitalizedScreenName)
    .replace(/xxxxx/g, capitalizedScreenName.toLowerCase())
    .replace(/INPUT\-FIELDS/g, jsxFields.join("\n"))
    .replace(
      /if \(entity.name.trim\(\)\) \{/,
      `if (${requiredFields.map((name) => `entity.${name}`).join(" && ")}) {`
    );
  const newEditScreenTemplateFile = addInitialState(parsedEditScreenTemplateFile.split("\n"), initialState);
  const finalEditScreenTemplateFileLines: string[] = [];
  newEditScreenTemplateFile.split("\n").forEach((line) => {
    if (line.includes("const saveEntity = async () => {")) {
      dropdownOptions.forEach(({ fieldName, options }) => {
        finalEditScreenTemplateFileLines.push(
          `const ${fieldName}Options = ${JSON.stringify(options, null, 2)};\n`
        );
      });
    }

    finalEditScreenTemplateFileLines.push(line);
  });
  fs.writeFileSync(editFilePath, finalEditScreenTemplateFileLines.join("\n"));

  const appMenuItemsFile = fs.readFileSync(appMenuItemsFilePath);
  const appMenuItems = JSON.parse(appMenuItemsFile.toString());
  appMenuItems[0].items.push({ label: capitalizedScreenName, to: `/${capitalizedScreenName.toLowerCase()}` });
  fs.writeFileSync(appMenuItemsFilePath, JSON.stringify(appMenuItems, null, 2));

  spinner.start(`Creating service/${capitalizedScreenName}Service.ts`);

  const serviceTemplateFile = fs.readFileSync(`${adminKitPath}/XXXXXService.ts`).toString();

  const parsedServiceTemplateFile = serviceTemplateFile
    .replace(/XXXXX/g, capitalizedScreenName)
    .replace(/xxxxx/g, capitalizedScreenName.toLowerCase());

  fs.writeFileSync(`./src/service/${capitalizedScreenName}Service.ts`, parsedServiceTemplateFile);
  spinner.succeed(`Created ${chalk.cyan(`service/${capitalizedScreenName}Service.ts`)}`);

  spinner.start(`Creating types/${capitalizedScreenName.toLowerCase()}.d.ts`);
  fs.createFile(`./src/types/${capitalizedScreenName.toLowerCase()}.d.ts`);

  const typesTemplateFile = fs.readFileSync(`${adminKitPath}/xxxxx.d.ts`).toString();

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
