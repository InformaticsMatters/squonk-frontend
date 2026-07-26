import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const generatorDir = resolve(rootDir, "tools/client-generator");
const configPath = resolve(rootDir, "tools/openapi-clients.json");
const buildRoot = resolve(rootDir, ".client-build");

const run = (command, args, options) => {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false, ...options });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
};

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

const writeJson = async (path, value) => {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
};

const stripPeerDevDependencies = (packageJson) => {
  const devDependencies = { ...(packageJson.devDependencies ?? {}) };

  for (const peerDependency of Object.keys(packageJson.peerDependencies ?? {})) {
    delete devDependencies[peerDependency];
  }

  return {
    ...packageJson,
    devDependencies,
  };
};

const shouldCopyGeneratorFile = (source) => {
  const rel = relative(generatorDir, source);

  if (!rel) {
    return true;
  }

  const parts = rel.split(sep);
  const firstPart = parts[0];

  if ([".git", "node_modules", "dist"].includes(firstPart)) {
    return false;
  }

  if (rel === `src${sep}api` || rel.startsWith(`src${sep}api${sep}`)) {
    return false;
  }

  return !["openapi.yaml", "openapi.yml", "openapi.json", ".DS_Store"].includes(rel);
};

const configurePackage = async (buildDir, client) => {
  const packagePath = resolve(buildDir, "package.json");
  const packageJson = await readJson(packagePath);

  packageJson.name = client.packageName;
  packageJson.version = client.version;
  packageJson.author = client.author;
  packageJson.description = client.description;
  packageJson.repository = { type: "git", url: client.repository };

  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    ...(client.devDependencies ?? {}),
  };

  await writeJson(packagePath, packageJson);
};

const generateClient = async (name, client) => {
  const openapiPath = resolve(rootDir, client.openapi);
  const outputDir = resolve(rootDir, client.output);
  const buildDir = resolve(buildRoot, name);

  if (!existsSync(openapiPath)) {
    throw new Error(`OpenAPI input not found for ${name}: ${relative(rootDir, openapiPath)}`);
  }

  await rm(buildDir, { recursive: true, force: true });
  await mkdir(buildDir, { recursive: true });
  await cp(generatorDir, buildDir, {
    recursive: true,
    filter: shouldCopyGeneratorFile,
  });

  await configurePackage(buildDir, client);

  run("pnpm", ["install", "--no-frozen-lockfile"], { cwd: buildDir });
  run("pnpm", ["orval"], {
    cwd: buildDir,
    env: { ...process.env, OPENAPI_INPUT: openapiPath },
  });
  run("pnpm", ["build"], { cwd: buildDir });

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  await writeJson(
    resolve(outputDir, "package.json"),
    stripPeerDevDependencies(await readJson(resolve(buildDir, "package.json"))),
  );
  await cp(resolve(buildDir, "src"), resolve(outputDir, "src"), { recursive: true });
  await cp(resolve(buildDir, "dist"), resolve(outputDir, "dist"), { recursive: true });

  console.log(`Generated ${client.packageName} in ${relative(rootDir, outputDir)}`);
};

const config = await readJson(configPath);
const requested = process.argv.slice(2);
const clientNames = requested.length === 0 || requested.includes("all") ? Object.keys(config) : requested;

for (const clientName of clientNames) {
  const client = config[clientName];

  if (!client) {
    throw new Error(`Unknown OpenAPI client '${clientName}'. Known clients: ${Object.keys(config).join(", ")}`);
  }

  await generateClient(clientName, client);
}
