#! /usr/bin/env node
import fs from "fs";
import compressing from "compressing";
import { program } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import { NodeSSH } from "node-ssh";
import shell from "shelljs";

import { packagesConf, pathConf, getBuildConf, serviceConf } from "./conf.js";
const ssh = new NodeSSH();

const init = () => {
  console.log(
    chalk.green(
      figlet.textSync("Node JS CLI", {
        font: "Ghost",
        horizontalLayout: "default",
        verticalLayout: "default",
      })
    )
  );
};

program
  .command("deploy")
  .alias("d")
  .description("创建新的模块")
  .option("-n, --name [moduleName]", "模块名称")
  .action(async (option) => {
    init();
    console.log("开始进行部署操作。。。", option.name);

    const { packages } = await inquirer.prompt(packagesConf);

    const { localpath, buildDir } = pathConf[packages];
    const fullptah = localpath + buildDir;
    let exists = fs.existsSync(fullptah);
    console.log(packages, "packages", localpath, exists);

    const { build } = await inquirer.prompt(getBuildConf(exists));

    if (build) {
      console.log(chalk.bgBlueBright("开始进行打包..."));
      await compile(localpath);

      exists = fs.existsSync(fullptah);
    }
    if (!exists)
      return console.log(chalk.greenBright("✈ 放弃打包，退出当前命令。。。"));
    console.log("☀ 开始进行压缩...", fullptah);

    const zipFile = buildDir + ".zip";
    await compressing.zip
      .compressDir(fullptah, zipFile)
      .catch((err) => console.log("err: ", err));
    console.log(chalk.greenBright(buildDir + " 文件压缩完成..."));
    await connectService(serviceConf);
    await updateFile("", serviceConf.dir);
  });

program.parse(process.argv);

/**
 * 连接服务器
 */
async function connectService(config) {
  const { host, username, password, dir } = config;
  console.log("尝试连接服务：" + chalk.red(host));
  const spinner = ora("正在连接");
  spinner.start();
  await ssh.connect({
    host,
    username,
    password,
  });
  spinner.stop();
  console.log(chalk.green("成功连接到服务器"));

  // 备份
  // zip -q -r ./dist_back/dist_.zip ./dist
  const exec = await ssh.execCommand(
    `zip -q -r ./dist_back/dist${new Date().toJSON()}.zip ./dist`,
    {
      cwd: dir,
    }
  );
  console.log(exec, "exec", dir);
}

/**
 * 上传文件
 */
async function updateFile(localpath, remotepath, file = "dist.zip") {
  // 存储失败序列
  let failed = [];
  // 存储成功序列
  let successful = [];
  const spinner = ora("准备上传文件").start();
  const put = await ssh
    .putFile(localpath + file, remotepath + file)
    .catch(function (error) {
      console.log("Something's wrong");
      console.log(error);
      return "error";
    });
  spinner.stop();
  if (put === "error") {
    ssh.dispose();
    return;
  }
  console.log("The File thing is done");
  if (failed.length > 0) {
    console.log(`一共有${chalk.red(failed.length)}个上传失败的文件`);
    console.log(failed);
  }
  const unzipExec = await ssh.execCommand("unzip -o -d ./ dist.zip", {
    cwd: remotepath,
  });

  console.log(unzipExec, "unzipExec");
  const rmExec = await ssh.execCommand("rm -f dist.zip", {
    cwd: remotepath,
  });

  console.log(rmExec, "rmExec");
  ssh.dispose();
}

/**
 * 打包编译
 * */
async function compile(localPath, type = "BUILD") {
  console.log(localPath, "localPath");
  // 进入项目本地目录
  shell.cd(localPath);
  if (type === "TEST") {
    console.log("测试环境编译");
    shell.exec(`pnpm run test`);
  } else {
    console.log(chalk.blueBright("正式环境编译"));
    shell.exec(`pnpm run build`);
  }
  console.log(chalk.green("编译完成"));
}
