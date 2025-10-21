#!/usr/bin/env node

import { Project } from "ts-morph";
import fs from "node:fs";
import path from "node:path";

// Try to load module.config from cwd supporting .ts and .js
function loadConfig(): {
    moduleName: string;
    androidPackageName: string;
    srcFile: string;
} {
    const cwd = process.cwd();
    const tsPath = path.join(cwd, "module.config.ts");
    const jsPath = path.join(cwd, "module.config.js");

    if (fs.existsSync(tsPath)) {
        const content = fs.readFileSync(tsPath, "utf8");
        const match = content.match(/moduleName:\s*"([^"]+)"/);
        const pkg = {
            moduleName: match ? match[1] : undefined,
            androidPackageName: (content.match(/androidPackageName:\s*"([^"]+)"/) ||
                [])[1],
            srcFile:
                (content.match(/srcFile:\s*"([^"]+)"/) || [])[1] || "./src/module.ts",
        } as any;
        if (!pkg.moduleName)
            throw new Error(
                "Could not parse module.config.ts; please ensure it exports config with moduleName"
            );
        return pkg;
    }

    if (fs.existsSync(jsPath)) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        // @ts-ignore
        const cfg = require(jsPath);
        return cfg.config || cfg.default || cfg;
    }

    throw new Error(
        "module.config.ts or module.config.js not found in current working directory"
    );
}

export function generateGlobalDts(outputPath: string = "./global.d.ts"): void {
    const config = loadConfig();

    // --- Load TS source ---
    const project = new Project();
    const srcPath = path.resolve(config.srcFile);
    const sourceFile = project.addSourceFileAtPath(srcPath);

    const interfaceDecl = sourceFile
        .getInterfaces()
        .find((i) =>
            i.getExtends().some((e) => e.getText() === "TigerModule")
        );

    if (!interfaceDecl) {
        console.warn("No interface extending TigerModule found, skipping global.d.ts generation");
        return;
    }

    const methods = interfaceDecl.getMethods().map((m) => {
        const name = m.getName();
        const params = m.getParameters().map((p) => {
            const paramName = p.getName();
            const isOptional = p.isOptional();
            const typeNode = p.getTypeNode();
            const typeText = typeNode ? typeNode.getText() : p.getType().getText();
            return { paramName, isOptional, typeText };
        });
        const returnType = m.getReturnType().getText() || "void";
        return { name, params, returnType };
    });

    // --- Generate d.ts ---
    const dtsContent = `\n/// <reference types="@lynx-js/types" />\ndeclare global {\n  interface NativeModules {\n    ${interfaceDecl.getName()}: {\n${methods
        .map((m) => {
            const params = m.params
                .map(
                    (p: any) => `${p.paramName}${p.isOptional ? "?" : ""}: ${p.typeText}`
                )
                .join(", ");
            return `      ${m.name}(${params}): ${m.returnType};`;
        })
        .join("\n")}\n    };\n  }\n}\nexport {};\n`;

    fs.writeFileSync(outputPath, dtsContent);
    console.log(`✅ Generated global.d.ts at ${outputPath}`);
}

// If run directly from node
if (process.argv[1] && process.argv[1].endsWith("generate-types.ts")) {
    generateGlobalDts();
}