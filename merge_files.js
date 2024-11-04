const fs = require("fs");
const files = fs.readdirSync("../code");
let result = "";
files.forEach((file) => {
  if (file !== "merge_files.js") {
    const data = fs.readFileSync(file, { encoding: "utf-8" });
    result += "\n" + file + "\n" + data;
  }
});

fs.writeFileSync("result.txt", result, { encoding: "utf-8" });
