"use strict";

var _require = require("child_process"),
    spawn = _require.spawn;

var ls = spawn("ls", ["-la"]);

ls.stdout.on("data", function (data) {
    console.log("stdout, " + data);
});

// ls.stderr.on("data", data => {
//     console.log(`stderr: ${data}`);
// });

// ls.on('error', (error) => {
//     console.log(`error: ${error.message}`);
// });

// ls.on("close", code => {
//     console.log(`child process exited with code ${code}`);