import fs from "node:fs";
import { platform } from "node:process";

const COMMON_GIT_BIN = "git";
// on Git for Windows, invoking this directly is faster than simple `git` command
// see https://github.com/git-for-windows/git/wiki/Git-wrapper#avoiding-the-git-wrapper
const WIN_GIT_EXE = "C:/Program Files/Git/mingw64/bin/git.exe";

export const GIT_BIN =
  platform === "win32" && fs.existsSync(WIN_GIT_EXE)
    ? WIN_GIT_EXE
    : COMMON_GIT_BIN;
