import { resolve } from 'path';
import fse from 'fs-extra';
import chalk from 'chalk';
import fetch from 'node-fetch';
import machineID from '../../../../utils/machine-id';

const readPackageJSON = async (path: string) => {
  try {
    const packageObj = await fse.readJson(path);
    const uuid = packageObj.strapi ? packageObj.strapi.uuid : null;

    return { uuid, packageObj };
  } catch (err) {
    if (err instanceof Error) {
      console.error(`${chalk.red('Error')}: ${err.message}`);
    }
  }
};

const writePackageJSON = async (path: string, file: object, spacing: number) => {
  try {
    await fse.writeJson(path, file, { spaces: spacing });
    return true;
  } catch (err) {
    if (err instanceof Error) {
      console.error(`${chalk.red('Error')}: ${err.message}`);
    }
  }
};

const sendEvent = async (uuid: string) => {
  try {
    const event = 'didOptOutTelemetry';

    await fetch('https://analytics.strapi.io/api/v2/track', {
      method: 'POST',
      body: JSON.stringify({
        event,
        deviceId: machineID(),
        groupProperties: { projectId: uuid },
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Strapi-Event': event,
      },
    });
  } catch (e) {
    // ...
  }
};

export default async function optOutTelemetry() {
  const packageJSONPath = resolve(process.cwd(), 'package.json');
  const exists = await fse.pathExists(packageJSONPath);

  if (!exists) {
    console.log(`${chalk.yellow('Warning')}: could not find package.json`);
    process.exit(0);
  }

  const { uuid, packageObj } = (await readPackageJSON(packageJSONPath)) ?? {};

  if ((packageObj.strapi && packageObj.strapi.telemetryDisabled) || !uuid) {
    console.log(`${chalk.yellow('Warning:')} telemetry is already disabled`);
    process.exit(0);
  }

  const updatedPackageJSON = {
    ...packageObj,
    strapi: {
      ...packageObj.strapi,
      telemetryDisabled: true,
    },
  };

  const write = await writePackageJSON(packageJSONPath, updatedPackageJSON, 2);

  if (!write) {
    console.log(
      `${chalk.yellow(
        'Warning'
      )}: There has been an error, please set "telemetryDisabled": true in the "strapi" object of your package.json manually.`
    );
    process.exit(0);
  }

  await sendEvent(uuid);
  console.log(`${chalk.green('Successfully opted out of Strapi telemetry')}`);
  process.exit(0);
}
