const a = "Inside test.mjs";

export default eval.bind(null, "console.log(global);");