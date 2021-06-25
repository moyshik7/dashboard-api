const spawn = require("child_process").spawn;

const app = spawn("node", ["."]);

console.log(`Spawned child process with pid: ${app.pid}\n\n`);

app.stdout.on("data", (data) => {
    let str = data.toString();
    let lines = str.split(/(\r?\n)/g);
    console.log(lines.join(""));
});

app.on("close", (code) => {
    console.log(`Process exited with code: ${code}`);
});
