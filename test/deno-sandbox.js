
import { readLines } from "https://deno.land/std@0.93.0/io/mod.ts";

export class DenoSandbox {

  constructor(quiet, cwd, env) {
    this.quiet = quiet;    
    this.env = env;
    this.cwd = cwd;
    
    //this.init()
  }

  init = async () => {
    const cmd = Deno.run({cmd: ["deno", "--version"]});
    await cmd.status()
    this.cmd = cmd;
  }

  start = () => {
    //console.log(this.cwd)
    //console.log(this.env)
    this.cmd = Deno.run({
      cwd: this.cwd,
      env: this.env,
      cmd: ["arc", "sandbox"], 
      stdout: "piped",
      stderr: "piped"
    });

    return this.cmd
  }

  stop = () => {
    if(typeof this.cmd !== 'undefined')
    this.cmd.close()
  }

}


export async function read(stdout) {
  
  for await (const line of readLines(stdout)) {
    return line;
  }
}