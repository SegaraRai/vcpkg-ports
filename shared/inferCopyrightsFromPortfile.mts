import { parseCMake } from "./cmakeParser.mjs";
import { toUniqueArray } from "./utils.mjs";

function filenameToURL(filename: string): string {
  return normalizeFilename(filename)
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

interface SourceProvider {
  varName: string | undefined;
  getURL?: ((filename: string) => string | undefined) | undefined;
}

const SOURCE_PROVIDERS = {
  vcpkg_from_bitbucket: (
    args: readonly string[],
    expandVars: (text: string) => string
  ): SourceProvider => {
    const repo = expandVars(getArg(args, "REPO") ?? "");
    const ref = expandVars(getArg(args, "REF") ?? "");
    return {
      varName: expandVars(getArg(args, "OUT_SOURCE_PATH") ?? "") || undefined,
      getURL: (filename: string): string | undefined =>
        repo && ref
          ? `https://bitbucket.org/${repo}/src/${ref}/${filenameToURL(
              filename
            )}`
          : undefined,
    };
  },
  vcpkg_from_github: (
    args: readonly string[],
    expandVars: (text: string) => string
  ): SourceProvider => {
    const url =
      expandVars(getArg(args, "GITHUB_HOST") ?? "") || "https://github.com";
    const repo = expandVars(getArg(args, "REPO") ?? "");
    const ref = expandVars(getArg(args, "REF") ?? "");
    return {
      varName: expandVars(getArg(args, "OUT_SOURCE_PATH") ?? "") || undefined,
      getURL: (filename: string): string | undefined =>
        repo && ref
          ? `${url}/${repo}/blob/${ref}/${filenameToURL(filename)}`
          : undefined,
    };
  },
  vcpkg_from_gitlab: (
    args: readonly string[],
    expandVars: (text: string) => string
  ): SourceProvider => {
    const url =
      expandVars(getArg(args, "GITLAB_URL") ?? "") || "https://gitlab.com";
    const repo = expandVars(getArg(args, "REPO") ?? "");
    const ref = expandVars(getArg(args, "REF") ?? "");
    return {
      varName: expandVars(getArg(args, "OUT_SOURCE_PATH") ?? "") || undefined,
      getURL: (filename: string): string | undefined =>
        repo && ref
          ? `${url}/${repo}/-/blob/${ref}/${filenameToURL(filename)}`
          : undefined,
    };
  },
  //
  vcpkg_from_git: (
    args: readonly string[],
    expandVars: (text: string) => string
  ): SourceProvider => {
    // there are no generic way to get the file URL from a git repo
    return {
      varName: expandVars(getArg(args, "OUT_SOURCE_PATH") ?? "") || undefined,
    };
  },
  vcpkg_from_sourceforge: (
    args: readonly string[],
    expandVars: (text: string) => string
  ): SourceProvider => {
    // this points to an archive so we cannot get file URL
    return {
      varName: expandVars(getArg(args, "OUT_SOURCE_PATH") ?? "") || undefined,
    };
  },
  vcpkg_extract_source_archive: (
    args: readonly string[],
    expandVars: (text: string) => string
  ): SourceProvider => {
    return {
      varName: expandVars(args[0] ?? "") || undefined,
    };
  },
  vcpkg_extract_source_archive_ex: (
    args: readonly string[],
    expandVars: (text: string) => string
  ): SourceProvider => {
    // this points to an archive so we cannot get file URL
    return {
      varName: expandVars(getArg(args, "OUT_SOURCE_PATH") ?? "") || undefined,
    };
  },
} as const;

function getArg(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

function getArgs(
  args: readonly string[],
  name: string,
  stop: string[] = []
): readonly string[] {
  const index = args.indexOf(name);
  if (index === -1) {
    return [];
  }
  const stopIndex = args.findIndex((arg) => stop.includes(arg));
  return args.slice(index + 1, stopIndex !== -1 ? stopIndex : undefined);
}

/*
idioms:
- file(INSTALL ${SOURCE_PATH}/LICENSE DESTINATION ${CURRENT_PACKAGES_DIR}/share/3fd RENAME copyright)
- vcpkg_install_copyright(FILE_LIST "${SOURCE_PATH}/LICENSE")
- configure_file("${SOURCE_PATH}/COPYING" "${CURRENT_PACKAGES_DIR}/share/${PORT}/copyright" COPYONLY)
- vcpkg_download_distfile(LICENSE ...)
  file(INSTALL ${LICENSE} DESTINATION ${CURRENT_PACKAGES_DIR}/share/${PORT} RENAME copyright)
- file(APPEND "${SOURCE_PATH}/copyright" ...)
- file(WRITE ${CURRENT_PACKAGES_DIR}/share/${PORT}/copyright "See https://developer.microsoft.com/windows/downloads/windows-10-sdk for the Windows 10 SDK license")
- file(COPY ${SOURCE_PATH}/doc/license.txt DESTINATION ${CURRENT_PACKAGES_DIR}/share/decimal-for-cpp)
  file(RENAME ${CURRENT_PACKAGES_DIR}/share/decimal-for-cpp/license.txt ${CURRENT_PACKAGES_DIR}/share/decimal-for-cpp/copyright)
*/

function normalizeFilename(filename: string): string {
  return filename
    .replaceAll("\\", "/")
    .replaceAll("/./", "/")
    .replace(/\/{2,}/g, "/");
}

function createURLRef(url: string): string {
  return `\0URL:${url}\0`;
}

export function inferCopyrightsFromPortfile(
  portName: string,
  portVersion: string,
  portfile: string
): string[] {
  const contextVars = new Map<string, string>([
    ["PORT", portName],
    ["VERSION", portVersion],
    ["VCPKG_ROOT_DIR", "/virtual/vcpkg_root_dir"],
    ["CURRENT_BUILDTREES_DIR", "/virtual/current_buildtrees_dir"],
    ["CURRENT_PACKAGES_DIR", "/virtual/current_packages_dir"],
    ["CURRENT_PORT_DIR", "/virtual/current_port_dir"],
    ["CURRENT_HOST_INSTALLED_DIR", "/virtual/current_host_installed_dir"],
    ["CURRENT_INSTALLED_DIR", "/virtual/current_installed_dir"],
    ["CMAKE_CURRENT_LIST_DIR", "/virtual/cmake_current_list_dir"],
    ["PATH", ""],
    ["TARGET_TRIPLET", "x64-windows"],
    ["TRIPLET_SYSTEM_ARCH", "x64"],
    ["VCPKG_C_FLAGS", ""],
    ["VCPKG_C_FLAGS_DEBUG", ""],
    ["VCPKG_C_FLAGS_RELEASE", ""],
    ["VCPKG_CXX_FLAGS", ""],
    ["VCPKG_CXX_FLAGS_DEBUG", ""],
    ["VCPKG_CXX_FLAGS_RELEASE", ""],
    ["VCPKG_LINKER_FLAGS", ""],
    ["VCPKG_LINKER_FLAGS_DEBUG", ""],
    ["VCPKG_LINKER_FLAGS_RELEASE", ""],
    ["VCPKG_COMBINED_C_FLAGS_DEBUG", ""],
    ["VCPKG_COMBINED_C_FLAGS_RELEASE", ""],
    ["VCPKG_COMBINED_CXX_FLAGS_DEBUG", ""],
    ["VCPKG_COMBINED_CXX_FLAGS_RELEASE", ""],
    ["VCPKG_COMBINED_SHARED_LINKER_FLAGS_DEBUG", ""],
    ["VCPKG_COMBINED_SHARED_LINKER_FLAGS_RELEASE", ""],
    ["VCPKG_COMBINED_STATIC_LINKER_FLAGS_DEBUG", ""],
    ["VCPKG_COMBINED_STATIC_LINKER_FLAGS_RELEASE", ""],
    ["VCPKG_TARGET_ARCHITECTURE", "x64"],
    ["VCPKG_HOST_EXECUTABLE_SUFFIX", ""],
    ["VCPKG_TARGET_EXECUTABLE_SUFFIX", ""],
    ["VCPKG_TARGET_IMPORT_LIBRARY_PREFIX", ""],
    ["VCPKG_TARGET_IMPORT_LIBRARY_SUFFIX", ""],
    ["VCPKG_TARGET_SHARED_LIBRARY_PREFIX", ""],
    ["VCPKG_TARGET_SHARED_LIBRARY_SUFFIX", ""],
    ["VCPKG_TARGET_STATIC_LIBRARY_PREFIX", ""],
    ["VCPKG_TARGET_STATIC_LIBRARY_SUFFIX", ""],
    ["VCPKG_HEAD_VERSION", ""],
    ["VCPKG_DETECTED_CMAKE_C_COMPILER", ""],
    ["VCPKG_PLATFORM_TOOLSET", ""],
    ["VCPKG_OSX_DEPLOYMENT_TARGET", ""],
    ["VCPKG_HOST_PATH_SEPARATOR", ";"],
  ]);
  const contextFiles = new Map<string, string>();
  const contextSourceProviders = new Map<string, SourceProvider>();
  let sourcePathCount = 0;

  const parsed = parseCMake(portfile);
  if (!parsed) {
    return [];
  }

  // this does not support nested variables and generator expressions
  const expandVarsNoThrow = (str: string): string =>
    str.replace(
      /\${([^}]+)}/g,
      (all, name: string): string => contextVars.get(name) ?? all
    );

  const expandVars = (str: string): string => {
    const expanded = expandVarsNoThrow(str);
    if (/\$[{<]/.test(expanded)) {
      // console.warn(`Unresolved variable in '${str}' (expanded: '${expanded}')`);
      throw new Error(`Unresolved variable in '${str}'`);
    }
    return expanded;
  };

  const allocateSourcePath = (): string =>
    `/virtual/source_path_${++sourcePathCount}`;

  const getURLFromFilename = (filename: string): string | undefined => {
    filename = normalizeFilename(filename);
    const match = filename.match(/^(\/virtual\/source_path_\d+)\/(.+)$/);
    const provider = match && contextSourceProviders.get(match[1]);
    const url = provider && provider.getURL?.(match[2]);
    return url || undefined;
  };

  const ensureFilePlaceholder = (filename: string, noURL = false): void => {
    filename = normalizeFilename(filename);
    if (!contextFiles.has(filename)) {
      const url = noURL ? undefined : getURLFromFilename(filename);
      contextFiles.set(filename, url ? createURLRef(url) : "");
    }
  };

  const readContextFile = (filename: string): string => {
    const content = contextFiles.get(filename);
    if (!content) {
      //console.warn(`File not found: ${filename}`);
      return "";
    }
    return content;
  };

  for (const command of parsed) {
    try {
      switch (command.cmd) {
        case "set":
          if (command.args.length === 2) {
            contextVars.set(command.args[0], expandVars(command.args[1]));
          }
          break;

        case "file": {
          const [action, rawFile, ...args] = command.args;
          const file = normalizeFilename(expandVars(rawFile));
          if (file.endsWith("/")) {
            break;
          }

          // for daw-json-link, which creates `copyright` file in `SOURCE_PATH`
          ensureFilePlaceholder(file, file.endsWith("/copyright"));

          switch (action) {
            case "READ":
              contextVars.set(expandVars(args[0]), readContextFile(file));
              break;

            case "DOWNLOAD": {
              const url = expandVars(getArg(args, "URL") ?? "");
              if (url) {
                contextFiles.set(file, createURLRef(url));
              }
              break;
            }

            case "WRITE":
              contextFiles.set(file, expandVars(args[0] ?? ""));
              break;

            case "APPEND":
              contextFiles.set(
                file,
                readContextFile(file) + expandVars(args[0])
              );
              break;

            case "RENAME": {
              const dest = normalizeFilename(expandVars(args[0] ?? ""));
              if (dest) {
                contextFiles.set(dest, readContextFile(file));
                contextFiles.delete(file);
              }
              break;
            }

            case "COPY":
            case "INSTALL": {
              const destDir = normalizeFilename(
                expandVars(getArg(args, "DESTINATION") ?? "")
              );
              const rename = normalizeFilename(
                expandVars(getArg(args, "RENAME") ?? "")
              );
              const destFile =
                file && destDir
                  ? normalizeFilename(
                      `${destDir}/${rename || (file.match(/[^/]+$/)?.[0] ?? "")}`
                    )
                  : null;
              if (destFile) {
                contextFiles.set(destFile, readContextFile(file));
              }
            }
          }
          break;
        }

        case "configure_file": {
          const src = normalizeFilename(expandVars(command.args[0] ?? ""));
          const dest = normalizeFilename(expandVars(command.args[1] ?? ""));
          if (src && dest) {
            ensureFilePlaceholder(src);
            contextFiles.set(dest, readContextFile(src));
          }
          break;
        }

        case "vcpkg_install_copyright": {
          let content = expandVars(getArg(command.args, "COMMENT") ?? "");
          for (const rawFilename of getArgs(command.args, "FILE_LIST", [
            "COMMENT",
          ])) {
            if (content) {
              content += "\n";
            }
            const filename = normalizeFilename(expandVars(rawFilename));
            ensureFilePlaceholder(filename);
            content += readContextFile(filename);
          }
          contextFiles.set(
            `/virtual/current_packages_dir/share/${portName}/copyright`,
            content
          );
          break;
        }

        case "vcpkg_download_distfile": {
          const varName = expandVars(command.args[0]);
          // though URLS can be a list, we only use the first one
          const url = expandVars(getArg(command.args, "URLS") ?? "");
          const filename = `${allocateSourcePath()}/${normalizeFilename(
            expandVars(getArg(command.args, "FILENAME") ?? "archive")
          )}`;
          if (varName && url && filename) {
            contextVars.set(varName, filename);
            contextFiles.set(filename, createURLRef(url));
          }
          break;
        }

        case "vcpkg_from_bitbucket":
        case "vcpkg_from_github":
        case "vcpkg_from_git":
        case "vcpkg_from_gitlab":
        case "vcpkg_from_sourceforge":
        case "vcpkg_extract_source_archive":
        case "vcpkg_extract_source_archive_ex": {
          const provider = SOURCE_PROVIDERS[command.cmd];
          const sourceProvider = provider(command.args, expandVars);
          if (!sourceProvider.varName) {
            break;
          }
          const sourcePath = allocateSourcePath();
          contextVars.set(sourceProvider.varName, sourcePath);
          contextSourceProviders.set(sourcePath, sourceProvider);
          break;
        }
      }
    } catch {
      // noop
    }
  }

  const copyrightFiles = Array.from(contextFiles.keys())
    .sort()
    .filter((filename) => filename.endsWith("/copyright"));

  const urls: string[] = [];
  for (const filename of copyrightFiles) {
    const content = contextFiles.get(filename) ?? "";
    if (!content) {
      continue;
    }

    const matches = content.matchAll(/\0URL:([^\0]+)\0/g);
    for (const match of matches) {
      urls.push(match[1]);
    }
  }

  return toUniqueArray(urls);
}
